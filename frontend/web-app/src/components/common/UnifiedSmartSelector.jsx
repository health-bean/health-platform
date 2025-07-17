import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2, X, AlertCircle, Pill, Droplets } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useSimpleApi } from '../../hooks/useSimpleApi';

// Import the working food search hook
import { useFoodSearch } from '../../../../shared/hooks/useProtocolFoods';

const UnifiedSmartSelector = ({ 
  type, // 'food', 'symptom', 'supplement', 'medication', 'exposure', 'detox'
  selectedItems = [], 
  onItemsChange, 
  selectedProtocols = [],
  prioritizeUserHistory = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use the proper API client that sends demo headers
  const apiClient = useSimpleApi();

  // Use the working food search hook for food searches
  const { 
    foods: foodSearchResults, 
    loading: foodSearchLoading, 
    searchFoods 
  } = useFoodSearch();

  // Type-specific configuration
  const typeConfig = {
    food: {
      placeholder: 'Add your foods...',
      emptyState: 'Start typing to add foods',
      endpoint: '/api/v1/foods/search',
      icon: '🍎',
      color: 'blue'
    },
    symptom: {
      placeholder: 'Add your symptoms...',
      emptyState: 'Start typing to add symptoms',
      endpoint: '/api/v1/symptoms/search',
      icon: AlertCircle,
      color: 'orange'
    },
    supplement: {
      placeholder: 'Add your supplements...',
      emptyState: 'Start typing to add supplements',
      endpoint: '/api/v1/supplements/search',
      icon: Pill,
      color: 'green'
    },
    medication: {
      placeholder: 'Add your medications...',
      emptyState: 'Start typing to add medications',
      endpoint: '/api/v1/medications/search',
      icon: Pill,
      color: 'red'
    },
    exposure: {
      placeholder: 'Add your exposures...',
      emptyState: 'Start typing to add environmental exposures',
      endpoint: '/api/v1/exposures/search', // Will need to create this
      icon: '🌿',
      color: 'yellow'
    },
    detox: {
      placeholder: 'Add your detox activities...',
      emptyState: 'Start typing to add detox activities',
      endpoint: '/api/v1/detox-types/search',
      icon: Droplets,
      color: 'purple'
    }
  };

  const config = typeConfig[type] || typeConfig.food;

  // Use the working food search pattern from Foods tab
  useEffect(() => {
    if (!searchTerm.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (type === 'food') {
      // Use the working food search hook for foods
      console.log('🔍 UnifiedSmartSelector: Using working food search pattern');
      
      const timer = setTimeout(() => {
        const protocolId = selectedProtocols.length > 0 && selectedProtocols[0] !== 'no_protocol' 
          ? selectedProtocols[0] 
          : null;
          
        console.log('🔍 UnifiedSmartSelector: Calling searchFoods with:', {
          search: searchTerm,
          protocol_id: protocolId
        });
        
        searchFoods({ 
          search: searchTerm, 
          protocol_id: protocolId 
        });
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      // For non-food types, use the old fetch method (for now)
      loadNonFoodItems();
    }
  }, [searchTerm, selectedProtocols, type]);

  // Update items when food search results change
  useEffect(() => {
    if (type === 'food') {
      setItems(foodSearchResults || []);
      setLoading(foodSearchLoading);
    }
  }, [foodSearchResults, foodSearchLoading, type]);

  const loadNonFoodItems = async () => {
    setLoading(true);
    try {
      let endpoint = `${config.endpoint}?search=${encodeURIComponent(searchTerm)}`;
      
      if (prioritizeUserHistory) {
        endpoint += '&prioritize_user_history=true';
      }

      const data = await apiClient.get(endpoint);
      
      // Handle different response formats
      const itemsKey = {
        symptom: 'symptoms', 
        supplement: 'supplements',
        medication: 'medications',
        exposure: 'exposures',
        detox: 'detox_types'
      }[type] || 'items';
      
      setItems(data[itemsKey] || []);
    } catch (err) {
      console.error(`Failed to load ${type}s:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (item) => {
    return selectedItems.some(selectedItem => selectedItem.name === item.name);
  };

  const handleToggleItem = (item) => {
    console.log('🔧 UnifiedSmartSelector: handleToggleItem called with:', item);
    console.log('🔧 UnifiedSmartSelector: Current selectedItems:', selectedItems);
    console.log('🔧 UnifiedSmartSelector: onItemsChange function:', typeof onItemsChange);
    
    if (isSelected(item)) {
      // Remove item
      console.log('🔧 UnifiedSmartSelector: Removing item');
      const newItems = selectedItems.filter(selectedItem => selectedItem.name !== item.name);
      console.log('🔧 UnifiedSmartSelector: New items after removal:', newItems);
      onItemsChange(newItems);
    } else {
      // Add item with structured data
      console.log('🔧 UnifiedSmartSelector: Adding item');
      const newItem = createStructuredItem(item);
      console.log('🔧 UnifiedSmartSelector: Created structured item:', newItem);
      const newItems = [...selectedItems, newItem];
      console.log('🔧 UnifiedSmartSelector: New items after addition:', newItems);
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
          protocol_allowed: item.compliance_status === 'included',
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

      {/* Search Results */}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Search Results ({items.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => {
              const selected = isSelected(item);
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 transition-colors border-b border-gray-100",
                    selected && "bg-primary-50"
                  )}
                  onClick={() => handleToggleItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-lg font-medium capitalize">{item.name}</span>
                        {item.source === 'user_history' && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                            From your history
                          </span>
                        )}
                        {item.category && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {item.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Food-specific protocol status */}
                      {type === 'food' && selectedProtocols.length > 0 && selectedProtocols[0] !== 'no_protocol' && (
                        <div className="mb-2">
                          {item.compliance_status === 'included' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              ✅ Included
                            </span>
                          ) : item.compliance_status === 'avoid_for_now' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              ❌ Avoid for now
                            </span>
                          ) : item.compliance_status === 'try_in_moderation' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              🟡 Try in moderation
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              ❓ Not specified in protocol
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Food properties */}
                      {type === 'food' && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.nightshade && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs border border-red-200">🍅 Nightshade</span>
                          )}
                          {item.histamine && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs border border-orange-200">
                              Histamine: {item.histamine}
                            </span>
                          )}
                          {item.oxalate && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs border border-purple-200">
                              Oxalate: {item.oxalate}
                            </span>
                          )}
                          {item.lectin && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs border border-orange-200">🌾 Lectin</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant={selected ? "success" : "outline"}
                      size="sm"
                      className="ml-3 whitespace-nowrap"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleItem(item);
                      }}
                    >
                      {selected ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
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
                    {typeof IconComponent === 'string' ? (
                      <span className="text-lg">{IconComponent}</span>
                    ) : (
                      <IconComponent size={16} className={`text-${config.color}-500`} />
                    )}
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
