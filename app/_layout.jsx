import { View, Text, LogBox } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import MessageSyncManager from '../components/MessageSyncManager'
import { ToastAndroid } from 'react-native'

// 忽略特定的黄色警告
LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  'Sending `onAnimatedValueUpdate` with no listeners registered.'
]);

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
        <MessageSyncManager onConnectionChange={handleConnectionChange}>
          <RootLayoutNav isConnected={isConnected} />
        </MessageSyncManager>
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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
      <Stack.Screen name="(secondary)" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="index" options={{ redirect: true }} />
    </Stack>
  )
}

export default _layout