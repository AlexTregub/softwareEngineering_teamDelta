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

//Faction setup
const factionList = {};
class Entity {
  /**
   * Construct an Entity.
   * @param {number} x - initial x position
   * @param {number} y - initial y position
   * @param {number} width - initial width
   * @param {number} height - initial height
   * @param {Object} [options={}] - optional configuration (type, imagePath, movementSpeed, faction, selectable, etc.)
   */
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) { // x,y canvas
    // Core properties
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;

    // Apply +0.5 tile offset for tile-centered positioning
    // This moves entities to the visual center of their tile, so rendering doesn't need offset
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    // const centeredX = x + (TILE_SIZE * 0.5); // Canvas cordinates
    // const centeredY = y + (TILE_SIZE * 0.5); // Tiles offset by -0.5,-0.5 -- matching that

    const centeredX = x + (width * 0.5); // Canvas cordinates
    const centeredY = y + (height * 0.5); 

    // Initialize collision box first (required by some controllers)
    this._collisionBox = new CollisionBox2D(centeredX, centeredY, width, height);

    // Initialize sprite component (if Sprite2D available) - use centered position
    this._sprite = typeof Sprite2D !== 'undefined' ?
      new Sprite2D(options.imagePath || null, createVector(centeredX, centeredY), createVector(width, height), 0) : null;

    // Initialize debugger system (if UniversalDebugger available)
    this._debugger = null;
    this._initializeDebugger(options);

    // Initialize controllers and apply options
    this._initializeControllers(options);

    // Initialize enhanced API
    this._initializeEnhancedAPI();

    // Ensure transform state propagated to collision box and sprite (use centered position)
    this.setPosition(centeredX, centeredY);
    this.setSize(width, height);
    

    // Faction registration
    if(!(this._faction in factionList)){
      factionList[this._faction] = {
        'isUnderAttack' : null,
      };
    }

    // Register with spatial grid manager (if available and not disabled)
    if (options.useSpatialGrid !== false && typeof spatialGridManager !== 'undefined') {
      spatialGridManager.addEntity(this);
    }
  }

  // --- Core Properties ---
  /** @returns {string} unique id */
  get id() { return this._id; }
  /** @returns {string} entity type name */
  get type() { return this._type; }
  /** @returns {boolean} active flag */
  get isActive() { return this._isActive; }
  set isActive(value) { this._isActive = value; }

  // --- Debugger Initialization ---
  /**
   * Initialize the debugger system if UniversalDebugger is available.
   * @param {Object} [options] - Configuration options
   * @private
   */
  _initializeDebugger(options = {}) {
    // no opp
  }

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
      'combat': typeof CombatController !== 'undefined' ? CombatController : null,
      'terrain': typeof TerrainController !== 'undefined' ? TerrainController : null,
      'taskManager': typeof TaskManager !== 'undefined' ? TaskManager : null,
      'health': typeof HealthController !== 'undefined' ? HealthController : null
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
    movement.movementSpeed = options.movementSpeed;

    const selection = this._controllers.get('selection');
    selection.setSelectable(options.selectable);

    const combat = this._controllers.get('combat');
    combat.setFaction(options.faction);
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
  /**
   * Set position in world coordinates (collision box is single source of truth)
   * @param {number} x - X coordinate in world space (pixels)
   * @param {number} y - Y coordinate in world space (pixels)
   */
  setPosition(x, y) { 
    // Collision box is the authoritative position storage
    this._collisionBox.setPosition(x, y); 
    
    // Notify transform controller to sync sprite and mark dirty
    const result = this._delegate('transform', 'setPosition', this._collisionBox.getPosX(), this._collisionBox.getPosY());
    
    // Update spatial grid when entity moves
    if (typeof spatialGridManager !== 'undefined') {
      spatialGridManager.updateEntity(this);
    }
    
    return result;
  }
  
  /**
   * Set position from screen coordinates (converts to world space)
   * Useful for mouse clicks and UI interactions
   * @param {number} screenX - X coordinate in screen space (canvas pixels)
   * @param {number} screenY - Y coordinate in screen space (canvas pixels)
   */
  setPositionFromScreen(screenX, screenY) {
    const worldPos = CoordinateConverter.screenToWorld(screenX, screenY);
    this.setPosition(worldPos.x, worldPos.y);
  }
  
  /** Get position (from transform controller which reads from collision box). */
  getPosition() { return this._delegate('transform', 'getPosition') }
  
  /**
   * Get screen position (converts world position to screen coordinates for rendering)
   * This matches the coordinate transformation used by Sprite2D rendering
   * @returns {{x: number, y: number}} Screen coordinates
   */
  getScreenPosition() {
    const worldPos = this.getPosition();
    let screenX = worldPos.x;
    let screenY = worldPos.y;
    
    // Use terrain's coordinate system if available (syncs with sprite rendering)
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      // Convert world pixels to tile coordinates
      // Entity position is already tile-centered (+0.5 applied in Entity constructor)
      const tileX = worldPos.x / TILE_SIZE;
      const tileY = worldPos.y / TILE_SIZE;
      
      // Use terrain's converter to get screen position (handles Y-axis inversion)
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0];
      screenY = screenPos[1];
    }
    
    return { x: screenX, y: screenY };
  }
  
  /**
   * Get position in tile coordinates
   * @returns {{x: number, y: number}} Tile coordinates (floored integers)
   */
  getTilePosition() {
    const pos = this.getPosition();
    if (typeof CoordinateConverter !== 'undefined') {
      return CoordinateConverter.worldToTile(pos.x, pos.y);
    }
  }
  
  /** Get X coordinate. */
  getX() { 
    const pos = this.getPosition(); 
    return pos.x; 
  }
  /** Get Y coordinate. */
  getY() { 
    const pos = this.getPosition(); 
    return pos.y; 
  }
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
  toggleSelection() { return this._delegate('selection', 'toggleSelection'); }

  // --- Interaction ---
  isMouseOver() { 
    // Convert mouse screen coordinates to world coordinates for collision detection
    // Uses CoordinateConverter utility which handles Y-axis inversion automatically
    const worldMouse = (typeof CoordinateConverter !== 'undefined') ?
      CoordinateConverter.screenToWorld(mouseX, mouseY) :
      { x: mouseX, y: mouseY }; // Fallback if converter not available
    
    const isOver = this._collisionBox.contains(worldMouse.x, worldMouse.y);
    
    // Only log if mouse moved and hovering
    if (isOver && (!window._lastDebugMouseX || !window._lastDebugMouseY || 
        window._lastDebugMouseX !== mouseX || window._lastDebugMouseY !== mouseY)) {
      const pos = this.getPosition();
      const size = this.getSize();
      logNormal(`[Entity.js:isMouseOver:225] Screen:(${mouseX},${mouseY}) World:(${worldMouse.x},${worldMouse.y}) EntityPos:(${pos.x},${pos.y}) Size:(${size.x},${size.y}) isOver:${isOver}`);
      window._lastDebugMouseX = mouseX;
      window._lastDebugMouseY = mouseY;
    }
    
    return isOver;
  }

  // TODO: The interaction controller has been removed, need to delegate this somewhere else.
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

    // Update debugger if active
    if (this._debugger?.isActive) {
      try { this._debugger.update(); } catch (error) { console.warn('Error updating entity debugger:', error); }
    }
  }

  // --- Rendering ---
  /**
   * render
   * ------
   * Delegates rendering to the render controller when present, otherwise falls back.
   */
  render() {
    if (!this._isActive) {
      return;
    }
    
    const renderController = this._controllers.get('render');
    renderController.render();

    // Render debugger overlay if active
    if (this._debugger?.isActive) {
      try { this._debugger.render(); } catch (error) { console.warn('Error rendering entity debugger:', error); }
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
      opacity: this.getOpacity(),
      hasDebugger: !!this._debugger,
      debuggerActive: this._debugger?.isActive || false
    };
  }

  /**
   * Toggle the entity's debugger visualization.
   * @param {boolean} [forceState] - Optional forced state (true/false)
   * @returns {boolean} New debugger state
   */
  toggleDebugger(forceState) {
    if (!this._debugger) return false;
    
    if (typeof forceState === 'boolean') {
      if (forceState) this._debugger.activate();
      else this._debugger.deactivate();
    } else {
      this._debugger.toggle();
    }
    
    return this._debugger.isActive;
  }

  /**
   * Check if debugger is active.
   * @returns {boolean} True if debugger is active
   */
  isDebuggerActive() {
    return this._debugger?.isActive || false;
  }

  /**
   * Get the debugger instance for advanced configuration.
   * @returns {UniversalDebugger|null} Debugger instance or null
   */
  getDebugger() {
    return this._debugger;
  }

  // --- Enhanced API ---
  /**
   * Initialize the enhanced property-based API for rendering, effects, and highlights
   * This creates clean namespaced methods like entity.highlight.selected() and entity.effects.add()
   */
  _initializeEnhancedAPI() {
    // Highlight namespace
    this.highlight = {
      selected: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightSelected() : null;
      },
      hover: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightHover() : null;
      },
      boxHover: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightBoxHover() : null;
      },
      resourceHover: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightResource() : null;
      },
      spinning: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightSpin() : null;
      },
      slowSpin: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightSlowSpin() : null;
      },
      fastSpin: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightFastSpin() : null;
      },
      combat: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.highlightCombat() : null;
      },
      set: (type, intensity) => {
        const controller = this._controllers.get('render');
        return controller ? controller.setHighlight(type, intensity) : null;
      },
      clear: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.clearHighlight() : null;
      }
    };

    // Effects namespace
    this.effects = {
      add: (effect) => {
        // Try render controller first, then effects renderer
        const renderController = this._controllers.get('render');
        if (renderController && renderController.addEffect) {
          return renderController.addEffect(effect);
        }
        
        // Fallback to global effects renderer
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        if (effectsRenderer) {
          return effectsRenderer.addEffect(effect.type || effect, { 
            x: this.x, 
            y: this.y, 
            ...effect 
          });
        }
        
        return null;
      },
      remove: (effectId) => {
        const controller = this._controllers.get('render');
        return controller ? controller.removeEffect(effectId) : null;
      },
      clear: () => {
        const controller = this._controllers.get('render');
        return controller ? controller.clearEffects() : null;
      },
      damageNumber: (damage, color = [255, 0, 0]) => {
        return this.effects.add({
          type: 'DAMAGE_NUMBER',
          text: `-${damage}`,
          color: color,
          x: this.x,
          y: this.y - 20
        });
      },
      healNumber: (heal, color = [0, 255, 0]) => {
        return this.effects.add({
          type: 'HEAL_NUMBER',
          text: `+${heal}`,
          color: color,
          x: this.x,
          y: this.y - 20
        });
      },
      floatingText: (text, color = [255, 255, 255]) => {
        return this.effects.add({
          type: 'FLOATING_TEXT',
          text: text,
          color: color,
          x: this.x,
          y: this.y - 15
        });
      },
      bloodSplatter: (options = {}) => {
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.bloodSplatter(this.x, this.y, options) : null;
      },
      impactSparks: (options = {}) => {
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.impactSparks(this.x, this.y, options) : null;
      },
      selectionSparkle: (options = {}) => {
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.selectionSparkle(this.x, this.y, options) : null;
      },
      gatheringSparkle: (options = {}) => {
        const effectsRenderer = (typeof window !== 'undefined') ? window.EffectsRenderer : 
                               (typeof global !== 'undefined') ? global.EffectsRenderer : null;
        return effectsRenderer ? effectsRenderer.gatheringSparkle(this.x, this.y, options) : null;
      }
    };

    // Rendering namespace
    this.rendering = {
      setDebugMode: (enabled) => {
        const controller = this._controllers.get('render');
        return controller ? controller.setDebugMode(enabled) : null;
      },
      setSmoothing: (enabled) => {
        const controller = this._controllers.get('render');
        return controller ? controller.setSmoothing(enabled) : null;
      },
      render: () => {
        return this.render(); // Delegate to existing render method
      },
      update: () => {
        return this.update(); // Delegate to existing update method
      },
      setVisible: (visible) => {
        if (this._sprite) {
          this._sprite.visible = visible;
        }
        return this;
      },
      isVisible: () => {
        return this._sprite ? this._sprite.visible !== false : true;
      },
      setOpacity: (opacity) => {
        if (this._sprite) {
          this._sprite.alpha = opacity;
        }
        return this;
      },
      getOpacity: () => {
        return this._sprite ? this._sprite.alpha : 1.0;
      }
    };

    // Config namespace for properties
    this.config = {
      get debugMode() {
        const controller = this._controllers.get('render');
        return controller ? controller.getDebugMode() : false;
      },
      set debugMode(value) {
        const controller = this._controllers.get('render');
        if (controller && controller.setDebugMode) {
          controller.setDebugMode(value);
        }
      },
      get smoothing() {
        const controller = this._controllers.get('render');
        return controller ? controller.getSmoothing() : true;
      },
      set smoothing(value) {
        const controller = this._controllers.get('render');
        if (controller && controller.setSmoothing) {
          controller.setSmoothing(value);
        }
      },
      get visible() {
        return this.rendering.isVisible();
      },
      set visible(value) {
        this.rendering.setVisible(value);
      },
      get opacity() {
        return this.rendering.getOpacity();
      },
      set opacity(value) {
        this.rendering.setOpacity(value);
      }
    };
    
  }

  /**
   * Chainable API methods for fluent interface
   * Allows chaining like entity.chain.highlight().effect().render()
   */
  get chain() {
    if (!this._chainAPI) {
      this._chainAPI = {
        highlight: (type = 'selected') => {
          if (this.highlight[type]) {
            this.highlight[type]();
          }
          return this._chainAPI;
        },
        effect: (effectType, options = {}) => {
          this.effects.add({ type: effectType, ...options });
          return this._chainAPI;
        },
        render: () => {
          this.render();
          return this._chainAPI;
        },
        update: () => {
          this.update();
          return this._chainAPI;
        },
        setPosition: (x, y) => {
          this.setPosition(x, y);
          return this._chainAPI;
        },
        setSize: (width, height) => {
          this.setSize(width, height);
          return this._chainAPI;
        },
        // End chain and return entity
        entity: () => this
      };
    }
    return this._chainAPI;
  }

  // --- Selenium Testing Getters ---

  /**
   * Get entity job name (for Selenium validation)
   * @returns {string|null} Current job name
   */
  getJobName() {
    return this._JobName || null;
  }

  /**
   * Get entity type (for Selenium validation)
   * @returns {string} Entity type
   */
  getEntityType() {
    return this._type || 'Unknown';
  }

  /**
   * Get entity faction (for Selenium validation)
   * @returns {string} Entity faction
   */
  getFaction() {
    return this._faction || 'neutral';
  }

  /**
   * Get current state from state machine (for Selenium validation)
   * @returns {string|null} Current entity state
   */
  getCurrentState() {
    if (!this._stateMachine) return null;
    return this._stateMachine.primaryState || null;
  }

  // NOTE: isSelected() method is defined earlier at line ~213 and delegates to SelectionController
  // Removed duplicate isSelected() that was incorrectly reading _isSelected property (which is never set)
  // The correct implementation delegates: isSelected() { return this._delegate('selection', 'isSelected') || false; }

  /**
   * Check if entity is active (for Selenium validation)
   * @returns {boolean} True if entity is active
   */
  isActive() {
    return this._isActive;
  }

  /**
   * Get render controller validation data (for Selenium validation)
   * @returns {Object|null} Render controller validation data
   */
  getRenderValidationData() {
    const renderController = this._controllers.get('render');
    if (!renderController || !renderController.getValidationData) return null;
    return renderController.getValidationData();
  }

  /**
   * Get complete entity validation data (for Selenium validation)
   * @returns {Object} Complete validation data for testing
   */
  getValidationData() {
    return {
      id: this._id,
      type: this.getEntityType(),
      jobName: this.getJobName(),
      faction: this.getFaction(),
      currentState: this.getCurrentState(),
      isSelected: this.isSelected(),
      isActive: this.isActive(),
      position: this.getPosition(),
      size: this.getSize(),
      hasSprite: this.hasImage(),
      renderData: this.getRenderValidationData(),
      controllers: Array.from(this._controllers.keys()),
      timestamp: new Date().toISOString()
    };
  }

  // --- Terrain Information (convenience methods) ---
  
  /**
   * Get current terrain type at entity position
   * @returns {string} Current terrain modifier ("DEFAULT", "IN_WATER", "IN_MUD", "ON_SLIPPERY", "ON_ROUGH")
   */
  getCurrentTerrain() {
    const terrainController = this._controllers.get('terrain');
    return terrainController?.getCurrentTerrain() || "DEFAULT";
  }
  
  /**
   * Get the underlying tile material at entity position
   * @returns {string|null} Tile material ('grass', 'dirt', 'stone', etc.) or null if unavailable
   */
  getCurrentTileMaterial() {
    const pos = this.getPosition();
    
    // Try MapManager first (preferred)
    if (typeof mapManager !== 'undefined' && mapManager.getActiveMap()) {
      return mapManager.getTileMaterial(pos.x, pos.y);
    }
    
    // Fallback to g_activeMap for backwards compatibility
    if (typeof g_activeMap === 'undefined' || !g_activeMap) {
      return null;
    }
    
    try {
      const tileSize = window.TILE_SIZE || 32;
      const tileX = Math.floor(pos.x / tileSize);
      const tileY = Math.floor(pos.y / tileSize);
      
      const chunkX = Math.floor(tileX / g_activeMap._chunkSize);
      const chunkY = Math.floor(tileY / g_activeMap._chunkSize);
      const chunk = g_activeMap.chunkArray?.get?.([chunkX, chunkY]);
      
      if (chunk) {
        const localX = tileX - (chunkX * g_activeMap._chunkSize);
        const localY = tileY - (chunkY * g_activeMap._chunkSize);
        const tile = chunk.tileData?.get?.([localX, localY]);
        
        return tile?.material || null;
      }
    } catch (error) {
      console.warn("getCurrentTileMaterial error:", error);
    }
    
    return null;
  }

  // --- Cleanup ---
  /** Mark entity inactive; controllers will be released for GC. */
  destroy() { 
    this._isActive = false;
    
    // Remove from spatial grid
    if (typeof spatialGridManager !== 'undefined') {
      spatialGridManager.removeEntity(this);
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) { module.exports = Entity; }