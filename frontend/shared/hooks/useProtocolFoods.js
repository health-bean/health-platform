import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

export const useProtocolFoods = (protocolId) => {
  const [foodsByCategory, setFoodsByCategory] = useState({});
  const [complianceStats, setComplianceStats] = useState({});
  const [totalFoods, setTotalFoods] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFoods = async () => {
    console.log('🔍 fetchFoods called with protocolId:', protocolId);
    
    if (!protocolId) {
      console.log('❌ No protocolId provided, returning early');
      return;
    }
    
    console.log('🚀 Fetching foods for protocol:', protocolId);
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        protocol_id: protocolId
      });

      console.log('📡 Making API call to:', `/api/v1/foods/by-protocol?${params}`);
      const data = await apiClient.get(`/api/v1/foods/by-protocol?${params}`);
      
      console.log('✅ Hook received data:', data);
      console.log('📊 foods_by_category:', data.foods_by_category);
      console.log('📈 compliance_stats:', data.compliance_stats);
      console.log('🔢 total_foods:', data.total_foods);
      
      console.log('🔄 Setting state...');
      setFoodsByCategory(data.foods_by_category || {});
      setComplianceStats(data.compliance_stats || {});
      setTotalFoods(data.total_foods || 0);
      
      console.log('✅ State set successfully');
    } catch (err) {
      console.error('❌ Error fetching protocol foods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered with protocolId:', protocolId);
    fetchFoods();
  }, [protocolId]);

  // Log the current state values
  console.log('🏪 Hook returning state:', {
    foodsByCategory: Object.keys(foodsByCategory).length,
    complianceStats,
    totalFoods,
    loading,
    error,
    protocolId
  });

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
    
    try {
      const params = new URLSearchParams(filters);
      const data = await apiClient.get(`/api/v1/foods/search?${params}`);
      setFoods(data.foods || []);
    } catch (err) {
      console.error('Error searching foods:', err);
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