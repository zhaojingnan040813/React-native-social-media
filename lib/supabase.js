import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/supabase'

// 检查当前环境是否为浏览器环境（有window对象）
// 注：在服务器端渲染时，typeof window 会是 undefined
const isBrowser = typeof window !== 'undefined'

// 创建 Supabase 客户端配置
const supabaseConfig = {
  auth: {
    // 在非浏览器环境中使用内存存储，浏览器环境中使用 AsyncStorage
    storage: isBrowser ? AsyncStorage : {
      // 提供一个内存存储的实现
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // 添加实时客户端配置
  realtime: {
    // 关闭自动重新连接，让我们手动控制
    reconnect: false,
    // 增加超时时间
    timeout: 20000,
    // 每个消息的超时时间
    params: {
      heartbeat_interval: 30000
    }
  }
}

// 创建 Supabase 客户端实例
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfig)

// 仅在客户端（有 AppState 的环境）添加事件监听
if (Platform.OS !== 'web' || isBrowser) {
// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
}

// 创建一个缓存通道管理器
export class ChannelManager {
  static instance = null;
  channels = new Map();
  
  // 单例模式
  static getInstance() {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }
  
  // 获取或创建通道
  getOrCreateChannel(channelName, callback) {
    // 如果通道已存在，返回现有通道并更新订阅计数
    if (this.channels.has(channelName)) {
      const channelData = this.channels.get(channelName);
      channelData.subscribers++;
      return channelData.channel;
    }
    
    // 创建新通道
    const channel = supabase.channel(channelName);
    this.channels.set(channelName, {
      channel,
      subscribers: 1,
      callback
    });
    
    return channel;
  }
  
  // 移除通道订阅者
  removeChannelSubscriber(channelName) {
    if (!this.channels.has(channelName)) return;
    
    const channelData = this.channels.get(channelName);
    channelData.subscribers--;
    
    // 如果没有订阅者了，移除通道
    if (channelData.subscribers <= 0) {
      supabase.removeChannel(channelData.channel);
      this.channels.delete(channelName);
      
      // 执行清理回调（如果有）
      if (channelData.callback) {
        channelData.callback();
      }
    }
  }
  
  // 获取活跃通道数量
  getActiveChannelsCount() {
    return this.channels.size;
  }
  
  // 清理所有通道
  cleanupAllChannels() {
    for (const [channelName, channelData] of this.channels.entries()) {
      supabase.removeChannel(channelData.channel);
    }
    this.channels.clear();
  }
}

// 导出单例实例
export const channelManager = ChannelManager.getInstance();