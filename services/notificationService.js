import { supabase } from "../lib/supabase";





// 创建通知
export const createNotification = async (notification)=>{
    try{
        
        const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

        if(error){
            console.log('notification error: ', error);
            return {success: false, msg: "Something went wrong!"};
        }
        return {success: true, data: data};

    }catch(error){
        console.log('notification error: ', error);
        return {success: false, msg: "Something went wrong!"};
    }
}

// 查询通知 
export const fetchNotifications = async (receiverId)=>{
    try{
        // 1. 获取通知数据
        const { data: notifications, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', {ascending: false })
        .eq('"receiverId"', receiverId);

        if(notificationError){
            console.log('fetchNotifications error: ', notificationError);
            return {success: false, msg: "Could not fetch the notifications"};
        }
        
        if(!notifications || notifications.length === 0) {
            return {success: true, data: []};
        }
        
        // 2. 获取发送者信息
        const senderIds = [...new Set(notifications.filter(notif => notif.senderId).map(notif => notif.senderId))];
        
        let senders = [];
        if(senderIds.length > 0) {
            const { data: sendersData, error: sendersError } = await supabase
                .from('users')
                .select('id, name, image')
                .in('id', senderIds);
            
            if(sendersError){
                console.log('fetchSenders error: ', sendersError);
            } else {
                senders = sendersData || [];
            }
        }
        
        // 3. 关联发送者信息到通知
        const enrichedNotifications = notifications.map(notification => {
            const sender = notification.senderId ? senders.find(user => user.id === notification.senderId) : null;
            return {
                ...notification,
                sender
            };
        });
        
        return {success: true, data: enrichedNotifications};

    }catch(error){
        console.log('fetchNotifications error: ', error);
        return {success: false, msg: "Something went wrong!"};
    }
}

/**
 * 创建点赞通知
 * @param {string} senderId 点赞用户的ID
 * @param {string} receiverId 帖子作者的ID
 * @param {number} postId 帖子ID
 * @returns {Promise} 创建结果
 */
export const createLikeNotification = async (senderId, receiverId, postId) => {
  // 如果是自己给自己点赞，不创建通知
  if (senderId === receiverId) {
    return { success: true, data: null };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title: '点赞通知',
        senderId: senderId,
        receiverId: receiverId,
        type: 'like',
        data: JSON.stringify({ postId }),
        isread: false
      });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('创建点赞通知失败:', error);
    return { success: false, error };
  }
};

/**
 * 创建评论通知
 * @param {string} senderId 评论用户的ID
 * @param {string} receiverId 帖子作者的ID
 * @param {number} postId 帖子ID
 * @param {number} commentId 评论ID
 * @param {string} commentText 评论内容
 * @returns {Promise} 创建结果
 */
export const createCommentNotification = async (senderId, receiverId, postId, commentId, commentText) => {
  // 如果是自己给自己评论，不创建通知
  if (senderId === receiverId) {
    return { success: true, data: null };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title: '评论通知',
        senderId: senderId,
        receiverId: receiverId,
        type: 'comment',
        data: JSON.stringify({ postId, commentId, commentText }),
        isread: false
      });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('创建评论通知失败:', error);
    return { success: false, error };
  }
};

/**
 * 获取用户的通知列表
 * @param {string} userId 用户ID
 * @param {number} limit 限制数量
 * @returns {Promise} 通知列表
 */
export const fetchUserNotifications = async (userId, limit = 50) => {
  try {
    // 1. 获取通知数据
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiverId', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { success: true, data: [] };
    }
    
    // 2. 获取发送者信息
    const senderIds = [...new Set(data.filter(notif => notif.senderId).map(notif => notif.senderId))];
    
    let senders = [];
    if (senderIds.length > 0) {
      const { data: sendersData, error: sendersError } = await supabase
        .from('users')
        .select('id, name, image')
        .in('id', senderIds);
      
      if (sendersError) {
        console.error('获取发送者信息失败:', sendersError);
      } else {
        senders = sendersData || [];
      }
    }
    
    // 3. 手动关联发送者信息
    const enrichedNotifications = data.map(notification => {
      const sender = notification.senderId ? senders.find(user => user.id === notification.senderId) : null;
      return {
        ...notification,
        sender,
        receiver: { id: userId }
      };
    });

    return { success: true, data: enrichedNotifications };
  } catch (error) {
    console.error('获取通知列表失败:', error);
    return { success: false, error };
  }
};

/**
 * 将通知标记为已读
 * @param {number} notificationId 通知ID
 * @returns {Promise} 更新结果
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('标记通知已读失败:', error);
    return { success: false, error };
  }
};

/**
 * 将所有通知标记为已读
 * @param {string} userId 用户ID
 * @returns {Promise} 更新结果
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ isread: true })
      .eq('receiverId', userId)
      .eq('isread', false);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('标记所有通知已读失败:', error);
    return { success: false, error };
  }
};

/**
 * 获取未读通知数量
 * @param {string} userId 用户ID
 * @returns {Promise} 未读通知数量
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('receiverId', userId)
      .eq('isread', false);

    if (error) throw error;

    return { success: true, count };
  } catch (error) {
    console.error('获取未读通知数量失败:', error);
    return { success: false, error };
  }
};
