import { View, Text, LogBox } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const _layout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

function RootLayoutNav() {
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
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signUp" />
      <Stack.Screen name="index" options={{ redirect: true }} />
    </Stack>
  )
}

export default _layout