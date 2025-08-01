/**
 * UNIFIED SEARCH HOOK - All Types
 * Handles search for foods, symptoms, supplements, medications, exposures, detox types
 * Provides consistent caching, debouncing, and error handling for all search types
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api.js';

// Import the specialized food search hook and unified configuration
import { useFoodSearch } from './useFoodSearchUnified.js';
import { getSelectorConfig } from '../config/selectorTypes.js';

/**
 * Unified search hook that handles all search types
 */
export const useUnifiedSearch = (options = {}) => {
  const {
    type, // 'food', 'symptom', 'supplement', 'medication', 'exposure', 'detox'
    protocolId = null,
    enableCache = true,
    debounceMs = 300,
    prioritizeUserHistory = true
  } = options;

  // For food searches, delegate to the specialized food search hook
  const foodSearchHook = useFoodSearch({ 
    protocolId,
    enableCache,
    debounceMs
  });

  // For non-food searches, use generic search logic
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Refs for debouncing
  const debounceTimeoutRef = useRef(null);

  // Get unified configuration for this type
  const config = getSelectorConfig(type);

  // Generic search function for non-food types
  const searchItems = useCallback(async (searchTermInput) => {
    if (!searchTermInput?.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = `${config.endpoint}?search=${encodeURIComponent(searchTermInput)}`;
      
      if (prioritizeUserHistory) {
        endpoint += '&prioritize_user_history=true';
      }

      const response = await apiClient.get(endpoint);
      const results = response[config.responseKey] || [];
      
      setItems(results);
      setSearchTerm(searchTermInput);
    } catch (err) {
      console.error(`❌ ${type} search failed:`, err);
      setError(err.message || `Failed to search ${type}s`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, config.endpoint, config.responseKey, prioritizeUserHistory]);

  // Debounced search function
  const debouncedSearch = useCallback((searchTermInput) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      if (type === 'food') {
        // Delegate to food search hook
        foodSearchHook.searchFoods(searchTermInput);
      } else {
        // Use generic search
        searchItems(searchTermInput);
      }
    }, debounceMs);
  }, [type, searchItems, foodSearchHook.searchFoods, debounceMs]);

  // Clear results
  const clearResults = useCallback(() => {
    if (type === 'food') {
      foodSearchHook.clearResults();
    } else {
      setItems([]);
      setSearchTerm('');
      setError(null);
    }
  }, [type, foodSearchHook.clearResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Return appropriate data based on type
  if (type === 'food') {
    return {
      items: foodSearchHook.foods,
      loading: foodSearchHook.loading,
      error: foodSearchHook.error,
      searchItems: debouncedSearch,
      clearResults: foodSearchHook.clearResults,
      searchTerm: foodSearchHook.searchTerm,
      cacheStats: foodSearchHook.cacheStats
    };
  }

  return {
    items,
    loading,
    error,
    searchItems: debouncedSearch,
    clearResults,
    searchTerm,
    cacheStats: null // Non-food types don't have caching yet
  };
};

export default useUnifiedSearch;