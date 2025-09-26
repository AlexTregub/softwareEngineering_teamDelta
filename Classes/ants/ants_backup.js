// --- Ant Globals ---
let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let globalResource = [];
let antBaseSprite;
let antbg;
let hasDeLozier = false;
let selectedAnt = null;
let speciesImages = {};

// Global ant manager instance - will be initialized when AntManager is available
let antManager = null;

// AntStateMachine will be available globally from antStateMachine.js

// --- Preload Images and manager ---
function Ants_Preloader() {
  antSize = createVector(20, 20);
  antbg = [60, 100, 60];
  antBaseSprite = loadImage("Images/Ants/gray_ant.png");
  speciesImages = {
    Builder: loadImage('Images/Ants/blue_ant.png'),
    Scout: loadImage('Images/Ants/gray_ant.png'),
    Farmer: loadImage('Images/Ants/brown_ant.png'),
    Warrior: loadImage('Images/Ants/blue_ant.png'),
    Spitter: loadImage('Images/Ants/gray_ant.png'),
    DeLozier: loadImage('Images/Ants/greg.jpg')
  };
  initializeAntManager();
}

/**
 * @fileoverview AntManager class for handling ant selection, movement, and interaction logic
 * Provides centralized management of ant selection state and related operations.
 */
function initializeAntManager() {
  if (typeof AntManager !== 'undefined' && !antManager) {
    antManager = new AntManager();
    console.log('AntManager initialized successfully');
  } else if (typeof AntManager === 'undefined') {
    console.error('AntManager class not available - functions will fall back to basic implementations');
  }
}

// --- Spawn Ants ---
function AntsSpawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let speciesName = assignSpecies();
    let baseAnt = new ant(
      random(0, 500), random(0, 500), 
      antSize.x + sizeR, 
      antSize.y + sizeR, 
      30, 0,
      antBaseSprite,
      speciesName
      );
    ants[i] = new AntWrapper(new Species(baseAnt, speciesName, speciesImages[speciesName]), speciesName);
    ants[i].update();
  }
}

// --- Update All Ants ---
function AntsUpdate() {
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i] && typeof ants[i].update === "function") {
      ants[i].update();
    }
  }
}

// Import AntManager from managers folder
// Note: In browser environment, this will be loaded via script tag
// In Node.js environment, this will be loaded via require()

// Note: initializeAntManager() is defined above in the preloader section

// Will check if all ants, either in the wrapper or a base ant,
//  has a property and what it is set to.
function antLoopPropertyCheck(property) {
  for (let i = 0; i < ant_Index; i++) {
    if (!ants[i]) continue; // Safety check for null/undefined ants
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    return antObj[property]; // Safety check
  } IncorrectParamPassed("Boolean", property)
}



// --- Ant Class ---
class ant {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite,speciesName) {
    const initialPos = createVector(posX, posY);
    this._stats = new stats(
      initialPos,
      { x: sizex, y: sizey },
      movementSpeed,
      initialPos.copy()
    );
    this.speciesName = speciesName;
    this._sprite = new Sprite2D(img, initialPos, createVector(sizex, sizey), rotation);
    this._antIndex = ant_Index++;
    this._isSelected = false;
    this.isBoxHovered = false;

    // Initialize resource management
    this._resourceManager = new ResourceManager(this, 2, 25);
    
    // Initialize state machine
    this._stateMachine = new AntStateMachine();
    this._stateMachine.setStateChangeCallback((oldState, newState) => {
      this._onStateChange(oldState, newState);
    });
    
