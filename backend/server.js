const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Database connection
const connectDB = require('./config/database');

// Models
const User = require('./models/User');
const Cargo = require('./models/Cargo');
const City = require('./models/City');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Helper function to calculate distance and optimal exchange point
function calculateOptimalExchangePoint(origin_coords, dest_coords, origin, destination) {
  if (origin_coords && dest_coords) {
    const mid_lat = (origin_coords.lat + dest_coords.lat) / 2;
    const mid_lng = (origin_coords.lng + dest_coords.lng) / 2;
    
    // Calculate distance (simplified Haversine)
    const dlat = dest_coords.lat - origin_coords.lat;
    const dlng = dest_coords.lng - origin_coords.lng;
    const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // Approximate km
    
    return {
      exchange_point: `Midpoint: ${mid_lat.toFixed(2)}°N, ${mid_lng.toFixed(2)}°E`,
      distance: Math.round(distance),
      coordinates: { lat: mid_lat, lng: mid_lng }
    };
  }
  
  // Fallback for predefined exchange points
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
}

// Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
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
    version: '2.0.0',
    database: 'MongoDB Atlas',
    features: ['User Management', 'Cargo Listings', 'AI Matching', 'Route Optimization', 'Indian Cities Database']
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Create new user
    const user = new User({ name, email, password, phone, company, address });
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'User registered successfully',
      access_token: token,
      user: user.toJSON()
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      access_token: token,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

// Cargo Routes
app.post('/api/cargo', authenticateToken, async (req, res) => {
  try {
    const cargoData = {
      user_id: req.user._id,
      cargo_type: req.body.cargo_type,
      origin: req.body.origin,
      destination: req.body.destination,
      origin_coords: req.body.origin_coords,
      destination_coords: req.body.destination_coords,
      weight: parseFloat(req.body.weight),
      volume: parseFloat(req.body.volume || 0),
      special_requirements: req.body.special_requirements || '',
      pickup_date: new Date(req.body.pickup_date),
      delivery_date: new Date(req.body.delivery_date),
      budget: parseFloat(req.body.budget),
      priority: req.body.priority || 'medium'
    };
    
    const cargo = new Cargo(cargoData);
    await cargo.save();
    
    res.status(201).json({
      message: 'Cargo listing created successfully',
      cargo: cargo
    });
    
  } catch (error) {
    console.error('Cargo creation error:', error);
    res.status(500).json({ error: 'Failed to create cargo listing: ' + error.message });
  }
});

app.get('/api/cargo', async (req, res) => {
  try {
    const cargo = await Cargo.find({ status: 'active' })
      .populate('user_id', 'name email phone company')
      .sort({ createdAt: -1 });
    
    res.json(cargo);
  } catch (error) {
    console.error('Cargo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cargo: ' + error.message });
  }
});

app.get('/api/cargo/:id', async (req, res) => {
  try {
    const cargo = await Cargo.findById(req.params.id)
      .populate('user_id', 'name email phone company');
    
    if (!cargo) {
      return res.status(404).json({ error: 'Cargo not found' });
    }
    
    res.json(cargo);
  } catch (error) {
    console.error('Cargo fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cargo: ' + error.message });
  }
});

// Matches Routes
app.get('/api/matches', async (req, res) => {
  try {
    const allCargo = await Cargo.find({ status: 'active' })
      .populate('user_id', 'name email phone company');
    
    const matches = [];
    
    for (let i = 0; i < allCargo.length; i++) {
      for (let j = i + 1; j < allCargo.length; j++) {
        const cargo1 = allCargo[i];
        const cargo2 = allCargo[j];
        
        // Check for A→C and C→A pattern
        if (cargo1.origin === cargo2.destination && cargo1.destination === cargo2.origin) {
          const exchangeInfo = calculateOptimalExchangePoint(
            cargo1.origin_coords,
            cargo1.destination_coords,
            cargo1.origin,
            cargo1.destination
          );
          
          const avgBudget = (cargo1.budget + cargo2.budget) / 2;
          const costSavings = Math.round(avgBudget * 0.3);
          
          matches.push({
            id: matches.length + 1,
            cargo1_id: cargo1._id,
            cargo2_id: cargo2._id,
            cargo1_route: `${cargo1.origin} → ${cargo1.destination}`,
            cargo2_route: `${cargo2.origin} → ${cargo2.destination}`,
            exchange_point: exchangeInfo.exchange_point,
            distance: exchangeInfo.distance,
            cost_savings: costSavings,
            compatibility_score: 85,
            status: 'pending',
            cargo1_details: {
              type: cargo1.cargo_type,
              weight: cargo1.weight,
              pickup_date: cargo1.pickup_date,
              user: cargo1.user_id
            },
            cargo2_details: {
              type: cargo2.cargo_type,
              weight: cargo2.weight,
              pickup_date: cargo2.pickup_date,
              user: cargo2.user_id
            }
          });
        }
      }
    }
    
    res.json(matches);
  } catch (error) {
    console.error('Matches fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch matches: ' + error.message });
  }
});

app.post('/api/find-matches', async (req, res) => {
  try {
    const activeCargoCount = await Cargo.countDocuments({ status: 'active' });
    const matches = await Cargo.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'cargos',
          let: { origin: '$origin', destination: '$destination', id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$origin', '$$destination'] },
                    { $eq: ['$destination', '$$origin'] },
                    { $ne: ['$_id', '$$id'] },
                    { $eq: ['$status', 'active'] }
                  ]
                }
              }
            }
          ],
          as: 'matches'
        }
      },
      { $match: { 'matches.0': { $exists: true } } }
    ]);
    
    const matchCount = matches.length;
    
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

// Cities API (using the imported cities data)
app.get('/api/cities/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const cities = await City.searchByName(query, 20);
    res.json(cities);
  } catch (error) {
    console.error('City search error:', error);
    res.status(500).json({ error: 'City search failed: ' + error.message });
  }
});

app.get('/api/cities/major', async (req, res) => {
  try {
    const cities = await City.getMajorCities(50);
    res.json(cities);
  } catch (error) {
    console.error('Major cities error:', error);
    res.status(500).json({ error: 'Failed to fetch major cities: ' + error.message });
  }
});

app.get('/api/cities/nearest/:lat/:lng', async (req, res) => {
  try {
    const lat = parseFloat(req.params.lat);
    const lng = parseFloat(req.params.lng);
    const city = await City.findNearest(lat, lng);
    res.json(city);
  } catch (error) {
    console.error('Nearest city error:', error);
    res.status(500).json({ error: 'Failed to find nearest city: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Cargo Exchange Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}`);
  console.log(`🗄️  Database: MongoDB Atlas`);
  console.log(`🔗 Frontend URL: http://localhost:3000`);
}); 