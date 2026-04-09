import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import workoutRoutes from './workouts';
import exerciseRoutes from './exercises';
import nutritionRoutes from './nutrition';
import progressRoutes from './progress';
import gamificationRoutes from './gamification';
import subscriptionRoutes from './subscriptions';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/workouts', workoutRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/progress', progressRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