    // Initialize all controller systems (only if classes are available)
    try {
      this._movementController = typeof MovementController !== 'undefined' ? new MovementController(this) : null;
      this._taskManager = typeof TaskManager !== 'undefined' ? new TaskManager(this) : null;
      this._renderController = typeof RenderController !== 'undefined' ? new RenderController(this) : null;
      this._combatController = typeof CombatController !== 'undefined' ? new CombatController(this) : null;
      this._transformController = typeof TransformController !== 'undefined' ? new TransformController(this) : null;
      this._selectionController = typeof SelectionController !== 'undefined' ? new SelectionController(this) : null;
      this._terrainController = typeof TerrainController !== 'undefined' ? new TerrainController(this) : null;
      this._interactionController = typeof InteractionController !== 'undefined' ? new InteractionController(this) : null;
      
      // Set movement speed in controller
      if (this._movementController) {
        this._movementController.movementSpeed = movementSpeed;
      }
      
      // Set initial selected state
      if (this._selectionController) {
        this._selectionController.setSelected(this._isSelected);
      }
      
    } catch (error) {
      // Controllers not available (e.g., in Node.js test environment)
      this._movementController = null;
      this._taskManager = null;
      this._renderController = null;
      this._combatController = null;
      this._transformController = null;
      this._selectionController = null;
      this._terrainController = null;
      this._interactionController = null;
    }
    
    // Faction and enemy tracking
    this._faction = "neutral"; // Default faction
    this._nearbyEnemies = []; // Track nearby enemy ants
    
