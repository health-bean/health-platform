/**
 * Input validation middleware for API security
 */

const { errorResponse } = require('../utils/responses');

/**
 * Sanitize string input to prevent injection attacks
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remove potentially dangerous characters
  return str
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .trim()
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Validate request body middleware
 */
const validateRequestBody = (requiredFields = [], optionalFields = []) => {
  return (body) => {
    if (!body) {
      return { isValid: false, error: 'Request body is required' };
    }

    // Sanitize the body
    const sanitizedBody = sanitizeObject(body);

    // Check required fields
    for (const field of requiredFields) {
      if (!sanitizedBody[field]) {
        return { isValid: false, error: `Field '${field}' is required` };
      }
    }

    // Validate specific field types
    if (sanitizedBody.email && !isValidEmail(sanitizedBody.email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    if (sanitizedBody.id && !isValidUUID(sanitizedBody.id)) {
      return { isValid: false, error: 'Invalid ID format' };
    }

    return { isValid: true, sanitizedBody };
  };
};

/**
 * Rate limiting helper (simple in-memory implementation for development)
 */
const rateLimitMap = new Map();

const checkRateLimit = (identifier, maxRequests = 100, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= maxRequests) {
    return { allowed: false, resetTime: windowStart + windowMs };
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return { allowed: true };
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  isValidEmail,
  isValidUUID,
  validateRequestBody,
  checkRateLimit
};
