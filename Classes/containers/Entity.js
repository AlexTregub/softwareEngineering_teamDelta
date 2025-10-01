/**
 * Entity
 * ----
 * Base game entity using a controller-based architecture.
 * - Composes optional controllers (transform, movement, render, selection, interaction, combat, terrain, taskManager).
 * - Provides simple delegation helpers so game code interacts with a stable Entity API.
 *
 * Responsibilities:
 *  - Manage core identity/state (id, type, active).
 *  - Initialize and configure controllers when available.
 *  - Provide convenience methods that delegate to controllers.
 *  - Provide update/render entry points used by the game loop.
 */
class Entity {
  /**
   * Construct an Entity.
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} width - initial width
   * @param {number} height - initial height
   * @param {Object} [options={}] - optional configuration (type, imagePath, movementSpeed, faction, selectable, etc.)
   */
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    // Core properties
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;

    // Initialize collision box first (required by some controllers)
    this._collisionBox = new CollisionBox2D(x, y, width, height);

    // Initialize sprite component (if Sprite2D available)
    this._sprite = typeof Sprite2D !== 'undefined' ?
      new Sprite2D(options.imagePath || null, createVector(x, y), createVector(width, height), 0) : null;

    // Initialize controllers and apply options
    this._initializeControllers(options);

