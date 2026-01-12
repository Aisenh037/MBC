/**
 * Redis Service
 * Handles Redis connection, caching operations, and connection management
 */

import Redis, { RedisOptions } from 'ioredis';
import config from '@/config/config';
import logger from '@/utils/logger';

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 5 * 60,        // 5 minutes
  MEDIUM: 30 * 60,      // 30 minutes
  LONG: 2 * 60 * 60,    // 2 hours
  VERY_LONG: 24 * 60 * 60, // 24 hours
  SESSION: 7 * 24 * 60 * 60, // 7 days
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  USER: 'user',
  STUDENT: 'student',
  PROFESSOR: 'professor',
  COURSE: 'course',
  ASSIGNMENT: 'assignment',
  DASHBOARD: 'dashboard',
  SESSION: 'session',
  ANALYTICS: 'analytics',
  NOTIFICATION: 'notification',
} as const;

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface RedisServiceConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
  lazyConnect?: boolean;
}

class RedisService {
  private client: Redis | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize Redis connection with retry logic
   */
  private async initializeConnection(): Promise<void> {
    if (!config.redis) {
      logger.warn('Redis configuration not found. Caching will be disabled.');
      return;
    }

    const redisConfig: RedisOptions = {
      host: config.redis.host,
      port: config.redis.port,
      ...(config.redis.password && { password: config.redis.password }),
      db: config.redis.db || 0,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
      lazyConnect: true,
      // Connection pool settings
      family: 4,
      keepAlive: 30000, // 30 seconds
      // Retry strategy
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      // Reconnect on error
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    };

    try {
      this.client = new Redis(redisConfig);
      await this.setupEventHandlers();
      await this.client.connect();
      
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis connection:', error);
      await this.handleConnectionError();
    }
  }

  /**
   * Set up Redis event handlers
   */
  private async setupEventHandlers(): Promise<void> {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay: number) => {
      logger.info(`Redis reconnecting in ${delay}ms`);
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });
  }

  /**
   * Handle connection errors with exponential backoff
   */
  private async handleConnectionError(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max Redis reconnection attempts reached. Caching disabled.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.info(`Attempting Redis reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.initializeConnection();
      } catch (error) {
        logger.error('Redis reconnection failed:', error);
        await this.handleConnectionError();
      }
    }, delay);
  }

  /**
   * Check if Redis is connected and available
   */
  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || 'mbc';
    return `${keyPrefix}:${key}`;
  }

  /**
   * Set a value in cache
   */
  public async set(
    key: string, 
    value: any, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping cache set');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || CACHE_TTL.MEDIUM;

      await this.client!.setex(cacheKey, ttl, serializedValue);
      logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  public async get<T = any>(
    key: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping cache get');
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const cachedValue = await this.client!.get(cacheKey);
      
      if (cachedValue === null) {
        logger.debug(`Cache miss: ${cacheKey}`);
        return null;
      }

      logger.debug(`Cache hit: ${cacheKey}`);
      return JSON.parse(cachedValue) as T;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  public async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping cache delete');
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await this.client!.del(cacheKey);
      logger.debug(`Cache delete: ${cacheKey} (deleted: ${result})`);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  public async delPattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping pattern delete');
      return 0;
    }

    try {
      const searchPattern = this.generateKey(pattern, options.prefix);
      const keys = await this.client!.keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client!.del(...keys);
      logger.debug(`Cache pattern delete: ${searchPattern} (deleted: ${result} keys)`);
      return result;
    } catch (error) {
      logger.error('Redis pattern delete error:', error);
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  public async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await this.client!.exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Set expiration time for a key
   */
  public async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await this.client!.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  public async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await this.client!.ttl(cacheKey);
    } catch (error) {
      logger.error('Redis TTL error:', error);
      return -1;
    }
  }

  /**
   * Increment a numeric value
   */
  public async incr(key: string, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await this.client!.incr(cacheKey);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return null;
    }
  }

  /**
   * Decrement a numeric value
   */
  public async decr(key: string, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await this.client!.decr(cacheKey);
    } catch (error) {
      logger.error('Redis decr error:', error);
      return null;
    }
  }

  /**
   * Add item to a set
   */
  public async sadd(key: string, member: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await this.client!.sadd(cacheKey, member);
      return result > 0;
    } catch (error) {
      logger.error('Redis sadd error:', error);
      return false;
    }
  }

  /**
   * Remove item from a set
   */
  public async srem(key: string, member: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const result = await this.client!.srem(cacheKey, member);
      return result > 0;
    } catch (error) {
      logger.error('Redis srem error:', error);
      return false;
    }
  }

  /**
   * Get all members of a set
   */
  public async smembers(key: string, options: CacheOptions = {}): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      return await this.client!.smembers(cacheKey);
    } catch (error) {
      logger.error('Redis smembers error:', error);
      return [];
    }
  }

  /**
   * Flush all cache data (use with caution)
   */
  public async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.flushall();
      logger.warn('Redis cache flushed');
      return true;
    } catch (error) {
      logger.error('Redis flush error:', error);
      return false;
    }
  }

  /**
   * Build cache key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Set a value with expiration time (convenience method)
   */
  public async setex(key: string, ttl: number, value: any, options: CacheOptions = {}): Promise<boolean> {
    return this.set(key, value, { ...options, ttl });
  }

  /**
   * Push item to the left of a list
   */
  public async lpush(key: string, value: any, options: CacheOptions = {}): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);
      const result = await this.client!.lpush(fullKey, serializedValue);
      logger.debug(`List push successful for key: ${fullKey}`);
      return result;
    } catch (error) {
      logger.error(`Error pushing to list ${key}:`, error);
      return null;
    }
  }

  /**
   * Get range of items from a list
   */
  public async lrange(key: string, start: number, stop: number, options: CacheOptions = {}): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.client!.lrange(fullKey, start, stop);
      logger.debug(`List range successful for key: ${fullKey}`);
      return result;
    } catch (error) {
      logger.error(`Error getting list range ${key}:`, error);
      return [];
    }
  }

  /**
   * Get Redis connection info
   */
  public async getInfo(): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const info = await this.client!.info();
      return {
        connected: this.isConnected,
        info: info,
        config: {
          host: config.redis?.host,
          port: config.redis?.port,
          db: config.redis?.db || 0,
        }
      };
    } catch (error) {
      logger.error('Redis info error:', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error('Error closing Redis connection:', error);
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }
  }

  /**
   * Ping Redis server
   */
  public async ping(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Redis not available');
    }

    try {
      return await this.client!.ping();
    } catch (error) {
      logger.error('Redis ping error:', error);
      throw error;
    }
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    if (!this.isAvailable()) {
      return { status: 'disconnected', error: 'Redis client not available' };
    }

    try {
      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing Redis connection...');
  await redisService.disconnect();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing Redis connection...');
  await redisService.disconnect();
});

export default redisService;