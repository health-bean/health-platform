// File: frontend/web-app/src/components/pages/SignupPage.jsx

import React, { useState } from 'react';
import { Loader2, Mail, Lock, User, Rocket, ArrowLeft, Shield, Heart } from 'lucide-react';
import { Button, Input, Alert, FormField, PasswordInput, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import useAuth from '../../../../shared/hooks/useAuth';

const SignupPage = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signup, error, setError } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      // Success - useAuth will handle redirect
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Start Your Personal Health Journey</p>
      </div>

      {/* Signup Form */}
      <div className="p-6">
        {/* Back to Login */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLogin}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Create Your Account
        </h2>

        {error && (
          <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Privacy Notice */}
        <Card variant="outlined" padding="sm" className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Privacy Protected</p>
              <p className="text-xs text-blue-700 mt-1">
                Your health data is encrypted and secure. We never share personal information.
                Sessions automatically clear when you close your browser for maximum privacy.
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </FormField>

            <FormField label="Last Name" required error={errors.lastName}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Email Address" required error={errors.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </FormField>

          <FormField label="Password" required error={errors.password}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <PasswordInput
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password (8+ characters)"
                className="pl-10"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </FormField>

          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <PasswordInput
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className="pl-10"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full mt-6"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Health Journey Promise */}
        <Card variant="outlined" padding="sm" className="mt-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <Heart className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">Your Health Journey Starts Here</p>
              <p className="text-xs text-green-700 mt-1">
                Track symptoms, identify triggers, and discover what works best for your unique health needs.
                Join thousands taking control of their wellness journey.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button 
              onClick={onBackToLogin}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
