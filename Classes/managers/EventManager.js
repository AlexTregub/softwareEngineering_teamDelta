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
    console.log('EventManager initialized');
    
    // Event storage
    this.events = new Map(); // id => eventConfig
    this.triggers = new Map(); // triggerId => triggerConfig
    this.activeEvents = []; // Currently active events
    
    // Event flags system
    this.flags = {};
    
    // State
    this._enabled = true;
    
    // Debug integration hook
    this._eventDebugManager = null;
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
   * @param {string} eventId - Event ID
   * @returns {Object|null} - Event config or null if not found
   */
  getEvent(eventId) {
    return this.events.get(eventId) || null;
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
    
    this.triggers.set(triggerId, {
      ...triggerConfig,
      id: triggerId,
      repeatable: triggerConfig.repeatable !== undefined ? triggerConfig.repeatable : false,
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
      
      if (typeof trigger.evaluate === 'function') {
        shouldTrigger = trigger.evaluate(this);
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
      
      if (!highestPriorityEvent.paused && typeof highestPriorityEvent.update === 'function') {
        highestPriorityEvent.update();
      }
    }
  }
  
  // ===========================
  // JSON LOADING
  // ===========================
  
  /**
   * Load events and triggers from JSON configuration
   * @param {Object} json - JSON configuration object
   * @param {Array} [json.events] - Array of event configurations
   * @param {Array} [json.triggers] - Array of trigger configurations
   * @returns {boolean} - True if loaded successfully
   */
  loadFromJSON(json) {
    if (!json || typeof json !== 'object') {
      console.error('Invalid JSON: not an object');
      return false;
    }
    
    // Validate structure
    if (!json.events || !Array.isArray(json.events)) {
      console.error('Invalid JSON: missing or invalid events array');
      return false;
    }
    
    // Validate all events have required fields
    for (const eventConfig of json.events) {
      if (!eventConfig.id || !eventConfig.type) {
        console.error('Invalid JSON: event missing required id or type');
        return false;
      }
    }
    
    // Load events
    for (const eventConfig of json.events) {
      this.registerEvent(eventConfig);
    }
    
    // Load triggers (optional)
    if (json.triggers && Array.isArray(json.triggers)) {
      for (const triggerConfig of json.triggers) {
        this.registerTrigger(triggerConfig);
      }
    }
    
    return true;
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
