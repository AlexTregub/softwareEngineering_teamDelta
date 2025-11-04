/**
 * ResourceModel
 * -------------
 * Model class for game resources (Food, Wood, Stone).
 * 
 * Extends BaseModel to provide:
 * - Position and size management
 * - Resource type and amount tracking
 * - Depletion detection
 * - Collision detection
 * - Serialization support
 * 
 * Responsibilities:
 * - Store resource state (position, type, amount)
 * - Notify listeners when state changes
 * - Handle resource gathering (amount reduction)
 * - NO rendering logic
 * - NO input handling
 * 
 * Usage:
 * ```javascript
 * const food = new ResourceModel(100, 100, 32, 32, { type: 'Food', amount: 150 });
 * food.addChangeListener((property, data) => {
 *   if (property === 'depleted') {
 *     console.log('Resource depleted!');
 *   }
 * });
 * food.reduceAmount(50); // Gather 50 units
 * ```
 */

// Load BaseModel (browser uses window.BaseModel directly, Node.js requires it)
let BaseModel;
if (typeof require !== 'undefined') {
  BaseModel = require('./BaseModel');
} else {
  BaseModel = window.BaseModel;
}

class ResourceModel extends BaseModel {
  /**
   * Construct a resource model.
   * @param {number} x - X position in world space
   * @param {number} y - Y position in world space
   * @param {number} width - Resource width
   * @param {number} height - Resource height
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.type='Food'] - Resource type ('Food', 'Wood', 'Stone')
   * @param {number} [options.amount=100] - Initial resource amount
   */
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    super();
    
    // Core identity
    this._id = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || 'Food';
    
    // Position and size (single source of truth)
    this._position = { x, y };
    this._size = { width, height };
    
    // Resource state
    this._amount = options.amount !== undefined ? options.amount : 100;
    this._initialAmount = this._amount;
    
    // Collision box for spatial queries
    const CollisionBox2D = (typeof window !== 'undefined') ? window.CollisionBox2D : global.CollisionBox2D;
    this._collisionBox = new CollisionBox2D(x, y, width, height);
  }
  
  // --- Property Access ---
  
  /** @returns {string} Unique resource ID */
  get id() { return this._id; }
  
  /** @returns {string} Resource type ('Food', 'Wood', 'Stone') */
  get type() { return this._type; }
  
  /** @returns {{x: number, y: number}} Position (returns copy) */
  get position() { return { ...this._position }; }
  
  /** @returns {{width: number, height: number}} Size (returns copy) */
  get size() { return { ...this._size }; }
  
  /** @returns {number} Current resource amount */
  get amount() { return this._amount; }
  
  /** @returns {number} Initial resource amount */
  get initialAmount() { return this._initialAmount; }
  
  // --- Position Management ---
  
  /**
   * Set resource position.
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    if (this._position.x !== x || this._position.y !== y) {
      this._position.x = x;
      this._position.y = y;
      this._collisionBox.setPosition(x, y);
      this._notifyChange('position', { x, y });
    }
  }
  
  /**
   * Set resource size.
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    if (this._size.width !== width || this._size.height !== height) {
      this._size.width = width;
      this._size.height = height;
      this._collisionBox.setSize(width, height);
      this._notifyChange('size', { width, height });
    }
  }
  
  // --- Resource Amount Management ---
  
  /**
   * Reduce resource amount (gathering).
   * @param {number} value - Amount to reduce
   * @returns {number} New amount
   */
  reduceAmount(value) {
    const oldAmount = this._amount;
    const newAmount = Math.max(0, this._amount - value);
    
    if (oldAmount !== newAmount) {
      this._amount = newAmount;
      this._notifyChange('amount', { 
        amount: newAmount, 
        delta: newAmount - oldAmount 
      });
      
      // Check if depleted
      if (this._amount === 0) {
        this._isActive = false;
        this._notifyChange('depleted', { id: this._id });
      }
    }
    
    return this._amount;
  }
  
  /**
   * Check if resource is depleted.
   * @returns {boolean} True if amount is zero
   */
  isDepleted() {
    return this._amount === 0;
  }
  
  // --- Collision Detection ---
  
  /**
   * Check if point is inside resource bounds.
   * @param {number} x - Point X coordinate
   * @param {number} y - Point Y coordinate
   * @returns {boolean} True if point is inside
   */
  contains(x, y) {
    return this._collisionBox.contains(x, y);
  }
  
  /**
   * Check if this resource collides with another.
   * @param {ResourceModel} other - Other resource model
   * @returns {boolean} True if colliding
   */
  collidesWith(other) {
    if (other && other._collisionBox) {
      return this._collisionBox.intersects(other._collisionBox);
    }
    return false;
  }
  
  // --- Update Lifecycle ---
  
  /**
   * Update resource (called each frame).
   * Resources are static, so base implementation does nothing.
   * @param {number} deltaTime - Time since last update (ms)
   */
  update(deltaTime) {
    // Resources don't update (static)
    // Subclasses can override for animated resources
  }
  
  // --- Serialization ---
  
  /**
   * Serialize resource to JSON.
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(),
      id: this._id,
      type: this._type,
      position: this._position,
      size: this._size,
      amount: this._amount,
      initialAmount: this._initialAmount
    };
  }
  
  /**
   * Deserialize resource from JSON.
   * @param {Object} data - JSON data
   * @returns {ResourceModel} New resource instance
   * @static
   */
  static fromJSON(data) {
    const model = new ResourceModel(
      data.position.x,
      data.position.y,
      data.size.width,
      data.size.height,
      {
        type: data.type,
        amount: data.amount
      }
    );
    
    // Restore ID
    model._id = data.id;
    
    // Restore initial amount if present
    if (data.initialAmount !== undefined) {
      model._initialAmount = data.initialAmount;
    }
    
    return model;
  }
  
  // --- Cleanup ---
  
  /**
   * Destroy resource and clean up.
   */
  destroy() {
    super.destroy();
    this._collisionBox = null;
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceModel;
}

if (typeof window !== 'undefined') {
  window.ResourceModel = ResourceModel;
}
