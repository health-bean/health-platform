const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser } = require('../middleware/auth');

const handleSearchFoods = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const search = queryParams.search || '';
        
        // Use trigram search for better partial matching
        const searchPattern = `%${search}%`;
        
        // Get current user to check their active protocols
        const user = await getCurrentUser(event);
        let userProtocols = [];
        
        if (user) {
            const protocolQuery = `
                SELECT up.dietary_protocol_id as protocol_id, p.name as protocol_name
                FROM user_dietary_protocols up
                JOIN dietary_protocols p ON up.dietary_protocol_id = p.id
                WHERE up.user_id = $1 AND up.is_active = true
            `;
            const protocolResult = await client.query(protocolQuery, [user.id]);
            userProtocols = protocolResult.rows;
        }
        
        // Use materialized view with trigram search for better performance and matching
        const foodQuery = `
            SELECT 
                food_id as id,
                display_name as name,
                category_name as category,
                subcategory_name as subcategory,
                preparation_state,
                is_organic,
                properties,
                nightshade,
                histamine,
                oxalate,
                lectin,
                fodmap,
                salicylate
            FROM mat_food_search
            WHERE display_name ILIKE $1
            ORDER BY 
                CASE 
                    WHEN display_name ILIKE $2 THEN 1  -- Exact match first
                    WHEN display_name ILIKE $3 THEN 2  -- Starts with search term
                    ELSE 3                             -- Contains search term
                END,
                display_name ASC
            LIMIT 20
        `;
        
        const exactMatch = search;
        const startsWithMatch = `${search}%`;
        const containsMatch = searchPattern;
        
        const foodResult = await client.query(foodQuery, [containsMatch, exactMatch, startsWithMatch]);
        
        // If user has active protocols, get pre-computed compliance from materialized view
        const foods = [];
        for (const food of foodResult.rows) {
            const foodWithCompliance = {
                id: food.id,
                name: food.name,
                category: food.category,
                subcategory: food.subcategory,
                preparation_state: food.preparation_state,
                is_organic: food.is_organic,
                properties: food.properties
            };
            
            if (userProtocols.length > 0) {
                foodWithCompliance.protocol_status = [];
                
                // Use materialized view for fast protocol compliance lookup
                for (const protocol of userProtocols) {
                    const complianceQuery = `
                        SELECT protocol_status, protocol_phase, protocol_notes
                        FROM mat_protocol_foods
                        WHERE food_id = $1 AND dietary_protocol_id = $2
                    `;
                    const complianceResult = await client.query(complianceQuery, [food.id, protocol.protocol_id]);
                    
                    if (complianceResult.rows.length > 0) {
                        const compliance = complianceResult.rows[0];
                        foodWithCompliance.protocol_status.push({
                            protocol_name: protocol.protocol_name,
                            status: compliance.protocol_status,
                            phase: compliance.protocol_phase,
                            notes: compliance.protocol_notes,
                            display_message: getProtocolDisplayMessage(compliance.protocol_status, protocol.protocol_name, compliance.protocol_notes),
                            icon: getProtocolIcon(compliance.protocol_status),
                            rule_source: 'Pre-computed'
                        });
                    } else {
                        // Fallback to unknown if not in materialized view
                        foodWithCompliance.protocol_status.push({
                            protocol_name: protocol.protocol_name,
                            status: 'unknown',
                            display_message: `🔍 Not yet evaluated for your ${protocol.protocol_name} protocol`,
                            icon: '🔍',
                            rule_source: 'Not computed'
                        });
                    }
                }
            }
            
            foods.push(foodWithCompliance);
        }
        
        client.release();
        
        return successResponse({
            foods,
            total: foods.length,
            search_term: search,
            user_protocols: userProtocols.map(p => p.protocol_name)
        });
        
    } catch (error) {
        console.error('Error in handleSearchFoods:', error);
        const appError = handleDatabaseError(error, 'search foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetProtocolFoods = async (queryParams, event) => {
    try {
        const protocol_id = queryParams.protocol_id || queryParams.dietary_protocol_id;
        
        if (!protocol_id) {
            return errorResponse('protocol_id parameter is required', 400);
        }
        
        const client = await pool.connect();
        
        // Get protocol info
        const protocolQuery = `SELECT name FROM dietary_protocols WHERE id = $1`;
        const protocolResult = await client.query(protocolQuery, [protocol_id]);
        
        if (protocolResult.rows.length === 0) {
            client.release();
            return errorResponse('Protocol not found', 404);
        }
        
        const protocolName = protocolResult.rows[0].name;
        
        // Use materialized view for fast protocol-specific food lookup
        const foodQuery = `
            SELECT 
                food_id as id, 
                display_name as name, 
                category_name as category,
                subcategory_name as subcategory, 
                protocol_status,
                protocol_phase,
                protocol_notes,
                nightshade, 
                histamine, 
                oxalate,
                lectin, 
                fodmap, 
                salicylate
            FROM mat_protocol_foods
            WHERE dietary_protocol_id = $1
            ORDER BY 
                CASE protocol_status
                    WHEN 'allowed' THEN 1
                    WHEN 'moderation' THEN 2
                    WHEN 'conditional' THEN 3
                    WHEN 'reintroduction' THEN 4
                    WHEN 'avoid' THEN 5
                    ELSE 6
                END,
                category_name ASC, 
                display_name ASC
            LIMIT 500
        `;
        
        const foodResult = await client.query(foodQuery, [protocol_id]);
        
        const foodsByStatus = {
            allowed: [], 
            moderation: [], 
            conditional: [], 
            reintroduction: [], 
            avoid: [], 
            unknown: []
        };
        
        for (const food of foodResult.rows) {
            const foodWithCompliance = {
                id: food.id,
                name: food.name,
                category: food.category,
                subcategory: food.subcategory,
                protocol_status: food.protocol_status,
                protocol_phase: food.protocol_phase,
                protocol_notes: food.protocol_notes,
                display_message: getProtocolDisplayMessage(food.protocol_status, protocolName, food.protocol_notes),
                icon: getProtocolIcon(food.protocol_status),
                rule_source: 'Pre-computed',
                properties: {
                    nightshade: food.nightshade,
                    histamine: food.histamine,
                    oxalate: food.oxalate,
                    lectin: food.lectin,
                    fodmap: food.fodmap,
                    salicylate: food.salicylate
                }
            };
            
            const status = food.protocol_status || 'unknown';
            foodsByStatus[status].push(foodWithCompliance);
        }
        
        client.release();
        
        return successResponse({
            foods_by_status: foodsByStatus,
            compliance_stats: {
                total: foodResult.rows.length,
                allowed: foodsByStatus.allowed.length,
                avoid: foodsByStatus.avoid.length,
                moderation: foodsByStatus.moderation.length,
                conditional: foodsByStatus.conditional.length,
                reintroduction: foodsByStatus.reintroduction.length,
                unknown: foodsByStatus.unknown.length
            },
            protocol_id,
            protocol_name: protocolName
        });
        
    } catch (error) {
        console.error('Error in handleGetProtocolFoods:', error);
        const appError = handleDatabaseError(error, 'fetch protocol foods');
        return errorResponse(appError.message, appError.statusCode);
    }
};

// Helper functions for protocol display
function getProtocolDisplayMessage(status, protocolName, notes) {
    const messages = {
        'allowed': `✅ Great choice for your ${protocolName} protocol`,
        'moderation': `⚖️ Enjoy in moderation on your ${protocolName} protocol`,
        'conditional': `⚠️ Check phase guidelines for your ${protocolName} protocol`,
        'reintroduction': `🔄 Consider for reintroduction phase of ${protocolName}`,
        'avoid': `❌ Best to avoid on your ${protocolName} protocol`,
        'unknown': `🔍 Not yet evaluated for your ${protocolName} protocol`
    };
    
    const baseMessage = messages[status] || messages['unknown'];
    return notes ? `${baseMessage}\n💡 ${notes}` : baseMessage;
}

function getProtocolIcon(status) {
    const icons = {
        'allowed': '✅',
        'moderation': '⚖️',
        'conditional': '⚠️',
        'reintroduction': '🔄',
        'avoid': '❌',
        'unknown': '🔍'
    };
    return icons[status] || '🔍';
}

module.exports = {
    handleSearchFoods,
    handleGetProtocolFoods
};
