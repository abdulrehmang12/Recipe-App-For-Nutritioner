# NourishGrid

NourishGrid is a full-stack recipe discovery, meal logging, and nutrition tracking app built with Next.js, Prisma, and SQLite. It helps users calculate personalized nutrition targets, search foods and recipes, log meals by serving size, and track calories, protein, carbohydrates, and fats over time.

## Purpose

This app is designed for people who want a practical daily nutrition dashboard instead of a spreadsheet. It combines a profile-based target calculator, a searchable recipe/food catalog, and historical macro analytics in one local-first web app.

## Features

- Personalized onboarding profile with age, gender, height, weight, activity level, and goal inputs.
- Automatic TDEE calculation using activity multipliers.
- Goal-based calorie, protein, carbohydrate, and fat targets.
- Dynamic target recalculation when the user updates their weight or goal.
- Debounced food and recipe search to reduce unnecessary API requests.
- Dietary and allergen filters such as keto, vegan, gluten-free, dairy-free, fish-free, and soy-free.
- Secure backend search proxy with optional Spoonacular API integration.
- Local seeded catalog so the app works immediately without an external API key.
- Meal logging by Breakfast, Lunch, Dinner, or Snack.
- Serving multiplier engine for grams, ounces, and serving-based entries.
- Nutrient scaling from standardized 100g food and recipe profiles.
- Daily macro progress ring and progress bars.
- Historical 7-day, 30-day, and 90-day calorie trend visualization.
- Weight trend visualization.
- Historical log safeguards using nutrient snapshots and restrictive food/recipe delete relations.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Lucide React icons
