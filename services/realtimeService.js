import { supabase } from "../lib/supabase";

// 缓存活跃的通道
const activeChannels = new Map();

// 消息缓存，用于去重
const processedMessages = new Set();

/**
 * 订阅对话实时更新
 * @param {string} conversationId - 对话ID
 * @param {Function} onNewMessage - 新消息回调
 * @param {Function} onMessageUpdate - 消息更新回调
 * @returns {Object} - 带有取消订阅方法的对象
 */
export const subscribeToConversation = (conversationId, onNewMessage, onMessageUpdate) => {
  // 检查是否已存在此对话的通道
  const channelKey = `conversation:${conversationId}`;
  
  // 如果已有该对话的通道，先移除
  if (activeChannels.has(channelKey)) {
    // console.log(`移除已有通道: ${channelKey}`);
    const existingChannel = activeChannels.get(channelKey);
    supabase.removeChannel(existingChannel.channel);
    activeChannels.delete(channelKey);
  }
  
  // 创建新的通道
  // console.log(`创建通道: ${channelKey}`);
  const channel = supabase.channel(channelKey);
  
  // 订阅消息插入事件
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      const messageId = payload.new.id;
      // console.log(`收到新消息: ${messageId}`);
      
      // 消息去重处理
      const messageKey = `new:${messageId}`;
      if (processedMessages.has(messageKey)) {
        // console.log(`跳过已处理的消息: ${messageId}`);
        return;
      }
      
      // 标记消息为已处理
      processedMessages.add(messageKey);
      
      // 设置过期，避免集合无限增长
      setTimeout(() => {
        processedMessages.delete(messageKey);
      }, 10000); // 10秒后删除
      
      // 调用回调
      onNewMessage(payload.new);
    }
  );
  
  // 订阅消息更新事件
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      const messageId = payload.new.id;
      // console.log(`收到消息更新: ${messageId}`);
      
      // 消息更新去重处理
      const updateKey = `update:${messageId}:${payload.new.is_read}`;
      if (processedMessages.has(updateKey)) {
        // console.log(`跳过已处理的更新: ${messageId}`);
        return;
      }
      
      // 标记更新为已处理
      processedMessages.add(updateKey);
      
      // 设置过期
      setTimeout(() => {
        processedMessages.delete(updateKey);
      }, 10000);
      
      // 调用回调
      onMessageUpdate(payload.new);
    }
  );
  
  // 开始订阅
  channel.subscribe((status) => {
    // console.log(`通道状态: ${channelKey} - ${status}`);
  });
  
  // 将通道保存到缓存
  const channelInfo = {
    channel,
    lastActive: Date.now()
  };
  
  activeChannels.set(channelKey, channelInfo);
  
  // 返回含有取消订阅方法的对象
  return {
    unsubscribe: () => {
      // console.log(`取消订阅: ${channelKey}`);
      supabase.removeChannel(channel);
      activeChannels.delete(channelKey);
    }
  };
};

/**
 * 清理所有通道
 */
export const cleanupAllChannels = () => {
  // console.log(`清理所有通道: ${activeChannels.size}个`);
  
  for (const [key, channelInfo] of activeChannels.entries()) {
    supabase.removeChannel(channelInfo.channel);
  }
  
  activeChannels.clear();
  processedMessages.clear();
};

/**
 * 清理过期通道（超过1小时不活跃）
 */
export const cleanupStaleChannels = () => {
  const now = Date.now();
  const staleTime = 60 * 60 * 1000; // 1小时
  
  for (const [key, channelInfo] of activeChannels.entries()) {
    if (now - channelInfo.lastActive > staleTime) {
      // console.log(`移除过期通道: ${key}`);
      supabase.removeChannel(channelInfo.channel);
      activeChannels.delete(key);
    }
  }
};

// 定期清理过期通道
setInterval(cleanupStaleChannels, 30 * 60 * 1000); 