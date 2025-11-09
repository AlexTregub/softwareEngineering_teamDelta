/**
 * EventTrigger - Base class for all event triggers
 * 
 * Triggers define conditions that activate events (time, spatial, flags, etc.)
 * Each trigger checks a specific condition and signals when it should activate its associated event.
 * 
 * Following TDD: Implementation written to pass existing unit tests.
 * 
 * @class EventTrigger
 */

class EventTrigger {
  /**
   * Create an event trigger
   * @param {Object} config - Trigger configuration
   * @param {string} config.eventId - ID of event this trigger activates
   * @param {string} config.type - Trigger type (time, spatial, flag, conditional, viewport)
   * @param {boolean} [config.oneTime=true] - Trigger only once (vs repeatable)
   * @param {Object} [config.condition] - Trigger-specific condition data
   */
  constructor(config) {
    this.eventId = config.eventId;
    this.type = config.type;
    this.oneTime = config.oneTime !== undefined ? config.oneTime : true;
    this.condition = config.condition || {};
    
    // State tracking
    this.hasTriggered = false;
    this.triggeredAt = null;
    
    // For subclasses to override
    this._initialized = false;
  }
  
  /**
   * Initialize trigger (called when added to event manager)
   * Subclasses can override for setup logic
   */
  initialize() {
    this._initialized = true;
    this._startTime = typeof millis === 'function' ? millis() : 0;
  }
  
  /**
   * Check if trigger condition is met
   * ABSTRACT METHOD - subclasses must implement
   * @param {*} context - Context data (entity, flags, etc.)
   * @returns {boolean} - True if trigger condition is met
   */
  checkCondition(context) {
    // Base implementation - subclasses override
    return false;
  }
  
  /**
   * Mark trigger as activated
   * @returns {boolean} - True if activated, false if already triggered and oneTime
   */
  activate() {
    if (this.hasTriggered && this.oneTime) {
      return false; // Already triggered, can't activate again
    }
    
    this.hasTriggered = true;
    this.triggeredAt = typeof millis === 'function' ? millis() : Date.now();
    return true;
  }
  
  /**
   * Reset trigger state
   * Can be called on any trigger (oneTime or repeatable)
   */
  reset() {
    this.hasTriggered = false;
    this.triggeredAt = null;
  }
  
  /**
   * Serialize trigger for JSON export (level editor)
   * @returns {Object} - JSON-serializable trigger data
   */
  toJSON() {
    return {
      eventId: this.eventId,
      type: this.type,
      oneTime: this.oneTime,
      condition: this.condition
    };
  }
}

/**
 * TimeTrigger - Time-based event triggers
 * 
 * Triggers based on elapsed time, intervals, or specific game times.
 */
class TimeTrigger extends EventTrigger {
  constructor(config) {
    super({ ...config, type: 'time' });
    this._lastTriggerTime = null;
  }
  
  initialize() {
    super.initialize();
    this._lastTriggerTime = this._startTime;
  }
  
  /**
   * Check if time condition is met
   * Supports:
   * - delay: trigger after X milliseconds
   * - interval: trigger every X milliseconds (repeatable)
   * - gameTime: trigger at specific game time
   * @returns {boolean} - True if time condition met
   */
  checkCondition() {
    const currentTime = typeof millis === 'function' ? millis() : 
                       (typeof global !== 'undefined' && global.millis ? global.millis() : 0);
    
    // Delay-based trigger
    if (this.condition.delay !== undefined) {
      const elapsed = currentTime - this._startTime;
      return elapsed >= this.condition.delay;
    }
    
    // Interval-based trigger (repeatable)
    if (this.condition.interval !== undefined) {
      const elapsed = currentTime - this._lastTriggerTime;
      if (elapsed >= this.condition.interval) {
        this._lastTriggerTime = currentTime;
        return true;
      }
      return false;
    }
    
    // Specific game time trigger
    if (this.condition.gameTime !== undefined) {
      // Use global gameTime if available
      const gameTime = (typeof global !== 'undefined' && global.gameTime) ||
                       (typeof window !== 'undefined' && window.gameTime);
      
      if (gameTime && gameTime.getCurrentTime) {
        const currentGameTime = gameTime.getCurrentTime();
        return currentGameTime >= this.condition.gameTime;
      }
    }
    
    return false;
  }
}

