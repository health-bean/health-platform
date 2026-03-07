/**
 * Simple in-memory cache for insights to reduce database load.
 * In production, this could be replaced with Redis or similar.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class InsightsCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Periodic cleanup of expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const insightsCache = new InsightsCache();

// Run cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => insightsCache.cleanup(), 10 * 60 * 1000);
}

// Helper to generate cache keys
export function getCacheKey(userId: string, type: string, params?: Record<string, unknown>): string {
  const paramStr = params ? JSON.stringify(params) : "";
  return `${userId}:${type}:${paramStr}`;
}
