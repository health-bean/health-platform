// File: frontend/shared/hooks/useAuth.js

import { useContext } from 'react';
import { AuthContext } from '../components/AuthProvider';

// useAuth Hook - Clean API for components
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;