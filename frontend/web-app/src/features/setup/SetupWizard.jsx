import React from 'react';
import { Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import useProtocols from '../../../../shared/hooks/useProtocols';
import useUserPreferences from '../../hooks/useUserPreferences';
import useSetupWizard from './useSetupWizard';

// Import step components
import WelcomeStep from './steps/WelcomeStep';
import ProtocolsStep from './steps/ProtocolsStep';
import SymptomsStep from './steps/SymptomsStep';
import SupplementsStep from './steps/SupplementsStep';
import MedicationsStep from './steps/MedicationsStep';
import FoodsStep from './steps/FoodsStep';
import DetoxStep from './steps/DetoxStep';

const SetupWizard = ({ onComplete, isAuthenticated }) => {
  const { protocols, loading: protocolsLoading } = useProtocols(isAuthenticated);
  const { updatePreferences, saving } = useUserPreferences(isAuthenticated);

  // Debug logs removed for security - protocols and auth status are handled by safe logger in hooks

  const setupWizardData = useSetupWizard(protocols, updatePreferences, onComplete);

  // Add safety check
  if (!setupWizardData) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>Loading setup wizard...</p>
        </div>
      </div>
    );
  }

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
  } = setupWizardData;

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

  const CurrentStepComponent = stepComponents[steps[currentStep]?.key];

  // Safety check for current step
  if (!CurrentStepComponent) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600">Error: Invalid setup step</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Show loading state for protocols step if protocols are still loading
  if (steps[currentStep]?.key === 'protocols' && protocolsLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Protocols
              </h3>
              <p className="text-gray-600">
                Getting available health protocols...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show completion loading state
  if (completing) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Saving Your Preferences
              </h3>
              <p className="text-gray-600">
                We're setting up your personalized health journey...
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Setup Error
              </h3>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={retryComplete}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={onComplete}
                variant="secondary"
                size="md"
                className="w-full"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Setup Your Health Journey
            </h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {maxSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-filo-teal h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / maxSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-4">
        <Card padding="lg" className="w-full">
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
        </Card>
      </div>
    </div>
  );
};

export default SetupWizard;
