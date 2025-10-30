/**
 * EntityPainter
 * Handles entity placement, removal, and JSON export/import for Level Editor
 * CRITICAL: All positions stored as grid coordinates, converted to world coordinates
 */

class EntityPainter {
  constructor() {
    // Load EntityPalette if available
    const EntityPaletteClass = (typeof EntityPalette !== 'undefined') ? EntityPalette : 
                                (typeof require !== 'undefined' ? require('./EntityPalette') : null);
    
    this.palette = EntityPaletteClass ? new EntityPaletteClass() : null;
    this.placedEntities = [];
    this.hoverPreview = null;
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
    // Use global ResourceSystemManager if available
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager) {
      return g_resourceManager.createResource(
        template.resourceType,
        worldX,
        worldY
      );
    }
    
    // Fallback for testing
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
          entity = {
            type: 'Building',
            buildingType: props.buildingType,
            posX: worldX,
            posY: worldY,
            size: props.size,
            capacity: props.capacity,
            getPosition: function() { return { x: this.posX, y: this.posY }; }
          };
          break;
          
        default:
          // Resource
          if (typeof g_resourceManager !== 'undefined' && g_resourceManager) {
            entity = g_resourceManager.createResource(entityData.type, worldX, worldY);
          } else {
            entity = {
              type: entityData.type,
              posX: worldX,
              posY: worldY,
              canBePickedUp: props.canBePickedUp,
              weight: props.weight,
              getPosition: function() { return { x: this.posX, y: this.posY }; }
            };
          }
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
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.EntityPainter = EntityPainter;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityPainter;
}
