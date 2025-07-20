// File: frontend/web-app/src/components/debug/AuthDebugger.jsx
// Simple component to debug authentication issues

import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '../auth/SimpleAuthProvider';
import { simpleApiClient } from '../../../../shared/services/simpleApi';

export const AuthDebugger = () => {
  const auth = useSimpleAuth();
  const [token, setToken] = useState('');
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Get current auth token
  useEffect(() => {
    const storedToken = sessionStorage.getItem('auth_token');
    setToken(storedToken || 'No token found');
  }, []);

  // Test API endpoints
  const testEndpoint = async (endpoint) => {
    setLoading(true);
    try {
      const result = await simpleApiClient.get(endpoint);
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { success: true, data: result }
      }));
      return { success: true, data: result };
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [endpoint]: { success: false, error: error.message }
      }));
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fix auth headers
  const fixAuthHeaders = () => {
    // Force refresh the token
    const storedToken = sessionStorage.getItem('auth_token');
    console.log('🔧 Current token:', storedToken ? `length: ${storedToken.length}` : 'none');
    
    // Ensure API client has the correct auth headers
    simpleApiClient.setHeaderGetter(() => {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        console.log('🔧 Setting Authorization header with token length:', token.length);
        return { Authorization: `Bearer ${token}` };
      }
      return {};
    });
    
    // Set user context
    if (auth.user) {
      simpleApiClient.setUserContext({
        userId: auth.user.id,
        email: auth.user.email,
        isDemo: auth.authMode === 'demo'
      });
    }
    
    console.log('🔧 Auth headers fixed');
    
    // Update displayed token
    setToken(storedToken || 'No token found');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Authentication Debugger</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current User</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(auth.user, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth Mode</h3>
        <p><strong>{auth.authMode || 'Not set'}</strong></p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Auth Token</h3>
        <p>{token ? `Token exists (length: ${token.length})` : 'No token'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={fixAuthHeaders}
          style={{ 
            padding: '8px 16px', 
            background: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Fix Auth Headers
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/protocols')}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test Protocols API
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/user/preferences')}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test User Preferences API
        </button>
        
        <button 
          onClick={() => testEndpoint('/api/v1/timeline/entries?date=2025-07-20')}
          style={{ 
            padding: '8px 16px', 
            background: '#2196F3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px'
          }}
          disabled={loading}
        >
          Test Timeline API
        </button>
      </div>
      
      <div>
        <h3>Test Results</h3>
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div key={endpoint} style={{ marginBottom: '15px' }}>
            <h4>{endpoint}</h4>
            <div style={{ 
              background: result.success ? '#E8F5E9' : '#FFEBEE', 
              padding: '10px', 
              borderRadius: '4px' 
            }}>
              <p><strong>Status:</strong> {result.success ? 'Success' : 'Error'}</p>
              {result.error && <p><strong>Error:</strong> {result.error}</p>}
              {result.data && (
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthDebugger;
