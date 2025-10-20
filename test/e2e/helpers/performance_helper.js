/**
 * Performance Helper Utilities for E2E Tests
 * Provides performance measurement and monitoring
 */

/**
 * Measure frames per second over specified duration
 * @param {Page} page - Puppeteer page
 * @param {number} duration - Duration in milliseconds (default 5000)
 * @returns {Promise<Object>} FPS data
 */
async function measureFPS(page, duration = 5000) {
  return await page.evaluate((duration) => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let startTime = performance.now();
      let minDelta = Infinity;
      let maxDelta = 0;
      let lastFrameTime = startTime;
      
      function countFrames() {
        frameCount++;
        const now = performance.now();
        const delta = now - lastFrameTime;
        
        if (delta < minDelta) minDelta = delta;
        if (delta > maxDelta) maxDelta = delta;
        
        lastFrameTime = now;
        
        if (now - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const elapsed = (now - startTime) / 1000;
          const avgFPS = frameCount / elapsed;
          const minFPS = 1000 / maxDelta;
          const maxFPS = 1000 / minDelta;
          
          resolve({
            avgFPS: Math.round(avgFPS * 10) / 10,
            minFPS: Math.round(minFPS * 10) / 10,
            maxFPS: Math.round(maxFPS * 10) / 10,
            frameCount,
            duration: elapsed,
            avgFrameTime: (elapsed * 1000) / frameCount
          });
        }
      }
      
      requestAnimationFrame(countFrames);
    });
  }, duration);
}

/**
 * Measure memory usage
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Memory data
 */
async function measureMemory(page) {
  return await page.evaluate(() => {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.totalJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      
      return {
        usedJSHeapSize: used,
        totalJSHeapSize: total,
        jsHeapSizeLimit: limit,
        usedMB: Math.round(used / 1024 / 1024 * 10) / 10,
        totalMB: Math.round(total / 1024 / 1024 * 10) / 10,
        limitMB: Math.round(limit / 1024 / 1024 * 10) / 10,
        percentUsed: Math.round((used / limit) * 100 * 10) / 10
      };
    }
    return null;
  });
}

/**
 * Monitor performance over time
 * @param {Page} page - Puppeteer page
 * @param {number} duration - Duration in milliseconds
 * @param {number} sampleInterval - Sample interval in milliseconds
 * @returns {Promise<Object>} Performance timeline
 */
async function monitorPerformance(page, duration = 10000, sampleInterval = 1000) {
  const samples = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    const sample = {
      timestamp: Date.now() - startTime,
      memory: await measureMemory(page),
      fps: await measureFPS(page, 1000)
    };
    
    samples.push(sample);
    await page.waitForTimeout(sampleInterval);
  }
  
  return {
    duration,
    sampleCount: samples.length,
    samples,
    averages: calculateAverages(samples)
  };
}

/**
 * Calculate averages from performance samples
 * @param {Array} samples - Array of performance samples
 * @returns {Object} Averaged data
 */
function calculateAverages(samples) {
  if (samples.length === 0) return null;
  
  const sum = samples.reduce((acc, sample) => {
    return {
      fps: acc.fps + (sample.fps?.avgFPS || 0),
      memory: acc.memory + (sample.memory?.usedMB || 0)
    };
  }, { fps: 0, memory: 0 });
  
  return {
    avgFPS: Math.round((sum.fps / samples.length) * 10) / 10,
    avgMemoryMB: Math.round((sum.memory / samples.length) * 10) / 10
  };
}

/**
 * Measure render layer performance
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Layer timing data
 */
async function measureLayerPerformance(page) {
  return await page.evaluate(() => {
    if (!window.RenderManager || !window.RenderManager.renderStats) {
      return { error: 'RenderManager stats not available' };
    }
    
    const stats = window.RenderManager.renderStats;
    
    return {
      layerTimes: stats.layerTimes || {},
      totalRenderTime: Object.values(stats.layerTimes || {}).reduce((a, b) => a + b, 0),
      cacheStatus: stats.cacheStatus || {},
      renderCalls: stats.renderCalls || 0
    };
  });
}

/**
 * Measure spatial grid query performance
 * @param {Page} page - Puppeteer page
 * @param {number} iterations - Number of test iterations
 * @returns {Promise<Object>} Query performance data
 */
