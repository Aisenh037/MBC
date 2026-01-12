/**
 * Supabase Integration Utilities
 * Handles Supabase client setup, authentication, and RLS policies
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.development
config({ path: path.resolve(__dirname, '../../.env.development') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase clients
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Supabase Authentication Helper
 */
export class SupabaseAuth {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    const signUpOptions = metadata ? { data: metadata } : {};
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: signUpOptions
    });

    if (error) {
      throw new Error(`Supabase signup failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Supabase signin failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      throw new Error(`Supabase signout failed: ${error.message}`);
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    
    if (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }

    return user;
  }

  /**
   * Refresh the current session
   */
  async refreshSession() {
    const { data, error } = await this.client.auth.refreshSession();
    
    if (error) {
      throw new Error(`Failed to refresh session: ${error.message}`);
    }

    return data;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    });

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(password: string) {
    const { error } = await this.client.auth.updateUser({
      password
    });

    if (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: Record<string, any>) {
    const { error } = await this.client.auth.updateUser({
      data: metadata
    });

    if (error) {
      throw new Error(`User metadata update failed: ${error.message}`);
    }
  }
}

/**
 * Row Level Security (RLS) Policy Manager
 */
export class RLSPolicyManager {
  private adminClient: SupabaseClient;

  constructor() {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available. Please set SUPABASE_SERVICE_ROLE_KEY.');
    }
    this.adminClient = supabaseAdmin;
  }

  /**
   * Enable RLS on a table
   */
  async enableRLS(tableName: string): Promise<void> {
    const { error } = await this.adminClient.rpc('enable_rls', {
      table_name: tableName
    });

    if (error) {
      throw new Error(`Failed to enable RLS on ${tableName}: ${error.message}`);
    }
  }

  /**
   * Create RLS policies for the MBC system
   */
  async createMBCPolicies(): Promise<void> {
    const policies = [
      // Institution policies
      {
        table: 'institutions',
        name: 'institutions_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            auth.jwt() ->> 'institution_id' = id::text
          )
        `
      },
      {
        table: 'institutions',
        name: 'institutions_insert_policy',
        operation: 'INSERT',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },
      {
        table: 'institutions',
        name: 'institutions_update_policy',
        operation: 'UPDATE',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },
      {
        table: 'institutions',
        name: 'institutions_delete_policy',
        operation: 'DELETE',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },

      // Branch policies
      {
        table: 'branches',
        name: 'branches_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            auth.jwt() ->> 'institution_id' = institution_id::text OR
            auth.jwt() ->> 'branch_id' = id::text
          )
        `
      },
      {
        table: 'branches',
        name: 'branches_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'institution_id' = institution_id::text)
        `
      },
      {
        table: 'branches',
        name: 'branches_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'institution_id' = institution_id::text)
        `
      },
      {
        table: 'branches',
        name: 'branches_delete_policy',
        operation: 'DELETE',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },

      // User policies
      {
        table: 'users',
        name: 'users_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            auth.jwt() ->> 'institution_id' = institution_id::text OR
            auth.uid()::text = id::text
          )
        `
      },
      {
        table: 'users',
        name: 'users_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'institution_id' = institution_id::text)
        `
      },
      {
        table: 'users',
        name: 'users_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          auth.uid()::text = id::text OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'institution_id' = institution_id::text)
        `
      },
      {
        table: 'users',
        name: 'users_delete_policy',
        operation: 'DELETE',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },

      // Course policies
      {
        table: 'courses',
        name: 'courses_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            auth.jwt() ->> 'branch_id' = branch_id::text OR
            EXISTS (
              SELECT 1 FROM enrollments e 
              WHERE e.course_id = id AND e.student_id::text = auth.uid()::text
            )
          )
        `
      },
      {
        table: 'courses',
        name: 'courses_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'branch_id' = branch_id::text)
        `
      },
      {
        table: 'courses',
        name: 'courses_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND auth.jwt() ->> 'branch_id' = branch_id::text)
        `
      },
      {
        table: 'courses',
        name: 'courses_delete_policy',
        operation: 'DELETE',
        policy: `auth.jwt() ->> 'role' = 'admin'`
      },

      // Assignment policies
      {
        table: 'assignments',
        name: 'assignments_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            professor_id::text = auth.uid()::text OR
            EXISTS (
              SELECT 1 FROM enrollments e 
              WHERE e.course_id = course_id AND e.student_id::text = auth.uid()::text
            )
          )
        `
      },
      {
        table: 'assignments',
        name: 'assignments_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND professor_id::text = auth.uid()::text)
        `
      },
      {
        table: 'assignments',
        name: 'assignments_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND professor_id::text = auth.uid()::text)
        `
      },
      {
        table: 'assignments',
        name: 'assignments_delete_policy',
        operation: 'DELETE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND professor_id::text = auth.uid()::text)
        `
      },

      // Submission policies
      {
        table: 'submissions',
        name: 'submissions_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            student_id::text = auth.uid()::text OR
            EXISTS (
              SELECT 1 FROM assignments a 
              WHERE a.id = assignment_id AND a.professor_id::text = auth.uid()::text
            )
          )
        `
      },
      {
        table: 'submissions',
        name: 'submissions_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'student' AND student_id::text = auth.uid()::text
        `
      },
      {
        table: 'submissions',
        name: 'submissions_update_policy',
        operation: 'UPDATE',
        policy: `
          (auth.jwt() ->> 'role' = 'student' AND student_id::text = auth.uid()::text) OR
          (auth.jwt() ->> 'role' = 'professor' AND EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = assignment_id AND a.professor_id::text = auth.uid()::text
          )) OR
          auth.jwt() ->> 'role' = 'admin'
        `
      },
      {
        table: 'submissions',
        name: 'submissions_delete_policy',
        operation: 'DELETE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'student' AND student_id::text = auth.uid()::text)
        `
      },

      // Attendance policies
      {
        table: 'attendance',
        name: 'attendance_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            student_id::text = auth.uid()::text OR
            marked_by::text = auth.uid()::text
          )
        `
      },
      {
        table: 'attendance',
        name: 'attendance_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND marked_by::text = auth.uid()::text)
        `
      },
      {
        table: 'attendance',
        name: 'attendance_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND marked_by::text = auth.uid()::text)
        `
      },
      {
        table: 'attendance',
        name: 'attendance_delete_policy',
        operation: 'DELETE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND marked_by::text = auth.uid()::text)
        `
      },

      // Notice policies
      {
        table: 'notices',
        name: 'notices_select_policy',
        operation: 'SELECT',
        policy: `
          auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            'all' = ANY(target_audience) OR
            auth.jwt() ->> 'role' = ANY(target_audience) OR
            ('branch:' || auth.jwt() ->> 'branch_id') = ANY(target_audience)
          )
        `
      },
      {
        table: 'notices',
        name: 'notices_insert_policy',
        operation: 'INSERT',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          auth.jwt() ->> 'role' = 'professor'
        `
      },
      {
        table: 'notices',
        name: 'notices_update_policy',
        operation: 'UPDATE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND author_id::text = auth.uid()::text)
        `
      },
      {
        table: 'notices',
        name: 'notices_delete_policy',
        operation: 'DELETE',
        policy: `
          auth.jwt() ->> 'role' = 'admin' OR
          (auth.jwt() ->> 'role' = 'professor' AND author_id::text = auth.uid()::text)
        `
      }
    ];

    // Create each policy
    for (const policy of policies) {
      try {
        await this.createPolicy(policy.table, policy.name, policy.operation, policy.policy);
        console.log(`✅ Created RLS policy: ${policy.name} on ${policy.table}`);
      } catch (error) {
        console.error(`❌ Failed to create RLS policy: ${policy.name} on ${policy.table}`, error);
        throw error;
      }
    }
  }

  /**
   * Create a single RLS policy
   */
  private async createPolicy(
    tableName: string, 
    policyName: string, 
    operation: string, 
    policy: string
  ): Promise<void> {
    const { error } = await this.adminClient.rpc('create_policy', {
      table_name: tableName,
      policy_name: policyName,
      operation: operation,
      policy_definition: policy
    });

    if (error) {
      throw new Error(`Failed to create policy ${policyName}: ${error.message}`);
    }
  }

  /**
   * Drop all MBC RLS policies (for cleanup/reset)
   */
  async dropMBCPolicies(): Promise<void> {
    const tables = [
      'institutions', 'branches', 'users', 'courses', 
      'assignments', 'submissions', 'attendance', 'notices'
    ];

    for (const table of tables) {
      try {
        await this.adminClient.rpc('drop_all_policies', {
          table_name: table
        });
        console.log(`✅ Dropped all RLS policies on ${table}`);
      } catch (error) {
        console.error(`❌ Failed to drop RLS policies on ${table}`, error);
      }
    }
  }
}

/**
 * Supabase Storage Helper
 */
export class SupabaseStorage {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    bucket: string, 
    path: string, 
    file: File | Buffer, 
    options?: { contentType?: string; metadata?: Record<string, any> }
  ) {
    const uploadOptions: any = {};
    
    if (options?.contentType) {
      uploadOptions.contentType = options.contentType;
    }
    
    if (options?.metadata) {
      uploadOptions.metadata = options.metadata;
    }

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, uploadOptions);

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Download a file from Supabase Storage
   */
  async downloadFile(bucket: string, path: string) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`File download failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, path?: string) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(path);

    if (error) {
      throw new Error(`File listing failed: ${error.message}`);
    }

    return data;
  }
}

// Export instances
export const supabaseAuth = new SupabaseAuth();
export const rlsPolicyManager = supabaseAdmin ? new RLSPolicyManager() : null;
export const supabaseStorage = new SupabaseStorage();