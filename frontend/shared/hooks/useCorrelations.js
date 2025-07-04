import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://suhoxvn8ik.execute-api.us-east-1.amazonaws.com/dev';

export const useCorrelations = (userId, confidenceThreshold = 0.6, timeframeDays = 180) => {
  const [correlations, setCorrelations] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCorrelations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        user_id: userId,
        confidence_threshold: confidenceThreshold,
        timeframe_days: timeframeDays
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/correlations/insights?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setCorrelations(data.insights || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Error fetching correlations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [userId, confidenceThreshold, timeframeDays]);

  const retryFetch = () => {
    fetchCorrelations();
  };

  // Group correlations by type for better display
  const groupedCorrelations = {
    triggers: correlations.filter(c => c.type === 'food-symptom'),
    improvements: correlations.filter(c => c.type === 'supplement-improvement'),
    protocols: correlations.filter(c => c.type === 'protocol-effectiveness')
  };

  // Get high confidence triggers (>70%)
  const highConfidenceTriggers = groupedCorrelations.triggers.filter(c => c.confidence >= 0.7);

  return {
    correlations,
    groupedCorrelations,
    highConfidenceTriggers,
    summary,
    loading,
    error,
    refetch: retryFetch
  };
};