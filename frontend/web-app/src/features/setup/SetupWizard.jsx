import React from 'react';
import useProtocols from '../../../../shared/hooks/useProtocols';
import useUserPreferences from '../../../../shared/hooks/useUserPreferences';
import useSetupWizard from './useSetupWizard';

// Import step components
import WelcomeStep from './steps/WelcomeStep';
import ProtocolsStep from './steps/ProtocolsStep';
import SymptomsStep from './steps/SymptomsStep';
import SupplementsStep from './steps/SupplementsStep';
import MedicationsStep from './steps/MedicationsStep';
import FoodsStep from './steps/FoodsStep';
import DetoxStep from './steps/DetoxStep';

const SetupWizard = ({ onComplete }) => {
  const { protocols } = useProtocols();
  const { updatePreferences, saving } = useUserPreferences();
  
  const {
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
    isFirst,
    isLast
  } = useSetupWizard(protocols, updatePreferences, onComplete);

  // Map step components
  const stepComponents = {
    welcome: WelcomeStep,
    protocols: ProtocolsStep,
    symptoms: SymptomsStep,
    supplements: SupplementsStep,
    medications: MedicationsStep,
    foods: FoodsStep,
    detox: DetoxStep
  };

  const CurrentStepComponent = stepComponents[steps[currentStep].key];

  // Show completion loading state
  if (completing) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="text-lg font-semibold text-gray-900">Saving Your Preferences...</h3>
          <p className="text-sm text-gray-600">
            We're setting up your personalized health journey.
          </p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900">Setup Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-2">
            <button
              onClick={retryComplete}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onComplete}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">Setup</h2>
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {maxSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
          />
        </div>
      </div>

      <CurrentStepComponent
        setupData={setupData}
        updateSetupData={updateSetupData}
        protocols={protocols}
        onNext={handleNext}
        onBack={handleBack}
        isFirst={isFirst}
        isLast={isLast}
        disabled={completing || saving}
      />
      
      {/* Show saving indicator at bottom if needed */}
      {saving && (
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600 flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;