'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = Cookies.get('token');
    const storedUser = Cookies.get('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      // Handle standardized API response
      const data = response?.data || response;
      setToken(data.token);
      setUser(data.user);
      Cookies.set('token', data.token, { expires: 7 }); // expires in 7 days
      Cookies.set('user', JSON.stringify(data.user), { expires: 7 });
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await api.register(data);
      // Handle standardized API response
      const responseData = response?.data || response;
      setToken(responseData.token);
      setUser(responseData.user);
      Cookies.set('token', responseData.token, { expires: 7 }); // expires in 7 days
      Cookies.set('user', JSON.stringify(responseData.user), { expires: 7 });
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      Cookies.remove('token');
      Cookies.remove('user');
      router.push('/login');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
