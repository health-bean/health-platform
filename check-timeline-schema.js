#!/usr/bin/env node

/**
 * Script to check the current timeline_entries table schema
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

// Set NODE_ENV to development if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const { Pool } = require('pg');

// Create a new pool with the environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTimelineSchema() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Connected successfully!');
    
    // Query to get the column information for timeline_entries table
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'timeline_entries'
      ORDER BY ordinal_position;
    `;
    
    console.log('Executing query to get timeline_entries schema...');
    const result = await client.query(query);
    
    console.log('\n=== TIMELINE_ENTRIES TABLE SCHEMA ===');
    console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable');
    console.log('-'.repeat(60));
    
    result.rows.forEach(row => {
      console.log(
        row.column_name.padEnd(25) + 
        row.data_type.padEnd(20) + 
        (row.is_nullable === 'YES' ? 'YES' : 'NO')
      );
    });
    
    console.log('\n=== SAMPLE DATA ===');
    // Get a sample row to see the actual data
    const sampleQuery = `
      SELECT * FROM timeline_entries LIMIT 1;
    `;
    
    const sampleResult = await client.query(sampleQuery);
    if (sampleResult.rows.length > 0) {
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('No data found in timeline_entries table');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkTimelineSchema().catch(console.error);