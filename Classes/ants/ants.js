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

// Initialize AntManager when available (after script loads)
function initializeAntManager() {
  if (typeof AntManager !== 'undefined' && !antManager) { antManager = new AntManager(); }
  else {incorrectLoadOrderWarning("AntManager")}
}

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
    this._skitterTimer = random(30, 200);
    this._antIndex = ant_Index++;
    this._isMoving = false;
    this._timeUntilSkitter = this._skitterTimer;
    this._path = null;
    this._isSelected = false;
    this.isBoxHovered = false;


    // Resource
    this.isDroppingOff = false;
    this.isMaxWeight = false // Ants capacity max
    this.Resources = []; // Resource the ants is carrying

    
    // Initialize state machine
    this._stateMachine = new AntStateMachine();
    this._stateMachine.setStateChangeCallback((oldState, newState) => {
      this._onStateChange(oldState, newState);
    });
    
    // Faction and command system
    this._faction = "neutral"; // Default faction
    this._commandQueue = []; // Queue for receiving commands from queen
    this._nearbyEnemies = []; // Track nearby enemy ants
  }

  // --- Getters/Setters ---
  get stats() { return this._stats; }
  set stats(value) { this._stats = value; }
  get sprite() { return this._sprite; }
  set sprite(value) { this._sprite = value; }
  get antIndex() { return this._antIndex; }
  set antIndex(value) { this._antIndex = value; }
  get isMoving() { return this._isMoving; }
  set isMoving(value) { this._isMoving = value; }
  get timeUntilSkitter() { return this._timeUntilSkitter; }
  set timeUntilSkitter(value) { this._timeUntilSkitter = value; }
  get skitterTimer() { return this._skitterTimer; }
  set skitterTimer(value) { this._skitterTimer = value; }
  get path() { return this._path; }
  set path(value) { this._path = value; }
  get isSelected() { return this._isSelected; }
  set isSelected(value) { this._isSelected = value; }
  
  // State machine and new properties
  get stateMachine() { return this._stateMachine; }
  get faction() { return this._faction; }
  set faction(value) { this._faction = value; }
  get commandQueue() { return this._commandQueue; }
  get nearbyEnemies() { return this._nearbyEnemies; }

  // --- Sprite2D Helpers ---
  setSpriteImage(img) { this._sprite.setImage(img); }
  setSpritePosition(pos) { this._sprite.setPosition(pos); }
  setSpriteSize(size) { this._sprite.setSize(size); }
  setSpriteRotation(rotation) { this._sprite.setRotation(rotation); }

  // --- Rendering ---
  render() {
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
  }

  // --- Highlighting ---
  highlight() {
    // Use abstract highlighting functions from selectionBox.js
    if (this._isSelected) {
      highlightEntity(this, "selected");
      renderDebugInfo(this);
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
    renderStateIndicators(this);
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

  setPath(path) { this._path = path; }

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

    // Only allow movement if state machine permits it
    if (this._stateMachine.canPerformAction("move")) {
      this._stats.pendingPos.statValue.x = X;
      this._stats.pendingPos.statValue.y = Y;
      this._isMoving = true;
      this._stateMachine.setPrimaryState("MOVING");
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

  // --- Update Loop ---
  // checks and updates ant state each frame
  // if moving, updates position towards target
  // if idle, may skitter randomly
  ResolveMoment() {
    if (this._isMoving) {
      const current = createVector(this.posX, this.posY);
      const target = createVector(
        this._stats.pendingPos.statValue.x,
        this._stats.pendingPos.statValue.y
      );

      const direction = p5.Vector.sub(target, current);
      const distance = direction.mag();

      if (distance > 1) {
        direction.normalize();
        const effectiveSpeed = this.getEffectiveMovementSpeed();
        const speedPerMs = effectiveSpeed / 1000;
        const step = Math.min(speedPerMs * deltaTime, distance);
        
        // Only move if effective speed is greater than 0
        if (effectiveSpeed > 0) {
          current.x += direction.x * step;
          current.y += direction.y * step;
          this.posX = current.x;
          this.posY = current.y;
          this._sprite.setPosition(current);
        }
      } else {

        // Target Reached

        this.posX = target.x;
        this.posY = target.y;
        this._isMoving = false;
        this._sprite.setPosition(target);


        // Stores Resource and Reset State Upon Dropoff
        if(this.isDroppingOff || this.isMaxWeight ){
          for(let r of this.Resources){
            globalResource.push(r);
          }

          this.Resources = [];
          this.isDroppingOff = false;
          this.isMaxWeight  = false;

        
        // Set state back to IDLE when movement is complete, but only if no other activities are ongoing
        if (this._stateMachine.isPrimaryState("MOVING")) {
          // Check if we should go to a different state based on context
          if (this._commandQueue.length > 0) {
            // Don't set to IDLE if there are pending commands - let processCommandQueue handle it
          } else {
            this._stateMachine.setPrimaryState("IDLE");
          }
        }
      }

      this.render();
    }
  }
  }

  // Ants Collect NearBy Fruits/Resources 
  resourceCheck(){
    let fruits = resourceList.getResourceList();
    let keys = Object.keys(fruits);

    for(let k of keys){
      let x = fruits[k].x;
      let y = fruits[k].y;
      
      let xDifference = abs(Math.floor(x - this.posX));
      let yDifference = abs(Math.floor(y - this.posY));
      let range = 25;
      let maxWeight = 2; // Change to member variable??

      if(xDifference <= range && yDifference <= range){
        let fruit = fruits[k];
        if(this.Resources.length < maxWeight){
            this.Resources.push(fruit);
            delete fruits[k];
        }
        if(this.Resources.length >= maxWeight){
          let dropPointX = 0;
          let dropPointY = 0;
          this.dropOff(dropPointX,dropPointY);
        }
      }   
    }
  }

  dropOff(X,Y){
    this.isDroppingOff = true;
    this.isMaxWeight = true;
    this.moveToLocation(X,Y);
  }


  update() {
    // Update terrain state based on current position
    this.updateTerrainState();
    
    // Process any pending commands from queen
    this.processCommandQueue();
    
    // Check for nearby enemies and enter combat if necessary
    this.checkForEnemies();
    
    // Handle pathfinding movement first
    if(!this.isMoving && this._path && this.path.length > 0){//If a path exists and not skittering
      const nextNode = this._path.shift(); //Sets next tile to be travelled as next path tile
      const targetX = nextNode._x * tileSize; //Translates tile coordinate to translatable distance
      const targetY = nextNode._y * tileSize;
      this.moveToLocation(targetX, targetY); //Moves ant
    }
    else if (!this._isMoving && (!this._path || this._path.length === 0)){//Sets back to skittering when not pathfinding
      this._timeUntilSkitter -= 1;
      if (this._timeUntilSkitter < 0) {
      this.rndTimeUntilSkitter();
      this._isMoving = true;
      this.moveToLocation(this.posX + random(-25, 25), this.posY + random(-25, 25));
      }
    }
    this.ResolveMoment();
    
    // Only skitter if not moving and in idle state
    if (!this._isMoving && this._stateMachine.isPrimaryState("IDLE") && this._stateMachine.isOutOfCombat()) {
      this._timeUntilSkitter -= 1;
      if (this._timeUntilSkitter < 0) {
        this.rndTimeUntilSkitter();
        // Only skitter if we can actually move
        if (this._stateMachine.canPerformAction("move")) {
          this.moveToLocation(this.posX + random(-25, 25), this.posY + random(-25, 25));
        }
      }
    }
    
    this.render();
    this.highlight();
    this.resourceCheck();
  }
  
  // State change callback handler
  _onStateChange(oldState, newState) {
    // Handle any special logic when states change
    // Only log state changes for selected ants when dev console is enabled
    /*
    if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled && this._isSelected) {
      console.log(`Selected Ant ${this._antIndex} state changed: ${oldState} -> ${newState}`);
    }
    */
    // Reset skitter timer when entering idle state
    if (this._stateMachine.isIdle()) {
      this.rndTimeUntilSkitter();
    }
  }

  // --- Command System --- // Static Utility Methods
  addCommand(command) {
    this._commandQueue.push(command);
  }
  
  processCommandQueue() {
    while (this._commandQueue.length > 0) {
      const command = this._commandQueue.shift();
      this.executeCommand(command);
    }
    
    // If no commands are pending and ant is not moving, ensure it can return to idle
    if (this._commandQueue.length === 0 && !this._isMoving) {
      this.ensureIdleTransition();
    }
  }
  
  // Ensure the ant can transition to idle state when appropriate
  ensureIdleTransition() {
    // Only transition to idle if we're in a "temporary" activity state
    const currentPrimary = this._stateMachine.primaryState;
    
    if (currentPrimary === "MOVING" || 
        (currentPrimary === "GATHERING" && Math.random() < 0.01) || // Occasional break from gathering
        (currentPrimary === "BUILDING" && Math.random() < 0.005) || // Occasional break from building
        (currentPrimary === "FOLLOWING" && Math.random() < 0.02)) { // Stop following occasionally
      
      if (this._stateMachine.canPerformAction("move")) {
        this._stateMachine.setPrimaryState("IDLE");
      }
    }
  }
  
  executeCommand(command) {
    switch (command.type) {
      case "MOVE":
        if (command.x !== undefined && command.y !== undefined) {
          this.moveToLocation(command.x, command.y);
        }
        break;
      case "GATHER":
        if (this._stateMachine.canPerformAction("gather")) {
          this._stateMachine.setPrimaryState("GATHERING");
          // Add gathering logic here
        }
        break;
      case "BUILD":
        if (this._stateMachine.canPerformAction("build")) {
          this._stateMachine.setPrimaryState("BUILDING");
          // Add building logic here
        }
        break;
      case "FOLLOW":
        if (this._stateMachine.canPerformAction("follow") && command.target) {
          this._stateMachine.setPrimaryState("FOLLOWING");
          // follows the 
        }
        break;
      default:
        console.warn(`Unknown command type: ${command.type}`);
    }
  }
  
  // --- Enemy Detection and Combat ---
  checkForEnemies() {
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
  
  // --- State Query Methods ---
  isIdle() { return this._stateMachine.isIdle(); }
  isInCombat() { return this._stateMachine.isInCombat(); }
  getCurrentState() { return this._stateMachine.getFullState(); }
  getStateSummary() { return this._stateMachine.getStateSummary(); }
  
  // --- Public Command Interface ---
  startGathering() {
    this.addCommand({ type: "GATHER" });
  }
  
  startBuilding() {
    this.addCommand({ type: "BUILD" });
  }
  
  followTarget(target) {
    this.addCommand({ type: "FOLLOW", target: target });
  }
  
  moveToTarget(x, y) {
    this.addCommand({ type: "MOVE", x: x, y: y });
  }
  
  // Force ant back to idle state (useful for debugging)
  forceIdle() {
    this._isMoving = false;
    this._commandQueue = [];
    this._stateMachine.setPrimaryState("IDLE");
  }
  
  // Debug method to check ant state
  debugState() {
    return {
      antIndex: this._antIndex,
      primaryState: this._stateMachine.primaryState,
      fullState: this._stateMachine.getFullState(),
      isMoving: this._isMoving,
      timeUntilSkitter: this._timeUntilSkitter,
      commandQueueLength: this._commandQueue.length,
      canMove: this._stateMachine.canPerformAction("move"),
      isIdle: this._stateMachine.isIdle()
    };
  }

  static moveGroupInCircle(antArray, x, y, radius = 40) {
    const angleStep = (2 * Math.PI) / antArray.length;
    for (let i = 0; i < antArray.length; i++) {
      const angle = i * angleStep;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      antArray[i].moveToLocation(x + offsetX, y + offsetY);
      antArray[i].isSelected = false;
    }
  }

  static selectAntUnderMouse(ants, mx, my) {
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

// --- Move Selected Ant to Tile ---
function moveSelectedAntToTile(mx, my, tileSize) {
  initializeAntManager();
  const selectedAnt = antManager ? antManager.getSelectedAnt() : null;
  if (selectedAnt) {
    const tileX = Math.floor(mx / tileSize);
    const tileY = Math.floor(my / tileSize); //Gets coordinates clicked tiles
    const grid = GRIDMAP.getGrid();
    const antX = Math.floor(selectedAnt.posX/tileSize);
    const antY = Math.floor(selectedAnt.posY/tileSize); //Gets current ant tile relative to where it started
    const startTile = grid.getArrPos([antX, antY]); //Converts ant start to pos suitable for pathfinding
    const endTile = grid.getArrPos([tileX, tileY]); //Converts clicked tile to pos suitable for pathfinding
    if(startTile && endTile){
      const newPath = findPath(startTile, endTile, GRIDMAP); //Only makes path if everything exists
      selectedAnt.setPath(newPath);
    }
    selectedAnt.isSelected = false;
    if (antManager) {
      antManager.clearSelection(); //Resets pathfinding/selection info
    }
  }
}
function moveSelectedAntsToTile(mx, my, tileSize) {
  if (selectedEntities.length === 0) return;

  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  const grid = GRIDMAP.getGrid();

  const radius = 2; // in tiles
  const angleStep = (2 * Math.PI) / selectedEntities.length;

  for (let i = 0; i < selectedEntities.length; i++) {
    const ant = selectedEntities[i];

    // assign each ant its own destination tile around the click
    const angle = i * angleStep;
    const offsetTileX = tileX + Math.round(Math.cos(angle) * radius);
    const offsetTileY = tileY + Math.round(Math.sin(angle) * radius);

    const antCenterX = ant.posX + ant.sizeX / 2;
    const antCenterY = ant.posY + ant.sizeY / 2;
    const antX = Math.floor(antCenterX / tileSize);
    const antY = Math.floor(antCenterY / tileSize);

    const startTile = grid.getArrPos([antX, antY]);
    const endTile = grid.getArrPos([offsetTileX, offsetTileY]);

    if (startTile && endTile) {
      const newPath = findPath(startTile, endTile, GRIDMAP);
      ant.setPath(newPath);
    }
    ant.isSelected = false;
  }
  selectedEntities = [];
}

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

// -- DEPRECATED --
// Ensures compatibility with previous functions
function Ant_Click_Control() { deprecatedWarning(AntClickControl); }
function Ants_Update() { deprecatedWarning(AntsUpdate); }
function Ants_Spawn(numToSpawn) { deprecatedWarning(AntsSpawn(numToSpawn)); }
function AntClickControl() { deprecatedWarning(antManager.AntClickControl()); }
function MoveAnt(resetSection) { deprecatedWarning(antManager.MoveAnt(resetSection)); }
function SelectAnt(antCurrent = null) { deprecatedWarning(antManager.SelectAnt(antCurrent)); }
function getAntObj(antCurrent) { return deprecatedWarning(antManager.getAntObj(antCurrent)); }

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  // Import AntManager for Node.js testing
  const AntManager = require('../managers/AntManager.js');
  
  // Initialize antManager for Node.js
  if (!antManager) { antManager = new AntManager(); }
  
  module.exports = ant; // Keep primary export as ant class for backward compatibility
  module.exports.AntManager = AntManager;
  module.exports.antManager = antManager;
}