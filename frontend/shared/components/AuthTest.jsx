// File: frontend/shared/components/AuthTest.jsx
// Simple test component to verify authentication is working

import React, { useState } from 'react';
import { useSimpleAuth } from './SimpleAuthProvider.jsx';
import { simpleApiClient } from '../services/simpleApi.js';
import { Badge, Alert, Button } from './ui';
import safeLogger from '../utils/safeLogger';

const AuthTest = () => {
  const { 
    user, 
    isAuthenticated, 
    isDemoMode, 
    isRealUser, 
    login, 
    logout, 
    loading, 
    error,
    demoUsers 
  } = useSimpleAuth();

  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  // Test API call
  const testApiCall = async () => {
    try {
      setTesting(true);
      const result = await simpleApiClient.get('/api/v1/user/preferences');
      setTestResults(prev => [...prev, {
        type: 'success',
        message: 'API call successful',
        data: result
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: `API call failed: ${error.message}`,
        error: error
      }]);
    } finally {
      setTesting(false);
    }
  };

  // Test demo login
  const testDemoLogin = async () => {
    try {
      const result = await login(demoUsers[0].email, 'demo123', 'demo');
      setTestResults(prev => [...prev, {
        type: result.success ? 'success' : 'error',
        message: result.success ? 'Demo login successful' : `Demo login failed: ${result.error}`,
        data: result
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        type: 'error',
        message: `Demo login error: ${error.message}`,
        error: error
      }]);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔧 Authentication Test Panel</h2>
        
        {/* Current Auth Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Current Authentication Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span> 
              <Badge variant={isAuthenticated ? "success" : "error"}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">User Type:</span> 
              <Badge variant="info">
                {isDemoMode ? '🎭 Demo' : isRealUser ? '👤 Real' : '❓ None'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">User ID:</span> 
              <span className="ml-2 text-gray-600">{user?.id || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span> 
              <span className="ml-2 text-gray-600">{user?.email || 'None'}</span>
            </div>
          </div>
          
          {loading && (
            <div className="mt-3 text-blue-600">
              🔄 Loading authentication state...
            </div>
          )}
          
          {error && (
            <Alert variant="error" className="mt-3">
              ❌ Error: {error}
            </Alert>
          )}
        </div>

        {/* Test Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            {!isAuthenticated && (
              <button
                onClick={testDemoLogin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                🎭 Test Demo Login
              </button>
            )}
            
            {isAuthenticated && (
              <>
                <button
                  onClick={testApiCall}
                  disabled={testing}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {testing ? '🔄 Testing...' : '🔗 Test API Call'}
                </button>
                
                <button
                  onClick={logout}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  🚪 Logout
                </button>
              </>
            )}
            
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              🗑️ Clear Results
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Test Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="font-medium">
                    {result.type === 'success' ? '✅' : '❌'} {result.message}
                  </div>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm opacity-75">Show Details</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demo Users List */}
        {!isAuthenticated && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Available Demo Users</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoUsers.map((demoUser) => (
                <div key={demoUser.id} className="p-3 bg-gray-50 rounded border">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{demoUser.avatar}</span>
                    <div>
                      <div className="font-medium">{demoUser.name}</div>
                      <div className="text-sm text-gray-600">{demoUser.email}</div>
                      <div className="text-xs text-gray-500">{demoUser.protocol}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTest;