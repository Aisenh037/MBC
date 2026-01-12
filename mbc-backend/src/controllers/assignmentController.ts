/**
 * Assignment Controller
 * Enhanced TypeScript implementation with notification features
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
// import { websocketService } from '../services/websocketService.js';
// import cacheService from '../services/cacheService.js';
// import { notificationService } from '../services/notificationService';
import { 
  CreateAssignmentRequest, 
  UpdateAssignmentRequest, 
  SubmissionRequest,
  GradeSubmissionRequest,
  ApiResponse 
} from '@/types/api';
import { AuthenticatedUser } from '@/types/auth';
import { config } from '@/config/config';
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
const createAssignmentSchema = z.object({
  courseId: z.string().uuid('Valid course ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  maxMarks: z.number().int().min(1),
  fileAttachments: z.array(z.string()).optional()
});

const updateAssignmentSchema = createAssignmentSchema.partial();

const submissionSchema = z.object({
  content: z.string().optional(),
  fileAttachments: z.array(z.string()).optional()
});

const gradeSubmissionSchema = z.object({
  marksObtained: z.number().min(0),
  feedback: z.string().optional()
});

/**
 * Get all assignments
 * @route GET /api/v1/assignments
 * @access Private (Admin, Professor, Student)
 */
export const getAssignments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, courseId, status } = req.query;
    
    // Build query
    let query = supabase
      .from('assignments')
      .select(`
        *,
        course:courses(
          id, name, code,
          professor:professors(
            user:users(id, name, email)
          )
        ),
        submissions:submissions(count)
      `);

    // Apply filters
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (status) {
      const now = new Date().toISOString();
      if (status === 'active') {
        query = query.gte('due_date', now);
      } else if (status === 'expired') {
        query = query.lt('due_date', now);
      }
    }

    // Apply role-based filtering
    if (req.user?.role === 'student') {
      // Students can only see assignments from courses they're enrolled in
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', req.user.id);

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.course_id);
        query = query.in('course_id', courseIds);
      } else {
        // No enrollments, return empty result
        query = query.eq('course_id', 'no-courses');
      }
    } else if (req.user?.role === 'professor') {
      // Professors can only see assignments from courses they teach
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('professor_id', req.user.id);

      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        query = query.in('course_id', courseIds);
      } else {
        // No courses, return empty result
        query = query.eq('course_id', 'no-courses');
      }
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId) {
      // Filter by institution through course relationship
      const { data: institutionCourses } = await supabase
        .from('courses')
        .select('id')
        .eq('institution_id', req.user.institutionId);

      if (institutionCourses && institutionCourses.length > 0) {
        const courseIds = institutionCourses.map(c => c.id);
        query = query.in('course_id', courseIds);
      }
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: assignments, error, count } = await query;

    if (error) {
      logger.error('Error fetching assignments:', error);
      throw new ErrorResponse('Failed to fetch assignments', 500);
    }

    const response: ApiResponse<any[]> = {
      success: true,
      count: count || 0,
      data: assignments || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get assignments error:', error);
    next(error);
  }
};

/**
 * Get single assignment
 * @route GET /api/v1/assignments/:id
 * @access Private (Admin, Professor, Student)
 */
export const getAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(
          id, name, code,
          professor:professors(
            id,
            user:users(id, name, email)
          )
        ),
        submissions:submissions(
          id,
          content,
          submitted_at,
          marks_obtained,
          feedback,
          student:students(
            id,
            roll_number,
            user:users(id, name, email)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Check access permissions
    if (req.user?.role === 'student') {
      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', assignment.course_id)
        .eq('student_id', req.user.id)
        .single();

      if (!enrollment) {
        throw new ErrorResponse('Access denied', 403);
      }
    } else if (req.user?.role === 'professor') {
      // Check if professor teaches this course
      if (assignment.course?.professor?.user?.id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin') {
      const { data: course } = await supabase
        .from('courses')
        .select('institution_id')
        .eq('id', assignment.course_id)
        .single();

      if (course && course.institution_id !== req.user?.institutionId) {
        throw new ErrorResponse('Access denied', 403);
      }
    }

    const response: ApiResponse<any> = {
      success: true,
      data: assignment
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get assignment error:', error);
    next(error);
  }
};

/**
 * Create new assignment
 * @route POST /api/v1/assignments
 * @access Private (Admin, Professor)
 */
export const createAssignment = [
  validateRequestZod(createAssignmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignmentData = req.body as CreateAssignmentRequest;

      // Verify course exists and user has permission
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          id, name, institution_id,
          professor:professors(
            user:users(id)
          )
        `)
        .eq('id', assignmentData.courseId)
        .single();

      if (courseError || !course) {
        throw new ErrorResponse('Course not found', 404);
      }

      // Check permissions
      if (req.user?.role === 'professor') {
        const professorUser = (course.professor as any)?.user;
        const userId = Array.isArray(professorUser) ? professorUser[0]?.id : professorUser?.id;
        if (userId !== req.user.id) {
          throw new ErrorResponse('Access denied. You can only create assignments for courses you teach', 403);
        }
      }

      // Apply tenant isolation
      if (req.user?.role !== 'admin' && req.user?.institutionId !== course.institution_id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Create assignment record
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          course_id: assignmentData.courseId,
          title: assignmentData.title,
          description: assignmentData.description,
          due_date: assignmentData.dueDate,
          max_marks: assignmentData.maxMarks,
          file_attachments: assignmentData.fileAttachments,
          created_by: req.user?.id
        })
        .select(`
          *,
          course:courses(
            id, name, code,
            professor:professors(
              user:users(id, name, email)
            )
          )
        `)
        .single();

      if (assignmentError) {
        logger.error('Failed to create assignment:', assignmentError);
        throw new ErrorResponse('Failed to create assignment', 500);
      }

      logger.info(`Assignment created successfully: ${assignmentData.title}`);

      // Get enrolled students for real-time notification
      const { data: enrolledStudents, error: studentsError } = await supabase
        .from('course_enrollments')
        .select(`
          student:students(
            id,
            user:users(id)
          )
        `)
        .eq('course_id', assignmentData.courseId);

      if (!studentsError && enrolledStudents) {
        const studentIds = enrolledStudents
          .map(e => {
            const studentUser = (e.student as any)?.user;
            const userId = Array.isArray(studentUser) ? studentUser[0]?.id : studentUser?.id;
            return userId;
          })
          .filter(Boolean);

        // Send real-time notification to enrolled students
        const assignmentData_rt = {
          id: assignment.id,
          courseId: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.due_date ? new Date(assignment.due_date) : undefined,
          maxMarks: assignment.max_marks,
          professorId: req.user?.id || '',
          createdAt: new Date(assignment.created_at)
        };

        // await websocketService.sendAssignmentCreated(assignmentData_rt, studentIds);
        logger.info(`Real-time notifications sent to ${studentIds.length} students for assignment: ${assignment.id}`);
      }

      // Invalidate cache
      // await cacheService.deletePattern('assignments:*');

      const response: ApiResponse<any> = {
        success: true,
        data: assignment,
        message: 'Assignment created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create assignment error:', error);
      next(error);
    }
  }
];

/**
 * Update assignment
 * @route PUT /api/v1/assignments/:id
 * @access Private (Admin, Professor - own assignments)
 */
export const updateAssignment = [
  validateRequestZod(updateAssignmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateAssignmentRequest;

      // Get existing assignment
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          *,
          course:courses(
            professor:professors(
              user:users(id)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError || !existingAssignment) {
        throw new ErrorResponse('Assignment not found', 404);
      }

      // Check authorization
      if (req.user?.role === 'professor') {
        if (existingAssignment.course?.professor?.user?.id !== req.user.id) {
          throw new ErrorResponse('Access denied', 403);
        }
      }

      // Update assignment record
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('assignments')
        .update({
          ...(updateData.title && { title: updateData.title }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.dueDate !== undefined && { due_date: updateData.dueDate }),
          ...(updateData.maxMarks && { max_marks: updateData.maxMarks }),
          ...(updateData.fileAttachments !== undefined && { file_attachments: updateData.fileAttachments }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          course:courses(
            id, name, code,
            professor:professors(
              user:users(id, name, email)
            )
          )
        `)
        .single();

      if (updateError) {
        logger.error('Failed to update assignment:', updateError);
        throw new ErrorResponse('Failed to update assignment', 500);
      }

      logger.info(`Assignment updated successfully: ${id}`);

      const response: ApiResponse<any> = {
        success: true,
        data: updatedAssignment,
        message: 'Assignment updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update assignment error:', error);
      next(error);
    }
  }
];

/**
 * Delete assignment
 * @route DELETE /api/v1/assignments/:id
 * @access Private (Admin, Professor - own assignments)
 */
