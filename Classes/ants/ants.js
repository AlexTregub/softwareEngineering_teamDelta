// --- Ant Globals ---
let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let antImg1;
let antbg;
let hasDeLozier = false;
let selectedAnt = null;
let speciesImages = {};

// AntStateMachine will be available globally from antStateMachine.js

// --- Preload Images ---
function Ants_Preloader() {
  antSize = createVector(20, 20);
  antbg = [60, 100, 60];
  antImg1 = loadImage("images/Ants/gray_ant.png");
  speciesImages = {
    Builder: loadImage('images/Ants/blue_ant.png'),
    Scout: loadImage('images/Ants/gray_ant.png'),
    Farmer: loadImage('images/Ants/brown_ant.png'),
    Warrior: loadImage('images/Ants/blue_ant.png'),
    Spitter: loadImage('images/Ants/gray_ant.png'),
    DeLozier: loadImage('images/Ants/greg.jpg')
  };
  gregImg = loadImage("images/Ants/greg.jpg");
}

// --- Spawn Ants ---
function Ants_Spawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let baseAnt = new ant(random(0, 500), random(0, 500), antSize.x + sizeR, antSize.y + sizeR, 30, 0);
    let speciesName = assignSpecies();
    ants[i] = new AntWrapper(new Species(baseAnt, speciesName, speciesImages[speciesName]), speciesName);
    ants[i].update();
  }
}

// --- Update All Ants ---
function Ants_Update() {
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i] && typeof ants[i].update === "function") {
      ants[i].update();
    }
  }
}

// --- Single Ant Selection/Movement ---
function Ant_Click_Control() {
  // Move selected ant if one is already selected
  if (selectedAnt) {
    selectedAnt.moveToLocation(mouseX, mouseY);
    selectedAnt.isSelected = false;
    selectedAnt = null;
    return;
  }

  // Otherwise, select the ant under the mouse
  selectedAnt = null;
  for (let i = 0; i < ant_Index; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    antObj.isSelected = false;
  }
  for (let i = 0; i < ant_Index; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    if (antObj.isMouseOver(mouseX, mouseY)) {
      antObj.isSelected = true;
      selectedAnt = antObj;
      break;
    }
  }
}

// --- Ant Class ---
class ant {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antImg1) {
    const initialPos = createVector(posX, posY);
    this._stats = new stats(
      initialPos,
      { x: sizex, y: sizey },
      movementSpeed,
      initialPos.copy()
    );
    this._sprite = new Sprite2D(img, initialPos, createVector(sizex, sizey), rotation);
    this._skitterTimer = random(30, 200);
    this._antIndex = ant_Index++;
    this._isMoving = false;
    this._timeUntilSkitter = this._skitterTimer;
    this._path = null;
    this._isSelected = false;
    this.isBoxHovered = false;
    
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
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    
    if (this._isSelected) {
      push();
      noFill();
      stroke(color(0, 0, 255)); // Blue for selected
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      
      // Show state information for selected ant
      fill(255);
      textAlign(LEFT);
      textSize(10);
      text(`State: ${this.getCurrentState()}`, pos.x, pos.y - 30);
      text(`Faction: ${this._faction}`, pos.x, pos.y - 20);
      text(`Speed: ${this.getEffectiveMovementSpeed().toFixed(1)}`, pos.x, pos.y - 10);
      
      pop();
    } else if (this.isMouseOver(mouseX, mouseY)) {
      push();
      noFill();
      stroke(color(255, 255, 0)); // Yellow for hover
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    } else if (this.isBoxHovered) {
      push();
      noFill();
      stroke(color(0, 255, 0));
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    }
    
    // Show combat state with red outline
    if (this._stateMachine.isInCombat()) {
      push();
      noFill();
      stroke(color(255, 0, 0)); // Red for combat
      strokeWeight(1);
      rect(pos.x - 2, pos.y - 2, size.x + 4, size.y + 4);
      pop();
    }
    
