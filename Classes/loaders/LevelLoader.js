/**
 * LevelLoader.js
 * Custom Level Loading System - Parse level JSON and instantiate game world
 * Part of Custom Level Loading - Phase 2.1
 * 
 * PURPOSE:
 * - Load custom levels from Level Editor JSON export
 * - Parse terrain data → create terrain instance
 * - Parse entities data → spawn entities with world coordinates
 * - Validate level data and provide error feedback
 * 
 * USAGE:
 *   const loader = new LevelLoader();
 *   const result = loader.loadLevel(levelJSON);
 *   if (result.success) {
 *     const { terrain, entities } = result;
 *     // Use terrain and entities in game
 *   } else {
 *     console.error('Load failed:', result.errors);
 *   }
 * 
 * COORDINATE SYSTEM:
 * - Level JSON stores entity positions as GRID coordinates (tile-based)
 * - LevelLoader converts grid → world pixel coordinates
 * - Formula: worldX = gridX * TILE_SIZE, worldY = gridY * TILE_SIZE
 */

class LevelLoader {
  /**
   * Create LevelLoader instance
   * @param {Object} options - Configuration options
   * @param {Function} options.terrainFactory - Custom terrain factory (terrainData) => terrain
   * @param {Function} options.entityFactory - Custom entity factory (entityData) => entity
   * @param {boolean} options.validate - Enable automatic validation (default: true)
   * @param {Object} options.validatorOptions - Options for LevelValidator
   */
  constructor(options = {}) {
    this.terrainFactory = options.terrainFactory || null;
    this.entityFactory = options.entityFactory || null;
    this.validate = options.validate !== undefined ? options.validate : true;
    this.validatorOptions = options.validatorOptions || {};
    
    // Get LevelValidator if validation enabled
    if (this.validate) {
      this.validator = this._getLevelValidator();
    }
    
    // Get EntityFactory if no custom entity factory provided
    if (!this.entityFactory) {
      this._entityFactoryInstance = this._getEntityFactory();
    }
  }
  
  /**
   * Load level from JSON data
   * @param {Object} levelData - Level JSON (from Level Editor export)
   * @returns {Object} { success: bool, terrain?, entities?, errors? }
   */
  loadLevel(levelData) {
    const errors = [];
    
    // Validate level data with LevelValidator (if enabled)
    if (this.validate && this.validator) {
      const validationResult = this.validator.validate(levelData);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
    }
    
    // Basic null check (fallback if validation disabled)
    if (!levelData) {
      return {
        success: false,
        errors: ['Level data is null or undefined']
      };
    }
    
    // Check required fields
    if (!levelData.terrain) {
      errors.push('Missing required field: terrain');
    }
    
    if (!levelData.entities) {
      errors.push('Missing required field: entities');
    }
    
    // Validate field types
    if (levelData.terrain && typeof levelData.terrain !== 'object') {
      errors.push('Terrain must be an object');
    }
    
    if (levelData.entities && !Array.isArray(levelData.entities)) {
      errors.push('Entities must be an array');
    }
    
    // Validate terrain structure
    if (levelData.terrain && typeof levelData.terrain === 'object') {
      if (!levelData.terrain.tiles || !Array.isArray(levelData.terrain.tiles)) {
        errors.push('Terrain must have a tiles array');
      }
    }
    
    // Return early if validation failed
    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }
    
