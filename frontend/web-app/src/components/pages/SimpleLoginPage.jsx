// File: frontend/web-app/src/components/pages/SimpleLoginPage.jsx
// Clean, simple login page for health platform prototype

import React, { useState } from 'react';
import { Rocket, AlertTriangle, User, Shield } from 'lucide-react';
import { Button, Alert, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useSimpleAuth } from '../auth/SimpleAuthProvider';

const SimpleLoginPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState('demo'); // 'demo' or 'real'
  const { login, error, setError, demoUsers } = useSimpleAuth();

  const handleUserSelect = (demoUser) => {
    setSelectedUser(demoUser);
    setEmail(demoUser.email);
    setPassword(''); // Clear password field
    setLoginType('demo');
    setShowLoginForm(true);
    setError(null);
  };

  const handleRealUserLogin = () => {
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setLoginType('real');
    setShowLoginForm(true);
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await login(email, password, loginType);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowLoginForm(false);
    setSelectedUser(null);
    setEmail('');
    setPassword('');
    setError(null);
  };

  // Show login form when user is selected
  if (showLoginForm) {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="mr-2" size={32} />
            <h1 className="text-2xl font-bold">FILO Health</h1>
          </div>
          <p className="text-primary-100">Your Personal Health Journey</p>
        </div>

        {/* Login Form */}
        <div className="p-6 max-w-md mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="text-blue-600 hover:text-blue-800 mr-3"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {loginType === 'demo' ? `Login as ${selectedUser?.name}` : 'Login with Cognito'}
            </h2>
          </div>

          {error && (
            <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* User Info for Demo Login */}
          {loginType === 'demo' && selectedUser && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{selectedUser.avatar}</div>
                <div>
                  <p className="font-medium text-blue-900">{selectedUser.name}</p>
                  <p className="text-sm text-blue-700">{selectedUser.protocol}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                required
                disabled={loginType === 'demo'} // Pre-filled for demo users
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Switch to Real User Login */}
          {loginType === 'demo' && (
            <div className="mt-6 text-center">
              <button
                onClick={handleRealUserLogin}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Login with real Cognito account instead
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Your Personal Health Journey</p>
        <p className="text-primary-200 text-sm mt-2">Prototype Demo - Incognito Optimized</p>
      </div>

      {/* Content */}
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Choose Demo Account
        </h2>

        {error && (
          <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Privacy Notice */}
        <Alert variant="info" className="mb-6">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Privacy-First Design</p>
              <p className="text-sm mt-1">
                Perfect for incognito mode. All data is session-only and automatically 
                cleared when you close the browser. No persistent tracking.
              </p>
            </div>
          </div>
        </Alert>

        {/* Demo Users */}
        <div className="space-y-3">
          {demoUsers.map((user) => (
            <Card 
              key={user.id} 
              variant="outlined" 
              padding="sm"
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary-300",
                "focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2",
                selectedUser === user.id && "border-primary-500 bg-primary-50",
                isLoading && selectedUser !== user.id && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isLoading && handleUserSelect(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{user.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.protocol}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user.entries}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Demo
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Private
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Real User Login Option */}
        <div className="mt-6">
          <button
            onClick={handleRealUserLogin}
            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Login with Cognito Account</span>
            </div>
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Demo Account Access</span>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Session:</strong> Automatically cleared on browser close</p>
            <p><strong>Data:</strong> Demo data showcasing different health protocols</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Prototype Features</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div>✓ Timeline Tracking</div>
            <div>✓ Daily Reflections</div>
            <div>✓ Protocol Foods</div>
            <div>✓ Health Insights</div>
            <div>✓ Symptom Patterns</div>
            <div>✓ Progress Analytics</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLoginPage;
