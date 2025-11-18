/**
 * EntityController
 * ================
 * Orchestration layer for game entities.
 * 
 * RESPONSIBILITIES:
 * - Coordinate model and view
 * - Manage sub-controllers (movement, selection, combat, etc.)
 * - Handle game loop updates
 * - System integration (spatial grid, collision, etc.)
 * - Lifecycle management
 * - NO rendering (delegates to view)
 * - NO data storage (delegates to model)
 * 
 * This is the "Controller" in MVC - orchestrates everything.
 */

class EntityController {
  /**
   * Create an entity controller
   * @param {EntityModel} model - The data model
   * @param {EntityView} view - The presentation layer
   * @param {Object} options - Configuration options
   */
  constructor(model, view, options = {}) {
    this.model = model;
    this.view = view;
    this.options = options;

    // Initialize components
    this._initializeCollisionBox(options);
    this._initializeSprite(options);
    this._initializeSubControllers(options);
    this._initializeDebugger(options);

    // Register with systems
    this._registerWithSpatialGrid();
  }

  // ===== COMPONENT INITIALIZATION =====
  /**
   * Initialize collision box
   * @private
   */
  _initializeCollisionBox(options) {
    const pos = this.model.getPosition();
    const size = this.model.getSize();

    // Create collision box with tile-centered positioning
    const TILE_SIZE = (typeof window !== 'undefined' && window.TILE_SIZE) ? window.TILE_SIZE : 32;
    const centeredX = pos.x + (size.x * 0.5);
    const centeredY = pos.y + (size.y * 0.5);

    if (typeof CollisionBox2D !== 'undefined') {
      this.model.collisionBox = new CollisionBox2D(centeredX, centeredY, size.x, size.y);
    }
  }

  /**
   * Initialize sprite
   * @private
   */
  _initializeSprite(options) {
    const pos = this.model.getPosition();
    const size = this.model.getSize();

    // Create sprite with tile-centered positioning
    const TILE_SIZE = (typeof window !== 'undefined' && window.TILE_SIZE) ? window.TILE_SIZE : 32;
    const centeredX = pos.x + (size.x * 0.5);
    const centeredY = pos.y + (size.y * 0.5);

    if (typeof Sprite2D !== 'undefined' && typeof createVector !== 'undefined') {
      this.model.sprite = new Sprite2D(
        this.model.imagePath,
        createVector(centeredX, centeredY),
        createVector(size.x, size.y),
        this.model.rotation
      );
    }
  }

  /**
   * Initialize sub-controllers
   * @private
   */
  _initializeSubControllers(options) {
    this.subControllers = new Map();

    // Map of controller name -> constructor
    const availableControllers = {
      'transform': typeof TransformController !== 'undefined' ? TransformController : null,
      'movement': typeof MovementController !== 'undefined' ? MovementController : null,
      'selection': typeof SelectionController !== 'undefined' ? SelectionController : null,
      'combat': typeof CombatController !== 'undefined' ? CombatController : null,
      'terrain': typeof TerrainController !== 'undefined' ? TerrainController : null,
      'taskManager': typeof TaskManager !== 'undefined' ? TaskManager : null,
      'health': typeof HealthController !== 'undefined' ? HealthController : null
    };

    // Create entity-like object for sub-controllers (they expect Entity interface)
    const entityInterface = {
      model: this.model,
      view: this.view,
      getController: (name) => this.subControllers.get(name),
      _collisionBox: this.model.collisionBox,
      _sprite: this.model.sprite
    };

    // Initialize each available controller
    Object.entries(availableControllers).forEach(([name, ControllerClass]) => {
      if (ControllerClass) {
        try {
          this.subControllers.set(name, new ControllerClass(entityInterface));
        } catch (error) {
          console.warn(`Failed to initialize ${name} controller:`, error);
        }
      }
    });

    // Apply configuration to controllers
    this._configureSubControllers(options);
  }

  /**
   * Configure sub-controllers with options
   * @private
   */
  _configureSubControllers(options) {
    const movement = this.subControllers.get('movement');
    if (movement && options.movementSpeed !== undefined) {
      movement.movementSpeed = options.movementSpeed;
    }

    const selection = this.subControllers.get('selection');
    if (selection && options.selectable !== undefined) {
      selection.setSelectable(options.selectable);
    }

    const combat = this.subControllers.get('combat');
    if (combat && options.faction !== undefined) {
      combat.setFaction(options.faction);
    }
  }

  /**
   * Initialize debugger
   * @private
   */
  _initializeDebugger(options) {
    if (typeof UniversalDebugger !== 'undefined') {
      try {
        const debugConfig = {
          showBoundingBox: true,
          showPropertyPanel: options.showDebugPanel !== false,
          ...options.debugConfig
        };
        
        // Create debugger with entity-like interface
        const entityInterface = { model: this.model, view: this.view };
        this.view.debugRenderer = new UniversalDebugger(entityInterface, debugConfig);
      } catch (error) {
        console.warn('Failed to initialize debugger:', error);
      }
    }
  }

