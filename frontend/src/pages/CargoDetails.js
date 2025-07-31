import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  Divider
} from '@mui/material';
import axios from 'axios';

const CargoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCargoDetails();
    fetchMatches();
  }, [id]);

  const fetchCargoDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/cargo/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCargo(response.data);
    } catch (err) {
      setError('Failed to fetch cargo details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter matches for this cargo
      const cargoMatches = response.data.filter(match => 
        match.cargo1_id === parseInt(id) || match.cargo2_id === parseInt(id)
      );
      setMatches(cargoMatches);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    }
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
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!cargo) return <Alert severity="error">Cargo not found</Alert>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Cargo Details
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/cargo')}
        >
          Back to List
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Cargo Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h5" component="h1">
                  {cargo.cargo_type}
                </Typography>
                <Chip 
                  label={cargo.status} 
                  color={getStatusColor(cargo.status)}
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Origin
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {cargo.origin}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Destination
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {cargo.destination}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Weight
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {cargo.weight} kg
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Volume
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {cargo.volume || 'Not specified'} cubic meters
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Budget
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    ₹{cargo.budget?.toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(cargo.created_at).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pickup Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(cargo.pickup_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(cargo.delivery_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                
                {cargo.special_requirements && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Special Requirements
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {cargo.special_requirements}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Matches and Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/matches')}
                >
                  Find Matches
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/route-optimizer')}
                >
                  Optimize Route
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Related Matches ({matches.length})
              </Typography>
              {matches.length > 0 ? (
                matches.map((match, index) => (
                  <Box key={match.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Match #{match.id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exchange Point: {match.exchange_point || 'Calculating...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Potential Savings: ₹{match.cost_savings?.toLocaleString() || 0}
                    </Typography>
                    <Chip 
                      label={match.status} 
                      size="small" 
                      color={match.status === 'accepted' ? 'success' : 'warning'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No matches found yet. Check back later or create more cargo listings.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CargoDetails; 