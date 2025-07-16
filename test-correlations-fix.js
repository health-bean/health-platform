#!/usr/bin/env node

/**
 * Test script to debug and fix the correlations handler
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { pool } = require('./backend/functions/api/database/connection');
const { getCurrentUser } = require('./backend/functions/api/middleware/auth');
const correlationsHandler = require('./backend/functions/api/handlers/correlations');

async function testCorrelationsHandler() {
  console.log('🔍 Testing correlations handler with demo user...');
  
  // Create a mock event with demo headers
  const mockEvent = {
    headers: {
      'x-demo-mode': 'true',
      'x-demo-user-id': 'sarah-aip',
      'x-demo-session-id': 'test_session_123'
    },
    queryStringParameters: {
      confidence_threshold: '0.1',
      timeframe_days: '180'
    }
  };
  
  try {
    console.log('Step 1: Testing auth middleware...');
    const user = await getCurrentUser(mockEvent);
    
    if (!user) {
      console.error('❌ Authentication failed - no user returned');
      return;
    }
    
    console.log('✅ Authentication successful!');
    console.log('User:', JSON.stringify(user, null, 2));
    
    // Add user to event like the main handler does
    mockEvent.user = user;
    
    console.log('Step 2: Calling correlations handler...');
    const response = await correlationsHandler.handleGetCorrelationInsights(
      mockEvent.queryStringParameters, 
      mockEvent
    );
    
    console.log('✅ Correlations response status:', response.statusCode);
    console.log('Response body:', JSON.stringify(JSON.parse(response.body), null, 2));
    
    // Check if we got any insights
    const responseBody = JSON.parse(response.body);
    if (responseBody.data && responseBody.data.insights) {
      console.log(`✅ Found ${responseBody.data.insights.length} correlation insights`);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Error stack:', error.stack);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the test
testCorrelationsHandler().catch(console.error);