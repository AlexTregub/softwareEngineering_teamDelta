# PerformanceMonitor API Documentation

> **Module**: `Classes/rendering/PerformanceMonitor.js`  
> **Version**: 1.0.0  
> **Author**: Software Engineering Team Delta - David Willman  
> **Last Updated**: October 2025

## Overview

The `PerformanceMonitor` class provides comprehensive performance tracking and debug display for the rendering system. It monitors FPS, memory usage, layer timing, entity statistics, and provides configurable performance thresholds with visual indicators.

## Performance Thresholds

### Default Thresholds

```javascript
const DEFAULT_PERFORMANCE_THRESHOLDS = {
  goodAvgFPS: 55,
  fairAvgFPS: 30,
  poorFrameTime: 33, // ms
  worstFrameTime: 50, // ms
  memoryGrowthBytes: 50 * 1024 * 1024, // 50MB
  memoryIncreaseRateBytesPerSec: 1024 * 1024 // 1MB/sec
};
```

These thresholds are used to categorize performance levels and trigger warnings when performance degrades below acceptable levels.

## Class: PerformanceMonitor

### Constructor

#### `new PerformanceMonitor(config = {})`

**Parameters:**
- `config` (Object, optional): Configuration options to override defaults

Creates a PerformanceMonitor instance with initialized tracking systems and configurable thresholds.

**Implementation Details:**
```javascript
constructor(config = {}) {
  // Frame timing data
  this.frameData = {
    frameCount: 0,
    startTime: Date.now(),
    lastFrameStart: 0,
    currentFrameStart: 0,
    frameTime: 0,
    frameHistory: new Array(60).fill(16.67), // 60 frame history
    historyIndex: 0
  };

  // Layer timing data
  this.layerTiming = {
    currentLayers: {},
    layerHistory: {},
    activeLayer: null,
    layerStart: 0
  };

  // Entity statistics
  this.entityStats = {
    totalEntities: 0,
    renderedEntities: 0,
    culledEntities: 0,
    entityTypes: {}
  };

  // Debug display settings
  this.debugDisplay = {
    enabled: false,
    position: { x: 10, y: 10 },
    width: 280,
    height: 300,
    backgroundColor: [0, 0, 0, 150],
    textColor: [0, 255, 0, 255],
    fontSize: 12
  };

  // Performance thresholds (merged with config)
  this.thresholds = { ...DEFAULT_PERFORMANCE_THRESHOLDS, ...config };
}
```

**Configuration Options:**
- **Performance Thresholds**: Custom FPS and timing thresholds
- **Debug Display**: Position, size, and styling options
- **History Tracking**: Frame history length and sampling rates
- **Warning System**: Enable/disable performance warnings

---

## Frame Tracking System

### `startFrame()`

Begins frame timing measurement and updates frame statistics.

**Implementation:**
```javascript
startFrame() {
  const now = performance.now();
  
  // Calculate frame time from previous frame
  if (this.frameData.lastFrameStart > 0) {
    this.frameData.frameTime = now - this.frameData.lastFrameStart;
    
    // Update frame history
    this.frameData.frameHistory[this.frameData.historyIndex] = this.frameData.frameTime;
    this.frameData.historyIndex = (this.frameData.historyIndex + 1) % 60;
  }
  
  this.frameData.currentFrameStart = now;
  this.frameData.lastFrameStart = now;
  this.frameData.frameCount++;
  
  // Performance warnings
  this.checkFramePerformance();
}
```

### `endFrame()`

Completes frame timing and triggers performance analysis.

### `getCurrentFPS()`

**Returns:** `number` - Current frames per second

Calculates current FPS based on recent frame timing.

**Implementation:**
```javascript
getCurrentFPS() {
  if (this.frameData.frameTime <= 0) return 0;
  return Math.round(1000 / this.frameData.frameTime);
}
```

### `getAverageFPS()`

**Returns:** `number` - Average FPS over recent frames

Calculates average FPS from frame history buffer.

