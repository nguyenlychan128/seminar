'use strict';

/**
 * @param {number} height_cm
 * @param {number} weight_kg
 * @returns {number} BMI rounded to 2 decimal places
 */
function calculateBmi(height_cm, weight_kg) {
  if (!height_cm || height_cm <= 0) throw new Error('height_cm must be a positive number');
  if (weight_kg == null || weight_kg < 0) throw new Error('weight_kg must be a non-negative number');
  const heightM = height_cm / 100;
  return Math.round((weight_kg / (heightM * heightM)) * 100) / 100;
}

/**
 * @param {number} bmi
 * @returns {'underweight'|'normal'|'overweight'|'obese'}
 */
function classifyBmi(bmi) {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

module.exports = { calculateBmi, classifyBmi };
