// Approximate PACKED weight per cake-size PRICE tier (cake + box + padding), in kg.
// These are distinct from the price multipliers in pricing.js's WEIGHTS_DEF — same
// tier labels, different axis (price vs physical weight) — deliberately not reused.
// Rough estimates, easy to tune later; nothing else depends on the exact numbers.
const TIER_WEIGHT_KG = {
  '0.5 KG': 0.8,
  '1 KG': 1.3,
  '1.5 KG': 1.9,
  '2 KG': 2.5,
};
const PACKAGING_OVERHEAD_KG = 0.3; // one flat box/padding overhead per order
const ADDON_WEIGHT_KG = 0.1; // candles/cards etc. have no size tier

function weightForTier(tier) {
  if (TIER_WEIGHT_KG[tier] != null) return TIER_WEIGHT_KG[tier];
  // Admins can add ad-hoc tiers beyond the 4 defaults (e.g. "3 KG") — fall back to
  // parsing the leading number instead of silently under-quoting at the 0.5KG weight.
  const n = parseFloat(tier);
  return Number.isFinite(n) ? n + 0.3 : TIER_WEIGHT_KG['0.5 KG'];
}

/** `lines` is the priced cart line array from pricing.js (each has `weight`, `qty`). */
export function computeOrderShippingWeightKg(lines) {
  const raw = (lines || []).reduce(
    (sum, l) => sum + (l.weight ? weightForTier(l.weight) : ADDON_WEIGHT_KG) * (l.qty || 1),
    0
  );
  return Math.max(0.1, Math.round((raw + PACKAGING_OVERHEAD_KG) * 100) / 100);
}
