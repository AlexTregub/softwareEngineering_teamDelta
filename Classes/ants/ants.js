// --- Ant Globals ---
let antToSpawn = 0;
let antIndex = 0;
let antSize;
let queenSize;
let ants = [];
let globalResource = [];
let antBaseSprite;
let antbg;
let hasDeLozier = false;
let hasQueen = false;
let selectedAnt = null;
let JobImages = {};

// Global ant manager instance - will be initialized when AntManager is available
let antManager = null;
let animationManager = null;

// --- Preload Images and manager ---
function antsPreloader() {
  antSize = createVector(20, 20);
  queenSize = createVector(30, 30);
  console.log("queenSize",queenSize)
  antbg = [60, 100, 60];
  antBaseSprite = loadImage("Images/Ants/gray_ant.png");
  JobImages = {
    Builder: loadImage('Images/Ants/gray_ant_builder.png'),
    Scout: loadImage('Images/Ants/gray_ant_scout.png'),
    Farmer: loadImage('Images/Ants/gray_ant_farmer.png'),
    Warrior: loadImage('Images/Ants/gray_ant_soldier.png'), // We don't have a gray ant warrior
    Spitter: loadImage('Images/Ants/gray_ant_spitter.png'),
    // DeLozier: loadImage('Images/Ants/greg.jpg'),
    Queen:  loadImage('Images/Ants/gray_ant_queen.png'),
    Spider: loadImage('Images/Ants/spider.png'),
    waveEnemy: loadImage("Images/Ants/gray_ant.png"),

  };
  initializeAntManager();
}

/** Initializes the AntManager instance */
function initializeAntManager() { antManager = new AntManager(); animationManager = new AnimationManager(); }



// --- Entity-based Ant Class ---
// Inherits all controller functionality from Entity base class
class ant extends Entity {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite, JobName = "Scout", faction = "player") {
    // Initialize Entity with ant-specific options
    // Use "Queen" type if JobName is "Queen", otherwise "Ant"
    super(posX, posY, sizex, sizey, {
      type: JobName === "Queen" ? "Queen" : "Ant",
      imagePath: img,
      movementSpeed: movementSpeed,
      selectable: true,
      faction: faction
    });
    
    // Ant-specific properties
    this._JobName = JobName;
    this._antIndex = antIndex++;
    this.isBoxHovered = false;
    this.brain;
    this.pathType = null;
    this._idleTimer = 0;
    this._idleTimerTimeout = 1;
    this.lastFrameTime = performance.now();

    
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
    this._resourceManager = new ResourceManager(this, 10, 25);
    
    // Initialize state machine
    this._stateMachine = new AntStateMachine();
    this._stateMachine.setStateChangeCallback((oldState, newState) => {
      this._onStateChange(oldState, newState);
    });
    
    // Initialize Gather State behavior
    this._gatherState = new GatherState(this);
    

    // Faction and enemy tracking
    this._faction = faction;
    this._enemies = [];
    this._lastEnemyCheck = 0;
    this._enemyCheckInterval = 50; // frames
    
    // Combat properties
    this._health = 100;
    this._maxHealth = 100;
    this._damage = 0;
    this._attackRange = 30;
    this._combatTarget = null; // Current target this ant is attacking
    this._attackCooldown = 1; // seconds
    this._lastAttackTime = 0; // Timestamp of the last attack

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
  get gatherState() { return this._gatherState; }
  get faction() { return this._faction; }
  get health() { return this._health; }
  get maxHealth() { return this._maxHealth; }
  get damage() { return this._damage; }
  
  // --- New Job System Methods ---
  assignJob(jobName, image = null) {
    // Create job component if JobComponent is available
    if (typeof JobComponent !== 'undefined') {
      this.job = new JobComponent(jobName, image);
      this._applyJobStats(this.job.stats);
    } else {
      // Fallback for when JobComponent isn't loaded yet
      console.warn('JobComponent not available, using fallback job assignment');
      const stats = this._getFallbackJobStats(jobName);
      this._applyJobStats(stats);
    }
    
    // Update job name properties
    this.jobName = jobName;
    this._JobName = jobName;  // Keep legacy property in sync
    this.brain = new AntBrain(this, jobName);
    
    // Set image if provided
    if (image) {
      this.setImage(image);
    }
    
    return this;
  }
  
