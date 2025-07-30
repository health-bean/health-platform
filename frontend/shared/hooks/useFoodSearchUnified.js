/**
 * UNIFIED FOOD SEARCH HOOK - Phase 2
 * Replaces multiple food search implementations with single, cached, intelligent hook
 * Features: Protocol-aware search, client-side caching, request debouncing, analytics
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api.js';

/**
 * Client-side LRU Cache for food search results
 */
class FoodSearchCache {
  constructor(maxSize = 100, ttlMs = 300000) { // 5 minutes default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMs;
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }
  
  get(key) {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update last accessed for LRU
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    return entry.data;
  }
  
  set(key, data) {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl,
      lastAccessed: Date.now()
    });
  }
  
  evictLRU() {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  invalidatePattern(pattern) {
    let invalidatedCount = 0;
    for (const [key] of this.cache.entries()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    return invalidatedCount;
  }
  
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }
  
  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalRequests: 0 };
  }
}

// Global cache instance shared across all hook instances
const globalFoodCache = new FoodSearchCache();

/**
 * Generate cache key for search parameters
 */
const generateCacheKey = (searchTerm, options) => {
  const { protocolId, limit, includeProperties } = options;
  return `search:${protocolId || 'none'}:${searchTerm}:${limit}:${includeProperties}`;
};

/**
 * Unified Food Search Hook
 */
