'use strict';

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Exercise = require('../src/models/Exercise');

async function fixExercises() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Fix: set isDeleted=false for all exercises
    const result = await Exercise.updateMany(
      {},
      { $set: { isDeleted: false } }
    );
    console.log(`Updated ${result.modifiedCount} exercises, set isDeleted=false`);

    const count = await Exercise.countDocuments({ isDeleted: false });
    console.log(`Now have ${count} active (isDeleted=false) exercises`);

    await mongoose.disconnect();
    console.log('Fix complete');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixExercises();
