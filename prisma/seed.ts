import { PrismaClient } from "@prisma/client";
import { calculateTargets, tagString } from "../src/lib/nutrition";

const prisma = new PrismaClient();

const foods = [
  {
    sourceId: "chicken-breast",
    name: "Grilled chicken breast",
    brand: "Core catalog",
    dietTags: ["high-protein", "gluten-free", "keto"],
    allergenTags: [],
    caloriesPer100g: 165,
    proteinPer100g: 31,
    carbsPer100g: 0,
    fatPer100g: 3.6,
  },
  {
    sourceId: "brown-rice",
    name: "Brown rice, cooked",
    brand: "Core catalog",
    dietTags: ["vegan", "gluten-free"],
    allergenTags: [],
    caloriesPer100g: 112,
    proteinPer100g: 2.6,
    carbsPer100g: 23,
    fatPer100g: 0.9,
  },
  {
    sourceId: "avocado",
    name: "Avocado",
    brand: "Core catalog",
    dietTags: ["vegan", "gluten-free", "keto"],
    allergenTags: [],
    caloriesPer100g: 160,
    proteinPer100g: 2,
    carbsPer100g: 8.5,
    fatPer100g: 14.7,
  },
  {
    sourceId: "greek-yogurt",
    name: "Greek yogurt, plain",
    brand: "Core catalog",
    dietTags: ["high-protein", "gluten-free"],
    allergenTags: ["dairy"],
    caloriesPer100g: 97,
    proteinPer100g: 9,
    carbsPer100g: 3.9,
    fatPer100g: 5,
  },
  {
    sourceId: "oats",
    name: "Rolled oats",
    brand: "Core catalog",
    dietTags: ["vegan"],
    allergenTags: ["gluten"],
    caloriesPer100g: 389,
    proteinPer100g: 16.9,
    carbsPer100g: 66.3,
    fatPer100g: 6.9,
  },
  {
    sourceId: "salmon",
    name: "Baked salmon",
    brand: "Core catalog",
    dietTags: ["high-protein", "gluten-free", "keto"],
    allergenTags: ["fish"],
    caloriesPer100g: 208,
    proteinPer100g: 20.4,
    carbsPer100g: 0,
    fatPer100g: 13.4,
  },
  {
    sourceId: "tofu",
    name: "Firm tofu",
    brand: "Core catalog",
    dietTags: ["vegan", "gluten-free", "high-protein"],
    allergenTags: ["soy"],
    caloriesPer100g: 144,
    proteinPer100g: 17.3,
    carbsPer100g: 2.8,
    fatPer100g: 8.7,
  },
  {
    sourceId: "blueberries",
    name: "Blueberries",
    brand: "Core catalog",
    dietTags: ["vegan", "gluten-free"],
    allergenTags: [],
    caloriesPer100g: 57,
    proteinPer100g: 0.7,
    carbsPer100g: 14.5,
    fatPer100g: 0.3,
  },
];

const recipes = [
  {
    sourceId: "power-bowl",
    name: "Chicken avocado power bowl",
    dietTags: ["high-protein", "gluten-free"],
    allergenTags: [],
    servings: 1,
    ingredients: [
      { foodSourceId: "chicken-breast", weightGrams: 150 },
      { foodSourceId: "brown-rice", weightGrams: 125 },
      { foodSourceId: "avocado", weightGrams: 70 },
    ],
  },
  {
    sourceId: "salmon-rice-plate",
    name: "Salmon rice plate",
    dietTags: ["high-protein", "gluten-free"],
    allergenTags: ["fish"],
    servings: 1,
    ingredients: [
      { foodSourceId: "salmon", weightGrams: 160 },
      { foodSourceId: "brown-rice", weightGrams: 150 },
      { foodSourceId: "avocado", weightGrams: 40 },
    ],
  },
  {
    sourceId: "vegan-tofu-bowl",
    name: "Vegan tofu macro bowl",
    dietTags: ["vegan", "gluten-free", "high-protein"],
    allergenTags: ["soy"],
    servings: 1,
    ingredients: [
      { foodSourceId: "tofu", weightGrams: 180 },
      { foodSourceId: "brown-rice", weightGrams: 140 },
      { foodSourceId: "avocado", weightGrams: 50 },
    ],
  },
  {
    sourceId: "yogurt-oat-parfait",
    name: "Greek yogurt oat parfait",
    dietTags: ["high-protein"],
    allergenTags: ["dairy", "gluten"],
    servings: 1,
    ingredients: [
      { foodSourceId: "greek-yogurt", weightGrams: 220 },
      { foodSourceId: "oats", weightGrams: 45 },
      { foodSourceId: "blueberries", weightGrams: 80 },
    ],
  },
];

