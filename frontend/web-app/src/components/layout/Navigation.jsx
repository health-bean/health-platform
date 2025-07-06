import React from 'react';
import { Button } from '../../../../shared/components/ui';

const Navigation = ({ 
  activeView, 
  onViewChange, 
  hasUnsavedChanges, 
  hasCriticalInsights,
  onSetupClick,
  getProtocolDisplayText,
  selectedProtocols
}) => {
  return (
    <div className="bg-gray-50 p-4 border-b">
      <div className="flex space-x-3">
        <Button
          variant={activeView === 'timeline' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('timeline')}
          size="sm"
        >
          Track
        </Button>
        <Button
          variant={activeView === 'reflect' ? 'success' : 'secondary'}
          onClick={() => onViewChange('reflect')}
          size="sm"
        >
          Reflect
          {hasUnsavedChanges && (
            <span className="ml-1 w-2 h-2 bg-orange-400 rounded-full"></span>
          )}
        </Button>
        <div className="relative">
          <Button
            variant={activeView === 'insights' ? 'primary' : 'secondary'}
            onClick={() => onViewChange('insights')}
            size="sm"
          >
            Insights
          </Button>
          {hasCriticalInsights && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              !
            </span>
          )}
        </div>
        <Button
          variant={activeView === 'protocol' ? 'primary' : 'secondary'}
          onClick={() => onViewChange('protocol')}
          size="sm"
        >
          Foods
        </Button>
        
        {/* Setup Access Button */}
        <Button
          variant="ghost"
          onClick={onSetupClick}
          size="sm"
          className="ml-auto"
          title="Setup & Preferences"
        >
          ⚙️
        </Button>
      </div>
      
      {selectedProtocols.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          Following: <span className="font-medium text-blue-600">{getProtocolDisplayText()}</span>
        </div>
      )}
    </div>
  );
};

export default Navigation;