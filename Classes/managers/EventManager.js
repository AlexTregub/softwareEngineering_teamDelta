/**
 * EventManager - Core Event Coordination System
 * 
 * Manages random events, dialogue, tutorials, enemy waves, and boss fights.
 * Handles event registration, triggering, priority queuing, and flag-based conditions.
 * 
 * Following TDD: Implementation written to pass existing unit tests.
 * 
 * @class EventManager
 * @singleton
 */

class EventManager {
  constructor() {
    logNormal('EventManager initialized');
    
    // Event storage (game events)
    this.events = new Map(); // id => eventConfig
    this.triggers = new Map(); // triggerId => triggerConfig
    this.activeEvents = []; // Currently active events
    
    // Event flags system
    this.flags = {};
    
    // State
    this._enabled = true;
    
    // Debug integration hook
    this._eventDebugManager = null;
    
    // ===== PUB/SUB EVENT BUS =====
    // For entity lifecycle events (ANT_DAMAGED, ANT_DIED, etc.)
    this._listeners = new Map(); // eventName => Set of callbacks
  }
  
  // ===========================
  // EVENT REGISTRATION
  // ===========================
  
  /**
   * Register a new event
   * @param {Object} eventConfig - Event configuration
   * @param {string} eventConfig.id - Unique event ID
   * @param {string} eventConfig.type - Event type (dialogue, spawn, tutorial, boss)
   * @param {Object} eventConfig.content - Event-specific data
   * @param {number} [eventConfig.priority=10] - Event priority (1=highest, 10=lowest)
   * @param {Function} [eventConfig.onTrigger] - Callback when event triggers
   * @param {Function} [eventConfig.onComplete] - Callback when event completes
   * @param {Function} [eventConfig.onPause] - Callback when event pauses
   * @param {Function} [eventConfig.update] - Per-frame update function
   * @returns {boolean} - True if registered, false if failed
   */
  registerEvent(eventConfig) {
    // Validation
    if (!eventConfig || !eventConfig.id) {
      console.error('Event registration failed: missing ID');
      return false;
    }
    
    if (!eventConfig.type) {
      console.error('Event registration failed: missing type');
      return false;
    }
    
    if (this.events.has(eventConfig.id)) {
      console.error(`Event registration failed: duplicate ID "${eventConfig.id}"`);
      return false;
    }
    
    // Store event configuration
    this.events.set(eventConfig.id, {
      ...eventConfig,
      priority: eventConfig.priority !== undefined ? eventConfig.priority : 10,
      active: false,
      paused: false
    });
    
    return true;
  }
  
  // ===========================
  // EVENT RETRIEVAL
  // ===========================
  
  /**
   * Get event by ID
   * @param {string} eventId - Event ID to retrieve
   * @returns {Object|undefined} - Event config or undefined if not found
   */
  getEvent(eventId) {
    return this.events.get(eventId);
  }
  
  /**
   * Get all registered events
   * @returns {Array<Object>} - Array of all event configs
   */
  getAllEvents() {
    return Array.from(this.events.values());
  }
  
  /**
   * Get events by type
   * @param {string} type - Event type (dialogue, spawn, tutorial, boss)
   * @returns {Array<Object>} - Array of matching event configs
   */
  getEventsByType(type) {
    return this.getAllEvents().filter(event => event.type === type);
  }
  
  // ===========================
  // EVENT TRIGGERING
  // ===========================
  
  /**
   * Trigger an event by ID
   * @param {string} eventId - Event ID to trigger
   * @param {Object} [customData] - Optional custom data to pass to event
   * @returns {boolean} - True if triggered, false if failed
   */
  triggerEvent(eventId, customData = null) {
    if (!this._enabled) {
      return false;
    }
    
    const event = this.events.get(eventId);
    if (!event) {
      console.error(`Cannot trigger event: "${eventId}" not found`);
      return false;
    }
    
    // Check if already active
    if (this.isEventActive(eventId)) {
      return false;
    }
    
    // Mark as active
    event.active = true;
    event.paused = false;
    if (customData) {
      event.triggerData = customData;
    }
    
    // Add to active events
    this.activeEvents.push(event);
    
    // Handle priority - pause lower priority events
    this._handlePriority(event);
    
    // Call onTrigger callback
    if (typeof event.onTrigger === 'function') {
      event.onTrigger(customData);
    }
    
    // Notify debug manager
    if (this._eventDebugManager) {
      this._eventDebugManager.onEventTriggered(eventId, this._getCurrentLevelId());
    }
    
    return true;
  }
  
