import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase.js';
import { websocketService } from '../services/websocketService.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';
import { validateRequestZod } from '../middleware/validation.js';
import { z } from 'zod';

// Validation schemas
const createNoticeSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(10).max(5000),
  targetAudience: z.array(z.string()).min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  expiresAt: z.string().datetime().optional()
});

const updateNoticeSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  content: z.string().min(10).max(5000).optional(),
  targetAudience: z.array(z.string()).min(1).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  expiresAt: z.string().datetime().optional()
});

/**
 * Get all notices with filtering and pagination
 * GET /api/v1/notices
 */
export const getNotices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, priority, targetAudience, active = true } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build cache key
    const cacheKey = `notices:${JSON.stringify({ page, limit, priority, targetAudience, active })}`;
    
    // Try to get from cache first
    const cachedResult = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Build query
        let query = supabase
          .from('notices')
          .select(`
            id,
            title,
            content,
            target_audience,
            priority,
            expires_at,
            created_at,
            updated_at,
            author:author_id (
              id,
              profile
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (priority) {
          query = query.eq('priority', priority);
        }

        if (targetAudience) {
          query = query.contains('target_audience', [targetAudience]);
        }

        if (active === 'true') {
          query = query.or('expires_at.is.null,expires_at.gt.now()');
        }

        // Apply pagination
        query = query.range(offset, offset + Number(limit) - 1);

        const { data: notices, error, count } = await query;

        if (error) {
          logger.error('Error fetching notices:', error);
          throw new Error('Failed to fetch notices');
        }

        return {
          notices: notices || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / Number(limit))
          }
        };
      },
      { ttl: 300 } // 5 minutes
    );

    res.status(200).json({
      success: true,
      data: cachedResult,
      message: 'Notices retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getNotices:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get single notice by ID
 * GET /api/v1/notices/:id
 */
export const getNotice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Try cache first
    const cacheKey = `notice:${id}`;
    const cachedNotice = await cacheService.getOrSet(
      cacheKey,
      async () => {
        const { data: notice, error } = await supabase
          .from('notices')
          .select(`
            id,
            title,
            content,
            target_audience,
            priority,
            expires_at,
            created_at,
            updated_at,
            author:author_id (
              id,
              profile
            )
          `)
          .eq('id', id)
          .single();

        if (error || !notice) {
          throw new Error('Notice not found');
        }

        return notice;
      },
      { ttl: 600 } // 10 minutes
    );

    res.status(200).json({
      success: true,
      data: cachedNotice,
      message: 'Notice retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getNotice:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Create new notice with real-time broadcasting
 * POST /api/v1/notices
 */
export const createNotice = [
  validateRequestZod(createNoticeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, content, targetAudience, priority, expiresAt } = req.body;
      const authorId = req.user?.id;

      if (!authorId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      // Create notice in database
      const { data: notice, error } = await supabase
        .from('notices')
        .insert({
          title,
          content,
          target_audience: targetAudience,
          priority,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          author_id: authorId
        })
        .select(`
          id,
          title,
          content,
          target_audience,
          priority,
          expires_at,
          created_at,
          updated_at,
          author:author_id (
            id,
            profile
          )
        `)
        .single();

      if (error) {
        logger.error('Error creating notice:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to create notice'
          }
        });
        return;
      }

      // Invalidate notices cache
      await cacheService.invalidatePattern('notices:*');

      // Broadcast real-time notification
      const noticeData = {
        id: notice.id,
        title: notice.title,
        content: notice.content,
        authorId: authorId,
        targetAudience: notice.target_audience,
        priority: notice.priority,
        createdAt: new Date(notice.created_at)
      };

      // Send real-time notification
      await websocketService.broadcastNotice(noticeData);

      logger.info(`Notice created and broadcasted: ${notice.id} by user ${authorId}`);

      res.status(201).json({
        success: true,
        data: notice,
        message: 'Notice created and broadcasted successfully'
      });
    } catch (error) {
      logger.error('Error in createNotice:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }
];

/**
 * Update existing notice
 * PUT /api/v1/notices/:id
 */
export const updateNotice = [
  validateRequestZod(updateNoticeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, content, targetAudience, priority, expiresAt } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required'
          }
        });
        return;
      }

      // Check if notice exists and user has permission to update
      const { data: existingNotice, error: fetchError } = await supabase
        .from('notices')
        .select('id, author_id')
        .eq('id', id)
        .single();

      if (fetchError || !existingNotice) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOTICE_NOT_FOUND',
            message: 'Notice not found'
          }
        });
        return;
      }

      // Check permission (only author or admin can update)
      if (existingNotice.author_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You can only update your own notices'
          }
        });
        return;
      }

      // Update notice
      const updateData: any = { updated_at: new Date().toISOString() };
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (targetAudience) updateData.target_audience = targetAudience;
      if (priority) updateData.priority = priority;
      if (expiresAt !== undefined) {
        updateData.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null;
      }

      const { data: updatedNotice, error } = await supabase
        .from('notices')
        .update(updateData)
        .eq('id', id)
        .select(`
          id,
          title,
          content,
          target_audience,
          priority,
          expires_at,
          created_at,
          updated_at,
          author:author_id (
            id,
            profile
          )
        `)
        .single();

      if (error) {
        logger.error('Error updating notice:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update notice'
          }
        });
        return;
      }

      // Invalidate cache
      await cacheService.invalidatePattern(`notice:${id}`);
      await cacheService.invalidatePattern('notices:*');

      // Broadcast update notification if significant changes
      if (title || content || targetAudience) {
        const noticeData = {
          id: updatedNotice.id,
          title: updatedNotice.title,
          content: updatedNotice.content,
          authorId: userId,
          targetAudience: updatedNotice.target_audience,
          priority: updatedNotice.priority,
          createdAt: new Date(updatedNotice.updated_at)
        };

        await websocketService.broadcastNotice(noticeData);
      }

      logger.info(`Notice updated: ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: updatedNotice,
        message: 'Notice updated successfully'
      });
    } catch (error) {
      logger.error('Error in updateNotice:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
    }
  }
];

