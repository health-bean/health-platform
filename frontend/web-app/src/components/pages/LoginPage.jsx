import React, { useState } from 'react';
import { Rocket, User } from 'lucide-react';
import { Button, Alert, Card } from '../../../../shared/components/ui';
import { useAuth } from '../../contexts/AuthProvider';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { login } = useAuth();

  const handleDemoLogin = async (userId) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await login(`${userId}@test.com`, 'demo-password', { isDemoUser: true, demoUserId: userId });
      if (!result.success) {
        setMessage(result.error || 'Demo login failed');
      }
    } catch (err) {
      setMessage('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-app min-h-screen">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Your Personal Health Journey</p>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Demo Access</h2>
          <p className="text-neutral-600">
            Explore FILO Health with sample user data to see how the platform works.
          </p>
        </div>

        {message && (
          <Alert variant="error" className="mb-6">
            {message}
          </Alert>
        )}

        <div className="space-y-4">
          <DemoUserCard
            name="Sarah Johnson"
            description="AIP Protocol • 3 months of tracking • Autoimmune management"
            userId="sarah-aip"
            onLogin={handleDemoLogin}
            isLoading={isLoading}
          />
          <DemoUserCard
            name="Mike Chen"
            description="Low FODMAP • 4 months of tracking • IBS management"
            userId="mike-fodmap"
            onLogin={handleDemoLogin}
            isLoading={isLoading}
          />
          <DemoUserCard
            name="Lisa Rodriguez"
            description="Low Histamine • 2 months of tracking • Histamine intolerance"
            userId="lisa-histamine"
            onLogin={handleDemoLogin}
            isLoading={isLoading}
          />
          <DemoUserCard
            name="John Williams"
            description="Paleo Protocol • 5 months of tracking • General wellness"
            userId="john-paleo"
            onLogin={handleDemoLogin}
            isLoading={isLoading}
          />
          <DemoUserCard
            name="Emma Davis"
            description="Multi-Protocol • 6 months of tracking • Complex dietary needs"
            userId="emma-multi"
            onLogin={handleDemoLogin}
            isLoading={isLoading}
          />
        </div>

        <div className="mt-8 p-4 bg-info-50 border border-info-200 rounded-lg">
          <h3 className="font-medium text-info-900 mb-2">About Demo Mode</h3>
          <ul className="text-sm text-info-700 space-y-1">
            <li>• View real health tracking data from sample users</li>
            <li>• Explore timeline entries, symptoms, and correlations</li>
            <li>• Test protocol management and food tracking features</li>
            <li>• No registration required - instant access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Demo User Card Component
const DemoUserCard = ({ name, description, userId, onLogin, isLoading }) => {
  return (
    <Card variant="outlined" className="border-gray-200 hover:border-primary-300 transition-colors">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-5 w-5 text-primary-600" />
              <h4 className="font-semibold text-neutral-900">{name}</h4>
            </div>
            <p className="text-sm text-neutral-600">{description}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLogin(userId)}
            disabled={isLoading}
            className="ml-4 min-w-[80px]"
          >
            {isLoading ? 'Loading...' : 'Enter Demo'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LoginPage;