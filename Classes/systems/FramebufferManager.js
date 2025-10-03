/**
 * @fileoverview FramebufferManager - Advanced Framebuffer Optimization System
 * Implements dynamic, layer-based rendering optimization with selective redraw
 * Phase 4 implementation of the Rendering System Architecture Plan
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Framebuffer optimization system for efficient rendering
 * Caches entity groups in off-screen buffers and selectively redraws
 */
class FramebufferManager {
  constructor() {
    // Framebuffer storage
    this.framebuffers = new Map();
    this.compositeBuffer = null;
    this.mainCanvas = null;

    // Change tracking for selective updates
    this.changeTracking = new Map();
    this.lastUpdateTimes = new Map();

    // Configuration
    this.config = {
      enabled: true,
      enableChangeTracking: true,
      enableCompositeBuffer: true,
      enableRegionalUpdates: false, // Future feature
      maxBufferAge: 5000, // Maximum time before forced refresh (ms)
      qualityReduction: false, // Reduce quality for cached buffers
      debugMode: false
    };

    // Performance tracking
    this.stats = {
      totalFramebuffers: 0,
      activeFramebuffers: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      lastFrameSavings: 0,
      totalTimeSaved: 0
    };

    // Buffer configurations for different entity groups
    this.bufferConfigs = new Map([
      ['TERRAIN', { 
        refreshRate: 'static', 
        priority: 1, 
        size: { width: 0, height: 0 }, // Will be set to canvas size
        alpha: false 
      }],
      ['RESOURCES', { 
        refreshRate: 'low', 
        priority: 2, 
        size: { width: 0, height: 0 }, 
        alpha: true 
      }],
      ['ANTS', { 
        refreshRate: 'high', 
        priority: 3, 
        size: { width: 0, height: 0 }, 
        alpha: true 
      }],
      ['BUILDINGS', { 
        refreshRate: 'medium', 
        priority: 2, 
        size: { width: 0, height: 0 }, 
        alpha: true 
      }],
      ['EFFECTS', { 
        refreshRate: 'always', 
        priority: 4, 
        size: { width: 0, height: 0 }, 
        alpha: true 
      }],
      ['UI', { 
        refreshRate: 'medium', 
        priority: 5, 
        size: { width: 0, height: 0 }, 
        alpha: true 
      }]
    ]);

    // Adaptive refresh manager
    this.adaptiveManager = new AdaptiveFramebufferManager();
  }

  /**
   * Initialize the framebuffer system
   * 
   * @param {number} canvasWidth - Canvas width
   * @param {number} canvasHeight - Canvas height
   * @param {Object} options - Configuration options
   */
  initialize(canvasWidth, canvasHeight, options = {}) {
    if (!this.config.enabled) return false;

    // Store canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Update configuration
    this.config = { ...this.config, ...options };

    // Update buffer sizes
    for (const [layerName, config] of this.bufferConfigs) {
      config.size.width = canvasWidth;
      config.size.height = canvasHeight;
    }

    // Create main composite buffer if enabled
    if (this.config.enableCompositeBuffer) {
      this.compositeBuffer = this.createFramebuffer('COMPOSITE', canvasWidth, canvasHeight, false);
    }

    // Initialize change tracking
    for (const layerName of this.bufferConfigs.keys()) {
      this.changeTracking.set(layerName, {
        isDirty: true,
        lastChangeTime: Date.now(),
        changeCount: 0,
        forceRefresh: false
      });
      this.lastUpdateTimes.set(layerName, 0);
    }

    console.log(`FramebufferManager initialized: ${canvasWidth}x${canvasHeight}`);
    return true;
  }

