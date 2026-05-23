import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { parseLogDate } from "@/lib/dates";
import { scaleNutrients, toGrams } from "@/lib/nutrition";
import { ensureProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

type LogPayload = {
  date: string;
  mealType: string;
  amount: number;
  unit: "g" | "oz" | "serving";
  item: {
    kind: "food" | "recipe" | "external";
    id?: string;
    name: string;
    servingGrams?: number;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  };
};

async function resolveItem(payload: LogPayload["item"]) {
  const prisma = getPrisma();

  if (payload.kind === "food" && payload.id) {
    const food = await prisma.foodItem.findUniqueOrThrow({ where: { id: payload.id } });
    return {
      foodItemId: food.id,
      recipeId: undefined,
      labelSnapshot: food.name,
      servingGrams: food.servingGrams,
      baseCaloriesPer100g: food.caloriesPer100g,
      baseProteinPer100g: food.proteinPer100g,
      baseCarbsPer100g: food.carbsPer100g,
      baseFatPer100g: food.fatPer100g,
    };
  }

  if (payload.kind === "recipe" && payload.id) {
    const recipe = await prisma.recipe.findUniqueOrThrow({ where: { id: payload.id } });
    return {
      foodItemId: undefined,
      recipeId: recipe.id,
      labelSnapshot: recipe.name,
      servingGrams: payload.servingGrams || 100,
      baseCaloriesPer100g: recipe.caloriesPer100g,
      baseProteinPer100g: recipe.proteinPer100g,
      baseCarbsPer100g: recipe.carbsPer100g,
      baseFatPer100g: recipe.fatPer100g,
    };
  }

  return {
    foodItemId: undefined,
    recipeId: undefined,
    labelSnapshot: payload.name,
    servingGrams: payload.servingGrams || 100,
    baseCaloriesPer100g: payload.caloriesPer100g,
    baseProteinPer100g: payload.proteinPer100g,
    baseCarbsPer100g: payload.carbsPer100g,
    baseFatPer100g: payload.fatPer100g,
  };
}

export async function POST(request: Request) {
  const prisma = getPrisma();
  const profile = await ensureProfile();
  const payload = (await request.json()) as LogPayload;
  const date = parseLogDate(payload.date);
  const mealType = payload.mealType || "Snack";
  const amount = Number(payload.amount || 0);
  const source = await resolveItem(payload.item);
  const loggedWeightGrams = toGrams(amount, payload.unit || "g", source.servingGrams);
  const scaled = scaleNutrients(
    {
      calories: source.baseCaloriesPer100g,
      protein: source.baseProteinPer100g,
      carbs: source.baseCarbsPer100g,
      fat: source.baseFatPer100g,
    },
    loggedWeightGrams,
  );

  const mealLog =
    (await prisma.mealLog.findFirst({
      where: {
        userId: profile.id,
        date,
        mealType,
      },
    })) ||
    (await prisma.mealLog.create({
      data: {
        userId: profile.id,
        date,
        mealType,
      },
    }));

  const item = await prisma.mealLogItem.create({
    data: {
      mealLogId: mealLog.id,
      foodItemId: source.foodItemId,
      recipeId: source.recipeId,
      labelSnapshot: source.labelSnapshot,
      loggedWeightGrams,
      unit: payload.unit || "g",
      baseCaloriesPer100g: source.baseCaloriesPer100g,
      baseProteinPer100g: source.baseProteinPer100g,
      baseCarbsPer100g: source.baseCarbsPer100g,
      baseFatPer100g: source.baseFatPer100g,
      ...scaled,
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing meal item id." }, { status: 400 });
  }

  const existing = await prisma.mealLogItem.findUnique({
    where: { id },
    include: { mealLog: { include: { items: true } } },
  });

  if (!existing) {
    return NextResponse.json({ ok: true });
  }

  await prisma.mealLogItem.delete({ where: { id } });

  if (existing.mealLog.items.length <= 1) {
    await prisma.mealLog.delete({ where: { id: existing.mealLogId } });
  }

  return NextResponse.json({ ok: true });
}
