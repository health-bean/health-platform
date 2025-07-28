/**
 * Lambda Database Connection - Now using Smart Connection Manager
 * Automatically detects VPC Lambda environment and optimizes accordingly
 */

const { pool, query, healthCheck, getConnectionInfo } = require('./connection-manager');

// Set up the same event handlers as the original file
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

// Export the same interface as the original file - handlers expect { pool }
module.exports = { 
    pool, 
    closePool,
    query,
    healthCheck,
    getConnectionInfo
};
