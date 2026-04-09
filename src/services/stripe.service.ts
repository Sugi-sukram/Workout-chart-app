import Stripe from 'stripe';
import { getStripe, getPriceId } from '../config/stripe';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { NotFoundError, AppError } from '../utils/errors';

export async function createCheckoutSession(
  userId: string,
  tier: 'premium' | 'elite',
  billingPeriod: 'monthly' | 'yearly',
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripe();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new NotFoundError('User');
  }

  // Find or create Stripe customer
  let sub = await prisma.subscription.findUnique({ where: { userId } });
  let customerId = sub?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    if (!sub) {
      await prisma.subscription.create({
        data: { userId, tier: 'free', stripeCustomerId: customerId },
      });
    } else {
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    }
  }

  const priceId = getPriceId(tier, billingPeriod);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, tier, billingPeriod },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = config.stripe.webhookSecret;

  if (!webhookSecret) {
    throw new AppError('Stripe webhook secret not configured', 500);
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new AppError('Invalid webhook signature', 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: session.metadata?.tier ?? 'premium',
          isTrial: false,
          stripeSubscriptionId:
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription?.id ?? null,
          purchasePlatform: 'web',
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!sub) break;

      const isActive = ['active', 'trialing'].includes(subscription.status);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          tier: isActive ? sub.tier : 'free',
          expiresAt: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!sub) break;

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          tier: 'free',
          isTrial: false,
          stripeSubscriptionId: null,
          expiresAt: null,
        },
      });
      break;
    }

    default:
      console.log(`[stripe] Unhandled event type: ${event.type}`);
  }

  return { received: true };
}
