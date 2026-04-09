import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  searchFoodsQuerySchema,
  createCustomFoodSchema,
  addMealSchema,
  updateWaterSchema,
  updateMacroGoalsSchema,
} from '../utils/validators';
import * as nutritionController from '../controllers/nutrition.controller';

const router = Router();

// All nutrition routes require authentication
router.use(authMiddleware);

// ─── Food Items ──────────────────────────────────────────────────────────────

// GET /api/nutrition/foods - Search foods
router.get(
  '/foods',
  validate({ query: searchFoodsQuerySchema }),
  nutritionController.searchFoods
);

// POST /api/nutrition/foods - Create custom food
router.post(
  '/foods',
  validate({ body: createCustomFoodSchema }),
  nutritionController.createCustomFood
);

// ─── Meals / Logs ────────────────────────────────────────────────────────────

// GET /api/nutrition/logs?date=YYYY-MM-DD - Get meals for a date
router.get('/logs', nutritionController.getDailyLog);

// POST /api/nutrition/logs - Log a meal
router.post(
  '/logs',
  validate({ body: addMealSchema }),
  nutritionController.addMeal
);

// DELETE /api/nutrition/logs/:id - Delete a meal log
router.delete('/logs/:id', nutritionController.removeMeal);

// ─── Water ───────────────────────────────────────────────────────────────────

// GET /api/nutrition/water?date=YYYY-MM-DD - Get water for a date
router.get('/water', nutritionController.getWater);

// PUT /api/nutrition/water - Update water for a date
router.put(
  '/water',
  validate({ body: updateWaterSchema }),
  nutritionController.updateWater
);

// ─── Macro Goals ─────────────────────────────────────────────────────────────

// GET /api/nutrition/goals - Get macro goals
router.get('/goals', nutritionController.getMacroGoals);

// PUT /api/nutrition/goals - Update macro goals
router.put(
  '/goals',
  validate({ body: updateMacroGoalsSchema }),
  nutritionController.updateMacroGoals
);

// ─── Daily Summary ───────────────────────────────────────────────────────────

// GET /api/nutrition/summary?date=YYYY-MM-DD - Get daily nutrition summary
router.get('/summary', nutritionController.getDailySummary);

export default router;
