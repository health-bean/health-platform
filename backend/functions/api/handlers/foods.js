const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

/**
 * PHASE 1.1: SERVER-SIDE CACHING IMPLEMENTATION
 * Simple in-memory cache with TTL and LRU eviction
 */
class FoodSearchCache {
    constructor(maxSize = 100, ttlMs = 300000) { // 5 minutes default
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttlMs;
    }
    
    get(key) {
        const entry = this.cache.get(key);
        if (!entry || Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }
        // Update last accessed for LRU
        entry.lastAccessed = Date.now();
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
    
    clear() {
        this.cache.clear();
    }
    
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttlMs: this.ttl
        };
    }
}

// Global cache instance
const searchCache = new FoodSearchCache();

/**
 * UNIFIED FOOD SEARCH - PHASE 1 HELPER FUNCTIONS
 */

/**
 * Generate user-aware cache key for search results
 */
const generateCacheKey = (params, userId, protocolId) => {
    const baseKey = `search:${userId || 'anonymous'}:${protocolId || 'none'}:${params.search}`;
    const paramKey = `${params.limit || 20}:${params.include_properties || true}`;
    return `${baseKey}:${paramKey}`;
};

/**
 * Build optimized query using existing materialized views
 * SIMPLIFIED APPROACH: Use the right view for the job, no complex JOINs
 */
const buildUnifiedQuery = (searchParams, userId) => {
    const hasSearchTerm = searchParams.search && searchParams.search.trim();
    
    if (searchParams.protocol_id) {
        // Protocol-aware query: Use mat_protocol_foods directly (FAST!)
        if (hasSearchTerm) {
            // Search within protocol foods
            const searchPattern = `%${searchParams.search}%`;
            const exactMatch = searchParams.search;
            const startsWithMatch = `${searchParams.search}%`;
            
            const query = `
                SELECT 
                    food_id as id,
                    display_name as name,
                    category_name as category,
                    subcategory_name as subcategory,
                    protocol_status as compliance_status,
                    protocol_phase,
                    dietary_protocol_name as protocol_name,
                    nightshade,
                    histamine,
                    oxalate,
                    lectin,
                    fodmap,
                    'database' as source
                FROM mat_protocol_foods
                WHERE display_name ILIKE $1 
                    AND dietary_protocol_id = $4
                ORDER BY 
                    CASE 
                        WHEN display_name ILIKE $2 THEN 1
                        WHEN display_name ILIKE $3 THEN 2
                        ELSE 3
                    END,
                    CASE protocol_status
                        WHEN 'allowed' THEN 1
                        WHEN 'caution' THEN 2
                        WHEN 'avoid' THEN 3
                        ELSE 4
                    END,
                    display_name ASC
                LIMIT $5
            `;
            
            return {
                query,
                params: [
                    searchPattern, 
                    exactMatch, 
                    startsWithMatch, 
                    searchParams.protocol_id,
                    searchParams.limit
                ]
            };
        } else {
            // Browse all protocol foods (no search term)
            const query = `
                SELECT 
                    food_id as id,
                    display_name as name,
                    category_name as category,
                    subcategory_name as subcategory,
                    protocol_status as compliance_status,
                    protocol_phase,
                    dietary_protocol_name as protocol_name,
                    nightshade,
                    histamine,
                    oxalate,
                    lectin,
                    fodmap,
                    'database' as source
                FROM mat_protocol_foods
                WHERE dietary_protocol_id = $1
                ORDER BY 
                    category_name ASC,
                    CASE protocol_status
                        WHEN 'allowed' THEN 1
                        WHEN 'caution' THEN 2
                        WHEN 'avoid' THEN 3
                        ELSE 4
                    END,
                    display_name ASC
                LIMIT $2
            `;
            
            return {
                query,
                params: [
                    searchParams.protocol_id,
                    searchParams.limit
                ]
            };
        }
    } else {
        // General search: Use simplified_foods directly (FAST!)
        const searchPattern = `%${searchParams.search}%`;
        const exactMatch = searchParams.search;
        const startsWithMatch = `${searchParams.search}%`;
        
        const query = `
            SELECT 
                id,
                name,
                category,
                null as subcategory,
                null as preparation_state,
                null as is_organic,
                null as nightshade,
                null as histamine,
                null as oxalate,
                null as lectin,
                null as fodmap,
                null as compliance_status,
                null as protocol_phase,
                null as protocol_name,
                'database' as source
            FROM simplified_foods
            WHERE name ILIKE $1
            ORDER BY 
                CASE 
                    WHEN name ILIKE $2 THEN 1
                    WHEN name ILIKE $3 THEN 2
                    ELSE 3
                END,
                name ASC
            LIMIT $4
        `;
        
        return {
            query,
            params: [
                searchPattern, 
                exactMatch, 
                startsWithMatch,
                searchParams.limit
            ]
        };
    }
};

/**
 * Track search analytics for insights and optimization
 */
