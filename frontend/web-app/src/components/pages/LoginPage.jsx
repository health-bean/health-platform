// File: frontend/web-app/src/components/pages/LoginPage.jsx

import React, { useState } from 'react';
import { Loader2, Mail, Lock, Rocket } from 'lucide-react';
import { Button, Input, Alert } from '../../../../shared/components/ui';
import useAuth from '../../../../shared/hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();

  // Demo user accounts for investor presentation
  const demoUsers = [
    {
      email: 'sarah.aip@test.com',
      name: 'Sarah Johnson',
      protocol: 'Autoimmune Protocol (AIP)',
      avatar: '👩‍💼',
      entries: '1,052 entries'
    },
    {
      email: 'mike.fodmap@test.com',
      name: 'Mike Chen',
      protocol: 'Low FODMAP Diet',
      avatar: '👨‍💻',
      entries: '1,215 entries'
    },
    {
      email: 'lisa.histamine@test.com',
      name: 'Lisa Rodriguez',
      protocol: 'Low Histamine Diet',
      avatar: '👩‍🔬',
      entries: '933 entries'
    },
    {
      email: 'john.paleo@test.com',
      name: 'John Williams',
      protocol: 'Paleo Protocol',
      avatar: '👨‍🍳',
      entries: '970 entries'
    },
    {
      email: 'emma.multi@test.com',
      name: 'Emma Davis',
      protocol: 'Multi-Protocol',
      avatar: '👩‍⚕️',
      entries: '1,071 entries'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        console.log('Login successful, redirecting to app...');
        // Auth provider will handle state change, App.jsx will re-render
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoUserClick = (userEmail) => {
    setEmail(userEmail);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-blue-100">Your Personal Health Journey</p>
      </div>

      {/* Login Form */}
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="text-sm">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Demo Users Section */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">
              Click any user to demo their health journey
            </p>
            
            {demoUsers.map((user, index) => (
              <div
                key={index}
                onClick={() => handleDemoUserClick(user.email)}
                className="cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{user.avatar}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-blue-600">{user.protocol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">{user.entries}</div>
                    <div className="text-xs text-gray-500">6+ months</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              🔐 <strong>Password:</strong> demo123
            </p>
            <p className="text-xs text-gray-500 text-center mt-1">
              All demo accounts use the same password for easy access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;