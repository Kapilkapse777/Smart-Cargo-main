const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Database and configuration
const { connectDB, query } = require('./database');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Connect to PostgreSQL database
connectDB();

// Helper functions
const calculateOptimalExchangePoint = (origin_coords, dest_coords, origin, destination) => {
  if (origin_coords && dest_coords) {
    const mid_lat = (origin_coords.lat + dest_coords.lat) / 2;
    const mid_lng = (origin_coords.lng + dest_coords.lng) / 2;
    
    const dlat = dest_coords.lat - origin_coords.lat;
    const dlng = dest_coords.lng - origin_coords.lng;
    const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // Approximate km
    
    return {
      exchange_point: `Midpoint: ${mid_lat.toFixed(2)}°N, ${mid_lng.toFixed(2)}°E`,
      distance: Math.round(distance),
      coordinates: { lat: mid_lat, lng: mid_lng }
    };
  }
  
  const exchangePoints = {
    'Mumbai-Delhi': 'Udaipur (Rajasthan)',
    'Delhi-Mumbai': 'Udaipur (Rajasthan)',
    'Pune-Nagpur': 'Aurangabad (Maharashtra)',
    'Nagpur-Pune': 'Aurangabad (Maharashtra)',
    'Bangalore-Chennai': 'Hosur (Tamil Nadu)',
    'Chennai-Bangalore': 'Hosur (Tamil Nadu)'
  };
  
  const key = `${origin}-${destination}`;
  return {
    exchange_point: exchangePoints[key] || `Midpoint between ${origin} and ${destination}`,
    distance: 500,
    coordinates: null
  };
};

// Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes

