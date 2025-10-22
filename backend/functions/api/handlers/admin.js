/**
 * Admin functions for seeding demo data
 * SECURITY: Should be protected in production
 */

const { pool } = require('../database/connection');
const { successResponse, errorResponse } = require('../utils/responses');
const { AppError, ErrorTypes, handleDatabaseError } = require('../utils/errorTypes');

// Data migration function
async function handleDataMigration(event) {
  const { Pool } = require('pg');
  
  const auroraPool = new Pool({
    host: 'temp-restore-cluster.cluster-c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'health_platform_dev',
    user: 'healthadmin',
    password: 'MH67HxZFAAmVWzc6zldv0ZL6',
    ssl: { rejectUnauthorized: false }
  });

  const postgresPool = new Pool({
    host: 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'health_platform_dev',
    user: 'healthadmin',
    password: 'MH67HxZFAAmVWzc6zldv0ZL6',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Aurora...');
    const auroraClient = await auroraPool.connect();
    
    console.log('Connecting to PostgreSQL...');
    const pgClient = await postgresPool.connect();
    
    // Get all tables from Aurora
    const tables = await auroraClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    console.log('Found tables:', tables.rows.map(r => r.table_name));
    
    const results = {};
    
    for (const table of tables.rows) {
      const tableName = table.table_name;
      console.log(`Migrating table: ${tableName}`);
      
      // Get table structure
      const columns = await auroraClient.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      // Create table in PostgreSQL
      const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${
        columns.rows.map(col => {
          let def = `${col.column_name} ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        }).join(', ')
      })`;
      
      await pgClient.query(createTableSQL);
      
      // Copy data
      const data = await auroraClient.query(`SELECT * FROM ${tableName}`);
      console.log(`Found ${data.rows.length} rows in ${tableName}`);
      
      if (data.rows.length > 0) {
        const columnNames = columns.rows.map(col => col.column_name);
        const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ');
        const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
        
        for (const row of data.rows) {
          const values = columnNames.map(col => row[col]);
          await pgClient.query(insertSQL, values);
        }
      }
      
      results[tableName] = data.rows.length;
    }
    
    auroraClient.release();
    pgClient.release();
    
    return successResponse({
      message: 'Migration completed successfully',
      tables: results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return errorResponse(`Migration failed: ${error.message}`, 500);
  } finally {
    await auroraPool.end();
    await postgresPool.end();
  }
}

// Database check function
async function handleDatabaseCheck(event) {
  try {
    const client = await pool.connect();
    
    // Check users
    const users = await client.query('SELECT id, email, first_name FROM users LIMIT 10');
    
    // Check timeline entries
    const timeline = await client.query('SELECT COUNT(*) FROM timeline_entries');
    
    // Check foods
    const foods = await client.query('SELECT COUNT(*) FROM foods');
    
    client.release();
    
    return successResponse({
      users: {
        count: users.rows.length,
        data: users.rows
      },
      timeline_entries: timeline.rows[0].count,
      foods: foods.rows[0].count
    });
  } catch (error) {
    console.error('Database check error:', error);
    return errorResponse('Database check failed', 500);
  }
}

// Demo user profiles
const demoUsers = [
  {
    email: 'sarah.aip@test.com',
    profile: 'AIP Protocol',
    commonFoods: ['bone broth', 'sweet potato', 'coconut oil', 'grass-fed beef'],
    commonSymptoms: ['joint pain', 'fatigue', 'brain fog'],
    commonSupplements: ['vitamin D', 'omega-3', 'probiotics']
  },
  {
    email: 'mike.fodmap@test.com', 
    profile: 'Low FODMAP',
    commonFoods: ['rice', 'chicken', 'carrots', 'spinach'],
    commonSymptoms: ['bloating', 'abdominal pain', 'gas'],
    commonSupplements: ['digestive enzymes', 'peppermint oil', 'fiber']
  },
  {
    email: 'lisa.histamine@test.com',
    profile: 'Low Histamine',
    commonFoods: ['fresh meat', 'rice', 'broccoli', 'olive oil'],
    commonSymptoms: ['headaches', 'skin rash', 'nasal congestion'],
    commonSupplements: ['DAO enzyme', 'quercetin', 'vitamin C']
  },
  {
    email: 'john.paleo@test.com',
    profile: 'Paleo Diet',
    commonFoods: ['salmon', 'avocado', 'nuts', 'berries'],
    commonSymptoms: ['energy dips', 'cravings', 'mood swings'],
    commonSupplements: ['magnesium', 'B-complex', 'fish oil']
  },
  {
    email: 'emma.multi@test.com',
    profile: 'Multiple Protocols',
    commonFoods: ['quinoa', 'vegetables', 'lean protein', 'herbal teas'],
    commonSymptoms: ['varied symptoms', 'sensitivity reactions', 'digestive issues'],
    commonSupplements: ['multivitamin', 'adaptogenic herbs', 'gut support']
  }
];

// Generate user ID from email (same logic as auth middleware)
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

// Generate timeline entries for a user
const generateTimelineEntries = (userProfile, userId, daysBack = 30) => {
  const entries = [];
  const today = new Date();
  
  for (let day = 0; day < daysBack; day++) {
    const entryDate = new Date(today);
    entryDate.setDate(today.getDate() - day);
    const dateStr = entryDate.toISOString().split('T')[0];
    
    // Generate 3-8 entries per day
    const entriesPerDay = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < entriesPerDay; i++) {
      const hour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Random entry type
      const entryTypes = ['food', 'symptom', 'supplement'];
      const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
      
      let content, severity;
      
      switch (entryType) {
        case 'food':
          content = {
            name: userProfile.commonFoods[Math.floor(Math.random() * userProfile.commonFoods.length)],
            amount: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
          };
          break;
          
        case 'symptom':
          const symptom = userProfile.commonSymptoms[Math.floor(Math.random() * userProfile.commonSymptoms.length)];
          severity = Math.floor(Math.random() * 5) + 1;
          content = {
            name: symptom,
            severity: severity
          };
          break;
          
        case 'supplement':
          content = {
            name: userProfile.commonSupplements[Math.floor(Math.random() * userProfile.commonSupplements.length)],
            dosage: ['1 capsule', '2 capsules', '1 tablet'][Math.floor(Math.random() * 3)]
          };
          break;
      }
      
      entries.push({
        userId,
        entryDate: dateStr,
        entryTime: timeStr,
        entryType,
        content,
        severity,
        protocolCompliant: Math.random() > 0.3
      });
    }
  }
  
  return entries;
};

const handleSeedDemoData = async (queryParams, event) => {
  // SECURITY: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return errorResponse('Not available in production', 403);
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting demo data seeding...');
    const results = [];
    
    for (const userProfile of demoUsers) {
      const userId = generateDemoUserId(userProfile.email);
      console.log(`👤 Seeding data for ${userProfile.email}`);
      
      // Check if user already has data
      const existingEntries = await client.query(
        'SELECT COUNT(*) as count FROM timeline_entries WHERE user_id = $1',
        [userId]
      );
      
      const existingCount = parseInt(existingEntries.rows[0].count);
      
      if (existingCount > 0) {
        console.log(`⏭️  User already has ${existingCount} entries, skipping...`);
        results.push({
          email: userProfile.email,
          userId,
          status: 'skipped',
          existingEntries: existingCount
        });
        continue;
      }
      
      // Generate timeline entries
      const timelineEntries = generateTimelineEntries(userProfile, userId);
      let insertedCount = 0;
      
      // Insert entries
      for (const entry of timelineEntries) {
        try {
          // Ensure journal entry exists
          await client.query(`
            INSERT INTO journal_entries (user_id, entry_date)
            VALUES ($1, $2)
            ON CONFLICT (user_id, entry_date) DO NOTHING
          `, [entry.userId, entry.entryDate]);
          
          // Get journal entry ID
          const journalResult = await client.query(
            'SELECT id FROM journal_entries WHERE user_id = $1 AND entry_date = $2',
            [entry.userId, entry.entryDate]
          );
          
          if (journalResult.rows.length > 0) {
            const journalEntryId = journalResult.rows[0].id;
            
            // Insert timeline entry
            await client.query(`
              INSERT INTO timeline_entries (
                user_id, journal_entry_id, entry_time, entry_type, 
                content, severity, protocol_compliant
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              entry.userId,
              journalEntryId,
              entry.entryTime,
              entry.entryType,
              entry.content,
              entry.severity,
              entry.protocolCompliant
            ]);
            
            insertedCount++;
          }
        } catch (entryError) {
          console.error(`Error inserting entry:`, entryError);
        }
      }
      
      results.push({
        email: userProfile.email,
        userId,
        profile: userProfile.profile,
        status: 'seeded',
        entriesCreated: insertedCount
      });
      
      console.log(`✅ Seeded ${insertedCount} entries for ${userProfile.profile}`);
    }
    
    return successResponse({
      message: 'Demo data seeding completed',
      results
    });
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    const appError = handleDatabaseError(error, 'seed demo data');
    return errorResponse(appError.message, appError.statusCode);
  } finally {
    client.release();
  }
};

module.exports = {
  handleSeedDemoData,
  handleDatabaseCheck
};
