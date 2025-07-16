// File: frontend/shared/hooks/useUserPreferences.js (IMPROVED)

import { useState, useEffect } from 'react';
import { simpleApiClient } from '../services/simpleApi.js';
import { useSimpleAuth } from '../components/SimpleAuthProvider.jsx';
import safeLogger from '../utils/safeLogger';

const useUserPreferences = (isAuthenticatedParam = null) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Get auth context
  const { user, isAuthenticated: authIsAuthenticated, getAuthHeaders } = useSimpleAuth();
  
  // Use parameter if provided, otherwise fall back to auth context
  const isAuthenticated = isAuthenticatedParam !== null ? isAuthenticatedParam : authIsAuthenticated;

  // Default preferences structure
  const getDefaultPreferences = () => ({
    protocols: [],
    quick_supplements: [],
    quick_medications: [],
    quick_foods: [],
    quick_symptoms: [],
    quick_detox: [],
    setup_complete: false
  });

  // Load preferences from database when user is authenticated
  useEffect(() => {
    let isCancelled = false;
    
    if (!isAuthenticated || !user) {
      setPreferences(getDefaultPreferences());
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      // Prevent duplicate calls
      if (loading && preferences === null) {
        safeLogger.debug('Already loading preferences, skipping duplicate call');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await simpleApiClient.get('/api/v1/user/preferences');
        
        // Only update state if component is still mounted
        if (isCancelled) return;
        
        // Handle both response formats: {preferences: {...}} or {...} directly
        let preferencesData = response;
        
        // If response has a preferences property, use that
        if (response && typeof response === 'object' && response.preferences) {
          preferencesData = response.preferences;
        }
        
        // Validate preferences data
        if (preferencesData && typeof preferencesData === 'object' && Object.keys(preferencesData).length > 0) {
          // Merge with defaults but preserve important flags like setup_complete
          const defaults = getDefaultPreferences();
          const mergedPreferences = { 
            ...defaults, 
            ...preferencesData,
            // Explicitly preserve setup_complete from database if it exists
            setup_complete: preferencesData.setup_complete !== undefined ? preferencesData.setup_complete : defaults.setup_complete
          };
          setPreferences(mergedPreferences);
        } else {
          setPreferences(getDefaultPreferences());
        }
      } catch (error) {
        if (!isCancelled) {
          setError('Failed to load preferences');
          setPreferences(getDefaultPreferences());
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPreferences();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user, isAuthenticatedParam]);

  const updatePreferences = async (newPreferences) => {

    if (!isAuthenticated || !user) {
      return Promise.reject(new Error('User not authenticated'));
    }

    if (!preferences) {
      return Promise.reject(new Error('Preferences not loaded'));
    }
    
    // Preserve existing preferences and only update the specified ones
    const updatedPreferences = { 
      ...preferences, 
      ...newPreferences 
    };
    
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to database
      const response = await simpleApiClient.post('/api/v1/user/preferences', updatedPreferences);
      
      
      // Handle response
      let savedPreferences = updatedPreferences;
      if (response && response.preferences) {
        savedPreferences = response.preferences;
      }
      
      // Update local state
      setPreferences(savedPreferences);
      
      return savedPreferences;
      
    } catch (error) {
      setError('Failed to save preferences');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const refreshPreferences = async () => {

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await simpleApiClient.get('/api/v1/user/preferences');
      
      
      // Handle response format
      let preferencesData = response;
      if (response && response.preferences) {
        preferencesData = response.preferences;
      }
      
      if (preferencesData && typeof preferencesData === 'object' && Object.keys(preferencesData).length > 0) {
        // Merge with defaults but preserve important flags like setup_complete
        const defaults = getDefaultPreferences();
        const mergedPreferences = { 
          ...defaults, 
          ...preferencesData,
          // Explicitly preserve setup_complete from database if it exists
          setup_complete: preferencesData.setup_complete !== undefined ? preferencesData.setup_complete : defaults.setup_complete
        };
        setPreferences(mergedPreferences);
      } else {
        setPreferences(getDefaultPreferences());
      }
    } catch (error) {
      setError('Failed to refresh preferences');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a specific preference exists
  const hasPreference = (key, value) => {
    if (!preferences || !preferences[key]) return false;
    if (Array.isArray(preferences[key])) {
      return preferences[key].includes(value);
    }
    return preferences[key] === value;
  };

  // Helper function to get a specific preference with fallback
  const getPreference = (key, defaultValue = null) => {
    if (!preferences) return defaultValue;
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  };

  return { 
    preferences, 
    updatePreferences, 
    refreshPreferences,
    loading,
    saving,
    error,
    isReady: isAuthenticated && preferences !== null,
    hasPreference,
    getPreference,
    // Additional auth-aware properties
    user,
    isAuthenticated
  };
};

export default useUserPreferences;