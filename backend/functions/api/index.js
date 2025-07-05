const { handleLogin, handleRegister, handleLogout, handleVerify } = require('./handlers/auth');
const { handleGetJournalEntries, handleCreateJournalEntry, handleGetJournalEntry, handleUpdateJournalEntry } = require('./handlers/journal');
const { handleGetProtocols } = require('./handlers/protocols');
const { handleGetTimelineEntries, handleCreateTimelineEntry } = require('./handlers/timeline');
const { handleSearchFoods, handleGetProtocolFoods } = require('./handlers/foods');
const { handleGetCorrelationInsights } = require('./handlers/correlations');
const { handleSearchSymptoms } = require('./handlers/symptoms');
const { handleSearchSupplements } = require('./handlers/supplements');
const { handleSearchMedications } = require('./handlers/medications');
const { handleSearchDetoxTypes } = require('./handlers/detox');
const { handleGetUser, handleUpdateUser, handleGetUserProtocols, handleGetUserPreferences, handleUpdateUserPreferences } = require('./handlers/users');

// Import your auth middleware
const { getCurrentUser } = require('./middleware/auth');

// 🔧 FIX: Import CORS handling from responses.js (remove duplicate headers)
const { handleCors, corsHeaders, errorResponse } = require('./utils/responses');

exports.handler = async (event) => {
  try {
    // 🔧 FIX: Add CORS handling at the start
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    const { httpMethod, path, queryStringParameters: queryParams, body } = event;
    const route = path;

    console.log(`${httpMethod} ${route}`, { queryParams, body });

    // Parse request body for POST/PUT requests
    let parsedBody = {};
    if (body) {
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        console.error('Error parsing request body:', e);
        return errorResponse('Invalid JSON in request body', 400);
      }
    }

    // Authentication routes (PUBLIC)
    if (route === '/api/v1/auth/register' && httpMethod === 'POST') {
      return await handleRegister(parsedBody, event);
    }
    if (route === '/api/v1/auth/login' && httpMethod === 'POST') {
      return await handleLogin(parsedBody, event);
    }
    if (route === '/api/v1/auth/logout' && httpMethod === 'POST') {
      return await handleLogout(parsedBody, event);
    }
    if (route === '/api/v1/auth/verify' && httpMethod === 'GET') {
      return await handleVerify(queryParams, event);
    }

    // Protected routes - require authentication
    let currentUser;
    try {
      currentUser = await getCurrentUser(event);
    } catch (error) {
      return errorResponse('Authentication required', 401);
    }

    // User routes (PROTECTED)
    if (route === '/api/v1/users/me' && httpMethod === 'GET') {
      return await handleGetUser(queryParams, event);
    }
    if (route === '/api/v1/users/me' && httpMethod === 'PUT') {
      return await handleUpdateUser(parsedBody, event);
    }
    if (route === '/api/v1/users/me/protocols' && httpMethod === 'GET') {
      return await handleGetUserProtocols(queryParams, event);
    }
    if (route === '/api/v1/users/me/preferences' && httpMethod === 'GET') {
      return await handleGetUserPreferences(queryParams, event);
    }
    if (route === '/api/v1/users/me/preferences' && httpMethod === 'PUT') {
      return await handleUpdateUserPreferences(parsedBody, event);
    }

    // Journal routes (PROTECTED)
    if (route === '/api/v1/journal/entries' && httpMethod === 'GET') {
      return await handleGetJournalEntries(queryParams, event);
    }
    if (route === '/api/v1/journal/entries' && httpMethod === 'POST') {
      return await handleCreateJournalEntry(parsedBody, event);
    }
    if (route.startsWith('/api/v1/journal/entries/') && httpMethod === 'GET') {
      const entryId = route.split('/').pop();
      return await handleGetJournalEntry({ ...queryParams, entryId }, event);
    }
    if (route.startsWith('/api/v1/journal/entries/') && httpMethod === 'PUT') {
      const entryId = route.split('/').pop();
      return await handleUpdateJournalEntry({ ...parsedBody, entryId }, event);
    }

    // Timeline routes (PROTECTED)
    if (route === '/api/v1/timeline/entries' && httpMethod === 'GET') {
      return await handleGetTimelineEntries(queryParams, event);
    }
    if (route === '/api/v1/timeline/entries' && httpMethod === 'POST') {
      return await handleCreateTimelineEntry(parsedBody, event);
    }

    // Protocol routes (PROTECTED)
    if (route === '/api/v1/protocols' && httpMethod === 'GET') {
      return await handleGetProtocols(queryParams, event);
    }

    // Food routes (PROTECTED)
    if (route === '/api/v1/foods/search' && httpMethod === 'GET') {
      return await handleSearchFoods(queryParams, event);
    }
    if (route === '/api/v1/foods/by-protocol' && httpMethod === 'GET') {
      return await handleGetProtocolFoods(queryParams, event);
    }

    // Search routes (PUBLIC)
    if (route === '/api/v1/symptoms/search' && httpMethod === 'GET') {
      return await handleSearchSymptoms(queryParams, event);
    }
    if (route === '/api/v1/supplements/search' && httpMethod === 'GET') {
      return await handleSearchSupplements(queryParams, event);
    }
    if (route === '/api/v1/medications/search' && httpMethod === 'GET') {
      return await handleSearchMedications(queryParams, event);
    }
    if (route === '/api/v1/detox/search' && httpMethod === 'GET') {
      return await handleSearchDetoxTypes(queryParams, event);
    }
    if (route === '/api/v1/detox-types' && httpMethod === 'GET') {
      return await handleSearchDetoxTypes(queryParams, event);
    }

    // Correlation routes (PUBLIC with userId param)
    if (route === '/api/v1/correlations/insights' && httpMethod === 'GET') {
      return await handleGetCorrelationInsights(queryParams, event);
    }

    // Default response for unknown routes
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Route not found',
        route: route,
        method: httpMethod,
        message: `${httpMethod} ${route} is not implemented`
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};