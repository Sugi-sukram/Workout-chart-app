import { Request, Response, NextFunction } from 'express';
import * as exerciseService from '../services/exercise.service';
import { buildPaginatedResponse } from '../utils/helpers';

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const query = {
      q: req.query.q as string | undefined,
      category: req.query.category as string | undefined,
      muscle: req.query.muscle as string | undefined,
      equipment: req.query.equipment as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
      isCompound: req.query.isCompound !== undefined
        ? req.query.isCompound === 'true'
        : undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };
    const result = await exerciseService.search(query);
    res.status(200).json(
      buildPaginatedResponse(result.exercises, result.total, result.page, result.limit)
    );
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const exercise = await exerciseService.getById(req.params.id as string);
    res.status(200).json({ success: true, data: exercise });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = exerciseService.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getMuscleGroups(_req: Request, res: Response, next: NextFunction) {
  try {
    const muscleGroups = exerciseService.getMuscleGroups();
    res.status(200).json({ success: true, data: muscleGroups });
  } catch (error) {
    next(error);
  }
}
