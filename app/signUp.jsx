import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { Feather, FontAwesome, Ionicons, Octicons, SimpleLineIcons } from '@expo/vector-icons';
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import Icon from '../assets/icons';
import Input from '../components/Input';

const SignUp = () => {

  const emailRef = useRef("");
  const nameRef = useRef("");
  const passwordRef = useRef("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const onSubmit = async ()=>{
        if(!nameRef.current || !emailRef.current || !passwordRef.current){
            Alert.alert('注册', '请填写所有字段');
            return;
        }

        let name = nameRef.current.trim();
        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();

        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name
                },
            },
        });

        // console.log('session: ', session);
        // console.log('error: ', error);
    
        if (error) Alert.alert('注册失败', error.message)
        setLoading(false)

        if (data?.user) {
            await supabase
            .from('users')
            .insert([
                { 
                    id: data.user.id,
                    name,
                    email,
                },
            ]);
            Alert.alert('注册成功', '请登录您的账户');
            router.push('/login');
        }
    }

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
    >
        <ScrollView
            contentContainerStyle={styles.container}
        >
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../assets/images/logo.png')}
                    style={styles.logo}
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>注册</Text>
                <View style={styles.inputs}>
                    <Input
                        icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                        placeholder='姓名'
                        placeholderTextColor={theme.colors.textLight}
                        onChangeText={value=> nameRef.current=value}
                        value={nameRef.current}
                    />
                    <Input
                        icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                        placeholder='邮箱'
                        placeholderTextColor={theme.colors.textLight}
                        onChangeText={value=> emailRef.current=value}
                        value={emailRef.current}
                    />
                    <Input 
                        icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                        secureTextEntry
                        placeholder='密码'
                        placeholderTextColor={theme.colors.textLight}
                        onChangeText={value=> passwordRef.current=value}
                        value={passwordRef.current}
                    />
                </View>

                <View style={styles.btnContainer}>
                    <Button 
                        title="注册" 
                        onPress={onSubmit}
                        loading={loading}
                    />
                    <View style={styles.switchMode}>
                        <Text style={styles.switchModeText}>已有账号? </Text>
                        <TouchableOpacity onPress={()=> router.replace('/login')}>
                            <Text style={styles.signUpText}>登录</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff', 
    paddingBottom: 120
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5)
  },
  logo: {
    height: hp(20),
    width: hp(20),
    marginBottom: hp(1)
  },
  content: {
    padding: wp(7),
    borderRadius: wp(2)
  },
  title: {
    fontSize: hp(4),
    color: theme.colors.text,
    fontWeight: '600'
  },
  inputs: {
    gap: 16,
    marginVertical: hp(4),
    marginTop: hp(6)
  },
  btnContainer: {
    gap: 30,
  },
  switchMode: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  switchModeText: {
    color: theme.colors.text
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.medium
  }
})

export default SignUp;