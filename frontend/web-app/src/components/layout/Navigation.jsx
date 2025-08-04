import React from 'react';
import { Button } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { Activity, Brain, TrendingUp, Utensils, AlertCircle } from 'lucide-react';

const Navigation = ({ 
  activeView, 
  onViewChange, 
  hasUnsavedChanges, 
  hasCriticalInsights,
  getProtocolDisplayText,
  selectedProtocols
}) => {
  return (
    <div className="bg-neutral-100 p-4 border-b border-neutral-200">
      {/* Protocol Display */}
      {selectedProtocols && selectedProtocols.length > 0 && (
        <div className="mb-3 text-center">
          <p className="text-xs text-neutral-500 mb-1">Active Protocols</p>
          <p className="text-sm font-medium text-neutral-700 truncate">
            {getProtocolDisplayText(selectedProtocols)}
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant={activeView === 'timeline' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('timeline')}
          size="sm"
          className="w-full"
        >
          <Activity className="w-4 h-4 mr-1" />
          <span className="whitespace-nowrap">Track</span>
        </Button>
        
        <Button
          variant={activeView === 'reflect' ? 'success' : 'secondary'}
          onClick={() => onViewChange('reflect')}
          size="sm"
          className="w-full relative"
        >
          <Brain className="w-4 h-4 mr-1" />
          <span className="whitespace-nowrap">Reflect</span>
          {hasUnsavedChanges && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full border-2 border-white"></span>
          )}
        </Button>
        
        <div className="relative w-full">
          <Button
            variant={activeView === 'insights' ? 'primary' : 'secondary'}
            onClick={() => onViewChange('insights')}
            size="sm"
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="whitespace-nowrap">Insights</span>
          </Button>
          {hasCriticalInsights && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              !
            </span>
          )}
        </div>
        
        <Button
          variant={activeView === 'protocol' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('protocol')}
          size="sm"
          className="w-full"
        >
          <Utensils className="w-4 h-4 mr-1" />
          <span className="whitespace-nowrap">Foods</span>
        </Button>
      </div>
    </div>
  );
};

export default Navigation;
