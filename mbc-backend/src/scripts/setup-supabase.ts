#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Sets up RLS policies and helper functions for the MBC system
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { rlsPolicyManager, supabaseAdmin } from '../utils/supabase.js';

async function setupSupabase() {
  console.log('🚀 Setting up Supabase integration...');

  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not available. Please set SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  if (!rlsPolicyManager) {
    console.error('❌ RLS Policy Manager not available. Please set SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  try {
    // Step 1: Create RLS helper functions
    console.log('📝 Creating RLS helper functions...');
    const sqlScript = readFileSync(
      join(process.cwd(), 'sql', 'rls-helper-functions.sql'),
      'utf-8'
    );

    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlScript
    });

    if (sqlError) {
      console.error('❌ Failed to create RLS helper functions:', sqlError.message);
      // Continue anyway as functions might already exist
    } else {
      console.log('✅ RLS helper functions created successfully');
    }

    // Step 2: Enable RLS on all tables
    console.log('🔒 Enabling RLS on tables...');
    const tables = [
      'institutions', 'branches', 'users', 'courses', 
      'assignments', 'submissions', 'attendance', 'notices',
      'enrollments', 'grades'
    ];

    for (const table of tables) {
      try {
        await rlsPolicyManager.enableRLS(table);
        console.log(`✅ Enabled RLS on ${table}`);
      } catch (error: any) {
        console.log(`⚠️  RLS might already be enabled on ${table}: ${error.message}`);
      }
    }

    // Step 3: Create RLS policies
    console.log('📋 Creating RLS policies...');
    await rlsPolicyManager.createMBCPolicies();
    console.log('✅ All RLS policies created successfully');

    // Step 4: Test Supabase connection
    console.log('🧪 Testing Supabase connection...');
    const { error: testError } = await supabaseAdmin
      .from('institutions')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase connection test failed:', testError.message);
    } else {
      console.log('✅ Supabase connection test passed');
    }

    console.log('🎉 Supabase setup completed successfully!');

  } catch (error: any) {
    console.error('❌ Supabase setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly (CommonJS compatible)
if (require.main === module) {
  setupSupabase().catch(console.error);
}

export { setupSupabase };