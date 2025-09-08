// controllers/assignmentController.js
import Assignment from '../models/Assignment.js';
import asyncHandler from 'express-async-handler';
import path from 'path';
import fs from 'fs';
import { sendEmail } from '../utils/mail.js';

// Upload assignment file
export const uploadAssignmentFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  const assignmentId = req.params.id;
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  assignment.file = req.file.filename;
  await assignment.save();
  res.status(200).json({ success: true, data: assignment });
});

// Send reset password email
export const sendResetPasswordEmail = asyncHandler(async (req, res) => {
  const { email, resetToken } = req.body;
  if (!email || !resetToken) {
    res.status(400);
    throw new Error('Email and reset token are required');
  }
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const message = `
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>If you did not request this, please ignore this email.</p>
  `;
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: message,
  });
  res.status(200).json({ success: true, message: 'Reset email sent' });
});
