import Stripe from "stripe";

// Initialized on first use, not at import — a top-level `new Stripe(undefined)` throws when
// STRIPE_SECRET_KEY is absent, which breaks Next's build-time page-data collection on any
// deploy without the secret (e.g. Vercel Preview). The key is only needed at request time.
let instance: Stripe | undefined;
function getStripe(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return instance;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const real = getStripe();
    const value = real[prop as keyof Stripe];
    return typeof value === "function" ? value.bind(real) : value;
  },
});
