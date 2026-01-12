/**
 * Cache Service Unit Tests
 * Comprehensive unit tests for Redis caching service
 */

import { describe, test, expect, beforeEach, vi } from '@jest/globals';
import cacheService from '@/services/cacheService';
import redisService from '@/services/redisService';

// Mock Redis service
vi.mock('@/services/redisService');

const mockRedisService = redisService as any;

describe('CacheService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    test('should return cached value when key exists', async () => {
      const key = 'test:key';
      const cachedValue = { data: 'test data' };
      
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedValue));

      const result = await cacheService.get(key);

      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(cachedValue);
    });

    test('should return null when key does not exist', async () => {
      const key = 'test:nonexistent';
      
      mockRedisService.get.mockResolvedValue(null);

      const result = await cacheService.get(key);

      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    test('should return null when cached value is invalid JSON', async () => {
      const key = 'test:invalid';
      
      mockRedisService.get.mockResolvedValue('invalid json');

      const result = await cacheService.get(key);

      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    test('should cache value with default TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      
      mockRedisService.setex.mockResolvedValue('OK');

      await cacheService.set(key, value);

      expect(mockRedisService.setex).toHaveBeenCalledWith(
        key, 
        3600, // default TTL
        JSON.stringify(value)
      );
    });

    test('should cache value with custom TTL', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      const ttl = 1800;
      
      mockRedisService.setex.mockResolvedValue('OK');

      await cacheService.set(key, value, ttl);

      expect(mockRedisService.setex).toHaveBeenCalledWith(
        key, 
        ttl,
        JSON.stringify(value)
      );
    });

    test('should handle Redis errors gracefully', async () => {
      const key = 'test:key';
      const value = { data: 'test data' };
      
      mockRedisService.setex.mockRejectedValue(new Error('Redis error'));

      // Should not throw error
      await expect(cacheService.set(key, value)).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    test('should delete single key', async () => {
      const key = 'test:key';
      
      mockRedisService.del.mockResolvedValue(1);

      const result = await cacheService.del(key);

      expect(mockRedisService.del).toHaveBeenCalledWith(key);
      expect(result).toBe(1);
    });

    test('should delete multiple keys', async () => {
      const keys = ['test:key1', 'test:key2', 'test:key3'];
      
      mockRedisService.del.mockResolvedValue(3);

      const result = await cacheService.del(...keys);

      expect(mockRedisService.del).toHaveBeenCalledWith(...keys);
      expect(result).toBe(3);
    });
  });

  describe('exists', () => {
    test('should return true when key exists', async () => {
      const key = 'test:key';
      
      mockRedisService.exists.mockResolvedValue(1);

      const result = await cacheService.exists(key);

      expect(mockRedisService.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    test('should return false when key does not exist', async () => {
      const key = 'test:nonexistent';
      
      mockRedisService.exists.mockResolvedValue(0);

      const result = await cacheService.exists(key);

      expect(mockRedisService.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });
  });

  describe('ttl', () => {
    test('should return TTL for existing key', async () => {
      const key = 'test:key';
      const ttl = 1800;
      
      mockRedisService.ttl.mockResolvedValue(ttl);

      const result = await cacheService.ttl(key);

      expect(mockRedisService.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(ttl);
    });

    test('should return -1 for key without expiration', async () => {
      const key = 'test:persistent';
      
      mockRedisService.ttl.mockResolvedValue(-1);

      const result = await cacheService.ttl(key);

      expect(mockRedisService.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(-1);
    });

    test('should return -2 for non-existent key', async () => {
      const key = 'test:nonexistent';
      
      mockRedisService.ttl.mockResolvedValue(-2);

      const result = await cacheService.ttl(key);

      expect(mockRedisService.ttl).toHaveBeenCalledWith(key);
      expect(result).toBe(-2);
    });
  });

  describe('flush', () => {
    test('should flush all keys', async () => {
      mockRedisService.flushall.mockResolvedValue('OK');

      await cacheService.flush();

      expect(mockRedisService.flushall).toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    test('should return cached value when key exists', async () => {
      const key = 'test:key';
      const cachedValue = { data: 'cached data' };
      const fetchFunction = vi.fn();
      
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedValue));

      const result = await cacheService.getOrSet(key, fetchFunction);

      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(fetchFunction).not.toHaveBeenCalled();
      expect(result).toEqual(cachedValue);
    });

    test('should fetch and cache value when key does not exist', async () => {
      const key = 'test:key';
      const fetchedValue = { data: 'fetched data' };
      const fetchFunction = vi.fn().mockResolvedValue(fetchedValue);
      
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.setex.mockResolvedValue('OK');

      const result = await cacheService.getOrSet(key, fetchFunction);

      expect(mockRedisService.get).toHaveBeenCalledWith(key);
      expect(fetchFunction).toHaveBeenCalled();
      expect(mockRedisService.setex).toHaveBeenCalledWith(
        key,
        3600,
        JSON.stringify(fetchedValue)
      );
      expect(result).toEqual(fetchedValue);
    });

    test('should use custom TTL when provided', async () => {
      const key = 'test:key';
      const fetchedValue = { data: 'fetched data' };
      const fetchFunction = vi.fn().mockResolvedValue(fetchedValue);
      const ttl = 1800;
      
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.setex.mockResolvedValue('OK');

      const result = await cacheService.getOrSet(key, fetchFunction, ttl);

      expect(mockRedisService.setex).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(fetchedValue)
      );
      expect(result).toEqual(fetchedValue);
    });

    test('should handle fetch function errors', async () => {
      const key = 'test:key';
      const fetchFunction = vi.fn().mockRejectedValue(new Error('Fetch error'));
      
      mockRedisService.get.mockResolvedValue(null);

      await expect(cacheService.getOrSet(key, fetchFunction)).rejects.toThrow('Fetch error');
      expect(mockRedisService.setex).not.toHaveBeenCalled();
    });
  });

  describe('invalidatePattern', () => {
    test('should invalidate keys matching pattern', async () => {
      const pattern = 'user:*';
      const matchingKeys = ['user:1', 'user:2', 'user:3'];
      
      mockRedisService.keys.mockResolvedValue(matchingKeys);
      mockRedisService.del.mockResolvedValue(3);

      const result = await cacheService.invalidatePattern(pattern);

      expect(mockRedisService.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisService.del).toHaveBeenCalledWith(...matchingKeys);
      expect(result).toBe(3);
    });

    test('should handle no matching keys', async () => {
      const pattern = 'nonexistent:*';
      
      mockRedisService.keys.mockResolvedValue([]);

      const result = await cacheService.invalidatePattern(pattern);

      expect(mockRedisService.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedisService.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('mget', () => {
    test('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', null];
      
      mockRedisService.mget.mockResolvedValue(values);

      const result = await cacheService.mget(keys);

      expect(mockRedisService.mget).toHaveBeenCalledWith(keys);
      expect(result).toEqual(['value1', 'value2', null]);
    });
  });

  describe('mset', () => {
    test('should set multiple key-value pairs', async () => {
      const keyValuePairs = {
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3'
      };
      
      mockRedisService.mset.mockResolvedValue('OK');

      await cacheService.mset(keyValuePairs);

      expect(mockRedisService.mset).toHaveBeenCalledWith(keyValuePairs);
    });
  });
});