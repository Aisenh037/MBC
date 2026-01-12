
import { supabaseAdmin } from '../utils/supabase';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
config({ path: path.resolve(__dirname, '../../.env.development') });

const prisma = new PrismaClient();

async function createAdmin() {
    console.log('🚀 Creating Admin User...');

    // Debug environment variables
    console.log('Environment Debug:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin not initialized. Check keys.');
        process.exit(1);
    }

    console.log('Context Debug:');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Service Key (start):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));
    console.log('Service Key (end):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(process.env.SUPABASE_SERVICE_ROLE_KEY.length - 10));
    const email = 'admin@mbc.edu';
    const password = 'Password@123'; // Strong password

    try {
        // 1. Create in Supabase Auth
        // Check if exists first? getUserById needs ID.
        // We'll try to sign up, if it fails, it might exist.
        // Better: use admin.listUsers or just try createUser.

        let userId: string;

        // List users to find if admin exists
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        const existingUser = users?.find((u: any) => u.email === email);

        if (existingUser) {
            console.log('ℹ️ Auth User already exists:', existingUser.id);
            userId = existingUser.id;
            // Optionally update password
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: password, user_metadata: { role: 'admin' } });
            console.log('✅ Password updated.');
        } else {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { role: 'admin' }
            });

            if (createError || !newUser.user) {
                throw new Error('Failed to create auth user: ' + createError?.message);
            }
            console.log('✅ Auth User created:', newUser.user.id);
            userId = newUser.user.id;
        }

        // 2. Ensure Institution Exists (created by previous seeder, but let's be safe)
        const institution = await prisma.institution.upsert({
            where: { code: 'MBC' },
            update: {},
            create: {
                name: 'MBC Institute of Technology',
                code: 'MBC',
                address: 'Bhopal, MP',
            },
        });

        // 3. Sync to Public Users Table
        // The previous seeder might have created a user without correct ID or auth.
        // We strictly match email.

        const publicUser = await prisma.user.upsert({
            where: { email: email },
            update: {
                id: userId, // Ensure ID matches Auth ID
                role: 'admin'
            },
            create: {
                id: userId,
                email: email,
                role: 'admin',
                profile: {
                    firstName: 'System',
                    lastName: 'Admin'
                },
                institutionId: institution.id,
                isActive: true
            }
        });

        console.log('✅ Public User synced:', publicUser.email);
        console.log('🎉 Admin Setup Complete!');
        console.log(`👉 Email: ${email}`);
        console.log(`👉 Password: ${password}`);

    } catch (err: any) {
        console.error('💥 Error creating admin:', err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
