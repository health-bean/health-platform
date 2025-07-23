// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const { Pool } = require('pg');

// Create a pool with proper SSL configuration for RDS
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false // For development - allows self-signed certificates
    },
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
});

async function inspectDatabase() {
  const client = await pool.connect();
  try {
    console.log('=== DETAILED DATABASE INSPECTION ===\n');
    
    // 1. Check ALL tables (not just food-related)
    console.log('1. ALL TABLES IN DATABASE:');
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    allTables.rows.forEach(row => console.log('  - ' + row.table_name));
    
    // 2. Check ALL views
    console.log('\n2. ALL VIEWS IN DATABASE:');
    const allViews = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    allViews.rows.forEach(row => console.log('  - ' + row.table_name));
    
    // 3. Check if 'foods' table exists and its structure
    console.log('\n3. FOODS TABLE STRUCTURE:');
    try {
      const foodsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'foods' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      if (foodsColumns.rows.length > 0) {
        console.log('  Foods table columns:');
        foodsColumns.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Test a simple query on foods table
        console.log('\n  Testing simple foods query:');
        const foodsTest = await client.query('SELECT id, name, category FROM foods LIMIT 3');
        console.log('  Sample foods:', foodsTest.rows);
      } else {
        console.log('  ❌ Foods table does not exist!');
      }
    } catch (error) {
      console.log('  ❌ Error accessing foods table:', error.message);
    }
    
    // 4. Check if 'simplified_foods' table exists and its structure
    console.log('\n4. SIMPLIFIED_FOODS TABLE STRUCTURE:');
    try {
      const simplifiedFoodsColumns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'simplified_foods' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      if (simplifiedFoodsColumns.rows.length > 0) {
        console.log('  Simplified_foods table columns:');
        simplifiedFoodsColumns.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Test a simple query on simplified_foods table
        console.log('\n  Testing simple simplified_foods query:');
        const simplifiedTest = await client.query('SELECT id, display_name FROM simplified_foods LIMIT 3');
        console.log('  Sample simplified foods:', simplifiedTest.rows);
      } else {
        console.log('  ❌ Simplified_foods table does not exist!');
      }
    } catch (error) {
      console.log('  ❌ Error accessing simplified_foods table:', error.message);
    }
    
    // 5. Check food_search_view structure if it exists
    console.log('\n5. FOOD_SEARCH_VIEW STRUCTURE:');
    try {
      const viewColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'food_search_view' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      if (viewColumns.rows.length > 0) {
        console.log('  Food_search_view columns:');
        viewColumns.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Test the view
        console.log('\n  Testing food_search_view query:');
        const viewTest = await client.query('SELECT * FROM food_search_view LIMIT 3');
        console.log('  Sample view data:', viewTest.rows);
      } else {
        console.log('  ❌ Food_search_view does not exist!');
      }
    } catch (error) {
      console.log('  ❌ Error accessing food_search_view:', error.message);
    }
    
    // 6. Check protocol_food_rules table
    console.log('\n6. PROTOCOL_FOOD_RULES TABLE STRUCTURE:');
    try {
      const protocolRulesColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'protocol_food_rules' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      if (protocolRulesColumns.rows.length > 0) {
        console.log('  Protocol_food_rules columns:');
        protocolRulesColumns.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Check sample data
        console.log('\n  Sample protocol_food_rules data:');
        const rulesTest = await client.query('SELECT * FROM protocol_food_rules LIMIT 3');
        console.log('  Sample rules:', rulesTest.rows);
      } else {
        console.log('  ❌ Protocol_food_rules table does not exist!');
      }
    } catch (error) {
      console.log('  ❌ Error accessing protocol_food_rules table:', error.message);
    }
    
    // 7. Check protocol_foods_view structure
    console.log('\n7. PROTOCOL_FOODS_VIEW STRUCTURE:');
    try {
      const protocolViewColumns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'protocol_foods_view' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      if (protocolViewColumns.rows.length > 0) {
        console.log('  Protocol_foods_view columns:');
        protocolViewColumns.rows.forEach(row => {
          console.log(`    - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Test the view
        console.log('\n  Testing protocol_foods_view query:');
        const protocolViewTest = await client.query('SELECT * FROM protocol_foods_view LIMIT 3');
        console.log('  Sample protocol view data:', protocolViewTest.rows);
      } else {
        console.log('  ❌ Protocol_foods_view does not exist!');
      }
    } catch (error) {
      console.log('  ❌ Error accessing protocol_foods_view:', error.message);
    }
    
    // 8. Test the FIXED query that should work now
    console.log('\n8. TESTING FIXED FOOD SEARCH QUERY:');
    try {
      const fixedQuery = `
        SELECT 
          fsv.simplified_food_id as id,
          fsv.display_name as name,
          fsv.category_name as category,
          fsv.subcategory_name,
          COALESCE(fsv.nightshade, false) as nightshade,
          COALESCE(fsv.histamine, 'unknown') as histamine,
          COALESCE(fsv.oxalate, 'unknown') as oxalate,
          COALESCE(fsv.lectin, 'unknown') as lectin,
          COALESCE(fsv.fodmap, 'unknown') as fodmap,
          COALESCE(fsv.salicylate, 'unknown') as salicylate,
          COALESCE(fsv.is_organic, false) as is_organic,
          COALESCE(fsv.preparation_state, 'unknown') as preparation_state,
          COALESCE(pfv.protocol_status, 'unknown') as protocol_status
        FROM food_search_view fsv
        LEFT JOIN protocol_foods_view pfv ON fsv.simplified_food_id = pfv.simplified_food_id 
          AND pfv.protocol_id = $1
        WHERE fsv.display_name ILIKE $2
        ORDER BY fsv.display_name ASC
        LIMIT 3
      `;
      
      const testResult = await client.query(fixedQuery, ['a80be547-6db1-4722-a5a4-60930143a2d9', '%chicken%']);
      console.log('  ✅ Fixed query executed successfully!');
      console.log('  Results:', testResult.rows);
    } catch (error) {
      console.log('  ❌ Fixed query failed:', error.message);
      console.log('  Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ INSPECTION ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
}

inspectDatabase().catch(console.error);