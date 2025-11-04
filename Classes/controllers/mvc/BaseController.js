/**
 * BaseController
 * --------------
 * Base class for all MVC controller classes.
 * 
 * Provides:
 * - Coordination between model and view
 * - Input handling
 * - Lifecycle management
 * 
 * Responsibilities:
 * - Handle user input (clicks, keyboard, etc.)
 * - Update model based on input
 * - Trigger view updates via model changes
 * - Coordinate update/render lifecycle
 * - NO business logic (delegates to model)
 * - NO rendering (delegates to view)
 * 
 * Usage:
 * ```javascript
 * class MyController extends BaseController {
 *   constructor(x, y, options) {
 *     const model = new MyModel(x, y, options);
 *     const view = new MyView(model, options);
 *     super(model, view, options);
 *   }
 *   
 *   handleInput(type, data) {
 *     if (type === 'click') {
 *       this._model.setSelected(true);
 *     }
 *   }
 *   
 *   // Public API methods
 *   getPosition() { return this._model.position; }
 *   setPosition(x, y) { this._model.setPosition(x, y); }
 * }
 * ```
 */

class BaseController {
  /**
   * Construct a controller with model and view.
   * @param {BaseModel} model - The model to control
   * @param {BaseView} view - The view to coordinate
   * @param {Object} [options] - Controller configuration options
   */
  constructor(model, view, options) {
    if (!model || !view) {
      throw new Error('BaseController requires a model and view');
    }
    
    this._model = model;
    this._view = view;
    this._options = options;
  }
  
  // --- Property Access ---
  
  /**
   * Get the model this controller manages.
   * @returns {BaseModel}
   */
  get model() {
    return this._model;
  }
  
  /**
   * Get the view this controller coordinates.
   * @returns {BaseView}
   */
  get view() {
    return this._view;
  }
  
  /**
   * Get controller options.
   * @returns {Object}
   */
  get options() {
    return this._options;
  }
  
  // --- Update/Render Lifecycle ---
  
  /**
   * Update controller (delegates to model).
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    // Don't update if model is inactive
    if (this._model && this._model.isActive === false) {
      return;
    }
    
    // Delegate to model
    if (this._model && typeof this._model.update === 'function') {
      this._model.update(deltaTime);
    }
  }
  
  /**
   * Render controller (delegates to view).
   */
  render() {
    // Don't render if model is inactive
    if (this._model && this._model.isActive === false) {
      return;
    }
    
    // Delegate to view
    if (this._view && typeof this._view.render === 'function') {
      this._view.render();
    }
  }
  
  // --- Input Handling ---
  
  /**
   * Handle input events.
   * Subclasses should override to implement custom input handling.
   * @param {string} type - Input type ('click', 'hover', 'keypress', etc.)
   * @param {*} data - Input data
   */
  handleInput(type, data) {
    // Base implementation does nothing
    // Subclasses override to handle input
  }
  
  // --- Lifecycle ---
  
  /**
   * Destroy controller and clean up resources.
   * Destroys model and view.
   */
  destroy() {
    // Destroy model
    if (this._model && typeof this._model.destroy === 'function') {
      this._model.destroy();
    }
    
    // Destroy view
    if (this._view && typeof this._view.destroy === 'function') {
      this._view.destroy();
    }
    
    // Clear references
    this._model = null;
    this._view = null;
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseController;
}

if (typeof window !== 'undefined') {
  window.BaseController = BaseController;
}
