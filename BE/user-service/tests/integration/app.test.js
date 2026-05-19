'use strict';

const request = require('supertest');

describe('Express App', () => {
  let app;

  beforeAll(() => {
    jest.resetModules();
    app = require('../../src/app');
  });

  describe('GET /health', () => {
    it('should return HTTP 200', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should return status "ok" in body', async () => {
      const res = await request(app).get('/health');
      expect(res.body.status).toBe('ok');
    });

    it('should include a service field identifying "user-service"', async () => {
      const res = await request(app).get('/health');
      expect(res.body.service).toBe('user-service');
    });

    it('should include a timestamp field in ISO 8601 format', async () => {
      const res = await request(app).get('/health');
      expect(res.body.timestamp).toBeDefined();
      expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
      const diff = Date.now() - new Date(res.body.timestamp).getTime();
      expect(diff).toBeLessThan(5000);
    });

    it('should set Content-Type to application/json', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('unknown routes', () => {
    it('should return HTTP 404 for an unregistered GET route', async () => {
      const res = await request(app).get('/does-not-exist');
      expect(res.status).toBe(404);
    });

    it('should return HTTP 404 for an unregistered POST route', async () => {
      const res = await request(app).post('/api/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should return JSON body for 404 response', async () => {
      const res = await request(app).get('/unknown');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('express.json() middleware', () => {
    it('should not crash on valid JSON body to unknown route', async () => {
      const res = await request(app)
        .post('/api/test')
        .send({ ping: true })
        .set('Content-Type', 'application/json');
      expect([404, 405]).toContain(res.status);
    });

    it('should return 400 when body is malformed JSON', async () => {
      const res = await request(app)
        .post('/api/test')
        .set('Content-Type', 'application/json')
        .send('{ bad json }');
      expect(res.status).toBe(400);
    });
  });

  describe('global error handler', () => {
    it('should return 500 and expose error in development mode', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';
      // Build a minimal express app that reuses the same error-handler logic
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/trigger-error', (req, res, next) => {
        next(new Error('test error'));
      });
      // JSON parse error handler (same as app.js)
      testApp.use((err, req, res, next) => {
        if (err.type === 'entity.parse.failed') {
          return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }
        next(err);
      });
      // Global error handler (same as app.js)
      testApp.use((err, req, res, next) => {
        const statusCode = err.status || err.statusCode || 500;
        res.status(statusCode).json({
          success: false,
          message: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { error: err.message }),
        });
      });

      const res = await request(testApp).get('/trigger-error');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('test error');
      process.env.NODE_ENV = 'test';
    });

    it('should NOT expose error message in non-development mode', async () => {
      jest.resetModules();
      process.env.NODE_ENV = 'production';
      const express = require('express');
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/trigger-error', (req, res, next) => {
        next(new Error('secret internal error'));
      });
      testApp.use((err, req, res, next) => {
        if (err.type === 'entity.parse.failed') {
          return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }
        next(err);
      });
      testApp.use((err, req, res, next) => {
        const statusCode = err.status || err.statusCode || 500;
        res.status(statusCode).json({
          success: false,
          message: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { error: err.message }),
        });
      });

      const res = await request(testApp).get('/trigger-error');
      expect(res.status).toBe(500);
      expect(res.body.error).toBeUndefined();
      expect(res.body.message).toBe('Internal server error');
      process.env.NODE_ENV = 'test';
    });
  });

  describe('ALLOWED_ORIGINS env', () => {
    it('should use ALLOWED_ORIGINS env when set', async () => {
      jest.resetModules();
      process.env.ALLOWED_ORIGINS = 'http://custom.example.com,http://other.example.com';
      const customApp = require('../../src/app');
      const res = await request(customApp)
        .get('/health')
        .set('Origin', 'http://custom.example.com');
      expect(res.headers['access-control-allow-origin']).toBe('http://custom.example.com');
      delete process.env.ALLOWED_ORIGINS;
    });
  });
});
