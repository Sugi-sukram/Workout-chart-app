export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type SubscriptionTier = 'free' | 'premium' | 'elite';

export type Goal =
  | 'lose_weight'
  | 'build_muscle'
  | 'maintain'
  | 'improve_fitness'
  | 'gain_strength';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Gender = 'male' | 'female' | 'other';

export type ExerciseCategory =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'cardio'
  | 'stretching'
  | 'other';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type XPEventType =
  | 'workout_completed'
  | 'streak_bonus'
  | 'achievement_unlocked'
  | 'daily_login'
  | 'nutrition_logged'
  | 'body_metric_logged'
  | 'first_workout'
  | 'personal_record';

export type AchievementCategory =
  | 'workout'
  | 'nutrition'
  | 'streak'
  | 'strength'
  | 'consistency'
  | 'social'
  | 'milestone';
