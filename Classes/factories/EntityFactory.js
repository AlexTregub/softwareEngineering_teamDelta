/**
 * EntityFactory
 * Creates game entities from Level Editor data
 * 
 * PURPOSE:
 * - Create entities from type strings ('Ant', 'Queen', 'Resource', 'Building')
 * - Convert grid coordinates to world pixel coordinates
 * - Apply custom properties from level data
 * - Generate unique IDs if not provided
 * - Support custom entity class implementations
 * 
 * USAGE:
 *   const factory = new EntityFactory();
 *   
 *   // Basic creation
 *   const ant = factory.createEntity('Ant', 5, 10, { faction: 'player' });
 *   
 *   // From level data
 *   const entity = factory.createFromLevelData({
 *     id: 'entity_001',
 *     type: 'Ant',
 *     gridPosition: { x: 5, y: 10 },
 *     properties: { faction: 'player' }
 *   });
 * 
 * COORDINATE CONVERSION:
 * - Grid coordinates (tile-based) → World coordinates (pixels)
 * - Formula: worldX = gridX * TILE_SIZE, worldY = gridY * TILE_SIZE
 */

class EntityFactory {
  /**
   * Create EntityFactory instance
   * @param {Object} options - Configuration options
   * @param {Object} options.entityClasses - Custom entity class map { 'Ant': AntClass, ... }
   */
  constructor(options = {}) {
    this.entityClasses = options.entityClasses || this._getDefaultEntityClasses();
    this.entityCounter = 0; // For generating unique IDs
  }

  /**
   * Create entity from type and coordinates
   * @param {string} type - Entity type ('Ant', 'Queen', 'Resource', 'Building')
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {Object} properties - Custom properties (optional)
   * @param {string} id - Entity ID (optional, generates if not provided)
   * @returns {Object} Entity instance
   */
  createEntity(type, gridX, gridY, properties = {}, id = null) {
    // Validate type
    if (!this.entityClasses[type]) {
      throw new Error(`Unknown entity type: ${type}`);
    }

    // Validate coordinates
    if (typeof gridX !== 'number' || typeof gridY !== 'number') {
      throw new Error(`Invalid coordinates: gridX and gridY must be numbers`);
    }

    // Convert grid to world coordinates
    const worldCoords = this._gridToWorld(gridX, gridY);

    // Generate ID if not provided
    const entityId = id || this._generateId(type);

    // Get entity class
    const EntityClass = this.entityClasses[type];

    // Create entity
    let entity;
    if (typeof EntityClass === 'function') {
      // Custom class (constructor function or class)
      entity = new EntityClass(worldCoords.x, worldCoords.y, properties);
    } else {
      // Fallback: create simple entity object
      entity = this._createSimpleEntity(type, worldCoords.x, worldCoords.y, properties);
    }

    // Set ID and type
    entity.id = entityId;
    entity.type = type;
    
    // Set position (use position object for consistency with LevelLoader)
    if (!entity.position) {
      entity.position = {};
    }
    entity.position.x = worldCoords.x;
    entity.position.y = worldCoords.y;
    
    // Also set x and y directly for compatibility
    entity.x = worldCoords.x;
    entity.y = worldCoords.y;

    // Ensure properties exist
    if (!entity.properties) {
      entity.properties = properties || {};
    }

    return entity;
  }

  /**
   * Create entity from Level Editor data object
   * @param {Object} levelEntityData - Entity data from level JSON
   * @returns {Object} Entity instance
   */
  createFromLevelData(levelEntityData) {
    // Validate level data
    if (!levelEntityData.type) {
      throw new Error('Level entity data missing required field: type');
    }

    if (!levelEntityData.gridPosition) {
      throw new Error('Level entity data missing required field: gridPosition');
    }

    if (levelEntityData.gridPosition.x === undefined || levelEntityData.gridPosition.y === undefined) {
      throw new Error('Level entity gridPosition must have x and y properties');
    }

    // Extract data
    const type = levelEntityData.type;
    const gridX = levelEntityData.gridPosition.x;
    const gridY = levelEntityData.gridPosition.y;
    const properties = levelEntityData.properties || {};
    const id = levelEntityData.id || null;

    // Create entity
    return this.createEntity(type, gridX, gridY, properties, id);
  }

  /**
   * Convert grid coordinates to world pixel coordinates
   * @private
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object} { x: worldX, y: worldY }
   */
  _gridToWorld(gridX, gridY) {
    const TILE_SIZE = this._getTileSize();
    return {
      x: gridX * TILE_SIZE,
      y: gridY * TILE_SIZE
    };
  }

  /**
   * Get TILE_SIZE constant
   * @private
   * @returns {number} Tile size in pixels
   */
  _getTileSize() {
    // Try global TILE_SIZE
    if (typeof global !== 'undefined' && global.TILE_SIZE) {
      return global.TILE_SIZE;
    }

    if (typeof window !== 'undefined' && window.TILE_SIZE) {
      return window.TILE_SIZE;
    }

    // Default fallback
    return 32;
  }

  /**
   * Generate unique entity ID
   * @private
   * @param {string} type - Entity type
   * @returns {string} Unique ID
   */
  _generateId(type) {
    this.entityCounter++;
    return `${type.toLowerCase()}_${Date.now()}_${this.entityCounter}`;
  }

  /**
   * Create simple entity object (fallback when no custom class)
   * @private
   * @param {string} type - Entity type
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} properties - Custom properties
   * @returns {Object} Simple entity object
   */
  _createSimpleEntity(type, worldX, worldY, properties) {
    return {
      type,
      x: worldX,
      y: worldY,
      position: {
        x: worldX,
        y: worldY
      },
      properties: properties || {}
    };
  }

  /**
   * Get default entity classes (fallback implementations)
   * @private
   * @returns {Object} Map of entity type to class
   */
  _getDefaultEntityClasses() {
    // Try to load real classes from browser globals
    if (typeof window !== 'undefined') {
      return {
        'Ant': window.Ant || this._createMockClass('Ant'),
        'Queen': window.Queen || this._createMockClass('Queen'),
        'Resource': window.Resource || this._createMockClass('Resource'),
        'Building': window.Building || this._createMockClass('Building')
      };
    }

    // Try to load from Node.js (for testing)
    try {
      const Ant = require('../ants/ants');
      const Queen = require('../ants/Queen');
      const Resource = require('../resources/Resource');
      const Building = require('../buildings/Building');

      return {
        'Ant': Ant,
        'Queen': Queen,
        'Resource': Resource,
        'Building': Building
      };
    } catch (e) {
      // Fallback: Use mock classes for testing
      return {
        'Ant': this._createMockClass('Ant'),
        'Queen': this._createMockClass('Queen'),
        'Resource': this._createMockClass('Resource'),
        'Building': this._createMockClass('Building')
      };
    }
  }

  /**
   * Create mock entity class for testing
   * @private
   * @param {string} type - Entity type
   * @returns {Function} Mock class constructor
   */
  _createMockClass(type) {
    return class MockEntity {
      constructor(x, y, properties) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.position = { x, y };
        this.properties = properties || {};
      }
    };
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.EntityFactory = EntityFactory;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityFactory;
}
