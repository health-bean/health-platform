// File: frontend/web-app/src/components/auth/SimpleAuthProvider.jsx
// Authentication provider with Cognito as primary path and demo mode as secondary option

import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import safeLogger from '../../../../shared/utils/safeLogger';
import { simpleApiClient } from '../../../../shared/services/simpleApi.js';

// Amplify is already configured in amplifyInit.js
console.log('🔧 SimpleAuthProvider loaded - using centralized Amplify config');

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

// Auth Provider Component
export const SimpleAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'standard' or 'demo'

  // Authentication state
  const isAuthenticated = !!currentUser;
  const isDemoMode = authMode === 'demo';

  // Get auth token for API calls
  const getAuthToken = React.useCallback(() => {
    if (!isDemoMode) {
      const token = sessionStorage.getItem('auth_token');
      console.log('🔑 getAuthToken called, token exists:', !!token, token ? `length: ${token.length}` : 'no token');
      return token;
    }
    return null; // Demo users don't use JWT tokens
  }, [isDemoMode]);

  // Get auth headers for API calls
  const getAuthHeaders = React.useCallback(() => {
    if (!isDemoMode) {
      // Standard Cognito authentication
      const token = getAuthToken();
      console.log('🔑 getAuthHeaders for standard user, token exists:', !!token);
      if (token) {
        console.log('🔑 Adding Authorization header with Bearer token');
        return { Authorization: `Bearer ${token}` };
      } else {
        console.log('🔑 No token available for Authorization header');
        return {};
      }
    } else if (isDemoMode && currentUser) {
      // Demo mode headers
      console.log('🔑 Adding demo headers for user:', currentUser.id);
      return {
        'x-demo-mode': 'true',
        'x-demo-user-id': currentUser.id
      };
    }
    console.log('🔑 No auth headers added - not authenticated');
    return {};
  }, [isDemoMode, currentUser, getAuthToken]);

  // Get current user context for API calls
  const getUserContext = React.useCallback(() => {
    if (!currentUser) return null;
    
    return {
      userId: currentUser.id,
      email: currentUser.email,
      sessionId: currentUser.sessionId,
      isDemo: isDemoMode,
      authMode: authMode
    };
  }, [currentUser, isDemoMode, authMode]);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // First try to restore Cognito session (primary auth path)
      if (getCurrentUser && fetchAuthSession) {
        try {
          const cognitoUser = await getCurrentUser();
          if (cognitoUser) {
            console.log('🔑 Cognito user found during initialization:', cognitoUser.userId);
            
            const session = await fetchAuthSession();
            console.log('🔑 Session obtained during initialization:', !!session);
            console.log('🔑 Session tokens:', !!session.tokens);
            console.log('🔑 Access token:', !!session.tokens?.accessToken);
            
            const token = session.tokens?.accessToken?.toString();
            console.log('🔑 Token extracted during initialization:', !!token, token ? `length: ${token.length}` : 'no token');
            
            if (token) {
              const standardUser = {
                id: cognitoUser.userId,
                email: cognitoUser.signInDetails?.loginId || cognitoUser.username,
                name: cognitoUser.signInDetails?.loginId || cognitoUser.username,
                cognitoUser: cognitoUser
              };
              
              setCurrentUser(standardUser);
              setAuthMode('standard');
              
              // Store token for API calls
              sessionStorage.setItem('auth_token', token);
              
              // Verify token was stored correctly
              const storedToken = sessionStorage.getItem('auth_token');
              console.log('🔑 Token stored in sessionStorage during initialization:', !!storedToken, storedToken ? `length: ${storedToken.length}` : 'failed');
              
              safeLogger.debug('Standard user session restored', { userId: standardUser.id });
              return;
            } else {
              console.log('🔑 No token available during initialization');
            }
          }
        } catch (cognitoError) {
          // No Cognito user found - this is normal
          safeLogger.debug('No Cognito user session found');
        }
      }

      // If no Cognito session, check for demo user in sessionStorage
      const demoUser = sessionStorage.getItem('demo_user');
      if (demoUser) {
        const user = JSON.parse(demoUser);
        setCurrentUser(user);
        setAuthMode('demo');
        safeLogger.debug('Demo user session restored', { userId: user.id });
        return;
      }
      
    } catch (error) {
      safeLogger.error('Auth initialization failed', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

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
        authMode,
        isDemo: isDemoMode
      });
    } else {
      // Clear API client auth when logged out
      simpleApiClient.clearUserContext();
      safeLogger.debug('API client auth cleared');
    }
  }, [isAuthenticated, currentUser, authMode, getAuthHeaders, getAuthToken, getUserContext, isDemoMode]);

  // Generate session ID for demo users
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Standard login with Cognito
  const loginStandard = async (email, password) => {
    if (!signIn) {
      throw new Error('Cognito authentication not available');
    }

    try {
      setLoading(true);
      setError(null);
      
      safeLogger.debug('Standard user login attempt', { email });
      
      // Sign in with Cognito using USER_SRP_AUTH flow to avoid device tracking issues
      const signInResult = await signIn({
        username: email,
        password: password,
        options: {
          authFlowType: 'USER_SRP_AUTH'
        }
      });
      
      console.log('Sign in result:', signInResult);
      
      if (signInResult.isSignedIn) {
        // Get user info and session
        const cognitoUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        console.log('🔑 Session obtained:', !!session);
        console.log('🔑 Session tokens:', !!session.tokens);
        console.log('🔑 Access token:', !!session.tokens?.accessToken);
        
        const token = session.tokens?.accessToken?.toString();
        
        console.log('🔑 Token extracted:', !!token, token ? `length: ${token.length}` : 'no token');
        
        if (token) {
          const standardUser = {
            id: cognitoUser.userId,
            email: email,
            name: email, // Can be enhanced with user attributes
            cognitoUser: cognitoUser
          };
          
          // Store user and token
          setCurrentUser(standardUser);
          setAuthMode('standard');
          
          // Store token in sessionStorage
          sessionStorage.setItem('auth_token', token);
          
          // Verify token was stored correctly
          const storedToken = sessionStorage.getItem('auth_token');
          console.log('🔑 Token stored in sessionStorage:', !!storedToken, storedToken ? `length: ${storedToken.length}` : 'failed');
          
          safeLogger.debug('Standard user login successful', { userId: standardUser.id });
          
          return { success: true, user: standardUser };
        } else {
          throw new Error('Failed to obtain authentication token');
        }
      } else {
        // Handle additional auth steps (MFA, etc.)
        throw new Error(`Additional authentication required: ${signInResult.nextStep?.signInStep}`);
      }
      
    } catch (error) {
      safeLogger.error('Standard user login failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Demo user login
  const loginDemo = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      safeLogger.debug('Demo login attempt', { email });
      
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
        loginTime: new Date().toISOString()
      };
      
      // Store demo user data
      setCurrentUser(sessionUser);
      setAuthMode('demo');
      sessionStorage.setItem('demo_user', JSON.stringify(sessionUser));
      
      safeLogger.debug('Demo login successful', { 
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

  // Unified login function
  const login = async (email, password, mode = 'standard') => {
    if (mode === 'demo') {
      return await loginDemo(email);
    } else {
      return await loginStandard(email, password);
    }
  };

  // Unified logout function
  const logout = async () => {
    try {
      safeLogger.debug('Logout initiated', { userId: currentUser?.id, authMode });
      
      if (authMode === 'standard' && signOut) {
        // Sign out from Cognito with global option to clear all devices
        await signOut({ global: true });
        sessionStorage.removeItem('auth_token');
      } else if (authMode === 'demo') {
        // Clear demo user data
        sessionStorage.removeItem('demo_user');
      }
      
      // Clear all auth state
      setCurrentUser(null);
      setAuthMode(null);
      setError(null);
      
      safeLogger.debug('Logout successful');
      
    } catch (error) {
      safeLogger.error('Logout failed', { error: error.message });
      // Clear state anyway
      setCurrentUser(null);
      setAuthMode(null);
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('demo_user');
    }
  };

  // Auth context value
  const value = {
    // State
    user: currentUser,
    loading,
    error,
    isAuthenticated,
    isDemoMode,
    authMode,
    
    // Actions
    login,
    loginStandard,
    loginDemo,
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
