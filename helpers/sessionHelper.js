import { validateSession } from '../services/authService';
import { Alert } from 'react-native';

/**
 * 验证会话并执行操作
 * @param {Function} action 需要执行的操作
 * @param {Function} onInvalid 会话无效时的回调
 * @param {Object} router 路由对象，如果提供则会话无效时自动跳转到登录页
 * @returns 
 */
export const withSessionCheck = async (action, onInvalid = null, router = null) => {
  try {
    // 验证会话
    const result = await validateSession();
    
    if (result.valid) {
      // 会话有效，执行操作
      return await action();
    } else {
      // 会话无效，执行回调或默认处理
      if (onInvalid) {
        return await onInvalid();
      } else {
        // 默认处理：提示并跳转到登录页
        Alert.alert('会话已过期', '请重新登录', [
          {
            text: '确定',
            onPress: () => {
              if (router) {
                router.replace('/login');
              }
            }
          }
        ]);
        return null;
      }
    }
  } catch (error) {
    console.error('会话验证执行错误:', error);
    Alert.alert('错误', '操作失败，请稍后再试');
    return null;
  }
};

/**
 * 检查会话有效性
 * @param {Object} router 路由对象
 * @returns {Promise<boolean>} 会话是否有效
 */
export const checkSession = async (router = null) => {
  try {
    const result = await validateSession();
    
    if (!result.valid && router) {
      Alert.alert('会话已过期', '请重新登录', [
        {
          text: '确定',
          onPress: () => router.replace('/login')
        }
      ]);
    }
    
    return result.valid;
  } catch (error) {
    console.error('会话检查错误:', error);
    return false;
  }
}; 