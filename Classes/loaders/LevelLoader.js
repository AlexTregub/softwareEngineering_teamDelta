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
    
    // Template ID to Type mappings (Level Editor → Entity Type)
    this.templateMappings = {
      'ant_queen': 'Queen',
      'ant_worker': 'Ant',
      'ant_soldier': 'Ant',
      'resource_leaf': 'Resource',
      'resource_stick': 'Resource',
      'resource_food': 'Resource',
      'building_anthill': 'Building',
      'building_storage': 'Building'
    };
  }
  
  /**
   * Load level from JSON data
   * @param {Object} levelData - Level JSON (from Level Editor export)
   * @returns {Object} { success: bool, terrain?, entities?, errors? }
   */
  loadLevel(levelData) {
    console.log('[LevelLoader] DEBUG: loadLevel called');
    const errors = [];
    
    // Detect and normalize format (Level Editor vs Legacy)
    const format = this._detectFormat(levelData);
    console.log('[LevelLoader] DEBUG: Detected format:', format);
    
    const normalizedData = this._normalizeFormat(levelData, format);
    console.log('[LevelLoader] DEBUG: Data normalized');
    
    // Validate level data with LevelValidator (if enabled)
    if (this.validate && this.validator) {
      console.log('[LevelLoader] DEBUG: Validating level data...');
      const validationResult = this.validator.validate(normalizedData);
      if (!validationResult.valid) {
        console.error('[LevelLoader] DEBUG: Validation failed:', validationResult.errors);
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      console.log('[LevelLoader] DEBUG: Validation passed');
    }
    
    // Basic null check (fallback if validation disabled)
    if (!normalizedData) {
      return {
        success: false,
        errors: ['Level data is null or undefined']
      };
    }
    
    // Check required fields (normalized data should have terrain.tiles)
    if (!normalizedData.terrain) {
      errors.push('Missing required field: terrain');
    }
    
    if (!normalizedData.entities) {
      errors.push('Missing required field: entities');
    }
    
    // Validate field types
    if (normalizedData.terrain && typeof normalizedData.terrain !== 'object') {
      errors.push('Terrain must be an object');
    }
    
    if (normalizedData.entities && !Array.isArray(normalizedData.entities)) {
      errors.push('Entities must be an array');
    }
    
    // Validate terrain structure
    if (normalizedData.terrain && typeof normalizedData.terrain === 'object') {
      if (!normalizedData.terrain.tiles || !Array.isArray(normalizedData.terrain.tiles)) {
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
      console.log('[LevelLoader] DEBUG: Loading terrain...');
      const terrain = this._loadTerrain(normalizedData.terrain);
      console.log('[LevelLoader] DEBUG: Terrain loaded:', terrain ? terrain.constructor.name : 'null');
      
      // Spawn entities
      console.log('[LevelLoader] DEBUG: Spawning entities from data...', normalizedData.entities?.length, 'entities');
      const entities = this._spawnEntities(normalizedData.entities);
      console.log('[LevelLoader] DEBUG: Entities spawned:', entities.length);
      
      // Extract metadata
      const metadata = {
        id: normalizedData.id || levelData.id || 'unknown',
        name: normalizedData.name || levelData.name || null,
        description: normalizedData.description || levelData.description || null,
        author: normalizedData.author || levelData.author || null,
        version: normalizedData.version || levelData.version || null
      };
      
      console.log('[LevelLoader] DEBUG: Load complete - success:', true, 'entities:', entities.length);
      return {
        success: true,
        terrain,
        entities,
        metadata
      };
    } catch (error) {
      console.error('[LevelLoader] DEBUG: Load failed:', error.message);
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
    console.log('[LevelLoader] DEBUG: _spawnEntities called with', entitiesData.length, 'entities');
    const entities = [];
    
    entitiesData.forEach((entityData, index) => {
      try {
        console.log(`[LevelLoader] DEBUG: Spawning entity ${index + 1}/${entitiesData.length}:`, entityData.type, 'at grid', entityData.gridX, entityData.gridY);
        
        // Use custom entity factory if provided
        if (this.entityFactory) {
          const entity = this.entityFactory(entityData);
          entities.push(entity);
          console.log('[LevelLoader] DEBUG: Entity created via custom factory');
          return;
        }
        
        // Use EntityFactory instance
        if (this._entityFactoryInstance) {
          console.log('[LevelLoader] DEBUG: Using EntityFactory instance...');
          const entity = this._entityFactoryInstance.createFromLevelData(entityData);
          entities.push(entity);
          console.log('[LevelLoader] DEBUG: Entity created:', entity.type, 'at world', entity.x, entity.y);
          return;
        }
        
        // Fallback: old entity spawning method
        console.log('[LevelLoader] DEBUG: Using fallback entity creation...');
        const entity = this._createEntity(entityData);
        if (entity) {
          entities.push(entity);
          console.log('[LevelLoader] DEBUG: Entity created via fallback');
        }
      } catch (error) {
        // Skip invalid entities (log error but continue loading)
        console.warn(`[LevelLoader] Failed to spawn entity ${entityData.id}:`, error.message);
      }
    });
    
    console.log('[LevelLoader] DEBUG: _spawnEntities complete -', entities.length, 'entities created');
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
  
  /**
   * Detect JSON format (Level Editor vs Legacy)
   * @private
   * @param {Object} levelData - Raw level JSON
   * @returns {string} 'levelEditor' or 'legacy'
   */
  _detectFormat(levelData) {
    // Level Editor format has tiles at root level
    if (levelData.tiles && Array.isArray(levelData.tiles)) {
      return 'levelEditor';
    }
    
    // Legacy format has terrain.tiles
    if (levelData.terrain && levelData.terrain.tiles) {
      return 'legacy';
    }
    
    // Default to levelEditor if ambiguous
    return 'levelEditor';
  }
  
  /**
   * Normalize JSON format to internal structure
   * Converts Level Editor format → Legacy format for internal processing
   * @private
   * @param {Object} levelData - Raw level JSON
   * @param {string} format - Detected format ('levelEditor' or 'legacy')
   * @returns {Object} Normalized level data
   */
  _normalizeFormat(levelData, format) {
    if (format === 'legacy') {
      // Already in correct format, just normalize entities
      return {
        ...levelData,
        entities: levelData.entities.map(e => this._normalizeEntity(e))
      };
    }
    
    // Convert Level Editor format to legacy format
    const normalized = {
      ...levelData,
      terrain: {
        type: 'sparse',
        tiles: levelData.tiles || []
      },
      entities: (levelData.entities || []).map(e => this._normalizeEntity(e))
    };
    
    // Remove tiles from root level
    delete normalized.tiles;
    
    return normalized;
  }
  
  /**
   * Normalize entity format
   * Converts templateId → type, gridX/gridY → gridPosition
   * @private
   * @param {Object} entityData - Raw entity data
   * @returns {Object} Normalized entity data
   */
  _normalizeEntity(entityData) {
    const normalized = { ...entityData };
    
    // Convert templateId to type
    if (entityData.templateId && !entityData.type) {
      normalized.type = this._templateIdToType(entityData.templateId);
    }
    
    // Convert gridX/gridY to gridPosition
    if ((entityData.gridX !== undefined || entityData.gridY !== undefined) && !entityData.gridPosition) {
      normalized.gridPosition = {
        x: entityData.gridX !== undefined ? entityData.gridX : 0,
        y: entityData.gridY !== undefined ? entityData.gridY : 0
      };
    }
    
    return normalized;
  }
  
  /**
   * Map templateId to entity type
   * @private
   * @param {string} templateId - Template ID from Level Editor
   * @returns {string|null} Entity type or null if unknown
   */
  _templateIdToType(templateId) {
    // Direct mapping
    if (this.templateMappings[templateId]) {
      return this.templateMappings[templateId];
    }
    
    // Pattern matching for dynamic templates
    if (templateId.startsWith('ant_')) {
      return 'Ant'; // Default all ant types to Ant
    }
    
    if (templateId.startsWith('resource_')) {
      return 'Resource';
    }
    
    if (templateId.startsWith('building_')) {
      return 'Building';
    }
    
    // Unknown template
    return null;
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
