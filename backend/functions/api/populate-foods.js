const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const foods = [
  { name: 'Apple', oxalate: 'low', lectin: 'low', histamine: 'low', nightshade: false, fodmap: 'high', salicylate: 'high' },
  { name: 'Spinach', oxalate: 'very high', lectin: 'low', histamine: 'low', nightshade: false, fodmap: 'low', salicylate: 'high' },
  { name: 'Tomato', oxalate: 'low', lectin: 'high', histamine: 'high', nightshade: true, fodmap: 'low', salicylate: 'high' },
  { name: 'Potato', oxalate: 'medium', lectin: 'high', histamine: 'low', nightshade: true, fodmap: 'low', salicylate: 'low' },
  { name: 'Bell Pepper', oxalate: 'low', lectin: 'medium', histamine: 'low', nightshade: true, fodmap: 'low', salicylate: 'medium' },
  { name: 'Eggplant', oxalate: 'low', lectin: 'high', histamine: 'medium', nightshade: true, fodmap: 'low', salicylate: 'low' },
  { name: 'Almonds', oxalate: 'high', lectin: 'medium', histamine: 'low', nightshade: false, fodmap: 'high', salicylate: 'high' },
  { name: 'Avocado', oxalate: 'low', lectin: 'low', histamine: 'high', nightshade: false, fodmap: 'low', salicylate: 'high' },
  { name: 'Banana', oxalate: 'low', lectin: 'low', histamine: 'high', nightshade: false, fodmap: 'medium', salicylate: 'low' },
  { name: 'Broccoli', oxalate: 'medium', lectin: 'low', histamine: 'low', nightshade: false, fodmap: 'medium', salicylate: 'high' }
];

async function populateFoods() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS simplified_foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        category VARCHAR(100),
        common_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS food_specialized_properties_simplified (
        id SERIAL PRIMARY KEY,
        food_id INTEGER REFERENCES simplified_foods(id),
        oxalate_level VARCHAR(20),
        lectin_level VARCHAR(20),
        histamine_level VARCHAR(20),
        is_nightshade BOOLEAN DEFAULT FALSE,
        fodmap_level VARCHAR(20),
        salicylate_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(food_id)
      )
    `);
    
    for (const food of foods) {
      await client.query(`
        INSERT INTO simplified_foods (name, category, common_name, created_at, updated_at)
        VALUES ($1, 'whole_food', $1, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `, [food.name]);
      
      const foodResult = await client.query('SELECT id FROM simplified_foods WHERE name = $1', [food.name]);
      const foodId = foodResult.rows[0].id;
      
      await client.query(`
        INSERT INTO food_specialized_properties_simplified (
          food_id, oxalate_level, lectin_level, histamine_level, 
          is_nightshade, fodmap_level, salicylate_level, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (food_id) DO UPDATE SET
          oxalate_level = $2, lectin_level = $3, histamine_level = $4,
          is_nightshade = $5, fodmap_level = $6, salicylate_level = $7, updated_at = NOW()
      `, [foodId, food.oxalate, food.lectin, food.histamine, food.nightshade, food.fodmap, food.salicylate]);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully populated ${foods.length} foods`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  populateFoods().then(() => process.exit(0)).catch(console.error);
}

module.exports = { populateFoods };
