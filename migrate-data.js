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

async function migrateData() {
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
      console.log(`Created table: ${tableName}`);
      
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
        console.log(`Inserted ${data.rows.length} rows into ${tableName}`);
      }
    }
    
    auroraClient.release();
    pgClient.release();
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await auroraPool.end();
    await postgresPool.end();
  }
}

migrateData();
