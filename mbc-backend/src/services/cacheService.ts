/**
 * Cache Service
 * High-level caching service for frequently accessed data
 */

import redisService, { CACHE_TTL, CACHE_KEYS } from './redisService';
import logger from '@/utils/logger';
import { createClient } from '@supabase/supabase-js';
import config from '@/config/config';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

export interface CacheInvalidationStrategy {
  pattern: string;
  dependencies?: string[];
}

export interface CachedDataOptions {
  ttl?: number;
  prefix?: string;
  invalidationStrategy?: CacheInvalidationStrategy;
}

class CacheService {
  /**
   * Generic cache-aside pattern implementation
   */
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CachedDataOptions = {}
  ): Promise<T> {
    const { ttl = CACHE_TTL.MEDIUM, prefix } = options;

    try {
      // Try to get from cache first
      const cacheOptions = prefix ? { prefix } : {};
      const cached = await redisService.get<T>(key, cacheOptions);
      if (cached !== null) {
        logger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // Cache miss - fetch from source
      logger.debug(`Cache miss for key: ${key}, fetching from source`);
      const data = await fetchFunction();

      // Store in cache
      const setCacheOptions = prefix ? { ttl, prefix } : { ttl };
      await redisService.set(key, data, setCacheOptions);
      
      return data;
    } catch (error) {
      logger.error(`Cache service error for key ${key}:`, error);
      // Fallback to direct fetch if cache fails
      return fetchFunction();
    }
  }

  /**
   * Cache student list with pagination
   */
  async getStudentList(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
    institutionId: string
  ): Promise<any> {
    const cacheKey = `students:list:${institutionId}:${page}:${limit}:${JSON.stringify(filters)}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        const offset = (page - 1) * limit;
        
        let query = supabase
          .from('students')
          .select(`
            id, user_id, roll_number, first_name, last_name, email, phone,
            semester, academic_year, is_active, created_at,
            branch:branches(id, name),
            user:users(id, email, is_active)
          `)
          .eq('institution_id', institutionId)
          .range(offset, offset + limit - 1);

        // Apply filters
        if (filters.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`);
        }
        if (filters.branch) {
          query = query.eq('branch_id', filters.branch);
        }
        if (filters.semester) {
          query = query.eq('semester', filters.semester);
        }
        if (filters.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Get total count for pagination
        let countQuery = supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId);

        if (filters.search) {
          countQuery = countQuery.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`);
        }
        if (filters.branch) {
          countQuery = countQuery.eq('branch_id', filters.branch);
        }
        if (filters.semester) {
          countQuery = countQuery.eq('semester', filters.semester);
        }
        if (filters.isActive !== undefined) {
          countQuery = countQuery.eq('is_active', filters.isActive);
        }

        const { count } = await countQuery;

        return {
          students: data,
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        };
      },
      {
        ttl: CACHE_TTL.SHORT, // Student data changes frequently
        prefix: CACHE_KEYS.STUDENT,
        invalidationStrategy: {
          pattern: `students:*:${institutionId}:*`,
          dependencies: ['student_created', 'student_updated', 'student_deleted']
        }
      }
    );
  }

  /**
   * Cache professor list
   */
  async getProfessorList(institutionId: string, filters: any = {}): Promise<any> {
    const cacheKey = `professors:list:${institutionId}:${JSON.stringify(filters)}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        let query = supabase
          .from('professors')
          .select(`
            id, user_id, employee_id, first_name, last_name, email, phone,
            department, designation, qualification, experience, is_active,
            user:users(id, email, is_active)
          `)
          .eq('institution_id', institutionId);

        if (filters.department) {
          query = query.eq('department', filters.department);
        }
        if (filters.isActive !== undefined) {
          query = query.eq('is_active', filters.isActive);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
      },
      {
        ttl: CACHE_TTL.LONG, // Professor data changes less frequently
        prefix: CACHE_KEYS.PROFESSOR
      }
    );
  }

  /**
   * Cache course list with enrollments
   */
  async getCourseList(institutionId: string, filters: any = {}): Promise<any> {
    const cacheKey = `courses:list:${institutionId}:${JSON.stringify(filters)}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        let query = supabase
          .from('courses')
          .select(`
            id, code, name, description, credits, semester, academic_year, is_active,
            professor:professors(id, first_name, last_name, employee_id),
            branch:branches(id, name),
            _count:course_enrollments(count)
          `)
          .eq('institution_id', institutionId);

        if (filters.semester) {
          query = query.eq('semester', filters.semester);
        }
        if (filters.academicYear) {
          query = query.eq('academic_year', filters.academicYear);
        }
        if (filters.branch) {
          query = query.eq('branch_id', filters.branch);
        }
        if (filters.professor) {
          query = query.eq('professor_id', filters.professor);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
      },
      {
        ttl: CACHE_TTL.LONG,
        prefix: CACHE_KEYS.COURSE
      }
    );
  }

  /**
   * Cache dashboard analytics
   */
  async getDashboardAnalytics(userId: string, role: string, institutionId: string): Promise<any> {
    const cacheKey = `dashboard:analytics:${role}:${userId}:${institutionId}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        const analytics: any = {};

        if (role === 'admin') {
          // Admin dashboard analytics
          const [studentsCount, professorsCount, coursesCount, activeStudents] = await Promise.all([
            supabase.from('students').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
            supabase.from('professors').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
            supabase.from('courses').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId),
            supabase.from('students').select('id', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('is_active', true)
          ]);

          analytics.totalStudents = studentsCount.count || 0;
          analytics.totalProfessors = professorsCount.count || 0;
          analytics.totalCourses = coursesCount.count || 0;
          analytics.activeStudents = activeStudents.count || 0;

          // Recent activities
          const { data: recentNotices } = await supabase
            .from('notices')
            .select('id, title, created_at')
            .eq('institution_id', institutionId)
            .order('created_at', { ascending: false })
            .limit(5);

          analytics.recentNotices = recentNotices || [];

        } else if (role === 'professor') {
          // Professor dashboard analytics
          const { data: professor } = await supabase
            .from('professors')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (professor) {
            const [coursesCount, studentsCount, assignmentsCount] = await Promise.all([
              supabase.from('courses').select('id', { count: 'exact', head: true }).eq('professor_id', professor.id),
              supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).in('course_id', 
                (await supabase.from('courses').select('id').eq('professor_id', professor.id)).data?.map(c => c.id) || []
              ),
              supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('professor_id', professor.id)
            ]);

            analytics.totalCourses = coursesCount.count || 0;
            analytics.totalStudents = studentsCount.count || 0;
            analytics.totalAssignments = assignmentsCount.count || 0;
          }

        } else if (role === 'student') {
          // Student dashboard analytics
          const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', userId)
            .single();

          if (student) {
            const [enrollmentsCount, assignmentsCount, submissionsCount] = await Promise.all([
              supabase.from('course_enrollments').select('id', { count: 'exact', head: true }).eq('student_id', student.id),
              supabase.from('assignments').select('id', { count: 'exact', head: true }).in('course_id',
                (await supabase.from('course_enrollments').select('course_id').eq('student_id', student.id)).data?.map(e => e.course_id) || []
              ),
              supabase.from('assignment_submissions').select('id', { count: 'exact', head: true }).eq('student_id', student.id)
            ]);

            analytics.enrolledCourses = enrollmentsCount.count || 0;
            analytics.totalAssignments = assignmentsCount.count || 0;
            analytics.submittedAssignments = submissionsCount.count || 0;
          }
        }

        return analytics;
      },
      {
        ttl: CACHE_TTL.SHORT, // Dashboard data should be relatively fresh
        prefix: CACHE_KEYS.DASHBOARD
      }
    );
  }

  /**
   * Cache user session data
   */
  async getUserSession(sessionId: string): Promise<any> {
    return redisService.get(`session:${sessionId}`, { prefix: CACHE_KEYS.SESSION });
  }

  async setUserSession(sessionId: string, sessionData: any, ttl: number = CACHE_TTL.SESSION): Promise<boolean> {
    return redisService.set(`session:${sessionId}`, sessionData, { ttl, prefix: CACHE_KEYS.SESSION });
  }

  async deleteUserSession(sessionId: string): Promise<boolean> {
    return redisService.del(`session:${sessionId}`, { prefix: CACHE_KEYS.SESSION });
  }

  /**
   * Cache assignment submissions
   */
  async getAssignmentSubmissions(assignmentId: string, filters: any = {}): Promise<any> {
    const cacheKey = `assignments:${assignmentId}:submissions:${JSON.stringify(filters)}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        let query = supabase
          .from('assignment_submissions')
          .select(`
            id, assignment_id, student_id, submission_text, file_url, submitted_at, is_late,
            student:students(id, roll_number, first_name, last_name),
            marks:assignment_marks(marks_obtained, feedback, graded_at)
          `)
          .eq('assignment_id', assignmentId);

        if (filters.isGraded !== undefined) {
          if (filters.isGraded) {
            query = query.not('marks', 'is', null);
          } else {
            query = query.is('marks', null);
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
      },
      {
        ttl: CACHE_TTL.SHORT,
        prefix: CACHE_KEYS.ASSIGNMENT
      }
    );
  }

  /**
   * Cache notification data
   */
  async getNotifications(userId: string, limit: number = 10): Promise<any> {
    const cacheKey = `notifications:user:${userId}:${limit}`;
    
    return this.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data;
      },
      {
        ttl: CACHE_TTL.SHORT,
        prefix: CACHE_KEYS.NOTIFICATION
      }
    );
  }

  /**
   * Delete cache pattern (alias for invalidatePattern)
   */
  async deletePattern(pattern: string, prefix?: string): Promise<number> {
    return this.invalidatePattern(pattern, prefix);
  }

  /**
   * Invalidate cache patterns
   */
  async invalidatePattern(pattern: string, prefix?: string): Promise<number> {
    try {
      const cacheOptions = prefix ? { prefix } : {};
      const deletedCount = await redisService.delPattern(pattern, cacheOptions);
      logger.info(`Invalidated ${deletedCount} cache entries for pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate user-specific cache
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      this.invalidatePattern(`*:${userId}:*`, CACHE_KEYS.USER),
      this.invalidatePattern(`*:${userId}:*`, CACHE_KEYS.DASHBOARD),
      this.invalidatePattern(`*:${userId}:*`, CACHE_KEYS.NOTIFICATION)
    ]);
  }

  /**
   * Invalidate student-related cache
   */
  async invalidateStudentCache(institutionId: string, studentId?: string): Promise<void> {
    const patterns = [
      `students:*:${institutionId}:*`,
      'dashboard:analytics:*'
    ];

    if (studentId) {
      patterns.push(`*:${studentId}:*`);
    }

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));
  }

  /**
   * Invalidate course-related cache
   */
  async invalidateCourseCache(institutionId: string, courseId?: string): Promise<void> {
    const patterns = [
      `courses:*:${institutionId}:*`,
      'dashboard:analytics:*'
    ];

    if (courseId) {
      patterns.push(`*:${courseId}:*`);
    }

    await Promise.all(patterns.map(pattern => this.invalidatePattern(pattern)));
  }

  /**
   * Warm up cache for frequently accessed data
   */
  async warmUpCache(institutionId: string): Promise<void> {
    try {
      logger.info(`Starting cache warm-up for institution: ${institutionId}`);

      // Warm up student list (first page)
      await this.getStudentList(1, 20, {}, institutionId);
      
      // Warm up professor list
      await this.getProfessorList(institutionId);
      
      // Warm up course list
      await this.getCourseList(institutionId);

      logger.info(`Cache warm-up completed for institution: ${institutionId}`);
    } catch (error) {
      logger.error(`Cache warm-up failed for institution ${institutionId}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const info = await redisService.getInfo();
      return {
        redis: info,
        cacheKeys: CACHE_KEYS,
        cacheTTL: CACHE_TTL
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;