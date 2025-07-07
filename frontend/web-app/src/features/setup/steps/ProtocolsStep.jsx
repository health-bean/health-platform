import React from 'react';
import { Button } from '../../../../../shared/components/ui';

const ProtocolsStep = ({ setupData, updateSetupData, protocols, onNext, onBack, isLast, disabled }) => {
  // Debug logging at the top
  console.log('🔧 PROTOCOLS: ProtocolsStep rendered with:', {
    setupDataProtocols: setupData.protocols,
    availableProtocolsCount: protocols?.length,
    isLast: isLast,
    disabled: disabled
  });

  // Process protocols: filter, rename, and add Keto
  const processedProtocols = protocols
    .filter(protocol => {
      const name = protocol.name.toLowerCase();
      return !name.includes('elimination') && !name.includes('aip modified');
    })
    .map(protocol => {
      // Rename AIP Core to just AIP
      if (protocol.name.toLowerCase().includes('aip core')) {
        return {
          ...protocol,
          name: 'AIP',
          description: 'Autoimmune Protocol for reducing inflammation and identifying triggers'
        };
      }
      return protocol;
    });

  // Add Keto protocol (hardcoded since we can't modify backend yet)
  const ketoProtocol = {
    id: 'keto_protocol',
    name: 'Keto',
    description: 'High-fat, low-carb ketogenic diet for metabolic health and weight management'
  };

  // Sort protocols alphabetically and add Keto
  const availableProtocols = [...processedProtocols, ketoProtocol]
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log('🔧 PROTOCOLS: Available protocols:', availableProtocols.map(p => ({ id: p.id, name: p.name })));

  const handleProtocolChange = (protocolId, isChecked) => {
    console.log('🔧 PROTOCOLS: Protocol change:', { protocolId, isChecked });
    console.log('🔧 PROTOCOLS: Current setupData.protocols:', setupData.protocols);
    
    // Special handling for "no protocol" option
    if (protocolId === 'no_protocol') {
      if (isChecked) {
        // If selecting "no protocol", clear all other protocols
        console.log('🔧 PROTOCOLS: Selecting no protocol, clearing all');
        updateSetupData({ protocols: ['no_protocol'] });
      } else {
        // If deselecting "no protocol", just remove it
        console.log('🔧 PROTOCOLS: Deselecting no protocol');
        updateSetupData({ protocols: [] });
      }
      return;
    }
    
    // For regular protocols, automatically unselect "no protocol" if it was selected
    const currentProtocols = setupData.protocols.filter(id => id !== 'no_protocol');
    const newProtocols = isChecked
      ? [...currentProtocols, protocolId]
      : currentProtocols.filter(id => id !== protocolId);
    
    console.log('🔧 PROTOCOLS: New protocols array:', newProtocols);
    updateSetupData({ protocols: newProtocols });
  };

  const isNoProtocolSelected = setupData.protocols.includes('no_protocol');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Approach</h3>
        <p className="text-sm text-gray-600">
          Select healing protocols you're following, or track freely to discover your own patterns.
        </p>
      </div>

      <div className="space-y-3">
        {/* No Protocol Option - Always Clickable */}
        <label className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
          isNoProtocolSelected
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}>
          <input
            type="checkbox"
            checked={isNoProtocolSelected}
            onChange={(e) => handleProtocolChange('no_protocol', e.target.checked)}
            className="mt-1 rounded text-purple-600 focus:ring-purple-500"
          />
          <div>
            <div className="font-medium">🔍 No Protocol</div>
            <div className="text-sm text-gray-600">
              Track your health journey freely to discover your own patterns and correlations.
            </div>
          </div>
        </label>

        {/* Regular Protocols - Always Clickable */}
        {availableProtocols.map((protocol) => (
          <label
            key={protocol.id}
            className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              setupData.protocols.includes(protocol.id)
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={setupData.protocols.includes(protocol.id)}
              onChange={(e) => handleProtocolChange(protocol.id, e.target.checked)}
              className="mt-1 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium">{protocol.name}</div>
              <div className="text-sm text-gray-600">{protocol.description}</div>
            </div>
          </label>
        ))}
      </div>

      {isNoProtocolSelected && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <div className="text-purple-600 text-lg">💡</div>
            <div className="text-sm text-purple-800">
              <div className="font-medium">Free Tracking Mode</div>
              <div className="text-purple-700">
                You'll be able to track foods, symptoms, and activities without protocol restrictions. 
                Our AI will still analyze your data to find personalized patterns and correlations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons - Respect disabled prop */}
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
};

export default ProtocolsStep;