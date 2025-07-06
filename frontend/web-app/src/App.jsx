import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Import shared components and hooks
import { Button, Alert } from '../../shared/components/ui';
import useProtocols from '../../shared/hooks/useProtocols';
import useUserPreferences from '../../shared/hooks/useUserPreferences';
import useExposureTypes from '../../shared/hooks/useExposureTypes';
import useDetoxTypes from '../../shared/hooks/useDetoxTypes';
import useReflectionData from '../../shared/hooks/useReflectionData';

// Import local hooks
import { useAppState } from './hooks/useAppState';
import { useTimelineEntries } from './hooks/useTimelineEntries';
import { useEntryForm } from './hooks/useEntryForm';

// Import layout components
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';

// Import feature components
import TimelineView from './features/timeline/TimelineView';
import ReflectionView from './features/reflection/ReflectionView';
import CorrelationInsights from './features/insights/CorrelationInsights';
import ProtocolFoods from './features/protocol/ProtocolFoods';
import SetupWizard from './features/setup/SetupWizard';

// Import utils
import { getProtocolDisplayText } from '../../shared/utils/entryHelpers';

function App() {
  // App state
  const { 
    selectedDate, 
    showAddEntry, 
    activeView, 
    showSetup,
    handleViewChange,
    handleDateChange,
    handleAddEntryToggle,
    handleSetupToggle,
    handleSetupComplete
  } = useAppState();

  // Data hooks
  const { protocols, loading: protocolsLoading, error: protocolsError } = useProtocols();
  const { preferences, updatePreferences, refreshPreferences, loading: preferencesLoading, error: preferencesError, isReady } = useUserPreferences();
  const { exposureTypes } = useExposureTypes();
  const { detoxTypes } = useDetoxTypes();
  const { reflectionData, updateReflectionData, saveReflectionData, loading: reflectionLoading, hasUnsavedChanges } = useReflectionData(selectedDate);

  // Timeline and entry form
  const { entries, loading: entriesLoading, addEntry, hasCriticalInsights } = useTimelineEntries(selectedDate);
  const { formData, updateFormData, toggleSelectedFood, handleQuickSelect, resetForm, buildEntryData } = useEntryForm();

  // Show setup if not completed OR manually triggered
  useEffect(() => {
    if (isReady && preferences) {
      if (!preferences.setup_complete) {
        handleSetupToggle();
      }
    }
  }, [preferences, isReady]);

  // Create safe preferences with defaults
  const safePreferences = {
    protocols: [],
    quick_supplements: [],
    quick_medications: [],
    quick_foods: [],
    quick_symptoms: [],
    quick_detox: [],
    setup_complete: false,
    ...preferences
  };

  // Entry form handlers
  const handleSubmitEntry = async () => {
    const allItems = [...formData.selectedFoods];
    if (formData.customText.trim()) {
      allItems.push(formData.customText.trim());
    }
    
    if (allItems.length === 0) return;
    
    const entryData = buildEntryData(selectedDate);
    
    try {
      await addEntry(entryData);
      resetForm();
      handleAddEntryToggle();
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  const handleCancelEntry = () => {
    resetForm();
    handleAddEntryToggle();
  };

  // Loading states
  if (preferencesLoading || !isReady || !preferences) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your health journey...</p>
        </div>
      </div>
    );
  }

  // Error states
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

  // Setup wizard
  if (showSetup) {
    return (
      <SetupWizard 
        onComplete={() => handleSetupComplete(refreshPreferences)} 
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <Header 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        protocols={protocols}
        selectedProtocols={safePreferences.protocols}
        onProtocolChange={(newSelection) => updatePreferences({ protocols: newSelection })}
        protocolsLoading={protocolsLoading}
        protocolsError={protocolsError}
      />

      <Navigation 
        activeView={activeView}
        onViewChange={handleViewChange}
        hasUnsavedChanges={hasUnsavedChanges}
        hasCriticalInsights={hasCriticalInsights()}
        onSetupClick={handleSetupToggle}
        getProtocolDisplayText={() => getProtocolDisplayText(safePreferences.protocols, protocols)}
        selectedProtocols={safePreferences.protocols}
      />

      <div className="p-4">
        {activeView === 'timeline' && (
          <TimelineView 
            entries={entries}
            loading={entriesLoading}
            showAddEntry={showAddEntry}
            onToggleAddEntry={handleAddEntryToggle}
            formData={formData}
            updateFormData={updateFormData}
            toggleSelectedFood={toggleSelectedFood}
            handleQuickSelect={handleQuickSelect}
            onSubmitEntry={handleSubmitEntry}
            onCancelEntry={handleCancelEntry}
            preferences={safePreferences}
            protocols={protocols}
            exposureTypes={exposureTypes}
            detoxTypes={detoxTypes}
          />
        )}

        {activeView === 'reflect' && (
          <ReflectionView 
            reflectionData={reflectionData}
            updateReflectionData={updateReflectionData}
            saveReflectionData={saveReflectionData}
            hasUnsavedChanges={hasUnsavedChanges}
            loading={reflectionLoading}
            selectedDate={selectedDate}
          />
        )}

        {activeView === 'insights' && (
          <CorrelationInsights />
        )}

        {activeView === 'protocol' && (
          <ProtocolFoods protocolId={safePreferences.protocols[0]} />
        )}
      </div>

      {/* Welcome message for new users */}
      {safePreferences && !safePreferences.setup_complete && !showSetup && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <Alert variant="info" dismissible onDismiss={() => {}}>
            <div className="flex items-center justify-between">
              <span>Welcome! Tap the ⚙️ icon to set up your health journey</span>
              <Button size="sm" onClick={handleSetupToggle}>
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