const { Pool } = require('pg');

// Secure database connection configuration
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        // In production, you'd add the RDS CA certificate here
        // ca: fs.readFileSync('rds-ca-2019-root.pem')
    } : {
        // Development: More lenient SSL for easier setup
        rejectUnauthorized: false
    },
    // Connection pool settings for better performance and security
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle connection errors gracefully
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = { pool };