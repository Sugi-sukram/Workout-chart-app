import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';
import { calculateLevel } from '../utils/calculations';
import { isSameDay, isConsecutiveDay, startOfToday } from '../utils/helpers';

export async function getXPData(userId: string) {
  let gam = await prisma.userGamification.findUnique({ where: { userId } });
  if (!gam) {
    gam = await prisma.userGamification.create({ data: { userId } });
  }

  const levelInfo = calculateLevel(gam.totalXp);

  return {
    ...gam,
    ...levelInfo,
  };
}

export async function addXPEvent(
  userId: string,
  type: string,
  xpAmount: number,
  description?: string
) {
  const event = await prisma.xPEvent.create({
    data: {
      userId,
      type,
      xpAmount,
      description: description ?? null,
    },
  });

  // Ensure gamification record exists
  let gam = await prisma.userGamification.findUnique({ where: { userId } });
  if (!gam) {
    gam = await prisma.userGamification.create({ data: { userId } });
  }

  const newTotalXp = gam.totalXp + xpAmount;
  const levelInfo = calculateLevel(newTotalXp);

  const updated = await prisma.userGamification.update({
    where: { userId },
    data: {
      totalXp: newTotalXp,
      level: levelInfo.level,
      dailyXpEarned: gam.dailyXpEarned + xpAmount,
    },
  });

  return {
    event,
    gamification: {
      ...updated,
      ...levelInfo,
    },
  };
}

export async function getXPHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.xPEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.xPEvent.count({ where: { userId } }),
  ]);

  return { events, total, page, limit };
}

export async function getStreak(userId: string) {
  let gam = await prisma.userGamification.findUnique({ where: { userId } });
  if (!gam) {
    gam = await prisma.userGamification.create({ data: { userId } });
  }

  return {
    currentStreak: gam.currentStreak,
    longestStreak: gam.longestStreak,
    lastActiveDate: gam.lastActiveDate,
  };
}

export async function checkIn(userId: string) {
  let gam = await prisma.userGamification.findUnique({ where: { userId } });
  if (!gam) {
    gam = await prisma.userGamification.create({ data: { userId } });
  }

  const today = startOfToday();

  if (gam.lastActiveDate && isSameDay(gam.lastActiveDate, today)) {
    // Already checked in today
    return {
      currentStreak: gam.currentStreak,
      longestStreak: gam.longestStreak,
      lastActiveDate: gam.lastActiveDate,
      alreadyCheckedIn: true,
    };
  }

  let newStreak: number;

  if (gam.lastActiveDate && isConsecutiveDay(gam.lastActiveDate, today)) {
    // Yesterday was active, increment streak
    newStreak = gam.currentStreak + 1;
  } else {
    // Streak broken or first check-in
    newStreak = 1;
  }

  const newLongest = Math.max(gam.longestStreak, newStreak);

  const updated = await prisma.userGamification.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      dailyXpEarned: 0, // Reset daily XP on new day
    },
  });

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastActiveDate: updated.lastActiveDate,
    alreadyCheckedIn: false,
  };
}

export async function getAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: { userId },
      },
    },
    orderBy: { category: 'asc' },
  });

  return achievements.map((a) => {
    const userAch = a.userAchievements[0] ?? null;
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      iconUrl: a.iconUrl,
      category: a.category,
      xpReward: a.xpReward,
      target: a.target,
      unlocked: !!userAch?.unlockedAt,
      unlockedAt: userAch?.unlockedAt ?? null,
      progress: userAch?.progress ?? 0,
      current: userAch?.current ?? 0,
    };
  });
}

export async function unlockAchievement(userId: string, achievementId: string) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId },
  });
  if (!achievement) {
    throw new NotFoundError('Achievement');
  }

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId } },
  });

  if (existing?.unlockedAt) {
    throw new ConflictError('Achievement already unlocked');
  }

  const userAchievement = await prisma.userAchievement.upsert({
    where: { userId_achievementId: { userId, achievementId } },
    update: {
      unlockedAt: new Date(),
      progress: 1,
      current: achievement.target,
    },
    create: {
      userId,
      achievementId,
      unlockedAt: new Date(),
      progress: 1,
      current: achievement.target,
    },
  });

  // Award XP for the achievement
  if (achievement.xpReward > 0) {
    await addXPEvent(
      userId,
      'achievement_unlocked',
      achievement.xpReward,
      `Achievement unlocked: ${achievement.name}`
    );
  }

  return userAchievement;
}

export async function getLeaderboard(limit: number = 20) {
  const leaderboard = await prisma.userGamification.findMany({
    orderBy: { totalXp: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
        },
      },
    },
  });

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    displayName: entry.user.displayName,
    photoUrl: entry.user.photoUrl,
    totalXp: entry.totalXp,
    level: entry.level,
  }));
}
