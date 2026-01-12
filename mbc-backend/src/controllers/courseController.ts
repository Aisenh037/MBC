/**
 * Course Controller
 * TypeScript implementation with proper interfaces and validation
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ErrorResponse } from '@/utils/errorResponse';
import { validateRequestZod } from '@/middleware/validation';
import { 
  CreateCourseRequest, 
  UpdateCourseRequest, 
  CourseResponse,
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
const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(10),
  semester: z.number().int().min(1).max(8),
  branchId: z.string().uuid('Valid branch ID is required'),
  institutionId: z.string().uuid('Valid institution ID is required'),
  professorId: z.string().uuid('Valid professor ID is required'),
  syllabus: z.string().optional(),
  prerequisites: z.array(z.string().uuid()).optional(),
  isElective: z.boolean().default(false),
  maxStudents: z.number().int().min(1).optional()
});

const updateCourseSchema = createCourseSchema.partial();

/**
 * Get all courses
 * @route GET /api/v1/courses
 * @access Private (Admin, Professor, Student)
 */
export const getCourses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, branchId, semester, professorId } = req.query;
    
    // Build query
    let query = supabase
      .from('courses')
      .select(`
        *,
        branch:branches(id, name),
        institution:institutions(id, name),
        professor:professors(
          id,
          employee_id,
          user:users(id, name, email)
        ),
        enrollments:course_enrollments(count)
      `);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    if (professorId) {
      query = query.eq('professor_id', professorId);
    }

    // Apply tenant isolation (non-admin users can only see their institution's courses)
    if (req.user?.role !== 'admin' && req.user?.institutionId) {
      query = query.eq('institution_id', req.user.institutionId);
    }

    // For students, only show courses they can enroll in or are enrolled in
    if (req.user?.role === 'student') {
      // Get student's branch and semester
      const { data: student } = await supabase
        .from('students')
        .select('branch_id, semester')
        .eq('user_id', req.user.id)
        .single();

      if (student) {
        query = query.eq('branch_id', student.branch_id);
        // Show courses for current semester and electives
        query = query.or(`semester.eq.${student.semester},is_elective.eq.true`);
      }
    }

    // For professors, show courses they teach or can teach
    if (req.user?.role === 'professor') {
      const { data: professor } = await supabase
        .from('professors')
        .select('id, professor_branches(branch_id)')
        .eq('user_id', req.user.id)
        .single();

      if (professor) {
        const branchIds = professor.professor_branches?.map((pb: any) => pb.branch_id) || [];
        if (branchIds.length > 0) {
          query = query.in('branch_id', branchIds);
        }
      }
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: courses, error, count } = await query;

    if (error) {
      logger.error('Error fetching courses:', error);
      throw new ErrorResponse('Failed to fetch courses', 500);
    }

    const response: ApiResponse<CourseResponse[]> = {
      success: true,
      count: count || 0,
      data: courses || [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get courses error:', error);
    next(error);
  }
};

/**
 * Get single course
 * @route GET /api/v1/courses/:id
 * @access Private (Admin, Professor, Student)
 */
