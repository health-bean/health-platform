import React, { useState, useMemo } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import useAuth from '../../../../shared/hooks/useAuth';
import { AlertTriangle, TrendingUp, Clock, Target, Activity, Pill, Moon, Dumbbell, Brain, Heart, Eye } from 'lucide-react';
import { Button, Select } from '../../../../shared/components/ui';

const CorrelationInsights = () => {
  const [timeframeFilter, setTimeframeFilter] = useState(180);
  const [activeTab, setActiveTab] = useState('review');
  const [typeFilter, setTypeFilter] = useState('all');
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

  // Check if correlation is critical (high confidence + negative impact)
  const isCriticalCorrelation = (correlation) => {
    return correlation.confidence >= 0.7 && !isPositiveCorrelation(correlation);
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

  // Get correlation type display name for filters
  const getCorrelationTypeLabel = (type) => {
    const labels = {
      'medication-effect': 'Medication Effects',
      'sleep-quality': 'Sleep Factors', 
      'exercise-energy': 'Exercise Impacts',
      'stress-symptom': 'Stress Factors',
      'supplement-improvement': 'Supplement Benefits',
      'food-symptom': 'Food Triggers'
    };
    return labels[type] || 'Health Pattern';
  };

  // Format percentage display
  const getPercentageDisplay = (correlation) => {
    // If DB provides occurrence data, use it
    if (correlation.occurrences && correlation.total_opportunities) {
      const percentage = Math.round((correlation.occurrences / correlation.total_opportunities) * 100);
      return `${percentage}% (${correlation.occurrences}/${correlation.total_opportunities} times)`;
    }
    
    // Fallback to confidence percentage
    const percentage = Math.round(correlation.confidence * 100);
    return `${percentage}%`;
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

  // Get unique correlation types for dynamic filtering
  const availableTypes = useMemo(() => {
    const types = [...new Set(safeCorrelations.map(c => c.type))];
    return types.map(type => ({
      value: type,
      label: getCorrelationTypeLabel(type)
    }));
  }, [safeCorrelations]);
  
  // Filter correlations based on tab selection and type filter
  const getFilteredCorrelations = () => {
    let baseCorrelations = safeCorrelations.filter(c => c.confidence >= 0.5);
    
    // Apply type filter if not "all"
    if (typeFilter !== 'all') {
      baseCorrelations = baseCorrelations.filter(c => c.type === typeFilter);
    }
    
    // Apply tab filter
    switch (activeTab) {
      case 'review':
        // Critical issues needing immediate attention
        return baseCorrelations.filter(c => isCriticalCorrelation(c));
      case 'observe':
        // Non-critical issues to monitor
        return baseCorrelations.filter(c => !isPositiveCorrelation(c) && !isCriticalCorrelation(c));
      case 'positive':
        // Positive patterns to maintain
        return baseCorrelations.filter(c => isPositiveCorrelation(c));
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
  const reviewCount = safeCorrelations.filter(c => c.confidence >= 0.5 && isCriticalCorrelation(c)).length;
  const observeCount = safeCorrelations.filter(c => c.confidence >= 0.5 && !isPositiveCorrelation(c) && !isCriticalCorrelation(c)).length;
  const positiveCount = safeCorrelations.filter(c => c.confidence >= 0.5 && isPositiveCorrelation(c)).length;
  
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
              {reviewCount} to review, {observeCount} to observe, {positiveCount} to keep up
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <div className="text-sm text-gray-600 mb-1">Time Period</div>
            <Select
              value={timeframeFilter}
              onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
              className="text-sm"
            >
              <option value={30}>30 days</option>
              <option value={90}>3 months</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={activeTab === 'review' ? 'danger' : 'ghost'}
          onClick={() => setActiveTab('review')}
          size="sm"
        >
          Review ({reviewCount})
        </Button>
        <Button
          variant={activeTab === 'observe' ? 'warning' : 'ghost'}
          onClick={() => setActiveTab('observe')}
          size="sm"
        >
          Observe ({observeCount})
        </Button>
        <Button
          variant={activeTab === 'positive' ? 'success' : 'ghost'}
          onClick={() => setActiveTab('positive')}
          size="sm"
        >
          Keep it Up ({positiveCount})
        </Button>
      </div>

      {/* Type Filter */}
      {availableTypes.length > 0 && (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">Filter by type:</span>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-auto min-w-[200px]"
          >
            <option value="all">All Types</option>
            {availableTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Patterns Display */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {activeTab === 'review' && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {activeTab === 'observe' && <Eye className="w-5 h-5 text-orange-500" />}
            {activeTab === 'positive' && <TrendingUp className="w-5 h-5 text-green-500" />}
            <span>
              {activeTab === 'review' ? 'Critical Issues to Review' : 
               activeTab === 'observe' ? 'Patterns to Observe' :
               'Positive Patterns to Keep Up'}
            </span>
            <span className="text-sm text-gray-500">({filteredCorrelations.length} total)</span>
          </h3>
        </div>
        
        {displayedCorrelations.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === 'review' ? 'No critical issues found - great news!' :
               activeTab === 'observe' ? 'No patterns to observe right now.' :
               'No positive patterns identified yet.'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'review' ? 'Keep tracking to identify potential critical triggers.' :
               activeTab === 'observe' ? 'Continue tracking to discover patterns worth monitoring.' :
               'Continue tracking to discover what works for you.'}
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
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {getPercentageDisplay(correlation)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show More/Less Button */}
            {sortedCorrelations.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 
                    `Show Less (showing all ${sortedCorrelations.length})` : 
                    `Show More (${sortedCorrelations.length - 5} more patterns)`
                  }
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {availableTypes.map(type => {
          const count = safeCorrelations.filter(c => c.confidence >= 0.5 && c.type === type.value).length;
          const isPositive = safeCorrelations.some(c => c.type === type.value && isPositiveCorrelation(c));
          
          return (
            <div key={type.value} className={`border rounded-lg p-4 ${
              isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                {type.value === 'food-symptom' && <AlertTriangle className="w-8 h-8 text-red-600" />}
                {type.value === 'medication-effect' && <Pill className="w-8 h-8 text-orange-600" />}
                {type.value === 'stress-symptom' && <Brain className="w-8 h-8 text-purple-600" />}
                {type.value === 'supplement-improvement' && <Heart className="w-8 h-8 text-green-600" />}
                {type.value === 'sleep-quality' && <Moon className="w-8 h-8 text-blue-600" />}
                {type.value === 'exercise-energy' && <Dumbbell className="w-8 h-8 text-indigo-600" />}
                <div>
                  <div className={`text-2xl font-bold ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {count}
                  </div>
                  <div className={`text-sm ${
                    isPositive ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {type.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CorrelationInsights;