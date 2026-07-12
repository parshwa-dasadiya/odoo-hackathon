import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { post } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for saved token on initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          setToken(savedToken);
          // In a real application, you would fetch the user profile here with the token.
          // For now, we will simulate decoding a token or setting a placeholder user
          // based on mock data so we can see how the application behaves.
          // Since the server doesn't exist yet, we'll set user details if the token exists.
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
        // Clear broken session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Real API call (which will fail for now since there's no backend, displaying a clean error)
      const response = await post('/auth/login', { email, password });
      
      if (response && response.success) {
        const { token: jwtToken, user: userData } = response.data;
        
        setToken(jwtToken);
        setUser(userData);
        
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      console.error('Login error', error);
      // Return structured error shape
      return { 
        success: false, 
        message: error.message || 'Network error: Could not reach the authentication server.' 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
