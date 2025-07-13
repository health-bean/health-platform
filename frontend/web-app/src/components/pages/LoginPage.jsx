// File: frontend/web-app/src/components/pages/LoginPage.jsx
// CACHE BUST: v3.0 - TIMESTAMP: 2025-07-13-15:45:00
// FORCE RELOAD: Password should NOT auto-fill

import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, Rocket, AlertTriangle } from 'lucide-react';
import { Button, Input, Alert, FormField, PasswordInput, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import useAuth from '../../../../shared/hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // CRITICAL DEBUG: Log every render
  console.log('🔍 RENDER: LoginPage rendered, password state:', password);
  console.log('🔍 RENDER: Timestamp:', new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoWarning, setShowDemoWarning] = useState(false);
  const { login, error, setError, isDemoMode } = useAuth();

  // Demo user accounts for investor presentation
  const demoUsers = [
    {
      email: 'sarah.aip@test.com',
      name: 'Sarah Johnson',
      avatar: '👩‍💼',
      entries: '1,052 entries'
    },
    {
      email: 'mike.fodmap@test.com',
      name: 'Mike Chen',
      avatar: '👨‍💻',
      entries: '1,215 entries'
    },
    {
      email: 'lisa.histamine@test.com',
      name: 'Lisa Rodriguez',
      avatar: '👩‍🔬',
      entries: '933 entries'
    },
    {
      email: 'john.paleo@test.com',
      name: 'John Williams',
      avatar: '👨‍🍳',
      entries: '970 entries'
    },
    {
      email: 'emma.multi@test.com',
      name: 'Emma Davis',
      avatar: '👩‍⚕️',
      entries: '1,071 entries'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear password field on mount to ensure clean state
  useEffect(() => {
    setPassword('');
  }, []);

  const handleDemoLogin = (demoEmail) => {
    console.log('🔍 DEBUG v3.0: handleDemoLogin called with:', demoEmail);
    console.log('🔍 DEBUG v3.0: Current password value before clear:', password);
    setEmail(demoEmail);
    // SECURITY: Don't auto-fill password - user must enter it
    setPassword('');
    console.log('🔍 DEBUG v3.0: setPassword("") called - should be empty now');
    setError(null);
    setShowDemoWarning(true);
    
    // Force re-render to ensure state update
    setTimeout(() => {
      console.log('🔍 DEBUG v3.0: Password value after timeout:', password);
    }, 100);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header - Using design system colors */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Your Personal Health Journey</p>
      </div>

      {/* Login Form */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Welcome Back
        </h2>

        {error && (
          <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Security Notice for All Users */}
        {showDemoWarning && (
          <Alert variant="info" className="mb-4" dismissible onDismiss={() => setShowDemoWarning(false)}>
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Secure Session - Privacy Protected</p>
                <p className="text-sm mt-1">
                  Your health data session is temporary and will not persist after closing the browser. 
                  This ensures maximum privacy protection for your personal medical information.
                </p>
              </div>
            </div>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <FormField label="Email Address" required>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
                disabled={isLoading}
                name="user-email"
                autoComplete="off"
              />
            </div>
          </FormField>

          <FormField label="Password" required>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <PasswordInput
                data-testid="login-password-input"
                data-debug="main-login-form"
                value={password}
                onChange={(e) => {
                  console.log('🔍 Password input onChange:', e.target.value);
                  setPassword(e.target.value);
                }}
                placeholder="Enter your password"
                className="pl-10"
                disabled={isLoading}
                name="user-password"
                autoComplete="off"
              />
            </div>
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Users Section */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {demoUsers.map((user, index) => (
              <Card 
                key={index} 
                variant="outlined" 
                padding="sm"
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300",
                  "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
                )}
                onClick={() => handleDemoLogin(user.email)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{user.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.entries}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Password: demo1234
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      Demo
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Secure
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Demo accounts showcase different health protocols and data patterns.
              <br />
              <strong>All sessions are secure:</strong> Health data automatically cleared when browser closes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
