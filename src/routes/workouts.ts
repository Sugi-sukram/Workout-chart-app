import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  startWorkoutSchema,
  addExerciseToWorkoutSchema,
  updateSetSchema,
  finishWorkoutSchema,
  createTemplateSchema,
  paginationQuerySchema,
} from '../utils/validators';
import * as workoutController from '../controllers/workout.controller';

const router = Router();

// All workout routes require authentication
router.use(authMiddleware);

// GET /api/workouts - List user's workouts
router.get(
  '/',
  validate({ query: paginationQuerySchema }),
  workoutController.getHistory
);

// POST /api/workouts - Start a new workout
router.post(
  '/',
  validate({ body: startWorkoutSchema }),
  workoutController.startWorkout
);

// GET /api/workouts/active - Get current active workout
router.get('/active', workoutController.getActiveWorkout);

// ─── Templates (must be before /:id) ────────────────────────────────────────

// GET /api/workouts/templates/all - List templates
router.get('/templates/all', workoutController.getTemplates);

// POST /api/workouts/templates - Create template
router.post(
  '/templates',
  validate({ body: createTemplateSchema }),
  workoutController.saveTemplate
);

// DELETE /api/workouts/templates/:id - Delete template
router.delete('/templates/:id', workoutController.deleteTemplate);

// ─── Workout by ID ──────────────────────────────────────────────────────────

// GET /api/workouts/:id - Get workout by ID
router.get('/:id', workoutController.getDetail);

// POST /api/workouts/:id/exercises - Add exercise to workout
router.post(
  '/:id/exercises',
  validate({ body: addExerciseToWorkoutSchema }),
  workoutController.addExercise
);

// PATCH /api/workouts/:workoutId/sets/:setId - Update a set
router.patch(
  '/:workoutId/sets/:setId',
  validate({ body: updateSetSchema }),
  workoutController.updateSet
);

// POST /api/workouts/:id/finish - Finish a workout
router.post(
  '/:id/finish',
  validate({ body: finishWorkoutSchema }),
  workoutController.finishWorkout
);

// DELETE /api/workouts/:id - Delete a workout
router.delete('/:id', workoutController.cancelWorkout);

export default router;
