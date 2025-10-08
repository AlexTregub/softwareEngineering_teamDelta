/**
 * @fileoverview ButtonObjectPool - Object Pooling System for UI Performance
 * Efficiently manages button and UI object creation/destruction to minimize garbage collection
 * Part of the Universal Button Group System performance optimizations
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Generic object pool for reusing objects and reducing garbage collection
 */
class ObjectPool {
  /**
   * Creates a new object pool
   * 
   * @param {Function} createFn - Function to create new objects
   * @param {Function} resetFn - Function to reset objects before reuse
   * @param {Object} options - Pool configuration options
   */
  constructor(createFn, resetFn, options = {}) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.options = {
      initialSize: options.initialSize || 10,
      maxSize: options.maxSize || 100,
      enableGrowth: options.enableGrowth !== false,
      enableShrinking: options.enableShrinking !== false,
      shrinkThreshold: options.shrinkThreshold || 0.25,
      shrinkInterval: options.shrinkInterval || 30000,
      debugMode: options.debugMode || false,
      ...options
    };

    // Pool storage
    this.available = [];
    this.inUse = new Set();
    
    // Statistics
    this.statistics = {
      created: 0,
      acquired: 0,
      released: 0,
      peak: 0,
      currentSize: 0,
      shrinkCount: 0,
      lastShrink: 0
    };

    // Initialize pool with initial objects
    this.initialize();

    // Set up automatic shrinking if enabled
    if (this.options.enableShrinking) {
      this.setupShrinking();
    }
  }

  /**
   * Initialize the pool with initial objects
   */
  initialize() {
    for (let i = 0; i < this.options.initialSize; i++) {
      this.available.push(this.createNewObject());
    }
    this.statistics.currentSize = this.available.length;
  }

  /**
   * Create a new object using the create function
   * 
   * @returns {Object} New object instance
   */
  createNewObject() {
    const obj = this.createFn();
    this.statistics.created++;
    return obj;
  }

  /**
   * Acquire an object from the pool
   * 
   * @returns {Object} Object instance ready for use
   */
  acquire() {
    let obj;

    if (this.available.length > 0) {
      // Reuse existing object
      obj = this.available.pop();
    } else if (this.options.enableGrowth && this.getTotalSize() < this.options.maxSize) {
      // Create new object if pool can grow
      obj = this.createNewObject();
    } else {
      // Pool is full and cannot grow - create temporary object
      if (this.options.debugMode) {
        console.warn('ObjectPool: Maximum size reached, creating temporary object');
      }
      obj = this.createNewObject();
    }

    // Reset the object for use
    if (this.resetFn) {
      this.resetFn(obj);
    }

    // Track usage
    this.inUse.add(obj);
    this.statistics.acquired++;
    
    // Update peak usage
    if (this.inUse.size > this.statistics.peak) {
      this.statistics.peak = this.inUse.size;
    }

    return obj;
  }

  /**
   * Release an object back to the pool
   * 
   * @param {Object} obj - Object to release
   */
  release(obj) {
    if (!this.inUse.has(obj)) {
      if (this.options.debugMode) {
        console.warn('ObjectPool: Attempting to release object not acquired from pool');
      }
      return;
    }

    // Remove from in-use tracking
    this.inUse.delete(obj);

    // Add back to available pool if there's space
    if (this.available.length < this.options.maxSize) {
      this.available.push(obj);
    }
    // Otherwise, let the object be garbage collected

    this.statistics.released++;
  }

  /**
   * Get total pool size (available + in use)
   * 
   * @returns {number} Total pool size
   */
  getTotalSize() {
    return this.available.length + this.inUse.size;
  }

  /**
   * Get pool utilization ratio
   * 
   * @returns {number} Utilization ratio (0-1)
   */
  getUtilization() {
    const total = this.getTotalSize();
    return total > 0 ? this.inUse.size / total : 0;
  }

  /**
   * Shrink the pool if utilization is low
   */
  shrink() {
    const utilization = this.getUtilization();
    
    if (utilization < this.options.shrinkThreshold && this.available.length > this.options.initialSize) {
      const targetSize = Math.max(
        this.options.initialSize,
        Math.ceil(this.inUse.size * 1.5) // Keep 50% buffer above current usage
      );
      
      const removeCount = this.available.length - targetSize;
      
      if (removeCount > 0) {
        this.available.splice(0, removeCount);
        this.statistics.shrinkCount++;
        this.statistics.lastShrink = Date.now();
        this.statistics.currentSize = this.available.length;
        
        if (this.options.debugMode) {
          console.log(`ObjectPool: Shrunk by ${removeCount} objects (utilization: ${(utilization * 100).toFixed(1)}%)`);
        }
      }
    }
  }

  /**
   * Set up automatic shrinking timer
   */
  setupShrinking() {
    setInterval(() => {
      this.shrink();
    }, this.options.shrinkInterval);
  }

  /**
   * Clear all objects from the pool
   */
  clear() {
    this.available = [];
    this.inUse.clear();
    this.statistics.currentSize = 0;
  }

  /**
   * Get pool statistics
   * 
   * @returns {Object} Pool statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.getTotalSize(),
      utilization: this.getUtilization()
    };
  }
}

/**
 * Specialized object pool for Button instances
 */
