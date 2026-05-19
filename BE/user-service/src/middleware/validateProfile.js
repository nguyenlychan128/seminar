'use strict';

const COMPUTED_FIELDS = ['bmi', 'bodyClassification'];

function validateCreateProfile(req, res, next) {
  const body = req.body;

  for (const field of COMPUTED_FIELDS) {
    if (field in body) {
      return res.status(400).json({ success: false, message: `Field '${field}' is not allowed in request body` });
    }
  }

  const errors = [];

  const { height, weight, age, gender } = body;

  if (height === undefined || height === null) {
    errors.push('height is required');
  } else if (typeof height !== 'number' || height < 100 || height > 250) {
    errors.push('height must be a number between 100 and 250');
  }

  if (weight === undefined || weight === null) {
    errors.push('weight is required');
  } else if (typeof weight !== 'number' || weight < 20 || weight > 300) {
    errors.push('weight must be a number between 20 and 300');
  }

  if (age === undefined || age === null) {
    errors.push('age is required');
  } else if (typeof age !== 'number' || !Number.isInteger(age) || age < 10 || age > 100) {
    errors.push('age must be an integer between 10 and 100');
  }

  if (gender === undefined || gender === null) {
    errors.push('gender is required');
  } else if (!['male', 'female'].includes(gender)) {
    errors.push('gender must be male or female');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
}

function validateUpdateProfile(req, res, next) {
  const body = req.body;

  for (const field of COMPUTED_FIELDS) {
    if (field in body) {
      return res.status(400).json({ success: false, message: `Field '${field}' is not allowed in request body` });
    }
  }

  const allowedFields = ['height', 'weight', 'age', 'gender'];
  const provided = allowedFields.filter(f => f in body);

  if (provided.length === 0) {
    return res.status(400).json({ success: false, message: 'Request body must contain at least one field to update' });
  }

  const errors = [];
  const { height, weight, age, gender } = body;

  if ('height' in body) {
    if (typeof height !== 'number' || height < 100 || height > 250) {
      errors.push('height must be a number between 100 and 250');
    }
  }

  if ('weight' in body) {
    if (typeof weight !== 'number' || weight < 20 || weight > 300) {
      errors.push('weight must be a number between 20 and 300');
    }
  }

  if ('age' in body) {
    if (typeof age !== 'number' || !Number.isInteger(age) || age < 10 || age > 100) {
      errors.push('age must be an integer between 10 and 100');
    }
  }

  if ('gender' in body) {
    if (!['male', 'female'].includes(gender)) {
      errors.push('gender must be male or female');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }

  next();
}

module.exports = { validateCreateProfile, validateUpdateProfile };
