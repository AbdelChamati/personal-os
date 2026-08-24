import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as authApi from '../api/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
          if (userData && userData.user) {
            setUser(userData.user);
          } else {
            setToken(null);
            localStorage.removeItem('authToken');
          }
        } catch (err) {
          setToken(null);
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const register = useCallback(async (email, password, confirmPassword, name) => {
    try {
      setError(null);
      const result = await authApi.register(email, password, confirmPassword, name);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('authToken', result.token);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const result = await authApi.login(email, password);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('authToken', result.token);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    }
  }, []);

  const updateProfile = useCallback(async (name, email) => {
    try {
      setError(null);
      const result = await authApi.updateProfile(name, email);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    try {
      setError(null);
      return await authApi.changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      setError(null);
      return await authApi.forgotPassword(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (resetToken, newPassword, confirmPassword) => {
    try {
      setError(null);
      return await authApi.resetPassword(resetToken, newPassword, confirmPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (password) => {
    try {
      setError(null);
      await authApi.deleteAccount(password);
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
