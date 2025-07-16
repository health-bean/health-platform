// backend/functions/api/index.js (CLEAN AUTH SYSTEM)
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleCors } = require('./utils/responses');
const { handleGetUser, handleUpdateUser, handleGetUserProtocols, handleGetUserPreferences, handleUpdateUserPreferences, handleGetCurrentProtocol, handleGetProtocolHistory, handleChangeProtocol } = require('./handlers/users');
const { handleGetJournalEntries, handleCreateJournalEntry, handleGetJournalEntry, handleUpdateJournalEntry } = require('./handlers/journal');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleSearchFoods, handleGetProtocolFoods } = require('./handlers/foods');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');
const { handleSearchExposures } = require('./handlers/exposures');
const { handleSeedDemoData } = require('./handlers/admin');
const { successResponse, errorResponse } = require('./utils/responses');
const { getCurrentUser } = require('./middleware/auth');

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;
    
    try {
        const path = event.path;
        const method = event.httpMethod;
        const body = event.body ? JSON.parse(event.body) : {};
        const pathParams = event.pathParameters || {};
        const queryParams = event.queryStringParameters || {};
        
        console.log(`${method} ${path}`);
        console.log('🔍 INDEX: Processing request:', { method, path, hasQueryParams: !!queryParams });
        
        // Get current user for authentication (sets event.user)
        const currentUser = await getCurrentUser(event);
        if (currentUser) {
            event.user = currentUser;
            console.log('🔍 INDEX: User authenticated:', currentUser.email || currentUser.id);
        } else {
            console.log('🔍 INDEX: No authenticated user found');
        }
        
        let response;
        
        // User routes
        if (path === '/api/v1/users' && method === 'GET') {
            response = await handleGetUser(queryParams, event);
        }
        else if (path === '/api/v1/users' && method === 'POST') {
            response = await handleUpdateUser(body, event);
        }
        else if (path === '/api/v1/user/protocols' && method === 'GET') {
            response = await handleGetUserProtocols(queryParams, event);
        }
        else if (path === '/api/v1/user/preferences' && method === 'GET') {
            console.log('🔍 INDEX: Matched user preferences GET route');
            response = await handleGetUserPreferences(queryParams, event);
            console.log('🔍 INDEX: handleGetUserPreferences returned:', response ? 'response' : 'null');
        }
        else if (path === '/api/v1/user/preferences' && method === 'POST') {
            response = await handleUpdateUserPreferences(body, event);
        }
        // User protocol routes
        else if (path === '/api/v1/users/current-protocol' && method === 'GET') {
            response = await handleGetCurrentProtocol(queryParams, event);
        }
        else if (path === '/api/v1/users/protocol-history' && method === 'GET') {
            response = await handleGetProtocolHistory(queryParams, event);
        }
        else if (path === '/api/v1/users/change-protocol' && method === 'POST') {
            response = await handleChangeProtocol(body, event);
        }
        // Insights routes
        else if (path === '/api/v1/correlations/insights' && method === 'GET') {
            response = await handleGetCorrelationInsights(queryParams, event);
        }
        // Protocol routes
        else if (path === '/api/v1/protocols' && method === 'GET') {
            response = await handleGetProtocols(queryParams, event);
        }
        // Food routes
        else if (path === '/api/v1/foods/search' && method === 'GET') {
            response = await handleSearchFoods(queryParams, event);
        }
        else if (path === '/api/v1/foods/by-protocol' && method === 'GET') {
            console.log("Protocol foods route hit!");
            response = await handleGetProtocolFoods(queryParams, event);
        }
        // Search routes
        else if (path === '/api/v1/symptoms/search' && method === 'GET') {
            response = await handleSearchSymptoms(queryParams, event);
        }
        else if (path === '/api/v1/supplements/search' && method === 'GET') {
            response = await handleSearchSupplements(queryParams, event);
        }
        else if (path === '/api/v1/medications/search' && method === 'GET') {
            response = await handleSearchMedications(queryParams, event);
        }
        else if (path === '/api/v1/detox-types/search' && method === 'GET') {
            response = await handleSearchDetoxTypes(queryParams, event);
        }
        else if (path === '/api/v1/exposures/search' && method === 'GET') {
            response = await handleSearchExposures(queryParams, event);
        }
        // Admin routes (development only)
        else if (path === '/api/v1/admin/seed-demo-data' && method === 'POST') {
            response = await handleSeedDemoData(queryParams, event);
        }
        // Journal routes
        else if (path === '/api/v1/journal/entries' && method === 'GET') {
            response = await handleGetJournalEntries(queryParams, event);
        }
        else if (path === '/api/v1/journal/entries' && method === 'POST') {
            response = await handleCreateJournalEntry(body, event);
        }
        else if (path.startsWith('/api/v1/journal/entries/') && method === 'GET') {
            console.log('🔍 INDEX: Matched journal entries GET route');
            const date = path.split('/').pop();
            console.log('🔍 INDEX: Extracted date:', date);
            console.log('🔍 INDEX: Event user:', event.user ? 'present' : 'missing');
            response = await handleGetJournalEntry(date, event);
            console.log('🔍 INDEX: handleGetJournalEntry returned:', response ? 'response' : 'null');
        }
        else if (path.startsWith('/api/v1/journal/entries/') && method === 'PUT') {
            const date = path.split('/').pop();
            response = await handleUpdateJournalEntry(date, body, event);
        }
        // Timeline routes
        else if (path === '/api/v1/timeline/entries' && method === 'GET') {
            response = await handleGetTimelineEntries(queryParams, event);
        }
        else if (path === '/api/v1/timeline/entries' && method === 'POST') {
            response = await handleCreateTimelineEntry(body, event);
        }
        else {
            response = handleNotFound(path, method);
        }
        
        return response;
        
    } catch (error) {
        console.error('Error:', error);
        return errorResponse('Internal server error: ' + error.message, 500);
    }
};

const handleNotFound = (path, method) => {
    return errorResponse('Endpoint not found', 404, {
        path: path,
        method: method,
        availableEndpoints: [
            // Auth endpoints
            'POST /api/v1/auth/login',
            'POST /api/v1/auth/logout', 
            'GET /api/v1/auth/verify',
            'POST /api/v1/auth/refresh',
            'POST /api/v1/auth/register',
            'POST /api/v1/auth', // Legacy
            // User endpoints
            'GET /api/v1/users',
            'POST /api/v1/users',
            'GET /api/v1/user/protocols',
            'GET /api/v1/user/preferences',
            'POST /api/v1/user/preferences',
            // Other endpoints
            'GET /api/v1/correlations/insights',
            'GET /api/v1/protocols',
            'GET /api/v1/foods/search',
            'GET /api/v1/foods/by-protocol',
            'GET /api/v1/symptoms/search',
            'GET /api/v1/supplements/search',
            'GET /api/v1/medications/search',
            'GET /api/v1/detox-types/search',
            'GET /api/v1/journal/entries',
            'POST /api/v1/journal/entries',
            'GET /api/v1/journal/entries/:date',
            'PUT /api/v1/journal/entries/:date',
            'GET /api/v1/timeline/entries',
            'POST /api/v1/timeline/entries'
        ]
    });
};