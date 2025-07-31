import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="body1" align="center">
          © 2024 India Cargo Exchange Platform
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Revolutionizing logistics through AI-powered route optimization
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Privacy Policy
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Terms of Service
          </Link>
          <Link href="#" color="inherit" sx={{ mx: 1 }}>
            Contact
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 