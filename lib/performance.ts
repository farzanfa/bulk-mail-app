// Performance monitoring utilities

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  start(operation: string, metadata?: Record<string, any>): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      startTime: performance.now(),
      operation,
      metadata
    });
    return id;
  }

  end(id: string): number | null {
    const metric = this.metrics.get(id);
    if (!metric) return null;

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    // Log slow operations
    if (metric.duration > 1000) { // 1 second
      console.warn(`Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric.duration;
  }

  measure<T>(operation: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): T | Promise<T> {
    const id = this.start(operation, metadata);
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => this.end(id));
    } else {
      this.end(id);
      return result;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  clear() {
    this.metrics.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();

// Database query performance wrapper
export const withPerformanceTracking = <T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  operationName: string
) => {
  return async (...args: T): Promise<R> => {
    return perfMonitor.measure(operationName, () => fn(...args), {
      args: args.length,
      timestamp: new Date().toISOString()
    }) as Promise<R>;
  };
};

// React component performance wrapper
export const withComponentPerformanceTracking = <P extends object>(
  Component: any,
  componentName: string
) => {
  return (props: P) => {
    const startTime = performance.now();
    
    const result = Component(props);
    
    const duration = performance.now() - startTime;
    if (duration > 100) { // 100ms threshold
      console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
};

// API route performance middleware
export const withApiPerformanceTracking = (handler: Function, routeName: string) => {
  return async (req: Request, ...args: any[]) => {
    return perfMonitor.measure(`API:${routeName}`, () => handler(req, ...args), {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });
  };
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }
  return null;
};

// Performance logging utility
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'development' || duration > 1000) {
    console.log(`⚡ Performance: ${operation} - ${duration.toFixed(2)}ms`, metadata);
  }
};

// Bundle size monitoring
export const getBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      domInteractive: navigation.domInteractive - navigation.navigationStart,
    };
  }
  return null;
};
