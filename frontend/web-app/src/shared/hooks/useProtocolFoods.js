import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

/**
 * Hook for fetching protocol-specific foods
 */
export const useProtocolFoods = (protocolId) => {
  const [foodsByCategory, setFoodsByCategory] = useState({});
  const [complianceStats, setComplianceStats] = useState({
    allowed: 0,
    avoid: 0,
    reintroduction: 0
  });
  const [totalFoods, setTotalFoods] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { apiCall } = useApi();

  useEffect(() => {
    if (!protocolId) {
      setFoodsByCategory({});
      setComplianceStats({ allowed: 0, avoid: 0, reintroduction: 0 });
      setTotalFoods(0);
      return;
    }

    const fetchProtocolFoods = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🍎 Fetching protocol foods for:', protocolId);
        
        const response = await apiCall(`/foods/protocol?protocol_id=${protocolId}&limit=500`);
        
        if (response.success && response.data.foods) {
          const foods = response.data.foods;
          console.log('🍎 Protocol foods response:', {
            totalFoods: foods.length,
            sampleFood: foods[0]
          });
          
          // Group foods by category
          const grouped = foods.reduce((acc, food) => {
            const category = food.category || 'Other';
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push({
              ...food,
              compliance_status: mapProtocolStatusToCompliance(food.protocol_status)
            });
            return acc;
          }, {});
          
          // Calculate compliance stats
          const stats = foods.reduce((acc, food) => {
            const status = mapProtocolStatusToCompliance(food.protocol_status);
            if (status === 'included') acc.allowed++;
            else if (status === 'avoid_for_now') acc.avoid++;
            else if (status === 'try_in_moderation') acc.reintroduction++;
            return acc;
          }, { allowed: 0, avoid: 0, reintroduction: 0 });
          
          setFoodsByCategory(grouped);
          setComplianceStats(stats);
          setTotalFoods(foods.length);
          
          console.log('🍎 Protocol foods processed:', {
            categories: Object.keys(grouped).length,
            stats
          });
        } else {
          console.error('🍎 Invalid protocol foods response:', response);
          setError('Invalid response format');
        }
      } catch (err) {
        console.error('🍎 Error fetching protocol foods:', err);
        setError(err.message || 'Failed to fetch protocol foods');
      } finally {
        setLoading(false);
      }
    };

    fetchProtocolFoods();
  }, [protocolId, apiCall]);

  return {
    foodsByCategory,
    complianceStats,
    totalFoods,
    loading,
    error
  };
};

/**
 * Hook for searching foods with optional protocol context
 */
export const useFoodSearch = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { apiCall } = useApi();

  const searchFoods = async (params) => {
    if (!params.search?.trim()) {
      setFoods([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Searching foods with params:', params);
      
      const queryParams = new URLSearchParams();
      queryParams.append('search', params.search);
      if (params.protocol_id) {
        queryParams.append('protocol_id', params.protocol_id);
      }
      queryParams.append('limit', '20');
      
      // Use protocol search if protocol_id provided, otherwise general search
      const endpoint = params.protocol_id 
        ? `/foods/protocol?${queryParams.toString()}`
        : `/foods/search?${queryParams.toString()}`;
      
      const response = await apiCall(endpoint);
      
      if (response.success && response.data.foods) {
        const searchResults = response.data.foods.map(food => ({
          ...food,
          compliance_status: food.protocol_status 
            ? mapProtocolStatusToCompliance(food.protocol_status)
            : null
        }));
        
        console.log('🔍 Search results:', {
          query: params.search,
          results: searchResults.length,
          hasProtocolData: searchResults.some(f => f.compliance_status)
        });
        
        setFoods(searchResults);
      } else {
        console.error('🔍 Invalid search response:', response);
        setFoods([]);
      }
    } catch (err) {
      console.error('🔍 Search error:', err);
      setError(err.message || 'Search failed');
      setFoods([]);
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

/**
 * Map backend protocol status to frontend compliance status
 */
const mapProtocolStatusToCompliance = (protocolStatus) => {
  switch (protocolStatus) {
    case 'allowed':
      return 'included';
    case 'avoid':
      return 'avoid_for_now';
    case 'moderation':
      return 'try_in_moderation';
    case null:
    case undefined:
    case 'unknown':
      return 'not_classified';
    default:
      return 'not_classified';
  }
};
