# Real-time Notification System

## Overview

The MBC Department Management System now includes a comprehensive real-time notification system that provides instant updates to users about important events such as grades, assignments, attendance, and system announcements.

## Architecture

### Backend Components

1. **NotificationService** (`src/services/notificationService.ts`)
   - Core notification management service
   - Handles notification creation, delivery, and tracking
   - Supports multiple delivery methods (real-time, email, SMS, push)
   - Template-based notifications with variable substitution
   - User preference management

2. **NotificationScheduler** (`src/services/notificationScheduler.ts`)
   - Automated notification scheduling using node-cron
   - Assignment due date reminders
   - System maintenance notifications
   - Expired notification cleanup

3. **NotificationIntegration** (`src/services/notificationIntegration.ts`)
   - Helper functions for common notification scenarios
   - Automatic notifications for grades, assignments, attendance
   - Bulk notification capabilities

4. **WebSocket Integration** (`src/services/websocketService.ts`)
   - Real-time notification delivery via WebSocket
   - User-specific notification channels
   - Connection management and authentication

### Database Schema

The notification system uses the following PostgreSQL tables:

- `notifications` - Core notification records
- `notification_templates` - Reusable notification templates
- `user_notifications` - User-specific notification tracking
- `notification_preferences` - User notification preferences

### API Endpoints

- `POST /api/v1/notifications` - Create and send notifications
- `POST /api/v1/notifications/templated` - Send templated notifications
- `GET /api/v1/notifications/my-notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `GET /api/v1/notifications/preferences` - Get user preferences
- `PUT /api/v1/notifications/preferences` - Update user preferences
- `POST /api/v1/notifications/templates` - Create templates (admin only)
- `GET /api/v1/notifications/templates` - Get templates (admin only)
- `GET /api/v1/notifications/:id/stats` - Get notification statistics (admin only)

## Frontend Components

### NotificationCenter Component

The `NotificationCenter` component provides a complete notification management interface:

- Real-time notification display
- Unread notification counter
- Notification filtering and pagination
- User preference management
- Browser notification support

### Features

- **Real-time Updates**: Instant notifications via WebSocket
- **Notification Types**: Support for notices, grades, attendance, assignments, system messages, reminders, and announcements
- **Priority Levels**: Low, normal, high, and urgent priority notifications
- **User Preferences**: Customizable notification types, delivery methods, and frequency
- **Quiet Hours**: Support for user-defined quiet hours
- **Templates**: Reusable notification templates with variable substitution
- **Scheduling**: Support for scheduled notifications and automated reminders
- **Statistics**: Delivery and engagement tracking for administrators

## Usage Examples

### Creating a Simple Notification

```typescript
import notificationService from './services/notificationService';

await notificationService.createNotification({
  type: 'notice',
  title: 'New Assignment Posted',
  message: 'A new assignment has been posted for Computer Networks',
  userId: 'student-id',
  priority: 'normal',
  deliveryMethods: ['realtime', 'email']
});
```

### Using Templates

```typescript
await notificationService.sendTemplatedNotification(
  'template_grade_update',
  {
    assignmentTitle: 'Midterm Exam',
    grade: '85',
    maxGrade: '100',
    feedback: 'Good work!'
  },
  ['student-id']
);
```

### Bulk Notifications

```typescript
import notificationIntegration from './services/notificationIntegration';

await notificationIntegration.sendBulkNotification(
  'announcement',
  'System Maintenance',
  'The system will be under maintenance tonight from 2 AM to 4 AM',
  {
    admins: true,
    students: ['student-1', 'student-2'],
    professors: ['prof-1']
  },
  {
    priority: 'high',
    scheduledFor: new Date('2024-01-15T02:00:00Z')
  }
);
```

## Configuration

### Environment Variables

```env
# WebSocket Configuration
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Notification Settings
NOTIFICATION_CLEANUP_INTERVAL=daily
NOTIFICATION_RETENTION_DAYS=30
```

### Default Templates

The system includes pre-configured templates for common scenarios:

- Grade updates
- Assignment creation and submission
- Attendance marking
- Notice posting
- System maintenance
- Assignment due reminders

## Testing

Comprehensive tests are included in `src/__tests__/notification-system.test.ts`:

- Unit tests for all notification services
- API endpoint testing
- Real-time notification delivery testing
- Error handling and edge cases
- Performance and scalability testing

## Security Features

- Row Level Security (RLS) policies for data access
- User authentication required for all endpoints
- Admin-only access for templates and statistics
- Input validation and sanitization
- Rate limiting for notification creation

## Performance Considerations

- Efficient database queries with proper indexing
- Connection pooling for database operations
- WebSocket connection management
- Notification batching for bulk operations
- Automatic cleanup of expired notifications

## Future Enhancements

- Email notification delivery integration
- SMS notification support
- Push notification for mobile apps
- Advanced notification analytics
- Machine learning for notification optimization
- Integration with external notification services

## Monitoring and Logging

The notification system includes comprehensive logging for:

- Notification creation and delivery
- WebSocket connection events
- Scheduler task execution
- Error tracking and debugging
- Performance metrics

All logs are structured using Winston logger with appropriate log levels and metadata.