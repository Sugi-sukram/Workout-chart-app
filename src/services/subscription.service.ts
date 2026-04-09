import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export async function getSubscription(userId: string) {
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, tier: 'free' },
    });
  }
  return sub;
}

export async function startTrial(userId: string, tier: string = 'premium') {
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId, tier: 'free' },
    });
  }

  if (sub.trialStartedAt) {
    throw new ConflictError('You have already used your free trial');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      tier,
      isTrial: true,
      trialStartedAt: now,
      expiresAt,
    },
  });

  return updated;
}

export async function cancelSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) {
    throw new NotFoundError('Subscription');
  }

  const updated = await prisma.subscription.update({
    where: { userId },
    data: {
      tier: 'free',
      isTrial: false,
      expiresAt: null,
      stripeCustomerId: sub.stripeCustomerId, // keep customer ID
      stripeSubscriptionId: null,
    },
  });

  return updated;
}

export function getTiers() {
  return [
    {
      tier: 'free',
      name: 'Free',
      price: 0,
      features: [
        'Basic workout tracking',
        'Exercise library',
        'Basic nutrition logging',
        'Progress tracking',
      ],
    },
    {
      tier: 'premium',
      name: 'Premium',
      monthlyPrice: 9.99,
      yearlyPrice: 79.99,
      features: [
        'Everything in Free',
        'AI workout recommendations',
        'Advanced analytics',
        'Custom workout templates',
        'Priority support',
      ],
    },
    {
      tier: 'elite',
      name: 'Elite',
      monthlyPrice: 19.99,
      yearlyPrice: 149.99,
      features: [
        'Everything in Premium',
        'Personal AI coach',
        'Meal planning',
        'Video form analysis',
        'Dedicated support',
      ],
    },
  ];
}
