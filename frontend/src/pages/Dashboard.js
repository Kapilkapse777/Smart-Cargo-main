import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCargo: 0,
    activeMatches: 0,
    completedExchanges: 0,
    potentialSavings: 0
  });
  const [recentCargo, setRecentCargo] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch user's cargo
      const cargoResponse = await axios.get('/api/cargo', { headers });
      setRecentCargo(cargoResponse.data.slice(0, 3));
      
      // Fetch matches
      const matchesResponse = await axios.get('/api/matches', { headers });
      setRecentMatches(matchesResponse.data.slice(0, 3));
      
      // Calculate stats
      setStats({
        totalCargo: cargoResponse.data.length,
        activeMatches: matchesResponse.data.filter(m => m.status === 'pending').length,
        completedExchanges: matchesResponse.data.filter(m => m.status === 'accepted').length,
        potentialSavings: matchesResponse.data.reduce((sum, m) => sum + (m.cost_savings || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, color = 'primary' }) => (
    <Card sx={{ minHeight: 120 }}>
      <CardContent>
        <Typography color="textSecondary" gutterBottom variant="h6">
          {title}
        </Typography>
        <Typography variant="h4" color={color}>
          {typeof value === 'number' && value > 1000 ? `₹${(value/1000).toFixed(1)}K` : value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}! 👋
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Cargo" value={stats.totalCargo} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Matches" value={stats.activeMatches} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed" value={stats.completedExchanges} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Savings" value={`₹${stats.potentialSavings.toLocaleString()}`} color="secondary" />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/create-cargo')}
              >
                Create New Cargo
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/cargo')}
              >
                View All Cargo
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/matches')}
              >
                Check Matches
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/route-optimizer')}
              >
                Route Optimizer
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Cargo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Cargo
            </Typography>
            {recentCargo.length > 0 ? (
              recentCargo.map((cargo) => (
                <Box key={cargo.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{cargo.cargo_type}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {cargo.origin} → {cargo.destination}
                  </Typography>
                  <Chip 
                    label={cargo.status} 
                    size="small" 
                    color={cargo.status === 'active' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))
            ) : (
              <Typography color="textSecondary">No cargo listings yet</Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Matches */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Matches
            </Typography>
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => (
                <Box key={match.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle1">
                    Match #{match.id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
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
              <Typography color="textSecondary">No matches found yet</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 