**Implementation:**
```javascript
getAverageFPS() {
  const validFrames = this.frameData.frameHistory.filter(time => time > 0);
  if (validFrames.length === 0) return 0;
  
  const avgFrameTime = validFrames.reduce((sum, time) => sum + time, 0) / validFrames.length;
  return Math.round(1000 / avgFrameTime);
}
```

---

## Layer Performance Tracking

### `startLayerTiming(layerName)`

**Parameters:**
- `layerName` (string): Name of the rendering layer

Begins timing measurement for a specific rendering layer.

**Implementation:**
```javascript
startLayerTiming(layerName) {
  this.layerTiming.activeLayer = layerName;
  this.layerTiming.layerStart = performance.now();
  
  // Initialize layer history if not exists
  if (!this.layerTiming.layerHistory[layerName]) {
    this.layerTiming.layerHistory[layerName] = [];
  }
}
```

### `endLayerTiming(layerName)`

**Parameters:**
- `layerName` (string): Name of the rendering layer

Completes timing measurement for the specified layer.

**Implementation:**
```javascript
endLayerTiming(layerName) {
  if (this.layerTiming.activeLayer !== layerName) {
    console.warn(`PerformanceMonitor: Layer timing mismatch - expected ${this.layerTiming.activeLayer}, got ${layerName}`);
    return;
  }
  
  const layerTime = performance.now() - this.layerTiming.layerStart;
  
  // Store current layer time
  this.layerTiming.currentLayers[layerName] = layerTime;
  
  // Update layer history (keep last 60 frames)
  const history = this.layerTiming.layerHistory[layerName];
  history.push(layerTime);
  if (history.length > 60) {
    history.shift();
  }
  
  this.layerTiming.activeLayer = null;
}
```

### `getLayerStats()`

**Returns:** `Object` - Layer performance statistics

Returns comprehensive statistics for all tracked layers.

**Statistics Provided:**
```javascript
getLayerStats() {
  const stats = {};
  
  Object.keys(this.layerTiming.layerHistory).forEach(layerName => {
    const history = this.layerTiming.layerHistory[layerName];
    const current = this.layerTiming.currentLayers[layerName] || 0;
    
    stats[layerName] = {
      current: current,
      average: history.length > 0 ? 
        history.reduce((sum, time) => sum + time, 0) / history.length : 0,
      min: history.length > 0 ? Math.min(...history) : 0,
      max: history.length > 0 ? Math.max(...history) : 0,
      percentage: current / this.frameData.frameTime * 100
    };
  });
  
  return stats;
}
```

---

## Entity Statistics

### `updateEntityStats(entityCounts)`

**Parameters:**
- `entityCounts` (Object): Entity counts by type and rendering status

Updates entity rendering statistics for performance analysis.

**Implementation:**
```javascript
updateEntityStats(entityCounts) {
  this.entityStats = {
    totalEntities: entityCounts.total || 0,
    renderedEntities: entityCounts.rendered || 0,
    culledEntities: entityCounts.culled || 0,
    entityTypes: { ...entityCounts.types } || {}
  };
  
  // Performance analysis
  this.analyzeEntityPerformance();
}
```

**Entity Count Structure:**
```javascript
const entityCounts = {
  total: 150,
  rendered: 120,
  culled: 30,
  types: {
    'Ant': 100,
    'Resource': 30,
    'Building': 20
  }
};
```

### `analyzeEntityPerformance()`

Analyzes entity rendering performance and generates warnings if necessary.

**Performance Indicators:**
- High entity count with poor FPS
- Low culling efficiency (too many entities rendered)
- Disproportionate rendering times per entity type

---

## Memory Monitoring

### `updateMemoryStats()`

Updates memory usage statistics and checks for memory leaks.

**Implementation:**
```javascript
updateMemoryStats() {
  if ('memory' in performance) {
    const memInfo = performance.memory;
    
    this.memoryStats = {
      used: memInfo.usedJSHeapSize,
      total: memInfo.totalJSHeapSize,
      limit: memInfo.jsHeapSizeLimit,
      timestamp: Date.now()
    };
    
    this.checkMemoryLeaks();
  }
}
```

### `checkMemoryLeaks()`

