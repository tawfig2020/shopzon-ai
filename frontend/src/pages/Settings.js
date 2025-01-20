import React, { useState, useEffect } from 'react';

import {
  Box,
  Container,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

import { useAuth } from '../contexts/AuthContext';
import { featureTracker } from '../services/monitoring/feature-tracker';
import { monitoringService } from '../services/monitoring/monitoring-service';

function Settings() {
  const { currentUser: currentUser } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'en',
    emailFrequency: 'daily',
  });

  useEffect(() => {
    if (currentUser) {
      monitoringService.trackUserActivity('settings', 'view');
      featureTracker.trackFeatureUse('settings', 'page_view');
    }
  }, [currentUser]);

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));

    featureTracker.trackFeatureUse('settings_change', 'update', {
      setting,
      value,
    });
  };

  const handleSave = () => {
    featureTracker.trackFeatureUse('settings_save', 'click');
  };

  return (
    <Container maxWidth='md'>
      <Box py={4}>
        <Typography variant='h4' component='h1' gutterBottom>
          Settings
        </Typography>
        <Paper elevation={3}>
          <Box p={3}>
            {/* Notifications */}
            <Box mb={3}>
              <Typography variant='h6' gutterBottom>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    color='primary'
                  />
                }
                label='Enable notifications'
              />
            </Box>
            <Divider />

            {/* Theme */}
            <Box my={3}>
              <Typography variant='h6' gutterBottom>
                Appearance
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    color='primary'
                  />
                }
                label='Dark mode'
              />
            </Box>
            <Divider />

            {/* Language */}
            <Box my={3}>
              <Typography variant='h6' gutterBottom>
                Language
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Language</InputLabel>
                <Select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  label='Select Language'
                >
                  <MenuItem value='en'>English</MenuItem>
                  <MenuItem value='es'>Español</MenuItem>
                  <MenuItem value='fr'>Français</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Divider />

            {/* Email Preferences */}
            <Box my={3}>
              <Typography variant='h6' gutterBottom>
                Email Preferences
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Email Frequency</InputLabel>
                <Select
                  value={settings.emailFrequency}
                  onChange={(e) => handleSettingChange('emailFrequency', e.target.value)}
                  label='Email Frequency'
                >
                  <MenuItem value='daily'>Daily</MenuItem>
                  <MenuItem value='weekly'>Weekly</MenuItem>
                  <MenuItem value='monthly'>Monthly</MenuItem>
                  <MenuItem value='never'>Never</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Save Button */}
            <Box mt={4} display='flex' justifyContent='flex-end'>
              <Button variant='contained' color='primary' onClick={handleSave} size='large'>
                Save Changes
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Settings;
