import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useUserPreferences = (userId) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔧 FIX: Memoize fetchPreferences to prevent infinite re-renders
  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        user_id: userId
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/user/preferences?${params}`);
      
      if (!response.ok) {
        // If no preferences exist (404), use defaults
        if (response.status === 404) {
          setPreferences({
            protocols: [],
            quick_supplements: [],
            quick_medications: [],
            quick_foods: [],
            quick_symptoms: [],
            quick_detox: [],
            setup_complete: false
          });
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPreferences(data.preferences || {});
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err.message);
      // Fallback to defaults on error
      setPreferences({
        protocols: [],
        quick_supplements: [],
        quick_medications: [],
        quick_foods: [],
        quick_symptoms: [],
        quick_detox: [],
        setup_complete: false
      });
    } finally {
      setLoading(false);
    }
  }, [userId]); // 🔧 FIX: Only depends on userId

  // 🔧 FIX: Use memoized fetchPreferences in useEffect
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // 🔧 FIX: Memoize updatePreferences to prevent unnecessary re-renders
  const updatePreferences = useCallback(async (newPreferences) => {
    if (!preferences || !userId) return false;
    
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    setLoading(true);
    setError(null);
    
    try {
      // 🔧 FIX: Use PUT instead of POST
      const response = await fetch(`${API_BASE_URL}/api/v1/user/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          preferences: updatedPreferences
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local state with successful response
      setPreferences(updatedPreferences);
      console.log('✅ Preferences updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [preferences, userId]); // 🔧 FIX: Stable dependencies

  return { 
    preferences, 
    updatePreferences, 
    loading,
    error,
    isReady: preferences !== null,
    refetch: fetchPreferences
  };
};

export default useUserPreferences;