// --- Ant Globals ---
let antToSpawn = 0;
let antIndex = 0;
let antSize;
let ants = [];
let globalResource = [];
let antBaseSprite;
let antbg;
let hasDeLozier = false;
let selectedAnt = null;
let JobImages = {};

// Global ant manager instance - will be initialized when AntManager is available
let antManager = null;

// --- Preload Images and manager ---
function antsPreloader() {
  antSize = createVector(20, 20);
  antbg = [60, 100, 60];
  antBaseSprite = loadImage("Images/Ants/gray_ant.png");
  JobImages = {
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
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite, JobName = "Scout") {
    // Initialize Entity with ant-specific options
    super(posX, posY, sizex, sizey, {
      type: "Ant",
      imagePath: img,
      movementSpeed: movementSpeed,
      selectable: true,
      faction: "player"
    });
    
    // Ant-specific properties
    this._JobName = JobName;
    this._antIndex = antIndex++;
    this.isBoxHovered = false;
    
    // Initialize StatsContainer system
    const initialPos = createVector(posX, posY);
    this._stats = new StatsContainer(
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
  get JobName() { return this._JobName; }
  set JobName(value) { this._JobName = value; }
  get StatsContainer() { return this._stats; }
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
  // Backwards-compatible posX/posY accessors used across unit/integration tests
  // These proxy into the transform controller (or collision box) so older tests
  // that read/write posX/posY continue to work.
  get posX() { return this.getPosition().x; }
  set posX(value) { const p = this.getPosition(); this.setPosition(value, p.y); }
  get posY() { return this.getPosition().y; }
  set posY(value) { const p = this.getPosition(); this.setPosition(p.x, value); }

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
    // When entering DROPPING_OFF, find nearest dropoff and move there
    if (typeof newState === 'string' && newState.includes("DROPPING_OFF")) {
      this._goToNearestDropoff();
    }
    // leaving dropoff clears target
    if (typeof oldState === 'string' && oldState.includes("DROPPING_OFF") && !(typeof newState === 'string' && newState.includes("DROPPING_OFF"))) {
      this._targetDropoff = null;
    }
  }

  // Find nearest DropoffLocation and move to its center. Returns true if a target was found.
  _goToNearestDropoff() {
    const list = (typeof window !== 'undefined' && window.dropoffs) ? window.dropoffs :
                 (typeof dropoffs !== 'undefined' ? dropoffs : []);
    if (!Array.isArray(list) || list.length === 0) return false;
    const pos = this.getPosition();
    let best = null, bestDist = Infinity;
    for (const d of list) {
      if (!d) continue;
      const c = (typeof d.getCenterPx === 'function') ? d.getCenterPx() :
                { x: (d.x + d.width/2) * (d.tileSize || 32), y: (d.y + d.height/2) * (d.tileSize || 32) };
      const dx = c.x - pos.x, dy = c.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    if (!best) return false;
    this._targetDropoff = best;
    const center = best.getCenterPx ? best.getCenterPx() : { x: (best.x + 0.5) * (best.tileSize || 32), y: (best.y + 0.5) * (best.tileSize || 32) };
    if (typeof this.moveToLocation === 'function') this.moveToLocation(center.x, center.y);
    return true;
  }

  // Check arrival at target dropoff; deposit carried resources and transition out of dropoff state.
  _checkDropoffArrival() {
    if (!this._targetDropoff) return;
    const pos = this.getPosition();
    const center = this._targetDropoff.getCenterPx ? this._targetDropoff.getCenterPx() : { x: (this._targetDropoff.x + 0.5) * (this._targetDropoff.tileSize || 32), y: (this._targetDropoff.y + 0.5) * (this._targetDropoff.tileSize || 32) };
    const dist = Math.hypot(center.x - pos.x, center.y - pos.y);
    const size = this.getSize();
    const arrivalThreshold = Math.max(8, (size.x + size.y) * 0.25);
    if (dist <= arrivalThreshold) {
      // take resources from ant and deposit into dropoff
      const taken = (typeof this._resourceManager?.dropAllResources === 'function') ? this._resourceManager.dropAllResources() : [];
      let deposited = 0;
      for (const r of taken) {
        if (!r) continue;
        if (typeof this._targetDropoff.depositResource === 'function') {
          if (this._targetDropoff.depositResource(r)) deposited++;
        } else if (this._targetDropoff.inventory && typeof this._targetDropoff.inventory.addResource === 'function') {
          if (this._targetDropoff.inventory.addResource(r)) deposited++;
        } else if (typeof resources !== 'undefined' && Array.isArray(resources)) {
          resources.push(r); deposited++;
        }
      }
      if (typeof console !== 'undefined') console.log(`Ant ${this._antIndex} deposited ${deposited} resource(s) at dropoff.`);
      if (this._stateMachine) this._stateMachine.setState("IDLE");
      this._targetDropoff = null;
    }
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
    // If currently dropping off, check arrival each frame
    if (this._stateMachine && typeof this._stateMachine.isDroppingOff === 'function' && this._stateMachine.isDroppingOff()) {
      this._checkDropoffArrival();
    }
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
      // If resource manager reached capacity, enter DROPPING_OFF and navigate to nearest dropoff
      if (this._resourceManager.isAtMaxLoad && typeof this._resourceManager.isAtMaxLoad === 'function') {
        if (this._resourceManager.isAtMaxLoad() && this._stateMachine && !this._stateMachine.isDroppingOff()) {
          // set state and trigger movement via state change callback
          this._stateMachine.setState("DROPPING_OFF");
        }
      } else if (this._resourceManager.isAtMaxCapacity) {
        if (this._resourceManager.isAtMaxCapacity && this._resourceManager.isAtMaxCapacity === true && this._stateMachine && !this._stateMachine.isDroppingOff()) {
          this._stateMachine.setState("DROPPING_OFF");
        }
      }
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
      JobName: this.JobName,
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
function antsSpawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let JobName = assignJob();
    let baseAnt = new ant(
      random(0, 500), random(0, 500), 
      antSize.x + sizeR, 
      antSize.y + sizeR, 
      30, 0,
      antBaseSprite,
      JobName
    );
    let antWrapper = new AntWrapper(new Job(baseAnt, JobName, JobImages[JobName]), JobName);
    ants.push(antWrapper);
    antWrapper.update();
    // Register ant with TileInteractionManager for efficient mouse detection
    if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager) {
      const antObj = antWrapper.antObject ? antWrapper.antObject : antWrapper;
      if (antObj) {
        g_tileInteractionManager.addObject(antObj, 'ant');
      }
    }
  }
}

// --- Update All Ants ---
function antsUpdate() {
  for (let i = 0; i < antIndex; i++) {
    if (ants[i] && typeof ants[i].update === "function") {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      
      // Store previous position for TileInteractionManager updates
      let prevPos = null;
      if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager && antObj) {
        const currentPos = antObj.getPosition ? antObj.getPosition() : (antObj.sprite ? antObj.sprite.pos : null);
        if (currentPos) {
          prevPos = { x: currentPos.x, y: currentPos.y };
        }
      }
      
      ants[i].update();
      
      // Update TileInteractionManager with new position if ant moved
      if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager && antObj && prevPos) {
        const newPos = antObj.getPosition ? antObj.getPosition() : (antObj.sprite ? antObj.sprite.pos : null);
        if (newPos && (newPos.x !== prevPos.x || newPos.y !== prevPos.y)) {
          g_tileInteractionManager.updateObjectPosition(antObj, newPos.x, newPos.y);
        }
      }
    }
  }
}

// --- Render All Ants (Separated from Updates) ---
function antsRender() {
  // Render all ants in a single pass for better performance
  for (let i = 0; i < antIndex; i++) {
    if (ants[i]) {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      
      // Render the ant if it has a render method and is active
      if (antObj && typeof antObj.render === "function") {
        // Check if ant should be rendered (not culled, active, etc.)
        if (antObj.isActive !== false) { // Default to true if property doesn't exist
          antObj.render();
        }
      }
    }
  }
}

// --- Update and Render All Ants (Legacy function for backward compatibility) ---
function antsUpdateAndRender() {
  antsUpdate();
  antsRender();
}




// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ant, antsSpawn, antsUpdate, antsRender, antsUpdateAndRender, antLoopPropertyCheck };
}