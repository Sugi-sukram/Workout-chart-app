import { Request, Response, NextFunction } from 'express';
import * as progressService from '../services/progress.service';
import { buildPaginatedResponse } from '../utils/helpers';

export async function addMetric(req: Request, res: Response, next: NextFunction) {
  try {
    const metric = await progressService.addMetric(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
}

export async function getMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const options = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 30,
    };
    const result = await progressService.getMetrics(req.user!.userId, options);
    res.status(200).json(
      buildPaginatedResponse(result.metrics, result.total, result.page, result.limit)
    );
  } catch (error) {
    next(error);
  }
}

export async function getLatestMetric(req: Request, res: Response, next: NextFunction) {
  try {
    const metric = await progressService.getLatestMetric(req.user!.userId);
    res.status(200).json({ success: true, data: metric });
  } catch (error) {
    next(error);
  }
}

export async function deleteMetric(req: Request, res: Response, next: NextFunction) {
  try {
    await progressService.deleteMetric(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: { message: 'Metric deleted' } });
  } catch (error) {
    next(error);
  }
}

export async function getWorkoutStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await progressService.getWorkoutStats(req.user!.userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getPersonalRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const records = await progressService.getPersonalRecords(req.user!.userId);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
}
