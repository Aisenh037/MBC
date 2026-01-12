/**
 * Health Check Routes
 * Provides health status endpoints for monitoring and load balancers
 */

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import config from '@/config/config';
import redisService from '@/services/redisService';
import logger from '@/utils/logger';

interface HealthServiceStatus {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}

interface DetailedHealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: HealthServiceStatus;
    redis: HealthServiceStatus;
    auth: HealthServiceStatus;
  };
}

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

/**
 * Basic health check endpoint
 * @route GET /api/v1/health
 * @access Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
        supabase: 'unknown'
      }
    };

    // Check database connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      healthStatus.services.database = error ? 'unhealthy' : 'healthy';
    } catch (error) {
      healthStatus.services.database = 'unhealthy';
      logger.error('Database health check failed:', error);
    }

    // Check Redis connection
    try {
      await redisService.ping();
      healthStatus.services.redis = 'healthy';
    } catch (error) {
      healthStatus.services.redis = 'unhealthy';
      logger.error('Redis health check failed:', error);
    }

    // Check Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession();
      healthStatus.services.supabase = 'healthy';
    } catch (error) {
      healthStatus.services.supabase = 'unhealthy';
      logger.error('Supabase health check failed:', error);
    }

    // Determine overall health
    const allServicesHealthy = Object.values(healthStatus.services).every(
      status => status === 'healthy'
    );

    if (!allServicesHealthy) {
      healthStatus.status = 'degraded';
      res.status(503);
    } else {
      res.status(200);
    }

    res.json(healthStatus);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error during health check'
    });
  }
});

/**
 * Detailed health check endpoint
 * @route GET /api/v1/health/detailed
 * @access Public
 */
router.get('/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss
        },
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      services: {
        database: { status: 'unknown', responseTime: 0 },
        redis: { status: 'unknown', responseTime: 0 },
        auth: { status: 'unknown', responseTime: 0 }
      }
    };

    // Check database with timing
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      detailedHealth.services.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: Date.now() - dbStart,
        ...(error && { error: error?.message })
      } as HealthServiceStatus;
    } catch (error: any) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: Date.now() - dbStart,
        error: error.message
      } as HealthServiceStatus;
    }

    // Check Redis with timing
    const redisStart = Date.now();
    try {
      await redisService.ping();
      detailedHealth.services.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart
      };
    } catch (error: any) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: Date.now() - redisStart,
        error: error.message
      } as HealthServiceStatus;
    }

    // Check Supabase with timing
    const supabaseStart = Date.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      detailedHealth.services.auth = {
        status: 'healthy',
        responseTime: Date.now() - supabaseStart
      } as HealthServiceStatus;
    } catch (error: any) {
      detailedHealth.services.auth = {
        status: 'unhealthy',
        responseTime: Date.now() - supabaseStart,
        error: error.message
      } as HealthServiceStatus;
    }

    // Determine overall health
    const allServicesHealthy = Object.values(detailedHealth.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      detailedHealth.status = 'degraded';
      res.status(503);
    } else {
      res.status(200);
    }

    res.json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error during detailed health check'
    });
  }
});

/**
 * Readiness probe endpoint
 * @route GET /api/v1/health/ready
 * @access Public
 */
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if all critical services are ready
    const checks = await Promise.allSettled([
      supabase.from('users').select('count').limit(1),
      redisService.ping()
    ]);

    const allReady = checks.every(check => check.status === 'fulfilled');

    if (allReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * Liveness probe endpoint
 * @route GET /api/v1/health/live
 * @access Public
 */
router.get('/live', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;