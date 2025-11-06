/**
 * EntityController - Base controller for entity business logic
 * Handles update loop and input processing
 * 
 * **Design Philosophy**:
 * - **Stateless** - Controllers don't store data, they operate on models
 * - **Pure logic** - All behavior, no data
 * - **Composable** - Mix and match controllers with different models/views
 * 
 * **Lifecycle Methods**:
 * - `update(model, deltaTime)` - Called every frame, implements game logic
 * - `handleInput(model, input)` - Processes user input (mouse, keyboard)
 * 
 * **Usage**:
 * ```javascript
 * const controller = new EntityController();
 * const model = new EntityModel({ position: { x: 100, y: 200 } });
 * 
 * // Game loop
 * controller.update(model, deltaTime);
 * 
 * // Input handling
 * controller.handleInput(model, { mouse: { x: 150, y: 250 }, keyboard: {} });
 * ```
 * 
 * **Subclassing**:
 * ```javascript
 * class AntController extends EntityController {
 *   _updateInternal(model, deltaTime) {
 *     // Custom ant behavior (movement, tasks, combat)
 *   }
 *   
 *   _handleInputInternal(model, input) {
 *     // Custom input handling (selection, commands)
 *   }
 * }
 * ```
 */

class EntityController {
  /**
   * Update entity logic (called every frame)
   * @param {EntityModel} model - Model to update
   * @param {number} deltaTime - Time since last frame (milliseconds)
   */
  update(model, deltaTime) {
    // Validation
    if (!model) {
      throw new Error('EntityController.update: model is required');
    }
    if (typeof deltaTime !== 'number') {
      throw new Error('EntityController.update: deltaTime must be a number');
    }
    
    // Skip update if model is disabled
    if (!model.enabled) {
      return;
    }
    
    // Delegate to internal method (override in subclasses)
    this._updateInternal(model, deltaTime);
  }
  
  /**
   * Handle user input
   * @param {EntityModel} model - Model to process input for
   * @param {Object} input - Input state (mouse, keyboard)
   */
  handleInput(model, input) {
    // Validation
    if (!model) {
      throw new Error('EntityController.handleInput: model is required');
    }
    if (!input) {
      throw new Error('EntityController.handleInput: input is required');
    }
    
    // Skip input if model is disabled
    if (!model.enabled) {
      return;
    }
    
    // Delegate to internal method (override in subclasses)
    this._handleInputInternal(model, input);
  }
  
  /**
   * Internal update logic (override in subclasses)
   * @protected
   * @param {EntityModel} model - Model to update
   * @param {number} deltaTime - Time since last frame (milliseconds)
   */
  _updateInternal(model, deltaTime) {
    // Base implementation: no-op
    // Subclasses override this method to implement specific behavior
  }
  
  /**
   * Internal input handling (override in subclasses)
   * @protected
   * @param {EntityModel} model - Model to process input for
   * @param {Object} input - Input state
   */
  _handleInputInternal(model, input) {
    // Base implementation: no-op
    // Subclasses override this method to implement specific input handling
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityController;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.EntityController = EntityController;
}
