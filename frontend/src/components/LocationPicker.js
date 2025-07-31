import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper
} from '@mui/material';

const LocationPicker = ({ onLocationSelect, label, defaultValue = '' }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(defaultValue);
  const searchInputRef = useRef(null);

  useEffect(() => {
    // Initialize Google Maps when component mounts
    if (window.google && mapRef.current) {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    // Default to India center
    const defaultCenter = { lat: 20.5937, lng: 78.9629 };
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    setMap(mapInstance);

    // Initialize search box
    if (searchInputRef.current) {
      const searchBoxInstance = new window.google.maps.places.SearchBox(searchInputRef.current);
      setSearchBox(searchBoxInstance);

      // Bias the SearchBox results towards current map's viewport
      mapInstance.addListener('bounds_changed', () => {
        searchBoxInstance.setBounds(mapInstance.getBounds());
      });

      // Listen for the event fired when the user selects a prediction
      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();
        if (places.length === 0) return;

        const place = places[0];
        handlePlaceSelect(place);
      });
    }

    // Add click listener to map
    mapInstance.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Reverse geocoding to get address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const place = {
            geometry: { location: { lat: () => lat, lng: () => lng } },
            formatted_address: results[0].formatted_address,
            name: results[0].formatted_address
          };
          handlePlaceSelect(place);
        }
      });
    });
  };

  const handlePlaceSelect = (place) => {
    if (!place.geometry || !place.geometry.location) return;

    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address || place.name,
      placeId: place.place_id
    };

    setSelectedLocation(location.address);

    // Clear existing marker
    if (marker) {
      marker.setMap(null);
    }

    // Add new marker
    const newMarker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.address
    });

    setMarker(newMarker);

    // Center map on selected location
    map.setCenter({ lat: location.lat, lng: location.lng });
    map.setZoom(12);

    // Call parent callback
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      
      <TextField
        ref={searchInputRef}
        fullWidth
        placeholder="Search for a location in India..."
        value={selectedLocation}
        onChange={(e) => setSelectedLocation(e.target.value)}
        sx={{ mb: 2 }}
      />
      
      <Box
        ref={mapRef}
        sx={{
          width: '100%',
          height: 300,
          border: '1px solid #ddd',
          borderRadius: 1
        }}
      />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        🔍 Search above or click on the map to select a location
      </Typography>
    </Paper>
  );
};

export default LocationPicker; 