/**
 * EntityModel
 * ===========
 * Pure data container for entity state (Model in MVC pattern)
 * 
 * Design Principles:
 * - **Pure data** - No behavior, no rendering, no business logic
 * - **Primitives only** - No p5.Vector, no p5.Image (framework-agnostic)
 * - **JSON-serializable** - Can be saved/loaded to files
 * - **Immutable returns** - getPosition() and getSize() return copies
 * - **Validated** - Constructor validates required properties
 * 
 * Usage:
 * ```javascript
 * const model = new EntityModel({
 *   id: 'ant_1',
 *   type: 'Ant',
 *   position: { x: 100, y: 200 },
 *   size: { width: 32, height: 32 },
 *   enabled: true
 * });
 * 
 * model.setPosition(150, 250);
 * const pos = model.getPosition(); // Returns copy { x: 150, y: 250 }
 * 
 * const json = JSON.stringify(model); // Serialize to JSON
 * const restored = EntityModel.fromJSON(JSON.parse(json)); // Deserialize
 * ```
 */

class EntityModel {
  /**
   * Create entity model
   * @param {Object} data - Entity configuration
   * @param {string} [data.id] - Unique ID (auto-generated if not provided)
   * @param {string} [data.type='Entity'] - Entity type
   * @param {Object} data.position - Position (REQUIRED)
   * @param {number} data.position.x - X coordinate
   * @param {number} data.position.y - Y coordinate
   * @param {Object} [data.size] - Size (defaults to 32x32)
   * @param {number} data.size.width - Width in pixels
   * @param {number} data.size.height - Height in pixels
   * @param {boolean} [data.enabled=true] - Whether entity is active
   */
  constructor(data = {}) {
    // Validate required properties
    if (!data.position || 
        typeof data.position.x !== 'number' || 
        typeof data.position.y !== 'number') {
      throw new Error('EntityModel: position must have numeric x and y properties');
    }
    
    // Core properties (primitives only, no p5.js objects)
    this.id = data.id || this._generateId();
    this.type = data.type || 'Entity';
    this.position = { x: data.position.x, y: data.position.y };
    this.size = data.size || { width: 32, height: 32 };
    this.enabled = data.enabled !== undefined ? data.enabled : true;
    
    // Validate size
    if (this.size.width <= 0 || this.size.height <= 0) {
      throw new Error('EntityModel: size must be positive');
    }
  }
  
  /**
   * Generate unique entity ID
   * @private
   * @returns {string} Unique ID
   */
  _generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get position (returns copy to prevent external mutation)
   * @returns {Object} Position { x, y }
   */
  getPosition() {
    return { x: this.position.x, y: this.position.y };
  }
  
  /**
   * Set position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @throws {Error} If x or y is not a number
   */
  setPosition(x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('EntityModel.setPosition: x and y must be numbers');
    }
    this.position.x = x;
    this.position.y = y;
  }
  
  /**
   * Get size (returns copy to prevent external mutation)
   * @returns {Object} Size { width, height }
   */
  getSize() {
    return { width: this.size.width, height: this.size.height };
  }
  
  /**
   * Set size
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @throws {Error} If width or height is not positive
   */
  setSize(width, height) {
    if (width <= 0 || height <= 0) {
      throw new Error('EntityModel.setSize: width and height must be positive');
    }
    this.size.width = width;
    this.size.height = height;
  }
  
  /**
   * Serialize to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      size: this.size,
      enabled: this.enabled
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} json - JSON data
   * @returns {EntityModel} New EntityModel instance
   */
  static fromJSON(json) {
    return new EntityModel(json);
  }
}

// Export for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityModel;
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.EntityModel = EntityModel;
}
