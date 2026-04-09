/**
 * Fitness calculation utilities.
 * Ported from the mobile app for server-side validation and computation.
 */

type Gender = 'male' | 'female' | 'other';
type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
type Goal = 'lose_weight' | 'build_muscle' | 'maintain' | 'improve_fitness' | 'gain_strength';

// ─── BMR (Basal Metabolic Rate) ──────────────────────────────────────────────

/**
 * Calculate BMR using the Mifflin-St Jeor equation.
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - Gender
 * @returns BMR in kcal/day
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  switch (gender) {
    case 'male':
      return Math.round(base + 5);
    case 'female':
      return Math.round(base - 161);
    case 'other':
    default:
      // Average of male and female
      return Math.round(base - 78);
  }
}

// ─── TDEE (Total Daily Energy Expenditure) ───────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

/**
 * Calculate TDEE from BMR and activity level.
 * @param bmr - Basal metabolic rate in kcal/day
 * @param activityLevel - Activity level
 * @returns TDEE in kcal/day
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  return Math.round(bmr * multiplier);
}

// ─── 1RM (One Rep Max) ──────────────────────────────────────────────────────

/**
 * Estimate 1 Rep Max using the Brzycki formula.
 * @param weight - Weight lifted
 * @param reps - Number of reps performed (must be < 37)
 * @returns Estimated 1RM
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  if (reps >= 37) return weight; // Formula breaks down beyond 36 reps
  return Math.round(weight * (36 / (37 - reps)));
}

// ─── Volume ──────────────────────────────────────────────────────────────────

/**
 * Calculate total volume for a set (weight x reps).
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Calculate total volume across multiple sets.
 */
export function calculateTotalVolume(
  sets: Array<{ weight?: number; reps?: number; completed?: boolean }>
): number {
  return sets.reduce((total, set) => {
    if (set.completed !== false && set.weight && set.reps) {
      return total + set.weight * set.reps;
    }
    return total;
  }, 0);
}

// ─── BMI (Body Mass Index) ───────────────────────────────────────────────────

/**
 * Calculate BMI.
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @returns BMI value
 */
export function calculateBMI(weight: number, height: number): number {
  if (height <= 0 || weight <= 0) return 0;
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI classification.
 */
export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// ─── Macros ──────────────────────────────────────────────────────────────────

interface MacroSplit {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

/**
 * Calculate recommended macros based on TDEE, weight, and goal.
 * @param tdee - Total daily energy expenditure in kcal
 * @param weightKg - Body weight in kg
 * @param goal - Fitness goal
 * @returns Macro split in grams
 */
export function calculateMacros(
  tdee: number,
  weightKg: number,
  goal: Goal
): MacroSplit {
  let calories: number;
  let proteinPerKg: number;
  let fatPercent: number;

  switch (goal) {
    case 'lose_weight':
      calories = Math.round(tdee * 0.8); // 20% deficit
      proteinPerKg = 2.2;
      fatPercent = 0.25;
      break;
    case 'build_muscle':
    case 'gain_strength':
      calories = Math.round(tdee * 1.1); // 10% surplus
      proteinPerKg = 2.0;
      fatPercent = 0.25;
      break;
    case 'improve_fitness':
      calories = tdee;
      proteinPerKg = 1.8;
      fatPercent = 0.28;
      break;
    case 'maintain':
    default:
      calories = tdee;
      proteinPerKg = 1.6;
      fatPercent = 0.3;
      break;
  }

  const protein = Math.round(weightKg * proteinPerKg);
  const fat = Math.round((calories * fatPercent) / 9);
  // Remaining calories from carbs (4 kcal per gram)
  const proteinCalories = protein * 4;
  const fatCalories = fat * 9;
  const carbs = Math.round((calories - proteinCalories - fatCalories) / 4);

  return {
    calories,
    protein,
    carbs: Math.max(0, carbs),
    fat,
  };
}

// ─── Level / Gamification ────────────────────────────────────────────────────

/**
 * XP thresholds per level. Each level requires progressively more XP.
 * Level N requires: 100 * N * 1.5 XP to reach level N+1.
 */
export function xpForLevel(level: number): number {
  return Math.round(100 * level * 1.5);
}

/**
 * Calculate the current level and progress from total XP.
 * @param totalXp - Total XP accumulated
 * @returns { level, currentLevelXp, xpToNextLevel, progress (0-1) }
 */
export function calculateLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
} {
  let level = 1;
  let remainingXp = totalXp;

  while (remainingXp >= xpForLevel(level)) {
    remainingXp -= xpForLevel(level);
    level++;
  }

  const needed = xpForLevel(level);
  return {
    level,
    currentLevelXp: remainingXp,
    xpToNextLevel: needed,
    progress: needed > 0 ? remainingXp / needed : 0,
  };
}

// ─── Unit Conversions ────────────────────────────────────────────────────────

/**
 * Convert kilograms to pounds.
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100;
}

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 100) / 100;
}

/**
 * Convert centimeters to inches.
 */
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
}

/**
 * Convert inches to centimeters.
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
}