function recipeMacros(
  ingredients: { weightGrams: number; food: (typeof foods)[number] }[],
) {
  const totalWeight = ingredients.reduce((sum, item) => sum + item.weightGrams, 0);
  const totals = ingredients.reduce(
    (sum, item) => {
      const multiplier = item.weightGrams / 100;
      return {
        calories: sum.calories + item.food.caloriesPer100g * multiplier,
        protein: sum.protein + item.food.proteinPer100g * multiplier,
        carbs: sum.carbs + item.food.carbsPer100g * multiplier,
        fat: sum.fat + item.food.fatPer100g * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    caloriesPer100g: Number(((totals.calories / totalWeight) * 100).toFixed(1)),
    proteinPer100g: Number(((totals.protein / totalWeight) * 100).toFixed(1)),
    carbsPer100g: Number(((totals.carbs / totalWeight) * 100).toFixed(1)),
    fatPer100g: Number(((totals.fat / totalWeight) * 100).toFixed(1)),
  };
}

async function main() {
  const foodRecords = new Map<string, Awaited<ReturnType<typeof prisma.foodItem.upsert>>>();

  for (const food of foods) {
    const record = await prisma.foodItem.upsert({
      where: { source_sourceId: { source: "local", sourceId: food.sourceId } },
      update: {
        name: food.name,
        brand: food.brand,
        dietTags: tagString(food.dietTags),
        allergenTags: tagString(food.allergenTags),
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
      },
      create: {
        source: "local",
        sourceId: food.sourceId,
        name: food.name,
        brand: food.brand,
        dietTags: tagString(food.dietTags),
        allergenTags: tagString(food.allergenTags),
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
      },
    });

    foodRecords.set(food.sourceId, record);
  }

  for (const recipe of recipes) {
    const ingredientsWithFoods = recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      food: foods.find((food) => food.sourceId === ingredient.foodSourceId)!,
    }));
    const macros = recipeMacros(ingredientsWithFoods);
    const recipeRecord = await prisma.recipe.upsert({
      where: { source_sourceId: { source: "local", sourceId: recipe.sourceId } },
      update: {
        name: recipe.name,
        dietTags: tagString(recipe.dietTags),
        allergenTags: tagString(recipe.allergenTags),
        servings: recipe.servings,
        ...macros,
      },
      create: {
        source: "local",
        sourceId: recipe.sourceId,
        name: recipe.name,
        dietTags: tagString(recipe.dietTags),
        allergenTags: tagString(recipe.allergenTags),
        servings: recipe.servings,
        ...macros,
      },
    });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipeRecord.id } });

    for (const ingredient of recipe.ingredients) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipeRecord.id,
          foodItemId: foodRecords.get(ingredient.foodSourceId)!.id,
          weightGrams: ingredient.weightGrams,
        },
      });
    }
  }

  const profileInput = {
    age: 32,
    gender: "other" as const,
    weightKg: 76,
    heightCm: 178,
    activityLevel: "moderate" as const,
    goal: "recomposition" as const,
  };
  const targets = calculateTargets(profileInput);

  await prisma.userProfile.upsert({
    where: { id: "demo" },
    update: {
      name: "Avery Stone",
      ...profileInput,
      ...targets,
    },
    create: {
      id: "demo",
      name: "Avery Stone",
      ...profileInput,
      ...targets,
      weightLogs: {
        create: [
          { weightKg: 77.2, loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) },
          { weightKg: 76.4, loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
          { weightKg: 76, loggedAt: new Date() },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
