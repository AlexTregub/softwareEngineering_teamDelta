/**
 * BaseView
 * --------
 * Base class for all MVC view classes.
 * 
 * Provides:
 * - Model change listener integration
 * - Rendering lifecycle
 * - Common view methods
 * 
 * Responsibilities:
 * - Render visual representation of model
 * - Listen to model changes and update visuals
 * - NO business logic
 * - NO input handling
 * - NO direct model manipulation
 * 
 * Usage:
 * ```javascript
 * class MyView extends BaseView {
 *   constructor(model, options) {
 *     super(model, options);
 *     // Initialize view-specific state
 *   }
 *   
 *   _onModelChange(property, data, model) {
 *     if (property === 'position') {
 *       // Update visual position
 *     }
 *   }
 *   
 *   _renderContent() {
 *     // Custom rendering logic
 *     fill(255);
 *     rect(this._model.x, this._model.y, 32, 32);
 *   }
 * }
 * ```
 */
class BaseView {
  /**
   * Construct a view for the given model.
   * @param {BaseModel} model - The model to render
   * @param {Object} [options] - View configuration options
   */
  constructor(model, options) {
    if (!model) {
      throw new Error('BaseView requires a model');
    }
    
    this._model = model;
    this._options = options; // Keep as-is (can be undefined)
    
    // Register as model change listener
    this._modelChangeHandler = this._onModelChange.bind(this);
    if (typeof model.addChangeListener === 'function') {
      model.addChangeListener(this._modelChangeHandler);
    }
  }
  
  // --- Property Access ---
  
  /**
   * Get the model this view renders.
   * @returns {BaseModel}
   */
  get model() {
    return this._model;
  }
  
  /**
   * Get view options.
   * @returns {Object}
   */
  get options() {
    return this._options;
  }
  
  // --- Model Change Handling ---
  
  /**
   * Handle model property changes.
   * Subclasses should override to react to specific property changes.
   * @param {string} property - Property that changed
   * @param {*} data - Change data
   * @param {BaseModel} model - The model that changed
   * @protected
   */
  _onModelChange(property, data, model) {
    // Base implementation does nothing
    // Subclasses override to update view based on model changes
  }
  
  // --- Rendering ---
  
  /**
   * Render the view.
   * Checks if model is active before rendering.
   * Calls _renderContent() for subclass-specific rendering.
   */
  render() {
    // Don't render if model is inactive
    if (this._model && this._model.isActive === false) {
      return;
    }
    
    // Call subclass rendering
    this._renderContent();
  }
  
  /**
   * Render view content.
   * Subclasses should override to implement custom rendering.
   * @protected
   */
  _renderContent() {
    // Base implementation does nothing
    // Subclasses override to add rendering logic
  }
  
  // --- Lifecycle ---
  
  /**
   * Destroy view and clean up resources.
   * Removes model listener and clears references.
   */
  destroy() {
    // Remove model listener
    if (this._model && this._modelChangeHandler) {
      this._model.removeChangeListener(this._modelChangeHandler);
    }
    
    // Clear references
    this._model = null;
    this._modelChangeHandler = null;
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseView;
}

if (typeof window !== 'undefined') {
  window.BaseView = BaseView;
}
