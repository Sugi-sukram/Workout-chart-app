import { z } from 'zod';

// ─── Common ──────────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const uuidParam = z.object({
  id: z.string().uuid(),
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// ─── Users / Profile ─────────────────────────────────────────────────────────

export const createProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(500).optional(),
  goal: z
    .enum(['lose_weight', 'build_muscle', 'maintain', 'improve_fitness', 'gain_strength'])
    .optional(),
  activityLevel: z
    .enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  equipment: z.array(z.string()).optional(),
  dietaryPrefs: z.array(z.string()).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoUrl: z.string().url().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  height: z.number().positive().max(300).optional(),
  weight: z.number().positive().max(500).optional(),
  goal: z
    .enum(['lose_weight', 'build_muscle', 'maintain', 'improve_fitness', 'gain_strength'])
    .optional(),
  activityLevel: z
    .enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'])
    .optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  equipment: z.array(z.string()).optional(),
  dietaryPrefs: z.array(z.string()).optional(),
  isOnboarded: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
  unitSystem: z.enum(['metric', 'imperial']).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  notifications: z.boolean().optional(),
  language: z.string().min(2).max(5).optional(),
});

// ─── Workouts ────────────────────────────────────────────────────────────────

export const startWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(200),
  templateId: z.string().uuid().optional(),
});

