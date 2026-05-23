import { getPrisma } from "@/lib/prisma";
import { calculateTargets, type ActivityLevel, type Gender, type Goal } from "@/lib/nutrition";

export type ProfilePayload = {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

const defaultProfile: ProfilePayload = {
  name: "Avery Stone",
  age: 32,
  gender: "other",
  heightCm: 178,
  weightKg: 76,
  activityLevel: "moderate",
  goal: "recomposition",
};

export async function ensureProfile() {
  const prisma = getPrisma();
  const existing = await prisma.userProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  const targets = calculateTargets(defaultProfile);

  return prisma.userProfile.create({
    data: {
      id: "demo",
      ...defaultProfile,
      ...targets,
      weightLogs: {
        create: { weightKg: defaultProfile.weightKg },
      },
    },
  });
}

export async function updateProfile(payload: ProfilePayload) {
  const prisma = getPrisma();
  const current = await ensureProfile();
  const targets = calculateTargets(payload);

  const updated = await prisma.userProfile.update({
    where: { id: current.id },
    data: {
      ...payload,
      ...targets,
    },
  });

  const latestWeight = await prisma.weightLog.findFirst({
    where: { userId: current.id },
    orderBy: { loggedAt: "desc" },
  });

  if (!latestWeight || Math.abs(latestWeight.weightKg - payload.weightKg) >= 0.05) {
    await prisma.weightLog.create({
      data: {
        userId: current.id,
        weightKg: payload.weightKg,
      },
    });
  }

  return updated;
}
