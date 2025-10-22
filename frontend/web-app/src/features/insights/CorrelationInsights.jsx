import React, { useState } from 'react';
import { useCorrelations } from '../../../../shared/hooks/useCorrelations';
import { useAuth } from '../../contexts/AuthProvider';
import { AlertTriangle, CheckCircle, Eye, Target, Activity, Clock } from 'lucide-react';
import { Button, Select, Alert, Card } from '../../../../shared/components/ui';

const CorrelationInsights = () => {
  const [timeframeFilter, setTimeframeFilter] = useState(180);
  const [showAllTriggers, setShowAllTriggers] = useState(false);
  const [showAllHelpers, setShowAllHelpers] = useState(false);
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { 
    correlations,  
    loading: correlationsLoading, 
    error
  } = useCorrelations(0.6, timeframeFilter);

  // Organize correlations into user-friendly categories
  const organizeInsights = (correlations) => {
    const triggers = [];
    const helpers = [];
    const patterns = [];

    correlations.forEach((correlation, index) => {
      if (correlation.confidence < 0.3) return; // Skip low confidence
      
      // Create unique ID by combining multiple values
      const uniqueId = `${correlation.trigger}-${correlation.type}-${correlation.effect}-${index}`;
      
      // Patterns (food-property-pattern)
      if (correlation.type === 'food-property-pattern') {
        patterns.push({
          id: uniqueId,
          name: correlation.trigger,
          description: correlation.effect,
          confidence: correlation.confidence,
          percentage: Math.round(correlation.confidence * 100),
          occurrences: correlation.occurrences,
          opportunities: correlation.totalOpportunities,
          foods: correlation.contributingFoods || [],
          insight: correlation.patternInsight,
          action: getPatternAction(correlation),
          timeframe: correlation.timeWindowDescription
        });
        return;
      }

      // Determine if positive or negative
      const isPositive = (correlation.type === 'supplement-effect' && correlation.effect.includes('reduced')) || 
                        correlation.type === 'sleep-quality' ||
                        (correlation.type === 'exercise-energy' && correlation.effect.includes('increased'));

      const item = {
        id: uniqueId,
        name: correlation.trigger,
        description: correlation.effect,
        confidence: correlation.confidence,
        percentage: Math.round(correlation.confidence * 100),
        occurrences: correlation.occurrences,
        opportunities: correlation.totalOpportunities || correlation.sessionsAnalyzed,
        action: getActionRecommendation(correlation),
        timeframe: correlation.timeWindowDescription,
        severity: correlation.avgSeverity,
        type: correlation.type
      };

      if (isPositive) {
        helpers.push(item);
      } else {
        triggers.push(item);
      }
    });

    // Sort by confidence/impact
    triggers.sort((a, b) => b.confidence - a.confidence);
    helpers.sort((a, b) => b.confidence - a.confidence);
    patterns.sort((a, b) => b.confidence - a.confidence);

    return { triggers, helpers, patterns };
  };

  const getPatternAction = (correlation) => {
    const percentage = Math.round(correlation.confidence * 100);
    const foods = correlation.contributingFoods || [];
    
    if (percentage >= 70) {
      return `Try avoiding ${foods.join(', ')} for 2-3 weeks to test this pattern`;
    } else if (percentage >= 50) {
      return `Monitor your reactions to ${foods.join(', ')} more closely`;
    } else {
      return `Keep tracking to confirm this potential pattern`;
    }
  };

  const getActionRecommendation = (correlation) => {
    const percentage = Math.round(correlation.confidence * 100);
    const trigger = correlation.trigger;
    const type = correlation.type;

    if (type === 'food-symptom' || type === 'medication-effect') {
      if (percentage >= 70) {
        return `Avoid ${trigger} for 2-4 weeks to test sensitivity`;
      } else if (percentage >= 50) {
        return `Monitor ${trigger} consumption and symptoms closely`;
      } else {
        return `Continue tracking ${trigger} to confirm pattern`;
      }
    } else if (type === 'supplement-improvement') {
      if (percentage >= 60) {
        return `Continue ${trigger} - showing positive effects`;
      } else if (percentage >= 40) {
        return `Keep taking ${trigger} while monitoring results`;
      } else {
        return `Monitor ${trigger} effectiveness over longer period`;
      }
    } else if (type === 'exercise-energy') {
      if (correlation.effect.includes('increased')) {
        return `Continue ${trigger} - appears to boost your energy`;
      } else {
        return `Consider adjusting ${trigger} timing or intensity`;
      }
    } else if (type === 'sleep-quality') {
      if (correlation.effect.includes('improved')) {
        return `Continue ${trigger} - helping your sleep quality`;
      } else {
        return `Consider adjusting ${trigger} timing or dosage`;
      }
    }

    return `Continue tracking to understand this pattern`;
  };

  const { triggers, helpers, patterns } = organizeInsights(correlations || []);

  const loading = authLoading || correlationsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg text-gray-600">Analyzing your health patterns...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="warning" title="Please log in">
        Log in to see your personalized health insights.
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Unable to load insights">
        We're having trouble analyzing your data right now.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Your Health Insights</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <Select
            value={timeframeFilter}
            onChange={(e) => setTimeframeFilter(parseInt(e.target.value))}
            className="text-sm"
          >
            <Select.Option value={30}>Last 30 days</Select.Option>
            <Select.Option value={90}>Last 3 months</Select.Option>
            <Select.Option value={180}>Last 6 months</Select.Option>
            <Select.Option value={365}>Last year</Select.Option>
          </Select>
        </div>
      </div>

      {/* Triggers to Avoid */}
      {triggers.length > 0 && (
        <Card variant="error" className="shadow-sm">
          <div className="p-4 border-b border-avoid-100 bg-avoid-50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-avoid-600" />
              <h3 className="text-lg font-semibold text-avoid-800">Triggers to Avoid</h3>
            </div>
            <p className="text-sm text-avoid-600 mt-1">These items may be causing your symptoms</p>
          </div>
          <div className="p-4 space-y-3">
            {(showAllTriggers ? triggers : triggers.slice(0, 3)).map((trigger) => (
              <div key={trigger.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{trigger.name}</span>
                    <span className="text-sm text-gray-500">→ {trigger.description}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{trigger.action}</p>
                  {trigger.timeframe && (
                    <p className="text-xs text-gray-500">Usually happens {trigger.timeframe}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-avoid-600">
                    {trigger.percentage}%
                  </div>
                  {trigger.occurrences && trigger.opportunities && (
                    <div className="text-sm text-gray-500">
                      {trigger.occurrences}/{trigger.opportunities}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {triggers.length > 3 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllTriggers(!showAllTriggers)}
                >
                  {showAllTriggers ? 'Show Less' : `Show ${triggers.length - 3} More`}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Watch for Patterns */}
      {patterns.length > 0 && (
        <Card variant="warning" className="shadow-sm">
          <div className="p-4 border-b border-accent-100 bg-accent-50">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-accent-600" />
              <h3 className="text-lg font-semibold text-accent-800">Watch for Patterns</h3>
            </div>
            <p className="text-sm text-accent-600 mt-1">These patterns might explain multiple symptoms</p>
          </div>
          <div className="p-4 space-y-3">
            {(showAllPatterns ? patterns : patterns.slice(0, 2)).map((pattern) => (
              <div key={pattern.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{pattern.name}</span>
                    <span className="text-sm text-gray-500">→ {pattern.description}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{pattern.action}</p>
                  {pattern.foods.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Found in: {pattern.foods.slice(0, 3).join(', ')}
                      {pattern.foods.length > 3 && ` and ${pattern.foods.length - 3} others`}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-accent-600">
                    {pattern.percentage}%
                  </div>
                  {pattern.occurrences && pattern.opportunities && (
                    <div className="text-sm text-gray-500">
                      {pattern.occurrences}/{pattern.opportunities}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {patterns.length > 2 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllPatterns(!showAllPatterns)}
                >
                  {showAllPatterns ? 'Show Less' : `Show ${patterns.length - 2} More`}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Things That Help */}
      {helpers.length > 0 && (
        <Card variant="success" className="shadow-sm">
          <div className="p-4 border-b border-allowed-100 bg-allowed-50">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-allowed-600" />
              <h3 className="text-lg font-semibold text-allowed-800">Things That Help</h3>
            </div>
            <p className="text-sm text-allowed-600 mt-1">Keep doing these - they're working for you</p>
          </div>
          <div className="p-4 space-y-3">
            {(showAllHelpers ? helpers : helpers.slice(0, 3)).map((helper) => (
              <div key={helper.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{helper.name}</span>
                    <span className="text-sm text-gray-500">→ {helper.description}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{helper.action}</p>
                  {helper.timeframe && (
                    <p className="text-xs text-gray-500">Effect noticed {helper.timeframe}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold text-allowed-600">
                    {helper.percentage}%
                  </div>
                  {helper.occurrences && helper.opportunities && (
                    <div className="text-sm text-gray-500">
                      {helper.occurrences}/{helper.opportunities}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {helpers.length > 3 && (
              <div className="text-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllHelpers(!showAllHelpers)}
                >
                  {showAllHelpers ? 'Show Less' : `Show ${helpers.length - 3} More`}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* No insights message */}
      {triggers.length === 0 && helpers.length === 0 && patterns.length === 0 && (
        <Card variant="default" className="p-8 text-center">
          <Activity className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-neutral-600 mb-2">Keep tracking!</h3>
          <p className="text-neutral-500">
            We need more data to find patterns. Continue logging your symptoms, foods, and activities.
          </p>
        </Card>
      )}
    </div>
  );
};

export default CorrelationInsights;
