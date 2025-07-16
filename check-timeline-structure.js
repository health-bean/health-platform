#!/usr/bin/env node

/**
 * Script to check the timeline_entries table structure
 */

// Load environment variables from .env file
require('dotenv').config({ path: './backend/.env' });

const { Pool } = require('pg');

async function checkTableStructure() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Checking timeline_entries table structure...');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'timeline_entries'
      ORDER BY ordinal_position;
    `);
    
    console.log('Timeline entries columns:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();