import cron from 'node-cron';
import { supabase } from '../utils/supabase.js';
import { notificationService } from './notificationService';
import logger from '../utils/logger.js';

/**
 * Notification Scheduler Service
 * Handles scheduled notifications, reminders, and cleanup tasks
 */
class NotificationScheduler {
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  /**
   * Initialize the notification scheduler
   */
  public async initialize(): Promise<void> {
    try {
      // Only initialize if we have a working database connection
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        logger.warn('Database not available for notification scheduler, running in limited mode');
        this.isInitialized = true;
        return;
      }

      // Schedule recurring tasks
      this.scheduleRecurringTasks();
      
      // Load and schedule existing notifications
      await this.loadScheduledNotifications();
      
      this.isInitialized = true;
      logger.info('Notification scheduler initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize notification scheduler, running in limited mode:', error);
      this.isInitialized = true; // Don't fail startup
    }
  }

  /**
   * Schedule recurring system tasks
   */
  private scheduleRecurringTasks(): void {
    // Check for scheduled notifications every minute
    const scheduledNotificationsTask = cron.schedule('* * * * *', async () => {
      await this.processScheduledNotifications();
    }, {
      scheduled: false
    });
    
    // Assignment due date reminders (every hour)
    const assignmentRemindersTask = cron.schedule('0 * * * *', async () => {
      await this.sendAssignmentReminders();
    }, {
      scheduled: false
    });
    
    // Clean up expired notifications (daily at 2 AM)
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      await this.cleanupExpiredNotifications();
    }, {
      scheduled: false
    });

    // Start all recurring tasks
    scheduledNotificationsTask.start();
    assignmentRemindersTask.start();
    cleanupTask.start();

    this.scheduledTasks.set('scheduled-notifications', scheduledNotificationsTask);
    this.scheduledTasks.set('assignment-reminders', assignmentRemindersTask);
    this.scheduledTasks.set('cleanup', cleanupTask);

    logger.info('Recurring notification tasks scheduled');
  }

  /**
   * Load and schedule existing notifications from database
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .not('scheduled_for', 'is', null)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        logger.error('Error loading scheduled notifications:', error);
        return;
      }

      if (notifications) {
        for (const notification of notifications) {
          await this.scheduleNotification(notification);
        }
        logger.info(`Loaded ${notifications.length} scheduled notifications`);
      }
    } catch (error) {
      logger.error('Error loading scheduled notifications:', error);
    }
  }

  /**
   * Schedule a specific notification
   */
  public async scheduleNotification(notification: any): Promise<void> {
    try {
      const scheduledTime = new Date(notification.scheduled_for);
      const now = new Date();

      if (scheduledTime <= now) {
        // Send immediately if scheduled time has passed
        await this.sendScheduledNotification(notification);
        return;
      }

      // Calculate delay in milliseconds
      const delay = scheduledTime.getTime() - now.getTime();

      // Use setTimeout for notifications within the next 24 hours
      if (delay <= 24 * 60 * 60 * 1000) {
        const timeoutId = setTimeout(async () => {
          await this.sendScheduledNotification(notification);
          this.scheduledTasks.delete(`notification_${notification.id}`);
        }, delay);

        // Store timeout reference (wrapped in an object to match cron.ScheduledTask interface)
        this.scheduledTasks.set(`notification_${notification.id}`, {
          start: () => {},
          stop: () => clearTimeout(timeoutId),
          destroy: () => clearTimeout(timeoutId),
          getStatus: () => 'scheduled'
        } as any);

        logger.debug(`Notification ${notification.id} scheduled for ${scheduledTime}`);
      }
    } catch (error) {
      logger.error('Error scheduling notification:', error);
    }
  }

  /**
   * Process scheduled notifications that are due
   */
  private async processScheduledNotifications(): Promise<void> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .not('scheduled_for', 'is', null)
        .lte('scheduled_for', new Date().toISOString())
        .is('sent_at', null); // Only unsent notifications

      if (error) {
        logger.error('Error fetching scheduled notifications:', error);
        return;
      }

      if (notifications && notifications.length > 0) {
        for (const notification of notifications) {
          await this.sendScheduledNotification(notification);
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Send a scheduled notification
   */
  private async sendScheduledNotification(notification: any): Promise<void> {
    try {
      // Determine recipients based on target audience or existing user_notifications
      let recipients: string[] = [];

      // Check if user_notifications already exist for this notification
      const { data: existingRecipients } = await supabase
        .from('user_notifications')
        .select('user_id')
        .eq('notification_id', notification.id);

      if (existingRecipients && existingRecipients.length > 0) {
        recipients = existingRecipients.map(r => r.user_id);
      } else {
        // Resolve target audience if no existing recipients
        if (notification.metadata?.targetAudience) {
          recipients = await this.resolveTargetAudience(notification.metadata.targetAudience);
        }
      }

      if (recipients.length > 0) {
        // Send notification to recipients
        await this.sendToRecipients(notification, recipients);
      }

      // Mark notification as sent
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notification.id);

      logger.info(`Scheduled notification sent: ${notification.id} to ${recipients.length} recipients`);
    } catch (error) {
      logger.error('Error sending scheduled notification:', error);
    }
  }

  /**
   * Send assignment due date reminders
   */
  private async sendAssignmentReminders(): Promise<void> {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Get assignments due in 24 hours and 7 days
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(
            name,
            course_enrollments(
              student:students(
                user:users(id, name, email)
              )
            )
          )
        `)
        .gte('due_date', tomorrow.toISOString())
        .lte('due_date', nextWeek.toISOString());

      if (error) {
        logger.error('Error fetching assignments for reminders:', error);
        return;
      }

      if (assignments) {
        for (const assignment of assignments) {
          const dueDate = new Date(assignment.due_date);
          const timeUntilDue = dueDate.getTime() - now.getTime();
          const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));

          let timeRemaining: string;
          if (hoursUntilDue <= 24) {
            timeRemaining = `in ${hoursUntilDue} hours`;
          } else {
            const daysUntilDue = Math.floor(hoursUntilDue / 24);
            timeRemaining = `in ${daysUntilDue} days`;
          }

          // Get enrolled students
          const students = assignment.course?.course_enrollments
            ?.map((enrollment: any) => enrollment.student?.user)
            .filter((user: any) => user) || [];

          if (students.length > 0) {
            const recipients = students.map((student: any) => student.id);

            // Send reminder using template
            await notificationService.sendTemplatedNotification(
              'template_reminder_assignment_due',
              {
                assignmentTitle: assignment.title,
                timeRemaining,
                courseName: assignment.course?.name || 'Unknown Course'
              },
              recipients
            );
          }
        }

        logger.info(`Sent assignment reminders for ${assignments.length} assignments`);
      }
    } catch (error) {
      logger.error('Error sending assignment reminders:', error);
    }
  }

  /**
   * Clean up expired notifications
   */
  private async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_notifications');

      if (error) {
        logger.error('Error cleaning up expired notifications:', error);
        return;
      }

      logger.info(`Cleaned up ${data} expired notifications`);
    } catch (error) {
      logger.error('Error in cleanup process:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public cancelScheduledNotification(notificationId: string): void {
    const taskKey = `notification_${notificationId}`;
    const task = this.scheduledTasks.get(taskKey);
    
    if (task) {
      task.stop();
      this.scheduledTasks.delete(taskKey);
      logger.debug(`Cancelled scheduled notification: ${notificationId}`);
    }
  }

  /**
   * Resolve target audience to user IDs (helper method)
   */
  private async resolveTargetAudience(targetAudience: string[]): Promise<string[]> {
    // This is a simplified version - the full implementation is in notificationService
    try {
      const userIds = new Set<string>();

      for (const audience of targetAudience) {
        if (audience === 'all') {
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('is_active', true);
          
          users?.forEach(user => userIds.add(user.id));
        } else if (audience.startsWith('role:')) {
          const role = audience.replace('role:', '');
          const { data: users } = await supabase
            .from('users')
            .select('id')
            .eq('role', role)
            .eq('is_active', true);
          
          users?.forEach(user => userIds.add(user.id));
        }
      }

      return Array.from(userIds);
    } catch (error) {
      logger.error('Error resolving target audience:', error);
      return [];
    }
  }

  /**
   * Send notification to recipients (helper method)
   */
  private async sendToRecipients(notification: any, recipients: string[]): Promise<void> {
    try {
      // Create user_notifications records if they don't exist
      const userNotifications = recipients.map(userId => ({
        notification_id: notification.id,
        user_id: userId,
        is_read: false,
        is_delivered: false,
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('user_notifications')
        .upsert(userNotifications, { onConflict: 'notification_id,user_id' });

      // Send real-time notifications
      for (const userId of recipients) {
        try {
          const { websocketService } = await import('./websocketService.js');
          await websocketService.sendNotificationToUser(userId, {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            userId,
            metadata: {
              ...notification.metadata,
              priority: notification.priority,
              actionUrl: notification.action_url,
              actionText: notification.action_text
            },
            createdAt: new Date(notification.created_at)
          });
        } catch (wsError) {
          logger.warn(`Failed to send real-time notification to user ${userId}:`, wsError);
        }
      }
    } catch (error) {
      logger.error('Error sending to recipients:', error);
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    isInitialized: boolean;
    scheduledTasks: number;
    recurringTasks: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      scheduledTasks: this.scheduledTasks.size,
      recurringTasks: Array.from(this.scheduledTasks.keys()).filter(key => 
        !key.startsWith('notification_')
      )
    };
  }

  /**
   * Shutdown the scheduler
   */
  public shutdown(): void {
    try {
      this.scheduledTasks.forEach((task, key) => {
        task.stop();
      });
      this.scheduledTasks.clear();
      this.isInitialized = false;
      logger.info('Notification scheduler shut down');
    } catch (error) {
      logger.error('Error shutting down notification scheduler:', error);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;