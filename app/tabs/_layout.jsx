import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { theme } from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import { AntDesign, Entypo, Feather, FontAwesome, Ionicons } from '@expo/vector-icons'

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDark,
        tabBarStyle: styles.tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarItemStyle: styles.tabBarItemStyle
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({focused})=>{
            return (
              <View style={[styles.iconStyle, focused && {backgroundColor: 'rgba(0,0,0,0.08)'}]}>
                <Entypo name="home" size={28} color={focused? theme.colors.dark: theme.colors.textLight} />
              </View>
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
              <View style={[styles.iconStyle, focused && {backgroundColor: 'rgba(0,0,0,0.08)'}]}>
                <FontAwesome name="search" size={28} color={focused? theme.colors.dark: theme.colors.textLight} />
              </View>
            )
          }
        }}
      />
      <Tabs.Screen
        name="newPost"
        options={{
          title: "New Post",
          tabBarIcon: ({focused})=>{
            return (
              <View style={[styles.plusIcon, focused && {
                shadowColor: theme.colors.textLight,
                opacity: 1,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.4,
                shadowRadius: 5
              }]}>
                <AntDesign name="pluscircle" size={48} color={theme.colors.primary} />
                <View style={[styles.bar]} />
              </View>
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
              <View style={[styles.iconStyle, focused && {backgroundColor: 'rgba(0,0,0,0.08)'}]}>
                <Ionicons name="heart" size={28} color={focused? theme.colors.dark: theme.colors.textLight} />
              </View>
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
              <View style={[styles.iconStyle, focused && {backgroundColor: 'rgba(0,0,0,0.08)'}]}>
                <FontAwesome name="user" size={28} color={focused? theme.colors.dark: theme.colors.textLight} />
              </View>
            )
          }
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBarStyle: {
    borderRadius: 100,
    borderCurve: 'continuous',
    position: 'absolute',
    bottom: 25,
    right: 0,
    left: 0,
    height: hp(8),
    marginHorizontal: wp(4),
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 10

  },
  tabBarLabelStyle: {
    // fontSize: hp(1.3),
    // fontWeight: '500',
    display: 'none',
  },
  tabBarItemStyle: {
    // gap: -10
    top: 15,
  },
  iconStyle: {
    padding: 7,
    overflow: 'visible',
    borderRadius: 50,
    backgroundColor: 'white',
    height: hp(6),
    width: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    position: 'absolute', 
    overflow: 'visible', 
    opacity: 0.9, 
    top: -7, 
    backgroundColor: 'white', 
    borderRadius: 100
  }
})

export default _layout