import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getUserRole, isAuthenticated, logout } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          // Invalid user data in localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.data.status === 'success') {
        const { token, role, message } = response.data;
        
        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ role, username: credentials.email_or_username }));
        
        setUser({ role, username: credentials.email_or_username });
        
        return { success: true, message };
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.status === 'success') {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    logout();
    setUser(null);
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    login,
    register,
    logout: logoutUser,
    clearError,
    getUserRole: () => user?.role,
    isAdmin: () => user?.role === 'Super Admin' || user?.role === 'Secretary' || user?.role === 'Captain',
    isSuperAdmin: () => user?.role === 'Super Admin',
    isResident: () => user?.role === 'Resident',
    isOfficial: () => ['Super Admin', 'Secretary', 'Treasurer', 'Captain'].includes(user?.role),
  };

  return React.createElement(
    AuthContext.Provider,
    { value: value },
    children
  );
};

export default AuthContext;
