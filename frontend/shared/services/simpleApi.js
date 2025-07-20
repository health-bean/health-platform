// File: frontend/shared/services/simpleApi.js
// Clean, simple API client for health platform prototype

import safeLogger from '../utils/safeLogger';

class SimpleApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.userContext = null;
    this.tokenGetter = null;
    this.headerGetter = null;
  }

  // Set token getter function (for standard users)
  setTokenGetter(tokenGetter) {
    this.tokenGetter = tokenGetter;
    safeLogger.debug('API token getter callback set');
  }

  // Set header getter function (for both standard and demo users)
  setHeaderGetter(headerGetter) {
    this.headerGetter = headerGetter;
    safeLogger.debug('API header getter set');
  }

  // Set user context for API calls
  setUserContext(userContext) {
    this.userContext = userContext;
    safeLogger.debug('API user context set', { 
      userId: userContext?.userId,
      isDemo: userContext?.isDemo 
    });
  }

  // Clear user context
  clearUserContext() {
    this.userContext = null;
    this.tokenGetter = null;
    this.headerGetter = null;
    safeLogger.debug('API user context cleared');
  }

  // Get headers for API requests
  getHeaders(additionalHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    // Use header getter if available (preferred method)
    if (this.headerGetter) {
      const authHeaders = this.headerGetter();
      Object.assign(headers, authHeaders);
      
      // Debug log the headers being sent (without sensitive info)
      const headerKeys = Object.keys(authHeaders);
      console.log('🔑 API headers from getter:', { 
        headerCount: headerKeys.length,
        hasAuthHeader: headerKeys.includes('Authorization'),
        hasDemoHeaders: headerKeys.includes('x-demo-mode'),
        headers: headerKeys.join(', ')
      });
      
      safeLogger.debug('API headers from getter', { 
        headerCount: headerKeys.length,
        hasAuthHeader: headerKeys.includes('Authorization'),
        hasDemoHeaders: headerKeys.includes('x-demo-mode')
      });
      
      return headers;
    }

    // Fallback to token getter for standard users
    if (this.tokenGetter) {
      const token = this.tokenGetter();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 API headers from token getter:', { hasToken: !!token, tokenLength: token.length });
        safeLogger.debug('API headers from token', { hasToken: !!token });
      } else {
        console.log('🔑 No token available from token getter');
      }
    }

    // Add user context to headers for demo mode
    if (this.userContext && this.userContext.isDemo) {
      headers['x-demo-mode'] = 'true';
      headers['x-demo-user-id'] = this.userContext.userId;
      if (this.userContext.sessionId) {
        headers['x-demo-session-id'] = this.userContext.sessionId;
      }
      console.log('🔑 API headers from user context:', { 
        userId: this.userContext.userId,
        isDemo: this.userContext.isDemo,
        headers: Object.keys(headers).join(', ')
      });
      safeLogger.debug('API headers from user context', { 
        userId: this.userContext.userId,
        isDemo: this.userContext.isDemo
      });
    }

    return headers;
  }

  // Main request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = this.getHeaders();
    const config = {
      headers,
      ...options,
    };

    // Log the actual headers being sent (without sensitive values)
    const headerKeys = Object.keys(headers);
    console.log('🔑 Request headers for', endpoint, {
      headerCount: headerKeys.length,
      hasAuthHeader: headerKeys.includes('Authorization'),
      hasDemoHeaders: headerKeys.includes('x-demo-mode'),
      headers: headerKeys.join(', ')
    });

    try {
      safeLogger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`, { 
        method: options.method || 'GET',
        endpoint,
        hasUserContext: !!this.userContext
      });
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle different error types
        if (response.status === 401) {
          safeLogger.warn('API authentication required', { 
            status: response.status, 
            endpoint 
          });
          throw new Error(`Authentication required for ${endpoint}`);
        }
        
        if (response.status === 404) {
          safeLogger.warn('API endpoint not found', { 
            status: response.status, 
            endpoint 
          });
          throw new Error(`Endpoint not found: ${endpoint}`);
        }
        
        if (response.status >= 500) {
          safeLogger.error('API server error', { 
            status: response.status, 
            endpoint 
          });
          throw new Error(`Server error (${response.status}): ${endpoint}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      safeLogger.debug(`API Response: ${options.method || 'GET'} ${endpoint}`, { 
        status: response.status,
        hasData: !!data
      });
      
      return data;
      
    } catch (error) {
      safeLogger.error(`API Error for ${endpoint}`, { 
        message: error.message,
        endpoint,
        method: options.method || 'GET'
      });
      
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Demo-specific methods
  async getDemoData(userId, endpoint) {
    // Add user ID to endpoint for demo data
    const demoEndpoint = `${endpoint}?demo_user=${userId}`;
    return this.get(demoEndpoint);
  }

  async saveDemoData(userId, endpoint, data) {
    // Add user ID to data for demo saves
    const demoData = {
      ...data,
      demo_user: userId,
      demo_session: this.userContext?.sessionId
    };
    return this.post(endpoint, demoData);
  }
}

// Export singleton instance
export const simpleApiClient = new SimpleApiClient();

// Export environment helpers
export const isProduction = () => import.meta.env.VITE_APP_ENV === 'production';
export const isDevelopment = () => import.meta.env.VITE_APP_ENV === 'development';
