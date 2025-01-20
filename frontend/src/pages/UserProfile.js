import React, { useState } from 'react';

import { motion } from 'framer-motion';

import {
  Edit as EditIcon,
  PhotoCamera,
  Notifications,
  Security,
  Language,
  ColorLens,
} from '@mui/icons-material';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  Box,
  Grid,
  Button,
  TextField,
  Divider,
  IconButton,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(15),
  height: theme.spacing(15),
  marginBottom: theme.spacing(2),
  border: `4px solid ${theme.palette.background.paper}`,
  boxShadow: theme.shadows[3],
}));

const SettingCard = styled(motion(Card))(({ theme }) => ({
  height: '100%',
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}));

const UserProfile = () => {
  const [editing, setEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    bio: 'Passionate about technology and shopping for the latest gadgets.',
    preferences: ['Electronics', 'Books', 'Fashion'],
    notifications: true,
    darkMode: false,
    language: 'English',
  });

  const handleEdit = () => {
    setEditing(!editing);
  };

  const handleChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setEditing(false);
    // TODO: Implement save logic
  };

  const settings = [
    {
      title: 'Notifications',
      icon: <Notifications />,
      description: 'Manage your notification preferences',
      color: '#4caf50',
    },
    {
      title: 'Security',
      icon: <Security />,
      description: 'Update your security settings',
      color: '#f44336',
    },
    {
      title: 'Language',
      icon: <Language />,
      description: 'Change your language preferences',
      color: '#2196f3',
    },
    {
      title: 'Appearance',
      icon: <ColorLens />,
      description: 'Customize your app theme',
      color: '#9c27b0',
    },
  ];

  return (
    <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StyledPaper elevation={3}>
          <Box display='flex' flexDirection='column' alignItems='center' mb={4}>
            <Box position='relative'>
              <LargeAvatar src='/path-to-avatar.jpg' alt={userData.name}>
                {userData.name.charAt(0)}
              </LargeAvatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'white',
                }}
                size='small'
              >
                <PhotoCamera />
              </IconButton>
            </Box>
            <Typography variant='h4' gutterBottom>
              {userData.name}
            </Typography>
            <Typography variant='body1' color='textSecondary' gutterBottom>
              {userData.email}
            </Typography>
            <Box mt={1}>
              {userData.preferences.map((pref) => (
                <Chip key={pref} label={pref} sx={{ m: 0.5 }} variant='outlined' color='primary' />
              ))}
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Personal Information
                <IconButton onClick={handleEdit} size='small' sx={{ ml: 1 }}>
                  <EditIcon />
                </IconButton>
              </Typography>
              <Box component='form'>
                <TextField
                  fullWidth
                  margin='normal'
                  label='Name'
                  name='name'
                  value={userData.name}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <TextField
                  fullWidth
                  margin='normal'
                  label='Email'
                  name='email'
                  value={userData.email}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <TextField
                  fullWidth
                  margin='normal'
                  label='Phone'
                  name='phone'
                  value={userData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <TextField
                  fullWidth
                  margin='normal'
                  label='Location'
                  name='location'
                  value={userData.location}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <TextField
                  fullWidth
                  margin='normal'
                  label='Bio'
                  name='bio'
                  multiline
                  rows={4}
                  value={userData.bio}
                  onChange={handleChange}
                  disabled={!editing}
                />
                {editing && (
                  <Button variant='contained' onClick={handleSave} sx={{ mt: 2 }}>
                    Save Changes
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='h6' gutterBottom>
                Settings
              </Typography>
              <Grid container spacing={2}>
                {settings.map((setting, index) => (
                  <Grid item xs={12} sm={6} key={setting.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SettingCard>
                        <CardContent>
                          <Box display='flex' alignItems='center' mb={1} color={setting.color}>
                            {setting.icon}
                            <Typography variant='h6' sx={{ ml: 1, fontSize: '1.1rem' }}>
                              {setting.title}
                            </Typography>
                          </Box>
                          <Typography variant='body2' color='textSecondary'>
                            {setting.description}
                          </Typography>
                        </CardContent>
                      </SettingCard>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              <Box mt={4}>
                <Typography variant='h6' gutterBottom>
                  Preferences
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userData.notifications}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          notifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Email Notifications'
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userData.darkMode}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          darkMode: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Dark Mode'
                />
              </Box>
            </Grid>
          </Grid>
        </StyledPaper>
      </motion.div>
    </Container>
  );
};

export default UserProfile;