/**
 * SpatialTrigger - Position-based event triggers
 * 
 * Triggers when entities enter/exit specific regions (radius or rectangular).
 */
class SpatialTrigger extends EventTrigger {
  constructor(config) {
    super({ ...config, type: 'spatial' });
    this._entitiesInZone = new Set();
    this.entitiesInside = []; // For test compatibility
    this.onEnter = config.onEnter;
    this.onExit = config.onExit;
    this.editorVisible = config.editorVisible;
  }
  
  /**
   * Check if spatial condition is met
   * Supports:
   * - radius: circular region (x, y, radius)
   * - rect: rectangular region (x, y, width, height)
   * - entityType: filter by entity type (optional)
   * - trackEntry: track when entities enter (optional)
   * - trackExit: track when entities exit (optional)
   * @param {Object} entity - Entity to check (must have x, y properties)
   * @returns {boolean} - True if entity enters trigger zone
   */
  checkCondition(entity) {
    if (!entity || entity.x === undefined || entity.y === undefined) {
      return false;
    }
    
    // Check entity type filter
    if (this.condition.entityType) {
      const entityType = entity.type || (entity.constructor ? entity.constructor.name : null);
      if (entityType !== this.condition.entityType) {
        return false;
      }
    }
    
    // Check if entity is in trigger zone
    const inZone = this._isInTriggerZone(entity);
    const entityId = entity.id || `${entity.x}_${entity.y}`;
    
    const wasInZone = this._entitiesInZone.has(entityId);
    
    // Track entry/exit with callbacks
    if (inZone && !wasInZone) {
      // Entity entered
      this._entitiesInZone.add(entityId);
      this.entitiesInside.push(entityId);
      
      if (this.onEnter) {
        this.onEnter(entity);
        return true;
      }
      
      if (this.condition.trackEntry) {
        return true;
      }
    } else if (!inZone && wasInZone) {
      // Entity exited
      this._entitiesInZone.delete(entityId);
      this.entitiesInside = this.entitiesInside.filter(id => id !== entityId);
      
      if (this.onExit) {
        this.onExit(entity);
        return true;
      }
      
      if (this.condition.trackExit) {
        return true;
      }
      
      return false;
    }
    
    // Simple zone check
    return inZone;
  }
  
  /**
   * Check if entity is within trigger zone
   * @private
   * @param {Object} entity - Entity with x, y coordinates
   * @returns {boolean} - True if entity in zone
   */
  _isInTriggerZone(entity) {
    // Radius-based (circular) trigger
    if (this.condition.radius !== undefined) {
      const dx = entity.x - this.condition.x;
      const dy = entity.y - this.condition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= this.condition.radius;
    }
    
    // Rectangular trigger
    if (this.condition.width !== undefined && this.condition.height !== undefined) {
      return entity.x >= this.condition.x &&
             entity.x <= this.condition.x + this.condition.width &&
             entity.y >= this.condition.y &&
             entity.y <= this.condition.y + this.condition.height;
    }
    
    return false;
  }
  
  /**
   * Get flag position for level editor visualization
   * @returns {Object} - {x, y} coordinates or null
   */
  getFlagPosition() {
    if (this.condition.x !== undefined && this.condition.y !== undefined) {
      return { x: this.condition.x, y: this.condition.y };
    }
    return null;
  }
}

/**
 * FlagTrigger - Game flag-based event triggers
 * 
 * Triggers when game flags meet specific conditions (equality, comparison, existence).
 */
class FlagTrigger extends EventTrigger {
  constructor(config) {
    super({ ...config, type: 'flag' });
    this._lastFlagValue = null;
  }
  
