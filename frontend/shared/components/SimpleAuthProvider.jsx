// File: frontend/shared/components/SimpleAuthProvider.jsx
// Dual-track authentication: Cognito for real users, demo mode for testing

import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import safeLogger from '../utils/safeLogger';
import { simpleApiClient } from '../services/simpleApi.js';

// Import Amplify config
import '../../../web-app/src/config/amplify.js';

// Create Auth Context
const AuthContext = createContext(null);

// Demo user profiles for prototype
const DEMO_USERS = [
  {
    id: 'sarah-aip',
    email: 'sarah.aip@test.com',
    name: 'Sarah Johnson',
    avatar: '👩‍💼',
    protocol: 'AIP (Autoimmune Protocol)',
    entries: '1,052 entries',
    joinDate: '2023-03-15'
  },
  {
    id: 'mike-fodmap',
    email: 'mike.fodmap@test.com',
    name: 'Mike Chen',
    avatar: '👨‍💻',
    protocol: 'Low FODMAP',
    entries: '1,215 entries',
    joinDate: '2023-01-20'
  },
  {
    id: 'lisa-histamine',
    email: 'lisa.histamine@test.com',
    name: 'Lisa Rodriguez',
    avatar: '👩‍🔬',
    protocol: 'Low Histamine',
    entries: '933 entries',
    joinDate: '2023-05-10'
  },
  {
    id: 'john-paleo',
    email: 'john.paleo@test.com',
    name: 'John Williams',
    avatar: '👨‍🍳',
    protocol: 'Paleo AIP',
    entries: '970 entries',
    joinDate: '2023-02-28'
  },
  {
    id: 'emma-multi',
    email: 'emma.multi@test.com',
    name: 'Emma Davis',
    avatar: '👩‍⚕️',
    protocol: 'Multiple Protocols',
    entries: '1,071 entries',
    joinDate: '2023-04-05'
  }
];

