import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../config/admin.js';

export async function seedAdmin() {
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin'
    });
    console.log('✅ Admin user created');
  }
}
