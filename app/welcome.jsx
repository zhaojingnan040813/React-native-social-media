import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Pressable } from 'react-native'
import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { Octicons } from '@expo/vector-icons';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter } from 'expo-router';
import Button from '../components/Button';

const WelcomePage = () => {

    const router = useRouter();
  return (
    <ScreenWrapper bg={'white'}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* welcome image */}
        <Image style={styles.welcomeImage} resizeMode='contain' source={require('../assets/images/welcome.png')} />

        {/* title */}
        <View style={{gap: 20}}>
            <Text style={styles.title}>社交媒体应用</Text>
            <Text style={styles.subtitle}>与朋友们保持联系</Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="登录" 
            buttonStyle={{marginHorizontal: wp(3)}} 
            onPress={()=> router.push('/login')}
          />
          <View style={styles.bottomTextContainer}>
              <Text style={styles.loginText}>
                Already have an account! 
              </Text>
              <Pressable onPress={()=> router.push('/signUp')}>
                <Text style={[styles.loginText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>创建一个账户</Text>
              </Pressable>
          </View>
          
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingHorizontal: wp(5)
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100),
    alignSelf: 'center',
  },
  title: {
    color: theme.colors.text,
    fontSize: hp(4),
    textAlign: 'center',
    fontWeight: theme.fonts.extraBold
  },
  subtitle: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: 5,
  },
  footer: {
    gap: 30,
    width: '100%',
  },
 
  bottomTextContainer:{
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  loginText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6)
  },
})

export default WelcomePage;