    // Auto-generate common delegation methods
    this._setupControllerDelegation();
  }
  
  // Setup automatic method delegation for common controller methods
  _setupControllerDelegation() {
    // Define controller method mappings for auto-delegation
    const delegations = {
      // Transform controller shortcuts
      'scale': ['_transformController', 'scale'],
      'rotateTowards': ['_transformController', 'rotateTowards'],
      
      // Combat controller shortcuts  
      'attack': ['_combatController', 'attack'],
      'takeDamage': ['_combatController', 'takeDamage'],
      'getHealth': ['_combatController', 'getHealth'],
      
      // Movement controller shortcuts
      'setPath': ['_movementController', 'setPath'],
      'clearPath': ['_movementController', 'clearPath'],
      'stopMovement': ['_movementController', 'stop'],
      
      // Task manager shortcuts
      'getCurrentTask': ['_taskManager', 'getCurrentTask'],
      'clearAllTasks': ['_taskManager', 'clearAllTasks']
    };
    
    // Auto-create delegation methods (commented out - keeping explicit methods for clarity)
    // Object.entries(delegations).forEach(([methodName, [controller, method]]) => {
    //   if (!this[methodName]) {
    //     this[methodName] = (...args) => this._delegate(controller, method, ...args);
    //   }
    // });
  }

  // --- Getters/Setters ---
  get stats() { return this._stats; }
  set stats(value) { this._stats = value; }
  get sprite() { return this._sprite; }
  set sprite(value) { this._sprite = value; }
  get antIndex() { return this._antIndex; }
  set antIndex(value) { this._antIndex = value; }
  
  // Controller getters
  get movementController() { return this._movementController; }
  get taskManager() { return this._taskManager; }
  get renderController() { return this._renderController; }
  get combatController() { return this._combatController; }
  get transformController() { return this._transformController; }
  get selectionController() { return this._selectionController; }
  get terrainController() { return this._terrainController; }
  get interactionController() { return this._interactionController; }
  
  // Movement properties (delegated to MovementController)
  get isMoving() { return this._movementController?.getIsMoving() || false; }
  set isMoving(value) { if (!value) this._movementController?.stop(); }
  
  // Path properties (delegated to MovementController)
  get path() { return this._movementController?.getPath() || null; }
  set path(value) { this._movementController?.setPath(value); }
  
  // Selection and visual properties (delegated to SelectionController)
  get isSelected() { 
    return this._selectionController ? this._selectionController.isSelected() : this._isSelected; 
  }
  set isSelected(value) { 
    this._isSelected = value;
    
    // Update selection controller
    if (this._selectionController) {
      this._selectionController.setSelected(value);
    }
    
    // Update render controller highlighting
    if (this._renderController) {
      if (value) {
        this._renderController.highlightSelected();
      } else {
        this._renderController.clearHighlight();
      }
    }
  }
  

  
  // State machine and properties
  get stateMachine() { return this._stateMachine; }
  get faction() { return this._faction; }
  set faction(value) { this._faction = value; }
  get nearbyEnemies() { return this._nearbyEnemies; }

  // --- Sprite2D Helpers ---
  setSpriteImage(img) { this._sprite.setImage(img); }
  setSpritePosition(pos) { this._sprite.setPosition(pos); }
  setSpriteSize(size) { this._sprite.setSize(size); }
  setSpriteRotation(rotation) { this._sprite.setRotation(rotation); }

  // --- Rendering ---
  render() {
    if (this._renderController) {
      // Update highlighting based on current state
      if (this._isSelected) {
        this._renderController.highlightSelected();
      } else if (this.isMouseOver(mouseX, mouseY)) {
        this._renderController.highlightHover();
      } else if (this.isBoxHovered) {
        this._renderController.highlightBoxHover();
      } else if (this._stateMachine.isInCombat()) {
        this._renderController.highlightCombat();
      } else {
        this._renderController.clearHighlight();
      }
      
      // Use new render controller
      this._renderController.render();
    } else {
      // Fallback to legacy rendering
      noSmooth();
      this._sprite.render();
      smooth();

      if (this._isMoving) {
        const pos = this._sprite.pos;
        const size = this._sprite.size;
        const pendingPos = this._stats.pendingPos.statValue;
        stroke(255);
        strokeWeight(2);
        line(
          pos.x + size.x / 2, pos.y + size.y / 2,
          pendingPos.x + size.x / 2, pendingPos.y + size.y / 2
        );
      }
      
      // Legacy highlighting
      this.legacyHighlight();
    }
  }

  // --- Legacy Highlighting (fallback) ---
  legacyHighlight() {
    // Use abstract highlighting functions from selectionBox.js if available
    if (typeof highlightEntity === 'function') {
      if (this._isSelected) {
        highlightEntity(this, "selected");
        if (typeof renderDebugInfo === 'function') renderDebugInfo(this);
      } else if (this.isMouseOver(mouseX, mouseY)) {
        highlightEntity(this, "hover");
      } else if (this.isBoxHovered) {
        highlightEntity(this, "boxHovered");
      }
      
      // Show combat state with red outline
      if (this._stateMachine.isInCombat()) {
        highlightEntity(this, "combat");
      }
      
      // Show state-dependent visual indicators
      if (typeof renderStateIndicators === 'function') {
        renderStateIndicators(this);
      }
    }
  }
  
  // --- Mouse Over Detection (delegated to InteractionController) ---
  isMouseOver(mx, my) {
    if (this._interactionController) {
      return this._interactionController.isMouseOver();
    } else {
      const pos = this._sprite.pos;
      const size = this._sprite.size;
      return (
        mx >= pos.x &&
        mx <= pos.x + size.x &&
        my >= pos.y &&
        my <= pos.y + size.y
      );
    }
  }





  // --- Position and Size (delegated to TransformController) ---
  set posX(value) {
    if (this._transformController) {
      const currentPos = this._transformController.getPosition();
      this._transformController.setPosition(value, currentPos.y);
    } else {
      this._stats.position.statValue.x = value;
      this._sprite.pos.x = value;
    }
  }
  get posX() { 
    return this._transformController ? 
      this._transformController.getPosition().x : 
      this._stats.position.statValue.x; 
  }

  set posY(value) {
    if (this._transformController) {
      const currentPos = this._transformController.getPosition();
      this._transformController.setPosition(currentPos.x, value);
    } else {
      this._stats.position.statValue.y = value;
      this._sprite.pos.y = value;
    }
  }
  get posY() { 
    return this._transformController ? 
      this._transformController.getPosition().y : 
      this._stats.position.statValue.y; 
  }

  // Helper methods for abstract highlighting functions
  getPosition() {
    return this._transformController ? 
      this._transformController.getPosition() : 
      this._sprite.pos;
  }
  
  getSize() {
    return this._transformController ? 
      this._transformController.getSize() : 
      this._sprite.size;
  }

  get center() {
    return this._transformController ? 
      this._transformController.getCenter() : 
      createVector(
        this._stats.position.statValue.x + (this._stats.size.statValue.x / 2), 
        this._stats.position.statValue.y + (this._stats.size.statValue.y / 2)
      );
  }

  set sizeX(value) { 
    if (this._transformController) {
      const currentSize = this._transformController.getSize();
      this._transformController.setSize(value, currentSize.y);
    } else {
      this._stats.size.statValue.x = value;
    }
  }
  get sizeX() { 
    return this._transformController ? 
      this._transformController.getSize().x : 
      this._stats.size.statValue.x; 
  }
  
  set sizeY(value) { 
    if (this._transformController) {
      const currentSize = this._transformController.getSize();
      this._transformController.setSize(currentSize.x, value);
    } else {
      this._stats.size.statValue.y = value;
    }
  }
  get sizeY() { 
    return this._transformController ? 
      this._transformController.getSize().y : 
      this._stats.size.statValue.y; 
  }

  // --- Movement Speed ---
  set movementSpeed(value) { 
    this._stats.movementSpeed.statValue = value;
    if (this._movementController) {
      this._movementController.movementSpeed = value;
    }
  }
  get movementSpeed() { return this._stats.movementSpeed.statValue; }
  
  // Get effective movement speed modified by terrain (delegated to TerrainController)
  getEffectiveMovementSpeed() {
    if (this._terrainController) {
      return this._terrainController.getEffectiveMovementSpeed();
    } else {
      let baseSpeed = this.movementSpeed;
      
      // Apply terrain modifiers
      switch (this._stateMachine.terrainModifier) {
        case "IN_WATER": return baseSpeed * 0.5; // 50% speed in water
        case "IN_MUD": return baseSpeed * 0.3; // 30% speed in mud
        case "ON_SLIPPERY": return 0; // Can't move on slippery terrain
        case "ON_ROUGH": return baseSpeed * 0.8; // 80% speed on rough terrain
        case "DEFAULT":
        default: return baseSpeed; // Normal speed
      }
    }
  }

  // --- Rotation (delegated to TransformController) ---
  set rotation(value) {
    if (this._transformController) {
      this._transformController.setRotation(value);
    } else {
      this._sprite.rotation = value;
      while (this._sprite.rotation > 360) this._sprite.rotation -= 360;
      while (this._sprite.rotation < -360) this._sprite.rotation += 360;
    }
  }
  get rotation() { 
    return this._transformController ? 
      this._transformController.getRotation() : 
      this._sprite.rotation; 
  }

  // In Range Of Resource


  // --- Movement (delegated to MovementController) ---
  moveToLocation(X, Y) {
    return this._movementController?.moveToLocation(X, Y) || false;
  }
  
  // Detect terrain at current position (delegated to TerrainController)
  detectTerrain() {
    if (this._terrainController) {
      return this._terrainController.detectTerrain();
    } else {
      // Fallback terrain detection
      return "DEFAULT"; // Placeholder
    }
  }
  
  // Update terrain state based on current position (delegated to TerrainController)
  updateTerrainState() {
    return this._delegate('_terrainController', 'detectAndUpdateTerrain') || this._fallbackTerrainUpdate();
  }
  
  // Fallback terrain update method
  _fallbackTerrainUpdate() {
    const currentTerrain = this.detectTerrain();
    if (this._stateMachine.terrainModifier !== currentTerrain) {
      this._stateMachine.setTerrainModifier(currentTerrain);
    }
  }



  // --- Resource Management (delegated to ResourceManager) ---
  resourceCheck() { return this._resourceManager.checkForNearbyResources(); }
  dropOff(X, Y) { return this._resourceManager.startDropOff(X, Y); }

  /**
   * Gets the current resource load of the ant.
   * @returns {number} Number of resources currently carried
   */
  getCurrentResourceLoad() {
    return this._resourceManager.getCurrentLoad();
  }

  /**
   * Gets resource manager debug information.
   * @returns {Object} Debug information about resource state
   */
  getResourceDebugInfo() {
    return this._resourceManager.getDebugInfo();
  }


  update() {
    // Update terrain state
    this.updateTerrainState();
    
    // Update all controllers
    this._movementController?.update();
    this._taskManager?.update();
    this._resourceManager.update();
    this._combatController?.update();
    this._transformController?.update();
    this._selectionController?.update();
    this._terrainController?.update();
    this._interactionController?.update();
    
    // Check for nearby enemies and enter combat if necessary
    this.checkForEnemies();
    
    // Render
    this.render();
  }


  
  // State change callback handler
  _onStateChange(oldState, newState) {
    // Handle any special logic when states change
    // Controllers handle their own state-specific behaviors
  }

  // --- Command System --- // Static Utility Methods
  // --- Task Management (delegated to TaskManager) ---
  addCommand(command) {
    if (this._taskManager) {
      const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: command.type,
        priority: command.priority || 1,
        data: command,
        timeout: command.timeout || 10000
      };
      this._taskManager.addTask(task);
    }
  }
  
  // --- Enemy Detection and Combat (delegated to CombatController) ---
  checkForEnemies() {
    if (this._combatController) {
      this._combatController.detectEnemies();
      this._nearbyEnemies = this._combatController.getNearbyEnemies();
    } else {
      // Fallback enemy detection
      this._nearbyEnemies = [];
      const detectionRadius = 60; // pixels
      
      // Check all other ants for enemies
      for (let i = 0; i < ant_Index; i++) {
        if (!ants[i] || ants[i] === this) continue;
        
        const otherAnt = ants[i].antObject ? ants[i].antObject : ants[i];
        
        // Check if different faction
        if (otherAnt.faction !== this._faction && this._faction !== "neutral" && otherAnt.faction !== "neutral") {
          const distance = dist(this.posX, this.posY, otherAnt.posX, otherAnt.posY);
          
          if (distance <= detectionRadius) {
            this._nearbyEnemies.push(otherAnt);
          }
        }
      }
      
      // Enter combat if enemies are nearby and not already in combat
      if (this._nearbyEnemies.length > 0 && this._stateMachine.isOutOfCombat()) {
        this._stateMachine.setCombatModifier("IN_COMBAT");
      } else if (this._nearbyEnemies.length === 0 && this._stateMachine.isInCombat()) {
        this._stateMachine.setCombatModifier("OUT_OF_COMBAT");
      }
    }
  }
  
  // --- State Query Methods ---
  isIdle() { return this._stateMachine.isIdle(); }
  isInCombat() { return this._stateMachine.isInCombat(); }
  getCurrentState() { return this._stateMachine.getFullState(); }
  getStateSummary() { return this._stateMachine.getStateSummary(); }
  
  // --- Public Command Interface ---
  startGathering() { this.addCommand({ type: "GATHER" }); }
  startBuilding() { this.addCommand({ type: "BUILD" }); }
  followTarget(target) { this.addCommand({ type: "FOLLOW", target: target }); }
  moveToTarget(x, y) { this.addCommand({ type: "MOVE", x: x, y: y }); }
  
  // Force ant back to idle state (useful for debugging)
  forceIdle() { this._stateMachine.setPrimaryState("IDLE"); }
  
  // Debug method to check ant state
  debugState() {
    return {
      antIndex: this._antIndex,
      primaryState: this._stateMachine.primaryState,
      fullState: this._stateMachine.getFullState(),
      isMoving: this.isMoving,
      canMove: this._stateMachine.canPerformAction("move"),
      isIdle: this._stateMachine.isIdle(),
      hasMovementController: !!this._movementController,
      hasTaskManager: !!this._taskManager,
      hasRenderController: !!this._renderController,
      hasCombatController: !!this._combatController,
      hasTransformController: !!this._transformController,
      hasSelectionController: !!this._selectionController,
      hasTerrainController: !!this._terrainController,
      hasInteractionController: !!this._interactionController
    };
  }
  
  // --- Controller Delegation Helper Methods ---
  
  // Combat controller methods (using available methods)
  isInCombat() { return this._delegate('_combatController', 'isInCombat') || false; }
  getCombatState() { return this._delegate('_combatController', 'getCombatState') || "OUT_OF_COMBAT"; }
  setCombatState(state) { return this._delegate('_combatController', 'setCombatState', state); }
  
  // Combat action methods (fallback implementations - can be extended later)
  attack(target) { 
    console.log(`${this._antIndex} attacking ${target?.antIndex || 'unknown'}`);
    return false; // Placeholder for future implementation
  }
  takeDamage(amount, source) { 
    console.log(`${this._antIndex} taking ${amount} damage from ${source?.antIndex || 'unknown'}`);
    return true; // Placeholder for future implementation
  }
  getHealth() { return 100; } // Placeholder health system
  
  // --- Concise Controller Delegation ---
  
  // Generic method delegation helper
  _delegate(controllerName, methodName, ...args) {
    const controller = this[controllerName];
    return controller?.[methodName]?.(...args);
  }
  
  // Transform controller methods
  scale(factor) { return this._delegate('_transformController', 'scale', factor); }
  rotateTowards(x, y) { 
    if (this._transformController) {
      const pos = this._transformController.getPosition();
      const angle = Math.atan2(y - pos.y, x - pos.x) * (180 / Math.PI);
      this._transformController.setRotation(angle);
    } else {
      // Fallback rotation calculation
      const angle = Math.atan2(y - this.posY, x - this.posX) * (180 / Math.PI);
      this.rotation = angle;
    }
  }
  
  // Selection controller methods
  select() { 
    return this._selectionController?.setSelected(true) || (this.isSelected = true);
  }
  deselect() { 
    return this._selectionController?.setSelected(false) || (this.isSelected = false);
  }
  toggleSelection() { 
    return this._selectionController?.toggleSelected() || (this.isSelected = !this.isSelected);
  }
  
  // Terrain controller methods
  getTerrainType() { return this._delegate('_terrainController', 'getCurrentTerrain') || "DEFAULT"; }
  canMoveOnTerrain() { return this._delegate('_terrainController', 'canMoveOnTerrain') ?? true; }
  forceTerrainCheck() { return this._delegate('_terrainController', 'forceTerrainCheck'); }
  
  // Interaction controller methods  
  onClick() { return this._delegate('_interactionController', 'onClick'); }
  onMouseEnter() { return this._delegate('_interactionController', 'onMouseEnter'); }
  onMouseLeave() { return this._delegate('_interactionController', 'onMouseLeave'); }
  
  // Movement controller methods
  setPath(path) { return this._delegate('_movementController', 'setPath', path); }
  clearPath() { return this._delegate('_movementController', 'setPath', []); } // Clear by setting empty path
  stopMovement() { return this._delegate('_movementController', 'stop'); }
  
  // Task manager methods
  assignTask(taskType, priority = 1, data = {}) {
    if (!this._taskManager) return;
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType, priority, data,
      timeout: data.timeout || 10000
    };
    this._taskManager.addTask(task);
  }
  
  getCurrentTask() { return this._delegate('_taskManager', 'getCurrentTask'); }
  clearAllTasks() { return this._delegate('_taskManager', 'clearAllTasks'); }

  // --- Static Methods (delegated to AntUtilities) ---
  static moveGroupInCircle(antArray, x, y, radius = 40) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.moveGroupInCircle(antArray, x, y, radius);
    } else {
      // Fallback implementation
      const angleStep = (2 * Math.PI) / antArray.length;
      for (let i = 0; i < antArray.length; i++) {
        const angle = i * angleStep;
        const offsetX = Math.cos(angle) * radius;
        const offsetY = Math.sin(angle) * radius;
        antArray[i].moveToLocation(x + offsetX, y + offsetY);
        antArray[i].isSelected = false;
      }
    }
  }

  static selectAntUnderMouse(ants, mx, my) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.selectAntUnderMouse(ants, mx, my);
    } else {
      // Fallback implementation
      let selected = null;
      for (let i = 0; i < ants.length; i++) {
        let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        antObj.isSelected = false;
      }
      for (let i = 0; i < ants.length; i++) {
        let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        if (antObj.isMouseOver(mx, my)) {
          antObj.isSelected = true;
          selected = antObj;
          break;
        }
      }
      return selected;
    }
  }
  
  static moveGroupInLine(antArray, startX, startY, endX, endY) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.moveGroupInLine(antArray, startX, startY, endX, endY);
    }
  }
  
  static moveGroupInGrid(antArray, centerX, centerY, spacing = 40, maxCols = null) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.moveGroupInGrid(antArray, centerX, centerY, spacing, maxCols);
    }
  }
  
  static deselectAllAnts(ants) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.deselectAllAnts(ants);
    }
  }
  
  static getSelectedAnts(ants) {
    if (typeof AntUtilities !== 'undefined') {
      return AntUtilities.getSelectedAnts(ants);
    }
    return [];
  }


}