const trackSearchAnalytics = async (analyticsData) => {
    try {
        // For now, just log analytics - could be enhanced to store in database
        console.log(`📊 SEARCH ANALYTICS:`, {
            user_id: analyticsData.userId,
            search_term: analyticsData.searchTerm,
            result_count: analyticsData.resultCount,
            cache_hit: analyticsData.cacheHit,
            response_time: analyticsData.responseTime,
            timestamp: new Date().toISOString()
        });
        
        // Note: Analytics storage can be added later if needed
    } catch (error) {
        console.error('Analytics tracking error:', error);
        // Don't fail the request if analytics fails
    }
};

/**
 * Invalidate cache when user changes protocols
 */
const invalidateProtocolCache = (userId, oldProtocolId, newProtocolId) => {
    try {
        let invalidatedCount = 0;
        
        // Get all cache keys to check for matches
        for (const [key] of searchCache.cache.entries()) {
            // Check if key matches user and either protocol
            if (key.includes(`${userId}:${oldProtocolId}:`) || 
                key.includes(`${userId}:${newProtocolId}:`)) {
                searchCache.cache.delete(key);
                invalidatedCount++;
            }
        }
        
        console.log(`🗑️ Protocol cache invalidation: ${invalidatedCount} entries removed for user ${userId}`);
        return invalidatedCount;
    } catch (error) {
        console.error('Cache invalidation error:', error);
        return 0;
    }
};

/**
 * Get cache statistics for monitoring
 */
const getCacheStats = () => {
    const stats = searchCache.getStats();
    let hitCount = 0;
    let totalRequests = 0;
    
    // Simple hit rate calculation (would be better with persistent counters)
    return {
        ...stats,
        hitRate: totalRequests > 0 ? (hitCount / totalRequests) : 0,
        totalRequests,
        hitCount
    };
};

/**
 * OPTIMIZED Food Search Handler
 * Addresses 26+ second performance issues by:
 * 1. Simplifying queries
 * 2. Reducing data fetching
 * 3. Using direct materialized view queries
 * 4. Eliminating expensive JOINs and aggregations
 */

/**
 * UNIFIED Food Search Handler - Phase 1 Enhancement
 * Handles all search scenarios: general search, protocol-specific, user history
 * Features: User-aware caching, protocol compliance, comprehensive analytics
 */
