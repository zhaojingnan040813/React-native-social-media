import React, { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../lib/supabase';

/**
 * 消息同步管理组件
 * 用于处理消息同步状态和网络状态变化
 */
const MessageSyncManager = ({ children, onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(true);
  const appState = useRef(AppState.currentState);
  const connectionCheckInterval = useRef(null);

  // 监听网络状态变化
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(!!connected);
      
      if (onConnectionChange) {
        onConnectionChange(!!connected);
      }
      
      // 如果网络恢复连接，尝试重新连接实时通道
      if (connected && !isConnected) {
        reconnectRealtimeChannels();
      }
    });

    // 组件卸载时取消监听
    return () => {
      unsubscribe();
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, [isConnected]);

  // 监听应用状态变化（前台/后台）
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // 如果应用从后台切换到前台
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        // 检查当前网络状态
        NetInfo.fetch().then(state => {
          const connected = state.isConnected && state.isInternetReachable;
          setIsConnected(!!connected);
          
          if (connected) {
            reconnectRealtimeChannels();
          }
        });
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 设置定期检查连接状态
  useEffect(() => {
    // 每30秒检查一次连接状态
    connectionCheckInterval.current = setInterval(() => {
      if (appState.current === 'active') {
        checkAndReconnect();
      }
    }, 30000);

    return () => {
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, []);

  // 检查并重连实时通道
  const checkAndReconnect = async () => {
    try {
      const netInfoState = await NetInfo.fetch();
      const connected = netInfoState.isConnected && netInfoState.isInternetReachable;
      
      if (connected && !supabase.realtime.isConnected()) {
        reconnectRealtimeChannels();
      }
    } catch (error) {
      console.error('检查连接状态失败:', error);
    }
  };

  // 重新连接实时通道
  const reconnectRealtimeChannels = () => {
    try {
      console.log('尝试重新连接实时通道...');
      
      // 重新连接实时通道
      supabase.realtime.connect();
      
      console.log('实时通道重连成功');
    } catch (error) {
      console.error('重新连接实时通道失败:', error);
    }
  };

  // 这是一个无界面的功能组件，直接返回子组件
  return children;
};

export default MessageSyncManager; 