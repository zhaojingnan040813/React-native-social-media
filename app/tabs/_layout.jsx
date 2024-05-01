import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import { Entypo, Feather, FontAwesome, Ionicons } from '@expo/vector-icons'

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDark,
        tabBarStyle: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: hp(1.3),
          fontWeight: '500'
        },
        tabBarItemStyle: {
          gap: -10
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({focused})=>{
            return (
              <Entypo name="home" size={22} color={focused? theme.colors.primary: theme.colors.textLight} />
            )
          }
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Explore",
          tabBarIcon: ({focused})=>{
            return (
              <FontAwesome name="search" size={22} color={focused? theme.colors.primary: theme.colors.textLight} />
            )
          }
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({focused})=>{
            return (
              <Ionicons name="heart" size={22} color={focused? theme.colors.primary: theme.colors.textLight} />
            )
          }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({focused})=>{
            return (
              <FontAwesome name="user" size={22} color={focused? theme.colors.primary: theme.colors.textLight} />
            )
          }
        }}
      />
    </Tabs>
  )
}

export default _layout