export const getCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        branch:branches(id, name),
        institution:institutions(id, name),
        professor:professors(
          id,
          employee_id,
          department,
          user:users(id, name, email)
        ),
        prerequisites:course_prerequisites(
          prerequisite:courses(id, name, code)
        ),
        enrollments:course_enrollments(
          id,
          enrolled_at,
          student:students(
            id,
            roll_number,
            user:users(id, name, email)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !course) {
      throw new ErrorResponse('Course not found', 404);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== course.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // For students, check if they can access this course
    if (req.user?.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('branch_id, semester')
        .eq('user_id', req.user.id)
        .single();

      if (student) {
        const canAccess = course.branch_id === student.branch_id && 
                         (course.semester === student.semester || course.is_elective);
        
        if (!canAccess) {
          // Check if student is enrolled
          const isEnrolled = course.enrollments?.some((e: any) => e.student?.user?.id === req.user?.id);
          if (!isEnrolled) {
            throw new ErrorResponse('Access denied', 403);
          }
        }
      }
    }

    const response: ApiResponse<CourseResponse> = {
      success: true,
      data: course
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get course error:', error);
    next(error);
  }
};

/**
 * Create new course
 * @route POST /api/v1/courses
 * @access Private (Admin, Professor)
 */
export const createCourse = [
  validateRequestZod(createCourseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const courseData = req.body as CreateCourseRequest;

      // Check if course code already exists in the same branch
      const { data: existingCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('code', courseData.code)
        .eq('branch_id', courseData.branchId)
        .single();

      if (existingCourse) {
        throw new ErrorResponse('Course code already exists in this branch', 400);
      }

      // Verify professor exists and can teach in this branch
      const { data: professor, error: profError } = await supabase
        .from('professors')
        .select(`
          id,
          institution_id,
          professor_branches(branch_id)
        `)
        .eq('id', courseData.professorId)
        .single();

      if (profError || !professor) {
        throw new ErrorResponse('Professor not found', 404);
      }

      // Check if professor can teach in this branch
      const canTeachInBranch = professor.professor_branches?.some(
        (pb: any) => pb.branch_id === courseData.branchId
      );

      if (!canTeachInBranch) {
        throw new ErrorResponse('Professor is not assigned to this branch', 400);
      }

      // Apply tenant isolation
      if (req.user?.role !== 'admin' && req.user?.institutionId !== professor.institution_id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // For professor role, ensure they can only create courses for themselves
      if (req.user?.role === 'professor') {
        const { data: currentProf } = await supabase
          .from('professors')
          .select('id')
          .eq('user_id', req.user.id)
          .single();

        if (!currentProf || currentProf.id !== courseData.professorId) {
          throw new ErrorResponse('Professors can only create courses for themselves', 403);
        }
      }

      // Verify prerequisites exist if provided
      if (courseData.prerequisites && courseData.prerequisites.length > 0) {
        const { data: prereqCourses, error: prereqError } = await supabase
          .from('courses')
          .select('id')
          .in('id', courseData.prerequisites);

        if (prereqError || !prereqCourses || prereqCourses.length !== courseData.prerequisites.length) {
          throw new ErrorResponse('One or more prerequisite courses are invalid', 400);
        }
      }

      // Create course record
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: courseData.name,
          code: courseData.code,
          description: courseData.description,
          credits: courseData.credits,
          semester: courseData.semester,
          branch_id: courseData.branchId,
          institution_id: courseData.institutionId,
          professor_id: courseData.professorId,
          syllabus: courseData.syllabus,
          is_elective: courseData.isElective,
          max_students: courseData.maxStudents,
          created_by: req.user?.id
        })
        .select(`
          *,
          branch:branches(id, name),
          institution:institutions(id, name),
          professor:professors(
            id,
            employee_id,
            user:users(id, name, email)
          )
        `)
        .single();

      if (courseError) {
        logger.error('Failed to create course record:', courseError);
        throw new ErrorResponse('Failed to create course', 500);
      }

      // Create prerequisite associations if provided
      if (courseData.prerequisites && courseData.prerequisites.length > 0) {
        const prerequisiteAssociations = courseData.prerequisites.map(prereqId => ({
          course_id: course.id,
          prerequisite_id: prereqId
        }));

        const { error: prereqAssocError } = await supabase
          .from('course_prerequisites')
          .insert(prerequisiteAssociations);

        if (prereqAssocError) {
          logger.error('Failed to create prerequisite associations:', prereqAssocError);
          // Don't fail the entire operation, just log the error
        }
      }

      logger.info(`Course created successfully: ${courseData.code} - ${courseData.name}`);

      const response: ApiResponse<CourseResponse> = {
        success: true,
        data: course,
        message: 'Course created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Create course error:', error);
      next(error);
    }
  }
];

/**
 * Update course
 * @route PUT /api/v1/courses/:id
 * @access Private (Admin, Professor - own courses)
 */
