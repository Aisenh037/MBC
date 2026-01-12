/**
 * Swagger Documentation Middleware
 * Serves OpenAPI documentation with Swagger UI
 */

import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '@/config/swagger';
import config from '@/config/config';
import logger from '@/utils/logger';

/**
 * Setup Swagger documentation middleware
 */
export const setupSwagger = (app: Application): void => {
  try {
    // Swagger UI options
    const swaggerUiOptions = {
      explorer: true,
      swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
        requestInterceptor: (_req: any) => {
          // Add any request interceptors here
          return _req;
        },
        responseInterceptor: (_res: any) => {
          // Add any response interceptors here
          return _res;
        },
      },
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .info .description { color: #34495e; }
        .swagger-ui .scheme-container { background: #ecf0f1; padding: 15px; border-radius: 5px; }
      `,
      customSiteTitle: 'MBC API Documentation',
      customfavIcon: '/favicon.ico',
    };

    // Serve swagger documentation
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Serve raw OpenAPI spec as JSON
    app.get('/api-docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // Serve raw OpenAPI spec as YAML (optional)
    app.get('/api-docs.yaml', (_req, res) => {
      res.setHeader('Content-Type', 'text/yaml');
      // Convert JSON to YAML (you might want to add a YAML library for this)
      res.send('# OpenAPI spec in YAML format would go here');
    });

    logger.info(`Swagger documentation available at: ${config.env === 'production' ? 'https://api.mbc.edu' : `http://localhost:${config.port}`}/api-docs`);
  } catch (error) {
    logger.error('Failed to setup Swagger documentation:', error);
  }
};

/**
 * Middleware to add OpenAPI documentation to routes
 * This can be used as a decorator for route handlers
 */
export const apiDoc = (documentation: any) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    // Store documentation metadata for the route
    if (!target.constructor.apiDocs) {
      target.constructor.apiDocs = {};
    }
    target.constructor.apiDocs[propertyKey] = documentation;
    return descriptor;
  };
};

export default { setupSwagger, apiDoc };