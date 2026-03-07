/**
 * Simple performance monitoring for API routes and key operations.
 * Logs slow operations and tracks metrics.
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly slowThreshold = 1000; // 1 second

  track(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Log slow operations
    if (metric.duration > this.slowThreshold) {
      console.warn(
        `[SLOW] ${metric.operation} took ${metric.duration}ms`,
        metric.metadata
      );
    }

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation);
    }
    return [...this.metrics];
  }

  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const metrics = this.getMetrics(operation);
    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: durations.length,
      avg: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[p95Index],
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper to measure async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    performanceMonitor.track({
      operation,
      duration,
      timestamp: start,
      metadata,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    performanceMonitor.track({
      operation: `${operation} (error)`,
      duration,
      timestamp: start,
      metadata: { ...metadata, error: String(error) },
    });
    throw error;
  }
}

// Helper to measure sync operations
export function measureSync<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const start = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - start;
    performanceMonitor.track({
      operation,
      duration,
      timestamp: start,
      metadata,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    performanceMonitor.track({
      operation: `${operation} (error)`,
      duration,
      timestamp: start,
      metadata: { ...metadata, error: String(error) },
    });
    throw error;
  }
}
