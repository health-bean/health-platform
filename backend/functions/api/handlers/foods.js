const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchFoods = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', protocol_id = null } = queryParams;
        
        let query = `
            SELECT 
                fp.id,
                fp.name,
                fp.category,
                fp.nightshade,
                fp.histamine,
                fp.oxalate,
                fp.lectin,
                fp.fodmap,
                fp.salicylate
        `;
        
        if (protocol_id) {
            query += `,
                p.protocol_type,
                p.category as protocol_category,
                COALESCE(pfr.status, 'unknown') as protocol_status,
                pfr.phase as protocol_phase,
                pfr.notes as protocol_notes
            FROM food_properties fp
            JOIN protocols p ON p.id = $2
            LEFT JOIN protocol_food_rules pfr ON fp.id = pfr.food_id AND pfr.protocol_id = $2
            WHERE fp.name ILIKE $1
            ORDER BY fp.name ASC
            LIMIT 50
            `;
        } else {
            query += `
            FROM food_properties fp
            WHERE fp.name ILIKE $1
            ORDER BY fp.name ASC
            LIMIT 50
            `;
        }
        
        const values = protocol_id ? [`%${search}%`, protocol_id] : [`%${search}%`];
        const result = await client.query(query, values);
        
        // Add compliance_status field for frontend compatibility
        result.rows.forEach(food => {
            food.compliance_status = food.protocol_status || 'unknown';
        });
        
        client.release();
        
        return successResponse({
            foods: result.rows,
            total: result.rows.length,
            search_term: search,
            protocol_id: protocol_id
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
        
        const query = `
            SELECT 
                fp.id,
                fp.name,
                fp.category,
                fp.nightshade,
                fp.histamine,
                fp.oxalate,
                fp.lectin,
                fp.fodmap,
                fp.salicylate,
                p.protocol_type,
                p.category as protocol_category,
                COALESCE(pfr.status, 'unknown') as protocol_status,
                pfr.phase as protocol_phase,
                pfr.notes as protocol_notes
            FROM food_properties fp
            JOIN protocols p ON p.id = $1
            LEFT JOIN protocol_food_rules pfr ON fp.id = pfr.food_id AND pfr.protocol_id = $1
            WHERE pfr.protocol_id = $1
            ORDER BY 
                CASE 
                    WHEN pfr.status = 'included' THEN 1
                    WHEN pfr.status = 'avoid_for_now' THEN 2
                    ELSE 3
                END,
                fp.category ASC,
                fp.name ASC
        `;
        
        console.log('Executing query:', query);
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