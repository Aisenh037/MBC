/**
 * AI Routes
 * Handles AI-powered features including recommendations and analytics
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import express from 'express';
import {
  getCourseRecommendations,
  getPerformancePredictions,
  getAnalyticsInsights,
  analyzeSentiment
} from '@/controllers/aiController';
import { protect } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { sentimentAnalysisSchema } from '@/utils/validationSchemas';

const router = express.Router();

// Apply authentication to all AI routes
router.use(protect);

/**
 * @swagger
 * /api/v1/ai/recommendations/courses/{studentId}:
 *   get:
 *     summary: Get course recommendations for a student
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Course recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           courseId:
 *                             type: string
 *                           courseName:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           reasons:
 *                             type: array
 *                             items:
 *                               type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/recommendations/courses/:studentId', getCourseRecommendations);

/**
 * @swagger
 * /api/v1/ai/predictions/performance/{studentId}:
 *   get:
 *     summary: Get performance predictions for a student
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Performance predictions generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/predictions/performance/:studentId', getPerformancePredictions);

/**
 * @swagger
 * /api/v1/ai/analytics/insights:
 *   get:
 *     summary: Get AI analytics insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI analytics insights generated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/analytics/insights', getAnalyticsInsights);

/**
 * @swagger
 * /api/v1/ai/sentiment/analyze:
 *   post:
 *     summary: Analyze sentiment of feedback text
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to analyze for sentiment
 *     responses:
 *       200:
 *         description: Sentiment analysis completed successfully
 *       400:
 *         description: Bad request - text is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/sentiment/analyze', validateRequest(sentimentAnalysisSchema), analyzeSentiment);

export default router;