import React from 'react';
import { Stack } from 'expo-router';

export default function SecondaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 不显示标题栏
        animation: 'slide_from_right', // 页面过渡动画
      }}
    >
      <Stack.Screen name="myPosts" />
      <Stack.Screen name="myBookmarks" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="aboutAuthor" />
      <Stack.Screen name="[...missing]" options={{ title: '页面不存在' }} />
    </Stack>
  );
} 