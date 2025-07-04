interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  cacheHit?: boolean;
  dataSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep only last 100 metrics

  startTimer(operation: string): (success?: boolean, cacheHit?: boolean, dataSize?: number) => void {
    const startTime = Date.now();
    
    return (success: boolean = true, cacheHit?: boolean, dataSize?: number) => {
      const duration = Date.now() - startTime;
      const metric: PerformanceMetrics = {
        operation,
        duration,
        timestamp: new Date(),
        success,
        cacheHit,
        dataSize
      };
      
      this.addMetric(metric);
      
      console.log(`[Performance] ${operation}: ${duration}ms ${cacheHit ? '(cache hit)' : '(network)'} ${success ? '✓' : '✗'}`);
      
      if (duration > 2000) {
        console.warn(`[Performance] Slow operation detected: ${operation} took ${duration}ms`);
      }
    };
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.success);
    if (operationMetrics.length === 0) return 0;
    
    const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalTime / operationMetrics.length;
  }

  getCacheHitRate(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.cacheHit !== undefined);
    if (operationMetrics.length === 0) return 0;
    
    const cacheHits = operationMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / operationMetrics.length) * 100;
  }

  getPerformanceReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    
    let report = "Performance Report:\n";
    report += "==================\n\n";
    
    operations.forEach(op => {
      const avgTime = this.getAverageTime(op);
      const cacheHitRate = this.getCacheHitRate(op);
      const count = this.metrics.filter(m => m.operation === op).length;
      
      report += `${op}:\n`;
      report += `  Average Time: ${avgTime.toFixed(2)}ms\n`;
      report += `  Cache Hit Rate: ${cacheHitRate.toFixed(1)}%\n`;
      report += `  Total Operations: ${count}\n\n`;
    });
    
    return report;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Utility function to measure database operations
export const measureDbOperation = async <T>(
  operation: string,
  dbFunction: () => Promise<T>,
  cacheCheck?: () => T | null
): Promise<T> => {
  const timer = performanceMonitor.startTimer(operation);
  
  try {
    // Check cache first if available
    if (cacheCheck) {
      const cachedResult = cacheCheck();
      if (cachedResult !== null) {
        timer(true, true, JSON.stringify(cachedResult).length);
        return cachedResult;
      }
    }
    
    // Perform database operation
    const result = await dbFunction();
    timer(true, false, JSON.stringify(result).length);
    return result;
  } catch (error) {
    timer(false, false);
    throw error;
  }
};

// Database call optimization suggestions
export const getOptimizationSuggestions = (): string[] => {
  const suggestions: string[] = [];
  const metrics = performanceMonitor.getMetrics();
  
  // Check for frequent duplicate operations
  const operations = metrics.map(m => m.operation);
  const duplicates = operations.filter((op, index) => 
    operations.indexOf(op) !== index && 
    operations.lastIndexOf(op) - operations.indexOf(op) < 10
  );
  
  if (duplicates.length > 0) {
    suggestions.push("Consider implementing caching for frequently repeated operations");
  }
  
  // Check for slow operations
  const slowOperations = metrics.filter(m => m.duration > 2000);
  if (slowOperations.length > 0) {
    suggestions.push("Some database operations are taking longer than 2 seconds. Consider optimizing queries or adding indexes");
  }
  
  // Check cache hit rate
  const operationsWithCache = [...new Set(metrics.filter(m => m.cacheHit !== undefined).map(m => m.operation))];
  operationsWithCache.forEach(op => {
    const hitRate = performanceMonitor.getCacheHitRate(op);
    if (hitRate < 50) {
      suggestions.push(`Cache hit rate for ${op} is low (${hitRate.toFixed(1)}%). Consider improving cache strategy`);
    }
  });
  
  return suggestions;
};