const handleSearchFoods = async (queryParams, event) => {
    const startTime = Date.now();
    const requestId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let client;
    
    // Get current user for user-aware functionality
    const user = await getCurrentUser(event);
    const userId = user?.id || 'anonymous';
    
    // Enhanced parameter parsing and validation
    const searchParams = {
        search: queryParams.search?.trim() || queryParams.query?.trim() || '',
        protocol_id: queryParams.protocol_id || null,
        limit: Math.min(parseInt(queryParams.limit) || 20, 50),
        include_properties: queryParams.include_properties !== 'false',
        prioritize_user_history: queryParams.prioritize_user_history !== 'false',
        cache_key: queryParams.cache_key || null
    };
    
    console.log(`🔍 [${requestId}] UNIFIED search started:`, {
        ...searchParams,
        user_id: userId,
        timestamp: new Date().toISOString()
    });
    
    try {
        console.log('🚀 OPTIMIZED: Starting food search...');
        
        // Get connection with timeout
        const connectionStart = Date.now();
        client = await pool.connect();
        console.log(`🚀 OPTIMIZED: Database connection took ${Date.now() - connectionStart}ms`);
        
        const search = queryParams.search?.trim() || '';
        const limit = Math.min(parseInt(queryParams.limit) || 20, 50);
        
        // Early return for empty search ONLY if no protocol_id (general search needs a search term)
        if (!searchParams.search && !searchParams.protocol_id) {
            console.log(`🔍 [${requestId}] Empty search without protocol, returning early`);
            return successResponse({
                foods: [],
                total: 0,
                search_term: searchParams.search,
                protocol_id: searchParams.protocol_id,
                performance: { 
                    total_time_ms: Date.now() - startTime,
                    cache_hit: false
                },
                cache_info: {
                    ttl_seconds: 0,
                    cache_key: 'empty_search'
                }
            });
        }
        
        // Generate user-aware cache key
        const cacheKey = generateCacheKey(searchParams, userId, searchParams.protocol_id);
        console.log(`🔍 [${requestId}] Cache key: ${cacheKey}`);
        
        // Check server-side cache
        const cachedResult = searchCache.get(cacheKey);
        if (cachedResult) {
            const totalTime = Date.now() - startTime;
            console.log(`🚀 [${requestId}] Cache HIT! Returning cached result in ${totalTime}ms`);
            
            // Track cache hit analytics
            await trackSearchAnalytics({
                userId: userId,
                searchTerm: searchParams.search,
                resultCount: cachedResult.foods.length,
                cacheHit: true,
                responseTime: totalTime
            });
            
            return successResponse({
                ...cachedResult,
                performance: {
                    ...cachedResult.performance,
                    total_time_ms: totalTime,
                    cache_hit: true,
                    request_id: requestId
                }
            });
        }
        
        console.log(`🔍 [${requestId}] Cache MISS - executing database query`);
        
        // Build unified query based on parameters
        const queryStart = Date.now();
        const { query, params } = buildUnifiedQuery(searchParams, userId);
        
        console.log(`🔍 [${requestId}] Executing unified query...`);
        
        const result = await client.query(query, params);
        console.log(`🔍 [${requestId}] Query executed: ${Date.now() - queryStart}ms, found ${result.rows.length} results`);
        
        const totalTime = Date.now() - startTime;
        
        // Enhanced performance metrics
        const performanceMetrics = {
            request_id: requestId,
            total_time_ms: totalTime,
            query_time_ms: Date.now() - queryStart,
            connection_time_ms: Date.now() - connectionStart,
            result_count: result.rows.length,
            search_term: searchParams.search,
            protocol_id: searchParams.protocol_id,
            cache_hit: false, // Will be true when cache is implemented
            timestamp: new Date().toISOString()
        };
        
        console.log(`📊 [${requestId}] Performance metrics:`, performanceMetrics);
        
        // Track search analytics
        await trackSearchAnalytics({
            userId: userId,
            searchTerm: searchParams.search,
            resultCount: result.rows.length,
            cacheHit: false,
            responseTime: totalTime
        });
        
        // Log slow queries for optimization
        if (totalTime > 500) {
            console.warn(`⚠️ [${requestId}] SLOW QUERY DETECTED:`, {
                duration: totalTime,
                search_term: searchParams.search,
                result_count: result.rows.length,
                protocol_id: searchParams.protocol_id
            });
        }
        
        // Cache result for 5 minutes
        const responseData = {
            foods: result.rows,
            total: result.rows.length,
            search_term: searchParams.search,
            protocol_id: searchParams.protocol_id,
            performance: performanceMetrics,
            cache_info: {
                ttl_seconds: 300, // 5 minutes
                cache_key: cacheKey
            }
        };
        
        searchCache.set(cacheKey, responseData);
        console.log(`🔍 [${requestId}] Result cached with key: ${cacheKey}`);
        
        console.log(`🔍 [${requestId}] UNIFIED search completed: ${totalTime}ms`);
        
        return successResponse(responseData);
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`🔍 [${requestId}] UNIFIED search error after ${totalTime}ms:`, error);
        
        // Track error analytics
        await trackSearchAnalytics({
            userId: userId,
            searchTerm: searchParams.search,
            resultCount: 0,
            cacheHit: false,
            responseTime: totalTime,
            error: error.message
        });
        
        const appError = handleDatabaseError(error, 'unified food search');
        return errorResponse(appError.message, appError.statusCode);
    } finally {
        if (client) {
            const releaseStart = Date.now();
            client.release();
            console.log(`🚀 OPTIMIZED: Connection release took ${Date.now() - releaseStart}ms`);
        }
    }
};

/**
 * Ultra-fast food search - minimal data, maximum speed
 */
const handleSearchFoodsUltraFast = async (queryParams, event) => {
    const startTime = Date.now();
    let client;
    
    try {
        client = await pool.connect();
        
        const search = queryParams.search?.trim() || '';
        const limit = Math.min(parseInt(queryParams.limit) || 10, 20); // Smaller limit
        
        if (!search) {
            return successResponse({ foods: [], total: 0, search_term: search });
        }
        
        // ULTRA-SIMPLE QUERY - Only essential fields
        const query = `
            SELECT 
                id,
                name
            FROM simplified_foods
            WHERE name ILIKE $1
            ORDER BY name ASC
            LIMIT $2
        `;
        
        const result = await client.query(query, [`%${search}%`, limit]);
        
        return successResponse({
            foods: result.rows,
            total: result.rows.length,
            search_term: search,
            performance: { total_time_ms: Date.now() - startTime }
        });
        
    } catch (error) {
        console.error('Ultra-fast search error:', error);
        return errorResponse('Search failed', 500);
    } finally {
        if (client) client.release();
    }
};



/**
 * Cache monitoring endpoint for debugging and performance tracking
 */
const handleGetCacheStats = async (queryParams, event) => {
    try {
        const stats = getCacheStats();
        const cacheEntries = [];
        
        // Get sample cache keys (first 10)
        let count = 0;
        for (const [key, entry] of searchCache.cache.entries()) {
            if (count >= 10) break;
            cacheEntries.push({
                key,
                expiry: new Date(entry.expiry).toISOString(),
                lastAccessed: new Date(entry.lastAccessed).toISOString(),
                resultCount: entry.data.foods?.length || 0
            });
            count++;
        }
        
        return successResponse({
            cache_stats: stats,
            sample_entries: cacheEntries,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cache stats error:', error);
        return errorResponse('Failed to get cache stats', 500);
    }
};

module.exports = {
    handleSearchFoods,
    handleSearchFoodsUltraFast,
    handleGetCacheStats,
    invalidateProtocolCache,
    getCacheStats
};
