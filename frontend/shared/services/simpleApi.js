// File: frontend/shared/services/simpleApi.js
// Clean, simple API client for health platform prototype

import safeLogger from '../utils/safeLogger';

class SimpleApiClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.userContext = null;
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
    safeLogger.debug('API user context cleared');
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add user context to headers for demo mode
    if (this.userContext) {
      headers['X-Demo-User-Id'] = this.userContext.userId;
      headers['X-Demo-Session-Id'] = this.userContext.sessionId;
      headers['X-Demo-Mode'] = 'true';
      
      safeLogger.debug('API headers with demo context', { 
        userId: this.userContext.userId 
      });
    }

    return headers;
  }

  // Main request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

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
