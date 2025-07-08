import React, { useState, useMemo } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import useAuth from '../../../../shared/hooks/useAuth';
import { AlertTriangle, TrendingUp, Clock, Target, Activity, Pill, Moon, Dumbbell, Brain, Heart, Eye } from 'lucide-react';
import { Button, Select } from '../../../../shared/components/ui';

const CorrelationInsights = () => {
  const [timeframeFilter, setTimeframeFilter] = useState(180);
  const [activeTab, setActiveTab] = useState('review');

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
    if (correlation.is_beneficial !== undefined) {
      return correlation.is_beneficial;
    }
    
    const positiveTypes = ['supplement-improvement'];
    const negativeTypes = ['food-symptom', 'medication-effect', 'stress-symptom'];
    
    if (positiveTypes.includes(correlation.type)) return true;
    if (negativeTypes.includes(correlation.type)) return false;
    
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



  // Format percentage display
  const getPercentageDisplay = (correlation) => {
    if (correlation.occurrences && correlation.total_opportunities) {
      const percentage = Math.round((correlation.occurrences / correlation.total_opportunities) * 100);
      return {
        percentage: `${percentage}%`,
        occurrence: `(${correlation.occurrences}/${correlation.total_opportunities})`
      };
    }
    
    const percentage = Math.round(correlation.confidence * 100);
    return {
      percentage: `${percentage}%`,
      occurrence: ''
    };
  };

  // Calculate impact score for sorting
  const getImpactScore = (correlation) => {
    if (correlation.impact_score !== undefined) {
      return correlation.impact_score;
    }
    
    let baseScore = correlation.confidence || 0.5;
    
    const criticalKeywords = ['severe', 'intense', 'debilitating', 'migraine', 'pain'];
    const text = (correlation.description || correlation.effect || '').toLowerCase();
    
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
      baseScore += 0.3;
    }
    
    if (correlation.type === 'medication-effect') {
      baseScore += 0.2;
    }
    
    return Math.min(baseScore, 1.0);
  };

  // Generate user-friendly description
  const getCorrelationDescription = (correlation) => {
    const isPositive = isPositiveCorrelation(correlation);
    const trigger = correlation.trigger;
    const effect = correlation.effect;
    
    if (isPositive) {
      return `💡 Your data suggests ${trigger} may help with ${effect}`;
    } else {
      return `🔍 Your data suggests ${trigger} may trigger ${effect}`;
    }
  };

  // Safe correlations array
  const safeCorrelations = correlations || [];


  
  // Filter correlations based on tab selection
  const getFilteredCorrelations = () => {
    const baseCorrelations = safeCorrelations.filter(c => c.confidence >= 0.5);
    
    // Apply tab filter
    switch (activeTab) {
      case 'review':
        return baseCorrelations.filter(c => isCriticalCorrelation(c));
      case 'observe':
        return baseCorrelations.filter(c => !isPositiveCorrelation(c) && !isCriticalCorrelation(c));
      case 'positive':
        return baseCorrelations.filter(c => isPositiveCorrelation(c));
      default:
        return baseCorrelations;
    }
  };

  // Group correlations by trigger item
  const getGroupedCorrelations = () => {
    const filteredCorrelations = getFilteredCorrelations();
    const grouped = {};
    
    filteredCorrelations.forEach(correlation => {
      const trigger = correlation.trigger;
      if (!grouped[trigger]) {
        grouped[trigger] = [];
      }
      grouped[trigger].push(correlation);
    });
    
    // Sort each group by impact score
    Object.keys(grouped).forEach(trigger => {
      grouped[trigger].sort((a, b) => getImpactScore(b) - getImpactScore(a));
    });
    
    // Convert to array and sort by highest impact correlation per trigger
    const groupedArray = Object.entries(grouped).map(([trigger, correlations]) => ({
      trigger,
      correlations,
      maxImpact: Math.max(...correlations.map(c => getImpactScore(c)))
    }));
    
    return groupedArray.sort((a, b) => b.maxImpact - a.maxImpact);
  };

  const groupedCorrelations = getGroupedCorrelations();
  const displayedGroups = showMore ? groupedCorrelations : groupedCorrelations.slice(0, 5);

  // Calculate counts for different categories
  const reviewCount = safeCorrelations.filter(c => c.confidence >= 0.5 && isCriticalCorrelation(c)).length;
  const observeCount = safeCorrelations.filter(c => c.confidence >= 0.5 && !isPositiveCorrelation(c) && !isCriticalCorrelation(c)).length;
  const positiveCount = safeCorrelations.filter(c => c.confidence >= 0.5 && isPositiveCorrelation(c)).length;
  
  // Combined loading state
  const loading = authLoading || correlationsLoading;

  // Get current tab display info
  const getTabDisplayInfo = () => {
    const totalItems = groupedCorrelations.length;
    const baseTitle = activeTab === 'review' ? 'Critical Issues to Review' : 
                     activeTab === 'observe' ? 'Patterns to Observe' :
                     'Positive Patterns to Keep Up';
    
    return { title: baseTitle, count: totalItems };
  };

  const tabInfo = getTabDisplayInfo();

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
      {/* Navigation Tabs with Time Period */}
      <div className="flex items-center justify-between space-x-2">
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
        
        <Select
          value={timeframeFilter}
          onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
          className="text-sm w-20"
        >
          <option value={30}>30d</option>
          <option value={90}>3m</option>
          <option value={180}>6m</option>
          <option value={365}>1y</option>
        </Select>
      </div>



      {/* Patterns Display */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {activeTab === 'review' && <AlertTriangle className="w-5 h-5 text-red-500" />}
            {activeTab === 'observe' && <Eye className="w-5 h-5 text-orange-500" />}
            {activeTab === 'positive' && <TrendingUp className="w-5 h-5 text-green-500" />}
            <span>{tabInfo.title}</span>
            <span className="text-sm text-gray-500">({tabInfo.count} items)</span>
          </h3>
        </div>
        
        {displayedGroups.length === 0 ? (
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
          <div className="space-y-4 p-4">
            {displayedGroups.map((group, index) => (
              <div key={group.trigger} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getCorrelationIcon(group.correlations[0])}
                    <h4 className="font-semibold text-gray-900 text-lg">{group.trigger}</h4>
                  </div>
                  
                  {group.correlations.map((correlation, corrIndex) => {
                    const percentageData = getPercentageDisplay(correlation);
                    const description = getCorrelationDescription(correlation);
                    
                    return (
                      <div key={corrIndex} className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              • {correlation.effect}
                            </span>
                            {correlation.timeWindowDescription && (
                              <span className="text-sm text-gray-500">
                                ({correlation.timeWindowDescription})
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-blue-600 ml-2">
                            {description}
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-lg font-semibold text-gray-900">
                            {percentageData.percentage}
                          </div>
                          {percentageData.occurrence && (
                            <div className="text-sm text-gray-500">
                              {percentageData.occurrence}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {/* Show More/Less Button */}
            {groupedCorrelations.length > 5 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowMore(!showMore)}
                >
                  {showMore ? 
                    `Show Less (showing all ${groupedCorrelations.length} items)` : 
                    `Show More (${groupedCorrelations.length - 5} more items)`
                  }
                </Button>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
};

export default CorrelationInsights;