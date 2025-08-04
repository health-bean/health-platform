import React from 'react';
import { Button } from '../../../../shared/components/ui';
import { cn, getHealthColor } from '../../../../shared/design-system';
import { Zap } from 'lucide-react';

const QuickChecks = ({ type, preferences, onQuickSelect }) => {
  const getQuickItems = () => {
    if (!preferences) return [];
    
    switch(type) {
      case 'supplement': return preferences.quick_supplements || [];
      case 'medication': return preferences.quick_medications || [];
      case 'food': return preferences.quick_foods || [];
      case 'symptom': return preferences.quick_symptoms || [];
      case 'detox': return preferences.quick_detox || [];
      default: return [];
    }
  };

  const getTypeConfig = (type) => {
    const configs = {
      supplement: {
        color: 'health-supplement border hover:bg-primary-100 transition-standard',
        label: 'Quick Supplements'
      },
      medication: {
        color: 'health-medication border hover:bg-lavender-100 transition-standard',
        label: 'Quick Medications'
      },
      food: {
        color: 'health-food border hover:bg-accent-100 transition-standard',
        label: 'Quick Foods'
      },
      symptom: {
        color: 'health-symptom border hover:bg-coral-100 transition-standard',
        label: 'Quick Symptoms'
      },
      detox: {
        color: 'health-improvement border hover:bg-sage-100 transition-standard',
        label: 'Quick Detox'
      }
    };
    
    return configs[type] || configs.food;
  };

  const quickItems = getQuickItems();
  const typeConfig = getTypeConfig(type);

  if (quickItems.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
        <h4 className="text-sm font-medium text-gray-700">
          {typeConfig.label}
        </h4>
      </div>

      {/* Quick Items */}
      <div className="flex flex-wrap gap-2">
        {quickItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onQuickSelect(item.name)}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border transition-all duration-200',
              'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
              typeConfig.color
            )}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2">
        Tap any item to quickly add it to your log
      </p>
    </div>
  );
};

export default QuickChecks;
