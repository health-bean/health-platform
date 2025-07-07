// File: frontend/web-app/src/App.jsx (CLEANED UP)

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Import auth components
import { AuthProvider } from '../../shared/components/AuthProvider';
import useAuth from '../../shared/hooks/useAuth';
import LoginPage from './components/pages/LoginPage';
import PreferencesPage from './components/pages/PreferencesPage';

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

// Main App Component (Inside AuthProvider)
const MainApp = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  
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
  // Add setup completion tracking to prevent loops
  const [setupCompleted, setSetupCompleted] = React.useState(false);
  // Track current user to reset setup when user changes
  const [currentUserId, setCurrentUserId] = React.useState(null);

  // Data hooks (only run when authenticated)
  const { protocols, loading: protocolsLoading, error: protocolsError } = useProtocols();
  const { preferences, updatePreferences, refreshPreferences, loading: preferencesLoading, error: preferencesError, isReady, user: prefsUser } = useUserPreferences();
  const { exposureTypes } = useExposureTypes();
  const { detoxTypes } = useDetoxTypes();
  const { reflectionData, updateReflectionData, saveReflectionData, loading: reflectionLoading, hasUnsavedChanges } = useReflectionData(selectedDate);

  // Timeline and entry form
  const { entries, loading: entriesLoading, addEntry, hasCriticalInsights } = useTimelineEntries(selectedDate);
  const { formData, updateFormData, toggleSelectedFood, handleQuickSelect, resetForm, buildEntryData } = useEntryForm();

  // Show setup if authenticated and not completed (prevent duplicate calls)
  useEffect(() => {
    console.log('🔧 Setup useEffect triggered:', {
      isAuthenticated,
      isReady,
      preferences: preferences?.setup_complete,
      showSetup,
      setupCompleted
    });
    
    // Only trigger setup if we're authenticated, ready, have preferences, setup isn't already showing,
    // setup hasn't been completed in this session, and setup_complete is explicitly false
    if (isAuthenticated && isReady && preferences && !showSetup && !setupCompleted) {
      if (preferences.setup_complete === false) {
        console.log('🔧 Triggering setup - setup_complete is explicitly false');
        handleSetupToggle();
      } else if (preferences.setup_complete === true) {
        console.log('🔧 Setup already completed - setup_complete is true');
        setSetupCompleted(true); // Mark as completed if it was already done
      } else {
        console.log('🔧 Setup status unknown - setup_complete is:', preferences.setup_complete);
      }
    }
  }, [isAuthenticated, preferences?.setup_complete, isReady, showSetup, handleSetupToggle, setupCompleted]);

  // Handle auth loading
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show preferences page
  if (showPreferences) {
    return (
      <PreferencesPage 
        onBack={() => setShowPreferences(false)}
      />
    );
  }

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

  // Debug: Log protocol information
  console.log('🔧 MAIN APP: Protocol Debug:', {
    rawPreferences: preferences,
    safePreferences: safePreferences,
    protocolsFromPrefs: preferences?.protocols,
    protocolsFromSafe: safePreferences.protocols,
    setupCompleted: setupCompleted,
    showSetup: showSetup
  });

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

  // Setup completion handler that ensures preferences are refreshed
  const handleSetupCompleteWithRefresh = async () => {
    try {
      console.log('🔧 App: Setup completion handler called');
      
      // Mark setup as completed in this session
      setSetupCompleted(true);
      
      // Force close the setup wizard immediately to prevent loops
      console.log('🔧 App: Closing setup wizard...');
      handleSetupToggle(); // This closes the setup
      
      // Then refresh preferences in the background
      console.log('🔧 App: Refreshing preferences after setup...');
      await refreshPreferences();
      
      console.log('🔧 App: Setup completion flow finished');
    } catch (error) {
      console.error('🔧 App: Setup completion error:', error);
    }
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

  // Setup wizard
  if (showSetup) {
    return (
      <div>
        <SetupWizard 
          onComplete={handleSetupCompleteWithRefresh} 
        />
        {/* Enhanced debug info */}
        <div className="fixed bottom-4 left-4 text-xs text-gray-500 bg-white p-2 rounded shadow max-w-xs">
          <div>User: {prefsUser?.email || 'None'}</div>
          <div>Setup Complete: {preferences?.setup_complete ? 'Yes' : 'No'}</div>
          <div>Session Complete: {setupCompleted ? 'Yes' : 'No'}</div>
          <div>Protocols: {JSON.stringify(preferences?.protocols || [])}</div>
          <div>Is Ready: {isReady ? 'Yes' : 'No'}</div>
          <div className="flex gap-1 mt-2 flex-wrap">
            <button 
              onClick={refreshPreferences}
              className="text-blue-500 underline text-xs"
            >
              Refresh
            </button>
            <button 
              onClick={() => {
                console.log('🔧 MANUAL: Current user:', prefsUser);
                console.log('🔧 MANUAL: Current full preferences:', preferences);
                console.log('🔧 MANUAL: Current protocols:', preferences?.protocols);
              }}
              className="text-green-500 underline text-xs"
            >
              Log Prefs
            </button>
            <button 
              onClick={() => {
                setSetupCompleted(false);
                setCurrentUserId(null);
                console.log('🔧 MANUAL: Reset setup completion for current user');
              }}
              className="text-orange-500 underline text-xs"
            >
              Reset Setup
            </button>
            <button 
              onClick={() => {
                setSetupCompleted(true);
                handleSetupToggle();
              }}
              className="text-red-500 underline text-xs"
            >
              Force Close
            </button>
          </div>
        </div>
      </div>
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
        onPreferencesClick={() => setShowPreferences(true)}
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
      {safePreferences && !safePreferences.setup_complete && !showSetup && !setupCompleted && (
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

      {/* Debug panel for main app */}
      {!showSetup && setupCompleted && (
        <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-yellow-50 p-2 rounded shadow max-w-xs border">
          <div className="font-bold text-yellow-800">Main App Debug</div>
          <div>User: {prefsUser?.email || 'None'}</div>
          <div>Protocols: {JSON.stringify(safePreferences.protocols)}</div>
          <div>Setup Complete: {safePreferences.setup_complete ? 'Yes' : 'No'}</div>
          <div className="flex gap-1 mt-2">
            <button 
              onClick={() => {
                console.log('🔧 MAIN: Current user:', prefsUser);
                console.log('🔧 MAIN: Full preferences:', preferences);
                console.log('🔧 MAIN: Safe preferences:', safePreferences);
                console.log('🔧 MAIN: Available protocols:', protocols);
              }}
              className="text-blue-500 underline text-xs"
            >
              Log State
            </button>
            <button 
              onClick={() => {
                setSetupCompleted(false);
                setCurrentUserId(null);
                console.log('🔧 MAIN: Forcing setup reset');
              }}
              className="text-orange-500 underline text-xs"
            >
              Reset Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Root App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;