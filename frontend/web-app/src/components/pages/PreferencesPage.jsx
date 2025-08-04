// File: frontend/web-app/src/components/pages/PreferencesPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Sparkles, 
  Zap, 
  Shield, 
  Bell, 
  User,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Button, Card, Alert, Badge } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useAuth } from '../../contexts/AuthProvider';
import { usePreferencesApi, useProtocolsApi } from '../../hooks/useApi';

const PreferencesPage = ({ onBack }) => {
  const { user } = useAuth();
  const { getPreferences, updatePreferences } = usePreferencesApi();
  const { getProtocols } = useProtocolsApi();
  const [activeSection, setActiveSection] = useState('overview');
  const [currentProtocol, setCurrentProtocol] = useState(null);
  const [availableProtocols, setAvailableProtocols] = useState([]);
  const [protocolHistory, setProtocolHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  const [showChangeConfirm, setShowChangeConfirm] = useState(null);

  // Load protocol data when protocol section is active
  useEffect(() => {
    if (activeSection === 'protocols') {
      loadProtocolData();
    }
  }, [activeSection]);

  const loadProtocolData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load available protocols using the proper API hook
      const protocolsResponse = await getProtocols();
      if (protocolsResponse?.protocols) {
        setAvailableProtocols(protocolsResponse.protocols);
      }

      // For demo mode, we'll simulate current protocol and history
      // In a real app, these would come from user preferences
      if (user && availableProtocols.length > 0) {
        // Set a default protocol for demo users
        const defaultProtocol = availableProtocols.find(p => p.name.includes('AIP')) || availableProtocols[0];
        setCurrentProtocol(defaultProtocol);
        
        // Simulate protocol history for demo
        setProtocolHistory([
          {
            id: 1,
            protocol_name: defaultProtocol?.name || 'AIP',
            changed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Initial setup'
          }
        ]);
      }

    } catch (err) {
      console.error('Error loading protocol data:', err);
      setError('Failed to load protocol information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtocolChange = async (newProtocolId, reason = '') => {
    try {
      setIsChanging(true);
      setError(null);

      // For demo mode, we'll simulate the protocol change
      const newProtocol = availableProtocols.find(p => p.id === newProtocolId);
      if (newProtocol) {
        setCurrentProtocol(newProtocol);
        
        // Add to history
        const newHistoryEntry = {
          id: protocolHistory.length + 1,
          protocol_name: newProtocol.name,
          changed_at: new Date().toISOString(),
          reason: reason || 'User preference change'
        };
        setProtocolHistory([newHistoryEntry, ...protocolHistory]);
        
        setShowChangeConfirm(null);
      }

    } catch (err) {
      console.error('Error changing protocol:', err);
      setError('Failed to change protocol');
    } finally {
      setIsChanging(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDurationText = (startDate, endDate = null) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  const preferencesSections = [
    {
      id: 'protocols',
      icon: <Activity className="w-5 h-5" />,
      title: 'Health Protocols',
      description: 'Manage your active protocol and track effectiveness',
      color: 'text-primary-600 bg-primary-100',
      available: true
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: 'Account Settings',
      description: 'Update your profile, email, and password preferences',
      color: 'text-gray-600 bg-gray-100',
      available: false
    },
    {
      icon: <Bell className="w-5 h-5" />,
      title: 'Notifications',
      description: 'Customize alerts for symptoms, medications, and insights',
      color: 'text-blue-600 bg-blue-100',
      available: false
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'AI Insights',
      description: 'Configure how AI analyzes your health patterns',
      color: 'text-purple-600 bg-purple-100',
      available: false
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Quick Actions',
      description: 'Customize your frequently used foods, supplements, and symptoms',
      color: 'text-yellow-600 bg-yellow-100',
      available: false
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Privacy & Data',
      description: 'Control how your health data is stored and shared',
      color: 'text-green-600 bg-green-100',
      available: false
    }
  ];

  const renderProtocolsSection = () => (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="mb-6" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current Protocol */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Protocol</h3>
            {currentProtocol && (
              <Badge variant="success" className="flex items-center">
                <CheckCircle className="mr-1 h-3 w-3" />
                Active
              </Badge>
            )}
          </div>

          {currentProtocol ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-medium text-gray-900 mb-2">
                  {currentProtocol.protocol_name}
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span className="truncate">Started {formatDate(currentProtocol.start_date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>{getDurationText(currentProtocol.start_date)}</span>
                  </div>
                  {currentProtocol.phase && (
                    <div className="flex items-center">
                      <Activity className="mr-1 h-4 w-4" />
                      <span>Phase {currentProtocol.phase}</span>
                    </div>
                  )}
                </div>
              </div>

              {currentProtocol.compliance_score && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Compliance Score</span>
                    <span className="text-sm font-semibold text-primary-600">
                      {Math.round(currentProtocol.compliance_score * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-filo-teal h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${currentProtocol.compliance_score * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Protocol</h4>
              <p className="text-gray-600 mb-4">
                Choose a protocol below to start tracking your health journey
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Available Protocols */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Protocols</h3>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {availableProtocols.map((protocol) => (
                <Card 
                  key={protocol.id} 
                  variant="outlined" 
                  className={cn(
                    "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                    currentProtocol?.protocol_id === protocol.id 
                      ? "border-primary-300 bg-primary-50" 
                      : "hover:border-primary-200"
                  )}
                  onClick={() => {
                    if (currentProtocol?.protocol_id !== protocol.id) {
                      setShowChangeConfirm(protocol);
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{protocol.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{protocol.description}</p>
                      {protocol.category && (
                        <Badge variant="secondary" className="mt-2">
                          {protocol.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 mt-3 sm:mt-0 sm:ml-4">
                      {currentProtocol?.protocol_id === protocol.id ? (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      ) : (
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Protocol History */}
      {protocolHistory.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="mr-2 h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Protocol History</h3>
            </div>
            
            <div className="space-y-3">
              {protocolHistory.map((entry, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-100 last:border-b-0 space-y-2 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{entry.new_protocol}</div>
                    <div className="text-sm text-gray-600">
                      {formatDate(entry.date)}
                      {entry.duration_days && (
                        <span className="ml-2">({entry.duration_days} days)</span>
                      )}
                    </div>
                  </div>
                  
                  {entry.context?.change_reason && (
                    <div className="text-sm text-gray-500 sm:text-right">
                      {entry.context.change_reason.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderOverviewSection = () => (
    <div className="space-y-4">
      {/* User Info */}
      <Card className="mb-4">
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Preferences Sections */}
      {preferencesSections.map((section, index) => (
        <Card 
          key={index} 
          className={cn(
            "p-4 transition-all duration-200",
            section.available 
              ? "cursor-pointer hover:shadow-md hover:border-primary-200" 
              : "opacity-60"
          )}
          onClick={() => section.available && setActiveSection(section.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("p-2 rounded-lg", section.color)}>
                {section.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 flex items-center">
                  {section.title}
                  {section.available && (
                    <Badge variant="success" className="ml-2 text-xs">
                      Available
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
              </div>
            </div>
            
            {section.available ? (
              <ArrowRight className="h-5 w-5 text-gray-400" />
            ) : (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Coming Soon
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mr-3 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-primary-600 mr-2" />
            <h1 className="text-lg font-semibold text-gray-900">
              {activeSection === 'overview' ? 'Preferences' : 'Health Protocols'}
            </h1>
          </div>
        </div>
        
        {activeSection !== 'overview' && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSection('overview')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Preferences
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-20 max-w-6xl mx-auto">
        {activeSection === 'overview' && renderOverviewSection()}
        {activeSection === 'protocols' && renderProtocolsSection()}
      </div>

      {/* Protocol Change Confirmation Modal */}
      {showChangeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Protocol?
              </h3>
              
              <p className="text-gray-600 mb-4">
                You're about to switch from <strong>{currentProtocol?.protocol_name}</strong> to{' '}
                <strong>{showChangeConfirm.name}</strong>. This change will be tracked for effectiveness analysis.
              </p>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="primary"
                  onClick={() => handleProtocolChange(showChangeConfirm.id, 'user_preference_change')}
                  loading={isChanging}
                  className="flex-1"
                >
                  {isChanging ? 'Changing...' : 'Confirm Change'}
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => setShowChangeConfirm(null)}
                  disabled={isChanging}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Beta Notice - Only show on overview */}
      {activeSection === 'overview' && (
        <div className="p-4 pb-20 max-w-6xl mx-auto">
          <Card variant="warning" padding="default">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Beta Version
              </h3>
              <p className="text-xs text-yellow-700 leading-relaxed">
                You're using an early version of FILO Health. More features and 
                customization options are coming soon!
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PreferencesPage;
