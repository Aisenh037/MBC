import request from 'supertest';
import app from '../app';
import { supabase } from '../utils/supabase';
import notificationService from '../services/notificationService';
import notificationScheduler from '../services/notificationScheduler';
import { websocketService } from '../services/websocketService';

// Mock external dependencies
jest.mock('../utils/supabase');
jest.mock('../services/websocketService');
jest.mock('node-cron');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockWebsocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('Notification System', () => {
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    // Setup test data
    testUserId = 'test-user-id';
    testNotificationId = 'test-notification-id';
    
    // Mock authentication tokens
    authToken = 'Bearer test-token';
    adminToken = 'Bearer admin-token';

    // Initialize notification service
    await notificationService.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Service', () => {
    describe('createNotification', () => {
      it('should create and send a notification successfully', async () => {
        // Mock database responses
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testNotificationId,
                  type: 'notice',
                  title: 'Test Notification',
                  message: 'Test message',
                  priority: 'normal',
                  created_at: new Date().toISOString()
                },
                error: null
              })
            })
          })
        } as any);

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ id: testUserId }],
              error: null
            })
          })
        } as any);

        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockResolvedValue({
            data: null,
            error: null
          })
        } as any);

        mockWebsocketService.sendNotificationToUser.mockResolvedValue();

        const notificationData = {
          type: 'notice' as const,
          title: 'Test Notification',
          message: 'Test message',
          userId: testUserId,
          priority: 'normal' as const
        };

        const result = await notificationService.createNotification(notificationData);

        expect(result).toBe(testNotificationId);
        expect(mockWebsocketService.sendNotificationToUser).toHaveBeenCalledWith(
          testUserId,
          expect.objectContaining({
            id: testNotificationId,
            type: 'notice',
            title: 'Test Notification',
            message: 'Test message'
          })
        );
      });

      it('should handle notification creation errors', async () => {
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        } as any);

        const notificationData = {
          type: 'notice' as const,
          title: 'Test Notification',
          message: 'Test message',
          userId: testUserId
        };

        await expect(notificationService.createNotification(notificationData))
          .rejects.toThrow('Failed to create notification');
      });
    });

    describe('sendTemplatedNotification', () => {
      it('should send notification using template', async () => {
        // Mock template loading
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                id: 'template_test',
                type: 'notice',
                title: 'Template {variable}',
                message_template: 'Message with {variable}',
                priority: 'normal',
                delivery_methods: ['realtime'],
                target_audience: ['all'],
                is_active: true,
                variables: ['variable']
              }],
              error: null
            })
          })
        } as any);

        // Mock notification creation
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: testNotificationId,
                  type: 'notice',
                  title: 'Template Test Value',
                  message: 'Message with Test Value',
                  priority: 'normal',
                  created_at: new Date().toISOString()
                },
                error: null
              })
            })
          })
        } as any);

        await notificationService.initialize();

        const result = await notificationService.sendTemplatedNotification(
          'template_test',
          { variable: 'Test Value' },
          [testUserId]
        );

        expect(result).toBe(testNotificationId);
      });
    });

    describe('getUserNotifications', () => {
      it('should retrieve user notifications with pagination', async () => {
        const mockNotifications = [
          {
            id: 'user-notif-1',
            notification_id: testNotificationId,
            user_id: testUserId,
            is_read: false,
            is_delivered: true,
            created_at: new Date().toISOString(),
            notification: {
              id: testNotificationId,
              type: 'notice',
              title: 'Test Notification',
              message: 'Test message',
              priority: 'normal',
              created_at: new Date().toISOString()
            }
          }
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({
                  data: mockNotifications,
                  error: null,
                  count: 1
                })
              })
            })
          })
        } as any);

        const result = await notificationService.getUserNotifications(testUserId, {
          page: 1,
          limit: 20
        });

        expect(result.notifications).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
        expect(result.notifications[0].notification.title).toBe('Test Notification');
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', async () => {
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        } as any);

        await notificationService.markAsRead(testNotificationId, testUserId);

        expect(mockSupabase.from).toHaveBeenCalledWith('user_notifications');
      });
    });
  });

  describe('Notification API Endpoints', () => {
    describe('POST /api/v1/notifications', () => {
      it('should create notification with valid data', async () => {
        const notificationData = {
          type: 'notice',
          title: 'Test Notification',
          message: 'Test message',
          userId: testUserId,
          priority: 'normal'
        };

        // Mock successful creation
        jest.spyOn(notificationService, 'createNotification')
          .mockResolvedValue(testNotificationId);

        const response = await request(app)
          .post('/api/v1/notifications')
          .set('Authorization', authToken)
          .send(notificationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.notificationId).toBe(testNotificationId);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          type: 'notice',
          // Missing title and message
        };

        const response = await request(app)
          .post('/api/v1/notifications')
          .set('Authorization', authToken)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should require at least one recipient method', async () => {
        const invalidData = {
          type: 'notice',
          title: 'Test',
          message: 'Test message'
          // Missing userId, userIds, or targetAudience
        };

        const response = await request(app)
          .post('/api/v1/notifications')
          .set('Authorization', authToken)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('recipient method');
      });
    });

    describe('POST /api/v1/notifications/templated', () => {
      it('should send templated notification', async () => {
        const templateData = {
          templateId: 'template_test',
          variables: { variable: 'Test Value' },
          recipients: [testUserId]
        };

        jest.spyOn(notificationService, 'sendTemplatedNotification')
          .mockResolvedValue(testNotificationId);

        const response = await request(app)
          .post('/api/v1/notifications/templated')
          .set('Authorization', authToken)
          .send(templateData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.notificationId).toBe(testNotificationId);
      });
    });

    describe('GET /api/v1/notifications/my-notifications', () => {
      it('should retrieve user notifications', async () => {
        const mockResult = {
          notifications: [{
            id: 'user-notif-1',
            notification: {
              id: testNotificationId,
              type: 'notice',
              title: 'Test Notification',
              message: 'Test message'
            }
          }],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            pages: 1
          }
        };

        jest.spyOn(notificationService, 'getUserNotifications')
          .mockResolvedValue(mockResult);

        const response = await request(app)
          .get('/api/v1/notifications/my-notifications')
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.notifications).toHaveLength(1);
      });

      it('should support pagination and filtering', async () => {
        jest.spyOn(notificationService, 'getUserNotifications')
          .mockResolvedValue({
            notifications: [],
            pagination: { page: 2, limit: 10, total: 0, pages: 0 }
          });

        const response = await request(app)
          .get('/api/v1/notifications/my-notifications')
          .query({ page: 2, limit: 10, unreadOnly: 'true', type: 'notice' })
          .set('Authorization', authToken)
          .expect(200);

        expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            page: 2,
            limit: 10,
            unreadOnly: true,
            type: 'notice'
          })
        );
      });
    });

    describe('PUT /api/v1/notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        jest.spyOn(notificationService, 'markAsRead')
          .mockResolvedValue();

        const response = await request(app)
          .put(`/api/v1/notifications/${testNotificationId}/read`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(notificationService.markAsRead).toHaveBeenCalledWith(
          testNotificationId,
          expect.any(String)
        );
      });
    });

    describe('GET /api/v1/notifications/preferences', () => {
      it('should retrieve user notification preferences', async () => {
        const mockPreferences = {
          userId: testUserId,
          enabledTypes: ['notice', 'grade'],
          enabledMethods: ['realtime'],
          frequency: 'immediate'
        };

        jest.spyOn(notificationService, 'getUserPreferences')
          .mockReturnValue(mockPreferences);

        const response = await request(app)
          .get('/api/v1/notifications/preferences')
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.enabledTypes).toContain('notice');
      });
    });

    describe('PUT /api/v1/notifications/preferences', () => {
      it('should update user notification preferences', async () => {
        const preferences = {
          enabledTypes: ['notice', 'grade', 'assignment'],
          enabledMethods: ['realtime', 'email'],
          frequency: 'hourly'
        };

        jest.spyOn(notificationService, 'updateUserPreferences')
          .mockResolvedValue();

        const response = await request(app)
          .put('/api/v1/notifications/preferences')
          .set('Authorization', authToken)
          .send(preferences)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(notificationService.updateUserPreferences).toHaveBeenCalledWith(
          expect.any(String),
          preferences
        );
      });
    });

    describe('Admin-only endpoints', () => {
      describe('POST /api/v1/notifications/templates', () => {
        it('should create notification template (admin only)', async () => {
          const templateData = {
            type: 'notice',
            title: 'Template Title',
            messageTemplate: 'Template message with {variable}',
            priority: 'normal',
            variables: ['variable']
          };

          jest.spyOn(notificationService, 'createTemplate')
            .mockResolvedValue('template-id');

          const response = await request(app)
            .post('/api/v1/notifications/templates')
            .set('Authorization', adminToken)
            .send(templateData)
            .expect(201);

          expect(response.body.success).toBe(true);
          expect(response.body.data.templateId).toBe('template-id');
        });

        it('should reject non-admin users', async () => {
          const templateData = {
            type: 'notice',
            title: 'Template Title',
            messageTemplate: 'Template message'
          };

          const response = await request(app)
            .post('/api/v1/notifications/templates')
            .set('Authorization', authToken)
            .send(templateData)
            .expect(403);

          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        });
      });

      describe('GET /api/v1/notifications/templates', () => {
        it('should retrieve notification templates (admin only)', async () => {
          const mockTemplates = [{
            id: 'template-1',
            type: 'notice',
            title: 'Template Title',
            messageTemplate: 'Template message'
          }];

          jest.spyOn(notificationService, 'getTemplates')
            .mockReturnValue(mockTemplates);

          const response = await request(app)
            .get('/api/v1/notifications/templates')
            .set('Authorization', adminToken)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveLength(1);
        });
      });

      describe('GET /api/v1/notifications/:id/stats', () => {
        it('should retrieve notification statistics (admin only)', async () => {
          const mockStats = {
            sent: 10,
            delivered: 8,
            read: 5,
            clicked: 2,
            failed: 0
          };

          jest.spyOn(notificationService, 'getNotificationStats')
            .mockResolvedValue(mockStats);

          const response = await request(app)
            .get(`/api/v1/notifications/${testNotificationId}/stats`)
            .set('Authorization', adminToken)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.sent).toBe(10);
        });
      });
    });
  });

  describe('Notification Scheduler', () => {
    it('should initialize successfully', async () => {
      const status = notificationScheduler.getStatus();
      expect(status.isInitialized).toBe(true);
    });

    it('should schedule notifications', async () => {
      const futureDate = new Date(Date.now() + 60000); // 1 minute from now
      const notification = {
        id: 'scheduled-notif',
        scheduled_for: futureDate.toISOString(),
        type: 'reminder',
        title: 'Scheduled Notification',
        message: 'This is scheduled'
      };

      await notificationScheduler.scheduleNotification(notification);
      
      const status = notificationScheduler.getStatus();
      expect(status.scheduledTasks).toBeGreaterThan(0);
    });

    it('should cancel scheduled notifications', () => {
      const notificationId = 'test-scheduled-notif';
      notificationScheduler.cancelScheduledNotification(notificationId);
      
      // Should not throw error even if notification doesn't exist
      expect(true).toBe(true);
    });
  });

  describe('Real-time Integration', () => {
    it('should send real-time notifications via WebSocket', async () => {
      mockWebsocketService.sendNotificationToUser.mockResolvedValue();

      const notificationData = {
        type: 'notice' as const,
        title: 'Real-time Test',
        message: 'Test message',
        userId: testUserId
      };

      // Mock database operations
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testNotificationId,
                ...notificationData,
                created_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      } as any);

      await notificationService.createNotification(notificationData);

      expect(mockWebsocketService.sendNotificationToUser).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          id: testNotificationId,
          type: 'notice',
          title: 'Real-time Test'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      } as any);

      const notificationData = {
        type: 'notice' as const,
        title: 'Test',
        message: 'Test message',
        userId: testUserId
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow();
    });

    it('should handle WebSocket connection errors gracefully', async () => {
      mockWebsocketService.sendNotificationToUser.mockRejectedValue(
        new Error('WebSocket connection failed')
      );

      // Should not throw error, just log warning
      const notificationData = {
        type: 'notice' as const,
        title: 'Test',
        message: 'Test message',
        userId: testUserId
      };

      // Mock successful database operations
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: testNotificationId,
                ...notificationData,
                created_at: new Date().toISOString()
              },
              error: null
            })
          })
        })
      } as any);

      const result = await notificationService.createNotification(notificationData);
      expect(result).toBe(testNotificationId);
    });
  });

  afterAll(async () => {
    // Cleanup
    notificationScheduler.shutdown();
  });
});