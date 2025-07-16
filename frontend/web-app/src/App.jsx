// File: frontend/web-app/src/App.jsx (CLEAN AUTH SYSTEM)

import React, { useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

// Import clean auth components (keeping existing SimpleAuth)
import { SimpleAuthProvider, useSimpleAuth } from '../../shared/components/SimpleAuthProvider';
import { apiClient } from '../../shared/services/api';
import SimpleLoginPage from './components/pages/SimpleLoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import PreferencesPage from './components/pages/PreferencesPage';

// Import shared components and hooks
import { Button, Alert } from '../../shared/components/ui';
import useProtocols from '../../shared/hooks/useProtocols';
import useUserPreferences from '../../shared/hooks/useUserPreferences';
import { useSimpleApi, useJournalApi } from '../../shared/hooks/useSimpleApi';
import useSimpleReflectionData from '../../shared/hooks/useSimpleReflectionData';
import useExposureTypes from '../../shared/hooks/useExposureTypes';
import useDetoxTypes from '../../shared/hooks/useDetoxTypes';

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

// Main App Component (Inside SimpleAuthProvider)
const MainApp = () => {
  const { isAuthenticated, user, loading: authLoading, isDemoMode, getAuthToken, getAuthHeaders } = useSimpleAuth();
  
  // Connect API client with auth provider
  useEffect(() => {
    if (getAuthToken && getAuthHeaders) {
      apiClient.setTokenGetter(getAuthToken);
      apiClient.setHeadersGetter(getAuthHeaders);
    }
  }, [getAuthToken, getAuthHeaders]);
  
  // Initialize API client
  useSimpleApi();
  
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

  // Add preferences view state
  const [showPreferences, setShowPreferences] = React.useState(false);

  // Data hooks (only run when authenticated)
  const { protocols, loading: protocolsLoading, error: protocolsError } = useProtocols(isAuthenticated);
  const { preferences, updatePreferences, refreshPreferences, loading: preferencesLoading, error: preferencesError, isReady } = useUserPreferences(isAuthenticated);
  
  // Simple reflection data using clean API
  const { reflectionData, updateReflectionData, saveReflectionData, loading: reflectionLoading, hasUnsavedChanges } = useSimpleReflectionData(selectedDate, isAuthenticated);
  
  // Timeline and entry form (only when authenticated)
  const { entries, loading: entriesLoading, addEntry, hasCriticalInsights } = useTimelineEntries(selectedDate, isAuthenticated);
  const { formData, updateFormData, toggleSelectedFood, handleQuickSelect, resetForm, buildEntryData } = useEntryForm();
  
  // Exposure and detox types for entry form
  const { exposureTypes } = useExposureTypes(isAuthenticated);
  const { detoxTypes } = useDetoxTypes(isAuthenticated);

  // Determine setup requirement based on authentication and preferences state
  const shouldShowSetup = useMemo(() => {
    // Don't show setup until we have complete information
    if (!isAuthenticated || !isReady || !preferences) {
      return false;
    }
    
    // Show setup if manually triggered OR if setup is not complete
    return showSetup || preferences.setup_complete !== true;
  }, [isAuthenticated, isReady, preferences, showSetup]);

  // Handle setup completion state changes
  useEffect(() => {
    if (isAuthenticated && isReady && preferences) {
      if (preferences.setup_complete === true && showSetup) {
        // Setup was completed, hide the wizard
        handleSetupToggle();
      }
    }
  }, [isAuthenticated, isReady, preferences?.setup_complete]);

  // Comprehensive loading state management
  const isAppLoading = isAuthenticated && (!isReady || preferencesLoading);
  
  // Handle auth loading
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <SimpleLoginPage />;
  }

  // Handle app data loading (simplified for clean auth)
  if (authLoading || preferencesLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your health journey...</p>
        </div>
      </div>
    );
  }

  // Show preferences page
  if (showPreferences) {
    return (
      <PreferencesPage 
        onBack={() => setShowPreferences(false)}
      />
    );
  }

  // Create safe preferences with defaults (but don't override setup_complete!)
  const safePreferences = {
    protocols: [],
    quick_supplements: [],
    quick_medications: [],
    quick_foods: [],
    quick_symptoms: [],
    quick_detox: [],
    setup_complete: false, // Only use as default if not provided
    ...preferences // This should override the defaults with real API data
  };

  // Entry form handlers
  const handleSubmitEntry = async () => {
    console.log('🔧 handleSubmitEntry: Form data:', formData);
    
    // Use the new unified selectedItems structure
    const allItems = [...(formData.selectedItems || [])];
    
    // Also check legacy selectedFoods for backward compatibility
    if (formData.selectedFoods && formData.selectedFoods.length > 0) {
      allItems.push(...formData.selectedFoods);
    }
    
    if (formData.customText.trim()) {
      allItems.push(formData.customText.trim());
    }
    
    console.log('🔧 handleSubmitEntry: All items to submit:', allItems);
    
    if (allItems.length === 0) {
      console.log('🔧 handleSubmitEntry: No items to submit, returning');
      return;
    }
    
    const entryData = buildEntryData(selectedDate);
    console.log('🔧 handleSubmitEntry: Entry data:', entryData);
    
    try {
      await addEntry(entryData);
      resetForm();
      handleAddEntryToggle();
      console.log('🔧 handleSubmitEntry: Entry added successfully');
    } catch (error) {
      console.error('🔧 handleSubmitEntry: Failed to add entry:', error);
    }
  };

  const handleCancelEntry = () => {
    resetForm();
    handleAddEntryToggle();
  };

  // Loading states
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

  // Setup wizard - show based on computed state, not just showSetup flag
  if (shouldShowSetup) {
    return (
      <ErrorBoundary>
        <SetupWizard 
          onComplete={() => handleSetupComplete(refreshPreferences)}
          isAuthenticated={isAuthenticated}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Header 
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        protocols={protocols}
        selectedProtocols={safePreferences.protocols}
        onProtocolChange={(newSelection) => updatePreferences({ protocols: newSelection })}
        protocolsLoading={protocolsLoading}
        protocolsError={protocolsError}
        onPreferencesClick={() => setShowPreferences(true)}
      />

      <Navigation 
        activeView={activeView}
        onViewChange={handleViewChange}
        hasUnsavedChanges={hasUnsavedChanges}
        hasCriticalInsights={hasCriticalInsights()}
        getProtocolDisplayText={() => getProtocolDisplayText(safePreferences.protocols, protocols)}
        selectedProtocols={safePreferences.protocols}
      />

      <div className="p-4 pb-20 sm:pb-4">
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
};

// Root App Component with SimpleAuthProvider
function App() {
  return (
    <SimpleAuthProvider>
      <MainApp />
    </SimpleAuthProvider>
  );
}

export default App;