import { prisma } from '../config/database';
import { NotFoundError } from '../utils/errors';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      photoUrl: true,
      gender: true,
      dateOfBirth: true,
      height: true,
      weight: true,
      goal: true,
      activityLevel: true,
      experienceLevel: true,
      equipment: true,
      dietaryPrefs: true,
      unitSystem: true,
      theme: true,
      notifications: true,
      language: true,
      isOnboarded: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    photoUrl?: string | null;
    gender?: string;
    dateOfBirth?: string;
    height?: number;
    weight?: number;
    goal?: string;
    activityLevel?: string;
    experienceLevel?: string;
    equipment?: string[];
    dietaryPrefs?: string[];
    isOnboarded?: boolean;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      displayName: true,
      photoUrl: true,
      gender: true,
      dateOfBirth: true,
      height: true,
      weight: true,
      goal: true,
      activityLevel: true,
      experienceLevel: true,
      equipment: true,
      dietaryPrefs: true,
      unitSystem: true,
      theme: true,
      notifications: true,
      language: true,
      isOnboarded: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function updatePreferences(
  userId: string,
  prefs: {
    unitSystem?: string;
    theme?: string;
    notifications?: boolean;
    language?: string;
  }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: prefs,
    select: {
      unitSystem: true,
      theme: true,
      notifications: true,
      language: true,
    },
  });

  return updated;
}

export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  await prisma.user.delete({ where: { id: userId } });
}
