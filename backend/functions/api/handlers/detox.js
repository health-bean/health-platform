const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const handleSearchDetoxTypes = async (queryParams, event) => {
    try {
        const client = await pool.connect();
        const { search = '', limit = 10, prioritize_user_history = 'true' } = queryParams;
        const userId = event.user?.id;
        
        let detoxTypes = [];
        
        // If prioritizing user history and user is authenticated
        if (prioritize_user_history === 'true' && userId) {
            // First get user's detox history
            const userHistoryQuery = `
                SELECT DISTINCT
                    NULL as id,
                    LOWER(TRIM(COALESCE(
                        structured_content->>'detox_type',
                        structured_content->>'item_name',
                        'Unknown'
                    ))) as name,
                    'Personal History' as category,
                    'user_history' as source,
                    COUNT(*) as frequency
                FROM timeline_entries
                WHERE user_id = $1 
                  AND entry_type = 'detox'
                  AND LOWER(TRIM(COALESCE(
                      structured_content->>'detox_type',
                      structured_content->>'item_name',
                      'Unknown'
                  ))) ILIKE $2
                GROUP BY LOWER(TRIM(COALESCE(
                    structured_content->>'detox_type',
                    structured_content->>'item_name',
                    'Unknown'
                )))
                ORDER BY frequency DESC, name ASC
                LIMIT $3
            `;
            
            const searchPattern = `%${search.toLowerCase()}%`;
            const userResult = await client.query(userHistoryQuery, [userId, searchPattern, Math.floor(limit / 2)]);
            
            detoxTypes = userResult.rows.map(row => ({
                id: `user_${row.name}`,
                name: row.name,
                category: row.category,
                description: `You've logged this ${row.frequency} time${row.frequency > 1 ? 's' : ''}`,
                duration_suggested: null,
                source: 'user_history',
                frequency: row.frequency
            }));
        }
        
        // Then get from detox_types database
        const dbQuery = `
            SELECT 
                id,
                name,
                category,
                duration_suggested,
                description
            FROM detox_types
            WHERE (name ILIKE $1 
               OR COALESCE(description, '') ILIKE $1)
            AND is_active = true
            ORDER BY 
                CASE 
                    WHEN name ILIKE $2 THEN 1
                    ELSE 2
                END,
                name ASC
            LIMIT $3
        `;
        
        const searchPattern = `%${search}%`;
        const exactMatch = `${search}%`;
        const remainingLimit = limit - detoxTypes.length;
        const values = [searchPattern, exactMatch, remainingLimit];
        
        const dbResult = await client.query(dbQuery, values);
        
        // Add database results, avoiding duplicates
        const userDetoxNames = new Set(detoxTypes.map(d => d.name.toLowerCase()));
        const dbDetoxTypes = dbResult.rows
            .filter(row => !userDetoxNames.has(row.name.toLowerCase()))
            .map(row => ({
                ...row,
                source: 'database'
            }));
        
        detoxTypes = [...detoxTypes, ...dbDetoxTypes];
        
        client.release();
        
        return successResponse({
            detox_types: detoxTypes,
            total: detoxTypes.length,
            search_term: search,
            user_history_included: prioritize_user_history === 'true' && userId
        });
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'search detox types');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleSearchDetoxTypes
};
