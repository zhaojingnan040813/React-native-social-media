import { View, Text, StyleSheet, Pressable, BackHandler, Alert } from 'react-native'
import React, { useEffect } from 'react'
import { Tabs, useRouter, usePathname } from 'expo-router'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { hp, wp } from '../../helpers/common'

// 1. 定义自定义按钮组件
const PublishTabButton = (props) => {
  const router = useRouter();
  const navigateToNewPost = () => {
    router.push('newPost'); // 修改为相对路径，去掉前面的斜杠
  };

  return (
    <Pressable onPress={navigateToNewPost} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* 使用现有的样式渲染按钮 */}
      <View style={styles.publishButton}>
        <Icon name="plus" size={24} color="#FFF" />
      </View>
    </Pressable>
  );
};

export default function MainLayout() {
  const pathname = usePathname();
  
  // 判断是否是主页面（一级路由），这些是应用的主要tab页面
  const isMainRoute = () => {
    const mainRoutes = [
      '/home',
      '/schedule',
      '/publish',
      '/messages',
      '/profile'
    ];
    
    // 检查当前路径是否是主路由
    return mainRoutes.some(route => pathname.endsWith(route));
  };
  
  // 处理返回按钮按下事件
  const handleBackPress = () => {
    // 如果当前在主路由页面，显示退出确认对话框
    if (isMainRoute()) {
      Alert.alert(
        '退出应用',
        '确定要退出应用吗？',
        [
          { text: '取消', style: 'cancel', onPress: () => {} },
          { text: '确定', style: 'destructive', onPress: () => BackHandler.exitApp() }
        ],
        { cancelable: true }
      );
      return true; // 返回true表示事件已处理，不会触发默认行为
    }
    
    // 返回false表示返回按钮默认行为（回到上一页）
    return false;
  };

  // 添加BackHandler监听器
  useEffect(() => {
    // 添加返回按钮事件监听
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // 在组件卸载时移除监听器
    return () => backHandler.remove();
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
      }}
    >
      <Tabs.Screen 
        name="home" 
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen 
        name="schedule" 
        options={{
          title: '课表',
          tabBarIcon: ({ color }) => <Icon name="calendar" size={24} color={color} />
        }}
      />
      <Tabs.Screen 
        name="publish" 
        options={{
          tabBarButton: (props) => <PublishTabButton {...props} />, // 2. 使用 tabBarButton 选项
        }}
      />
      <Tabs.Screen 
        name="messages" 
        options={{
          title: '私信',
          tabBarIcon: ({ color }) => <Icon name="mail" size={24} color={color} />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <Icon name="user" size={24} color={color} />
        }}
      />
      <Tabs.Screen name="postDetails" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="newPost" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="editProfile" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="search" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="myPosts" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="myBookmarks" options={{ href: null, tabBar: () => null }} />
      <Tabs.Screen name="aboutAuthor" options={{ href: null, tabBar: () => null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: hp(7),
    paddingBottom: hp(1),
    paddingTop: hp(0.5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    backgroundColor: '#fff'
  },
  publishButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: hp(0.5) }]
  }
}) 