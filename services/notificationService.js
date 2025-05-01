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
