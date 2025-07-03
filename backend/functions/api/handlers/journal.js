const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');
const { getCurrentUser, requireAuth } = require('../middleware/auth');

const handleGetJournalEntries = async (queryParams, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }

        const client = await pool.connect();
        const { date = null, limit = 50 } = queryParams;
        
        let query = `
            SELECT 
                id, user_id, entry_date, entry_type, content, 
                mood, energy_level, sleep_quality, stress_level, 
                created_at, updated_at
            FROM journal_entries 
            WHERE user_id = $1
        `;
        
        const values = [user.id];
        
        if (date) {
            query += ` AND entry_date = $2`;
            values.push(date);
        }
        
        query += ` ORDER BY entry_date DESC, created_at DESC LIMIT $${values.length + 1}`;
        values.push(limit);
        
        const result = await client.query(query, values);
        client.release();
        
        return successResponse(result.rows);
        
    } catch (error) {
        console.error('Journal entries error:', error);
        const appError = handleDatabaseError(error, 'fetch journal entries');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleCreateJournalEntry = async (body, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }

        const client = await pool.connect();
        
        const { 
            entryDate, 
            entryType = 'reflection', 
            content = '', 
            mood = null, 
            energyLevel = null, 
            sleepQuality = null, 
            stressLevel = null 
        } = body;
        
        const query = `
            INSERT INTO journal_entries (
                user_id, entry_date, entry_type, content, 
                mood, energy_level, sleep_quality, stress_level,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        
        const values = [user.id, entryDate, entryType, content, mood, energyLevel, sleepQuality, stressLevel];
        const result = await client.query(query, values);
        client.release();
        
        return successResponse(result.rows[0], 201);
        
    } catch (error) {
        console.error('Create journal entry error:', error);
        const appError = handleDatabaseError(error, 'create journal entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleGetJournalEntry = async (pathParams, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }

        const client = await pool.connect();
        const { id } = pathParams;
        
        const query = `
            SELECT * FROM journal_entries 
            WHERE id = $1 AND user_id = $2
        `;
        
        const result = await client.query(query, [id, user.id]);
        client.release();
        
        if (result.rows.length === 0) {
            return errorResponse('Journal entry not found', 404);
        }
        
        return successResponse(result.rows[0]);
        
    } catch (error) {
        console.error('Get journal entry error:', error);
        const appError = handleDatabaseError(error, 'fetch journal entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

const handleUpdateJournalEntry = async (pathParams, body, event) => {
    try {
        const user = await getCurrentUser(event);
        if (!user) {
            return errorResponse('Authentication required', 401);
        }

        const client = await pool.connect();
        const { id } = pathParams;
        
        const { 
            entryType, 
            content, 
            mood, 
            energyLevel, 
            sleepQuality, 
            stressLevel 
        } = body;
        
        const query = `
            UPDATE journal_entries 
            SET entry_type = $1, content = $2, mood = $3, 
                energy_level = $4, sleep_quality = $5, stress_level = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7 AND user_id = $8
            RETURNING *
        `;
        
        const values = [entryType, content, mood, energyLevel, sleepQuality, stressLevel, id, user.id];
        const result = await client.query(query, values);
        client.release();
        
        if (result.rows.length === 0) {
            return errorResponse('Journal entry not found', 404);
        }
        
        return successResponse(result.rows[0]);
        
    } catch (error) {
        console.error('Update journal entry error:', error);
        const appError = handleDatabaseError(error, 'update journal entry');
        return errorResponse(appError.message, appError.statusCode);
    }
};

module.exports = {
    handleGetJournalEntries,
    handleCreateJournalEntry,
    handleGetJournalEntry,
    handleUpdateJournalEntry
};