  /**
   * Create a framebuffer for a specific layer
   * 
   * @param {string} layerName - Name of the layer
   * @param {number} width - Buffer width
   * @param {number} height - Buffer height
   * @param {boolean} hasAlpha - Whether buffer needs alpha channel
   * @returns {Object|null} Created framebuffer or null if failed
   */
  createFramebuffer(layerName, width, height, hasAlpha = true) {
    try {
      // Check if p5.js createGraphics is available
      if (typeof createGraphics !== 'function') {
        console.warn('FramebufferManager: createGraphics not available, framebuffers disabled');
        this.config.enabled = false;
        return null;
      }

      // Create p5.js graphics buffer
      const buffer = createGraphics(width, height);
      
      // Configure buffer
      if (buffer) {
        // Set up buffer properties
        buffer._layerName = layerName;
        buffer._hasAlpha = hasAlpha;
        buffer._lastUpdate = 0;
        buffer._isDirty = true;

        // Store buffer
        this.framebuffers.set(layerName, buffer);
        this.stats.totalFramebuffers++;
        this.stats.activeFramebuffers++;

        // Estimate memory usage (rough calculation)
        const memoryEstimate = width * height * (hasAlpha ? 4 : 3); // RGBA or RGB
        this.stats.memoryUsage += memoryEstimate;

        if (this.config.debugMode) {
          console.log(`Created framebuffer for ${layerName}: ${width}x${height}, alpha: ${hasAlpha}`);
        }

        return buffer;
      }
    } catch (error) {
      console.error(`Failed to create framebuffer for ${layerName}:`, error);
    }

    return null;
  }

  /**
   * Get framebuffer for a specific layer, creating if necessary
   * 
   * @param {string} layerName - Name of the layer
   * @returns {Object|null} Framebuffer or null if not available
   */
  getFramebuffer(layerName) {
    if (!this.config.enabled) return null;

    let buffer = this.framebuffers.get(layerName);
    
    if (!buffer) {
      const config = this.bufferConfigs.get(layerName);
      if (config) {
        buffer = this.createFramebuffer(
          layerName, 
          config.size.width || this.canvasWidth, 
          config.size.height || this.canvasHeight, 
          config.alpha
        );
      }
    }

    return buffer;
  }

  /**
   * Check if a layer needs to be redrawn
   * 
   * @param {string} layerName - Name of the layer to check
   * @returns {boolean} True if layer needs redraw
   */
  shouldRedrawLayer(layerName) {
    if (!this.config.enabled || !this.config.enableChangeTracking) {
      return true; // Always redraw if optimization disabled
    }

    const tracking = this.changeTracking.get(layerName);
    if (!tracking) return true;

    const config = this.bufferConfigs.get(layerName);
    if (!config) return true;

    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(layerName) || 0;

    // Check for forced refresh
    if (tracking.forceRefresh) {
      return true;
    }

    // Check maximum buffer age
    if (now - lastUpdate > this.config.maxBufferAge) {
      return true;
    }

    // Use adaptive refresh strategy
    return this.adaptiveManager.shouldRefresh(layerName, config.refreshRate, tracking, now);
  }

  /**
   * Mark a layer as dirty (needs redraw)
   * 
   * @param {string} layerName - Name of the layer
   * @param {string} reason - Reason for marking dirty (optional)
   */
  markLayerDirty(layerName, reason = 'unknown') {
    if (!this.config.enableChangeTracking) return;

    const tracking = this.changeTracking.get(layerName);
    if (tracking) {
      tracking.isDirty = true;
      tracking.lastChangeTime = Date.now();
      tracking.changeCount++;
      
      if (this.config.debugMode) {
        console.log(`Layer ${layerName} marked dirty: ${reason}`);
      }
    }
  }

  /**
   * Mark a layer as clean (up to date)
   * 
   * @param {string} layerName - Name of the layer
   */
  markLayerClean(layerName) {
    if (!this.config.enableChangeTracking) return;

    const tracking = this.changeTracking.get(layerName);
    if (tracking) {
      tracking.isDirty = false;
      tracking.forceRefresh = false;
      this.lastUpdateTimes.set(layerName, Date.now());
    }
  }

