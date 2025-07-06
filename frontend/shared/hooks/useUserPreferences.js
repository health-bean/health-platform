import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

const useUserPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load preferences from database on app start
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        console.log('Loading preferences from database...');
        
        // Try to load from API first
        const response = await apiClient.get('/api/v1/user/preferences');
        
        if (response) {
          console.log('Loaded preferences from database:', response);
          setPreferences(response);
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
        
        // Fallback to localStorage if API fails
        try {
          const saved = localStorage.getItem('user_preferences');
          if (saved) {
            console.log('Falling back to localStorage preferences');
            const parsed = JSON.parse(saved);
            setPreferences(parsed);
          } else {
            // Final fallback to defaults
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
        } catch (localError) {
          console.error('localStorage fallback failed:', localError);
          // Final fallback to defaults
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
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const updatePreferences = async (newPreferences) => {
    if (!preferences) {
      console.error('Cannot update preferences - not loaded yet');
      return Promise.reject(new Error('Preferences not loaded'));
    }
    
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      setSaving(true);
      setError(null);
      console.log('Updating preferences:', updatedPreferences);
      
      // Save to database first
      const response = await apiClient.post('/api/v1/user/preferences', updatedPreferences);
      
      if (response) {
        console.log('Preferences saved to database successfully');
        // Update local state with server response
        setPreferences(response.preferences || updatedPreferences);
        
        // Also save to localStorage as backup
        localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
        
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
    loading,
    saving,
    error,
    isReady: preferences !== null,
    hasPreference,
    getPreference
  };
};

export default useUserPreferences;