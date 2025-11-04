/**
 * BaseModel
 * ---------
 * Base class for all MVC model classes.
 * 
 * Provides:
 * - Change notification system (Observer pattern)
 * - Serialization support (toJSON/fromJSON)
 * - Common lifecycle methods (update, destroy)
 * 
 * Responsibilities:
 * - Store data and state
 * - Implement business logic
 * - Notify listeners when data changes
 * - NO rendering
 * - NO input handling
 * 
 * Usage:
 * ```javascript
 * class MyModel extends BaseModel {
 *   constructor() {
 *     super();
 *     this._myProperty = 'value';
 *   }
 *   
 *   setMyProperty(value) {
 *     if (this._myProperty !== value) {
 *       this._myProperty = value;
 *       this._notifyChange('myProperty', { value });
 *     }
 *   }
 * }
 * ```
 */
class BaseModel {
  constructor() {
    // Change notification system
    this._changeListeners = [];
    
    // Active state
    this._isActive = true;
  }
  
  // --- Change Notification System (Observer Pattern) ---
  
  /**
   * Add a change listener callback.
   * @param {Function} callback - (property, data, model) => void
   */
  addChangeListener(callback) {
    if (typeof callback === 'function') {
      this._changeListeners.push(callback);
    }
  }
  
  /**
   * Remove a change listener callback.
   * @param {Function} callback - The callback to remove
   */
  removeChangeListener(callback) {
    const index = this._changeListeners.indexOf(callback);
    if (index > -1) {
      this._changeListeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of a property change.
   * @param {string} property - Property name that changed
   * @param {*} data - Change data
   * @protected
   */
  _notifyChange(property, data) {
    this._changeListeners.forEach(listener => {
      try {
        listener(property, data, this);
      } catch (error) {
        console.warn(`Error in change listener for property "${property}":`, error);
      }
    });
  }
  
  // --- Property Access ---
  
  /**
   * Get active state.
   * @returns {boolean}
   */
  get isActive() {
    return this._isActive;
  }
  
  /**
   * Set active state.
   * @param {boolean} value
   */
  set isActive(value) {
    this._isActive = value;
  }
  
  // --- Serialization ---
  
  /**
   * Serialize model to JSON.
   * Subclasses should override and call super.toJSON() to include base properties.
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      isActive: this._isActive
    };
  }
  
  /**
   * Deserialize model from JSON.
   * Subclasses should override and implement their own deserialization.
   * @param {Object} data - JSON data
   * @returns {BaseModel} New model instance
   * @static
   */
  static fromJSON(data) {
    const model = new BaseModel();
    if (data.isActive !== undefined) {
      model._isActive = data.isActive;
    }
    return model;
  }
  
  // --- Lifecycle ---
  
  /**
   * Update model logic (called each frame).
   * Subclasses should override to implement update logic.
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    // Base implementation does nothing
    // Subclasses override to add behavior
  }
  
  /**
   * Destroy model and clean up resources.
   * Removes all listeners and marks model inactive.
   */
  destroy() {
    this._isActive = false;
    this._changeListeners = [];
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseModel;
}

if (typeof window !== 'undefined') {
  window.BaseModel = BaseModel;
}
