import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import { AlertTriangle, TrendingUp, Clock, Target, Zap, Activity, Pill, Moon, Dumbbell, Brain, Heart } from 'lucide-react';

const DEMO_USER_ID = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0'; // Sarah's ID for demo

const CorrelationInsights = () => {
  const [confidenceFilter, setConfidenceFilter] = useState(0.6);
  const [timeframeFilter, setTimeframeFilter] = useState(30);
  
  const { 
    correlations,  
    summary, 
    loading, 
    error 
  } = useCorrelations(DEMO_USER_ID, confidenceFilter, timeframeFilter);

  // ENHANCED: Sort all correlations by confidence and filter high confidence ones
  const sortedCorrelations = correlations ? [...correlations].sort((a, b) => b.confidence - a.confidence) : [];
  const highConfidenceTriggers = sortedCorrelations.filter(c => c.confidence >= 0.7);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-50 border-red-200';
    if (confidence >= 0.7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High Risk';
    if (confidence >= 0.7) return 'Strong Pattern';
    if (confidence >= 0.6) return 'Moderate Pattern';
    return 'Possible Pattern';
  };

  // ENHANCED: Get appropriate icon based on correlation type
  const getCorrelationIcon = (correlation) => {
    switch (correlation.type) {
      case 'medication-effect':
        return <Pill className="w-5 h-5 text-red-500" />;
      case 'sleep-quality':
        return <Moon className="w-5 h-5 text-indigo-500" />;
      case 'exercise-energy':
        return <Dumbbell className="w-5 h-5 text-green-500" />;
      case 'stress-symptom':
        return <Brain className="w-5 h-5 text-purple-500" />;
      case 'supplement-improvement':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'food-symptom':
      default:
        return <span className="text-xl">🍽️</span>;
    }
  };

  // ENHANCED: Get correlation type display name
  const getCorrelationTypeLabel = (type) => {
    switch (type) {
      case 'medication-effect':
        return 'Medication Side Effect';
      case 'sleep-quality':
        return 'Sleep Quality';
      case 'exercise-energy':
        return 'Exercise Energy';
      case 'stress-symptom':
        return 'Stress Amplification';
      case 'supplement-improvement':
        return 'Supplement Benefit';
      case 'food-symptom':
      default:
        return 'Food Trigger';
    }
  };

  // ENHANCED: Get correlation type color
  const getCorrelationTypeColor = (type) => {
    switch (type) {
      case 'medication-effect':
        return 'bg-red-100 text-red-800';
      case 'sleep-quality':
        return 'bg-indigo-100 text-indigo-800';
      case 'exercise-energy':
        return 'bg-green-100 text-green-800';
      case 'stress-symptom':
        return 'bg-purple-100 text-purple-800';
      case 'supplement-improvement':
        return 'bg-pink-100 text-pink-800';
      case 'food-symptom':
      default:
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getTriggerIcon = (trigger) => {
    if (trigger.includes('nightshade')) return '🍅';
    if (trigger.includes('oxalate')) return '🥬';
    if (trigger.includes('histamine')) return '🧀';
    if (trigger.includes('lectin')) return '🌾';
    return '🍽️';
  };

  const getSymptomIcon = (symptom) => {
    if (symptom.includes('joint pain')) return '🦴';
    if (symptom.includes('digestive')) return '🤢';
    if (symptom.includes('bloating')) return '😖';
    if (symptom.includes('swelling')) return '🤕';
    if (symptom.includes('skin')) return '🔴';
    if (symptom.includes('headache')) return '🤯';
    if (symptom.includes('fatigue')) return '😴';
    if (symptom.includes('brain fog')) return '🌫️';
    if (symptom.includes('sleep')) return '😴';
    if (symptom.includes('energy')) return '⚡';
    if (symptom.includes('drowsiness')) return '😴';
    return '⚠️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Analyzing health patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Insights</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Target className="w-7 h-7 text-blue-600" />
              <span>AI Health Insights</span>
            </h2>
            <p className="text-gray-600 mt-1">
              Personalized patterns discovered from your comprehensive health data
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{summary?.totalCorrelations || 0}</div>
            <div className="text-sm text-gray-500">Patterns Found</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-6">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700 min-w-0 flex-shrink-0">Confidence:</label>
            <select 
              value={confidenceFilter} 
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 sm:flex-none sm:w-32"
            >
              <option value={0.1}>All (10%+)</option>
              <option value={0.3}>Low (30%+)</option>
              <option value={0.5}>Moderate (50%+)</option>
              <option value={0.6}>Good (60%+)</option>
              <option value={0.7}>Strong (70%+)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700 min-w-0 flex-shrink-0">Time:</label>
            <select 
              value={timeframeFilter} 
              onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-xs flex-1 sm:flex-none sm:w-32"
            >
              <option value={30}>30 days</option>
              <option value={90}>3 months</option>
              <option value={180}>6 months</option>
            </select>
          </div>
        </div>
      </div>

      {/* High Priority Alerts - ENHANCED */}
      {highConfidenceTriggers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span>High-Confidence Patterns (Action Recommended)</span>
          </h3>
          <div className="space-y-2">
            {highConfidenceTriggers.slice(0, 5).map((correlation, index) => (
              <div key={index} className="bg-white rounded border border-red-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCorrelationIcon(correlation)}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(correlation.type)}`}>
                          {getCorrelationTypeLabel(correlation.type)}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">
                        {correlation.trigger} → {correlation.effect}
                      </div>
                      <div className="text-sm text-gray-600">
                        {correlation.timeWindowDescription} • {correlation.frequency}
                      </div>
                      {correlation.description && (
                        <div className="text-sm text-blue-600 mt-1">
                          💡 {correlation.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">
                      {Math.round(correlation.confidence * 100)}%
                    </div>
                    <div className="text-xs text-red-500">confidence</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Correlations - ENHANCED */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>All Discovered Patterns (Sorted by Confidence)</span>
          </h3>
        </div>
        
        {sortedCorrelations.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No patterns found with current filters.</p>
            <p className="text-sm text-gray-400 mt-1">Try lowering the confidence threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedCorrelations.map((correlation, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getCorrelationIcon(correlation)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(correlation.type)}`}>
                            {getCorrelationTypeLabel(correlation.type)}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">
                          {correlation.trigger}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>→</span>
                          <span className="font-medium">{correlation.effect}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 ml-8">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{correlation.timeWindowDescription}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4" />
                        <span>{correlation.frequency}</span>
                      </div>
                    </div>
                    
                    {correlation.description && (
                      <div className="mt-2 ml-8">
                        <p className="text-sm text-blue-600 font-medium">
                          💡 {correlation.description}
                        </p>
                      </div>
                    )}
                    
                    {correlation.recommendation && (
                      <div className="mt-1 ml-8">
                        <p className="text-sm text-green-600">
                          🎯 {correlation.recommendation}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(correlation.confidence)}`}>
                      {Math.round(correlation.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getConfidenceLabel(correlation.confidence)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Pill className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">{summary?.medicationEffects || 0}</div>
              <div className="text-sm text-red-700">Medication Effects</div>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Moon className="w-8 h-8 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold text-indigo-600">{summary?.sleepFactors || 0}</div>
              <div className="text-sm text-indigo-700">Sleep Factors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Dumbbell className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{summary?.exerciseImpacts || 0}</div>
              <div className="text-sm text-green-700">Exercise Impacts</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{summary?.stressAmplifiers || 0}</div>
              <div className="text-sm text-purple-700">Stress Amplifiers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationInsights;