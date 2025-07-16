import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export default async function seedAdmin() {
  const adminEmail = "admin@mbc.com";
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: await bcrypt.hash("Admin@123", 10),
      role: "admin"
    });
    console.log("Admin user created!");
  }
}
