import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
config({ path: path.resolve(__dirname, '../../.env.development') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🚀 Creating Admin User with Supabase...');

  const email = 'admin@mbc.edu';
  const password = 'Password@123';

  try {
    // 1. Create user in Supabase Auth
    console.log('Creating user in Supabase Auth...');
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users?.find(u => u.email === email);

    let authUserId: string;

    if (existingUser) {
      console.log('ℹ️ User already exists in Auth, updating password...');
      authUserId = existingUser.id;
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUserId, {
        password: password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
    } else {
      console.log('Creating new user in Auth...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      });

      if (createError || !newUser.user) {
        throw new Error(`Failed to create user: ${createError?.message}`);
      }

      authUserId = newUser.user.id;
    }

    console.log('✅ Auth user ready:', authUserId);

    // 2. Create/update user in public.users table
    console.log('Creating/updating user in public.users table...');

    // First, ensure we have an institution
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id')
      .eq('code', 'MBC')
      .single();

    let institutionId: string;

    if (instError || !institution) {
      console.log('Creating MBC institution...');
      const { data: newInst, error: newInstError } = await supabase
        .from('institutions')
        .insert({
          name: 'MBC Institute of Technology',
          code: 'MBC',
          address: 'Bhopal, MP'
        })
        .select('id')
        .single();

      if (newInstError || !newInst) {
        throw new Error(`Failed to create institution: ${newInstError?.message}`);
      }
      institutionId = newInst.id;
    } else {
      institutionId = institution.id;
    }

    // Create/update user record
    const { data: publicUser, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        email: email,
        role: 'admin',
        profile: {
          firstName: 'System',
          lastName: 'Admin'
        },
        institution_id: institutionId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create/update public user: ${userError.message}`);
    }

    console.log('✅ Public user record ready:', publicUser.id);

    console.log('🎉 Admin user created successfully!');
    console.log(`👉 Email: ${email}`);
    console.log(`👉 Password: ${password}`);
    console.log(`👉 Role: admin`);

  } catch (error: any) {
    console.error('💥 Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();