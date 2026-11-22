import { FOOD_BY_NAME, MEAL_LAYOUTS, generateNutritionPlan, isAllowed } from "../lib/nutrition-engine";
import type { Activity, Avoid, Diet, NutritionGoal, NutritionIntake, NutritionPlan } from "../lib/types";

const goals: NutritionGoal[] = ["fat-loss", "muscle", "maintain", "recomp"];
const diets: Diet[] = ["veg", "jain", "vegan", "egg", "nonveg"];
const avoids: Avoid[][] = [[], ["dairy"], ["nuts"], ["soy"], ["gluten"], ["dairy", "nuts"], ["gluten", "soy"]];
const sexes = ["male", "female"] as const;
const activities: Activity[] = ["sedentary", "light", "moderate", "high"];
const meals = [3, 4, 5] as const;
const bodies = [
  { weightKg: 45, heightCm: 150, age: 19 },
  { weightKg: 58, heightCm: 160, age: 24 },
  { weightKg: 68, heightCm: 172, age: 19 },
  { weightKg: 78, heightCm: 178, age: 32 },
  { weightKg: 92, heightCm: 180, age: 40 },
  { weightKg: 110, heightCm: 175, age: 45 },
];

const NAME_RULES: Record<string, RegExp> = {
  jainRoot: /potato|onion|garlic|carrot|beet|radish|sweet potato|sambar/i,
  noEgg: /egg/i,
  noMeat: /chicken|fish/i,
  noDairy: /paneer|curd|dahi|toned milk|whey|ghee|yogurt|buttermilk/i,
  nuts: /almond|peanut/i,
  gluten: /whole-wheat|oats|dalia|upma/i,
  soy: /soya|tofu|soy milk/i,
};

function qtyNum(q: string): number {
  const m = q.match(/^(\d+(?:\.\d+)?)?(½)?/);
  return (m?.[1] ? parseFloat(m[1]) : 0) + (m?.[2] ? 0.5 : 0);
}
const failures: string[] = [];
const cats: Record<string, number> = {};
function fail(msg: string, i: NutritionIntake) {
  const cat = msg.replace(/[0-9.]+/g, "#").slice(0, 40);
  cats[cat] = (cats[cat] ?? 0) + 1;
  if (failures.length < 25) {
    failures.push(`${msg}  [${i.goal} ${i.diet} avoid=${i.avoid.join("+") || "-"} ${i.sex} ${i.weightKg}kg/${i.heightCm}cm/${i.age}y ${i.activity} ${i.mealsPerDay}m]`);
  }
  failCount++;
}
let failCount = 0;

function strip(p: NutritionPlan) {
  return JSON.stringify({ ...p, createdAt: 0 });
}

