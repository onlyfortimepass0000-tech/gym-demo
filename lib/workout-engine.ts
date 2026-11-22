import type {
  Experience,
  Goal,
  Limitation,
  PlannedExercise,
  PlannedSession,
  Setup,
  TrainingIntake,
  TrainingPlan,
} from "./types";

// ───────────────────────────── Exercise library ─────────────────────────────

export type Pattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "glute"
  | "push-h"
  | "push-v"
  | "pull-h"
  | "pull-v"
  | "rear-delt"
  | "delts-side"
  | "arms-bi"
  | "arms-tri"
  | "core"
  | "carry"
  | "calf"
  | "conditioning";

export type Equipment = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "band" | "kettlebell";
type Unit = "reps" | "sec" | "m" | "steps";
type Kind = "main" | "secondary" | "accessory" | "core";
type Difficulty = 1 | 2 | 3;

export type LibraryExercise = {
  id: string;
  name: string;
  pattern: Pattern;
  muscles: string[];
  equip: Equipment[]; // any one of these is enough
  difficulty: Difficulty;
  contraindications: Limitation[];
  cue: string;
  unit: Unit;
  unilateral: boolean;
  regression?: string; // safer / easier substitute id
  accessoryOnly: boolean; // not a sensible main/secondary lift
  repsOverride?: string; // skill moves with their own realistic rep range
};

type ExOpts = { unit?: Unit; uni?: boolean; reg?: string; acc?: boolean; reps?: string };

