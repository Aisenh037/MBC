import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  Announcement as AnnouncementIcon,
  EventAvailable as AttendanceIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon
} from '@mui/icons-material';
import { useRealTimeNotifications } from '../hooks/useWebSocket';
import { NotificationData } from '../services/websocketClient';
import { formatDistanceToNow } from 'date-fns';

// Notification type icons
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'grade':
      return <GradeIcon color="primary" />;
    case 'assignment':
      return <AssignmentIcon color="secondary" />;
    case 'notice':
      return <AnnouncementIcon color="warning" />;
    case 'attendance':
      return <AttendanceIcon color="success" />;
    default:
      return <InfoIcon color="info" />;
  }
};

// Notification priority colors
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'normal':
      return 'primary';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
};

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onClose?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onClose
}) => {
  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    onClose?.();
  };

  return (
    <ListItem
      sx={{
        bgcolor: 'background.paper',
        borderLeft: 4,
        borderLeftColor: `${getPriorityColor(notification.metadata?.priority)}.main`,
        mb: 1,
        borderRadius: 1,
        boxShadow: 1
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'transparent' }}>
          {getNotificationIcon(notification.type)}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {notification.title}
            </Typography>
            {notification.metadata?.priority && (
              <Chip
                label={notification.metadata.priority}
                size="small"
                color={getPriorityColor(notification.metadata.priority) as any}
                variant="outlined"
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </Typography>
          </Box>
        }
      />
      
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          size="small"
          onClick={handleMarkAsRead}
          title="Mark as read"
        >
          <MarkReadIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

interface RealTimeNotificationsProps {
  maxDisplayCount?: number;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  maxDisplayCount = 10
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    connected,
    markNotificationAsRead
  } = useRealTimeNotifications();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [displayNotifications, setDisplayNotifications] = useState<NotificationData[]>([]);

  // Update display notifications when notifications change
  useEffect(() => {
    setDisplayNotifications(notifications.slice(0, maxDisplayCount));
  }, [notifications, maxDisplayCount]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    markNotificationAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearAll();
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          position: 'relative',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {connected && unreadCount > 0 ? (
            <NotificationsActive />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'visible'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={connected ? 'Live' : 'Offline'}
                size="small"
                color={connected ? 'success' : 'default'}
                variant="outlined"
              />
              {notifications.length > 0 && (
                <Button
                  size="small"
                  onClick={handleClearAll}
                  startIcon={<CloseIcon />}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Box>
          
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {displayNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.disabled">
                You'll see real-time updates here
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {displayNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={handleClose}
                />
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > maxDisplayCount && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing {maxDisplayCount} of {notifications.length} notifications
              </Typography>
            </Box>
          </>
        )}

        {/* Connection Status */}
        <Divider />
        <Box sx={{ p: 1, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.disabled" display="flex" alignItems="center" gap={0.5}>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: connected ? 'success.main' : 'error.main',
                display: 'inline-block'
              }}
            />
            {connected ? 'Connected to real-time updates' : 'Disconnected from real-time updates'}
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default RealTimeNotifications;