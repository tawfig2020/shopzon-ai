import React, { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import LoadingSpinner from '../components/LoadingSpinner';

// Mock data - replace with actual API calls
const mockData = {
  stats: {
    totalOrders: 150,
    favoriteItems: 45,
    activeDeals: 12,
    shoppingLists: 8,
  },
  recentActivity: [
    {
      id: 1,
      type: 'order',
      description: 'New order placed',
      timestamp: '2h ago',
    },
    { id: 2, type: 'deal', description: 'Deal claimed', timestamp: '4h ago' },
    // Add more activities...
  ],
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setData(mockData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message='Loading dashboard...' />;
  }

  if (error) {
    throw new Error(error); // This will be caught by the ErrorBoundary
  }

  const containerSpacing = isMobile ? 2 : 3;

  const StatCard = ({ title, value, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          height: '100%',
          backgroundColor: `${color}10`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            transition: 'all 0.3s ease-in-out',
          },
        }}
      >
        <CardContent>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component='div'
            gutterBottom
            sx={{ color: color }}
          >
            {title}
          </Typography>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component='div'
            sx={{ fontWeight: 'bold', color: color }}
          >
            {value}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string.isRequired,
  };

  return (
    <Container maxWidth='lg'>
      <Box sx={{ mb: containerSpacing }}>
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component='h1'
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Dashboard
        </Typography>
      </Box>

      <Grid container spacing={containerSpacing}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Total Orders'
            value={data.stats.totalOrders}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Favorite Items'
            value={data.stats.favoriteItems}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title='Active Deals' value={data.stats.activeDeals} color='#4caf50' />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title='Shopping Lists' value={data.stats.shoppingLists} color='#ff9800' />
        </Grid>

        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography
                  variant={isMobile ? 'h5' : 'h4'}
                  component='h2'
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  Recent Activity
                </Typography>
                {data.recentActivity.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      py: 1.5,
                      borderBottom: 1,
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <Typography variant='body1' gutterBottom>
                      {activity.description}
                    </Typography>
                    <Typography variant='caption' color='textSecondary'>
                      {activity.timestamp}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