    // Ensure transform state propagated to collision box and sprite
    this.setPosition(x, y);
    this.setSize(width, height);
  }

  // --- Core Properties ---
  /** @returns {string} unique id */
  get id() { return this._id; }
  /** @returns {string} entity type name */
  get type() { return this._type; }
  /** @returns {boolean} active flag */
  get isActive() { return this._isActive; }
  set isActive(value) { this._isActive = value; }

  // --- Controller Initialization ---
  /**
   * Initialize available controllers and register them in a Map.
   * Controllers are optional and only created if present in the environment.
   * @param {Object} [options]
   * @private
   */
  _initializeControllers(options = {}) {
    this._controllers = new Map();

    // Map of controller name -> constructor (or null if not available)
    const availableControllers = {
      'transform': typeof TransformController !== 'undefined' ? TransformController : null,
      'movement': typeof MovementController !== 'undefined' ? MovementController : null,
      'render': typeof RenderController !== 'undefined' ? RenderController : null,
      'selection': typeof SelectionController !== 'undefined' ? SelectionController : null,
      'interaction': typeof InteractionController !== 'undefined' ? InteractionController : null,
      'combat': typeof CombatController !== 'undefined' ? CombatController : null,
      'terrain': typeof TerrainController !== 'undefined' ? TerrainController : null,
      'taskManager': typeof TaskManager !== 'undefined' ? TaskManager : null
    };

    Object.entries(availableControllers).forEach(([name, ControllerClass]) => {
      if (ControllerClass) {
        try { this._controllers.set(name, new ControllerClass(this)); }
        catch (error) { console.warn(`Failed to initialize ${name} controller:`, error); }
      } else {
        console.warn(`Controller ${name} not available`);
      }
    });

    this._configureControllers(options);
  }

  /**
   * Apply options to controllers (speed, selectable, faction, etc.).
   * @param {Object} options
   * @private
   */
  _configureControllers(options) {
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed !== undefined) movement.movementSpeed = options.movementSpeed;

    const selection = this._controllers.get('selection');
    if (selection && options.selectable !== undefined) selection.setSelectable(options.selectable);

    const combat = this._controllers.get('combat');
    if (combat && options.faction) combat.setFaction(options.faction);
  }

  // --- Controller Access Helper ---
  /**
   * Retrieve a controller instance by name, if present.
   * @param {string} name
   * @returns {Object|undefined}
   */
  getController(name) { return this._controllers.get(name); }

  // --- Generic Delegation Helper ---
  /**
   * Delegate a method call to a named controller if available.
   * @param {string} controllerName
   * @param {string} methodName
   * @param {...any} args
   * @returns {*}
   * @private
   */
  _delegate(controllerName, methodName, ...args) {
    const controller = this._controllers.get(controllerName);
    return controller?.[methodName]?.(...args);
  }

  // --- Position & Transform ---
  /** Set position (delegates to transform controller if present). */
  setPosition(x, y) { this._collisionBox.setPosition(x, y); return this._delegate('transform', 'setPosition', x, y); }
  /** Get position (from transform controller or collision box). */
  getPosition() { return this._delegate('transform', 'getPosition') || { x: this._collisionBox.x, y: this._collisionBox.y }; }
  /** Set size (delegates to transform controller if present). */
  setSize(w, h) { this._collisionBox.setSize(w, h); return this._delegate('transform', 'setSize', w, h); }
  /** Get size (from transform controller or collision box). */
  getSize() { return this._delegate('transform', 'getSize') || { x: this._collisionBox.width, y: this._collisionBox.height }; }
  /** Get center point (delegates or falls back to collision box). */
  getCenter() { return this._delegate('transform', 'getCenter') || this._collisionBox.getCenter(); }

  // --- Movement ---
  /** Instruct movement controller to move to location. */
  moveToLocation(x, y) { return this._delegate('movement', 'moveToLocation', x, y); }
  /** Set movement path. */
  setPath(path) { return this._delegate('movement', 'setPath', path); }
  /** Query whether entity is moving. */
  isMoving() { return this._delegate('movement', 'getIsMoving') || false; }
  /** Stop movement. */
  stop() { return this._delegate('movement', 'stop'); }
  /** Get movement speed. */
  get movementSpeed() { 
    const movement = this._controllers.get('movement');
    return movement ? movement.movementSpeed : 0;
  }
  /** Set movement speed. */
  set movementSpeed(speed) { 
    const movement = this._controllers.get('movement');
    if (movement) movement.movementSpeed = speed;
  }

  // --- Selection ---
  setSelected(selected) { return this._delegate('selection', 'setSelected', selected); }
  isSelected() { return this._delegate('selection', 'isSelected') || false; }
  toggleSelection() { return this._delegate('selection', 'toggleSelected'); }

  // --- Interaction ---
  isMouseOver() { return this._delegate('interaction', 'isMouseOver') || this._collisionBox.contains(mouseX, mouseY); }
  onClick() { return this._delegate('interaction', 'onClick'); }

  // --- Combat ---
  isInCombat() { return this._delegate('combat', 'isInCombat') || false; }
  detectEnemies() { return this._delegate('combat', 'detectEnemies'); }

  // --- Tasks ---
  addTask(task) { return this._delegate('taskManager', 'addTask', task); }
  getCurrentTask() { return this._delegate('taskManager', 'getCurrentTask'); }

  // --- Terrain ---
  getCurrentTerrain() { return this._delegate('terrain', 'getCurrentTerrain') || "DEFAULT"; }

  // --- Sprite/Image ---
  setImage(imagePath) { return this._sprite?.setImage(imagePath); }
  getImage() { return this._sprite?.getImage(); }
  hasImage() { return this._sprite?.img != null; }
  setOpacity(alpha) { if (this._sprite) this._sprite.setOpacity(alpha); }
  getOpacity() { return this._sprite?.getOpacity() || 255; }

  // --- Collision ---
  /**
   * Test collision with another entity (via collision boxes).
   * @param {Entity} other
   * @returns {boolean}
   */
  collidesWith(other) {
    if (other._collisionBox) return this._collisionBox.intersects(other._collisionBox);
    return false;
  }

  /** Point containment test using this entity's collision box. */
  contains(x, y) { return this._collisionBox.contains(x, y); }

  // --- Core Update Loop ---
  /**
   * update
   * ----
   * Called each frame to update controllers, collision box, and sprite.
   */
  update() {
    if (!this._isActive) return;
    this._controllers.forEach((controller, name) => {
      try { controller?.update(); } catch (error) { console.warn(`Error updating ${name} controller:`, error); }
    });

    const pos = this.getPosition();
    const size = this.getSize();
    this._collisionBox.setPosition(pos.x, pos.y);
    this._collisionBox.setSize(size.x, size.y);
    this._sprite?.setPosition(createVector(pos.x, pos.y));
    this._sprite?.setSize(createVector(size.x, size.y));
  }

  // --- Rendering ---
  /**
   * render
   * ------
   * Delegates rendering to the render controller when present, otherwise falls back.
   */
  render() {
    if (!this._isActive) return;
    const renderController = this._controllers.get('render');
    if (renderController) renderController.render();
    else this._fallbackRender();
  }

  /**
   * _fallbackRender
   * ---------------
   * Simple rectangle or sprite rendering used when no render controller exists.
   * Highlights selection state visually.
   * @private
   */
  _fallbackRender() {
    const pos = this.getPosition();
    const size = this.getSize();
    if (this._sprite && this.hasImage()) {
      this._sprite.render();
    } else {
      fill(100, 150, 200);
      if (this.isSelected()) { stroke(255, 255, 0); strokeWeight(2); }
      else noStroke();
      rect(pos.x, pos.y, size.x, size.y);
    }
  }

  // --- Debug ---
  /**
   * getDebugInfo
   * ------------
   * Return a compact object summarizing the entity's state and controller availability.
   * Useful for logging / in-editor inspection.
   * @returns {Object}
   */
  getDebugInfo() {
    const controllerStatus = {};
    this._controllers.forEach((controller, name) => { controllerStatus[name] = !!controller; });
    return {
      id: this._id,
      type: this._type,
      position: this.getPosition(),
      size: this.getSize(),
      isActive: this._isActive,
      isSelected: this.isSelected(),
      isMoving: this.isMoving(),
      isInCombat: this.isInCombat(),
      currentTerrain: this.getCurrentTerrain(),
      controllers: controllerStatus,
      controllerCount: this._controllers.size,
      hasSprite: !!this._sprite,
      hasImage: this.hasImage(),
      opacity: this.getOpacity()
    };
  }

  // --- Cleanup ---
  /** Mark entity inactive; controllers will be released for GC. */
  destroy() { this._isActive = false; }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) { module.exports = Entity; }