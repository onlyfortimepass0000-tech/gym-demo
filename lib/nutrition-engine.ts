import type {
  Avoid,
  Diet,
  FoodItem,
  NutritionIntake,
  NutritionPlan,
  PlannedMeal,
} from "./types";

/* ------------------------------------------------------------------ */
/* Food database                                                       */
/* ------------------------------------------------------------------ */

type Animal = "none" | "dairy" | "egg" | "meat";
type Unit = "g" | "ml" | "pc";

export type Food = {
  id: string;
  name: string;
  unit: Unit;
  label: string; // singular label for pc units ("roti", "cup", "tsp")
  plural: string;
  base: number; // quantity the macros below refer to
  p: number;
  c: number;
  f: number;
  kcalPer: number; // 4p + 4c + 9f
  step: number; // portion rounding step, in qty units
  typ: number; // typical portion, in qty units
  animal: Animal;
  root: boolean;
  allergens: Avoid[];
};

function food(
  id: string,
  name: string,
  unit: Unit,
  label: string,
  base: number,
  p: number,
  c: number,
  f: number,
  step: number,
  typ: number,
  o: { animal?: Animal; root?: boolean; allergens?: Avoid[]; plural?: string } = {}
): Food {
  return {
    id,
    name,
    unit,
    label,
    plural: o.plural ?? label + "s",
    base,
    p,
    c,
    f,
    kcalPer: 4 * p + 4 * c + 9 * f,
    step,
    typ,
    animal: o.animal ?? "none",
    root: o.root ?? false,
    allergens: o.allergens ?? [],
  };
}

const DAIRY = { animal: "dairy" as Animal, allergens: ["dairy"] as Avoid[] };

