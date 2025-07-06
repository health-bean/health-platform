import React from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '../../../../shared/components/ui';
import MultiSelectProtocolDropdown from '../common/MultiSelectProtocolDropdown';

const Header = ({ 
  selectedDate, 
  onDateChange, 
  protocols, 
  selectedProtocols, 
  onProtocolChange,
  protocolsLoading,
  protocolsError 
}) => {
  const selectedProtocolObjects = protocols.filter(p => 
    selectedProtocols && selectedProtocols.includes(p.id)
  );

  return (
    <div className="bg-blue-600 text-white p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🚀 FILO Health Journal</h1>
        <Calendar size={24} />
      </div>
      
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="mt-2 text-gray-900 focus:ring-2 focus:ring-blue-300"
      />
      
      {/* Multi-Protocol Selection */}
      {!protocolsLoading && protocols.length > 0 && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-white mb-1">Active Protocols</label>
          <MultiSelectProtocolDropdown
            protocols={protocols}
            selectedProtocols={selectedProtocols}
            onSelectionChange={onProtocolChange}
          />
          {selectedProtocolObjects.length > 0 && (
            <p className="text-xs text-blue-100 mt-1">
              {selectedProtocolObjects.map(p => p.name).join(' + ')}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {protocolsError && (
        <div className="mt-2 text-xs text-red-200">
          Unable to load protocols: {protocolsError}
        </div>
      )}
    </div>
  );
};

export default Header;