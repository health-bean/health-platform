import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2, X } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';

// Import the unified search hook and configuration
import { useUnifiedSearch } from '../../../../shared/hooks/useUnifiedSearch';
import { getSelectorConfig } from '../../../../shared/config/selectorTypes';

const UnifiedSmartSelector = ({ 
  type, // 'food', 'symptom', 'supplement', 'medication', 'exposure', 'detox'
  selectedItems = [], 
  onItemsChange, 
  selectedProtocols = [],
  prioritizeUserHistory = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Use the unified search hook for all types
  const protocolId = selectedProtocols.length > 0 && selectedProtocols[0] !== 'no_protocol' 
    ? selectedProtocols[0] 
    : null;
    
  const { 
    items, 
    loading, 
    error,
    searchItems,
    clearResults
  } = useUnifiedSearch({ 
    type,
    protocolId,
    enableCache: true,
    debounceMs: 300,
    prioritizeUserHistory
  });

  // Get unified configuration for this selector type
  const config = getSelectorConfig(type);

  // Handle search for all item types using unified hook
  useEffect(() => {
    if (!searchTerm.trim()) {
      clearResults();
      return;
    }

    // Use the unified search for all types (handles debouncing internally)
    searchItems(searchTerm);
  }, [searchTerm, searchItems, clearResults]);

  const isSelected = (item) => {
    return selectedItems.some(selectedItem => selectedItem.name === item.name);
  };

  const handleToggleItem = (item) => {
    if (isSelected(item)) {
      // Remove item
      const newItems = selectedItems.filter(selectedItem => selectedItem.name !== item.name);
      onItemsChange(newItems);
    } else {
      // Add item with structured data
      const newItem = createStructuredItem(item);
      const newItems = [...selectedItems, newItem];
      onItemsChange(newItems);
    }
    setSearchTerm(''); // Clear search after adding
  };

  const createStructuredItem = (item) => {
    const baseItem = {
      id: item.id,
      name: item.name,
      source: item.source || 'database'
    };

    // Add type-specific structured data
    switch (type) {
      case 'food':
        return {
          ...baseItem,
          category: item.category,
          protocol_allowed: item.compliance_status === 'allowed',
          compliance_status: item.compliance_status || 'unknown'
        };
      case 'symptom':
        return {
          ...baseItem,
          severity: 5 // Default severity, will be adjustable
        };
      case 'detox':
        return {
          ...baseItem,
          duration_minutes: 15 // Default duration, will be adjustable
        };
      default:
        return baseItem;
    }
  };

  const updateItemProperty = (itemName, property, value) => {
    const updatedItems = selectedItems.map(item => 
      item.name === itemName 
        ? { ...item, [property]: value }
        : item
    );
    onItemsChange(updatedItems);
  };

  const IconComponent = config.icon;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <Input
          placeholder={config.placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Searching {type}s...</span>
        </div>
      )}

      {/* Search Results - Simplified for Mobile */}
      {!loading && items.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Results ({items.length})
          </h4>
          <div className="border rounded-md overflow-hidden">
            {items.map((item) => {
              const selected = isSelected(item);
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-2 border-b last:border-b-0",
                    selected ? "bg-primary-50" : "bg-white"
                  )}
                >
                  <span className="font-medium truncate">{item.name}</span>
                  <Button
                    variant={selected ? "success" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleItem(item);
                    }}
                  >
                    {selected ? "Added" : "Add"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Selected {type}s ({selectedItems.length})
          </h4>
          {selectedItems.map((item) => (
            <Card key={item.name} variant="outlined" padding="sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent size={16} className={config.colorClass} />
                    <span className="font-medium">{item.name}</span>
                    {item.source === 'user_history' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        From your history
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleItem(item)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>

                {/* Type-specific additional controls */}
                {type === 'symptom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity: {item.severity}/10
                    </label>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <span>Mild</span>
                      <div className="flex-1"></div>
                      <span>Severe</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={item.severity}
                      onChange={(e) => updateItemProperty(item.name, 'severity', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {type === 'detox' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration: {item.duration_minutes} minutes
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        value={item.duration_minutes}
                        onChange={(e) => updateItemProperty(item.name, 'duration_minutes', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="5"
                          max="180"
                          value={item.duration_minutes}
                          onChange={(e) => updateItemProperty(item.name, 'duration_minutes', Math.max(5, parseInt(e.target.value) || 5))}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <span className="text-sm text-gray-500">min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && selectedItems.length === 0 && !searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">{config.emptyState}</div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSmartSelector;
