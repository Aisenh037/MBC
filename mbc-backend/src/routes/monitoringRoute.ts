/**
 * Monitoring Routes
 * Provides endpoints for system monitoring, metrics, and performance data
 */

import { Router } from 'express';
import { protect, authorize } from '@/middleware/auth';
import { getMetrics, resetMetrics, prometheusMetrics } from '@/middleware/monitoring';

const router = Router();

/**
 * Get application metrics
 * @route GET /api/v1/monitoring/metrics
 * @access Private (Admin only)
 */
router.get('/metrics', protect, authorize('admin'), getMetrics);

/**
 * Reset application metrics
 * @route POST /api/v1/monitoring/metrics/reset
 * @access Private (Admin only)
 */
router.post('/metrics/reset', protect, authorize('admin'), resetMetrics);

/**
 * Prometheus-style metrics endpoint
 * @route GET /api/v1/monitoring/prometheus
 * @access Private (Admin only)
 */
router.get('/prometheus', protect, authorize('admin'), prometheusMetrics);

/**
 * Public metrics endpoint (limited data)
 * @route GET /metrics
 * @access Public
 */
router.get('/public', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;