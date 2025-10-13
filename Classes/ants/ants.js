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
    Builder: loadImage('Images/Ants/gray_ant_builder.png'),
    Scout: loadImage('Images/Ants/gray_ant_scout.png'),
    Farmer: loadImage('Images/Ants/gray_ant_farmer.png'),
    Warrior: loadImage('Images/Ants/gray_ant.png'), // We don't have a gray ant warrior
    Spitter: loadImage('Images/Ants/gray_ant_spitter.png'),
    DeLozier: loadImage('Images/Ants/greg.jpg')
  };
  initializeAntManager();
}

/** Initializes the AntManager instance */
function initializeAntManager() { antManager = new AntManager(); }



// --- Entity-based Ant Class ---
// Inherits all controller functionality from Entity base class
class ant extends Entity {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite, JobName = "Scout", faction = "player") {
    // Initialize Entity with ant-specific options
    super(posX, posY, sizex, sizey, {
      type: "Ant",
      imagePath: img,
      movementSpeed: movementSpeed,
      selectable: true,
      faction: faction
    });
    
    // Ant-specific properties
    this._JobName = JobName;
    this._antIndex = antIndex++;
    this.isBoxHovered = false;
    
    // New job system (component-based)
    this.job = null;  // Will hold JobComponent instance
    this.jobName = JobName || "Scout";  // Direct job name access
    
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
    this._faction = faction;
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
  set faction(value) { this._faction = value; }
  get nearbyEnemies() { return this._nearbyEnemies; }

  // --- Sprite2D Helpers ---
  setSpriteImage(img) { this._sprite.setImage(img); }
  setSpritePosition(pos) { this._sprite.setPosition(pos); }
  setSpriteSize(size) { this._sprite.setSize(size); }
  setSpriteRotation(rotation) { this._sprite.setRotation(rotation); }

