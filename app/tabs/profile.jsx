import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native'
import React, { useState } from 'react'
import { hp, wp } from '../../helpers/common'
import { useAuth } from '../../contexts/AuthContext'
import { theme } from '../../constants/theme'
import { Feather, Ionicons, SimpleLineIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const Profile = () => {
  const {user} = useAuth();
  const router = useRouter();
  const [profileModal, toggleProfileModal] = useState(false);
  let imageSource = user.image? {uri: user.image}: require('../../assets/images/defaultUser.png');

  
  return (
    // <ScreenWrapper>
    <ScrollView style={{flex: 1}}> 
      <Image style={styles.headerShape} source={require('../../assets/images/headerShape.png')} />
      
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Image source={imageSource} style={{width: '100%', height: '100%', borderRadius: 100}} />
            <Pressable style={styles.editIcon} onPress={()=> router.push('/editProfile')}>
              <Feather name="edit-3" size={20} color={theme.colors.textLight} />
            </Pressable>
          </View>
         

          {/* username & address */}
          <View style={{alignItems: 'center', gap: 4}}>
            <Text style={styles.userName}> { user && user.name } </Text>
            <Text style={styles.infoText}> USA, New york </Text>
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
      
    // </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: -30,
    paddingHorizontal: wp(4)
  },
  headerShape: {
    width: wp(100),
    height: hp(20)
  },  
  header: {
    gap: 15,
  },
  avatar: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center'
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 7,
    borderRadius: 50,
    backgroundColor: theme.colors.darkLight,
    shadowColor: theme.colors.textLight,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.7,
    shadowRadius: 5
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