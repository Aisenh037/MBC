// services/studentService.js
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import Student from '../models/student.js';
import User from '../models/user.js';
import ErrorResponse from '../utils/errorResponse.js';
import { sendEmail } from '../utils/mail.js';
import { createToken } from '../utils/tokenHelpers.js';

// 1. Create student + linked user (transaction)
export const createStudentAndUser = async (studentData) => {
  const { name, email, password, scholarNo, mobile, branch, currentSemester } = studentData;

  if (!name || !email || !password || !scholarNo) {
    throw new ErrorResponse('Name, email, password, and scholar number are required', 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (await User.findOne({ email }).session(session)) {
      throw new ErrorResponse('User with this email already exists', 400);
    }
    if (await Student.findOne({ scholarNo }).session(session)) {
      throw new ErrorResponse('Student with this scholar number already exists', 400);
    }

    const [user] = await User.create([{ name, email, password, role: 'student' }], { session });
    const [student] = await Student.create(
      [{ user: user._id, scholarNo, mobile, branch, currentSemester }],
      { session }
    );

    await session.commitTransaction();

    // Send welcome email (optional, async)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to MBC',
        html: `<p>Dear ${name}, your account has been created successfully.</p>`,
      });
    } catch (emailErr) {
      console.warn(`Welcome email failed for ${email}:`, emailErr.message);
    }

    return student;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 2. Update student + linked user (transaction)
export const updateStudentAndUser = async (studentId, updateData) => {
  const { name, email, ...studentFields } = updateData;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await Student.findById(studentId).session(session);
    if (!student) throw new ErrorResponse('Student not found', 404);

    Object.assign(student, studentFields);
    await student.save({ session });

    if (name || email) {
      const user = await User.findById(student.user).session(session);
      if (!user) throw new ErrorResponse('Associated user not found', 404);
      if (name) user.name = name;
      if (email) user.email = email;
      await user.save({ session });
    }

    await session.commitTransaction();

    return await Student.findById(studentId).populate('user');
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 3. Delete student + linked user
export const deleteStudentAndUser = async (studentId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const student = await Student.findById(studentId).session(session);
    if (!student) throw new ErrorResponse('Student not found', 404);

    await User.findByIdAndDelete(student.user).session(session);
    await student.deleteOne({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// 4. Send password reset email
export const sendPasswordResetLink = async (studentId) => {
  const student = await Student.findById(studentId);
  if (!student) throw new ErrorResponse('Student not found', 404);

  const user = await User.findById(student.user);
  if (!user) throw new ErrorResponse('Associated user not found', 404);

  const { raw: resetToken } = await createToken({ userId: user._id, type: 'reset', ttlMinutes: 30 });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
    });
  } catch (error) {
    console.error(`Failed to send reset email to ${user.email}:`, error);
    throw new ErrorResponse('Failed to send reset email.', 500);
  }
};

// 5. Export all students to CSV
export const exportStudentsToCsv = async () => {
  const students = await Student.find()
    .populate('user', 'name email')
    .populate('branch', 'name');

  if (!students.length) throw new ErrorResponse('No students to export', 404);

  const fields = [
    { label: 'Scholar No', value: 'scholarNo' },
    { label: 'Name', value: 'user.name' },
    { label: 'Email', value: 'user.email' },
    { label: 'Branch', value: 'branch.name' },
    { label: 'Semester', value: 'currentSemester' },
    { label: 'Mobile', value: 'mobile' },
  ];

  const parser = new Parser({ fields });
  return parser.parse(students);
};