Analyzes memory usage patterns to detect potential memory leaks.

**Leak Detection Logic:**
```javascript
checkMemoryLeaks() {
  if (this.memoryHistory.length < 2) return;
  
  const recent = this.memoryStats.used;
  const previous = this.memoryHistory[this.memoryHistory.length - 2].used;
  const growth = recent - previous;
  
  // Check for excessive memory growth
  if (growth > this.thresholds.memoryGrowthBytes) {
    console.warn(`PerformanceMonitor: Large memory increase detected: ${(growth / 1024 / 1024).toFixed(1)}MB`);
  }
  
  // Check for sustained memory growth rate
  const timespan = 5000; // 5 seconds
  const oldSample = this.memoryHistory.find(sample => 
    Date.now() - sample.timestamp > timespan
  );
  
  if (oldSample) {
    const rate = (recent - oldSample.used) / timespan * 1000; // bytes per second
    if (rate > this.thresholds.memoryIncreaseRateBytesPerSec) {
      console.warn(`PerformanceMonitor: Sustained memory leak detected: ${(rate / 1024).toFixed(1)}KB/s`);
    }
  }
}
```

---

## Debug Display System

### `setDebugDisplay(enabled)`

**Parameters:**
- `enabled` (boolean): Whether to show the debug display

Enables or disables the visual performance overlay.

**Implementation:**
```javascript
setDebugDisplay(enabled) {
  this.debugDisplay.enabled = enabled;
  
  if (enabled) {
    console.log('PerformanceMonitor: Debug display enabled');
  } else {
    console.log('PerformanceMonitor: Debug display disabled');
  }
}
```

### `render()`

Renders the performance debug overlay with comprehensive statistics.

**Display Elements:**
```javascript
render() {
  if (!this.debugDisplay.enabled) return;
  
  push();
  
  // Background panel
  fill(this.debugDisplay.backgroundColor);
  rect(
    this.debugDisplay.position.x, 
    this.debugDisplay.position.y,
    this.debugDisplay.width, 
    this.debugDisplay.height
  );
  
  // Performance text
  fill(this.debugDisplay.textColor);
  textSize(this.debugDisplay.fontSize);
  
  let y = this.debugDisplay.position.y + 20;
  const x = this.debugDisplay.position.x + 10;
  
  // FPS Information
  text(`FPS: ${this.getCurrentFPS()} (avg: ${this.getAverageFPS()})`, x, y);
  y += 15;
  
  // Frame timing
  text(`Frame: ${this.frameData.frameTime.toFixed(2)}ms`, x, y);
  y += 15;
  
  // Layer timing breakdown
  text('Layer Times:', x, y);
  y += 15;
  
  const layerStats = this.getLayerStats();
  Object.entries(layerStats).forEach(([layer, stats]) => {
    const color = this.getPerformanceColor(stats.current);
    fill(color);
    text(`  ${layer}: ${stats.current.toFixed(2)}ms (${stats.percentage.toFixed(1)}%)`, x, y);
    y += 12;
  });
  
  // Entity statistics
  fill(this.debugDisplay.textColor);
  y += 10;
  text('Entities:', x, y);
  y += 15;
  text(`  Total: ${this.entityStats.totalEntities}`, x, y);
  y += 12;
  text(`  Rendered: ${this.entityStats.renderedEntities}`, x, y);
  y += 12;
  text(`  Culled: ${this.entityStats.culledEntities}`, x, y);
  
  // Memory information (if available)
  if (this.memoryStats) {
    y += 20;
    text('Memory:', x, y);
    y += 15;
    text(`  Used: ${(this.memoryStats.used / 1024 / 1024).toFixed(1)}MB`, x, y);
    y += 12;
    text(`  Total: ${(this.memoryStats.total / 1024 / 1024).toFixed(1)}MB`, x, y);
  }
  
  pop();
}
```

### `getPerformanceColor(value)`

**Parameters:**
- `value` (number): Performance value to evaluate

**Returns:** `Array` - RGB color array

Returns color coding based on performance thresholds.

