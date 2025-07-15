const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { handleDatabaseError } = require('../utils/errors');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Utility functions
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      sub: user.id, 
      email: user.email, 
      userType: user.user_type 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { 
      sub: user.id,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const handleRegister = async (body, event) => {
  const { email, password, firstName, lastName, userType = 'patient' } = body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return errorResponse('Missing required fields', 400);
  }

  if (password.length < 8) {
    return errorResponse('Password must be at least 8 characters', 400);
  }

  try {
    const client = await pool.connect();

    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users WHERE email = $1
    `;
    const existingUser = await client.query(existingUserQuery, [email.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      client.release();
      return errorResponse('User already exists', 409);
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, user_type) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, first_name, last_name, user_type, created_at
    `;
    
    const result = await client.query(insertUserQuery, [
      email.toLowerCase(), 
      passwordHash, 
      firstName, 
      lastName, 
      userType
    ]);

    const user = result.rows[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const insertSessionQuery = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at) 
      VALUES ($1, $2, $3)
    `;
    await client.query(insertSessionQuery, [
      user.id, 
      refreshToken, 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ]);

    client.release();

    return successResponse({
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      },
      token: accessToken,
      refreshToken
    }, 201);

  } catch (error) {
    const appError = handleDatabaseError(error, 'user registration');
    return errorResponse(appError.message, appError.statusCode);
  }
};

const handleLogin = async (body, event) => {
  const { email, password } = body;
  console.log('🔍 AUTH: Starting login for email:', email);

  // Check for demo mode first (clean auth system)
  const demoMode = event.headers?.['X-Demo-Mode'] || event.headers?.['x-demo-mode'];
  if (demoMode === 'true') {
    console.log('🔍 AUTH: Demo mode login detected');
    return successResponse({
      message: 'Demo login successful',
      user: {
        id: 'demo-user',
        email: email || 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        userType: 'demo'
      },
      isDemo: true
    });
  }

  if (!email || !password) {
    console.log('🔍 AUTH: Missing email or password');
    return errorResponse('Email and password required', 400);
  }

  try {
    const client = await pool.connect();
    console.log('🔍 AUTH: Database connected');

    // Get user from database
    const getUserQuery = `
      SELECT 
        id, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        user_type, 
        is_active 
      FROM users 
      WHERE email = $1
    `;
    const result = await client.query(getUserQuery, [email.toLowerCase()]);
    console.log('🔍 AUTH: Database query result count:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('🔍 AUTH: No user found for email:', email);
      client.release();
      return errorResponse('Invalid credentials', 401);
    }

    const user = result.rows[0];
    console.log('🔍 AUTH: User found:', { id: user.id, email: user.email, is_active: user.is_active });
    console.log('🔍 AUTH: Password hash exists:', !!user.password_hash);

    if (!user.is_active) {
      console.log('🔍 AUTH: User account is inactive');
      client.release();
      return errorResponse('Account is deactivated', 401);
    }

    // Verify password
    console.log('🔍 AUTH: Starting password verification');
    
    const isValidPassword = await verifyPassword(password, user.password_hash);
    console.log('🔍 AUTH: Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('🔍 AUTH: Password verification failed');
      client.release();
      return errorResponse('Invalid credentials', 401);
    }

    console.log('🔍 AUTH: Login successful! Generating tokens...');

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const insertSessionQuery = `
      INSERT INTO user_sessions (user_id, refresh_token, expires_at) 
      VALUES ($1, $2, $3)
    `;
    await client.query(insertSessionQuery, [
      user.id, 
      refreshToken, 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ]);

    // Update last login
    const updateLoginQuery = `
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
    `;
    await client.query(updateLoginQuery, [user.id]);

    // Fetch user preferences
    console.log('🔍 AUTH: Fetching user preferences...');
    const preferencesQuery = `
      SELECT preferences FROM user_preferences WHERE user_id = $1
    `;
    const preferencesResult = await client.query(preferencesQuery, [user.id]);
    const userPreferences = preferencesResult.rows.length > 0 ? preferencesResult.rows[0].preferences : null;

    client.release();

    console.log('🔍 AUTH: Returning success response with preferences');
    return successResponse({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        preferences: userPreferences
      },
      token: accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('🔍 AUTH: Login error:', error);
    const appError = handleDatabaseError(error, 'user login');
    return errorResponse(appError.message, appError.statusCode);
  }
};

const handleLogout = async (body, event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader) {
    return errorResponse('No authorization header', 401);
  }

  try {
    const client = await pool.connect();
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Remove all refresh tokens for this user (logout from all devices)
    const deleteSessionsQuery = `
      DELETE FROM user_sessions WHERE user_id = $1
    `;
    await client.query(deleteSessionsQuery, [decoded.sub]);

    client.release();

    return successResponse({ 
      message: 'Logout successful' 
    });

  } catch (error) {
    // Return success even if token verification fails
    return successResponse({ 
      message: 'Logout successful' 
    });
  }
};

const handleRefresh = async (body, event) => {
  const { refreshToken } = body;

  if (!refreshToken) {
    return errorResponse('Refresh token required', 400);
  }

  try {
    const client = await pool.connect();

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Check if refresh token exists in database
    const sessionQuery = `
      SELECT user_id 
      FROM user_sessions 
      WHERE refresh_token = $1 AND expires_at > CURRENT_TIMESTAMP
    `;
    const sessionResult = await client.query(sessionQuery, [refreshToken]);

    if (sessionResult.rows.length === 0) {
      client.release();
      return errorResponse('Invalid refresh token', 401);
    }

    // Get user data
    const userQuery = `
      SELECT id, email, first_name, last_name, user_type 
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    const userResult = await client.query(userQuery, [decoded.sub]);

    if (userResult.rows.length === 0) {
      client.release();
      return errorResponse('User not found', 401);
    }

    const user = userResult.rows[0];
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Replace old refresh token with new one (token rotation)
    const updateTokenQuery = `
      UPDATE user_sessions 
      SET refresh_token = $1, expires_at = $2 
      WHERE refresh_token = $3
    `;
    await client.query(updateTokenQuery, [
      newRefreshToken, 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      refreshToken
    ]);

    client.release();

    return successResponse({
      token: accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    const appError = handleDatabaseError(error, 'token refresh');
    return errorResponse('Invalid refresh token', 401);
  }
};

const handleVerify = async (queryParams, event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  
  if (!authHeader) {
    return errorResponse('No authorization header', 401);
  }

  try {
    const client = await pool.connect();
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user data to ensure user still exists and is active
    const userQuery = `
      SELECT id, email, first_name, last_name, user_type 
      FROM users 
      WHERE id = $1 AND is_active = true
    `;
    const result = await client.query(userQuery, [decoded.sub]);

    client.release();

    if (result.rows.length === 0) {
      return errorResponse('User not found', 401);
    }

    const user = result.rows[0];

    return successResponse({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type
      }
    });

  } catch (error) {
    return errorResponse('Invalid token', 401);
  }
};

module.exports = {
  handleRegister,
  handleLogin,
  handleLogout,
  handleRefresh,
  handleVerify
};