import bcrypt from 'bcryptjs';
import Student from '../models/Student.js';
import Teacher from '../models/professor.js';

// @desc    Register new student
// @route   POST /api/v1/auth/register/student
// @access  Private/Admin
export const registerStudent = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({ name, email, password: hashedPassword });
    await newStudent.save();

    res.status(201).json({ message: 'Student registered successfully.' });
  } catch (err) {
    res.status(500).json({
      message: 'Error registering student.',
      error: err.message,
    });
  }
};

// @desc    Register new teacher
// @route   POST /api/v1/auth/register/teacher
// @access  Private/Admin
export const registerTeacher = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = new Teacher({ name, email, password: hashedPassword });
    await newTeacher.save();

    res.status(201).json({ message: 'Teacher registered successfully.' });
  } catch (err) {
    res.status(500).json({
      message: 'Error registering teacher.',
      error: err.message,
    });
  }
};
