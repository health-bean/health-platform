import { useState, useEffect } from 'react';
import { simpleApiClient } from '../services/simpleApi.js';

const useExposureTypes = (isAuthenticated = false) => {
  const [exposureTypes, setExposureTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExposureTypes = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await simpleApiClient.get('/api/v1/detox-types/search?search=');
      setExposureTypes(data.detox_types || []);
    } catch (err) {
      console.error('Failed to fetch exposure types:', err);
      setError(err.message);
      // DON'T use mock data fallback - let the UI handle the error state
      setExposureTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExposureTypes();
  }, [isAuthenticated]);

  return { 
    exposureTypes, 
    loading, 
    error,
    refetch: fetchExposureTypes,
    isEmpty: exposureTypes.length === 0 && !loading && !error
  };
};

export default useExposureTypes;