const { Pool } = require('pg');

const pool = new Pool({
  host: 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'health_platform_dev',
  user: 'healthadmin',
  password: 'MH67HxZFAAmVWzc6zldv0ZL6',
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  try {
    const client = await pool.connect();
    
    // Check users
    const users = await client.query('SELECT id, email, first_name FROM users LIMIT 5');
    console.log('Users found:', users.rows.length);
    users.rows.forEach(user => console.log(`- ${user.first_name} (${user.email})`));
    
    // Check timeline entries
    const timeline = await client.query('SELECT COUNT(*) FROM timeline_entries');
    console.log('Timeline entries:', timeline.rows[0].count);
    
    // Check foods
    const foods = await client.query('SELECT COUNT(*) FROM foods');
    console.log('Foods:', foods.rows[0].count);
    
    client.release();
  } catch (error) {
    console.error('Database check error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
