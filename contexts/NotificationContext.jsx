import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUnreadNotificationsCount } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

// 创建通知上下文
const NotificationContext = createContext();

// 自定义Hook以便在其他组件中使用通知上下文
export const useNotification = () => useContext(NotificationContext);

// 通知提供者组件
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const router = useRouter();

  // 获取未读通知数量
  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await getUnreadNotificationsCount(user.id);
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('获取未读通知数量出错:', error);
    } finally {
      setLoading(false);
    }
  };

  // 更新未读通知数量
  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  // 重置未读通知数量为0
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // 用户登录后初始化通知数量
  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount();
      // 订阅通知变化
      subscribeToNotifications();
    }
    
    return () => {
      // 清理通知订阅
      unsubscribeFromNotifications();
    };
  }, [user?.id]);

  // 订阅通知表的变化
  const subscribeToNotifications = () => {
    if (!user?.id) return null;
    
    try {
      const notificationsChannel = supabase
        .channel('notifications-channel')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `receiverId=eq.${user.id}`
          }, 
          handleNewNotification
        )
        .subscribe();
        
      return notificationsChannel;
    } catch (error) {
      console.error('订阅通知出错:', error);
      return null;
    }
  };

  // 取消订阅通知
  const unsubscribeFromNotifications = () => {
    try {
      supabase.removeChannel('notifications-channel');
    } catch (error) {
      console.error('取消订阅通知出错:', error);
    }
  };

  // 处理新通知
  const handleNewNotification = (payload) => {
    // 更新未读数量
    setUnreadCount(prev => prev + 1);
    
    // 设置最新通知以便显示通知提示
    if (payload.new) {
      const newNotification = payload.new;
      setLastNotification(newNotification);
      
      // 可以在这里添加显示通知提示的代码
      showNotificationAlert(newNotification);
    }
  };
  
  // 显示通知提示
  const showNotificationAlert = (notification) => {
    try {
      let message = '您有一条新消息';
      let title = '通知';
      
      if (notification.type === 'like') {
        title = '点赞通知';
        message = '有人赞了您的帖子';
      } else if (notification.type === 'comment') {
        title = '评论通知';
        message = '有人评论了您的帖子';
      }
      
      // 显示通知提示
      Alert.alert(
        title,
        message,
        [
          {
            text: '查看',
            onPress: () => {
              router.push('/(secondary)/notifications');
            },
          },
          {
            text: '忽略',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('显示通知提示出错:', error);
    }
  };

  // 提供通知上下文
  const value = {
    unreadCount,
    fetchUnreadCount,
    updateUnreadCount,
    resetUnreadCount,
    loading,
    lastNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 