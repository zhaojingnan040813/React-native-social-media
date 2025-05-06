import { View, Text, LogBox } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import MessageSyncManager from '../components/MessageSyncManager'
import { ToastAndroid } from 'react-native'
import { cleanupAllChannels } from '../services/realtimeService'
import moment from 'moment'
import 'moment/locale/zh-cn'

// 设置moment为中文环境
moment.locale('zh-cn');

// 忽略特定的黄色警告
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
  'Possible Unhandled Promise Rejection',
  'Supabase Client initialized without explicit session handling',
  'ReactDOM.render is no longer supported'
]);

// 应用启动时清理所有通道
try {
  cleanupAllChannels();
  // console.log('已清理所有现有实时通道');
} catch (error) {
  // console.error('清理通道失败:', error);
}

const _layout = () => {
  const [isConnected, setIsConnected] = useState(true);

  // 处理连接状态变化
  const handleConnectionChange = (connected) => {
    setIsConnected(connected);
    if (!connected) {
      ToastAndroid.show('网络连接已断开，部分功能可能不可用', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('网络已连接', ToastAndroid.SHORT);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NotificationProvider>
          <MessageSyncManager onConnectionChange={handleConnectionChange}>
            <RootLayoutNav isConnected={isConnected} />
          </MessageSyncManager>
        </NotificationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

function RootLayoutNav({ isConnected }) {
  const {setAuth, setUserData} = useAuth();
  const router = useRouter();

  useEffect(() => {
    // triggers automatically when auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth(session?.user);
        updateUserData(session?.user); // update user like image, phone, bio
        router.replace("/(main)/home");
      } else {
        setAuth(null);
        router.replace('/welcome')
      }
    })
  }, []);

  const updateUserData = async (user)=>{
    let res = await getUserData(user.id);
    if(res.success) setUserData(res.data);
  }

  // 应用关闭时清理
  useEffect(() => {
    return () => {
      try {
        // 清理所有实时通道
        cleanupAllChannels();
      } catch (error) {
        // console.error('应用关闭时清理失败:', error);
      }
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" options={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: 'absolute', zIndex: 999999 },
        android_keyboardInputMode: 'adjustPan',
      }} />
      <Stack.Screen name="(secondary)" options={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: 'absolute', zIndex: 999999 },
        android_keyboardInputMode: 'adjustPan',
      }} />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" options={{headerShown: false, animation: 'fade'}} />
      <Stack.Screen name="signUp" options={{headerShown: false, animation: 'fade'}} />
      <Stack.Screen name="index" options={{ redirect: true }} />
    </Stack>
  )
}

export default _layout