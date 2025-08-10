// services/authService.js
import User from '../models/user.js';
import Student from '../models/student.js';
import Teacher from '../models/professor.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Registers a new user, creates their profile (Student/Teacher), and returns a token.
 * @param {object} userData - The user's registration data (name, email, password, role, etc.).
 * @returns {string} JWT token.
 */
export const registerUser = async (userData) => {
  const { name, email, password, role, scholarNo, employeeId, department } = userData;

  // Check if user already exists
  if (await User.findOne({ email })) {
    throw new ErrorResponse('A user with this email already exists', 400);
  }

  // Create user
  const user = await User.create({ name, email, password, role });

  // Create role-specific profile (Student or Teacher)
  try {
    if (role === 'student' && scholarNo) {
      await Student.create({ user: user._id, scholarNo });
    } else if (role === 'teacher' && employeeId) {
      await Teacher.create({ user: user._id, employeeId, department });
    }
  } catch (err) {
    // If profile creation fails, remove the created user to prevent orphaned users
    await user.remove();
    throw new ErrorResponse(`Could not create ${role} profile. ${err.message}`, 400);
  }

  // Create and return token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  return token;
};

/**
 * Logs in a user by verifying their credentials.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {object} { token, user }
 */
export const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new ErrorResponse('Please provide an email and password', 400);
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  // Remove password from the returned user object
  user.password = undefined;

  return { token, user };
};