/**
 * Entity - Base class with controller-based architecture
 * Clean, minimal implementation using all available controllers
 */
class Entity {
  constructor(x = 0, y = 0, width = 32, height = 32, options = {}) {
    // Core properties
    this._id = `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this._type = options.type || "Entity";
    this._isActive = true;
    
    // Initialize collision box first (required by some controllers)
    this._collisionBox = new CollisionBox2D(x, y, width, height);
    
    // Initialize sprite component
    this._sprite = typeof Sprite2D !== 'undefined' ? 
      new Sprite2D(options.imagePath || null, createVector(x, y), createVector(width, height), 0) : null;
    
    // Initialize all controllers
    this._initializeControllers(options);
    
    // Set initial position and size through controllers
    this.setPosition(x, y);
    this.setSize(width, height);
  }

  // --- Core Properties ---
  get id() { return this._id; }
  get type() { return this._type; }
  get isActive() { return this._isActive; }
  set isActive(value) { this._isActive = value; }

  // --- Controller Initialization ---
  _initializeControllers(options = {}) {
    // Controller registry - much cleaner!
    this._controllers = new Map();
    
    // Define all available controllers
    const controllerTypes = [
      { name: 'transform', class: 'TransformController', description: 'position, size, rotation' },
      { name: 'movement', class: 'MovementController', description: 'pathfinding, movement' },
      { name: 'render', class: 'RenderController', description: 'drawing, highlighting' },
      { name: 'selection', class: 'SelectionController', description: 'selection state' },
      { name: 'interaction', class: 'InteractionController', description: 'mouse events' },
      { name: 'combat', class: 'CombatController', description: 'enemy detection, combat state' },
      { name: 'terrain', class: 'TerrainController', description: 'terrain detection, movement modifiers' },
      { name: 'taskManager', class: 'TaskManager', description: 'task queue, priorities' }
    ];
    
    // Initialize controllers that are available
    try {
      // Explicit controller initialization (more reliable than dynamic lookup)
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
      
      // Initialize available controllers
      Object.entries(availableControllers).forEach(([name, ControllerClass]) => {
        if (ControllerClass) {
          try {
            this._controllers.set(name, new ControllerClass(this));
          } catch (error) {
            console.warn(`Failed to initialize ${name} controller:`, error);
          }
        } else {
          console.warn(`Controller ${name} not available`);
        }
      });
      
      // Apply options to controllers
      this._configureControllers(options);
      
    } catch (error) {
      console.warn("Some controllers failed to initialize:", error);
    }
  }

  // --- Controller Configuration ---
  _configureControllers(options) {
    // Configure movement
    const movement = this._controllers.get('movement');
    if (movement && options.movementSpeed) {
      movement.movementSpeed = options.movementSpeed;
    }
    
    // Configure selection
    const selection = this._controllers.get('selection');
    if (selection && options.selectable !== undefined) {
      selection.setSelectable(options.selectable);
    }
    
    // Configure combat
    const combat = this._controllers.get('combat');
    if (combat && options.faction) {
      combat.setFaction(options.faction);
    }
  }

  // --- Controller Access Helper ---
  getController(name) {
    return this._controllers.get(name);
  }

  // --- Generic Delegation Helper ---
  _delegate(controllerName, methodName, ...args) {
    const controller = this._controllers.get(controllerName);
    return controller?.[methodName]?.(...args);
  }

  // --- Position & Transform ---
  setPosition(x, y) { this._collisionBox.setPosition(x, y); return this._delegate('transform', 'setPosition', x, y); }
  getPosition() { return this._delegate('transform', 'getPosition') || { x: this._collisionBox.x, y: this._collisionBox.y }; }
  setSize(w, h) { this._collisionBox.setSize(w, h); return this._delegate('transform', 'setSize', w, h); }
  getSize() { return this._delegate('transform', 'getSize') || { x: this._collisionBox.width, y: this._collisionBox.height }; }
  getCenter() { return this._delegate('transform', 'getCenter') || this._collisionBox.getCenter(); }

  // --- Movement ---
  moveToLocation(x, y) { return this._delegate('movement', 'moveToLocation', x, y); }
  setPath(path) { return this._delegate('movement', 'setPath', path); }
  isMoving() { return this._delegate('movement', 'getIsMoving') || false; }
  stop() { return this._delegate('movement', 'stop'); }

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
  collidesWith(other) {
    if (other._collisionBox) {
      return this._collisionBox.intersects(other._collisionBox);
    }
    return false;
  }
  
  contains(x, y) {
    return this._collisionBox.contains(x, y);
  }

  // --- Core Update Loop ---
  update() {
    if (!this._isActive) return;
    
    // Update all controllers using the registry
    this._controllers.forEach((controller, name) => {
      try {
        controller?.update();
      } catch (error) {
        console.warn(`Error updating ${name} controller:`, error);
      }
    });
    
    // Update collision box and sprite to match transform
    const pos = this.getPosition();
    const size = this.getSize();
    this._collisionBox.setPosition(pos.x, pos.y);
    this._collisionBox.setSize(size.x, size.y);
    this._sprite?.setPosition(createVector(pos.x, pos.y));
    this._sprite?.setSize(createVector(size.x, size.y));
  }

  // --- Rendering ---
  render() {
    if (!this._isActive) return;
    
    const renderController = this._controllers.get('render');
    if (renderController) {
      renderController.render();
    } else {
      // Fallback rendering
      this._fallbackRender();
    }
  }
  
  _fallbackRender() {
    const pos = this.getPosition();
    const size = this.getSize();
    
    // Render sprite if available, otherwise basic rectangle
    if (this._sprite && this.hasImage()) {
      this._sprite.render();
    } else {
      fill(100, 150, 200);
      if (this.isSelected()) {
        stroke(255, 255, 0);
        strokeWeight(2);
      } else {
        noStroke();
      }
      rect(pos.x, pos.y, size.x, size.y);
    }
  }

  // --- Debug ---
  getDebugInfo() {
    // Build controller status from registry
    const controllerStatus = {};
    this._controllers.forEach((controller, name) => {
      controllerStatus[name] = !!controller;
    });
    
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
  destroy() {
    this._isActive = false;
    // Controllers will be garbage collected
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = Entity;
}