// backend/functions/api/index.js (UPDATED)
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleCors } = require('./utils/responses');
// Import specific auth handlers instead of generic handleAuth
const { handleLogin, handleLogout, handleVerify, handleRefresh, handleRegister } = require('./handlers/auth');
const { handleGetUser, handleUpdateUser, handleGetUserProtocols, handleGetUserPreferences, handleUpdateUserPreferences } = require('./handlers/users');
const { handleGetJournalEntries, handleCreateJournalEntry, handleGetJournalEntry, handleUpdateJournalEntry } = require('./handlers/journal');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleSearchFoods, handleGetProtocolFoods } = require('./handlers/foods');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');
const { successResponse, errorResponse } = require('./utils/responses');

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
        
        let response;
        
        // Auth routes - specific endpoints
        if (path === '/api/v1/auth/login' && method === 'POST') {
            response = await handleLogin(body, event);
        }
        else if (path === '/api/v1/auth/logout' && method === 'POST') {
            response = await handleLogout(body, event);
        }
        else if (path === '/api/v1/auth/verify' && method === 'GET') {
            response = await handleVerify(queryParams, event);
        }
        else if (path === '/api/v1/auth/refresh' && method === 'POST') {
            response = await handleRefresh(body, event);
        }
        else if (path === '/api/v1/auth/register' && method === 'POST') {
            response = await handleRegister(body, event);
        }
        // Keep the generic auth route for backward compatibility
        else if (path === '/api/v1/auth' && method === 'POST') {
            response = await handleLogin(body, event); // Default to login
        }
        // User routes
        else if (path === '/api/v1/users' && method === 'GET') {
            response = await handleGetUser(event);
        }
        else if (path === '/api/v1/users' && method === 'POST') {
            response = await handleUpdateUser(body, event);
        }
        else if (path === '/api/v1/user/protocols' && method === 'GET') {
            response = await handleGetUserProtocols(event);
        }
        else if (path === '/api/v1/user/preferences' && method === 'GET') {
            response = await handleGetUserPreferences(event);
        }
        else if (path === '/api/v1/user/preferences' && method === 'POST') {
            response = await handleUpdateUserPreferences(body, event);
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
        // Journal routes
        else if (path === '/api/v1/journal/entries' && method === 'GET') {
            response = await handleGetJournalEntries(queryParams, event);
        }
        else if (path === '/api/v1/journal/entries' && method === 'POST') {
            response = await handleCreateJournalEntry(body, event);
        }
        else if (path.startsWith('/api/v1/journal/entries/') && method === 'GET') {
            const date = path.split('/').pop();
            response = await handleGetJournalEntry(date, event);
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