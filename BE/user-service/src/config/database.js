'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitgainer-user';

const mongooseOptions = {
  minPoolSize: 5,
  maxPoolSize: 20,
  socketTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
};

async function connectDatabase() {
  try {
    const urlObj = new URL(MONGO_URI);
    logger.info('Connecting to MongoDB...', {
      host: urlObj.hostname,
      database: urlObj.pathname,
    });
    await mongoose.connect(MONGO_URI, mongooseOptions);
    logger.info('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

async function disconnectDatabase() {
  try {
    logger.info('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('MongoDB disconnection failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = { connectDatabase, disconnectDatabase };