function E(
  id: string,
  name: string,
  pattern: Pattern,
  muscles: string,
  equip: string,
  difficulty: Difficulty,
  contra: string,
  cue: string,
  opts: ExOpts = {}
): LibraryExercise {
  return {
    id,
    name,
    pattern,
    muscles: muscles.split(","),
    equip: equip.split("|") as Equipment[],
    difficulty,
    contraindications: (contra ? contra.split("|") : []) as Limitation[],
    cue,
    unit: opts.unit ?? "reps",
    unilateral: !!opts.uni,
    regression: opts.reg,
    accessoryOnly: !!opts.acc,
    repsOverride: opts.reps,
  };
}

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // squat
  E("back-squat", "Barbell back squat", "squat", "quads,glutes", "barbell", 3, "lower-back", "Brace hard, sit between your hips, drive the floor away.", { reg: "goblet-squat" }),
  E("goblet-squat", "Goblet squat", "squat", "quads,glutes", "dumbbell|kettlebell", 1, "", "Hold the weight at your chest and sit tall between your heels.", { reg: "box-squat" }),
  E("sumo-goblet", "Sumo goblet squat", "squat", "quads,adductors,glutes", "dumbbell|kettlebell", 1, "", "Wide stance, toes out, drop straight down between your knees."),
  E("heel-goblet", "Heel-elevated goblet squat", "squat", "quads", "dumbbell|kettlebell", 2, "knee", "Heels on a plate, knees travel forward, torso stays upright.", { reg: "sumo-goblet", acc: true }),
  E("leg-press", "Leg press", "squat", "quads,glutes", "machine", 1, "", "Feet shoulder-width, lower to about 90° at the knee, press without locking out."),
  E("box-squat", "Box squat to a bench", "squat", "quads,glutes", "bodyweight", 1, "", "Sit back until you lightly touch the box, then stand without rocking."),
  E("bw-squat", "Bodyweight squat", "squat", "quads,glutes", "bodyweight", 1, "knee", "Weight mid-foot, chest up, hips back and down.", { reg: "box-squat" }),
  E("band-squat", "Banded squat", "squat", "quads,glutes", "band", 1, "knee", "Stand on the band, handles at your shoulders, squat tall.", { reg: "box-squat" }),
  E("pistol-box", "Assisted box pistol squat", "squat", "quads,glutes", "bodyweight", 3, "knee", "Lower on one leg to a box; use a hand for balance only.", { uni: true, reg: "box-squat", acc: true, reps: "5–8 / side" }),

  // hinge
  E("rdl", "Romanian deadlift", "hinge", "hamstrings,glutes", "barbell|dumbbell", 2, "lower-back", "Push your hips back, keep the weight close, back flat.", { reg: "kb-deadlift" }),
  E("deadlift", "Conventional deadlift", "hinge", "hamstrings,glutes,back", "barbell", 3, "lower-back", "Wedge into the bar, push the floor away, lock out with your glutes.", { reg: "kb-deadlift" }),
  E("kb-deadlift", "Kettlebell deadlift", "hinge", "hamstrings,glutes", "kettlebell|dumbbell", 1, "", "Hips back, flat back, stand tall by squeezing your glutes."),
  E("pull-through", "Cable pull-through", "hinge", "hamstrings,glutes", "cable", 1, "", "Hinge back with the cable between your legs, snap your hips forward."),
  E("band-pull-through", "Banded pull-through", "hinge", "hamstrings,glutes", "band", 1, "", "Anchor the band low, hinge back, drive your hips through."),
  E("bw-hinge", "Bodyweight hip hinge", "hinge", "hamstrings,glutes", "bodyweight", 1, "", "Hands on hips, soft knees, push your hips back until your hamstrings stretch."),
  E("sl-rdl", "Single-leg Romanian deadlift", "hinge", "hamstrings,glutes", "dumbbell|kettlebell|bodyweight", 2, "", "Hinge on one leg, back leg reaches long, hips stay square.", { uni: true, reg: "bw-hinge" }),
  E("back-ext", "45° back extension", "hinge", "spinal erectors,glutes", "machine", 2, "lower-back", "Hinge at the hips; stop when your body is in one line.", { acc: true }),
  E("band-gm", "Banded good morning", "hinge", "hamstrings,glutes", "band", 2, "lower-back", "Band across your shoulders, hinge back with a flat spine.", { reg: "band-pull-through", acc: true }),

  // glute
  E("hip-thrust", "Barbell hip thrust", "glute", "glutes", "barbell", 2, "", "Chin tucked, ribs down, squeeze your glutes hard at the top.", { reg: "db-hip-thrust" }),
  E("db-hip-thrust", "Dumbbell hip thrust", "glute", "glutes", "dumbbell|kettlebell", 1, "", "Upper back on a bench, drive through your heels, squeeze at the top.", { reg: "glute-bridge" }),
  E("glute-bridge", "Glute bridge", "glute", "glutes", "bodyweight", 1, "", "Feet flat, ribs down, press up and pause for 2 seconds."),
  E("sl-bridge", "Single-leg glute bridge", "glute", "glutes", "bodyweight", 2, "", "Keep your hips level as you lift on one leg.", { uni: true, reg: "glute-bridge" }),
  E("band-bridge", "Banded glute bridge", "glute", "glutes", "band", 1, "", "Band above the knees, press your knees out as you lift.", { reg: "glute-bridge" }),
  E("kickback", "Cable glute kickback", "glute", "glutes", "cable", 2, "", "Hinge slightly, kick straight back without arching.", { uni: true, acc: true }),
  E("band-walk", "Lateral band walk", "glute", "glute medius", "band", 1, "", "Band above the knees, small steps, toes forward, stay low.", { unit: "steps", acc: true }),
  E("hip-abduction", "Machine hip abduction", "glute", "glute medius", "machine", 1, "", "Sit tall and press the pads out under control.", { acc: true }),

  // lunge / single-leg
  E("split-squat", "Split squat", "lunge", "quads,glutes", "bodyweight|dumbbell", 2, "knee", "Long stance, drop straight down, front heel stays planted.", { uni: true, reg: "step-up" }),
  E("reverse-lunge", "Reverse lunge", "lunge", "quads,glutes", "bodyweight|dumbbell", 2, "knee", "Step back, lower softly, push through the front heel.", { uni: true, reg: "step-up" }),
  E("walking-lunge", "Walking lunge", "lunge", "quads,glutes", "bodyweight|dumbbell", 2, "knee", "Long steps, torso tall, knee tracks over your toes.", { uni: true, reg: "step-up" }),
  E("bulgarian", "Bulgarian split squat", "lunge", "quads,glutes", "bodyweight|dumbbell", 3, "knee", "Rear foot on a bench, drop straight down, drive through the front heel.", { uni: true, reg: "step-up" }),
  E("step-up", "Low step-up", "lunge", "quads,glutes", "bodyweight|dumbbell", 1, "", "Whole foot on the box, drive up through the heel, lower for 3 seconds.", { uni: true }),
  E("sl-leg-press", "Single-leg leg press", "lunge", "quads,glutes", "machine", 2, "", "Press through the whole foot and stop short of lockout.", { uni: true }),

  // horizontal push
  E("bench", "Barbell bench press", "push-h", "chest,triceps,front delts", "barbell", 3, "shoulder|wrist", "Shoulder blades pinched, lower to mid-chest, press back over your shoulders.", { reg: "db-bench" }),
  E("db-bench", "Dumbbell bench press", "push-h", "chest,triceps", "dumbbell", 2, "", "Elbows about 45° from your body, lower to the chest line, press up.", { reg: "floor-press" }),
  E("machine-press", "Machine chest press", "push-h", "chest,triceps", "machine", 1, "", "Seat so the handles line up with mid-chest, press without shrugging."),
  E("incline-db", "Incline dumbbell press", "push-h", "upper chest,triceps", "dumbbell", 2, "shoulder", "Bench at 30°, press up and slightly in, control the way down.", { reg: "db-bench" }),
  E("cable-fly", "Cable chest fly", "push-h", "chest", "cable", 2, "shoulder", "Soft elbows, hug a barrel, squeeze your hands together.", { reg: "machine-press", acc: true }),
  E("floor-press", "Dumbbell floor press", "push-h", "chest,triceps", "dumbbell", 1, "", "Lie on the floor, let your elbows touch down, pause, press."),
  E("squeeze-press", "Dumbbell squeeze press", "push-h", "chest,triceps", "dumbbell", 1, "", "Press the dumbbells together the whole rep and push straight up.", { reg: "floor-press" }),
  E("pushup", "Push-up", "push-h", "chest,triceps,core", "bodyweight", 2, "wrist", "Body in one line, elbows about 45°, chest to the floor.", { reg: "incline-fist-pushup" }),
  E("incline-pushup", "Incline push-up (hands on a bench)", "push-h", "chest,triceps", "bodyweight", 1, "wrist", "Hands on a bench, body in one line, lower your chest to the edge.", { reg: "incline-fist-pushup" }),
  E("knee-pushup", "Knee push-up", "push-h", "chest,triceps", "bodyweight", 1, "wrist|knee", "Hips in line with shoulders and knees, chest to the floor.", { reg: "wall-pushup" }),
  E("fist-pushup", "Push-up on fists", "push-h", "chest,triceps,core", "bodyweight", 2, "", "Knuckles down, wrists straight, body in one line.", { reg: "incline-fist-pushup" }),
  E("incline-fist-pushup", "Incline push-up on fists", "push-h", "chest,triceps", "bodyweight", 1, "", "Fists on a bench or counter, wrists straight, lower under control.", { reg: "wall-pushup" }),
  E("wall-pushup", "Wall push-up on fists", "push-h", "chest,triceps", "bodyweight", 1, "", "Fists on the wall, step your feet back, lower your chest to the wall."),
  E("band-press", "Banded chest press", "push-h", "chest,triceps", "band", 1, "", "Anchor the band behind you, press out and squeeze your chest.", { reg: "wall-pushup" }),
  E("dips", "Parallel-bar dip", "push-h", "chest,triceps", "bodyweight", 3, "shoulder|wrist", "Lean slightly forward, lower until your upper arms are parallel.", { reg: "incline-fist-pushup", reps: "6–10" }),

  // vertical push
  E("ohp", "Standing barbell overhead press", "push-v", "shoulders,triceps", "barbell", 3, "shoulder|lower-back", "Squeeze your glutes, press the bar up past your face, head through at the top.", { reg: "landmine" }),
  E("db-press", "Seated dumbbell shoulder press", "push-v", "shoulders,triceps", "dumbbell", 2, "shoulder", "Back supported, press up and slightly in, lower to ear height.", { reg: "landmine" }),
  E("machine-sp", "Machine shoulder press", "push-v", "shoulders,triceps", "machine", 1, "shoulder", "Seat low enough that the handles start at ear height, press without arching."),
  E("landmine", "Landmine press", "push-v", "shoulders,triceps", "barbell", 2, "", "Press the bar up and forward along its arc, ribs down.", { uni: true }),
  E("pike-pushup", "Pike push-up", "push-v", "shoulders,triceps", "bodyweight", 2, "shoulder|wrist", "Hips high, head moves between your hands, press back up.", { reg: "incline-fist-pushup" }),
  E("band-ohp", "Banded overhead press", "push-v", "shoulders,triceps", "band", 1, "shoulder", "Stand on the band, press overhead without leaning back.", { reg: "band-press" }),

  // horizontal pull
  E("bb-row", "Barbell bent-over row", "pull-h", "back,biceps", "barbell", 3, "lower-back", "Hinge to about 45°, pull the bar to your lower ribs, squeeze.", { reg: "db-row" }),
  E("db-row", "One-arm dumbbell row (hand on bench)", "pull-h", "back,biceps", "dumbbell", 1, "", "Hand on the bench, pull your elbow to your hip, don't twist.", { uni: true }),
  E("cs-row", "Chest-supported machine row", "pull-h", "back,biceps", "machine", 1, "", "Chest on the pad, pull your elbows back, pause for a beat."),
  E("cable-row", "Seated cable row", "pull-h", "back,biceps", "cable", 1, "", "Sit tall, pull the handle to your belly, squeeze your shoulder blades."),
  E("inverted-row", "Inverted row (bar or sturdy table)", "pull-h", "back,biceps", "bodyweight", 2, "", "Body in one line, pull your chest to the bar, lower slowly."),
  E("bk-inverted-row", "Bent-knee inverted row", "pull-h", "back,biceps", "bodyweight", 1, "", "Knees bent, pull your chest to the bar, keep your hips up."),
  E("band-row", "Banded row", "pull-h", "back,biceps", "band", 1, "", "Anchor the band at chest height, pull your elbows back, squeeze."),
  E("gorilla-row", "Kettlebell gorilla row", "pull-h", "back,biceps", "kettlebell", 2, "lower-back", "Wide stance, hinge, row one bell at a time without twisting.", { reg: "db-row" }),
  E("towel-row", "Door-frame towel row", "pull-h", "back,biceps", "bodyweight", 1, "", "Wrap a towel around a sturdy door frame, lean back and row your chest to your hands."),

  // vertical pull
  E("pullup", "Pull-up", "pull-v", "lats,biceps", "bodyweight", 3, "shoulder", "Start from a full hang, pull your chest to the bar.", { reg: "lat-pulldown", reps: "5–8" }),
  E("assisted-pullup", "Assisted pull-up", "pull-v", "lats,biceps", "machine", 2, "shoulder", "Full hang to chin over the bar, control the lowering.", { reg: "lat-pulldown" }),
  E("lat-pulldown", "Lat pulldown", "pull-v", "lats,biceps", "cable|machine", 1, "", "Pull the bar to your upper chest, elbows down toward your ribs."),
  E("band-pulldown", "Banded lat pulldown", "pull-v", "lats,biceps", "band", 1, "", "Anchor the band overhead, pull your elbows down to your ribs."),
  E("straight-arm", "Straight-arm pulldown", "pull-v", "lats", "cable", 2, "", "Arms nearly straight, sweep the bar to your thighs, feel your lats.", { acc: true }),
  E("superman-pd", "Prone superman pull-down", "pull-v", "lats,upper back", "bodyweight", 1, "lower-back", "Lie face down, arms overhead, pull your elbows to your ribs."),
  E("db-pullover", "Dumbbell pullover", "pull-v", "lats,chest", "dumbbell", 2, "shoulder", "Soft elbows, lower the dumbbell behind your head, pull it back over your chest.", { acc: true }),
  E("dead-hang", "Dead hang", "pull-v", "lats,grip", "bodyweight", 1, "shoulder", "Hang with active shoulders, ribs down, breathe slowly.", { unit: "sec", acc: true }),

  // rear delts / upper back health
  E("face-pull", "Face pull", "rear-delt", "rear delts,upper back", "cable", 1, "", "Pull the rope to your forehead, elbows high, rotate your hands out."),
  E("band-pull-apart", "Band pull-apart", "rear-delt", "rear delts,upper back", "band", 1, "", "Arms straight, pull the band to your chest by squeezing your shoulder blades."),
  E("reverse-fly", "Bent-over reverse fly", "rear-delt", "rear delts", "dumbbell", 2, "lower-back", "Hinge, soft elbows, open your arms like wings.", { reg: "prone-y" }),
  E("machine-rev-fly", "Reverse pec-deck", "rear-delt", "rear delts", "machine", 1, "", "Chest on the pad, sweep your arms back, don't shrug."),
  E("prone-y", "Prone Y raise", "rear-delt", "lower traps,rear delts", "bodyweight", 1, "", "Lie face down, thumbs up, lift your arms into a Y without arching your back."),
  E("wall-slide", "Wall slide", "rear-delt", "serratus,lower traps", "bodyweight", 1, "", "Forearms on the wall, slide up as you reach, keep your ribs down."),

  // side delts
  E("db-lateral", "Dumbbell lateral raise", "delts-side", "side delts", "dumbbell", 1, "shoulder", "Lead with your elbows, raise to shoulder height, lower slowly."),
  E("cable-lateral", "Cable lateral raise", "delts-side", "side delts", "cable", 2, "shoulder", "Cable crosses your body, raise to shoulder height, no swinging.", { uni: true }),
  E("band-lateral", "Banded lateral raise", "delts-side", "side delts", "band", 1, "shoulder", "Stand on the band, raise to shoulder height with soft elbows."),

  // biceps
  E("db-curl", "Dumbbell curl", "arms-bi", "biceps", "dumbbell", 1, "", "Elbows pinned to your sides, curl up, lower for 3 seconds."),
  E("hammer-curl", "Hammer curl", "arms-bi", "biceps,forearms", "dumbbell", 1, "", "Palms facing in, elbows still, squeeze at the top."),
  E("bb-curl", "Barbell curl", "arms-bi", "biceps", "barbell", 1, "wrist", "Elbows at your sides, curl without swinging your torso.", { reg: "hammer-curl" }),
  E("cable-curl", "Cable curl", "arms-bi", "biceps", "cable", 1, "", "Elbows at your sides, curl to your chin, control the return."),
  E("band-curl", "Banded curl", "arms-bi", "biceps", "band", 1, "", "Stand on the band, elbows still, curl up and lower slowly."),
  E("chinup", "Chin-up", "arms-bi", "biceps,lats", "bodyweight", 3, "shoulder", "Palms toward you, full hang to chin over the bar.", { reg: "cable-curl", reps: "5–8" }),

  // triceps
  E("pushdown", "Cable triceps pushdown", "arms-tri", "triceps", "cable", 1, "", "Elbows pinned, push down until your arms are straight, pause."),
  E("band-pushdown", "Banded triceps pushdown", "arms-tri", "triceps", "band", 1, "", "Anchor the band overhead, elbows pinned, press down and squeeze."),
  E("oh-ext", "Overhead dumbbell triceps extension", "arms-tri", "triceps", "dumbbell", 1, "shoulder", "Elbows point forward, lower behind your head, extend fully.", { reg: "skull-crusher" }),
  E("skull-crusher", "Dumbbell skull crusher", "arms-tri", "triceps", "dumbbell", 2, "", "Lie back, lower to just beside your forehead, extend without flaring."),
  E("bench-dip", "Bench dip", "arms-tri", "triceps", "bodyweight", 2, "wrist|shoulder", "Hands on a bench, lower until elbows reach 90°, press back up."),
  E("diamond", "Diamond push-up", "arms-tri", "triceps,chest", "bodyweight", 2, "wrist", "Hands under your chest in a diamond, elbows brush your ribs."),
  E("machine-tri", "Machine triceps press", "arms-tri", "triceps", "machine", 1, "", "Elbows tucked, press the handles down until your arms are straight."),

  // core
  E("plank", "Forearm plank", "core", "abs,deep core", "bodyweight", 1, "", "Ribs down, glutes tight, body in one straight line.", { unit: "sec" }),
  E("dead-bug", "Dead bug", "core", "abs,deep core", "bodyweight", 1, "", "Low back stays flat as you lower the opposite arm and leg.", { uni: true }),
  E("bird-dog", "Bird dog", "core", "core,glutes,back", "bodyweight", 1, "wrist", "Reach long, hips stay level, pause for 2 seconds.", { uni: true, reg: "dead-bug" }),
  E("side-plank", "Side plank", "core", "obliques", "bodyweight", 2, "shoulder", "Stack your feet, hips high, body in one line.", { unit: "sec", uni: true, reg: "dead-bug" }),
  E("pallof", "Pallof press", "core", "obliques,deep core", "cable|band", 1, "", "Press the handle straight out and resist the twist.", { uni: true }),
  E("cable-crunch", "Cable crunch", "core", "abs", "cable", 2, "lower-back", "Hips fixed, curl your ribs to your pelvis.", { reg: "dead-bug" }),
  E("knee-raise", "Hanging knee raise", "core", "abs,hip flexors", "bodyweight", 2, "shoulder", "Control the swing, curl your pelvis up as you lift.", { reg: "reverse-crunch" }),
  E("reverse-crunch", "Reverse crunch", "core", "abs", "bodyweight", 1, "", "Curl your pelvis off the floor, don't swing your legs."),
  E("hollow", "Hollow hold", "core", "abs", "bodyweight", 2, "", "Low back pressed down, arms and legs long, breathe.", { unit: "sec", reg: "dead-bug" }),
  E("bicycle", "Bicycle crunch", "core", "abs,obliques", "bodyweight", 1, "", "Slow, deliberate twists, shoulder toward the opposite knee."),

  // carries
  E("farmer", "Farmer carry", "carry", "grip,traps,core", "dumbbell|kettlebell", 1, "", "Stand tall, ribs down, short quick steps.", { unit: "m" }),
  E("suitcase", "Suitcase carry", "carry", "obliques,grip", "dumbbell|kettlebell", 2, "", "One weight only, stay upright and don't lean.", { unit: "m", uni: true, reg: "farmer" }),

  // calves
  E("calf-raise", "Standing calf raise", "calf", "calves", "bodyweight|dumbbell|machine", 1, "", "Rise to the top of your toes, pause, lower slowly."),
  E("seated-calf", "Seated calf raise", "calf", "calves", "machine", 1, "", "Knees at 90°, full stretch at the bottom, pause at the top."),
  E("sl-calf", "Single-leg calf raise", "calf", "calves", "bodyweight|dumbbell", 1, "", "Hold a wall for balance, full range, slow lowering.", { uni: true }),

  // conditioning (finishers)
  E("rower", "Rowing machine", "conditioning", "full body", "machine", 1, "", "Legs, then back, then arms; reverse on the way in."),
  E("bike", "Stationary bike", "conditioning", "legs", "machine", 1, "", "Seat at hip height, smooth circles, stay relaxed through the shoulders."),
  E("incline-walk", "Incline treadmill walk", "conditioning", "legs", "machine", 1, "", "5–10% incline, don't hold the rails, stay tall."),
  E("kb-swing", "Kettlebell swing", "conditioning", "glutes,hamstrings", "kettlebell|dumbbell", 2, "lower-back", "Snap your hips, let the bell float, arms are just hooks."),
  E("jumping-jack", "Jumping jacks", "conditioning", "full body", "bodyweight", 1, "knee", "Light feet, arms fully overhead, keep a steady rhythm."),
  E("march", "Brisk march or walk", "conditioning", "legs", "bodyweight", 1, "", "Swing your arms, lift your knees, keep a brisk pace."),
  E("shadow-box", "Shadow boxing", "conditioning", "full body", "bodyweight", 1, "", "Light on your feet, rotate through the hips, keep your hands up."),
  E("mtn-climber", "Mountain climbers", "conditioning", "core,shoulders", "bodyweight", 2, "wrist", "Shoulders over hands, drive your knees fast with a flat back."),
  E("step-cardio", "Step-up intervals", "conditioning", "legs", "bodyweight", 1, "knee", "Alternate legs on a low step at a steady pace."),
  E("burpee", "Burpee", "conditioning", "full body", "bodyweight", 3, "knee|wrist|shoulder|lower-back", "Chest to the floor, jump up, land softly."),
];

