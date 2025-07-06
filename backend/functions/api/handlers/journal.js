// Fixed journal.js - Using proper CORS responses
const { getCurrentUser } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/responses');  // 🔧 ADDED: Import CORS responses

const handleGetJournalEntries = async (queryParams, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        if (!currentUser) {
            return errorResponse('Unauthorized', 401);  // 🔧 FIXED: Use errorResponse with CORS
        }
        return successResponse({ entries: [], total: 0 });  // 🔧 FIXED: Use successResponse with CORS
    } catch (error) {
        return errorResponse('Internal server error', 500);  // 🔧 FIXED: Use errorResponse with CORS
    }
};

const handleCreateJournalEntry = async (body, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        if (!currentUser) {
            return errorResponse('Unauthorized', 401);  // 🔧 FIXED: Use errorResponse with CORS
        }
        return successResponse({ message: 'Journal entry created' });  // 🔧 FIXED: Use successResponse with CORS
    } catch (error) {
        return errorResponse('Internal server error', 500);  // 🔧 FIXED: Use errorResponse with CORS
    }
};

const handleGetJournalEntry = async (queryParams, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        if (!currentUser) {
            return errorResponse('Unauthorized', 401);  // 🔧 FIXED: Use errorResponse with CORS
        }
        return successResponse({ entry: {} });  // 🔧 FIXED: Use successResponse with CORS
    } catch (error) {
        return errorResponse('Internal server error', 500);  // 🔧 FIXED: Use errorResponse with CORS
    }
};

const handleUpdateJournalEntry = async (body, event, user = null) => {
    try {
        const currentUser = user || await getCurrentUser(event);
        if (!currentUser) {
            return errorResponse('Unauthorized', 401);  // 🔧 FIXED: Use errorResponse with CORS
        }
        return successResponse({ message: 'Journal entry updated' });  // 🔧 FIXED: Use successResponse with CORS
    } catch (error) {
        return errorResponse('Internal server error', 500);  // 🔧 FIXED: Use errorResponse with CORS
    }
};

module.exports = {
    handleGetJournalEntries,
    handleCreateJournalEntry,
    handleGetJournalEntry,
    handleUpdateJournalEntry
};