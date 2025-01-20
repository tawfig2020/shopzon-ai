import React, { useState } from 'react';

import { motion } from 'framer-motion';

import {
  Box,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';

import { useSnackbar } from '../contexts/SnackbarContext';

const settings = [
  {
    id: 'notifications',
    name: 'Push Notifications',
    description: 'Receive notifications for shopping list updates',
  },
  {
    id: 'autoSync',
    name: 'Auto Sync',
    description: 'Automatically sync shopping lists across devices',
  },
  {
    id: 'darkMode',
    name: 'Dark Mode',
    description: 'Enable dark mode for better visibility at night',
  },
];

const HouseholdSettings = () => {
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    autoSync: true,
    darkMode: false,
  });
  const { showSnackbar } = useSnackbar();

  const handleSettingChange = (settingId) => {
    setUserSettings((prev) => {
      const newSettings = {
        ...prev,
        [settingId]: !prev[settingId],
      };
      // In a real app, you would save these settings to the backend
      showSnackbar('Settings updated successfully', 'success');
      return newSettings;
    });
  };

  return (
    <Container maxWidth='md'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant='h4' component='h1' gutterBottom>
            Household Settings
          </Typography>
          <Card>
            <CardContent>
              <List>
                {settings.map((setting) => (
                  <ListItem
                    key={setting.id}
                    secondaryAction={
                      <Switch
                        edge='end'
                        checked={userSettings[setting.id]}
                        onChange={() => handleSettingChange(setting.id)}
                      />
                    }
                  >
                    <ListItemText primary={setting.name} secondary={setting.description} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Container>
  );
};

export default HouseholdSettings;