// Dual-Track Auth Provider Component
export const SimpleAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null); // 'demo' or 'real'

  // Authentication state
  const isAuthenticated = !!currentUser;
  const isDemoMode = userType === 'demo';
  const isRealUser = userType === 'real';

  // Get auth token for API calls
  const getAuthToken = React.useCallback(() => {
    if (isRealUser) {
      return sessionStorage.getItem('auth_token');
    }
    return null; // Demo users don't use JWT tokens
  }, [isRealUser]);

  // Get auth headers for API calls
  const getAuthHeaders = React.useCallback(() => {
    if (isRealUser) {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } else if (isDemoMode && currentUser) {
      // Demo users use special headers
      return {
        'x-demo-mode': 'true',
        'x-demo-user-id': currentUser.id
      };
    }
    return {};
  }, [isRealUser, isDemoMode, currentUser, getAuthToken]);

  // Get current user context for API calls
  const getUserContext = React.useCallback(() => {
    if (!currentUser) return null;
    
    return {
      userId: currentUser.id,
      email: currentUser.email,
      sessionId: currentUser.sessionId,
      isDemo: isDemoMode,
      userType: userType
    };
  }, [currentUser, isDemoMode, userType]);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Connect API client when auth state changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Set up API client with auth headers
      simpleApiClient.setHeaderGetter(getAuthHeaders);
      simpleApiClient.setTokenGetter(getAuthToken);
      
      // Set user context for legacy support
      const userContext = getUserContext();
      simpleApiClient.setUserContext(userContext);
      
      safeLogger.debug('API client connected to auth', { 
        userId: currentUser.id, 
        userType 
      });
    } else {
      // Clear API client auth when logged out
      simpleApiClient.clearUserContext();
      safeLogger.debug('API client auth cleared');
    }
  }, [isAuthenticated, currentUser, userType, getAuthHeaders, getAuthToken, getUserContext]);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check for demo user in sessionStorage
      const demoUser = sessionStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        setCurrentUser(user);
        setUserType('demo');
        safeLogger.debug('Demo user session restored', { userId: user.id });
        return;
      }

      // Check for real user with Cognito
      try {
        const cognitoUser = await getCurrentUser();
        if (cognitoUser) {
          const session = await fetchAuthSession();
          const token = session.tokens?.accessToken?.toString();
          
          if (token) {
            const realUser = {
              id: cognitoUser.userId,
              email: cognitoUser.signInDetails?.loginId || cognitoUser.username,
              name: cognitoUser.signInDetails?.loginId || cognitoUser.username,
              isDemo: false,
              cognitoUser: cognitoUser
            };
            
            setCurrentUser(realUser);
            setUserType('real');
            
            // Store token for API calls
            sessionStorage.setItem('auth_token', token);
            
            safeLogger.auth('Real user session restored', { userId: realUser.id });
          }
        }
      } catch (cognitoError) {
        // No Cognito user found - this is normal
        safeLogger.debug('No Cognito user session found');
      }
      
    } catch (error) {
      safeLogger.error('Auth initialization failed', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Generate session ID for demo users
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Demo user login
  const loginDemo = async (email, password = 'demo123') => {
    try {
      setLoading(true);
      setError(null);
      
      safeLogger.auth('Demo login attempt', { email });
      
      // Find demo user by email
      const demoUser = DEMO_USERS.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!demoUser) {
        throw new Error('Demo user not found. Please use one of the provided demo accounts.');
      }
      
      // Create demo session user
      const sessionUser = {
        ...demoUser,
        sessionId: generateSessionId(),
        loginTime: new Date().toISOString(),
        isDemo: true
      };
      
      // Store demo user data
      setCurrentUser(sessionUser);
      setUserType('demo');
      sessionStorage.setItem('demo_user', JSON.stringify(sessionUser));
      
      safeLogger.auth('Demo login successful', { 
        userId: sessionUser.id,
        name: sessionUser.name
      });
      
      return { success: true, user: sessionUser };
      
    } catch (error) {
      safeLogger.error('Demo login failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Real user login with Cognito
  const loginReal = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      safeLogger.auth('Real user login attempt', { email });
      
      // Sign in with Cognito
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password
      });
      
      if (isSignedIn) {
        // Get user info and session
        const cognitoUser = await getCurrentUser();
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        
        if (token) {
          const realUser = {
            id: cognitoUser.userId,
            email: email,
            name: email, // Can be enhanced with user attributes
            isDemo: false,
            cognitoUser: cognitoUser
          };
          
          // Store user and token
          setCurrentUser(realUser);
          setUserType('real');
          sessionStorage.setItem('auth_token', token);
          
          safeLogger.auth('Real user login successful', { userId: realUser.id });
          
          return { success: true, user: realUser };
        }
      } else {
        // Handle additional auth steps (MFA, etc.)
        throw new Error(`Additional authentication required: ${nextStep.signInStep}`);
      }
      
    } catch (error) {
      safeLogger.error('Real user login failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Unified login function
  const login = async (email, password, type = 'demo') => {
    if (type === 'demo') {
      return await loginDemo(email, password);
    } else if (type === 'real') {
      return await loginReal(email, password);
    } else {
      throw new Error('Invalid login type. Use "demo" or "real".');
    }
  };

  // Unified logout function
  const logout = async () => {
    try {
      safeLogger.auth('Logout initiated', { userId: currentUser?.id, userType });
      
      if (isRealUser) {
        // Sign out from Cognito
        await signOut();
        sessionStorage.removeItem('auth_token');
      } else if (isDemoMode) {
        // Clear demo user data
        sessionStorage.removeItem('demo_user');
      }
      
      // Clear all auth state
      setCurrentUser(null);
      setUserType(null);
      setError(null);
      
      safeLogger.auth('Logout successful');
      
    } catch (error) {
      safeLogger.error('Logout failed', { error: error.message });
      // Clear state anyway
      setCurrentUser(null);
      setUserType(null);
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('demo_user');
    }
  };

  // Get auth token for API calls
  const getAuthToken = React.useCallback(() => {
    if (isRealUser) {
      return sessionStorage.getItem('auth_token');
    }
    return null; // Demo users don't use JWT tokens
  }, [isRealUser]);

  // Get auth headers for API calls
  const getAuthHeaders = React.useCallback(() => {
    if (isRealUser) {
      const token = getAuthToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } else if (isDemoMode && currentUser) {
      // Demo users use special headers
      return {
        'x-demo-mode': 'true',
        'x-demo-user-id': currentUser.id
      };
    }
    return {};
  }, [isRealUser, isDemoMode, currentUser, getAuthToken]);

  // Get current user context for API calls
  const getUserContext = React.useCallback(() => {
    if (!currentUser) return null;
    
    return {
      userId: currentUser.id,
      email: currentUser.email,
      sessionId: currentUser.sessionId,
      isDemo: isDemoMode,
      userType: userType
    };
  }, [currentUser, isDemoMode, userType]);

  // Auth context value
  const value = {
    // State
    user: currentUser,
    loading,
    error,
    isAuthenticated,
    isDemoMode,
    isRealUser,
    userType,
    
    // Actions
    login,
    loginDemo,
    loginReal,
    logout,
    getUserContext,
    getAuthToken,
    getAuthHeaders,
    setError,
    
    // Demo users for UI
    demoUsers: DEMO_USERS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

// Export context for advanced usage
export { AuthContext };
