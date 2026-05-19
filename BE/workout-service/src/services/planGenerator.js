'use strict';

const DAYS_SCHEDULE = [
  { dayNumber: 1, dayLabel: 'Day A — Push', isRestDay: false, muscleGroups: ['chest', 'shoulders', 'arms'] },
  { dayNumber: 2, dayLabel: 'Rest Day', isRestDay: true, muscleGroups: [] },
  { dayNumber: 3, dayLabel: 'Day B — Pull', isRestDay: false, muscleGroups: ['back', 'arms'] },
  { dayNumber: 4, dayLabel: 'Rest Day', isRestDay: true, muscleGroups: [] },
  { dayNumber: 5, dayLabel: 'Day C — Legs', isRestDay: false, muscleGroups: ['legs', 'core'] },
  { dayNumber: 6, dayLabel: 'Rest Day', isRestDay: true, muscleGroups: [] },
  { dayNumber: 7, dayLabel: 'Rest Day', isRestDay: true, muscleGroups: [] },
];

const PROGRESSIVE_OVERLOAD_STANDARD = {
  1: { sets: 3, reps: '10' },
  2: { sets: 3, reps: '10-12' },
  3: { sets: 4, reps: '8-10' },
  4: { sets: 4, reps: '8-12' },
};

const PROGRESSIVE_OVERLOAD_SEVERE = {
  1: { sets: 2, reps: '10-15' },
  2: { sets: 2, reps: '10-15' },
  3: { sets: 3, reps: '10-15' },
  4: { sets: 3, reps: '10-15' },
};

function selectExercises(exercises, muscleGroups, count, gender, planDifficulty) {
  const filtered = exercises.filter((ex) => {
    if (!muscleGroups.includes(ex.muscleGroup) || !ex.isActive) return false;
    return ex.difficulty === 'all' || ex.difficulty === planDifficulty;
  });

  const sorted = [...filtered].sort((a, b) => {
    const equipmentPriority = getEquipmentPriority(gender);
    const aIndex = equipmentPriority.indexOf(a.equipment);
    const bIndex = equipmentPriority.indexOf(b.equipment);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sorted.slice(0, count);
}

function getEquipmentPriority(gender) {
  if (gender === 'male') {
    return ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'];
  }
  return ['bodyweight', 'dumbbell', 'cable', 'machine', 'barbell'];
}

function buildDaysForWeek(weekNumber, exercises, startDate, gender, isSevereBMI, planDifficulty) {
  const days = [];
  const overload = isSevereBMI ? PROGRESSIVE_OVERLOAD_SEVERE[weekNumber] : PROGRESSIVE_OVERLOAD_STANDARD[weekNumber];

  DAYS_SCHEDULE.forEach((dayTemplate) => {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(
      scheduledDate.getDate() + (weekNumber - 1) * 7 + (dayTemplate.dayNumber - 1)
    );

    const dayObj = {
      dayNumber: dayTemplate.dayNumber,
      dayLabel: dayTemplate.dayLabel,
      scheduledDate,
      isRestDay: dayTemplate.isRestDay,
      exercises: [],
    };

    if (!dayTemplate.isRestDay && dayTemplate.muscleGroups.length > 0) {
      const selectedExercises = selectExercises(
        exercises,
        dayTemplate.muscleGroups,
        3,
        gender,
        planDifficulty
      );

      dayObj.exercises = selectedExercises.map((ex, index) => ({
        exerciseId: ex._id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        videoUrl: ex.videoUrl || null,
        sets: overload.sets,
        reps: overload.reps,
        restSeconds: 90,
        order: index + 1,
      }));
    }

    days.push(dayObj);
  });

  return days;
}

function generatePlan(userProfile, exercises, difficulty = 'beginner') {
  // Note: Input validation (exercise count >= 5 per muscle group) is handled at API layer (TASK-025)
  const { userId, weight, height, bmi, gender } = userProfile;

  const durationWeeks = 4;
  const daysPerWeek = DAYS_SCHEDULE.filter((d) => !d.isRestDay).length;
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationWeeks * 7);

  const isSevereBMI = bmi < 16;

  const weeks = [];
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    const days = buildDaysForWeek(weekNum, exercises, startDate, gender, isSevereBMI, difficulty);
    weeks.push({
      weekNumber: weekNum,
      days,
    });
  }

  const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return {
    userId,
    name: `${capitalizedDifficulty} Weight Gain Plan`,
    difficulty,
    startDate,
    endDate,
    durationWeeks,
    daysPerWeek,
    status: 'active',
    weeks,
    generatedFrom: {
      weight,
      height,
      bmi,
      gender,
    },
  };
}

module.exports = {
  generatePlan,
};
