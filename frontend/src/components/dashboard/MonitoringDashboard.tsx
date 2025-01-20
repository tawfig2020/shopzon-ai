import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material/styles';

interface MetricCard {
  title: string;
  value: number | string;
  change?: number;
  chart?: any[];
}

interface DashboardData {
  businessMetrics: any;
  aiPerformance: any;
  customerInteraction: any;
  systemPerformance: any;
}

const MonitoringDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/monitoring/dashboard?time_range=${timeRange}`);
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box py={4}>
        <Typography variant="h4" gutterBottom>
          System Monitoring Dashboard
        </Typography>

        {/* Business Metrics */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Business Metrics
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Conversion Rate"
              value={`${(dashboardData?.businessMetrics?.conversion_rate * 100).toFixed(2)}%`}
              chart={dashboardData?.businessMetrics?.conversion_history}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Average Order Value"
              value={`$${dashboardData?.businessMetrics?.average_order_value.toFixed(2)}`}
              chart={dashboardData?.businessMetrics?.order_value_history}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Customer Lifetime Value"
              value={`$${dashboardData?.businessMetrics?.customer_lifetime_value.toFixed(2)}`}
              chart={dashboardData?.businessMetrics?.ltv_history}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MetricCard
              title="Active Users"
              value={dashboardData?.businessMetrics?.active_users}
              chart={dashboardData?.businessMetrics?.user_history}
            />
          </Grid>
        </Grid>

        {/* AI Performance */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              AI Performance
            </Typography>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Agent Response Times
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.aiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_response_time" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Agent Accuracy
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.aiPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent_type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_accuracy" fill={theme.palette.secondary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Customer Interaction */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Customer Interaction
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Customer Satisfaction
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData?.customerInteraction?.satisfaction_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="satisfaction_score"
                    stroke={theme.palette.primary.main}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData?.customerInteraction?.sentiment_distribution}
                    dataKey="value"
                    nameKey="sentiment"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill={theme.palette.primary.main}
                    label
                  />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* System Performance */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              System Performance
            </Typography>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Response Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData?.systemPerformance?.response_time_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="response_time"
                    stroke={theme.palette.primary.main}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Error Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData?.systemPerformance?.error_rate_history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="error_rate"
                    stroke={theme.palette.error.main}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

const MetricCard: React.FC<MetricCard> = ({ title, value, change, chart }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      {change !== undefined && (
        <Typography
          variant="body2"
          color={change >= 0 ? 'success.main' : 'error.main'}
        >
          {change >= 0 ? '+' : ''}{change}%
        </Typography>
      )}
      {chart && (
        <Box mt={2} height={60}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Paper>
  );
};

export default MonitoringDashboard;
