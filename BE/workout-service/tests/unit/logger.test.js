'use strict';

describe('logger', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.LOG_LEVEL;
  });

  describe('module loading', () => {
    it('should load without throwing', () => {
      expect(() => require('../../src/utils/logger')).not.toThrow();
    });

    it('should export an object (winston logger instance)', () => {
      const logger = require('../../src/utils/logger');
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
    });
  });

  describe('log level methods', () => {
    it('should have an info() method', () => {
      const logger = require('../../src/utils/logger');
      expect(typeof logger.info).toBe('function');
    });

    it('should have a warn() method', () => {
      const logger = require('../../src/utils/logger');
      expect(typeof logger.warn).toBe('function');
    });

    it('should have an error() method', () => {
      const logger = require('../../src/utils/logger');
      expect(typeof logger.error).toBe('function');
    });

    it('should have a debug() method', () => {
      const logger = require('../../src/utils/logger');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('log level from environment', () => {
    it('should use LOG_LEVEL env value when set', () => {
      process.env.LOG_LEVEL = 'warn';
      jest.resetModules();
      const logger = require('../../src/utils/logger');
      expect(logger.level).toBe('warn');
    });

    it('should default to "debug" when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;
      jest.resetModules();
      const logger = require('../../src/utils/logger');
      expect(logger.level).toBe('debug');
    });
  });

  describe('service identity', () => {
    it('should carry defaultMeta with service "workout-service"', () => {
      const logger = require('../../src/utils/logger');
      expect(logger.defaultMeta).toBeDefined();
      expect(logger.defaultMeta.service).toBe('workout-service');
    });
  });

  describe('transports', () => {
    it('should have at least one transport (console)', () => {
      const logger = require('../../src/utils/logger');
      expect(logger.transports.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT create file transports when NODE_ENV=test', () => {
      const logger = require('../../src/utils/logger');
      const fileTransports = logger.transports.filter(
        (t) => t.constructor.name === 'File'
      );
      expect(fileTransports.length).toBe(0);
    });

    it('should create file transports when NODE_ENV is "development"', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const logger = require('../../src/utils/logger');
      const fileTransports = logger.transports.filter(
        (t) => t.constructor.name === 'File'
      );
      expect(fileTransports.length).toBeGreaterThanOrEqual(1);
      process.env.NODE_ENV = 'test';
    });
  });

  describe('calling log methods', () => {
    it('should call info() without throwing', () => {
      const logger = require('../../src/utils/logger');
      expect(() => logger.info('test info message')).not.toThrow();
    });

    it('should call error() with metadata object without throwing', () => {
      const logger = require('../../src/utils/logger');
      expect(() => logger.error('test error', { code: 500 })).not.toThrow();
    });

    it('should call warn() without throwing', () => {
      const logger = require('../../src/utils/logger');
      expect(() => logger.warn('test warning')).not.toThrow();
    });

    it('should call debug() without throwing', () => {
      const logger = require('../../src/utils/logger');
      expect(() => logger.debug('test debug', { userId: 'abc' })).not.toThrow();
    });
  });
});