class ButtonPool extends ObjectPool {
  /**
   * Creates a new button pool
   * 
   * @param {Object} options - Pool configuration options
   */
  constructor(options = {}) {
    super(
      () => ButtonPool.createButton(),
      (button) => ButtonPool.resetButton(button),
      {
        initialSize: options.initialSize || 20,
        maxSize: options.maxSize || 200,
        ...options
      }
    );
  }

  /**
   * Create a new button instance
   * 
   * @returns {Button} New button instance
   */
  static createButton() {
    // Create button with default properties
    // The specific properties will be set when the button is configured for use
    return new Button(0, 0, 60, 35, '', {
      backgroundColor: '#4CAF50',
      hoverColor: '#45a049',
      textColor: 'white'
    });
  }

  /**
   * Reset a button for reuse
   * 
   * @param {Button} button - Button to reset
   */
  static resetButton(button) {
    // Reset button to default state
    button.setPosition(0, 0);
    button.setSize(60, 35);
    button.setText('');
    button.setVisible(true);
    button.setEnabled(true);
    
    // Clear any custom properties
    button.config = null;
    button.tooltip = null;
    button.hotkey = null;
    
    // Reset visual state
    if (typeof button.resetVisualState === 'function') {
      button.resetVisualState();
    }
  }

  /**
   * Acquire a button configured for specific use
   * 
   * @param {Object} config - Button configuration
   * @returns {Button} Configured button instance
   */
  acquireConfiguredButton(config) {
    const button = this.acquire();
    
    // Apply configuration
    if (config.size) {
      button.setSize(config.size.width, config.size.height);
    }
    
    if (config.text) {
      button.setText(config.text);
    }
    
    // Store configuration reference
    button.config = config;
    button.tooltip = config.tooltip;
    button.hotkey = config.hotkey;
    
    return button;
  }
}

/**
 * Specialized object pool for UI interaction events
 */
class InteractionEventPool extends ObjectPool {
  /**
   * Creates a new interaction event pool
   * 
   * @param {Object} options - Pool configuration options
   */
  constructor(options = {}) {
    super(
      () => InteractionEventPool.createEvent(),
      (event) => InteractionEventPool.resetEvent(event),
      {
        initialSize: options.initialSize || 50,
        maxSize: options.maxSize || 500,
        ...options
      }
    );
  }

  /**
   * Create a new interaction event object
   * 
   * @returns {Object} New event object
   */
  static createEvent() {
    return {
      type: null,
      target: null,
      position: { x: 0, y: 0 },
      timestamp: 0,
      handled: false,
      data: {}
    };
  }

  /**
   * Reset an interaction event for reuse
   * 
   * @param {Object} event - Event to reset
   */
  static resetEvent(event) {
    event.type = null;
    event.target = null;
    event.position.x = 0;
    event.position.y = 0;
    event.timestamp = 0;
    event.handled = false;
    event.data = {};
  }

  /**
   * Acquire a configured interaction event
   * 
   * @param {string} type - Event type
   * @param {Object} target - Event target
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} data - Additional event data
   * @returns {Object} Configured event object
   */
  acquireConfiguredEvent(type, target, x, y, data = {}) {
    const event = this.acquire();
    
    event.type = type;
    event.target = target;
    event.position.x = x;
    event.position.y = y;
    event.timestamp = Date.now();
    event.data = { ...data };
    
    return event;
  }
}