export const useFoodSearch = (options = {}) => {
  const {
    protocolId = null,
    enableCache = true,
    debounceMs = 300,
    maxCacheSize = 100,
    cacheTtlMs = 300000, // 5 minutes
    limit = 50,
    includeProperties = true
  } = options;
  
  // State
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearchTime, setLastSearchTime] = useState(0);
  
  // Refs for debouncing and request deduplication
  const debounceTimeoutRef = useRef(null);
  const currentRequestRef = useRef(null);
  const requestIdRef = useRef(0);
  
  /**
   * Clear search results
   */
  const clearResults = useCallback(() => {
    setFoods([]);
    setSearchTerm('');
    setError(null);
  }, []);
  
  /**
   * Clear cache (useful for protocol changes)
   */
  const clearCache = useCallback(() => {
    globalFoodCache.clear();
  }, []);
  
  /**
   * Invalidate cache for specific protocol
   */
  const invalidateProtocolCache = useCallback((oldProtocolId, newProtocolId) => {
    let invalidatedCount = 0;
    if (oldProtocolId) {
      invalidatedCount += globalFoodCache.invalidatePattern(`:${oldProtocolId}:`);
    }
    if (newProtocolId) {
      invalidatedCount += globalFoodCache.invalidatePattern(`:${newProtocolId}:`);
    }
    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries for protocol change`);
    return invalidatedCount;
  }, []);

  /**
   * Load all protocol foods for browsing (no search term)
   */
  const loadProtocolFoods = useCallback(async () => {
    if (!protocolId) {
      setError('Protocol ID is required for loading protocol foods');
      return;
    }

    const cacheKey = generateCacheKey('', { protocolId, limit: 50, includeProperties: true });
    
    // Check cache first
    const cachedResult = globalFoodCache.get(cacheKey);
    if (cachedResult) {
      console.log('🎯 Cache HIT for protocol foods:', protocolId);
      setFoods(cachedResult);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        protocol_id: protocolId,
        limit: '50',
        include_properties: 'true'
      });

      console.log('🔍 Loading protocol foods:', protocolId);
      const startTime = Date.now();
      
      const response = await apiClient.get(`/api/v1/foods/search?${params}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`🔍 Protocol foods loaded in ${responseTime}ms:`, response.foods?.length || 0, 'foods');
      
      if (response.foods) {
        const processedFoods = deduplicateFoods(response.foods);
        
        // Cache the result
        globalFoodCache.set(cacheKey, processedFoods);
        
        setFoods(processedFoods);
        setLastSearchTime(Date.now());
      } else {
        setFoods([]);
      }
    } catch (err) {
      console.error('❌ Protocol foods loading failed:', err);
      setError(err.message || 'Failed to load protocol foods');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [protocolId, limit, includeProperties]);
  
  /**
   * Main search function with caching and debouncing
   */
  const searchFoods = useCallback(async (searchTermInput, searchOptions = {}) => {
    const searchStart = Date.now();
    const requestId = ++requestIdRef.current;
    
    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Cancel previous request if still pending
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }
    
    const searchParams = {
      search: searchTermInput?.trim() || '',
      protocol_id: searchOptions.protocolId || protocolId,
      limit: searchOptions.limit || 20,
      include_properties: searchOptions.includeProperties !== false,
      prioritize_user_history: searchOptions.prioritizeUserHistory !== false
    };
    
    // Early return for empty search
    if (!searchParams.search) {
      setFoods([]);
      setSearchTerm('');
      setError(null);
      setLoading(false);
      return;
    }
    
    setSearchTerm(searchParams.search);
    setError(null);
    
    // Debounce the actual search
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = generateCacheKey(searchParams.search, searchParams);
        
        if (enableCache) {
          const cachedResult = globalFoodCache.get(cacheKey);
          if (cachedResult) {
            console.log(`🚀 Cache HIT for "${searchParams.search}" (${Date.now() - searchStart}ms)`);
            setFoods(cachedResult.foods || []);
            setLastSearchTime(Date.now());
            setLoading(false);
            return;
          }
        }
        
        console.log(`🔍 Cache MISS for "${searchParams.search}" - fetching from API`);
        
        // Create request tracker
        const requestTracker = { cancelled: false };
        currentRequestRef.current = requestTracker;
        
        // Make API call
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, value.toString());
          }
        });
        
        const response = await apiClient.get(`/api/v1/foods/search?${params}`);
        
        // Check if request was cancelled
        if (requestTracker.cancelled || requestId !== requestIdRef.current) {
          console.log(`🚫 Request cancelled for "${searchParams.search}"`);
          return;
        }
        
        const searchResults = response.foods || [];
        
        // Process and deduplicate results
        const processedFoods = deduplicateFoods(searchResults);
        
        // Cache the result
        if (enableCache) {
          globalFoodCache.set(cacheKey, { foods: processedFoods });
        }
        
        setFoods(processedFoods);
        setLastSearchTime(Date.now());
        
        console.log(`🔍 Search completed for "${searchParams.search}": ${processedFoods.length} results (${Date.now() - searchStart}ms)`);
        
      } catch (err) {
        // Check if request was cancelled
        if (currentRequestRef.current?.cancelled || requestId !== requestIdRef.current) {
          return;
        }
        
        console.error('Food search error:', err);
        setError(err.message || 'Search failed');
        setFoods([]);
      } finally {
        if (!currentRequestRef.current?.cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);
    
  }, [protocolId, enableCache, debounceMs]);
  
  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return globalFoodCache.getStats();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (currentRequestRef.current) {
        currentRequestRef.current.cancelled = true;
      }
    };
  }, []);
  
  return {
    // Data
    foods,
    loading,
    error,
    
    // Actions
    searchFoods,
    loadProtocolFoods,
    clearResults,
    clearCache,
    invalidateProtocolCache,
    
    // Metadata
    totalResults: foods.length,
    searchTerm,
    lastSearchTime,
    cacheStats: getCacheStats()
  };
};

/**
 * Deduplicate foods with same name, prioritizing those with protocol compliance
 */
const deduplicateFoods = (foods) => {
  const foodMap = new Map();
  
  foods.forEach(food => {
    const baseName = food.name.toLowerCase().trim();
    
    if (foodMap.has(baseName)) {
      const existing = foodMap.get(baseName);
      // Prioritize foods with known compliance status
      if (food.compliance_status && food.compliance_status !== 'unknown' && 
          (!existing.compliance_status || existing.compliance_status === 'unknown')) {
        foodMap.set(baseName, {
          ...food,
          // Keep the simpler name if it exists
          name: existing.name.length <= food.name.length ? existing.name : food.name
        });
      }
    } else {
      foodMap.set(baseName, food);
    }
  });
  
  return Array.from(foodMap.values());
};

export default useFoodSearch;