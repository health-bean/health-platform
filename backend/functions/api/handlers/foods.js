const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

/**
 * OPTIMIZED Food Search Handler
 * Addresses 26+ second performance issues by:
 * 1. Simplifying queries
 * 2. Reducing data fetching
 * 3. Using direct materialized view queries
 * 4. Eliminating expensive JOINs and aggregations
 */

/**
 * Fast food search - optimized for sub-second performance
 */
const handleSearchFoods = async (queryParams, event) => {
    const startTime = Date.now();
    let client;
    
    try {
        console.log('🚀 OPTIMIZED: Starting food search...');
        
        // Get connection with timeout
        const connectionStart = Date.now();
        client = await pool.connect();
        console.log(`🚀 OPTIMIZED: Database connection took ${Date.now() - connectionStart}ms`);
        
        const search = queryParams.search?.trim() || '';
        const limit = Math.min(parseInt(queryParams.limit) || 20, 50);
        
        // Early return for empty search
        if (!search) {
            console.log('🚀 OPTIMIZED: Empty search, returning early');
            return successResponse({
                foods: [],
                total: 0,
                search_term: search,
                performance: { total_time_ms: Date.now() - startTime }
            });
        }
        
        // SIMPLIFIED QUERY - Direct materialized view access
        const queryStart = Date.now();
        const searchPattern = `%${search}%`;
        
        const query = `
            SELECT 
                food_id as id,
                display_name as name,
                category_name as category,
                subcategory_name as subcategory,
                preparation_state,
                is_organic
            FROM mat_food_search
            WHERE display_name ILIKE $1
            ORDER BY 
                CASE 
                    WHEN display_name ILIKE $2 THEN 1
                    WHEN display_name ILIKE $3 THEN 2
                    ELSE 3
                END,
                display_name ASC
            LIMIT $4
        `;
        
        const exactMatch = search;
        const startsWithMatch = `${search}%`;
        const params = [searchPattern, exactMatch, startsWithMatch, limit];
        
        console.log('🚀 OPTIMIZED: Executing simplified query...');
        const result = await client.query(query, params);
        console.log(`🚀 OPTIMIZED: Query took ${Date.now() - queryStart}ms, found ${result.rows.length} results`);
        
        const totalTime = Date.now() - startTime;
        console.log(`🚀 OPTIMIZED: Total request time: ${totalTime}ms`);
        
        return successResponse({
            foods: result.rows,
            total: result.rows.length,
            search_term: search,
            performance: {
                total_time_ms: totalTime,
                query_time_ms: Date.now() - queryStart,
                connection_time_ms: Date.now() - connectionStart
            }
        });
        
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`🚀 OPTIMIZED: Error after ${totalTime}ms:`, error);
        const appError = handleDatabaseError(error, 'search foods');
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
                food_id as id,
                display_name as name
            FROM mat_food_search
            WHERE display_name ILIKE $1
            ORDER BY display_name ASC
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
 * Simple protocol foods handler - optimized version
 */
const handleGetProtocolFoods = async (queryParams, event) => {
    let client;
    try {
        client = await pool.connect();
        
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }
        
        const limit = Math.min(parseInt(queryParams.limit) || 50, 100);
        
        // Simple query for protocol foods
        const query = `
            SELECT 
                food_id as id,
                display_name as name,
                category_name as category,
                dietary_protocol_name as protocol_name,
                protocol_status
            FROM mat_protocol_foods
            WHERE dietary_protocol_id IN (
                SELECT dietary_protocol_id 
                FROM user_dietary_protocols 
                WHERE user_id = $1 AND is_active = true
            )
            ORDER BY display_name ASC
            LIMIT $2
        `;
        
        const result = await client.query(query, [user.id, limit]);
        
        return successResponse({
            foods: result.rows,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('Error in handleGetProtocolFoods:', error);
        const appError = handleDatabaseError(error, 'fetch protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods,
    handleSearchFoodsUltraFast
};
