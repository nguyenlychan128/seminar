'use strict';

describe('userServiceClient', () => {
  let getUserProfile;
  let mockAxiosInstance;

  beforeEach(() => {
    jest.resetModules();

    mockAxiosInstance = {
      get: jest.fn(),
      defaults: { baseURL: '', timeout: 0 },
    };

    jest.mock('axios', () => ({
      create: jest.fn(() => mockAxiosInstance),
    }));

    jest.mock('../../src/utils/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }));

    ({ getUserProfile } = require('../../src/config/userServiceClient'));
  });

  describe('module shape', () => {
    it('should load without throwing', () => {
      expect(() => require('../../src/config/userServiceClient')).not.toThrow();
    });

    it('should export a getUserProfile function', () => {
      expect(typeof getUserProfile).toBe('function');
    });
  });

  describe('axios instance configuration', () => {
    it('should create axios instance with axios.create()', () => {
      const axios = require('axios');
      expect(axios.create).toHaveBeenCalledTimes(1);
    });

    it('should configure timeout of 5000ms', () => {
      const axios = require('axios');
      const createArgs = axios.create.mock.calls[0][0];
      expect(createArgs.timeout).toBe(5000);
    });

    it('should use USER_SERVICE_URL env as baseURL when set', () => {
      jest.resetModules();
      process.env.USER_SERVICE_URL = 'http://user-service:3002/api/users';
      jest.mock('axios', () => ({
        create: jest.fn(() => mockAxiosInstance),
      }));
      jest.mock('../../src/utils/logger', () => ({
        info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
      }));

      require('../../src/config/userServiceClient');
      const axios = require('axios');
      expect(axios.create.mock.calls[0][0].baseURL).toBe('http://user-service:3002/api/users');
      delete process.env.USER_SERVICE_URL;
    });

    it('should use fallback baseURL when USER_SERVICE_URL not set', () => {
      jest.resetModules();
      delete process.env.USER_SERVICE_URL;
      jest.mock('axios', () => ({
        create: jest.fn(() => mockAxiosInstance),
      }));
      jest.mock('../../src/utils/logger', () => ({
        info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
      }));

      require('../../src/config/userServiceClient');
      const axios = require('axios');
      expect(axios.create.mock.calls[0][0].baseURL).toBe('http://localhost/api/users');
    });
  });

  describe('getUserProfile(accessToken)', () => {
    it('should call GET /profile with Authorization Bearer header', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { userId: 'u1' } });

      await getUserProfile('my-token');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/profile',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      );
    });

    it('should return the response data on success', async () => {
      const mockProfile = { userId: 'u1', height: 170, weight: 55 };
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockProfile });

      const result = await getUserProfile('valid-token');

      expect(result).toEqual(mockProfile);
    });
  });

  describe('getUserProfile — error handling', () => {
    it('should throw "User profile not found" when response status is 404', async () => {
      const notFoundError = new Error('Request failed with status code 404');
      notFoundError.response = { status: 404 };
      mockAxiosInstance.get.mockRejectedValueOnce(notFoundError);

      await expect(getUserProfile('token')).rejects.toThrow('User profile not found');
    });

    it('should log warn before throwing on 404', async () => {
      const notFoundError = new Error('Request failed with status code 404');
      notFoundError.response = { status: 404 };
      mockAxiosInstance.get.mockRejectedValueOnce(notFoundError);
      const logger = require('../../src/utils/logger');

      try { await getUserProfile('token'); } catch (_) {}

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should rethrow the original error for non-404 HTTP errors (500)', async () => {
      const serverError = new Error('Request failed with status code 500');
      serverError.response = { status: 500 };
      mockAxiosInstance.get.mockRejectedValueOnce(serverError);

      await expect(getUserProfile('token')).rejects.toThrow(serverError);
    });

    it('should rethrow error on network timeout', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockAxiosInstance.get.mockRejectedValueOnce(timeoutError);

      await expect(getUserProfile('token')).rejects.toThrow('timeout of 5000ms exceeded');
    });

    it('should log error for non-404 failures', async () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = { status: 500 };
      mockAxiosInstance.get.mockRejectedValueOnce(serverError);
      const logger = require('../../src/utils/logger');

      try { await getUserProfile('token'); } catch (_) {}

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