// Home route
app.get('/', (req, res) => {
  res.json({
    message: '🚚 Smart Cargo Exchange Platform API',
    version: '3.0.0',
    database: 'PostgreSQL',
    hosting: 'Production Ready',
    features: ['User Management', 'Cargo Listings', 'AI Matching', 'Route Optimization', 'Indian Cities Database'],
    endpoints: {
      auth: ['/api/auth/register', '/api/auth/login', '/api/auth/profile'],
      cargo: ['/api/cargo', '/api/cargo/:id'],
      matches: ['/api/matches', '/api/find-matches'],
      routes: ['/api/optimize-route', '/api/find-exchange-point'],
      cities: ['/api/cities/search/:query', '/api/cities/major', '/api/cities/nearest/:lat/:lng']
    }
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, company, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const result = await query(`
      INSERT INTO users (name, email, password, phone, company, address) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, email, phone, company, address, created_at
    `, [name, email, hashedPassword, phone, company, address]);
    
    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    
    res.status(201).json({
      message: 'User registered successfully',
      access_token: token,
      user: user
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    
    // Remove password from response
    delete user.password;
    
    res.json({
      message: 'Login successful',
      access_token: token,
      user: user
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = { ...req.user };
  delete user.password;
  res.json({ user });
});

// Cargo Routes
app.post('/api/cargo', authenticateToken, async (req, res) => {
  try {
    const {
      cargo_type, origin, destination, origin_coords, destination_coords,
      weight, volume, special_requirements, pickup_date, delivery_date, budget, priority
    } = req.body;
    
    const result = await query(`
      INSERT INTO cargo (
        user_id, cargo_type, origin, destination, 
        origin_lat, origin_lng, destination_lat, destination_lng,
        weight, volume, special_requirements, pickup_date, delivery_date, budget, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      req.user.id, cargo_type, origin, destination,
      origin_coords?.lat, origin_coords?.lng, destination_coords?.lat, destination_coords?.lng,
      parseFloat(weight), parseFloat(volume || 0), special_requirements || '',
      pickup_date, delivery_date, parseFloat(budget), priority || 'medium'
    ]);
    
    res.status(201).json({
      message: 'Cargo listing created successfully',
      cargo: result.rows[0]
    });
    
  } catch (error) {
    console.error('Cargo creation error:', error);
    res.status(500).json({ error: 'Failed to create cargo listing: ' + error.message });
  }
});

app.get('/api/cargo', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.company as user_company
      FROM cargo c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Cargo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cargo: ' + error.message });
  }
});

app.get('/api/cargo/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.company as user_company
      FROM cargo c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cargo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cargo: ' + error.message });
  }
});

// Matches Routes
app.get('/api/matches', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c1.id as cargo1_id, c1.origin as c1_origin, c1.destination as c1_destination,
        c1.cargo_type as c1_type, c1.weight as c1_weight, c1.pickup_date as c1_pickup,
        c1.user_id as c1_user_id,
        c2.id as cargo2_id, c2.origin as c2_origin, c2.destination as c2_destination,
        c2.cargo_type as c2_type, c2.weight as c2_weight, c2.pickup_date as c2_pickup,
        c2.user_id as c2_user_id,
        u1.name as c1_user_name, u1.email as c1_user_email, u1.phone as c1_user_phone, u1.company as c1_user_company,
        u2.name as c2_user_name, u2.email as c2_user_email, u2.phone as c2_user_phone, u2.company as c2_user_company
      FROM cargo c1
      JOIN cargo c2 ON (c1.origin = c2.destination AND c1.destination = c2.origin)
      JOIN users u1 ON c1.user_id = u1.id
      JOIN users u2 ON c2.user_id = u2.id
      WHERE c1.status = 'active' AND c2.status = 'active' AND c1.id < c2.id
      ORDER BY c1.created_at DESC
    `);
    
    const matches = result.rows.map((row, index) => {
      const exchangeInfo = calculateOptimalExchangePoint(
        { lat: row.c1_origin_lat, lng: row.c1_origin_lng },
        { lat: row.c1_destination_lat, lng: row.c1_destination_lng },
        row.c1_origin,
        row.c1_destination
      );
      
      return {
        id: index + 1,
        cargo1_id: row.cargo1_id,
        cargo2_id: row.cargo2_id,
        cargo1_route: `${row.c1_origin} → ${row.c1_destination}`,
        cargo2_route: `${row.c2_origin} → ${row.c2_destination}`,
        exchange_point: exchangeInfo.exchange_point,
        distance: exchangeInfo.distance,
        cost_savings: Math.round(Math.random() * 5000 + 3000),
        compatibility_score: 85,
        status: 'pending',
        cargo1_details: {
          type: row.c1_type,
          weight: row.c1_weight,
          pickup_date: row.c1_pickup,
          user: {
            id: row.c1_user_id,
            name: row.c1_user_name,
            email: row.c1_user_email,
            phone: row.c1_user_phone,
            company: row.c1_user_company
          }
        },
        cargo2_details: {
          type: row.c2_type,
          weight: row.c2_weight,
          pickup_date: row.c2_pickup,
          user: {
            id: row.c2_user_id,
            name: row.c2_user_name,
            email: row.c2_user_email,
            phone: row.c2_user_phone,
            company: row.c2_user_company
          }
        }
      };
    });
    
    res.json(matches);
  } catch (error) {
    console.error('Matches fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch matches: ' + error.message });
  }
});

app.post('/api/find-matches', async (req, res) => {
  try {
    const activeCargoResult = await query('SELECT COUNT(*) FROM cargo WHERE status = $1', ['active']);
    const matchesResult = await query(`
      SELECT COUNT(*) FROM cargo c1
      JOIN cargo c2 ON (c1.origin = c2.destination AND c1.destination = c2.origin)
      WHERE c1.status = 'active' AND c2.status = 'active' AND c1.id < c2.id
    `);
    
    const activeCargoCount = parseInt(activeCargoResult.rows[0].count);
    const matchCount = parseInt(matchesResult.rows[0].count);
    
    res.json({
      message: `Found ${matchCount} new matches!`,
      matches_found: matchCount,
      total_cargo: activeCargoCount
    });
  } catch (error) {
    console.error('Find matches error:', error);
    res.status(500).json({ error: 'Failed to find matches: ' + error.message });
  }
});

// Route Optimization
app.post('/api/optimize-route', async (req, res) => {
  try {
    const { origin, destination, origin_coords, destination_coords, cargo_weight, vehicle_type, fuel_efficiency } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination required' });
    }
    
    const weight = parseFloat(cargo_weight || 1000);
    const efficiency = parseFloat(fuel_efficiency || 6);
    
    let distance = 500; // Default
    
    if (origin_coords && destination_coords) {
      const dlat = destination_coords.lat - origin_coords.lat;
      const dlng = destination_coords.lng - origin_coords.lng;
      distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // Approximate km
    }
    
    // Calculate costs (Indian rates)
    const fuelCost = (distance / efficiency) * 95; // ₹95 per liter diesel
    const tollCost = distance * 2.5; // ₹2.5 per km average toll
    const driverCost = distance * 8; // ₹8 per km driver cost
    const totalCost = fuelCost + tollCost + driverCost;
    
    // Calculate time
    const avgSpeed = 50; // km/h
    const estimatedHours = distance / avgSpeed;
    const estimatedTime = `${Math.floor(estimatedHours)}h ${Math.floor((estimatedHours % 1) * 60)}m`;
    
    res.json({
      route: `${origin} → ${destination}`,
      distance: Math.round(distance * 10) / 10,
      estimated_time: estimatedTime,
      fuel_cost: Math.round(fuelCost),
      toll_cost: Math.round(tollCost),
      driver_cost: Math.round(driverCost),
      total_cost: Math.round(totalCost),
      recommendations: [
        'Consider travel during off-peak hours to avoid traffic',
        'Plan fuel stops at competitive stations',
        'Check for alternate routes to avoid heavy traffic',
        `Vehicle type '${vehicle_type || 'truck'}' is suitable for ${weight}kg cargo`
      ]
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Route optimization failed: ' + error.message });
  }
});

// Exchange Point Finding
app.post('/api/find-exchange-point', async (req, res) => {
  try {
    const { route1, route2 } = req.body;
    
    if (!route1 || !route2 || !route1.origin || !route1.destination || !route2.origin || !route2.destination) {
      return res.status(400).json({ error: 'Both routes must have origin and destination' });
    }
    
    const exchangeInfo = calculateOptimalExchangePoint(
      route1.origin_coords,
      route1.destination_coords,
      route1.origin,
      route1.destination
    );
    
    res.json({
      route1: `${route1.origin} → ${route1.destination}`,
      route2: `${route2.origin} → ${route2.destination}`,
      exchange_point: exchangeInfo.exchange_point,
      distance: exchangeInfo.distance,
      cost_savings: 5000,
      coordinates: exchangeInfo.coordinates,
      recommendations: [
        'Both parties meet at the exchange point',
        'Swap cargo containers/packages',
        'Continue to respective final destinations',
        'Coordinate timing for simultaneous arrival'
      ]
    });
    
  } catch (error) {
    console.error('Exchange point error:', error);
    res.status(500).json({ error: 'Exchange point calculation failed: ' + error.message });
  }
});

// Cities API
app.get('/api/cities/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const result = await query(`
      SELECT * FROM cities 
      WHERE name ILIKE $1 OR asciiname ILIKE $1
      ORDER BY population DESC
      LIMIT 20
    `, [`%${searchQuery}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('City search error:', error);
    res.status(500).json({ error: 'City search failed: ' + error.message });
  }
});

app.get('/api/cities/major', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM cities 
      WHERE population > 100000
      ORDER BY population DESC
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Major cities error:', error);
    res.status(500).json({ error: 'Failed to fetch major cities: ' + error.message });
  }
});

app.get('/api/cities/nearest/:lat/:lng', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    
    const result = await query(`
      SELECT *, 
        SQRT(POWER(lat - $1, 2) + POWER(lng - $2, 2)) as distance
      FROM cities
      WHERE lat BETWEEN $1 - 0.5 AND $1 + 0.5
        AND lng BETWEEN $2 - 0.5 AND $2 + 0.5
      ORDER BY population DESC, distance ASC
      LIMIT 1
    `, [lat, lng]);
    
    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Nearest city error:', error);
    res.status(500).json({ error: 'Failed to find nearest city: ' + error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: config.server.environment
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.server.environment === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Cargo Exchange Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database: PostgreSQL`);
  console.log(`🌐 Environment: ${config.server.environment}`);
  console.log(`🔗 Frontend URL: ${config.cors.origin}`);
  console.log(`\n📚 API Documentation: http://localhost:${PORT}/`);
});

module.exports = app; 