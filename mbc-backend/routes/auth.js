import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

const router = express.Router();

const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@mbc.manit.ac.in',
    password: bcrypt.hashSync('#Admin@123$25', 10),
    role: 'admin',
  },
  {
    id: '2',
    name: 'Teacher User',
    email: 'teacher1@gmail.com',
    password: bcrypt.hashSync('teacher123', 10),
    role: 'teacher',
  }
];

router.post(
  '/login',
  asyncHandler(async (req, res, next) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return next(new ErrorResponse('Please provide email, password and role', 400));
    }

    console.log('Login attempt:', { email, role });

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.role.toLowerCase() === role.toLowerCase()
    );

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    res
      .status(200)
      .cookie('token', token, cookieOptions)
      .json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  })
);

export default router;
