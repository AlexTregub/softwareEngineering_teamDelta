/**
 * EntityFactory
 * =============
 * Factory for creating MVC entities with simplified API.
 * 
 * RESPONSIBILITIES:
 * - Create Model-View-Controller triads
 * - Provide convenient creation methods
 * - Handle common entity types (Ant, Resource, Building, etc.)
 * - Apply default configurations
 * 
 * USAGE:
 *   const entity = EntityFactory.create({ x: 100, y: 200, type: 'Ant' });
 *   const ant = EntityFactory.createAnt({ x: 50, y: 50 });
 */

class EntityFactory {
  /**
   * Create a complete MVC entity
   * @param {Object} options - Configuration options
   * @param {number} options.x - X position
   * @param {number} options.y - Y position
   * @param {number} options.width - Width
   * @param {number} options.height - Height
   * @param {string} options.type - Entity type
   * @param {string} options.imagePath - Sprite image path
   * @param {number} options.movementSpeed - Movement speed
   * @param {string} options.faction - Faction
   * @param {boolean} options.selectable - Can be selected
   * @returns {{model: EntityModel, view: EntityView, controller: EntityController}} MVC triad
   */
  static create(options = {}) {
    // Create model
    const model = new EntityModel(options);

    // Create view
    const view = new EntityView(model);

    // Create controller
    const controller = new EntityController(model, view, options);

    // Return MVC triad
    return { model, view, controller };
  }

  /**
   * Create an ant entity with default configuration
   * @param {Object} options - Configuration options
   * @returns {{model: EntityModel, view: EntityView, controller: EntityController}} MVC triad
   */
  static createAnt(options = {}) {
    const defaults = {
      type: 'Ant',
      width: 32,
      height: 32,
      movementSpeed: 2,
      faction: 'player',
      selectable: true,
      imagePath: 'Images/Ants/ant.png'
    };

    return EntityFactory.create({ ...defaults, ...options });
  }

  /**
   * Create a resource entity with default configuration
   * @param {Object} options - Configuration options
   * @returns {{model: EntityModel, view: EntityView, controller: EntityController}} MVC triad
   */
  static createResource(options = {}) {
    const defaults = {
      type: 'Resource',
      width: 30,
      height: 30,
      movementSpeed: 0,
      faction: 'neutral',
      selectable: true,
      imagePath: 'Images/Resources/stick.png'
    };

    return EntityFactory.create({ ...defaults, ...options });
  }

  /**
   * Create a building entity with default configuration
   * @param {Object} options - Configuration options
   * @returns {{model: EntityModel, view: EntityView, controller: EntityController}} MVC triad
   */
  static createBuilding(options = {}) {
    const defaults = {
      type: 'Building',
      width: 64,
      height: 64,
      movementSpeed: 0,
      faction: 'player',
      selectable: true,
      imagePath: null
    };

    return EntityFactory.create({ ...defaults, ...options });
  }

  /**
   * Create multiple entities at once
   * @param {Array<Object>} optionsArray - Array of option objects
   * @returns {Array<{model, view, controller}>} Array of MVC triads
   */
  static createMultiple(optionsArray) {
    return optionsArray.map(options => EntityFactory.create(options));
  }

  /**
   * Create entities in a grid pattern
   * @param {Object} options - Configuration for entities
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   * @param {number} spacing - Spacing between entities
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @returns {Array<{model, view, controller}>} Array of MVC triads
   */
  static createGrid(options, rows, cols, spacing = 50, startX = 0, startY = 0) {
    const entities = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const entity = EntityFactory.create({
          ...options,
          x: startX + (col * spacing),
          y: startY + (row * spacing)
        });
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Create entities in a circle pattern
   * @param {Object} options - Configuration for entities
   * @param {number} count - Number of entities
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} radius - Circle radius
   * @returns {Array<{model, view, controller}>} Array of MVC triads
   */
  static createCircle(options, count, centerX, centerY, radius) {
    const entities = [];
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      const entity = EntityFactory.create({
        ...options,
        x,
        y
      });
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Clone an existing entity
   * @param {{model: EntityModel, view: EntityView, controller: EntityController}} entity - Entity to clone
   * @param {Object} overrides - Properties to override
   * @returns {{model: EntityModel, view: EntityView, controller: EntityController}} New MVC triad
   */
  static clone(entity, overrides = {}) {
    const modelData = entity.model.getValidationData();
    
    const options = {
      x: modelData.position.x,
      y: modelData.position.y,
      width: modelData.size.x,
      height: modelData.size.y,
      type: modelData.type,
      faction: modelData.faction,
      movementSpeed: modelData.movementSpeed,
      imagePath: entity.model.imagePath,
      ...overrides
    };

    return EntityFactory.create(options);
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.EntityFactory = EntityFactory;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityFactory;
}
