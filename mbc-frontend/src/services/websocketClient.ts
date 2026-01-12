import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

// WebSocket event types (matching backend)
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

// WebSocket event handlers type
export interface WebSocketEventHandlers {
  onNotification?: (notification: NotificationData) => void;
  onGradeUpdate?: (data: GradeUpdateData) => void;
  onAttendanceUpdate?: (data: AttendanceUpdateData) => void;
  onNoticePosted?: (data: NoticeData) => void;
  onAssignmentCreated?: (data: AssignmentData) => void;
  onAssignmentSubmitted?: (data: SubmissionData) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: WebSocketEventHandlers = {};
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  public connect(token: string, handlers: WebSocketEventHandlers = {}): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.eventHandlers = handlers;

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnecting = false;
      this.eventHandlers.onDisconnect?.(reason);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.eventHandlers.onError?.(error);
      this.handleReconnect();
    });

    // Real-time event listeners
    this.socket.on('notification:new', (notification: NotificationData) => {
      console.log('New notification received:', notification);
      this.eventHandlers.onNotification?.(notification);
    });

    this.socket.on('grade:updated', (data: GradeUpdateData) => {
      console.log('Grade updated:', data);
      this.eventHandlers.onGradeUpdate?.(data);
    });

    this.socket.on('attendance:marked', (data: AttendanceUpdateData) => {
      console.log('Attendance updated:', data);
      this.eventHandlers.onAttendanceUpdate?.(data);
    });

    this.socket.on('notice:posted', (data: NoticeData) => {
      console.log('New notice posted:', data);
      this.eventHandlers.onNoticePosted?.(data);
    });

    this.socket.on('assignment:created', (data: AssignmentData) => {
      console.log('New assignment created:', data);
      this.eventHandlers.onAssignmentCreated?.(data);
    });

    this.socket.on('assignment:submitted', (data: SubmissionData) => {
      console.log('Assignment submitted:', data);
      this.eventHandlers.onAssignmentSubmitted?.(data);
    });

    // Connection confirmation
    this.socket.on('connected', (data: any) => {
      console.log('WebSocket connection confirmed:', data);
    });

    // Heartbeat
    this.socket.on('pong', (data: { timestamp: number }) => {
      console.log('Heartbeat pong received:', data);
    });

    // Room events
    this.socket.on('room:user_joined', (data: any) => {
      console.log('User joined room:', data);
    });

    this.socket.on('room:user_left', (data: any) => {
      console.log('User left room:', data);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: any) => {
      console.log('User started typing:', data);
    });

    this.socket.on('typing:stop', (data: any) => {
      console.log('User stopped typing:', data);
    });

    // Notification read confirmation
    this.socket.on('notification:read_confirmed', (data: any) => {
      console.log('Notification read confirmed:', data);
    });
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Join a room
   */
  public joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join:room', roomId);
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave:room', roomId);
    }
  }

  /**
   * Mark notification as read
   */
  public markNotificationAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:read', notificationId);
    }
  }

  /**
   * Send typing start indicator
   */
  public startTyping(roomId: string, userName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { roomId, userName });
    }
  }

  /**
   * Send typing stop indicator
   */
  public stopTyping(roomId: string, userName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { roomId, userName });
    }
  }

  /**
   * Send heartbeat ping
   */
  public ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Update event handlers
   */
  public updateHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    connecting: boolean;
    socketId?: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
export const websocketClient = new WebSocketClient();

// Auto-connect when auth token is available
const authStore = useAuthStore.getState();
if (authStore.token) {
  websocketClient.connect(authStore.token);
}

// Listen for auth changes
useAuthStore.subscribe((state) => {
  if (state.token && !websocketClient.isConnected()) {
    websocketClient.connect(state.token);
  } else if (!state.token && websocketClient.isConnected()) {
    websocketClient.disconnect();
  }
});

export default websocketClient;