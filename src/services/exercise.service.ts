import { prisma } from '../config/database';
import { cache } from '../config/redis';
import { NotFoundError } from '../utils/errors';

export async function search(query: {
  q?: string;
  category?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  isCompound?: boolean;
  page: number;
  limit: number;
}) {
  const cacheKey = `exercises:search:${JSON.stringify(query)}`;
  const cached = await cache.get<{ exercises: unknown[]; total: number; page: number; limit: number }>(cacheKey);
  if (cached) return cached;

  const where: Record<string, unknown> = {};

  if (query.q) {
    where.name = { contains: query.q, mode: 'insensitive' };
  }
  if (query.category) {
    where.category = query.category;
  }
  if (query.muscle) {
    where.primaryMuscles = { has: query.muscle };
  }
  if (query.equipment) {
    where.equipment = { has: query.equipment };
  }
  if (query.difficulty) {
    where.difficulty = query.difficulty;
  }
  if (query.isCompound !== undefined) {
    where.isCompound = query.isCompound;
  }

  const skip = (query.page - 1) * query.limit;

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { name: 'asc' },
    }),
    prisma.exercise.count({ where }),
  ]);

  const result = { exercises, total, page: query.page, limit: query.limit };

  // Cache for 1 hour
  await cache.set(cacheKey, result, 3600);

  return result;
}

export async function getById(id: string) {
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    throw new NotFoundError('Exercise');
  }
  return exercise;
}

export function getCategories() {
  return [
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'bodyweight',
    'cardio',
    'stretching',
    'other',
    'strength',
    'hypertrophy',
    'power',
    'endurance',
  ];
}

export function getMuscleGroups() {
  return [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'forearms',
    'core',
    'abs',
    'obliques',
    'quadriceps',
    'hamstrings',
    'glutes',
    'calves',
    'hip_flexors',
    'traps',
    'lats',
    'rhomboids',
    'lower_back',
    'adductors',
    'abductors',
  ];
}
