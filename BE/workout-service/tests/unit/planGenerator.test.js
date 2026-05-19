'use strict';

const { generatePlan } = require('../../src/services/planGenerator');
const mongoose = require('mongoose');

const makeId = () => new mongoose.Types.ObjectId();

const MOCK_EXERCISES = [
  { _id: makeId(), name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Dumbbell Flyes', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Push-Up', muscleGroup: 'chest', equipment: 'bodyweight', difficulty: 'all', isActive: true },
  { _id: makeId(), name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Dumbbell Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'dumbbell', difficulty: 'intermediate', isActive: true },
  { _id: makeId(), name: 'Tricep Dips', muscleGroup: 'arms', equipment: 'bodyweight', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Skull Crusher', muscleGroup: 'arms', equipment: 'barbell', difficulty: 'intermediate', isActive: true },
  { _id: makeId(), name: 'Hammer Curl', muscleGroup: 'arms', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Barbell Curl', muscleGroup: 'arms', equipment: 'barbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Cable Curl', muscleGroup: 'arms', equipment: 'cable', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell', difficulty: 'intermediate', isActive: true },
  { _id: makeId(), name: 'Pull-Up', muscleGroup: 'back', equipment: 'bodyweight', difficulty: 'all', isActive: true },
  { _id: makeId(), name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Squat', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Dumbbell Lunge', muscleGroup: 'legs', equipment: 'dumbbell', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Calf Raise', muscleGroup: 'legs', equipment: 'bodyweight', difficulty: 'all', isActive: true },
  { _id: makeId(), name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell', difficulty: 'intermediate', isActive: true },
  { _id: makeId(), name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'all', isActive: true },
  { _id: makeId(), name: 'Crunch', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Leg Raise', muscleGroup: 'core', equipment: 'bodyweight', difficulty: 'beginner', isActive: true },
  { _id: makeId(), name: 'Inactive Exercise', muscleGroup: 'chest', equipment: 'barbell', difficulty: 'beginner', isActive: false },
];

const MALE_NORMAL = { userId: 'user-001', weight: 60, height: 175, bmi: 19.6, gender: 'male' };
const MALE_SEVERE = { userId: 'user-002', weight: 42, height: 175, bmi: 13.7, gender: 'male' };
const FEMALE_NORMAL = { userId: 'user-003', weight: 45, height: 163, bmi: 16.9, gender: 'female' };
const FEMALE_SEVERE = { userId: 'user-004', weight: 38, height: 163, bmi: 14.3, gender: 'female' };

describe('planGenerator — TASK-023', () => {
  describe('Group A: Return shape (BR-04)', () => {
    it('A-01: should return an object with all required top-level properties', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      expect(result.userId).toBe('user-001');
      expect(result.name).toBe('Beginner Weight Gain Plan');
      expect(result.durationWeeks).toBe(4);
      expect(result.daysPerWeek).toBe(3);
      expect(result.status).toBe('active');
      expect(Array.isArray(result.weeks)).toBe(true);
    });

    it('A-02: should return exactly 4 weeks each with exactly 7 days', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      expect(result.weeks).toHaveLength(4);
      expect(result.weeks[0].days).toHaveLength(7);
      expect(result.weeks[1].days).toHaveLength(7);
      expect(result.weeks[2].days).toHaveLength(7);
      expect(result.weeks[3].days).toHaveLength(7);
      expect(result.weeks[0].weekNumber).toBe(1);
      expect(result.weeks[3].weekNumber).toBe(4);
    });

    it('A-03: endDate should be exactly startDate + 28 days', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const diff = result.endDate.getTime() - result.startDate.getTime();
      const daysDiff = diff / (24 * 60 * 60 * 1000);
      expect(daysDiff).toBe(28);
    });

    it('A-04: generatedFrom should snapshot all profile values', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      expect(result.generatedFrom.weight).toBe(60);
      expect(result.generatedFrom.height).toBe(175);
      expect(result.generatedFrom.bmi).toBe(19.6);
      expect(result.generatedFrom.gender).toBe('male');
    });
  });

  describe('Group B: Day structure and scheduledDate (BR-04)', () => {
    it('B-01: should mark correct days as Push/Pull/Legs and rest days by position', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const week1 = result.weeks[0];
      expect(week1.days[0].isRestDay).toBe(false);
      expect(week1.days[0].dayLabel).toContain('Push');
      expect(week1.days[1].isRestDay).toBe(true);
      expect(week1.days[2].isRestDay).toBe(false);
      expect(week1.days[2].dayLabel).toContain('Pull');
      expect(week1.days[3].isRestDay).toBe(true);
      expect(week1.days[4].isRestDay).toBe(false);
      expect(week1.days[4].dayLabel).toContain('Legs');
      expect(week1.days[5].isRestDay).toBe(true);
      expect(week1.days[6].isRestDay).toBe(true);
    });

    it('B-02: rest days should have an empty exercises array', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        week.days.forEach((day) => {
          if (day.isRestDay) {
            expect(day.exercises).toHaveLength(0);
          }
        });
      });
    });

    it('B-03: scheduledDate should advance by 1 day per dayNumber across all weeks', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const start = result.startDate;

      expect(result.weeks[0].days[0].scheduledDate.getTime()).toBe(start.getTime());
      expect(result.weeks[0].days[1].scheduledDate.getTime()).toBe(
        start.getTime() + 1 * 24 * 60 * 60 * 1000
      );
      expect(result.weeks[0].days[6].scheduledDate.getTime()).toBe(
        start.getTime() + 6 * 24 * 60 * 60 * 1000
      );
      expect(result.weeks[1].days[0].scheduledDate.getTime()).toBe(
        start.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      expect(result.weeks[3].days[6].scheduledDate.getTime()).toBe(
        start.getTime() + 27 * 24 * 60 * 60 * 1000
      );
    });
  });

  describe('Group C: Volume selection by BMI (BR-03)', () => {
    it('C-01: BMI < 16 should produce sets in 2-3 range and reps "10-15" in week 1', () => {
      const result = generatePlan(MALE_SEVERE, MOCK_EXERCISES);
      const pushDay = result.weeks[0].days[0];
      expect(pushDay.exercises.length).toBeGreaterThan(0);
      const exercise = pushDay.exercises[0];
      expect([2, 3]).toContain(exercise.sets);
      expect(exercise.reps).toBe('10-15');
    });

    it('C-02: BMI 16–18.5 should produce sets in 3-4 range and reps "10" in week 1', () => {
      const result = generatePlan(FEMALE_NORMAL, MOCK_EXERCISES);
      const pushDay = result.weeks[0].days[0];
      expect(pushDay.exercises.length).toBeGreaterThan(0);
      const exercise = pushDay.exercises[0];
      expect([3, 4]).toContain(exercise.sets);
      expect(exercise.reps).toBe('10');
    });

    it('C-03: BMI >= 18.5 should use standard volume (reps "10"), not low-volume path', () => {
      const profileHighBMI = { userId: 'user-005', weight: 70, height: 175, bmi: 22.9, gender: 'male' };
      const result = generatePlan(profileHighBMI, MOCK_EXERCISES);
      const exercise = result.weeks[0].days[0].exercises[0];
      expect(exercise.reps).not.toBe('10-15');
      expect(exercise.reps).toBe('10');
    });

    it('C-04: BMI exactly 16.0 should use standard volume, not low-volume', () => {
      const profileBoundary = { userId: 'user-006', weight: 48, height: 173, bmi: 16.0, gender: 'male' };
      const result = generatePlan(profileBoundary, MOCK_EXERCISES);
      const exercise = result.weeks[0].days[0].exercises[0];
      expect(exercise.reps).toBe('10');
    });
  });

  describe('Group D: Gender-based exercise preference (BR-03)', () => {
    it('D-01: male profile should prioritize barbell exercises on Push day', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const pushDayExercises = result.weeks[0].days[0].exercises;
      const exerciseNames = pushDayExercises.map((ex) => ex.name);
      expect(exerciseNames.length).toBeGreaterThan(0);
      expect(exerciseNames).toContain('Bench Press');
    });

    it('D-02: female profile should prioritize bodyweight/dumbbell on Push day', () => {
      const result = generatePlan(FEMALE_NORMAL, MOCK_EXERCISES);
      const pushDayExercises = result.weeks[0].days[0].exercises;
      const exerciseNames = pushDayExercises.map((ex) => ex.name);
      expect(exerciseNames.length).toBeGreaterThan(0);
    });

    it('D-03: male and female profiles should produce different exercise selections', () => {
      const maleResult = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const femaleResult = generatePlan(FEMALE_NORMAL, MOCK_EXERCISES);
      const maleExercises = maleResult.weeks[0].days[0].exercises.map((ex) => ex.name);
      const femaleExercises = femaleResult.weeks[0].days[0].exercises.map((ex) => ex.name);
      expect(maleExercises).not.toEqual(femaleExercises);
    });
  });

  describe('Group E: Progressive overload across weeks (BR-06)', () => {
    it('E-01: week 1 exercises should have sets=3 and reps="10" (standard volume)', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const nonRestDays = result.weeks[0].days.filter((d) => !d.isRestDay);
      nonRestDays.forEach((day) => {
        day.exercises.forEach((ex) => {
          expect(ex.sets).toBe(3);
          expect(ex.reps).toBe('10');
        });
      });
    });

    it('E-01b: week 1 exercises for severe BMI should have sets=2-3 and reps="10-15"', () => {
      const result = generatePlan(MALE_SEVERE, MOCK_EXERCISES);
      const nonRestDays = result.weeks[0].days.filter((d) => !d.isRestDay);
      nonRestDays.forEach((day) => {
        day.exercises.forEach((ex) => {
          expect([2, 3]).toContain(ex.sets);
          expect(ex.reps).toBe('10-15');
        });
      });
    });

    it('E-02: week 2 exercises should have sets=3 and reps="10-12"', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const nonRestDays = result.weeks[1].days.filter((d) => !d.isRestDay);
      nonRestDays.forEach((day) => {
        day.exercises.forEach((ex) => {
          expect(ex.sets).toBe(3);
          expect(ex.reps).toBe('10-12');
        });
      });
    });

    it('E-03: week 3 exercises should have sets=4 and reps="8-10"', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const nonRestDays = result.weeks[2].days.filter((d) => !d.isRestDay);
      nonRestDays.forEach((day) => {
        day.exercises.forEach((ex) => {
          expect(ex.sets).toBe(4);
          expect(ex.reps).toBe('8-10');
        });
      });
    });

    it('E-04: week 4 exercises should have sets=4 and reps="8-12"', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const nonRestDays = result.weeks[3].days.filter((d) => !d.isRestDay);
      nonRestDays.forEach((day) => {
        day.exercises.forEach((ex) => {
          expect(ex.sets).toBe(4);
          expect(ex.reps).toBe('8-12');
        });
      });
    });

    it('E-05: sets should be non-decreasing and must increase from week 1 to week 3', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const week1Sets = result.weeks[0].days[0].exercises[0]?.sets || 0;
      const week2Sets = result.weeks[1].days[0].exercises[0]?.sets || 0;
      const week3Sets = result.weeks[2].days[0].exercises[0]?.sets || 0;
      const week4Sets = result.weeks[3].days[0].exercises[0]?.sets || 0;

      expect(week1Sets).toBeLessThanOrEqual(week2Sets);
      expect(week2Sets).toBeLessThanOrEqual(week3Sets);
      expect(week3Sets).toBeLessThanOrEqual(week4Sets);
      expect(week3Sets).toBeGreaterThan(week1Sets);
    });

    it('E-05b: severe BMI sets should be constant across all weeks (2-3 throughout)', () => {
      const result = generatePlan(MALE_SEVERE, MOCK_EXERCISES);
      const week1Sets = result.weeks[0].days[0].exercises[0]?.sets || 0;
      const week2Sets = result.weeks[1].days[0].exercises[0]?.sets || 0;
      const week3Sets = result.weeks[2].days[0].exercises[0]?.sets || 0;
      const week4Sets = result.weeks[3].days[0].exercises[0]?.sets || 0;

      expect([2, 3]).toContain(week1Sets);
      expect([2, 3]).toContain(week2Sets);
      expect([2, 3]).toContain(week3Sets);
      expect([2, 3]).toContain(week4Sets);
    });

    it('E-05c: severe BMI reps should remain at "10-15" across all weeks', () => {
      const result = generatePlan(MALE_SEVERE, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        week.days.forEach((day) => {
          if (!day.isRestDay) {
            day.exercises.forEach((ex) => {
              expect(ex.reps).toBe('10-15');
            });
          }
        });
      });
    });
  });

  describe('Group F: Denormalization (BR-07)', () => {
    it('F-01: each PlanExercise should have name and muscleGroup copied from source exercise', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const pushDayExercises = result.weeks[0].days[0].exercises;
      pushDayExercises.forEach((ex) => {
        expect(typeof ex.name).toBe('string');
        expect(ex.name.length).toBeGreaterThan(0);
        expect(['chest', 'shoulders', 'arms']).toContain(ex.muscleGroup);
      });
    });

    it('F-02: each PlanExercise should have restSeconds === 90', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        week.days.forEach((day) => {
          day.exercises.forEach((ex) => {
            expect(ex.restSeconds).toBe(90);
          });
        });
      });
    });

    it('F-03: order field should start at 1 and be contiguous per day', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const pushDay = result.weeks[0].days[0];
      pushDay.exercises.forEach((ex, i) => {
        expect(ex.order).toBe(i + 1);
      });
    });
  });

  describe('Group G: Push/Pull/Legs muscle group correctness (BR-05)', () => {
    it('G-01: Push day exercises should only belong to chest, shoulders, or arms', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        const pushDay = week.days[0];
        pushDay.exercises.forEach((ex) => {
          expect(['chest', 'shoulders', 'arms']).toContain(ex.muscleGroup);
        });
      });
    });

    it('G-02: Pull day exercises should only belong to back or arms', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        const pullDay = week.days[2];
        pullDay.exercises.forEach((ex) => {
          expect(['back', 'arms']).toContain(ex.muscleGroup);
        });
      });
    });

    it('G-03: Legs day exercises should only belong to legs or core', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        const legsDay = week.days[4];
        legsDay.exercises.forEach((ex) => {
          expect(['legs', 'core']).toContain(ex.muscleGroup);
        });
      });
    });
  });

  describe('Group H: Edge cases', () => {
    it('H-01: inactive exercises should not appear in any day', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      const inactiveExerciseName = 'Inactive Exercise';
      result.weeks.forEach((week) => {
        week.days.forEach((day) => {
          day.exercises.forEach((ex) => {
            expect(ex.name).not.toBe(inactiveExerciseName);
          });
        });
      });
    });

    it('H-02: each non-rest day should have between 3 and 4 exercises inclusive', () => {
      const result = generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      result.weeks.forEach((week) => {
        week.days.forEach((day) => {
          if (!day.isRestDay) {
            expect(day.exercises.length).toBeGreaterThanOrEqual(3);
            expect(day.exercises.length).toBeLessThanOrEqual(4);
          }
        });
      });
    });

    it('H-03: function should not mutate the input exercises array', () => {
      const exercisesCopy = JSON.parse(JSON.stringify(MOCK_EXERCISES));
      generatePlan(MALE_NORMAL, MOCK_EXERCISES);
      expect(MOCK_EXERCISES.length).toBe(exercisesCopy.length);
    });

    it('H-04: BMI 15.999 should trigger the low-volume path (< 16 boundary)', () => {
      const profileBoundary = { userId: 'user-007', weight: 45.8, height: 173, bmi: 15.999, gender: 'male' };
      const result = generatePlan(profileBoundary, MOCK_EXERCISES);
      const exercise = result.weeks[0].days[0].exercises[0];
      expect(exercise.reps).toBe('10-15');
    });
  });
});
