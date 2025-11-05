/**
 * ResourceModel - Pure data model for resources
 * Extends EntityModel with resource-specific properties
 * Framework-agnostic, JSON-serializable
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityModel === 'undefined') {
  var EntityModel = require('./EntityModel');
}

class ResourceModel extends EntityModel {
  /**
   * Creates a new ResourceModel
   * @param {Object} data - Resource data
   * @param {number} data.x - X position
   * @param {number} data.y - Y position
   * @param {number} [data.width=16] - Resource width (default smaller than entities)
   * @param {number} [data.height=16] - Resource height (default smaller than entities)
   * @param {string} [data.resourceType='greenLeaf'] - Type of resource
   * @param {number} [data.amount=1] - Amount of resource
   * @param {string|null} [data.carriedBy=null] - ID of entity carrying this resource
   * @param {number} [data.weight=1] - Weight of resource (affects carrying)
   * @param {boolean} [data.enabled=true] - Whether resource is enabled
   */
  constructor(data = {}) {
    // Call parent constructor with resource-specific defaults
    super({
      ...data,
      type: 'Resource',
      position: { x: data.x, y: data.y },
      size: {
        width: data.width !== undefined ? data.width : 16,
        height: data.height !== undefined ? data.height : 16
      }
    });
    
    /**
     * Resource type (greenLeaf, stick, stone, sand, dirt)
     * @type {string}
     */
    this.resourceType = data.resourceType || 'greenLeaf';
    
    /**
     * Amount of resource available
     * @type {number}
     */
    this.amount = data.amount !== undefined ? data.amount : 1;
    
    /**
     * ID of entity currently carrying this resource (null if not carried)
     * @type {string|null}
     */
    this.carriedBy = data.carriedBy !== undefined ? data.carriedBy : null;
    
    /**
     * Weight of resource (affects how many can be carried at once)
     * @type {number}
     */
    this.weight = data.weight !== undefined ? data.weight : 1;
  }
  
  /**
   * Serialize resource to JSON
   * @returns {Object} JSON representation with flattened position
   */
  toJSON() {
    const parentJSON = super.toJSON();
    return {
      ...parentJSON,
      x: parentJSON.position.x,
      y: parentJSON.position.y,
      width: parentJSON.size.width,
      height: parentJSON.size.height,
      resourceType: this.resourceType,
      amount: this.amount,
      carriedBy: this.carriedBy,
      weight: this.weight
    };
  }
  
  /**
   * Create ResourceModel from JSON data
   * @param {Object} json - JSON data
   * @returns {ResourceModel} New ResourceModel instance
   */
  static fromJSON(json) {
    return new ResourceModel(json);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceModel;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ResourceModel = ResourceModel;
}
