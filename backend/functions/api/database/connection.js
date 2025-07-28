const { Pool } = require('pg');

// OPTIMIZED database connection configuration for Lambda performance
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
    } : {
        rejectUnauthorized: false
    },
    
    // OPTIMIZED CONNECTION POOL SETTINGS
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 3, // Allow more connections
    min: 0, // No minimum connections
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 5000, // Shorter idle timeout
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // Shorter connection timeout
    acquireTimeoutMillis: 8000, // Shorter acquire timeout
    statement_timeout: 15000, // Shorter query timeout
    query_timeout: 15000, // Shorter query timeout
    
    // Additional performance settings
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
});

// Simplified error handling
pool.on('error', (err) => {
    console.error('Database pool error:', err.message);
});

// Performance monitoring
pool.on('connect', (client) => {
    console.log('✅ Database client connected');
});

pool.on('acquire', (client) => {
    console.log('📥 Database client acquired');
});

pool.on('remove', (client) => {
    console.log('📤 Database client removed');
});

// Fast cleanup function
const closePool = async () => {
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (err) {
        console.error('Error closing pool:', err.message);
    }
};

module.exports = { pool, closePool };
