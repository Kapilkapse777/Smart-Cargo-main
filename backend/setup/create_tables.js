const { connectDB, query, closeDB } = require('../database');
const fs = require('fs');
const path = require('path');

async function createTables() {
  console.log('🚀 Setting up PostgreSQL database for Cargo Exchange Platform');
  console.log('==============================================================');
  
  try {
    // Connect to database
    connectDB();
    console.log('✅ Database connected');

    // Create Users table
    console.log('📝 Creating users table...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(255),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Cargo table
    console.log('📝 Creating cargo table...');
    await query(`
      CREATE TABLE IF NOT EXISTS cargo (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        cargo_type VARCHAR(50) NOT NULL CHECK (cargo_type IN ('electronics', 'furniture', 'clothing', 'food', 'machinery', 'chemicals', 'textiles', 'automotive', 'medical', 'other')),
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        origin_lat DECIMAL(10, 8),
        origin_lng DECIMAL(11, 8),
        destination_lat DECIMAL(10, 8),
        destination_lng DECIMAL(11, 8),
        weight DECIMAL(10, 2) NOT NULL CHECK (weight > 0),
        volume DECIMAL(10, 2) DEFAULT 0 CHECK (volume >= 0),
        special_requirements TEXT,
        pickup_date DATE NOT NULL,
        delivery_date DATE NOT NULL,
        budget DECIMAL(10, 2) NOT NULL CHECK (budget > 0),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'in_transit', 'delivered', 'cancelled')),
        priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Cities table
    console.log('📝 Creating cities table...');
    await query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        geonameid VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        asciiname VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        population INTEGER DEFAULT 0,
        elevation INTEGER,
        admin1_code VARCHAR(10),
        admin2_code VARCHAR(10),
        timezone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Matches table
    console.log('📝 Creating matches table...');
    await query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        cargo1_id INTEGER REFERENCES cargo(id) ON DELETE CASCADE,
        cargo2_id INTEGER REFERENCES cargo(id) ON DELETE CASCADE,
        exchange_point VARCHAR(255),
        cost_savings DECIMAL(10, 2),
        compatibility_score INTEGER DEFAULT 85,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cargo1_id, cargo2_id)
      )
    `);

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');
    await query('CREATE INDEX IF NOT EXISTS idx_cargo_origin_destination ON cargo(origin, destination)');
    await query('CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_cargo_user_id ON cargo(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_cargo_pickup_date ON cargo(pickup_date)');
    await query('CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name)');
    await query('CREATE INDEX IF NOT EXISTS idx_cities_lat_lng ON cities(lat, lng)');
    await query('CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

    // Insert sample admin user
    console.log('👤 Creating sample admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await query(`
      INSERT INTO users (name, email, password, phone, company, address) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@cargoexchange.com', hashedPassword, '+91-9999999999', 'Cargo Exchange Platform', 'Mumbai, Maharashtra']);

    // Get table counts
    console.log('📊 Database statistics:');
    const userCount = await query('SELECT COUNT(*) FROM users');
    const cargoCount = await query('SELECT COUNT(*) FROM cargo');
    const citiesCount = await query('SELECT COUNT(*) FROM cities');
    
    console.log(`   👥 Users: ${userCount.rows[0].count}`);
    console.log(`   📦 Cargo: ${cargoCount.rows[0].count}`);
    console.log(`   🏙️  Cities: ${citiesCount.rows[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('💡 To import Indian cities data, run: node setup/import_cities.js');
    console.log('🚀 To start the server, run: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await closeDB();
  }
}

// Run setup
createTables(); 