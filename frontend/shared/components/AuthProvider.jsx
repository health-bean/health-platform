// File: frontend/shared/components/AuthProvider.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Verify existing token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // In production, you'd get token from localStorage
        // For demo, we'll start with no token
        console.log('Initializing auth...');
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password
      });

      if (response?.user && response?.token) {
        console.log('Login successful:', response.user);
        setUser(response.user);
        setToken(response.token);
        
        // In production, you'd save token to localStorage:
        // localStorage.setItem('auth_token', response.token);
        // localStorage.setItem('user', JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      // Call backend logout endpoint
      if (token) {
        await apiClient.post('/api/v1/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log('Logout successful');
      
      // Clear auth state
      setUser(null);
      setToken(null);
      setError(null);
      
      // In production, you'd clear localStorage:
      // localStorage.removeItem('auth_token');
      // localStorage.removeItem('user');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      setUser(null);
      setToken(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Verify token (for checking if still valid)
  const verifyToken = async () => {
    if (!token) return false;
    
    try {
      const response = await apiClient.get('/api/v1/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response?.valid === true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Auth context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    verifyToken,
    getAuthHeaders,
    setError // For clearing errors
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the context for the hook
export { AuthContext };