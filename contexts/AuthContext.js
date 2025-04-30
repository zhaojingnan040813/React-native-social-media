import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentSession, logoutUser } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const setAuth = (authUser) => {
    setUser(authUser);
  };

  const setUserData = (userData) => {
    setUser({...userData});
  }

  const logout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setUser(null);
    }
    return result;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      setAuth, 
      setUserData, 
      logout,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
