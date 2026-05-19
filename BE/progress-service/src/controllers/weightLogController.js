'use strict';

const weightLogService = require('../services/weightLogService');

class WeightLogController {
  /**
   * Create a new weight log entry
   * POST /progress/weight
   */
  async createWeightLog(req, res, next) {
    try {
      const userId = req.user.userId || req.user._id;
      const { weight, date, notes } = req.body;

      const result = await weightLogService.createWeightLog(userId, weight, date, notes);

      res.status(201).json({
        _id: result._id,
        userId: result.userId,
        weight: result.weight,
        date: result.date.toISOString().split('T')[0],
        trend: result.trend,
        notes: result.notes,
        createdAt: result.createdAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get weight history with optional filtering
   * GET /progress/weight?startDate=...&endDate=...&limit=...
   */
  async getWeightHistory(req, res, next) {
    try {
      const userId = req.user.userId || req.user._id;
      const { startDate, endDate, limit } = req.query;

      const result = await weightLogService.getWeightHistory(
        userId,
        startDate,
        endDate,
        limit
      );

      // Transform dates to ISO format strings
      const data = result.data.map((entry) => ({
        _id: entry._id,
        userId: entry.userId,
        weight: entry.weight,
        date: new Date(entry.date).toISOString().split('T')[0],
        trend: entry.trend,
        notes: entry.notes,
        createdAt: new Date(entry.createdAt).toISOString(),
      }));

      res.status(200).json({
        data,
        count: result.count,
        startDate: result.startDate,
        endDate: result.endDate,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WeightLogController();