  /**
   * Render entities to a specific framebuffer
   * 
   * @param {string} layerName - Name of the layer
   * @param {Function} renderFunction - Function to render the layer
   * @param {Object} renderContext - Context for rendering
   * @returns {boolean} True if rendered to buffer, false if skipped
   */
  renderToFramebuffer(layerName, renderFunction, renderContext = {}) {
    if (!this.config.enabled) {
      // Render directly if framebuffers disabled
      renderFunction(renderContext);
      return false;
    }

    const startTime = performance.now();
    const needsRedraw = this.shouldRedrawLayer(layerName);

    if (!needsRedraw) {
      // Cache hit - no need to redraw
      this.stats.cacheHits++;
      return false;
    }

    // Cache miss - need to redraw
    this.stats.cacheMisses++;
    
    const buffer = this.getFramebuffer(layerName);
    if (!buffer) {
      // Fallback to direct rendering
      renderFunction(renderContext);
      return false;
    }

    // Render to framebuffer
    buffer.clear();
    
    // Set up rendering context for buffer
    const originalContext = this.setupBufferContext(buffer);
    
    try {
      // Call the render function with buffer as target
      renderFunction({ ...renderContext, buffer: buffer, target: buffer });
      
      // Mark layer as clean
      this.markLayerClean(layerName);
      
      const renderTime = performance.now() - startTime;
      this.adaptiveManager.recordRenderTime(layerName, renderTime);
      
      if (this.config.debugMode) {
        console.log(`Rendered ${layerName} to framebuffer in ${renderTime.toFixed(2)}ms`);
      }
      
    } finally {
      // Restore original context
      this.restoreContext(originalContext);
    }

    return true;
  }

  /**
   * Composite all framebuffers to the main canvas
   * 
   * @param {Array<string>} layerOrder - Order of layers to composite
   */
  compositeFramebuffers(layerOrder) {
    if (!this.config.enabled) return;

    const startTime = performance.now();

    // Use composite buffer if available
    const target = this.compositeBuffer || null;
    
    if (target) {
      target.clear();
    }

    // Composite layers in order
    for (const layerName of layerOrder) {
      const buffer = this.framebuffers.get(layerName);
      if (buffer && buffer._lastUpdate > 0) {
        this.blitFramebuffer(buffer, target);
      }
    }

    // Blit composite to main canvas if using composite buffer
    if (this.compositeBuffer && typeof image === 'function') {
      image(this.compositeBuffer, 0, 0);
    }

    const compositeTime = performance.now() - startTime;
    this.stats.lastFrameSavings = Math.max(0, this.getEstimatedDirectRenderTime() - compositeTime);
    this.stats.totalTimeSaved += this.stats.lastFrameSavings;
  }

  /**
   * Blit one framebuffer to another (or main canvas)
   * 
   * @param {Object} sourceBuffer - Source framebuffer
   * @param {Object} targetBuffer - Target framebuffer (null for main canvas)
   */
  blitFramebuffer(sourceBuffer, targetBuffer = null) {
    if (!sourceBuffer) return;

    try {
      if (targetBuffer) {
        // Blit to target buffer
        targetBuffer.image(sourceBuffer, 0, 0);
      } else if (typeof image === 'function') {
        // Blit to main canvas
        image(sourceBuffer, 0, 0);
      }
    } catch (error) {
      console.error('Error blitting framebuffer:', error);
    }
  }

  /**
   * Set up rendering context for buffer rendering
   * 
   * @param {Object} buffer - Framebuffer to render to
   * @returns {Object} Original context to restore later
   */
  setupBufferContext(buffer) {
    // Store original p5.js context
    const originalContext = {
      // This would store current p5.js state if needed
      // For now, p5.js graphics buffers handle their own context
    };

    return originalContext;
  }

  /**
   * Restore original rendering context
   * 
   * @param {Object} originalContext - Context to restore
   */
  restoreContext(originalContext) {
    // Restore p5.js context if needed
    // For now, no restoration needed as graphics buffers are self-contained
  }

  /**
   * Estimate direct render time for performance calculations
   * 
   * @returns {number} Estimated render time in milliseconds
   */
  getEstimatedDirectRenderTime() {
    // This would estimate time based on entity counts and complexity
    // For now, return a conservative estimate
    return 10; // 10ms baseline
  }

