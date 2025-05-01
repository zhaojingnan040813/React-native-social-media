import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";





// 创建或更新帖子
export const createOrUpdatePost = async (post)=>{
    try{
        // create or update
        if(post.file && typeof post.file == 'object'){
            let isImage = post?.file?.type=='image';
            let folderName = isImage? 'postImages': 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if(fileResult.success) post.file = fileResult.data;
            else {
                return fileResult;
            }
        }
        
        // 确保tags是JSON格式
        if (post.tags && Array.isArray(post.tags)) {
            // 如果tags是数组，将其限制为最多6个标签
            post.tags = post.tags.slice(0, 6);
        }
        
        const { data, error } = await supabase
        .from('posts')
        .upsert(post)
        .select()
        .single();

        if(error){
            console.log('createPost error: ', error);
            return {success: false, msg: "Could not create your post"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('createPost error: ', error);
        return {success: false, msg: "Could not create your post"};
    }
}

//查询帖子列表，可能带有分页和用户过滤 (select，带有 .limit(), .eq() 等修饰符)。
export const fetchPosts = async (limit=10, userId=null, tagFilter=null)=>{
    try{
        // 1. 首先获取帖子数据
        let postsQuery = supabase
            .from('posts')
            .select('*')
            .order('created_at', {ascending: false });
        
        // 如果提供了用户ID，则筛选特定用户的帖子
        if(userId){
            postsQuery = postsQuery.eq('"userId"', userId);
        }
        
        // 如果提供了标签过滤，则筛选包含该标签的帖子
        if(tagFilter){
            postsQuery = postsQuery.contains('tags', [tagFilter]);
        }
        
        // 应用分页限制
        postsQuery = postsQuery.limit(limit);
        
        const { data: posts, error: postsError } = await postsQuery;
        
        if(postsError){
            console.log('fetchPosts error: ', postsError);
            return {success: false, msg: "Could not fetch the posts"};
        }
        
        if(!posts || posts.length === 0) {
            return {success: true, data: []};
        }
        
        // 2. 获取相关用户信息
        const userIds = [...new Set(posts.filter(post => post.userId).map(post => post.userId))];
        
        let users = [];
        if(userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, name, image')
                .in('id', userIds);
            
            if(usersError){
                console.log('fetchUsers error: ', usersError);
            } else {
                users = usersData || [];
            }
        }
        
        // 3. 获取帖子点赞信息
        const postIds = posts.map(post => post.id);
        const { data: allPostLikes, error: likesError } = await supabase
            .from('postLikes')
            .select('*')
            .in('"postId"', postIds);
        
        if(likesError){
            console.log('fetchLikes error: ', likesError);
        }
        
        // 4. 获取每个帖子的评论数量 - 使用正确的分组语法
        let commentsCount = [];
        try {
            // 使用两个单独的查询来替代分组查询
            const { data: comments, error: commentsError } = await supabase
                .from('comments')
                .select('*')
                .in('"postId"', postIds);
                
            if(commentsError) {
                console.log('fetchComments error: ', commentsError);
            } else if(comments) {
                // 手动计算每个帖子的评论数
                const countMap = {};
                comments.forEach(comment => {
                    const postId = comment.postId;
                    countMap[postId] = (countMap[postId] || 0) + 1;
                });
                
                commentsCount = Object.entries(countMap).map(([postId, count]) => ({
                    postId,
                    count
                }));
            }
        } catch(err) {
            console.log('Error counting comments:', err);
        }
        
        // 5. 将所有数据手动关联
        const enrichedPosts = posts.map(post => {
            // 关联用户信息
            const user = users.find(u => u.id === post.userId) || null;
            
            // 关联点赞信息
            const postLikes = allPostLikes?.filter(like => like.postId === post.id) || [];
            
            // 关联评论数量
            const commentData = commentsCount.find(c => c.postId === post.id);
            const comments = commentData ? { count: parseInt(commentData.count) } : { count: 0 };
            
            // 处理标签数据，确保它是数组
            let tags = [];
            if (post.tags) {
                if (typeof post.tags === 'string') {
                    try {
                        tags = JSON.parse(post.tags);
                    } catch (e) {
                        console.log('Error parsing tags:', e);
                    }
                } else if (Array.isArray(post.tags)) {
                    tags = post.tags;
                }
            }
            
            return {
                ...post,
                user,
                postLikes,
                comments,
                tags
            };
        });
        
        return { success: true, data: enrichedPosts };

    }catch(error){
        console.log('fetchPosts error: ', error);
        return {success: false, msg: "Could not fetch the posts"};
    }
}

//查询帖子详情，包括帖子内容、用户信息、点赞信息和评论信息。
export const fetchPostDetails = async (postId)=>{
    try{
        // 1. 获取帖子信息
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();
        
        if(postError){
            console.log('postDetails error: ', postError);
            return {success: false, msg: "Could not fetch the post"};
        }
        
        // 2. 获取用户信息
        let user = null;
        if(post.userId) {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, image')
                .eq('id', post.userId)
                .single();
            
            if(userError){
                console.log('fetchUser error: ', userError);
            } else {
                user = userData;
            }
        }
        
        // 3. 获取帖子点赞
        const { data: postLikes, error: likesError } = await supabase
            .from('postLikes')
            .select('*')
            .eq('"postId"', postId);
        
        if(likesError){
            console.log('fetchLikes error: ', likesError);
        }
        
        // 4. 获取帖子评论
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select('*')
            .eq('"postId"', postId)
            .order('created_at', { ascending: false });
        
        if(commentsError){
            console.log('fetchComments error: ', commentsError);
        }
        
        // 5. 如果有评论，获取评论用户信息
        let commentsWithUser = [];
        if(comments && comments.length > 0){
            // 筛选出非空的用户ID
            const commentUserIds = [...new Set(comments.filter(comment => comment.userId).map(comment => comment.userId))];
            
            let commentUsers = [];
            if(commentUserIds.length > 0) {
                const { data: usersData, error: commentUsersError } = await supabase
                    .from('users')
                    .select('id, name, image')
                    .in('id', commentUserIds);
                
                if(commentUsersError){
                    console.log('fetchCommentUsers error: ', commentUsersError);
                } else {
                    commentUsers = usersData || [];
                }
            }
            
            // 将用户信息关联到评论
            commentsWithUser = comments.map(comment => {
                const commentUser = comment.userId ? commentUsers.find(u => u.id === comment.userId) : null;
                return {
                    ...comment,
                    user: commentUser
                };
            });
        }
        
        // 6. 构建完整的帖子详情对象
        const postDetails = {
            ...post,
            user,
            postLikes: postLikes || [],
            comments: commentsWithUser
        };
        
        return {success: true, data: postDetails};

    }catch(error){
        console.log('postDetails error: ', error);
        return {success: false, msg: "Could not fetch the post"};
    }
}

// 创建帖子点赞
export const createPostLike = async (postLike)=>{
    try{
        
        const { data, error } = await supabase
        .from('postLikes')
        .insert(postLike)
        .select()
        .single();

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: "Could not like this post"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: "Could not like this post"};
    }
}

// 删除帖子点赞
export const removePostLike = async (postId, userId)=>{
    try{
        
        const { error } = await supabase
        .from('postLikes')
        .delete()
        .eq('"userId"', userId)
        .eq('"postId"', postId)

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: "Could not remove post like"};
        }
        return {success: true, data: {postId, userId}};

    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: "Could not remove post like"};
    }
}

