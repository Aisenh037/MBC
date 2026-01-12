import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Institution
  const institution = await prisma.institution.upsert({
    where: { code: 'MBC' },
    update: {},
    create: {
      name: 'MBC Institute of Technology',
      code: 'MBC',
      address: 'Bhopal, MP',
    },
  });
  console.log('✅ Institution created:', institution.name);

  // 2. Create Default Branch (CSE)
  const branch = await prisma.branch.upsert({
    where: {
      institutionId_code: {
        institutionId: institution.id,
        code: 'CSE',
      },
    },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science',
      institutionId: institution.id,
    },
  });
  console.log('✅ Branch created:', branch.name);

  // 3. Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mbc.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      role: UserRole.admin,
      profile: {
        firstName: 'System',
        lastName: 'Admin',
      },
      institutionId: institution.id,
    }
  });

  // WAIT. I need to know where password is stored.
  // Schema in Step 49:
  // model User { ... }
  // No password field.
  // There is NO local password storage in User model.
  // This implies the system relies entirely on Supabase Auth OR there is a separate Auth/Account table.
  // Scanning schema...
  // User, Institution, Branch, Course, Enrollment, Assignment, Submission, Attendance, Notice, SystemConfig, AuditLog, FileUpload.
  // No "Account" or "Auth" table.
  // Conclusion: Auth is offloaded to Supabase OR schema is incomplete OR I am blind.
  // However, "mbc-backend" package.json has "bcryptjs".
  // If I cannot find a password column, I cannot seed a loginable user via Prisma unless I use Supabase Admin API.
  // BUT the user reported 404 on /api/v1/auth/login.
  // This endpoint likely handles login.
  // I should check `src/controllers/auth.controller.ts` (if it exists) to see how it authenticates.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
