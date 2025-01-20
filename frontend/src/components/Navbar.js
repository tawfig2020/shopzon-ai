import React from 'react';

import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Dashboard as DashboardIcon,
  Recommend as RecommendIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { useAuth } from '../context/AuthContext';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
}));

const LogoSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const NavSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  color: active ? theme.palette.primary.light : 'inherit',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await signOut();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar position='sticky' elevation={1}>
      <StyledToolbar>
        <LogoSection>
          <ShoppingCartIcon sx={{ fontSize: 28 }} />
          <Typography variant='h6' component='div'>
            ShopSyncAI
          </Typography>
        </LogoSection>

        <NavSection>
          <NavButton
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
            active={location.pathname === '/dashboard'}
          >
            Dashboard
          </NavButton>
          <NavButton
            startIcon={<RecommendIcon />}
            onClick={() => navigate('/recommendations')}
            active={location.pathname === '/recommendations'}
          >
            Recommendations
          </NavButton>

          <IconButton
            size='large'
            aria-label='account of current user'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleMenu}
            color='inherit'
          >
            <Avatar sx={{ width: 32, height: 32 }}>{user?.name?.charAt(0) || 'U'}</Avatar>
          </IconButton>
          <Menu
            id='menu-appbar'
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
            <MenuItem
              onClick={() => {
                handleClose();
                navigate('/profile');
              }}
            >
              <PersonIcon sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </NavSection>
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
