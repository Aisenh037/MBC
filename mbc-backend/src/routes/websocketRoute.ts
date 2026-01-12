import express from 'express';
import { protect } from '../middleware/auth.js';
import { websocketService } from '../services/websocketService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Get WebSocket connection statistics
 * GET /api/v1/websocket/stats
 */
router.get('/stats', protect, (req, res) => {
  try {
    const stats = {
      connectedUsers: websocketService.getConnectedUsersCount(),
      connectedStudents: websocketService.getConnectedUsersByRole('student').length,
      connectedProfessors: websocketService.getConnectedUsersByRole('professor').length,
      connectedAdmins: websocketService.getConnectedUsersByRole('admin').length,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: stats,
      message: 'WebSocket statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting WebSocket stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEBSOCKET_STATS_ERROR',
        message: 'Failed to retrieve WebSocket statistics'
      }
    });
  }
});

/**
 * Send test notification to user
 * POST /api/v1/websocket/test-notification
 */
router.post('/test-notification', protect, async (req, res) => {
  try {
    const { userId, title, message, type = 'system' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId, title, and message are required'
        }
      });
    }

    const notification = {
      id: `test_${Date.now()}`,
      type,
      title,
      message,
      userId,
      metadata: {
        sentBy: req.user?.id,
        testNotification: true
      },
      createdAt: new Date()
    };

    await websocketService.sendNotificationToUser(userId, notification);

    res.status(200).json({
      success: true,
      data: { notificationId: notification.id },
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_ERROR',
        message: 'Failed to send test notification'
      }
    });
  }
});

/**
 * Broadcast test message to role
 * POST /api/v1/websocket/broadcast-role
 */
router.post('/broadcast-role', protect, (req, res) => {
  try {
    const { role, event, data } = req.body;

    if (!role || !event || !data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'role, event, and data are required'
        }
      });
    }

    // Only admins can broadcast to roles
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can broadcast to roles'
        }
      });
    }

    websocketService.broadcastToRole(role, event, {
      ...data,
      broadcastBy: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: `Message broadcasted to role: ${role}`
    });
  } catch (error) {
    logger.error('Error broadcasting to role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BROADCAST_ERROR',
        message: 'Failed to broadcast message to role'
      }
    });
  }
});

/**
 * Check if user is connected
 * GET /api/v1/websocket/user/:userId/status
 */
router.get('/user/:userId/status', protect, (req, res) => {
  try {
    const { userId } = req.params;
    const isConnected = websocketService.isUserConnected(userId);

    res.status(200).json({
      success: true,
      data: {
        userId,
        isConnected,
        checkedAt: new Date().toISOString()
      },
      message: 'User connection status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error checking user connection status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTION_STATUS_ERROR',
        message: 'Failed to check user connection status'
      }
    });
  }
});

/**
 * Get connected users by role
 * GET /api/v1/websocket/users/role/:role
 */
router.get('/users/role/:role', protect, (req, res) => {
  try {
    const { role } = req.params;
    
    // Only admins can view connected users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only administrators can view connected users'
        }
      });
    }

    const connectedUsers = websocketService.getConnectedUsersByRole(role);
    const userList = connectedUsers.map(socket => ({
      userId: socket.userId,
      socketId: socket.id,
      institutionId: socket.institutionId,
      branchId: socket.branchId
    }));

    res.status(200).json({
      success: true,
      data: {
        role,
        count: userList.length,
        users: userList
      },
      message: `Connected users for role ${role} retrieved successfully`
    });
  } catch (error) {
    logger.error('Error getting connected users by role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTED_USERS_ERROR',
        message: 'Failed to retrieve connected users'
      }
    });
  }
});

export default router;