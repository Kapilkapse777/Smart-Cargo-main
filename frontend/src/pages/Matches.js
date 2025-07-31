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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import axios from 'axios';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/matches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data);
    } catch (err) {
      setError('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const findNewMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/find-matches', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(`Found ${response.data.matches_found} new matches!`);
      fetchMatches();
    } catch (err) {
      setError('Failed to find new matches');
    } finally {
      setLoading(false);
    }
  };

  const acceptMatch = async (matchId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/matches/${matchId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Match accepted successfully!');
      setDialogOpen(false);
      fetchMatches();
    } catch (err) {
      setError('Failed to accept match');
    }
  };

  const rejectMatch = async (matchId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/matches/${matchId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Match rejected');
      setDialogOpen(false);
      fetchMatches();
    } catch (err) {
      setError('Failed to reject match');
    }
  };

  const openMatchDialog = (match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'primary';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Cargo Matches
        </Typography>
        <Button
          variant="contained"
          onClick={findNewMatches}
          disabled={loading}
        >
          {loading ? 'Finding...' : 'Find New Matches'}
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {matches.length > 0 ? (
          matches.map((match) => (
            <Grid item xs={12} md={6} lg={4} key={match.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      Match #{match.id}
                    </Typography>
                    <Chip 
                      label={getStatusText(match.status)} 
                      color={getStatusColor(match.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Routes:</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Route 1: {match.cargo1_route || 'Loading...'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Route 2: {match.cargo2_route || 'Loading...'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    <strong>Exchange Point:</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {match.exchange_point || 'Calculating optimal point...'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                    <strong>Potential Savings:</strong>
                  </Typography>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    ₹{match.cost_savings?.toLocaleString() || 0}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Compatibility Score:</strong> {match.compatibility_score || 'N/A'}%
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Created:</strong> {new Date(match.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => openMatchDialog(match)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No matches found yet
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Create more cargo listings or click "Find New Matches" to discover opportunities
                </Typography>
                <Button
                  variant="contained"
                  onClick={findNewMatches}
                  sx={{ mt: 2 }}
                >
                  Find Matches
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Match Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Match #{selectedMatch?.id} Details
        </DialogTitle>
        <DialogContent>
          {selectedMatch && (
            <Box>
              <Typography variant="h6" gutterBottom>Route Information</Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Route 1:</strong> {selectedMatch.cargo1_route}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Route 2:</strong> {selectedMatch.cargo2_route}
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Exchange Details</Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Optimal Exchange Point:</strong> {selectedMatch.exchange_point}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total Cost Savings:</strong> ₹{selectedMatch.cost_savings?.toLocaleString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Compatibility Score:</strong> {selectedMatch.compatibility_score}%
              </Typography>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Benefits</Typography>
              <Typography variant="body2" gutterBottom>
                • Reduced fuel costs by sharing routes
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Lower carbon footprint
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Optimized delivery schedules
              </Typography>
              <Typography variant="body2" gutterBottom>
                • Mutual cost savings for both parties
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedMatch?.status === 'pending' && (
            <>
              <Button 
                onClick={() => rejectMatch(selectedMatch.id)} 
                color="error"
              >
                Reject
              </Button>
              <Button 
                onClick={() => acceptMatch(selectedMatch.id)} 
                variant="contained"
                color="success"
              >
                Accept Match
              </Button>
            </>
          )}
          <Button onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Matches; 