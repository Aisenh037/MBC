import Teacher from '../models/professor.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

// Get all teachers (with pagination)
export const getTeachers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const teachers = await Teacher.find()
    .populate('user')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  res.json(teachers);
};

// Create a teacher (admin only)
export const addTeacher = async (req, res) => {
  const { name, email, password, employeeId, department } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role: "teacher" });
  const teacher = await Teacher.create({ user: user._id, employeeId, department });
  res.status(201).json({ message: "Teacher created", teacher });
};

// Update teacher details
export const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, employeeId, department } = req.body;
  const teacher = await Teacher.findById(id).populate('user');
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  if (name) teacher.user.name = name;
  if (email) teacher.user.email = email;
  if (employeeId) teacher.employeeId = employeeId;
  if (department) teacher.department = department;
  await teacher.user.save();
  await teacher.save();
  res.json({ message: "Teacher updated", teacher });
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  const teacher = await Teacher.findById(id);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });
  await User.findByIdAndDelete(teacher.user);
  await teacher.remove();
  res.json({ message: "Teacher deleted" });
};
