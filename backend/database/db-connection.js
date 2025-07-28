/**
 * Backend Database Connection - Now using Smart Connection Manager
 * Automatically detects environment (local vs production) and configures accordingly
 */

const { pool, query, healthCheck, getConnectionInfo } = require('./connection-manager');

// Export the same interface for backward compatibility
module.exports = {
    pool,
    query,
    healthCheck,
    getConnectionInfo
};
