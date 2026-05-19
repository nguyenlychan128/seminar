'use strict';

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const exerciseRoutes = require('./routes/exercise.routes');
const planRoutes = require('./routes/plan.routes');
const workoutSessionRoutes = require('./routes/workoutSessionRoutes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.debug(`Incoming request: ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'workout-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/admin/exercises', adminRoutes);
app.use('/api/workouts/exercises', exerciseRoutes);
app.use('/api/workouts/plans', planRoutes);
app.use('/api/workouts/sessions', workoutSessionRoutes);

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON' });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

module.exports = app;
