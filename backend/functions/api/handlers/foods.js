const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams, event) => {
    console.log('🔍 FOODS: Handler called with params:', queryParams);
    
    try {
        const client = await pool.connect();
        console.log('🔍 FOODS: Database connected');
        
        const { search = '', protocol_id = null, prioritize_user_history = 'true' } = queryParams;
        
        // Get user ID properly - this was the issue
        let userId = null;
        try {
            const { getCurrentUser } = require('../middleware/auth');
            const user = await getCurrentUser(event);
            userId = user?.id;
            console.log('🔍 FOODS: User ID:', userId);
        } catch (error) {
            // Continue without user history if auth fails
            console.log('🔍 FOODS: Could not get user ID, continuing without user history:', error.message);
        }
        
        let foods = [];
        
        // Skip user history for now - just get database foods with protocol compliance
        console.log('🔍 FOODS: Searching database with protocol compliance');
        
        const searchPattern = `%${search}%`;
        let query;
        let values;
        
        // FIXED: Use the correct food_search_view with DISTINCT to avoid duplicates
        if (protocol_id) {
            // Include protocol compliance when protocol_id is provided
            query = `
                SELECT DISTINCT
                    fsv.simplified_food_id as id,
                    fsv.display_name as name,
                    fsv.category_name as category,
                    fsv.subcategory_name,
                    COALESCE(fsv.nightshade, false) as nightshade,
                    COALESCE(fsv.histamine, 'unknown') as histamine,
                    COALESCE(fsv.oxalate, 'unknown') as oxalate,
                    COALESCE(fsv.lectin, 'unknown') as lectin,
                    COALESCE(fsv.fodmap, 'unknown') as fodmap,
                    COALESCE(fsv.salicylate, 'unknown') as salicylate,
                    COALESCE(fsv.is_organic, false) as is_organic,
                    COALESCE(fsv.preparation_state, 'unknown') as preparation_state,
                    COALESCE(pfv.protocol_status, 'unknown') as protocol_status
                FROM food_search_view fsv
                LEFT JOIN protocol_foods_view pfv ON fsv.simplified_food_id = pfv.simplified_food_id 
                    AND pfv.protocol_id = $2
                WHERE fsv.display_name ILIKE $1
                ORDER BY fsv.display_name ASC
                LIMIT 10
            `;
            values = [searchPattern, protocol_id];
        } else {
            // Basic search without protocol compliance
            query = `
                SELECT DISTINCT
                    fsv.simplified_food_id as id,
                    fsv.display_name as name,
                    fsv.category_name as category,
                    fsv.subcategory_name,
                    COALESCE(fsv.nightshade, false) as nightshade,
                    COALESCE(fsv.histamine, 'unknown') as histamine,
                    COALESCE(fsv.oxalate, 'unknown') as oxalate,
                    COALESCE(fsv.lectin, 'unknown') as lectin,
                    COALESCE(fsv.fodmap, 'unknown') as fodmap,
                    COALESCE(fsv.salicylate, 'unknown') as salicylate,
                    COALESCE(fsv.is_organic, false) as is_organic,
                    COALESCE(fsv.preparation_state, 'unknown') as preparation_state,
                    'unknown' as protocol_status
                FROM food_search_view fsv
                WHERE fsv.display_name ILIKE $1
                ORDER BY fsv.display_name ASC
                LIMIT 10
            `;
            values = [searchPattern];
        }
        
        console.log('🔍 FOODS: Executing query with protocol_id:', protocol_id);
        console.log('🔍 FOODS: Query:', query);
        console.log('🔍 FOODS: Values:', values);
        
        const result = await client.query(query, values);
        console.log('🔍 FOODS: Query returned:', result.rows.length, 'results');
        
        foods = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            category: row.category || 'unknown',
            subcategory: row.subcategory_name,
            source: 'database',
            compliance_status: row.protocol_status || 'unknown',
            protocol_status: row.protocol_status || 'unknown',
            nightshade: row.nightshade,
            histamine: row.histamine,
            oxalate: row.oxalate,
            lectin: row.lectin,
            fodmap: row.fodmap,
            salicylate: row.salicylate,
            is_organic: row.is_organic,
            preparation_state: row.preparation_state
        }));
        
        client.release();
        
        return successResponse({
            foods: foods,
            total: foods.length,
            search_term: search,
            user_history_included: prioritize_user_history === 'true' && userId
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetProtocolFoods = async (queryParams, event) => {
    try {
        const { protocol_id } = queryParams;
        
        if (!protocol_id) {
            return errorResponse('protocol_id parameter is required', 400);
        }
        
        console.log('=== handleGetProtocolFoods called ===');
        console.log('Protocol ID:', protocol_id);
        
        const client = await pool.connect();
        
        // First, let's check if the protocol exists
        const protocolCheck = await client.query('SELECT id, name FROM protocols WHERE id = $1', [protocol_id]);
        console.log('Protocol check:', protocolCheck.rows);
        
        if (protocolCheck.rows.length === 0) {
            client.release();
            return errorResponse('Protocol not found', 404);
        }
        
        // Check if there are any protocol food rules
        const rulesCheck = await client.query('SELECT COUNT(*) as count FROM protocol_food_rules WHERE protocol_id = $1', [protocol_id]);
        console.log('Protocol food rules count:', rulesCheck.rows[0].count);
        
        // Use the correct views for protocol foods with DISTINCT to avoid duplicates
        const query = `
            SELECT DISTINCT
                fsv.simplified_food_id as id,
                fsv.display_name as name,
                fsv.category_name as category,
                fsv.subcategory_name,
                COALESCE(fsv.nightshade, false) as nightshade,
                COALESCE(fsv.histamine, 'unknown') as histamine,
                COALESCE(fsv.oxalate, 'unknown') as oxalate,
                COALESCE(fsv.lectin, 'unknown') as lectin,
                COALESCE(fsv.fodmap, 'unknown') as fodmap,
                COALESCE(fsv.salicylate, 'unknown') as salicylate,
                COALESCE(fsv.is_organic, false) as is_organic,
                COALESCE(fsv.preparation_state, 'unknown') as preparation_state,
                COALESCE(pfv.protocol_status, 'unknown') as protocol_status,
                pfv.protocol_phase,
                pfv.protocol_notes
            FROM food_search_view fsv
            LEFT JOIN protocol_foods_view pfv ON fsv.simplified_food_id = pfv.simplified_food_id 
                AND pfv.protocol_id = $1
            ORDER BY 
                CASE 
                    WHEN pfv.protocol_status = 'included' THEN 1
                    WHEN pfv.protocol_status = 'avoid_for_now' THEN 2
                    WHEN pfv.protocol_status = 'try_in_moderation' THEN 3
                    ELSE 4
                END,
                fsv.category_name ASC,
                fsv.display_name ASC
            LIMIT 100
        `;
        
        console.log('Executing simplified query');
        const result = await client.query(query, [protocol_id]);
        console.log('Query returned:', result.rows.length, 'rows');
        
        client.release();
        
        // Initialize food groups - FLAT structure for old frontend
        const foodsByCategory = {};
        
        // Nested structure for any new frontend features
        const foodsByStatusCategory = {
            included: {},
            avoid_for_now: {},
            try_in_moderation: {},
            unknown: {}
        };
        
        // Process each food with proper error handling
        result.rows.forEach(food => {
            const status = food.protocol_status || 'unknown';
            const category = food.category || 'other';
            
            console.log('Processing food:', food.name, 'status:', status, 'category:', category);
            
            // Add compliance_status field that frontend expects
            food.compliance_status = status;
            
            // Add additional fields from the new views
            food.subcategory = food.subcategory_name;
            food.is_organic = food.is_organic;
            food.preparation_state = food.preparation_state;
            
            // Add to FLAT category structure (what old frontend expects)
            if (!foodsByCategory[category]) {
                foodsByCategory[category] = [];
            }
            foodsByCategory[category].push(food);
            
            // Also maintain nested structure for any future use
            if (!foodsByStatusCategory[status]) {
                foodsByStatusCategory[status] = {};
            }
            if (!foodsByStatusCategory[status][category]) {
                foodsByStatusCategory[status][category] = [];
            }
            foodsByStatusCategory[status][category].push(food);
        });
        
        // Calculate summary stats with the names the old frontend expects
        const foodsByStatus = {
            allowed: result.rows.filter(f => (f.protocol_status || 'unknown') === 'included'),
            avoid: result.rows.filter(f => (f.protocol_status || 'unknown') === 'avoid_for_now'),
            reintroduction: result.rows.filter(f => (f.protocol_status || 'unknown') === 'try_in_moderation'),
            unknown: result.rows.filter(f => !['included', 'avoid_for_now', 'try_in_moderation'].includes(f.protocol_status || 'unknown'))
        };
        
        const summary = {
            total: result.rows.length,
            allowed: foodsByStatus.allowed.length,
            avoid: foodsByStatus.avoid.length,
            reintroduction: foodsByStatus.reintroduction.length,
            unknown: foodsByStatus.unknown.length
        };
        
        console.log('Summary:', summary);
        console.log('Foods by category structure:', Object.keys(foodsByCategory));
        
        return successResponse({
            foods: result.rows, // Flat array for frontend to map over
            foods_by_category: foodsByCategory, // FLAT structure: { "protein": [foods], "vegetable": [foods] }
            foods_by_status: foodsByStatus, // For any status-based filtering
            foods_by_status_category: foodsByStatusCategory, // Nested structure for future use
            compliance_stats: summary, // Old frontend expects this name
            total_foods: result.rows.length, // Old frontend expects this name
            summary, // Keep this for any new frontend code
            protocol_id
        });
        
    } catch (error) {
        console.error('=== ERROR in handleGetProtocolFoods ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const appError = handleDatabaseError(error, 'fetch protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};