    try {
      // Load terrain
      const terrain = this._loadTerrain(levelData.terrain);
      
      // Spawn entities
      const entities = this._spawnEntities(levelData.entities);
      
      // Extract metadata
      const metadata = {
        id: levelData.id || 'unknown',
        name: levelData.name || null,
        description: levelData.description || null,
        author: levelData.author || null,
        version: levelData.version || null
      };
      
      return {
        success: true,
        terrain,
        entities,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
  
  /**
   * Load terrain from terrain data
   * @private
   * @param {Object} terrainData - Terrain configuration
   * @returns {Object} Terrain instance (SparseTerrain or GridTerrain)
   */
  _loadTerrain(terrainData) {
    // Use custom terrain factory if provided
    if (this.terrainFactory) {
      return this.terrainFactory(terrainData);
    }
    
    // Default terrain loading
    const terrainType = terrainData.type || 'sparse';
    
    if (terrainType === 'sparse') {
      // Load SparseTerrain (Level Editor terrain)
      const SparseTerrain = this._getSparseTerrain();
      const terrain = new SparseTerrain(32, 'grass');
      
      // Populate tiles
      if (terrainData.tiles && Array.isArray(terrainData.tiles)) {
        terrainData.tiles.forEach(tile => {
          // Support both formats: gridX/gridY (Level Editor) and x/y
          const tileX = tile.gridX !== undefined ? tile.gridX : tile.x;
          const tileY = tile.gridY !== undefined ? tile.gridY : tile.y;
          terrain.setTile(tileX, tileY, tile.material);
        });
      }
      
      return terrain;
    } else if (terrainType === 'grid') {
      // Load GridTerrain (procedural terrain)
      const gridTerrain = this._getGridTerrain();
      const width = terrainData.width || 3;
      const height = terrainData.height || 3;
      const seed = terrainData.seed || 12345;
      
      return new gridTerrain(width, height, seed);
    }
    
    throw new Error(`Unknown terrain type: ${terrainType}`);
  }
  
  /**
   * Spawn entities from entities data
   * @private
   * @param {Array} entitiesData - Array of entity configurations
   * @returns {Array} Spawned entities
   */
  _spawnEntities(entitiesData) {
    const entities = [];
    
    entitiesData.forEach(entityData => {
      try {
        // Use custom entity factory if provided
        if (this.entityFactory) {
          const entity = this.entityFactory(entityData);
          entities.push(entity);
          return;
        }
        
        // Use EntityFactory instance
        if (this._entityFactoryInstance) {
          const entity = this._entityFactoryInstance.createFromLevelData(entityData);
          entities.push(entity);
          return;
        }
        
        // Fallback: old entity spawning method
        const entity = this._createEntity(entityData);
        if (entity) {
          entities.push(entity);
        }
      } catch (error) {
        // Skip invalid entities (log error but continue loading)
        console.warn(`Failed to spawn entity ${entityData.id}:`, error.message);
      }
    });
    
    return entities;
  }
  
  /**
   * Create entity from entity data
   * @private
   * @param {Object} entityData - Entity configuration
   * @returns {Object|null} Entity instance or null if invalid
   */
  _createEntity(entityData) {
    const validTypes = ['Ant', 'Queen', 'Resource', 'Building'];
    
    // Validate entity type
    if (!validTypes.includes(entityData.type)) {
      return null;
    }
    
    // Convert grid coordinates to world coordinates
    const world = this.gridToWorld(
      entityData.gridPosition.x,
      entityData.gridPosition.y
    );
    
    // Create entity object (simplified for testing)
    const entity = {
      id: entityData.id,
      type: entityData.type,
      position: {
        x: world.x,
        y: world.y
      },
      properties: entityData.properties || {}
    };
    
    return entity;
  }
  
  /**
   * Convert grid coordinates to world pixel coordinates
   * @param {int} gridX - Grid X coordinate
   * @param {int} gridY - Grid Y coordinate
   * @returns {Object} { x: worldX, y: worldY }
   */
  gridToWorld(gridX, gridY) {
    const TILE_SIZE = typeof global !== 'undefined' && global.TILE_SIZE ? global.TILE_SIZE : 32;
    
    return {
      x: gridX * TILE_SIZE,
      y: gridY * TILE_SIZE
    };
  }
  
  /**
   * Get SparseTerrain class (with fallback for testing)
   * @private
   */
  _getSparseTerrain() {
    // Try browser global
    if (typeof window !== 'undefined' && window.SparseTerrain) {
      return window.SparseTerrain;
    }
    
    // Try Node.js require
    try {
      return require('../terrainUtils/SparseTerrain');
    } catch (e) {
      // Fallback mock for testing
      return class MockSparseTerrain {
        constructor(tileSize, defaultMaterial) {
          this.tileSize = tileSize;
          this.defaultMaterial = defaultMaterial;
          this.tiles = new Map();
        }
        setTile(x, y, material) {
          this.tiles.set(`${x},${y}`, { x, y, material });
        }
      };
    }
  }
  
  /**
   * Get gridTerrain class (with fallback for testing)
   * @private
   */
  _getGridTerrain() {
    // Try browser global
    if (typeof window !== 'undefined' && window.gridTerrain) {
      return window.gridTerrain;
    }
    
    // Try Node.js global
    if (typeof global !== 'undefined' && global.gridTerrain) {
      return global.gridTerrain;
    }
    
    // Fallback mock for testing
    return class MockGridTerrain {
      constructor(width, height, seed) {
        this.width = width;
        this.height = height;
        this.seed = seed;
      }
    };
  }
  
  /**
   * Get LevelValidator class (with fallback for testing)
   * @private
   */
  _getLevelValidator() {
    // Try browser global
    if (typeof window !== 'undefined' && window.LevelValidator) {
      return new window.LevelValidator(this.validatorOptions);
    }
    
    // Try Node.js require
    try {
      const LevelValidator = require('../validators/LevelValidator');
      return new LevelValidator(this.validatorOptions);
    } catch (e) {
      // Validation disabled if LevelValidator not available
      console.warn('LevelValidator not available, validation disabled');
      return null;
    }
  }
  
  /**
   * Get EntityFactory instance (with fallback for testing)
   * @private
   */
  _getEntityFactory() {
    // Try browser global
    if (typeof window !== 'undefined' && window.EntityFactory) {
      return new window.EntityFactory();
    }
    
    // Try Node.js require
    try {
      const EntityFactory = require('../factories/EntityFactory');
      return new EntityFactory();
    } catch (e) {
      // EntityFactory not available, will use fallback entity creation
      console.warn('EntityFactory not available, using fallback entity creation');
      return null;
    }
  }
}

// Global export (browser)
if (typeof window !== 'undefined') {
  window.LevelLoader = LevelLoader;
}

// CommonJS export (Node.js for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelLoader;
}
