import { Request, Response, NextFunction } from 'express';
import * as gamificationService from '../services/gamification.service';
import { buildPaginatedResponse } from '../utils/helpers';

export async function getXPData(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await gamificationService.getXPData(req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function addXPEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, xpAmount, description } = req.body;
    const result = await gamificationService.addXPEvent(
      req.user!.userId,
      type,
      xpAmount,
      description
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getXPHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await gamificationService.getXPHistory(req.user!.userId, page, limit);
    res.status(200).json(
      buildPaginatedResponse(result.events, result.total, result.page, result.limit)
    );
  } catch (error) {
    next(error);
  }
}

export async function getStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const streak = await gamificationService.getStreak(req.user!.userId);
    res.status(200).json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
}

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await gamificationService.checkIn(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await gamificationService.getAchievements(req.user!.userId);
    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
}

export async function unlockAchievement(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await gamificationService.unlockAchievement(
      req.user!.userId,
      req.params.id as string
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Number(req.query.limit) || 20;
    const leaderboard = await gamificationService.getLeaderboard(limit);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
}