  /**
   * Check if specific event is active
   * @param {string} eventId - Event ID
   * @returns {boolean} - True if active
   */
  isEventActive(eventId) {
    return this.activeEvents.some(event => event.id === eventId);
  }
  
  /**
   * Get all active events (optionally sorted by priority)
   * @param {boolean} [sortByPriority=false] - Whether to sort by priority
   * @returns {Array<Object>} - Array of active events
   */
  getActiveEvents(sortByPriority = false) {
    if (sortByPriority) {
      return [...this.activeEvents].sort((a, b) => a.priority - b.priority);
    }
    return this.activeEvents;
  }
  
  /**
   * Get active events sorted by priority (alias for getActiveEvents(true))
   * @returns {Array<Object>} - Array of active events sorted by priority
   */
  getActiveEventsSorted() {
    return this.getActiveEvents(true);
  }
  
  /**
   * Complete/dismiss an active event
   * @param {string} eventId - Event ID to complete
   * @returns {boolean} - True if completed, false if not active
   */
  completeEvent(eventId) {
    const index = this.activeEvents.findIndex(event => event.id === eventId);
    if (index === -1) {
      return false;
    }
    
    const event = this.activeEvents[index];
    
    // Auto-set completion flag
    this.setFlag(`event_${eventId}_completed`, true);
    
    // Call onComplete callback
    if (typeof event.onComplete === 'function') {
      event.onComplete();
    }
    
    // Remove from active events
    this.activeEvents.splice(index, 1);
    event.active = false;
    event.paused = false;
    
    // Resume paused events
    this._resumePausedEvents();
    
    return true;
  }
  
  /**
   * Handle event priority - pause lower priority events
   * @private
   * @param {Object} newEvent - New event being triggered
   */
  _handlePriority(newEvent) {
    for (const event of this.activeEvents) {
      if (event.id === newEvent.id) continue;
      
      // Pause if lower priority (higher number)
      if (event.priority > newEvent.priority && !event.paused) {
        event.paused = true;
        if (typeof event.onPause === 'function') {
          event.onPause();
        }
      }
    }
  }
  
  /**
   * Resume paused events based on current highest priority
   * @private
   */
  _resumePausedEvents() {
    if (this.activeEvents.length === 0) return;
    
    // Find highest priority (lowest number)
    const highestPriority = Math.min(...this.activeEvents.map(e => e.priority));
    
    // Resume events at highest priority
    for (const event of this.activeEvents) {
      if (event.priority === highestPriority && event.paused) {
        event.paused = false;
      }
    }
  }
  
  // ===========================
  // TRIGGER SYSTEM
  // ===========================
  
  /**
   * Register a trigger for an event
   * @param {Object} triggerConfig - Trigger configuration
   * @param {string} triggerConfig.eventId - Event ID this trigger activates
   * @param {string} triggerConfig.type - Trigger type (time, spatial, flag, conditional, viewport)
   * @param {Object} triggerConfig.condition - Trigger-specific condition data
   * @param {boolean} [triggerConfig.repeatable=false] - Can trigger multiple times
   * @param {Function} [triggerConfig.evaluate] - Function to evaluate trigger condition
   * @returns {boolean} - True if registered, false if failed
   */
  registerTrigger(triggerConfig) {
    if (!triggerConfig || !triggerConfig.eventId) {
      console.error('Trigger registration failed: missing eventId');
      return false;
    }
    
    const triggerId = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Support both oneTime and repeatable properties
    // oneTime: true means not repeatable
    // repeatable: true means can trigger multiple times
    let isRepeatable = triggerConfig.repeatable !== undefined ? triggerConfig.repeatable : false;
    if (triggerConfig.oneTime !== undefined) {
      isRepeatable = !triggerConfig.oneTime; // oneTime:true = not repeatable
    }
    
    this.triggers.set(triggerId, {
      ...triggerConfig,
      id: triggerId,
      repeatable: isRepeatable,
      triggered: false
    });
    
    return true;
  }
  
  /**
   * Get all triggers for a specific event
   * @param {string} eventId - Event ID
   * @returns {Array<Object>} - Array of triggers for this event
   */
  getTriggersForEvent(eventId) {
    const triggers = [];
    for (const trigger of this.triggers.values()) {
      if (trigger.eventId === eventId) {
        triggers.push(trigger);
      }
    }
    return triggers;
  }
  
