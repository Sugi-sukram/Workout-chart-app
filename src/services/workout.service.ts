import { prisma } from '../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errors';
import * as gamificationService from './gamification.service';

export async function startWorkout(
  userId: string,
  data: { name: string; templateId?: string }
) {
  const activeWorkout = await prisma.workout.findFirst({
    where: { userId, isActive: true },
  });

  if (activeWorkout) {
    throw new ConflictError('You already have an active workout. Finish or cancel it first.');
  }

  const workout = await prisma.workout.create({
    data: {
      userId,
      name: data.name,
      templateId: data.templateId ?? null,
      isActive: true,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  return workout;
}

export async function getActiveWorkout(userId: string) {
  const workout = await prisma.workout.findFirst({
    where: { userId, isActive: true },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  return workout;
}

export async function addExercise(
  workoutId: string,
  userId: string,
  data: {
    exerciseId: string;
    orderIndex: number;
    supersetGroup?: string;
    notes?: string;
    sets?: Array<{
      setNumber: number;
      weight?: number;
      reps?: number;
      duration?: number;
      distance?: number;
      rpe?: number;
      rir?: number;
      isWarmup?: boolean;
      isDropSet?: boolean;
      isFailure?: boolean;
      restSeconds?: number;
    }>;
  }
) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  if (workout.userId !== userId) {
    throw new ForbiddenError('You do not own this workout');
  }
  if (!workout.isActive) {
    throw new ConflictError('Cannot add exercises to a completed workout');
  }

  const workoutExercise = await prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId: data.exerciseId,
      orderIndex: data.orderIndex,
      supersetGroup: data.supersetGroup ?? null,
      notes: data.notes ?? null,
      sets: data.sets
        ? {
            create: data.sets.map((s) => ({
              setNumber: s.setNumber,
              weight: s.weight ?? null,
              reps: s.reps ?? null,
              duration: s.duration ?? null,
              distance: s.distance ?? null,
              rpe: s.rpe ?? null,
              rir: s.rir ?? null,
              isWarmup: s.isWarmup ?? false,
              isDropSet: s.isDropSet ?? false,
              isFailure: s.isFailure ?? false,
              restSeconds: s.restSeconds ?? null,
            })),
          }
        : undefined,
    },
    include: {
      exercise: true,
      sets: { orderBy: { setNumber: 'asc' } },
    },
  });

  return workoutExercise;
}

export async function updateSet(
  setId: string,
  userId: string,
  updates: {
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    rpe?: number;
    rir?: number;
    isWarmup?: boolean;
    isDropSet?: boolean;
    isFailure?: boolean;
    completed?: boolean;
    restSeconds?: number;
  }
) {
  const set = await prisma.workoutSet.findUnique({
    where: { id: setId },
    include: {
      workoutExercise: {
        include: { workout: true },
      },
    },
  });

  if (!set) {
    throw new NotFoundError('Set');
  }
  if (set.workoutExercise.workout.userId !== userId) {
    throw new ForbiddenError('You do not own this workout');
  }

  const updated = await prisma.workoutSet.update({
    where: { id: setId },
    data: updates,
  });

  return updated;
}

export async function finishWorkout(workoutId: string, userId: string) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: {
          exercise: true,
          sets: true,
        },
      },
    },
  });

  if (!workout) {
    throw new NotFoundError('Workout');
  }
  if (workout.userId !== userId) {
    throw new ForbiddenError('You do not own this workout');
  }
  if (!workout.isActive) {
    throw new ConflictError('Workout is already completed');
  }

  // Aggregate completed sets
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const we of workout.exercises) {
    for (const set of we.sets) {
      if (set.completed) {
        totalSets++;
        const reps = set.reps ?? 0;
        const weight = set.weight ?? 0;
        totalReps += reps;
        totalVolume += weight * reps;
      }
    }
  }

  const now = new Date();
  const durationSeconds = Math.round(
    (now.getTime() - workout.startedAt.getTime()) / 1000
  );

  // Detect personal records
  const prs: Array<{ exerciseId: string; exerciseName: string; type: string; value: number }> = [];
  for (const we of workout.exercises) {
    for (const set of we.sets) {
      if (!set.completed || !set.weight || !set.reps) continue;

      // Check max weight PR
      const historicalMaxWeight = await prisma.workoutSet.findFirst({
        where: {
          workoutExercise: {
            exerciseId: we.exerciseId,
            workout: {
              userId,
              isActive: false,
              id: { not: workoutId },
            },
          },
          completed: true,
          weight: { not: null },
        },
        orderBy: { weight: 'desc' },
        select: { weight: true },
      });

      if (!historicalMaxWeight || set.weight > (historicalMaxWeight.weight ?? 0)) {
        const alreadyAdded = prs.find(
          (p) => p.exerciseId === we.exerciseId && p.type === 'max_weight'
        );
        if (!alreadyAdded) {
          prs.push({
            exerciseId: we.exerciseId,
            exerciseName: we.exercise.name,
            type: 'max_weight',
            value: set.weight,
          });
        }
      }
    }
  }

  // Award XP
  const xpAmount = 50;
  await gamificationService.addXPEvent(
    userId,
    'workout_completed',
    xpAmount,
    `Completed workout: ${workout.name}`
  );

  // Update workout
  const updated = await prisma.workout.update({
    where: { id: workoutId },
    data: {
      isActive: false,
      completedAt: now,
      durationSeconds,
      totalVolume,
      totalSets,
      totalReps,
      exerciseCount: workout.exercises.length,
      xpEarned: xpAmount,
    },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  return {
    workout: updated,
    summary: {
      totalVolume,
      totalSets,
      totalReps,
      durationSeconds,
      exerciseCount: workout.exercises.length,
      xpEarned: xpAmount,
      personalRecords: prs,
    },
  };
}

export async function cancelWorkout(workoutId: string, userId: string) {
  const workout = await prisma.workout.findUnique({ where: { id: workoutId } });
  if (!workout) {
    throw new NotFoundError('Workout');
  }
  if (workout.userId !== userId) {
    throw new ForbiddenError('You do not own this workout');
  }

  await prisma.workout.delete({ where: { id: workoutId } });
}

export async function getHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [workouts, total] = await Promise.all([
    prisma.workout.findMany({
      where: { userId, isActive: false },
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
          include: { exercise: { select: { id: true, name: true, category: true } } },
        },
      },
    }),
    prisma.workout.count({ where: { userId, isActive: false } }),
  ]);

  return { workouts, total, page, limit };
}