// 创建评论
export const createComment = async (comment)=>{
    try{
        
        const { data, error } = await supabase
        .from('comments')
        .insert(comment)
        .select()
        .single();

        if(error){
            console.log('comment error: ', error);
            return {success: false, msg: "Could not create your comment"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('comment error: ', error);
        return {success: false, msg: "Could not create your comment"};
    }
}

// 删除评论
export const removeComment = async (commentId)=>{
    try{
        
        const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

        if(error){
            console.log('removeComment error: ', error);
            return {success: false, msg: "Could not remove the comment"};
        }
        return {success: true, data: {commentId}};

    }catch(error){
        console.log('removeComment error: ', error);
        return {success: false, msg: "Could not remove the comment"};
    }
}

// 删除帖子
export const removePost = async (postId)=>{
    try{
        
        const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

        if(error){
            console.log('removePost error: ', error);
            return {success: false, msg: "Could not remove the post"};
        }
        return {success: true, data: {postId}};

    }catch(error){
        console.log('removePost error: ', error);
        return {success: false, msg: "Could not remove the post"};
    }
}

// 根据标签搜索帖子
export const searchPostsByTag = async (tag, limit=10) => {
    try {
        // 确保传入的标签非空
        if (!tag || tag.trim() === '') {
            return { success: false, msg: "Tag cannot be empty" };
        }
        
        // 使用contains搜索包含特定标签的帖子
        return await fetchPosts(limit, null, tag.trim());
    } catch (error) {
        console.log('searchPostsByTag error:', error);
        return { success: false, msg: "Could not search posts by tag" };
    }
}