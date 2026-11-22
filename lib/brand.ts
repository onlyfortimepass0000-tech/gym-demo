// Rebrand the whole demo for a specific gym by editing this file only.
export const BRAND = {
  name: "KILO",
  tagline: "Gym operating system",
  gymLine: "Strength & Conditioning",
  currency: "₹",
};

export const PLAN_PRICES = {
  Monthly: { price: 2500, months: 1 },
  Quarterly: { price: 6500, months: 3 },
  Annual: { price: 22000, months: 12 },
} as const;