  /**
   * Register with spatial grid manager
   * @private
   */
  _registerWithSpatialGrid() {
    if (this.options.useSpatialGrid !== false && typeof spatialGridManager !== 'undefined') {
      const entityInterface = { 
        model: this.model, 
        view: this.view,
        getPosition: () => this.model.getPosition(),
        getSize: () => this.model.getSize()
      };
      spatialGridManager.addEntity(entityInterface);
    }
  }

  // ===== GAME LOOP =====
  /**
   * Update entity and all sub-controllers
   * Called each frame
   */
  update() {
    if (!this.model.isActive) return;

    // Update all sub-controllers
    this.subControllers.forEach((controller, name) => {
      try {
        controller?.update();
      } catch (error) {
        console.warn(`Error updating ${name} controller:`, error);
      }
    });

    // Sync components
    this._syncComponents();
  }

  /**
   * Synchronize model state to collision box and sprite
   * @private
   */
  _syncComponents() {
    const pos = this.model.getPosition();
    const size = this.model.getSize();

    // Sync collision box
    if (this.model.collisionBox) {
      this.model.collisionBox.setPosition(pos.x, pos.y);
      this.model.collisionBox.setSize(size.x, size.y);
    }

    // Sync sprite
    if (this.model.sprite && typeof createVector !== 'undefined') {
      this.model.sprite.setPosition(createVector(pos.x, pos.y));
      this.model.sprite.setSize(createVector(size.x, size.y));
    }

    // Update spatial grid
    if (typeof spatialGridManager !== 'undefined') {
      const entityInterface = { 
        model: this.model, 
        getPosition: () => this.model.getPosition() 
      };
      spatialGridManager.updateEntity(entityInterface);
    }
  }

  // ===== SUB-CONTROLLER ACCESS =====
  /**
   * Get a sub-controller by name
   * @param {string} name - Controller name
   * @returns {Object|undefined} Controller instance
   */
  getController(name) {
    return this.subControllers.get(name);
  }

  // ===== MOVEMENT COORDINATION =====
  /**
   * Move to location (delegates to movement controller)
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  moveToLocation(x, y) {
    const movement = this.subControllers.get('movement');
    if (movement) {
      movement.moveToLocation(x, y);
      // Update spatial grid immediately
      if (typeof spatialGridManager !== 'undefined') {
        const entityInterface = { 
          model: this.model,
          getPosition: () => this.model.getPosition() 
        };
        spatialGridManager.updateEntity(entityInterface);
      }
    }
  }

  /**
   * Check if entity is moving
   * @returns {boolean} True if moving
   */
  isMoving() {
    const movement = this.subControllers.get('movement');
    return movement ? movement.getIsMoving() : false;
  }

  /**
   * Stop movement
   */
  stop() {
    const movement = this.subControllers.get('movement');
    if (movement) {
      movement.stop();
    }
  }

  // ===== SELECTION COORDINATION =====
  /**
   * Set selection state
   * @param {boolean} selected - Selection state
   */
  setSelected(selected) {
    const selection = this.subControllers.get('selection');
    if (selection) {
      selection.setSelected(selected);
    }
  }

  /**
   * Check if selected
   * @returns {boolean} True if selected
   */
  isSelected() {
    const selection = this.subControllers.get('selection');
    return selection ? selection.isSelected() : false;
  }

  /**
   * Toggle selection
   */
  toggleSelection() {
    const selection = this.subControllers.get('selection');
    if (selection) {
      const current = selection.isSelected();
      selection.setSelected(!current);
    }
  }

  // ===== INTERACTION HANDLING =====
  /**
   * Check if mouse is over entity
   * @param {number} mx - Mouse X coordinate
   * @param {number} my - Mouse Y coordinate
   * @returns {boolean} True if mouse over
   */
  isMouseOver(mx, my) {
    if (!this.model.collisionBox) return false;
    return this.model.collisionBox.contains(mx, my);
  }

  /**
   * Handle click event
   */
  handleClick() {
    // Default behavior: toggle selection
    this.toggleSelection();
  }

  // ===== DATA ACCESS (delegates to model) =====
  /**
   * Get position from model
   * @returns {{x: number, y: number}} Position
   */
  getPosition() {
    return this.model.getPosition();
  }

  /**
   * Set position in model
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.model.setPosition(x, y);
    this._syncComponents();
  }

  /**
   * Get size from model
   * @returns {{x: number, y: number}} Size
   */
  getSize() {
    return this.model.getSize();
  }

  // ===== LIFECYCLE =====
  /**
   * Destroy entity and cleanup
   */
  destroy() {
    this.model.setActive(false);

    // Unregister from spatial grid
    if (typeof spatialGridManager !== 'undefined') {
      const entityInterface = { model: this.model };
      spatialGridManager.removeEntity(entityInterface);
    }

    // Cleanup sub-controllers
    this.subControllers.clear();
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.EntityController = EntityController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityController;
}
