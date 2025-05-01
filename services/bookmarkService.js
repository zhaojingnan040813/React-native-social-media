import { supabase } from "../lib/supabase";

// 添加收藏
export const addBookmark = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ userId, postId })
      .select();
    
    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// 取消收藏
export const removeBookmark = async (userId, postId) => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .match({ userId, postId });
    
    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// 检查帖子是否已被收藏
export const isPostBookmarked = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select()
      .eq('userId', userId)
      .eq('postId', postId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
      return { success: false, msg: error.message };
    }
    
    return { success: true, bookmarked: !!data };
  } catch (error) {
    return { success: false, msg: error.message };
  }
};

// 获取用户收藏的帖子列表
export const getUserBookmarks = async (userId, limit = 20) => {
  try {
    // console.log('获取用户收藏，用户ID:', userId);
    
    // 第一步：获取用户的收藏记录
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('postId')
      .eq('userId', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (bookmarksError) {
      console.error('获取收藏列表错误:', bookmarksError);
      return { success: false, msg: bookmarksError.message };
    }
    
    if (!bookmarks || bookmarks.length === 0) {
      // console.log('用户没有收藏记录');
      return { success: true, data: [] };
    }
    
    // 提取所有收藏的帖子ID
    const postIds = bookmarks.map(bookmark => bookmark.postId);
    // console.log('收藏的帖子ID:', postIds);
    
    try {
      // 第二步：获取这些帖子的详细信息
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          body,
          file,
          created_at,
          userId,
          tags
        `)
        .in('id', postIds);
      
      if (postsError) {
        console.error('获取帖子详情错误:', postsError);
        return { success: false, msg: postsError.message };
      }
      
      if (!posts || posts.length === 0) {
        // console.log('没有找到帖子数据');
        return { success: true, data: [] };
      }
      
      // 第三步：获取每个帖子的点赞信息
      const { data: postLikes, error: likesError } = await supabase
        .from('postLikes')
        .select('*')
        .in('postId', postIds);
      
      if (likesError) {
        console.error('获取点赞信息错误:', likesError);
        // 不返回错误，继续处理
      }
      
      // 第四步：分别获取每个帖子的评论数量（不使用group_by）
      let commentsCountMap = {};
      
      // 为每个帖子初始化评论计数为0
      postIds.forEach(postId => {
        commentsCountMap[postId] = 0;
      });
      
      // 获取所有评论
      const { data: allComments, error: commentsError } = await supabase
        .from('comments')
        .select('postId')
        .in('postId', postIds);
      
      if (commentsError) {
        console.error('获取评论错误:', commentsError);
      } else if (allComments && allComments.length > 0) {
        // 手动计算每个帖子的评论数
        allComments.forEach(comment => {
          if (commentsCountMap[comment.postId] !== undefined) {
            commentsCountMap[comment.postId]++;
          }
        });
      }
      
      // 获取所有有效的相关用户ID (过滤掉null和undefined)
      const validUserIds = posts
        .map(post => post.userId)
        .filter(userId => userId !== null && userId !== undefined);
      
      // console.log('有效的用户ID:', validUserIds);
      
      // 只有在有有效用户ID时才获取用户信息
      let users = [];
      if (validUserIds.length > 0) {
        // 第五步：获取用户信息
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, image')
          .in('id', validUserIds);
        
        if (usersError) {
          console.error('获取用户信息错误:', usersError);
          // 不返回错误，继续处理
        } else {
          users = usersData || [];
        }
      }
      
      // 整合所有数据
      const enrichedPosts = posts.map(post => {
        // 查找对应的用户 (可能不存在)
        const user = post.userId ? (users.find(u => u.id === post.userId) || null) : null;
        
        // 创建默认用户对象，如果用户信息缺失
        const postUser = user || {
          id: post.userId || 'unknown',
          name: '未知用户',
          image: null
        };
        
        // 查找该帖子的所有点赞
        const likes = postLikes?.filter(like => like.postId === post.id) || [];
        
        // 获取帖子的评论数
        const commentCount = commentsCountMap[post.id] || 0;
        
        return {
          ...post,
          user: postUser,
          postLikes: likes,
          comments: [{ count: commentCount }]
        };
      });
      
      // console.log('处理后的帖子数据条数:', enrichedPosts.length);
      
      return { success: true, data: enrichedPosts };
    } catch (queryError) {
      console.error('查询数据时出错:', queryError);
      return { success: false, msg: queryError.message };
    }
  } catch (error) {
    console.error('获取收藏帖子异常:', error);
    return { success: false, msg: error.message };
  }
}; 