export const deleteAssignment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Get assignment with course info
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(
          professor:professors(
            user:users(id)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !assignment) {
      throw new ErrorResponse('Assignment not found', 404);
    }

    // Check authorization
    if (req.user?.role === 'professor') {
      if (assignment.course?.professor?.user?.id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }
    }

    // Check if assignment has submissions
    const { data: submissions, error: submissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', id)
      .limit(1);

    if (submissionError) {
      logger.error('Error checking assignment submissions:', submissionError);
      throw new ErrorResponse('Failed to check assignment submissions', 500);
    }

    if (submissions && submissions.length > 0) {
      throw new ErrorResponse('Cannot delete assignment with existing submissions', 400);
    }

    // Delete assignment record
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('Failed to delete assignment:', deleteError);
      throw new ErrorResponse('Failed to delete assignment', 500);
    }

    logger.info(`Assignment deleted successfully: ${id}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'Assignment deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete assignment error:', error);
    next(error);
  }
};

/**
 * Submit assignment
 * @route POST /api/v1/assignments/:id/submit
 * @access Private (Student)
 */
export const submitAssignment = [
  validateRequestZod(submissionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: assignmentId } = req.params;
      const submissionData = req.body as SubmissionRequest;

      // Only students can submit assignments
      if (req.user?.role !== 'student') {
        throw new ErrorResponse('Only students can submit assignments', 403);
      }

      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (studentError || !student) {
        throw new ErrorResponse('Student record not found', 404);
      }

      // Get assignment details
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('*, course:courses(id)')
        .eq('id', assignmentId)
        .single();

      if (assignmentError || !assignment) {
        throw new ErrorResponse('Assignment not found', 404);
      }

      // Check if student is enrolled in the course
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', assignment.course_id)
        .eq('student_id', student.id)
        .single();

      if (!enrollment) {
        throw new ErrorResponse('You are not enrolled in this course', 403);
      }

      // Check if assignment is still open
      if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
        throw new ErrorResponse('Assignment submission deadline has passed', 400);
      }

      // Check if student has already submitted
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', student.id)
        .single();

      if (existingSubmission) {
        throw new ErrorResponse('You have already submitted this assignment', 400);
      }

      // Create submission
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: student.id,
          content: submissionData.content,
          file_attachments: submissionData.fileAttachments,
          submitted_at: new Date().toISOString()
        })
        .select(`
          *,
          assignment:assignments(id, title),
          student:students(
            id,
            roll_number,
            user:users(id, name, email)
          )
        `)
        .single();

      if (submissionError) {
        logger.error('Failed to create submission:', submissionError);
        throw new ErrorResponse('Failed to submit assignment', 500);
      }

      logger.info(`Assignment submitted successfully: ${assignmentId} by student ${student.id}`);

      // Send real-time notification to professor
      const { data: professorData } = await supabase
        .from('courses')
        .select(`
          professor:professors(
            user:users(id)
          )
        `)
        .eq('id', assignment.course_id)
        .single();

      const professorUser = (professorData?.professor as any)?.user;
      const professorUserId = Array.isArray(professorUser) ? professorUser[0]?.id : professorUser?.id;
      if (professorUserId) {
        const submissionData_rt = {
          id: submission.id,
          assignmentId: assignmentId,
          studentId: student.id,
          submittedAt: new Date(submission.submitted_at),
          fileAttachments: submission.file_attachments || []
        };

        // await websocketService.sendAssignmentSubmitted(submissionData_rt, professorData.professor.user.id);
        logger.info(`Real-time notification sent to professor for submission: ${submission.id}`);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: submission,
        message: 'Assignment submitted successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Submit assignment error:', error);
      next(error);
    }
  }
];

/**
 * Grade submission
 * @route PUT /api/v1/assignments/:assignmentId/submissions/:submissionId/grade
 * @access Private (Admin, Professor)
 */
export const gradeSubmission = [
  validateRequestZod(gradeSubmissionSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { assignmentId, submissionId } = req.params;
      const gradeData = req.body as GradeSubmissionRequest;

      // Get submission with assignment details
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(
            id, max_marks,
            course:courses(
              professor:professors(
                user:users(id)
              )
            )
          )
        `)
        .eq('id', submissionId)
        .eq('assignment_id', assignmentId)
        .single();

      if (submissionError || !submission) {
        throw new ErrorResponse('Submission not found', 404);
      }

      // Check authorization
      if (req.user?.role === 'professor') {
        if (submission.assignment?.course?.professor?.user?.id !== req.user.id) {
          throw new ErrorResponse('Access denied', 403);
        }
      }

      // Validate marks
      if (gradeData.marksObtained > submission.assignment.max_marks) {
        throw new ErrorResponse('Marks obtained cannot exceed maximum marks', 400);
      }

      // Update submission with grade
      const { data: gradedSubmission, error: gradeError } = await supabase
        .from('submissions')
        .update({
          marks_obtained: gradeData.marksObtained,
          feedback: gradeData.feedback,
          graded_at: new Date().toISOString(),
          graded_by: req.user?.id
        })
        .eq('id', submissionId)
        .select(`
          *,
          assignment:assignments(id, title, max_marks),
          student:students(
            id,
            roll_number,
            user:users(id, name, email)
          )
        `)
        .single();

      if (gradeError) {
        logger.error('Failed to grade submission:', gradeError);
        throw new ErrorResponse('Failed to grade submission', 500);
      }

      logger.info(`Submission graded successfully: ${submissionId}`);

      // Send real-time grade update notification to student
      const gradeUpdateData = {
        studentId: gradedSubmission.student.user.id,
        courseId: submission.assignment.course.id,
        assignmentId: assignmentId,
        grade: gradeData.marksObtained,
        maxGrade: submission.assignment.max_marks,
        feedback: gradeData.feedback,
        gradedBy: req.user?.id || '',
        gradedAt: new Date(gradedSubmission.graded_at)
      };

      // await websocketService.sendGradeUpdate(gradeUpdateData);
      logger.info(`Real-time grade notification sent to student: ${gradedSubmission.student.user.id}`);

      // Invalidate cache
      // await cacheService.deletePattern('assignments:*');
      // await cacheService.deletePattern('submissions:*');

      const response: ApiResponse<any> = {
        success: true,
        data: gradedSubmission,
        message: 'Submission graded successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Grade submission error:', error);
      next(error);
    }
  }
];