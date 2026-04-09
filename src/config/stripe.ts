import Stripe from 'stripe';
import { config } from './env';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!config.stripe.secretKey || config.stripe.secretKey === 'sk_test_placeholder') {
      console.warn(
        '[stripe] STRIPE_SECRET_KEY is not configured. Stripe operations will fail.'
      );
    }
    stripeInstance = new Stripe(config.stripe.secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export function getPriceId(
  tier: 'premium' | 'elite',
  interval: 'monthly' | 'yearly'
): string {
  const key = `${tier}${interval.charAt(0).toUpperCase() + interval.slice(1)}` as keyof typeof config.stripe.prices;
  const priceId = config.stripe.prices[key];
  if (!priceId) {
    throw new Error(`Price ID not configured for ${tier} ${interval}`);
  }
  return priceId;
}

export const stripe = getStripe();
export default stripe;
