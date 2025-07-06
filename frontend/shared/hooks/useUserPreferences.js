// File: frontend/shared/hooks/useUserPreferences.js (UPDATED)

import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';
import useAuth from './useAuth.js';

const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Get auth context
  const { user, token, isAuthenticated, getAuthHeaders } = useAuth();

  // Load preferences from database when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      setPreferences(null);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading preferences for user:', user.id);
        
        // Make API call with auth headers
        const response = await apiClient.get('/api/v1/user/preferences', {
          headers: getAuthHeaders()
        });
        
        if (response?.preferences) {
          console.log('Loaded preferences from database:', response.preferences);
          setPreferences(response.preferences);
        } else {
          // Set default preferences for new users
          const defaultPreferences = {
            protocols: [],
            quick_supplements: [],
            quick_medications: [],
            quick_foods: [],
            quick_symptoms: [],
            quick_detox: [],
            setup_complete: false
          };
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('Failed to load preferences from API:', error);
        setError('Failed to load preferences');
        
        // Fallback to default preferences
        const defaultPreferences = {
          protocols: [],
          quick_supplements: [],
          quick_medications: [],
          quick_foods: [],
          quick_symptoms: [],
          quick_detox: [],
          setup_complete: false
        };
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user, token, getAuthHeaders]);

  const updatePreferences = async (newPreferences) => {
    if (!isAuthenticated || !user) {
      console.error('Cannot update preferences - user not authenticated');
      return Promise.reject(new Error('User not authenticated'));
    }

    if (!preferences) {
      console.error('Cannot update preferences - not loaded yet');
      return Promise.reject(new Error('Preferences not loaded'));
    }
    
    // Preserve existing preferences and only update the specified ones
    const updatedPreferences = { 
      ...preferences, 
      ...newPreferences 
    };
    
    console.log('Updating preferences for user:', user.id);
    console.log('Preserving existing preferences:', preferences);
    console.log('Merging with new preferences:', newPreferences);
    console.log('Final preferences to save:', updatedPreferences);
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to database with auth headers
      const response = await apiClient.post('/api/v1/user/preferences', updatedPreferences, {
        headers: getAuthHeaders()
      });
      
      if (response) {
        console.log('Preferences saved to database successfully');
        // Update local state with server response
        setPreferences(response.preferences || updatedPreferences);
        
        // In production, also save to localStorage as backup
        // localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
        
        return updatedPreferences;
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Failed to save preferences');
      
      // Don't update local state if API call failed
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const refreshPreferences = async () => {
    if (!isAuthenticated || !user) {
      console.log('Cannot refresh preferences - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Refreshing preferences for user:', user.id);
      
      const response = await apiClient.get('/api/v1/user/preferences', {
        headers: getAuthHeaders()
      });
      
      if (response?.preferences) {
        console.log('Refreshed preferences:', response.preferences);
        setPreferences(response.preferences);
      }
    } catch (error) {
      console.error('Failed to refresh preferences:', error);
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