**Color Coding:**
```javascript
getPerformanceColor(value) {
  if (value < this.thresholds.poorFrameTime * 0.5) {
    return [0, 255, 0]; // Green - excellent
  } else if (value < this.thresholds.poorFrameTime) {
    return [255, 255, 0]; // Yellow - good
  } else if (value < this.thresholds.worstFrameTime) {
    return [255, 165, 0]; // Orange - poor
  } else {
    return [255, 0, 0]; // Red - critical
  }
}
```

---

## Performance Analysis

### `checkFramePerformance()`

Analyzes frame performance and generates warnings for poor performance.

**Performance Checks:**
```javascript
checkFramePerformance() {
  const currentFPS = this.getCurrentFPS();
  const avgFPS = this.getAverageFPS();
  
  // FPS warnings
  if (avgFPS < this.thresholds.fairAvgFPS) {
    if (this.frameData.frameCount % 300 === 0) { // Every 5 seconds at 60fps
      console.warn(`PerformanceMonitor: Low average FPS: ${avgFPS} (threshold: ${this.thresholds.fairAvgFPS})`);
    }
  }
  
  // Frame time warnings
  if (this.frameData.frameTime > this.thresholds.worstFrameTime) {
    console.warn(`PerformanceMonitor: Frame time spike: ${this.frameData.frameTime.toFixed(2)}ms`);
  }
  
  // Sustained poor performance
  const recentFrames = this.frameData.frameHistory.slice(-30); // Last 30 frames
  const recentAvg = recentFrames.reduce((sum, time) => sum + time, 0) / recentFrames.length;
  
  if (recentAvg > this.thresholds.poorFrameTime) {
    this.performanceWarningCount++;
    if (this.performanceWarningCount > 30) { // Sustained for 30 frames
      console.warn(`PerformanceMonitor: Sustained poor performance detected`);
      this.performanceWarningCount = 0; // Reset to prevent spam
    }
  } else {
    this.performanceWarningCount = 0;
  }
}
```

### `generatePerformanceReport()`

**Returns:** `Object` - Comprehensive performance report

Generates a detailed performance report with recommendations.

**Report Structure:**
```javascript
generatePerformanceReport() {
  const report = {
    timestamp: Date.now(),
    summary: {
      currentFPS: this.getCurrentFPS(),
      averageFPS: this.getAverageFPS(),
      frameTime: this.frameData.frameTime,
      totalFrames: this.frameData.frameCount
    },
    layers: this.getLayerStats(),
    entities: { ...this.entityStats },
    memory: this.memoryStats ? { ...this.memoryStats } : null,
    performance: {
      rating: this.getPerformanceRating(),
      bottlenecks: this.identifyBottlenecks(),
      recommendations: this.generateRecommendations()
    }
  };
  
  return report;
}
```

### `identifyBottlenecks()`

**Returns:** `Array` - List of identified performance bottlenecks

Analyzes performance data to identify specific bottlenecks.

**Bottleneck Detection:**
```javascript
identifyBottlenecks() {
  const bottlenecks = [];
  const layerStats = this.getLayerStats();
  
  // Layer-specific bottlenecks
  Object.entries(layerStats).forEach(([layer, stats]) => {
    if (stats.percentage > 40) { // Layer taking more than 40% of frame time
      bottlenecks.push({
        type: 'layer',
        layer: layer,
        impact: 'high',
        description: `Layer ${layer} consuming ${stats.percentage.toFixed(1)}% of frame time`
      });
    }
  });
  
  // Entity-related bottlenecks
  const cullRatio = this.entityStats.culledEntities / this.entityStats.totalEntities;
  if (cullRatio < 0.1 && this.entityStats.totalEntities > 100) {
    bottlenecks.push({
      type: 'culling',
      impact: 'medium',
      description: `Poor culling efficiency: ${(cullRatio * 100).toFixed(1)}% entities culled`
    });
  }
  
  // Memory-related bottlenecks
  if (this.memoryStats && this.memoryStats.used > this.memoryStats.limit * 0.8) {
    bottlenecks.push({
      type: 'memory',
      impact: 'high',
      description: `High memory usage: ${(this.memoryStats.used / this.memoryStats.limit * 100).toFixed(1)}% of limit`
    });
  }
  
  return bottlenecks;
}
```