  /**
   * Check if flag condition is met
   * Supports:
   * - flag + value: flag equals value
   * - flag + exists: flag exists (any value)
   * - flag + operator + value: comparison (>, >=, <, <=, !=)
   * - flags: array of conditions (AND logic)
   * - onChange: trigger only when flag changes to target value
   * @param {Object} [eventManager] - EventManager instance (defaults to global)
   * @returns {boolean} - True if flag condition met
   */
  checkCondition(eventManager) {
    // Use passed eventManager or global
    if (!eventManager) {
      eventManager = (typeof global !== 'undefined' && global.eventManager) ||
                     (typeof window !== 'undefined' && window.eventManager);
    }
    
    if (!eventManager || !eventManager.getFlag) {
      return false;
    }
    
    // Multiple flags (AND logic)
    if (this.condition.flags && Array.isArray(this.condition.flags)) {
      return this.condition.flags.every(flagCondition => 
        this._checkSingleFlag(flagCondition, eventManager)
      );
    }
    
    // Single flag
    return this._checkSingleFlag(this.condition, eventManager);
  }
  
  /**
   * Check individual flag condition
   * @private
   */
  _checkSingleFlag(condition, eventManager) {
    const { flag, value, exists, operator, onChange } = condition;
    
    if (!flag) return false;
    
    const currentValue = eventManager.getFlag(flag);
    
    // Exists check
    if (exists !== undefined) {
      return eventManager.hasFlag(flag);
    }
    
    // onChange: trigger only when value changes to target
    if (onChange) {
      const changed = this._lastFlagValue !== currentValue;
      this._lastFlagValue = currentValue;
      
      if (changed && currentValue === value) {
        return true;
      }
      return false;
    }
    
    // Comparison operators
    if (operator) {
      switch (operator) {
        case '>':
          return currentValue > value;
        case '>=':
          return currentValue >= value;
        case '<':
          return currentValue < value;
        case '<=':
          return currentValue <= value;
        case '!=':
        case '!==':
          return currentValue !== value;
        case '==':
        case '===':
        default:
          return currentValue === value;
      }
    }
    
    // Simple equality check
    return currentValue === value;
  }
}

/**
 * ConditionalTrigger - Custom logic-based event triggers
 * 
 * Triggers based on custom JavaScript functions for complex conditions.
 */
class ConditionalTrigger extends EventTrigger {
  constructor(config) {
    super({ ...config, type: 'conditional' });
    
    // Allow condition to be passed as function directly or as object
    if (typeof config.condition === 'function') {
      this.condition = { evaluate: config.condition };
    }
  }
  
  /**
   * Check if conditional is met
   * Supports:
   * - evaluate: custom function(context) => boolean
   * - conditions: array of {evaluate} with AND/OR logic
   * @param {*} context - Context passed to evaluate functions (defaults to global context)
   * @returns {boolean} - True if condition met
   */
  checkCondition(context) {
    // Provide default context with global eventManager
    if (!context) {
      context = {
        eventManager: (typeof global !== 'undefined' && global.eventManager) ||
                     (typeof window !== 'undefined' && window.eventManager)
      };
    }
    
    // Single custom function
    if (typeof this.condition.evaluate === 'function') {
      return this.condition.evaluate(context);
    }
    
    // Multiple conditions with AND/OR logic
    if (this.condition.conditions && Array.isArray(this.condition.conditions)) {
      const logic = this.condition.logic || 'AND';
      
      if (logic === 'OR') {
        return this.condition.conditions.some(cond => 
          typeof cond.evaluate === 'function' && cond.evaluate(context)
        );
      } else {
        // AND logic
        return this.condition.conditions.every(cond =>
          typeof cond.evaluate === 'function' && cond.evaluate(context)
        );
      }
    }
    
    return false;
  }
}

