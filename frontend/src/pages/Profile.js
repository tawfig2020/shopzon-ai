import React from 'react';

import { Avatar, Box, Card, CardContent, Container, Grid, Typography } from '@mui/material';

import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth='md'>
      <Typography variant='h4' gutterBottom>
        Profile
      </Typography>
      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                }}
              >
                {user?.name?.[0] || 'U'}
              </Avatar>
            </Grid>
            <Grid item xs={12} sm>
              <Box>
                <Typography variant='h5' gutterBottom>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant='body1' color='textSecondary'>
                  {user?.email || 'No email provided'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;
