import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { addXPEventSchema } from '../utils/validators';
import * as gamificationController from '../controllers/gamification.controller';

const router = Router();

// All gamification routes require authentication
router.use(authMiddleware);

// GET /api/gamification/profile - Get gamification profile (level, XP, streak)
router.get('/profile', gamificationController.getXPData);

// POST /api/gamification/xp - Add XP event
router.post(
  '/xp',
  validate({ body: addXPEventSchema }),
  gamificationController.addXPEvent
);

// GET /api/gamification/xp/history - Get XP event history
router.get('/xp/history', gamificationController.getXPHistory);

// GET /api/gamification/achievements - Get all achievements with user progress
router.get('/achievements', gamificationController.getAchievements);

// GET /api/gamification/leaderboard - Get leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);

export default router;