function check(plan: NutritionPlan) {
  const i = plan.intake;
  const allFoods = plan.meals.flatMap((m) => m.items.map((it) => ({ m, it })));

  // (a) diet and avoid rules, checked via the DB flags and independently by name
  for (const { it } of allFoods) {
    const f = FOOD_BY_NAME[it.name];
    if (!f) {
      fail(`unknown food "${it.name}"`, i);
      continue;
    }
    if (!isAllowed(f, i.diet, i.avoid)) fail(`DB rule violated by ${it.name}`, i);
    if (i.diet === "jain" && NAME_RULES.jainRoot.test(it.name)) fail(`jain root veg: ${it.name}`, i);
    if ((i.diet === "veg" || i.diet === "jain" || i.diet === "vegan") && (NAME_RULES.noEgg.test(it.name) || NAME_RULES.noMeat.test(it.name))) fail(`non-veg item: ${it.name}`, i);
    if (i.diet === "egg" && NAME_RULES.noMeat.test(it.name)) fail(`meat in egg diet: ${it.name}`, i);
    if ((i.diet === "vegan" || i.avoid.includes("dairy")) && NAME_RULES.noDairy.test(it.name)) fail(`dairy item: ${it.name}`, i);
    if (i.diet === "vegan" && NAME_RULES.noEgg.test(it.name)) fail(`egg in vegan: ${it.name}`, i);
    if (i.avoid.includes("nuts") && NAME_RULES.nuts.test(it.name)) fail(`nuts item: ${it.name}`, i);
    if (i.avoid.includes("gluten") && NAME_RULES.gluten.test(it.name)) fail(`gluten item: ${it.name}`, i);
    if (i.avoid.includes("soy") && NAME_RULES.soy.test(it.name)) fail(`soy item: ${it.name}`, i);
  }

  // (b) day totals
  const k = plan.meals.reduce((a, m) => a + m.kcal, 0);
  const p = plan.meals.reduce((a, m) => a + m.protein, 0);
  const kErr = Math.abs(k - plan.kcal) / plan.kcal;
  if (kErr > 0.03) fail(`day kcal off by ${(kErr * 100).toFixed(1)}% (${k} vs ${plan.kcal})`, i);
  if (p < 0.95 * plan.protein) fail(`day protein ${p.toFixed(0)} < 95% of ${plan.protein}`, i);
  const nominal = Math.round((i.weightKg * { "fat-loss": 2, muscle: 1.8, recomp: 2, maintain: 1.5 }[i.goal]) / 5) * 5;
  const isCapped = p < 0.95 * nominal;
  const hasCapNote = plan.notes.some((n) => n.includes("most we could fit"));
  if (isCapped && !hasCapNote) fail("protein below 95% of nominal target without a note", i);
  if (!isCapped && hasCapNote) fail("cap note without capped protein", i);
  const supp = plan.notes.find((n) => n.includes("protein scoop")) ?? "";
  if (i.diet === "vegan" && /paneer|egg|chicken/.test(supp)) fail("swap suggestion breaks vegan diet", i);
  if ((i.diet === "veg" || i.diet === "jain") && /egg|chicken/.test(supp)) fail("swap suggestion breaks veg diet", i);
  if (i.avoid.includes("dairy") && /paneer/.test(supp)) fail("swap suggestion has dairy", i);
  if (i.avoid.includes("soy") && /tofu/.test(supp)) fail("swap suggestion has soy", i);
  if (plan.notes.length < 4 || plan.notes.length > 6) fail(`notes count ${plan.notes.length}`, i);
  const dayFat = plan.meals.reduce((a, m) => a + m.fat, 0);
  if ((dayFat * 9) / plan.kcal < 0.19) fail(`fat only ${(((dayFat * 9) / plan.kcal) * 100).toFixed(0)}% of kcal`, i);
  if (plan.protein < 1.0 * i.weightKg) fail(`protein target capped too low: ${plan.protein} g for ${i.weightKg} kg`, i);

  // (c) per-meal kcal vs slot target
  const layout = MEAL_LAYOUTS[i.mealsPerDay];
  let worstMeal = 0;
  plan.meals.forEach((m, idx) => {
    const target = plan.kcal * layout[idx].kcalShare;
    const e = Math.abs(m.kcal - target) / target;
    worstMeal = Math.max(worstMeal, e);
    if (e > 0.1) fail(`${m.slot} kcal ${m.kcal} vs ${target.toFixed(0)} (${(e * 100).toFixed(1)}%)`, i);
  });

  // (d) fat-loss floor
  if (i.goal === "fat-loss") {
    const floor = Math.max(plan.bmr * 1.05, i.sex === "male" ? 1500 : 1200);
    if (plan.kcal < floor - 10) fail(`fat-loss kcal ${plan.kcal} under floor ${floor.toFixed(0)}`, i);
  }

  // (e) no empty meals, sane quantities
  for (const m of plan.meals) {
    if (m.items.length === 0) fail(`empty meal ${m.slot}`, i);
    for (const it of m.items) {
      const q = qtyNum(it.qty);
      if (/(^| )0\.5 |\b1\.5 /.test(it.qty)) fail(`machine-style qty: ${it.qty}`, i);
      if (/^1 \S+s$/.test(it.qty) && !/ (g|ml|tsp|tbsp|pcs)$/.test(it.qty)) fail(`plural for 1: ${it.qty}`, i);
      if (/^½ .*s$/.test(it.qty) && !/ (g|ml|tsp|tbsp|pcs)$/.test(it.qty)) fail(`plural for ½: ${it.qty}`, i);
      const f = FOOD_BY_NAME[it.name];
      if (!(q > 0) || /^0(\.0)?\s/.test(it.qty)) fail(`zero qty: ${it.name} ${it.qty}`, i);
      if (f && q > 3 * f.typ + 1e-9) fail(`qty over 3x typical: ${it.name} ${it.qty}`, i);
    }
  }

  // (g) macro/kcal consistency
  const conv = (kc: number, pp: number, cc: number, ff: number) => Math.abs(kc - (4 * pp + 4 * cc + 9 * ff));
  for (const { it } of allFoods) {
    if (conv(it.kcal, it.protein, it.carbs, it.fat) > Math.max(0.04 * it.kcal, 2)) fail(`item macros mismatch: ${it.name} ${it.qty}`, i);
  }
  if (conv(plan.kcal, plan.protein, plan.carbs, plan.fat) > 0.04 * plan.kcal) fail(`plan macros mismatch`, i);
  for (const m of plan.meals) {
    if (conv(m.kcal, m.protein, m.carbs, m.fat) > Math.max(0.04 * m.kcal, 3)) fail(`meal macros mismatch ${m.slot}`, i);
  }

  const c = plan.meals.reduce((a, m) => a + m.carbs, 0);
  const f = plan.meals.reduce((a, m) => a + m.fat, 0);
  return { kErr, pRatio: p / plan.protein, pkg: plan.protein / i.weightKg, fkg: (dayFat * 9) / plan.kcal, pOver: p / plan.protein, worstMeal, capped: plan.protein < Math.round(i.weightKg * ({ "fat-loss": 2, muscle: 1.8, recomp: 2, maintain: 1.5 }[i.goal]) / 5) * 5, cErr: (c - plan.carbs) / plan.carbs, fErr: (f - plan.fat) / plan.fat, boosts: allFoods.filter((x) => /protein/i.test(x.it.name)).length };
}

