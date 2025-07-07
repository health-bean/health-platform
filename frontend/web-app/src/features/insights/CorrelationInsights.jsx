import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import { AlertTriangle, TrendingUp, Clock, Target, Activity, Pill, Moon, Dumbbell, Brain, Heart } from 'lucide-react';

const DEMO_USER_ID = '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0';

const CorrelationInsights = () => {
  const [timeframeFilter, setTimeframeFilter] = useState(180);
  const [activeTab, setActiveTab] = useState('critical');
  const [showMore, setShowMore] = useState(false);
  
  const { 
    correlations,  
    loading, 
    error
  } = useCorrelations(DEMO_USER_ID, 0.3, timeframeFilter);

  // Helper function to determine if correlation is positive
  const isPositiveCorrelation = (correlation) => {
    const positiveKeywords = ['reduce', 'improve', 'help', 'boost', 'increase energy', 'better', 'benefit'];
    const negativeKeywords = ['cause', 'trigger', 'worsen', 'amplify', 'side effect'];
    
    const text = (correlation.description || correlation.effect || '').toLowerCase();
    
    const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
    
    if (correlation.type === 'supplement-improvement' || 
        (correlation.type === 'sleep-quality' && text.includes('improve'))) {
      return true;
    }
    
    if (correlation.type === 'exercise-energy' && text.includes('boost')) {
      return true;
    }
    
    if (correlation.type === 'medication-effect' || correlation.type === 'stress-symptom') {
      return false;
    }
    
    if (correlation.type === 'food-symptom') {
      return false;
    }
    
    return hasPositive && !hasNegative;
  };

  // Get appropriate icon based on correlation type
  const getCorrelationIcon = (correlation) => {
    const isPositive = isPositiveCorrelation(correlation);
    
    switch (correlation.type) {
      case 'medication-effect':
        return <Pill className="w-5 h-5 text-red-500" />;
      case 'sleep-quality':
        return <Moon className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-blue-500'}`} />;
      case 'exercise-energy':
        return <Dumbbell className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-orange-500'}`} />;
      case 'stress-symptom':
        return <Brain className="w-5 h-5 text-red-500" />;
      case 'supplement-improvement':
        return <Heart className="w-5 h-5 text-green-500" />;
      case 'food-symptom':
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  // Get correlation type display name
  const getCorrelationTypeLabel = (type) => {
    switch (type) {
      case 'medication-effect':
        return 'Medication Effect';
      case 'sleep-quality':
        return 'Sleep Factor';
      case 'exercise-energy':
        return 'Exercise Impact';
      case 'stress-symptom':
        return 'Stress Factor';
      case 'supplement-improvement':
        return 'Supplement Benefit';
      case 'food-symptom':
      default:
        return 'Food Response';
    }
  };

  // Get correlation type color
  const getCorrelationTypeColor = (type, isPositive = null) => {
    if (isPositive === true) {
      return 'bg-green-100 text-green-800';
    } else if (isPositive === false) {
      return 'bg-red-100 text-red-800';
    }
    
    switch (type) {
      case 'medication-effect':
      case 'stress-symptom':
      case 'food-symptom':
        return 'bg-red-100 text-red-800';
      case 'supplement-improvement':
        return 'bg-green-100 text-green-800';
      case 'sleep-quality':
      case 'exercise-energy':
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Safe correlations array
  const safeCorrelations = correlations || [];
  
  // Calculate counts
  const criticalCount = safeCorrelations.filter(c => c.confidence >= 0.7 && !isPositiveCorrelation(c)).length;
  
  // Filter correlations based on tab selection
  const getFilteredCorrelations = () => {
    const baseCorrelations = safeCorrelations.filter(c => c.confidence >= 0.5);
    
    switch (activeTab) {
      case 'critical':
        return baseCorrelations.filter(c => c.confidence >= 0.7 && !isPositiveCorrelation(c));
      case 'positive':
        return baseCorrelations.filter(c => isPositiveCorrelation(c));
      case 'all':
      default:
        return baseCorrelations.filter(c => !isPositiveCorrelation(c));
    }
  };

  const filteredCorrelations = getFilteredCorrelations();
  const sortedCorrelations = [...filteredCorrelations].sort((a, b) => b.confidence - a.confidence);
  const displayedCorrelations = showMore ? sortedCorrelations : sortedCorrelations.slice(0, 5);

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
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Target className="w-6 h-6 text-blue-600" />
              <span>Health Insights</span>
            </h2>
            <p className="text-gray-600 mt-1">
              {criticalCount} critical insights are available that you should review
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-sm text-gray-600 mb-1">Time Period</div>
            <select 
              value={timeframeFilter} 
              onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
            >
              <option value={30}>30 days</option>
              <option value={90}>3 months</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('critical')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'critical'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Critical
        </button>
        <button
          onClick={() => setActiveTab('positive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'positive'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Positive
        </button>
      </div>

      {/* Patterns Display */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>
              {activeTab === 'critical' ? 'Critical Insights' : 
               activeTab === 'positive' ? 'Positive Patterns' :
               'All Patterns'}
            </span>
            <span className="text-sm text-gray-500">({filteredCorrelations.length} total)</span>
          </h3>
        </div>
        
        {displayedCorrelations.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === 'critical' ? 'No critical insights found.' :
               activeTab === 'positive' ? 'No positive patterns found.' :
               'No patterns found.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting the time period or switching to a different tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {displayedCorrelations.map((correlation, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getCorrelationIcon(correlation)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {correlation.trigger} → {correlation.effect}
                      </div>
                      <div className="text-sm text-gray-600">
                        {correlation.timeWindowDescription} • {correlation.frequency}
                      </div>
                      {correlation.description && (
                        <div className="text-sm text-blue-600 mt-1">
                          {activeTab === 'positive' ? '💡' : '🔍'} {correlation.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(correlation.type, isPositiveCorrelation(correlation))}`}>
                      {getCorrelationTypeLabel(correlation.type)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show More/Less Button */}
            {sortedCorrelations.length > 5 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {showMore ? 
                    `Show Less (showing all ${sortedCorrelations.length})` : 
                    `Show More (${sortedCorrelations.length - 5} more patterns)`
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {safeCorrelations.filter(c => c.confidence >= 0.5 && c.type === 'food-symptom').length}
              </div>
              <div className="text-sm text-red-700">Food Triggers</div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Pill className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {safeCorrelations.filter(c => c.confidence >= 0.5 && c.type === 'medication-effect').length}
              </div>
              <div className="text-sm text-orange-700">Medication Effects</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {safeCorrelations.filter(c => c.confidence >= 0.5 && c.type === 'stress-symptom').length}
              </div>
              <div className="text-sm text-purple-700">Stress Factors</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {safeCorrelations.filter(c => c.confidence >= 0.5 && isPositiveCorrelation(c)).length}
              </div>
              <div className="text-sm text-green-700">Positive Patterns</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationInsights;