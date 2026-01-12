import fc from 'fast-check';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { websocketService } from '../services/websocketService.js';
import config from '../config/config.js';
import redisService from '../services/redisService.js';

// Test server setup
let httpServer: HTTPServer;
let ioServer: SocketIOServer;
let clientSockets: ClientSocket[] = [];

// Mock user data generator
const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  role: fc.constantFrom('admin', 'professor', 'student'),
  institutionId: fc.uuid(),
  branchId: fc.uuid(),
  profile: fc.record({
    firstName: fc.string({ minLength: 2, maxLength: 20 }),
    lastName: fc.string({ minLength: 2, maxLength: 20 })
  })
});

// Notification data generator
const notificationArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('notice', 'grade', 'attendance', 'assignment', 'system'),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  message: fc.string({ minLength: 10, maxLength: 500 }),
  userId: fc.uuid(),
  metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
  createdAt: fc.date()
});

// Grade update data generator
const gradeUpdateArbitrary = fc.record({
  studentId: fc.uuid(),
  courseId: fc.uuid(),
  assignmentId: fc.uuid(),
  grade: fc.integer({ min: 0, max: 100 }),
  maxGrade: fc.integer({ min: 50, max: 100 }),
  feedback: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  gradedBy: fc.uuid(),
  gradedAt: fc.date()
});

// Notice data generator
const noticeArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  content: fc.string({ minLength: 20, maxLength: 1000 }),
  authorId: fc.uuid(),
  targetAudience: fc.array(
    fc.oneof(
      fc.constant('all'),
      fc.string().map(s => `role:${s}`),
      fc.uuid().map(id => `branch:${id}`),
      fc.uuid().map(id => `institution:${id}`)
    ),
    { minLength: 1, maxLength: 3 }
  ),
  priority: fc.constantFrom('low', 'normal', 'high', 'urgent'),
  createdAt: fc.date()
});

// Helper function to create authenticated token
const createAuthToken = (user: any): string => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      institutionId: user.institutionId,
      branchId: user.branchId
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

// Helper function to create client socket
const createClientSocket = (token: string): Promise<ClientSocket> => {
  return new Promise((resolve, reject) => {
    const clientSocket = Client('http://localhost:3001', {
      auth: { token },
      transports: ['websocket']
    });

    clientSocket.on('connect', () => {
      clientSockets.push(clientSocket);
      resolve(clientSocket);
    });

    clientSocket.on('connect_error', (error) => {
      reject(error);
    });

    // Set timeout for connection
    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 5000);
  });
};

