import { supabase } from "../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// 用于会话存储的键名
const SESSION_KEY = 'user_session';

// 生成简单的密码哈希
const hashPassword = async (password) => {
  return await crypto.digestStringAsync(
    crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};

// 验证学号格式（9位数字）
export const validateStudentId = (studentId) => {
  return /^\d{9}$/.test(studentId);
};

// 用户注册
export const registerUser = async (name, studentId, password) => {
  try {
    // 验证学号格式
    if (!validateStudentId(studentId)) {
      return { success: false, msg: '学号格式错误，请输入9位数字' };
    }
    
    // 检查学号是否已存在
    const { data, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('StudentIdNumber', studentId);
    
    if (data && data.length > 0) {
      return { success: false, msg: '该学号已被注册' };
    }
    
    // 生成新的用户ID
    const userId = uuidv4();
    
    // 哈希密码
    const password_hash = await hashPassword(password);
    
    // 插入新用户记录
    const { error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        name: name.trim(),
        "StudentIdNumber": studentId,
        "password": password_hash
      }]);
    
    if (error) {
      console.error('注册错误:', error);
      return { success: false, msg: error.message };
    }
    
    return { success: true, userId };
  } catch (error) {
    console.error('注册异常:', error);
    return { success: false, msg: '发生未知错误' };
  }
};

// 用户登录
export const loginUser = async (studentId, password) => {
  try {
    // 查找用户
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('StudentIdNumber', studentId);
    
    if (error || !data || data.length === 0) {
      return { success: false, msg: '学号或密码错误' };
    }
    
    const user = data[0];
    
    // 验证密码
    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return { success: false, msg: '学号或密码错误' };
    }
    
    // 创建会话
    const session = {
      user,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // 存储会话
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    return { success: true, user };
  } catch (error) {
    console.error('登录异常:', error);
    return { success: false, msg: '登录失败' };
  }
};

// 获取当前会话
export const getCurrentSession = async () => {
  try {
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    
    // 检查会话是否过期
    if (new Date(session.expires_at) < new Date()) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch (error) {
    return null;
  }
};

// 登出
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}; 