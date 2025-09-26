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

function initializeAntManager() {
  if (typeof AntManager !== 'undefined' && !antManager) {
    antManager = new AntManager();
  // AntManager initialized successfully
  } else if (typeof AntManager === 'undefined') {
    console.error('AntManager class not available - functions will fall back to basic implementations');
  }
}



// --- Entity-based Ant Class ---
// Inherits all controller functionality from Entity base class
class ant extends Entity {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite, speciesName = "Scout") {
    // Initialize Entity with ant-specific options
    super(posX, posY, sizex, sizey, {
      type: "Ant",
      imagePath: img,
      movementSpeed: movementSpeed,
      selectable: true,
      faction: "player"
    });
    
    // Ant-specific properties
    this._speciesName = speciesName;
    this._antIndex = ant_Index++;
    this.isBoxHovered = false;
    
    // Initialize stats system
    const initialPos = createVector(posX, posY);
    this._stats = new stats(
      initialPos,
      { x: sizex, y: sizey },
      movementSpeed,
      initialPos.copy()
    );
    
    // Initialize resource management
    this._resourceManager = new ResourceManager(this, 2, 25);
    
    // Initialize state machine
    this._stateMachine = new AntStateMachine();
    this._stateMachine.setStateChangeCallback((oldState, newState) => {
      this._onStateChange(oldState, newState);
    });
    
    // Faction and enemy tracking
    this._faction = "player";
    this._enemies = [];
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = 30; // frames
    
    // Combat properties
    this._health = 100;
    this._maxHealth = 100;
    this._damage = 10;
    this._attackRange = 50;
    
    // Set initial image if provided
    if (img && typeof img !== 'string') {
      this.setImage(img);
    }
  }

  // --- Ant-specific Getters/Setters ---
  get antIndex() { return this._antIndex; }
  get speciesName() { return this._speciesName; }
  set speciesName(value) { this._speciesName = value; }
  get stats() { return this._stats; }
  get resourceManager() { return this._resourceManager; }
  get stateMachine() { return this._stateMachine; }
  get faction() { return this._faction; }
  get health() { return this._health; }
  get maxHealth() { return this._maxHealth; }
  get damage() { return this._damage; }
  
  // --- Controller Access for Test Compatibility ---
  get _movementController() { return this.getController('movement'); }
  get _taskManager() { return this.getController('taskManager'); }
  get _renderController() { return this.getController('render'); }
  get _selectionController() { return this.getController('selection'); }
  get _combatController() { return this.getController('combat'); }
  get _transformController() { return this.getController('transform'); }
  get _terrainController() { return this.getController('terrain'); }
  get _interactionController() { return this.getController('interaction'); }
  
  // --- Property/Method Compatibility ---
  get isMoving() { return this._delegate('movement', 'getIsMoving') || false; }
  get isSelected() {
    const result = this._delegate('selection', 'isSelected') || false;
    // Debug: log when selection state is queried
  //
    return result;
  }
  set isSelected(value) {
    // Debug: log when selection state is set

    this._delegate('selection', 'setSelected', value);
  }
  
  // --- Command/Task Compatibility ---
  addCommand(command) { return this._delegate('taskManager', 'addTask', command); }
  
  // --- State Machine Integration ---
  _onStateChange(oldState, newState) {
  //
  }
  
  getCurrentState() { return this._stateMachine?.getCurrentState() || "IDLE"; }
  setState(newState) { return this._stateMachine?.setState(newState); }
  
  // --- Combat Methods ---
  takeDamage(amount) {
    this._health = Math.max(0, this._health - amount);
    if (this._health <= 0) {
      this.die();
    }
    return this._health;
  }
  
  heal(amount) {
    this._health = Math.min(this._maxHealth, this._health + amount);
    return this._health;
  }
  
  attack(target) {
    if (target && target.takeDamage) {
      return target.takeDamage(this._damage);
    }
    return false;
  }
  
  die() {
    this.isActive = false;
    this.setState("DEAD");

  }
  
  // --- Resource Methods ---
  getResourceCount() { return this._resourceManager?.getCurrentLoad() || 0; }
  getMaxResources() { return this._resourceManager?.maxCapacity || 0; }
  addResource(resource) { return this._resourceManager?.addResource(resource) || false; }
  removeResource(amount = 1) { 
    // ResourceManager doesn't have removeResource, use dropAllResources for now
    const dropped = this._resourceManager?.dropAllResources() || [];
    return dropped.length > 0;
  }
  dropAllResources() { return this._resourceManager?.dropAllResources() || []; }
  
  // --- Update Override ---
  update() {
    if (!this.isActive) return;
    
    // Update Entity systems first
    super.update();
    
    // Update ant-specific systems
    this._updateStats();
    this._updateStateMachine();
    this._updateResourceManager();
    this._updateEnemyDetection();
  }
  
  _updateStats() {
    if (this._stats) {
      const pos = this.getPosition();
      this._stats.position = createVector(pos.x, pos.y);
    }
  }
  
  _updateStateMachine() {
    if (this._stateMachine) {
      this._stateMachine.update();
    }
  }
  
  _updateResourceManager() {
    if (this._resourceManager) {
      this._resourceManager.update();
    }
  }
  
  _updateEnemyDetection() {
    // Check for enemies periodically
    if (frameCount - this._lastEnemyCheck > this._enemyCheckInterval) {
      this._enemies = this.detectEnemies() || [];
      this._lastEnemyCheck = frameCount;
    }
  }
  
  // --- Render Override ---
  render() {
    if (!this.isActive) return;

    if (this._renderController) {
      // Update highlighting based on current state
      if (this.isSelected) {
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
    }

    // Use Entity rendering (handles sprite automatically)
    super.render();

    // --- Selection Box Rendering ---
    const pos = this.getPosition();
    const size = this.getSize();
    let borderColor = null;

    // Add ant-specific rendering
    this._renderHealthBar();
    this._renderResourceIndicator();
  }
  
  _renderHealthBar() {
    if (this._health < this._maxHealth) {
      const pos = this.getPosition();
      const size = this.getSize();
      
      // Health bar background
      fill(255, 0, 0);
      rect(pos.x, pos.y - 8, size.x, 4);
      
      // Health bar foreground
      fill(0, 255, 0);
      rect(pos.x, pos.y - 8, (size.x * this._health) / this._maxHealth, 4);
    }
  }
  
  _renderResourceIndicator() {
    const resourceCount = this.getResourceCount();
    if (resourceCount > 0) {
      const pos = this.getPosition();
      const size = this.getSize();
      
      fill(255, 255, 0);
      textAlign(CENTER);
      text(resourceCount, pos.x + size.x/2, pos.y - 12);
    }
  }
  
  // --- Debug Override ---
  getDebugInfo() {
    const baseInfo = super.getDebugInfo();
    return {
      ...baseInfo,
      antIndex: this._antIndex,
      speciesName: this.speciesName,
      currentState: this.getCurrentState(),
      health: `${this._health}/${this._maxHealth}`,
      resources: `${this.getResourceCount()}/${this.getMaxResources()}`,
      faction: this._faction,
      enemies: this._enemies.length
    };
  }
  
  // --- Cleanup Override ---
  destroy() {
    this._stateMachine = null;
    this._resourceManager = null;
    this._stats = null;
    super.destroy();
  }
}

