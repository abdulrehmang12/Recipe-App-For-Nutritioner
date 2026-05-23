import { NextResponse } from "next/server";
import { ensureProfile, updateProfile, type ProfilePayload } from "@/lib/profile";

export const dynamic = "force-dynamic";

function numberField(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET() {
  const profile = await ensureProfile();
  return NextResponse.json({ profile });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ProfilePayload>;
  const current = await ensureProfile();
  const payload: ProfilePayload = {
    name: String(body.name || current.name),
    age: numberField(body.age, current.age),
    gender: (body.gender || current.gender) as ProfilePayload["gender"],
    heightCm: numberField(body.heightCm, current.heightCm),
    weightKg: numberField(body.weightKg, current.weightKg),
    activityLevel: (body.activityLevel || current.activityLevel) as ProfilePayload["activityLevel"],
    goal: (body.goal || current.goal) as ProfilePayload["goal"],
  };

  const profile = await updateProfile(payload);

  return NextResponse.json({ profile });
}
