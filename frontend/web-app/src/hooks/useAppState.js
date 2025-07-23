import { useState } from 'react';

export const useAppState = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [activeView, setActiveView] = useState('timeline');
  const [showSetup, setShowSetup] = useState(false);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleAddEntryToggle = () => {
    setShowAddEntry(!showAddEntry);
  };

  const handleSetupToggle = () => {
    setShowSetup(!showSetup);
  };

  const handleSetupComplete = async (onComplete) => {
    try {
      // Wait for setup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Call the completion callback (usually refreshes preferences)
      if (onComplete) {
        try {
          await onComplete();
        } catch (error) {
          // Don't throw - we want to complete setup even if refresh fails
        }
      }
      
      // Hide setup wizard
      setShowSetup(false);
      setActiveView('timeline');
    } catch (error) {
      // Still hide setup wizard to prevent infinite loop
      setShowSetup(false);
      setActiveView('timeline');
    }
  };

  return {
    selectedDate,
    showAddEntry,
    activeView,
    showSetup,
    handleViewChange,
    handleDateChange,
    handleAddEntryToggle,
    handleSetupToggle,
    handleSetupComplete
  };
};