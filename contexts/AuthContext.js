import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentSession, logoutUser, validateSession } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(true);

  // 初始化时检查会话状态
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session && session.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('会话检查错误:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // 定期验证会话有效性
  useEffect(() => {
    let intervalId;
    
    if (user) {
      // 每小时检查一次会话有效性
      intervalId = setInterval(async () => {
        const result = await validateSession();
        setSessionValid(result.valid);
        
        if (!result.valid) {
          // 如果会话无效，执行登出操作
          await logout();
        }
      }, 60 * 60 * 1000); // 1小时
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  const setAuth = (authUser) => {
    setUser(authUser);
    setSessionValid(true);
  };

  const setUserData = (userData) => {
    setUser({...userData});
  }

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
      setSessionValid(true);
    }
    return result;
  }

  // 检查会话是否有效
  const checkSessionValidity = async () => {
    const result = await validateSession();
    setSessionValid(result.valid);
    return result.valid;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setAuth, 
      setUserData, 
      logout,
      isLoading,
      sessionValid,
      checkSessionValidity
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
