import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketClient, WebSocketEventHandlers, NotificationData } from '../services/websocketClient';
import { useAuthStore } from '../stores/authStore';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  onNotification?: (notification: NotificationData) => void;
  onGradeUpdate?: (data: any) => void;
  onAttendanceUpdate?: (data: any) => void;
  onNoticePosted?: (data: any) => void;
  onAssignmentCreated?: (data: any) => void;
  onAssignmentSubmitted?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  socketId?: string;
  reconnectAttempts: number;
  error?: Error;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { token, user } = useAuthStore();
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Update WebSocket state
  const updateState = useCallback(() => {
    const status = websocketClient.getStatus();
    setState(prevState => ({
      ...prevState,
      connected: status.connected,
      connecting: status.connecting,
      socketId: status.socketId || undefined,
      reconnectAttempts: status.reconnectAttempts
    }));
  }, []);

  // Set up event handlers
  useEffect(() => {
    const handlers: WebSocketEventHandlers = {
      onConnect: () => {
        updateState();
        optionsRef.current.onConnect?.();
      },
      onDisconnect: (reason: string) => {
        updateState();
        optionsRef.current.onDisconnect?.(reason);
      },
      onError: (error: Error) => {
        setState(prevState => ({ ...prevState, error }));
        optionsRef.current.onError?.(error);
      },
      onNotification: optionsRef.current.onNotification || (() => {}),
      onGradeUpdate: optionsRef.current.onGradeUpdate || (() => {}),
      onAttendanceUpdate: optionsRef.current.onAttendanceUpdate || (() => {}),
      onNoticePosted: optionsRef.current.onNoticePosted || (() => {}),
      onAssignmentCreated: optionsRef.current.onAssignmentCreated || (() => {}),
      onAssignmentSubmitted: optionsRef.current.onAssignmentSubmitted || (() => {})
    };

    websocketClient.updateHandlers(handlers);
  }, [updateState]);

  // Auto-connect when token is available
  useEffect(() => {
    if (options.autoConnect !== false && token && user && !websocketClient.isConnected()) {
      websocketClient.connect(token);
      updateState();
    }
  }, [token, user, options.autoConnect, updateState]);

  // Update state periodically
  useEffect(() => {
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (options.autoConnect !== false) {
        // Don't disconnect on unmount if auto-connect is enabled
        // Let the singleton manage the connection
      }
    };
  }, [options.autoConnect]);

  // Connection methods
  const connect = useCallback(() => {
    if (token) {
      websocketClient.connect(token);
      updateState();
    }
  }, [token, updateState]);

  const disconnect = useCallback(() => {
    websocketClient.disconnect();
    updateState();
  }, [updateState]);

  // Room management
  const joinRoom = useCallback((roomId: string) => {
    websocketClient.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    websocketClient.leaveRoom(roomId);
  }, []);

  // Notification management
  const markNotificationAsRead = useCallback((notificationId: string) => {
    websocketClient.markNotificationAsRead(notificationId);
  }, []);

  // Typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (user) {
      websocketClient.startTyping(roomId, `${user.profile.firstName} ${user.profile.lastName}`);
    }
  }, [user]);

  const stopTyping = useCallback((roomId: string) => {
    if (user) {
      websocketClient.stopTyping(roomId, `${user.profile.firstName} ${user.profile.lastName}`);
    }
  }, [user]);

  // Heartbeat
  const ping = useCallback(() => {
    websocketClient.ping();
  }, []);

  return {
    // State
    ...state,
    isConnected: state.connected,
    
    // Connection methods
    connect,
    disconnect,
    
    // Room management
    joinRoom,
    leaveRoom,
    
    // Notification methods
    markNotificationAsRead,
    
    // Typing indicators
    startTyping,
    stopTyping,
    
    // Utility methods
    ping,
    
    // Direct access to client (for advanced usage)
    client: websocketClient
  };
};

// Specialized hooks for different user roles

export const useStudentWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user } = useAuthStore();
  
  return useWebSocket({
    ...options,
    autoConnect: user?.role === 'student'
  });
};

export const useProfessorWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user } = useAuthStore();
  
  return useWebSocket({
    ...options,
    autoConnect: user?.role === 'professor'
  });
};

export const useAdminWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user } = useAuthStore();
  
  return useWebSocket({
    ...options,
    autoConnect: user?.role === 'admin'
  });
};

// Hook for real-time notifications with toast integration
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification (you can integrate with your toast library here)
    console.log('New notification:', notification);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const websocket = useWebSocket({
    onNotification: handleNotification
  });

  return {
    ...websocket,
    notifications,
    unreadCount,
    markAsRead,
    clearAll
  };
};