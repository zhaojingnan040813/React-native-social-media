import { View, Text, StyleSheet, Alert, Pressable, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native'
import React, { useState } from 'react'
import { theme } from '../constants/theme'
import { Image } from 'expo-image';
import { hp, wp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getUserData } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const login = () => {
    const router = useRouter();
    const {setAuth, setUserData} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const onLogin = async ()=>{
        // login logic
        if(!email.trim() || !password.trim()){
            Alert.alert('登录', '请输入邮箱和密码');
            return null;
        }

        setLoading(true);
        const {error, data} =  await supabase.auth.signInWithPassword({
            email,
            password
        });

        if(error){
            Alert.alert('登录失败', error.message);
            console.log('login error: ', error);
            setLoading(false);
            return null;
        }

        setAuth(data?.user);
        let res = await getUserData(data?.user?.id);
        if(res.success) setUserData(res.data);
        setLoading(false);
    }
    
    // 忘记密码弹窗提示
    const handleForgotPassword = () => {
        Alert.alert('提示', '目前忘记密码功能正在开发中');
    }
    
  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.wrapper}
    >
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.contentWrapper}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={require('../assets/gif/avatar.gif')}
                        style={styles.logo}
                        contentFit="contain"
                    />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title}>登录</Text>
                    <View style={styles.inputs}>
                        <Input 
                            placeholder='邮箱'
                            placeholderTextColor={theme.colors.textLight}
                            onChangeText={setEmail}
                            value={email}
                        />
                        <Input 
                            placeholder='密码'
                            placeholderTextColor={theme.colors.textLight}
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry
                        />
                        <TouchableOpacity onPress={handleForgotPassword}>
                            <Text style={styles.forgotPassword}>忘记密码?</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.btnContainer}>
                        <Button 
                            title="登录" 
                            loading={loading}
                            onPress={onLogin}
                        />
                        <View style={styles.switchMode}>
                            <Text style={styles.switchModeText}>还没有账号? </Text>
                            <TouchableOpacity onPress={()=> router.replace('/signUp')}>
                                <Text style={styles.signUpText}>注册</Text>
                            </TouchableOpacity>
                        </View>
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
        flexGrow: 1,
        backgroundColor: '#fff'
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: hp(10), // 向下移动整体内容
        paddingBottom: hp(10)
    },
    logoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2)
    },
    logo: {
        width: hp(20),
        height: hp(20)
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
    },
    forgotPassword: {
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight,
        fontSize: hp(1.9),
        textAlign: 'right',
        marginTop: -5,
        marginBottom: 10
    }
})

export default login