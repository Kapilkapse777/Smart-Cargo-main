import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CargoList = () => {
  const [cargo, setCargo] = useState([]);
  const [filteredCargo, setFilteredCargo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    cargo_type: '',
    status: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCargo();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cargo, filters]);

  const fetchCargo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/cargo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCargo(response.data);
    } catch (err) {
      setError('Failed to fetch cargo listings');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = cargo;
    
    if (filters.origin) {
      filtered = filtered.filter(item => 
        item.origin.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }
    
    if (filters.destination) {
      filtered = filtered.filter(item => 
        item.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }
    
    if (filters.cargo_type) {
      filtered = filtered.filter(item => item.cargo_type === filters.cargo_type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    setFilteredCargo(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const clearFilters = () => {
    setFilters({
      origin: '',
      destination: '',
      cargo_type: '',
      status: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'matched': return 'warning';
      case 'completed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Cargo Listings
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/create-cargo')}
        >
          Create New Listing
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                name="origin"
                label="Origin"
                value={filters.origin}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                name="destination"
                label="Destination"
                value={filters.destination}
                onChange={handleFilterChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                name="cargo_type"
                label="Cargo Type"
                value={filters.cargo_type}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Textiles">Textiles</MenuItem>
                <MenuItem value="Automotive Parts">Automotive Parts</MenuItem>
                <MenuItem value="Food & Beverages">Food & Beverages</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                select
                name="status"
                label="Status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="matched">Matched</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button onClick={clearFilters} size="small">
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Cargo Grid */}
      <Grid container spacing={3}>
        {filteredCargo.length > 0 ? (
          filteredCargo.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {item.cargo_type}
                    </Typography>
                    <Chip 
                      label={item.status} 
                      color={getStatusColor(item.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Route:</strong> {item.origin} → {item.destination}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Weight:</strong> {item.weight} kg
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Budget:</strong> ₹{item.budget?.toLocaleString()}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Pickup:</strong> {new Date(item.pickup_date).toLocaleDateString()}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Delivery:</strong> {new Date(item.delivery_date).toLocaleDateString()}
                  </Typography>
                  
                  {item.special_requirements && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      <strong>Requirements:</strong> {item.special_requirements}
                    </Typography>
                  )}
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(`/cargo/${item.id}`)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Typography variant="h6" align="center" color="text.secondary">
              No cargo listings found
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default CargoList; 