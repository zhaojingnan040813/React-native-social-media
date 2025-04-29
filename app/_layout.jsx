import { View, Text, LogBox } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getUserData } from '../services/userService'

// 忽略所有与 react-native-render-html 相关的警告
LogBox.ignoreLogs([
  // 忽略 defaultProps 废弃警告
  'Warning: TRenderEngineProvider: Support for defaultProps will be removed',
  'Warning: MemoizedTNodeRenderer: Support for defaultProps will be removed',
  'Warning: TNodeChildrenRenderer: Support for defaultProps will be removed',
  // 忽略其他渲染库相关警告
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer', 
  'Warning: TRenderEngineProvider'
]);

const _layout = () => {
    
  return (
    <AuthProvider>
        <MainLayout />
    </AuthProvider>
    
  )
}

const MainLayout = ()=>{
    const {setAuth, setUserData} = useAuth();
    const router = useRouter();

    useEffect(() => {
        // triggers automatically when auth state changes
        supabase.auth.onAuthStateChange((_event, session) => {
        // console.log('session: ', session?.user?.id);
        if (session) {
            setAuth(session?.user);
            updateUserData(session?.user); // update user like image, phone, bio
            router.replace("/home");
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
        <Stack 
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="(main)/postDetails"
                options={{
                    presentation: 'modal'
                }}
            />
        </Stack>
    )
}

export default _layout