  _applyJobStats(stats) {
    // Apply job stats to ant properties
    this._maxHealth = stats.health;
    this._health = stats.health;
    this._damage = stats.strength;
    
    // Apply to StatsContainer if available
    if (this._stats) {
      this._stats.strength.statValue = stats.strength;
      this._stats.health.statValue = stats.health;
      this._stats.gatherSpeed.statValue = stats.gatherSpeed;
      this._stats.movementSpeed.statValue = stats.movementSpeed;
    }
    
    // Apply to movement controller if available
    const movementController = this.getController('movement');
    if (movementController) {
      movementController.movementSpeed = stats.movementSpeed;
    }

    const combat = this.getController('combat');
    switch(this.jobName){
      case "Queen":
        // combat._detectionRadius = 300;
        // this._attackRange = combat._detectionRadius - 50; 
        break;
      case "Spitter":
        // combat._detectionRadius = 250;
        // this._attackRange = 250; 
        break;
      case "Spider":
        combat._detectionRadius = 300;
        break;
      case "Farmer" :
        combat._detectionRadius = 250;
        break;
      case "Builder" :
        combat._detectionRadius = 250;
        break;
      case "Scout" :
        combat._detectionRadius = 500; 
        break;
    }
  }
  
_getFallbackJobStats(jobName) {
  // Balanced fallback stats when JobComponent isn't available
  switch (jobName) {
    case "Builder":
      // Strong enough to build and carry, average mobility
      return { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 55 };

    case "Scout":
      // Fast and agile, but fragile
      return { strength: 10, health: 70, gatherSpeed: 8, movementSpeed: 85 };

    case "Farmer":
      // Focused on gathering efficiency
      return { strength: 15, health: 100, gatherSpeed: 35, movementSpeed: 50 };

    case "Warrior":
      // Heavy combat role: high strength and durability, slower speed
      return { strength: 45, health: 6000, gatherSpeed: 5, movementSpeed: 45 };

    case "Spitter":
      // Ranged attacker: moderate health, good damage, slightly faster than warrior
      return { strength: 35, health: 110, gatherSpeed: 5, movementSpeed: 55 };

    case "DeLozier":
      return { strength: 45, health: 160, gatherSpeed: 5, movementSpeed: 45 };

    case "Queen":
      // Central unit: extremely durable but immobile and weak in combat
      return { strength: 25, health: 1000, gatherSpeed: 1, movementSpeed: 10 };

    case "Spider":
      return { strength: 80, health: 6000, gatherSpeed: 3, movementSpeed: 45 };

    default:
      // Generic fallback for untyped ants
      return { strength: 15, health: 100, gatherSpeed: 10, movementSpeed: 60 };
  }
}

  getJobStats() {
    return this.job ? this.job.stats : this._getFallbackJobStats(this.jobName);
  }
  
