'use strict';

const adminService = require('../services/adminService');

class AdminController {
  async getExerciseList(req, res, next) {
    try {
      const rawPage = parseInt(req.query.page, 10);
      const page = (Number.isInteger(rawPage) && rawPage >= 1) ? rawPage : 1;
      const limit = 10; // Fixed limit
      const search = req.query.search || '';
      const muscleGroup = req.query.muscleGroup || '';

      const result = await adminService.getExerciseList(page, limit, search, muscleGroup);

      return res.status(200).json({
        data: result.exercises,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async createExercise(req, res, next) {
    try {
      const exercise = await adminService.createExercise(req.body);

      return res.status(201).json({
        message: 'Exercise created',
        exercise,
      });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ message: err.message });
      }
      if (err.status === 409) {
        return res.status(409).json({ message: err.message });
      }
      next(err);
    }
  }

  async updateExercise(req, res, next) {
    try {
      const { exerciseId } = req.params;
      const exercise = await adminService.updateExercise(exerciseId, req.body);

      return res.status(200).json({
        message: 'Exercise updated',
        exercise,
      });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ message: err.message });
      }
      if (err.status === 404) {
        return res.status(404).json({ message: err.message });
      }
      if (err.status === 409) {
        return res.status(409).json({ message: err.message });
      }
      next(err);
    }
  }

  async deleteExercise(req, res, next) {
    try {
      const { exerciseId } = req.params;
      const exercise = await adminService.deleteExercise(exerciseId);

      return res.status(200).json({
        message: 'Exercise deleted',
        exercise: {
          _id: exercise._id,
          isDeleted: exercise.isDeleted,
        },
      });
    } catch (err) {
      if (err.status === 404) {
        return res.status(404).json({ message: err.message });
      }
      next(err);
    }
  }
}

module.exports = new AdminController();
