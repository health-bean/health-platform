// File: frontend/shared/hooks/useSimpleApi.js
// Simple API hook for clean auth integration

import { useEffect } from 'react';
import { simpleApiClient } from '../services/simpleApi';
import { useSimpleAuth } from '../components/SimpleAuthProvider';
import safeLogger from '../utils/safeLogger';

// Hook to automatically sync API client with auth state
export const useSimpleApi = () => {
  const { getUserContext, isAuthenticated } = useSimpleAuth();

  // Sync API client with auth state
  useEffect(() => {
    const userContext = getUserContext();
    
    if (isAuthenticated && userContext) {
      simpleApiClient.setUserContext(userContext);
      safeLogger.debug('API client synced with auth', { 
        userId: userContext.userId 
      });
    } else {
      simpleApiClient.clearUserContext();
      safeLogger.debug('API client cleared - no auth');
    }
  }, [isAuthenticated, getUserContext]);

  return simpleApiClient;
};

// Hook for journal/reflection data
export const useJournalApi = () => {
  const api = useSimpleApi();
  const { getUserContext } = useSimpleAuth();

  const getJournalEntry = async (date) => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    return api.getDemoData(userContext.userId, `/api/v1/journal/entries/${date}`);
  };

  const saveJournalEntry = async (date, data) => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    const entryData = {
      entry_date: date,
      demo_user: userContext.userId,
      ...data
    };
    
    return api.saveDemoData(userContext.userId, '/api/v1/journal/entries', entryData);
  };

  return {
    getJournalEntry,
    saveJournalEntry
  };
};

// Hook for timeline data
export const useTimelineApi = () => {
  const api = useSimpleApi();
  const { getUserContext } = useSimpleAuth();

  const getTimelineEntries = async (date) => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    return api.getDemoData(userContext.userId, `/api/v1/timeline/entries?date=${date}`);
  };

  const addTimelineEntry = async (entryData) => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    return api.saveDemoData(userContext.userId, '/api/v1/timeline/entries', entryData);
  };

  return {
    getTimelineEntries,
    addTimelineEntry
  };
};

// Hook for user preferences
export const usePreferencesApi = () => {
  const api = useSimpleApi();
  const { getUserContext } = useSimpleAuth();

  const getPreferences = async () => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    return api.getDemoData(userContext.userId, '/api/v1/users/preferences');
  };

  const updatePreferences = async (preferences) => {
    const userContext = getUserContext();
    if (!userContext) throw new Error('Not authenticated');
    
    return api.saveDemoData(userContext.userId, '/api/v1/users/preferences', preferences);
  };

  return {
    getPreferences,
    updatePreferences
  };
};

// Hook for protocols
export const useProtocolsApi = () => {
  const api = useSimpleApi();

  const getProtocols = async () => {
    return api.get('/api/v1/protocols');
  };

  const getProtocolFoods = async (protocolId) => {
    return api.get(`/api/v1/foods/by-protocol?protocol_id=${protocolId}`);
  };

  return {
    getProtocols,
    getProtocolFoods
  };
};
