/**
 * Cache Middleware
 * Provides caching functionality for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import redisService, { CACHE_TTL, CACHE_KEYS } from '@/services/redisService';
import logger from '@/utils/logger';
import { AuthenticatedUser } from '@/types/auth';

// Extend Express Request to include user and cache info
interface CachedRequest extends Request {
  user?: AuthenticatedUser;
  cacheKey?: string;
  skipCache?: boolean;
}

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: CachedRequest) => string;
  condition?: (req: CachedRequest) => boolean;
  prefix?: string;
  varyBy?: string[]; // Headers or query params to vary cache by
}

/**
 * Generate cache key based on request
 */
const generateCacheKey = (req: CachedRequest, options: CacheMiddlewareOptions): string => {
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }

  const baseKey = `${req.method}:${req.path}`;
  const queryString = Object.keys(req.query).length > 0 ? 
    `:${JSON.stringify(req.query)}` : '';
  
  // Add user-specific caching if authenticated
  const userKey = req.user ? `:user:${req.user.id}` : '';
  
  // Add vary-by parameters
  let varyKey = '';
  if (options.varyBy) {
    const varyValues = options.varyBy.map(key => {
      if (key.startsWith('header:')) {
        const headerName = key.replace('header:', '');
        return `${headerName}:${req.get(headerName) || 'none'}`;
      }
      if (key.startsWith('query:')) {
        const queryName = key.replace('query:', '');
        return `${queryName}:${req.query[queryName] || 'none'}`;
      }
      return `${key}:${(req as any)[key] || 'none'}`;
    }).join(':');
    varyKey = `:${varyValues}`;
  }

  return `${baseKey}${queryString}${userKey}${varyKey}`;
};

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  return async (req: CachedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be skipped
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Skip cache if Redis is not available
    if (!redisService.isAvailable()) {
      logger.debug('Redis not available, skipping cache');
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req, options);
      req.cacheKey = cacheKey;

      // Try to get cached response
      const cachedResponse = await redisService.get(cacheKey, { prefix: options.prefix });
      
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': 'public, max-age=300'
        });

        res.json(cachedResponse);
        return;
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the response
        const ttl = options.ttl || CACHE_TTL.MEDIUM;
        redisService.set(cacheKey, data, { ttl, prefix: options.prefix })
          .catch(error => logger.error('Failed to cache response:', error));
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': 'public, max-age=300'
        });

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 */
export const invalidateCache = (patterns: string | string[], prefix?: string) => {
  return async (req: CachedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to invalidate cache after successful response
    const invalidateAfterResponse = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
          
          for (const pattern of patternsArray) {
            await redisService.delPattern(pattern, { prefix });
            logger.debug(`Cache invalidated for pattern: ${pattern}`);
          }
        } catch (error) {
          logger.error('Cache invalidation error:', error);
        }
      }
    };

    res.json = function(data: any) {
      invalidateAfterResponse();
      return originalJson.call(this, data);
    };

    res.send = function(data: any) {
      invalidateAfterResponse();
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * User-specific cache middleware
 */
export const userCache = (options: Omit<CacheMiddlewareOptions, 'keyGenerator'> = {}) => {
  return cacheMiddleware({
    ...options,
    keyGenerator: (req: CachedRequest) => {
      const userId = req.user?.id || 'anonymous';
      const baseKey = `${req.method}:${req.path}`;
      const queryString = Object.keys(req.query).length > 0 ? 
        `:${JSON.stringify(req.query)}` : '';
      return `user:${userId}:${baseKey}${queryString}`;
    }
  });
};

/**
 * Dashboard cache middleware
 */
export const dashboardCache = (ttl: number = CACHE_TTL.SHORT) => {
  return cacheMiddleware({
    ttl,
    prefix: CACHE_KEYS.DASHBOARD,
    condition: (req: CachedRequest) => req.user !== undefined,
    keyGenerator: (req: CachedRequest) => {
      const userId = req.user?.id || 'anonymous';
      const role = req.user?.role || 'guest';
      return `${role}:${userId}:${req.path}`;
    }
  });
};

/**
 * Student list cache middleware
 */
export const studentListCache = (ttl: number = CACHE_TTL.MEDIUM) => {
  return cacheMiddleware({
    ttl,
    prefix: CACHE_KEYS.STUDENT,
    varyBy: ['query:page', 'query:limit', 'query:search', 'query:branch'],
    condition: (req: CachedRequest) => req.user?.role === 'admin' || req.user?.role === 'professor'
  });
};

/**
 * Course cache middleware
 */
export const courseCache = (ttl: number = CACHE_TTL.LONG) => {
  return cacheMiddleware({
    ttl,
    prefix: CACHE_KEYS.COURSE,
    varyBy: ['query:semester', 'query:branch'],
  });
};

/**
 * Analytics cache middleware
 */
export const analyticsCache = (ttl: number = CACHE_TTL.MEDIUM) => {
  return cacheMiddleware({
    ttl,
    prefix: CACHE_KEYS.ANALYTICS,
    varyBy: ['query:startDate', 'query:endDate', 'query:type'],
    condition: (req: CachedRequest) => req.user?.role === 'admin' || req.user?.role === 'professor'
  });
};

/**
 * Session cache utilities
 */
export const sessionCache = {
  /**
   * Store user session data
   */
  set: async (sessionId: string, data: any, ttl: number = CACHE_TTL.SESSION): Promise<boolean> => {
    return redisService.set(`session:${sessionId}`, data, { ttl, prefix: CACHE_KEYS.SESSION });
  },

  /**
   * Get user session data
   */
  get: async (sessionId: string): Promise<any> => {
    return redisService.get(`session:${sessionId}`, { prefix: CACHE_KEYS.SESSION });
  },

  /**
   * Delete user session
   */
  delete: async (sessionId: string): Promise<boolean> => {
    return redisService.del(`session:${sessionId}`, { prefix: CACHE_KEYS.SESSION });
  },

  /**
   * Extend session TTL
   */
  extend: async (sessionId: string, ttl: number = CACHE_TTL.SESSION): Promise<boolean> => {
    return redisService.expire(`session:${sessionId}`, ttl, { prefix: CACHE_KEYS.SESSION });
  }
};

/**
 * Rate limiting using Redis
 */
export const rateLimitCache = {
  /**
   * Check and increment rate limit counter
   */
  checkLimit: async (key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    try {
      const current = await redisService.incr(`ratelimit:${key}`);
      
      if (current === 1) {
        // First request in window, set expiration
        await redisService.expire(`ratelimit:${key}`, windowSeconds);
      }

      const ttl = await redisService.ttl(`ratelimit:${key}`);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // Allow request if Redis fails
      return { allowed: true, remaining: limit - 1, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }
};

/**
 * Cache warming utilities
 */
export const cacheWarming = {
  /**
   * Warm up dashboard cache for a user
   */
  warmDashboard: async (userId: string, role: string): Promise<void> => {
    try {
      // This would typically make requests to dashboard endpoints
      // to populate the cache before users access them
      logger.info(`Warming dashboard cache for user ${userId} with role ${role}`);
    } catch (error) {
      logger.error('Dashboard cache warming error:', error);
    }
  },

  /**
   * Warm up frequently accessed data
   */
  warmFrequentData: async (): Promise<void> => {
    try {
      // Warm up course lists, student counts, etc.
      logger.info('Warming frequently accessed data cache');
    } catch (error) {
      logger.error('Frequent data cache warming error:', error);
    }
  }
};

export default {
  cacheMiddleware,
  invalidateCache,
  userCache,
  dashboardCache,
  studentListCache,
  courseCache,
  analyticsCache,
  sessionCache,
  rateLimitCache,
  cacheWarming
};