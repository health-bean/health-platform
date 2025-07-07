// File: frontend/shared/hooks/useUserPreferences.js (WITH DEBUG)

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
        console.log('🔧 PREFS: Loading preferences for user:', user.id);
        
        // Make API call with auth headers
        const response = await apiClient.get('/api/v1/user/preferences', {
          headers: getAuthHeaders()
        });
        
        console.log('🔧 PREFS: Initial load API response:', response);
        console.log('🔧 PREFS: Initial response type:', typeof response);
        console.log('🔧 PREFS: Initial response keys:', Object.keys(response || {}));
        console.log('🔧 PREFS: Initial response.preferences exists?', !!response?.preferences);
        
        // Handle both response formats:
        // - GET returns preferences directly: { protocols: [...], setup_complete: true }
        // - POST returns wrapped: { preferences: { protocols: [...], setup_complete: true } }
        const preferencesData = response?.preferences || response;
        
        if (preferencesData && typeof preferencesData === 'object' && ('protocols' in preferencesData || 'setup_complete' in preferencesData)) {
          console.log('🔧 PREFS: Loaded preferences from database:', preferencesData);
          console.log('🔧 PREFS: protocols in loaded preferences:', preferencesData.protocols);
          console.log('🔧 PREFS: setup_complete in loaded preferences:', preferencesData.setup_complete);
          setPreferences(preferencesData);
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
          console.log('🔧 PREFS: No preferences found, setting defaults:', defaultPreferences);
          setPreferences(defaultPreferences);
        }
      } catch (error) {
        console.error('🔧 PREFS: Failed to load preferences from API:', error);
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
        console.log('🔧 PREFS: Using fallback default preferences:', defaultPreferences);
        setPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user, token, getAuthHeaders]);

  const updatePreferences = async (newPreferences) => {
    console.log('🔧 PREFS: Starting updatePreferences');
    console.log('🔧 PREFS: Input newPreferences:', newPreferences);
    console.log('🔧 PREFS: protocols in newPreferences:', newPreferences.protocols);
    console.log('🔧 PREFS: setup_complete in newPreferences:', newPreferences.setup_complete);

    if (!isAuthenticated || !user) {
      console.error('🔧 PREFS: Cannot update preferences - user not authenticated');
      return Promise.reject(new Error('User not authenticated'));
    }

    if (!preferences) {
      console.error('🔧 PREFS: Cannot update preferences - not loaded yet');
      return Promise.reject(new Error('Preferences not loaded'));
    }
    
    // Preserve existing preferences and only update the specified ones
    const updatedPreferences = { 
      ...preferences, 
      ...newPreferences 
    };
    
    console.log('🔧 PREFS: Updating preferences for user:', user.id);
    console.log('🔧 PREFS: Current preferences before update:', preferences);
    console.log('🔧 PREFS: Merging with new preferences:', newPreferences);
    console.log('🔧 PREFS: Final preferences to save:', updatedPreferences);
    console.log('🔧 PREFS: protocols in final preferences:', updatedPreferences.protocols);
    console.log('🔧 PREFS: setup_complete in final preferences:', updatedPreferences.setup_complete);
    
    try {
      setSaving(true);
      setError(null);
      
      // Save to database with auth headers
      console.log('🔧 PREFS: Making API call to save preferences...');
      const response = await apiClient.post('/api/v1/user/preferences', updatedPreferences, {
        headers: getAuthHeaders()
      });
      
      console.log('🔧 PREFS: Save API full response:', response);
      console.log('🔧 PREFS: Save response type:', typeof response);
      console.log('🔧 PREFS: Save response keys:', Object.keys(response || {}));
      
      if (response) {
        console.log('🔧 PREFS: API call successful, response:', response);
        console.log('🔧 PREFS: protocols in API response:', response.preferences?.protocols);
        console.log('🔧 PREFS: setup_complete in API response:', response.preferences?.setup_complete);
        
        // Update local state with server response
        const finalPrefs = response.preferences || updatedPreferences;
        console.log('🔧 PREFS: Setting local state to:', finalPrefs);
        setPreferences(finalPrefs);
        
        // In production, also save to localStorage as backup
        // localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
        
        return finalPrefs;
      } else {
        console.error('🔧 PREFS: Invalid response from server');
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      console.error('🔧 PREFS: Update failed:', error);
      setError('Failed to save preferences');
      
      // Don't update local state if API call failed
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const refreshPreferences = async () => {
    console.log('🔧 PREFS: Starting refreshPreferences');
    console.log('🔧 PREFS: Current user:', user);

    if (!isAuthenticated || !user) {
      console.log('🔧 PREFS: Cannot refresh preferences - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔧 PREFS: Refreshing preferences for user:', user.id);
      
      const response = await apiClient.get('/api/v1/user/preferences', {
        headers: getAuthHeaders()
      });
      
      console.log('🔧 PREFS: Full API response:', response);
      console.log('🔧 PREFS: Response.preferences exists?', !!response?.preferences);
      console.log('🔧 PREFS: Response.preferences value:', response?.preferences);
      
      // Handle both response formats:
      // - GET returns preferences directly: { protocols: [...], setup_complete: true }
      // - POST returns wrapped: { preferences: { protocols: [...], setup_complete: true } }
      const preferencesData = response?.preferences || response;
      
      if (preferencesData && typeof preferencesData === 'object' && ('protocols' in preferencesData || 'setup_complete' in preferencesData)) {
        console.log('🔧 PREFS: Refresh API call successful');
        console.log('🔧 PREFS: Fresh preferences from API:', preferencesData);
        console.log('🔧 PREFS: protocols in fresh preferences:', preferencesData.protocols);
        console.log('🔧 PREFS: setup_complete in fresh preferences:', preferencesData.setup_complete);
        setPreferences(preferencesData);
      } else {
        console.log('🔧 PREFS: No valid preferences in refresh response');
        console.log('🔧 PREFS: Response keys:', Object.keys(response || {}));
        console.log('🔧 PREFS: Response type:', typeof response);
        console.log('🔧 PREFS: PreferencesData:', preferencesData);
      }
    } catch (error) {
      console.error('🔧 PREFS: Refresh failed:', error);
      console.error('🔧 PREFS: Error details:', error.message, error.status);
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