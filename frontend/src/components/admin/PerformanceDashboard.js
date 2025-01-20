import React, { useState, useEffect } from 'react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  LinearProgress,
} from '@mui/material';

import { analyticsService } from '../../services/analyticsService';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState({
    loading: true,
    error: null,
    data: {
      responseTime: [],
      errorRate: [],
      userActivity: [],
      resourceUsage: [],
    },
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [responseTime, errorRate, userActivity, resourceUsage] = await Promise.all([
          analyticsService.getResponseTimeMetrics(),
          analyticsService.getErrorRateMetrics(),
          analyticsService.getUserActivityMetrics(),
          analyticsService.getResourceUsageMetrics(),
        ]);

        setMetrics({
          loading: false,
          error: null,
          data: {
            responseTime,
            errorRate,
            userActivity,
            resourceUsage,
          },
        });
      } catch (error) {
        setMetrics((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load metrics',
        }));
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (metrics.loading) {
    return <CircularProgress />;
  }

  if (metrics.error) {
    return <Typography color='error'>{metrics.error}</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Performance Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Response Time Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6'>API Response Time</Typography>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={metrics.data.responseTime}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='timestamp' />
                  <YAxis />
                  <Tooltip />
                  <Line type='monotone' dataKey='value' stroke='#8884d8' />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6'>Error Rate</Typography>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={metrics.data.errorRate}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='timestamp' />
                  <YAxis />
                  <Tooltip />
                  <Line type='monotone' dataKey='value' stroke='#ff4444' />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* User Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6'>User Activity</Typography>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={metrics.data.userActivity}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='timestamp' />
                  <YAxis />
                  <Tooltip />
                  <Line type='monotone' dataKey='value' stroke='#4CAF50' />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6'>Resource Usage</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2'>CPU Usage</Typography>
                <LinearProgress
                  variant='determinate'
                  value={metrics.data.resourceUsage.cpu}
                  sx={{ mb: 2 }}
                />
                <Typography variant='subtitle2'>Memory Usage</Typography>
                <LinearProgress
                  variant='determinate'
                  value={metrics.data.resourceUsage.memory}
                  sx={{ mb: 2 }}
                />
                <Typography variant='subtitle2'>Storage Usage</Typography>
                <LinearProgress variant='determinate' value={metrics.data.resourceUsage.storage} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceDashboard;