  // --- Controller Access for Test Compatibility ---
  get _movementController() { return this.getController('movement'); }
  get _taskManager() { return this.getController('taskManager'); }
  get _renderController() { return this.getController('render'); }
  get _selectionController() { return this.getController('selection'); }
  get _combatController() { return this.getController('combat'); }
  get _transformController() { return this.getController('transform'); }
  get _terrainController() { return this.getController('terrain'); }
  get _interactionController() { return this.getController('interaction'); }
  get _healthController() { return this.getController('health'); }
  
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
    const list = (window && window.dropoffs) ? window.dropoffs :
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
        } else if (resources && Array.isArray(resources)) {
          resources.push(r); deposited++;
        }
      }
      if (typeof console !== 'undefined') logNormal(`Ant ${this._antIndex} deposited ${deposited} resource(s) at dropoff.`);
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

    // Attack animation
    if(animationManager.isAnimation("Attack")){
      animationManager.play(this._entity,"Attack");
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
    // this.setState("DEAD");
    this._combatTarget = null; // Clear target when dying
    // Remove this ant from all game systems
    this._removeFromGame();
  }

  // Used for entering buildings during raids
  onEnterHive(){
    this.die();
  }
  
  /**
   * Remove this ant from all game systems when it dies
   */
  _removeFromGame() {
    logNormal(`💀 Removing dead ant ${this._antIndex} from game systems`);

    // Clear entity from faction attack tracking
    for(let obj in factionList){
      if(factionList[obj].isUnderAttack == this){
        factionList[obj].isUnderAttack = null;
      }
    }
    
    // 1. Remove from global ants array
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      const index = ants.indexOf(this);
      if (index !== -1) {
        ants.splice(index, 1);
        logNormal(`   ✅ Removed from ants array (${ants.length} remaining)`);
      }
    }
    
    // // 2. Remove from TileInteractionManager
    if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager) {
      const pos = this.getPosition();
      if (pos && typeof g_tileInteractionManager.removeObjectFromTile === 'function') {
        const tileX = Math.floor(pos.x / (g_tileInteractionManager.tileSize || 32));
        const tileY = Math.floor(pos.y / (g_tileInteractionManager.tileSize || 32));
        g_tileInteractionManager.removeObjectFromTile(this, tileX, tileY);
        logNormal(`   ✅ Removed from TileInteractionManager`);
      }
    }
    
    // // 3. Clear from selection systems
    if (this.isSelected) {
      this.isSelected = false;
      
      // Update SelectionBoxController if available
      if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
        if (g_selectionBoxController.entities && Array.isArray(g_selectionBoxController.entities)) {
          g_selectionBoxController.entities = ants; // Update to current ants array
        }
      }
      
      // Clear from ant manager if this was the selected ant
      if (typeof antManager !== 'undefined' && antManager && antManager.selectedAnt === this) {
        antManager.selectedAnt = null;
      }
      
      logNormal(`   ✅ Cleared from selection systems`);
    }
    
    // // 4. Clear combat targets pointing to this dead ant
    if (typeof ants !== 'undefined' && Array.isArray(ants)) {
      ants.forEach(otherAnt => {
        if (otherAnt._combatTarget === this) {
          otherAnt._combatTarget = null;
          logNormal(`   ✅ Cleared combat target from ant ${otherAnt._antIndex}`);
        }
      });
    }
    
    // // 5. Update UI selection entities if function exists
    if (typeof updateUISelectionEntities === 'function') {
      updateUISelectionEntities();
      logNormal(`   ✅ Updated UI selection entities`);
    }

    
    // Remove from selectables so selection system stops referencing it
    if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
      const sidx = selectables.indexOf(this);
      if (sidx !== -1) selectables.splice(sidx, 1);
    }

    //
    // Also update selection controller's entities if it stores a snapshot
    // if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
    //   if (g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
    // }
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
  
  // --- Gather State Methods ---
  /**
   * Start autonomous gathering behavior
   */
  startGathering() {
    if (this._stateMachine) {
      this._stateMachine.setPrimaryState("GATHERING");
    }
  }
  
  /**
   * Stop gathering and return to idle
   */
  stopGathering() {
    if (this._stateMachine) {
      this._stateMachine.setPrimaryState("IDLE");
    }
  }
  
  /**
   * Check if ant is currently in gathering state
   * @returns {boolean} True if ant is gathering
   */
  isGathering() {
    return this._stateMachine?.isGathering() || false;
  }
  
  // --- Update Override ---
  
  update() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
    this.lastFrameTime = now;

    if (!this.isActive) return;

    // disable resource gathering for non-player factions
    let cantCollect = ["Spider","Warrior","DeLozier",'Scout','Spitter'];
    if(this._gatherState && (this._faction != "player" || cantCollect.includes(this.jobName))){
      this._gatherState.isActive = false;
    }
    // Update Entity systems first
    super.update();
    
    // Update ant-specific systems
    this.brain.update(deltaTime);
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
      
      // Update gather state behavior if ant is in GATHERING state
      if (this._stateMachine.getCurrentState() == "GATHERING" && this._stateMachine.isGathering() && this._gatherState) {
        if (!this._gatherState.isActive) {
          //logNormal(`🔍 Ant ${this.id} entering GatherState (GATHERING state detected)`);
          this._gatherState.enter() 
        }
        if (this._gatherState.update()) {this.stateMachine.beginIdle();};
      } else if (this._gatherState && this._gatherState.isActive) {
        //logNormal(`🔍 Ant ${this.id} exiting GatherState (no longer GATHERING)`);
        this._gatherState.exit();
        
      }
    }
   if (this._stateMachine.getCurrentState() === "IDLE") {
    // deltaTime from p5.js is in milliseconds — convert to seconds.
    const dt = (typeof deltaTime !== 'undefined') ? deltaTime / 1000 : (1 / 60); // fallback ~16.67ms
    this._idleTimer += dt;
  } else {
    this._idleTimer = 0;
  }if (this._stateMachine.getCurrentState() == "IDLE" && this._idleTimer >= this._idleTimerTimeout) {
      this._stateMachine.ResumePreferredState()
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
      // Use the combat controller's built-in update which detects enemies AND updates combat state
      const combatController = this.getController('combat');
      if (combatController && typeof combatController.update === 'function') {
        combatController.update(); // This calls detectEnemies() and updateCombatState()
        this._enemies = combatController.getNearbyEnemies() || [];
      }
      
      this._lastEnemyCheck = frameCount;
      // Only attack if we're actually in combat state and have enemies
      if (this._stateMachine && this._stateMachine.isInCombat() && this._enemies.length > 0) {
        this._performCombatAttack();
      }else{
        if(this._combatTarget != null && this._combatTarget._faction != this._faction){
          this.moveToLocation(this._combatTarget.posX, this._combatTarget.posY);
        }
      }
    }
  }

  // Find nearest enemy entity from given array
  nearestEntity(array){
    let nearest = null;
    let minDist = Infinity;
    for (let obj of array) {
    if (obj._faction === this._faction || obj === this || obj._faction == "neutral") {
        continue;
    }
    let d = dist(this.posX, this.posY, obj.posX, obj.posY);
    if (d < minDist) {
        minDist = d;
        nearest = obj;
    }
    }
    return [nearest,minDist];
  }

  nearestFriendlyBuilding(array) {
    let nearest = null;
    let minDist = Infinity;
    for (let obj of array) {
      if ( (obj._faction !== this._faction && obj._faction !== 'neutral') || obj.type !== "Building") continue;
      let d = dist(this.posX, this.posY, obj.posX, obj.posY);
      if (d < minDist) {
        minDist = d;
        nearest = obj;
      }
    }
    return [nearest, minDist];
  }



  _soundAlarm(target){
    let factionObj = factionList[this._faction];
    if(factionObj){
      if(factionObj.isUnderAttack != null){return;}
      factionObj.isUnderAttack = target;
      let [d, distance] = this.nearestEntity([target]);
      ants.forEach(ant => {
        ant._calculateAction([d, distance]);
        if(ant.jobName === "Queen"){
          console.log("Queen alerted!");
        }
      })
    }
  }

  overlaps(a, b) {
    return (
        a.posX < b.posX + b.getSize().x &&
        a.posX + a.getSize().x > b.posX &&
        a.posY < b.posY + b.getSize().y &&
        a.posY + a.getSize().y > b.posY
    );
  }

  _calculateAction(targetData) {
    let [nearestEnemy, shortestDistance] = targetData;
    if (!nearestEnemy) return;

    let [closestHive, hiveDistance] = this.nearestFriendlyBuilding(
      Buildings.filter(b => b.type === "Building" && b._faction === this._faction)
    );

    const detectionRange = this.getController('combat')._detectionRadius;

  
    let goToHive = () => {
      if (!closestHive) return this.moveToLocation(nearestEnemy.posX, nearestEnemy.posY);
      if (hiveDistance > 100) {
        this.moveToLocation(closestHive.posX, closestHive.posY);
      } else {
        closestHive.enter(this);
        if (this.jobName !== "Scout") this._soundAlarm(nearestEnemy);
      }
    };

    let isRanged = ["Spitter", "Queen"].includes(this.jobName);
    let isMelee = ["Spider", "Warrior"].includes(this.jobName);
    let isWorker = ["Scout", "DeLozier", "Builder", "Farmer"].includes(this.jobName);

    let isOverlapping = this.overlaps(this, nearestEnemy);
    // Combat logic
    this._combatTarget = nearestEnemy;
    if (isOverlapping || shortestDistance <= this._attackRange) {
      if (isRanged) {
        // if (this.jobName === "Spitter") {
        //     window.draggablePanelManager.handleShootLightning(this._combatTarget);
        // } else if (this.jobName === "Queen" && typeof window.draggablePanelManager?.handleShootLightning === 'function') {
        //   window.draggablePanelManager.handleShootLightning(this._combatTarget);
        // }
      } 
      
      if (isMelee || this._faction != "player" || isRanged) {
        this._attackTarget(this._combatTarget);
      } 
      
      if (isWorker) {
        if (this.jobName === "Scout") this._soundAlarm(this._combatTarget);
        closestHive ? goToHive() : this._attackTarget(this._combatTarget);
      }
    }

    //  Detection logic
    else if (!isOverlapping || shortestDistance <= detectionRange) {
      if (isRanged || isMelee || this._faction != "player") {
        this.moveToLocation(this._combatTarget.posX, this._combatTarget.posY);
      } 
      
      else if (isWorker) {
        if (this.jobName === "Scout") this._soundAlarm(this._combatTarget);
        goToHive()
      }
    }
  }


  _performCombatAttack() {
    // Make sure the ant is ready for combat
    if (!this._stateMachine || !this._stateMachine.isInCombat()) return;

    if (this._combatTarget) {
      let targetStillValid = this._enemies.includes(this._combatTarget) && this._combatTarget.health > 0 && this._combatTarget.isActive !== false;
      let target = this.nearestEntity(this._enemies);
      if (targetStillValid) {
        this._calculateAction(target);
      }
      // Target is no longer valid, clear it
      this._combatTarget = null;
    }

    // Acquire a new target if none
    if (!this._combatTarget) {
      this._calculateAction(this.nearestEntity(this._enemies)); // Get nearest enemy and decide action
      return;
    }
    return false;
  }

  
  _attackTarget(target) {
    if (target && typeof target.takeDamage === 'function' && target.health > 0) {
      let now = this.lastFrameTime/ 1000; // seconds
      if (now - this._lastAttackTime < this._attackCooldown) return;

      let randomX = this.posX + random(-10, 10);
      let randomY = this.posY + random(-10, 10);
      this.moveToLocation(randomX, randomY);
    // Use strength stat from StatsContainer, fallback to basic damage
        const attackPower = this._stats?.strength?.statValue || this._damage;
        target.takeDamage(attackPower);
        
        // Show damage effect if available
        if (this._renderController && typeof this._renderController.showDamageNumber === 'function') {
          const enemyPos = target.getPosition();
          this._renderController.showDamageNumber(attackPower, [255, 100, 100]);
        }
        this._lastAttackTime = now;
        logNormal(`🗡️ Ant ${this._antIndex} (${this._faction}) attacked enemy ${target._antIndex || 'unknown'} for ${attackPower} damage`);
    }
  }
  
  _calculateDistance(entity1, entity2) {
    const pos1 = entity1.getPosition();
    const pos2 = entity2.getPosition();
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
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
      
      // Convert world position to screen position using terrain's coordinate converter
      let screenX = pos.x + size.x/2;
      let screenY = pos.y - 12;
      
      if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
        // Convert pixel position to tile position
        const tileX = pos.x / TILE_SIZE;
        const tileY = pos.y / TILE_SIZE;
        
        // Use terrain's converter to get screen position
        const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
        screenX = screenPos[0] + size.x/2;
        screenY = screenPos[1] - 12;
      }
      
      fill(255, 255, 0);
      textAlign(CENTER);
      text(resourceCount, screenX, screenY);
    }
  }
  
  // --- Debug Override ---
  getDebugInfo() {
    const baseInfo = super.getDebugInfo();
    const gatherInfo = this._gatherState ? this._gatherState.getDebugInfo() : { isActive: false };
    
    return {
      ...baseInfo,
      antIndex: this._antIndex,
      JobName: this.JobName,
      currentState: this.getCurrentState(),
      health: `${this._health}/${this._maxHealth}`,
      resources: `${this.getResourceCount()}/${this.getMaxResources()}`,
      faction: this._faction,
      enemies: this._enemies.length,
      gathering: gatherInfo
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
  const specialJobList = ['DeLozier',];

  const availableSpecialJobs = [];
  if (!hasDeLozier) availableSpecialJobs.push('DeLozier');
  const availableJobs = [...JobList, ...availableSpecialJobs];

  const chosenJob = availableJobs[Math.floor(random(0, availableJobs.length))];
  if (chosenJob === "DeLozier") { 
    hasDeLozier = true; 
  }
  return chosenJob;
}



function spawnQueen(){
  let JobName = 'Queen'
  let sizeR = random(0, 15);
  
  // Generate spawn position
  let spawnX = random(0, 500);
  let spawnY = random(0, 500);
  
  // Convert to terrain-aligned coordinates 
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
      typeof g_activeMap.renderConversion.convCanvasToPos === 'function' &&
      typeof g_activeMap.renderConversion.convPosToCanvas === 'function') {
    const tilePos = g_activeMap.renderConversion.convCanvasToPos([spawnX, spawnY]);
    const alignedPos = g_activeMap.renderConversion.convPosToCanvas(tilePos);
    spawnX = alignedPos[0];
    spawnY = alignedPos[1];
  }
  
  // Create QueenAnt directly (no need for wrapper ant)
  console.log(queenSize)
  let newAnt = new ant(
    spawnX, spawnY, 
    queenSize.x + sizeR, 
    queenSize.y + sizeR, 
    30, 0,
    antBaseSprite,
    'Queen',  // This makes it type "Queen"
    'player'
  );

  // Wrap in QueenAnt to get Queen-specific behavior
  // Note: This creates a NEW entity, so we need to remove the old one from spatial grid
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    spatialGridManager.removeEntity(newAnt);
  }
  
  newAnt = new QueenAnt(newAnt);

  newAnt.assignJob(JobName, JobImages[JobName]);
  ants.push(newAnt);
  // also add to selectables so selection box can see it
  if (typeof selectables !== 'undefined') selectables.push(newAnt);

  newAnt.update();

  // Register ant with TileInteractionManager for efficient mouse detection
  if (g_tileInteractionManager) {
    g_tileInteractionManager.addObject(newAnt, 'ant');
  }


  return newAnt;
}


