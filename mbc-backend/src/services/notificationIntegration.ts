import { notificationService } from './notificationService';
import logger from '../utils/logger.js';

/**
 * Notification Integration Service
 * Provides helper functions to automatically send notifications for common events
 */
class NotificationIntegration {
  
  /**
   * Send notification when assignment is graded
   */
  public async notifyAssignmentGraded(
    assignmentId: string,
    studentId: string,
    grade: number,
    maxGrade: number,
    feedback?: string
  ): Promise<void> {
    try {
      await notificationService.sendTemplatedNotification(
        'template_grade_update',
        {
          assignmentTitle: 'Assignment', // This should be fetched from DB
          grade: grade.toString(),
          maxGrade: maxGrade.toString(),
          feedback: feedback || 'No feedback provided'
        },
        [studentId]
      );
    } catch (error) {
      logger.error('Error sending assignment graded notification:', error);
    }
  }

  /**
   * Send notification when new assignment is created
   */
  public async notifyAssignmentCreated(
    assignmentTitle: string,
    courseName: string,
    dueDate: Date,
    description: string,
    studentIds: string[]
  ): Promise<void> {
    try {
      await notificationService.sendTemplatedNotification(
        'template_assignment_created',
        {
          assignmentTitle,
          courseName,
          dueDate: dueDate.toLocaleDateString(),
          description
        },
        studentIds
      );
    } catch (error) {
      logger.error('Error sending assignment created notification:', error);
    }
  }

  /**
   * Send notification when assignment is submitted
   */
  public async notifyAssignmentSubmitted(
    studentName: string,
    assignmentTitle: string,
    courseName: string,
    professorId: string,
    submissionTime: Date
  ): Promise<void> {
    try {
      await notificationService.sendTemplatedNotification(
        'template_assignment_submitted',
        {
          studentName,
          assignmentTitle,
          courseName,
          submissionTime: submissionTime.toLocaleString()
        },
        [professorId]
      );
    } catch (error) {
      logger.error('Error sending assignment submitted notification:', error);
    }
  }

  /**
   * Send notification when attendance is marked
   */
  public async notifyAttendanceMarked(
    studentId: string,
    status: 'present' | 'absent' | 'late',
    courseName: string,
    date: Date
  ): Promise<void> {
    try {
      await notificationService.sendTemplatedNotification(
        'template_attendance_marked',
        {
          status,
          courseName,
          date: date.toLocaleDateString()
        },
        [studentId]
      );
    } catch (error) {
      logger.error('Error sending attendance marked notification:', error);
    }
  }

  /**
   * Send notification when new notice is posted
   */
  public async notifyNoticePosted(
    noticeTitle: string,
    noticeContent: string,
    priority: 'low' | 'normal' | 'high' | 'urgent',
    targetAudience: string[]
  ): Promise<void> {
    try {
      await notificationService.createNotification({
        userId: 'system', // System-generated notification
        type: 'notice',
        title: noticeTitle,
        message: noticeContent,
        data: {
          priority,
          targetAudience,
          deliveryMethods: ['realtime', 'email']
        }
      });
    } catch (error) {
      logger.error('Error sending notice posted notification:', error);
    }
  }

  /**
   * Send system maintenance notification
   */
  public async notifySystemMaintenance(
    maintenanceDate: Date,
    duration: string,
    description: string
  ): Promise<void> {
    try {
      await notificationService.sendTemplatedNotification(
        'template_system_maintenance',
        {
          maintenanceDate: maintenanceDate.toLocaleString(),
          duration,
          description
        },
        [] // Will be resolved by template's target audience
      );
    } catch (error) {
      logger.error('Error sending system maintenance notification:', error);
    }
  }

  /**
   * Send custom notification
   */
  public async sendCustomNotification(
    type: 'notice' | 'grade' | 'attendance' | 'assignment' | 'system' | 'reminder' | 'announcement',
    title: string,
    message: string,
    recipients: string[],
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      deliveryMethods?: ('realtime' | 'email' | 'sms' | 'push')[];
      actionUrl?: string;
      actionText?: string;
      scheduledFor?: Date;
      expiresAt?: Date;
    }
  ): Promise<string> {
    try {
      await notificationService.createNotification({
        userId: recipients[0] || 'system', // Use first recipient or system
        type,
        title,
        message,
        data: {
          recipients,
          priority: options?.priority || 'normal',
          deliveryMethods: options?.deliveryMethods || ['realtime'],
          actionUrl: options?.actionUrl,
          actionText: options?.actionText,
          scheduledFor: options?.scheduledFor,
          expiresAt: options?.expiresAt
        }
      });
      return 'notification-sent';
    } catch (error) {
      logger.error('Error sending custom notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notification to multiple user groups
   */
  public async sendBulkNotification(
    type: 'notice' | 'grade' | 'attendance' | 'assignment' | 'system' | 'reminder' | 'announcement',
    title: string,
    message: string,
    targetGroups: {
      students?: string[];
      professors?: string[];
      admins?: boolean;
      institutions?: string[];
      branches?: string[];
      courses?: string[];
    },
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      deliveryMethods?: ('realtime' | 'email' | 'sms' | 'push')[];
      scheduledFor?: Date;
    }
  ): Promise<string> {
    try {
      const targetAudience: string[] = [];

      // Build target audience array
      if (targetGroups.students) {
        targetGroups.students.forEach(studentId => {
          targetAudience.push(`user:${studentId}`);
        });
      }

      if (targetGroups.professors) {
        targetGroups.professors.forEach(professorId => {
          targetAudience.push(`user:${professorId}`);
        });
      }

      if (targetGroups.admins) {
        targetAudience.push('role:admin');
      }

      if (targetGroups.institutions) {
        targetGroups.institutions.forEach(institutionId => {
          targetAudience.push(`institution:${institutionId}`);
        });
      }

      if (targetGroups.branches) {
        targetGroups.branches.forEach(branchId => {
          targetAudience.push(`branch:${branchId}`);
        });
      }

      if (targetGroups.courses) {
        targetGroups.courses.forEach(courseId => {
          targetAudience.push(`course:${courseId}`);
        });
      }

      await notificationService.createNotification({
        userId: 'system', // System-generated notification
        type,
        title,
        message,
        data: {
          targetAudience,
          priority: options?.priority || 'normal',
          deliveryMethods: options?.deliveryMethods || ['realtime'],
          scheduledFor: options?.scheduledFor
        }
      });
      return 'bulk-notification-sent';
    } catch (error) {
      logger.error('Error sending bulk notification:', error);
      throw error;
    }
  }
}

export const notificationIntegration = new NotificationIntegration();
export default notificationIntegration;