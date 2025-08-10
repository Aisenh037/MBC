// utils/hashPassword.js
import bcrypt from 'bcryptjs';

const saltRounds = 12; // Increased salt rounds for better security

export const hashPassword = async (password) => await bcrypt.hash(password, saltRounds);

export const checkPassword = async (password, hash) => await bcrypt.compare(password, hash);