// --- Move Selected Ant to Tile (delegated to AntUtilities) ---
function moveSelectedEntityToTile(mx, my, tileSize) {
  initializeAntManager();
  const selectedEntity = antManager ? antManager.getSelectedAnt() : null;
  if (selectedEntity) {
    const tileX = Math.floor(mx / tileSize);
    const tileY = Math.floor(my / tileSize);
    if (typeof MovementController !== 'undefined') {
      MovementController.moveEntityToTile(selectedEntity, tileX, tileY, tileSize, GRIDMAP);
    }
    selectedEntity.isSelected = false;
    if (antManager) {
      antManager.clearSelection();
    }
  }
}

function moveSelectedEntitiesToTile(mx, my, tileSize) {
  if (typeof selectedEntities === 'undefined' || selectedEntities.length === 0) return;
  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  for (let i = 0; i < selectedEntities.length; i++) {
    let entity = selectedEntities[i];
    if (entity && entity.antObject) entity = entity.antObject;
    if (typeof MovementController !== 'undefined') {
      MovementController.moveEntityToTile(entity, tileX, tileY, tileSize, GRIDMAP);
      entity.isSelected = false;
    }
  }
  if (antManager) {
    antManager.clearSelection();
  }
}

    // assign each ant its own destination tile around the click
