/**
 * ShortcutManager - Reusable Shortcut System
 * 
 * Centralized manager for registering and handling keyboard/mouse shortcuts
 * in a declarative, tool-agnostic way.
 * 
 * Design Goals:
 * - Declarative API (register shortcuts without custom event handlers)
 * - Tool-agnostic (works with any tool that needs shortcuts)
 * - Reusable (one module handles all shortcuts)
 * - Easy wiring (minimal code to add new shortcuts)
 * - Fully testable (TDD with unit tests)
 * 
 * @example
 * // Register a shortcut
 * ShortcutManager.register({
 *   id: 'brush-size-increase',
 *   trigger: { modifier: 'shift', event: 'mousewheel', direction: 'up' },
 *   tools: ['paint', 'eraser'],
 *   action: (context) => {
 *     const currentSize = context.getBrushSize();
 *     context.setBrushSize(Math.min(currentSize + 1, 99));
 *   }
 * });
 * 
 * // In LevelEditor event handler
 * handleMouseWheel(event, shiftKey, mouseX, mouseY) {
 *   const handled = ShortcutManager.handleMouseWheel(
 *     event,
 *     { shift: shiftKey, ctrl: false, alt: false },
 *     this._shortcutContext
 *   );
 *   if (handled) return true;
 *   // ... rest of logic
 * }
 */

class ShortcutManager {
  constructor() {
    if (ShortcutManager._instance) {
      return ShortcutManager._instance;
    }
    
    this._shortcuts = new Map(); // Changed from array to Map for better lookup
    ShortcutManager._instance = this;
  }
  
  /**
   * Get singleton instance
   * @returns {ShortcutManager}
   */
  static getInstance() {
    if (!ShortcutManager._instance) {
      ShortcutManager._instance = new ShortcutManager();
    }
    return ShortcutManager._instance;
  }
  
  /**
   * Register a shortcut
   * 
   * @param {Object} config - Shortcut configuration
   * @param {string} config.id - Unique identifier for shortcut
   * @param {Object} config.trigger - Trigger conditions
   * @param {string} config.trigger.modifier - Modifier key(s): 'shift', 'ctrl', 'alt', 'shift+ctrl', etc.
   * @param {string} config.trigger.event - Event type: 'mousewheel', 'keypress', 'click'
   * @param {string} [config.trigger.direction] - For mousewheel: 'up', 'down', or omit for any
   * @param {string} [config.trigger.key] - For keypress: key code or character
   * @param {Array<string>} config.tools - Tools this shortcut applies to, or ['all'] for any tool
   * @param {Function} config.action - Callback function (context) => void
   */
  static register(config) {
    const instance = ShortcutManager.getInstance();
    
    // Validation
    if (!config.id) {
      throw new Error('Shortcut id is required');
    }
    if (!config.trigger) {
      throw new Error('Shortcut trigger is required');
    }
    if (typeof config.action !== 'function') {
      throw new Error('Shortcut action must be a function');
    }
    
    // Store shortcut in Map
    instance._shortcuts.set(config.id, {
      id: config.id,
      trigger: config.trigger,
      tools: config.tools || ['all'],
      action: config.action
    });
  }
  
  /**
   * Unregister a shortcut by id
   * @param {string} id - Shortcut id to remove
   */
  static unregister(id) {
    const instance = ShortcutManager.getInstance();
    instance._shortcuts.delete(id);
  }
  
  /**
   * Handle mouse wheel event
   * 
   * @param {Object} event - Mouse wheel event with deltaY property
   * @param {Object} modifiers - Modifier key states { shift, ctrl, alt }
   * @param {Object} context - Context object with getCurrentTool() and other methods
   * @returns {boolean} True if shortcut handled event, false otherwise
   */
  static handleMouseWheel(event, modifiers, context) {
    const instance = ShortcutManager.getInstance();
    
    if (!event || event.deltaY === undefined) {
      return false;
    }
    
    const currentTool = context.getCurrentTool ? context.getCurrentTool() : null;
    const direction = event.deltaY < 0 ? 'up' : 'down';
    
    // Find matching shortcut
    for (const [id, shortcut] of instance._shortcuts) {
      // Check event type
      if (shortcut.trigger.event !== 'mousewheel') {
        continue;
      }
      
      // Check modifiers
      if (!ShortcutManager._matchesModifiers(shortcut.trigger.modifier, modifiers)) {
        continue;
      }
      
      // Check direction (if specified)
      if (shortcut.trigger.direction && shortcut.trigger.direction !== direction) {
        continue;
      }
      
      // Check tool
      if (!ShortcutManager._matchesTool(shortcut.tools, currentTool)) {
        continue;
      }
      
      // Execute action
      shortcut.action(context);
      return true; // Only trigger first matching shortcut
    }
    
    return false;
  }
  
