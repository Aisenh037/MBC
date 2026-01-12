/**
 * Student Controller
 * TypeScript implementation with proper interfaces and validation
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { 
  CreateStudentRequest, 
  UpdateStudentRequest, 
  StudentResponse,
  BulkImportResponse,
  ApiResponse 
} from '@/types/api';
import { AuthenticatedUser } from '@/types/auth';
import config from '@/config/config';
import logger from '@/utils/logger';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Validation schemas
const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  branchId: z.string().uuid('Valid branch ID is required'),
  institutionId: z.string().uuid('Valid institution ID is required'),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().min(1, 'Academic year is required'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional()
});

const updateStudentSchema = createStudentSchema.partial();

const bulkImportSchema = z.object({
  students: z.array(createStudentSchema)
});

/**
 * Get all students
 * @route GET /api/v1/students
 * @access Private (Admin, Professor)
 */
export const getStudents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, branchId, semester } = req.query;
    
    // Build query
    let query = supabase
      .from('students')
      .select(`
        *,
        user:users(id, name, email, is_active),
        branch:branches(id, name),
        institution:institutions(id, name)
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`);
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    // Apply tenant isolation (non-admin users can only see their institution's students)
    if (req.user?.role !== 'admin' && req.user?.institutionId) {
      query = query.eq('institution_id', req.user.institutionId);
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: students, error, count } = await query;

    if (error) {
      logger.error('Error fetching students:', error);
      throw new ErrorResponse('Failed to fetch students', 500);
    }

    const response: ApiResponse<StudentResponse[]> = {
      success: true,
      count: count || 0,
      data: students || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get students error:', error);
    next(error);
  }
};

/**
 * Get single student
 * @route GET /api/v1/students/:id
 * @access Private (Admin, Professor, Student - own record)
 */
export const getStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        user:users(id, name, email, is_active),
        branch:branches(id, name),
        institution:institutions(id, name),
        courses:course_enrollments(
          course:courses(id, name, code)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !student) {
      throw new ErrorResponse('Student not found', 404);
    }

    // Check authorization - students can only view their own record
    if (req.user?.role === 'student' && student.user_id !== req.user.id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== student.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    const response: ApiResponse<StudentResponse> = {
      success: true,
      data: student
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get student error:', error);
    next(error);
  }
};

/**
 * Create new student
 * @route POST /api/v1/students
 * @access Private (Admin, Professor)
 */
export const createStudent = [
  validateRequestZod(createStudentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const studentData = req.body as CreateStudentRequest;

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', studentData.email)
        .single();

      if (existingUser) {
        throw new ErrorResponse('Email already exists', 400);
      }

      // Check if roll number already exists in the same branch
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('roll_number', studentData.rollNumber)
        .eq('branch_id', studentData.branchId)
        .single();

      if (existingStudent) {
        throw new ErrorResponse('Roll number already exists in this branch', 400);
      }

      // Create user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: studentData.email,
        password: `temp_${studentData.rollNumber}`, // Temporary password
        email_confirm: true,
        user_metadata: {
          name: studentData.name,
          role: 'student'
        }
      });

      if (authError || !authUser.user) {
        logger.error('Failed to create auth user:', authError);
        throw new ErrorResponse('Failed to create user account', 500);
      }

      // Create user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          name: studentData.name,
          email: studentData.email,
          role: 'student',
          institution_id: studentData.institutionId,
          branch_id: studentData.branchId,
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        // Cleanup auth user if user creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        logger.error('Failed to create user record:', userError);
        throw new ErrorResponse('Failed to create user record', 500);
      }

      // Create student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          roll_number: studentData.rollNumber,
          branch_id: studentData.branchId,
          institution_id: studentData.institutionId,
          semester: studentData.semester,
          academic_year: studentData.academicYear,
          phone_number: studentData.phoneNumber,
          address: studentData.address,
          date_of_birth: studentData.dateOfBirth,
          guardian_name: studentData.guardianName,
          guardian_phone: studentData.guardianPhone
        })
        .select(`
          *,
          user:users(id, name, email, is_active),
          branch:branches(id, name),
          institution:institutions(id, name)
        `)
        .single();

      if (studentError) {
        // Cleanup user and auth user if student creation fails
        await supabase.from('users').delete().eq('id', user.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        logger.error('Failed to create student record:', studentError);
        throw new ErrorResponse('Failed to create student record', 500);
      }

      logger.info(`Student created successfully: ${studentData.email}`);

      const response: ApiResponse<StudentResponse> = {
        success: true,
        data: student,
        message: 'Student created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create student error:', error);
      next(error);
    }
  }
];

/**
 * Update student
 * @route PUT /api/v1/students/:id
 * @access Private (Admin, Professor, Student - own record)
 */
export const updateStudent = [
  validateRequestZod(updateStudentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateStudentRequest;

      // Get existing student
      const { data: existingStudent, error: fetchError } = await supabase
        .from('students')
        .select('*, user:users(id, email)')
        .eq('id', id)
        .single();

      if (fetchError || !existingStudent) {
        throw new ErrorResponse('Student not found', 404);
      }

      // Check authorization
      if (req.user?.role === 'student' && existingStudent.user_id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Apply tenant isolation
      if (req.user?.role !== 'admin' && req.user?.institutionId !== existingStudent.institution_id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Check for email conflicts if email is being updated
      if (updateData.email && updateData.email !== existingStudent.user.email) {
        const { data: emailConflict } = await supabase
          .from('users')
          .select('id')
          .eq('email', updateData.email)
          .neq('id', existingStudent.user_id)
          .single();

        if (emailConflict) {
          throw new ErrorResponse('Email already exists', 400);
        }
      }

      // Check for roll number conflicts if roll number is being updated
      if (updateData.rollNumber && updateData.rollNumber !== existingStudent.roll_number) {
        const { data: rollConflict } = await supabase
          .from('students')
          .select('id')
          .eq('roll_number', updateData.rollNumber)
          .eq('branch_id', updateData.branchId || existingStudent.branch_id)
          .neq('id', id)
          .single();

        if (rollConflict) {
          throw new ErrorResponse('Roll number already exists in this branch', 400);
        }
      }

      // Update user record if name or email changed
      if (updateData.name || updateData.email) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.email && { email: updateData.email })
          })
          .eq('id', existingStudent.user_id);

        if (userUpdateError) {
          logger.error('Failed to update user record:', userUpdateError);
          throw new ErrorResponse('Failed to update user information', 500);
        }

        // Update auth user email if changed
        if (updateData.email) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            existingStudent.user_id,
            { email: updateData.email }
          );

          if (authUpdateError) {
            logger.error('Failed to update auth user:', authUpdateError);
            // Note: We don't throw here as the main record is updated
          }
        }
      }

      // Update student record
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update({
          ...(updateData.rollNumber && { roll_number: updateData.rollNumber }),
          ...(updateData.branchId && { branch_id: updateData.branchId }),
          ...(updateData.semester && { semester: updateData.semester }),
          ...(updateData.academicYear && { academic_year: updateData.academicYear }),
          ...(updateData.phoneNumber !== undefined && { phone_number: updateData.phoneNumber }),
          ...(updateData.address !== undefined && { address: updateData.address }),
          ...(updateData.dateOfBirth !== undefined && { date_of_birth: updateData.dateOfBirth }),
          ...(updateData.guardianName !== undefined && { guardian_name: updateData.guardianName }),
          ...(updateData.guardianPhone !== undefined && { guardian_phone: updateData.guardianPhone }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          user:users(id, name, email, is_active),
          branch:branches(id, name),
          institution:institutions(id, name)
        `)
        .single();

      if (updateError) {
        logger.error('Failed to update student record:', updateError);
        throw new ErrorResponse('Failed to update student', 500);
      }

      logger.info(`Student updated successfully: ${id}`);

      const response: ApiResponse<StudentResponse> = {
        success: true,
        data: updatedStudent,
        message: 'Student updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update student error:', error);
      next(error);
    }
  }
];

/**
 * Delete student
 * @route DELETE /api/v1/students/:id
 * @access Private (Admin only)
 */
export const deleteStudent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can delete students
    if (req.user?.role !== 'admin') {
      throw new ErrorResponse('Access denied. Admin access required', 403);
    }

    // Get student with user info
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*, user:users(id)')
      .eq('id', id)
      .single();

    if (fetchError || !student) {
      throw new ErrorResponse('Student not found', 404);
    }

    // Delete student record (this will cascade to related records)
    const { error: deleteStudentError } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (deleteStudentError) {
      logger.error('Failed to delete student record:', deleteStudentError);
      throw new ErrorResponse('Failed to delete student', 500);
    }

    // Delete user record
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', student.user_id);

    if (deleteUserError) {
      logger.error('Failed to delete user record:', deleteUserError);
      // Continue as student is already deleted
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(student.user_id);

    if (deleteAuthError) {
      logger.error('Failed to delete auth user:', deleteAuthError);
      // Continue as main records are deleted
    }

    logger.info(`Student deleted successfully: ${id}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'Student deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete student error:', error);
    next(error);
  }
};

/**
 * Send password reset link to student
 * @route POST /api/v1/students/:id/reset-password
 * @access Private (Admin, Professor)
 */
