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
        const client = await pool.connect();
        const { protocol_id, category = null, search = '', status = null } = queryParams;
        
        if (!protocol_id) {
            return errorResponse('Protocol ID is required', 400);
        }
        
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
                fp.salicylate,
                p.protocol_type,
                p.name as protocol_name,
                COALESCE(pfr.status, 'unknown') as protocol_status,
                pfr.phase as protocol_phase,
                pfr.notes as protocol_notes
            FROM food_properties fp
            JOIN protocols p ON p.id = $1
            LEFT JOIN protocol_food_rules pfr ON fp.id = pfr.food_id AND pfr.protocol_id = $1
            WHERE 1=1
        `;
        
        let paramCount = 1;
        let values = [protocol_id];
        
        // Add search filter
        if (search) {
            paramCount++;
            query += ` AND fp.name ILIKE $${paramCount}`;
            values.push(`%${search}%`);
        }
        
        // Add category filter
        if (category) {
            paramCount++;
            query += ` AND fp.category = $${paramCount}`;
            values.push(category);
        }
        
        // Add status filter
        if (status) {
            paramCount++;
            query += ` AND COALESCE(pfr.status, 'unknown') = $${paramCount}`;
            values.push(status);
        }
        
        query += ` ORDER BY fp.category ASC, fp.name ASC LIMIT 200`;
        
        const result = await client.query(query, values);
        client.release();
        
        // Group foods by category
        const foodsByCategory = result.rows.reduce((acc, food) => {
            const category = food.category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(food);
            return acc;
        }, {});
        
        // Get protocol info
        const protocolQuery = `SELECT * FROM protocols WHERE id = $1`;
        const protocolClient = await pool.connect();
        const protocolResult = await protocolClient.query(protocolQuery, [protocol_id]);
        protocolClient.release();
        
        // Calculate statistics
        const stats = {
            total: result.rows.length,
            allowed: result.rows.filter(f => f.protocol_status === 'allowed').length,
            avoid: result.rows.filter(f => f.protocol_status === 'avoid').length,
            reintroduction: result.rows.filter(f => f.protocol_status === 'reintroduction').length,
            unknown: result.rows.filter(f => f.protocol_status === 'unknown').length
        };
        
        return successResponse({
            protocol: protocolResult.rows[0] || null,
            foods: result.rows,
            foodsByCategory,
            stats,
            filters: {
                search,
                category,
                status,
                protocol_id
            },
            categories: Object.keys(foodsByCategory).sort()
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'get protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};