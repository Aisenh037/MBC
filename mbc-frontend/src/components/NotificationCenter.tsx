import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Settings } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { NotificationData } from '../services/websocketClient';
import api from '../services/apiClient';

interface Notification {
  id: string;
  type: 'notice' | 'grade' | 'attendance' | 'assignment' | 'system' | 'reminder' | 'announcement';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

interface NotificationPreferences {
  enabledTypes: string[];
  enabledMethods: string[];
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { isConnected } = useWebSocket();
  // Remove unused typedApi for now
  // const typedApi = useTypedApi;

  // Load notifications
  const loadNotifications = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(filter === 'unread' && { unreadOnly: 'true' }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      });

      const response = await api.get(
        `/notifications/my-notifications?${params}`
      );

      if (response.data.success) {
        const newNotifications = response.data.data.notifications;
        setNotifications(prev => 
          reset ? newNotifications : [...prev, ...newNotifications]
        );
        setHasMore(response.data.data.pagination.page < response.data.data.pagination.pages);
        
        // Update unread count
        const unread = newNotifications.filter((n: Notification) => !n.isRead).length;
        if (reset) {
          setUnreadCount(unread);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load preferences
  const loadPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => 
          api.put(`/notifications/${n.id}/read`)
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await api.put('/notifications/preferences', newPreferences);
      
      if (response.data.success) {
        setPreferences(prev => ({ ...prev, ...newPreferences } as NotificationPreferences));
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  // Handle real-time notifications
  useEffect(() => {
    const handleNotification = (notification: NotificationData) => {
      const newNotification: Notification = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.metadata?.priority || 'normal',
        isRead: false,
        isDelivered: true,
        createdAt: notification.createdAt.toISOString(),
        actionUrl: notification.metadata?.actionUrl || undefined,
        actionText: notification.metadata?.actionText || undefined,
        metadata: notification.metadata ?? {}
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    };

    // Listen for WebSocket notifications
    window.addEventListener('notification', handleNotification as any);
    
    return () => {
      window.removeEventListener('notification', handleNotification as any);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadPreferences();
    }
  }, [isOpen, filter, typeFilter]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    const icons = {
      notice: '📢',
      grade: '📊',
      attendance: '✅',
      assignment: '📝',
      system: '⚙️',
      reminder: '⏰',
      announcement: '📣'
    };
    return icons[type as keyof typeof icons] || '📬';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-500';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full h-3 w-3"></span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Notification Preferences</h4>
              
              {/* Notification Types */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Types
                </label>
                <div className="space-y-1">
                  {['notice', 'grade', 'attendance', 'assignment', 'system', 'reminder', 'announcement'].map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.enabledTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...preferences.enabledTypes, type]
                            : preferences.enabledTypes.filter(t => t !== type);
                          updatePreferences({ enabledTypes: newTypes });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Delivery Methods */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Methods
                </label>
                <div className="space-y-1">
                  {['realtime', 'email'].map(method => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.enabledMethods.includes(method)}
                        onChange={(e) => {
                          const newMethods = e.target.checked
                            ? [...preferences.enabledMethods, method]
                            : preferences.enabledMethods.filter(m => m !== method);
                          updatePreferences({ enabledMethods: newMethods });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={preferences.frequency}
                  onChange={(e) => updatePreferences({ frequency: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="p-4 border-b border-gray-200">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="notice">Notices</option>
              <option value="grade">Grades</option>
              <option value="attendance">Attendance</option>
              <option value="assignment">Assignments</option>
              <option value="system">System</option>
              <option value="reminder">Reminders</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.actionUrl && notification.actionText && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={() => markAsRead(notification.id)}
                            >
                              {notification.actionText}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Load More */}
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => {
                        setPage(prev => prev + 1);
                        loadNotifications(page + 1, false);
                      }}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;