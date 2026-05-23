import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { parseTags } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

type SearchResult = {
  kind: "food" | "recipe" | "external";
  id?: string;
  source?: string;
  sourceId?: string;
  name: string;
  brand?: string | null;
  dietTags: string[];
  allergenTags: string[];
  servingGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

function matchesFilters(
  result: SearchResult,
  filters: { diet?: string | null; allergen?: string | null; maxCalories?: number | null },
) {
  if (filters.diet && !result.dietTags.includes(filters.diet)) {
    return false;
  }

  if (filters.allergen && result.allergenTags.includes(filters.allergen)) {
    return false;
  }

  if (filters.maxCalories && result.caloriesPer100g > filters.maxCalories) {
    return false;
  }

  return true;
}

async function spoonacularSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey || query.length < 3) {
    return [];
  }

  const url = new URL("https://api.spoonacular.com/recipes/complexSearch");
  url.searchParams.set("query", query);
  url.searchParams.set("number", "6");
  url.searchParams.set("addRecipeNutrition", "true");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url, { next: { revalidate: 60 * 30 } });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as {
    results?: {
      id: number;
      title: string;
      diets?: string[];
      nutrition?: { nutrients?: { name: string; amount: number; unit: string }[] };
    }[];
  };

  return (payload.results || []).map((item) => {
    const nutrients = item.nutrition?.nutrients || [];
    const find = (name: string) =>
      nutrients.find((nutrient) => nutrient.name.toLowerCase() === name)?.amount || 0;

    return {
      kind: "external",
      source: "spoonacular",
      sourceId: String(item.id),
      name: item.title,
      dietTags: (item.diets || []).map((tag) => tag.toLowerCase()),
      allergenTags: [],
      servingGrams: 100,
      caloriesPer100g: find("calories"),
      proteinPer100g: find("protein"),
      carbsPer100g: find("carbohydrates"),
      fatPer100g: find("fat"),
    };
  });
}

export async function GET(request: NextRequest) {
  const prisma = getPrisma();
  const { searchParams } = request.nextUrl;
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const diet = searchParams.get("diet");
  const allergen = searchParams.get("allergen");
  const maxCalories = searchParams.get("maxCalories")
    ? Number(searchParams.get("maxCalories"))
    : null;

  const [foods, recipes, external] = await Promise.all([
    prisma.foodItem.findMany({ take: 80, orderBy: { name: "asc" } }),
    prisma.recipe.findMany({ take: 80, orderBy: { name: "asc" } }),
    spoonacularSearch(query),
  ]);

  const localFoods: SearchResult[] = foods
    .filter((food) => !query || food.name.toLowerCase().includes(query))
    .map((food) => ({
      kind: "food",
      id: food.id,
      source: food.source,
      sourceId: food.sourceId || undefined,
      name: food.name,
      brand: food.brand,
      dietTags: parseTags(food.dietTags),
      allergenTags: parseTags(food.allergenTags),
      servingGrams: food.servingGrams,
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
    }));

  const localRecipes: SearchResult[] = recipes
    .filter((recipe) => !query || recipe.name.toLowerCase().includes(query))
    .map((recipe) => ({
      kind: "recipe",
      id: recipe.id,
      source: recipe.source,
      sourceId: recipe.sourceId || undefined,
      name: recipe.name,
      dietTags: parseTags(recipe.dietTags),
      allergenTags: parseTags(recipe.allergenTags),
      servingGrams: 100,
      caloriesPer100g: recipe.caloriesPer100g,
      proteinPer100g: recipe.proteinPer100g,
      carbsPer100g: recipe.carbsPer100g,
      fatPer100g: recipe.fatPer100g,
    }));

  const results = [...localFoods, ...localRecipes, ...external]
    .filter((result) => matchesFilters(result, { diet, allergen, maxCalories }))
    .slice(0, 24);

  return NextResponse.json({ results });
}
