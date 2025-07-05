// utils/responses.js - Fixed CORS headers + combined functionality
const corsHeaders = {
    // 🔧 FIX: Changed from '*' to specific origin
    'Access-Control-Allow-Origin': 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    // 🔧 FIX: Changed from 'false' to 'true' for auth
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

// 🔧 ADD: Handle OPTIONS requests (from your middleware/cors.js)
const handleCors = (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }
    return null;
};

// Your existing functions (keeping the same)
const createResponse = (statusCode, data, headers = {}) => ({
    statusCode,
    headers: { ...corsHeaders, ...headers },
    body: JSON.stringify(data)
});

const successResponse = (data, statusCode = 200) => 
    createResponse(statusCode, data);

const errorResponse = (message, statusCode = 500, details = null) => 
    createResponse(statusCode, {
        error: message,
        ...(details && { details })
    });

module.exports = {
    corsHeaders,
    handleCors,    // 🔧 ADD: Export the handleCors function
    createResponse,
    successResponse,
    errorResponse
};