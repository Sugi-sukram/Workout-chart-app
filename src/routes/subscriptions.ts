import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { startTrialSchema, checkoutSchema } from '../utils/validators';
import * as subscriptionController from '../controllers/subscription.controller';

const router = Router();

// All subscription routes require authentication
router.use(authMiddleware);

// GET /api/subscriptions/status - Get current subscription status
router.get('/status', subscriptionController.getSubscription);

// GET /api/subscriptions/tiers - Get available tiers
router.get('/tiers', subscriptionController.getTiers);

// POST /api/subscriptions/trial - Start a free trial
router.post(
  '/trial',
  validate({ body: startTrialSchema }),
  subscriptionController.startTrial
);

// POST /api/subscriptions/checkout - Create Stripe checkout session
router.post(
  '/checkout',
  validate({ body: checkoutSchema }),
  subscriptionController.createCheckout
);

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// POST /api/subscriptions/webhook - Stripe webhook (no auth)
// Note: This route is mounted separately in index.ts with raw body parsing

export default router;
