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
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        post:posts(
          *,
          user:users(id, name, image),
          postLikes(*),
          comments(count)
        )
      `)
      .eq('userId', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return { success: false, msg: error.message };
    
    // 转换数据结构，使其与 posts 接口返回的一致
    const posts = data.map(item => {
      const post = item.post;
      return post;
    });
    
    return { success: true, data: posts };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}; 