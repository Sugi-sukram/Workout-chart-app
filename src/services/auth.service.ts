import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';
import { TokenPayload } from '../types';

const BCRYPT_ROUNDS = 12;

export async function signup(
  email: string,
  password: string,
  displayName?: string
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName ?? null,
      },
    });

    await tx.userGamification.create({
      data: { userId: newUser.id },
    });

    await tx.macroGoal.create({
      data: { userId: newUser.id },
    });

    await tx.subscription.create({
      data: { userId: newUser.id, tier: 'free' },
    });

    return newUser;
  });

  const tokens = generateTokenPair(user.id, user.email);
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh },
  });

  const { passwordHash: _, refreshToken: __, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokens = generateTokenPair(user.id, user.email);
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh },
  });

  const { passwordHash: _, refreshToken: __, ...safeUser } = user;

  return {
    user: safeUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function refreshTokens(refreshToken: string) {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.refreshToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const valid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!valid) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const tokens = generateTokenPair(user.id, user.email);
  const hashedRefresh = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashedRefresh },
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export function generateTokenPair(userId: string, email: string) {
  const accessToken = jwt.sign(
    { userId, email } as TokenPayload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId, email } as TokenPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('User');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, refreshToken: null },
  });
}

export async function resetPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return silently to prevent email enumeration
    return { message: 'If the email exists, a reset link will be sent' };
  }

  // MVP: Log the reset request. In production, send an email.
  console.log(`[auth] Password reset requested for ${email}`);
  return { message: 'If the email exists, a reset link will be sent' };
}
