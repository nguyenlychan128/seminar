'use strict';

const WeightLog = require('../models/WeightLog');

class WeightLogService {
  /**
   * Create a new weight log entry
   * @param {ObjectId} userId - The user ID
   * @param {Number} weight - Weight in kg (30-200)
   * @param {String|Date} date - ISO date string or Date object (optional, default: today)
   * @param {String} notes - Optional notes (max 200 chars)
   * @returns {Object} Saved weight log document
   * @throws {Error} 400 for validation errors, 409 for duplicate entries
   */
  async createWeightLog(userId, weight, date = null, notes = null) {
    // Normalize date
    let logDate = date ? new Date(date) : new Date();
    logDate.setUTCHours(0, 0, 0, 0);

    // Check for duplicate entry on same date
    const existing = await WeightLog.findOne({
      userId,
      date: {
        $gte: logDate,
        $lt: new Date(logDate.getTime() + 86400000), // +1 day
      },
    });

    if (existing) {
      const error = new Error('Weight entry already exists for this date');
      error.statusCode = 409;
      throw error;
    }

    // Create and save the document
    const weightLog = new WeightLog({
      userId,
      weight,
      date: logDate,
      ...(notes && { notes }),
    });

    return weightLog.save();
  }

  /**
   * Get weight history with optional filtering and pagination
   * @param {ObjectId} userId - The user ID
   * @param {String} startDate - ISO date string (optional, default: 30 days ago)
   * @param {String} endDate - ISO date string (optional, default: today)
   * @param {Number} limit - Max entries to return (optional, default: 30)
   * @returns {Object} { data, count, startDate, endDate }
   */
  async getWeightHistory(userId, startDate = null, endDate = null, limit = 30) {
    // Normalize dates
    let start;
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
    }
    start.setUTCHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setUTCHours(23, 59, 59, 999);

    // Ensure limit is valid
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 30, 365));

    // Build query
    const query = {
      userId,
      date: {
        $gte: start,
        $lte: end,
      },
    };

    // Execute query with sorting and limit
    const data = await WeightLog.find(query)
      .sort({ date: -1 })
      .limit(parsedLimit)
      .lean();

    return {
      data,
      count: data.length,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }
}

module.exports = new WeightLogService();
