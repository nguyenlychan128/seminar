import api from './api';

const mapError = (error) => {
  if (!error.response) {
    return 'Network error - please try again';
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return `Invalid input - ${data.message || 'please check your input'}`;
    case 401:
    case 403:
      return 'Unauthorized - Admin access required';
    case 404:
      return data.message || 'Resource not found';
    case 409:
      return data.message || 'Conflict - resource already exists';
    case 500:
      return 'Server error - please try again';
    default:
      return data.message || 'An error occurred';
  }
};

export const getUsers = async (page = 1, filters = {}) => {
  try {
    const { email = '', status = 'active' } = filters;
    const params = {
      page,
      limit: 10,
      ...(email && { email }),
      ...(status && { status }),
    };

    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await api.patch(`/admin/users/${userId}`, {
      action: 'deactivate',
    });
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const reactivateUser = async (userId) => {
  try {
    const response = await api.patch(`/admin/users/${userId}`, {
      action: 'reactivate',
    });
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const getExercises = async (page = 1, filters = {}) => {
  try {
    const { search = '', muscleGroup = '' } = filters;
    const params = {
      page,
      limit: 10,
      ...(search && { search }),
      ...(muscleGroup && { muscleGroup }),
    };

    const response = await api.get('/admin/exercises', { params });
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const createExercise = async (data) => {
  try {
    const response = await api.post('/admin/exercises', data);
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const updateExercise = async (exerciseId, data) => {
  try {
    const response = await api.patch(`/admin/exercises/${exerciseId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};

export const deleteExercise = async (exerciseId) => {
  try {
    const response = await api.delete(`/admin/exercises/${exerciseId}`);
    return response.data;
  } catch (error) {
    throw new Error(mapError(error));
  }
};
