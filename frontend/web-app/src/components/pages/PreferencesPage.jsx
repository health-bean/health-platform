// File: frontend/web-app/src/components/pages/PreferencesPage.jsx

import React from 'react';
import { ArrowLeft, Settings, Sparkles, Zap, Shield, Bell } from 'lucide-react';
import { Button, Card } from '../../../../shared/components/ui';
import useAuth from '../../../../shared/hooks/useAuth';

const PreferencesPage = ({ onBack }) => {
  const { user } = useAuth();

  const upcomingFeatures = [
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Account Settings',
      description: 'Update your profile, email, and password preferences'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Customize alerts for symptoms, medications, and insights'
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'AI Insights',
      description: 'Configure how AI analyzes your health patterns'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Quick Actions',
      description: 'Customize your frequently used foods, supplements, and symptoms'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Privacy & Data',
      description: 'Control how your health data is stored and shared'
    }
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3 p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Account Settings</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user?.firstName || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Current User Info */}
      <div className="p-4">
        <Card className="p-4 mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">
                {user?.firstName === 'Sarah' ? '👩‍💼' : 
                 user?.firstName === 'Mike' ? '👨‍💻' : 
                 user?.firstName === 'Lisa' ? '👩‍🔬' : 
                 user?.firstName === 'John' ? '👨‍🍳' : 
                 user?.firstName === 'Emma' ? '👩‍⚕️' : '👤'}
              </span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{user?.email}</p>
              <p className="text-xs text-blue-600 mt-1">
                {user?.userType === 'patient' ? 'Patient Account' : 'Admin Account'}
              </p>
            </div>
          </div>
        </Card>

        {/* Coming Soon Section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Coming Soon!
          </h2>
          <p className="text-gray-600 text-sm">
            We're building amazing preference features to customize your health journey.
          </p>
        </div>

        {/* Upcoming Features */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Upcoming Features
          </h3>
          
          {upcomingFeatures.map((feature, index) => (
            <Card key={index} className="p-4 opacity-75">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={onBack}
            className="w-full"
          >
            Back to Health Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;