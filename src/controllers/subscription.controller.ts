import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import * as stripeService from '../services/stripe.service';

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await subscriptionService.getSubscription(req.user!.userId);
    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
}

export async function startTrial(req: Request, res: Response, next: NextFunction) {
  try {
    const { tier } = req.body;
    const sub = await subscriptionService.startTrial(req.user!.userId, tier);
    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
}

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const { tier, interval, successUrl, cancelUrl } = req.body;
    const session = await stripeService.createCheckoutSession(
      req.user!.userId,
      tier,
      interval,
      successUrl,
      cancelUrl
    );
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const result = await stripeService.handleWebhook(req.body, signature);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await subscriptionService.cancelSubscription(req.user!.userId);
    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
}

export async function getTiers(_req: Request, res: Response, next: NextFunction) {
  try {
    const tiers = subscriptionService.getTiers();
    res.status(200).json({ success: true, data: tiers });
  } catch (error) {
    next(error);
  }
}