export const addExerciseToWorkoutSchema = z.object({
  exerciseId: z.string().uuid('Invalid exercise ID'),
  orderIndex: z.number().int().min(0),
  supersetGroup: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  sets: z
    .array(
      z.object({
        setNumber: z.number().int().min(1),
        weight: z.number().min(0).optional(),
        reps: z.number().int().min(0).optional(),
        duration: z.number().int().min(0).optional(),
        distance: z.number().min(0).optional(),
        rpe: z.number().min(1).max(10).optional(),
        rir: z.number().int().min(0).max(10).optional(),
        isWarmup: z.boolean().default(false),
        isDropSet: z.boolean().default(false),
        isFailure: z.boolean().default(false),
        restSeconds: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

export const updateSetSchema = z.object({
  weight: z.number().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  duration: z.number().int().min(0).optional(),
  distance: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().int().min(0).max(10).optional(),
  isWarmup: z.boolean().optional(),
  isDropSet: z.boolean().optional(),
  isFailure: z.boolean().optional(),
  completed: z.boolean().optional(),
  restSeconds: z.number().int().min(0).optional(),
});

export const finishWorkoutSchema = z.object({
  completedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  totalVolume: z.number().min(0).optional(),
  totalSets: z.number().int().min(0).optional(),
  totalReps: z.number().int().min(0).optional(),
  exerciseCount: z.number().int().min(0).optional(),
  xpEarned: z.number().int().min(0).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  exercisesJson: z.array(
    z.object({
      exerciseId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
      supersetGroup: z.string().optional(),
      sets: z.array(
        z.object({
          setNumber: z.number().int().min(1),
          weight: z.number().min(0).optional(),
          reps: z.number().int().min(0).optional(),
          duration: z.number().int().min(0).optional(),
          distance: z.number().min(0).optional(),
          isWarmup: z.boolean().default(false),
          restSeconds: z.number().int().min(0).optional(),
        })
      ),
    })
  ),
  estimatedDuration: z.number().int().min(0).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

// ─── Exercises ───────────────────────────────────────────────────────────────

export const searchExercisesQuerySchema = z.object({
  q: z.string().min(1).optional(),
  category: z
    .enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio', 'stretching', 'other'])
    .optional(),
  muscle: z.string().optional(),
  equipment: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  isCompound: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Nutrition ───────────────────────────────────────────────────────────────

export const searchFoodsQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  barcode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createCustomFoodSchema = z.object({
  name: z.string().min(1, 'Food name is required').max(200),
  brand: z.string().max(200).optional(),
  servingSize: z.number().positive('Serving size must be positive'),
  servingUnit: z.string().min(1, 'Serving unit is required').max(50),
  calories: z.number().min(0, 'Calories cannot be negative'),
  protein: z.number().min(0, 'Protein cannot be negative'),
  carbs: z.number().min(0, 'Carbs cannot be negative'),
  fat: z.number().min(0, 'Fat cannot be negative'),
  fiber: z.number().min(0).default(0),
  sugar: z.number().min(0).default(0),
  sodium: z.number().min(0).default(0),
  barcode: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
});

export const addMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodItemId: z.string().uuid('Invalid food item ID'),
  servingCount: z.number().positive('Serving count must be positive').default(1),
});

export const updateWaterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  waterMl: z.number().int().min(0, 'Water amount cannot be negative').max(20000),
});

export const updateMacroGoalsSchema = z.object({
  calories: z.number().int().positive().max(10000).optional(),
  protein: z.number().int().min(0).max(1000).optional(),
  carbs: z.number().int().min(0).max(2000).optional(),
  fat: z.number().int().min(0).max(1000).optional(),
  fiber: z.number().int().min(0).max(200).optional(),
  waterMl: z.number().int().min(0).max(20000).optional(),
});

// ─── Progress / Body Metrics ─────────────────────────────────────────────────

export const addBodyMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  weight: z.number().positive().max(500).optional(),
  bodyFat: z.number().min(1).max(60).optional(),
  chest: z.number().positive().max(200).optional(),
  waist: z.number().positive().max(200).optional(),
  hips: z.number().positive().max(200).optional(),
  leftArm: z.number().positive().max(100).optional(),
  rightArm: z.number().positive().max(100).optional(),
  leftThigh: z.number().positive().max(100).optional(),
  rightThigh: z.number().positive().max(100).optional(),
});

export const metricsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format').optional(),
  metric: z
    .enum(['weight', 'bodyFat', 'chest', 'waist', 'hips', 'leftArm', 'rightArm', 'leftThigh', 'rightThigh'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(365).default(30),
});

// ─── Gamification ────────────────────────────────────────────────────────────

export const addXPEventSchema = z.object({
  type: z.enum([
    'workout_completed',
    'streak_bonus',
    'achievement_unlocked',
    'daily_login',
    'nutrition_logged',
    'body_metric_logged',
    'first_workout',
    'personal_record',
  ]),
  xpAmount: z.number().int().positive('XP amount must be positive'),
  description: z.string().max(500).optional(),
});

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const startTrialSchema = z.object({
  tier: z.enum(['premium', 'elite']),
});

export const checkoutSchema = z.object({
  tier: z.enum(['premium', 'elite']),
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
});

// ─── Export all schemas grouped ──────────────────────────────────────────────

export const schemas = {
  common: {
    pagination: paginationQuerySchema,
    uuid: uuidParam,
  },
  auth: {
    signup: signupSchema,
    login: loginSchema,
    refreshToken: refreshTokenSchema,
    resetPassword: resetPasswordSchema,
    changePassword: changePasswordSchema,
  },
  users: {
    createProfile: createProfileSchema,
    updateProfile: updateProfileSchema,
    updatePreferences: updatePreferencesSchema,
  },
  workouts: {
    start: startWorkoutSchema,
    addExercise: addExerciseToWorkoutSchema,
    updateSet: updateSetSchema,
    finish: finishWorkoutSchema,
    createTemplate: createTemplateSchema,
  },
  exercises: {
    search: searchExercisesQuerySchema,
  },
  nutrition: {
    searchFoods: searchFoodsQuerySchema,
    createCustomFood: createCustomFoodSchema,
    addMeal: addMealSchema,
    updateWater: updateWaterSchema,
    updateMacroGoals: updateMacroGoalsSchema,
  },
  progress: {
    addBodyMetric: addBodyMetricSchema,
    metricsQuery: metricsQuerySchema,
  },
  gamification: {
    addXPEvent: addXPEventSchema,
  },
  subscriptions: {
    startTrial: startTrialSchema,
    checkout: checkoutSchema,
  },
} as const;