  /**
   * Handle keyboard keypress event
   * 
   * @param {string} key - Key code or character (e.g., 'Delete', 'Escape', 'a', '1')
   * @param {Object} modifiers - Modifier key states { shift, ctrl, alt }
   * @param {Object} context - Context object with getCurrentTool() and other methods
   * @returns {boolean} True if shortcut handled event, false otherwise
   */
  static handleKeyPress(key, modifiers, context) {
    const instance = ShortcutManager.getInstance();
    
    if (!key || !context) {
      return false;
    }
    
    const currentTool = context.getCurrentTool ? context.getCurrentTool() : null;
    
    // Normalize key to lowercase for case-insensitive matching
    const normalizedKey = key.toLowerCase();
    
    // Find matching shortcut
    for (const [id, shortcut] of instance._shortcuts) {
      // Check event type
      if (shortcut.trigger.event !== 'keypress') {
        continue;
      }
      
      // Check key (case-insensitive)
      if (!shortcut.trigger.key || shortcut.trigger.key.toLowerCase() !== normalizedKey) {
        continue;
      }
      
      // Check modifiers
      if (!ShortcutManager._matchesModifiers(shortcut.trigger.modifier, modifiers)) {
        continue;
      }
      
      // Check tool
      if (!ShortcutManager._matchesTool(shortcut.tools, currentTool)) {
        continue;
      }
      
      // Execute action
      shortcut.action(context);
      return true; // Only trigger first matching shortcut
    }
    
    return false;
  }
  
  /**
   * Handle middle-click event (press, drag, or release)
   * 
   * @param {string} actionType - Action type: 'press', 'drag', or 'release'
   * @param {Object} modifiers - Modifier key states { shift, ctrl, alt }
   * @param {Object} context - Context object with methods for the action callbacks
   * @returns {boolean} True if shortcut handled event, false otherwise
   */
  static handleMiddleClick(actionType, modifiers, context) {
    const instance = ShortcutManager.getInstance();
    
    if (!actionType) {
      return false;
    }
    
    // Find matching shortcut
    for (const [id, shortcut] of instance._shortcuts) {
      // Check event type
      if (shortcut.trigger.event !== 'middleclick') {
        continue;
      }
      
      // Check action type (press, drag, release)
      if (shortcut.trigger.action && shortcut.trigger.action !== actionType) {
        continue;
      }
      
      // Check modifiers
      if (!ShortcutManager._matchesModifiers(shortcut.trigger.modifier, modifiers)) {
        continue;
      }
      
      // Execute action
      shortcut.action(context);
      return true; // Only trigger first matching shortcut
    }
    
    return false;
  }
  
  /**
   * Check if current modifiers match required modifiers
   * @private
   */
  static _matchesModifiers(required, current) {
    const allModifiers = ['shift', 'ctrl', 'alt'];
    
    if (!required) {
      // No modifiers required - check that NO modifiers are pressed (strict)
      for (const modifier of allModifiers) {
        if (current[modifier]) {
          return false; // Unwanted modifier pressed
        }
      }
      return true;
    }
    
    // Parse required modifiers (e.g., "shift+ctrl" -> ['shift', 'ctrl'])
    const requiredKeys = required.split('+').map(k => k.trim());
    
    // Check each required modifier is pressed
    for (const key of requiredKeys) {
      if (!current[key]) {
        return false;
      }
    }
    
    // Check no extra modifiers are pressed (strict matching)
    for (const modifier of allModifiers) {
      if (current[modifier] && !requiredKeys.includes(modifier)) {
        return false; // Extra modifier pressed
      }
    }
    
    return true;
  }
  
  /**
   * Check if shortcut applies to current tool
   * @private
   */
  static _matchesTool(tools, currentTool) {
    if (!tools || tools.length === 0) {
      return true;
    }
    
    if (tools.includes('all')) {
      return true;
    }
    
    return tools.includes(currentTool);
  }
  
  /**
   * Get all registered shortcuts
   * @returns {Map} Map of shortcuts (id -> config)
   */
  static getRegisteredShortcuts() {
    const instance = ShortcutManager.getInstance();
    return new Map(instance._shortcuts); // Return copy
  }
  
  /**
   * Clear all registered shortcuts (useful for testing)
   */
  static clearAll() {
    const instance = ShortcutManager.getInstance();
    instance._shortcuts.clear();
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.ShortcutManager = ShortcutManager;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShortcutManager;
}
