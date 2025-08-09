import Student from '../models/student.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export const getStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const students = await Student.find()
    .populate('user')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  res.json(students);
};

export const addStudent = async (req, res) => {
  const { name, email, password, scholarNo } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role: "student" });
  const student = await Student.create({ user: user._id, scholarNo });
  res.status(201).json({ message: "Student created", student });
};
