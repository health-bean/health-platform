const jwt = require('jsonwebtoken');
const { pool } = require('../database/connection');
const { errorResponse } = require('../utils/responses');

// Cognito configuration
const COGNITO_USER_POOL_ID = 'us-east-1_vr1pPiP6N';
const COGNITO_CLIENT_ID = '5luhu590qnjdgi7579k1mqoct9';
const COGNITO_REGION = 'us-east-1';
const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

// Demo user mapping for testing and demos
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

// Function to verify Cognito JWT tokens
const verifyCognitoToken = async (token) => {
  try {
    console.log('AUTH MIDDLEWARE: Verifying Cognito token');
    
    // Decode token without verification first to get header
    const decodedHeader = jwt.decode(token, { complete: true });
    
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      console.log('AUTH MIDDLEWARE: Invalid token structure');
      return null;
    }

    // For now, we'll do basic JWT verification
    // In production, you should fetch and verify against Cognito's public keys
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      console.log('AUTH MIDDLEWARE: Failed to decode Cognito token');
      return null;
    }

    console.log('AUTH MIDDLEWARE: Token decoded, checking issuer and audience');
    console.log('AUTH MIDDLEWARE: Token issuer:', decoded.iss);
    console.log('AUTH MIDDLEWARE: Expected issuer:', COGNITO_ISSUER);
    console.log('AUTH MIDDLEWARE: Token audience/client:', decoded.aud || decoded.client_id);
    console.log('AUTH MIDDLEWARE: Expected client ID:', COGNITO_CLIENT_ID);

    // Verify token issuer
    if (decoded.iss !== COGNITO_ISSUER) {
      console.log('AUTH MIDDLEWARE: Invalid token issuer:', decoded.iss);
      return null;
    }

    // Verify token audience (client ID)
    if (decoded.aud !== COGNITO_CLIENT_ID && decoded.client_id !== COGNITO_CLIENT_ID) {
      console.log('AUTH MIDDLEWARE: Invalid token audience');
      return null;
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('AUTH MIDDLEWARE: Token expired');
      return null;
    }

    console.log('AUTH MIDDLEWARE: Cognito token verified successfully for user:', decoded.sub);
    return decoded;

  } catch (error) {
    console.error('AUTH MIDDLEWARE: Cognito token verification error:', error);
    return null;
  }
};

