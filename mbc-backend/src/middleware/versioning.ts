/**
 * API Versioning Middleware
 * Handles API version routing and backward compatibility
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@/utils/errorResponse';
import logger from '@/utils/logger';

// Supported API versions
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export type ApiVersion = typeof SUPPORTED_VERSIONS[number];

// Default version if none specified
export const DEFAULT_VERSION: ApiVersion = 'v1';

// Version deprecation warnings
export const DEPRECATED_VERSIONS: Partial<Record<ApiVersion, string>> = {
  // v1: 'API v1 is deprecated. Please migrate to v2. Support ends on 2025-06-01.'
};

/**
 * Extract API version from request
 */
export const extractApiVersion = (req: Request): ApiVersion => {
  // Check URL path first (/api/v1/...)
  const pathVersion = req.path.match(/^\/api\/(v\d+)\//)?.[1] as ApiVersion;
  if (pathVersion && SUPPORTED_VERSIONS.includes(pathVersion)) {
    return pathVersion;
  }

  // Check Accept header (application/vnd.mbc.v1+json)
  const acceptHeader = req.get('Accept');
  const headerVersion = acceptHeader?.match(/vnd\.mbc\.(v\d+)\+json/)?.[1] as ApiVersion;
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    return headerVersion;
  }

  // Check custom version header
  const versionHeader = req.get('API-Version') as ApiVersion;
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader)) {
    return versionHeader;
  }

  // Default to v1
  return DEFAULT_VERSION;
};

/**
 * API versioning middleware
 */
export const apiVersioning = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const version = extractApiVersion(req);
    
    // Add version to request object
    (req as any).apiVersion = version;
    
    // Add version to response headers
    res.set('API-Version', version);
    res.set('Supported-Versions', SUPPORTED_VERSIONS.join(', '));
    
    // Add deprecation warning if applicable
    const deprecationMessage = DEPRECATED_VERSIONS[version];
    if (deprecationMessage) {
      res.set('Deprecation', 'true');
      res.set('Sunset', deprecationMessage);
      logger.warn(`Deprecated API version ${version} used`, {
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Log version usage for analytics
    logger.debug(`API ${version} accessed`, {
      path: req.path,
      method: req.method,
      version
    });
    
    next();
  } catch (error) {
    logger.error('API versioning error:', error);
    next(new ErrorResponse('Invalid API version', 400));
  }
};

/**
 * Version-specific route handler wrapper
 */
export const versionedHandler = (handlers: Partial<Record<ApiVersion, any>>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const version = (req as any).apiVersion || DEFAULT_VERSION;
    const handler = handlers[version as ApiVersion];
    
    if (!handler) {
      return next(new ErrorResponse(`Handler not implemented for API version ${version}`, 501));
    }
    
    return handler(req, _res, next);
  };
};

/**
 * Middleware to enforce minimum API version
 */
export const requireMinVersion = (minVersion: ApiVersion) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const currentVersion = (req as any).apiVersion || DEFAULT_VERSION;
    const currentVersionNumber = parseInt(currentVersion.replace('v', ''));
    const minVersionNumber = parseInt(minVersion.replace('v', ''));
    
    if (currentVersionNumber < minVersionNumber) {
      return next(new ErrorResponse(
        `This endpoint requires API version ${minVersion} or higher. Current version: ${currentVersion}`,
        426 // Upgrade Required
      ));
    }
    
    next();
  };
};

/**
 * Response transformer for backward compatibility
 */
export const transformResponse = (data: any, version: ApiVersion): any => {
  switch (version) {
    case 'v1':
      // Transform v2+ responses to v1 format if needed
      return transformToV1(data);
    case 'v2':
      // Keep v2 format
      return data;
    default:
      return data;
  }
};

/**
 * Transform response data to v1 format for backward compatibility
 */
const transformToV1 = (data: any): any => {
  // Example transformations for backward compatibility
  if (data && typeof data === 'object') {
    // Remove v2+ fields that don't exist in v1
    const { newFieldInV2, ...v1Data } = data;
    
    // Rename fields if necessary
    if (data.updatedAt) {
      v1Data.updated_at = data.updatedAt;
      delete v1Data.updatedAt;
    }
    
    if (data.createdAt) {
      v1Data.created_at = data.createdAt;
      delete v1Data.createdAt;
    }
    
    return v1Data;
  }
  
  return data;
};

/**
 * Middleware to add version-specific response transformation
 */
export const versionedResponse = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json;
  const version = (req as any).apiVersion || DEFAULT_VERSION;
  
  res.json = function(data: any) {
    const transformedData = transformResponse(data, version);
    return originalJson.call(this, transformedData);
  };
  
  next();
};

export default {
  apiVersioning,
  versionedHandler,
  requireMinVersion,
  versionedResponse,
  extractApiVersion,
  transformResponse,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
};