import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import useAuth from '../../../../shared/hooks/useAuth';
import { AlertTriangle, TrendingUp, Clock, Target, Activity, Pill, Moon, Dumbbell, Brain, Heart } from 'lucide-react';

const CorrelationInsights = () => {
  const [timeframeFilter, setTimeframeFilter] = useState(180);
  const [activeTab, setActiveTab] = useState('issues');
  const [showMore, setShowMore] = useState(false);
  
  // Get current user from auth context
  const { user, loading: authLoading } = useAuth();
  
  const { 
    correlations,  
    loading: correlationsLoading, 
    error
  } = useCorrelations(user?.id, 0.3, timeframeFilter);

  // Helper function to determine if correlation is positive/beneficial
  const isPositiveCorrelation = (correlation) => {
    // Check if DB already provides this classification
    if (correlation.is_beneficial !== undefined) {
      return correlation.is_beneficial;
    }
    
    // Fallback logic based on type and description
    const positiveTypes = ['supplement-improvement'];
    const negativeTypes = ['food-symptom', 'medication-effect', 'stress-symptom'];
    
    if (positiveTypes.includes(correlation.type)) return true;
    if (negativeTypes.includes(correlation.type)) return false;
    
    // For exercise/sleep, check description
    const text = (correlation.description || correlation.effect || '').toLowerCase();
    const positiveKeywords = ['reduce', 'improve', 'help', 'boost', 'increase energy', 'better', 'benefit'];
    const negativeKeywords = ['cause', 'trigger', 'worsen', 'amplify', 'side effect'];
    
    const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
    
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
    const labels = {
      'medication-effect': 'Medication Effect',
      'sleep-quality': 'Sleep Factor', 
      'exercise-energy': 'Exercise Impact',
      'stress-symptom': 'Stress Factor',
      'supplement-improvement': 'Supplement Benefit',
      'food-symptom': 'Food Response'
    };
    return labels[type] || 'Health Pattern';
  };

  // Get correlation type color
  const getCorrelationTypeColor = (correlation) => {
    const isPositive = isPositiveCorrelation(correlation);
    
    if (isPositive) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  // Calculate impact score for sorting (prioritize by severity/importance)
  const getImpactScore = (correlation) => {
    // If DB provides impact score, use it
    if (correlation.impact_score !== undefined) {
      return correlation.impact_score;
    }
    
    // Fallback calculation
    let baseScore = correlation.confidence || 0.5;
    
    // Boost critical health issues
    const criticalKeywords = ['severe', 'intense', 'debilitating', 'migraine', 'pain'];
    const text = (correlation.description || correlation.effect || '').toLowerCase();
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
      baseScore += 0.3;
    }
    
    // Medication effects are high priority
    if (correlation.type === 'medication-effect') {
      baseScore += 0.2;
    }
    
    return Math.min(baseScore, 1.0);
  };

  // Clean up correlation description text
  const getCleanDescription = (correlation) => {
    if (!correlation.description) return null;
    
    let description = correlation.description;
    
    // Remove verbose prefixes
    description = description.replace(/^For you,?\s*/i, '');
    description = description.replace(/\s*(frequently|sometimes|appears to|seems to)\s*/gi, ' ');
    description = description.replace(/\s*\(\d+%.*?\)/g, ''); // Remove percentage info
    
    // Simplify time references
    description = description.replace(/\(improvement after \d+ weeks?\)/gi, 
      (match) => match.replace('improvement after', 'improvement after'));
    
    // Clean up extra spaces
    description = description.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
    
    return description;
  };

  // Safe correlations array
  const safeCorrelations = correlations || [];
  
  // Filter correlations based on tab selection
  const getFilteredCorrelations = () => {
    const baseCorrelations = safeCorrelations.filter(c => c.confidence >= 0.5);
    
    switch (activeTab) {
      case 'issues':
        // Things to investigate: food triggers, med side effects, stress amplifiers
        return baseCorrelations.filter(c => !isPositiveCorrelation(c));
      case 'helping':
        // What's working: supplements, positive exercise/sleep effects
        return baseCorrelations.filter(c => isPositiveCorrelation(c));
      case 'all':
      default:
        return baseCorrelations;
    }
  };

  const filteredCorrelations = getFilteredCorrelations();
  
  // Sort by impact score instead of confidence
  const sortedCorrelations = [...filteredCorrelations].sort((a, b) => {
    const impactA = getImpactScore(a);
    const impactB = getImpactScore(b);
    return impactB - impactA; // Highest impact first
  });
  
  const displayedCorrelations = showMore ? sortedCorrelations : sortedCorrelations.slice(0, 5);

  // Calculate counts for different categories
  const issuesCount = safeCorrelations.filter(c => c.confidence >= 0.5 && !isPositiveCorrelation(c)).length;
  const helpingCount = safeCorrelations.filter(c => c.confidence >= 0.5 && isPositiveCorrelation(c)).length;
  
  // Combined loading state
  const loading = authLoading || correlationsLoading;

  if (loading || (user && correlationsLoading)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Analyzing health patterns...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="text-yellow-800 font-semibold">Authentication Required</h3>
            <p className="text-yellow-600">Please log in to view your health insights.</p>
          </div>
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
              {issuesCount} issues to investigate, {helpingCount} patterns helping you
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
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'issues'
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Issues ({issuesCount})
        </button>
        <button
          onClick={() => setActiveTab('helping')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'helping'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Helping ({helpingCount})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({safeCorrelations.filter(c => c.confidence >= 0.5).length})
        </button>
      </div>

      {/* Patterns Display */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span>
              {activeTab === 'issues' ? 'Issues to Investigate' : 
               activeTab === 'helping' ? "What's Helping" :
               'All Patterns'}
            </span>
            <span className="text-sm text-gray-500">({filteredCorrelations.length} total)</span>
          </h3>
        </div>
        
        {displayedCorrelations.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === 'issues' ? 'No issues found - great news!' :
               activeTab === 'helping' ? 'No helpful patterns identified yet.' :
               'No patterns found.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'issues' ? 'Keep tracking to identify potential triggers.' :
               activeTab === 'helping' ? 'Continue tracking to discover what works for you.' :
               'Try adjusting the time period or add more data.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {displayedCorrelations.map((correlation, index) => {
              const cleanDescription = getCleanDescription(correlation);
              
              return (
                <div key={correlation.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {getCorrelationIcon(correlation)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {correlation.trigger} → {correlation.effect}
                        </div>
                        {correlation.timeWindowDescription && (
                          <div className="text-sm text-gray-600">
                            {correlation.timeWindowDescription} • {correlation.frequency}
                          </div>
                        )}
                        {cleanDescription && (
                          <div className="text-sm text-blue-600 mt-1">
                            {isPositiveCorrelation(correlation) ? '💡' : '🔍'} {cleanDescription}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCorrelationTypeColor(correlation)}`}>
                        {getCorrelationTypeLabel(correlation.type)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
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
                {helpingCount}
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