// Function to get or create user from Cognito token
const getOrCreateUserFromCognito = async (cognitoUser) => {
  let client;
  try {
    client = await pool.connect();
    
    // First, try to find user by Cognito sub
    let userQuery = `
      SELECT id, email, first_name, last_name, user_type, is_active, cognito_sub
      FROM users 
      WHERE cognito_sub = $1 AND is_active = true
    `;
    
    let result = await client.query(userQuery, [cognitoUser.sub]);
    
    if (result.rows.length > 0) {
      console.log('AUTH MIDDLEWARE: Found existing user by Cognito sub');
      return result.rows[0];
    }
    
    // If not found by cognito_sub, try to find by email
    if (cognitoUser.email) {
      userQuery = `
        SELECT id, email, first_name, last_name, user_type, is_active, cognito_sub
        FROM users 
        WHERE email = $1 AND is_active = true
      `;
      
      result = await client.query(userQuery, [cognitoUser.email]);
      
      if (result.rows.length > 0) {
        // Update existing user with Cognito sub
        const updateQuery = `
          UPDATE users 
          SET cognito_sub = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING id, email, first_name, last_name, user_type, is_active, cognito_sub
        `;
        
        const updateResult = await client.query(updateQuery, [cognitoUser.sub, result.rows[0].id]);
        console.log('AUTH MIDDLEWARE: Updated existing user with Cognito sub');
        return updateResult.rows[0];
      }
    }
    
    // Create new user from Cognito data
    const insertQuery = `
      INSERT INTO users (
        id, 
        email, 
        first_name, 
        last_name, 
        user_type, 
        is_active, 
        cognito_sub,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'patient',
        true,
        $4,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING id, email, first_name, last_name, user_type, is_active, cognito_sub
    `;
    
    const firstName = cognitoUser.given_name || cognitoUser.name?.split(' ')[0] || 'User';
    const lastName = cognitoUser.family_name || cognitoUser.name?.split(' ').slice(1).join(' ') || '';
    
    const insertResult = await client.query(insertQuery, [
      cognitoUser.email,
      firstName,
      lastName,
      cognitoUser.sub
    ]);
    
    console.log('AUTH MIDDLEWARE: Created new user from Cognito data');
    return insertResult.rows[0];
    
  } catch (error) {
    console.error('Error getting/creating user from Cognito:', error);
    return null;
  } finally {
    if (client) {
      client.release();
    }
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
    
    // Priority 1: Check for Cognito JWT token (standard authentication)
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('AUTH MIDDLEWARE: Found Authorization header, attempting Cognito verification');
      const token = authHeader.replace('Bearer ', '');
      
      const cognitoUser = await verifyCognitoToken(token);
      if (cognitoUser) {
        console.log('AUTH MIDDLEWARE: Cognito user verified:', cognitoUser.email || cognitoUser.sub);
        
        // Get or create user in database
        const dbUser = await getOrCreateUserFromCognito(cognitoUser);
        if (dbUser) {
          return {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            userType: dbUser.user_type,
            first_name: dbUser.first_name,
            last_name: dbUser.last_name,
            user_type: dbUser.user_type,
            is_active: dbUser.is_active,
            cognitoSub: cognitoUser.sub,
            authMode: 'standard'
          };
        }
      }
      
      console.log('AUTH MIDDLEWARE: Cognito verification failed');
      // Continue to check for demo user
    }
    
    // Priority 2: Check for demo mode (handle all case variations)
    const demoMode = findHeaderCaseInsensitive(event.headers, 'x-demo-mode');
    const demoUserId = findHeaderCaseInsensitive(event.headers, 'x-demo-user-id');
    const demoSessionId = findHeaderCaseInsensitive(event.headers, 'x-demo-session-id');
    
    console.log('AUTH MIDDLEWARE: Demo headers found:', { demoMode, demoUserId, demoSessionId });
    
    if (demoMode === 'true' && demoUserId) {
      console.log('AUTH MIDDLEWARE: Demo mode detected', { 
        demoUserId, 
        sessionId: demoSessionId ? 'present' : 'missing' 
      });
      
      // Check if demoUserId is a UUID (direct user ID)
      if (demoUserId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('AUTH MIDDLEWARE: Demo user ID is a UUID, using directly:', demoUserId);
        // Create a minimal user object with the ID
        return {
          id: demoUserId,
          email: `user-${demoUserId.substring(0, 8)}@example.com`,
          firstName: 'Demo',
          lastName: 'User',
          userType: 'demo',
          first_name: 'Demo',
          last_name: 'User',
          user_type: 'demo',
          is_active: true,
          sessionId: demoSessionId,
          authMode: 'demo',
          isDemo: true
        };
      }
      
      // Otherwise, look up the demo user by ID
      const demoUser = DEMO_USERS[demoUserId];
      if (demoUser) {
        console.log('AUTH MIDDLEWARE: Demo user found:', demoUser.email);
        return {
          ...demoUser,
          firstName: demoUser.first_name,
          lastName: demoUser.last_name,
          userType: demoUser.user_type,
          sessionId: demoSessionId,
          authMode: 'demo',
          isDemo: true
        };
      } else {
        console.log('AUTH MIDDLEWARE: Demo user not found:', demoUserId);
        // Check for demo_user in query params
      }
    }
    
    // Priority 3: Check for demo_user in query parameters
    const queryParams = event.queryStringParameters || {};
    if (queryParams.demo_user) {
      console.log('AUTH MIDDLEWARE: Found demo_user in query params:', queryParams.demo_user);
      
      // Check if demo_user is a UUID (direct user ID)
      if (queryParams.demo_user.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log('AUTH MIDDLEWARE: Demo user ID from query is a UUID, using directly:', queryParams.demo_user);
        // Create a minimal user object with the ID
        return {
          id: queryParams.demo_user,
          email: `user-${queryParams.demo_user.substring(0, 8)}@example.com`,
          firstName: 'Demo',
          lastName: 'User',
          userType: 'demo',
          first_name: 'Demo',
          last_name: 'User',
          user_type: 'demo',
          is_active: true,
          authMode: 'demo',
          isDemo: true
        };
      }
      
      // Otherwise, look up the demo user by ID
      const demoUser = DEMO_USERS[queryParams.demo_user];
      if (demoUser) {
        console.log('AUTH MIDDLEWARE: Demo user found from query params:', demoUser.email);
        return {
          ...demoUser,
          firstName: demoUser.first_name,
          lastName: demoUser.last_name,
          userType: demoUser.user_type,
          authMode: 'demo',
          isDemo: true
        };
      } else {
        console.log('AUTH MIDDLEWARE: Demo user not found from query params:', queryParams.demo_user);
      }
    }
    
    console.log('AUTH MIDDLEWARE: No valid authentication found');
    return null;

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
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

/**
 * Helper function to find a header regardless of case
 * This is needed because different browsers and frameworks may send headers with different casing
 */
function findHeaderCaseInsensitive(headers, headerName) {
  if (!headers || typeof headers !== 'object') return null;
  
  // Convert the header name to lowercase for comparison
  const lowerHeaderName = headerName.toLowerCase();
  
  // Check all possible variations
  for (const key in headers) {
    if (key.toLowerCase() === lowerHeaderName) {
      return headers[key];
    }
  }
  
  return null;
}

module.exports = {
  getCurrentUser,
  getAccessibleUserIds,
  getRelationships,
  requireAuth,
  requireUserType
};
