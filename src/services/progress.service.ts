import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { parseDateString } from '../utils/helpers';

export async function addMetric(
  userId: string,
  data: {
    date: string;
    weight?: number;
    bodyFat?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
  }
) {
  const date = parseDateString(data.date);

  const metric = await prisma.bodyMetric.upsert({
    where: { userId_date: { userId, date } },
    update: {
      weight: data.weight,
      bodyFat: data.bodyFat,
      chest: data.chest,
      waist: data.waist,
      hips: data.hips,
      leftArm: data.leftArm,
      rightArm: data.rightArm,
      leftThigh: data.leftThigh,
      rightThigh: data.rightThigh,
    },
    create: {
      userId,
      date,
      weight: data.weight,
      bodyFat: data.bodyFat,
      chest: data.chest,
      waist: data.waist,
      hips: data.hips,
      leftArm: data.leftArm,
      rightArm: data.rightArm,
      leftThigh: data.leftThigh,
      rightThigh: data.rightThigh,
    },
  });

  return metric;
}

export async function getMetrics(
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }
) {
  const skip = (options.page - 1) * options.limit;

  const where: Record<string, unknown> = { userId };
  if (options.startDate || options.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (options.startDate) {
      dateFilter.gte = parseDateString(options.startDate);
    }
    if (options.endDate) {
      const end = parseDateString(options.endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    where.date = dateFilter;
  }

  const [metrics, total] = await Promise.all([
    prisma.bodyMetric.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: options.limit,
    }),
    prisma.bodyMetric.count({ where }),
  ]);

  return { metrics, total, page: options.page, limit: options.limit };
}

export async function getLatestMetric(userId: string) {
  const metric = await prisma.bodyMetric.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  return metric;
}

export async function deleteMetric(metricId: string, userId: string) {
  const metric = await prisma.bodyMetric.findUnique({ where: { id: metricId } });
  if (!metric) {
    throw new NotFoundError('Body metric');
  }
  if (metric.userId !== userId) {
    throw new ForbiddenError('You do not own this metric');
  }

  await prisma.bodyMetric.delete({ where: { id: metricId } });
}

export async function getWorkoutStats(userId: string) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
  startOfWeek.setUTCHours(0, 0, 0, 0);

  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalWorkouts,
    volumeAgg,
    durationAgg,
    workoutsThisWeek,
    workoutsThisMonth,
  ] = await Promise.all([
    prisma.workout.count({
      where: { userId, isActive: false },
    }),
    prisma.workout.aggregate({
      where: { userId, isActive: false },
      _sum: { totalVolume: true },
    }),
    prisma.workout.aggregate({
      where: { userId, isActive: false },
      _sum: { durationSeconds: true },
      _avg: { durationSeconds: true },
    }),
    prisma.workout.count({
      where: {
        userId,
        isActive: false,
        startedAt: { gte: startOfWeek },
      },
    }),
    prisma.workout.count({
      where: {
        userId,
        isActive: false,
        startedAt: { gte: startOfMonth },
      },
    }),
  ]);

  return {
    totalWorkouts,
    totalVolume: volumeAgg._sum.totalVolume ?? 0,
    totalDuration: durationAgg._sum.durationSeconds ?? 0,
    averageWorkoutDuration: Math.round(durationAgg._avg.durationSeconds ?? 0),
    workoutsThisWeek,
    workoutsThisMonth,
  };
}

export async function getPersonalRecords(userId: string) {
  // Get all exercises the user has performed in completed workouts
  const exerciseIds = await prisma.workoutExercise.findMany({
    where: {
      workout: { userId, isActive: false },
    },
    select: { exerciseId: true },
    distinct: ['exerciseId'],
  });

  const records = [];

  for (const { exerciseId } of exerciseIds) {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true },
    });

    if (!exercise) continue;

    // Max weight
    const maxWeightSet = await prisma.workoutSet.findFirst({
      where: {
        completed: true,
        weight: { not: null },
        workoutExercise: {
          exerciseId,
          workout: { userId, isActive: false },
        },
      },
      orderBy: { weight: 'desc' },
      select: { weight: true, reps: true },
    });

    // Max reps (for a single set)
    const maxRepsSet = await prisma.workoutSet.findFirst({
      where: {
        completed: true,
        reps: { not: null },
        workoutExercise: {
          exerciseId,
          workout: { userId, isActive: false },
        },
      },
      orderBy: { reps: 'desc' },
      select: { weight: true, reps: true },
    });

    records.push({
      exercise,
      maxWeight: maxWeightSet?.weight ?? null,
      maxWeightReps: maxWeightSet?.reps ?? null,
      maxReps: maxRepsSet?.reps ?? null,
      maxRepsWeight: maxRepsSet?.weight ?? null,
    });
  }

  return records;
}
