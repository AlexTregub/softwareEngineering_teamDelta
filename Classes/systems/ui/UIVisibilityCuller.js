/**
 * @fileoverview UIVisibilityCuller - Viewport-based Visibility Culling System
 * Optimizes rendering by only processing UI elements visible in the current viewport
 * Part of the Universal Button Group System performance optimizations
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Viewport management for visibility culling
 */
class Viewport {
  /**
   * Creates a new viewport instance
   * 
   * @param {number} x - Viewport X position
   * @param {number} y - Viewport Y position
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   */
  constructor(x = 0, y = 0, width = 1200, height = 800) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Culling margins for smooth transitions
    this.margins = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    };
  }

  /**
   * Update viewport position and size
   * 
   * @param {number} x - New X position
   * @param {number} y - New Y position
   * @param {number} width - New width
   * @param {number} height - New height
   */
  update(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Set culling margins
   * 
   * @param {Object} margins - Margin values {top, right, bottom, left}
   */
  setMargins(margins) {
    this.margins = { ...this.margins, ...margins };
  }

  /**
   * Get expanded viewport bounds including culling margins
   * 
   * @returns {Object} Expanded bounds {x, y, width, height}
   */
  getExpandedBounds() {
    return {
      x: this.x - this.margins.left,
      y: this.y - this.margins.top,
      width: this.width + this.margins.left + this.margins.right,
      height: this.height + this.margins.top + this.margins.bottom
    };
  }

  /**
   * Get viewport center point
   * 
   * @returns {Object} Center point {x, y}
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  /**
   * Check if a rectangle intersects with the viewport
   * 
   * @param {Object} bounds - Rectangle bounds {x, y, width, height}
   * @param {boolean} useMargins - Whether to use expanded bounds with margins
   * @returns {boolean} True if rectangle intersects viewport
   */
  intersects(bounds, useMargins = true) {
    const viewBounds = useMargins ? this.getExpandedBounds() : this;
    
    return !(bounds.x > viewBounds.x + viewBounds.width ||
             bounds.x + bounds.width < viewBounds.x ||
             bounds.y > viewBounds.y + viewBounds.height ||
             bounds.y + bounds.height < viewBounds.y);
  }

  /**
   * Check if a rectangle is completely contained within the viewport
   * 
   * @param {Object} bounds - Rectangle bounds {x, y, width, height}
   * @param {boolean} useMargins - Whether to use expanded bounds with margins
   * @returns {boolean} True if rectangle is completely contained
   */
  contains(bounds, useMargins = false) {
    const viewBounds = useMargins ? this.getExpandedBounds() : this;
    
    return bounds.x >= viewBounds.x &&
           bounds.y >= viewBounds.y &&
           bounds.x + bounds.width <= viewBounds.x + viewBounds.width &&
           bounds.y + bounds.height <= viewBounds.y + viewBounds.height;
  }

  /**
   * Calculate distance from viewport center to a point
   * 
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @returns {number} Distance from viewport center
   */
  distanceFromCenter(x, y) {
    const center = this.getCenter();
    const dx = x - center.x;
    const dy = y - center.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Visibility culling system for UI elements
 */
class UIVisibilityCuller {
  /**
   * Creates a new visibility culler
   * 
   * @param {Object} options - Culler configuration options
   */
  constructor(options = {}) {
    this.options = {
      enableDistanceCulling: options.enableDistanceCulling !== false,
      maxRenderDistance: options.maxRenderDistance || 2000,
      enableFrustumCulling: options.enableFrustumCulling !== false,
      enableOcclusionCulling: options.enableOcclusionCulling || false,
      enableStatistics: options.enableStatistics !== false,
      debugMode: options.debugMode || false,
      ...options
    };

    // Viewport management
    this.viewport = new Viewport();
    
    // Culling results cache
    this.cullingCache = new Map();
    this.cacheValidFrames = 3; // Cache results for 3 frames
    this.currentFrame = 0;

    // Performance statistics
    this.statistics = {
      totalChecked: 0,
      visibleCount: 0,
      culledCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCheckTime: 0,
      checkTimes: []
    };

    // Occlusion tracking (if enabled)
    this.occluders = [];
  }

  /**
   * Update viewport information
   * 
   * @param {number} x - Viewport X position
   * @param {number} y - Viewport Y position
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   */
  updateViewport(x, y, width, height) {
    this.viewport.update(x, y, width, height);
    this.invalidateCache();
  }

  /**
   * Set viewport culling margins
   * 
   * @param {Object} margins - Margin values {top, right, bottom, left}
   */
  setViewportMargins(margins) {
    this.viewport.setMargins(margins);
    this.invalidateCache();
  }

  /**
   * Check if a UI element should be rendered
   * 
   * @param {Object} element - UI element with getBounds() method
   * @returns {Object} Culling result {visible, reason, distance}
   */
  isVisible(element) {
    const startTime = this.options.enableStatistics ? performance.now() : 0;
    
    if (!element || typeof element.getBounds !== 'function') {
      return { visible: false, reason: 'invalid_element', distance: Infinity };
    }

    const elementId = element.getId ? element.getId() : `element_${Date.now()}`;
    
    // Check cache first
    const cached = this.getCachedResult(elementId);
    if (cached) {
      if (this.options.enableStatistics) {
        this.statistics.cacheHits++;
      }
      return cached;
    }

    // Perform visibility check
    const result = this.performVisibilityCheck(element);
    
    // Cache the result
    this.setCachedResult(elementId, result);
    
    // Update statistics
    if (this.options.enableStatistics) {
      this.statistics.totalChecked++;
      this.statistics.cacheMisses++;
      
      if (result.visible) {
        this.statistics.visibleCount++;
      } else {
        this.statistics.culledCount++;
      }
      
      const checkTime = performance.now() - startTime;
      this.statistics.checkTimes.push(checkTime);
      
      if (this.statistics.checkTimes.length > 100) {
        this.statistics.checkTimes.shift();
      }
      
      this.statistics.averageCheckTime = 
        this.statistics.checkTimes.reduce((sum, time) => sum + time, 0) / 
        this.statistics.checkTimes.length;
    }

    return result;
  }

  /**
   * Perform the actual visibility check
   * 
   * @param {Object} element - UI element to check
   * @returns {Object} Visibility result
   */
  performVisibilityCheck(element) {
    const bounds = element.getBounds();
    
    // Basic visibility check (element is marked as visible)
    if (typeof element.isVisible === 'function' && !element.isVisible()) {
      return { visible: false, reason: 'element_hidden', distance: 0 };
    }

    // Frustum culling (viewport intersection)
    if (this.options.enableFrustumCulling) {
      if (!this.viewport.intersects(bounds)) {
        return { visible: false, reason: 'outside_viewport', distance: this.calculateDistance(bounds) };
      }
    }

    // Distance culling
    if (this.options.enableDistanceCulling) {
      const distance = this.calculateDistance(bounds);
      if (distance > this.options.maxRenderDistance) {
        return { visible: false, reason: 'too_far', distance: distance };
      }
    }

    // Occlusion culling (if enabled)
    if (this.options.enableOcclusionCulling) {
      if (this.isOccluded(bounds)) {
        return { visible: false, reason: 'occluded', distance: this.calculateDistance(bounds) };
      }
    }

    // Element is visible
    return { visible: true, reason: 'visible', distance: this.calculateDistance(bounds) };
  }

  /**
   * Calculate distance from viewport center to element
   * 
   * @param {Object} bounds - Element bounds
   * @returns {number} Distance from viewport center
   */
  calculateDistance(bounds) {
    const elementCenter = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    };
    
    return this.viewport.distanceFromCenter(elementCenter.x, elementCenter.y);
  }

  /**
   * Check if an element is occluded by other elements
   * 
   * @param {Object} bounds - Element bounds to check
   * @returns {boolean} True if element is occluded
   */
  isOccluded(bounds) {
    if (!this.options.enableOcclusionCulling) {
      return false;
    }

    // Check against known occluders
    for (const occluder of this.occluders) {
      if (this.boundsOverlap(bounds, occluder.bounds)) {
        // Element is potentially occluded
        if (occluder.opacity >= 0.9) { // Nearly opaque
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if two bounding rectangles overlap
   * 
   * @param {Object} bounds1 - First rectangle
   * @param {Object} bounds2 - Second rectangle
   * @returns {boolean} True if rectangles overlap
   */
  boundsOverlap(bounds1, bounds2) {
    return !(bounds1.x > bounds2.x + bounds2.width ||
             bounds1.x + bounds1.width < bounds2.x ||
             bounds1.y > bounds2.y + bounds2.height ||
             bounds1.y + bounds1.height < bounds2.y);
  }

  /**
   * Add an occluder element
   * 
   * @param {Object} element - Element that can occlude others
   * @param {number} opacity - Element opacity (0-1)
   */
  addOccluder(element, opacity = 1.0) {
    if (!this.options.enableOcclusionCulling) {
      return;
    }

    const bounds = element.getBounds ? element.getBounds() : element;
    this.occluders.push({
      element: element,
      bounds: bounds,
      opacity: opacity
    });
  }

  /**
   * Remove an occluder element
   * 
   * @param {Object} element - Element to remove as occluder
   */
  removeOccluder(element) {
    this.occluders = this.occluders.filter(occluder => occluder.element !== element);
  }

  /**
   * Clear all occluders
   */
  clearOccluders() {
    this.occluders = [];
  }

  /**
   * Get cached visibility result
   * 
   * @param {string} elementId - Element identifier
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(elementId) {
    const cached = this.cullingCache.get(elementId);
    
    if (cached && this.currentFrame - cached.frame < this.cacheValidFrames) {
      return cached.result;
    }
    
    return null;
  }

  /**
   * Cache a visibility result
   * 
   * @param {string} elementId - Element identifier
   * @param {Object} result - Visibility result to cache
   */
  setCachedResult(elementId, result) {
    this.cullingCache.set(elementId, {
      result: result,
      frame: this.currentFrame
    });
  }

  /**
   * Invalidate the culling cache
   */
  invalidateCache() {
    this.cullingCache.clear();
  }

  /**
   * Advance to next frame (for cache management)
   */
  nextFrame() {
    this.currentFrame++;
    
    // Clean up old cache entries periodically
    if (this.currentFrame % 60 === 0) { // Every 60 frames
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const cutoffFrame = this.currentFrame - this.cacheValidFrames;
    
    for (const [elementId, cached] of this.cullingCache) {
      if (cached.frame < cutoffFrame) {
        this.cullingCache.delete(elementId);
      }
    }
  }

  /**
   * Cull a collection of UI elements
   * 
   * @param {Array} elements - Array of UI elements to cull
   * @returns {Object} Culling results {visible, culled, statistics}
   */
  cullElements(elements) {
    const visible = [];
    const culled = [];
    const cullingResults = [];

    for (const element of elements) {
      const result = this.isVisible(element);
      cullingResults.push(result);
      
      if (result.visible) {
        visible.push(element);
      } else {
        culled.push({ element, reason: result.reason, distance: result.distance });
      }
    }

    return {
      visible: visible,
      culled: culled,
      results: cullingResults,
      statistics: {
        total: elements.length,
        visibleCount: visible.length,
        culledCount: culled.length,
        cullingRate: culled.length / elements.length
      }
    };
  }

  /**
   * Get culling statistics
   * 
   * @returns {Object} Statistics object
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cullingCache.size,
      occluderCount: this.occluders.length,
      currentFrame: this.currentFrame
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      totalChecked: 0,
      visibleCount: 0,
      culledCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageCheckTime: 0,
      checkTimes: []
    };
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      options: { ...this.options },
      viewport: {
        x: this.viewport.x,
        y: this.viewport.y,
        width: this.viewport.width,
        height: this.viewport.height,
        margins: { ...this.viewport.margins }
      },
      statistics: this.getStatistics()
    };
  }

  /**
   * Render debug visualization
   */
  renderDebug() {
    if (!this.options.debugMode) {
      return;
    }

    // Draw viewport bounds
    if (typeof stroke === 'function' && typeof noFill === 'function' && typeof rect === 'function') {
      stroke(0, 255, 0, 200); // Green viewport
      noFill();
      strokeWeight(2);
      rect(this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
      
      // Draw expanded bounds with margins
      const expanded = this.viewport.getExpandedBounds();
      stroke(0, 255, 0, 100); // Lighter green for margins
      strokeWeight(1);
      rect(expanded.x, expanded.y, expanded.width, expanded.height);
    }

    // Draw occluders
    if (typeof fill === 'function') {
      fill(255, 0, 0, 100); // Red for occluders
      noStroke();
      
      for (const occluder of this.occluders) {
        const bounds = occluder.bounds;
        rect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.UIVisibilityCuller = UIVisibilityCuller;
  window.Viewport = Viewport;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIVisibilityCuller, Viewport };
}