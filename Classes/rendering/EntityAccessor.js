/**
 * EntityAccessor - Standardized entity position/size access
 * 
 * Eliminates duplicate accessor logic between RenderController and EntityLayerRenderer
 * Provides consistent, optimized entity property access across all rendering systems
 */
class EntityAccessor {
  
  /**
   * Get entity position with standardized fallback chain
   * @param {Object} entity - Entity object to query
   * @returns {Object} Position object with x, y properties
   */
  static getPosition(entity) {
    if (!entity) return { x: 0, y: 0 };
    
    // Standard getPosition() method (preferred)
    if (entity.getPosition) {
      return entity.getPosition();
    }
    
    // Direct position property
    if (entity.position) {
      return entity.position;
    }
    
    // Sprite-based position
    if (entity._sprite && entity._sprite.pos) {
      return entity._sprite.pos;
    }
    if (entity.sprite && entity.sprite.pos) {
      return entity.sprite.pos;
    }
    
    // Direct coordinate properties
    if (entity.posX !== undefined && entity.posY !== undefined) {
      return { x: entity.posX, y: entity.posY };
    }
    if (entity.x !== undefined && entity.y !== undefined) {
      return { x: entity.x, y: entity.y };
    }
    
    // Default fallback
    return { x: 0, y: 0 };
  }
  
  /**
   * Get entity size with standardized fallback chain
   * @param {Object} entity - Entity object to query  
   * @returns {Object} Size object with x, y properties (RenderController format)
   */
  static getSize(entity) {
    if (!entity) return { x: 20, y: 20 };
    
    // Standard getSize() method (preferred)
    if (entity.getSize) {
      return entity.getSize();
    }
    
    // Direct size property
    if (entity.size) {
      // Handle both {x, y} and {width, height} formats
      return {
        x: entity.size.x || entity.size.width || 20,
        y: entity.size.y || entity.size.height || 20
      };
    }
    
    // Sprite-based size
    if (entity._sprite && entity._sprite.size) {
      return entity._sprite.size;
    }
    if (entity.sprite && entity.sprite.size) {
      return entity.sprite.size;
    }
    
    // Direct size properties  
    if (entity.sizeX !== undefined && entity.sizeY !== undefined) {
      return { x: entity.sizeX, y: entity.sizeY };
    }
    if (entity.width !== undefined && entity.height !== undefined) {
      return { x: entity.width, y: entity.height };
    }
    
    // Default fallback
    return { x: 20, y: 20 };
  }
  
  /**
   * Get entity size in EntityLayerRenderer format (width/height properties)
   * @param {Object} entity - Entity object to query
   * @returns {Object} Size object with width, height properties
   */
  static getSizeWH(entity) {
    const size = this.getSize(entity);
    return {
      width: size.x || size.width || 20,
      height: size.y || size.height || 20
    };
  }
  
  /**
   * Get entity center point
   * @param {Object} entity - Entity object to query
   * @returns {Object} Center point with x, y properties
   */
  static getCenter(entity) {
    const pos = this.getPosition(entity);
    const size = this.getSize(entity);
    
    return {
      x: pos.x + size.x / 2,
      y: pos.y + size.y / 2
    };
  }
  
  /**
   * Check if entity has position information
   * @param {Object} entity - Entity object to query
   * @returns {boolean} True if entity has accessible position
   */
  static hasPosition(entity) {
    if (!entity) return false;
    
    return !!(
      entity.getPosition ||
      entity.position ||
      (entity._sprite && entity._sprite.pos) ||
      (entity.sprite && entity.sprite.pos) ||
      (entity.posX !== undefined && entity.posY !== undefined) ||
      (entity.x !== undefined && entity.y !== undefined)
    );
  }
  
  /**
   * Check if entity has size information
   * @param {Object} entity - Entity object to query
   * @returns {boolean} True if entity has accessible size
   */
  static hasSize(entity) {
    if (!entity) return false;
    
    return !!(
      entity.getSize ||
      entity.size ||
      (entity._sprite && entity._sprite.size) ||
      (entity.sprite && entity.sprite.size) ||
      (entity.sizeX !== undefined && entity.sizeY !== undefined) ||
      (entity.width !== undefined && entity.height !== undefined)
    );
  }
  
  /**
   * Get entity bounds for culling/collision detection
   * @param {Object} entity - Entity object to query
   * @returns {Object} Bounds with x, y, width, height properties
   */
  static getBounds(entity) {
    const pos = this.getPosition(entity);
    const size = this.getSize(entity);
    
    return {
      x: pos.x,
      y: pos.y, 
      width: size.x,
      height: size.y
    };
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = EntityAccessor;
}