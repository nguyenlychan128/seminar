'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

const userServiceClient = axios.create({
  baseURL: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  timeout: 5000,
});

async function getUserProfile(accessToken) {
  try {
    const response = await userServiceClient.get('/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logger.warn('User profile not found');
      throw new Error('User profile not found');
    }
    logger.error('Failed to fetch user profile', { error: error.message });
    throw error;
  }
}

module.exports = { getUserProfile };
