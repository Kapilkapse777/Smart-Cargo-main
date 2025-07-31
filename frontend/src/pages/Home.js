import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Route,
  Savings,
  Analytics,
  Security,
  Support,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      title: 'Smart Cargo Matching',
      description: 'AI-powered algorithm finds compatible routes for cargo exchange, maximizing efficiency and reducing costs.',
      color: '#1976d2',
    },
    {
      icon: <Route sx={{ fontSize: 40 }} />,
      title: 'Route Optimization',
      description: 'Advanced route planning with real-time traffic, toll calculations, and fuel cost optimization.',
      color: '#2e7d32',
    },
    {
      icon: <Savings sx={{ fontSize: 40 }} />,
      title: 'Cost Savings',
      description: 'Reduce transportation costs by up to 40% through intelligent cargo matching and route optimization.',
      color: '#ed6c02',
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboard with live tracking, performance metrics, and cost analysis.',
      color: '#9c27b0',
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure Platform',
      description: 'Enterprise-grade security with verified users, secure payments, and data protection.',
      color: '#d32f2f',
    },
    {
      icon: <Support sx={{ fontSize: 40 }} />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all your logistics and transportation needs.',
      color: '#1976d2',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', color: '#1976d2' },
    { label: 'Cities Covered', value: '500+', color: '#2e7d32' },
    { label: 'Cost Savings', value: '₹50Cr+', color: '#ed6c02' },
    { label: 'Successful Matches', value: '25,000+', color: '#9c27b0' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2,
                }}
              >
                Smart Cargo Exchange Platform
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 300,
                }}
              >
                Connect with transporters across India. Optimize routes, reduce costs, and maximize efficiency with AI-powered cargo matching.
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:hover': {
                        bgcolor: 'grey.100',
                      },
                    }}
                  >
                    Go to Dashboard
                    <ArrowForward sx={{ ml: 1 }} />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          bgcolor: 'grey.100',
                        },
                      }}
                    >
                      Get Started
                      <ArrowForward sx={{ ml: 1 }} />
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        '&:hover': {
                          borderColor: 'white',
                          bgcolor: 'rgba(255,255,255,0.1)',
                        },
                      }}
                    >
                      Login
                    </Button>
                  </>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 400,
                }}
              >
                <LocalShipping
                  sx={{
                    fontSize: 300,
                    opacity: 0.3,
                    color: 'white',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: 6, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 6 }}
          >
            Why Choose Our Platform?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        color: feature.color,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h5"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Ready to Optimize Your Logistics?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                opacity: 0.9,
                fontWeight: 300,
              }}
            >
              Join thousands of transporters and shippers who are already saving money and time with our platform.
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              flexWrap="wrap"
            >
              <Chip
                label="AI-Powered Matching"
                color="secondary"
                sx={{ fontSize: '1rem', py: 1 }}
              />
              <Chip
                label="Real-time Tracking"
                color="secondary"
                sx={{ fontSize: '1rem', py: 1 }}
              />
              <Chip
                label="Cost Optimization"
                color="secondary"
                sx={{ fontSize: '1rem', py: 1 }}
              />
              <Chip
                label="India-wide Coverage"
                color="secondary"
                sx={{ fontSize: '1rem', py: 1 }}
              />
            </Stack>
            <Box sx={{ mt: 4 }}>
              {user ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/cargo/create')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Create Your First Cargo Listing
                  <ArrowForward sx={{ ml: 1 }} />
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    px: 6,
                    py: 2,
                    fontSize: '1.2rem',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Start Free Trial
                  <ArrowForward sx={{ ml: 1 }} />
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 