import { View, Text, StyleSheet, Pressable, BackHandler, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Tabs, useRouter, usePathname, Redirect } from 'expo-router'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { checkSession } from '../../helpers/sessionHelper'

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

/**
 * 主布局组件 - 所有需要登录才能访问的页面
 */
export default function MainLayout() {
  const { user, isLoading, sessionValid } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // 监听键盘事件
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
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

  // 检查会话有效性 - 添加会话验证
  useEffect(() => {
    if (!isLoading && user) {
      // 用户已登录时，检查会话有效性
      const validateUserSession = async () => {
        await checkSession(router);
      };
      
      validateUserSession();
    }
  }, [isLoading, user, pathname]);

  // 重定向未登录用户到登录页面
  if (!isLoading && !user) {
    return <Redirect href="/login" />;
  }

  // 如果会话失效，重定向到登录页面
  if (!isLoading && user && !sessionValid) {
    return <Redirect href="/login" />;
  }

  // 定义动态样式，确保底部导航栏保持在底部
  const tabBarStyle = {
    ...styles.tabBar,
    // 无论键盘状态如何，始终显示在底部
    position: 'absolute',  
    bottom: 0,
    height: hp(7),
    zIndex: 9999, // 使用非常高的z-index
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: tabBarStyle,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textLight,
          tabBarHideOnKeyboard: false, // 设置为false，使键盘不会隐藏底部导航栏
          // 关闭Android上的adjustNothing键盘模式
          android_keyboardInputMode: 'adjustPan', // 特定于Android的属性，使用adjustPan避免顶起底部导航
          keyboardShouldPersistTaps: 'always',
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
        <Tabs.Screen name="postDetails" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="newPost" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="editProfile" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="search" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="myPosts" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="myBookmarks" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="aboutAuthor" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  tabBar: {
    paddingBottom: hp(1),
    paddingTop: hp(0.5),
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    backgroundColor: '#fff',
    elevation: 8, // 为Android添加阴影
    shadowColor: '#000', // iOS阴影
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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