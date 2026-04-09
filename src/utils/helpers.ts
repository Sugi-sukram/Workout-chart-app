import { PaginatedResponse, PaginationQuery, ApiResponse } from '../types';

/**
 * Parse pagination parameters from a query object, applying defaults.
 */
export function parsePaginationQuery(query: Record<string, unknown>): PaginationQuery {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : undefined;
  const sortOrder =
    typeof query.sortOrder === 'string' && ['asc', 'desc'].includes(query.sortOrder)
      ? (query.sortOrder as 'asc' | 'desc')
      : 'desc';

  return { page, limit, sortBy, sortOrder };
}

/**
 * Build a standardized paginated response.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Build a success response.
 */
export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

/**
 * Build an error response.
 */
export function errorResponse(
  message: string,
  code?: string,
  details?: unknown
): ApiResponse<never> {
  return {
    success: false,
    error: {
      message,
      ...(code ? { code } : {}),
      ...(details ? { details } : {}),
    },
  };
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

/**
 * Get the start of today (midnight) in UTC.
 */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Get today's date as a YYYY-MM-DD string.
 */
export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object at midnight UTC.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Get the number of days between two dates.
 */
export function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.abs(Math.floor((utcB - utcA) / msPerDay));
}

/**
 * Check if two dates are the same calendar day (UTC).
 */
export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  );
}

/**
 * Check if two dates are consecutive calendar days (UTC).
 */
export function isConsecutiveDay(earlier: Date, later: Date): boolean {
  return daysBetween(earlier, later) === 1;
}

/**
 * Get start and end of a date range for querying.
 */
export function getDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  // Set end to end of day
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Format seconds into a human-readable duration string (e.g., "1h 23m 45s").
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Generate Prisma skip/take from pagination query.
 */
export function paginationToSkipTake(pagination: PaginationQuery): {
  skip: number;
  take: number;
} {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}
