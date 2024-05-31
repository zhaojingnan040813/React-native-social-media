import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import React, { useState } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { getUserImageSrc } from '../../services/imageService'
import { Image } from 'expo-image';
import Header from '../../components/Header'
import ScreenWrapper from '../../components/ScreenWrapper'
import Icon from '../../assets/icons'


const Profile = () => {
  const {user} = useAuth();
  const router = useRouter();
  // first do this
  
  return (
    <ScreenWrapper bg="white">
      <ScrollView style={{flex: 1, backgroundColor:'white'}}> 
        {/* <Image style={styles.headerShape} source={require('../../assets/images/headerShape.png')} /> */}
        <View style={{paddingHorizontal: wp(4)}}>
          <Header title="Profile" mb={30} />
        </View>
        
        <View style={styles.container}>
          <View style={{gap: 15}}>
            {/* avatar */}
            <View style={styles.avatarContainer}>
              <Image source={getUserImageSrc(user?.image)} style={styles.avatar} />
              <Pressable style={styles.editIcon} onPress={()=> router.push('/editProfile')}>
                <Icon name="edit" strokeWidth={2.5} size={20} />
              </Pressable>
            </View>
          

            {/* username & address */}
            <View style={{alignItems: 'center', gap: 4}}>
              <Text style={styles.userName}> { user && user.name } </Text>
              <Text style={styles.infoText}> {user && user.address} </Text>
            </View>

            {/* email, phone */}
            <View style={{gap: 10}}>
              
              <View style={styles.info}>
                <Feather name="mail" size={20} color={theme.colors.textLight} />
                <Text style={[styles.infoText, {fontSize: hp(1.8)}]}> 
                    {user && user.email}
                  </Text>
              </View>
              {
                user && user.phoneNumber && (
                  <View style={styles.info}>
                    <Feather name="phone" size={20} color={theme.colors.textLight} />
                    <Text style={[styles.infoText, {fontSize: hp(1.8)}]}> 
                        {
                          user.phoneNumber
                        } 
                    </Text>
                  </View>
                )
              }
              
              {
                user && user.bio && (
                  <Text style={[styles.infoText]}>{user.bio}</Text>
                )
              }
              
            </View>
          </View>
        </View>
      </ScrollView>
      
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // top: -30,
    paddingHorizontal: wp(4)
  },
  headerContainer: {
    marginHorizontal: wp(4), 
    marginBottom: 20
  },
  headerShape: {
    width: wp(100),
    height: hp(20)
  },  
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center'
  },
  avatar: {
    width: '100%', 
    height: '100%', 
    borderRadius: theme.radius.lg*2,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'white',
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textDark
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textLight
  },

  
})

export default Profile