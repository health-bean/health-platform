const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'health-platform-dev-db.c5njva4wrrhe.us-east-1.rds.amazonaws.com',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'health_platform_dev',
    user: process.env.DB_USER || 'healthadmin',
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = { pool };