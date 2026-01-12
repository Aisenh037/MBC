import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import redisService from './redisService.js';

// WebSocket event types
export interface WebSocketEvents {
  // Connection events
  connection: (socket: AuthenticatedSocket) => void;
  disconnect: (reason: string) => void;
  
  // Notification events
  'notification:new': (data: NotificationData) => void;
  'notification:read': (notificationId: string) => void;
  
  // Real-time updates
  'grade:updated': (data: GradeUpdateData) => void;
  'attendance:marked': (data: AttendanceUpdateData) => void;
  'notice:posted': (data: NoticeData) => void;
  'assignment:created': (data: AssignmentData) => void;
  'assignment:submitted': (data: SubmissionData) => void;
  
  // Room management
  'join:room': (roomId: string) => void;
  'leave:room': (roomId: string) => void;
  
  // Typing indicators
  'typing:start': (data: TypingData) => void;
  'typing:stop': (data: TypingData) => void;
}

// Data interfaces
export interface NotificationData {
  id: string;
  type: 'notice' | 'grade' | 'attendance' | 'assignment' | 'system';
  title: string;
  message: string;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface GradeUpdateData {
  studentId: string;
  courseId: string;
  assignmentId: string;
  grade: number;
  maxGrade: number;
  feedback?: string;
  gradedBy: string;
  gradedAt: Date;
}

export interface AttendanceUpdateData {
  studentId: string;
  courseId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy: string;
  markedAt: Date;
}

export interface NoticeData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  targetAudience: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
}

export interface AssignmentData {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  maxMarks: number;
  professorId: string;
  createdAt: Date;
}

export interface SubmissionData {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Date;
  fileAttachments: string[];
}

export interface TypingData {
  userId: string;
  roomId: string;
  userName: string;
}

// Extended socket interface with user data
export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  institutionId?: string;
  branchId?: string;
}

