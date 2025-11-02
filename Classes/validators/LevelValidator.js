/**
 * LevelValidator
 * Validates Level Editor JSON exports before loading
 * 
 * Validates:
 * - Required fields (terrain, entities)
 * - Field types (objects, arrays)
 * - Terrain structure (tiles array, coordinates, materials)
 * - Entity structure (id, type, gridPosition, properties)
 * - Bounds (max entities, max tiles, coordinate limits)
 * - Entity types against allowed list
 * 
 * Usage:
 *   const validator = new LevelValidator();
 *   const result = validator.validate(levelData);
 *   if (!result.valid) {
 *     console.error('Validation errors:', result.errors);
 *   }
 */

class LevelValidator {
  /**
   * Create a new LevelValidator
   * @param {Object} options - Validation options
   * @param {number} options.maxEntities - Maximum allowed entities (default: 10000)
   * @param {number} options.maxTiles - Maximum allowed tiles (default: 100000)
   * @param {number} options.maxCoordinate - Maximum coordinate value (default: 10000)
   * @param {Array<string>} options.allowedEntityTypes - Allowed entity types (default: ['Ant', 'Queen', 'Resource', 'Building'])
   */
  constructor(options = {}) {
    this.maxEntities = options.maxEntities || 10000;
    this.maxTiles = options.maxTiles || 100000;
    this.maxCoordinate = options.maxCoordinate || 10000;
    this.allowedEntityTypes = options.allowedEntityTypes || ['Ant', 'Queen', 'Resource', 'Building'];
  }

  /**
   * Validate level data
   * @param {Object} levelData - Level JSON data
   * @returns {Object} { valid: bool, errors: Array<string> }
   */
  validate(levelData) {
    const errors = [];

    // Check null/undefined
    if (levelData === null || levelData === undefined) {
      return {
        valid: false,
        errors: ['Level data is null or undefined']
      };
    }

    // Validate required fields
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
      this._validateTerrain(levelData.terrain, errors);
    }

    // Validate entities
    if (levelData.entities && Array.isArray(levelData.entities)) {
      this._validateEntities(levelData.entities, errors);
    }

    // Validate bounds
    if (levelData.entities && Array.isArray(levelData.entities)) {
      if (levelData.entities.length > this.maxEntities) {
        errors.push(`Too many entities: ${levelData.entities.length} exceeds max of ${this.maxEntities}`);
      }
    }

    if (levelData.terrain && levelData.terrain.tiles && Array.isArray(levelData.terrain.tiles)) {
      if (levelData.terrain.tiles.length > this.maxTiles) {
        errors.push(`Too many tiles: ${levelData.terrain.tiles.length} exceeds max of ${this.maxTiles}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : []
    };
  }

  /**
   * Validate terrain structure
   * @private
   * @param {Object} terrain - Terrain data
   * @param {Array<string>} errors - Error accumulator
   */
  _validateTerrain(terrain, errors) {
    // Check for tiles array
    if (!terrain.tiles) {
      errors.push('Terrain must have a tiles array');
      return;
    }

    if (!Array.isArray(terrain.tiles)) {
      errors.push('Terrain tiles must be an array');
      return;
    }

    // Validate each tile
    terrain.tiles.forEach((tile, index) => {
      this._validateTile(tile, index, errors);
    });
  }

  /**
   * Validate individual tile
   * @private
   * @param {Object} tile - Tile data
   * @param {number} index - Tile index in array
   * @param {Array<string>} errors - Error accumulator
   */
  _validateTile(tile, index, errors) {
    // Check coordinates (supports both gridX/gridY and x/y)
    const hasGridCoords = tile.gridX !== undefined && tile.gridY !== undefined;
    const hasXYCoords = tile.x !== undefined && tile.y !== undefined;

    if (!hasGridCoords && !hasXYCoords) {
      errors.push(`Tile at index ${index}: Missing coordinates (gridX/gridY or x/y required)`);
      return;
    }

    // Check coordinate types
    const x = tile.gridX !== undefined ? tile.gridX : tile.x;
    const y = tile.gridY !== undefined ? tile.gridY : tile.y;

    if (typeof x !== 'number' || typeof y !== 'number') {
      errors.push(`Tile at index ${index}: Coordinates must be numbers`);
      return;
    }

    // Check coordinate bounds (allow negative for SparseTerrain)
    if (Math.abs(x) > this.maxCoordinate || Math.abs(y) > this.maxCoordinate) {
      errors.push(`Tile at index ${index}: Coordinates (${x}, ${y}) out of bounds (max: ±${this.maxCoordinate})`);
    }

    // Check material
    if (!tile.material) {
      errors.push(`Tile at index ${index}: Missing material property`);
    }
  }

  /**
   * Validate entities array
   * @private
   * @param {Array} entities - Entities data
   * @param {Array<string>} errors - Error accumulator
   */
  _validateEntities(entities, errors) {
    entities.forEach((entity, index) => {
      this._validateEntity(entity, index, errors);
    });
  }

  /**
   * Validate individual entity
   * @private
   * @param {Object} entity - Entity data
   * @param {number} index - Entity index in array
   * @param {Array<string>} errors - Error accumulator
   */
  _validateEntity(entity, index, errors) {
    // Check id
    if (!entity.id) {
      errors.push(`Entity at index ${index}: Missing id property`);
    }

    // Check type
    if (!entity.type) {
      errors.push(`Entity at index ${index}: Missing type property`);
      return;
    }

    // Check if type is allowed
    if (!this.allowedEntityTypes.includes(entity.type)) {
      errors.push(`Entity at index ${index}: Invalid type '${entity.type}' (allowed: ${this.allowedEntityTypes.join(', ')})`);
    }

    // Check gridPosition
    if (!entity.gridPosition) {
      errors.push(`Entity at index ${index}: Missing gridPosition property`);
      return;
    }

    if (typeof entity.gridPosition !== 'object') {
      errors.push(`Entity at index ${index}: gridPosition must be an object`);
      return;
    }

    if (entity.gridPosition.x === undefined || entity.gridPosition.y === undefined) {
      errors.push(`Entity at index ${index}: gridPosition must have x and y properties`);
      return;
    }

    // Check coordinate types
    if (typeof entity.gridPosition.x !== 'number' || typeof entity.gridPosition.y !== 'number') {
      errors.push(`Entity at index ${index}: gridPosition coordinates must be numbers`);
      return;
    }

    // Check coordinate bounds (allow negative)
    const x = entity.gridPosition.x;
    const y = entity.gridPosition.y;
    if (Math.abs(x) > this.maxCoordinate || Math.abs(y) > this.maxCoordinate) {
      errors.push(`Entity at index ${index}: Coordinates (${x}, ${y}) out of bounds (max: ±${this.maxCoordinate})`);
    }
  }
}

// Export for both browser and Node.js
if (typeof window !== 'undefined') {
  window.LevelValidator = LevelValidator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelValidator;
}
