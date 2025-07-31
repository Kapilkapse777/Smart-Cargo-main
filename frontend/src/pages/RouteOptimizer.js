import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  MenuItem,
  Paper,
  Divider
} from '@mui/material';
import axios from 'axios';
import SimpleLocationPicker from '../components/SimpleLocationPicker';

const RouteOptimizer = () => {
  const [routeData, setRouteData] = useState({
    origin: '',
    destination: '',
    origin_coords: null,
    destination_coords: null,
    cargo_weight: '',
    vehicle_type: 'truck',
    fuel_efficiency: '6'
  });
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
    'Coimbatore', 'Ludhiana', 'Agra', 'Nashik', 'Kochi', 'Trivandrum'
  ];

  const vehicleTypes = [
    { value: 'truck', label: 'Truck (10-40 tons)' },
    { value: 'trailer', label: 'Trailer (40+ tons)' },
    { value: 'mini_truck', label: 'Mini Truck (1-10 tons)' },
    { value: 'tempo', label: 'Tempo (0.5-3 tons)' }
  ];

  const handleChange = (e) => {
    setRouteData({
      ...routeData,
      [e.target.name]: e.target.value
    });
  };

  const handleOriginSelect = (location) => {
    setRouteData({
      ...routeData,
      origin: location.address,
      origin_coords: { lat: location.lat, lng: location.lng }
    });
  };

  const handleDestinationSelect = (location) => {
    setRouteData({
      ...routeData,
      destination: location.address,
      destination_coords: { lat: location.lat, lng: location.lng }
    });
  };

  const optimizeRoute = async () => {
    if (!routeData.origin || !routeData.destination) {
      setError('Please select both origin and destination');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/optimize-route', routeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOptimization(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to optimize route');
    } finally {
      setLoading(false);
    }
  };

  const findExchangePoint = async () => {
    if (!routeData.origin || !routeData.destination) {
      setError('Please select both origin and destination');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      // Simulate finding an exchange point by creating a reverse route
      const reverseRoute = {
        origin: routeData.destination,
        destination: routeData.origin,
        cargo_weight: routeData.cargo_weight,
        vehicle_type: routeData.vehicle_type
      };

      const response = await axios.post('http://localhost:5000/api/find-exchange-point', {
        route1: routeData,
        route2: reverseRoute
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOptimization(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to find exchange point');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Route Optimizer & Exchange Point Finder
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Optimize your transportation routes and find optimal exchange points for cargo swapping
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Input Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Route Information
              </Typography>
              
              <TextField
                fullWidth
                select
                margin="normal"
                name="origin"
                label="Origin City"
                value={routeData.origin}
                onChange={handleChange}
              >
                {indianCities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                select
                margin="normal"
                name="destination"
                label="Destination City"
                value={routeData.destination}
                onChange={handleChange}
              >
                {indianCities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                margin="normal"
                name="cargo_weight"
                label="Cargo Weight (kg)"
                type="number"
                value={routeData.cargo_weight}
                onChange={handleChange}
              />
              
              <TextField
                fullWidth
                select
                margin="normal"
                name="vehicle_type"
                label="Vehicle Type"
                value={routeData.vehicle_type}
                onChange={handleChange}
              >
                {vehicleTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                margin="normal"
                name="fuel_efficiency"
                label="Fuel Efficiency (km/liter)"
                type="number"
                value={routeData.fuel_efficiency}
                onChange={handleChange}
                helperText="Average fuel consumption of your vehicle"
              />
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={optimizeRoute}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Optimizing...' : 'Optimize Route'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={findExchangePoint}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Finding...' : 'Find Exchange Point'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Results
              </Typography>
              
              {optimization ? (
                <Box>
                  {optimization.route && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Route: {optimization.route}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                    </>
                  )}
                  
                  {optimization.distance && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Distance:</strong> {optimization.distance} km
                    </Typography>
                  )}
                  
                  {optimization.estimated_time && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Estimated Time:</strong> {optimization.estimated_time}
                    </Typography>
                  )}
                  
                  {optimization.fuel_cost && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Fuel Cost:</strong> ₹{optimization.fuel_cost.toLocaleString()}
                    </Typography>
                  )}
                  
                  {optimization.toll_cost && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Toll Cost:</strong> ₹{optimization.toll_cost.toLocaleString()}
                    </Typography>
                  )}
                  
                  {optimization.driver_cost && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Driver Cost:</strong> ₹{optimization.driver_cost.toLocaleString()}
                    </Typography>
                  )}
                  
                  {optimization.total_cost && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" color="primary" gutterBottom>
                        <strong>Total Cost: ₹{optimization.total_cost.toLocaleString()}</strong>
                      </Typography>
                    </>
                  )}
                  
                  {optimization.exchange_point && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        <strong>Optimal Exchange Point:</strong>
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {optimization.exchange_point}
                      </Typography>
                    </>
                  )}
                  
                  {optimization.cost_savings && (
                    <Typography variant="h6" color="success.main" gutterBottom>
                      <strong>Potential Savings: ₹{optimization.cost_savings.toLocaleString()}</strong>
                    </Typography>
                  )}
                  
                  {optimization.recommendations && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Recommendations:
                      </Typography>
                      {optimization.recommendations.map((rec, index) => (
                        <Typography key={index} variant="body2" gutterBottom>
                          • {rec}
                        </Typography>
                      ))}
                    </>
                  )}
                </Box>
              ) : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="body1" color="text.secondary">
                    Enter route details and click "Optimize Route" to see results
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How Route Optimization Works
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    🛣️ Route Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analyzes multiple route options considering traffic, road conditions, and distance
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    💰 Cost Calculation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Calculates fuel, toll, driver, and maintenance costs for accurate pricing
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    🔄 Exchange Point Finding
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Identifies optimal meeting points for cargo exchanges between opposite routes
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RouteOptimizer; 