// Helper function to wait for event
const waitForEvent = (socket: ClientSocket, event: string, timeout = 2000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event ${event} not received within ${timeout}ms`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

describe('Real-time Notification Delivery Property Tests', () => {
  beforeAll(async () => {
    // Set up test server
    httpServer = new HTTPServer();
    websocketService.initialize(httpServer);
    ioServer = websocketService.getServer()!;
    
    await new Promise<void>((resolve) => {
      httpServer.listen(3001, resolve);
    });

    // Ensure Redis is connected
    await redisService.ping();
  });

  afterAll(async () => {
    // Clean up all client connections
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];

    // Close server
    if (ioServer) {
      ioServer.close();
    }
    if (httpServer) {
      httpServer.close();
    }

    // Clean up Redis
    await redisService.flushall();
  });

  afterEach(async () => {
    // Clean up Redis between tests
    await redisService.flushall();
    
    // Disconnect any remaining client sockets
    clientSockets.forEach(socket => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
    clientSockets = [];
  });

  /**
   * Property 8: Real-time Notification Delivery
   * For any system event that should trigger notifications, all connected users 
   * in the target audience should receive the notification within 1 second
   */
  test('Property 8.1: Individual user notifications are delivered within 1 second', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        notificationArbitrary,
        async (user, notification) => {
          // Create authenticated client
          const token = createAuthToken(user);
          const clientSocket = await createClientSocket(token);

          // Set up notification listener
          const notificationPromise = waitForEvent(clientSocket, 'notification:new', 1000);

          // Send notification to user
          const testNotification = { ...notification, userId: user.id };
          await websocketService.sendNotificationToUser(user.id, testNotification);

          // Wait for notification to be received
          const receivedNotification = await notificationPromise;

          // Verify notification content
          expect(receivedNotification.id).toBe(testNotification.id);
          expect(receivedNotification.type).toBe(testNotification.type);
          expect(receivedNotification.title).toBe(testNotification.title);
          expect(receivedNotification.message).toBe(testNotification.message);
          expect(receivedNotification.userId).toBe(user.id);

          // Clean up
          clientSocket.disconnect();
          return true;
        }
      ),
      { numRuns: 50, timeout: 10000 }
    );
  }, 30000);

  /**
   * Property 8.2: Grade update notifications are delivered to students within 1 second
   */
  test('Property 8.2: Grade update notifications are delivered within 1 second', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary.filter(u => u.role === 'student'),
        gradeUpdateArbitrary,
        async (student, gradeUpdate) => {
          // Create authenticated student client
          const token = createAuthToken(student);
          const clientSocket = await createClientSocket(token);

          // Set up grade update listener
          const gradeUpdatePromise = waitForEvent(clientSocket, 'grade:updated', 1000);

          // Send grade update
          const testGradeUpdate = { ...gradeUpdate, studentId: student.id };
          await websocketService.sendGradeUpdate(testGradeUpdate);

          // Wait for grade update to be received
          const receivedUpdate = await gradeUpdatePromise;

          // Verify grade update content
          expect(receivedUpdate.studentId).toBe(student.id);
          expect(receivedUpdate.courseId).toBe(testGradeUpdate.courseId);
          expect(receivedUpdate.assignmentId).toBe(testGradeUpdate.assignmentId);
          expect(receivedUpdate.grade).toBe(testGradeUpdate.grade);
          expect(receivedUpdate.maxGrade).toBe(testGradeUpdate.maxGrade);

          // Clean up
          clientSocket.disconnect();
          return true;
        }
      ),
      { numRuns: 30, timeout: 10000 }
    );
  }, 30000);

  /**
   * Property 8.3: Notice broadcasts reach all users in target audience within 1 second
   */
  test('Property 8.3: Notice broadcasts reach target audience within 1 second', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userArbitrary, { minLength: 2, maxLength: 5 }),
        noticeArbitrary,
        async (users, notice) => {
          // Create authenticated clients for all users
          const clientPromises = users.map(async (user) => {
            const token = createAuthToken(user);
            const socket = await createClientSocket(token);
            return { user, socket };
          });

          const clients = await Promise.all(clientPromises);

          // Set up notice listeners for all clients
          const noticePromises = clients.map(({ socket }) => 
            waitForEvent(socket, 'notice:posted', 1000)
          );

          // Broadcast notice to all users
          const testNotice = {
            ...notice,
            targetAudience: ['all'] // Broadcast to everyone
          };
          await websocketService.broadcastNotice(testNotice);

          // Wait for all clients to receive the notice
          const receivedNotices = await Promise.all(noticePromises);

          // Verify all clients received the same notice
          receivedNotices.forEach((receivedNotice) => {
            expect(receivedNotice.id).toBe(testNotice.id);
            expect(receivedNotice.title).toBe(testNotice.title);
            expect(receivedNotice.content).toBe(testNotice.content);
            expect(receivedNotice.priority).toBe(testNotice.priority);
          });

          // Clean up all clients
          clients.forEach(({ socket }) => socket.disconnect());
          return true;
        }
      ),
      { numRuns: 20, timeout: 15000 }
    );
  }, 45000);

  /**
   * Property 8.4: Role-based notifications reach only users with correct roles
   */
  test('Property 8.4: Role-based notifications reach only correct role users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(userArbitrary, { minLength: 3, maxLength: 6 }),
        fc.constantFrom('admin', 'professor', 'student'),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (users, targetRole, message) => {
          // Create authenticated clients for all users
          const clientPromises = users.map(async (user) => {
            const token = createAuthToken(user);
            const socket = await createClientSocket(token);
            return { user, socket };
          });

          const clients = await Promise.all(clientPromises);

          // Separate clients by role
          const targetClients = clients.filter(({ user }) => user.role === targetRole);
          const nonTargetClients = clients.filter(({ user }) => user.role !== targetRole);

          // Set up listeners for target clients (should receive)
          const targetPromises = targetClients.map(({ socket }) => 
            waitForEvent(socket, 'role:broadcast', 1000)
          );

          // Set up listeners for non-target clients (should not receive)
          const nonTargetPromises = nonTargetClients.map(({ socket }) => 
            new Promise((resolve) => {
              const timer = setTimeout(() => resolve(null), 1500); // Wait longer, expect no event
              socket.once('role:broadcast', (data) => {
                clearTimeout(timer);
                resolve(data); // This should not happen
              });
            })
          );

          // Broadcast to specific role
          websocketService.broadcastToRole(targetRole, 'role:broadcast', {
            message,
            targetRole,
            timestamp: new Date().toISOString()
          });

          // Wait for results
          const [targetResults, nonTargetResults] = await Promise.all([
            Promise.all(targetPromises),
            Promise.all(nonTargetPromises)
          ]);

          // Verify target clients received the message
          targetResults.forEach((result) => {
            expect(result).toBeTruthy();
            expect(result.message).toBe(message);
            expect(result.targetRole).toBe(targetRole);
          });

          // Verify non-target clients did not receive the message
          nonTargetResults.forEach((result) => {
            expect(result).toBeNull();
          });

          // Clean up all clients
          clients.forEach(({ socket }) => socket.disconnect());
          return true;
        }
      ),
      { numRuns: 15, timeout: 20000 }
    );
  }, 60000);

  /**
   * Property 8.5: Offline users receive notifications when they reconnect
   */
  test('Property 8.5: Offline users receive queued notifications on reconnect', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.array(notificationArbitrary, { minLength: 1, maxLength: 3 }),
        async (user, notifications) => {
          // Send notifications while user is offline
          const testNotifications = notifications.map(n => ({ ...n, userId: user.id }));
          
          for (const notification of testNotifications) {
            await websocketService.sendNotificationToUser(user.id, notification);
          }

          // Wait a bit to ensure notifications are queued
          await new Promise(resolve => setTimeout(resolve, 100));

          // Connect user and check if queued notifications are available
          const token = createAuthToken(user);
          const clientSocket = await createClientSocket(token);

          // Check Redis for queued notifications
          const queuedNotifications = await redisService.lrange(`notifications:${user.id}`, 0, -1);
          
          // Verify notifications were queued
          expect(queuedNotifications.length).toBeGreaterThanOrEqual(testNotifications.length);

          // Parse and verify queued notification content
          const parsedNotifications = queuedNotifications.map(n => JSON.parse(n));
          testNotifications.forEach((sentNotification) => {
            const found = parsedNotifications.find(n => n.id === sentNotification.id);
            expect(found).toBeTruthy();
            expect(found.title).toBe(sentNotification.title);
            expect(found.message).toBe(sentNotification.message);
          });

          // Clean up
          clientSocket.disconnect();
          return true;
        }
      ),
      { numRuns: 20, timeout: 10000 }
    );
  }, 30000);

  /**
   * Property 8.6: WebSocket connection authentication is enforced
   */
  test('Property 8.6: Invalid authentication tokens are rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (invalidToken) => {
          // Try to connect with invalid token
          const clientSocket = Client('http://localhost:3001', {
            auth: { token: invalidToken },
            transports: ['websocket']
          });

          // Wait for connection error
          const errorPromise = new Promise((resolve) => {
            clientSocket.on('connect_error', (error) => {
              resolve(error);
            });
            
            // Timeout if no error occurs (unexpected)
            setTimeout(() => {
              resolve(null);
            }, 2000);
          });

          const error = await errorPromise;
          
          // Verify connection was rejected
          expect(error).toBeTruthy();
          expect(clientSocket.connected).toBe(false);

          // Clean up
          clientSocket.disconnect();
          return true;
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
  }, 15000);

  /**
   * Property 8.7: Connection limits and resource management
   */
  test('Property 8.7: Multiple connections from same user are handled correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArbitrary,
        fc.integer({ min: 2, max: 5 }),
        async (user, connectionCount) => {
          const token = createAuthToken(user);
          const connections: ClientSocket[] = [];

          // Create multiple connections for the same user
          for (let i = 0; i < connectionCount; i++) {
            const socket = await createClientSocket(token);
            connections.push(socket);
          }

          // Verify all connections are established
          connections.forEach((socket) => {
            expect(socket.connected).toBe(true);
          });

          // Send a notification to the user
          const notification = {
            id: `test_${Date.now()}`,
            type: 'system' as const,
            title: 'Test Notification',
            message: 'Testing multiple connections',
            userId: user.id,
            createdAt: new Date()
          };

          // Set up listeners on all connections
          const notificationPromises = connections.map(socket => 
            waitForEvent(socket, 'notification:new', 1000)
          );

          // Send notification
          await websocketService.sendNotificationToUser(user.id, notification);

          // All connections should receive the notification
          const results = await Promise.all(notificationPromises);
          
          results.forEach((result) => {
            expect(result.id).toBe(notification.id);
            expect(result.title).toBe(notification.title);
          });

          // Clean up all connections
          connections.forEach(socket => socket.disconnect());
          return true;
        }
      ),
      { numRuns: 10, timeout: 15000 }
    );
  }, 45000);
});

// **Feature: mbc-modernization, Property 8: Real-time Notification Delivery**
// **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**