type Agg = { n: number; maxK: number; minP: number; maxMeal: number; capped: number; boosts: number; maxC: number; maxF: number; minPkg: number; minFkg: number };
const agg: Record<string, Agg> = {};
const menus = new Set<string>();
let total = 0;
const t0 = Date.now();

for (const goal of goals)
  for (const diet of diets)
    for (const avoid of avoids)
      for (const sex of sexes)
        for (const activity of activities)
          for (const mealsPerDay of meals)
            for (const body of bodies) {
              const intake: NutritionIntake = { goal, diet, avoid, sex, activity, mealsPerDay, ...body };
              const plan = generateNutritionPlan(intake);
              total++;
              const r = check(plan);
              menus.add(JSON.stringify(plan.meals.map((m) => m.items.map((x) => x.name + x.qty))));
              const key = `${goal}/${diet}`;
              const a = (agg[key] ??= { n: 0, maxK: 0, minP: 9, maxMeal: 0, capped: 0, boosts: 0, maxC: 0, maxF: 0, minPkg: 9, minFkg: 9 });
              a.n++;
              a.maxK = Math.max(a.maxK, r.kErr);
              a.minP = Math.min(a.minP, r.pRatio);
              a.maxMeal = Math.max(a.maxMeal, r.worstMeal);
              a.capped += r.capped ? 1 : 0;
              a.boosts += r.boosts;
              a.maxC = Math.max(a.maxC, Math.abs(r.cErr));
              a.maxF = Math.max(a.maxF, Math.abs(r.fErr));
              a.minPkg = Math.min(a.minPkg, r.pkg);
              a.minFkg = Math.min(a.minFkg, r.fkg);
            }