/**
 * ViewportSpawnTrigger - Viewport edge spawn positioning
 * 
 * Generates spawn positions at viewport edges for enemy waves.
 * Integrates with MapManager's renderConversion.getViewSpan().
 */
class ViewportSpawnTrigger extends EventTrigger {
  constructor(config) {
    super({ ...config, type: 'viewport' });
  }
  
  /**
   * Get current viewport bounds from MapManager
   * @returns {Object} - {minX, maxX, minY, maxY}
   */
  getViewportBounds() {
    // Try MapManager
    const mapManager = (typeof global !== 'undefined' && global.g_map2) ||
                       (typeof window !== 'undefined' && window.g_map2);
    
    if (mapManager && mapManager.renderConversion && mapManager.renderConversion.getViewSpan) {
      const viewSpan = mapManager.renderConversion.getViewSpan();
      // viewSpan returns [[minX, minY], [maxX, maxY]]
      // viewSpan[0] = [minX, minY], viewSpan[1] = [maxX, maxY]
      return {
        minX: viewSpan[0][0],
        maxX: viewSpan[1][0],
        minY: viewSpan[0][1], // Flipped axis, now back...
        maxY: viewSpan[1][1]
      };
    }
    
    // Fallback to default viewport
    return {
      minX: 0,
      maxX: 1920,
      minY: 0,
      maxY: 1080
    };
  }
  
  /**
   * Generate spawn positions at viewport edges
   * @param {number} count - Number of spawn positions
   * @returns {Array<Object>} - Array of {x, y, edge} spawn positions
   */
  generateEdgePositions(count) {
    const viewport = this.getViewportBounds();
    const positions = [];
    const edges = ['top', 'right', 'bottom', 'left'];
    
    const distributeEvenly = this.condition.distributeEvenly !== false;
    
    for (let i = 0; i < count; i++) {
      let edge;
      if (distributeEvenly) {
        // Distribute across edges
        edge = edges[i % edges.length];
      } else {
        // Random edge
        edge = edges[Math.floor(Math.random() * edges.length)];
      }
      
      const pos = this._getRandomPositionOnEdge(edge, viewport);
      positions.push({ ...pos, edge });
    }
    
    return positions;
  }
  
  /**
   * Get random position on specific edge
   * @private
   */
  _getRandomPositionOnEdge(edge, viewport) {
    switch (edge) {
      case 'top':
        return {
          x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
          y: viewport.minY
        };
      case 'bottom':
        return {
          x: Math.random() * (viewport.maxX - viewport.minX) + viewport.minX,
          y: viewport.maxY
        };
      case 'left':
        return {
          x: viewport.minX,
          y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
        };
      case 'right':
        return {
          x: viewport.maxX,
          y: Math.random() * (viewport.maxY - viewport.minY) + viewport.minY
        };
      default:
        return { x: viewport.minX, y: viewport.minY };
    }
  }
  
  /**
   * Check viewport condition (always returns positions, not true/false)
   * @returns {Array<Object>|boolean} - Spawn positions or false
   */
  checkCondition() {
    if (this.condition.edgeSpawn) {
      const count = this.condition.count || 1;
      return this.generateEdgePositions(count);
    }
    return false;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EventTrigger,
    TimeTrigger,
    SpatialTrigger,
    FlagTrigger,
    ConditionalTrigger,
    ViewportSpawnTrigger
  };
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.EventTrigger = EventTrigger;
  window.TimeTrigger = TimeTrigger;
  window.SpatialTrigger = SpatialTrigger;
  window.FlagTrigger = FlagTrigger;
  window.ConditionalTrigger = ConditionalTrigger;
  window.ViewportSpawnTrigger = ViewportSpawnTrigger;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.EventTrigger = EventTrigger;
  global.TimeTrigger = TimeTrigger;
  global.SpatialTrigger = SpatialTrigger;
  global.FlagTrigger = FlagTrigger;
  global.ConditionalTrigger = ConditionalTrigger;
  global.ViewportSpawnTrigger = ViewportSpawnTrigger;
}
