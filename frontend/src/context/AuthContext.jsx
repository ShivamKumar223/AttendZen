/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Dynamic API URL for easy local testing & seamless production fallback
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
axios.defaults.baseURL = isLocalhost 
  ? 'http://localhost:5000/api' 
  : 'https://attendzen.onrender.com/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedUser = localStorage.getItem('user');
      setTimeout(() => {
        if (savedUser) setUser(JSON.parse(savedUser));
        setLoading(false);
      }, 0);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 0);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true };
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.emailNotVerified) {
        return { 
          success: false, 
          emailNotVerified: true, 
          email: error.response.data.email, 
          message: error.response.data.message 
        };
      }
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, mobile, password) => {
    try {
      const res = await axios.post('/auth/register', { name, email, mobile, password });
      if (res.data.needsVerification) {
        return { 
          success: true, 
          needsVerification: true, 
          email: res.data.email,
          message: res.data.message 
        };
      }
      
      // Fallback in case verification is somehow bypassed backend-side
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post('/auth/verify-otp', { email, otp });
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'OTP verification failed' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await axios.post('/auth/resend-otp', { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Resending OTP failed' };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post('/auth/forgot-password', { email });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Request failed' };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await axios.post('/auth/reset-password', { email, otp, newPassword });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Password reset failed' };
    }
  };

  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('/auth/profile', userData);
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      return { success: true, user: res.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Profile update failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      verifyOtp, 
      resendOtp, 
      forgotPassword, 
      resetPassword, 
      updateProfile,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