  /**
   * Evaluate all triggers and activate if conditions met
   * Called from update loop
   * @private
   */
  _evaluateTriggers() {
    const triggersToRemove = [];
    
    for (const [triggerId, trigger] of this.triggers.entries()) {
      // Skip if already triggered and not repeatable
      if (trigger.triggered && !trigger.repeatable) {
        continue;
      }
      
      // Evaluate trigger condition
      let shouldTrigger = false;
      
      // Custom evaluate function takes precedence
      if (typeof trigger.evaluate === 'function') {
        shouldTrigger = trigger.evaluate(this);
      }
      // Built-in trigger type evaluation
      else if (trigger.type && trigger.condition) {
        shouldTrigger = this._evaluateTriggerByType(trigger);
      }
      
      // Trigger event if condition met
      if (shouldTrigger) {
        this.triggerEvent(trigger.eventId);
        trigger.triggered = true;
        
        // Remove one-time triggers
        if (!trigger.repeatable) {
          triggersToRemove.push(triggerId);
        }
      }
    }
    
    // Remove one-time triggers
    for (const triggerId of triggersToRemove) {
      this.triggers.delete(triggerId);
    }
  }
  
  /**
   * Evaluate trigger based on its type
   * @private
   * @param {Object} trigger - Trigger configuration
   * @returns {boolean} - True if trigger condition is met
   */
  _evaluateTriggerByType(trigger) {
    const { type, condition } = trigger;
    
    switch (type) {
      case 'time':
        return this._evaluateTimeTrigger(trigger);
        
      case 'flag':
        return this._evaluateFlagTrigger(trigger);
        
      case 'spatial':
        // TODO: Implement spatial trigger evaluation
        return false;
        
      case 'viewport':
        // TODO: Implement viewport trigger evaluation
        return false;
        
      default:
        return false;
    }
  }
  
  /**
   * Evaluate time-based trigger
   * @private
   * @param {Object} trigger - Trigger with time condition
   * @returns {boolean} - True if enough time has passed
   */
  _evaluateTimeTrigger(trigger) {
    const { condition } = trigger;
    
    // Initialize start time on first evaluation
    if (trigger._startTime === undefined) {
      trigger._startTime = typeof millis === 'function' ? millis() : 
                          (typeof global !== 'undefined' && global.millis ? global.millis() : 0);
      
      // If delay is 0, trigger immediately
      if (condition.delay === 0) {
        return true;
      }
      return false;
    }
    
    const currentTime = typeof millis === 'function' ? millis() : 
                       (typeof global !== 'undefined' && global.millis ? global.millis() : 0);
    const elapsed = currentTime - trigger._startTime;
    
    return elapsed >= condition.delay;
  }
  
  /**
   * Evaluate flag-based trigger
   * @private
   * @param {Object} trigger - Trigger with flag condition
   * @returns {boolean} - True if flag conditions are met
   */
  _evaluateFlagTrigger(trigger) {
    const { condition } = trigger;
    
    // Single flag condition
    if (condition.flag) {
      return this._checkFlagCondition(condition);
    }
    
    // Multiple flag conditions (AND logic)
    if (condition.flags && Array.isArray(condition.flags)) {
      return condition.flags.every(flagCondition => this._checkFlagCondition(flagCondition));
    }
    
    return false;
  }
  
  /**
   * Check individual flag condition
   * @private
   * @param {Object} condition - Flag condition { flag, value, operator }
   * @returns {boolean} - True if condition is met
   */
  _checkFlagCondition(condition) {
    const { flag, value, operator = '==' } = condition;
    const actualValue = this.getFlag(flag);
    
    switch (operator) {
      case '==':
      case '===':
        return actualValue === value;
        
      case '!=':
      case '!==':
        return actualValue !== value;
        
      case '>':
        return actualValue > value;
        
      case '>=':
        return actualValue >= value;
        
      case '<':
        return actualValue < value;
        
      case '<=':
        return actualValue <= value;
        
      default:
        return actualValue === value;
    }
  }
  
  // ===========================
  // EVENT FLAGS SYSTEM
  // ===========================
  
  /**
   * Set an event flag
   * @param {string} flagName - Flag name
   * @param {*} value - Flag value (boolean, number, string, object)
   */
  setFlag(flagName, value) {
    this.flags[flagName] = value;
  }
  
  /**
   * Get event flag value
   * @param {string} flagName - Flag name
   * @param {*} [defaultValue=false] - Default value if flag doesn't exist
   * @returns {*} - Flag value or default
   */
  getFlag(flagName, defaultValue = false) {
    return this.flags.hasOwnProperty(flagName) ? this.flags[flagName] : defaultValue;
  }
  