---

## Configuration and Customization

### `updateThresholds(newThresholds)`

**Parameters:**
- `newThresholds` (Object): New threshold values to apply

Updates performance thresholds for warnings and analysis.

### `configureDebugDisplay(options)`

**Parameters:**
- `options` (Object): Debug display configuration options

Customizes the visual appearance and position of the debug overlay.

**Configuration Options:**
```javascript
configureDebugDisplay({
  position: { x: 10, y: 10 },
  width: 300,
  height: 350,
  backgroundColor: [0, 0, 0, 180],
  textColor: [0, 255, 0, 255],
  fontSize: 14
});
```

---

## TODO Enhancements

### Advanced Metrics
- **GPU Performance**: WebGL rendering performance metrics
- **Draw Call Tracking**: Monitor and optimize draw calls
- **Texture Memory**: Track texture usage and memory
- **Shader Performance**: Profile custom shader execution

### Performance Profiling
- **Call Stack Profiling**: Identify expensive function calls
- **Hot Spot Detection**: Automatically identify performance hot spots
- **Performance Regression**: Compare performance over time
- **Benchmark Suites**: Automated performance testing

### Enhanced Visualization
- **Performance Graphs**: Real-time performance charts
- **Heatmap Visualization**: Visual representation of performance hot spots
- **Timeline View**: Frame-by-frame performance analysis
- **Comparative Analysis**: Side-by-side performance comparisons

### Optimization Suggestions
- **Automatic Recommendations**: AI-driven optimization suggestions
- **Performance Budgets**: Set and monitor performance budgets
- **Adaptive Quality**: Automatically adjust quality based on performance
- **Predictive Scaling**: Anticipate performance issues before they occur

---

## Integration Examples

### Basic Performance Monitoring
```javascript
// Global performance monitor
const g_performanceMonitor = new PerformanceMonitor();

// Main game loop integration
function draw() {
  g_performanceMonitor.startFrame();
  
  // Render layers with timing
  g_performanceMonitor.startLayerTiming('entities');
  renderEntities();
  g_performanceMonitor.endLayerTiming('entities');
  
  // Update entity stats
  g_performanceMonitor.updateEntityStats({
    total: allEntities.length,
    rendered: renderedEntities.length,
    culled: culledEntities.length,
    types: entityTypeCounts
  });
  
  g_performanceMonitor.endFrame();
  g_performanceMonitor.render(); // Show debug overlay
}
```

### Performance-Based Quality Scaling
```javascript
// Adaptive quality based on performance
function updateQuality() {
  const fps = g_performanceMonitor.getAverageFPS();
  
  if (fps < 30) {
    // Reduce quality settings
    entityRenderDistance *= 0.9;
    particleCount *= 0.8;
    console.log('Performance: Reduced quality settings');
  } else if (fps > 55) {
    // Increase quality settings
    entityRenderDistance = Math.min(entityRenderDistance * 1.05, maxRenderDistance);
    particleCount = Math.min(particleCount * 1.1, maxParticleCount);
  }
}
```

### Performance Reporting
```javascript
// Generate periodic performance reports
setInterval(() => {
  const report = g_performanceMonitor.generatePerformanceReport();
  
  if (report.performance.bottlenecks.length > 0) {
    console.warn('Performance bottlenecks detected:');
    report.performance.bottlenecks.forEach(bottleneck => {
      console.warn(`  ${bottleneck.type}: ${bottleneck.description}`);
    });
  }
}, 30000); // Every 30 seconds
```

---

## See Also

- **[RenderLayerManager API Documentation](RenderLayerManager.md)** - Layer performance integration
- **[RenderController API Documentation](RenderController.md)** - Entity rendering performance
- **[EntityLayerRenderer API Documentation](EntityLayerRenderer.md)** - Entity-specific performance metrics
- **[UIController API Documentation](UIController.md)** - UI performance monitoring integration