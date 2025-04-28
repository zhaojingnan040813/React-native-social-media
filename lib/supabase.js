import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from '../constants'

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
}

// 创建 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseConfig)

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