// File: frontend/shared/components/AuthProvider.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!token;

  // Helper function to detect demo users
  const isDemoUser = (userData) => {
    if (!userData || !userData.email) return false;
    const demoEmails = [
      'sarah.aip@test.com',
      'mike.fodmap@test.com', 
      'lisa.histamine@test.com',
      'john.paleo@test.com',
      'emma.multi@test.com'
    ];
    return demoEmails.includes(userData.email.toLowerCase()) || 
           userData.email.includes('@demo.') ||
           userData.isDemoUser === true;
  };

  // SECURITY: Always use sessionStorage for personal health data
  // Sessions expire when browser closes - maximum privacy protection
  const getStorage = () => {
    return sessionStorage; // Always use sessionStorage for security
  };

  // Verify existing token on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // SECURITY: Only check sessionStorage for health data privacy
        const storedToken = sessionStorage.getItem('auth_token');
        const storedRefreshToken = sessionStorage.getItem('refresh_token');
        const storedUser = sessionStorage.getItem('user');
        
        // SECURITY: Clear any localStorage remnants for privacy
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        console.log('🔒 Cleared any localStorage remnants for security');

        if (storedToken && storedUser) {
          console.log('Found stored auth data, verifying...');
          
          try {
            // Parse stored user
            const parsedUser = JSON.parse(storedUser);
            
            // Determine if this is a demo user and set mode
            const isDemo = isDemoUser(parsedUser);
            setIsDemoMode(isDemo);
            
            console.log(`🔒 SECURE SESSION: ${isDemo ? 'Demo' : 'Personal'} health data - ${parsedUser.email}`);
            console.log('🔒 Using sessionStorage for maximum privacy protection');
            
            // Verify token is still valid
            const isValid = await verifyStoredToken(storedToken);
            
            if (isValid) {
              console.log('Stored token is valid, restoring session');
              setToken(storedToken);
              setRefreshToken(storedRefreshToken);
              setUser(parsedUser);
            } else if (storedRefreshToken) {
              console.log('Access token expired, attempting refresh...');
              await attemptTokenRefresh(storedRefreshToken);
            } else {
              console.log('Token invalid and no refresh token, clearing storage');
              clearAuthStorage();
            }
          } catch (error) {
            console.error('Error parsing stored auth data:', error);
            clearAuthStorage();
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        clearAuthStorage();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Helper function to verify stored token
  const verifyStoredToken = async (tokenToVerify) => {
    try {
      const response = await apiClient.get('/api/v1/auth/verify', {
        headers: { Authorization: `Bearer ${tokenToVerify}` }
      });
      return response?.valid === true;
    } catch (error) {
      console.log('Token verification failed:', error);
      return false;
    }
  };

  // Helper function to attempt token refresh
  const attemptTokenRefresh = async (storedRefreshToken) => {
    try {
      const response = await apiClient.post('/api/v1/auth/refresh', {
        refreshToken: storedRefreshToken
      });

      if (response?.token && response?.refreshToken) {
        console.log('Token refresh successful');
        const storedUser = JSON.parse(sessionStorage.getItem('user'));
        
        // Update tokens
        setToken(response.token);
        setRefreshToken(response.refreshToken);
        setUser(storedUser);
        
        // SECURITY: Always use sessionStorage for health data
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('refresh_token', response.refreshToken);
        console.log('🔒 Tokens refreshed in secure sessionStorage');
        
        return true;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthStorage();
      return false;
    }
  };

  // Helper function to clear auth storage - SECURITY: Clear everything
  const clearAuthStorage = () => {
    // SECURITY: Clear sessionStorage (primary)
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    
    // SECURITY: Also clear localStorage to prevent any data leakage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Clear state
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setError(null);
    setIsDemoMode(false);
    
    console.log('🔒 All auth storage cleared for security');
  };

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
        console.log('🔍 AUTH: Token received:', response.token ? 'YES' : 'NO');
        
        // Determine if this is a demo user
        const isDemo = isDemoUser(response.user);
        setIsDemoMode(isDemo);
        
        // SECURITY: Always use sessionStorage for personal health data
        console.log(`🔒 SECURE LOGIN: ${isDemo ? 'Demo' : 'Personal'} health data session`);
        console.log('🔒 Using sessionStorage - data cleared when browser closes');
        
        // Set state
        setUser(response.user);
        setToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        
        // SECURITY: Save to sessionStorage only
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        if (response.refreshToken) {
          sessionStorage.setItem('refresh_token', response.refreshToken);
        }
        
        console.log('🔍 AUTH: Token stored in sessionStorage');
        console.log('🔍 AUTH: Verifying token storage:', sessionStorage.getItem('auth_token') ? 'STORED' : 'NOT STORED');
        
        // SECURITY: Ensure localStorage is clean
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
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
      
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout anyway
    } finally {
      // Always clear auth state and storage
      clearAuthStorage();
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

  // SECURITY: Auto-refresh tokens but let demo sessions expire naturally for privacy
  useEffect(() => {
    if (!token || !refreshToken || isDemoMode) return;

    // Set up automatic token refresh 2 minutes before expiry
    // Since your tokens expire in 15 minutes, refresh after 13 minutes
    const refreshInterval = setInterval(async () => {
      console.log('🔒 Auto-refreshing token for continued secure session...');
      await attemptTokenRefresh(refreshToken);
    }, 13 * 60 * 1000); // 13 minutes

    return () => clearInterval(refreshInterval);
  }, [token, refreshToken, isDemoMode]);

  // Auth context value
  const value = {
    user,
    token,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    isDemoMode, // Expose demo mode status
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