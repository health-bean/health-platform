const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // You said keep this for now
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,X-Requested-With,X-Demo-Mode',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'false',
    'Content-Type': 'application/json',
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

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

// CORS handling function
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

module.exports = {
    corsHeaders,
    createResponse,
    successResponse,
    errorResponse,
    handleCors
};