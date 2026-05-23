"use client";

import {
  Activity,
  BarChart3,
  CalendarDays,
  ChefHat,
  Flame,
  Gauge,
  Leaf,
  LineChart,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Profile = {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "athlete";
  goal: "aggressive_fat_loss" | "fat_loss" | "recomposition" | "lean_muscle" | "maintenance";
  tdee: number;
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
};

type MealItem = MacroTotals & {
  id: string;
  labelSnapshot: string;
  loggedWeightGrams: number;
  unit: string;
};

type MealBlock = {
  mealType: string;
  items: MealItem[];
  totals: MacroTotals;
};

type HistoryPoint = MacroTotals & {
  date: string;
};

type WeightPoint = {
  date: string;
  weightKg: number;
};

type DashboardData = {
  profile: Profile;
  selectedDate: string;
  totals: MacroTotals;
  meals: MealBlock[];
  history: HistoryPoint[];
  weights: WeightPoint[];
};

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

const todayKey = new Date().toISOString().slice(0, 10);
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const macroColors = {
  calories: "#111827",
  protein: "#059669",
  carbs: "#2563eb",
  fat: "#d97706",
};

const mealAccents: Record<string, string> = {
  Breakfast: "from-amber-400 to-orange-500",
  Lunch: "from-emerald-400 to-teal-600",
  Dinner: "from-blue-500 to-indigo-600",
  Snack: "from-rose-400 to-pink-600",
};

const cardClass =
  "rounded-[1.25rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] backdrop-blur";

const fieldClass =
  "h-11 rounded-xl border border-slate-200 bg-white/95 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

async function fetchDashboard(date: string, range: number) {
  const response = await fetch(`/api/dashboard?range=${range}&date=${date}`);
  return (await response.json()) as DashboardData;
}

function percent(value: number, target: number) {
  if (!target) {
    return 0;
  }

  return Math.min(140, Math.round((value / target) * 100));
}

function macroTarget(profile: Profile, macro: keyof MacroTotals) {
  if (macro === "calories") {
    return profile.caloriesTarget;
  }

  if (macro === "protein") {
    return profile.proteinTarget;
  }

  if (macro === "carbs") {
    return profile.carbsTarget;
  }

  return profile.fatTarget;
}

function formatGoal(goal: Profile["goal"]) {
  return goal
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function ProgressRing({ value, target }: { value: number; target: number }) {
  const pct = Math.min(100, percent(value, target));
  const dash = `${pct * 2.83} 283`;

  return (
    <div className="relative grid size-40 place-items-center">
      <svg className="size-40 -rotate-90 drop-shadow-sm" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke="url(#calorie-ring)"
          strokeLinecap="round"
          strokeWidth="9"
          strokeDasharray={dash}
        />
        <defs>
          <linearGradient id="calorie-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="52%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-4xl font-semibold text-slate-950">{pct}%</div>
        <div className="mt-1 text-xs font-semibold uppercase text-slate-500">calories</div>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = percent(value, target);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">
          {Math.round(value)} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-slate-200/80 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function HistoryChart({ data, target }: { data: HistoryPoint[]; target: number }) {
  const max = Math.max(target, ...data.map((point) => point.calories), 1);

  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl bg-slate-50">
      <svg className="h-full w-full" viewBox="0 0 720 220" role="img" aria-label="Calorie history chart">
        <rect x="0" y="0" width="720" height="220" fill="#f8fafc" />
        {[0, 1, 2, 3].map((line) => (
          <line key={line} x1="20" x2="700" y1={38 + line * 42} y2={38 + line * 42} stroke="#e2e8f0" />
        ))}
        <line
          x1="20"
          x2="700"
          y1={190 - (target / max) * 160}
          y2={190 - (target / max) * 160}
          stroke="#0f172a"
          strokeDasharray="6 8"
          opacity="0.45"
        />
        {data.map((point, index) => {
          const barWidth = Math.max(4, 680 / data.length - 4);
          const x = 20 + index * (680 / data.length);
          const height = Math.max(2, (point.calories / max) * 160);
          return (
            <rect
              key={point.date}
              x={x}
              y={190 - height}
              width={barWidth}
              height={height}
              rx="6"
              fill={point.calories > target ? "#f97316" : "#2563eb"}
              opacity="0.9"
            />
          );
        })}
      </svg>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Activity;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="size-4" />
        </span>
        {title}
      </div>
      {detail ? <span className="font-mono text-xs text-slate-500">{detail}</span> : null}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-36 items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
      <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-white">
        <Icon className="size-4" />
      </span>
      <div>
        <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
        <div className="font-mono text-sm font-semibold text-slate-950">{value}</div>
      </div>
    </div>
  );
}

export function RecipeDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [date, setDate] = useState(todayKey);
  const [range, setRange] = useState(30);
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState("");
  const [allergen, setAllergen] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [mealType, setMealType] = useState("Breakfast");
  const [amount, setAmount] = useState(100);
  const [unit, setUnit] = useState<"g" | "oz" | "serving">("g");
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState<Profile | null>(null);

  async function refreshDashboard() {
    const payload = await fetchDashboard(date, range);
    setDashboard(payload);
    setProfileForm(payload.profile);
  }

  useEffect(() => {
    let cancelled = false;

    fetchDashboard(date, range).then((payload) => {
      if (cancelled) {
        return;
      }

      setDashboard(payload);
      setProfileForm(payload.profile);
    });

    return () => {
      cancelled = true;
    };
  }, [date, range]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const params = new URLSearchParams();
      params.set("q", query);
      if (diet) params.set("diet", diet);
      if (allergen) params.set("allergen", allergen);

      const response = await fetch(`/api/search?${params.toString()}`);
      const payload = (await response.json()) as { results: SearchResult[] };
      setSearchResults(payload.results);
      setSelected((current) => current || payload.results[0] || null);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query, diet, allergen]);

  const targets = useMemo(() => {
    if (!dashboard) return null;

    return {
      calories: dashboard.profile.caloriesTarget,
      protein: dashboard.profile.proteinTarget,
      carbs: dashboard.profile.carbsTarget,
      fat: dashboard.profile.fatTarget,
    };
  }, [dashboard]);

  async function saveProfile() {
    if (!profileForm) return;
    setIsSaving(true);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    await refreshDashboard();
    setIsSaving(false);
  }

  async function logMeal() {
    if (!selected) return;
    setIsSaving(true);
    await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, mealType, amount, unit, item: selected }),
    });
    await refreshDashboard();
    setIsSaving(false);
  }

  async function deleteMealItem(id: string) {
    await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    await refreshDashboard();
  }

  if (!dashboard || !profileForm || !targets) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1e8] text-slate-950">
        <div className="rounded-3xl border border-white/70 bg-white/85 px-6 py-5 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white">
              <ChefHat className="size-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">NourishGrid</div>
              <div className="font-mono text-xs text-slate-500">Loading nutrition engine...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1e8] bg-[linear-gradient(135deg,rgba(255,255,255,0.78)_0%,rgba(244,241,232,0.92)_42%,rgba(232,241,238,0.9)_100%)] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/85 shadow-[0_24px_90px_rgba(15,23,42,0.1)] ring-1 ring-slate-900/[0.03] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1fr_430px]">
            <div className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="grid size-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg">
                  <ChefHat className="size-5" />
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                  NourishGrid
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                  Recipe + nutrition tracker
                </span>
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                {dashboard.profile.name}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                {formatGoal(dashboard.profile.goal)} plan with live macro targets, logged meals, and trend tracking.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatPill icon={Gauge} label="TDEE" value={`${Math.round(dashboard.profile.tdee)} kcal`} />
                <StatPill icon={Target} label="Goal" value={formatGoal(dashboard.profile.goal)} />
                <StatPill icon={TrendingUp} label="Weight" value={`${Math.round(dashboard.profile.weightKg)} kg`} />
              </div>
            </div>

            <div className="border-t border-slate-200/70 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                    <Sparkles className="size-4" />
                    Daily control center
                  </div>
                  <div className="mt-4 font-mono text-5xl font-semibold">
                    {Math.round(dashboard.totals.calories)}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    of {Math.round(targets.calories)} calories logged today
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 text-sm">
                    <CalendarDays className="size-4 text-slate-300" />
                    <input
                      className="bg-transparent font-mono text-white outline-none [color-scheme:dark]"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      className={`h-11 rounded-xl px-4 text-sm font-bold transition ${
                        range === days
                          ? "bg-white text-slate-950"
                          : "border border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
                      }`}
                      onClick={() => setRange(days)}
                      type="button"
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_1.35fr]">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <span className="grid size-8 place-items-center rounded-xl bg-rose-50 text-rose-600">
                    <Flame className="size-4" />
                  </span>
                  Today&apos;s intake
                </div>
                <div className="mt-4 font-mono text-4xl font-semibold">
                  {Math.round(dashboard.totals.calories)}
                  <span className="text-base text-slate-500"> / {Math.round(targets.calories)} kcal</span>
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {Math.max(0, Math.round(targets.calories - dashboard.totals.calories))} kcal remaining
                </div>
              </div>
              <ProgressRing value={dashboard.totals.calories} target={targets.calories} />
            </div>

            <div className="mt-7 grid gap-5">
              <MacroBar label="Protein" value={dashboard.totals.protein} target={targets.protein} color={macroColors.protein} />
              <MacroBar label="Carbs" value={dashboard.totals.carbs} target={targets.carbs} color={macroColors.carbs} />
              <MacroBar label="Fat" value={dashboard.totals.fat} target={targets.fat} color={macroColors.fat} />
            </div>
          </div>

          <div className={cardClass}>
            <SectionTitle
              icon={BarChart3}
              title="Calorie consistency"
              detail={`target line: ${Math.round(targets.calories)} kcal`}
            />
            <HistoryChart data={dashboard.history} target={targets.calories} />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr_0.9fr]">
          <div className={cardClass}>
            <SectionTitle icon={UserRound} title="Profile engine" />
            <div className="grid gap-3">
              <input
                className={fieldClass}
                aria-label="Name"
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={fieldClass}
                  aria-label="Age"
                  type="number"
                  value={profileForm.age}
                  onChange={(event) => setProfileForm({ ...profileForm, age: Number(event.target.value) })}
                />
                <select
                  className={fieldClass}
                  aria-label="Gender"
                  value={profileForm.gender}
                  onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value as Profile["gender"] })}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
                <input
                  className={fieldClass}
                  aria-label="Weight in kilograms"
                  type="number"
                  value={profileForm.weightKg}
                  onChange={(event) => setProfileForm({ ...profileForm, weightKg: Number(event.target.value) })}
                />
                <input
                  className={fieldClass}
                  aria-label="Height in centimeters"
                  type="number"
                  value={profileForm.heightCm}
                  onChange={(event) => setProfileForm({ ...profileForm, heightCm: Number(event.target.value) })}
                />
              </div>
              <select
                className={fieldClass}
                aria-label="Activity level"
                value={profileForm.activityLevel}
                onChange={(event) =>
                  setProfileForm({ ...profileForm, activityLevel: event.target.value as Profile["activityLevel"] })
                }
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="athlete">Athlete</option>
              </select>
              <select
                className={fieldClass}
                aria-label="Goal"
                value={profileForm.goal}
                onChange={(event) => setProfileForm({ ...profileForm, goal: event.target.value as Profile["goal"] })}
              >
                <option value="aggressive_fat_loss">Aggressive fat loss</option>
                <option value="fat_loss">Fat loss</option>
                <option value="recomposition">Body recomposition</option>
                <option value="lean_muscle">Lean muscle</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button
                className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60"
                disabled={isSaving}
                onClick={saveProfile}
                type="button"
              >
                <Activity className="size-4" />
                Recalculate
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <SectionTitle icon={Search} title="Search & log" detail="300ms debounce" />
            <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
              <input
                className={fieldClass}
                placeholder="Search foods or recipes"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                }}
              />
              <select
                className={fieldClass}
                value={diet}
                onChange={(event) => setDiet(event.target.value)}
              >
                <option value="">Any diet</option>
                <option value="keto">Keto</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-free</option>
                <option value="high-protein">High protein</option>
              </select>
              <select
                className={fieldClass}
                value={allergen}
                onChange={(event) => setAllergen(event.target.value)}
              >
                <option value="">No exclusions</option>
                <option value="dairy">Dairy-free</option>
                <option value="gluten">Gluten-free</option>
                <option value="fish">Fish-free</option>
                <option value="soy">Soy-free</option>
              </select>
            </div>

            <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-500">
                  Start typing to search the local catalog, recipes, or proxied nutrition results.
                </div>
              ) : null}
              {searchResults.map((result) => (
                <button
                  key={`${result.kind}-${result.id || result.sourceId || result.name}`}
                  className={`rounded-2xl border p-3 text-left shadow-sm transition ${
                    selected?.name === result.name
                      ? "border-blue-500 bg-blue-50 shadow-blue-900/10"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  }`}
                  onClick={() => setSelected(result)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{result.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[result.kind, ...result.dietTags.slice(0, 3)].map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-950 px-2.5 py-1 font-mono text-sm text-white">
                      {Math.round(result.caloriesPer100g)} kcal
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_100px_100px_140px]">
              <select
                className={fieldClass}
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
              >
                {mealTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <input
                className={fieldClass}
                min="0"
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <select
                className={fieldClass}
                value={unit}
                onChange={(event) => setUnit(event.target.value as "g" | "oz" | "serving")}
              >
                <option value="g">grams</option>
                <option value="oz">ounces</option>
                <option value="serving">serving</option>
              </select>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                disabled={!selected || isSaving}
                onClick={logMeal}
                type="button"
              >
                <Plus className="size-4" />
                Log
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <SectionTitle icon={Leaf} title="Daily targets" />
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(targets) as (keyof MacroTotals)[]).map((macro) => (
                <div key={macro} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner">
                  <div className="text-xs font-bold uppercase text-slate-500">{macro}</div>
                  <div className="mt-2 font-mono text-2xl font-semibold">
                    {Math.round(macroTarget(dashboard.profile, macro))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-800">
                <LineChart className="size-4" />
                Weight trend
              </div>
              <div className="mt-2 flex items-end gap-2">
                {dashboard.weights.slice(-12).map((point) => (
                  <div
                    key={`${point.date}-${point.weightKg}`}
                    className="w-full rounded-t-lg bg-amber-500 shadow-sm"
                    style={{ height: `${Math.max(10, (point.weightKg / dashboard.profile.weightKg) * 52)}px` }}
                    title={`${point.date}: ${point.weightKg}kg`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {dashboard.meals.map((meal) => (
            <div
              key={meal.mealType}
              className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03]"
            >
              <div className={`h-1.5 bg-gradient-to-r ${mealAccents[meal.mealType] || "from-slate-400 to-slate-600"}`} />
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 p-4">
                <h2 className="font-semibold text-slate-950">{meal.mealType}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-semibold text-slate-700">
                  {Math.round(meal.totals.calories)} kcal
                </span>
              </div>
              <div className="grid gap-2 p-4">
                {meal.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-500">
                    No entries
                  </div>
                ) : (
                  meal.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{item.labelSnapshot}</div>
                          <div className="mt-1 font-mono text-xs text-slate-500">
                            {Math.round(item.loggedWeightGrams)}g · P {item.protein} C {item.carbs} F {item.fat}
                          </div>
                        </div>
                        <button
                          className="grid size-8 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => deleteMealItem(item.id)}
                          title="Delete entry"
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
