import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

const MultiSelectProtocolDropdown = ({ protocols, selectedProtocols, onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getDisplayText = () => {
    if (!selectedProtocols || selectedProtocols.length === 0) return 'Select Protocols...';
    
    // Handle "No Protocol" selection
    if (selectedProtocols.includes('no_protocol')) {
      return 'No Protocol';
    }
    
    if (selectedProtocols.length === 1) {
      const protocol = protocols.find(p => p.id === selectedProtocols[0]);
      return protocol?.name || 'Protocol';
    }
    
    if (selectedProtocols.length === 2) {
      const names = selectedProtocols.map(id => {
        const protocol = protocols.find(p => p.id === id);
        return protocol?.name?.split(' ')[0] || 'Protocol';
      });
      return names.join(' + ');
    }
    
    return `${selectedProtocols.length} Active Protocols`;
  };

  const toggleProtocol = async (protocolId) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      let newSelection;
      
      // Special handling for "No Protocol" option
      if (protocolId === 'no_protocol') {
        if (selectedProtocols.includes('no_protocol')) {
          // Deselecting "No Protocol" - remove it
          newSelection = selectedProtocols.filter(id => id !== 'no_protocol');
        } else {
          // Selecting "No Protocol" - clear all others and select this
          newSelection = ['no_protocol'];
        }
      } else {
        // Regular protocol selection
        const filteredProtocols = selectedProtocols.filter(id => id !== 'no_protocol');
        newSelection = filteredProtocols.includes(protocolId)
          ? filteredProtocols.filter(id => id !== protocolId)
          : [...filteredProtocols, protocolId];
      }
      
      await onSelectionChange(newSelection);
    } catch (error) {
      console.error('Failed to update protocol selection:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.protocol-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const isNoProtocolSelected = selectedProtocols && selectedProtocols.includes('no_protocol');

  return (
    <div className="relative protocol-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="w-full p-2 text-left rounded-lg bg-white text-gray-900 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 disabled:opacity-50"
      >
        <span className="text-gray-900">{getDisplayText()}</span>
        <div className="flex items-center space-x-2">
          {isUpdating && <Loader2 size={12} className="animate-spin text-gray-400" />}
          <ChevronDown 
            size={16} 
            className={`text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          
          {/* No Protocol Option - First */}
          <label className="flex items-center space-x-3 p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100">
            <input
              type="checkbox"
              checked={isNoProtocolSelected}
              onChange={() => toggleProtocol('no_protocol')}
              disabled={isUpdating}
              className="rounded text-purple-600 focus:ring-purple-500"
            />
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">🔍 No Protocol</div>
              <div className="text-xs text-gray-600">Track freely to discover your own patterns</div>
            </div>
          </label>

          {/* Regular Protocols */}
          {protocols.map((protocol) => (
            <label
              key={protocol.id}
              className={`flex items-center space-x-3 p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                isNoProtocolSelected 
                  ? 'opacity-50 cursor-not-allowed hover:bg-gray-50' 
                  : 'hover:bg-blue-50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedProtocols && selectedProtocols.includes(protocol.id)}
                onChange={() => toggleProtocol(protocol.id)}
                disabled={isUpdating || isNoProtocolSelected}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{protocol.name}</div>
                <div className="text-xs text-gray-600">{protocol.description}</div>
              </div>
            </label>
          ))}
          
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectProtocolDropdown;