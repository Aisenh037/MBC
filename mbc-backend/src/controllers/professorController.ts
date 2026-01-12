/**
 * Professor Controller
 * TypeScript implementation with proper interfaces and validation
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { 
  CreateProfessorRequest, 
  UpdateProfessorRequest, 
  ProfessorResponse,
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
const createProfessorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  branchIds: z.array(z.string().uuid()).min(1, 'At least one branch is required'),
  institutionId: z.string().uuid('Valid institution ID is required'),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfJoining: z.string().datetime().optional(),
  qualification: z.string().optional(),
  experience: z.number().int().min(0).optional(),
  specialization: z.string().optional()
});

const updateProfessorSchema = createProfessorSchema.partial();

/**
 * Get all professors
 * @route GET /api/v1/professors
 * @access Private (Admin, Professor)
 */
export const getProfessors = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, branchId, department } = req.query;
    
    // Build query
    let query = supabase
      .from('professors')
      .select(`
        *,
        user:users(id, name, email, is_active),
        branches:professor_branches(
          branch:branches(id, name)
        ),
        institution:institutions(id, name)
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    if (department) {
      query = query.eq('department', department);
    }

    // Apply tenant isolation (non-admin users can only see their institution's professors)
    if (req.user?.role !== 'admin' && req.user?.institutionId) {
      query = query.eq('institution_id', req.user.institutionId);
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: professors, error, count } = await query;

    if (error) {
      logger.error('Error fetching professors:', error);
      throw new ErrorResponse('Failed to fetch professors', 500);
    }

    // Filter by branch if specified
    let filteredProfessors = professors || [];
    if (branchId) {
      filteredProfessors = professors?.filter(prof => 
        prof.branches?.some((pb: any) => pb.branch?.id === branchId)
      ) || [];
    }

    const response: ApiResponse<ProfessorResponse[]> = {
      success: true,
      count: filteredProfessors.length,
      data: filteredProfessors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get professors error:', error);
    next(error);
  }
};

/**
 * Get single professor
 * @route GET /api/v1/professors/:id
 * @access Private (Admin, Professor - own record)
 */
export const getProfessor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: professor, error } = await supabase
      .from('professors')
      .select(`
        *,
        user:users(id, name, email, is_active),
        branches:professor_branches(
          branch:branches(id, name)
        ),
        institution:institutions(id, name),
        courses:courses(id, name, code)
      `)
      .eq('id', id)
      .single();

    if (error || !professor) {
      throw new ErrorResponse('Professor not found', 404);
    }

    // Check authorization - professors can only view their own record
    if (req.user?.role === 'professor' && professor.user_id !== req.user.id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== professor.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    const response: ApiResponse<ProfessorResponse> = {
      success: true,
      data: professor
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get professor error:', error);
    next(error);
  }
};

/**
 * Create new professor
 * @route POST /api/v1/professors
 * @access Private (Admin only)
 */
export const createProfessor = [
  validateRequestZod(createProfessorSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Only admin can create professors
      if (req.user?.role !== 'admin') {
        throw new ErrorResponse('Access denied. Admin access required', 403);
      }

      const professorData = req.body as CreateProfessorRequest;

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', professorData.email)
        .single();

      if (existingUser) {
        throw new ErrorResponse('Email already exists', 400);
      }

      // Check if employee ID already exists
      const { data: existingProfessor } = await supabase
        .from('professors')
        .select('id')
        .eq('employee_id', professorData.employeeId)
        .single();

      if (existingProfessor) {
        throw new ErrorResponse('Employee ID already exists', 400);
      }

      // Verify all branch IDs exist
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id')
        .in('id', professorData.branchIds);

      if (branchError || !branches || branches.length !== professorData.branchIds.length) {
        throw new ErrorResponse('One or more branch IDs are invalid', 400);
      }

      // Create user first
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: professorData.email,
        password: `temp_${professorData.employeeId}`, // Temporary password
        email_confirm: true,
        user_metadata: {
          name: professorData.name,
          role: 'professor'
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
          name: professorData.name,
          email: professorData.email,
          role: 'professor',
          institution_id: professorData.institutionId,
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

      // Create professor record
      const { data: professor, error: professorError } = await supabase
        .from('professors')
        .insert({
          user_id: user.id,
          employee_id: professorData.employeeId,
          department: professorData.department,
          designation: professorData.designation,
          institution_id: professorData.institutionId,
          phone_number: professorData.phoneNumber,
          address: professorData.address,
          date_of_joining: professorData.dateOfJoining,
          qualification: professorData.qualification,
          experience: professorData.experience,
          specialization: professorData.specialization
        })
        .select()
        .single();

      if (professorError) {
        // Cleanup user and auth user if professor creation fails
        await supabase.from('users').delete().eq('id', user.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        logger.error('Failed to create professor record:', professorError);
        throw new ErrorResponse('Failed to create professor record', 500);
      }

      // Create professor-branch associations
      const branchAssociations = professorData.branchIds.map(branchId => ({
        professor_id: professor.id,
        branch_id: branchId
      }));

      const { error: branchAssocError } = await supabase
        .from('professor_branches')
        .insert(branchAssociations);

      if (branchAssocError) {
        // Cleanup created records
        await supabase.from('professors').delete().eq('id', professor.id);
        await supabase.from('users').delete().eq('id', user.id);
        await supabase.auth.admin.deleteUser(authUser.user.id);
        logger.error('Failed to create professor-branch associations:', branchAssocError);
        throw new ErrorResponse('Failed to create professor-branch associations', 500);
      }

      // Fetch the complete professor record with associations
      const { data: completeProfessor, error: fetchError } = await supabase
        .from('professors')
        .select(`
          *,
          user:users(id, name, email, is_active),
          branches:professor_branches(
            branch:branches(id, name)
          ),
          institution:institutions(id, name)
        `)
        .eq('id', professor.id)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch complete professor record:', fetchError);
        throw new ErrorResponse('Professor created but failed to fetch complete record', 500);
      }

      logger.info(`Professor created successfully: ${professorData.email}`);

      const response: ApiResponse<ProfessorResponse> = {
        success: true,
        data: completeProfessor,
        message: 'Professor created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create professor error:', error);
      next(error);
    }
  }
];

/**
 * Update professor
 * @route PUT /api/v1/professors/:id
 * @access Private (Admin, Professor - own record)
 */
export const updateProfessor = [
  validateRequestZod(updateProfessorSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateProfessorRequest;

      // Get existing professor
      const { data: existingProfessor, error: fetchError } = await supabase
        .from('professors')
        .select('*, user:users(id, email)')
        .eq('id', id)
        .single();

      if (fetchError || !existingProfessor) {
        throw new ErrorResponse('Professor not found', 404);
      }

      // Check authorization
      if (req.user?.role === 'professor' && existingProfessor.user_id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Apply tenant isolation
      if (req.user?.role !== 'admin' && req.user?.institutionId !== existingProfessor.institution_id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Check for email conflicts if email is being updated
      if (updateData.email && updateData.email !== existingProfessor.user.email) {
        const { data: emailConflict } = await supabase
          .from('users')
          .select('id')
          .eq('email', updateData.email)
          .neq('id', existingProfessor.user_id)
          .single();

        if (emailConflict) {
          throw new ErrorResponse('Email already exists', 400);
        }
      }

      // Check for employee ID conflicts if employee ID is being updated
      if (updateData.employeeId && updateData.employeeId !== existingProfessor.employee_id) {
        const { data: employeeConflict } = await supabase
          .from('professors')
          .select('id')
          .eq('employee_id', updateData.employeeId)
          .neq('id', id)
          .single();

        if (employeeConflict) {
          throw new ErrorResponse('Employee ID already exists', 400);
        }
      }

      // Verify branch IDs if being updated
      if (updateData.branchIds) {
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('id')
          .in('id', updateData.branchIds);

        if (branchError || !branches || branches.length !== updateData.branchIds.length) {
          throw new ErrorResponse('One or more branch IDs are invalid', 400);
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
          .eq('id', existingProfessor.user_id);

        if (userUpdateError) {
          logger.error('Failed to update user record:', userUpdateError);
          throw new ErrorResponse('Failed to update user information', 500);
        }

        // Update auth user email if changed
        if (updateData.email) {
          const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
            existingProfessor.user_id,
            { email: updateData.email }
          );

          if (authUpdateError) {
            logger.error('Failed to update auth user:', authUpdateError);
            // Note: We don't throw here as the main record is updated
          }
        }
      }

      // Update professor record
      const { error: updateError } = await supabase
        .from('professors')
        .update({
          ...(updateData.employeeId && { employee_id: updateData.employeeId }),
          ...(updateData.department && { department: updateData.department }),
          ...(updateData.designation && { designation: updateData.designation }),
          ...(updateData.phoneNumber !== undefined && { phone_number: updateData.phoneNumber }),
          ...(updateData.address !== undefined && { address: updateData.address }),
          ...(updateData.dateOfJoining !== undefined && { date_of_joining: updateData.dateOfJoining }),
          ...(updateData.qualification !== undefined && { qualification: updateData.qualification }),
          ...(updateData.experience !== undefined && { experience: updateData.experience }),
          ...(updateData.specialization !== undefined && { specialization: updateData.specialization }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        logger.error('Failed to update professor record:', updateError);
        throw new ErrorResponse('Failed to update professor', 500);
      }

      // Update branch associations if provided
      if (updateData.branchIds) {
        // Delete existing associations
        await supabase
          .from('professor_branches')
          .delete()
          .eq('professor_id', id);

        // Create new associations
        const branchAssociations = updateData.branchIds.map(branchId => ({
          professor_id: id,
          branch_id: branchId
        }));

        const { error: branchAssocError } = await supabase
          .from('professor_branches')
          .insert(branchAssociations);

        if (branchAssocError) {
          logger.error('Failed to update professor-branch associations:', branchAssocError);
          throw new ErrorResponse('Failed to update professor-branch associations', 500);
        }
      }

      // Fetch the complete updated professor record
      const { data: completeProfessor, error: fetchCompleteError } = await supabase
        .from('professors')
        .select(`
          *,
          user:users(id, name, email, is_active),
          branches:professor_branches(
            branch:branches(id, name)
          ),
          institution:institutions(id, name)
        `)
        .eq('id', id)
        .single();

      if (fetchCompleteError) {
        logger.error('Failed to fetch complete updated professor record:', fetchCompleteError);
        throw new ErrorResponse('Professor updated but failed to fetch complete record', 500);
      }

      logger.info(`Professor updated successfully: ${id}`);

      const response: ApiResponse<ProfessorResponse> = {
        success: true,
        data: completeProfessor,
        message: 'Professor updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update professor error:', error);
      next(error);
    }
  }
];

/**
 * Delete professor
 * @route DELETE /api/v1/professors/:id
 * @access Private (Admin only)
 */
export const deleteProfessor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Only admin can delete professors
    if (req.user?.role !== 'admin') {
      throw new ErrorResponse('Access denied. Admin access required', 403);
    }

    // Get professor with user info
    const { data: professor, error: fetchError } = await supabase
      .from('professors')
      .select('*, user:users(id)')
      .eq('id', id)
      .single();

    if (fetchError || !professor) {
      throw new ErrorResponse('Professor not found', 404);
    }

    // Delete professor-branch associations
    await supabase
      .from('professor_branches')
      .delete()
      .eq('professor_id', id);

    // Delete professor record (this will cascade to related records)
    const { error: deleteProfessorError } = await supabase
      .from('professors')
      .delete()
      .eq('id', id);

    if (deleteProfessorError) {
      logger.error('Failed to delete professor record:', deleteProfessorError);
      throw new ErrorResponse('Failed to delete professor', 500);
    }

    // Delete user record
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', professor.user_id);

    if (deleteUserError) {
      logger.error('Failed to delete user record:', deleteUserError);
      // Continue as professor is already deleted
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(professor.user_id);

    if (deleteAuthError) {
      logger.error('Failed to delete auth user:', deleteAuthError);
      // Continue as main records are deleted
    }

    logger.info(`Professor deleted successfully: ${id}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'Professor deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete professor error:', error);
    next(error);
  }
};

/**
 * Get professors by branch
 * @route GET /api/v1/professors/branch/:branchId
 * @access Private (Admin, Professor, Student)
 */
export const getProfessorsByBranch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.params;

    const { data: professors, error } = await supabase
      .from('professor_branches')
      .select(`
        professor:professors(
          *,
          user:users(id, name, email, is_active),
          institution:institutions(id, name)
        )
      `)
      .eq('branch_id', branchId);

    if (error) {
      logger.error('Error fetching professors by branch:', error);
      throw new ErrorResponse('Failed to fetch professors', 500);
    }

    const professorList = professors?.map(pb => pb.professor).filter(Boolean) || [];

    // Apply tenant isolation
    const filteredProfessors = professorList.filter((prof: any) => {
      if (req.user?.role === 'admin') return true;
      return prof?.institution_id === req.user?.institutionId;
    });

    const response: ApiResponse<any[]> = {
      success: true,
      count: filteredProfessors.length,
      data: filteredProfessors
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get professors by branch error:', error);
    next(error);
  }
};