async function measureSpatialGridPerformance(page, iterations = 1000) {
  return await page.evaluate((iterations) => {
    if (!window.spatialGridManager) {
      return { error: 'SpatialGridManager not available' };
    }
    
    const results = {
      nearbyQuery: [],
      typeQuery: [],
      rectQuery: []
    };
    
    // Test nearby entities query
    for (let i = 0; i < iterations; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 1000;
      const radius = 100;
      
      const start = performance.now();
      window.spatialGridManager.getNearbyEntities(x, y, radius);
      const duration = performance.now() - start;
      
      results.nearbyQuery.push(duration);
    }
    
    // Test type query
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      window.spatialGridManager.getEntitiesByType('Ant');
      const duration = performance.now() - start;
      
      results.typeQuery.push(duration);
    }
    
    // Test rect query
    for (let i = 0; i < iterations; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 1000;
      
      const start = performance.now();
      window.spatialGridManager.getEntitiesInRect(x, y, 100, 100);
      const duration = performance.now() - start;
      
      results.rectQuery.push(duration);
    }
    
    // Calculate statistics
    function getStats(arr) {
      const sorted = arr.slice().sort((a, b) => a - b);
      const sum = arr.reduce((a, b) => a + b, 0);
      
      return {
        avg: sum / arr.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)]
      };
    }
    
    return {
      iterations,
      nearbyQuery: getStats(results.nearbyQuery),
      typeQuery: getStats(results.typeQuery),
      rectQuery: getStats(results.rectQuery)
    };
  }, iterations);
}

/**
 * Create performance benchmark
 * @param {Page} page - Puppeteer page
 * @param {Object} config - Benchmark configuration
 * @returns {Promise<Object>} Benchmark results
 */
async function createPerformanceBenchmark(page, config = {}) {
  const {
    antCounts = [10, 50, 100],
    duration = 5000,
    clearBetweenTests = true
  } = config;
  
  const benchmarks = [];
  
  for (const count of antCounts) {
    console.log(`📊 Benchmarking with ${count} ants...`);
    
    // Spawn ants
    await page.evaluate((count) => {
      if (!window.antsSpawn) return;
      
      for (let i = 0; i < count; i++) {
        const x = 100 + (i % 20) * 40;
        const y = 100 + Math.floor(i / 20) * 40;
        window.antsSpawn(x, y, 20, 20, 30, 0, null, 'Scout', null);
      }
    }, count);
    
    // Wait for stabilization
    await page.waitForTimeout(1000);
    
    // Measure performance
    const fps = await measureFPS(page, duration);
    const memory = await measureMemory(page);
    const layers = await measureLayerPerformance(page);
    
    benchmarks.push({
      antCount: count,
      fps: fps.avgFPS,
      minFPS: fps.minFPS,
      maxFPS: fps.maxFPS,
      memory: memory?.usedMB || 0,
      layerTimes: layers.layerTimes,
      totalRenderTime: layers.totalRenderTime
    });
    
    // Clear for next test
    if (clearBetweenTests && count !== antCounts[antCounts.length - 1]) {
      await page.evaluate(() => {
        if (window.ants) {
          window.ants.forEach(ant => {
            if (ant.destroy) ant.destroy();
          });
          window.ants = [];
        }
      });
      await page.waitForTimeout(500);
    }
  }
  
  return {
    benchmarks,
    summary: generateBenchmarkSummary(benchmarks)
  };
}

/**
 * Generate benchmark summary
 * @param {Array} benchmarks - Array of benchmark results
 * @returns {Object} Summary statistics
 */
function generateBenchmarkSummary(benchmarks) {
  const passingTargets = {
    10: { fps: 60, label: '10 ants' },
    50: { fps: 30, label: '50 ants' },
    100: { fps: 20, label: '100 ants' }
  };
  
  const results = {};
  
  for (const bench of benchmarks) {
    const target = passingTargets[bench.antCount];
    if (target) {
      results[target.label] = {
        actual: bench.fps,
        target: target.fps,
        passed: bench.fps >= target.fps,
        margin: bench.fps - target.fps
      };
    }
  }
  
  return results;
}

module.exports = {
  measureFPS,
  measureMemory,
  monitorPerformance,
  measureLayerPerformance,
  measureSpatialGridPerformance,
  createPerformanceBenchmark,
  generateBenchmarkSummary
};