// Spawn specific ants
function spawnAntByType(antObj){
  let movementController = antObj.getController('movement');
  let jitter = 12;
  const sizeX = antObj.getSize().x + (Math.random() * jitter - jitter / 2);
  const sizeY = antObj.getSize().y + (Math.random() * jitter - jitter / 2);
  const movementSpeed = movementController && typeof movementController.movementSpeed === 'number'
    ? movementController.movementSpeed
    : (antObj.movementSpeed || 30);
  const img = (typeof antObj.getImage === 'function' && antObj.getImage()) || JobImages[antObj.jobName] || antBaseSprite;

  // Correct argument order: posX, posY, sizex, sizey, movementSpeed, rotation, img, JobName, faction
  let newAnt = new ant(
    antObj.posX,
    antObj.posY,
    sizeX,
    sizeY,
    movementSpeed,
    0,
    img,
    antObj.jobName,
    antObj.faction
  );


  newAnt.assignJob(antObj.jobName, JobImages[antObj.jobName]);
  if (ants && Array.isArray(ants)) {
    ants.push(newAnt);
  }

    // Register with TileInteractionManager if available
  if (g_tileInteractionManager) {
    g_tileInteractionManager.addObject(newAnt, 'ant');
  }


  if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
  if (!selectables.includes(newAnt)) selectables.push(newAnt);
  }
  // Ensure selection controller uses selectables reference (some controllers snapshot list)
  if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
    if (g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
  }

  return newAnt;
}

