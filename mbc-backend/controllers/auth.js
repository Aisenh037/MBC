import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const login = async (req, res, next) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
