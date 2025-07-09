import Professor from '../models/professor.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

export const getProfessors = async (req, res) => {
  const list = await Professor.find({}, '-password');
  res.json(list);
};

export const addProfessor = async (req, res) => {
  const { name, email, department } = req.body;
  const tempPassword = crypto.randomBytes(5).toString('hex');
  
  const prof = await Professor.create({
    name, email, department,
    password: tempPassword,
  });

  await sendWelcomeEmail(email, tempPassword);
  res.status(201).json({ message: 'Professor created & email sent.' });
};