export const sendPasswordResetLink = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Get student with user info
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('*, user:users(id, email)')
      .eq('id', id)
      .single();

    if (fetchError || !student) {
      throw new ErrorResponse('Student not found', 404);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== student.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      student.user.email,
      {
        redirectTo: `${config.frontend.url}/reset-password`
      }
    );

    if (resetError) {
      logger.error('Failed to send password reset email:', resetError);
      throw new ErrorResponse('Failed to send password reset link', 500);
    }

    logger.info(`Password reset link sent to student: ${student.user.email}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'Password reset link sent successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Send password reset error:', error);
    next(error);
  }
};

/**
 * Bulk import students from CSV
 * @route POST /api/v1/students/bulk-import
 * @access Private (Admin only)
 */
export const bulkImportStudents = [
  validateRequestZod(bulkImportSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Only admin can bulk import
      if (req.user?.role !== 'admin') {
        throw new ErrorResponse('Access denied. Admin access required', 403);
      }

      const { students } = req.body;
      const results: BulkImportResponse = {
        total: students.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < students.length; i++) {
        const studentData = students[i];
        
        try {
          // Check for existing email
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', studentData.email)
            .single();

          if (existingUser) {
            results.errors.push(`Row ${i + 1}: Email ${studentData.email} already exists`);
            results.failed++;
            continue;
          }

          // Check for existing roll number
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('roll_number', studentData.rollNumber)
            .eq('branch_id', studentData.branchId)
            .single();

          if (existingStudent) {
            results.errors.push(`Row ${i + 1}: Roll number ${studentData.rollNumber} already exists in this branch`);
            results.failed++;
            continue;
          }

          // Create auth user
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: studentData.email,
            password: `temp_${studentData.rollNumber}`,
            email_confirm: true,
            user_metadata: {
              name: studentData.name,
              role: 'student'
            }
          });

          if (authError || !authUser.user) {
            results.errors.push(`Row ${i + 1}: Failed to create auth user - ${authError?.message}`);
            results.failed++;
            continue;
          }

          // Create user record
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authUser.user.id,
              name: studentData.name,
              email: studentData.email,
              role: 'student',
              institution_id: studentData.institutionId,
              branch_id: studentData.branchId,
              is_active: true
            });

          if (userError) {
            await supabase.auth.admin.deleteUser(authUser.user.id);
            results.errors.push(`Row ${i + 1}: Failed to create user record - ${userError.message}`);
            results.failed++;
            continue;
          }

          // Create student record
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              user_id: authUser.user.id,
              roll_number: studentData.rollNumber,
              branch_id: studentData.branchId,
              institution_id: studentData.institutionId,
              semester: studentData.semester,
              academic_year: studentData.academicYear,
              phone_number: studentData.phoneNumber,
              address: studentData.address,
              date_of_birth: studentData.dateOfBirth,
              guardian_name: studentData.guardianName,
              guardian_phone: studentData.guardianPhone
            });

          if (studentError) {
            await supabase.from('users').delete().eq('id', authUser.user.id);
            await supabase.auth.admin.deleteUser(authUser.user.id);
            results.errors.push(`Row ${i + 1}: Failed to create student record - ${studentError.message}`);
            results.failed++;
            continue;
          }

          results.successful++;
        } catch (error: any) {
          results.errors.push(`Row ${i + 1}: Unexpected error - ${error.message}`);
          results.failed++;
        }
      }

      logger.info(`Bulk import completed: ${results.successful} successful, ${results.failed} failed`);

      const response: ApiResponse<BulkImportResponse> = {
        success: true,
        data: results,
        message: `Bulk import completed: ${results.successful} successful, ${results.failed} failed`
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Bulk import error:', error);
      next(error);
    }
  }
];

/**
 * Export students to CSV
 * @route GET /api/v1/students/export
 * @access Private (Admin, Professor)
 */
export const exportStudents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, semester, institutionId } = req.query;

    let query = supabase
      .from('students')
      .select(`
        roll_number,
        semester,
        academic_year,
        phone_number,
        address,
        date_of_birth,
        guardian_name,
        guardian_phone,
        user:users(name, email),
        branch:branches(name),
        institution:institutions(name)
      `);

    // Apply filters
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId) {
      query = query.eq('institution_id', req.user.institutionId);
    }

    const { data: students, error } = await query;

    if (error) {
      logger.error('Error fetching students for export:', error);
      throw new ErrorResponse('Failed to fetch students for export', 500);
    }

    // Convert to CSV format
    const csvHeaders = [
      'Name',
      'Email',
      'Roll Number',
      'Branch',
      'Institution',
      'Semester',
      'Academic Year',
      'Phone Number',
      'Address',
      'Date of Birth',
      'Guardian Name',
      'Guardian Phone'
    ];

    const csvRows = students?.map((student: any) => [
      student.user?.name || '',
      student.user?.email || '',
      student.roll_number || '',
      student.branch?.name || '',
      student.institution?.name || '',
      student.semester || '',
      student.academic_year || '',
      student.phone_number || '',
      student.address || '',
      student.date_of_birth || '',
      student.guardian_name || '',
      student.guardian_phone || ''
    ]) || [];

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Export students error:', error);
    next(error);
  }
};