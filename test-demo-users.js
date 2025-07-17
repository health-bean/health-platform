#!/usr/bin/env node

/**
 * Script to check and create demo users in the database
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { pool } = require('./backend/functions/api/database/connection');

// Define demo users directly since they're not exported from auth.js
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
    id: 'bb5c54ee-0304-4e7b-8ad4-b464f5b1e37f', // Updated ID
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

async function checkAndCreateDemoUsers() {
  console.log('🔍 Checking and creating demo users in the database...');
  
  const client = await pool.connect();
  
  try {
    // Get valid user_type_enum values
    const enumQuery = `
      SELECT enum_range(NULL::user_type_enum) as enum_values
    `;
    
    const enumResult = await client.query(enumQuery);
    console.log('Valid user_type_enum values:', enumResult.rows[0].enum_values);
    
    // Check each demo user
    for (const [userId, user] of Object.entries(DEMO_USERS)) {
      console.log(`\nChecking demo user: ${userId} (${user.email})`);
      
      // Check if user exists by ID
      const checkUserByIdQuery = `
        SELECT id FROM users WHERE id = $1
      `;
      
      const userByIdResult = await client.query(checkUserByIdQuery, [user.id]);
      
      if (userByIdResult.rows.length > 0) {
        console.log(`✅ User exists with ID: ${user.id}`);
        continue;
      }
      
      // Check if user exists by email
      const checkUserByEmailQuery = `
        SELECT id FROM users WHERE email = $1
      `;
      
      const userByEmailResult = await client.query(checkUserByEmailQuery, [user.email]);
      
      if (userByEmailResult.rows.length > 0) {
        console.log(`⚠️ User exists with email ${user.email} but has different ID: ${userByEmailResult.rows[0].id}`);
        console.log(`Updating auth.js to use ID: ${userByEmailResult.rows[0].id}`);
        continue;
      }
      
      // Create user
      console.log(`Creating user: ${user.first_name} ${user.last_name} (${user.email})`);
      
      const createUserQuery = `
        INSERT INTO users (
          id, email, first_name, last_name, user_type, is_active, role
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING id
      `;
      
      try {
        const newUserResult = await client.query(createUserQuery, [
          user.id,
          user.email,
          user.first_name,
          user.last_name,
          'patient', // Use 'patient' instead of 'demo'
          true,
          'patient'
        ]);
        
        console.log(`✅ Created user with ID: ${newUserResult.rows[0].id}`);
      } catch (error) {
        console.error(`❌ Error creating user: ${error.message}`);
      }
    }
    
    // Now check user_preferences for each demo user
    console.log('\n🔍 Checking user preferences for demo users...');
    
    for (const [userId, user] of Object.entries(DEMO_USERS)) {
      // Check if user has preferences
      const checkPreferencesQuery = `
        SELECT id, preferences FROM user_preferences WHERE user_id = $1
      `;
      
      let userIdToCheck = user.id;
      
      // First check if user exists with this ID
      const checkUserQuery = `
        SELECT id FROM users WHERE id = $1 OR email = $2
      `;
      
      const userResult = await client.query(checkUserQuery, [user.id, user.email]);
      
      if (userResult.rows.length === 0) {
        console.log(`⚠️ User ${userId} (${user.email}) does not exist in the database, skipping preferences check`);
        continue;
      }
      
      userIdToCheck = userResult.rows[0].id;
      
      const preferencesResult = await client.query(checkPreferencesQuery, [userIdToCheck]);
      
      if (preferencesResult.rows.length === 0) {
        console.log(`User ${userId} has no preferences, creating default preferences...`);
        
        // Create default preferences
        const createPreferencesQuery = `
          INSERT INTO user_preferences (
            user_id, preferences
          ) VALUES (
            $1, $2
          ) RETURNING id
        `;
        
        const defaultPreferences = {
          protocols: [],
          quick_supplements: [],
          quick_medications: [],
          quick_foods: [],
          quick_symptoms: [],
          quick_detox: [],
          setup_complete: false
        };
        
        try {
          const newPreferencesResult = await client.query(createPreferencesQuery, [
            userIdToCheck,
            JSON.stringify(defaultPreferences)
          ]);
          
          console.log(`✅ Created preferences for user ${userId} with ID: ${newPreferencesResult.rows[0].id}`);
        } catch (error) {
          console.error(`❌ Error creating preferences: ${error.message}`);
        }
      } else {
        console.log(`✅ User ${userId} has preferences with ID: ${preferencesResult.rows[0].id}`);
        console.log(`Current preferences: ${JSON.stringify(preferencesResult.rows[0].preferences, null, 2)}`);
        
        // Check if setup_complete is set
        if (preferencesResult.rows[0].preferences.setup_complete === undefined) {
          console.log(`⚠️ User ${userId} has preferences but setup_complete is not set, updating...`);
          
          const updatedPreferences = {
            ...preferencesResult.rows[0].preferences,
            setup_complete: false
          };
          
          const updatePreferencesQuery = `
            UPDATE user_preferences
            SET preferences = $2
            WHERE user_id = $1
            RETURNING id
          `;
          
          try {
            const updateResult = await client.query(updatePreferencesQuery, [
              userIdToCheck,
              JSON.stringify(updatedPreferences)
            ]);
            
            console.log(`✅ Updated preferences for user ${userId}`);
          } catch (error) {
            console.error(`❌ Error updating preferences: ${error.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking demo users:', error);
    console.error('Error stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

// Run the function
checkAndCreateDemoUsers().catch(console.error);