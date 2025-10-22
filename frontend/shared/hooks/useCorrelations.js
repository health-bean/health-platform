import { useState, useEffect } from 'react';
import { apiClient } from '../services/api.js';

export const useCorrelations = (timeframeDays = 180) => {
  const [correlations, setCorrelations] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        timeframe_days: timeframeDays
      });

      const data = await apiClient.get(`/api/v1/correlations/insights?${params}`);
      
      setCorrelations(data.insights || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelations();
  }, [confidenceThreshold, timeframeDays]);

  const retryFetch = () => {
    fetchCorrelations();
  };

  // ENHANCED: Group correlations by all 6 types
  const groupedCorrelations = {
    // Legacy groupings (maintain backward compatibility)
    triggers: correlations.filter(c => c.type === 'food-symptom'),
    improvements: correlations.filter(c => c.type === 'supplement-improvement'),
    protocols: correlations.filter(c => c.type === 'protocol-effectiveness'),
    
    // NEW: Enhanced correlation types
    medicationEffects: correlations.filter(c => c.type === 'medication-effect'),
    sleepQuality: correlations.filter(c => c.type === 'sleep-quality'),
    exerciseEnergy: correlations.filter(c => c.type === 'exercise-energy'),
    stressAmplification: correlations.filter(c => c.type === 'stress-symptom'),
    
    // Comprehensive grouping
    allTypes: {
      'food-symptom': correlations.filter(c => c.type === 'food-symptom'),
      'supplement-improvement': correlations.filter(c => c.type === 'supplement-improvement'),
      'medication-effect': correlations.filter(c => c.type === 'medication-effect'),
      'sleep-quality': correlations.filter(c => c.type === 'sleep-quality'),
      'exercise-energy': correlations.filter(c => c.type === 'exercise-energy'),
      'stress-symptom': correlations.filter(c => c.type === 'stress-symptom'),
      'protocol-effectiveness': correlations.filter(c => c.type === 'protocol-effectiveness')
    }
  };

  // ENHANCED: High confidence triggers from ALL types, not just food
  const highConfidenceTriggers = correlations.filter(c => c.confidence >= 0.7);

  // ENHANCED: Get correlations sorted by confidence
  const sortedCorrelations = [...correlations].sort((a, b) => b.confidence - a.confidence);

  // ENHANCED: Get statistics by type - matches backend summary format
  const correlationStats = {
    total: correlations.length,
    byType: {
      foodTriggers: groupedCorrelations.triggers.length,
      medicationEffects: groupedCorrelations.medicationEffects.length,
      sleepFactors: groupedCorrelations.sleepQuality.length, // Match backend: sleepFactors
      exerciseImpacts: groupedCorrelations.exerciseEnergy.length, // Match backend: exerciseImpacts  
      stressAmplifiers: groupedCorrelations.stressAmplification.length, // Match backend: stressAmplifiers
      supplementImprovements: groupedCorrelations.improvements.length,
      protocolEffectiveness: groupedCorrelations.protocols.length
    },
    byConfidence: {
      high: correlations.filter(c => c.confidence >= 0.7).length,
      medium: correlations.filter(c => c.confidence >= 0.5 && c.confidence < 0.7).length,
      low: correlations.filter(c => c.confidence < 0.5).length
    }
  };

  // ENHANCED: Get top correlations by type
  const getTopCorrelationsByType = (type, limit = 3) => {
    return correlations
      .filter(c => c.type === type)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  };

  // ENHANCED: Get correlations above threshold
  const getCorrelationsAboveThreshold = (threshold = 0.6) => {
    return correlations.filter(c => c.confidence >= threshold);
  };

  // ENHANCED: Check if user has specific correlation types
  const hasCorrelationType = (type) => {
    return correlations.some(c => c.type === type);
  };

  // ENHANCED: Get correlation insights summary
  const getInsightsSummary = () => {
    const insights = [];
    
    // High confidence medication effects
    const highMedEffects = groupedCorrelations.medicationEffects.filter(c => c.confidence >= 0.7);
    if (highMedEffects.length > 0) {
      insights.push(`${highMedEffects.length} medication side effect${highMedEffects.length > 1 ? 's' : ''} detected`);
    }
    
    // Sleep quality improvements
    const sleepImprovements = groupedCorrelations.sleepQuality.filter(c => c.confidence >= 0.6);
    if (sleepImprovements.length > 0) {
      insights.push(`${sleepImprovements.length} sleep quality factor${sleepImprovements.length > 1 ? 's' : ''} identified`);
    }
    
    // Exercise energy patterns
    const exercisePatterns = groupedCorrelations.exerciseEnergy.filter(c => c.confidence >= 0.6);
    if (exercisePatterns.length > 0) {
      insights.push(`${exercisePatterns.length} exercise energy pattern${exercisePatterns.length > 1 ? 's' : ''} found`);
    }
    
    // Stress amplification
    const stressAmplifiers = groupedCorrelations.stressAmplification.filter(c => c.confidence >= 0.6);
    if (stressAmplifiers.length > 0) {
      insights.push(`${stressAmplifiers.length} stress amplification factor${stressAmplifiers.length > 1 ? 's' : ''} identified`);
    }
    
    return insights;
  };

  return {
    // Core data
    correlations,
    sortedCorrelations,
    groupedCorrelations,
    summary,
    
    // Legacy compatibility
    highConfidenceTriggers,
    
    // Enhanced features
    correlationStats,
    getTopCorrelationsByType,
    getCorrelationsAboveThreshold,
    hasCorrelationType,
    getInsightsSummary,
    
    // State management
    loading,
    error,
    refetch: retryFetch
  };
};