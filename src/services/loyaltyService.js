const ApiError = require('../utils/ApiError');

/**
 * Compute the redemption amount for a requested number of points.
 * Does not mutate the user — caller is responsible for persisting after payment.
 */
function computeRedemption({ points, user, subtotal, settings }) {
  const p = Number(points) || 0;
  if (p <= 0) return { points: 0, amount: 0 };
  if (!user) throw new ApiError(400, 'Loyalty redemption requires a known customer');
  if (user.loyaltyPoints < p) {
    throw new ApiError(400, `Only ${user.loyaltyPoints} points available`);
  }

  const rate = settings.loyalty.redeemRate || 1;
  const maxPct = settings.loyalty.maxRedeemPercent || 20;
  const cap = (subtotal * maxPct) / 100;

  let amount = p * rate;
  if (amount > cap) amount = cap;
  amount = Math.min(amount, subtotal);
  amount = Math.round(amount * 100) / 100;

  // Recompute the exact points consumed given the cap (don't burn more than needed)
  const actualPoints = Math.min(p, Math.ceil(amount / rate));
  return { points: actualPoints, amount };
}

function computePointsEarned({ total, settings }) {
  const earn = settings.loyalty.earnRatePerRupee || 0;
  return Math.floor(total * earn);
}

module.exports = { computeRedemption, computePointsEarned };
