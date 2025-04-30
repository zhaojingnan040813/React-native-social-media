import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { hp, wp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter } from 'expo-router';
import Button from '../components/Button';
import Icon from '../assets/icons';
import Input from '../components/Input';
import { registerUser, validateStudentId } from '../services/authService';

const SignUp = () => {
  // 使用useState替代useRef来管理输入值
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const onSubmit = async () => {
    if(!name.trim() || !studentId.trim() || !password.trim() || !confirmPassword.trim()){
      Alert.alert('注册', '请填写所有字段');
      return;
    }

    if(password !== confirmPassword){
      Alert.alert('注册', '两次输入的密码不一致');
      return;
    }
    
    // 验证学号格式
    if(!validateStudentId(studentId)){
      Alert.alert('注册', '学号格式错误，请输入9位数字');
      return;
    }

    setLoading(true);
    try {
      // 使用自定义注册服务
      const result = await registerUser(name, studentId, password);

      if (!result.success) {
        Alert.alert('注册失败', result.msg);
      } else {
        Alert.alert('注册成功', '请登录您的账户');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('注册失败', '发生未知错误，请稍后再试');
    } finally {
      setLoading(false);
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
            source={require('../assets/gif/avatar.gif')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>注册</Text>
          <View style={styles.inputs}>
            <Input
              icon={<Icon name="user" size={26} strokeWidth={1.6} />}
              placeholder='姓名'
              placeholderTextColor={theme.colors.textLight}
              onChangeText={setName}
              value={name}
            />
            <Input
              icon={<Icon name="credit-card" size={26} strokeWidth={1.6} />}
              placeholder='学号 (9位数字)'
              placeholderTextColor={theme.colors.textLight}
              onChangeText={setStudentId}
              value={studentId}
              keyboardType="numeric"
              maxLength={9}
            />
            <Input 
              icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
              secureTextEntry
              placeholder='密码'
              placeholderTextColor={theme.colors.textLight}
              onChangeText={setPassword}
              value={password}
            />
            <Input 
              icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
              secureTextEntry
              placeholder='确认密码'
              placeholderTextColor={theme.colors.textLight}
              onChangeText={setConfirmPassword}
              value={confirmPassword}
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
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#fff', 
    paddingBottom: hp(10)
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