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
    this._initializeEnhancedAPI();

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
    // Only initialize sprite if imagePath is provided
    if (!this.model.imagePath) {
      return;
    }

    const pos = this.model.getPosition();
    const size = this.model.getSize();

    // Try to get preloaded sprite first
    let img = null;
    if (typeof SpriteMapping !== 'undefined' && SpriteMapping.getPreloadedSprite) {
      img = SpriteMapping.getPreloadedSprite(this.model.imagePath);
    }
    
    // Fall back to loading image if not preloaded
    if (!img && typeof loadImage !== 'undefined') {
      img = loadImage(this.model.imagePath);
    }

    // Create sprite
    if (typeof Sprite2D !== 'undefined' && typeof createVector !== 'undefined') {
      this.model.setSprite(new Sprite2D(
        img,
        createVector(pos.x, pos.y),
        createVector(size.x, size.y),
        this.model.rotation
      ));
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
      _sprite: this.model.sprite || { flipX: false }, // Fallback sprite object
      
      // Delegate methods to model
      getPosition: () => this.model.getPosition(),
      setPosition: (x, y) => this.model.setPosition(x, y),
      getSize: () => this.model.getSize(),
      
      // State machine access (for movement checks)
      _stateMachine: null, // Will be set by child classes if available
      
      // Movement state
      _isMoving: false
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

  // ===== TERRAIN LOOKUP =====
  /**
   * Get current terrain type from MapManager
   * @returns {number|null} Terrain type or null if unavailable
   */
  getCurrentTerrain() {
    const map = (typeof g_activeMap !== 'undefined') ? g_activeMap : null;
    if (!map || !map.getTileAtGridCoords) return null;

    const TILE_SIZE = (typeof window !== 'undefined' && window.TILE_SIZE) ? window.TILE_SIZE : 32;
    const pos = this.model.getPosition();
    const gridX = Math.floor(pos.x / TILE_SIZE);
    const gridY = Math.floor(pos.y / TILE_SIZE);

    const tile = map.getTileAtGridCoords(gridX, gridY);
    return tile ? tile.type : null;
  }

  /**
   * Get current tile material from MapManager
   * @returns {string|null} Tile material or null if unavailable
   */
  getCurrentTileMaterial() {
    const map = (typeof g_activeMap !== 'undefined') ? g_activeMap : null;
    if (!map || !map.getTileAtGridCoords) return null;

    const TILE_SIZE = (typeof window !== 'undefined' && window.TILE_SIZE) ? window.TILE_SIZE : 32;
    const pos = this.model.getPosition();
    const gridX = Math.floor(pos.x / TILE_SIZE);
    const gridY = Math.floor(pos.y / TILE_SIZE);

    const tile = map.getTileAtGridCoords(gridX, gridY);
    return tile ? tile.material : null;
  }

  // ===== ENHANCED API NAMESPACES =====
  /**
   * Initialize enhanced API namespaces for convenience methods
   * @private
   */
  _initializeEnhancedAPI() {
    // Highlight namespace
    this.highlight = {
      selected: () => this.view.highlightSelected(),
      hover: () => this.view.highlightHover(),
      combat: () => this.view.highlightCombat(),
      boxHover: () => this.view.highlightBoxHover(),
      spinning: () => this.view.highlightSpinning(),
      slowSpin: () => this.view.highlightSlowSpin(),
      fastSpin: () => this.view.highlightFastSpin(),
      resourceHover: () => this.view.highlightResourceHover()
    };

    // Effects namespace
    this.effects = {
      damageNumber: (damage, color = [255, 0, 0]) => {
        const pos = this.model.getPosition();
        return this._addEffect({
          type: 'DAMAGE_NUMBER',
          text: `-${damage}`,
          color: color,
          x: pos.x,
          y: pos.y - 20
        });
      },
      healNumber: (heal, color = [0, 255, 0]) => {
        const pos = this.model.getPosition();
        return this._addEffect({
          type: 'HEAL_NUMBER',
          text: `+${heal}`,
          color: color,
          x: pos.x,
          y: pos.y - 20
        });
      },
      floatingText: (text, color = [255, 255, 255]) => {
        const pos = this.model.getPosition();
        return this._addEffect({
          type: 'FLOATING_TEXT',
          text: text,
          color: color,
          x: pos.x,
          y: pos.y - 15
        });
      },
      bloodSplatter: (options = {}) => {
        const pos = this.model.getPosition();
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer :
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.bloodSplatter(pos.x, pos.y, options) : null;
      },
      impactSparks: (options = {}) => {
        const pos = this.model.getPosition();
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer :
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.impactSparks(pos.x, pos.y, options) : null;
      }
    };

    // Rendering namespace
    this.rendering = {
      setVisible: (visible) => {
        this.model.setVisible(visible);
        return this;
      },
      setOpacity: (opacity) => {
        this.model.setOpacity(opacity);
        return this;
      },
      isVisible: () => this.model.isVisible(),
      getOpacity: () => this.model.getOpacity()
    };
  }

  // ===== LIFECYCLE METHODS =====
  /**
   * Update entity (game loop)
   */
  update() {
    // Update sub-controllers if they exist
    if (this.movement && typeof this.movement.update === 'function') {
      this.movement.update();
    }
    if (this.combat && typeof this.combat.update === 'function') {
      this.combat.update();
    }
    if (this.health && typeof this.health.update === 'function') {
      this.health.update();
    }
  }

  /**
   * Render entity (delegates to view)
   */
  render() {
    if (this.view && typeof this.view.render === 'function') {
      this.view.render();
      
      // Apply selection/hover highlights after main rendering
      const selection = this.subControllers.get('selection');
      if (selection && typeof selection.applyHighlighting === 'function') {
        selection.applyHighlighting();
      }
    }
  }

  /**
   * Add effect via EffectsRenderer (INTERNAL)
   * @private
   */
  _addEffect(effectConfig) {
    const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer :
                           (typeof global !== 'undefined') ? global.EffectsRenderer : null;
    if (effectsRenderer && effectsRenderer.addEffect) {
      return effectsRenderer.addEffect(effectConfig.type || effectConfig, effectConfig);
    }
    return null;
  }
}

// ===== EXPORTS =====
if (typeof window !== 'undefined') {
  window.EntityController = EntityController;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityController;
}
