// File: frontend/web-app/src/App.jsx (CLEAN VERSION)

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
  
  // TEMPORARY WORKAROUND: Track login session to force setup once per session
  // This works around the backend auth issue where all users share demo preferences
  // TODO: Remove this once backend auth.js is fixed to handle real user tokens
  const [loginSessionId, setLoginSessionId] = React.useState(null);
  const [hasTriggeredSetupThisSession, setHasTriggeredSetupThisSession] = React.useState(false);

  // Data hooks (only run when authenticated)
  const { protocols, loading: protocolsLoading, error: protocolsError } = useProtocols();
  const { preferences, updatePreferences, refreshPreferences, loading: preferencesLoading, error: preferencesError, isReady, user: prefsUser } = useUserPreferences();
  const { exposureTypes } = useExposureTypes();
  const { detoxTypes } = useDetoxTypes();
  const { reflectionData, updateReflectionData, saveReflectionData, loading: reflectionLoading, hasUnsavedChanges } = useReflectionData(selectedDate);

  // Timeline and entry form
  const { entries, loading: entriesLoading, addEntry, hasCriticalInsights } = useTimelineEntries(selectedDate);
  const { formData, updateFormData, toggleSelectedFood, handleQuickSelect, resetForm, buildEntryData } = useEntryForm();

  // Show setup if authenticated and not completed (WITH SESSION WORKAROUND)
  useEffect(() => {
    console.log('🔧 Setup check:', {
      isAuthenticated,
      isReady,
      setup_complete: preferences?.setup_complete,
      showSetup,
      user: prefsUser?.email,
      userId: prefsUser?.id,
      loginSessionId: loginSessionId,
      hasTriggeredSetupThisSession: hasTriggeredSetupThisSession
    });
    
    // Create session ID from login (email + timestamp gives us unique session)
    const currentSessionId = prefsUser?.email;
    
    // If this is a new login session, reset setup trigger
    if (currentSessionId && currentSessionId !== loginSessionId) {
      console.log('🔧 NEW LOGIN SESSION detected:', currentSessionId);
      setLoginSessionId(currentSessionId);
      setHasTriggeredSetupThisSession(false);
    }
    
    if (isAuthenticated && isReady && preferences && !showSetup && !hasTriggeredSetupThisSession && currentSessionId) {
      // TEMPORARY WORKAROUND: Force setup once per login session 
      // This is needed because backend auth falls back to shared demo user
      // TODO: Remove this once auth.js properly handles JWT tokens
      console.log('🔧 FORCING setup for new session (WORKAROUND):', currentSessionId);
      setHasTriggeredSetupThisSession(true);
      handleSetupToggle();
    }
  }, [isAuthenticated, preferences?.setup_complete, isReady, showSetup, handleSetupToggle, prefsUser?.email, loginSessionId, hasTriggeredSetupThisSession]);

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

  // Setup completion handler
  const handleSetupCompleteWithRefresh = async () => {
    try {
      console.log('🔧 Setup completed for session:', loginSessionId);
      setHasTriggeredSetupThisSession(true); // Prevent re-triggering in this session
      
      await handleSetupComplete(refreshPreferences);
      // Force a preferences refresh after setup
      await refreshPreferences();
    } catch (error) {
      console.error('Setup completion error:', error);
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
        {/* Debug panel with session info */}
        <div className="fixed bottom-4 left-4 text-xs text-gray-500 bg-white p-2 rounded shadow">
          <div>User: {prefsUser?.email}</div>
          <div>Session: {loginSessionId}</div>
          <div>Setup Complete: {preferences?.setup_complete ? 'Yes' : 'No'}</div>
          <div>Setup Triggered: {hasTriggeredSetupThisSession ? 'Yes' : 'No'}</div>
          <div className="flex gap-1 mt-1">
            <button 
              onClick={() => {
                console.log('🔧 Current user:', prefsUser);
                console.log('🔧 Current preferences:', preferences);
                console.log('🔧 Session info:', { loginSessionId, hasTriggeredSetupThisSession });
              }}
              className="text-blue-500 underline text-xs"
            >
              Debug
            </button>
            <button 
              onClick={() => {
                setHasTriggeredSetupThisSession(false);
                console.log('🔧 Reset session setup trigger');
              }}
              className="text-orange-500 underline text-xs"
            >
              Reset
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
        onSetupClick={() => {
          setHasTriggeredSetupThisSession(false);
          handleSetupToggle();
        }}
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
              <Button 
                size="sm" 
                onClick={() => {
                  setHasTriggeredSetupThisSession(false);
                  handleSetupToggle();
                }}
              >
                Start
              </Button>
            </div>
          </Alert>
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