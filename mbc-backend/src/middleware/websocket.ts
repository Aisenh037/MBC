import { Server as HTTPServer } from 'http';
import { websocketService } from '../services/websocketService.js';
import logger from '../utils/logger.js';

/**
 * Initialize WebSocket server with HTTP server
 */
export const initializeWebSocket = (httpServer: HTTPServer): void => {
  try {
    websocketService.initialize(httpServer);
    logger.info('WebSocket middleware initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize WebSocket middleware:', error);
    throw error;
  }
};

/**
 * WebSocket connection statistics middleware
 */
export const websocketStats = () => {
  return (req: any, res: any, next: any) => {
    // Add WebSocket stats to request context
    req.websocketStats = {
      connectedUsers: websocketService.getConnectedUsersCount(),
      connectedStudents: websocketService.getConnectedUsersByRole('student').length,
      connectedProfessors: websocketService.getConnectedUsersByRole('professor').length,
      connectedAdmins: websocketService.getConnectedUsersByRole('admin').length
    };
    
    next();
  };
};

/**
 * Real-time notification helper middleware
 */
export const realTimeNotification = () => {
  return (req: any, res: any, next: any) => {
    // Add notification helper to request
    req.notify = {
      user: async (userId: string, notification: any) => {
        await websocketService.sendNotificationToUser(userId, notification);
      },
      users: async (userIds: string[], notification: any) => {
        await websocketService.sendNotificationToUsers(userIds, notification);
      },
      role: (role: string, event: string, data: any) => {
        websocketService.broadcastToRole(role, event, data);
      },
      institution: (institutionId: string, event: string, data: any) => {
        websocketService.broadcastToInstitution(institutionId, event, data);
      },
      branch: (branchId: string, event: string, data: any) => {
        websocketService.broadcastToBranch(branchId, event, data);
      }
    };
    
    next();
  };
};