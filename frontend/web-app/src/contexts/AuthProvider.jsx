import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signUp, confirmSignUp as amplifyConfirmSignUp, resendSignUpCode, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const cognitoUser = await getCurrentUser();
      if (cognitoUser) {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        setUser({
          id: cognitoUser.userId,
          email: cognitoUser.signInDetails?.loginId || 'unknown@cognito.com',
          name: cognitoUser.username,
          token
        });
      }
    } catch (error) {
      // No current user - normal for logged out state
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        const cognitoUser = await getCurrentUser();
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        const userData = {
          id: cognitoUser.userId,
          email: email,
          name: cognitoUser.username,
          token
        };
        
        setUser(userData);
        return { success: true, user: userData };
      } else {
        // Check if user needs confirmation
        if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
          return { success: false, error: 'CONFIRMATION_REQUIRED' };
        }
        return { success: false, error: 'Sign in not completed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email, password, firstName, lastName) => {
    try {
      const result = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            given_name: firstName,
            family_name: lastName
          }
        }
      });
      
      return { 
        success: true, 
        needsConfirmation: result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const resendConfirmationCode = async (email) => {
    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Ignore errors
    }
    setUser(null);
  };

  // Helper methods for API integration
  const getUserContext = () => {
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      token: user.token,
      isDemo: false // This is real auth, not demo
    };
  };

  const getAuthToken = () => {
    return user?.token || null;
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    confirmSignUp,
    resendConfirmationCode,
    logout,
    getUserContext,
    getAuthToken,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};