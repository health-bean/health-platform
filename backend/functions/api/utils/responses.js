// backend/functions/api/utils/responses.js
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
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

module.exports = {
  success,
  error,
  unauthorized,
  notFound,
  badRequest,
  options
};