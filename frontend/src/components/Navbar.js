import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
} from '@mui/material';
import {
  LocalShipping as TruckIcon,
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Add,
  List,
  Map,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Create Cargo', path: '/cargo/create', icon: <Add /> },
    { text: 'Cargo List', path: '/cargo/list', icon: <List /> },
    { text: 'Matches', path: '/matches', icon: <Map /> },
    { text: 'Route Optimizer', path: '/route-optimizer', icon: <Map /> },
  ];

  return (
    <AppBar position="sticky" elevation={1}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo and Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 4,
            }}
            onClick={() => navigate('/')}
          >
            <TruckIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              CARGO EXCHANGE
            </Typography>
          </Box>

          {/* Navigation Links - Desktop */}
          {user && (
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  sx={{
                    my: 2,
                    color: 'white',
                    display: 'block',
                    mx: 1,
                    backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            {user ? (
              <>
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {user.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                    <Dashboard sx={{ mr: 1 }} />
                    Dashboard
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      border: '1px solid rgba(255,255,255,0.5)',
                    },
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/register')}
                >
                  Register
                </Button>
              </Box>
            )}
          </Box>

          {/* Mobile Menu */}
          {user && (
            <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}>
              <IconButton
                size="large"
                aria-label="menu"
                aria-controls="mobile-menu"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="mobile-menu"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {navItems.map((item) => (
                  <MenuItem
                    key={item.text}
                    onClick={() => { navigate(item.path); handleClose(); }}
                  >
                    {item.icon}
                    <Typography sx={{ ml: 1 }}>{item.text}</Typography>
                  </MenuItem>
                ))}
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 