import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addBodyMetricSchema, metricsQuerySchema } from '../utils/validators';
import * as progressController from '../controllers/progress.controller';

const router = Router();

// All progress routes require authentication
router.use(authMiddleware);

// GET /api/progress/metrics - Get body metrics history
router.get(
  '/metrics',
  validate({ query: metricsQuerySchema }),
  progressController.getMetrics
);

// POST /api/progress/metrics - Add body metric
router.post(
  '/metrics',
  validate({ body: addBodyMetricSchema }),
  progressController.addMetric
);

// GET /api/progress/metrics/latest - Get latest body metric
router.get('/metrics/latest', progressController.getLatestMetric);

// DELETE /api/progress/metrics/:id - Delete body metric
router.delete('/metrics/:id', progressController.deleteMetric);

// GET /api/progress/stats - Get overall progress stats
router.get('/stats', progressController.getWorkoutStats);

export default router;
