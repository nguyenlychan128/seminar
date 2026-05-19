import api from './api';

const createUserError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  err.code = `HTTP_${status}`;
  return err;
};

const mapHttpError = (error) => {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;

  if (status === 404) throw createUserError('Profile not found', 404);
  if (status === 409) throw createUserError('Profile already exists', 409);
  if (status === 401) throw createUserError('Session expired. Please log in again.', 401);
  if (status === 400) throw createUserError(serverMessage || 'Invalid data', 400);
  throw createUserError(serverMessage || 'Something went wrong', status || 500);
};

const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  createProfile: async (data) => {
    try {
      const response = await api.post('/users/profile', data);
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/users/profile', data);
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },

  calcBmi: async (height, weight) => {
    try {
      const response = await api.get('/users/profile/bmi', {
        params: { height, weight },
      });
      return response.data;
    } catch (error) {
      mapHttpError(error);
    }
  },
};

export default userService;
