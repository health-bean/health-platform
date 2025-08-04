// File: frontend/web-app/src/components/layout/Header.jsx (UPDATED)

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { Input, Button, Card } from '../../../../shared/components/ui';
import { cn } from '../../../../shared/design-system';
import { useAuth } from '../../contexts/AuthProvider';
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-neutral-50 border-b border-neutral-200 shadow-sm sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Date Selector */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm w-36"
                size="sm"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-2"
            >
              <div className="w-8 h-8 bg-filo-teal rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-gray-400 transition-transform duration-200",
                showUserDropdown && "rotate-180"
              )} />
            </Button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 z-50">
                <Card variant="elevated" padding="none" className="shadow-lg">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-filo-teal rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        onPreferencesClick();
                        setShowUserDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Preferences</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Protocol Filter */}
        <div className="mt-3">
          <MultiSelectProtocolDropdown
            protocols={protocols}
            selectedProtocols={selectedProtocols}
            onProtocolChange={onProtocolChange}
            loading={protocolsLoading}
            error={protocolsError}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
