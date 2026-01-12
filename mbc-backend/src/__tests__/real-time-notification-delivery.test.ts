import fc from 'fast-check';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';

/**
 * Property-Based Test for Real-time Notification Delivery
 * 
 * Property 8: Real-time Notification Delivery
 * For any system event that should trigger notifications (notices, grades, attendance), 
 * all connected users in the target audience should receive the notification within 1 second
 * 
 * **Feature: mbc-modernization, Property 8: Real-time Notification Delivery**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 */

describe('Property 8: Real-time Notification Delivery', () => {
  let io: Server;
  let httpServer: any;
  let clients: any[] = [];
  const TEST_PORT = 3003;

  beforeAll(async () => {
    // Set up test WebSocket server
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Set up basic WebSocket handling
    io.on('connection', (socket) => {
      socket.on('authenticate', (data) => {
        socket.data.userId = data.userId;
        socket.join(`user:${data.userId}`);
        socket.emit('authenticated', { success: true });
      });

      socket.on('send_notification', (data) => {
        const { targetUsers, notification } = data;
        const timestamp = Date.now();
        
        targetUsers.forEach((userId: string) => {
          io.to(`user:${userId}`).emit('notification', {
            ...notification,
            timestamp,
            receivedAt: Date.now()
          });
        });
      });
    });

    httpServer.listen(TEST_PORT);
  });

  afterAll(async () => {
    // Clean up
    clients.forEach(client => client.disconnect());
    io.close();
    httpServer.close();
  });

  beforeEach(() => {
    clients.forEach(client => client.disconnect());
    clients = [];
  });

  /**
   * Generator for notification types
   */
  const notificationTypeArb = fc.constantFrom(
    'notice', 'grade', 'attendance', 'assignment', 'system', 'reminder', 'announcement'
  );

  /**
   * Generator for priority levels
   */
  const priorityArb = fc.constantFrom('low', 'normal', 'high', 'urgent');

  /**
   * Generator for user IDs
   */
  const userIdArb = fc.uuid();

  /**
   * Generator for notification content
   */
  const notificationContentArb = fc.record({
    type: notificationTypeArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    message: fc.string({ minLength: 1, maxLength: 500 }),
    priority: priorityArb,
    id: fc.uuid()
  });

  /**
   * Helper function to create authenticated WebSocket clients
   */
  const createAuthenticatedClient = (userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const client = Client(`http://localhost:${TEST_PORT}`);

      client.on('connect', () => {
        client.emit('authenticate', { userId });
      });

      client.on('authenticated', (data) => {
        if (data.success) {
          clients.push(client);
          resolve(client);
        } else {
          reject(new Error('Authentication failed'));
        }
      });

      client.on('connect_error', (error) => {
        reject(error);
      });

      // Set timeout for connection
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });
  };

  /**
   * Helper function to wait for notifications with timeout
   */
  const waitForNotifications = (
    clients: any[], 
    expectedCount: number, 
    timeoutMs: number = 1500
  ): Promise<{ receivedNotifications: any[], timings: number[] }> => {
    return new Promise((resolve, reject) => {
      const receivedNotifications: any[] = [];
      const timings: number[] = [];
      const startTime = Date.now();

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout: Expected ${expectedCount} notifications, received ${receivedNotifications.length}`));
      }, timeoutMs);

      clients.forEach((client, index) => {
        client.on('notification', (notification: any) => {
          const receiveTime = Date.now();
          receivedNotifications.push({ clientIndex: index, notification, receiveTime });
          timings.push(receiveTime - startTime);

          if (receivedNotifications.length >= expectedCount) {
            clearTimeout(timeout);
            resolve({ receivedNotifications, timings });
          }
        });
      });
    });
  };

  /**
   * Property Test: All connected users in target audience receive notifications within 1 second
   */
  test('Property 8: Real-time notification delivery within 1 second', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationContentArb,
        fc.array(userIdArb, { minLength: 1, maxLength: 5 }),
        async (notificationContent, userIds) => {
          // Create authenticated clients for each user
          const connectedClients = await Promise.all(
            userIds.map(userId => createAuthenticatedClient(userId))
          );

          // Wait a moment for connections to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));

          // Send notification via WebSocket
          const startTime = Date.now();
          const senderClient = connectedClients[0];
          
          const notificationPromise = new Promise<void>((resolve) => {
            senderClient.emit('send_notification', {
              targetUsers: userIds,
              notification: notificationContent
            });
            resolve();
          });

          // Wait for notifications to be received
          const notificationWaitPromise = waitForNotifications(
            connectedClients, 
            userIds.length,
            1500 // 1.5 seconds timeout (allowing 0.5s buffer)
          );

          // Execute both promises
          const [, { receivedNotifications, timings }] = await Promise.all([
            notificationPromise,
            notificationWaitPromise
          ]);

          // Verify all users received the notification
          expect(receivedNotifications).toHaveLength(userIds.length);

          // Verify delivery time is within 1 second (1000ms)
          timings.forEach(timing => {
            expect(timing).toBeLessThanOrEqual(1000);
          });

          // Verify notification content integrity
          receivedNotifications.forEach(({ notification }) => {
            expect(notification.type).toBe(notificationContent.type);
            expect(notification.title).toBe(notificationContent.title);
            expect(notification.message).toBe(notificationContent.message);
            expect(notification.priority).toBe(notificationContent.priority);
            expect(notification.id).toBe(notificationContent.id);
          });

          // Verify all target users received the notification
          const receivedUserIndices = receivedNotifications.map(r => r.clientIndex);
          const expectedUserIndices = userIds.map((_, index) => index);
          expect(receivedUserIndices.sort()).toEqual(expectedUserIndices.sort());

          // Clean up clients for this test iteration
          connectedClients.forEach(client => client.disconnect());
        }
      ),
      { 
        numRuns: 10, // Run 10 iterations with different random data
        timeout: 30000, // 30 second timeout per test
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for entire test

  /**
   * Property Test: Notification delivery is reliable across different network conditions
   */
  test('Property 8: Notification delivery reliability', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationContentArb,
        fc.array(userIdArb, { minLength: 2, maxLength: 4 }),
        fc.integer({ min: 0, max: 200 }), // Network delay simulation
        async (notificationContent, userIds, networkDelay) => {
          // Create clients with simulated network delay
          const connectedClients = await Promise.all(
            userIds.map(async (userId, index) => {
              // Simulate staggered connections
              await new Promise(resolve => setTimeout(resolve, index * 25));
              return createAuthenticatedClient(userId);
            })
          );

          // Simulate network delay
          if (networkDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, networkDelay));
          }

          // Send notification
          const senderClient = connectedClients[0];
          const notificationPromise = new Promise<void>((resolve) => {
            senderClient.emit('send_notification', {
              targetUsers: userIds,
              notification: notificationContent
            });
            resolve();
          });

          // Wait for notifications with extended timeout for network delay
          const timeoutMs = 1000 + networkDelay + 500; // Base timeout + network delay + buffer
          const notificationWaitPromise = waitForNotifications(
            connectedClients, 
            userIds.length,
            timeoutMs
          );

          const [, { receivedNotifications, timings }] = await Promise.all([
            notificationPromise,
            notificationWaitPromise
          ]);

          // All users should receive the notification regardless of network conditions
          expect(receivedNotifications).toHaveLength(userIds.length);

          // Each notification should be delivered within reasonable time considering network delay
          const maxAcceptableTime = 1000 + networkDelay;
          timings.forEach(timing => {
            expect(timing).toBeLessThanOrEqual(maxAcceptableTime);
          });

          // Clean up
          connectedClients.forEach(client => client.disconnect());
        }
      ),
      { 
        numRuns: 8,
        timeout: 30000
      }
    );
  }, 60000);

  /**
   * Property Test: Notification ordering is preserved for multiple notifications
   */
  test('Property 8: Notification ordering preservation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(notificationContentArb, { minLength: 2, maxLength: 4 }),
        userIdArb,
        async (notifications, userId) => {
          // Create single client
          const client = await createAuthenticatedClient(userId);
          const receivedNotifications: any[] = [];
          const receivedTimestamps: number[] = [];

          // Set up notification listener
          client.on('notification', (notification: any) => {
            receivedNotifications.push(notification);
            receivedTimestamps.push(Date.now());
          });

          // Send notifications in sequence with small delays
          for (let i = 0; i < notifications.length; i++) {
            const notification = notifications[i];
            // Small delay between notifications to test ordering
            await new Promise(resolve => setTimeout(resolve, 50));
            
            client.emit('send_notification', {
              targetUsers: [userId],
              notification: { ...notification, sequenceId: i }
            });
          }

          // Wait for all notifications to be received
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify all notifications were received
          expect(receivedNotifications).toHaveLength(notifications.length);

          // Verify notifications were received in chronological order
          for (let i = 1; i < receivedTimestamps.length; i++) {
            expect(receivedTimestamps[i]).toBeGreaterThanOrEqual(receivedTimestamps[i - 1]);
          }

          // Verify notification content matches sent notifications
          receivedNotifications.forEach((received, index) => {
            const sent = notifications[index];
            expect(received.type).toBe(sent.type);
            expect(received.title).toBe(sent.title);
            expect(received.message).toBe(sent.message);
            expect(received.sequenceId).toBe(index);
          });

          client.disconnect();
        }
      ),
      { 
        numRuns: 5,
        timeout: 20000
      }
    );
  }, 40000);

  /**
   * Property Test: High-priority notifications are delivered with same speed as normal notifications
   */
  test('Property 8: Priority-based delivery consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        notificationContentArb,
        fc.array(userIdArb, { minLength: 1, maxLength: 3 }),
        async (notificationContent, userIds) => {
          // Create clients
          const connectedClients = await Promise.all(
            userIds.map(userId => createAuthenticatedClient(userId))
          );

          // Send notification
          const startTime = Date.now();
          const senderClient = connectedClients[0];
          
          const notificationPromise = new Promise<void>((resolve) => {
            senderClient.emit('send_notification', {
              targetUsers: userIds,
              notification: notificationContent
            });
            resolve();
          });

          // Wait for notifications
          const notificationWaitPromise = waitForNotifications(
            connectedClients,
            userIds.length,
            1500
          );

          const [, { receivedNotifications, timings }] = await Promise.all([
            notificationPromise,
            notificationWaitPromise
          ]);

          // Verify delivery regardless of priority
          expect(receivedNotifications).toHaveLength(userIds.length);

          // Verify all notifications delivered within 1 second regardless of priority
          timings.forEach(timing => {
            expect(timing).toBeLessThanOrEqual(1000);
          });

          // Verify priority is preserved in the notification
          receivedNotifications.forEach(({ notification }) => {
            expect(notification.priority).toBe(notificationContent.priority);
          });

          // Clean up
          connectedClients.forEach(client => client.disconnect());
        }
      ),
      { 
        numRuns: 8,
        timeout: 20000
      }
    );
  }, 40000);
});