// Import Socket type from socket.io
import { Socket } from 'socket.io';

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, AuthenticatedSocket>();
  private userRooms = new Map<string, Set<string>>();

  /**
   * Initialize WebSocket server
   */
  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.frontend.url,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    // Connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized');
  }

  /**
   * Authenticate socket connection using JWT token
   */
  private async authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      // Attach user data to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.institutionId = decoded.institutionId;
      socket.branchId = decoded.branchId;

      // Store connection in Redis for scaling
      await redisService.setex(
        `socket:${socket.id}`,
        3600, // 1 hour
        JSON.stringify({
          userId: socket.userId,
          userRole: socket.userRole,
          institutionId: socket.institutionId,
          branchId: socket.branchId,
          connectedAt: new Date().toISOString()
        })
      );

      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, userRole, institutionId, branchId } = socket;
    
    logger.info(`User connected: ${userId} (${userRole}) - Socket: ${socket.id}`);
    
    // Store connected user
    this.connectedUsers.set(socket.id, socket);
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Join user to role-based rooms
    if (userRole) {
      socket.join(`role:${userRole}`);
    }
    
    // Join user to institution room
    if (institutionId) {
      socket.join(`institution:${institutionId}`);
    }
    
    // Join user to branch room
    if (branchId) {
      socket.join(`branch:${branchId}`);
    }

    // Set up event handlers
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      userRole,
      connectedAt: new Date().toISOString()
    });
  }

  /**
   * Set up event handlers for socket
   */
  private setupEventHandlers(socket: AuthenticatedSocket): void {
    // Room management
    socket.on('join:room', (roomId: string) => {
      this.joinRoom(socket, roomId);
    });

    socket.on('leave:room', (roomId: string) => {
      this.leaveRoom(socket, roomId);
    });

    // Notification events
    socket.on('notification:read', (notificationId: string) => {
      this.markNotificationAsRead(socket, notificationId);
    });

    // Typing indicators
    socket.on('typing:start', (data: TypingData) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', (data: TypingData) => {
      this.handleTypingStop(socket, data);
    });

    // Heartbeat for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnection(socket: AuthenticatedSocket, reason: string): Promise<void> {
    const { userId } = socket;
    
    logger.info(`User disconnected: ${userId} - Reason: ${reason}`);
    
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
    
    // Clean up user rooms
    if (userId && this.userRooms.has(userId)) {
      this.userRooms.delete(userId);
    }
    
    // Remove from Redis
    await redisService.del(`socket:${socket.id}`);
    
    // Notify other users in the same rooms about disconnection
    socket.broadcast.emit('user:disconnected', {
      userId,
      disconnectedAt: new Date().toISOString()
    });
  }

  /**
   * Join a room
   */
  private joinRoom(socket: AuthenticatedSocket, roomId: string): void {
    const { userId } = socket;
    
    if (!userId) return;
    
    socket.join(roomId);
    
    // Track user rooms
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);
    
    logger.debug(`User ${userId} joined room: ${roomId}`);
    
    // Notify room about new member
    socket.to(roomId).emit('room:user_joined', {
      userId,
      roomId,
      joinedAt: new Date().toISOString()
    });
  }

  /**
   * Leave a room
   */
  private leaveRoom(socket: AuthenticatedSocket, roomId: string): void {
    const { userId } = socket;
    
    if (!userId) return;
    
    socket.leave(roomId);
    
    // Remove from user rooms tracking
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(roomId);
    }
    
    logger.debug(`User ${userId} left room: ${roomId}`);
    
    // Notify room about member leaving
    socket.to(roomId).emit('room:user_left', {
      userId,
      roomId,
      leftAt: new Date().toISOString()
    });
  }

  /**
   * Mark notification as read
   */
  private async markNotificationAsRead(socket: AuthenticatedSocket, notificationId: string): Promise<void> {
    const { userId } = socket;
    
    if (!userId) return;
    
    try {
      // Store read status in Redis
      await redisService.sadd(`notifications:read:${userId}`, notificationId);
      
      logger.debug(`Notification ${notificationId} marked as read by user ${userId}`);
      
      // Acknowledge to client
      socket.emit('notification:read_confirmed', {
        notificationId,
        readAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: AuthenticatedSocket, data: TypingData): void {
    const { userId } = socket;
    
    if (!userId || !data.roomId) return;
    
    // Broadcast typing indicator to room (except sender)
    socket.to(data.roomId).emit('typing:start', {
      ...data,
      userId
    });
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: AuthenticatedSocket, data: TypingData): void {
    const { userId } = socket;
    
    if (!userId || !data.roomId) return;
    
    // Broadcast typing stop to room (except sender)
    socket.to(data.roomId).emit('typing:stop', {
      ...data,
      userId
    });
  }

  // Public methods for emitting events

  /**
   * Send notification to specific user (alias for sendNotificationToUser)
   */
  public async sendNotification(userId: string, notification: NotificationData): Promise<void> {
    return this.sendNotificationToUser(userId, notification);
  }

  /**
   * Send notification to specific user
   */
  public async sendNotificationToUser(userId: string, notification: NotificationData): Promise<void> {
    if (!this.io) return;
    
    try {
      // Store notification in Redis for offline users
      await redisService.lpush(
        `notifications:${userId}`,
        JSON.stringify(notification)
      );
      
      // Set expiration for notification queue (30 days)
      await redisService.expire(`notifications:${userId}`, 30 * 24 * 60 * 60);
      
      // Send to connected user
      this.io.to(`user:${userId}`).emit('notification:new', notification);
      
      logger.debug(`Notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
      logger.error('Error sending notification to user:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  public async sendNotificationToUsers(userIds: string[], notification: NotificationData): Promise<void> {
    const promises = userIds.map(userId => this.sendNotificationToUser(userId, notification));
    await Promise.all(promises);
  }

  /**
   * Broadcast to room
   */
  public broadcastToRoom(roomId: string, event: string, data: any): void {
    if (!this.io) return;
    
    this.io.to(roomId).emit(event, data);
    logger.debug(`Broadcasted ${event} to room ${roomId}`);
  }

  /**
   * Broadcast to role
   */
  public broadcastToRole(role: string, event: string, data: any): void {
    this.broadcastToRoom(`role:${role}`, event, data);
  }

  /**
   * Broadcast to institution
   */
  public broadcastToInstitution(institutionId: string, event: string, data: any): void {
    this.broadcastToRoom(`institution:${institutionId}`, event, data);
  }

  /**
   * Broadcast to branch
   */
  public broadcastToBranch(branchId: string, event: string, data: any): void {
    this.broadcastToRoom(`branch:${branchId}`, event, data);
  }

  /**
   * Send grade update notification
   */
  public async sendGradeUpdate(data: GradeUpdateData): Promise<void> {
    const notification: NotificationData = {
      id: `grade_${data.assignmentId}_${data.studentId}`,
      type: 'grade',
      title: 'Assignment Graded',
      message: `Your assignment has been graded: ${data.grade}/${data.maxGrade}`,
      userId: data.studentId,
      metadata: {
        assignmentId: data.assignmentId,
        courseId: data.courseId,
        grade: data.grade,
        maxGrade: data.maxGrade,
        feedback: data.feedback
      },
      createdAt: data.gradedAt
    };

    await this.sendNotificationToUser(data.studentId, notification);
    
    // Also emit specific grade update event
    if (this.io) {
      this.io.to(`user:${data.studentId}`).emit('grade:updated', data);
    }
  }

  /**
   * Send attendance update notification
   */
  public async sendAttendanceUpdate(data: AttendanceUpdateData): Promise<void> {
    const notification: NotificationData = {
      id: `attendance_${data.courseId}_${data.studentId}_${data.date}`,
      type: 'attendance',
      title: 'Attendance Marked',
      message: `Attendance marked as ${data.status} for ${data.date}`,
      userId: data.studentId,
      metadata: {
        courseId: data.courseId,
        date: data.date,
        status: data.status
      },
      createdAt: data.markedAt
    };

    await this.sendNotificationToUser(data.studentId, notification);
    
    // Also emit specific attendance update event
    if (this.io) {
      this.io.to(`user:${data.studentId}`).emit('attendance:marked', data);
    }
  }

  /**
   * Broadcast new notice
   */
  public async broadcastNotice(data: NoticeData): Promise<void> {
    if (!this.io) return;

    // Send to target audiences
    for (const audience of data.targetAudience) {
      if (audience === 'all') {
        this.io.emit('notice:posted', data);
        // Note: For 'all', we'd need to get all user IDs to send individual notifications
      } else if (audience.startsWith('role:')) {
        const role = audience.replace('role:', '');
        this.broadcastToRole(role, 'notice:posted', data);
      } else if (audience.startsWith('branch:')) {
        const branchId = audience.replace('branch:', '');
        this.broadcastToBranch(branchId, 'notice:posted', data);
      } else if (audience.startsWith('institution:')) {
        const institutionId = audience.replace('institution:', '');
        this.broadcastToInstitution(institutionId, 'notice:posted', data);
      }
    }

    logger.info(`Notice broadcasted: ${data.title} to audiences: ${data.targetAudience.join(', ')}`);
  }

  /**
   * Send assignment creation notification
   */
  public async sendAssignmentCreated(data: AssignmentData, studentIds: string[]): Promise<void> {
    const notification: NotificationData = {
      id: `assignment_${data.id}`,
      type: 'assignment',
      title: 'New Assignment',
      message: `New assignment posted: ${data.title}`,
      userId: '', // Will be set per student
      metadata: {
        assignmentId: data.id,
        courseId: data.courseId,
        dueDate: data.dueDate,
        maxMarks: data.maxMarks
      },
      createdAt: data.createdAt
    };

    // Send to all enrolled students
    const promises = studentIds.map(studentId => {
      const studentNotification = { ...notification, userId: studentId };
      return this.sendNotificationToUser(studentId, studentNotification);
    });

    await Promise.all(promises);

    // Also emit specific assignment event
    if (this.io) {
      studentIds.forEach(studentId => {
        this.io!.to(`user:${studentId}`).emit('assignment:created', data);
      });
    }
  }

  /**
   * Send assignment submission notification to professor
   */
  public async sendAssignmentSubmitted(data: SubmissionData, professorId: string): Promise<void> {
    const notificationData: NotificationData = {
      id: `submission_${data.id}`,
      type: 'assignment',
      title: 'Assignment Submitted',
      message: `A student has submitted an assignment`,
      userId: professorId,
      metadata: {
        submissionId: data.id,
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        submittedAt: data.submittedAt
      },
      createdAt: data.submittedAt
    };

    await this.sendNotificationToUser(professorId, notificationData);
    
    // Also emit specific submission event
    if (this.io) {
      this.io.to(`user:${professorId}`).emit('assignment:submitted', data);
    }
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users by role
   */
  public getConnectedUsersByRole(role: string): AuthenticatedSocket[] {
    return Array.from(this.connectedUsers.values()).filter(socket => socket.userRole === role);
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return Array.from(this.connectedUsers.values()).some(socket => socket.userId === userId);
  }

  /**
   * Get server instance
   */
  public getServer(): SocketIOServer | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();