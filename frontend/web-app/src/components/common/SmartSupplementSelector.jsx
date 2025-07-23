import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Pill } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useApi } from '../../hooks/useApi';

const SmartSupplementSelector = ({ 
  selectedSupplements = [], 
  onSupplementsChange, 
  placeholder = "Search supplements...",
  prioritizeUserHistory = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use the proper API client that sends demo headers
  const apiClient = useApi();

  useEffect(() => {
    const loadSupplements = async () => {
      if (!searchTerm.trim()) {
        setSupplements([]);
        return;
      }

      setLoading(true);
      try {
        let endpoint = `/api/v1/supplements/search?search=${encodeURIComponent(searchTerm)}`;
        if (prioritizeUserHistory) {
          endpoint += '&prioritize_user_history=true';
        }

        const data = await apiClient.get(endpoint);
        setSupplements(data.supplements || []);
      } catch (err) {
        // Handle error silently
        setSupplements([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadSupplements, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, prioritizeUserHistory, apiClient]);

  const isSelected = (supplement) => {
    return selectedSupplements.some(item => item.name === supplement.name);
  };

  const handleAddSupplement = (supplement) => {
    if (!isSelected(supplement)) {
      const newSupplement = {
        id: supplement.id,
        name: supplement.name,
        source: supplement.source || 'database'
      };
      onSupplementsChange([...selectedSupplements, newSupplement]);
      setSearchTerm(''); // Clear search after adding
    }
  };

  const handleRemoveSupplement = (supplementToRemove) => {
    onSupplementsChange(selectedSupplements.filter(supplement => supplement.name !== supplementToRemove.name));
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchTerm && supplements.length > 0 && (
        <Card className="max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {supplements.map((supplement) => (
              <button
                key={`${supplement.name}-${supplement.source || 'db'}`}
                onClick={() => handleAddSupplement(supplement)}
                disabled={isSelected(supplement)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  isSelected(supplement) && "bg-gray-50 text-gray-400 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{supplement.name}</span>
                  <div className="flex items-center space-x-2">
                    {supplement.source === 'user_history' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        From your history
                      </span>
                    )}
                    {isSelected(supplement) ? (
                      <span className="text-green-600 text-xs">Added</span>
                    ) : (
                      <Plus size={14} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Supplements */}
      {selectedSupplements.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Supplements ({selectedSupplements.length})
          </label>
          {selectedSupplements.map((supplement) => (
            <Card key={supplement.name} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Pill size={16} className="text-green-500" />
                  <span className="font-medium capitalize">{supplement.name}</span>
                  {supplement.source === 'user_history' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      From your history
                    </span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSupplement(supplement)}
                  className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {selectedSupplements.length === 0 && !searchTerm && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Start typing to search for supplements
        </div>
      )}
    </div>
  );
};

export default SmartSupplementSelector;
