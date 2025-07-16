import { useState, useEffect } from 'react';
import { simpleApiClient } from '../services/simpleApi.js';

export const useProtocolFoods = (protocolId) => {
  const [foodsByCategory, setFoodsByCategory] = useState({});
  const [complianceStats, setComplianceStats] = useState({});
  const [totalFoods, setTotalFoods] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFoods = async () => {
    if (!protocolId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        protocol_id: protocolId
      });

      const data = await simpleApiClient.get(`/api/v1/foods/by-protocol?${params}`);
      
      setFoodsByCategory(data.foods_by_category || {});
      setComplianceStats(data.compliance_stats || {});
      setTotalFoods(data.total_foods || 0);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [protocolId]);

  return {
    foodsByCategory,
    complianceStats,
    totalFoods,
    loading,
    error,
    refetch: fetchFoods
  };
};

export const useFoodSearch = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchFoods = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    console.log('🔍 SEARCH API CALL:', filters);
    
    try {
      const params = new URLSearchParams(filters);
      const data = await simpleApiClient.get(`/api/v1/foods/search?${params}`);
      console.log('🔍 SEARCH RESULTS:', data);
      setFoods(data.foods || []);
    } catch (err) {
      console.error('🔍 SEARCH ERROR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    foods,
    loading,
    error,
    searchFoods
  };
};
