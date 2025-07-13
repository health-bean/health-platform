class ApiConfig {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.environment = import.meta.env.VITE_APP_ENV || 'development';
    this.authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
    this.isLocal = this.environment === 'development' && this.baseURL.includes('localhost');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth headers when auth is enabled
    if (this.authEnabled) {
      const token = this.getAuthToken();
      console.log('🔍 API Client authEnabled:', this.authEnabled, 'token:', token ? 'present' : 'missing');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔍 API Client added Authorization header');
      } else {
        console.log('🔍 API Client no token available for Authorization header');
      }
    }

    return headers;
  }

  getAuthToken() {
    // SECURITY: Use sessionStorage for health data privacy
    const token = sessionStorage.getItem('auth_token');
    console.log('🔍 API Client getAuthToken():', token ? 'Token found' : 'No token found');
    return token || null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always get fresh headers (including token) for each request
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log(`[API] ${options.method || 'GET'} ${endpoint}`);
      console.log('🔍 API Request headers:', config.headers);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401 || response.status === 403) {
          if (this.authEnabled) {
            // Will trigger login flow when auth is implemented
            console.warn('Authentication required');
            // For now, just throw the error
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      
      // In local development without auth, provide helpful error messages
      if (this.isLocal && !this.authEnabled && error.message.includes('CORS')) {
        console.error('💡 CORS Error: Make sure vite proxy is configured correctly');
      }
      
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Safe JSON serialization that handles circular references
  safeStringify(data) {
    const seen = new WeakSet();
    return JSON.stringify(data, (key, value) => {
      // Skip React-specific properties that cause circular references
      if (key.startsWith('__react') || key.startsWith('_react') || key === 'stateNode') {
        return undefined;
      }
      
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      
      // Skip functions and DOM elements
      if (typeof value === 'function' || 
          (value && typeof value === 'object' && value.nodeType)) {
        return undefined;
      }
      
      return value;
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: this.safeStringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT', 
      body: this.safeStringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiConfig();

// Export environment helpers
export const isProduction = () => import.meta.env.VITE_APP_ENV === 'production';
export const isDevelopment = () => import.meta.env.VITE_APP_ENV === 'development';
export const isAuthEnabled = () => import.meta.env.VITE_AUTH_ENABLED === 'true';
