import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  Grid
} from '@mui/material';
import axios from 'axios';
import SimpleLocationPicker from '../components/SimpleLocationPicker';

const CreateCargo = () => {
  const [formData, setFormData] = useState({
    cargo_type: '',
    origin: '',
    destination: '',
    origin_coords: null,
    destination_coords: null,
    weight: '',
    volume: '',
    pickup_date: '',
    delivery_date: '',
    budget: '',
    special_requirements: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const cargoTypes = [
    'Electronics',
    'Textiles',
    'Automotive Parts',
    'Food & Beverages',
    'Pharmaceuticals',
    'Machinery',
    'Chemicals',
    'Consumer Goods',
    'Raw Materials',
    'Other'
  ];

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
    'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
    'Coimbatore', 'Ludhiana', 'Agra', 'Nashik', 'Kochi', 'Trivandrum'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOriginSelect = (location) => {
    setFormData({
      ...formData,
      origin: location.address,
      origin_coords: { lat: location.lat, lng: location.lng }
    });
  };

  const handleDestinationSelect = (location) => {
    setFormData({
      ...formData,
      destination: location.address,
      destination_coords: { lat: location.lat, lng: location.lng }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/cargo', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Cargo listing created successfully!');
      setTimeout(() => {
        navigate('/cargo');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create cargo listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Create Cargo Listing
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  id="cargo_type"
                  label="Cargo Type"
                  name="cargo_type"
                  value={formData.cargo_type}
                  onChange={handleChange}
                >
                  {cargoTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <SimpleLocationPicker
                  label="📍 Select Origin Location"
                  onLocationSelect={handleOriginSelect}
                  defaultValue={formData.origin}
                />
              </Grid>
              
              <Grid item xs={12}>
                <SimpleLocationPicker
                  label="🎯 Select Destination Location"
                  onLocationSelect={handleDestinationSelect}
                  defaultValue={formData.destination}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="weight"
                  label="Weight (kg)"
                  name="weight"
                  type="number"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="volume"
                  label="Volume (cubic meters)"
                  name="volume"
                  type="number"
                  value={formData.volume}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="budget"
                  label="Budget (₹)"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="pickup_date"
                  label="Pickup Date"
                  name="pickup_date"
                  type="date"
                  value={formData.pickup_date}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="delivery_date"
                  label="Delivery Date"
                  name="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  id="special_requirements"
                  label="Special Requirements"
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  placeholder="Temperature control, fragile handling, etc."
                />
              </Grid>
            </Grid>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Listing...' : 'Create Cargo Listing'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateCargo; 