/**
 * Delete notice
 * DELETE /api/v1/notices/:id
 */
export const deleteNotice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required'
        }
      });
      return;
    }

    // Check if notice exists and user has permission to delete
    const { data: existingNotice, error: fetchError } = await supabase
      .from('notices')
      .select('id, author_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingNotice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTICE_NOT_FOUND',
          message: 'Notice not found'
        }
      });
      return;
    }

    // Check permission (only author or admin can delete)
    if (existingNotice.author_id !== userId && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only delete your own notices'
        }
      });
      return;
    }

    // Delete notice
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting notice:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete notice'
        }
      });
      return;
    }

    // Invalidate cache
    await cacheService.invalidatePattern(`notice:${id}`);
    await cacheService.invalidatePattern('notices:*');

    logger.info(`Notice deleted: ${id} by user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteNotice:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Get notices for current user based on their role and audience
 * GET /api/v1/notices/my-notices
 */
export const getMyNotices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required'
        }
      });
      return;
    }

    // Build cache key
    const cacheKey = `my-notices:${user.id}:${JSON.stringify({ page, limit })}`;
    
    // Try cache first
    const cachedResult = await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Build target audiences for the user
        const targetAudiences = [
          'all',
          `role:${user.role}`,
          `institution:${user.institutionId}`,
          ...(user.branchId ? [`branch:${user.branchId}`] : [])
        ];

        // Query notices that target this user
        const { data: notices, error, count } = await supabase
          .from('notices')
          .select(`
            id,
            title,
            content,
            target_audience,
            priority,
            expires_at,
            created_at,
            updated_at,
            author:author_id (
              id,
              profile
            )
          `)
          .overlaps('target_audience', targetAudiences)
          .or('expires_at.is.null,expires_at.gt.now()')
          .order('created_at', { ascending: false })
          .range(offset, offset + Number(limit) - 1);

        if (error) {
          logger.error('Error fetching user notices:', error);
          throw new Error('Failed to fetch your notices');
        }

        return {
          notices: notices || [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / Number(limit))
          }
        };
      },
      { ttl: 120 } // 2 minutes (shorter cache for personalized content)
    );

    res.status(200).json({
      success: true,
      data: cachedResult,
      message: 'Your notices retrieved successfully'
    });
  } catch (error) {
    logger.error('Error in getMyNotices:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }
    });
  }
};