// src/services/notificationService.ts
import { Resend } from 'resend';
import twilio from 'twilio';
import logger from '../utils/logger';
import { config } from '../config/config';

interface EmailNotification {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface SMSNotification {
  to: string;
  message: string;
}

interface WhatsAppNotification {
  to: string;
  message: string;
  mediaUrl?: string;
}

class NotificationService {
  private resend: Resend | null = null;
  private twilioClient: twilio.Twilio | null = null;

  constructor() {
    this.initializeServices();
  }

  // Initialize services
  async initialize(): Promise<void> {
    logger.info('NotificationService initialized');
  }

  // Create notification method for compatibility
  async createNotification(notification: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    data?: any;
  }): Promise<boolean> {
    // This is a placeholder - in a real implementation, you might store notifications in database
    logger.info(`Creating notification for user ${notification.userId}: ${notification.title}`);
    return true;
  }

  // Template-based notification method for compatibility
  async sendTemplatedNotification(
    template: string,
    data: any,
    recipients: string[]
  ): Promise<boolean> {
    if (!recipients || recipients.length === 0) {
      logger.warn(`No recipients provided for template: ${template}`);
      return false;
    }

    // Route to appropriate method based on template
    switch (template) {
      case 'assignment_created':
        return this.sendAssignmentNotification(
          recipients[0],
          data.userName,
          data.assignmentTitle,
          data.dueDate,
          data.courseTitle
        );
      case 'grade_posted':
        return this.sendGradeNotification(
          recipients[0],
          data.userName,
          data.assignmentTitle,
          data.grade,
          data.courseTitle
        );
      default:
        logger.warn(`Unknown template: ${template}`);
        return false;
    }
  }

  private initializeServices() {
    // Initialize Resend for email
    if (config.resend?.apiKey) {
      this.resend = new Resend(config.resend.apiKey);
      logger.info('Resend email service initialized');
    } else {
      logger.warn('Resend API key not found. Email notifications disabled.');
    }

    // Initialize Twilio for SMS and WhatsApp
    if (config.twilio?.accountSid && config.twilio?.authToken) {
      this.twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
      logger.info('Twilio SMS/WhatsApp service initialized');
    } else {
      logger.warn('Twilio credentials not found. SMS/WhatsApp notifications disabled.');
    }
  }

  async sendEmail(notification: EmailNotification): Promise<boolean> {
    if (!this.resend) {
      logger.error('Email service not initialized');
      return false;
    }

    try {
      const result = await this.resend.emails.send({
        from: notification.from || config.resend?.fromEmail || 'noreply@example.com',
        to: Array.isArray(notification.to) ? notification.to : [notification.to],
        subject: notification.subject,
        html: notification.html,
      });

      logger.info(`Email sent successfully: ${result.data?.id}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendSMS(notification: SMSNotification): Promise<boolean> {
    if (!this.twilioClient) {
      logger.error('SMS service not initialized');
      return false;
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: notification.message,
        from: config.twilio?.phoneNumber || '+1234567890',
        to: notification.to,
      });

      logger.info(`SMS sent successfully: ${message.sid}`);
      return true;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  async sendWhatsApp(notification: WhatsAppNotification): Promise<boolean> {
    if (!this.twilioClient) {
      logger.error('WhatsApp service not initialized');
      return false;
    }

    try {
      const messageData: any = {
        body: notification.message,
        from: `whatsapp:${config.twilio?.whatsappNumber || '+1234567890'}`,
        to: `whatsapp:${notification.to}`,
      };

      if (notification.mediaUrl) {
        messageData.mediaUrl = [notification.mediaUrl];
      }

      const message = await this.twilioClient.messages.create(messageData);

      logger.info(`WhatsApp message sent successfully: ${message.sid}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
      return false;
    }
  }

  // Bulk notification methods
  async sendBulkEmail(notifications: EmailNotification[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.sendEmail(notification);
      if (result) success++;
      else failed++;
    }

    return { success, failed };
  }

  async sendBulkSMS(notifications: SMSNotification[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.sendSMS(notification);
      if (result) success++;
      else failed++;
    }

    return { success, failed };
  }

  // Template-based notifications
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to MBC Department Management System</h2>
        <p>Dear ${userName},</p>
        <p>Welcome to the MBC Department Management System! Your account has been successfully created.</p>
        <p>You can now access the system and explore all the features available to you.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Getting Started:</strong></p>
          <ul>
            <li>Log in to your account</li>
            <li>Complete your profile</li>
            <li>Explore the dashboard</li>
          </ul>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>MBC Department Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to MBC Department Management System',
      html,
    });
  }

  async sendAssignmentNotification(
    userEmail: string,
    userName: string,
    assignmentTitle: string,
    dueDate: string,
    courseTitle: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Assignment: ${assignmentTitle}</h2>
        <p>Dear ${userName},</p>
        <p>A new assignment has been posted for your course <strong>${courseTitle}</strong>.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Assignment Details:</strong></p>
          <ul>
            <li><strong>Title:</strong> ${assignmentTitle}</li>
            <li><strong>Course:</strong> ${courseTitle}</li>
            <li><strong>Due Date:</strong> ${dueDate}</li>
          </ul>
        </div>
        <p>Please log in to the system to view the complete assignment details and submit your work.</p>
        <p>Best regards,<br>MBC Department Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `New Assignment: ${assignmentTitle}`,
      html,
    });
  }

  async sendGradeNotification(
    userEmail: string,
    userName: string,
    assignmentTitle: string,
    grade: string,
    courseTitle: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Assignment Graded: ${assignmentTitle}</h2>
        <p>Dear ${userName},</p>
        <p>Your assignment for <strong>${courseTitle}</strong> has been graded.</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p><strong>Grade Details:</strong></p>
          <ul>
            <li><strong>Assignment:</strong> ${assignmentTitle}</li>
            <li><strong>Course:</strong> ${courseTitle}</li>
            <li><strong>Grade:</strong> ${grade}</li>
          </ul>
        </div>
        <p>Please log in to the system to view detailed feedback and comments.</p>
        <p>Best regards,<br>MBC Department Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Grade Posted: ${assignmentTitle}`,
      html,
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Password Reset Request</h2>
        <p>You have requested to reset your password for the MBC Department Management System.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>MBC Department Team</p>
      </div>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Password Reset Request - MBC Department',
      html,
    });
  }
}

export const notificationService = new NotificationService();
export type { EmailNotification, SMSNotification, WhatsAppNotification };