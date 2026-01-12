/**
 * Institution Controller
 * Handles multi-tenant institution management
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
const createInstitutionSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required'),
    address: z.string().optional()
});

/**
 * Get all institutions (Admin only)
 * @route GET /api/v1/institutions
 */
export const getInstitutions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.user?.role !== 'admin') {
            throw new ErrorResponse('Access denied', 403);
        }

        const { data: institutions, error } = await supabase
            .from('institutions')
            .select('*, branches(count), users(count)');

        if (error) {
            throw new ErrorResponse('Failed to fetch institutions', 500);
        }

        res.status(200).json({
            success: true,
            count: institutions?.length || 0,
            data: institutions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single institution
 */
export const getInstitution = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // Tenant isolation
        if (req.user?.role !== 'admin' && req.user?.institutionId !== id) {
            throw new ErrorResponse('Access denied', 403);
        }

        const { data: institution, error } = await supabase
            .from('institutions')
            .select('*, branches(*)')
            .eq('id', id)
            .single();

        if (error || !institution) {
            throw new ErrorResponse('Institution not found', 404);
        }

        res.status(200).json({
            success: true,
            data: institution
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new institution
 */
export const createInstitution = [
    validateRequestZod(createInstitutionSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.user?.role !== 'admin') {
                throw new ErrorResponse('Access denied. Admin access required', 403);
            }

            const { data: institution, error } = await supabase
                .from('institutions')
                .insert(req.body)
                .select()
                .single();

            if (error) {
                throw new ErrorResponse('Failed to create institution', 500);
            }

            res.status(201).json({
                success: true,
                data: institution,
                message: 'Institution created successfully'
            });
        } catch (error) {
            next(error);
        }
    }
];