  /**
   * Check if flag exists
   * @param {string} flagName - Flag name
   * @returns {boolean} - True if flag exists
   */
  hasFlag(flagName) {
    return this.flags.hasOwnProperty(flagName);
  }
  
  /**
   * Clear a specific flag
   * @param {string} flagName - Flag name
   */
  clearFlag(flagName) {
    delete this.flags[flagName];
  }
  
  /**
   * Increment a numeric flag
   * @param {string} flagName - Flag name
   * @param {number} [amount=1] - Amount to increment
   */
  incrementFlag(flagName, amount = 1) {
    const current = this.getFlag(flagName, 0);
    this.setFlag(flagName, current + amount);
  }
  
  /**
   * Get all flags
   * @returns {Object} - Copy of all flags
   */
  getAllFlags() {
    return { ...this.flags };
  }
  
  // ===========================
  // UPDATE LOOP
  // ===========================
  
  /**
   * Update event manager (called every frame)
   * Updates triggers and active events
   */
  update() {
    if (!this._enabled) {
      return;
    }
    
    // Evaluate triggers
    this._evaluateTriggers();
    
    // Update active events (only highest priority if not paused)
    const sortedEvents = this.getActiveEvents(true);
    
    if (sortedEvents.length > 0) {
      const highestPriorityEvent = sortedEvents[0];
      
      if (!highestPriorityEvent.paused && typeof highestPriorityEvent.onUpdate === 'function') {
        highestPriorityEvent.onUpdate();
      }
    }
  }
  
  // ===========================
  // JSON LOADING
  // ===========================
  
  /**
   * Load events and triggers from JSON configuration
   * @param {string|Object} json - JSON string or object with events and triggers
   * @returns {boolean} - True if loaded successfully, false if failed
   */
  loadFromJSON(json) {
    // Parse string to object if needed
    let config = json;
    if (typeof json === 'string') {
      try {
        config = JSON.parse(json);
      } catch (error) {
        console.error('Invalid JSON: parse error', error.message);
        return false;
      }
    }
    
    if (!config || typeof config !== 'object') {
      console.error('Invalid JSON: not an object');
      return false;
    }
    
    // Load events (optional)
    if (config.events && Array.isArray(config.events)) {
      // Validate all events have required fields
      for (const eventConfig of config.events) {
        if (!eventConfig.id || !eventConfig.type) {
          console.error('Invalid JSON: event missing required id or type');
          return false;
        }
      }
      
      // Register events
      for (const eventConfig of config.events) {
        this.registerEvent(eventConfig);
      }
    }
    
    // Load triggers (optional)
    if (config.triggers && Array.isArray(config.triggers)) {
      for (const triggerConfig of config.triggers) {
        this.registerTrigger(triggerConfig);
      }
    }
    
    return true;
  }
  
