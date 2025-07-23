const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { AppError, ErrorTypes, handleDatabaseError, handleAuthError } = require('../utils/errorTypes');
const { getCurrentUser, getAccessibleUserIds, requireAuth } = require('../middleware/auth');

// Helper function to create structured content for JSONB storage
const createStructuredContent = (item, entryType) => {
    const baseContent = {
        entry_source: 'timed_entry',
        item_name: item.name,
        user_history: item.source === 'user_history'
    };

    switch (entryType) {
        case 'food':
            return {
                ...baseContent,
                food_name: item.name,
                category: item.category,
                protocol_compliance: item.compliance_status || 'unknown',
                protocol_allowed: item.protocol_allowed || false
            };
        case 'symptom':
            return {
                ...baseContent,
                symptom_name: item.name,
                severity: item.severity || 5
            };
        case 'supplement':
            return {
                ...baseContent,
                supplement_name: item.name
            };
        case 'medication':
            return {
                ...baseContent,
                medication_name: item.name
            };
        case 'exposure':
            return {
                ...baseContent,
                exposure_type: item.name
            };
        case 'detox':
            return {
                ...baseContent,
                detox_type: item.name,
                duration_minutes: item.duration_minutes || 15
            };
        default:
            return baseContent;
    }
};

const handleGetTimelineEntries = async (queryParams, event) => {
    console.log('=== handleGetTimelineEntries called ===');
    console.log('Query params:', queryParams);
    
    try {
        console.log('Getting current user...');
        const user = await getCurrentUser(event);
        console.log('User:', user);
        
        let accessibleUserIds;
        
        if (user) {
            console.log('User found, getting accessible user IDs...');
            accessibleUserIds = await getAccessibleUserIds(event);
            
            // SECURITY: If no accessible users, return empty result
            if (!accessibleUserIds || accessibleUserIds.length === 0) {
                console.log('❌ No accessible users - returning empty timeline');
                return successResponse({
                    entries: [],
                    total: 0,
                    message: 'No accessible data'
                });
            }
        } else {
            console.log('❌ No authenticated user - access denied');
            const authError = new AppError(ErrorTypes.AUTH_REQUIRED);
            return errorResponse(authError.message, authError.statusCode);
        }
        
        console.log('Accessible user IDs:', accessibleUserIds);
        
        console.log('Connecting to database...');
        const client = await pool.connect();
        const { date = null, limit = 50 } = queryParams;
        
        console.log('Building query with date:', date, 'limit:', limit);
        
        let query = `
            SELECT 
                te.id,
                te.entry_time,
                te.entry_type,
                te.entry_date,
                te.structured_content,
                te.created_at,
                te.user_id
            FROM timeline_entries te
            WHERE te.user_id = ANY($1)
        `;
        
        const values = [accessibleUserIds];
        let paramIndex = 2;
        
        if (date) {
            query += ` AND te.entry_date = $${paramIndex}`;
            values.push(date);
            paramIndex++;
        }
        
        query += ` ORDER BY te.entry_date DESC, te.entry_time DESC LIMIT $${paramIndex}`;
        values.push(limit);
        
        console.log('Final query:', query);
        console.log('With values:', values);
        console.log('Parameter count:', values.length);
        
        const result = await client.query(query, values);
        console.log('Query result:', result.rows.length, 'rows');
        
        client.release();
        
        const response = successResponse({
            entries: result.rows,
            total: result.rows.length
        });
        
        console.log('Returning response with', result.rows.length, 'entries');
        return response;
        
    } catch (error) {
        console.error('=== ERROR in handleGetTimelineEntries ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const appError = handleDatabaseError(error, 'fetch timeline entries');
        console.error('Handled error:', appError);
        
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleCreateTimelineEntry = async (body, event) => {
    console.log('🔧 TIMELINE: handleCreateTimelineEntry called');
    console.log('🔧 TIMELINE: Request body:', JSON.stringify(body, null, 2));
    
    try {
        const user = await getCurrentUser(event);
        let userId;
        
        if (user) {
            userId = user.id;
            console.log('🔧 TIMELINE: User ID:', userId);
        } else {
            console.log('🔧 TIMELINE: No user found - authentication required');
            return errorResponse('Authentication required', 401);
        }
        
        const client = await pool.connect();
        console.log('🔧 TIMELINE: Database connected');
        
        const {
            entryDate,
            entryTime,
            entryType,
            selectedItems = [], // New unified structure
            // Legacy support
            content,
            severity = null,
            selectedFoods = []
        } = body;
        
        console.log('🔧 TIMELINE: Parsed data:', {
            entryDate,
            entryTime,
            entryType,
            selectedItems,
            content,
            severity
        });

        await client.query('BEGIN');
        console.log('🔧 TIMELINE: Transaction started');
        
        let journalEntryId;
        
        // First check if journal entry already exists for this user/date
        const checkQuery = `
            SELECT id FROM journal_entries 
            WHERE user_id = $1 AND entry_date = $2
        `;
        
        const checkResult = await client.query(checkQuery, [userId, entryDate]);
        
        if (checkResult.rows.length > 0) {
            // Use existing journal entry
            journalEntryId = checkResult.rows[0].id;
        } else {
            // Create new journal entry
            const journalQuery = `
                INSERT INTO journal_entries (user_id, entry_date, created_at, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id
            `;
            
            const journalResult = await client.query(journalQuery, [userId, entryDate]);
            journalEntryId = journalResult.rows[0].id;
        }
        
        // Handle new unified selectedItems structure
        if (selectedItems && selectedItems.length > 0) {
            console.log('🔧 TIMELINE: Processing selectedItems:', selectedItems.length, 'items');
            
            for (const item of selectedItems) {
                console.log('🔧 TIMELINE: Processing item:', JSON.stringify(item, null, 2));
                
                const structuredContent = createStructuredContent(item, entryType);
                console.log('🔧 TIMELINE: Structured content:', JSON.stringify(structuredContent, null, 2));
                
                const timelineQuery = `
                    INSERT INTO timeline_entries (
                        journal_entry_id, user_id, entry_date, entry_time, 
                        entry_type, structured_content
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                const timelineValues = [
                    journalEntryId, 
                    userId, 
                    entryDate,
                    entryTime,
                    entryType, 
                    JSON.stringify(structuredContent)
                ];
                
                console.log('🔧 TIMELINE: Timeline query values:', timelineValues);
                
                try {
                    const result = await client.query(timelineQuery, timelineValues);
                    console.log('🔧 TIMELINE: Successfully inserted timeline entry:', result.rows[0].id);
                } catch (insertError) {
                    console.error('🔧 TIMELINE: Timeline insert failed:', insertError);
                    throw insertError;
                }
            }
        } else {
            // Legacy support for old structure - updated for JSONB
            const legacyStructuredContent = {
                entry_source: 'legacy_entry',
                severity: severity || null,
                protocol_compliant: entryType === 'food' ? 
                    await checkProtocolCompliance(selectedFoods, userId, client) : null
            };
            
            const timelineQuery = `
                INSERT INTO timeline_entries (
                    journal_entry_id, user_id, entry_date, entry_time, 
                    entry_type, structured_content
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            
            const timelineValues = [
                journalEntryId, userId, entryDate, entryTime,
                entryType, JSON.stringify(legacyStructuredContent)
            ];
            
            await client.query(timelineQuery, timelineValues);
        }
        
        await client.query('COMMIT');
        client.release();
        
        return successResponse({
            message: 'Timeline entry created successfully'
        }, 201);
        
    } catch (error) {
        const appError = handleDatabaseError(error, 'create timeline entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const checkProtocolCompliance = async (selectedFoods, userId, client) => {
    if (!selectedFoods || selectedFoods.length === 0) return null;
    
    try {
        const query = `
            SELECT COUNT(*) as avoid_count
            FROM protocol_food_rules pfr
            JOIN user_protocols up ON pfr.protocol_id = up.protocol_id
            JOIN foods fp ON pfr.food_id = fp.id
            WHERE up.user_id = $1 
            AND up.active = true
            AND fp.name = ANY($2)
            AND pfr.status = 'avoid'
        `;
        
        const result = await client.query(query, [userId, selectedFoods]);
        return parseInt(result.rows[0].avoid_count) === 0;
        
    } catch (error) {
        console.error('Protocol compliance check failed:', error);
        return null;
    }
};

module.exports = {
    handleGetTimelineEntries,
    handleCreateTimelineEntry
};