export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal =
  | "aggressive_fat_loss"
  | "fat_loss"
  | "recomposition"
  | "lean_muscle"
  | "maintenance";

export type MacroProfile = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ProfileInput = {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const goalSettings: Record<Goal, { calorieFactor: number; proteinGPerKg: number; fatGPerKg: number }> = {
  aggressive_fat_loss: { calorieFactor: 0.75, proteinGPerKg: 2.2, fatGPerKg: 0.7 },
  fat_loss: { calorieFactor: 0.85, proteinGPerKg: 2.0, fatGPerKg: 0.75 },
  recomposition: { calorieFactor: 0.95, proteinGPerKg: 2.1, fatGPerKg: 0.75 },
  lean_muscle: { calorieFactor: 1.1, proteinGPerKg: 2.0, fatGPerKg: 0.8 },
  maintenance: { calorieFactor: 1, proteinGPerKg: 1.7, fatGPerKg: 0.75 },
};

export function roundMacro(value: number) {
  return Math.max(0, Math.round(value));
}

export function calculateBmr(input: ProfileInput) {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;

  if (input.gender === "male") {
    return base + 5;
  }

  if (input.gender === "female") {
    return base - 161;
  }

  return base - 78;
}

export function calculateTargets(input: ProfileInput) {
  const tdee = calculateBmr(input) * activityMultipliers[input.activityLevel];
  const settings = goalSettings[input.goal];
  const calories = tdee * settings.calorieFactor;
  const protein = input.weightKg * settings.proteinGPerKg;
  const fat = input.weightKg * settings.fatGPerKg;
  const remainingCalories = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = remainingCalories / 4;

  return {
    tdee: roundMacro(tdee),
    caloriesTarget: roundMacro(calories),
    proteinTarget: roundMacro(protein),
    carbsTarget: roundMacro(carbs),
    fatTarget: roundMacro(fat),
  };
}

export function scaleNutrients(base: MacroProfile, loggedWeightGrams: number): MacroProfile {
  const multiplier = loggedWeightGrams / 100;

  return {
    calories: roundMacro(base.calories * multiplier),
    protein: Number((base.protein * multiplier).toFixed(1)),
    carbs: Number((base.carbs * multiplier).toFixed(1)),
    fat: Number((base.fat * multiplier).toFixed(1)),
  };
}

export function toGrams(amount: number, unit: string, servingGrams = 100) {
  if (unit === "oz") {
    return amount * 28.3495;
  }

  if (unit === "serving") {
    return amount * servingGrams;
  }

  return amount;
}

export function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function tagString(tags: string[]) {
  return tags.map((tag) => tag.toLowerCase()).join(",");
}
