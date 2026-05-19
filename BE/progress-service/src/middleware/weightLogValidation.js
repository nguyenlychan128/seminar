'use strict';

/**
 * Validation middleware and utilities for weight log endpoints
 */

/**
 * Validates weight log input
 * @param {Number} weight - Weight in kg
 * @param {String} date - ISO date string (optional)
 * @throws {Error} ValidationError if invalid
 */
function validateWeightInput(weight, date) {
  // Validate weight
  if (weight === undefined || weight === null) {
    const error = new Error('Weight is required');
    error.statusCode = 400;
    throw error;
  }

  const numWeight = Number(weight);
  if (isNaN(numWeight)) {
    const error = new Error('Weight must be a number');
    error.statusCode = 400;
    throw error;
  }
  if (numWeight < 30 || numWeight > 200) {
    const error = new Error('Weight must be between 30-200 kg');
    error.statusCode = 400;
    throw error;
  }

  // Validate date if provided
  if (date !== undefined && date !== null) {
    // Check if it's a valid ISO date format (YYYY-MM-DD or full ISO)
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;
    if (!isoRegex.test(date)) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    // Check if date is valid and not in future
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const checkDate = new Date(parsedDate);
    checkDate.setUTCHours(0, 0, 0, 0);

    if (checkDate > today) {
      const error = new Error('Date cannot be in the future');
      error.statusCode = 400;
      throw error;
    }
  }
}

/**
 * Validates query parameters for GET weight history
 * @param {String} startDate - ISO date string (optional)
 * @param {String} endDate - ISO date string (optional)
 * @param {String|Number} limit - Limit number (optional)
 * @throws {Error} ValidationError if invalid
 */
function validateWeightHistoryQuery(startDate, endDate, limit) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;

  if (startDate !== undefined && startDate !== null) {
    if (!isoRegex.test(startDate) || isNaN(new Date(startDate).getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }
  }

  if (endDate !== undefined && endDate !== null) {
    if (!isoRegex.test(endDate) || isNaN(new Date(endDate).getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }
  }

  if (limit !== undefined && limit !== null) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      const error = new Error('Limit must be a positive integer');
      error.statusCode = 400;
      throw error;
    }
  }
}

/**
 * Express middleware for validating weight log POST requests
 */
function weightLogValidationMiddleware(req, res, next) {
  try {
    const { weight, date } = req.body;
    validateWeightInput(weight, date);
    next();
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

/**
 * Express middleware for validating weight history GET requests
 */
function weightHistoryValidationMiddleware(req, res, next) {
  try {
    const { startDate, endDate, limit } = req.query;
    validateWeightHistoryQuery(startDate, endDate, limit);
    next();
  } catch (err) {
    res.status(err.statusCode || 400).json({ error: err.message });
  }
}

module.exports = {
  validateWeightInput,
  validateWeightHistoryQuery,
  weightLogValidationMiddleware,
  weightHistoryValidationMiddleware,
};
