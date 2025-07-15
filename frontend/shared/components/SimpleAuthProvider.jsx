// File: frontend/shared/components/SimpleAuthProvider.jsx
// Clean, incognito-optimized authentication for health platform prototype

import React, { createContext, useContext, useState } from 'react';
import safeLogger from '../utils/safeLogger';

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

// Simple Auth Provider Component
export const SimpleAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simple authentication state
  const isAuthenticated = !!currentUser;
  const isDemoMode = true; // Always demo mode for prototype

  // Generate simple session ID for tracking
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Simple login - just set the user
  const login = async (email, password = 'demo123') => {
    try {
      setLoading(true);
      setError(null);
      
      safeLogger.info('Simple login attempt', { email });
      
      // Find demo user by email
      const demoUser = DEMO_USERS.find(user => 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (!demoUser) {
        throw new Error('Demo user not found. Please use one of the provided demo accounts.');
      }
      
      // Validate demo password (simple check for prototype)
      if (password !== 'demo123') {
        throw new Error('Invalid password. Use "demo123" for all demo accounts.');
      }
      
      // Create session user object
      const sessionUser = {
        ...demoUser,
        sessionId: generateSessionId(),
        loginTime: new Date().toISOString(),
        isDemo: true
      };
      
      setCurrentUser(sessionUser);
      
      safeLogger.info('Simple login successful', { 
        userId: sessionUser.id,
        name: sessionUser.name,
        sessionId: sessionUser.sessionId
      });
      
      return { success: true, user: sessionUser };
      
    } catch (error) {
      safeLogger.error('Simple login failed', { error: error.message, email });
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Simple logout - just clear the user
  const logout = () => {
    safeLogger.info('Simple logout', { userId: currentUser?.id });
    setCurrentUser(null);
    setError(null);
  };

  // Get current user info for API calls
  const getUserContext = () => {
    if (!currentUser) return null;
    
    return {
      userId: currentUser.id,
      email: currentUser.email,
      sessionId: currentUser.sessionId,
      isDemo: true
    };
  };

  // Simple auth context value
  const value = {
    // State
    user: currentUser,
    loading,
    error,
    isAuthenticated,
    isDemoMode,
    
    // Actions
    login,
    logout,
    getUserContext,
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
