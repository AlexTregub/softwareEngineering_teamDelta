/**
 * EntityPainter
 * Handles entity placement, removal, and JSON export/import for Level Editor
 * CRITICAL: All positions stored as grid coordinates, converted to world coordinates
 */

class EntityPainter {
  /**
   * Eraser mode enumeration
   * @static
   */
  static ERASER_MODE = {
    ALL: 'ALL',         // Erase everything (entities, terrain, events)
    TERRAIN: 'TERRAIN', // Erase terrain only
    ENTITY: 'ENTITY',   // Erase entities only
    EVENTS: 'EVENTS'    // Erase events only
  };
  
  constructor(paletteOrEntities = null, terrain = null, events = null) {
    // Backward compatibility: detect if first parameter is EntityPalette or entities array
    const isEntityPalette = paletteOrEntities && 
                           typeof paletteOrEntities === 'object' && 
                           !Array.isArray(paletteOrEntities) &&
                           (paletteOrEntities.constructor.name === 'EntityPalette' || 
                            typeof paletteOrEntities.getSelectedTemplate === 'function');
    
    if (isEntityPalette) {
      // OLD SIGNATURE: constructor(palette) - for LevelEditor compatibility
      this.palette = paletteOrEntities;
      this.placedEntities = [];
      this.terrain = null;
      this.events = null;
    } else {
      // NEW SIGNATURE: constructor(placedEntities, terrain, events)
      // Load EntityPalette class (browser or Node.js)
      let EntityPaletteClass = null;
      if (typeof EntityPalette !== 'undefined') {
        EntityPaletteClass = EntityPalette;
      } else if (typeof global !== 'undefined' && global.EntityPalette) {
        EntityPaletteClass = global.EntityPalette;
      } else if (typeof require !== 'undefined') {
        try {
          const module = require('./EntityPalette');
          EntityPaletteClass = module.EntityPalette || module;
        } catch (e) {
          // EntityPalette not available
        }
      }
      
      this.palette = EntityPaletteClass ? new EntityPaletteClass() : null;
      this.placedEntities = Array.isArray(paletteOrEntities) ? paletteOrEntities : [];
      this.terrain = terrain || null;
      this.events = events || null;
    }
    
    this.hoverPreview = null;
    
    // Eraser mode (default to ALL)
    this.eraserMode = EntityPainter.ERASER_MODE.ALL;
  }
  
  /**
   * Place an entity at grid coordinates
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object|null} Created entity or null if failed
   */
  placeEntity(gridX, gridY) {
    if (!this.palette) {
      return null;
    }
    
    const template = this.palette.getSelectedTemplate();
    if (!template) {
      return null;
    }
    
    // Convert grid coordinates to world coordinates
    const TILE_SIZE = (typeof global !== 'undefined' && global.TILE_SIZE) ? global.TILE_SIZE : 32;
    const worldX = gridX * TILE_SIZE;
    const worldY = gridY * TILE_SIZE;
    
    let entity = null;
    
    // Create entity based on type
    switch (this.palette.getCurrentCategory()) {
      case 'entities':
        entity = this._createAnt(worldX, worldY, template);
        break;
      case 'resources':
        entity = this._createResource(worldX, worldY, template);
        break;
      case 'buildings':
        entity = this._createBuilding(worldX, worldY, template);
        break;
    }
    
    if (entity) {
      this.placedEntities.push(entity);
      
      // Register with spatial grid if available
      if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
        spatialGridManager.addEntity(entity);
      }
    }
    
