'use strict';

const { calculateBmi, classifyBmi } = require('../../src/utils/bmi');

describe('bmi.js', () => {
  describe('calculateBmi(height_cm, weight_kg)', () => {
    it('should return 17.63 for height=165, weight=48 (spec example)', () => {
      expect(calculateBmi(165, 48)).toBe(17.63);
    });

    it('should return correct BMI for height=175, weight=70', () => {
      // 70 / (1.75)^2 = 22.857... → 22.86
      expect(calculateBmi(175, 70)).toBe(22.86);
    });

    it('should return correct BMI for height=170, weight=85', () => {
      // 85 / (1.70)^2 = 29.411... → 29.41
      expect(calculateBmi(170, 85)).toBe(29.41);
    });

    it('should return correct BMI for height=180, weight=100', () => {
      // 100 / (1.80)^2 = 30.864... → 30.86
      expect(calculateBmi(180, 100)).toBe(30.86);
    });

    it('should return correct BMI for boundary min: height=100, weight=20', () => {
      // 20 / (1.00)^2 = 20
      expect(calculateBmi(100, 20)).toBe(20);
    });

    it('should return correct BMI for boundary max: height=250, weight=300', () => {
      // 300 / (2.50)^2 = 48
      expect(calculateBmi(250, 300)).toBe(48);
    });

    it('should round to at most 2 decimal places', () => {
      const result = calculateBmi(165, 48);
      const str = result.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('should return a Number type', () => {
      expect(typeof calculateBmi(165, 48)).toBe('number');
    });

    it('should throw when height_cm = 0 (division by zero guard)', () => {
      expect(() => calculateBmi(0, 50)).toThrow('height_cm must be a positive number');
    });

    it('should throw when height_cm is negative', () => {
      expect(() => calculateBmi(-10, 50)).toThrow('height_cm must be a positive number');
    });

    it('should throw when weight_kg is negative', () => {
      expect(() => calculateBmi(165, -5)).toThrow('weight_kg must be a non-negative number');
    });
  });

  describe('classifyBmi(bmi)', () => {
    it("should return 'underweight' for bmi = 17.63", () => {
      expect(classifyBmi(17.63)).toBe('underweight');
    });

    it("should return 'normal' for bmi = 22.00", () => {
      expect(classifyBmi(22.0)).toBe('normal');
    });

    it("should return 'overweight' for bmi = 27.50", () => {
      expect(classifyBmi(27.5)).toBe('overweight');
    });

    it("should return 'obese' for bmi = 35.00", () => {
      expect(classifyBmi(35.0)).toBe('obese');
    });

    // Boundary: 18.5
    it("should return 'underweight' for bmi = 18.49 (just below 18.5)", () => {
      expect(classifyBmi(18.49)).toBe('underweight');
    });

    it("should return 'normal' for bmi = 18.5 (lower bound of normal)", () => {
      expect(classifyBmi(18.5)).toBe('normal');
    });

    // Boundary: 24.9 / 25.0
    it("should return 'normal' for bmi = 24.9 (upper bound of normal)", () => {
      expect(classifyBmi(24.9)).toBe('normal');
    });

    it("should return 'overweight' for bmi = 25.0 (lower bound of overweight)", () => {
      expect(classifyBmi(25.0)).toBe('overweight');
    });

    // Boundary: 29.9 / 30.0
    it("should return 'overweight' for bmi = 29.9 (upper bound of overweight)", () => {
      expect(classifyBmi(29.9)).toBe('overweight');
    });

    it("should return 'obese' for bmi = 30.0 (lower bound of obese)", () => {
      expect(classifyBmi(30.0)).toBe('obese');
    });

    it("should return 'underweight' for very low bmi (10.0)", () => {
      expect(classifyBmi(10.0)).toBe('underweight');
    });

    it("should return 'obese' for very high bmi (50.0)", () => {
      expect(classifyBmi(50.0)).toBe('obese');
    });

    it('should return a String type', () => {
      expect(typeof classifyBmi(22)).toBe('string');
    });
  });
});