export const updateCourse = [
  validateRequestZod(updateCourseSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body as UpdateCourseRequest;

      // Get existing course
      const { data: existingCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*, professor:professors(user_id)')
        .eq('id', id)
        .single();

      if (fetchError || !existingCourse) {
        throw new ErrorResponse('Course not found', 404);
      }

      // Check authorization - professors can only update their own courses
      if (req.user?.role === 'professor' && existingCourse.professor?.user_id !== req.user.id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Apply tenant isolation
      if (req.user?.role !== 'admin' && req.user?.institutionId !== existingCourse.institution_id) {
        throw new ErrorResponse('Access denied', 403);
      }

      // Check for course code conflicts if code is being updated
      if (updateData.code && updateData.code !== existingCourse.code) {
        const { data: codeConflict } = await supabase
          .from('courses')
          .select('id')
          .eq('code', updateData.code)
          .eq('branch_id', updateData.branchId || existingCourse.branch_id)
          .neq('id', id)
          .single();

        if (codeConflict) {
          throw new ErrorResponse('Course code already exists in this branch', 400);
        }
      }

      // Verify professor if being updated
      if (updateData.professorId && updateData.professorId !== existingCourse.professor_id) {
        const { data: professor, error: profError } = await supabase
          .from('professors')
          .select(`
            id,
            institution_id,
            professor_branches(branch_id)
          `)
          .eq('id', updateData.professorId)
          .single();

        if (profError || !professor) {
          throw new ErrorResponse('Professor not found', 404);
        }

        // Check if professor can teach in this branch
        const branchId = updateData.branchId || existingCourse.branch_id;
        const canTeachInBranch = professor.professor_branches?.some(
          (pb: any) => pb.branch_id === branchId
        );

        if (!canTeachInBranch) {
          throw new ErrorResponse('Professor is not assigned to this branch', 400);
        }
      }

      // Verify prerequisites if being updated
      if (updateData.prerequisites) {
        if (updateData.prerequisites.length > 0) {
          const { data: prereqCourses, error: prereqError } = await supabase
            .from('courses')
            .select('id')
            .in('id', updateData.prerequisites);

          if (prereqError || !prereqCourses || prereqCourses.length !== updateData.prerequisites.length) {
            throw new ErrorResponse('One or more prerequisite courses are invalid', 400);
          }
        }

        // Update prerequisite associations
        // Delete existing prerequisites
        await supabase
          .from('course_prerequisites')
          .delete()
          .eq('course_id', id);

        // Create new prerequisites if any
        if (updateData.prerequisites.length > 0) {
          const prerequisiteAssociations = updateData.prerequisites.map(prereqId => ({
            course_id: id,
            prerequisite_id: prereqId
          }));

          const { error: prereqAssocError } = await supabase
            .from('course_prerequisites')
            .insert(prerequisiteAssociations);

          if (prereqAssocError) {
            logger.error('Failed to update prerequisite associations:', prereqAssocError);
            throw new ErrorResponse('Failed to update prerequisite associations', 500);
          }
        }
      }

      // Update course record
      const { data: updatedCourse, error: updateError } = await supabase
        .from('courses')
        .update({
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.code && { code: updateData.code }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.credits && { credits: updateData.credits }),
          ...(updateData.semester && { semester: updateData.semester }),
          ...(updateData.branchId && { branch_id: updateData.branchId }),
          ...(updateData.professorId && { professor_id: updateData.professorId }),
          ...(updateData.syllabus !== undefined && { syllabus: updateData.syllabus }),
          ...(updateData.isElective !== undefined && { is_elective: updateData.isElective }),
          ...(updateData.maxStudents !== undefined && { max_students: updateData.maxStudents }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          branch:branches(id, name),
          institution:institutions(id, name),
          professor:professors(
            id,
            employee_id,
            user:users(id, name, email)
          ),
          prerequisites:course_prerequisites(
            prerequisite:courses(id, name, code)
          )
        `)
        .single();

      if (updateError) {
        logger.error('Failed to update course record:', updateError);
        throw new ErrorResponse('Failed to update course', 500);
      }

      logger.info(`Course updated successfully: ${id}`);

      const response: ApiResponse<CourseResponse> = {
        success: true,
        data: updatedCourse,
        message: 'Course updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Update course error:', error);
      next(error);
    }
  }
];

/**
 * Delete course
 * @route DELETE /api/v1/courses/:id
 * @access Private (Admin, Professor - own courses)
 */
export const deleteCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Get course with professor info
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('*, professor:professors(user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !course) {
      throw new ErrorResponse('Course not found', 404);
    }

    // Check authorization - professors can only delete their own courses
    if (req.user?.role === 'professor' && course.professor?.user_id !== req.user.id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== course.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Check if course has enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', id)
      .limit(1);

    if (enrollmentError) {
      logger.error('Error checking course enrollments:', enrollmentError);
      throw new ErrorResponse('Failed to check course enrollments', 500);
    }

    if (enrollments && enrollments.length > 0) {
      throw new ErrorResponse('Cannot delete course with active enrollments', 400);
    }

    // Delete prerequisite associations
    await supabase
      .from('course_prerequisites')
      .delete()
      .eq('course_id', id);

    // Delete courses that have this as a prerequisite
    await supabase
      .from('course_prerequisites')
      .delete()
      .eq('prerequisite_id', id);

    // Delete course record (this will cascade to related records)
    const { error: deleteCourseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (deleteCourseError) {
      logger.error('Failed to delete course record:', deleteCourseError);
      throw new ErrorResponse('Failed to delete course', 500);
    }

    logger.info(`Course deleted successfully: ${id}`);

    const response: ApiResponse<{}> = {
      success: true,
      data: {},
      message: 'Course deleted successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('Delete course error:', error);
    next(error);
  }
};

/**
 * Enroll student in course
 * @route POST /api/v1/courses/:id/enroll
 * @access Private (Student - own enrollment, Admin, Professor)
 */
export const enrollInCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: courseId } = req.params;
    const { studentId } = req.body;

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, enrollments:course_enrollments(count)')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new ErrorResponse('Course not found', 404);
    }

    // Determine which student to enroll
    let targetStudentId = studentId;
    if (req.user?.role === 'student') {
      // Students can only enroll themselves
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!student) {
        throw new ErrorResponse('Student record not found', 404);
      }

      targetStudentId = student.id;
    } else if (!studentId) {
      throw new ErrorResponse('Student ID is required', 400);
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, user:users(id, name, email)')
      .eq('id', targetStudentId)
      .single();

    if (studentError || !student) {
      throw new ErrorResponse('Student not found', 404);
    }

    // Apply tenant isolation
    if (req.user?.role !== 'admin' && req.user?.institutionId !== student.institution_id) {
      throw new ErrorResponse('Access denied', 403);
    }

    // Check if student is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', targetStudentId)
      .single();

    if (existingEnrollment) {
      throw new ErrorResponse('Student is already enrolled in this course', 400);
    }

    // Check course capacity
    if (course.max_students && course.enrollments?.[0]?.count >= course.max_students) {
      throw new ErrorResponse('Course is at maximum capacity', 400);
    }

    // Check prerequisites
    const { data: prerequisites } = await supabase
      .from('course_prerequisites')
      .select('prerequisite_id')
      .eq('course_id', courseId);

    if (prerequisites && prerequisites.length > 0) {
      const prereqIds = prerequisites.map(p => p.prerequisite_id);
      
      // Check if student has completed all prerequisites
      const { data: completedCourses } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', targetStudentId)
        .eq('status', 'completed')
        .in('course_id', prereqIds);

      const completedPrereqIds = completedCourses?.map(c => c.course_id) || [];
      const missingPrereqs = prereqIds.filter(id => !completedPrereqIds.includes(id));

      if (missingPrereqs.length > 0) {
        throw new ErrorResponse('Student has not completed all prerequisite courses', 400);
      }
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        course_id: courseId,
        student_id: targetStudentId,
        enrolled_at: new Date().toISOString(),
        status: 'active'
      })
      .select(`
        *,
        course:courses(id, name, code),
        student:students(
          id,
          roll_number,
          user:users(id, name, email)
        )
      `)
      .single();

    if (enrollmentError) {
      logger.error('Failed to create enrollment:', enrollmentError);
      throw new ErrorResponse('Failed to enroll student in course', 500);
    }

    logger.info(`Student enrolled successfully: ${student.user?.email} in course ${course.code}`);

    const response: ApiResponse<any> = {
      success: true,
      data: enrollment,
      message: 'Student enrolled successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Enroll in course error:', error);
    next(error);
  }
};