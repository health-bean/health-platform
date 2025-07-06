import { useState } from 'react';

const useSetupWizard = (protocols, updatePreferences, onComplete) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState({
    setupType: null, // 'quick' or 'full'
    protocols: [],
    symptoms: [],
    supplements: [],
    medications: [],
    foods: [],
    detox: []
  });

  const steps = [
    { title: 'Welcome', key: 'welcome' },
    { title: 'Protocols', key: 'protocols' },
    { title: 'Symptoms', key: 'symptoms' },
    { title: 'Supplements', key: 'supplements' },
    { title: 'Medications', key: 'medications' },
    { title: 'Common Foods', key: 'foods' },
    { title: 'Detox Activities', key: 'detox' }
  ];

  const maxSteps = setupData.setupType === 'quick' ? 2 : steps.length;

  const handleNext = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeSetup();
    }
  };

  const handleBack = () => {
    if (completing) return; // Don't allow back during completion
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const completeSetup = async () => {
    console.log('Completing setup with data:', setupData);
    
    try {
      setCompleting(true);
      setError(null);
      
      // Build preferences object
      const preferencesUpdate = {
        protocols: setupData.protocols,
        quick_symptoms: setupData.symptoms,
        quick_supplements: setupData.supplements,
        quick_medications: setupData.medications,
        quick_foods: setupData.foods,
        quick_detox: setupData.detox,
        setup_complete: true
      };
      
      console.log('Saving preferences to database:', preferencesUpdate);
      
      // Wait for the database save to complete
      await updatePreferences(preferencesUpdate);
      
      console.log('Setup completed successfully - preferences saved to database');
      
      // Only call onComplete after successful save
      onComplete();
      
    } catch (error) {
      console.error('Failed to complete setup:', error);
      setError('Failed to save your preferences. Please try again.');
      
      // Don't call onComplete if save failed
      // User can retry or fix the issue
    } finally {
      setCompleting(false);
    }
  };

  const retryComplete = () => {
    setError(null);
    completeSetup();
  };

  const updateSetupData = (updates) => {
    if (completing) return; // Don't allow changes during completion
    setSetupData({ ...setupData, ...updates });
  };

  return {
    currentStep,
    setupData,
    steps,
    maxSteps,
    handleNext,
    handleBack,
    updateSetupData,
    completing,
    error,
    retryComplete,
    isFirst: currentStep === 0,
    isLast: currentStep === maxSteps - 1
  };
};

export default useSetupWizard;