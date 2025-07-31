import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  MenuItem,
  Alert
} from '@mui/material';

const SimpleLocationPicker = ({ onLocationSelect, label, defaultValue = '' }) => {
  const [selectedLocation, setSelectedLocation] = useState(defaultValue);
  const [customLocation, setCustomLocation] = useState('');

  // Major Indian cities with approximate coordinates
  const indianCities = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Vadodara', lat: 22.3072, lng: 73.1812 },
    { name: 'Coimbatore', lat: 11.0168, lng: 76.9558 },
    { name: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
    { name: 'Kochi', lat: 9.9312, lng: 76.2673 },
    { name: 'Trivandrum', lat: 8.5241, lng: 76.9366 }
  ];

  const handleCitySelect = (cityName) => {
    const city = indianCities.find(c => c.name === cityName);
    if (city) {
      setSelectedLocation(city.name);
      if (onLocationSelect) {
        onLocationSelect({
          address: city.name,
          lat: city.lat,
          lng: city.lng
        });
      }
    }
  };

  const handleCustomLocation = () => {
    if (customLocation.trim()) {
      // For demo, assign random coordinates in India
      const randomLat = 20 + Math.random() * 10; // Roughly India's latitude range
      const randomLng = 70 + Math.random() * 15; // Roughly India's longitude range
      
      setSelectedLocation(customLocation);
      if (onLocationSelect) {
        onLocationSelect({
          address: customLocation,
          lat: randomLat,
          lng: randomLng
        });
      }
      setCustomLocation('');
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        🗺️ Demo Mode: Select from major cities or enter custom location
      </Alert>

      <TextField
        fullWidth
        select
        label="Select Major City"
        value={selectedLocation}
        onChange={(e) => handleCitySelect(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="">Select a city...</MenuItem>
        {indianCities.map((city) => (
          <MenuItem key={city.name} value={city.name}>
            📍 {city.name}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Or enter custom location:
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Enter any location in India..."
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCustomLocation()}
        />
        <Button 
          variant="outlined" 
          onClick={handleCustomLocation}
          disabled={!customLocation.trim()}
        >
          Add
        </Button>
      </Box>

      {selectedLocation && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ Selected: <strong>{selectedLocation}</strong>
        </Alert>
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        💡 To use real Google Maps, add your API key to the project
      </Typography>
    </Paper>
  );
};

export default SimpleLocationPicker; 