  /**
   * Force refresh of all framebuffers
   */
  forceRefreshAll() {
    for (const layerName of this.changeTracking.keys()) {
      const tracking = this.changeTracking.get(layerName);
      if (tracking) {
        tracking.forceRefresh = true;
        tracking.isDirty = true;
      }
    }
  }

  /**
   * Force refresh of a specific layer
   * 
   * @param {string} layerName - Name of the layer to refresh
   */
  forceRefreshLayer(layerName) {
    const tracking = this.changeTracking.get(layerName);
    if (tracking) {
      tracking.forceRefresh = true;
      tracking.isDirty = true;
    }
  }

  /**
   * Clear and destroy a framebuffer
   * 
   * @param {string} layerName - Name of the layer to destroy
   */
  destroyFramebuffer(layerName) {
    const buffer = this.framebuffers.get(layerName);
    if (buffer) {
      // Clean up buffer if possible
      if (typeof buffer.remove === 'function') {
        buffer.remove();
      }
      
      this.framebuffers.delete(layerName);
      this.stats.activeFramebuffers--;
      
      // Estimate memory freed
      const config = this.bufferConfigs.get(layerName);
      if (config) {
        const memoryFreed = config.size.width * config.size.height * (config.alpha ? 4 : 3);
        this.stats.memoryUsage -= memoryFreed;
      }
    }
  }

  /**
   * Clear all framebuffers and reset system
   */
  cleanup() {
    // Destroy all framebuffers
    for (const layerName of this.framebuffers.keys()) {
      this.destroyFramebuffer(layerName);
    }

    // Clean up composite buffer
    if (this.compositeBuffer && typeof this.compositeBuffer.remove === 'function') {
      this.compositeBuffer.remove();
    }
    this.compositeBuffer = null;

    // Reset tracking
    this.changeTracking.clear();
    this.lastUpdateTimes.clear();

    // Reset stats
    this.stats = {
      totalFramebuffers: 0,
      activeFramebuffers: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      lastFrameSavings: 0,
      totalTimeSaved: 0
    };

    console.log('FramebufferManager cleaned up');
  }

  /**
   * Get framebuffer statistics
   * 
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0 ? 
      (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100 : 0;

    return {
      ...this.stats,
      cacheHitRate: cacheHitRate,
      memoryUsageMB: this.stats.memoryUsage / (1024 * 1024),
      avgFrameSavings: this.stats.totalTimeSaved / Math.max(1, this.stats.cacheMisses),
      isEnabled: this.config.enabled
    };
  }

  /**
   * Update configuration
   * 
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };

    // If framebuffers were disabled, clean up
    if (wasEnabled && !this.config.enabled) {
      this.cleanup();
    }
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    return {
      config: { ...this.config },
      statistics: this.getStatistics(),
      bufferConfigs: Object.fromEntries(this.bufferConfigs),
      changeTracking: Object.fromEntries(this.changeTracking),
      adaptiveManager: this.adaptiveManager.getDiagnostics()
    };
  }
}

/**
 * Adaptive refresh rate manager
 * Determines optimal refresh strategies based on layer activity
 */
class AdaptiveFramebufferManager {
  constructor() {
    this.layerMetrics = new Map();
    this.refreshStrategies = new Map();
  }

  /**
   * Determine if a layer should refresh based on adaptive strategy
   * 
   * @param {string} layerName - Name of the layer
   * @param {string} baseRefreshRate - Base refresh rate setting
   * @param {Object} tracking - Change tracking data
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} True if should refresh
   */
  shouldRefresh(layerName, baseRefreshRate, tracking, currentTime) {
    const metrics = this.getLayerMetrics(layerName);
    const strategy = this.getRefreshStrategy(layerName, baseRefreshRate);

    switch (strategy.type) {
      case 'static':
        return tracking.isDirty;
      
      case 'time-based':
        return currentTime - tracking.lastChangeTime > strategy.interval;
      
      case 'activity-based':
        const activityThreshold = strategy.threshold || 5;
        return tracking.changeCount > activityThreshold;
      
      case 'adaptive':
        return this.adaptiveRefreshLogic(layerName, tracking, currentTime, metrics);
      
      case 'always':
      default:
        return true;
    }
  }

