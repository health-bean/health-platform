import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import { AlertTriangle, TrendingUp, Clock, Target, Zap, Activity } from 'lucide-react';

const DEMO_USER_ID = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0'; // Sarah's ID for demo

const CorrelationInsights = () => {
  const [confidenceFilter, setConfidenceFilter] = useState(0.6);
  const [timeframeFilter, setTimeframeFilter] = useState(30);
  
  const { 
    correlations,  
    highConfidenceTriggers, 
    summary, 
    loading, 
    error 
  } = useCorrelations(DEMO_USER_ID, confidenceFilter, timeframeFilter);

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
              Personalized patterns discovered from your health data
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{summary.totalCorrelations || 0}</div>
            <div className="text-sm text-gray-500">Patterns Found</div>
          </div>
        </div>
      </div>

      {/* Filters - MOBILE RESPONSIVE FIX */}
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
              <option value={0.5}>Moderate</option>
              <option value={0.6}>Good</option>
              <option value={0.7}>Strong</option>
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

      {/* High Priority Alerts */}
      {highConfidenceTriggers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span>High-Confidence Triggers (Action Recommended)</span>
          </h3>
          <div className="space-y-2">
            {highConfidenceTriggers.slice(0, 3).map((correlation, index) => (
              <div key={index} className="bg-white rounded border border-red-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTriggerIcon(correlation.trigger)}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getTriggerIcon(correlation.trigger)} {correlation.trigger} → {getSymptomIcon(correlation.effect)} {correlation.effect}
                      </div>
                      <div className="text-sm text-gray-600">
                        {correlation.timeWindowDescription} • {correlation.frequency}
                      </div>
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

      {/* All Correlations */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>All Discovered Patterns</span>
          </h3>
        </div>
        
        {correlations.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No patterns found with current filters.</p>
            <p className="text-sm text-gray-400 mt-1">Try lowering the confidence threshold.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {correlations.map((correlation, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">{getTriggerIcon(correlation.trigger)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {correlation.trigger}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>triggers</span>
                          <span className="text-lg">{getSymptomIcon(correlation.effect)}</span>
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
                    
                    <div className="mt-2 ml-8">
                      <p className="text-sm text-blue-600 font-medium">
                        💡 {correlation.recommendation}
                      </p>
                    </div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.triggers || 0}</div>
              <div className="text-sm text-blue-700">Food Triggers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.improvements || 0}</div>
              <div className="text-sm text-green-700">Improvements</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((highConfidenceTriggers.length / Math.max(correlations.length, 1)) * 100)}%
              </div>
              <div className="text-sm text-purple-700">High Confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationInsights;