/**
 * Smart Database Connection Manager
 * Automatically switches between local and remote database based on environment
 * Works for both Lambda functions and local development/scripts
 */

const { Pool } = require('pg');

class DatabaseConnectionManager {
    constructor() {
        this.pool = null;
        this.environment = this.detectEnvironment();
        this.initializeConnection();
    }

    detectEnvironment() {
        // Check if running in AWS Lambda within VPC
        if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
            // VPC Lambda functions have different networking requirements
            return 'vpc-lambda';
        }
        
        // Check if explicitly set to local
        if (process.env.ENVIRONMENT === 'local') {
            return 'local';
        }
        
        // Check if local development database is configured
        if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
            return 'local';
        }
        
        // Default to production/remote
        return 'production';
    }

    loadEnvironmentConfig() {
        // In VPC Lambda, environment variables are already loaded by AWS
        if (this.environment === 'vpc-lambda') {
            console.log('🔍 VPC Lambda environment variables check:');
            console.log('AWS_LAMBDA_FUNCTION_NAME:', process.env.AWS_LAMBDA_FUNCTION_NAME ? 'SET' : 'MISSING');
            console.log('DB_HOST:', process.env.DB_HOST ? 'SET' : 'MISSING');
            console.log('DB_PORT:', process.env.DB_PORT ? 'SET' : 'MISSING');
            console.log('DB_NAME:', process.env.DB_NAME ? 'SET' : 'MISSING');
            console.log('DB_USER:', process.env.DB_USER ? 'SET' : 'MISSING');
            console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'MISSING');
            return;
        }

        // For local and production environments, environment variables should already be loaded
        // by the application startup process (not the connection manager's responsibility)
        console.log(`📍 Using environment variables for ${this.environment} environment`);
    }

    initializeConnection() {
        try {
            this.loadEnvironmentConfig();
            const config = this.getConnectionConfig();
            
            console.log(`🗄️  Initializing database connection for ${this.environment} environment`);
            console.log(`📍 Connecting to: ${config.host}:${config.port}/${config.database}`);
            
            this.pool = new Pool(config);
            
            // For Lambda, test connection but don't block initialization
            if (this.environment !== 'vpc-lambda') {
                this.testConnection();
            } else {
                // For VPC Lambda, test connection but don't block initialization
                this.testConnection().catch(error => {
                    console.warn('⚠️ VPC Lambda connection test failed (will retry on first query):', error.message);
                });
            }
            
            // Handle connection events
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ Failed to initialize database connection:', error);
            if (this.environment !== 'vpc-lambda') {
                throw error; // Fail fast in non-Lambda environments
            } else {
                console.warn('⚠️ VPC Lambda connection initialization failed, will retry on first query');
            }
        }
    }

    getConnectionConfig() {
        // Validate required environment variables
        const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            const error = `Missing required environment variables: ${missingVars.join(', ')}`;
            console.error('❌', error);
            throw new Error(error);
        }

        const baseConfig = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };

        // Environment-specific configurations
        if (this.environment === 'local') {
            return {
                ...baseConfig,
                ssl: false, // No SSL for local development
                max: 5, // Fewer connections for local
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5433, // Default local port
            };
        } else if (this.environment === 'vpc-lambda') {
            return {
                ...baseConfig,
                ssl: {
                    rejectUnauthorized: false // Required for RDS within VPC
                },
                max: 1, // VPC Lambda functions should use minimal connections
                idleTimeoutMillis: 1000, // Short idle timeout for Lambda
                connectionTimeoutMillis: 5000, // Shorter timeout for VPC
                acquireTimeoutMillis: 3000, // Shorter acquire timeout
            };
        } else {
            // Production/remote
            return {
                ...baseConfig,
                ssl: {
                    rejectUnauthorized: false // Required for RDS
                },
                max: 10, // More connections for production
            };
        }
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
            
            console.log(`✅ Database connected successfully at: ${result.rows[0].current_time}`);
            console.log(`📊 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
            
            client.release();
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            
            if (this.environment === 'local') {
                console.log('💡 Tip: Make sure to run "docker-compose -f docker/docker-compose.dev.yml up -d" first');
            } else {
                console.log('💡 Tip: Make sure SSH tunnel is active or RDS is accessible');
            }
            
            // Don't throw in Lambda - let it retry
            if (this.environment !== 'lambda') {
                throw error;
            }
        }
    }

    setupEventHandlers() {
        this.pool.on('connect', (client) => {
            if (process.env.ENABLE_QUERY_LOGGING === 'true') {
                console.log(`🔌 New database client connected (${this.environment})`);
            }
        });

        this.pool.on('error', (err, client) => {
            console.error(`❌ Unexpected database error (${this.environment}):`, err);
        });

        this.pool.on('remove', (client) => {
            if (process.env.ENABLE_QUERY_LOGGING === 'true') {
                console.log(`🔌 Database client removed (${this.environment})`);
            }
        });
    }

    getPool() {
        if (!this.pool) {
            throw new Error('Database connection not initialized');
        }
        return this.pool;
    }

    async query(text, params) {
        const start = Date.now();
        
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.ENABLE_QUERY_LOGGING === 'true') {
                console.log(`🔍 Query executed in ${duration}ms (${this.environment}): ${text.substring(0, 100)}...`);
            }
            
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`❌ Query failed after ${duration}ms (${this.environment}):`, error.message);
            console.error(`📝 Query: ${text}`);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log(`🔒 Database connection pool closed (${this.environment})`);
        }
    }

    // Health check method
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as health_check');
            return {
                status: 'healthy',
                environment: this.environment,
                timestamp: new Date().toISOString(),
                connection_count: this.pool.totalCount,
                idle_count: this.pool.idleCount
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                environment: this.environment,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Get connection info for debugging
    getConnectionInfo() {
        return {
            environment: this.environment,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            total_connections: this.pool?.totalCount || 0,
            idle_connections: this.pool?.idleCount || 0,
            waiting_connections: this.pool?.waitingCount || 0
        };
    }
}

// Create singleton instance
const dbManager = new DatabaseConnectionManager();

// Export both the manager and the pool for backward compatibility
module.exports = {
    pool: dbManager.getPool(),
    dbManager,
    query: (text, params) => dbManager.query(text, params),
    healthCheck: () => dbManager.healthCheck(),
    getConnectionInfo: () => dbManager.getConnectionInfo(),
    
    // For gradual migration - these match existing interfaces
    connect: () => dbManager.getPool().connect(),
    end: () => dbManager.close()
};
