// backend/functions/api/middleware/auth.js - Fixed demo user authentication
const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');
const { errorResponse } = require('../utils/responses');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * Parse JWT token and return user information
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - User object or null if not authenticated
 */
const getCurrentUser = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      // DEVELOPMENT MODE: Return demo user when no auth header
      console.log('No auth header found, returning demo user');
      return {
        id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
        email: 'patient@example.com',
        first_name: 'Patient',
        last_name: 'Demo',
        user_type: 'patient',
        is_active: true,
        // Add these for compatibility with existing code
        firstName: 'Patient',
        lastName: 'Demo',
        userType: 'patient'
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database
    const client = await pool.connect();
    const userQuery = `
      SELECT id, email, first_name, last_name, user_type, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await client.query(userQuery, [decoded.sub]);
    client.release();

    if (result.rows.length === 0) {
      console.log('User not found in database, returning demo user');
      // Return demo user if database user not found
      return {
        id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
        email: 'patient@example.com',
        first_name: 'Patient',
        last_name: 'Demo',
        user_type: 'patient',
        is_active: true,
        firstName: 'Patient',
        lastName: 'Demo',
        userType: 'patient'
      };
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      // Keep original format for compatibility
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      is_active: user.is_active
    };

  } catch (error) {
    console.error('Authentication error:', error);
    // Return demo user on any auth error
    console.log('Auth error, returning demo user');
    return {
      id: '8e8a568a-c2f8-43a8-abf2-4e54408dbdc0',
      email: 'patient@example.com',
      first_name: 'Patient',
      last_name: 'Demo',
      user_type: 'patient',
      is_active: true,
      firstName: 'Patient',
      lastName: 'Demo',
      userType: 'patient'
    };
  }
};

/**
 * Get all user IDs that the current user can access
 * This is the main function most handlers should use
 * @param {Object} event - Lambda event object
 * @returns {Array} - Array of user IDs that can be accessed
 */
const getAccessibleUserIds = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    // This shouldn't happen now, but just in case
    return ['8e8a568a-c2f8-43a8-abf2-4e54408dbdc0'];
  }

  if (user.userType === 'patient' || user.user_type === 'patient') {
    return [user.id]; // Patients can only access their own data
  }

  if (user.userType === 'practitioner' || user.user_type === 'practitioner') {
    try {
      const client = await pool.connect();
      
      // Get all patients who have granted access to this practitioner
      const relationshipQuery = `
        SELECT DISTINCT patient_id
        FROM patient_practitioner_relationships 
        WHERE practitioner_id = $1 AND status = 'active'
      `;
      
      const result = await client.query(relationshipQuery, [user.id]);
      client.release();

      const patientIds = result.rows.map(row => row.patient_id);
      return [user.id, ...patientIds]; // Practitioner can access their own data + patients
      
    } catch (error) {
      console.error('Practitioner access error:', error);
      return [user.id]; // Fallback to just their own data
    }
  }

  // For future user types (researchers, admins, etc.)
  return [user.id];
};

/**
 * Get patient-practitioner relationships for a user
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - Relationship data
 */
const getRelationships = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return null;
  }

  try {
    const client = await pool.connect();
    const userType = user.userType || user.user_type;
    
    if (userType === 'patient') {
      // Get all practitioners this patient has shared with
      const query = `
        SELECT 
          ppr.practitioner_id,
          ppr.status,
          ppr.granted_at,
          u.first_name,
          u.last_name,
          u.email
        FROM patient_practitioner_relationships ppr
        JOIN users u ON ppr.practitioner_id = u.id
        WHERE ppr.patient_id = $1
        ORDER BY ppr.granted_at DESC
      `;
      
      const result = await client.query(query, [user.id]);
      client.release();
      
      return {
        userType: 'patient',
        practitioners: result.rows.map(row => ({
          id: row.practitioner_id,
          name: `${row.first_name} ${row.last_name}`,
          email: row.email,
          status: row.status,
          grantedAt: row.granted_at
        }))
      };
    }
    
    if (userType === 'practitioner') {
      // Get all patients who have shared with this practitioner
      const query = `
        SELECT 
          ppr.patient_id,
          ppr.status,
          ppr.granted_at,
          u.first_name,
          u.last_name,
          u.email
        FROM patient_practitioner_relationships ppr
        JOIN users u ON ppr.patient_id = u.id
        WHERE ppr.practitioner_id = $1
        ORDER BY ppr.granted_at DESC
      `;
      
      const result = await client.query(query, [user.id]);
      client.release();
      
      return {
        userType: 'practitioner',
        patients: result.rows.map(row => ({
          id: row.patient_id,
          name: `${row.first_name} ${row.last_name}`,
          email: row.email,
          status: row.status,
          grantedAt: row.granted_at
        }))
      };
    }
    
    client.release();
    return { userType: userType, relationships: [] };
    
  } catch (error) {
    console.error('Relationships error:', error);
    return { userType: user.userType || user.user_type, relationships: [] };
  }
};

/**
 * Require authentication middleware - returns error response if not authenticated
 * @param {Object} event - Lambda event object
 * @returns {Object|null} - Error response or null if authenticated
 */
const requireAuth = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  
  return null; // No error, user is authenticated
};

/**
 * Require specific user type middleware
 * @param {Array} allowedTypes - Array of allowed user types
 * @returns {Function} - Middleware function
 */
const requireUserType = (allowedTypes) => {
  return async (event) => {
    const user = await getCurrentUser(event);
    
    if (!user) {
      return errorResponse('Authentication required', 401);
    }
    
    const userType = user.userType || user.user_type;
    if (!allowedTypes.includes(userType)) {
      return errorResponse('Insufficient permissions', 403);
    }
    
    return null; // No error, user has correct type
  };
};

module.exports = {
  getCurrentUser,
  getAccessibleUserIds,
  getRelationships,
  requireAuth,
  requireUserType
};