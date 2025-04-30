import { supabase } from "../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl } from '../constants';

// 使用服务器角色密钥创建一个管理员级客户端实例（这会绕过RLS策略）
// 注意：在实际生产环境中，应该谨慎使用此方法，这里仅作为个人应用的简化方案
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2a2Nldm9venVtcHdwYm9qa2N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTgwODczMiwiZXhwIjoyMDYxMzg0NzMyfQ.QWHyg1_Lr1reXnEa941idqMPYkfpU-fyU36c2DBPkm4';
// const SUPABASE_SERVICE_KEY = service_role_key
const adminSupabase = createClient(supabaseUrl, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 用于会话存储的键名
const SESSION_KEY = 'user_session';

// 生成标准UUID格式的方法
function generateUUID() {
  // 生成16个随机字节 (128位)
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  
  // 设置版本 (v4 = 随机UUID)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;  // 版本 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80;  // 变体 RFC4122

  // 将字节转换为十六进制字符串，并按UUID格式插入连字符
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
    // 按UUID格式添加连字符
    if (i === 3 || i === 5 || i === 7 || i === 9) {
      hex += '-';
    }
  }
  
  return hex;
}

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
    const { data, error: checkError } = await adminSupabase
      .from('users')
      .select('id')
      .eq('StudentIdNumber', studentId);
    
    if (data && data.length > 0) {
      return { success: false, msg: '该学号已被注册' };
    }
    
    // 生成标准格式的UUID
    const userId = generateUUID();
    
    // 插入新用户记录 (使用明文密码)
    const { error } = await adminSupabase
      .from('users')
      .insert([{
        id: userId,
        name: name.trim(),
        "StudentIdNumber": studentId,
        "password": password // 直接存储明文密码
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
    // 使用管理员客户端查找用户 - 绕过RLS策略
    const { data, error } = await adminSupabase
      .from('users')
      .select('*')
      .eq('"StudentIdNumber"', studentId);
    // console.log(data);
    








    if (error) {
      console.error('查询用户错误:', error);
      return { success: false, msg: '登录失败，请稍后再试' };
    }
    
    if (!data || data.length === 0) {
      return { success: false, msg: '学号或密码错误' };
    }
    
    const user = data[0];
    
    // 验证密码 (明文比较)
    if (user.password !== password) {
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