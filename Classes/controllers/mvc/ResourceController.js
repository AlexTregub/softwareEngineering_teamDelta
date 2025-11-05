/**
 * ResourceController
 * ------------------
 * Controller class for game resources (Food, Wood, Stone).
 * 
 * Coordinates ResourceModel and ResourceView following MVC pattern.
 * 
 * Responsibilities:
 * - Create and coordinate model and view
 * - Provide public API for resource operations
 * - Handle input events (clicks, selection)
 * - Delegate update/render to model/view
 * - Manage resource lifecycle
 * 
 * Usage:
 * ```javascript
 * const food = new ResourceController(100, 100, 32, 32, { 
 *   type: 'Food', 
 *   amount: 150,
 *   imagePath: 'Images/Resources/food.png'
 * });
 * 
 * // Gather resources
 * const gathered = food.gather(25);
 * 
 * // Check position
 * const pos = food.getPosition();
 * 
 * // Handle click
 * const result = food.handleInput('click', { x: 110, y: 110 });
 * if (result && result.onGather) {
 *   result.onGather(10);
 * }
 * 
 * // Update and render each frame
 * food.update(deltaTime);
 * food.render();
 * ```
 */


class ResourceController extends BaseController {
  /**
   * Construct a resource controller.
   * @param {number} x - X position in world space
   * @param {number} y - Y position in world space
   * @param {number} width - Resource width
   * @param {number} height - Resource height
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.type='Food'] - Resource type ('Food', 'Wood', 'Stone')
   * @param {number} [options.amount=100] - Initial resource amount
   * @param {string} [options.imagePath] - Path to resource sprite image
   */
  constructor(x, y, width, height, options = {}) {
    // Create model and view
    const model = new ResourceModel(x, y, width, height, options);
    const view = new ResourceView(model, options);
    
    // Call parent constructor
    super(model, view, options);
  }
  
  // --- Public API: Position ---
  
  /**
   * Get resource position.
   * @returns {{x: number, y: number}} Position object
   */
  getPosition() {
    return this._model.position;
  }
  
  /**
   * Set resource position.
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    this._model.setPosition(x, y);
  }
  
  // --- Public API: Resource Type ---
  
  /**
   * Get resource type.
   * @returns {string} Resource type ('Food', 'Wood', 'Stone')
   */
  getType() {
    return this._model.type;
  }
  
  /**
   * Get resource faction.
   * @returns {string} Resource faction (typically 'neutral')
   */
  getFaction() {
    return this._model.faction;
  }
  
  /**
   * Get resource faction (read-only property).
   * @returns {string} Resource faction (typically 'neutral')
   */
  get faction() {
    return this._model.faction;
  }
  
  // --- Public API: Resource Amount ---
  
  /**
   * Get current resource amount.
   * @returns {number} Current amount
   */
  getAmount() {
    return this._model.amount;
  }
  
  /**
   * Gather resources (reduce amount).
   * @param {number} amount - Amount to gather
   * @returns {number} Actual amount gathered (may be less if insufficient)
   */
  gather(amount) {
    const currentAmount = this._model.amount;
    const actualGathered = Math.min(amount, currentAmount);
    this._model.reduceAmount(actualGathered);
    return actualGathered;
  }
  
  // --- Public API: Depletion ---
  
  /**
   * Check if resource is depleted.
   * @returns {boolean} True if amount is zero
   */
  isDepleted() {
    return this._model.isDepleted();
  }
  
  // --- Public API: Collision ---
  
  /**
   * Check if point is inside resource bounds.
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @returns {boolean} True if point is inside
   */
  contains(x, y) {
    return this._model.contains(x, y);
  }
  
  /**
   * Check if this resource collides with another.
   * @param {ResourceController} other - Other resource controller
   * @returns {boolean} True if colliding
   */
  collidesWith(other) {
    if (!other || !other._model) {
      return false;
    }
    return this._model.collidesWith(other._model);
  }
  
  // --- Input Handling ---
  
  /**
   * Handle input events.
   * @param {string} type - Input type ('click', 'hover', etc.)
   * @param {Object} data - Input data (e.g., {x, y} for click)
   * @returns {boolean|Object} True/false or callback object for clicks
   */
  handleInput(type, data) {
    if (type === 'click' && data) {
      // Check if click is within bounds
      if (this.contains(data.x, data.y)) {
        // Return callback object for gathering
        return {
          onGather: (amount) => this.gather(amount)
        };
      }
      return false;
    }
    
    // Default: no handling
    return false;
  }
  
  // --- Serialization ---
  
  /**
   * Serialize controller to JSON.
   * @returns {Object} JSON representation
   */
  toJSON() {
    return this._model.toJSON();
  }
  
  /**
   * Deserialize controller from JSON.
   * @param {Object} json - JSON data
   * @param {Object} [options] - Additional options for view
   * @returns {ResourceController} New controller instance
   * @static
   */
  static fromJSON(json, options = {}) {
    const controller = new ResourceController(
      json.position.x,
      json.position.y,
      json.size.width,
      json.size.height,
      {
        type: json.type,
        amount: json.amount,
        ...options
      }
    );
    
    return controller;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceController;
}

if (typeof window !== 'undefined') {
  window.ResourceController = ResourceController;
}
