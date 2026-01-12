/**
 * Dashboard Controller
 * Handles dashboard-related operations
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/auth';
import cacheService from '@/services/cacheService';
import { asyncHandler } from '@/utils/asyncHandler';
import { ErrorResponse } from '@/utils/errorResponse';

/**
 * Get student dashboard data
 * @route GET /api/v1/dashboard/student/me
 * @access Private (Student)
 */
export const getStudentDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const institutionId = req.user?.institutionId;

    if (!userId || !institutionId) {
      return next(new ErrorResponse('User information not found', 400));
    }

    try {
      const dashboardData = await cacheService.getDashboardAnalytics(
        userId,
        'student',
        institutionId
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Student dashboard data retrieved successfully'
      });
    } catch (error) {
      next(new ErrorResponse('Failed to retrieve dashboard data', 500));
    }
  }
);

/**
 * Get professor dashboard data
 * @route GET /api/v1/dashboard/professor/me
 * @access Private (Professor)
 */
export const getProfessorDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const institutionId = req.user?.institutionId;

    if (!userId || !institutionId) {
      return next(new ErrorResponse('User information not found', 400));
    }

    try {
      const dashboardData = await cacheService.getDashboardAnalytics(
        userId,
        'professor',
        institutionId
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Professor dashboard data retrieved successfully'
      });
    } catch (error) {
      next(new ErrorResponse('Failed to retrieve dashboard data', 500));
    }
  }
);

/**
 * Get admin dashboard data
 * @route GET /api/v1/dashboard/admin/me
 * @access Private (Admin)
 */
export const getAdminDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const institutionId = req.user?.institutionId;

    if (!userId || !institutionId) {
      return next(new ErrorResponse('User information not found', 400));
    }

    try {
      const dashboardData = await cacheService.getDashboardAnalytics(
        userId,
        'admin',
        institutionId
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Admin dashboard data retrieved successfully'
      });
    } catch (error) {
      next(new ErrorResponse('Failed to retrieve dashboard data', 500));
    }
  }
);