// --- Ant Management Functions ---

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
    let antWrapper = new AntWrapper(new Species(baseAnt, speciesName, speciesImages[speciesName]), speciesName);
    ants.push(antWrapper);
    antWrapper.update();
    // Register ant with TileInteractionManager for efficient mouse detection
    if (typeof tileInteractionManager !== 'undefined' && tileInteractionManager) {
      const antObj = antWrapper.antObject ? antWrapper.antObject : antWrapper;
      if (antObj) {
        tileInteractionManager.addObject(antObj, 'ant');
      }
    }
  }
}

// --- Update All Ants ---
function AntsUpdate() {
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i] && typeof ants[i].update === "function") {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      
      // Store previous position for TileInteractionManager updates
      let prevPos = null;
      if (typeof tileInteractionManager !== 'undefined' && tileInteractionManager && antObj) {
        const currentPos = antObj.getPosition ? antObj.getPosition() : (antObj.sprite ? antObj.sprite.pos : null);
        if (currentPos) {
          prevPos = { x: currentPos.x, y: currentPos.y };
        }
      }
      
      ants[i].update();
      
      // Update TileInteractionManager with new position if ant moved
      if (typeof tileInteractionManager !== 'undefined' && tileInteractionManager && antObj && prevPos) {
        const newPos = antObj.getPosition ? antObj.getPosition() : (antObj.sprite ? antObj.sprite.pos : null);
        if (newPos && (newPos.x !== prevPos.x || newPos.y !== prevPos.y)) {
          tileInteractionManager.updateObjectPosition(antObj, newPos.x, newPos.y);
        }
      }
      
      // Also render the ant if it has a render method
      if (antObj && typeof antObj.render === "function") {
        antObj.render();
      }
    }
  }
}


// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ant, AntsSpawn, AntsUpdate, antLoopPropertyCheck };
}