import api from './api';

const createWeightLogError = (message, status, field = null) => {
  const err = new Error(message);
  err.status = status;
  err.code = status === 400 ? 'VALIDATION_ERROR' : status === 409 ? 'DUPLICATE_ENTRY' : status === 401 ? 'UNAUTHORIZED' : 'SERVER_ERROR';
  err.field = field;
  return err;
};

const mapHttpError = (error) => {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message || error.response?.data?.error;
  const field = error.response?.data?.field;

  if (status === 400) {
    throw createWeightLogError(serverMessage || 'Invalid weight or date', 400, field);
  }
  if (status === 409) {
    throw createWeightLogError('Weight entry already exists for this date', 409);
  }
  if (status === 401) {
    throw createWeightLogError('Please log in again', 401);
  }
  if (status === 500) {
    throw createWeightLogError('Server error. Please try again later', 500);
  }
  throw createWeightLogError('An unexpected error occurred. Please try again', status || 500);
};

const weightLogService = {
  createWeightLog: async (weight, date = null) => {
    try {
      const body = { weight };
      if (date !== null) {
        body.date = date;
      }
      const response = await api.post('/progress/weight', body);
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  getWeightHistory: async (startDate = null, endDate = null, limit = 30) => {
    try {
      const params = {};
      if (startDate !== null) params.startDate = startDate;
      if (endDate !== null) params.endDate = endDate;
      if (limit !== null) params.limit = limit;

      const response = await api.get('/progress/weight', { params });
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },
};

export default weightLogService;
