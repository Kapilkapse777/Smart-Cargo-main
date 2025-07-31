import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateCargo from './pages/CreateCargo';
import CargoList from './pages/CargoList';
import CargoDetails from './pages/CargoDetails';
import Matches from './pages/Matches';
import RouteOptimizer from './pages/RouteOptimizer';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Main App Component
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cargo/create" 
            element={
              <ProtectedRoute>
                <CreateCargo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cargo/list" 
            element={
              <ProtectedRoute>
                <CargoList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cargo/:id" 
            element={
              <ProtectedRoute>
                <CargoDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/matches" 
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/route-optimizer" 
            element={
              <ProtectedRoute>
                <RouteOptimizer />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
};

// App Component with Providers
const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LocalizationProvider>
  );
};

export default App; 