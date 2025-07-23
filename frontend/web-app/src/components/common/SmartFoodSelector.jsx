import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';

const SmartFoodSelector = ({ selectedItems, onToggleItem, selectedProtocols = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const loadFoods = async () => {
      if (!searchTerm.trim()) {
        setFoods([]);
        return;
      }

      setLoading(true);
      try {
        const protocolId = selectedProtocols[0];
        let url = `${API_BASE_URL}/api/v1/foods/search?search=${encodeURIComponent(searchTerm)}`;
        if (protocolId && protocolId !== 'no_protocol') {
          url += `&protocol_id=${protocolId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setFoods(data.foods || []);
      } catch (err) {
        // Handle error silently
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadFoods, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedProtocols, API_BASE_URL]);

  const isSelected = (food) => {
    return selectedItems.some(item => item.name === food.name);
  };

  const handleToggleFood = (food) => {
    onToggleItem({
      id: food.id,
      name: food.name,
      category: food.category || 'Food',
      protocol_allowed: food.protocol_allowed
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Searching foods...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && foods.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Search Results ({foods.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {foods.map((food) => {
              const selected = isSelected(food);
              
              return (
                <Card
                  key={food.id}
                  variant="outlined"
                  padding="sm"
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-sm",
                    selected && "border-primary-300 bg-primary-50"
                  )}
                  onClick={() => handleToggleFood(food)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {food.name}
                        </p>
                        {food.source === 'user_history' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            From your history
                          </span>
                        )}
                        {food.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {food.category}
                          </span>
                        )}
                      </div>
                      
                      {/* Protocol Status */}
                      {selectedProtocols.length > 0 && selectedProtocols[0] !== 'no_protocol' && (
                        <div className="mt-1">
                          {food.compliance_status === 'allowed' ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              Included
                            </span>
                          ) : food.compliance_status === 'avoid' ? (
                            <span className="inline-flex items-center text-xs text-red-600">
                              ❌ Avoid for now
                            </span>
                          ) : food.compliance_status === 'reintroduction' ? (
                            <span className="inline-flex items-center text-xs text-yellow-600">
                              🟡 Try in moderation
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-gray-600">
                              ❓ Not specified in protocol
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant={selected ? "success" : "outline"}
                      size="sm"
                      className="ml-3"
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
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && searchTerm.trim() && foods.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-2">
            No foods found for "{searchTerm}"
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleFood({
              id: `custom_${Date.now()}`,
              name: searchTerm,
              category: 'Custom',
              protocol_allowed: null
            })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add "{searchTerm}" as custom food
          </Button>
        </div>
      )}

      {/* Search Prompt */}
      {!loading && !searchTerm.trim() && (
        <div className="text-center py-6">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Start typing to search for foods
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartFoodSelector;
