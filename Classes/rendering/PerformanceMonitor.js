/**
 * PerformanceMonitor - Centralized performance tracking and debug display
 * Provides comprehensive performance analysis for the rendering system
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Default thresholds exported for reuse
const DEFAULT_PERFORMANCE_THRESHOLDS = {
    goodAvgFPS: 55,
    fairAvgFPS: 30,
    poorAvgFrameTime: 33, // ms
    worstFrameTime: 50, // ms
    memoryGrowthBytes: 50 * 1024 * 1024, // 50MB
    memoryIncreaseRateBytesPerSec: 1024 * 1024 // 1MB/sec
};

class PerformanceMonitor {
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
            entityTypes: {},
            lastUpdate: 0
        };

        // Performance metrics
        this.metrics = {
            fps: 60,
            avgFPS: 60,
            minFPS: 60,
            maxFPS: 60,
            avgFrameTime: 16.67,
            worstFrameTime: 0,
            performanceLevel: 'GOOD' // GOOD, FAIR, POOR
        };

        // Thresholds used for warnings and performance level decisions
        // Merge defaults with any environment-provided thresholds and then any constructor config overrides
        // Priority: DEFAULT < ENV (PERFORMANCE_THRESHOLDS) < constructor config
        let envThresholds = {};
        try {
            if (typeof process !== 'undefined' && process.env && process.env.PERFORMANCE_THRESHOLDS) {
                envThresholds = JSON.parse(process.env.PERFORMANCE_THRESHOLDS);
            }
        } catch (e) {
            // Don't throw in production; warn and continue with defaults
            console.warn('PerformanceMonitor: failed to parse PERFORMANCE_THRESHOLDS env var; using defaults. Error:', e && e.message);
            envThresholds = {};
        }

        this.thresholds = Object.assign({}, DEFAULT_PERFORMANCE_THRESHOLDS, envThresholds || {}, config.thresholds || {});

        // Debug display settings
        this.debugDisplay = {
            enabled: false,
            position: { x: 10, y: 10 },
            width: 280,
            height: 200,
            backgroundColor: [0, 0, 0, 180],
            textColor: [255, 255, 255],
            fontSize: 12
        };

        // Memory tracking (if available)
        this.memoryTracking = {
            enabled: !!performance.memory,
            baseline: 0,
            current: 0,
            peak: 0
        };

        if (this.memoryTracking.enabled) {
            this.memoryTracking.baseline = performance.memory.usedJSHeapSize;
        }
    }

    /**
     * Start frame timing - call at beginning of each frame
     */
    startFrame() {
        this.frameData.currentFrameStart = performance.now();
        
        // Calculate frame time from previous frame
        if (this.frameData.lastFrameStart > 0) {
            this.frameData.frameTime = this.frameData.currentFrameStart - this.frameData.lastFrameStart;
            this.updateFrameHistory();
        }

        // Reset layer timing for new frame
        this.layerTiming.currentLayers = {};
        this.layerTiming.activeLayer = null;

        // Update memory tracking
        if (this.memoryTracking.enabled) {
            this.memoryTracking.current = performance.memory.usedJSHeapSize;
            if (this.memoryTracking.current > this.memoryTracking.peak) {
                this.memoryTracking.peak = this.memoryTracking.current;
            }
        }
    }

    /**
     * End frame timing - call at end of each frame
     */
    endFrame() {
        this.frameData.lastFrameStart = this.frameData.currentFrameStart;
        this.frameData.frameCount++;
        
        // Update performance metrics every 10 frames
        if (this.frameData.frameCount % 10 === 0) {
            this.updatePerformanceMetrics();
        }
    }

    /**
     * Start timing a specific layer
     * @param {string} layerName - Name of the layer being rendered
     */
    startLayer(layerName) {
        this.layerTiming.activeLayer = layerName;
        this.layerTiming.layerStart = performance.now();
    }

    /**
     * End timing for the current layer
     * @param {string} layerName - Name of the layer (for validation)
     */
    endLayer(layerName) {
        if (this.layerTiming.activeLayer === layerName) {
            const layerTime = performance.now() - this.layerTiming.layerStart;
            this.layerTiming.currentLayers[layerName] = layerTime;
            
            // Update layer history
            if (!this.layerTiming.layerHistory[layerName]) {
                this.layerTiming.layerHistory[layerName] = [];
            }
            this.layerTiming.layerHistory[layerName].push(layerTime);
            
            // Keep only last 30 measurements
            if (this.layerTiming.layerHistory[layerName].length > 30) {
                this.layerTiming.layerHistory[layerName].shift();
            }
            
            this.layerTiming.activeLayer = null;
        }
    }

    /**
     * Record entity statistics for this frame
     * @param {number} total - Total entities in scene
     * @param {number} rendered - Entities actually rendered
     * @param {number} culled - Entities culled by frustum/other
     * @param {Object} typeBreakdown - Entity count by type
     */
    recordEntityStats(total, rendered, culled, typeBreakdown = {}) {
        this.entityStats.totalEntities = total;
        this.entityStats.renderedEntities = rendered;
        this.entityStats.culledEntities = culled;
        this.entityStats.entityTypes = { ...typeBreakdown };
        this.entityStats.lastUpdate = Date.now();
    }

    /**
     * Update frame history and calculate rolling averages
     * @private
     */
    updateFrameHistory() {
        // Add current frame time to history
        this.frameData.frameHistory[this.frameData.historyIndex] = this.frameData.frameTime;
        this.frameData.historyIndex = (this.frameData.historyIndex + 1) % this.frameData.frameHistory.length;
    }

    /**
     * Update performance metrics based on recent frame data
     * @private
     */
    updatePerformanceMetrics() {
        // Calculate current FPS
        this.metrics.fps = 1000 / this.frameData.frameTime;
        
        // Calculate average FPS from frame history
        const avgFrameTime = this.frameData.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameData.frameHistory.length;
        this.metrics.avgFPS = 1000 / avgFrameTime;
        this.metrics.avgFrameTime = avgFrameTime;
        
        // Find min/max FPS
        const frameRates = this.frameData.frameHistory.map(time => 1000 / time);
        this.metrics.minFPS = Math.min(...frameRates);
        this.metrics.maxFPS = Math.max(...frameRates);
        this.metrics.worstFrameTime = Math.max(...this.frameData.frameHistory);
        
        // Determine performance level
        if (this.metrics.avgFPS >= this.thresholds.goodAvgFPS) {
            this.metrics.performanceLevel = 'GOOD';
        } else if (this.metrics.avgFPS >= this.thresholds.fairAvgFPS) {
            this.metrics.performanceLevel = 'FAIR';
        } else {
            this.metrics.performanceLevel = 'POOR';
        }
    }

    /**
     * Get comprehensive frame statistics
     * @returns {Object} Current performance statistics
     */
    getFrameStats() {
        return {
            // Frame metrics
            fps: Math.round(this.metrics.fps * 10) / 10,
            avgFPS: Math.round(this.metrics.avgFPS * 10) / 10,
            minFPS: Math.round(this.metrics.minFPS * 10) / 10,
            maxFPS: Math.round(this.metrics.maxFPS * 10) / 10,
            
            // Timing
            frameTime: Math.round(this.frameData.frameTime * 100) / 100,
            avgFrameTime: Math.round(this.metrics.avgFrameTime * 100) / 100,
            worstFrameTime: Math.round(this.metrics.worstFrameTime * 100) / 100,
            
            // Layer breakdown
            layerTimes: { ...this.layerTiming.currentLayers },
            
            // Entity stats
            entityStats: { ...this.entityStats },
            
            // Performance level
            performanceLevel: this.metrics.performanceLevel,
            
            // Memory (if available)
            memory: this.memoryTracking.enabled ? {
                current: Math.round(this.memoryTracking.current / 1024 / 1024 * 10) / 10, // MB
                peak: Math.round(this.memoryTracking.peak / 1024 / 1024 * 10) / 10, // MB
                baseline: Math.round(this.memoryTracking.baseline / 1024 / 1024 * 10) / 10 // MB
            } : null
        };
    }

    /**
     * Get layer timing averages
     * @param {string} layerName - Name of layer
     * @returns {Object} Layer timing statistics
     */
    getLayerStats(layerName) {
        const history = this.layerTiming.layerHistory[layerName];
        if (!history || history.length === 0) {
            return { avg: 0, min: 0, max: 0, current: 0 };
        }

        const avg = history.reduce((sum, time) => sum + time, 0) / history.length;
        const min = Math.min(...history);
        const max = Math.max(...history);
        const current = this.layerTiming.currentLayers[layerName] || 0;

        return {
            avg: Math.round(avg * 100) / 100,
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
            current: Math.round(current * 100) / 100
        };
    }

    /**
     * Check if performance is poor
     * @returns {boolean} True if performance is below acceptable thresholds
     */
    isPerformancePoor() {
    return this.metrics.avgFPS < this.thresholds.fairAvgFPS || this.metrics.avgFrameTime > this.thresholds.poorAvgFrameTime;
    }

    /**
     * Get performance warnings
     * @returns {Array} Array of warning messages
     */
    getPerformanceWarnings() {
        const warnings = [];

        if (this.metrics.avgFPS < this.thresholds.fairAvgFPS) {
            warnings.push('Low FPS: Consider reducing entity count or effects');
        }

        if (this.metrics.worstFrameTime > this.thresholds.worstFrameTime) {
            warnings.push('Frame spikes detected: Check for performance bottlenecks');
        }

        const cullingEfficiency = this.entityStats.totalEntities > 0 ? 
            (this.entityStats.culledEntities / this.entityStats.totalEntities) * 100 : 0;
        
        if (cullingEfficiency < 10 && this.entityStats.totalEntities > 100) {
            warnings.push('Low culling efficiency: Many off-screen entities being rendered');
        }

        if (this.memoryTracking.enabled) {
            const memoryGrowth = this.memoryTracking.current - this.memoryTracking.baseline;
            if (memoryGrowth > this.thresholds.memoryGrowthBytes) {
                warnings.push('Memory usage increasing: Possible memory leak');
            }
        }

        return warnings;
    }

    /**
     * Enable/disable debug display
     * @param {boolean} enabled - Whether to show debug overlay
     */
    setDebugDisplay(enabled) {
        this.debugDisplay.enabled = enabled;
    }

    /**
     * Render debug performance overlay
     * Requires p5.js functions to be available
     */
    renderDebugOverlay() {
        if (!this.debugDisplay.enabled) return;

        // Render overlay directly - safety checks handled at startup
        this._renderOverlay();
    }

    /**
     * Internal method to render the overlay
     * @private
     */
    _renderOverlay() {
        const pos = this.debugDisplay.position;
        const stats = this.getFrameStats();

        // Background
        fill(...this.debugDisplay.backgroundColor);
        noStroke();
        rect(pos.x, pos.y, this.debugDisplay.width, this.debugDisplay.height);

        // Text settings
        fill(...this.debugDisplay.textColor);
        textAlign(LEFT, TOP);
        textSize(this.debugDisplay.fontSize);

        let yOffset = pos.y + 10;
        const lineHeight = this.debugDisplay.fontSize + 2;

        // Performance header
        text('PERFORMANCE MONITOR', pos.x + 10, yOffset);
        yOffset += lineHeight * 1.5;

        // FPS data
        text(`FPS: ${stats.fps} (avg: ${stats.avgFPS}, min: ${stats.minFPS})`, pos.x + 10, yOffset);
        yOffset += lineHeight;

        // Frame timing
        text(`Frame Time: ${stats.frameTime}ms (avg: ${stats.avgFrameTime}ms)`, pos.x + 10, yOffset);
        yOffset += lineHeight;

        // Performance level with color coding
        const levelColor = this._getPerformanceLevelColor(stats.performanceLevel);
        fill(...levelColor);
        text(`Performance: ${stats.performanceLevel}`, pos.x + 10, yOffset);
        fill(...this.debugDisplay.textColor);
        yOffset += lineHeight * 1.2;

        // Layer breakdown
        text('Layer Times:', pos.x + 10, yOffset);
        yOffset += lineHeight;

        Object.entries(stats.layerTimes).forEach(([layer, time]) => {
            const percentage = stats.frameTime > 0 ? ((time / stats.frameTime) * 100).toFixed(1) : 0;
            text(`├─ ${layer}: ${time.toFixed(1)}ms (${percentage}%)`, pos.x + 15, yOffset);
            yOffset += lineHeight;
        });

        // Entity stats
        if (stats.entityStats.totalEntities > 0) {
            yOffset += lineHeight * 0.3;
            text(`Entities: ${stats.entityStats.totalEntities} total, ${stats.entityStats.renderedEntities} rendered`, pos.x + 10, yOffset);
            yOffset += lineHeight;

            const cullingEff = ((stats.entityStats.culledEntities / stats.entityStats.totalEntities) * 100).toFixed(1);
            text(`Culling: ${cullingEff}% efficiency`, pos.x + 10, yOffset);
        }

        // Memory info (if available)
        if (stats.memory) {
            yOffset += lineHeight * 0.5;
            text(`Memory: ${stats.memory.current}MB (peak: ${stats.memory.peak}MB)`, pos.x + 10, yOffset);
        }
    }

    /**
     * Get color for performance level
     * @param {string} level - Performance level
     * @returns {Array} RGB color array
     * @private
     */
    _getPerformanceLevelColor(level) {
        switch (level) {
            case 'GOOD': return [0, 255, 0]; // Green
            case 'FAIR': return [255, 255, 0]; // Yellow
            case 'POOR': return [255, 0, 0]; // Red
            default: return [255, 255, 255]; // White
        }
    }

    /**
     * Start layer timing
     * @param {string} layerName - Name of the layer to time
     */
    startLayerTiming(layerName) {
        this.layerTiming.activeLayer = layerName;
        this.layerTiming.layerStart = performance.now();
    }

    /**
     * End layer timing
     * @param {string} layerName - Name of the layer to end timing for
     */
    endLayerTiming(layerName) {
        if (this.layerTiming.activeLayer === layerName && this.layerTiming.layerStart > 0) {
            const duration = performance.now() - this.layerTiming.layerStart;
            
            if (!this.layerTiming.layerHistory[layerName]) {
                this.layerTiming.layerHistory[layerName] = [];
            }
            
            this.layerTiming.layerHistory[layerName].push(duration);
            
            // Keep only last 60 measurements per layer
            if (this.layerTiming.layerHistory[layerName].length > 60) {
                this.layerTiming.layerHistory[layerName].shift();
            }
            
            this.layerTiming.activeLayer = null;
            this.layerTiming.layerStart = 0;
            
            return duration;
        }
        return 0;
    }

    /**
     * Get entity statistics
     * @returns {Object} Current entity statistics
     */
    getEntityStats() {
        return {
            total: this.entityStats.totalEntities,
            rendered: this.entityStats.renderedEntities,
            culled: this.entityStats.culledEntities,
            cullingEfficiency: this.entityStats.totalEntities > 0 ? 
                (this.entityStats.culledEntities / this.entityStats.totalEntities) * 100 : 0,
            entityTypes: { ...this.entityStats.entityTypes },
            lastUpdate: this.entityStats.lastUpdate
        };
    }

    /**
     * Update memory tracking
     */
    updateMemoryTracking() {
        if (this.memoryTracking.enabled && performance.memory) {
            const currentMemory = performance.memory.usedJSHeapSize;
            this.memoryTracking.current = currentMemory;
            
            if (currentMemory > this.memoryTracking.peak) {
                this.memoryTracking.peak = currentMemory;
            }
            
            // Track memory increase rate
            const timeDiff = Date.now() - this.memoryTracking.lastUpdate;
            if (timeDiff > 1000) { // Update every second
                const memoryDiff = currentMemory - this.memoryTracking.baseline;
                this.memoryTracking.increaseRate = memoryDiff / (timeDiff / 1000); // bytes per second
                this.memoryTracking.lastUpdate = Date.now();
            }
            
            // Detect potential memory leaks
            if (this.memoryTracking.increaseRate > 1024 * 1024) { // More than 1MB/sec increase
                console.warn('Potential memory leak detected: Memory increasing rapidly');
            }
        }
        
        return this.getMemoryInfo();
    }

    /**
     * Get memory information
     * @returns {Object} Memory usage data
     */
    getMemoryInfo() {
        if (this.memoryTracking.enabled && performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                peak: this.memoryTracking.peak,
                baseline: this.memoryTracking.baseline,
                increaseRate: this.memoryTracking.increaseRate
            };
        }
        
        return null;
    }

    /**
     * Alias for getMemoryInfo (for test compatibility)
     * @returns {Object} Memory usage data
     */
    getMemoryStats() {
        return this.getMemoryInfo();
    }

    /**
     * Set debug position for overlay
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setDebugPosition(x, y) {
        this.debugDisplay.position.x = x;
        this.debugDisplay.position.y = y;
    }

    /**
     * Reset all performance data
     */
    reset() {
        this.frameData.frameCount = 0;
        this.frameData.frameHistory.fill(16.67);
        this.frameData.historyIndex = 0;
        this.layerTiming.layerHistory = {};
        this.entityStats = {
            totalEntities: 0,
            renderedEntities: 0,
            culledEntities: 0,
            entityTypes: {},
            lastUpdate: 0
        };

        if (this.memoryTracking.enabled) {
            this.memoryTracking.baseline = performance.memory.usedJSHeapSize;
            this.memoryTracking.peak = this.memoryTracking.baseline;
        }

        console.log('Performance monitor reset');
    }

    /**
     * Export performance data for analysis
     * @returns {Object} Complete performance dataset
     */
    exportData() {
        return {
            timestamp: Date.now(),
            frameData: { ...this.frameData },
            layerTiming: { ...this.layerTiming },
            entityStats: { ...this.entityStats },
            metrics: { ...this.metrics },
            memoryTracking: { ...this.memoryTracking },
            frameHistory: [...this.frameData.frameHistory]
        };
    }
}

// Create global instance
const g_performanceMonitor = new PerformanceMonitor();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, g_performanceMonitor };
}