// --- Spawn Ants ---
function antsSpawn(numToSpawn, faction = "neutral", x = null, y = null) {
  let list = [];
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let JobName  = assignJob();
    if (faction != "player") {
      JobName = "waveEnemy";
    }

    let px, py;
    if (x !== null && y !== null) {
      const jitter = 20;
      px = x + (Math.random() * jitter - jitter / 2);
      py = y + (Math.random() * jitter - jitter / 2);
    } else {
      px = random(0, 500);
      py = random(0, 500);
    }
    
    // Convert to terrain-aligned coordinates (applies Y-axis inversion)
    // This ensures entities are stored in the same coordinate space as terrain
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
        typeof g_activeMap.renderConversion.convCanvasToPos === 'function' &&
        typeof g_activeMap.renderConversion.convPosToCanvas === 'function') {
      // Convert screen -> tile -> back to terrain-aligned screen coords
      const tilePos = g_activeMap.renderConversion.convCanvasToPos([px, py]);
      const alignedPos = g_activeMap.renderConversion.convPosToCanvas(tilePos);
      px = alignedPos[0];
      py = alignedPos[1];
    }

    // Create ant directly with new job system
    let newAnt = new ant(
      px, py,
      antSize.x + sizeR,
      antSize.y + sizeR,
      30, 0,
      antBaseSprite,
      JobName,
      faction
    );
    
    newAnt.assignJob(JobName, JobImages[JobName]);
    
    ants.push(newAnt);
    if (typeof selectables !== 'undefined') selectables.push(newAnt);

    newAnt.update();
    
    if (g_tileInteractionManager) {
      g_tileInteractionManager.addObject(newAnt, 'ant');
    }
    list.push(newAnt);
  }
  return list;
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

function getQueen(){
  if(queenAnt){
    return queenAnt;
  }
  return false;
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