  // --- Rendering ---
  render() {
    const mousePoint = typeof getWorldMousePosition === 'function'
      ? getWorldMousePosition()
      : { x: mouseX, y: mouseY };

    if (this._renderController) {
      // Update highlighting based on current state
      if (this._isSelected) {
        this._renderController.highlightSelected();
      } else if (this.isMouseOver(mousePoint.x, mousePoint.y)) {
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
    const mousePoint = typeof getWorldMousePosition === 'function'
      ? getWorldMousePosition()
      : { x: mouseX, y: mouseY };

    // Use abstract highlighting functions from selectionBox.js if available
    if (typeof highlightEntity === 'function') {
      if (this._isSelected) {
        highlightEntity(this, "selected");
        if (typeof renderDebugInfo === 'function') renderDebugInfo(this);
      } else if (this.isMouseOver(mousePoint.x, mousePoint.y)) {
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
  
  // --- Mouse Over Detection ---
  isMouseOver(mx, my) {
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    return (
      mx >= pos.x &&
      mx <= pos.x + size.x &&
      my >= pos.y &&
      my <= pos.y + size.y
    );
  }

  setPath(path) { 
    if (this._movementController) {
      this._movementController.setPath(path);
    } else {
      this._path = path;
    }
  }

  // --- Skitter Logic ---
  setTimeUntilSkitter(value) { this._timeUntilSkitter = value; }
  rndTimeUntilSkitter() { 
    this._timeUntilSkitter = random(30, 200); // Generate new random value each time
  }
  getTimeUntilSkitter() { return this._timeUntilSkitter; }

  // --- Position and Size ---
  set posX(value) {
    this._stats.position.statValue.x = value;
    this._sprite.pos.x = value;
  }
  get posX() { return this._stats.position.statValue.x; }

  set posY(value) {
    this._stats.position.statValue.y = value;
    this._sprite.pos.y = value;
  }
  get posY() { return this._stats.position.statValue.y; }

  // Helper methods for abstract highlighting functions
  getPosition() {
    return this._sprite.pos;
  }
  
  getSize() {
    return this._sprite.size;
  }

  get center() {
    const pos = this._stats.position.statValue;
    const size = this._stats.size.statValue;
    return createVector(pos.x + (size.x / 2), pos.y + (size.y / 2));
  }

  set sizeX(value) { this._stats.size.statValue.x = value; }
  get sizeX() { return this._stats.size.statValue.x; }
  set sizeY(value) { this._stats.size.statValue.y = value; }
  get sizeY() { return this._stats.size.statValue.y; }

  // --- Movement Speed ---
  set movementSpeed(value) { this._stats.movementSpeed.statValue = value; }
  get movementSpeed() { return this._stats.movementSpeed.statValue; }
  
  // Get effective movement speed modified by terrain
  getEffectiveMovementSpeed() {
    let baseSpeed = this.movementSpeed;
    
    // Apply terrain modifiers
    switch (this._stateMachine.terrainModifier) {
      case "IN_WATER": return baseSpeed * 0.5; // 50% speed in water
      case "IN_MUD":return baseSpeed * 0.3; // 30% speed in mud
      case "ON_SLIPPERY":return 0; // Can't move on slippery terrain
      case "ON_ROUGH": return baseSpeed * 0.8; // 80% speed on rough terrain
      case "DEFAULT":
      default:return baseSpeed; // Normal speed
    }
  }

  // --- Rotation ---
  set rotation(value) {
    this._sprite.rotation = value;
    while (this._sprite.rotation > 360) this._sprite.rotation -= 360;
    while (this._sprite.rotation < -360) this._sprite.rotation += 360;
  }
  get rotation() { return this._sprite.rotation; }

  // In Range Of Resource


  // --- Move Logic ---
  moveToLocation(X, Y) {
    // Use MovementController if available
    if (this._movementController) {
      return this._movementController.moveToLocation(X, Y);
    } else {
      // Fallback to legacy movement logic
      if (this._stateMachine.canPerformAction("move")) {
        this._stats.pendingPos.statValue.x = X;
        this._stats.pendingPos.statValue.y = Y;
        this._isMoving = true;
        this._stateMachine.setPrimaryState("MOVING");
        return true;
      }
      return false;
    }
  }
  
  // Detect terrain at current position (placeholder - you'll need to integrate with your terrain system)
  detectTerrain() {
    // This is a placeholder - you'll need to integrate with your actual terrain/grid system
    // For now, return DEFAULT terrain
    // In the future, you could check grid tiles, water bodies, etc.
    
    // Example terrain detection logic (replace with your actual terrain system):
    // const tileX = Math.floor(this.posX / TILE_SIZE);
    // const tileY = Math.floor(this.posY / TILE_SIZE);
    // const terrainType = getTerrainAt(tileX, tileY);
    
    return "DEFAULT"; // Placeholder
  }
  
  // Update terrain state based on current position
  updateTerrainState() {
    const currentTerrain = this.detectTerrain();
    if (this._stateMachine.terrainModifier !== currentTerrain) {
      this._stateMachine.setTerrainModifier(currentTerrain);
    }

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
        } else if (resources && Array.isArray(resources)) {
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
    const oldHealth = this._health;
    this._health = Math.max(0, this._health - amount);
    
    // Notify health controller of damage
    if (this._healthController && oldHealth > this._health) {
      this._healthController.onDamage();
    }
    
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
    this._updateHealthController();
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

  _updateHealthController() {
    if (this._healthController) {
      this._healthController.update();
    }
  }

   _renderBoxHover() {
    this._renderController.highlightBoxHover();
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

    // Use Entity rendering (handles sprite and highlights automatically)
    super.render();

    // Add ant-specific rendering
    if (this._healthController) {
      this._healthController.render();
    }
    this._renderResourceIndicator();
    if (this.isBoxHovered) {
      this._renderBoxHover();
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
  
  // --- Selenium Testing Getters (Ant-specific) ---

  /**
   * Get ant index (for Selenium validation)
   * @returns {number|null} Ant's index in the ants array
   */
  getAntIndex() {
    return this._antIndex || null;
  }

  /**
   * Get ant health information (for Selenium validation)
   * @returns {Object} Health data
   */
  getHealthData() {
    return {
      current: this._health,
      max: this._maxHealth,
      percentage: Math.round((this._health / this._maxHealth) * 100)
    };
  }

  /**
   * Get ant resource information (for Selenium validation)
   * @returns {Object} Resource data
   */
  getResourceData() {
    return {
      current: this.getResourceCount(),
      max: this.getMaxResources(),
      percentage: Math.round((this.getResourceCount() / this.getMaxResources()) * 100)
    };
  }

  /**
   * Get ant combat information (for Selenium validation)
   * @returns {Object} Combat data
   */
  getCombatData() {
    return {
      enemies: this._enemies.length,
      inCombat: this._enemies.length > 0,
      faction: this._faction
    };
  }

  /**
   * Get available jobs list (for Selenium validation)
   * @returns {Array<string>} Available job types
   */
  static getAvailableJobs() {
    return Object.keys(JobImages || {});
  }

  /**
   * Get complete ant validation data (for Selenium validation)
   * @returns {Object} Complete validation data for testing
   */
  getAntValidationData() {
    const baseData = super.getValidationData();
    return {
      ...baseData,
      antIndex: this.getAntIndex(),
      health: this.getHealthData(),
      resources: this.getResourceData(),
      combat: this.getCombatData(),
      jobName: this.getJobName(),
      availableJobs: ant.getAvailableJobs(),
      antSpecific: {
        enemies: this._enemies.length,
        maxHealth: this._maxHealth,
        maxResources: this.getMaxResources()
      }
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

// --- Job Assignment Function ---
function assignJob() {
  const JobList = ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter'];
  const specialJobList = ['DeLozier'];
  const availableJobs = !hasDeLozier ? [...JobList, ...specialJobList] : JobList;
  
  const chosenJob = availableJobs[Math.floor(random(0, availableJobs.length))];
  if (chosenJob === "DeLozier") { 
    hasDeLozier = true; 
  }
  return chosenJob;
}

// --- Spawn Ants ---
function antsSpawn(numToSpawn, faction = "neutral") {
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let JobName = assignJob();
    
    // Create ant directly with new job system
    let newAnt = new ant(
      random(0, 500), random(0, 500), 
      antSize.x + sizeR, 
      antSize.y + sizeR, 
      30, 0,
      antBaseSprite,
      JobName,
      faction
    );
    
    // Assign job using new component system
    newAnt.assignJob(JobName, JobImages[JobName]);
    
    // Store ant directly (no wrapper!)
    ants.push(newAnt);
    newAnt.update();
    
    // Register ant with TileInteractionManager for efficient mouse detection
    if (g_tileInteractionManager) {
      g_tileInteractionManager.addObject(newAnt, 'ant');
    }
  }
}

// --- Update All Ants ---
function antsUpdate() {
  for (let i = 0; i < ants.length; i++) {
    if (ants[i] && typeof ants[i].update === "function") {
      // Store previous position for TileInteractionManager updates
      let prevPos = null;
      if (g_tileInteractionManager && ants[i]) {
        const currentPos = ants[i].getPosition ? ants[i].getPosition() : (ants[i].sprite ? ants[i].sprite.pos : null);
        if (currentPos) {
          prevPos = { x: currentPos.x, y: currentPos.y };
        }
      }
      
      ants[i].update();
      
      // Update TileInteractionManager with new position if ant moved
      if (g_tileInteractionManager && ants[i] && prevPos) {
        const newPos = ants[i].getPosition ? ants[i].getPosition() : (ants[i].sprite ? ants[i].sprite.pos : null);
        if (newPos && (newPos.x !== prevPos.x || newPos.y !== prevPos.y)) {
          g_tileInteractionManager.updateObjectPosition(ants[i], newPos.x, newPos.y);
        }
      }
    }
  }
}

// --- Render All Ants (Separated from Updates) ---
function antsRender() {
  // Start render phase tracking for legacy rendering
  if (g_performanceMonitor) {
    g_performanceMonitor.startRenderPhase('rendering');
  }
  
  // Render all ants in a single pass for better performance
  for (let i = 0; i < ants.length; i++) {
      // Check if ant should be rendered (not culled, active, etc.)
      if (ants[i].isActive()) {
        g_performanceMonitor.startEntityRender(ants[i]);        
        ants[i].render();
        g_performanceMonitor.endEntityRender();
        }
    }
  
  
  // End render phase tracking and finalize performance data
  if (g_performanceMonitor) {
    g_performanceMonitor.endRenderPhase();
    g_performanceMonitor.recordEntityStats(ants.length, ants.length, 0, { ant: ants.length });
    g_performanceMonitor.finalizeEntityPerformance();
  }
}

// --- Update and Render All Ants (Legacy function for backward compatibility) ---
function antsUpdateAndRender() {
  antsUpdate();
  antsRender();
}




// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    ant, 
    antsSpawn, 
    antsUpdate, 
    antsRender, 
    antsUpdateAndRender, 
    assignJob, 
    handleSpawnCommand,
    antsPreloader,
    // Export reference to local variables for testing
    getAntSize: () => antSize,
    setAntSize: (size) => { antSize = size; },
    getAnts: () => ants,
    getAntIndex: () => antIndex,
    setAntIndex: (index) => { antIndex = index; }
  };
}

// Simple wrapper for handleSpawnCommand to match test expectations
function handleSpawnCommand(count, faction) {
  // Create ants using antsSpawn with the new signature
  antsSpawn(count, faction);
}

// Make functions available globally for browser environment
if (typeof window !== 'undefined') {
  window.ant = ant;
  window.antsSpawn = antsSpawn;
  window.antsUpdate = antsUpdate;
  window.antsRender = antsRender;
  window.antsUpdateAndRender = antsUpdateAndRender;
  window.assignJob = assignJob;
  window.handleSpawnCommand = handleSpawnCommand;
} else if (typeof global !== 'undefined') {
  global.ant = ant;
  global.antsSpawn = antsSpawn;
  global.antsUpdate = antsUpdate;
  global.antsRender = antsRender;
  global.antsUpdateAndRender = antsUpdateAndRender;
  global.assignJob = assignJob;
  global.handleSpawnCommand = handleSpawnCommand;
}
