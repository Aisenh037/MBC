/**
 * Attendance Controller
 * Handles student attendance tracking and reporting
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
const markAttendanceSchema = z.object({
    courseId: z.string().uuid('Valid course ID is required'),
    date: z.string().datetime().optional(),
    records: z.array(z.object({
        studentId: z.string().uuid('Valid student ID is required'),
        status: z.enum(['present', 'absent', 'late', 'excused'])
    })).min(1, 'At least one student record is required')
});

const updateAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late', 'excused'])
});

/**
 * Get attendance records for a course
 * @route GET /api/v1/attendance
 * @access Private (Admin, Professor, Student)
 */
export const getAttendance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { courseId, studentId, startDate, endDate, status } = req.query;

        // Build query
        let query = supabase
            .from('attendance')
            .select(`
        *,
        course:courses(id, name, code),
        student:students(
          id,
          roll_number,
          user:users(id, name, email)
        ),
        marked_by_user:users!attendance_marked_by_fkey(id, name)
      `);

        // Apply filters
        if (courseId) {
            query = query.eq('course_id', courseId);
        }
        if (studentId) {
            query = query.eq('student_id', studentId);
        } else if (req.user?.role === 'student') {
            // Students can only see their own attendance
            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', req.user.id)
                .single();

            if (student) {
                query = query.eq('student_id', student.id);
            }
        }

        if (startDate) {
            query = query.gte('date', startDate);
        }
        if (endDate) {
            query = query.lte('date', endDate);
        }
        if (status) {
            query = query.eq('status', status);
        }

        // Apply tenant isolation
        if (req.user?.role !== 'admin' && req.user?.institutionId) {
            // We need to filter by course institution_id
            const { data: institutionCourses } = await supabase
                .from('courses')
                .select('id')
                .eq('institution_id', req.user.institutionId);

            if (institutionCourses && institutionCourses.length > 0) {
                query = query.in('course_id', institutionCourses.map(c => c.id));
            }
        }

        const { data: attendance, error } = await query.order('date', { ascending: false });

        if (error) {
            logger.error('Error fetching attendance:', error);
            throw new ErrorResponse('Failed to fetch attendance records', 500);
        }

        const response: ApiResponse<any[]> = {
            success: true,
            count: attendance?.length || 0,
            data: attendance || []
        };

        res.status(200).json(response);
    } catch (error) {
        logger.error('Get attendance error:', error);
        next(error);
    }
};

/**
 * Mark attendance for a class
 * @route POST /api/v1/attendance
 * @access Private (Admin, Professor)
 */
export const markAttendance = [
    validateRequestZod(markAttendanceSchema),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { courseId, date = new Date().toISOString(), records } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                throw new ErrorResponse('User unauthorized', 401);
            }

            // Check if course exists and user has permission
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .select('id, institution_id, professor_id')
                .eq('id', courseId)
                .single();

            if (courseError || !course) {
                throw new ErrorResponse('Course not found', 404);
            }

            // Check permissions
            if (req.user?.role === 'professor') {
                const { data: prof } = await supabase
                    .from('professors')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (!prof || course.professor_id !== prof.id) {
                    throw new ErrorResponse('Permission denied. You can only mark attendance for your own courses', 403);
                }
            }

            // Prepare attendance data
            const attendanceData = records.map((record: any) => ({
                course_id: courseId,
                student_id: record.studentId,
                date: new Date(date).toISOString().split('T')[0], // YYYY-MM-DD
                status: record.status,
                marked_by: userId
            }));

            // Upsert attendance records (handle existing records for the same student/course/date)
            const { data, error } = await supabase
                .from('attendance')
                .upsert(attendanceData, {
                    onConflict: 'course_id,student_id,date'
                })
                .select();

            if (error) {
                logger.error('Failed to mark attendance:', error);
                throw new ErrorResponse('Failed to mark attendance', 500);
            }

            const response: ApiResponse<any> = {
                success: true,
                data,
                message: 'Attendance marked successfully'
            };

            res.status(201).json(response);
        } catch (error) {
            logger.error('Mark attendance error:', error);
            next(error);
        }
    }
];

/**
 * Get attendance statistics for a student in a course
 * @route GET /api/v1/attendance/stats
 */
export const getAttendanceStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { courseId, studentId } = req.query;

        if (!courseId || !studentId) {
            throw new ErrorResponse('Course ID and Student ID are required', 400);
        }

        const { data: records, error } = await supabase
            .from('attendance')
            .select('status')
            .eq('course_id', courseId)
            .eq('student_id', studentId);

        if (error) {
            throw new ErrorResponse('Failed to fetch attendance stats', 500);
        }

        const total = records?.length || 0;
        const present = records?.filter(r => r.status === 'present').length || 0;
        const absent = records?.filter(r => r.status === 'absent').length || 0;
        const late = records?.filter(r => r.status === 'late').length || 0;
        const excused = records?.filter(r => r.status === 'excused').length || 0;

        const percentage = total > 0 ? ((present + late * 0.5) / total) * 100 : 0;

        const stats = {
            total,
            present,
            absent,
            late,
            excused,
            percentage: Math.round(percentage * 100) / 100
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
