import React, { useState } from 'react';
import { Rocket, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button, Alert, Input, FormField, Card } from '../../../../shared/components/ui';
import { useAuth } from '../../contexts/AuthProvider';

const LoginPage = () => {
  const [view, setView] = useState('signin'); // 'signin', 'signup', 'confirm'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    confirmationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const { login, signup, confirmSignUp, resendConfirmationCode } = useAuth();

  const handleDemoLogin = async (userId) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // For demo users, we'll use a special login method or simulate login
      // The backend already handles demo users via query params
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (view !== 'confirm') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (view === 'signup' && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    if (view === 'signup') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (view === 'confirm') {
      if (!formData.confirmationCode.trim()) {
        newErrors.confirmationCode = 'Confirmation code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    try {
      if (view === 'signin') {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          if (result.error === 'CONFIRMATION_REQUIRED') {
            setView('confirm');
          } else {
            setMessage(result.error);
          }
        }
        // If successful, AuthProvider will update user state and App will redirect
      } 
      
      else if (view === 'signup') {
        const result = await signup(
          formData.email.trim().toLowerCase(),
          formData.password,
          formData.firstName.trim(),
          formData.lastName.trim()
        );
        if (result.success && result.needsConfirmation) {
          setView('confirm');
        } else if (!result.success) {
          setMessage(result.error);
        }
      } 
      
      else if (view === 'confirm') {
        const result = await confirmSignUp(formData.email, formData.confirmationCode);
        if (result.success) {
          setMessage('Email confirmed successfully! You can now sign in.');
          setView('signin');
          setFormData(prev => ({ ...prev, password: '', confirmationCode: '' }));
        } else {
          setMessage(result.error);
        }
      }
    } catch (err) {
      setMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const result = await resendConfirmationCode(formData.email);
      if (result.success) {
        setMessage('New confirmation code sent to your email!');
      } else {
        setMessage(result.error);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation view
  if (view === 'confirm') {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="mr-2" size={32} />
            <h1 className="text-2xl font-bold">FILO Health</h1>
          </div>
          <p className="text-primary-100">Email Verification</p>
        </div>

        <div className="p-6 max-w-md mx-auto">
          {message && (
            <Alert variant={message.includes('successfully') ? 'success' : 'error'} className="mb-4">
              {message}
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Check Your Email</h3>
            <p className="text-sm text-blue-700">
              We've sent a confirmation code to <strong>{formData.email}</strong>.
              Please enter the code below to verify your email address.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Confirmation Code" error={errors.confirmationCode}>
              <Input
                type="text"
                value={formData.confirmationCode}
                onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
                className="text-center text-lg tracking-wider"
                placeholder="Enter confirmation code"
                autoFocus
                error={!!errors.confirmationCode}
              />
            </FormField>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Account'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:text-blue-300"
            >
              Resend confirmation code
            </button>
            <div className="text-xs text-gray-500">
              <p>Didn't receive the code? Check your spam folder.</p>
            </div>
            <button
              onClick={() => setView('signin')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup view
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Rocket className="mr-2" size={32} />
          <h1 className="text-2xl font-bold">FILO Health</h1>
        </div>
        <p className="text-primary-100">Your Personal Health Journey</p>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* Mode Switcher */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('signin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              view === 'signin' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setView('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              view === 'signup' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert variant={message.includes('successfully') ? 'success' : 'error'} className="mb-4">
            {message}
          </Alert>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <FormField label="Email Address" error={errors.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                placeholder="Enter your email"
                error={!!errors.email}
              />
            </div>
          </FormField>

          {/* Name Fields for Signup */}
          {view === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.firstName}>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                  error={!!errors.firstName}
                />
              </FormField>
              <FormField label="Last Name" error={errors.lastName}>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                  error={!!errors.lastName}
                />
              </FormField>
            </div>
          )}

          {/* Password Field */}
          <FormField
            label="Password"
            error={errors.password}
            hint={view === 'signup' ? 'Password must be at least 8 characters' : undefined}
          >
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter your password"
                error={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </FormField>

          {/* Confirm Password for Signup */}
          {view === 'signup' && (
            <FormField label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10"
                  placeholder="Confirm your password"
                  error={!!errors.confirmPassword}
                />
              </div>
            </FormField>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {view === 'signin' && (isLoading ? 'Signing in...' : 'Sign In')}
            {view === 'signup' && (isLoading ? 'Creating account...' : 'Create Account')}
          </Button>
        </form>

        {/* Demo Users Section - Only show on signin */}
        {view === 'signin' && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or try a demo account</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <DemoUserCard
                name="Sarah (AIP Protocol)"
                description="Following Autoimmune Protocol with 3 months of data"
                userId="sarah-aip"
                onLogin={handleDemoLogin}
                isLoading={isLoading}
              />
              <DemoUserCard
                name="Mike (Low FODMAP)"
                description="Managing IBS with Low FODMAP diet, 4 months of tracking"
                userId="mike-fodmap"
                onLogin={handleDemoLogin}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo User Card Component
const DemoUserCard = ({ name, description, userId, onLogin, isLoading }) => {
  return (
    <Card variant="outlined" className="border-gray-200 hover:border-blue-300 transition-colors">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">{name}</h4>
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLogin(userId)}
            disabled={isLoading}
            className="ml-4"
          >
            {isLoading ? 'Loading...' : 'Try Demo'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LoginPage;