const BY_ID = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));
const LIB_INDEX = new Map(EXERCISE_LIBRARY.map((e, i) => [e.id, i]));

export const SETUP_EQUIPMENT: Record<Setup, Equipment[]> = {
  "full-gym": ["barbell", "dumbbell", "machine", "cable", "bodyweight", "band", "kettlebell"],
  dumbbells: ["dumbbell", "bodyweight", "kettlebell"],
  "home-bodyweight": ["bodyweight"],
  "home-bands": ["band", "bodyweight"],
};

export function isAvailable(ex: LibraryExercise, setup: Setup): boolean {
  const have = SETUP_EQUIPMENT[setup];
  return ex.equip.some((e) => have.includes(e));
}

// ───────────────────────────── Split templates ─────────────────────────────

type Slot = { pattern: Pattern; kind: Kind };
const slot = (pattern: Pattern, kind: Kind): Slot => ({ pattern, kind });

type Template = { name: string; region: "lower" | "upper" | "full" | "push" | "pull"; slots: Slot[] };

const TEMPLATES: Record<string, Template> = {
  fullA: {
    name: "Full body A",
    region: "full",
    slots: [slot("squat", "main"), slot("push-h", "main"), slot("pull-h", "main"), slot("hinge", "secondary"), slot("core", "core"), slot("push-v", "secondary"), slot("glute", "accessory"), slot("calf", "accessory"), slot("rear-delt", "accessory"), slot("carry", "accessory")],
  },
  fullB: {
    name: "Full body B",
    region: "full",
    slots: [slot("hinge", "main"), slot("push-v", "main"), slot("pull-v", "main"), slot("lunge", "secondary"), slot("push-h", "secondary"), slot("core", "core"), slot("arms-bi", "accessory"), slot("arms-tri", "accessory"), slot("calf", "accessory"), slot("rear-delt", "accessory")],
  },
  fullC: {
    name: "Full body C",
    region: "full",
    slots: [slot("lunge", "main"), slot("push-h", "main"), slot("pull-v", "main"), slot("glute", "secondary"), slot("pull-h", "secondary"), slot("core", "core"), slot("push-v", "secondary"), slot("carry", "accessory"), slot("arms-tri", "accessory"), slot("calf", "accessory")],
  },
  upperA: {
    name: "Upper A",
    region: "upper",
    slots: [slot("push-h", "main"), slot("pull-h", "main"), slot("push-v", "secondary"), slot("pull-v", "secondary"), slot("delts-side", "accessory"), slot("arms-bi", "accessory"), slot("arms-tri", "accessory"), slot("rear-delt", "accessory"), slot("core", "core")],
  },
  upperB: {
    name: "Upper B",
    region: "upper",
    slots: [slot("push-v", "main"), slot("pull-v", "main"), slot("push-h", "secondary"), slot("pull-h", "secondary"), slot("rear-delt", "accessory"), slot("arms-tri", "accessory"), slot("arms-bi", "accessory"), slot("delts-side", "accessory"), slot("core", "core")],
  },
  lowerA: {
    name: "Lower A",
    region: "lower",
    slots: [slot("squat", "main"), slot("hinge", "main"), slot("lunge", "secondary"), slot("glute", "accessory"), slot("calf", "accessory"), slot("core", "core"), slot("carry", "accessory"), slot("glute", "accessory")],
  },
  lowerB: {
    name: "Lower B",
    region: "lower",
    slots: [slot("hinge", "main"), slot("squat", "main"), slot("glute", "secondary"), slot("lunge", "secondary"), slot("calf", "accessory"), slot("core", "core"), slot("carry", "accessory"), slot("glute", "accessory")],
  },
  push: {
    name: "Push",
    region: "push",
    slots: [slot("push-h", "main"), slot("push-v", "main"), slot("push-h", "secondary"), slot("delts-side", "accessory"), slot("arms-tri", "accessory"), slot("arms-tri", "accessory"), slot("core", "core"), slot("rear-delt", "accessory"), slot("push-v", "secondary")],
  },
  pull: {
    name: "Pull",
    region: "pull",
    slots: [slot("pull-v", "main"), slot("pull-h", "main"), slot("pull-h", "secondary"), slot("rear-delt", "accessory"), slot("arms-bi", "accessory"), slot("arms-bi", "accessory"), slot("core", "core"), slot("pull-v", "secondary"), slot("rear-delt", "accessory")],
  },
  legs: {
    name: "Legs",
    region: "lower",
    slots: [slot("squat", "main"), slot("hinge", "main"), slot("lunge", "secondary"), slot("glute", "accessory"), slot("calf", "accessory"), slot("core", "core"), slot("carry", "accessory"), slot("glute", "accessory")],
  },
};

