/**
 * Branch Controller
 * Handles operations related to academic branches/departments
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { ApiResponse } from '@/types/api';
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
const createBranchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    institutionId: z.string().uuid('Valid institution ID is required'),
    description: z.string().optional()
});

const updateBranchSchema = createBranchSchema.partial();

/**
 * Get all branches
 * @route GET /api/v1/branches
 * @access Private
 */
export const getBranches = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { institutionId } = req.query;

        let query = supabase.from('branches').select('*, institution:institutions(id, name)');

        // Apply filters
        if (institutionId) {
            query = query.eq('institution_id', institutionId);
        } else if (req.user?.role !== 'admin' && req.user?.institutionId) {
            query = query.eq('institution_id', req.user.institutionId);
        }

        const { data: branches, error } = await query;

        if (error) {
            logger.error('Error fetching branches:', error);
            throw new ErrorResponse('Failed to fetch branches', 500);
        }

        const response: ApiResponse<any[]> = {
            success: true,
            count: branches?.length || 0,
            data: branches || []
        };

        res.status(200).json(response);
    } catch (error) {
        logger.error('Get branches error:', error);
        next(error);
    }
};

/**
 * Get single branch
 * @route GET /api/v1/branches/:id
 */
export const getBranch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        const { data: branch, error } = await supabase
            .from('branches')
            .select('*, institution:institutions(id, name)')
            .eq('id', id)
            .single();

        if (error || !branch) {
            throw new ErrorResponse('Branch not found', 404);
        }

        // Tenant isolation
        if (req.user?.role !== 'admin' && req.user?.institutionId !== branch.institution_id) {
            throw new ErrorResponse('Access denied', 403);
        }

        res.status(200).json({
            success: true,
            data: branch
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new branch
 * @route POST /api/v1/branches
 * @access Private (Admin)
 */
export const createBranch = [
    validateRequestZod(createBranchSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.user?.role !== 'admin') {
                throw new ErrorResponse('Access denied. Admin role required', 403);
            }

            const branchData = req.body;

            const { data: branch, error } = await supabase
                .from('branches')
                .insert({
                    name: branchData.name,
                    code: branchData.code,
                    institution_id: branchData.institutionId,
                    description: branchData.description
                })
                .select()
                .single();

            if (error) {
                logger.error('Failed to create branch:', error);
                throw new ErrorResponse('Failed to create branch', 500);
            }

            res.status(201).json({
                success: true,
                data: branch,
                message: 'Branch created successfully'
            });
        } catch (error) {
            next(error);
        }
    }
];

/**
 * Update branch
 * @route PUT /api/v1/branches/:id
 */
export const updateBranch = [
    validateRequestZod(updateBranchSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.user?.role !== 'admin') {
                throw new ErrorResponse('Access denied. Admin role required', 403);
            }

            const { id } = req.params;
            const updateData = req.body;

            const { data: branch, error } = await supabase
                .from('branches')
                .update({
                    name: updateData.name,
                    code: updateData.code,
                    description: updateData.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new ErrorResponse('Failed to update branch', 500);
            }

            res.status(200).json({
                success: true,
                data: branch,
                message: 'Branch updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }
];

/**
 * Delete branch
 * @route DELETE /api/v1/branches/:id
 */
export const deleteBranch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            throw new ErrorResponse('Access denied. Admin role required', 403);
        }

        const { id } = req.params;

        const { error } = await supabase.from('branches').delete().eq('id', id);

        if (error) {
            throw new ErrorResponse('Failed to delete branch', 500);
        }

        res.status(200).json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
