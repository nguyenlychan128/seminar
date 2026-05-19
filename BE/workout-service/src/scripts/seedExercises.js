'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fitgainer-workout';

const exercises = [
  // ── Chest ──────────────────────────────────────────────────────────────────
  {
    name: 'Bench Press',
    muscleGroup: 'chest',
    equipment: 'barbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
  },
  {
    name: 'Dumbbell Flyes',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=FOa0nZiKZ-c',
  },
  {
    name: 'Push-Up',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    difficulty: 'all',
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
  },
  {
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
  },
  {
    name: 'Cable Crossover',
    muscleGroup: 'chest',
    equipment: 'cable',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=aH0oUzT5zNc',
  },

  // ── Back ──────────────────────────────────────────────────────────────────
  {
    name: 'Deadlift',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=r4MzxtBKyNE',
  },
  {
    name: 'Pull-Up',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    difficulty: 'all',
    videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
  },
  {
    name: 'Barbell Row',
    muscleGroup: 'back',
    equipment: 'barbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=2RwjrxWgcKs',
  },
  {
    name: 'Dumbbell Row',
    muscleGroup: 'back',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=pYcpY20zwrI',
  },
  {
    name: 'Lat Pulldown',
    muscleGroup: 'back',
    equipment: 'cable',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=CAwfjRjSW6Y',
  },

  // ── Shoulders ─────────────────────────────────────────────────────────────
  {
    name: 'Overhead Press',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDY',
  },
  {
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=q-lSHX7lyXo',
  },
  {
    name: 'Front Raise',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=seTaIy4OFu4',
  },
  {
    name: 'Arnold Press',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=6Z15_WdZEv0',
  },
  {
    name: 'Face Pull',
    muscleGroup: 'shoulders',
    equipment: 'cable',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
  },

  // ── Arms ──────────────────────────────────────────────────────────────────
  {
    name: 'Barbell Curl',
    muscleGroup: 'arms',
    equipment: 'barbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=kwG2ipFQV0s',
  },
  {
    name: 'Tricep Dips',
    muscleGroup: 'arms',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=0326aFvdtille',
  },
  {
    name: 'Hammer Curl',
    muscleGroup: 'arms',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4',
  },
  {
    name: 'Skull Crusher',
    muscleGroup: 'arms',
    equipment: 'barbell',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=8v8aYWV-qJQ',
  },
  {
    name: 'Cable Curl',
    muscleGroup: 'arms',
    equipment: 'cable',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=34xNFSgAw90',
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  {
    name: 'Squat',
    muscleGroup: 'legs',
    equipment: 'barbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=Dy28eq2PjZM',
  },
  {
    name: 'Romanian Deadlift',
    muscleGroup: 'legs',
    equipment: 'barbell',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=2AYwZNwYnqI',
  },
  {
    name: 'Leg Press',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJM',
  },
  {
    name: 'Dumbbell Lunge',
    muscleGroup: 'legs',
    equipment: 'dumbbell',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=JwT0xsG0A0w',
  },
  {
    name: 'Calf Raise',
    muscleGroup: 'legs',
    equipment: 'bodyweight',
    difficulty: 'all',
    videoUrl: 'https://www.youtube.com/watch?v=LNL8B1NaT9c',
  },

  // ── Advanced Exercises (one per muscle group for difficulty coverage) ────────
  {
    name: 'Weighted Dip',
    muscleGroup: 'chest',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=fFnj29Xplq8',
  },
  {
    name: 'Weighted Pull-Up',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=xslJ5J-JbLY',
  },
  {
    name: 'Push Press',
    muscleGroup: 'shoulders',
    equipment: 'barbell',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=hEKXsDMKqFY',
  },
  {
    name: 'Close-Grip Bench Press',
    muscleGroup: 'arms',
    equipment: 'barbell',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=Dm0kqKcaY_I',
  },
  {
    name: 'Bulgarian Split Squat',
    muscleGroup: 'legs',
    equipment: 'dumbbell',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=_l4ys5-FIkw',
  },

  // ── Core ──────────────────────────────────────────────────────────────────
  {
    name: 'Plank',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'all',
    videoUrl: 'https://www.youtube.com/watch?v=pSHjTRCQxIw',
  },
  {
    name: 'Crunch',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=MKmrqcoCZ3M',
  },
  {
    name: 'Leg Raise',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
  },
  {
    name: 'Russian Twist',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=1lakSBt6v8M',
  },
  {
    name: 'Cable Woodchop',
    muscleGroup: 'core',
    equipment: 'cable',
    difficulty: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=WdVlYXZzwv4',
  },
  {
    name: 'Dragon Flag',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=L6Sy19p53P4',
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const exercise of exercises) {
    const result = await Exercise.findOneAndUpdate(
      { name: exercise.name },
      { $set: exercise },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    );
    if (result.lastErrorObject && result.lastErrorObject.upserted) {
      insertedCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`Seeded ${insertedCount} new exercises, updated ${updatedCount} existing exercises`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