const FILLERS: Slot[] = [slot("core", "core"), slot("rear-delt", "accessory"), slot("glute", "accessory"), slot("calf", "accessory"), slot("carry", "accessory"), slot("arms-bi", "accessory"), slot("arms-tri", "accessory")];

type SplitEntry = { key: string; name?: string };
const SPLITS: Record<2 | 3 | 4 | 5, SplitEntry[]> = {
  2: [{ key: "fullA" }, { key: "fullB" }],
  3: [{ key: "fullA" }, { key: "fullB" }, { key: "fullC" }],
  4: [{ key: "upperA" }, { key: "lowerA" }, { key: "upperB" }, { key: "lowerB" }],
  5: [{ key: "push" }, { key: "pull" }, { key: "legs" }, { key: "upperA", name: "Upper" }, { key: "lowerB", name: "Lower" }],
};

const WEEKDAYS: Record<2 | 3 | 4 | 5, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
};

const REST_LOGIC: Record<2 | 3 | 4 | 5, string> = {
  2: "Monday and Thursday leave two to three rest days between sessions, so every muscle gets 72+ hours to recover.",
  3: "Monday, Wednesday and Friday keep one full rest day between sessions.",
  4: "Monday/Tuesday and Thursday/Friday alternate upper and lower days, so no muscle group trains two days running.",
  5: "Monday to Wednesday run push, pull and legs; Friday and Saturday add upper and lower, leaving Thursday and Sunday as full rest days.",
};

