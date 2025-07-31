const { Pool } = require('pg');
const config = require('./config');

// Database connection pool
let pool;

const connectDB = () => {
  try {
    const isProduction = config.server.environment === 'production';
    
    if (isProduction) {
      // Production database (hosting platform)
      pool = new Pool({
        connectionString: config.database.production.connectionString,
        ssl: config.database.production.ssl
      });
    } else {
      // Local development database
      pool = new Pool(config.database.local);
    }

    console.log('✅ PostgreSQL database connection established');
    console.log(`🌐 Environment: ${config.server.environment}`);
    
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Database query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// Get database client
const getClient = async () => {
  return await pool.connect();
};

// Close database connection
const closeDB = async () => {
  if (pool) {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
};

module.exports = {
  connectDB,
  query,
  getClient,
  closeDB,
  pool: () => pool
}; 