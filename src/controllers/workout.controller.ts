import { Request, Response, NextFunction } from 'express';
import * as workoutService from '../services/workout.service';
import { buildPaginatedResponse } from '../utils/helpers';

export async function startWorkout(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.startWorkout(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
}

export async function getActiveWorkout(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.getActiveWorkout(req.user!.userId);
    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
}

export async function addExercise(req: Request, res: Response, next: NextFunction) {
  try {
    const workoutExercise = await workoutService.addExercise(
      req.params.id as string,
      req.user!.userId,
      req.body
    );
    res.status(201).json({ success: true, data: workoutExercise });
  } catch (error) {
    next(error);
  }
}

export async function updateSet(req: Request, res: Response, next: NextFunction) {
  try {
    const set = await workoutService.updateSet(
      req.params.setId as string,
      req.user!.userId,
      req.body
    );
    res.status(200).json({ success: true, data: set });
  } catch (error) {
    next(error);
  }
}

export async function finishWorkout(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workoutService.finishWorkout(
      req.params.id as string,
      req.user!.userId
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function cancelWorkout(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutService.cancelWorkout(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: { message: 'Workout cancelled' } });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await workoutService.getHistory(req.user!.userId, page, limit);
    res.status(200).json(
      buildPaginatedResponse(result.workouts, result.total, result.page, result.limit)
    );
  } catch (error) {
    next(error);
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const workout = await workoutService.getDetail(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
}

export async function saveTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await workoutService.saveTemplate(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
}

export async function getTemplates(req: Request, res: Response, next: NextFunction) {
  try {
    const templates = await workoutService.getTemplates(req.user!.userId);
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutService.deleteTemplate(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: { message: 'Template deleted' } });
  } catch (error) {
    next(error);
  }
}
