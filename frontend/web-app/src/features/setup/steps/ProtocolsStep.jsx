import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const ProtocolsStep = ({ setupData, updateSetupData, protocols, onNext, onBack, isLast, disabled }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Protocols</h3>
      <p className="text-sm text-gray-600">Choose the healing protocols you're following. You can select multiple.</p>
    </div>

    <div className="space-y-3">
      {protocols.map((protocol) => (
        <label
          key={protocol.id}
          className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : setupData.protocols.includes(protocol.id) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="checkbox"
            checked={setupData.protocols.includes(protocol.id)}
            disabled={disabled}
            onChange={(e) => {
              if (disabled) return;
              const newProtocols = e.target.checked
                ? [...setupData.protocols, protocol.id]
                : setupData.protocols.filter(id => id !== protocol.id);
              updateSetupData({ protocols: newProtocols });
            }}
            className="mt-1 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
          />
          <div>
            <div className="font-medium">{protocol.name}</div>
            <div className="text-sm text-gray-600">{protocol.description}</div>
          </div>
        </label>
      ))}
    </div>

    <div className="flex space-x-3">
      <Button 
        variant="secondary" 
        onClick={onBack} 
        disabled={disabled}
        className="flex-1"
      >
        Back
      </Button>
      <Button 
        onClick={onNext} 
        disabled={disabled || setupData.protocols.length === 0}
        className="flex-1"
      >
        {isLast ? 'Complete Setup' : 'Next'}
      </Button>
    </div>
  </div>
);

export default ProtocolsStep;