  /**
   * Get or create metrics for a layer
   * 
   * @param {string} layerName - Name of the layer
   * @returns {Object} Layer metrics
   */
  getLayerMetrics(layerName) {
    if (!this.layerMetrics.has(layerName)) {
      this.layerMetrics.set(layerName, {
        avgRenderTime: 0,
        renderCount: 0,
        totalRenderTime: 0,
        lastRenderTime: 0,
        activityLevel: 'low'
      });
    }
    return this.layerMetrics.get(layerName);
  }

  /**
   * Get refresh strategy for a layer
   * 
   * @param {string} layerName - Name of the layer
   * @param {string} baseRefreshRate - Base refresh rate
   * @returns {Object} Refresh strategy
   */
  getRefreshStrategy(layerName, baseRefreshRate) {
    if (!this.refreshStrategies.has(layerName)) {
      let strategy;
      
      switch (baseRefreshRate) {
        case 'static':
          strategy = { type: 'static' };
          break;
        case 'low':
          strategy = { type: 'time-based', interval: 500 }; // 500ms
          break;
        case 'medium':
          strategy = { type: 'time-based', interval: 167 }; // ~6fps
          break;
        case 'high':
          strategy = { type: 'adaptive' };
          break;
        case 'always':
          strategy = { type: 'always' };
          break;
        default:
          strategy = { type: 'adaptive' };
      }
      
      this.refreshStrategies.set(layerName, strategy);
    }
    
    return this.refreshStrategies.get(layerName);
  }

  /**
   * Adaptive refresh logic based on layer metrics
   * 
   * @param {string} layerName - Name of the layer
   * @param {Object} tracking - Change tracking data
   * @param {number} currentTime - Current timestamp
   * @param {Object} metrics - Layer performance metrics
   * @returns {boolean} True if should refresh
   */
  adaptiveRefreshLogic(layerName, tracking, currentTime, metrics) {
    const timeSinceLastChange = currentTime - tracking.lastChangeTime;
    
    // High activity - refresh more frequently
    if (metrics.activityLevel === 'high') {
      return timeSinceLastChange > 50; // ~20fps
    }
    
    // Medium activity - moderate refresh rate
    if (metrics.activityLevel === 'medium') {
      return timeSinceLastChange > 167; // ~6fps
    }
    
    // Low activity - refresh less frequently
    return timeSinceLastChange > 500; // 2fps
  }

  /**
   * Record render time for a layer
   * 
   * @param {string} layerName - Name of the layer
   * @param {number} renderTime - Time taken to render in milliseconds
   */
  recordRenderTime(layerName, renderTime) {
    const metrics = this.getLayerMetrics(layerName);
    
    metrics.renderCount++;
    metrics.totalRenderTime += renderTime;
    metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount;
    metrics.lastRenderTime = renderTime;

    // Update activity level based on render frequency
    const now = Date.now();
    if (metrics.lastActivityCheck) {
      const timeDiff = now - metrics.lastActivityCheck;
      const renderFreq = metrics.renderCount / (timeDiff / 1000); // renders per second
      
      if (renderFreq > 15) {
        metrics.activityLevel = 'high';
      } else if (renderFreq > 5) {
        metrics.activityLevel = 'medium';
      } else {
        metrics.activityLevel = 'low';
      }
    }
    
    metrics.lastActivityCheck = now;
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    return {
      layerMetrics: Object.fromEntries(this.layerMetrics),
      refreshStrategies: Object.fromEntries(this.refreshStrategies)
    };
  }
}

// Create global instance
const FramebufferManager = new FramebufferManager();

// Export for browser environments
if (typeof window !== 'undefined') {
  window.FramebufferManager = FramebufferManager;
  window.AdaptiveFramebufferManager = AdaptiveFramebufferManager;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FramebufferManager, AdaptiveFramebufferManager };
}