export const FOODS: Food[] = [
  // grains & carb bases
  food("roti", "Whole-wheat roti", "pc", "roti", 1, 3.4, 18.5, 1.6, 1, 2, { allergens: ["gluten"] }),
  food("jowar", "Jowar roti", "pc", "roti", 1, 2.8, 17.5, 0.8, 1, 2),
  food("bajra", "Bajra roti", "pc", "roti", 1, 3.3, 19, 2, 1, 2),
  food("rice", "Steamed rice", "g", "g", 100, 2.7, 28, 0.3, 25, 150),
  food("brice", "Brown rice (cooked)", "g", "g", 100, 2.6, 23, 0.9, 25, 150),
  food("poha", "Poha", "pc", "cup", 1, 3.5, 34, 3.5, 0.5, 1),
  food("upma", "Vegetable upma", "pc", "cup", 1, 5, 34, 6, 0.5, 1, { allergens: ["gluten"] }),
  food("dalia", "Dalia (broken wheat)", "pc", "cup", 1, 5, 33, 2, 0.5, 1, { allergens: ["gluten"] }),
  food("idli", "Idli", "pc", "idli", 1, 2, 12, 0.3, 1, 3),
  food("dosa", "Plain dosa", "pc", "dosa", 1, 3, 23, 3, 1, 2, { plural: "dosas" }),
  food("oats", "Rolled oats (dry)", "g", "g", 100, 13, 66, 7, 10, 40, { allergens: ["gluten"] }),
  food("ragi", "Ragi porridge", "pc", "cup", 1, 4, 32, 1.5, 0.5, 1),
  food("khichdi", "Moong dal khichdi", "pc", "cup", 1, 8, 35, 3.5, 0.5, 1),
  food("sweetpot", "Boiled sweet potato", "g", "g", 100, 1.6, 20, 0.1, 25, 150, { root: true }),
  food("potato", "Boiled potato", "g", "g", 100, 2, 20, 0.1, 25, 150, { root: true }),
  food("corn", "Boiled sweet corn", "pc", "cup", 1, 4, 29, 1.5, 0.5, 1),
  food("bread", "Whole-wheat bread", "pc", "slice", 1, 3.5, 14, 1, 1, 2, { allergens: ["gluten"] }),
  food("dates", "Dates", "pc", "date", 1, 0.2, 6, 0, 1, 2),
  // legumes & plant protein
  food("toor", "Toor dal", "pc", "cup", 1, 9.5, 26, 3.5, 0.5, 1),
  food("moongdal", "Moong dal", "pc", "cup", 1, 10, 22, 3, 0.5, 1),
  food("masoor", "Masoor dal", "pc", "cup", 1, 11, 26, 3, 0.5, 1),
  food("rajma", "Rajma", "pc", "cup", 1, 13, 34, 4, 0.5, 1),
  food("chole", "Chole", "pc", "cup", 1, 13, 37, 6, 0.5, 1),
  food("sprouts", "Moong sprouts", "pc", "cup", 1, 7, 19, 0.6, 0.5, 1),
  food("mchilla", "Moong dal chilla", "pc", "chilla", 1, 6.5, 12, 2.5, 1, 2),
  food("bchilla", "Besan chilla", "pc", "chilla", 1, 5.5, 13, 4.5, 1, 2),
  food("soya", "Soya chunks (dry weight)", "g", "g", 100, 52, 33, 0.5, 5, 40, { allergens: ["soy"] }),
  food("tofu", "Tofu (firm)", "g", "g", 100, 13, 3, 6.5, 25, 100, { allergens: ["soy"] }),
  food("sattu", "Sattu (roasted gram flour)", "g", "g", 100, 22, 65, 6, 5, 30),
  food("rchana", "Roasted chana", "g", "g", 100, 19, 58, 5, 5, 30),
  food("makhana", "Makhana (roasted)", "g", "g", 100, 10, 75, 1, 5, 25),
  food("pea", "Pea protein", "pc", "scoop", 1, 22, 3, 2, 0.5, 1),
  // dairy
  food("paneer", "Paneer", "g", "g", 100, 18, 3.5, 20, 25, 100, DAIRY),
  food("lfpaneer", "Low-fat paneer", "g", "g", 100, 20, 4, 10, 25, 100, DAIRY),
  food("curd", "Curd (dahi)", "g", "g", 100, 3.2, 4.7, 3.3, 25, 150, DAIRY),
  food("greek", "Greek yogurt (low-fat)", "g", "g", 100, 9, 4, 2.5, 25, 150, DAIRY),
  food("milk", "Toned milk", "ml", "ml", 100, 3.1, 4.7, 3, 50, 250, DAIRY),
  food("whey", "Whey protein", "pc", "scoop", 1, 24, 3, 1.5, 0.5, 1, DAIRY),
  food("ghee", "Ghee", "pc", "tsp", 1, 0, 0, 5, 1, 1, { ...DAIRY, plural: "tsp" }),
  food("soymilk", "Soy milk (unsweetened)", "ml", "ml", 100, 3.3, 1.5, 1.8, 50, 250, { allergens: ["soy"] }),
  // egg & meat
  food("eggs", "Whole eggs", "pc", "egg", 1, 6.3, 0.5, 5, 1, 2, { animal: "egg" }),
  food("ewhite", "Egg whites", "pc", "white", 1, 3.6, 0.2, 0.1, 1, 4, { animal: "egg" }),
  food("chicken", "Chicken breast (cooked)", "g", "g", 100, 31, 0, 3.6, 25, 150, { animal: "meat" }),
  food("fish", "Fish, rohu or surmai (cooked)", "g", "g", 100, 22, 0, 5, 25, 150, { animal: "meat" }),
  // nuts, seeds, fats
  food("peanuts", "Roasted peanuts", "g", "g", 100, 26, 16, 50, 5, 20, { allergens: ["nuts"] }),
  food("almonds", "Almonds", "pc", "pc", 1, 0.26, 0.3, 0.61, 1, 10, { allergens: ["nuts"], plural: "pcs" }),
  food("pbutter", "Peanut butter", "pc", "tbsp", 1, 4, 3, 8, 1, 1, { allergens: ["nuts"], plural: "tbsp" }),
  food("seeds", "Mixed seeds (flax, pumpkin)", "pc", "tbsp", 1, 2.5, 2, 5, 1, 1, { plural: "tbsp" }),
  food("oil", "Cooking oil (sunflower or mustard)", "pc", "tsp", 1, 0, 0, 5, 1, 1, { plural: "tsp" }),
  // fruit, veg
  food("banana", "Banana", "pc", "banana", 1, 1.1, 23, 0.3, 0.5, 1, { plural: "bananas" }),
  food("apple", "Apple", "pc", "apple", 1, 0.4, 21, 0.3, 0.5, 1),
  food("fruit", "Seasonal fruit (papaya, guava, orange)", "pc", "cup", 1, 1, 16, 0.3, 0.5, 1),
  food("sabzi", "Dry sabzi (bhindi, cabbage, beans)", "pc", "cup", 1, 3, 11, 4.5, 0.5, 1),
  food("palak", "Palak (spinach) sabzi", "pc", "cup", 1, 4, 7, 4.5, 0.5, 1),
  food("salad", "Cucumber-tomato salad", "pc", "bowl", 1, 1.2, 6, 0.3, 1, 1),
  food("beetsalad", "Carrot-beetroot salad", "pc", "bowl", 1, 1.5, 11, 0.3, 1, 1, { root: true }),
  food("sambar", "Sambar", "pc", "cup", 1, 6, 17, 2.5, 0.5, 1, { root: true }),
];

export const FOOD_DB: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));
export const FOOD_BY_NAME: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.name, f]));