    // Show state-dependent visual indicators
    this.renderStateIndicators();
  }
  
  // Render small indicators for different states
  renderStateIndicators() {
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    
    push();
    
    // Building state indicator
    if (this._stateMachine.isBuilding()) {
      fill(139, 69, 19); // Brown
      noStroke();
      ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
    }
    
    // Gathering state indicator
    if (this._stateMachine.isGathering()) {
      fill(0, 255, 0); // Green
      noStroke();
      ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
    }
    
    // Following state indicator
    if (this._stateMachine.isFollowing()) {
      fill(255, 255, 0); // Yellow
      noStroke();
      ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
    }
    
    // Terrain effect indicators
    if (this._stateMachine.terrainModifier !== "DEFAULT") {
      let terrainColor;
      switch (this._stateMachine.terrainModifier) {
        case "IN_WATER": terrainColor = color(0, 100, 255); break;
        case "IN_MUD": terrainColor = color(101, 67, 33); break;
        case "ON_SLIPPERY": terrainColor = color(200, 200, 255); break;
        case "ON_ROUGH": terrainColor = color(100, 100, 100); break;
        default: terrainColor = color(255);
      }
      
      fill(terrainColor);
      noStroke();
      rect(pos.x, pos.y + size.y - 3, size.x, 3);
    }
    
    pop();
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
      case "IN_WATER":
        return baseSpeed * 0.5; // 50% speed in water
      case "IN_MUD":
        return baseSpeed * 0.3; // 30% speed in mud
      case "ON_SLIPPERY":
        return 0; // Can't move on slippery terrain
      case "ON_ROUGH":
        return baseSpeed * 0.8; // 80% speed on rough terrain
      case "DEFAULT":
      default:
        return baseSpeed; // Normal speed
    }
  }

  // --- Rotation ---
  set rotation(value) {
    this._sprite.rotation = value;
    while (this._sprite.rotation > 360) this._sprite.rotation -= 360;
    while (this._sprite.rotation < -360) this._sprite.rotation += 360;
  }
  get rotation() { return this._sprite.rotation; }

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
        this.posX = target.x;
        this.posY = target.y;
        this._isMoving = false;
        this._sprite.setPosition(target);
        
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

  update() {
    // Update terrain state based on current position
    this.updateTerrainState();
    
    // Process any pending commands from queen
    this.processCommandQueue();
    
    // Check for nearby enemies and enter combat if necessary
    this.checkForEnemies();
    
    // Handle movement resolution
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
  }
  
  // State change callback handler
  _onStateChange(oldState, newState) {
    // Handle any special logic when states change
    if (this._antIndex < 3) { // Only log for first few ants to avoid spam
      console.log(`Ant ${this._antIndex} state changed: ${oldState} -> ${newState}`);
    }
    
    // Reset skitter timer when entering idle state
    if (this._stateMachine.isIdle()) {
      this.rndTimeUntilSkitter();
    }
  }

  // --- Command System ---
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
          // Add following logic here
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
  if (selectedAnt) {
    const tileX = Math.floor(mx / tileSize);
    const tileY = Math.floor(my / tileSize);
    const targetX = tileX * tileSize;
    const targetY = tileY * tileSize;
    selectedAnt.moveToLocation(targetX, targetY);
    selectedAnt.isSelected = false;
    selectedAnt = null;
  }
}

// --- Debug Functions ---
function debugAllAnts() {
  console.log("=== Ant State Debug ===");
  for (let i = 0; i < Math.min(ant_Index, 5); i++) { // Only debug first 5 ants
    if (ants[i]) {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      console.log(`Ant ${i}:`, antObj.debugState());
    }
  }
}

function forceAllAntsIdle() {
  console.log("Forcing all ants to idle state...");
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i]) {
      const antObj = ants[i].antObject ? ants[i].antObject : ants[i];
      antObj.forceIdle();
    }
  }
}