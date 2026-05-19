'use strict';

const Exercise = require('../models/Exercise');

class AdminExerciseService {
  async getExerciseList(page = 1, limit = 10, searchFilter = '', muscleGroupFilter = '') {
    const skip = (page - 1) * limit;
    const query = { isDeleted: false };

    if (searchFilter && searchFilter.trim()) {
      const regex = new RegExp(searchFilter.trim(), 'i');
      query.$or = [
        { name: regex },
        { description: regex },
      ];
    }

    if (muscleGroupFilter && muscleGroupFilter.trim()) {
      query.muscleGroup = muscleGroupFilter.trim();
    }

    const allCount = await Exercise.countDocuments({});
    const total = await Exercise.countDocuments(query);
    console.log(`[adminService] All exercises in DB: ${allCount}, Filtered (${JSON.stringify(query)}): ${total}`);
    const exercises = await Exercise.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`[adminService] Returned ${exercises.length} exercises, sample:`, exercises[0]);
    const pages = Math.ceil(total / limit) || 1;

    return {
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    };
  }

  async createExercise(data) {
    const {
      name,
      description,
      muscleGroup,
      difficulty,
      equipment = 'barbell',
      videoUrl,
    } = data;

    // Check for duplicate name (case-insensitive)
    const trimmedName = name.trim();
    const existing = await Exercise.findOne({
      name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existing) {
      const err = new Error('Exercise with this name already exists');
      err.status = 409;
      throw err;
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      description: description || null,
      muscleGroup,
      difficulty: difficulty || 'beginner',
      equipment,
      videoUrl: videoUrl || null,
      isDeleted: false,
    });

    return exercise;
  }

  async updateExercise(exerciseId, data) {
    // Validate ObjectId
    if (!exerciseId.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error('Invalid exercise ID');
      err.status = 404;
      throw err;
    }

    const exercise = await Exercise.findOne({
      _id: exerciseId,
      isDeleted: false,
    });
    if (!exercise) {
      const err = new Error('Exercise not found');
      err.status = 404;
      throw err;
    }

    const { name, muscleGroup, difficulty, equipment, videoUrl } = data;

    // Apply updates (middleware has already validated)
    if (name !== undefined) {
      // Check uniqueness only if name is different from current
      if (name.trim().toLowerCase() !== exercise.name.toLowerCase()) {
        const trimmedName = name.trim();
        const existing = await Exercise.findOne({
          name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (existing) {
          const err = new Error('Exercise with this name already exists');
          err.status = 409;
          throw err;
        }
      }
      exercise.name = name.trim();
    }

    if (muscleGroup !== undefined) {
      exercise.muscleGroup = muscleGroup;
    }

    if (difficulty !== undefined) {
      exercise.difficulty = difficulty;
    }

    if (equipment !== undefined) {
      exercise.equipment = equipment;
    }

    if (videoUrl !== undefined) {
      exercise.videoUrl = videoUrl;
    }

    // Allow optional description update
    if (data.description !== undefined) {
      exercise.description = data.description;
    }

    await exercise.save();
    return exercise;
  }

  async deleteExercise(exerciseId) {
    // Validate ObjectId
    if (!exerciseId.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error('Exercise not found');
      err.status = 404;
      throw err;
    }

    let exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      const err = new Error('Exercise not found');
      err.status = 404;
      throw err;
    }

    // Soft delete is idempotent
    exercise.isDeleted = true;
    exercise.deletedAt = new Date();
    await exercise.save();

    return exercise;
  }
}

module.exports = new AdminExerciseService();
