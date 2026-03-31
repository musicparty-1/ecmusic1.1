export const PLANS = {
  DEMO: {
    name: 'Demo',
    maxEvents: 10,
    maxVotesPerEvent: 50,
    analytics: false,
    export: false,
    preEvent: false,
    duplicate: false,
    multiDJ: false,
  },
  STARTER: {
    name: 'Starter',
    maxEvents: 10,
    maxVotesPerEvent: 200,
    analytics: true,
    export: true,
    preEvent: true,
    duplicate: true,
    multiDJ: false,
  },
  PRO: {
    name: 'Pro',
    maxEvents: Infinity,
    maxVotesPerEvent: Infinity,
    analytics: true,
    export: true,
    preEvent: true,
    duplicate: true,
    multiDJ: false,
  },
  AGENCY: {
    name: 'Agency',
    maxEvents: Infinity,
    maxVotesPerEvent: Infinity,
    analytics: true,
    export: true,
    preEvent: true,
    duplicate: true,
    multiDJ: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const STRIPE_PRICES: Record<string, PlanKey> = {
  // Estos price IDs se configuran en .env
  // price_starter → STARTER, etc.
};
