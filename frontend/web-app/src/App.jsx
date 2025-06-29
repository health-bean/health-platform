import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, CheckCircle2, X, Loader2, Search, TrendingUp, ChevronDown } from 'lucide-react';

// Import shared components and hooks
import { Button, Alert, Card, Input, Textarea, Select } from '../../shared/components/ui';
import useProtocols from '../../shared/hooks/useProtocols';
import useUserPreferences from '../../shared/hooks/useUserPreferences';
import useExposureTypes from '../../shared/hooks/useExposureTypes';
import useDetoxTypes from '../../shared/hooks/useDetoxTypes';

// Import app-specific hooks and features
import useReflectionData from './hooks/useReflectionData';
import SetupWizard from './features/setup/SetupWizard';

// =================
// API CONFIGURATION
// =================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// =================
// MULTI-SELECT PROTOCOL DROPDOWN
// =================

const MultiSelectProtocolDropdown = ({ protocols, selectedProtocols, onSelectionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getDisplayText = () => {
    if (selectedProtocols.length === 0) return 'Select Protocols...';
    
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
      const newSelection = selectedProtocols.includes(protocolId)
        ? selectedProtocols.filter(id => id !== protocolId)
        : [...selectedProtocols, protocolId];
      
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
          {protocols.map((protocol) => (
            <label
              key={protocol.id}
              className="flex items-center space-x-3 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={selectedProtocols.includes(protocol.id)}
                onChange={() => toggleProtocol(protocol.id)}
                disabled={isUpdating}
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

// =================
// SMART FOOD SELECTOR
// =================

const SmartFoodSelector = ({ selectedItems, onToggleItem, selectedProtocols = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

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
        if (protocolId) {
          url += `&protocol_id=${protocolId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setFoods(data.foods || []);
      } catch (err) {
        console.error('Failed to load foods:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadFoods, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedProtocols]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Searching foods...</div>}

      <div className="max-h-64 overflow-y-auto space-y-2">
        {foods.map((food) => {
          const isSelected = selectedItems.includes(food.name);
          
          return (
            <div key={food.id} className={`p-3 border rounded-lg cursor-pointer transition-all ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => onToggleItem(food.name)}>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleItem(food.name)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium capitalize">{food.name}</span>
                {food.protocol_status && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    food.protocol_status === 'allowed' ? 'bg-green-100 text-green-800' :
                    food.protocol_status === 'avoid' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {food.protocol_status === 'allowed' ? '✅ Allowed' :
                     food.protocol_status === 'avoid' ? '❌ Avoid' : 
                     '🟡 Reintroduction'}
                  </span>
                )}
              </div>
              
              {food.protocol_notes && (
                <p className="text-xs text-blue-600 mb-2 italic">{food.protocol_notes}</p>
              )}
              
              <div className="flex flex-wrap gap-1">
                {food.nightshade && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Nightshade</span>
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  food.histamine === 'high' ? 'bg-red-100 text-red-800' :
                  food.histamine === 'moderate' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {food.histamine} histamine
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {searchTerm && !loading && foods.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No foods found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

// =================
// QUICK CHECKS COMPONENT
// =================

const QuickChecks = ({ type, preferences, onQuickSelect }) => {
  const getQuickItems = () => {
    switch(type) {
      case 'supplement': return preferences.quick_supplements || [];
      case 'medication': return preferences.quick_medications || [];
      case 'food': return preferences.quick_foods || [];
      case 'symptom': return preferences.quick_symptoms || [];
      case 'detox': return preferences.quick_detox || [];
      default: return [];
    }
  };

  const quickItems = getQuickItems();

  if (quickItems.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">⚡ Quick Checks</h4>
      <div className="flex flex-wrap gap-2">
        {quickItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onQuickSelect(item.name)}
            className={`px-3 py-1.5 text-sm rounded-full hover:opacity-80 transition-colors ${
              type === 'detox' 
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

// =================
// MAIN APP COMPONENT
// =================

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [activeView, setActiveView] = useState('timeline');
  const [showSetup, setShowSetup] = useState(false);
  
  // Hooks
  const { protocols, loading: protocolsLoading, error: protocolsError } = useProtocols();
  const { preferences, updatePreferences, loading: preferencesLoading, error: preferencesError, isReady } = useUserPreferences();
  const { exposureTypes } = useExposureTypes();
  const { detoxTypes } = useDetoxTypes();
  const { reflectionData, updateReflectionData, saveReflectionData, loading: reflectionLoading, hasUnsavedChanges } = useReflectionData(selectedDate);
  
  // Entry state
  const [newEntry, setNewEntry] = useState({
    time: new Date().toTimeString().slice(0, 5),
    type: 'food',
    selectedFoods: [],
    customText: '',
    severity: 5
  });

  // Timeline entries (API-driven)
  const [dailyEntries, setDailyEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Load timeline entries
  useEffect(() => {
    const loadTimelineEntries = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/timeline/entries?date=${selectedDate}`);
    const data = await response.json();
    setDailyEntries(data.entries || []);
  } catch (error) {
    console.error('Failed to load timeline entries:', error);
  } finally {
    setLoadingEntries(false);
  }
};

    loadTimelineEntries();
  }, [selectedDate]);

 // Show setup if not completed OR manually triggered
useEffect(() => {
  if (isReady && preferences) {
    // Auto-show setup for new users
    if (!preferences.setup_complete) {
      setShowSetup(true);
    }
  }
}, [preferences, isReady]);

// Load timeline entries when date changes
useEffect(() => {
  const loadTimelineEntries = async () => {
    try {
      setLoadingEntries(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/timeline/entries?date=${selectedDate}`);
      const data = await response.json();
      setDailyEntries(data.entries || []);
    } catch (error) {
      console.error('Failed to load timeline entries:', error);
    } finally {
      setLoadingEntries(false);
    }
  };

  if (selectedDate) {
    loadTimelineEntries();
  }
}, [selectedDate]); // Reload when selectedDate changes

  // Show loading while preferences are loading
  if (preferencesLoading || !isReady) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your health journey...</p>
        </div>
      </div>
    );
  }

  // Show error if preferences failed to load
  if (preferencesError && !preferences) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-4">
        <Alert variant="danger" title="Connection Error">
          <p className="mb-2">Unable to load your preferences.</p>
          <p className="text-sm text-gray-600 mb-3">{preferencesError}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  const selectedProtocolObjects = protocols.filter(p => 
    preferences.protocols.includes(p.id)
  );

  const getProtocolDisplayText = () => {
    if (preferences.protocols.length === 0) return 'No protocols selected';
    if (preferences.protocols.length === 1) {
      return selectedProtocolObjects[0]?.name || 'Protocol';
    }
    if (preferences.protocols.length === 2) {
      const names = selectedProtocolObjects.map(p => p.name.split(' ')[0]);
      return names.join(' + ');
    }
    return `${preferences.protocols.length} Active Protocols`;
  };

  const addEntry = async () => {
    const allItems = [...newEntry.selectedFoods];
    if (newEntry.customText.trim()) {
      allItems.push(newEntry.customText.trim());
    }
    
    if (allItems.length === 0) return;
    
    const entryData = {
      entryDate: selectedDate,
      entryTime: newEntry.time,
      entryType: newEntry.type,
      content: allItems.join(', '),
      selectedFoods: newEntry.selectedFoods,
      severity: newEntry.type === 'symptom' ? newEntry.severity : null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/timeline/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      if (response.ok) {
        const timelineResponse = await fetch(`${API_BASE_URL}/api/v1/timeline/entries?date=${selectedDate}`);
        const timelineData = await timelineResponse.json();
        setDailyEntries(timelineData.entries || []);
      }
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
    
    setNewEntry({
      time: new Date().toTimeString().slice(0, 5),
      type: 'food',
      selectedFoods: [],
      customText: '',
      severity: 5
    });
    setShowAddEntry(false);
  };

  const toggleSelectedFood = (food) => {
    const isSelected = newEntry.selectedFoods.includes(food);
    setNewEntry({
      ...newEntry,
      selectedFoods: isSelected 
        ? newEntry.selectedFoods.filter(f => f !== food)
        : [...newEntry.selectedFoods, food]
    });
  };

  const handleQuickSelect = (itemName) => {
    setNewEntry({
      ...newEntry,
      customText: newEntry.customText ? `${newEntry.customText}, ${itemName}` : itemName
    });
  };

  const getEntryIcon = (type) => ({
    food: '🍽️',
    symptom: '⚠️',
    supplement: '💊',
    medication: '💉',
    exposure: '🏭',
    detox: '🧘'
  }[type] || '📝');

  const getEntryColor = (type) => ({
    food: 'bg-green-50 border-green-200',
    symptom: 'bg-red-50 border-red-200',
    supplement: 'bg-blue-50 border-blue-200',
    medication: 'bg-purple-50 border-purple-200',
    exposure: 'bg-orange-50 border-orange-200',
    detox: 'bg-purple-50 border-purple-200'
  }[type] || 'bg-gray-50 border-gray-200');

  const hasCriticalInsights = () => {
    return dailyEntries.some(entry => entry.protocol_compliant === false);
  };

  // Future: Add this function when you implement new insights detection
  // const hasNewInsights = () => {
  //   // Example logic: check if there are new insights since last viewed
  //   // return someInsightsData.some(insight => insight.isNew && !insight.isUrgent);
  //   return false;
  // };

  if (showSetup) {
    return <SetupWizard onComplete={() => {
      setShowSetup(false);
      // Small delay to ensure UI updates
      setTimeout(() => {
        setActiveView('timeline');
      }, 100);
    }} />;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">🚀 FILO Health Journal</h1>
          <Calendar size={24} />
        </div>
        
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-2 text-gray-900 focus:ring-2 focus:ring-blue-300"
        />
        
        {/* Multi-Protocol Selection */}
        {!protocolsLoading && protocols.length > 0 && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-white mb-1">Active Protocols</label>
            <MultiSelectProtocolDropdown
              protocols={protocols}
              selectedProtocols={preferences.protocols}
              onSelectionChange={(newSelection) => 
                updatePreferences({ protocols: newSelection })
              }
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

      {/* Navigation */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex space-x-3">
          <Button
            variant={activeView === 'timeline' ? 'primary' : 'secondary'}
            onClick={() => setActiveView('timeline')}
            size="sm"
          >
            Track
          </Button>
          <Button
            variant={activeView === 'reflect' ? 'success' : 'secondary'}
            onClick={() => setActiveView('reflect')}
            size="sm"
          >
            Reflect
            {hasUnsavedChanges && (
              <span className="ml-1 w-2 h-2 bg-orange-400 rounded-full"></span>
            )}
          </Button>
          <div className="relative">
            <Button
              variant={activeView === 'insights' ? 'primary' : 'secondary'}
              onClick={() => setActiveView('insights')}
              size="sm"
            >
              Insights
            </Button>
            {hasCriticalInsights() && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                !
              </span>
            )}
            {/* Example: Blue dot for new insights (when you implement this feature) */}
            {/* 
            {hasNewInsights() && !hasCriticalInsights() && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-3 h-3"></span>
            )}
            */}
          </div>
          <Button
            variant={activeView === 'protocol' ? 'primary' : 'secondary'}
            onClick={() => setActiveView('protocol')}
            size="sm"
          >
            Foods
          </Button>
          
          {/* Setup Access Button */}
          <Button
            variant="ghost"
            onClick={() => setShowSetup(true)}
            size="sm"
            className="ml-auto"
            title="Setup & Preferences"
          >
            ⚙️
          </Button>
        </div>
        
        {preferences.protocols.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            Following: <span className="font-medium text-blue-600">{getProtocolDisplayText()}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4">
        {activeView === 'timeline' && (
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowAddEntry(!showAddEntry)}
              icon={Plus}
              className="w-full"
            >
              Add Entry
            </Button>

            {showAddEntry && (
              <Card variant="primary" className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <Input
                      type="time"
                      value={newEntry.time}
                      onChange={(e) => setNewEntry({...newEntry, time: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <Select
                      value={newEntry.type}
                      onChange={(e) => setNewEntry({...newEntry, type: e.target.value})}
                    >
                      <option value="food">Food</option>
                      <option value="symptom">Symptom</option>
                      <option value="supplement">Supplement</option>
                      <option value="medication">Medication</option>
                      <option value="exposure">Exposure</option>
                      <option value="detox">Detox</option>
                    </Select>
                  </div>
                </div>

                <Card>
                  {newEntry.type === 'food' && (
                    <div className="space-y-3">
                      <QuickChecks 
                        type="food" 
                        preferences={preferences} 
                        onQuickSelect={handleQuickSelect}
                      />
                      <SmartFoodSelector
                        selectedItems={newEntry.selectedFoods}
                        onToggleItem={toggleSelectedFood}
                        selectedProtocols={preferences.protocols}
                      />
                    </div>
                  )}
                  
                  {newEntry.type === 'exposure' && (
                    <div className="space-y-3">
                      <QuickChecks 
                        type="exposure" 
                        preferences={preferences} 
                        onQuickSelect={handleQuickSelect}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exposure Type</label>
                        <Select>
                          <option value="">Select exposure type...</option>
                          {Object.entries(
                            exposureTypes.reduce((acc, exposure) => {
                              if (!acc[exposure.category]) acc[exposure.category] = [];
                              acc[exposure.category].push(exposure);
                              return acc;
                            }, {})
                          ).map(([category, exposures]) => (
                            <optgroup key={category} label={category}>
                              {exposures.map(exposure => (
                                <option key={exposure.id} value={exposure.id}>
                                  {exposure.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <Input
                          placeholder="Describe the exposure..."
                          value={newEntry.customText}
                          onChange={(e) => setNewEntry({...newEntry, customText: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {newEntry.type === 'detox' && (
                    <div className="space-y-3">
                      <QuickChecks 
                        type="detox" 
                        preferences={preferences} 
                        onQuickSelect={handleQuickSelect}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Detox Activity</label>
                        <Select focusColor="purple">
                          <option value="">Select detox activity...</option>
                          {Object.entries(
                            detoxTypes.reduce((acc, detox) => {
                              if (!acc[detox.category]) acc[detox.category] = [];
                              acc[detox.category].push(detox);
                              return acc;
                            }, {})
                          ).map(([category, detoxes]) => (
                            <optgroup key={category} label={category}>
                              {detoxes.map(detox => (
                                <option key={detox.id} value={detox.id}>
                                  {detox.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                        <Input
                          type="number"
                          placeholder="e.g., 20"
                          focusColor="purple"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <Input
                          placeholder="Additional details..."
                          value={newEntry.customText}
                          onChange={(e) => setNewEntry({...newEntry, customText: e.target.value})}
                          focusColor="purple"
                        />
                      </div>
                    </div>
                  )}
                  
                  {['symptom', 'supplement', 'medication'].includes(newEntry.type) && (
                    <div className="space-y-3">
                      <QuickChecks 
                        type={newEntry.type} 
                        preferences={preferences} 
                        onQuickSelect={handleQuickSelect}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                        <Input
                          placeholder={`Enter ${newEntry.type} details...`}
                          value={newEntry.customText}
                          onChange={(e) => setNewEntry({...newEntry, customText: e.target.value})}
                        />
                      </div>
                      {newEntry.type === 'symptom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity: {newEntry.severity}/10
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={newEntry.severity}
                            onChange={(e) => setNewEntry({...newEntry, severity: parseInt(e.target.value)})}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                <div className="flex space-x-2">
                  <Button variant="success" onClick={addEntry} className="flex-1">
                    Add Entry
                  </Button>
                  <Button variant="secondary" onClick={() => setShowAddEntry(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Timeline Entries */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center space-x-2">
                <Clock size={18} />
                <span>Today's Timeline</span>
                {preferences.protocols.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {getProtocolDisplayText()}
                  </span>
                )}
              </h3>
              
              {loadingEntries ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                  <p>Loading entries...</p>
                </div>
              ) : dailyEntries.length > 0 ? (
                dailyEntries.map((entry) => (
                  <div key={entry.id} className={`p-3 rounded-lg border-2 ${getEntryColor(entry.entry_type)}`}>
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">{getEntryIcon(entry.entry_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-sm">{entry.entry_time}</span>
                          <span className="text-xs bg-white px-2 py-1 rounded-full capitalize">
                            {entry.entry_type}
                          </span>
                          {entry.protocol_compliant === false && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              ⚠️ Protocol Alert
                            </span>
                          )}
                          {entry.protocol_compliant === true && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✅ Compliant
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{entry.content}</p>
                        {entry.severity && (
                          <div className="text-xs text-gray-500 mt-1">
                            Severity: {entry.severity}/10
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No entries yet today</p>
                  <p className="text-sm">Add your first entry to start tracking!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'reflect' && (
          <div className="space-y-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold">End of Day Reflection</h2>
              </div>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  Unsaved changes
                </span>
              )}
            </div>

            {/* Sleep & Recovery */}
            <Card variant="primary" title="Sleep & Recovery">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime</label>
                    <Input
                      type="time"
                      value={reflectionData.bedtime}
                      onChange={(e) => updateReflectionData({ bedtime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wake Time</label>
                    <Input
                      type="time"
                      value={reflectionData.wake_time}
                      onChange={(e) => updateReflectionData({ wake_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                  <div className="flex space-x-4">
                    {['good', 'okay', 'poor'].map((quality) => (
                      <label key={quality} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="sleepQuality"
                          value={quality}
                          checked={reflectionData.sleep_quality === quality}
                          onChange={(e) => updateReflectionData({ sleep_quality: e.target.value })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm capitalize">{quality}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overnight Symptoms</label>
                  <Textarea
                    placeholder="Any pain, discomfort, or symptoms during sleep..."
                    value={reflectionData.overnight_symptoms}
                    onChange={(e) => updateReflectionData({ overnight_symptoms: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </Card>

            {/* Overall Feeling */}
            <Card variant="warning" title="Overall Feeling - End of Day">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Energy Level: {reflectionData.energy_level}/10
                  </label>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                    <span>Exhausted</span>
                    <div className="flex-1"></div>
                    <span>Energized</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={reflectionData.energy_level}
                    onChange={(e) => updateReflectionData({ energy_level: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood: {reflectionData.mood_level}/10
                  </label>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                    <span>Low/Stressed</span>
                    <div className="flex-1"></div>
                    <span>Great/Positive</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={reflectionData.mood_level}
                    onChange={(e) => updateReflectionData({ mood_level: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Physical Comfort: {reflectionData.physical_comfort}/10
                  </label>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                    <span>Pain/Discomfort</span>
                    <div className="flex-1"></div>
                    <span>Feeling Good</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={reflectionData.physical_comfort}
                    onChange={(e) => updateReflectionData({ physical_comfort: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overall Notes</label>
                  <Textarea
                    placeholder="How are you feeling overall today? Any patterns or insights?"
                    value={reflectionData.overall_notes}
                    onChange={(e) => updateReflectionData({ overall_notes: e.target.value })}
                    rows={2}
                    focusColor="orange"
                  />
                </div>
              </div>
            </Card>

            {/* Activity Level */}
            <Card variant="success" title="Activity Level">
              <div className="flex space-x-4">
                {['Light', 'Moderate', 'Intense'].map((level) => (
                  <label key={level} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="activityLevel"
                      value={level.toLowerCase()}
                      checked={reflectionData.activity_level === level.toLowerCase()}
                      onChange={(e) => updateReflectionData({ activity_level: e.target.value })}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Mindfulness & Meditation */}
            <Card title="Mindfulness & Meditation" variant="indigo">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={reflectionData.meditation_practice}
                    onChange={(e) => updateReflectionData({ meditation_practice: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500" 
                  />
                  <span className="text-sm">Meditation Practice</span>
                </label>
                
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration: {reflectionData.meditation_duration} minutes
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    value={reflectionData.meditation_duration}
                    onChange={(e) => updateReflectionData({ meditation_duration: parseInt(e.target.value) })}
                    className="w-full" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mindfulness Activities</label>
                  <Input
                    placeholder="e.g., breathing exercises, grounding, nature connection..."
                    value={reflectionData.mindfulness_activities}
                    onChange={(e) => updateReflectionData({ mindfulness_activities: e.target.value })}
                    focusColor="indigo"
                    className="text-sm"
                  />
                </div>
              </div>
            </Card>

            {/* Menstrual Cycle */}
            <Card variant="pink" title="Menstrual Cycle">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cycle Day</label>
                  <div className="flex space-x-2">
                    {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', '≥6'].map((day) => (
                      <label key={day} className="flex items-center space-x-1">
                        <input 
                          type="radio" 
                          name="cycleDay" 
                          value={day} 
                          checked={reflectionData.cycle_day === day}
                          onChange={(e) => updateReflectionData({ cycle_day: e.target.value })}
                          className="text-pink-600 focus:ring-pink-500" 
                        />
                        <span className="text-xs">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={reflectionData.ovulation}
                      onChange={(e) => updateReflectionData({ ovulation: e.target.checked })}
                      className="rounded text-pink-600 focus:ring-pink-500" 
                    />
                    <span className="text-sm">Ovulation</span>
                  </label>
                </div>
              </div>
            </Card>

            {/* Additional Reflections */}
            <Card title="Additional Reflections" variant="teal">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anything else noteworthy about today?</label>
                <Textarea
                  placeholder="Patterns, insights, connections, or anything else you want to remember..."
                  value={reflectionData.additional_reflections}
                  onChange={(e) => updateReflectionData({ additional_reflections: e.target.value })}
                  rows={3}
                  focusColor="teal"
                />
              </div>
            </Card>

            {/* Save Button */}
            <Button 
              variant="success" 
              size="lg" 
              icon={CheckCircle2} 
              className="w-full"
              loading={reflectionLoading}
              onClick={saveReflectionData}
            >
              {reflectionLoading ? 'Saving...' : 'Save Reflection'}
            </Button>

            {/* Success message */}
            {!hasUnsavedChanges && !reflectionLoading && reflectionData.bedtime && (
              <Alert variant="success" title="Reflection Saved">
                Your reflection for {selectedDate} has been saved successfully.
              </Alert>
            )}
          </div>
        )}

        {activeView === 'insights' && (
          <div className="space-y-6">
            <Card title="Health Dashboard" icon={TrendingUp} variant="primary">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {preferences.protocols.length > 0 ? '100%' : '--'}
                  </div>
                  <div className="text-sm text-gray-600">Protocol Setup</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dailyEntries.length}</div>
                  <div className="text-sm text-gray-600">Entries Today</div>
                </div>
              </div>
            </Card>

            {hasCriticalInsights() && (
              <Card title="Critical Insights" variant="warning">
                <Alert variant="danger" title="Protocol Compliance Alert">
                  Some entries today were not compliant with your selected protocols. Review your timeline for details.
                </Alert>
              </Card>
            )}

            <Card title="Platform Status" variant="success">
              <Alert variant="info" title="System Ready">
                Your app is running with sophisticated multi-protocol support, working quick checks system, detox tracking, and functional reflection data persistence. Ready for AI insights when backend is enhanced.
              </Alert>
            </Card>

            <Card title="AI Insights Preview" variant="primary">
              <div className="space-y-3 text-sm text-gray-600">
                <p><strong>Future insights will include:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Food-symptom correlation analysis</li>
                  <li>Sleep quality impact on daily energy</li>
                  <li>Protocol compliance effectiveness</li>
                  <li>Environmental exposure patterns</li>
                  <li>Detox activity benefits tracking</li>
                  <li>Mood and energy trend analysis</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  <em>AI analysis will activate once sufficient data is collected (typically 2-4 weeks of consistent tracking).</em>
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeView === 'protocol' && (
          <div className="space-y-6">
            <Card title="Protocol Foods Browser" icon={Search} variant="primary">
              {preferences.protocols.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select protocols in your header to browse compliant foods.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Browse foods for: <span className="font-medium">{getProtocolDisplayText()}</span>
                  </p>
                  
                  <div className="grid gap-4">
                    <Card variant="success" title="✅ Safe for All Protocols">
                      <div className="text-sm text-gray-600">
                        Foods that comply with all your selected protocols will appear here when the protocol foods API is connected.
                        <br />
                        <em className="text-xs">API endpoint needed: /api/v1/protocol-foods/[protocol-id]</em>
                      </div>
                    </Card>
                    
                    <Card variant="warning" title="⚠️ Mixed Guidance">
                      <div className="text-sm text-gray-600">
                        Foods with conflicting guidance between your protocols will appear here.
                      </div>
                    </Card>
                    
                    <Card variant="danger" title="❌ Avoid">
                      <div className="text-sm text-gray-600">
                        Foods to avoid on your current protocols will appear here.
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Optional: Welcome message for new users who haven't started setup */}
      {preferences && !preferences.setup_complete && !showSetup && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <Alert variant="info" dismissible onDismiss={() => {}}>
            <div className="flex items-center justify-between">
              <span>Welcome! Tap the ⚙️ icon to set up your health journey</span>
              <Button size="sm" onClick={() => setShowSetup(true)}>
                Start
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}

export default App;