#!/usr/bin/env node

/**
 * Script to test user preferences API
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { pool } = require('./backend/functions/api/database/connection');
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');
const { handleGetUserPreferences } = require('./backend/functions/api/handlers/users');

async function testUserPreferences() {
  console.log('🔍 Testing user preferences API...');
  
  // Test for each demo user
  const demoUsers = [
    'sarah-aip',
    'mike-fodmap',
    'lisa-histamine',
    'john-paleo',
    'emma-multi'
  ];
  
  for (const demoUserId of demoUsers) {
    console.log(`\n🔍 Testing preferences for ${demoUserId}...`);
    
    // Create a mock event with demo headers
    const mockEvent = {
      headers: {
        'x-demo-mode': 'true',
        'x-demo-user-id': demoUserId,
        'x-demo-session-id': 'test_session_123'
      }
    };
    
    try {
      console.log('Step 1: Testing auth middleware...');
      const user = await getCurrentUser(mockEvent);
      
      if (!user) {
        console.error(`❌ Authentication failed for ${demoUserId} - no user returned`);
        continue;
      }
      
      console.log(`✅ Authentication successful for ${demoUserId}!`);
      console.log('User ID:', user.id);
      
      // Add user to event like the main handler does
      mockEvent.user = user;
      
      console.log('Step 2: Checking database preferences...');
      const client = await pool.connect();
      
      try {
        const dbQuery = `
          SELECT preferences FROM user_preferences WHERE user_id = $1
        `;
        
        const dbResult = await client.query(dbQuery, [user.id]);
        
        if (dbResult.rows.length > 0) {
          console.log(`✅ Found preferences in database for ${demoUserId}`);
          console.log('Database preferences:', JSON.stringify(dbResult.rows[0].preferences, null, 2));
          console.log(`setup_complete value: ${dbResult.rows[0].preferences.setup_complete}`);
          console.log(`Type of setup_complete: ${typeof dbResult.rows[0].preferences.setup_complete}`);
        } else {
          console.log(`❌ No preferences found in database for ${demoUserId}`);
        }
      } finally {
        client.release();
      }
      
      console.log('Step 3: Calling handleGetUserPreferences...');
      const response = await handleGetUserPreferences({}, mockEvent);
      
      console.log(`✅ API response status: ${response.statusCode}`);
      const responseBody = JSON.parse(response.body);
      console.log('API preferences:', JSON.stringify(responseBody.preferences, null, 2));
      console.log(`API setup_complete value: ${responseBody.preferences.setup_complete}`);
      console.log(`Type of API setup_complete: ${typeof responseBody.preferences.setup_complete}`);
      
    } catch (error) {
      console.error(`❌ Error testing ${demoUserId}:`, error);
      console.error('Error stack:', error.stack);
    }
  }
  
  // Close the database connection
  await pool.end();
  console.log('\nDatabase connection closed');
}

// Run the function
testUserPreferences().catch(console.error);