const { pool } = require('./backend/functions/api/database/connection');

async function inspectDatabase() {
  const client = await pool.connect();
  try {
    console.log('=== DATABASE INSPECTION ===\n');
    
    // 1. Check all tables that contain 'food'
    console.log('1. FOOD-RELATED TABLES:');
    const tables = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%food%' OR table_name LIKE '%simplified%')
      ORDER BY table_name
    `);
    
    for (const table of tables.rows) {
      console.log(`   - ${table.table_name} (${table.table_type})`);
    }
    
    // 2. Check all views that contain 'food'
    console.log('\n2. FOOD-RELATED VIEWS:');
    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%food%'
      ORDER BY table_name
    `);
    
    for (const view of views.rows) {
      console.log(`   - ${view.table_name} (VIEW)`);
    }
    
    // 3. Inspect specific table structures
    const tablesToInspect = ['foods', 'simplified_foods', 'food_properties', 'protocol_food_rules'];
    
    for (const tableName of tablesToInspect) {
      console.log(`\n3. INSPECTING TABLE: ${tableName}`);
      try {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (columns.rows.length > 0) {
          console.log(`   Columns in ${tableName}:`);
          columns.rows.forEach(col => {
            console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
          });
          
          // Get sample data
          const sample = await client.query(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log(`   Sample data (${sample.rows.length} rows):`);
          if (sample.rows.length > 0) {
            console.log('     First row:', JSON.stringify(sample.rows[0], null, 2));
          }
        } else {
          console.log(`   ❌ Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.log(`   ❌ Error inspecting ${tableName}: ${error.message}`);
      }
    }
    
    // 4. Inspect views if they exist
    const viewsToInspect = ['food_search_view', 'protocol_foods_view', 'simplified_foods_view'];
    
    for (const viewName of viewsToInspect) {
      console.log(`\n4. INSPECTING VIEW: ${viewName}`);
      try {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [viewName]);
        
        if (columns.rows.length > 0) {
          console.log(`   Columns in ${viewName}:`);
          columns.rows.forEach(col => {
            console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
          
          // Get sample data
          const sample = await client.query(`SELECT * FROM ${viewName} LIMIT 2`);
          console.log(`   Sample data (${sample.rows.length} rows):`);
          if (sample.rows.length > 0) {
            console.log('     First row keys:', Object.keys(sample.rows[0]));
          }
        } else {
          console.log(`   ❌ View ${viewName} does not exist`);
        }
      } catch (error) {
        console.log(`   ❌ Error inspecting ${viewName}: ${error.message}`);
      }
    }
    
    // 5. Test our current query
    console.log('\n5. TESTING CURRENT QUERY:');
    try {
      const testQuery = `
        SELECT 
          f.id,
          f.name,
          f.category
        FROM foods f
        WHERE f.name ILIKE '%chicken%'
        LIMIT 3
      `;
      
      console.log('   Testing query:', testQuery);
      const result = await client.query(testQuery);
      console.log(`   ✅ Query successful: ${result.rows.length} rows`);
      if (result.rows.length > 0) {
        console.log('   Sample result:', result.rows[0]);
      }
    } catch (error) {
      console.log(`   ❌ Query failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    process.exit(0);
  }
}

inspectDatabase().catch(console.error);