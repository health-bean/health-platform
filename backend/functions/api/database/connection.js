/**
 * Lambda Database Connection - Now using Smart Connection Manager
 * Automatically detects Lambda environment and optimizes accordingly
 */

const { pool, query, healthCheck, getConnectionInfo } = require('../../database/connection-manager');

// Export the same interface for backward compatibility
module.exports = {
    pool,
    query,
    healthCheck,
    getConnectionInfo
};
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
