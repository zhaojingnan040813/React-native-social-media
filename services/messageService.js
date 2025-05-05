import { supabase } from "../lib/supabase";

// 获取或创建两个用户之间的对话
export const getOrCreateConversation = async (user1Id, user2Id) => {
    try {
        // 确保用户ID的顺序一致（较小的ID在前）
        const smallerId = user1Id < user2Id ? user1Id : user2Id;
        const largerId = user1Id < user2Id ? user2Id : user1Id;
        
        // 先尝试查找现有对话
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`"user1Id".eq.${smallerId},"user2Id".eq.${largerId}`)
            .or(`"user1Id".eq.${largerId},"user2Id".eq.${smallerId}`)
            .single();
        
        // 如果找到现有对话，直接返回
        if (data && !error) {
            return { success: true, data };
        }
        
        // 否则创建新对话
        const { data: newConversation, error: createError } = await supabase
            .from('conversations')
            .insert({
                "user1Id": smallerId,
                "user2Id": largerId
            })
            .select()
            .single();
        
        if (createError) {
            console.log('创建对话失败:', createError);
            return { success: false, msg: createError.message };
        }
        
        return { success: true, data: newConversation };
    } catch (error) {
        console.log('对话操作失败:', error);
        return { success: false, msg: error.message };
    }
};

// 发送消息
export const sendMessage = async (conversationId, senderId, receiverId, content) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                "senderId": senderId,
                "receiverId": receiverId,
                content
            })
            .select()
            .single();
        
        if (error) {
            console.log('发送消息失败:', error);
            return { success: false, msg: error.message };
        }
        
        // 更新对话的更新时间
        await supabase
            .from('conversations')
            .update({ updated_at: new Date() })
            .eq('id', conversationId);
        
        return { success: true, data };
    } catch (error) {
        console.log('发送消息失败:', error);
        return { success: false, msg: error.message };
    }
};

// 获取对话消息
export const getConversationMessages = async (conversationId) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at');
        
        if (error) {
            console.log('获取消息失败:', error);
            return { success: false, msg: error.message };
        }
        
        return { success: true, data: data || [] };
    } catch (error) {
        console.log('获取消息失败:', error);
        return { success: false, msg: error.message };
    }
};

// 获取用户的所有对话列表
export const getUserConversations = async (userId) => {
    try {
        // 查询用户参与的所有对话
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`"user1Id".eq.${userId},"user2Id".eq.${userId}`)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.log('获取对话列表失败:', error);
            return { success: false, msg: error.message };
        }
        
        if (!data || data.length === 0) {
            return { success: true, data: [] };
        }
        
        // 获取对话涉及的所有用户ID
        const userIds = new Set();
        data.forEach(conv => {
            userIds.add(conv.user1Id);
            userIds.add(conv.user2Id);
        });
        
        // 移除当前用户ID
        userIds.delete(userId);
        
        // 获取所有相关用户信息
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, name, image')
            .in('id', Array.from(userIds));
        
        if (usersError) {
            console.log('获取用户信息失败:', usersError);
            return { success: false, msg: usersError.message };
        }
        
        // 获取每个对话的最后一条消息
        const enrichedConversations = await Promise.all(data.map(async (conv) => {
            // 查找最后一条消息
            const { data: lastMessage, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            // 确定对方用户
            const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
            const otherUser = users.find(u => u.id === otherUserId);
            
            // 查询未读消息数
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact' })
                .eq('conversation_id', conv.id)
                .eq('"receiverId"', userId)
                .eq('is_read', false);
            
            return {
                ...conv,
                lastMessage: lastMessage || null,
                otherUser,
                unreadCount: countError ? 0 : count
            };
        }));
        
        return { success: true, data: enrichedConversations };
    } catch (error) {
        console.log('获取对话列表失败:', error);
        return { success: false, msg: error.message };
    }
};

// 标记消息为已读
export const markMessagesAsRead = async (conversationId, userId) => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('"receiverId"', userId)
            .eq('is_read', false);
        
        if (error) {
            console.log('标记消息已读失败:', error);
            return { success: false, msg: error.message };
        }
        
        return { success: true };
    } catch (error) {
        console.log('标记消息已读失败:', error);
        return { success: false, msg: error.message };
    }
}; 