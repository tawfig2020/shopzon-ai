const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB, connectRedis } = require('./config/database');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');

// Import routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const listRoutes = require('./routes/list.routes');
const householdRoutes = require('./routes/household.routes');
const userRoutes = require('./routes/user.routes');
const rewardRoutes = require('./routes/reward.routes');
const metricsRoutes = require('./routes/metrics.routes');
const testRoutes = require('./routes/test.routes');

const app = express();

// Initialize database connections
connectDB();
connectRedis();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/test', testRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Export the Express app
module.exports = app;