    return entity;
  }
  
  /**
   * Create an ant entity
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} template - Ant template
   * @returns {Object} Created ant
   * @private
   */
  _createAnt(worldX, worldY, template) {
    const props = template.properties;
    
    // Use global ant class if available
    if (typeof ant !== 'undefined') {
      return new ant(
        worldX,
        worldY,
        32, // width
        32, // height
        props.movementSpeed || 30,
        0, // rotation
        null, // image (will be loaded)
        props.JobName,
        props.faction || 'player'
      );
    }
    
    // Fallback for testing
    return {
      type: 'Ant',
      posX: worldX,
      posY: worldY,
      JobName: props.JobName,
      faction: props.faction || 'player',
      health: props.health || 100,
      movementSpeed: props.movementSpeed || 30,
      getPosition: function() { return { x: this.posX, y: this.posY }; }
    };
  }
  
  /**
   * Create a resource entity
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} template - Resource template
   * @returns {Object} Created resource
   * @private
   */
  _createResource(worldX, worldY, template) {
    // Create simple resource entity
    // Note: Real ResourceSystemManager integration would go here if needed
    const props = template.properties;
    return {
      type: template.resourceType,
      posX: worldX,
      posY: worldY,
      canBePickedUp: props.canBePickedUp,
      weight: props.weight,
      getPosition: function() { return { x: this.posX, y: this.posY }; }
    };
  }
  
  /**
   * Create a building entity
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} template - Building template
   * @returns {Object} Created building
   * @private
   */
  _createBuilding(worldX, worldY, template) {
    const props = template.properties;
    
    // Create building entity
    return {
      type: 'Building',
      buildingType: props.buildingType,
      posX: worldX,
      posY: worldY,
      size: template.size,
      capacity: props.capacity,
      getPosition: function() { return { x: this.posX, y: this.posY }; }
    };
  }
  
  /**
   * Find entity at a position
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {number} radius - Search radius
   * @returns {Object|null} Found entity or null
   */
  getEntityAtPosition(worldX, worldY, radius) {
    for (const entity of this.placedEntities) {
      const pos = entity.getPosition ? entity.getPosition() : { x: entity.posX, y: entity.posY };
      const dx = pos.x - worldX;
      const dy = pos.y - worldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= radius) {
        return entity;
      }
    }
    
    return null;
  }
  
  /**
   * Remove an entity
   * @param {Object} entity - Entity to remove
   */
  removeEntity(entity) {
    const index = this.placedEntities.indexOf(entity);
    if (index !== -1) {
      this.placedEntities.splice(index, 1);
      
      // Unregister from spatial grid if available
      if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
        spatialGridManager.removeEntity(entity);
      }
    }
  }
  
  /**
   * Export entities to JSON (single file format)
   * CRITICAL: Stores grid coordinates, not world coordinates
   * @returns {Object} JSON object with entities array
   */
  exportToJSON() {
    const TILE_SIZE = (typeof global !== 'undefined' && global.TILE_SIZE) ? global.TILE_SIZE : 32;
    
    const entities = this.placedEntities.map(entity => {
      const pos = entity.getPosition ? entity.getPosition() : { x: entity.posX, y: entity.posY };
      
      // Convert world coordinates to grid coordinates
      const gridX = Math.floor(pos.x / TILE_SIZE);
      const gridY = Math.floor(pos.y / TILE_SIZE);
      
      // Build entity data
      const entityData = {
        id: entity._id || entity.id || `entity_${Date.now()}_${Math.random()}`,
        type: entity.type,
        gridPosition: { x: gridX, y: gridY },
        properties: {}
      };
      
      // Extract properties based on entity type
      if (entity.type === 'Ant') {
        entityData.properties.JobName = entity.JobName;
        entityData.properties.faction = entity.faction;
        entityData.properties.health = entity.health;
        entityData.properties.movementSpeed = entity.movementSpeed;
      } else if (entity.type === 'Building') {
        entityData.properties.buildingType = entity.buildingType;
        entityData.properties.size = entity.size;
        entityData.properties.capacity = entity.capacity;
      } else {
        // Resource
        entityData.properties.canBePickedUp = entity.canBePickedUp;
        entityData.properties.weight = entity.weight;
      }
      
      return entityData;
    });
    
    return { entities };
  }
  
  /**
   * Import entities from JSON (single file format)
   * CRITICAL: Reads grid coordinates, converts to world coordinates
   * @param {Object} json - JSON object with entities array
   */
  importFromJSON(json) {
    if (!json || !json.entities) {
      return;
    }
    
    // Clear existing entities
    this.placedEntities.forEach(entity => {
      if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
        spatialGridManager.removeEntity(entity);
      }
    });
    this.placedEntities = [];
    
    const TILE_SIZE = (typeof global !== 'undefined' && global.TILE_SIZE) ? global.TILE_SIZE : 32;
    
    // Recreate entities from JSON
    json.entities.forEach(entityData => {
      if (!entityData.gridPosition) {
        return; // Skip invalid data
      }
      
      // Convert grid coordinates to world coordinates
      const worldX = entityData.gridPosition.x * TILE_SIZE;
      const worldY = entityData.gridPosition.y * TILE_SIZE;
      
      let entity = null;
      const props = entityData.properties || {};
      
      // Create entity based on type
      switch (entityData.type) {
        case 'Ant':
          if (typeof ant !== 'undefined') {
            entity = new ant(
              worldX, worldY, 32, 32,
              props.movementSpeed || 30,
              0, null,
              props.JobName,
              props.faction || 'player'
            );
            // Override properties from JSON (use private properties for read-only getters)
            if (props.health !== undefined) entity._health = props.health;
            if (props.movementSpeed !== undefined) entity.movementSpeed = props.movementSpeed;
          } else {
            entity = {
              type: 'Ant',
              posX: worldX,
              posY: worldY,
              JobName: props.JobName,
              faction: props.faction,
              health: props.health,
              movementSpeed: props.movementSpeed,
              getPosition: function() { return { x: this.posX, y: this.posY }; }
            };
          }
          break;
          
        case 'Building':
          // Add centering offset (Entity class adds +0.5 tile = 16px)
          entity = {
            type: 'Building',
            buildingType: props.buildingType,
            posX: worldX + 16,
            posY: worldY + 16,
            size: props.size,
            capacity: props.capacity,
            getPosition: function() { return { x: this.posX, y: this.posY }; }
          };
          break;
          
        default:
          // Resource - create simple resource entity with centering offset
          entity = {
            type: entityData.type,
            posX: worldX + 16,
            posY: worldY + 16,
            canBePickedUp: props.canBePickedUp !== undefined ? props.canBePickedUp : true,
            weight: props.weight !== undefined ? props.weight : 0.5,
            getPosition: function() { return { x: this.posX, y: this.posY }; }
          };
          break;
      }
      
      if (entity) {
        this.placedEntities.push(entity);
        
        // Register with spatial grid if available
        if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
          spatialGridManager.addEntity(entity);
        }
      }
    });
  }
  
  /**
   * Set eraser mode
   * @param {string} mode - Eraser mode (ALL, TERRAIN, ENTITY, EVENTS)
   * @returns {EntityPainter} Returns this for method chaining
   */
  setEraserMode(mode) {
    const validModes = Object.values(EntityPainter.ERASER_MODE);
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid eraser mode: ${mode}. Valid modes are: ${validModes.join(', ')}`);
    }
    this.eraserMode = mode;
    return this;
  }
  
  /**
   * Get current eraser mode
   * @returns {string} Current eraser mode
   */
  getEraserMode() {
    return this.eraserMode;
  }
  
  /**
   * Handle erase action at position (handles both grid and world coordinates)
   * @param {number} x - X coordinate (grid or world)
   * @param {number} y - Y coordinate (grid or world)
   */
  handleErase(x, y) {
    const TILE_SIZE = (typeof global !== 'undefined' && global.TILE_SIZE) ? global.TILE_SIZE : 32;
    
    // Auto-detect if input is world or grid coordinates
    // If value is >= TILE_SIZE, assume it's world coords and convert
    // Otherwise, assume it's already grid coords
    let gridX, gridY;
    
    if (x >= TILE_SIZE || y >= TILE_SIZE) {
      // World coordinates - convert to grid
      gridX = Math.floor(x / TILE_SIZE);
      gridY = Math.floor(y / TILE_SIZE);
    } else {
      // Already grid coordinates
      gridX = x;
      gridY = y;
    }
    
    const worldX = gridX * TILE_SIZE;
    const worldY = gridY * TILE_SIZE;
    
    switch (this.eraserMode) {
      case EntityPainter.ERASER_MODE.ALL:
        this._eraseEntities(gridX, gridY, worldX, worldY);
        this._eraseTerrain(gridX, gridY);
        this._eraseEvents(gridX, gridY);
        break;
        
      case EntityPainter.ERASER_MODE.ENTITY:
        this._eraseEntities(gridX, gridY, worldX, worldY);
        break;
        
      case EntityPainter.ERASER_MODE.TERRAIN:
        this._eraseTerrain(gridX, gridY);
        break;
        
      case EntityPainter.ERASER_MODE.EVENTS:
        this._eraseEvents(gridX, gridY);
        break;
    }
  }
  
  /**
   * Erase entities at grid position
   * @private
   */
  _eraseEntities(gridX, gridY, worldX, worldY) {
    if (!this.placedEntities || this.placedEntities.length === 0) return;
    
    // Find entities at this grid position
    const entitiesToRemove = [];
    
    this.placedEntities.forEach(entity => {
      let entityGridX, entityGridY;
      
      // Handle entities with grid coordinates directly
      if (entity.gridX !== undefined && entity.gridY !== undefined) {
        entityGridX = entity.gridX;
        entityGridY = entity.gridY;
      } else {
        // Handle entities with world coordinates
        const pos = entity.getPosition ? entity.getPosition() : { x: entity.posX, y: entity.posY };
        entityGridX = Math.floor(pos.x / 32);
        entityGridY = Math.floor(pos.y / 32);
      }
      
      if (entityGridX === gridX && entityGridY === gridY) {
        entitiesToRemove.push(entity);
      }
    });
    
    // Remove entities
    entitiesToRemove.forEach(entity => {
      const index = this.placedEntities.indexOf(entity);
      if (index !== -1) {
        this.placedEntities.splice(index, 1);
      }
      
      // Remove from spatial grid if available
      if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
        spatialGridManager.removeEntity(entity);
      }
    });
  }
  
  /**
   * Erase terrain at grid position (reset to default)
   * @private
   */
  _eraseTerrain(gridX, gridY) {
    if (!this.terrain) return;
    
    // Support both SparseTerrain (.tiles) and MapManager (.grid)
    const gridMap = this.terrain.tiles || this.terrain.grid;
    if (!gridMap) return;
    
    const gridKey = `${gridX},${gridY}`;
    const tile = gridMap.get(gridKey);
    
    if (tile) {
      // Reset to default terrain type (GRASS)
      tile.type = 'GRASS';
    }
  }
  
  /**
   * Erase events at grid position
   * @private
   */
  _eraseEvents(gridX, gridY) {
    if (!this.events) return;
    
    // Handle EventFlagLayer (Map-based)
    if (this.events.flags && this.events.flags instanceof Map) {
      const flagsToRemove = [];
      const TILE_SIZE = (typeof global !== 'undefined' && global.TILE_SIZE) ? global.TILE_SIZE : 32;
      
      // Find flags at this grid position
      this.events.flags.forEach((flag, flagId) => {
        // Calculate grid position from world coords if gridX/gridY not present
        let flagGridX = flag.gridX;
        let flagGridY = flag.gridY;
        
        if (flagGridX === undefined && flag.x !== undefined) {
          flagGridX = Math.floor(flag.x / TILE_SIZE);
        }
        if (flagGridY === undefined && flag.y !== undefined) {
          flagGridY = Math.floor(flag.y / TILE_SIZE);
        }
        
        if (flagGridX === gridX && flagGridY === gridY) {
          flagsToRemove.push(flagId);
        }
      });
      
      // Remove flags using EventFlagLayer's removeFlag method
      flagsToRemove.forEach(flagId => {
        if (typeof this.events.removeFlag === 'function') {
          this.events.removeFlag(flagId);
        }
      });
      return;
    }
    
    // Handle plain array format (for tests and backward compatibility)
    if (Array.isArray(this.events) && this.events.length > 0) {
      // Filter out events at this grid position
      const remaining = this.events.filter(event => {
        return !(event.gridX === gridX && event.gridY === gridY);
      });
      
      // Update array in place to maintain reference
      this.events.length = 0;
      this.events.push(...remaining);
    }
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.EntityPainter = EntityPainter;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityPainter;
}