/**
 * Central manager for all object pools in the UI system
 */
class UIObjectPoolManager {
  /**
   * Creates a new UI object pool manager
   * 
   * @param {Object} options - Manager configuration options
   */
  constructor(options = {}) {
    this.options = {
      enableDebug: options.enableDebug || false,
      enableStatistics: options.enableStatistics !== false,
      ...options
    };

    // Initialize specialized pools
    this.buttonPool = new ButtonPool(options.buttonPool);
    this.eventPool = new InteractionEventPool(options.eventPool);
    
    // Track all pools for management
    this.pools = new Map([
      ['buttons', this.buttonPool],
      ['events', this.eventPool]
    ]);

    // Statistics collection
    this.globalStatistics = {
      startTime: Date.now(),
      totalAcquisitions: 0,
      totalReleases: 0,
      poolsCreated: this.pools.size
    };
  }

  /**
   * Get a specific pool by name
   * 
   * @param {string} poolName - Name of the pool
   * @returns {ObjectPool|null} Pool instance or null if not found
   */
  getPool(poolName) {
    return this.pools.get(poolName) || null;
  }

  /**
   * Add a custom pool to the manager
   * 
   * @param {string} name - Pool name
   * @param {ObjectPool} pool - Pool instance
   */
  addPool(name, pool) {
    this.pools.set(name, pool);
    this.globalStatistics.poolsCreated++;
  }

  /**
   * Remove a pool from the manager
   * 
   * @param {string} name - Pool name
   */
  removePool(name) {
    const pool = this.pools.get(name);
    if (pool) {
      pool.clear();
      this.pools.delete(name);
    }
  }

  /**
   * Acquire a button from the button pool
   * 
   * @param {Object} config - Button configuration
   * @returns {Button} Configured button instance
   */
  acquireButton(config) {
    this.globalStatistics.totalAcquisitions++;
    return this.buttonPool.acquireConfiguredButton(config);
  }

  /**
   * Release a button back to the pool
   * 
   * @param {Button} button - Button to release
   */
  releaseButton(button) {
    this.globalStatistics.totalReleases++;
    this.buttonPool.release(button);
  }

  /**
   * Acquire an interaction event from the event pool
   * 
   * @param {string} type - Event type
   * @param {Object} target - Event target
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} data - Additional event data
   * @returns {Object} Configured event object
   */
  acquireEvent(type, target, x, y, data = {}) {
    this.globalStatistics.totalAcquisitions++;
    return this.eventPool.acquireConfiguredEvent(type, target, x, y, data);
  }

  /**
   * Release an event back to the pool
   * 
   * @param {Object} event - Event to release
   */
  releaseEvent(event) {
    this.globalStatistics.totalReleases++;
    this.eventPool.release(event);
  }

  /**
   * Get comprehensive statistics for all pools
   * 
   * @returns {Object} Combined statistics
   */
  getAllStatistics() {
    const poolStats = {};
    
    for (const [name, pool] of this.pools) {
      poolStats[name] = pool.getStatistics();
    }

    return {
      global: {
        ...this.globalStatistics,
        uptime: Date.now() - this.globalStatistics.startTime,
        activePools: this.pools.size
      },
      pools: poolStats
    };
  }

  /**
   * Force shrink all pools
   */
  shrinkAllPools() {
    for (const [name, pool] of this.pools) {
      if (typeof pool.shrink === 'function') {
        pool.shrink();
      }
    }
  }

  /**
   * Clear all pools
   */
  clearAllPools() {
    for (const [name, pool] of this.pools) {
      pool.clear();
    }
    
    this.globalStatistics.totalAcquisitions = 0;
    this.globalStatistics.totalReleases = 0;
  }

  /**
   * Get diagnostic information
   * 
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      statistics: this.getAllStatistics(),
      options: { ...this.options }
    };
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.ObjectPool = ObjectPool;
  window.ButtonPool = ButtonPool;
  window.InteractionEventPool = InteractionEventPool;
  window.UIObjectPoolManager = UIObjectPoolManager;
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ObjectPool,
    ButtonPool,
    InteractionEventPool,
    UIObjectPoolManager
  };
}