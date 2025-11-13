/**
 * SettingsManager - Singleton for managing editor settings
 * 
 * Manages application settings with:
 * - Default settings from config file
 * - User overrides via LocalStorage
 * - Nested key support (e.g., 'camera.panSpeed')
 * - Change listeners for real-time updates
 * - Reset to defaults functionality
 * 
 * Usage:
 *   const settings = SettingsManager.getInstance();
 *   settings.loadSettings();
 *   const panSpeed = settings.get('camera.panSpeed', 1.0);
 *   settings.set('camera.panSpeed', 2.0);
 *   settings.onChange((key, value) => console.log('Changed:', key, value));
 * 
 * @author Software Engineering Team Delta
 */

class SettingsManager {
  constructor() {
    if (SettingsManager._instance) {
      return SettingsManager._instance;
    }
    
    this._settings = {};
    this._defaultSettings = {};
    this._listeners = [];
    this._loaded = false;
    
    SettingsManager._instance = this;
    
    // Load settings synchronously
    this.loadSettings();
  }
  
  /**
   * Get singleton instance
   * @returns {SettingsManager}
   */
  static getInstance() {
    if (!SettingsManager._instance) {
      SettingsManager._instance = new SettingsManager();
    }
    return SettingsManager._instance;
  }
  
  /**
   * Load settings from config file and LocalStorage
   * Config file provides defaults, LocalStorage provides user overrides
   * Synchronous for Node.js (require), async for browser (fetch)
   */
  loadSettings() {
    // Try synchronous loading first (Node.js with require)
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const defaults = require('../../config/editor-settings.json');
      this._defaultSettings = JSON.parse(JSON.stringify(defaults));
      this._settings = JSON.parse(JSON.stringify(this._defaultSettings));
      
      // Override with LocalStorage values
      try {
        if (typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('editor-settings');
          if (saved) {
            const userSettings = JSON.parse(saved);
            this._settings = this._mergeSettings(this._defaultSettings, userSettings);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
      
      this._loaded = true;
      return this._settings;
    } catch (e) {
      // Fallback to hardcoded defaults (for browser or if config missing)
      this._defaultSettings = this._getHardcodedDefaults();
      this._settings = JSON.parse(JSON.stringify(this._defaultSettings));
      this._loaded = true;
      return this._settings;
    }
  }
  
  /**
   * Get setting value with nested key support
   * @param {string} key - Setting key (supports dot notation: 'camera.panSpeed')
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Setting value or default
   */
  get(key, defaultValue = undefined) {
    if (!key || typeof key !== 'string') {
      return defaultValue;
    }
    
    const keys = key.split('.');
    let value = this._settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  }
  
  /**
   * Set setting value with nested key support
   * @param {string} key - Setting key (supports dot notation)
   * @param {*} value - New value
   */
  set(key, value) {
    if (!key || typeof key !== 'string') {
      return;
    }
    
    const keys = key.split('.');
    let target = this._settings;
    
    // Navigate to nested object, creating path if needed
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
    
    // Persist to LocalStorage
    try {
      localStorage.setItem('editor-settings', JSON.stringify(this._settings));
    } catch (e) {
      console.error('Failed to save settings to LocalStorage:', e);
    }
    
    // Notify listeners
    this._notifyListeners(key, value);
  }
  
  /**
   * Reset all settings to defaults
   * Clears LocalStorage overrides
   */
  resetToDefaults() {
    // Reset to default settings
    this._settings = JSON.parse(JSON.stringify(this._defaultSettings));
    
    // Clear LocalStorage
    try {
      localStorage.removeItem('editor-settings');
    } catch (e) {
      console.error('Failed to clear LocalStorage:', e);
    }
    
    // Notify all listeners (pass null to indicate full reset)
    this._notifyListeners(null, null);
  }
  
  /**
   * Register change listener
   * @param {Function} callback - Callback function(key, value)
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this._listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this._listeners.indexOf(callback);
      if (index >= 0) {
        this._listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all listeners of setting change
   * @param {string|null} key - Changed key (null for reset)
   * @param {*} value - New value
   * @private
   */
  _notifyListeners(key, value) {
    this._listeners.forEach(listener => {
      try {
        listener(key, value);
      } catch (e) {
        console.error('Error in settings listener:', e);
      }
    });
  }
  
  /**
   * Merge user settings into default settings
   * @param {Object} defaults - Default settings
   * @param {Object} user - User settings
   * @returns {Object} Merged settings
   * @private
   */
  _mergeSettings(defaults, user) {
    const merged = JSON.parse(JSON.stringify(defaults)); // Deep copy
    
    const merge = (target, source) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            // Recursively merge objects
            if (!target[key] || typeof target[key] !== 'object') {
              target[key] = {};
            }
            merge(target[key], source[key]);
          } else {
            // Override value
            target[key] = source[key];
          }
        }
      }
    };
    
    merge(merged, user);
    return merged;
  }
  
  /**
   * Get hardcoded default settings (fallback)
   * @returns {Object} Default settings
   * @private
   */
  _getHardcodedDefaults() {
    return {
      version: '1.0.0',
      camera: {
        panSpeed: 1.0,
        panSpeedMin: 0.5,
        panSpeedMax: 3.0,
        zoomSpeed: 1.1,
        zoomSpeedMin: 1.05,
        zoomSpeedMax: 1.5
      },
      editor: {
        autoSave: false,
        autoSaveInterval: 60,
        snapToGrid: false,
        gridSize: 32,
        theme: 'dark'
      },
      keybindings: {
        save: 'Ctrl+S',
        load: 'Ctrl+O',
        export: 'Ctrl+E',
        new: 'Ctrl+N',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Y',
        settings: 'Ctrl+,',
        playTest: 'F5'
      }
    };
  }
}

// Reset singleton for testing
SettingsManager._instance = null;

// Global export
if (typeof window !== 'undefined') {
  window.SettingsManager = SettingsManager;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsManager;
}
