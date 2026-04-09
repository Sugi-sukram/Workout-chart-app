import { Request, Response, NextFunction } from 'express';
import * as nutritionService from '../services/nutrition.service';
import { buildPaginatedResponse, todayDateString } from '../utils/helpers';

export async function searchFoods(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query.q as string;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await nutritionService.searchFoods(q, page, limit);
    res.status(200).json(
      buildPaginatedResponse(result.foods, result.total, result.page, result.limit)
    );
  } catch (error) {
    next(error);
  }
}

export async function getFoodById(req: Request, res: Response, next: NextFunction) {
  try {
    const food = await nutritionService.getFoodById(req.params.id as string);
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
}

export async function createCustomFood(req: Request, res: Response, next: NextFunction) {
  try {
    const food = await nutritionService.createCustomFood(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
}

export async function getDailyLog(req: Request, res: Response, next: NextFunction) {
  try {
    const dateStr = (req.query.date as string) || todayDateString();
    const log = await nutritionService.getDailyLog(req.user!.userId, dateStr);
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function addMeal(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, mealType, foodItemId, servingCount } = req.body;
    const log = await nutritionService.addMeal(
      req.user!.userId,
      date,
      mealType,
      foodItemId,
      servingCount ?? 1
    );
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function removeMeal(req: Request, res: Response, next: NextFunction) {
  try {
    await nutritionService.removeMeal(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: { message: 'Meal log removed' } });
  } catch (error) {
    next(error);
  }
}

export async function getWater(req: Request, res: Response, next: NextFunction) {
  try {
    const dateStr = (req.query.date as string) || todayDateString();
    const water = await nutritionService.getWater(req.user!.userId, dateStr);
    res.status(200).json({ success: true, data: water });
  } catch (error) {
    next(error);
  }
}

export async function updateWater(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, waterMl } = req.body;
    const water = await nutritionService.updateWater(req.user!.userId, date, waterMl);
    res.status(200).json({ success: true, data: water });
  } catch (error) {
    next(error);
  }
}

export async function getMacroGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const goals = await nutritionService.getMacroGoals(req.user!.userId);
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
}

export async function updateMacroGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const goals = await nutritionService.updateMacroGoals(req.user!.userId, req.body);
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
}

export async function getDailySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const dateStr = (req.query.date as string) || todayDateString();
    const log = await nutritionService.getDailyLog(req.user!.userId, dateStr);
    const goals = await nutritionService.getMacroGoals(req.user!.userId);

    const summary = {
      date: dateStr,
      consumed: log.totals,
      goals: {
        calories: goals.calories,
        protein: goals.protein,
        carbs: goals.carbs,
        fat: goals.fat,
        fiber: goals.fiber,
        waterMl: goals.waterMl,
      },
      remaining: {
        calories: goals.calories - log.totals.calories,
        protein: Math.round((goals.protein - log.totals.protein) * 10) / 10,
        carbs: Math.round((goals.carbs - log.totals.carbs) * 10) / 10,
        fat: Math.round((goals.fat - log.totals.fat) * 10) / 10,
        fiber: Math.round((goals.fiber - log.totals.fiber) * 10) / 10,
      },
      water: {
        consumed: log.water,
        goal: goals.waterMl,
        remaining: goals.waterMl - log.water,
      },
    };

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
