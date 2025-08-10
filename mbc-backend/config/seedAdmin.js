// seedAdmin.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';

export default async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Checking already exists
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      console.log("Admin user created!".green);
    } else {
      console.log("Admin user already exists.".blue);
    }
  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`.red);
  }
}