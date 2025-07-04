// frontend/web-app/src/components/Auth.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthProvider';
import { Button, Input, Alert, Card } from '../../../shared/components/ui';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    userType: 'patient'
  });

  const { login, register, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      await login(formData.email, formData.password);
    } else {
      await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName, 
        formData.userType
      );
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FILO Health</h1>
          <p className="text-gray-600">Your personalized health intelligence platform</p>
        </div>

        <Card className="p-6">
          {/* Toggle between Login/Register */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isLogin 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields for registration */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="First name"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="Last name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'} autocomplete="current-password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {/* User Type for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="patient">Patient - Track my health journey</option>
                  <option value="practitioner">Practitioner - Work with patients</option>
                </select>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </Button>
          </form>

          {/* Demo Account Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">🎭 Demo Account</h4>
            <p className="text-xs text-blue-800 mb-2">
              Try the platform with sample data:
            </p>
            <div className="text-xs text-blue-700 font-mono bg-white p-2 rounded border">
              <div>📧 sarah@example.com</div>
              <div>🔑 demo123456</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  email: 'sarah@example.com',
                  password: 'demo123456'
                });
                setIsLogin(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              Fill demo credentials
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-3">What you'll get access to:</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-lg mb-1">🧠</div>
              <div className="font-medium text-gray-800">AI Health Insights</div>
              <div className="text-gray-600">Statistical correlation detection</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-lg mb-1">🍅</div>
              <div className="font-medium text-gray-800">Protocol Foods</div>
              <div className="text-gray-600">AIP, Low FODMAP, Paleo support</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-lg mb-1">📊</div>
              <div className="font-medium text-gray-800">Timeline Tracking</div>
              <div className="text-gray-600">Food, symptoms, supplements</div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-lg mb-1">💭</div>
              <div className="font-medium text-gray-800">Daily Reflections</div>
              <div className="text-gray-600">Sleep, mood, energy tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;