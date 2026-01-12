/**
 * Monitoring and Performance Middleware
 * Provides application performance monitoring, metrics collection, and health tracking
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import logger from '@/utils/logger';

// Performance metrics storage
interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  errorCount: number;
  slowRequestCount: number;
  endpoints: Map<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    errors: number;
  }>;
}

const metrics: PerformanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  averageResponseTime: 0,
  errorCount: 0,
  slowRequestCount: 0,
  endpoints: new Map()
};

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now();
  const startTimestamp = Date.now();

  // Add request metadata
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = startTimestamp;

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    // Update global metrics
    metrics.requestCount++;
    metrics.totalResponseTime += responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.requestCount;

    // Track slow requests (>1000ms)
    if (responseTime > 1000) {
      metrics.slowRequestCount++;
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        endpoint,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }

    // Track errors
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }

    // Update endpoint-specific metrics
    if (!metrics.endpoints.has(endpoint)) {
      metrics.endpoints.set(endpoint, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        errors: 0
      });
    }

    const endpointMetrics = metrics.endpoints.get(endpoint)!;
    endpointMetrics.count++;
    endpointMetrics.totalTime += responseTime;
    endpointMetrics.averageTime = endpointMetrics.totalTime / endpointMetrics.count;

    if (res.statusCode >= 400) {
      endpointMetrics.errors++;
    }

    // Log request completion
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime.toFixed(2)}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Memory usage monitoring
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage for high-memory requests
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
    logger.warn('High memory usage detected', {
      requestId: req.requestId,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`
    });
  }

  next();
};

// Error tracking middleware
export const errorTracking = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Application error', {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  next(error);
};

// Metrics endpoint
export const getMetrics = (req: Request, res: Response): void => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const metricsData = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    },
    performance: {
      totalRequests: metrics.requestCount,
      averageResponseTime: parseFloat(metrics.averageResponseTime.toFixed(2)),
      totalErrors: metrics.errorCount,
      errorRate: parseFloat(((metrics.errorCount / metrics.requestCount) * 100).toFixed(2)),
      slowRequests: metrics.slowRequestCount,
      slowRequestRate: parseFloat(((metrics.slowRequestCount / metrics.requestCount) * 100).toFixed(2))
    },
    endpoints: Array.from(metrics.endpoints.entries()).map(([endpoint, data]) => ({
      endpoint,
      requests: data.count,
      averageResponseTime: parseFloat(data.averageTime.toFixed(2)),
      errors: data.errors,
      errorRate: parseFloat(((data.errors / data.count) * 100).toFixed(2))
    })).sort((a, b) => b.requests - a.requests)
  };

  res.json(metricsData);
};

// Reset metrics (for testing/debugging)
export const resetMetrics = (req: Request, res: Response): void => {
  metrics.requestCount = 0;
  metrics.totalResponseTime = 0;
  metrics.averageResponseTime = 0;
  metrics.errorCount = 0;
  metrics.slowRequestCount = 0;
  metrics.endpoints.clear();

  logger.info('Performance metrics reset', {
    requestId: req.requestId,
    resetBy: req.user?.id || 'anonymous'
  });

  res.json({
    success: true,
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString()
  });
};

// Prometheus-style metrics export
export const prometheusMetrics = (req: Request, res: Response): void => {
  const memUsage = process.memoryUsage();
  
  let output = '';
  
  // Request metrics
  output += `# HELP http_requests_total Total number of HTTP requests\n`;
  output += `# TYPE http_requests_total counter\n`;
  output += `http_requests_total ${metrics.requestCount}\n\n`;
  
  // Response time metrics
  output += `# HELP http_request_duration_ms Average HTTP request duration in milliseconds\n`;
  output += `# TYPE http_request_duration_ms gauge\n`;
  output += `http_request_duration_ms ${metrics.averageResponseTime.toFixed(2)}\n\n`;
  
  // Error metrics
  output += `# HELP http_requests_errors_total Total number of HTTP request errors\n`;
  output += `# TYPE http_requests_errors_total counter\n`;
  output += `http_requests_errors_total ${metrics.errorCount}\n\n`;
  
  // Memory metrics
  output += `# HELP nodejs_memory_heap_used_bytes Node.js heap memory used in bytes\n`;
  output += `# TYPE nodejs_memory_heap_used_bytes gauge\n`;
  output += `nodejs_memory_heap_used_bytes ${memUsage.heapUsed}\n\n`;
  
  output += `# HELP nodejs_memory_heap_total_bytes Node.js heap memory total in bytes\n`;
  output += `# TYPE nodejs_memory_heap_total_bytes gauge\n`;
  output += `nodejs_memory_heap_total_bytes ${memUsage.heapTotal}\n\n`;
  
  // Uptime metrics
  output += `# HELP nodejs_uptime_seconds Node.js uptime in seconds\n`;
  output += `# TYPE nodejs_uptime_seconds gauge\n`;
  output += `nodejs_uptime_seconds ${process.uptime()}\n\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(output);
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}