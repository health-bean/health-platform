const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');
const { errorResponse } = require('../utils/responses');

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('WARNING: JWT_SECRET not set! Using generated secret for development.');
  console.warn('This will invalidate tokens on restart. Set JWT_SECRET environment variable.');
  return require('crypto').randomBytes(32).toString('base64');
})();

// Demo user mapping for clean auth system
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
    id: '7d7b457b-b1a7-42b7-a177-6550dcb9cae1',
    email: 'mike.fodmap@test.com',
    first_name: 'Mike',
    last_name: 'Chen',
    user_type: 'demo',
    is_active: true
  },
  'lisa-histamine': {
    id: '6c6a346c-a0a6-41a6-a066-5440cba8bde2',
    email: 'lisa.histamine@test.com',
    first_name: 'Lisa',
    last_name: 'Rodriguez',
    user_type: 'demo',
    is_active: true
  },
  'john-paleo': {
    id: '5b5a235b-9f95-40a5-9f55-4330ba97ace3',
    email: 'john.paleo@test.com',
    first_name: 'John',
    last_name: 'Williams',
    user_type: 'demo',
    is_active: true
  },
  'emma-multi': {
    id: '4a4a124a-8e84-3f94-8e44-3220a986bcd4',
    email: 'emma.multi@test.com',
    first_name: 'Emma',
    last_name: 'Davis',
    user_type: 'demo',
    is_active: true
  }
};

const getCurrentUser = async (event) => {
  try {
    console.log('AUTH MIDDLEWARE: Event parameter:', typeof event, event ? 'defined' : 'undefined');
    
    if (!event) {
      console.log('AUTH MIDDLEWARE: Event is null or undefined');
      return null;
    }
    
    console.log('AUTH MIDDLEWARE: Event structure check:', {
      hasHeaders: !!event.headers,
      headerKeys: event.headers ? Object.keys(event.headers) : 'no headers'
    });
    
    if (!event.headers) {
      console.log('AUTH MIDDLEWARE: No headers in event');
      return null;
    }
    
    // Check for demo mode first (clean auth system)
    const demoMode = event.headers['X-Demo-Mode'] || event.headers['x-demo-mode'];
    const demoUserId = event.headers['X-Demo-User-Id'] || event.headers['x-demo-user-id'];
    const demoSessionId = event.headers['X-Demo-Session-Id'] || event.headers['x-demo-session-id'];
    
    if (demoMode === 'true' && demoUserId) {
      console.log('AUTH MIDDLEWARE: Demo mode detected', { 
        demoUserId, 
        sessionId: demoSessionId ? 'present' : 'missing' 
      });
      
      const demoUser = DEMO_USERS[demoUserId];
      if (demoUser) {
        console.log('AUTH MIDDLEWARE: Demo user found:', demoUser.email);
        return {
          ...demoUser,
          sessionId: demoSessionId,
          isDemo: true
        };
      } else {
        console.log('AUTH MIDDLEWARE: Demo user not found:', demoUserId);
        return null;
      }
    }
    
    // Fallback to JWT auth for non-demo users
    const authHeader = event.headers.Authorization || event.headers.authorization;
    console.log('AUTH MIDDLEWARE: Authorization header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('AUTH MIDDLEWARE: Token extracted:', token ? 'yes' : 'no');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('AUTH MIDDLEWARE: Token decoded successfully, user ID:', decoded.sub);

    const client = await pool.connect();
    const userQuery = `
      SELECT id, email, first_name, last_name, user_type, is_active
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    
    const result = await client.query(userQuery, [decoded.sub]);
    client.release();

    if (result.rows.length === 0) {
      console.log('User not found in database, creating unique demo user for:', decoded.email || 'unknown');
      
      const userEmail = decoded.email || decoded.username;
      if (!userEmail) {
        console.log('No email found in token - cannot create user');
        return null;
      }
      
      const demoUserId = generateDemoUserId(userEmail);
      
      return {
        id: demoUserId,
        email: userEmail,
        first_name: getDemoFirstName(userEmail),
        last_name: getDemoLastName(userEmail),
        user_type: 'patient',
        is_active: true,
        firstName: getDemoFirstName(userEmail),
        lastName: getDemoLastName(userEmail),
        userType: 'patient'
      };
    }

    const user = result.rows[0];
    console.log('AUTH MIDDLEWARE: User found in database:', user.email);
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      is_active: user.is_active
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

const generateDemoUserId = (email) => {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
};

const getDemoFirstName = (email) => {
  if (email.includes('sarah')) return 'Sarah';
  if (email.includes('john')) return 'John';
  if (email.includes('maria')) return 'Maria';
  return 'Demo';
};

const getDemoLastName = (email) => {
  if (email.includes('sarah')) return 'Chen';
  if (email.includes('john')) return 'Smith';
  if (email.includes('maria')) return 'Rodriguez';
  return 'User';
};

const getAccessibleUserIds = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    console.log('No authenticated user - access denied');
    return [];
  }

  if (user.userType === 'patient' || user.user_type === 'patient') {
    return [user.id];
  }

  if (user.userType === 'practitioner' || user.user_type === 'practitioner') {
    try {
      const client = await pool.connect();
      
      const relationshipQuery = `
        SELECT DISTINCT patient_id
        FROM patient_practitioner_relationships 
        WHERE practitioner_id = $1 AND status = 'active'
      `;
      
      const result = await client.query(relationshipQuery, [user.id]);
      client.release();

      const patientIds = result.rows.map(row => row.patient_id);
      return [user.id, ...patientIds];
      
    } catch (error) {
      console.error('Practitioner access error:', error);
      return [user.id];
    }
  }

  return [user.id];
};

const getRelationships = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return null;
  }

  try {
    const client = await pool.connect();
    const userType = user.userType || user.user_type;
    
    if (userType === 'patient') {
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

const requireAuth = async (event) => {
  const user = await getCurrentUser(event);
  
  if (!user) {
    return errorResponse('Authentication required', 401);
  }
  
  return null;
};

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
    
    return null;
  };
};

module.exports = {
  getCurrentUser,
  getAccessibleUserIds,
  getRelationships,
  requireAuth,
  requireUserType
};
