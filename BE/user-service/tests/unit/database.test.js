'use strict';

describe('database', () => {
  let connectDatabase;
  let disconnectDatabase;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.mock('mongoose');
    jest.mock('../../src/utils/logger', () => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    }));

    ({ connectDatabase, disconnectDatabase } = require('../../src/config/database'));
  });

  describe('connectDatabase()', () => {
    it('should call mongoose.connect once', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = { readyState: 1 };

      await connectDatabase();

      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
    });

    it('should pass MONGO_URI env variable to mongoose.connect', async () => {
      process.env.MONGO_URI = 'mongodb://testhost:27017/fitgainer-user';
      jest.resetModules();
      jest.mock('mongoose');
      jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));
      const { connectDatabase: connect } = require('../../src/config/database');
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://testhost:27017/fitgainer-user',
        expect.any(Object)
      );
      delete process.env.MONGO_URI;
    });

    it('should use fallback URI when MONGO_URI is not set', async () => {
      delete process.env.MONGO_URI;
      jest.resetModules();
      jest.mock('mongoose');
      jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));
      const { connectDatabase: connect } = require('../../src/config/database');
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/fitgainer-user',
        expect.any(Object)
      );
    });

    it('should pass minPoolSize: 5 in options', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connectDatabase();

      const options = mockMongoose.connect.mock.calls[0][1];
      expect(options.minPoolSize).toBe(5);
    });

    it('should pass maxPoolSize: 20 in options', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connectDatabase();

      const options = mockMongoose.connect.mock.calls[0][1];
      expect(options.maxPoolSize).toBe(20);
    });

    it('should pass serverSelectionTimeoutMS: 5000 in options', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connectDatabase();

      const options = mockMongoose.connect.mock.calls[0][1];
      expect(options.serverSelectionTimeoutMS).toBe(5000);
    });

    it('should pass connectTimeoutMS: 5000 in options', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};

      await connectDatabase();

      const options = mockMongoose.connect.mock.calls[0][1];
      expect(options.connectTimeoutMS).toBe(5000);
    });

    it('should return mongoose.connection on success', async () => {
      const fakeConnection = { readyState: 1 };
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = fakeConnection;

      const result = await connectDatabase();

      expect(result).toBe(fakeConnection);
    });

    it('should throw the original error when mongoose.connect rejects', async () => {
      const dbError = new Error('connection refused');
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockRejectedValueOnce(dbError);

      await expect(connectDatabase()).rejects.toThrow('connection refused');
    });

    it('should NOT log raw credentials from MONGO_URI', async () => {
      process.env.MONGO_URI = 'mongodb://admin:secret@prodhost:27017/fitgainer-user';
      jest.resetModules();
      jest.mock('mongoose');
      jest.mock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));
      const { connectDatabase: connect } = require('../../src/config/database');
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce({});
      mockMongoose.connection = {};
      const logger = require('../../src/utils/logger');

      await connect();

      logger.info.mock.calls.forEach(([msg, meta]) => {
        const serialized = JSON.stringify({ msg, meta });
        expect(serialized).not.toContain('secret');
      });
      delete process.env.MONGO_URI;
    });
  });

  describe('disconnectDatabase()', () => {
    it('should call mongoose.disconnect once', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.disconnect.mockResolvedValueOnce();

      await disconnectDatabase();

      expect(mockMongoose.disconnect).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error on success', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.disconnect.mockResolvedValueOnce();

      await expect(disconnectDatabase()).resolves.not.toThrow();
    });

    it('should throw the original error when mongoose.disconnect rejects', async () => {
      const disconnectError = new Error('disconnect failed');
      const mockMongoose = require('mongoose');
      mockMongoose.disconnect.mockRejectedValueOnce(disconnectError);

      await expect(disconnectDatabase()).rejects.toThrow('disconnect failed');
    });
  });
});
