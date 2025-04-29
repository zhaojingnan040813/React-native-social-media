import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { hp, wp } from '../../helpers/common'

export default function MainLayout() {
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
          title: '',
          tabBarIcon: () => (
            <View style={styles.publishButton}>
              <Icon name="plus" size={24} color="#FFF" />
            </View>
          )
        }}
      />
      <Tabs.Screen 
        name="messages" 
        options={{
          title: '消息',
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
      <Tabs.Screen name="postDetails" options={{ href: null }} />
      <Tabs.Screen name="newPost" options={{ href: null }} />
      <Tabs.Screen name="editProfile" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: hp(7),
    paddingBottom: hp(0.8),
    paddingTop: hp(0.8),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
    bottom: hp(1.5)
  }
}) 