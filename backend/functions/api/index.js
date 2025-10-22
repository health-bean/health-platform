// backend/functions/api/index.js (CLEAN AUTH SYSTEM)
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleCors } = require('./utils/responses');
const { handleGetUser, handleUpdateUser, handleGetUserDietaryProtocols, handleGetUserPreferences, handleUpdateUserPreferences, handleGetCurrentProtocol, handleGetProtocolHistory, handleChangeProtocol } = require('./handlers/users');
const { handleGetJournalEntries, handleCreateJournalEntry, handleGetJournalEntry, handleUpdateJournalEntry } = require('./handlers/journal');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleSearchFoods, handleGetCacheStats } = require('./handlers/foods');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');
const { handleSearchExposures } = require('./handlers/exposures');
const { handleSeedDemoData, handleDatabaseCheck } = require('./handlers/admin');
const { successResponse, errorResponse } = require('./utils/responses');
const { getCurrentUser } = require('./middleware/auth');

// Import demo users for direct access in index.js
const DEMO_USERS = {
  'sarah-aip': {
    id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
    email: 'sarah.aip@test.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    user_type: 'demo',
    is_active: true
  },
  'mike-fodmap': {
    id: 'bb5c54ee-0304-4e7b-8ad4-b464f5b1e37f',
    email: 'mike.fodmap@test.com',
    first_name: 'Mike',
    last_name: 'Chen',
    user_type: 'demo',
    is_active: true
  },
  'lisa-histamine': {
    id: '74ae8620-d183-46ea-a17d-9da8f23f39be',
    email: 'lisa.histamine@test.com',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    user_type: 'demo',
    is_active: true
  },
  'john-paleo': {
    id: '3e209467-b142-4101-a399-adb3f3232dba',
    email: 'john.paleo@test.com',
    first_name: 'John',
    last_name: 'Williams',
    user_type: 'demo',
    is_active: true
  },
  'emma-multi': {
    id: '3923a221-97f6-4425-b863-e9b3b450ebfb',
    email: 'emma.multi@test.com',
    first_name: 'Emma',
    last_name: 'Davis',
    user_type: 'demo',
    is_active: true
  }
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Handle CORS preflight requests first
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
        
        let response;
        
        // Admin migration endpoint (no auth required)
        if (path === '/api/v1/admin/migrate-data' && method === 'POST') {
            const { Pool } = require('pg');
            
            // Test PostgreSQL connection first
            const postgresPool = new Pool({
                host: 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
                port: 5432,
                database: 'health_platform_dev',
                user: 'healthadmin',
                password: 'MH67HxZFAAmVWzc6zldv0ZL6'
            });

            try {
                const pgClient = await postgresPool.connect();
                const result = await pgClient.query('SELECT version()');
                pgClient.release();
                await postgresPool.end();
                
                return successResponse({ 
                    message: 'PostgreSQL connection successful', 
                    version: result.rows[0].version,
                    note: 'Aurora connection skipped due to authentication issues'
                });
            } catch (error) {
                console.error('PostgreSQL connection failed:', error);
                return errorResponse(`PostgreSQL connection failed: ${error.message}`, 500);
            }
        }
        
        // Only authenticate for non-OPTIONS requests and non-admin endpoints
        if (method !== 'OPTIONS') {
            // Get current user for authentication (sets event.user)
            const currentUser = await getCurrentUser(event);
            if (currentUser) {
                event.user = currentUser;
                console.log('🔍 INDEX: User authenticated:', currentUser.email || currentUser.id);
            } else {
                console.log('🔍 INDEX: No authenticated user found');
            }
        }
        
        // User routes
        if (path === '/api/v1/users' && method === 'GET') {
            response = await handleGetUser(queryParams, event);
        }
        else if (path === '/api/v1/users' && method === 'POST') {
            response = await handleUpdateUser(body, event);
        }
        else if (path === '/api/v1/user/protocols' && method === 'GET') {
            response = await handleGetUserDietaryProtocols(queryParams, event);
        }
        else if (path === '/api/v1/user/preferences' && method === 'GET') {
            console.log('🔍 INDEX: Matched user preferences GET route');
            
            // If no user is authenticated but demo_user is in query params, try to authenticate as demo user
            if (!event.user && queryParams.demo_user) {
                console.log('🔍 INDEX: No authenticated user but demo_user param found:', queryParams.demo_user);
                const demoUser = DEMO_USERS[queryParams.demo_user];
                if (demoUser) {
                    console.log('🔍 INDEX: Setting event.user to demo user:', demoUser.email);
                    event.user = {
                        ...demoUser,
                        firstName: demoUser.first_name,
                        lastName: demoUser.last_name,
                        userType: demoUser.user_type,
                        isDemo: true
                    };
                }
            }
            
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
        else if (path === '/api/v1/foods/test' && method === 'GET') {
            // Test endpoint to debug database issues
            try {
                const { pool } = require('./database/connection');
                const client = await pool.connect();
                
                // Test basic query - use mat_food_search instead of food_search_view
                const result = await client.query('SELECT COUNT(*) as count FROM mat_food_search LIMIT 1');
                client.release();
                
                response = successResponse({
                    success: true,
                    message: 'Database connection successful',
                    count: result.rows[0].count,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Database test error:', error);
                response = errorResponse(`Database test failed: ${error.message}`, 500);
            }
        }

        else if (path === '/api/v1/foods/cache-stats' && method === 'GET') {
            response = await handleGetCacheStats(queryParams, event);
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
        else if (path === '/api/v1/admin/test-db' && method === 'GET') {
            response = await handleDatabaseCheck(event);
        }
        else if (path === '/api/v1/admin/populate-foods' && method === 'POST') {
            const { populateFoods } = require('./populate-foods');
            try {
                await populateFoods();
                response = successResponse({ message: 'Foods populated successfully' });
            } catch (error) {
                console.error('Population error:', error);
                response = errorResponse('Failed to populate foods', 500);
            }
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
            
            // If no user is authenticated but demo_user is in query params, try to authenticate as demo user
            if (!event.user && queryParams.demo_user) {
                console.log('🔍 INDEX: No authenticated user but demo_user param found:', queryParams.demo_user);
                const demoUser = DEMO_USERS[queryParams.demo_user];
                if (demoUser) {
                    console.log('🔍 INDEX: Setting event.user to demo user:', demoUser.email);
                    event.user = {
                        ...demoUser,
                        firstName: demoUser.first_name,
                        lastName: demoUser.last_name,
                        userType: demoUser.user_type,
                        isDemo: true
                    };
                }
            }
            
            response = await handleGetJournalEntry(date, event);
            console.log('🔍 INDEX: handleGetJournalEntry returned:', response ? 'response' : 'null');
        }
        else if (path.startsWith('/api/v1/journal/entries/') && method === 'PUT') {
            const date = path.split('/').pop();
            response = await handleUpdateJournalEntry(date, body, event);
        }
        // Timeline routes
        else if (path === '/api/v1/timeline/entries' && method === 'GET') {
            // If no user is authenticated but demo_user is in query params, try to authenticate as demo user
            if (!event.user && queryParams.demo_user) {
                console.log('🔍 INDEX: No authenticated user but demo_user param found:', queryParams.demo_user);
                const demoUser = DEMO_USERS[queryParams.demo_user];
                if (demoUser) {
                    console.log('🔍 INDEX: Setting event.user to demo user:', demoUser.email);
                    event.user = {
                        ...demoUser,
                        firstName: demoUser.first_name,
                        lastName: demoUser.last_name,
                        userType: demoUser.user_type,
                        isDemo: true
                    };
                }
            }
            
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
            // Public endpoints (no auth required)
            'GET /api/v1/protocols',
            'GET /api/v1/foods/search',
            'GET /api/v1/symptoms/search',
            'GET /api/v1/supplements/search',
            'GET /api/v1/medications/search',
            'GET /api/v1/detox-types/search',
            'GET /api/v1/exposures/search',
            // Auth-protected endpoints
            'GET /api/v1/users',
            'GET /api/v1/user/preferences',
            'GET /api/v1/user/protocols',
            'GET /api/v1/users/current-protocol',
            'GET /api/v1/users/protocol-history',
            'GET /api/v1/correlations/insights',
            'GET /api/v1/timeline/entries',
            'POST /api/v1/timeline/entries'
        ]
    });
};