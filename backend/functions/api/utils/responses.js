// backend/functions/api/utils/responses.js
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',  // 🔧 FIXED: Changed from 'http://localhost:5173' to '*'
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'false'  // 🔧 FIXED: Must be 'false' when using '*'
};

const success = (data, statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(data)
});

const error = (message, statusCode = 500) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message })
});

const unauthorized = (message = 'Unauthorized') => ({
  statusCode: 401,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message })
});

const notFound = (message = 'Not Found') => ({
  statusCode: 404,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message })
});

const badRequest = (message = 'Bad Request') => ({
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message })
});

// Handle OPTIONS requests for preflight
const options = () => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: ''
});

// 🔧 FIX: Add missing exports that index.js expects
const handleCors = (event) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }
  // Return null for non-OPTIONS requests (let the route handler continue)
  return null;
};

// 🔧 FIX: Export corsHeaders (alias for CORS_HEADERS)
const corsHeaders = CORS_HEADERS;

// 🔧 FIX: Export errorResponse (alias for error function)
const errorResponse = error;

// 🔧 FIX: Add missing successResponse alias
const successResponse = success;

// 🔧 FIXED: Single module.exports (removed duplicate)
module.exports = {
  // Original exports (keep all existing functionality)
  success,
  error,
  unauthorized,
  notFound,
  badRequest,
  options,
  CORS_HEADERS,
  
  // 🔧 FIX: Add missing exports for handler compatibility
  handleCors,
  corsHeaders,
  errorResponse,
  successResponse
};