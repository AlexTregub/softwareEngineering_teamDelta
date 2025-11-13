/**
 * KeyCommand
 * ----------
 * Represents a single keyboard command with key, modifiers, and action.
 * Part of the Command Pattern for keyboard input handling.
 */
class KeyCommand {
  /**
   * Create a key command
   * @param {string} key - The key to bind (lowercase)
   * @param {Object} modifiers - Modifier keys {shift, ctrl, alt}
   * @param {Function} action - The function to execute
   * @param {string} description - Human-readable description
   */
  constructor(key, modifiers = {}, action, description = '') {
    this.key = key.toLowerCase();
    this.shift = modifiers.shift || false;
    this.ctrl = modifiers.ctrl || false;
    this.alt = modifiers.alt || false;
    this.action = action;
    this.description = description;
  }
  
  /**
   * Check if this command matches the given key and modifiers
   * @param {string} key - The pressed key
   * @param {Object} modifiers - Current modifier states
   * @returns {boolean} True if matches
   */
  matches(key, modifiers) {
    return this.key === key.toLowerCase() &&
           this.shift === modifiers.shift &&
           this.ctrl === modifiers.ctrl &&
           this.alt === modifiers.alt;
  }
  
  /**
   * Execute this command's action
   */
  execute() {
    try {
      this.action();
    } catch (error) {
      console.error(`Error executing key command '${this.key}':`, error);
    }
  }
  
  /**
   * Get a human-readable string representation
   * @returns {string} Key combination string (e.g., "Shift+C")
   */
  toString() {
    let parts = [];
    if (this.ctrl) parts.push('Ctrl');
    if (this.shift) parts.push('Shift');
    if (this.alt) parts.push('Alt');
    parts.push(this.key.toUpperCase());
    return parts.join('+');
  }
}

/**
 * KeyBindingManager
 * -----------------
 * Manages all keyboard bindings across different game states.
 * Provides registration, lookup, and execution of key commands.
 */
class KeyBindingManager {
  constructor() {
    this.bindings = new Map(); // state -> [KeyCommand]
    this.globalBindings = []; // Commands that work in all states
  }
  
  /**
   * Register a key command for a specific game state
   * @param {string} state - Game state (e.g., 'PLAYING', 'MENU')
   * @param {KeyCommand} keyCommand - The command to register
   */
  register(state, keyCommand) {
    if (!this.bindings.has(state)) {
      this.bindings.set(state, []);
    }
    this.bindings.get(state).push(keyCommand);
  }
  
  /**
   * Register a global key command that works in all states
   * @param {KeyCommand} keyCommand - The command to register
   */
  registerGlobal(keyCommand) {
    this.globalBindings.push(keyCommand);
  }
  
  /**
   * Handle a key press event
   * @param {string} state - Current game state
   * @param {string} key - The pressed key
   * @param {Object} modifiers - Modifier key states
   * @returns {boolean} True if a command was executed
   */
  handleKey(state, key, modifiers) {
    // Check global bindings first
    for (const command of this.globalBindings) {
      if (command.matches(key, modifiers)) {
        command.execute();
        return true;
      }
    }
    
    // Check state-specific bindings
    const stateBindings = this.bindings.get(state);
    if (!stateBindings) return false;
    
    for (const command of stateBindings) {
      if (command.matches(key, modifiers)) {
        command.execute();
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all bindings for a specific state
   * @param {string} state - Game state
   * @returns {KeyCommand[]} Array of key commands
   */
  getBindingsForState(state) {
    return this.bindings.get(state) || [];
  }
  
  /**
   * Get all global bindings
   * @returns {KeyCommand[]} Array of key commands
   */
  getGlobalBindings() {
    return this.globalBindings;
  }
  
  /**
   * Clear all bindings for a state
   * @param {string} state - Game state to clear
   */
  clearState(state) {
    this.bindings.delete(state);
  }
  
  /**
   * Clear all bindings
   */
  clearAll() {
    this.bindings.clear();
    this.globalBindings = [];
  }
  
  /**
   * Generate a help text string for all bindings
   * @param {string} state - Game state (optional, shows all if omitted)
   * @returns {string} Formatted help text
   */
  generateHelp(state = null) {
    let help = [];
    
    if (this.globalBindings.length > 0) {
      help.push('=== Global Keys ===');
      for (const cmd of this.globalBindings) {
        if (cmd.description) {
          help.push(`${cmd.toString()}: ${cmd.description}`);
        }
      }
      help.push('');
    }
    
    if (state && this.bindings.has(state)) {
      help.push(`=== ${state} Keys ===`);
      for (const cmd of this.bindings.get(state)) {
        if (cmd.description) {
          help.push(`${cmd.toString()}: ${cmd.description}`);
        }
      }
    } else if (!state) {
      for (const [stateName, commands] of this.bindings.entries()) {
        help.push(`=== ${stateName} Keys ===`);
        for (const cmd of commands) {
          if (cmd.description) {
            help.push(`${cmd.toString()}: ${cmd.description}`);
          }
        }
        help.push('');
      }
    }
    
    return help.join('\n');
  }
}

// Global exports
if (typeof window !== 'undefined') {
  window.KeyCommand = KeyCommand;
  window.KeyBindingManager = KeyBindingManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KeyCommand, KeyBindingManager };
}
