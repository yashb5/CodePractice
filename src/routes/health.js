const express = require('express');
const router = express.Router();
const codeExecutor = require('../utils/codeExecutor');

module.exports = function(db) {
  router.get('/live', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  router.get('/ready', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'ok' },
        codeExecutor: { status: 'ok', compilers: codeExecutor.availableCompilers }
      }
    };

    try {
      db.prepare('SELECT 1 as health_check').get();
    } catch (error) {
      health.checks.database = { status: 'error', message: error.message };
      health.status = 'degraded';
    }

    try {
      const testCode = 'console.log("Health check OK"); function test() { return 42; } test();';
      const testResult = await codeExecutor.runInterviewCode(testCode, 'javascript');
      if (!testResult.success) {
        health.checks.codeExecutor = { status: 'error', message: testResult.error || 'Execution failed' };
        health.status = 'degraded';
      } else {
        health.checks.codeExecutor.output = testResult.output ? testResult.output.trim() : '';
      }
    } catch (error) {
      health.checks.codeExecutor = { status: 'error', message: error.message };
      health.status = 'degraded';
    }

    health.system = {
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      platform: process.platform
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  router.get('/', (req, res) => {
    res.json({ status: 'healthy', checks: ['server', 'database', 'code-executor'] });
  });

  return router;
};
