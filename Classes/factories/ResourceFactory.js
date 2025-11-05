/**
 * ResourceFactory.js
 * 
 * Factory class for creating ResourceController instances.
 * Provides convenient static methods for common resource types.
 * 
 * Part of MVC refactoring - creates ResourceController (MVC pattern) instances
 * instead of old Resource (Entity pattern) instances.
 * 
 * @class ResourceFactory
 */

class ResourceFactory {
  /**
   * Create a new ResourceFactory instance.
   * @param {WorldService} [worldService=null] - Optional WorldService (Phase 6)
   */
  constructor(worldService = null) {
    this._worldService = worldService;
  }
  
  /**
   * Get the appropriate image for a resource type
   * @private
   * @param {string} type - Resource type (greenLeaf, mapleLeaf, stick, stone)
   * @returns {p5.Image|null} The image object or null if not found
   */
  static _getImageForType(type) {
    switch (type) {
      case 'greenLeaf':
        return (typeof greenLeaf !== 'undefined' && greenLeaf) || null;
      case 'stick':
        return (typeof stick !== 'undefined' && stick) || null;
      case 'stone':
        return (typeof stone !== 'undefined' && stone) || null;
      case 'mapleLeaf':
        return (typeof mapleLeaf !== 'undefined' && mapleLeaf) || null;
      default:
        return (typeof greenLeaf !== 'undefined' && greenLeaf) || 
               (typeof mapleLeaf !== 'undefined' && mapleLeaf) || null;
    }
  }

  /**
   * Create a green leaf resource
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @param {number} [options.amount=100] - Resource amount
   * @returns {ResourceController} New green leaf resource controller
   * 
   * @example
   * const leaf = ResourceFactory.createGreenLeaf(100, 150);
   * const customLeaf = ResourceFactory.createGreenLeaf(100, 150, { amount: 50 });
   */
  static createGreenLeaf(x, y, options = {}) {
    if (typeof ResourceController === 'undefined') {
      console.error('ResourceController not loaded - cannot create green leaf');
      return null;
    }
    
    const imagePath = ResourceFactory._getImageForType('greenLeaf');
    return new ResourceController(x, y, 20, 20, { 
      type: 'greenLeaf',
      amount: options.amount || 100,
      imagePath: imagePath,
      ...options
    });
  }

  /**
   * Create a maple leaf resource
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @param {number} [options.amount=100] - Resource amount
   * @returns {ResourceController} New maple leaf resource controller
   * 
   * @example
   * const leaf = ResourceFactory.createMapleLeaf(200, 250);
   */
  static createMapleLeaf(x, y, options = {}) {
    if (typeof ResourceController === 'undefined') {
      console.error('ResourceController not loaded - cannot create maple leaf');
      return null;
    }
    
    const imagePath = ResourceFactory._getImageForType('mapleLeaf');
    return new ResourceController(x, y, 20, 20, { 
      type: 'mapleLeaf',
      amount: options.amount || 100,
      imagePath: imagePath,
      ...options
    });
  }

  /**
   * Create a stick resource
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @param {number} [options.amount=100] - Resource amount
   * @returns {ResourceController} New stick resource controller
   * 
   * @example
   * const stick = ResourceFactory.createStick(300, 350);
   */
  static createStick(x, y, options = {}) {
    if (typeof ResourceController === 'undefined') {
      console.error('ResourceController not loaded - cannot create stick');
      return null;
    }
    
    const imagePath = ResourceFactory._getImageForType('stick');
    return new ResourceController(x, y, 20, 20, { 
      type: 'stick',
      amount: options.amount || 100,
      imagePath: imagePath,
      ...options
    });
  }

  /**
   * Create a stone resource
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @param {number} [options.amount=100] - Resource amount
   * @returns {ResourceController} New stone resource controller
   * 
   * @example
   * const stone = ResourceFactory.createStone(400, 450);
   */
  static createStone(x, y, options = {}) {
    if (typeof ResourceController === 'undefined') {
      console.error('ResourceController not loaded - cannot create stone');
      return null;
    }
    
    const imagePath = ResourceFactory._getImageForType('stone');
    return new ResourceController(x, y, 20, 20, { 
      type: 'stone',
      amount: options.amount || 100,
      imagePath: imagePath,
      ...options
    });
  }

  /**
   * Create a resource of specified type (instance method)
   * @param {string} type - Resource type (greenLeaf, mapleLeaf, stick, stone)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @returns {ResourceController|null} New resource controller or null if invalid type
   */
  createResource(type, x, y, options = {}) {
    return ResourceFactory.createResource(type, x, y, options);
  }
  
  /**
   * Create a resource of specified type (static method - generic factory method)
   * @param {string} type - Resource type (greenLeaf, mapleLeaf, stick, stone)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {Object} [options={}] - Optional configuration
   * @returns {ResourceController|null} New resource controller or null if invalid type
   * 
   * @example
   * const resource = ResourceFactory.createResource('greenLeaf', 100, 150);
   * const customResource = ResourceFactory.createResource('stick', 200, 250, { amount: 75 });
   */
  static createResource(type, x, y, options = {}) {
    switch (type) {
      case 'greenLeaf':
        return ResourceFactory.createGreenLeaf(x, y, options);
      case 'mapleLeaf':
        return ResourceFactory.createMapleLeaf(x, y, options);
      case 'stick':
        return ResourceFactory.createStick(x, y, options);
      case 'stone':
        return ResourceFactory.createStone(x, y, options);
      default:
        console.error(`Unknown resource type: ${type}`);
        return null;
    }
  }
}

// Browser/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceFactory;
}
if (typeof window !== 'undefined') {
  window.ResourceFactory = ResourceFactory;
}