  /**
   * Export events and triggers to JSON
   * @param {boolean} [includeActiveState=false] - Whether to include active/paused states
   * @returns {string} - JSON string with events and triggers
   */
  exportToJSON(includeActiveState = false) {
    const events = [];
    const triggers = [];
    
    // Export events
    for (const [id, eventConfig] of this.events) {
      const exported = { ...eventConfig };
      
      // Remove functions (not serializable)
      delete exported.onTrigger;
      delete exported.onComplete;
      delete exported.onPause;
      delete exported.update;
      
      // Optionally remove active state
      if (!includeActiveState) {
        delete exported.active;
        delete exported.paused;
      }
      
      events.push(exported);
    }
    
    // Export triggers
    for (const [id, triggerConfig] of this.triggers) {
      const exported = { ...triggerConfig };
      
      // Remove internal state
      delete exported._startTime;
      delete exported._lastCheckTime;
      
      triggers.push(exported);
    }
    
    return JSON.stringify({
      events,
      triggers,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
  
  // ===========================
  // ENABLE/DISABLE CONTROL
  // ===========================
  
  /**
   * Check if event manager is enabled
   * @returns {boolean} - True if enabled
   */
  isEnabled() {
    return this._enabled;
  }
  
  /**
   * Enable or disable event manager
   * @param {boolean} enabled - True to enable, false to disable
   */
  setEnabled(enabled) {
    this._enabled = enabled;
    
    if (!enabled) {
      // Pause all active events when disabled
      for (const event of this.activeEvents) {
        if (!event.paused && typeof event.onPause === 'function') {
          event.onPause();
        }
        event.paused = true;
      }
    }
  }
  
  /**
   * Get enabled state (alias for isEnabled)
   * @returns {boolean} - True if enabled
   */
  get enabled() {
    return this._enabled;
  }
  
  /**
   * Set enabled state (alias for setEnabled)
   * @param {boolean} value - True to enable, false to disable
   */
  set enabled(value) {
    this.setEnabled(value);
  }
  
  // ===========================
  // CLEAR AND RESET
  // ===========================
  
  /**
   * Clear all active events (preserves flags and registered events)
   */
  clearActiveEvents() {
    for (const event of this.activeEvents) {
      event.active = false;
      event.paused = false;
    }
    this.activeEvents = [];
  }
  
  /**
   * Reset event manager to initial state
   * @param {boolean} [clearFlags=false] - Whether to also clear flags
   */
  reset(clearFlags = false) {
    this.events.clear();
    this.triggers.clear();
    this.activeEvents = [];
    
    if (clearFlags) {
      this.flags = {};
    }
  }
  
  // ===========================
  // DEBUG INTEGRATION
  // ===========================
  
  /**
   * Set event debug manager for integration
   * @param {Object} debugManager - EventDebugManager instance
   */
  setEventDebugManager(debugManager) {
    this._eventDebugManager = debugManager;
  }
  
  /**
   * Connect debug manager (alias for setEventDebugManager)
   * @param {Object} debugManager - EventDebugManager instance
   */
  connectDebugManager(debugManager) {
    this.setEventDebugManager(debugManager);
  }
  
  /**
   * Get current level ID (for debug manager integration)
   * @private
   * @returns {string|null} - Current level ID or null
   */
  _getCurrentLevelId() {
    // Try MapManager
    if (typeof MapManager !== 'undefined' && MapManager.getInstance) {
      const mapManager = MapManager.getInstance();
      if (mapManager && typeof mapManager.getActiveMapId === 'function') {
        return mapManager.getActiveMapId();
      }
    }
    
    // Try global mapManager
    const globalMapManager = (typeof global !== 'undefined' ? global.mapManager : null) || 
                             (typeof window !== 'undefined' ? window.mapManager : null);
    if (globalMapManager && typeof globalMapManager.getActiveMapId === 'function') {
      return globalMapManager.getActiveMapId();
    }
    
    return null;
  }
  
  // ===========================
  // PUB/SUB EVENT BUS
  // ===========================
  
  /**
   * Subscribe to an event (pub/sub pattern)
   * @param {string} eventName - Event name (use EntityEvents constants)
   * @param {Function} callback - Callback function (data) => {}
   * @returns {Function} - Unsubscribe function
   */
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      console.error('EventManager.on(): callback must be a function');
      return () => {};
    }
    
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, new Set());
    }
    
    this._listeners.get(eventName).add(callback);
    
    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }
  
  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    if (!this._listeners.has(eventName)) {
      return;
    }
    
    this._listeners.get(eventName).delete(callback);
    
    // Cleanup empty sets
    if (this._listeners.get(eventName).size === 0) {
      this._listeners.delete(eventName);
    }
  }
  
  /**
   * Subscribe to event once (auto-unsubscribe after first trigger)
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  once(eventName, callback) {
    const wrapper = (data) => {
      callback(data);
      this.off(eventName, wrapper);
    };
    return this.on(eventName, wrapper);
  }
  
  /**
   * Emit an event (pub/sub pattern)
   * @param {string} eventName - Event name (use EntityEvents constants)
   * @param {Object} [data] - Event data to pass to listeners
   */
  emit(eventName, data = null) {
    if (!this._listeners.has(eventName)) {
      return; // No listeners
    }
    
    const listeners = Array.from(this._listeners.get(eventName));
    
    for (const callback of listeners) {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventManager.emit() error in listener for "${eventName}":`, error);
      }
    }
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} eventName - Event name
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this._listeners.delete(eventName);
    } else {
      // Clear all listeners
      this._listeners.clear();
    }
  }
  
  /**
   * Get listener count for an event
   * @param {string} eventName - Event name
   * @returns {number} - Number of listeners
   */
  listenerCount(eventName) {
    return this._listeners.has(eventName) ? this._listeners.get(eventName).size : 0;
  }
  
  // ===========================
  // SINGLETON PATTERN
  // ===========================
  
  /**
   * Get singleton instance
   * @static
   * @returns {EventManager} - Singleton instance
   */
  static getInstance() {
    if (!EventManager._instance) {
      EventManager._instance = new EventManager();
    }
    return EventManager._instance;
  }
}

// Initialize singleton instance reference
EventManager._instance = null;

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventManager;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.EventManager = EventManager;
}

// Export for Node.js global (testing compatibility)
if (typeof global !== 'undefined') {
  global.EventManager = EventManager;
}
