import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Pill } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useApi } from '../../hooks/useApi';

const SmartMedicationSelector = ({ 
  selectedMedications = [], 
  onMedicationsChange, 
  placeholder = "Search medications...",
  prioritizeUserHistory = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use the proper API client that sends demo headers
  const apiClient = useApi();

  useEffect(() => {
    const loadMedications = async () => {
      if (!searchTerm.trim()) {
        setMedications([]);
        return;
      }

      setLoading(true);
      try {
        let endpoint = `/api/v1/medications/search?search=${encodeURIComponent(searchTerm)}`;
        if (prioritizeUserHistory) {
          endpoint += '&prioritize_user_history=true';
        }

        const data = await apiClient.get(endpoint);
        setMedications(data.medications || []);
      } catch (err) {
        // Handle error silently
        setMedications([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadMedications, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, prioritizeUserHistory, apiClient]);

  const isSelected = (medication) => {
    return selectedMedications.some(item => item.name === medication.name);
  };

  const handleAddMedication = (medication) => {
    if (!isSelected(medication)) {
      const newMedication = {
        id: medication.id,
        name: medication.name,
        source: medication.source || 'database'
      };
      onMedicationsChange([...selectedMedications, newMedication]);
      setSearchTerm(''); // Clear search after adding
    }
  };

  const handleRemoveMedication = (medicationToRemove) => {
    onMedicationsChange(selectedMedications.filter(medication => medication.name !== medicationToRemove.name));
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
      {searchTerm && medications.length > 0 && (
        <Card className="max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {medications.map((medication) => (
              <button
                key={`${medication.name}-${medication.source || 'db'}`}
                onClick={() => handleAddMedication(medication)}
                disabled={isSelected(medication)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  isSelected(medication) && "bg-gray-50 text-gray-400 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{medication.name}</span>
                  <div className="flex items-center space-x-2">
                    {medication.source === 'user_history' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        From your history
                      </span>
                    )}
                    {isSelected(medication) ? (
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

      {/* Selected Medications */}
      {selectedMedications.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Medications ({selectedMedications.length})
          </label>
          {selectedMedications.map((medication) => (
            <Card key={medication.name} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Pill size={16} className="text-red-500" />
                  <span className="font-medium capitalize">{medication.name}</span>
                  {medication.source === 'user_history' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      From your history
                    </span>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMedication(medication)}
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
      {selectedMedications.length === 0 && !searchTerm && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Start typing to search for medications
        </div>
      )}
    </div>
  );
};

export default SmartMedicationSelector;
