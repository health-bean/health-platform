import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';

export const useProtocolFoods = (protocolId) => {
  const [foodsByCategory, setFoodsByCategory] = useState({});
  const [complianceStats, setComplianceStats] = useState({});
  const [totalFoods, setTotalFoods] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFoods = async () => {
    if (!protocolId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        protocol_id: protocolId
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/foods/by-protocol?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFoodsByCategory(data.foods_by_category || {});
      setComplianceStats(data.compliance_stats || {});
      setTotalFoods(data.total_foods || 0);
    } catch (err) {
      console.error('Error fetching protocol foods:', err);
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
    
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/v1/foods/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
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