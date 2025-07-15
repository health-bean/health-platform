// File: frontend/web-app/src/components/pages/SimpleLoginPage.jsx
// Clean, simple login page for health platform prototype

import React, { useState } from 'react';
import { Rocket, AlertTriangle, User, Shield } from 'lucide-react';
import { Button, Alert, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useSimpleAuth } from '../../../../shared/components/SimpleAuthProvider';

const SimpleLoginPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError, demoUsers } = useSimpleAuth();

  const handleDemoLogin = async (demoUser) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedUser(demoUser.id);
      
      const result = await login(demoUser.email, 'demo123');
      
      if (!result.success) {
        console.error('Login failed:', result.error);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
    }
  };

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
              onClick={() => !isLoading && handleDemoLogin(user)}
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
              
              {selectedUser === user.id && isLoading && (
                <div className="mt-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-sm text-primary-600">Logging in...</span>
                </div>
              )}
            </Card>
          ))}
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
