/**
 * Performance Test Runner for SafeSpace App
 * Automates performance testing and metric collection
 */

import { performance } from 'perf_hooks';

// Performance test utilities
export class PerformanceTestRunner {
  private results: PerformanceTestResult[] = [];

  /**
   * Measure execution time of a function
   */
  async measureExecutionTime<T>(
    testName: string,
    fn: () => Promise<T>,
    targetMs: number
  ): Promise<PerformanceTestResult> {
    const startTime = performance.now();
    
    try {
      await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        targetMs,
        status: duration <= targetMs ? 'PASS' : 'FAIL',
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        targetMs,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Measure API response time
   */
  async measureApiResponseTime(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    targetMs: number = 500
  ): Promise<PerformanceTestResult> {
    return this.measureExecutionTime(
      `API ${method} ${endpoint}`,
      async () => {
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        return response.json();
      },
      targetMs
    );
  }

  /**
   * Stress test - run function multiple times
   */
  async stressTest(
    testName: string,
    fn: () => Promise<void>,
    iterations: number = 10
  ): Promise<StressTestResult> {
    const durations: number[] = [];
    let failures = 0;
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        await fn();
        const endTime = performance.now();
        durations.push(endTime - startTime);
      } catch (error) {
        failures++;
        console.error(`Iteration ${i + 1} failed:`, error);
      }
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    return {
      testName,
      iterations,
      failures,
      avgDuration,
      minDuration,
      maxDuration,
      successRate: ((iterations - failures) / iterations) * 100
    };
  }

  /**
   * Memory monitoring test
   */
  async memoryTest(
    testName: string,
    fn: () => Promise<void>
  ): Promise<MemoryTestResult> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const memBefore = process.memoryUsage();
    
    await fn();
    
    // Force garbage collection again
    if (global.gc) {
      global.gc();
    }
    
    const memAfter = process.memoryUsage();
    
    return {
      testName,
      heapUsedBefore: memBefore.heapUsed / 1024 / 1024, // MB
      heapUsedAfter: memAfter.heapUsed / 1024 / 1024, // MB
      heapDiff: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024, // MB
      rss: memAfter.rss / 1024 / 1024, // MB
      external: memAfter.external / 1024 / 1024 // MB
    };
  }

  /**
   * Get all test results
   */
  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  /**
   * Get test summary
   */
  getSummary(): TestSummary {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    return {
      total,
      passed,
      failed,
      errors,
      passRate: (passed / total) * 100
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const summary = this.getSummary();
    
    let report = '# Performance Test Report\n\n';
    report += `**Date:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total Tests: ${summary.total}\n`;
    report += `- Passed: ${summary.passed}\n`;
    report += `- Failed: ${summary.failed}\n`;
    report += `- Errors: ${summary.errors}\n`;
    report += `- Pass Rate: ${summary.passRate.toFixed(2)}%\n\n`;
    
    report += `## Detailed Results\n\n`;
    report += `| Test Name | Duration (ms) | Target (ms) | Status |\n`;
    report += `|-----------|---------------|-------------|--------|\n`;
    
    for (const result of this.results) {
      const statusEmoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `| ${result.testName} | ${result.duration.toFixed(2)} | ${result.targetMs} | ${statusEmoji} ${result.status} |\n`;
    }
    
    return report;
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
  }
}

// Type definitions
export interface PerformanceTestResult {
  testName: string;
  duration: number;
  targetMs: number;
  status: 'PASS' | 'FAIL' | 'ERROR';
  error?: string;
  timestamp: string;
}

export interface StressTestResult {
  testName: string;
  iterations: number;
  failures: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
}

export interface MemoryTestResult {
  testName: string;
  heapUsedBefore: number;
  heapUsedAfter: number;
  heapDiff: number;
  rss: number;
  external: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  passRate: number;
}

// Example usage
export async function runPerformanceTests() {
  const runner = new PerformanceTestRunner();
  
  console.log('🚀 Starting Performance Tests...\n');
  
  // Test 1: API Response Times
  console.log('Testing API endpoints...');
  await runner.measureApiResponseTime('http://localhost:3000/api/mood', 'GET', null, 500);
  await runner.measureApiResponseTime('http://localhost:3000/api/journal', 'GET', null, 500);
  await runner.measureApiResponseTime('http://localhost:3000/api/appointments', 'GET', null, 500);
  
  // Test 2: Database Query Performance
  console.log('\nTesting database operations...');
  await runner.measureExecutionTime(
    'Query 100 journal entries',
    async () => {
      // Simulate database query
      await new Promise(resolve => setTimeout(resolve, 80));
    },
    100
  );
  
  // Test 3: Image Processing
  console.log('\nTesting image operations...');
  await runner.measureExecutionTime(
    'Image compression',
    async () => {
      // Simulate image compression
      await new Promise(resolve => setTimeout(resolve, 200));
    },
    500
  );
  
  // Test 4: Stress Test
  console.log('\nRunning stress tests...');
  const stressResult = await runner.stressTest(
    'Rapid mood logging',
    async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    },
    20
  );
  
  console.log(`\nStress Test Results:`);
  console.log(`- Iterations: ${stressResult.iterations}`);
  console.log(`- Failures: ${stressResult.failures}`);
  console.log(`- Avg Duration: ${stressResult.avgDuration.toFixed(2)}ms`);
  console.log(`- Success Rate: ${stressResult.successRate.toFixed(2)}%`);
  
  // Generate report
  console.log('\n' + '='.repeat(50));
  console.log(runner.generateReport());
  
  return runner.getResults();
}

// Run tests if executed directly
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('\n✅ Performance tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance tests failed:', error);
      process.exit(1);
    });
}
