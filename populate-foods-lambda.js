const { Client } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

exports.handler = async (event) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Categories
    await client.query(`
      INSERT INTO food_categories (id, name, description) VALUES 
      ('550e8400-e29b-41d4-a716-446655440001', 'Vegetables', 'Fresh and prepared vegetables'),
      ('550e8400-e29b-41d4-a716-446655440002', 'Fruits', 'Fresh and dried fruits'),
      ('550e8400-e29b-41d4-a716-446655440003', 'Proteins', 'Animal and plant proteins'),
      ('550e8400-e29b-41d4-a716-446655440006', 'Nuts & Seeds', 'Nuts, seeds, and nut products'),
      ('550e8400-e29b-41d4-a716-446655440008', 'Herbs & Spices', 'Seasonings and flavorings')
      ON CONFLICT (id) DO NOTHING
    `);

    // Subcategories
    await client.query(`
      INSERT INTO food_subcategories (id, category_id, name, description) VALUES 
      ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Leafy Greens', 'Spinach, kale, lettuce'),
      ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Nightshades', 'Tomatoes, peppers, eggplant'),
      ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Berries', 'Strawberries, blueberries'),
      ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440003', 'Fish', 'Fresh and canned fish'),
      ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440003', 'Poultry', 'Chicken, turkey, duck'),
      ('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440006', 'Tree Nuts', 'Almonds, walnuts, cashews')
      ON CONFLICT (id) DO NOTHING
    `);

    // Foods
    const foods = [
      // High Oxalate
      ['550e8400-e29b-41d4-a716-446655441001', 'Spinach', '550e8400-e29b-41d4-a716-446655440011'],
      ['550e8400-e29b-41d4-a716-446655441002', 'Swiss Chard', '550e8400-e29b-41d4-a716-446655440011'],
      ['550e8400-e29b-41d4-a716-446655441003', 'Beets', '550e8400-e29b-41d4-a716-446655440001'],
      ['550e8400-e29b-41d4-a716-446655441004', 'Almonds', '550e8400-e29b-41d4-a716-446655440019'],
      ['550e8400-e29b-41d4-a716-446655441005', 'Cashews', '550e8400-e29b-41d4-a716-446655440019'],
      // High Lectin
      ['550e8400-e29b-41d4-a716-446655442001', 'Kidney Beans', '550e8400-e29b-41d4-a716-446655440003'],
      ['550e8400-e29b-41d4-a716-446655442002', 'Black Beans', '550e8400-e29b-41d4-a716-446655440003'],
      ['550e8400-e29b-41d4-a716-446655442005', 'Tomatoes', '550e8400-e29b-41d4-a716-446655440012'],
      ['550e8400-e29b-41d4-a716-446655442006', 'Potatoes', '550e8400-e29b-41d4-a716-446655440012'],
      // High Histamine
      ['550e8400-e29b-41d4-a716-446655443005', 'Tuna', '550e8400-e29b-41d4-a716-446655440016'],
      ['550e8400-e29b-41d4-a716-446655443006', 'Strawberries', '550e8400-e29b-41d4-a716-446655440014'],
      ['550e8400-e29b-41d4-a716-446655443007', 'Avocado', '550e8400-e29b-41d4-a716-446655440002'],
      // Nightshades
      ['550e8400-e29b-41d4-a716-446655444001', 'Bell Peppers', '550e8400-e29b-41d4-a716-446655440012'],
      ['550e8400-e29b-41d4-a716-446655444002', 'Eggplant', '550e8400-e29b-41d4-a716-446655440012'],
      // Safe Foods
      ['550e8400-e29b-41d4-a716-446655445001', 'Cucumber', '550e8400-e29b-41d4-a716-446655440001'],
      ['550e8400-e29b-41d4-a716-446655445002', 'Zucchini', '550e8400-e29b-41d4-a716-446655440001'],
      ['550e8400-e29b-41d4-a716-446655445003', 'Carrots', '550e8400-e29b-41d4-a716-446655440001'],
      ['550e8400-e29b-41d4-a716-446655445004', 'Chicken Breast', '550e8400-e29b-41d4-a716-446655440017'],
      ['550e8400-e29b-41d4-a716-446655445006', 'Blueberries', '550e8400-e29b-41d4-a716-446655440014']
    ];

    for (const [id, name, subcategory] of foods) {
      await client.query(`
        INSERT INTO simplified_foods (id, display_name, subcategory_id, display_order, is_common) 
        VALUES ($1, $2, $3, 1, true) ON CONFLICT (id) DO NOTHING
      `, [id, name, subcategory]);
    }

    // Properties
    const properties = [
      // High Oxalate Foods
      ['550e8400-e29b-41d4-a716-446655441001', 'very high', 'low', 'low', false], // Spinach
      ['550e8400-e29b-41d4-a716-446655441002', 'very high', 'low', 'low', false], // Swiss Chard
      ['550e8400-e29b-41d4-a716-446655441003', 'high', 'low', 'low', false],      // Beets
      ['550e8400-e29b-41d4-a716-446655441004', 'high', 'low', 'medium', false],   // Almonds
      ['550e8400-e29b-41d4-a716-446655441005', 'medium', 'low', 'medium', false], // Cashews
      // High Lectin Foods
      ['550e8400-e29b-41d4-a716-446655442001', 'low', 'low', 'very high', false], // Kidney Beans
      ['550e8400-e29b-41d4-a716-446655442002', 'low', 'low', 'very high', false], // Black Beans
      ['550e8400-e29b-41d4-a716-446655442005', 'low', 'medium', 'high', true],    // Tomatoes
      ['550e8400-e29b-41d4-a716-446655442006', 'low', 'low', 'high', true],       // Potatoes
      // High Histamine Foods
      ['550e8400-e29b-41d4-a716-446655443005', 'low', 'high', 'low', false],      // Tuna
      ['550e8400-e29b-41d4-a716-446655443006', 'low', 'medium', 'low', false],    // Strawberries
      ['550e8400-e29b-41d4-a716-446655443007', 'low', 'medium', 'low', false],    // Avocado
      // Nightshades
      ['550e8400-e29b-41d4-a716-446655444001', 'low', 'low', 'medium', true],     // Bell Peppers
      ['550e8400-e29b-41d4-a716-446655444002', 'low', 'low', 'medium', true],     // Eggplant
      // Safe Foods
      ['550e8400-e29b-41d4-a716-446655445001', 'low', 'low', 'low', false],       // Cucumber
      ['550e8400-e29b-41d4-a716-446655445002', 'low', 'low', 'low', false],       // Zucchini
      ['550e8400-e29b-41d4-a716-446655445003', 'low', 'low', 'low', false],       // Carrots
      ['550e8400-e29b-41d4-a716-446655445004', 'low', 'low', 'low', false],       // Chicken
      ['550e8400-e29b-41d4-a716-446655445006', 'low', 'low', 'low', false]        // Blueberries
    ];

    for (const [id, oxalate, histamine, lectin, nightshade] of properties) {
      await client.query(`
        INSERT INTO food_specialized_properties_simplified 
        (simplified_food_id, oxalate, histamine, lectin, nightshade, fodmap, salicylate) 
        VALUES ($1, $2, $3, $4, $5, 'low', 'low') 
        ON CONFLICT (simplified_food_id) DO UPDATE SET
          oxalate = EXCLUDED.oxalate,
          histamine = EXCLUDED.histamine,
          lectin = EXCLUDED.lectin,
          nightshade = EXCLUDED.nightshade
      `, [id, oxalate, histamine, lectin, nightshade]);
    }

    // Refresh materialized view
    await client.query('REFRESH MATERIALIZED VIEW mat_food_search');
    
    console.log('Successfully populated food data');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Food data populated successfully',
        foods_added: foods.length,
        properties_added: properties.length
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};
