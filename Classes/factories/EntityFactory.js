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
    console.log('[EntityFactory] DEBUG: createEntity called - type:', type, 'grid:', gridX, gridY);
    
    // Validate type
    if (!this.entityClasses[type]) {
      console.error('[EntityFactory] DEBUG: Unknown entity type:', type, 'Available types:', Object.keys(this.entityClasses));
      throw new Error(`Unknown entity type: ${type}`);
    }

    // Validate coordinates
    if (typeof gridX !== 'number' || typeof gridY !== 'number') {
      throw new Error(`Invalid coordinates: gridX and gridY must be numbers`);
    }

    // Convert grid to world coordinates
    const worldCoords = this._gridToWorld(gridX, gridY);
    console.log('[EntityFactory] DEBUG: World coords:', worldCoords);

    // Generate ID if not provided
    const entityId = id || this._generateId(type);

    // Get entity class
    const EntityClass = this.entityClasses[type];
    console.log('[EntityFactory] DEBUG: EntityClass:', typeof EntityClass, EntityClass?.name);

    // Create entity with proper constructor arguments based on type
    let entity;
    if (typeof EntityClass === 'function') {
      console.log('[EntityFactory] DEBUG: Creating entity via class constructor...');
      entity = this._createEntityInstance(type, EntityClass, worldCoords.x, worldCoords.y, properties);
    } else {
      throw new Error(`Entity class not found for type: ${type}. Check _getDefaultEntityClasses().`);
    }

    // Note: Entity generates its own ID in constructor (readonly property)
    // Type is set via constructor options parameter
    console.log('[EntityFactory] DEBUG: Entity created with ID:', entity.id, 'Type:', entity.type);
    
    // Ensure position compatibility across different entity types
    // Some use x/y, some use posX/posY, some use position object
    const finalPosition = this._ensurePositionProperties(entity, worldCoords.x, worldCoords.y);
    
    console.log('[EntityFactory] DEBUG: Entity created with position:', finalPosition);
    entity.y = worldCoords.y;

    // Ensure properties exist
    if (!entity.properties) {
      entity.properties = properties || {};
    }

    return entity;
  }

  /**
   * Ensure entity has all position property variants for compatibility
   * @private
   * @param {Object} entity - Entity instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} Position object { x, y }
   */
  _ensurePositionProperties(entity, x, y) {
    // Ensure position object exists
    if (!entity.position) {
      entity.position = {};
    }
    entity.position.x = x;
    entity.position.y = y;
    
    // Add x/y properties (readonly via getters if they use posX/posY internally)
    if (!('x' in entity)) {
      Object.defineProperty(entity, 'x', {
        get() { return this.posX !== undefined ? this.posX : this.position.x; },
        set(value) { 
          if (this.posX !== undefined) this.posX = value;
          else this.position.x = value;
        },
        configurable: true
      });
    }
    
    if (!('y' in entity)) {
      Object.defineProperty(entity, 'y', {
        get() { return this.posY !== undefined ? this.posY : this.position.y; },
        set(value) { 
          if (this.posY !== undefined) this.posY = value;
          else this.position.y = value;
        },
        configurable: true
      });
    }
    
    return { x, y };
  }

  /**
   * Create entity from Level Editor data object
   * @param {Object} levelEntityData - Entity data from level JSON
   * @returns {Object} Entity instance
   */
  createFromLevelData(levelEntityData) {
    console.log('[EntityFactory] DEBUG: createFromLevelData called:', levelEntityData);
    
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

    console.log('[EntityFactory] DEBUG: Creating entity:', type, 'at grid', gridX, gridY);
    
    // Create entity
    const entity = this.createEntity(type, gridX, gridY, properties, id);
    console.log('[EntityFactory] DEBUG: Entity created:', entity);
    return entity;
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
   * Create entity instance with proper constructor arguments
   * Each entity type has different constructor signatures
   * @private
   * @param {string} type - Entity type
   * @param {Function} EntityClass - Entity constructor
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} properties - Custom properties
   * @returns {Object} Entity instance
   */
  _createEntityInstance(type, EntityClass, worldX, worldY, properties) {
    const props = properties || {};
    
    switch (type) {
      case 'Ant':
        // ant constructor: (posX, posY, sizex, sizey, movementSpeed, rotation, img, JobName, faction)
        // CRITICAL: Use undefined instead of null for img to allow default parameter to work
        return new EntityClass(
          worldX,
          worldY,
          props.sizex || 20,           // Default ant size
          props.sizey || 20,
          props.movementSpeed || 20,   // Default movement speed
          props.rotation || 0,
          props.img || undefined,      // undefined allows default antBaseSprite parameter
          props.JobName || "Scout",
          props.faction || "player"
        );
        
      case 'Queen':
        // QueenAnt constructor: (baseAnt) - expects an ant object or null
        // If no baseAnt provided, it uses defaults (400, 300, 60, 60, 30, 0, Builder img)
        // We'll create it with null to use defaults, then override position via setPosition()
        const queen = new EntityClass(null);
        // Use Entity's setPosition method to properly update position
        if (typeof queen.setPosition === 'function') {
          queen.setPosition(worldX, worldY);
        } else {
          // Fallback if setPosition not available
          queen.posX = worldX;
          queen.posY = worldY;
        }
        // Note: Properties like health, movementSpeed, faction are set via constructor or are readonly
        // We don't override them here to avoid errors with readonly properties
        return queen;
        
      case 'Resource':
        // Resource constructor: (position, size, type, currencyType, amount)
        const position = typeof window !== 'undefined' ? window.createVector(worldX, worldY) : { x: worldX, y: worldY };
        const size = typeof window !== 'undefined' ? window.createVector(props.sizex || 32, props.sizey || 32) : { x: props.sizex || 32, y: props.sizey || 32 };
        return new EntityClass(
          position,
          size,
          props.resourceType || 'food',
          props.currencyType || 'food',
          props.amount || 50
        );
        
      case 'Building':
        // Building constructor: (x, y, properties)
        return new EntityClass(worldX, worldY, props);
        
      default:
        throw new Error(`Unknown entity type for instantiation: ${type}`);
    }
  }

  /**
   * Get default entity classes - REAL CLASSES ONLY
   * Maps Level Editor entity types to actual game classes
   * @private
   * @returns {Object} Map of entity type to class
   */
  _getDefaultEntityClasses() {
    // Browser environment - use global classes
    if (typeof window !== 'undefined') {
      const classes = {
        'Ant': window.ant,        // Note: class is lowercase 'ant'
        'Queen': window.QueenAnt, // Note: class is 'QueenAnt', not 'Queen'
        'Resource': window.Resource,
        'Building': window.Building
      };
      
      // Validate all classes exist
      const missingClasses = [];
      for (const [type, cls] of Object.entries(classes)) {
        if (!cls || typeof cls !== 'function') {
          missingClasses.push(`${type} (looking for window.${type === 'Ant' ? 'ant' : type === 'Queen' ? 'QueenAnt' : type})`);
        }
      }
      
      if (missingClasses.length > 0) {
        console.error('[EntityFactory] CRITICAL: Missing entity classes:', missingClasses);
        console.error('[EntityFactory] Checked for: window.ant, window.QueenAnt, window.Resource, window.Building');
        console.error('[EntityFactory] Actually found:', {
          ant: typeof window.ant,
          QueenAnt: typeof window.QueenAnt,
          Resource: typeof window.Resource,
          Building: typeof window.Building
        });
        throw new Error(`Entity classes not loaded: ${missingClasses.join(', ')}. Check index.html script loading order.`);
      }
      
      console.log('[EntityFactory] Successfully loaded entity classes:', Object.keys(classes));
      return classes;
    }

    // Node.js environment (testing only)
    try {
      const ant = require('../ants/ants');
      const QueenAnt = require('../ants/Queen');
      const Resource = require('../resources/Resource');
      const Building = require('../buildings/Building');

      return {
        'Ant': ant,
        'Queen': QueenAnt,
        'Resource': Resource,
        'Building': Building
      };
    } catch (e) {
      throw new Error(`Failed to load entity classes in Node.js: ${e.message}. Ensure classes are properly exported.`);
    }
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.EntityFactory = EntityFactory;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityFactory;
}