// (f) determinism and diet sensitivity
let detChecks = 0;
let sensChecks = 0;
let sensDiff = 0;
for (const goal of goals)
  for (const body of bodies)
    for (const mealsPerDay of meals) {
      const base: NutritionIntake = { goal, diet: "veg", avoid: [], sex: "male", activity: "moderate", mealsPerDay, ...body };
      const a = generateNutritionPlan(base);
      const b = generateNutritionPlan({ ...base });
      detChecks++;
      if (strip(a) !== strip(b)) fail("same intake gave different plans", base);
      for (const other of ["nonveg", "vegan"] as Diet[]) {
        const o = generateNutritionPlan({ ...base, diet: other });
        sensChecks++;
        if (JSON.stringify(a.meals) === JSON.stringify(o.meals)) fail(`veg and ${other} menus identical`, base);
      }
      for (const other of ["jain", "egg"] as Diet[]) {
        const o = generateNutritionPlan({ ...base, diet: other });
        sensChecks++;
        if (JSON.stringify(a.meals) !== JSON.stringify(o.meals)) sensDiff++;
      }
    }

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n${total} plans in ${secs}s, ${menus.size} distinct menus\n`);
console.log("goal/diet".padEnd(18), "n".padStart(5), "maxKcalErr".padStart(11), "minProt%".padStart(9), "maxMealErr".padStart(11), "capped".padStart(7), "scoops".padStart(7), "minP g/kg".padStart(9), "minFat%".padStart(9));
for (const [key, a] of Object.entries(agg)) {
  console.log(
    key.padEnd(18),
    String(a.n).padStart(5),
    `${(a.maxK * 100).toFixed(1)}%`.padStart(11),
    `${(a.minP * 100).toFixed(0)}%`.padStart(9),
    `${(a.maxMeal * 100).toFixed(1)}%`.padStart(11),
    String(a.capped).padStart(7),
    String(a.boosts).padStart(7),
    a.minPkg.toFixed(2).padStart(9),
    `${(a.minFkg * 100).toFixed(0)}%`.padStart(9)
  );
}
console.log(`\ndeterminism checks: ${detChecks}; diet-sensitivity checks: ${sensChecks} (jain/egg differ from veg in ${sensDiff}/${detChecks * 2})`);

function show(p: NutritionPlan) {
  console.log(`\n=== ${p.title}`);
  console.log(`BMR ${p.bmr}  TDEE ${p.tdee}  target ${p.kcal} kcal  P ${p.protein}  C ${p.carbs}  F ${p.fat}  fibre ${p.fiber}  water ${p.waterL} L`);
  for (const m of p.meals) {
    console.log(`\n${m.time.padEnd(8)} ${m.slot}  ${m.kcal} kcal  P${m.protein} C${m.carbs} F${m.fat}`);
    for (const it of m.items) console.log(`    - ${it.name}: ${it.qty}  (${it.kcal} kcal, P${it.protein})`);
  }
  console.log(`\nDay total: ${p.meals.reduce((a, m) => a + m.kcal, 0)} kcal, P ${p.meals.reduce((a, m) => a + m.protein, 0).toFixed(0)}`);
  p.notes.forEach((n) => console.log(`  * ${n}`));
}
show(generateNutritionPlan({ goal: "muscle", diet: "veg", avoid: ["dairy"], sex: "male", age: 19, heightCm: 172, weightKg: 68, activity: "moderate", mealsPerDay: 4 }));
show(generateNutritionPlan({ goal: "fat-loss", diet: "jain", avoid: [], sex: "female", age: 24, heightCm: 160, weightKg: 58, activity: "light", mealsPerDay: 3 }));

if (failCount > 0) {
  console.error(`\nfailure categories:`);
  Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.error(`  ${String(v).padStart(6)}  ${k}`));
  console.error(`\n${failCount} FAILURES (first ${failures.length}):`);
  failures.forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log("\nAll assertions passed.");
