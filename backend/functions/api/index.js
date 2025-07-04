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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
};

exports.handler = async (event, context) => {
  try {
    const { httpMethod, path, pathParameters, queryStringParameters } = event;

    // Handle CORS preflight
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify('OK')
      };
    }

    const route = path || event.resource;
    const queryParams = queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    // Auth routes
    if (route === '/api/v1/auth/login' && httpMethod === 'POST') {
      return await handleLogin(body, event);
    }
    if (route === '/api/v1/auth/register' && httpMethod === 'POST') {
      return await handleRegister(body, event);
    }
    if (route === '/api/v1/auth/logout' && httpMethod === 'POST') {
      return await handleLogout(body, event);
    }
    if (route === '/api/v1/auth/verify' && httpMethod === 'GET') {
      return await handleVerify(queryParams, event);
    }

    // User routes
    if (route === '/api/v1/users' && httpMethod === 'GET') {
      return await handleGetUser(queryParams, event);
    }
    if (route === '/api/v1/users' && httpMethod === 'PUT') {
      return await handleUpdateUser(body, event);
    }
    if (route === '/api/v1/user/protocols' && httpMethod === 'GET') {
      return await handleGetUserProtocols(queryParams, event);
    }
    if (route === '/api/v1/user/preferences' && httpMethod === 'GET') {
      return await handleGetUserPreferences(queryParams, event);
    }
    if (route === '/api/v1/user/preferences' && httpMethod === 'PUT') {
      return await handleUpdateUserPreferences(body, event);
    }

    // Journal routes
    if (route === '/api/v1/journals' && httpMethod === 'GET') {
      return await handleGetJournalEntries(queryParams, event);
    }
    if (route === '/api/v1/journal/entries' && httpMethod === 'GET') {
      return await handleGetJournalEntries(queryParams, event);
    }
    if (route === '/api/v1/journals' && httpMethod === 'POST') {
      return await handleCreateJournalEntry(body, event);
    }
    if (route === '/api/v1/journal/entries' && httpMethod === 'POST') {
      return await handleCreateJournalEntry(body, event);
    }
    if (route.startsWith('/api/v1/journals/') && httpMethod === 'PUT') {
      return await handleUpdateJournalEntry(body, event);
    }
    if (route.startsWith('/api/v1/journals/') && httpMethod === 'DELETE') {
      return await handleDeleteJournalEntry(pathParameters, event);
    }

    // Protocol routes
    if (route === '/api/v1/protocols' && httpMethod === 'GET') {
      return await handleGetProtocols(queryParams, event);
    }

    // Timeline routes
    if (route === '/api/v1/timeline/entries' && httpMethod === 'GET') {
      return await handleGetTimelineEntries(queryParams, event);
    }
    if (route === '/api/v1/timeline/entries' && httpMethod === 'POST') {
      return await handleCreateTimelineEntry(body, event);
    }

    // Food routes
    if (route === '/api/v1/foods/search' && httpMethod === 'GET') {
      return await handleSearchFoods(queryParams, event);
    }
    if (route === '/api/v1/foods/by-protocol' && httpMethod === 'GET') {
      return await handleGetProtocolFoods(queryParams, event);
    }

    // Search routes
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

    // Correlation routes
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