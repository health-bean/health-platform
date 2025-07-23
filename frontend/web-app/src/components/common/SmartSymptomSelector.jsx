import React, { useState, useEffect } from 'react';
import { Search, Plus, X, AlertCircle } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useApi } from '../../hooks/useApi';

const SmartSymptomSelector = ({ 
  selectedSymptoms = [], 
  onSymptomsChange, 
  placeholder = "Search symptoms...",
  prioritizeUserHistory = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Use the proper API client that sends demo headers
  const apiClient = useApi();

  useEffect(() => {
    const loadSymptoms = async () => {
      if (!searchTerm.trim()) {
        setSymptoms([]);
        return;
      }

      setLoading(true);
      try {
        // Build search URL with parameters
        let endpoint = `/api/v1/symptoms/search?search=${encodeURIComponent(searchTerm)}`;
        if (prioritizeUserHistory) {
          endpoint += '&prioritize_user_history=true';
        }

        const data = await apiClient.get(endpoint);
        setSymptoms(data.symptoms || []);
      } catch (err) {
        // Handle error silently
        setSymptoms([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadSymptoms, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, prioritizeUserHistory, apiClient]);

  const isSelected = (symptom) => {
    return selectedSymptoms.some(item => item.name === symptom.name);
  };

  const handleAddSymptom = (symptom) => {
    if (!isSelected(symptom)) {
      const newSymptom = {
        id: symptom.id,
        name: symptom.name,
        severity: 5, // Default severity
        source: symptom.source || 'database' // 'user_history' or 'database'
      };
      onSymptomsChange([...selectedSymptoms, newSymptom]);
      setSearchTerm(''); // Clear search after adding
    }
  };

  const handleRemoveSymptom = (symptomToRemove) => {
    onSymptomsChange(selectedSymptoms.filter(symptom => symptom.name !== symptomToRemove.name));
  };

  const handleSeverityChange = (symptomName, severity) => {
    const updatedSymptoms = selectedSymptoms.map(symptom => 
      symptom.name === symptomName 
        ? { ...symptom, severity: parseInt(severity) }
        : symptom
    );
    onSymptomsChange(updatedSymptoms);
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
      {searchTerm && symptoms.length > 0 && (
        <Card className="max-h-48 overflow-y-auto">
          <div className="p-2 space-y-1">
            {symptoms.map((symptom) => (
              <button
                key={`${symptom.name}-${symptom.source || 'db'}`}
                onClick={() => handleAddSymptom(symptom)}
                disabled={isSelected(symptom)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  isSelected(symptom) && "bg-gray-50 text-gray-400 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{symptom.name}</span>
                  <div className="flex items-center space-x-2">
                    {symptom.source === 'user_history' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Your history
                      </span>
                    )}
                    {isSelected(symptom) ? (
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

      {/* Selected Symptoms */}
      {selectedSymptoms.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Symptoms ({selectedSymptoms.length})
          </label>
          {selectedSymptoms.map((symptom) => (
            <Card key={symptom.name} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle size={16} className="text-orange-500" />
                    <span className="font-medium capitalize">{symptom.name}</span>
                    {symptom.source === 'user_history' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        From your history
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <label className="text-sm text-gray-600">
                      Severity: {symptom.severity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={symptom.severity}
                      onChange={(e) => handleSeverityChange(symptom.name, e.target.value)}
                      className="flex-1 max-w-32"
                    />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSymptom(symptom)}
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
      {selectedSymptoms.length === 0 && !searchTerm && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Start typing to search for symptoms you experienced during sleep
        </div>
      )}
    </div>
  );
};

export default SmartSymptomSelector;