// --- Debug Functions ---
function debugAllAnts() {
  if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
    console.log("=== Ant State Debug ===");
    for (let i = 0; i < Math.min(ant_Index, 5); i++) { // Only debug first 5 ants
      if (ants[i]) {
        const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
        console.log(`Ant ${i}:`, antObj.debugState());
      }
    }
  }
}

function forceAllAntsIdle() {
  if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled) {
    console.log("Forcing all ants to idle state...");
  }
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i]) {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      antObj.forceIdle();
    }
  }
}

// -- DEPRECATED WARNING HELPER --
function deprecatedWarning(newFunction, ...args) {
  console.warn("Using deprecated ant function. Please update to use new controller system.");
  if (typeof newFunction === 'function') {
    return newFunction(...args);
  }
  return newFunction;
}

// -- DEPRECATED --
// Ensures compatibility with previous functions
function Ant_Click_Control() { deprecatedWarning(AntClickControl); }
function Ants_Update() { deprecatedWarning(AntsUpdate); }
function Ants_Spawn(numToSpawn) { deprecatedWarning(AntsSpawn(numToSpawn)); }
function AntClickControl() { deprecatedWarning(antManager.handleAntClick.bind(antManager)); }
function MoveAnt(resetSection) { deprecatedWarning(antManager.moveSelectedAnt.bind(antManager), resetSection); }
function SelectAnt(antCurrent = null) { deprecatedWarning(antManager.selectAnt.bind(antManager), antCurrent); }
function getAntObj(antCurrent) { return deprecatedWarning(antManager.getAntObject.bind(antManager), antCurrent); }

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  // Import AntManager for Node.js testing
  const AntManager = require('../managers/AntManager.js');
  
  // Initialize antManager for Node.js
  if (!antManager) { 
    antManager = new AntManager(); 
  }
  
  module.exports = ant; // Keep primary export as ant class for backward compatibility
  module.exports.AntManager = AntManager;
  module.exports.antManager = antManager;
}