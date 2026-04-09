import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { parseDateString } from '../utils/helpers';

export async function searchFoods(query: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { name: { contains: query, mode: 'insensitive' as const } },
      { brand: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  const [foods, total] = await Promise.all([
    prisma.foodItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.foodItem.count({ where }),
  ]);

  return { foods, total, page, limit };
}

export async function getFoodById(id: string) {
  const food = await prisma.foodItem.findUnique({ where: { id } });
  if (!food) {
    throw new NotFoundError('Food item');
  }
  return food;
}

export async function createCustomFood(
  userId: string,
  data: {
    name: string;
    brand?: string;
    servingSize: number;
    servingUnit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    barcode?: string;
    imageUrl?: string;
  }
) {
  const food = await prisma.foodItem.create({
    data: {
      name: data.name,
      brand: data.brand ?? null,
      servingSize: data.servingSize,
      servingUnit: data.servingUnit,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat,
      fiber: data.fiber ?? 0,
      sugar: data.sugar ?? 0,
      sodium: data.sodium ?? 0,
      barcode: data.barcode ?? null,
      imageUrl: data.imageUrl ?? null,
      isCustom: true,
      createdBy: userId,
    },
  });

  return food;
}

export async function getDailyLog(userId: string, dateStr: string) {
  const date = parseDateString(dateStr);

  const logs = await prisma.nutritionLog.findMany({
    where: { userId, date },
    include: { foodItem: true },
    orderBy: { loggedAt: 'asc' },
  });

  const water = await prisma.dailyWater.findUnique({
    where: { userId_date: { userId, date } },
  });

  // Group by meal type
  const meals: Record<string, typeof logs> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const log of logs) {
    const mealType = log.mealType;
    if (meals[mealType]) {
      meals[mealType].push(log);
    }
    totalCalories += log.foodItem.calories * log.servingCount;
    totalProtein += log.foodItem.protein * log.servingCount;
    totalCarbs += log.foodItem.carbs * log.servingCount;
    totalFat += log.foodItem.fat * log.servingCount;
    totalFiber += log.foodItem.fiber * log.servingCount;
  }

  return {
    date: dateStr,
    meals,
    totals: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
    },
    water: water?.waterMl ?? 0,
  };
}

export async function addMeal(
  userId: string,
  dateStr: string,
  mealType: string,
  foodItemId: string,
  servingCount: number
) {
  const date = parseDateString(dateStr);

  // Verify food item exists
  const foodItem = await prisma.foodItem.findUnique({ where: { id: foodItemId } });
  if (!foodItem) {
    throw new NotFoundError('Food item');
  }

  const log = await prisma.nutritionLog.create({
    data: {
      userId,
      date,
      mealType,
      foodItemId,
      servingCount,
    },
    include: { foodItem: true },
  });

  return log;
}

export async function removeMeal(logId: string, userId: string) {
  const log = await prisma.nutritionLog.findUnique({ where: { id: logId } });
  if (!log) {
    throw new NotFoundError('Nutrition log');
  }
  if (log.userId !== userId) {
    throw new ForbiddenError('You do not own this log entry');
  }

  await prisma.nutritionLog.delete({ where: { id: logId } });
}

export async function updateWater(userId: string, dateStr: string, waterMl: number) {
  const date = parseDateString(dateStr);

  const water = await prisma.dailyWater.upsert({
    where: { userId_date: { userId, date } },
    update: { waterMl },
    create: { userId, date, waterMl },
  });

  return water;
}

export async function getWater(userId: string, dateStr: string) {
  const date = parseDateString(dateStr);

  const water = await prisma.dailyWater.findUnique({
    where: { userId_date: { userId, date } },
  });

  return { date: dateStr, waterMl: water?.waterMl ?? 0 };
}

export async function getMacroGoals(userId: string) {
  let goals = await prisma.macroGoal.findUnique({ where: { userId } });
  if (!goals) {
    goals = await prisma.macroGoal.create({
      data: { userId },
    });
  }
  return goals;
}

export async function updateMacroGoals(
  userId: string,
  data: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    waterMl?: number;
  }
) {
  // Ensure macro goal record exists
  await prisma.macroGoal.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const updated = await prisma.macroGoal.update({
    where: { userId },
    data,
  });

  return updated;
}