export async function getDetail(workoutId: string, userId: string) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: 'asc' } },
        },
      },
    },
  });

  if (!workout) {
    throw new NotFoundError('Workout');
  }
  if (workout.userId !== userId) {
    throw new ForbiddenError('You do not own this workout');
  }

  return workout;
}

export async function saveTemplate(
  userId: string,
  data: {
    name: string;
    description?: string;
    category?: string;
    exercisesJson: unknown;
    estimatedDuration?: number;
    difficulty?: string;
  }
) {
  const template = await prisma.workoutTemplate.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      category: data.category ?? null,
      exercisesJson: data.exercisesJson as object,
      estimatedDuration: data.estimatedDuration ?? null,
      difficulty: data.difficulty ?? null,
    },
  });

  return template;
}

export async function getTemplates(userId: string) {
  const templates = await prisma.workoutTemplate.findMany({
    where: {
      OR: [{ userId }, { isDefault: true }],
    },
    orderBy: { createdAt: 'desc' },
  });

  return templates;
}

export async function deleteTemplate(templateId: string, userId: string) {
  const template = await prisma.workoutTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new NotFoundError('Template');
  }
  if (template.isDefault) {
    throw new ForbiddenError('Cannot delete default templates');
  }
  if (template.userId !== userId) {
    throw new ForbiddenError('You do not own this template');
  }

  await prisma.workoutTemplate.delete({ where: { id: templateId } });
}
