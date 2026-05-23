import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { dateKey, parseLogDate, rangeStart } from "@/lib/dates";
import { ensureProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

function emptyTotals() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function addTotals<T extends ReturnType<typeof emptyTotals>>(target: T, item: ReturnType<typeof emptyTotals>) {
  target.calories += item.calories;
  target.protein += item.protein;
  target.carbs += item.carbs;
  target.fat += item.fat;
}

function roundTotals(totals: ReturnType<typeof emptyTotals>) {
  return {
    calories: Math.round(totals.calories),
    protein: Number(totals.protein.toFixed(1)),
    carbs: Number(totals.carbs.toFixed(1)),
    fat: Number(totals.fat.toFixed(1)),
  };
}

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  const profile = await ensureProfile();
  const range = Number(request.nextUrl.searchParams.get("range") || 30);
  const selectedDate = parseLogDate(request.nextUrl.searchParams.get("date"));
  const selectedKey = dateKey(selectedDate);
  const start = rangeStart(range);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const [logs, weightLogs] = await Promise.all([
    prisma.mealLog.findMany({
      where: {
        userId: profile.id,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ date: "desc" }, { mealType: "asc" }],
    }),
    prisma.weightLog.findMany({
      where: { userId: profile.id },
      orderBy: { loggedAt: "asc" },
      take: 90,
    }),
  ]);

  const historyMap = new Map<string, ReturnType<typeof emptyTotals>>();
  const selectedMeals = new Map<string, { mealType: string; items: unknown[]; totals: ReturnType<typeof emptyTotals> }>();
  const selectedTotals = emptyTotals();

  for (const log of logs) {
    const key = dateKey(log.date);
    const daily = historyMap.get(key) || emptyTotals();

    for (const item of log.items) {
      const itemTotals = {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      };
      addTotals(daily, itemTotals);

      if (key === selectedKey) {
        addTotals(selectedTotals, itemTotals);
        const meal = selectedMeals.get(log.mealType) || {
          mealType: log.mealType,
          items: [],
          totals: emptyTotals(),
        };
        meal.items.push(item);
        addTotals(meal.totals, itemTotals);
        selectedMeals.set(log.mealType, meal);
      }
    }

    historyMap.set(key, daily);
  }

  const history = Array.from({ length: range }).map((_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const key = dateKey(day);
    return {
      date: key,
      ...roundTotals(historyMap.get(key) || emptyTotals()),
    };
  });

  const meals = ["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => {
    const meal = selectedMeals.get(mealType) || {
      mealType,
      items: [],
      totals: emptyTotals(),
    };

    return {
      ...meal,
      totals: roundTotals(meal.totals),
    };
  });

  return NextResponse.json({
    profile,
    selectedDate: selectedKey,
    totals: roundTotals(selectedTotals),
    meals,
    history,
    weights: weightLogs.map((log) => ({
      date: dateKey(log.loggedAt),
      weightKg: log.weightKg,
    })),
  });
}