export function isAllowed(f: Food, diet: Diet, avoid: Avoid[]): boolean {
  if (f.root && diet === "jain") return false;
  if (diet === "vegan" && f.animal !== "none") return false;
  if ((diet === "veg" || diet === "jain") && (f.animal === "egg" || f.animal === "meat")) return false;
  if (diet === "egg" && f.animal === "meat") return false;
  if (f.allergens.some((a) => avoid.includes(a))) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Meal layouts and templates                                          */
/* ------------------------------------------------------------------ */

type SlotKey = "breakfast" | "mid" | "lunch" | "evening" | "dinner";
type Slot = { key: SlotKey; kcalShare: number; protShare: number };

const SLOT_DEFS: Record<SlotKey, { name: string; time: string; main: boolean }> = {
  breakfast: { name: "Breakfast", time: "8:00 am", main: true },
  mid: { name: "Mid-morning snack", time: "11:00 am", main: false },
  lunch: { name: "Lunch", time: "1:00 pm", main: true },
  evening: { name: "Evening snack", time: "5:00 pm", main: false },
  dinner: { name: "Dinner", time: "8:30 pm", main: true },
};

export const MEAL_LAYOUTS: Record<3 | 4 | 5, Slot[]> = {
  3: [
    { key: "breakfast", kcalShare: 0.28, protShare: 0.3 },
    { key: "lunch", kcalShare: 0.38, protShare: 0.37 },
    { key: "dinner", kcalShare: 0.34, protShare: 0.33 },
  ],
  4: [
    { key: "breakfast", kcalShare: 0.24, protShare: 0.25 },
    { key: "lunch", kcalShare: 0.33, protShare: 0.3 },
    { key: "evening", kcalShare: 0.13, protShare: 0.15 },
    { key: "dinner", kcalShare: 0.3, protShare: 0.3 },
  ],
  5: [
    { key: "breakfast", kcalShare: 0.22, protShare: 0.22 },
    { key: "mid", kcalShare: 0.1, protShare: 0.12 },
    { key: "lunch", kcalShare: 0.28, protShare: 0.26 },
    { key: "evening", kcalShare: 0.12, protShare: 0.14 },
    { key: "dinner", kcalShare: 0.28, protShare: 0.26 },
  ],
};

type CompSpec = { alts: string[]; min: number; max: number; req: boolean; kind?: "fat" | "boost" };
type Template = { name: string; comps: CompSpec[] };

// min/max are multiples of the food's typical portion
const c = (alts: string[], min: number, max: number, req = false): CompSpec => ({ alts, min, max, req });
const FAT: CompSpec = { alts: ["ghee", "oil"], min: 0, max: 2, req: false, kind: "fat" };
const BOOST: CompSpec = { alts: ["whey", "pea"], min: 0, max: 2, req: false, kind: "boost" };
const FRUIT = c(["fruit", "banana", "apple"], 0, 1.5);
const SALAD = c(["salad", "beetsalad"], 1, 1);
const ROTI = c(["roti", "jowar", "bajra"], 0.5, 2.5, true);
const DAL = c(["toor", "moongdal", "masoor"], 0.5, 3);
const SABZI = c(["sabzi", "palak"], 0.5, 1.5);
const LUNCH_ANCHOR = c(["chicken", "paneer", "fish", "lfpaneer", "tofu", "soya", "sprouts"], 0.4, 2.5);
const DINNER_ANCHOR = c(["paneer", "chicken", "tofu", "fish", "lfpaneer", "eggs", "soya", "sprouts"], 0.4, 2.5);

const TEMPLATES: Record<SlotKey, Template[]> = {
  breakfast: [
    {
      name: "Chilla plate",
      comps: [c(["mchilla", "bchilla"], 0.5, 2.5, true), c(["greek", "curd", "sprouts", "tofu"], 0, 2), FRUIT, FAT, BOOST],
    },
    {
      name: "Poha or porridge bowl",
      comps: [
        c(["poha", "upma", "dalia", "ragi"], 0.5, 3, true),
        c(["eggs", "paneer", "tofu", "sprouts"], 0, 2.5),
        c(["almonds", "peanuts", "seeds"], 0, 1.5),
        FAT,
        BOOST,
      ],
    },
    {
      name: "Idli or dosa platter",
      comps: [
        c(["idli", "dosa"], 0.5, 2.5, true),
        c(["sambar", "sprouts", "moongdal"], 0.5, 2),
        c(["ewhite", "eggs", "paneer", "tofu", "curd"], 0, 2.5),
        FAT,
        BOOST,
      ],
    },
    {
      name: "Oats bowl",
      comps: [
        c(["oats", "ragi", "dalia"], 0.5, 2.5, true),
        c(["milk", "soymilk", "greek", "curd"], 0, 2.5),
        c(["banana", "apple", "fruit", "dates"], 0, 1.5),
        c(["almonds", "peanuts", "pbutter", "seeds"], 0, 2),
        BOOST,
      ],
    },
    {
      name: "Egg breakfast",
      comps: [c(["eggs"], 0.5, 3, true), c(["bread", "roti", "poha"], 0.5, 2.5), c(["ewhite"], 0, 2.5), FRUIT, FAT],
    },
    {
      name: "Bhurji toast",
      comps: [
        c(["paneer", "lfpaneer", "tofu"], 0.5, 2.5, true),
        c(["bread", "roti", "jowar", "poha"], 0.5, 2.5),
        FRUIT,
        FAT,
        BOOST,
      ],
    },
  ],
  lunch: [
    { name: "Thali", comps: [ROTI, DAL, LUNCH_ANCHOR, SABZI, SALAD, FAT] },
    {
      name: "Rice bowl",
      comps: [c(["rice", "brice"], 0.5, 2.5, true), c(["rajma", "chole"], 0.5, 2.5), LUNCH_ANCHOR, SALAD, c(["curd", "greek"], 0, 1.5), FAT],
    },
    { name: "Khichdi bowl", comps: [c(["khichdi"], 0.5, 3, true), LUNCH_ANCHOR, SABZI, c(["curd", "greek"], 0, 1.5), SALAD, FAT] },
    { name: "Roti and chole", comps: [ROTI, c(["chole", "rajma"], 0.5, 2.5, true), LUNCH_ANCHOR, SALAD, FAT] },
    { name: "Grain bowl", comps: [c(["brice", "rice", "sweetpot", "corn"], 0.5, 2.5, true), LUNCH_ANCHOR, SABZI, DAL, FAT] },
  ],
  dinner: [
    { name: "Roti, sabzi and protein", comps: [ROTI, DINNER_ANCHOR, SABZI, DAL, SALAD, FAT] },
    { name: "Khichdi plate", comps: [c(["khichdi"], 0.5, 3, true), DINNER_ANCHOR, SABZI, c(["curd", "greek"], 0, 1.5), FAT] },
    { name: "Rice and dal", comps: [c(["rice", "brice"], 0.5, 2.5, true), c(["toor", "moongdal", "masoor"], 0.5, 3), DINNER_ANCHOR, SALAD, FAT] },
    { name: "Chilla dinner", comps: [c(["mchilla", "bchilla"], 0.5, 2.5, true), DINNER_ANCHOR, SABZI, SALAD, FAT] },
    { name: "Millet plate", comps: [c(["jowar", "bajra"], 0.5, 2.5, true), DAL, DINNER_ANCHOR, SABZI, FAT] },
  ],
  mid: [],
  evening: [],
};

const SNACKS: Template[] = [
  { name: "Roasted chana and fruit", comps: [c(["rchana"], 0.3, 2, true), c(["fruit", "banana", "apple", "dates"], 0, 2), BOOST] },
  { name: "Yogurt bowl", comps: [c(["greek", "curd"], 0.3, 2, true), c(["fruit", "banana", "apple"], 0, 1.5), c(["almonds", "peanuts", "seeds"], 0, 2), BOOST] },
  { name: "Sprouts chaat", comps: [c(["sprouts"], 0.5, 2.5, true), c(["rchana", "makhana"], 0, 1.5), FRUIT, BOOST] },
  { name: "Makhana and shake", comps: [c(["makhana"], 0.4, 2, true), BOOST, FRUIT] },
  { name: "Sattu drink", comps: [c(["sattu"], 0.3, 2, true), c(["banana", "dates", "apple"], 0, 1.5), c(["milk", "soymilk"], 0, 1.5), BOOST] },
  { name: "Nut and fruit", comps: [c(["almonds", "peanuts", "pbutter", "seeds"], 0.5, 2.5, true), FRUIT, c(["curd", "greek", "milk"], 0, 1.5)] },
  { name: "Egg snack", comps: [c(["eggs", "ewhite"], 0.5, 2.5, true), FRUIT, c(["rchana"], 0, 1.5)] },
  { name: "Protein bites", comps: [c(["lfpaneer", "tofu", "chicken", "soya"], 0.3, 2, true), SALAD, FRUIT, FAT] },
];
TEMPLATES.mid = SNACKS;
TEMPLATES.evening = SNACKS;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const round5 = (x: number) => Math.round(x / 5) * 5;
const floor5 = (x: number) => Math.floor(x / 5) * 5;

function fmtCount(q: number): string {
  const whole = Math.floor(q);
  const half = Math.abs(q - whole - 0.5) < 1e-9;
  if (half) return whole === 0 ? "½" : `${whole}½`;
  return String(r1(q));
}

function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

type Ctx = { diet: Diet; avoid: Avoid[]; h: number };

function pickFood(alts: string[], ctx: Ctx, salt: number, used: Set<string>): Food | null {
  let ok = alts
    .map((id) => FOOD_DB[id])
    .filter((f) => f && isAllowed(f, ctx.diet, ctx.avoid) && !used.has(f.id));
  if (!ok.length) return null;
  if (ctx.diet === "nonveg") {
    const a = ok.filter((f) => f.animal === "meat" || f.animal === "egg");
    if (a.length) ok = a;
  } else if (ctx.diet === "egg") {
    const a = ok.filter((f) => f.animal === "egg");
    if (a.length) ok = a;
  }
  return ok[(ctx.h + salt) % ok.length];
}

type Resolved = { food: Food; spec: CompSpec };

function resolve(t: Template, ctx: Ctx, salt: number): Resolved[] | null {
  const used = new Set<string>();
  const out: Resolved[] = [];
  for (let i = 0; i < t.comps.length; i++) {
    const spec = t.comps[i];
    const f = pickFood(spec.alts, ctx, salt + i * 5, used);
    if (!f) {
      if (spec.req) return null;
      continue;
    }
    used.add(f.id);
    out.push({ food: f, spec });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Portion solver                                                      */
/* ------------------------------------------------------------------ */

type V = { k: number; p: number; c: number; f: number; b: number; r: number };
type Comp = { food: Food; spec: CompSpec; qtys: number[]; v: V[]; typIdx: number };
type Target = { k: number; p: number; f: number };

function qtyList(f: Food, minM: number, maxM: number): number[] {
  const hi = Math.min(3 * f.typ, Math.floor((maxM * f.typ) / f.step + 1e-9) * f.step);
  const lo = Math.max(f.step, Math.ceil((minM * f.typ) / f.step - 1e-9) * f.step);
  const out: number[] = [];
  if (minM === 0) out.push(0);
  for (let q = lo; q <= hi + 1e-9; q += f.step) out.push(r2(q));
  if (out.length === 0 || (out.length === 1 && out[0] === 0)) out.push(r2(lo));
  return out;
}

function buildComp(r: Resolved): Comp {
  const f = r.food;
  const qtys = qtyList(f, r.spec.min, r.spec.max);
  const v: V[] = qtys.map((q) => {
    const x = q / f.base;
    return {
      k: f.kcalPer * x,
      p: f.p * x,
      c: f.c * x,
      f: f.f * x,
      b: r.spec.kind === "boost" ? q : 0,
      r: q > 0 ? 0.0003 * Math.log(q / f.typ) ** 2 : 0,
    };
  });
  let typIdx = 0;
  let bestD = Infinity;
  qtys.forEach((q, i) => {
    if (q === 0) return;
    const d = Math.abs(q - f.typ);
    if (d < bestD) {
      bestD = d;
      typIdx = i;
    }
  });
  return { food: f, spec: r.spec, qtys, v, typIdx };
}

type Sums = { k: number; p: number; f: number; b: number; r: number };

function objective(s: Sums, T: Target): number {
  const ek = (s.k - T.k) / T.k;
  const ep = (s.p - T.p) / T.p;
  const ef = ((s.f - T.f) * 9) / T.k;
  const pen = ep < 0 ? 5 * ep * ep : 1.2 * ep * ep;
  return 20 * ek * ek + pen + 0.4 * ef * ef + 0.004 * s.b + s.r;
}

function sumsOf(comps: Comp[], idx: number[]): Sums {
  const s: Sums = { k: 0, p: 0, f: 0, b: 0, r: 0 };
  for (let i = 0; i < comps.length; i++) {
    const v = comps[i].v[idx[i]];
    s.k += v.k;
    s.p += v.p;
    s.f += v.f;
    s.b += v.b;
    s.r += v.r;
  }
  return s;
}

function descend(comps: Comp[], T: Target, start: number[]): { idx: number[]; o: number } {
  const idx = start.slice();
  let s = sumsOf(comps, idx);
  let o = objective(s, T);
  for (let it = 0; it < 40; it++) {
    let improved = false;
    for (let i = 0; i < comps.length; i++) {
      const cur = comps[i].v[idx[i]];
      const base: Sums = { k: s.k - cur.k, p: s.p - cur.p, f: s.f - cur.f, b: s.b - cur.b, r: s.r - cur.r };
      let bestJ = idx[i];
      let bestO = o;
      for (let j = 0; j < comps[i].v.length; j++) {
        const v = comps[i].v[j];
        const oo = objective({ k: base.k + v.k, p: base.p + v.p, f: base.f + v.f, b: base.b + v.b, r: base.r + v.r }, T);
        if (oo < bestO - 1e-12) {
          bestO = oo;
          bestJ = j;
        }
      }
      if (bestJ !== idx[i]) {
        const v = comps[i].v[bestJ];
        s = { k: base.k + v.k, p: base.p + v.p, f: base.f + v.f, b: base.b + v.b, r: base.r + v.r };
        idx[i] = bestJ;
        o = bestO;
        improved = true;
      }
    }
    if (!improved) break;
  }
  return { idx, o };
}

function pairRefine(comps: Comp[], T: Target, idx0: number[]): number[] {
  let idx = idx0.slice();
  let o = objective(sumsOf(comps, idx), T);
  for (let i = 0; i < comps.length; i++) {
    for (let j = i + 1; j < comps.length; j++) {
      for (let a = 0; a < comps[i].v.length; a++) {
        for (let b = 0; b < comps[j].v.length; b++) {
          const t = idx.slice();
          t[i] = a;
          t[j] = b;
          const oo = objective(sumsOf(comps, t), T);
          if (oo < o - 1e-12) {
            o = oo;
            idx = t;
          }
        }
      }
    }
  }
  return idx;
}

function solveMeal(comps: Comp[], T: Target): number[] {
  const starts: number[][] = [
    comps.map((c) => c.typIdx),
    comps.map((c) => (c.qtys[0] === 0 ? 0 : Math.min(c.typIdx, 0))),
    comps.map((c) => c.qtys.length - 1),
    comps.map((c) => (c.qtys[0] === 0 && c.spec.kind ? 0 : c.typIdx)),
  ];
  let best = descend(comps, T, starts[0]);
  for (let s = 1; s < starts.length; s++) {
    const r = descend(comps, T, starts[s]);
    if (r.o < best.o) best = r;
  }
  let idx = best.idx;
  const s = sumsOf(comps, idx);
  const ek = Math.abs(s.k - T.k) / T.k;
  const ps = Math.max(0, (T.p - s.p) / T.p);
  if (ek > 0.04 || ps > 0.06) idx = pairRefine(comps, T, idx);
  return idx;
}

function mealScore(comps: Comp[], idx: number[], T: Target) {
  const s = sumsOf(comps, idx);
  const ek = Math.abs(s.k - T.k) / T.k;
  const ps = Math.max(0, (T.p - s.p) / T.p);
  return { ek, ps, score: ek + 1.5 * ps };
}

function chooseTemplate(slotIdx: number, slot: Slot, ctx: Ctx, T: Target): Comp[] {
  const list = TEMPLATES[slot.key];
  const n = list.length;
  const start = (ctx.h + slotIdx * 3 + hash32(slot.key)) % n;
  let best: { comps: Comp[]; score: number } | null = null;
  for (let j = 0; j < n; j++) {
    const ti = (start + j) % n;
    const res = resolve(list[ti], ctx, slotIdx * 17 + ti * 3);
    if (!res) continue;
    const comps = res.map(buildComp);
    const idx = solveMeal(comps, T);
    const m = mealScore(comps, idx, T);
    if (!best || m.score < best.score) best = { comps, score: m.score };
    if (m.ek <= 0.04 && m.ps <= 0.05) return comps;
  }
  return best!.comps;
}

/* ------------------------------------------------------------------ */
/* Day planner                                                         */
/* ------------------------------------------------------------------ */

function proteinSplit(layout: Slot[], P: number): number[] {
  const out = layout.map((s) => s.protShare * P);
  const mainMin = Math.min(25, 0.3 * P);
  const fixed = layout.map(() => false);
  for (let it = 0; it < 4; it++) {
    let deficit = 0;
    layout.forEach((s, i) => {
      if (SLOT_DEFS[s.key].main && out[i] < mainMin) {
        deficit += mainMin - out[i];
        out[i] = mainMin;
        fixed[i] = true;
      }
    });
    if (deficit <= 0) break;
    const pool = layout.reduce((a, _s, i) => a + (fixed[i] ? 0 : out[i]), 0);
    if (pool <= deficit) break;
    layout.forEach((_s, i) => {
      if (!fixed[i]) out[i] -= (deficit * out[i]) / pool;
    });
  }
  return out;
}

type DayResult = { comps: Comp[][]; idx: number[][]; k: number; p: number };

function planDay(layout: Slot[], ctx: Ctx, K: number, P: number, F: number, chosen?: Comp[][]): DayResult {
  const pSplit = proteinSplit(layout, P);
  const KtBase = layout.map((s) => K * s.kcalShare);
  const Kt = KtBase.slice();
  const Pt = pSplit.slice();
  const Ft = layout.map((s) => F * s.kcalShare);
  const comps =
    chosen ?? layout.map((s, i) => chooseTemplate(i, s, ctx, { k: Kt[i], p: Pt[i], f: Ft[i] }));

  let best: DayResult | null = null;
  let bestViol = Infinity;
  for (let pass = 0; pass < 6; pass++) {
    const idx = comps.map((cs, i) => solveMeal(cs, { k: Kt[i], p: Pt[i], f: Ft[i] }));
    let k = 0;
    let p = 0;
    comps.forEach((cs, i) => {
      const s = sumsOf(cs, idx[i]);
      k += s.k;
      p += s.p;
    });
    const viol = Math.max(Math.abs(k - K) / K / 0.015, Math.max(0, P - p) / (0.03 * P));
    if (viol < bestViol) {
      bestViol = viol;
      best = { comps, idx, k, p };
    }
    if (viol <= 1) break;
    const kr = K / k;
    for (let i = 0; i < layout.length; i++) {
      Kt[i] = Math.min(KtBase[i] * 1.06, Math.max(KtBase[i] * 0.94, Kt[i] * kr));
    }
    const short = P * 1.01 - p;
    if (short > 0) for (let i = 0; i < layout.length; i++) Pt[i] += short * (pSplit[i] / P);
  }
  return best!;
}

function polish(day: DayResult, layout: Slot[], K: number, P: number, overshoot = 1.15): DayResult {
  const idx = day.idx.map((a) => a.slice());
  const shareK = layout.map((s) => K * s.kcalShare);
  const fatFloor = (0.21 * K) / 9;
  const viol = (mk: number[], tk: number, tp: number, tf: number) => {
    let sc = 400 * Math.max(0, Math.abs(tk - K) / K - 0.008) ** 2;
    sc += 400 * Math.max(0, (0.975 * P - tp) / P) ** 2;
    sc += 100 * Math.max(0, (tp - overshoot * P) / P) ** 2;
    sc += 400 * Math.max(0, (fatFloor - tf) / fatFloor) ** 2;
    for (let i = 0; i < mk.length; i++) sc += 300 * Math.max(0, Math.abs(mk[i] - shareK[i]) / shareK[i] - 0.04) ** 2;
    return sc;
  };
  const sums = day.comps.map((cs, i) => sumsOf(cs, idx[i]));
  const mk = sums.map((x) => x.k);
  const mr = sums.map((x) => x.r);
  let tk = mk.reduce((a, b) => a + b, 0);
  let tp = sums.reduce((a, x) => a + x.p, 0);
  let tf = sums.reduce((a, x) => a + x.f, 0);
  const moves: [number, number, number][] = [];
  for (let i = 0; i < day.comps.length; i++)
    for (let j = 0; j < day.comps[i].length; j++)
      for (let o = 0; o < day.comps[i][j].v.length; o++) moves.push([i, j, o]);

  const apply = (i: number, j: number, o: number) => {
    const old = day.comps[i][j].v[idx[i][j]];
    const v = day.comps[i][j].v[o];
    mk[i] += v.k - old.k;
    mr[i] += v.r - old.r;
    tk += v.k - old.k;
    tp += v.p - old.p;
    tf += v.f - old.f;
    idx[i][j] = o;
  };
  const total = () => viol(mk, tk, tp, tf) + mr.reduce((a, b) => a + b, 0);

  for (let it = 0; it < 40; it++) {
    const base = total();
    let best = base;
    let move: [number, number, number] | null = null;
    for (const [i, j, o] of moves) {
      const cur = idx[i][j];
      if (o === cur) continue;
      apply(i, j, o);
      const sc = total();
      apply(i, j, cur);
      if (sc < best - 1e-12) {
        best = sc;
        move = [i, j, o];
      }
    }
    if (move) {
      apply(move[0], move[1], move[2]);
      continue;
    }
    if (viol(mk, tk, tp, tf) < 1e-7) break;
    // stuck with a violation: try pairs of moves
    let bestPair: [number, number, number, number, number, number] | null = null;
    for (let a = 0; a < moves.length; a++) {
      const [i1, j1, o1] = moves[a];
      const c1 = idx[i1][j1];
      if (o1 === c1) continue;
      apply(i1, j1, o1);
      for (let b = a + 1; b < moves.length; b++) {
        const [i2, j2, o2] = moves[b];
        if (i1 === i2 && j1 === j2) continue;
        const c2 = idx[i2][j2];
        if (o2 === c2) continue;
        apply(i2, j2, o2);
        const sc = total();
        apply(i2, j2, c2);
        if (sc < best - 1e-12) {
          best = sc;
          bestPair = [i1, j1, o1, i2, j2, o2];
        }
      }
      apply(i1, j1, c1);
    }
    if (!bestPair) break;
    apply(bestPair[0], bestPair[1], bestPair[2]);
    apply(bestPair[3], bestPair[4], bestPair[5]);
  }
  return { comps: day.comps, idx, k: tk, p: tp };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_FACTOR = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725 } as const;
const GOAL_LABEL = { "fat-loss": "Lean cut", muscle: "Lean bulk", maintain: "Maintenance", recomp: "Recomposition" } as const;
const DIET_LABEL = { veg: "veg", jain: "Jain", vegan: "vegan", egg: "egg + veg", nonveg: "non-veg" } as const;

export function generateNutritionPlan(intake: NutritionIntake): NutritionPlan {
  const { goal, diet, sex, age, heightCm, weightKg, activity, mealsPerDay } = intake;
  const avoid = [...intake.avoid].sort();

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[activity];
  let kcalRaw: number;
  if (goal === "fat-loss") {
    kcalRaw = Math.max(tdee * 0.8, bmr * 1.05, sex === "male" ? 1500 : 1200);
  } else if (goal === "muscle") kcalRaw = tdee * 1.1;
  else if (goal === "recomp") kcalRaw = tdee * 0.95;
  else kcalRaw = tdee;
  const kcal = Math.round(kcalRaw / 10) * 10;

  const gPerKg = { "fat-loss": 2.0, muscle: 1.8, recomp: 2.0, maintain: 1.5 }[goal];
  let protein = round5(weightKg * gPerKg);
  const nominalProtein = protein;
  const fat = Math.round(Math.max(0.7 * weightKg, (0.25 * kcal) / 9));

  const ctx: Ctx = {
    diet,
    avoid,
    h: hash32([goal, diet, avoid.join("+"), sex, age, heightCm, weightKg, activity, mealsPerDay].join("|")),
  };
  const layout = MEAL_LAYOUTS[mealsPerDay];

  const attempt = (P: number, chosen?: Comp[][]) => {
    let d = polish(planDay(layout, ctx, kcal, P, fat, chosen), layout, kcal, P, 1.15);
    if (Math.abs(d.k - kcal) / kcal > 0.015) {
      const d2 = polish(d, layout, kcal, P, 1.55);
      if (Math.abs(d2.k - kcal) < Math.abs(d.k - kcal)) d = d2;
    }
    return d;
  };
  let day = attempt(protein);
  for (let i = 0; i < 12; i++) {
    const kOver = day.k > kcal * 1.02 && day.p < protein * 1.08 && protein * 0.95 >= 0.65 * nominalProtein;
    const pShort = day.p < 0.96 * protein;
    if (!kOver && !pShort) break;
    protein = Math.max(40, pShort ? floor5(day.p * 0.99) : floor5(protein * 0.95));
    day = attempt(protein, day.comps);
  }

  const fiber = Math.round((14 * kcal) / 1000);
  const waterL = r1(Math.max(2.0, weightKg * 0.035) + (activity === "moderate" || activity === "high" ? 0.5 : 0));

  let boosters = 0;
  const meals: PlannedMeal[] = layout.map((slot, i) => {
    const items: FoodItem[] = [];
    day.comps[i].forEach((cp, j) => {
      const q = cp.qtys[day.idx[i][j]];
      if (q <= 0) return;
      if (cp.spec.kind === "boost") boosters += 1;
      const x = q / cp.food.base;
      const f = cp.food;
      let qty: string;
      if (f.unit === "g") qty = `${q} g`;
      else if (f.unit === "ml") qty = `${q} ml`;
      else qty = `${fmtCount(q)} ${q <= 1 ? f.label : f.plural}`;
      items.push({
        name: f.name,
        qty,
        kcal: Math.round(f.kcalPer * x),
        protein: r1(f.p * x),
        carbs: r1(f.c * x),
        fat: r1(f.f * x),
      });
    });
    const sum = (k: "kcal" | "protein" | "carbs" | "fat") => items.reduce((a, it) => a + it[k], 0);
    return {
      slot: SLOT_DEFS[slot.key].name,
      time: SLOT_DEFS[slot.key].time,
      items,
      kcal: Math.round(sum("kcal")),
      protein: r1(sum("protein")),
      carbs: r1(sum("carbs")),
      fat: r1(sum("fat")),
    };
  });

  protein = round5(meals.reduce((a, m) => a + m.protein, 0));
  const capped = meals.reduce((a, m) => a + m.protein, 0) < 0.95 * nominalProtein;

  const timing =
    goal === "muscle"
      ? "Eat a carb and protein meal 1–2 hours before training and another within 2 hours after. Do not skip breakfast."
      : goal === "fat-loss"
        ? "Keep your biggest carb portion around training and have a protein-rich meal within 2–3 hours after. Finish dinner at least 2 hours before bed."
        : "Eat a protein-rich meal within 2–3 hours after training and keep meal times steady from day to day.";
  const adjust =
    goal === "fat-loss"
      ? "Weigh yourself on 3 mornings a week and compare weekly averages. If your weight has not dropped after 2 weeks, cut 150 kcal (about a roti and a spoon of ghee). If you lose more than 0.75 kg a week, add 150 kcal back."
      : goal === "muscle"
        ? "Weigh yourself on 3 mornings a week and compare weekly averages. If your weight has not risen after 2 weeks, add 150 kcal. If you gain more than 0.5 kg a week, cut 150 kcal."
        : "Weigh yourself on 3 mornings a week and compare weekly averages. If your weight drifts more than 1 kg in 2 weeks, move calories up or down by 150 kcal.";
  const swaps: string[] = [];
  const ok = (id: string) => isAllowed(FOOD_DB[id], diet, avoid);
  if (ok("paneer")) swaps.push("100–150 g paneer");
  if (ok("tofu")) swaps.push("150 g tofu");
  if (ok("chicken")) swaps.push("100 g chicken");
  else if (ok("eggs")) swaps.push("2 eggs");
  swaps.push("an extra cup of dal or sprouts");
  const swapText = swaps.slice(0, 3).join(", ").replace(/, ([^,]*)$/, " or $1");
  let supp = boosters
    ? `Your menu uses ${boosters} protein scoop${boosters > 1 ? "s" : ""} to close the gap. A scoop is optional: swap it for ${swapText}.`
    : "Whey or pea protein is optional. It only fills gaps, and the same protein from food works equally well.";
  if (capped) {
    supp += ` Protein is held at about ${protein} g, the most we could fit inside ${kcal} kcal with your food choices. A pea-protein scoop or two is the easiest way to go higher.`;
  }
  if (diet === "jain") supp += " Cook without onion, garlic and root vegetables.";
  if (diet === "vegan" || avoid.includes("dairy")) supp += " Cook with oil instead of ghee.";
  const notes = [
    timing,
    `Drink ${waterL} L of water a day. Keep a bottle in sight and finish half of it by lunch.`,
    "If you are hungry between meals, drink a glass of water, then have a salad or a cup of sprouts. Do not cut the next meal.",
    adjust,
    supp,
    "These numbers are estimates from standard formulas, not medical advice. See a doctor or dietitian if you have a health condition.",
  ];

  const carbs = Math.round(meals.reduce((a, m) => a + m.carbs, 0));
  const fatActual = Math.round(meals.reduce((a, m) => a + m.fat, 0));

  const title = `${GOAL_LABEL[goal]} · ${kcal.toLocaleString("en-US")} kcal · ${protein} g protein · ${DIET_LABEL[diet]}`;

  return {
    title,
    intake: { ...intake, avoid },
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    protein,
    carbs,
    fat: fatActual,
    fiber,
    waterL,
    meals,
    notes,
    createdAt: Date.now(),
  };
}