const REGION_FOCUS: Record<Template["region"], string> = {
  lower: "Legs and glutes.",
  upper: "Chest, back, shoulders and arms.",
  full: "Whole body in one session.",
  push: "Chest, shoulders and triceps.",
  pull: "Back, rear delts and biceps.",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FALLBACK: Record<Pattern, Pattern[]> = {
  squat: ["lunge", "glute"],
  hinge: ["glute"],
  lunge: ["squat", "glute"],
  glute: ["hinge", "lunge"],
  "push-h": ["push-v"],
  "push-v": ["push-h"],
  "pull-h": ["pull-v", "rear-delt"],
  "pull-v": ["pull-h", "rear-delt"],
  "rear-delt": ["pull-h"],
  "delts-side": ["rear-delt"],
  "arms-bi": ["pull-h"],
  "arms-tri": ["push-h"],
  core: ["carry"],
  carry: ["core"],
  calf: ["core"],
  conditioning: [],
};

// ───────────────────────────── Prescription tables ─────────────────────────────

type Minutes = TrainingIntake["minutesPerSession"];

const REPS: Record<Goal, Record<Kind, string>> = {
  strength: { main: "3–5", secondary: "6–8", accessory: "8–12", core: "8–12" },
  muscle: { main: "8–10", secondary: "10–12", accessory: "12–15", core: "10–15" },
  "fat-loss": { main: "10–12", secondary: "12–15", accessory: "12–15", core: "12–15" },
  general: { main: "10–12", secondary: "10–12", accessory: "12–15", core: "10–15" },
};

const REST: Record<Goal, Record<Kind, number>> = {
  strength: { main: 180, secondary: 120, accessory: 75, core: 45 },
  muscle: { main: 90, secondary: 75, accessory: 60, core: 45 },
  "fat-loss": { main: 60, secondary: 45, accessory: 45, core: 45 },
  general: { main: 60, secondary: 60, accessory: 45, core: 45 },
};

const REST_FLOOR: Record<Goal, Record<Kind, number>> = {
  strength: { main: 90, secondary: 75, accessory: 45, core: 30 },
  muscle: { main: 60, secondary: 45, accessory: 40, core: 30 },
  "fat-loss": { main: 45, secondary: 35, accessory: 30, core: 30 },
  general: { main: 45, secondary: 40, accessory: 30, core: 30 },
};

const START_COUNT: Record<Minutes, number> = { 30: 4, 45: 5, 60: 6, 75: 7 };
const WARMUP_MIN: Record<Minutes, number> = { 30: 5, 45: 6, 60: 7, 75: 10 };
const FINISH_MIN: Record<Goal, Record<Minutes, number>> = {
  "fat-loss": { 30: 5, 45: 7, 60: 9, 75: 15 },
  general: { 30: 4, 45: 6, 60: 8, 75: 12 },
  muscle: { 30: 0, 45: 3, 60: 5, 75: 8 },
  strength: { 30: 0, 45: 3, 60: 5, 75: 8 },
};

const WORK_SEC = 40;
const TRANSITION_SEC = 45;

// ───────────────────────────── Helpers ─────────────────────────────

type Ctx = {
  setup: Setup;
  exp: Experience;
  goal: Goal;
  limits: Set<Limitation>;
  ceiling: Difficulty;
  usage: Map<string, number>;
};

type Row = {
  ex: LibraryExercise;
  kind: Kind;
  sets: number;
  cap: number;
  rest: number;
  baseRest: number;
  floor: number;
  reps: string;
  rpe: number;
  tempo?: string;
  note?: string;
};

const LIMIT_LABEL: Record<Limitation, string> = {
  knee: "knee",
  "lower-back": "lower back",
  shoulder: "shoulder",
  wrist: "wrist",
};

const LIMIT_REASON: Record<Limitation, string> = {
  knee: "keep stress off your knee",
  "lower-back": "keep load off your lower back",
  shoulder: "spare your shoulder",
  wrist: "keep your wrists neutral",
};

function ceilingFor(exp: Experience): Difficulty {
  return exp === "never" ? 1 : exp === "intermediate" ? 3 : 2;
}

function score(ex: LibraryExercise, ctx: Ctx, kind: Kind): number {
  let s = 0;
  const lift = kind === "main" || kind === "secondary";
  const have = (e: Equipment) => ex.equip.includes(e) && SETUP_EQUIPMENT[ctx.setup].includes(e);
  if (lift && ctx.exp === "intermediate") s += ex.difficulty * 2;
  else if (ctx.exp === "never") s -= ex.difficulty * 1.5;
  if (ctx.goal === "strength") {
    if (have("barbell")) s += 3;
    if (have("machine")) s -= 1;
  } else if (ctx.goal === "muscle") {
    if (have("machine") || have("cable")) s += 1.5;
    if (have("dumbbell") || have("barbell")) s += 1;
  } else {
    if (have("dumbbell") || have("kettlebell")) s += 1;
    if (have("cable")) s += 0.5;
  }
  if (ctx.exp === "never" && (have("machine") || have("cable"))) s += 2;
  s -= (ctx.usage.get(ex.id) ?? 0) * 4;
  s -= (LIB_INDEX.get(ex.id) ?? 0) * 0.001;
  return s;
}

function best(list: LibraryExercise[], ctx: Ctx, kind: Kind): LibraryExercise {
  let top = list[0];
  let topScore = score(top, ctx, kind);
  for (let i = 1; i < list.length; i++) {
    const sc = score(list[i], ctx, kind);
    if (sc > topScore) {
      top = list[i];
      topScore = sc;
    }
  }
  return top;
}

function hitsLimit(ex: LibraryExercise, ctx: Ctx): Limitation | undefined {
  return ex.contraindications.find((c) => ctx.limits.has(c));
}

function pickForSlot(sl: Slot, ctx: Ctx, used: Set<string>): { ex: LibraryExercise; note?: string } | null {
  const chain: Pattern[] = [sl.pattern, ...FALLBACK[sl.pattern]];
  for (let ci = 0; ci < chain.length; ci++) {
    const p = chain[ci];
    const lift = sl.kind === "main" || sl.kind === "secondary";
    const prefer = (list: LibraryExercise[]) => {
      if (!lift) return list;
      const solid = list.filter((e) => !e.accessoryOnly);
      return solid.length ? solid : list;
    };
    const all = EXERCISE_LIBRARY.filter((e) => e.pattern === p && isAvailable(e, ctx.setup) && e.difficulty <= ctx.ceiling && !used.has(e.id));
    const base = prefer(all);
    const safe = prefer(all.filter((e) => !hitsLimit(e, ctx)));
    if (!safe.length) continue;
    let chosen = best(safe, ctx, sl.kind);
    let note: string | undefined;
    if (ci === 0) {
      const ideal = best(base, ctx, sl.kind);
      if (ideal.id !== chosen.id) {
        const lim = hitsLimit(ideal, ctx);
        if (lim) {
          const reg = ideal.regression ? safe.find((e) => e.id === ideal.regression) : undefined;
          if (reg) chosen = reg;
          note = `${chosen.name} replaces ${ideal.name} to ${LIMIT_REASON[lim]}.`;
        }
      }
    }
    return { ex: chosen, note };
  }
  return null;
}

function baseSets(goal: Goal, exp: Experience, kind: Kind): number {
  const inter = exp === "intermediate";
  let s: number;
  if (kind === "main") s = (goal === "strength" || goal === "muscle") && inter ? 4 : 3;
  else if (kind === "secondary") s = goal === "general" ? 2 : 3;
  else s = inter ? 3 : 2;
  if (exp === "never") s = 2;
  return s;
}

function setCap(goal: Goal, exp: Experience, kind: Kind): number {
  if (exp === "never") return 3;
  if (kind === "main") return goal === "strength" ? 5 : 4;
  if (kind === "core") return 3;
  return 4;
}

function repsFor(ex: LibraryExercise, kind: Kind, goal: Goal, exp: Experience): string {
  if (ex.repsOverride) return ex.repsOverride;
  if (ex.unit === "sec") return kind === "core" ? "30–40 s" : "20–30 s";
  if (ex.unit === "m") return goal === "strength" ? "20–30 m" : "30–40 m";
  if (ex.unit === "steps") return "10–12 steps each way";
  let base = REPS[goal][kind];
  if (goal === "strength" && kind === "main" && exp !== "intermediate") base = "5–6";
  if (goal === "muscle" && kind === "main" && exp === "intermediate") base = "6–10";
  return ex.unilateral ? `${base} / side` : base;
}

function rpeFor(goal: Goal, exp: Experience, kind: Kind): number {
  if (exp === "never") return 6;
  if (exp === "intermediate") {
    if (kind === "main") return goal === "strength" || goal === "muscle" ? 8 : 7;
    return 7;
  }
  return kind === "main" ? 7 : 6;
}

function tempoFor(ex: LibraryExercise, kind: Kind, exp: Experience): string | undefined {
  if (ex.unit !== "reps" && ex.unit !== "steps") return undefined;
  if (exp === "never" && (kind === "main" || kind === "secondary")) return "3-1-1";
  if ((exp === "some" || exp === "returning") && kind === "main") return "2-1-1";
  return undefined;
}

function makeRow(ex: LibraryExercise, kind: Kind, ctx: Ctx, note?: string): Row {
  let baseRest = REST[ctx.goal][kind];
  if (ctx.goal === "strength" && kind === "main" && ctx.exp !== "intermediate") baseRest = 150;
  return {
    ex,
    kind,
    sets: baseSets(ctx.goal, ctx.exp, kind),
    cap: setCap(ctx.goal, ctx.exp, kind),
    rest: baseRest,
    baseRest,
    floor: REST_FLOOR[ctx.goal][kind],
    reps: repsFor(ex, kind, ctx.goal, ctx.exp),
    rpe: rpeFor(ctx.goal, ctx.exp, kind),
    tempo: tempoFor(ex, kind, ctx.exp),
    note,
  };
}

function totalSeconds(rows: Row[], warmMin: number, finMin: number): number {
  let t = (warmMin + finMin) * 60;
  for (const r of rows) t += r.sets * (WORK_SEC + r.rest) + TRANSITION_SEC;
  return t;
}

function reduceOnce(cur: Row[], minCount: number): boolean {
  for (let i = cur.length - 1; i >= 0; i--) {
    const r = cur[i];
    if ((r.kind === "accessory" || r.kind === "core") && r.sets > 2) {
      r.sets--;
      return true;
    }
  }
  let idx = -1;
  let gap = 0;
  for (let i = 0; i < cur.length; i++) {
    const g = cur[i].rest - cur[i].floor;
    if (g > gap) {
      gap = g;
      idx = i;
    }
  }
  if (idx >= 0) {
    cur[idx].rest = Math.max(cur[idx].floor, cur[idx].rest - 15);
    return true;
  }
  for (let i = cur.length - 1; i >= 0; i--) {
    if (cur[i].kind === "secondary" && cur[i].sets > 2) {
      cur[i].sets--;
      return true;
    }
  }
  for (let i = cur.length - 1; i >= 0; i--) {
    if (cur[i].kind === "main" && cur[i].sets > 2) {
      cur[i].sets--;
      return true;
    }
  }
  if (cur.length > minCount) {
    cur.pop();
    return true;
  }
  return false;
}

function increaseOnce(cur: Row[], pool: Row[], maxCount: number, limit: number, warmMin: number, finMin: number): boolean {
  const fits = () => totalSeconds(cur, warmMin, finMin) <= limit;
  for (const r of cur) {
    if (r.kind === "main" && r.sets < r.cap) {
      r.sets++;
      if (fits()) return true;
      r.sets--;
    }
  }
  if (cur.length < Math.min(maxCount, pool.length)) {
    cur.push({ ...pool[cur.length] });
    if (fits()) return true;
    cur.pop();
  }
  for (const kinds of [["secondary"], ["accessory", "core"]] as Kind[][]) {
    for (const r of cur) {
      if (kinds.includes(r.kind) && r.sets < r.cap) {
        r.sets++;
        if (fits()) return true;
        r.sets--;
      }
    }
  }
  for (const r of cur) {
    if (r.rest < r.baseRest) {
      const prev = r.rest;
      r.rest = Math.min(r.baseRest, r.rest + 15);
      if (fits()) return true;
      r.rest = prev;
    }
  }
  return false;
}

function fitRows(pool: Row[], target: number, minutes: Minutes, warmMin: number, finMin: number, exp: Experience): Row[] {
  const minCount = minutes === 30 ? 3 : 4;
  const maxCount = 9;
  const start = Math.min(Math.max(START_COUNT[minutes], minCount), pool.length);
  const cur = pool.slice(0, start).map((r) => ({ ...r }));
  const hi = target * 60 * 1.1;
  const lo = target * 60 * 0.9;
  for (let i = 0; i < 300; i++) {
    const t = totalSeconds(cur, warmMin, finMin);
    if (t > hi) {
      if (!reduceOnce(cur, minCount)) break;
    } else if (t < lo) {
      if (!increaseOnce(cur, pool, maxCount, hi, warmMin, finMin)) break;
    } else break;
  }
  return cur;
}

// ───────────────────────────── Text builders ─────────────────────────────

const GOAL_LABEL: Record<Goal, string> = {
  strength: "strength",
  muscle: "muscle-building",
  "fat-loss": "fat-loss",
  general: "general-fitness",
};
const EXP_LABEL: Record<Experience, string> = {
  never: "first-time lifter",
  some: "beginner",
  returning: "returning lifter",
  intermediate: "intermediate lifter",
};
const SETUP_LABEL: Record<Setup, string> = {
  "full-gym": "a full gym",
  dumbbells: "dumbbells",
  "home-bodyweight": "bodyweight only",
  "home-bands": "bands and bodyweight",
};

function listWords(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function warmupLines(region: Template["region"], ctx: Ctx, warmMin: number, firstLift: LibraryExercise): string[] {
  const knee = ctx.limits.has("knee");
  const back = ctx.limits.has("lower-back");
  const shoulder = ctx.limits.has("shoulder");
  const wrist = ctx.limits.has("wrist");
  const gym = ctx.setup === "full-gym";
  const cardio = gym ? "bike or rower" : knee ? "walk or march in place (no jumping)" : "brisk march or shadow boxing";
  const lines = [`${warmMin} min easy ${cardio}, building from easy to a light sweat.`];

  const lower = [
    "Hip airplanes or 90/90 hip switches, 8 per side.",
    knee ? "Glute bridges ×12 with a 2 s squeeze." : "Bodyweight squats to a box ×10, pausing 2 s at the bottom.",
    "Hip hinge to reach ×10 with hands on hips.",
  ];
  const upper = [
    "Band pull-aparts ×15 (or arm sweeps if you have no band).",
    wrist ? "Wall slides ×10." : "Scap push-ups ×10.",
    shoulder ? "Shoulder circles ×10 each way, staying in a pain-free range." : "Arm circles and a band or broomstick pass-through ×8.",
  ];
  const full = [
    "Cat-cow ×8 slow reps.",
    knee ? "Glute bridges ×12." : "Bodyweight squats ×10.",
    "Band pull-aparts ×15 (or arm sweeps if you have no band).",
  ];
  const region3 = region === "lower" ? lower : region === "upper" || region === "push" || region === "pull" ? upper : full;
  lines.push(...region3.slice(0, 2));
  if (back) lines.push("Dead bug ×6 per side to switch your core on.");
  else if (wrist && region !== "lower") lines.push("Wrist circles ×10 each way, then open and close your fists ×10.");
  else lines.push(region3[2]);

  const bodyweightFirst = firstLift.equip.includes("bodyweight") && (ctx.setup === "home-bodyweight" || firstLift.equip.length === 1);
  lines.push(
    bodyweightFirst
      ? `Ramp-up: 1 easy set of ${firstLift.name} at half the reps.`
      : `Ramp-up: 2 lighter sets of ${firstLift.name} (about 50% then 70% of today's working weight), 5 reps each.`
  );
  return lines.slice(0, 5);
}

function buildFinisher(goal: Goal, finMin: number, ctx: Ctx): { name: string; detail: string } | undefined {
  if (finMin <= 0) return undefined;
  const ok = (e: LibraryExercise) => e.pattern === "conditioning" && isAvailable(e, ctx.setup) && e.difficulty <= ctx.ceiling && !hitsLimit(e, ctx);
  if (goal === "fat-loss") {
    const cands = EXERCISE_LIBRARY.filter(ok);
    const intermediate = ctx.exp === "intermediate";
    const pick = cands.reduce((a, b) => {
      const sa = (intermediate ? a.difficulty : -a.difficulty) + (a.equip.includes("machine") ? 1.5 : 0);
      const sb = (intermediate ? b.difficulty : -b.difficulty) + (b.equip.includes("machine") ? 1.5 : 0);
      return sb > sa ? b : a;
    });
    const steady = ["march", "shadow-box", "incline-walk"].includes(pick.id);
    const detail = steady
      ? `${finMin} min steady, pushing the pace for the last 30 s of every minute. ${pick.cue}`
      : `${Math.max(2, Math.floor((finMin * 60) / 90))} rounds of 30 s hard, 60 s easy. ${pick.cue}`;
    return { name: pick.name, detail };
  }
  if (goal === "general") {
    const order = ["incline-walk", "bike", "march"];
    const pick = order.map((id) => BY_ID.get(id)!).find(ok) ?? BY_ID.get("march")!;
    return { name: pick.name, detail: `Zone 2: ${finMin} min at an easy, conversational pace; you should be able to speak in full sentences.` };
  }
  const area = ctx.limits.has("lower-back") ? "stretch gently and skip any deep forward folds" : "hold each stretch for 30 s";
  return { name: "Cooldown and mobility", detail: `${finMin} min easy walking, then stretch what you trained and ${area}.` };
}

function buildRules(intake: TrainingIntake): string[] {
  const injury: Record<Limitation, string> = {
    knee: "Knee: stop above parallel if the knee pinches, skip jumping and deep lunges, and treat sharp pain as a stop sign.",
    "lower-back": "Lower back: brace your core before every rep, keep a neutral spine, and end any set where your back starts to round.",
    shoulder: "Shoulder: keep presses at or below eye level at first, prefer neutral grips, and stop any rep that pinches.",
    wrist: "Wrist: keep wrists straight by using fists, dumbbell handles or neutral grips, and switch grip if a wrist aches.",
  };
  const goalRule: Record<Goal, string> = {
    strength: "Rest fully between heavy sets (2–3 minutes); crisp reps beat grinding reps.",
    muscle: "Finish each set with 1–3 reps still in the tank and lower every rep under control.",
    "fat-loss": "Keep rests short, but never trade form for speed, and aim for 8–10k steps on non-training days.",
    general: "Keep the effort moderate; you should leave each session feeling better, not wrecked.",
  };
  const rules: string[] = intake.limitations.map((l) => injury[l]);
  rules.push(goalRule[intake.goal]);
  rules.push("Add load only when every set reaches the top of the rep range with clean form; otherwise keep the weight and add a rep.");
  if (intake.experience !== "intermediate") rules.push("Stop every set 2–3 reps before failure for the first two weeks; the last rep should look like the first.");
  rules.push("Warm up every session; your first working set should feel easy.");
  if (!intake.limitations.length) rules.push("Sharp or joint pain is a stop sign: skip that exercise, finish the session and tell your trainer.");
  return rules.slice(0, 6);
}

function buildProgression(intake: TrainingIntake): TrainingPlan["progression"] {
  const bodyweightish = intake.setup === "home-bodyweight" || intake.setup === "home-bands";
  const noLoad = bodyweightish ? " No heavier weights? Slow the lowering to 3–4 s, pause 1 s at the bottom, or step up to the next variation." : "";
  const startLine = bodyweightish
    ? "Choose the variation you can finish every set of with 3 clean reps still in reserve (about RPE 6–7)."
    : "Pick starting weights you could lift 3 more times at the end of every set (about RPE 6–7).";
  const tempoLine = intake.experience === "intermediate" ? "Keep every rep controlled and leave this week as a baseline." : "Use the tempo shown and treat this week as practice.";
  const w1 = {
    week: 1,
    title: "Learn the movements",
    instruction: `${startLine} ${tempoLine}`,
  };
  const per: Record<Goal, [string, string, string]> = {
    strength: [
      "Keep the sets, then add 2.5 kg (upper body) or 5 kg (lower body) to the main lifts if every rep felt smooth.",
      "Add one set to your first two lifts and keep effort at RPE 8 or below.",
      "Deload: use the same weights for about two-thirds of the sets and stop 3 reps short.",
    ],
    muscle: [
      "Add one rep per set until you reach the top of every rep range.",
      "Add one set to your first two lifts, or add 2.5 kg once you top the range.",
      "Deload: keep the weights, do about two-thirds of the sets and stop 3 reps short.",
    ],
    "fat-loss": [
      "Add reps within each range and trim rests by 5–10 s.",
      "Add one set to your first two lifts and one extra round to the finisher.",
      "Deload: cut sets by a third and keep the finisher easy so you recover.",
    ],
    general: [
      "Add one rep per set and move to a slightly heavier weight when it feels easy.",
      "Add one set to your first two lifts, or raise the weight by about 5%.",
      "Deload: do about two-thirds of the sets at a comfortable effort.",
    ],
  };
  const [a, b, c] = per[intake.goal];
  return [
    w1,
    { week: 2, title: "Build reps", instruction: a + noLoad },
    { week: 3, title: "Add volume", instruction: b },
    { week: 4, title: "Deload and reset", instruction: c },
  ];
}

// ───────────────────────────── Public API ─────────────────────────────

export function generateTrainingPlan(intake: TrainingIntake): TrainingPlan {
  const { experience: exp, daysPerWeek: days, minutesPerSession: minutes, goal, setup } = intake;
  const limits = new Set<Limitation>(intake.limitations);
  const ctx: Ctx = { setup, exp, goal, limits, ceiling: ceilingFor(exp), usage: new Map() };
  const warmMin = WARMUP_MIN[minutes];
  const finMin = FINISH_MIN[goal][minutes];
  const weekdays = WEEKDAYS[days];

  const sessions: PlannedSession[] = SPLITS[days].map((entry, i) => {
    const tpl = TEMPLATES[entry.key];
    const used = new Set<string>();
    const pool: Row[] = [];
    for (const sl of [...tpl.slots, ...FILLERS]) {
      const pick = pickForSlot(sl, ctx, used);
      if (!pick) continue;
      used.add(pick.ex.id);
      pool.push(makeRow(pick.ex, sl.kind, ctx, pick.note));
    }

    const rows = fitRows(pool, minutes, minutes, warmMin, finMin, exp);
    for (const r of rows) ctx.usage.set(r.ex.id, (ctx.usage.get(r.ex.id) ?? 0) + 1);

    const exercises: PlannedExercise[] = rows.map((r) => ({
      id: r.ex.id,
      name: r.ex.name,
      sets: r.sets,
      reps: r.reps,
      restSec: r.rest,
      rpe: r.rpe,
      ...(r.tempo ? { tempo: r.tempo } : {}),
      cue: r.ex.cue,
      ...(r.note ? { note: r.note } : {}),
    }));

    const finisher = buildFinisher(goal, finMin, ctx);
    return {
      id: `s${i + 1}`,
      name: entry.name ?? tpl.name,
      focus: `${REGION_FOCUS[tpl.region]} Leads with ${listWords(rows.slice(0, 3).map((r) => r.ex.name))}.`,
      weekday: weekdays[i],
      warmup: warmupLines(tpl.region, ctx, warmMin, rows[0].ex),
      exercises,
      ...(finisher ? { finisher } : {}),
      estMinutes: Math.round(totalSeconds(rows, warmMin, finMin) / 60),
    };
  });

  const avg = Math.round(sessions.reduce((a, s) => a + s.estMinutes, 0) / sessions.length);
  const dayNames = weekdays.map((d) => DAY_NAMES[d]);
  const limitList = intake.limitations.map((l) => LIMIT_LABEL[l]);
  const goalSentence: Record<Goal, string> = {
    strength: "Main lifts use heavier sets of 3–6 reps with long rests; accessories fill the gaps.",
    muscle: "Most work sits in the 6–15 rep range with moderate rests to drive growth.",
    "fat-loss": "Rests are short, reps are higher and every session ends with a conditioning finisher.",
    general: "Moderate sets and reps build a balanced base, with an easy zone-2 block to finish.",
  };
  const summary = [
    `Written for ${/^[aeiou]/.test(EXP_LABEL[exp]) ? "an" : "a"} ${EXP_LABEL[exp]} training ${days} days a week for ${minutes} minutes, aiming at ${GOAL_LABEL[goal]} with ${SETUP_LABEL[setup]}.`,
    `Sessions fall on ${listWords(dayNames)}: ${REST_LOGIC[days]}`,
    goalSentence[goal],
    limitList.length ? `Exercises were chosen around your ${listWords(limitList)}; swaps are marked on the exercise.` : "",
    `Each session runs about ${avg} minutes including a ${warmMin}-minute warm-up.`,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title: `${days}-day ${GOAL_LABEL[goal]} plan · ${minutes}-min sessions`,
    summary,
    intake,
    weekdays,
    sessions,
    progression: buildProgression(intake),
    rules: buildRules(intake),
    createdAt: Date.now(),
  };
}
