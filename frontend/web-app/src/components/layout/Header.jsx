// File: frontend/web-app/src/components/layout/Header.jsx (UPDATED)

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { Input, Button } from '../../../../shared/components/ui';
import useAuth from '../../../../shared/hooks/useAuth';
import MultiSelectProtocolDropdown from '../common/MultiSelectProtocolDropdown';

const Header = ({ 
  selectedDate, 
  onDateChange, 
  protocols, 
  selectedProtocols, 
  onProtocolChange,
  protocolsLoading,
  protocolsError,
  onPreferencesClick 
}) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProtocolObjects = protocols.filter(p => 
    selectedProtocols && selectedProtocols.includes(p.id)
  );

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
  };

  const handlePreferences = () => {
    setShowUserDropdown(false);
    onPreferencesClick();
  };

  const getUserAvatar = () => {
    if (!user) return '👤';
    switch (user.firstName) {
      case 'Sarah': return '👩‍💼';
      case 'Mike': return '👨‍💻';
      case 'Lisa': return '👩‍🔬';
      case 'John': return '👨‍🍳';
      case 'Emma': return '👩‍⚕️';
      default: return '👤';
    }
  };

  return (
    <div className="bg-blue-600 text-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">🚀 FILO Health Journal</h1>
          <Calendar size={20} className="ml-2" />
        </div>
        
        {/* User Profile Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center text-white hover:bg-blue-700 px-3 py-2 rounded-lg"
            >
              <span className="text-lg mr-2">{getUserAvatar()}</span>
              <span className="font-medium mr-1">{user.firstName}</span>
              <ChevronDown size={16} />
            </Button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getUserAvatar()}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handlePreferences}
                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Settings size={16} className="mr-2" />
                  Account Settings
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="mt-2 text-gray-900 focus:ring-2 focus:ring-blue-300"
      />
      
      {/* Multi-Protocol Selection */}
      {!protocolsLoading && protocols.length > 0 && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-white mb-1">Active Protocols</label>
          <MultiSelectProtocolDropdown
            protocols={protocols}
            selectedProtocols={selectedProtocols}
            onSelectionChange={onProtocolChange}
          />
          {selectedProtocolObjects.length > 0 && (
            <p className="text-xs text-blue-100 mt-1">
              {selectedProtocolObjects.map(p => p.name).join(' + ')}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {protocolsError && (
        <div className="mt-2 text-xs text-red-200">
          Unable to load protocols: {protocolsError}
        </div>
      )}
    </div>
  );
};

export default Header;