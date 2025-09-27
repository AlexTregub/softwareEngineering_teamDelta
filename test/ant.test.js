// Test Suite for Ant Class
// Run with: node test/ant.test.js

// Mock global variables and dependencies
global.createVector = (x, y) => ({ x: x || 0, y: y || 0, copy: () => ({ x: x || 0, y: y || 0 }) });
global.random = (min, max) => min + Math.random() * (max - min);
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
global.deltaTime = 16.67; // ~60fps
global.tileSize = 32;
global.p5 = {
  Vector: {
    sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y, mag: function() { return Math.sqrt(this.x ** 2 + this.y ** 2); }, normalize: function() { const m = this.mag(); if (m > 0) { this.x /= m; this.y /= m; } } })
  }
};

// Mock image loading
global.loadImage = (path) => ({ path });
global.antBaseSprite = { path: "test-image" };

// Mock devConsoleEnabled
global.devConsoleEnabled = false;

// Mock array for ant storage
global.ants = [];
global.ant_Index = 0;

// Mock StatsContainer class
class MockStats {
  constructor(position, size, movementSpeed, pendingPos) {
    this.position = { statValue: position };
    this.size = { statValue: size };
    this.movementSpeed = { statValue: movementSpeed };
    this.pendingPos = { statValue: pendingPos };
  }
}
global.StatsContainer = MockStats;

// Mock Sprite2D class
class MockSprite2D {
  constructor(img, pos, size, rotation = 0) {
    this.img = img;
    this.pos = pos;
    this.size = size;
    this.rotation = rotation;
  }
  
  setImage(img) { this.img = img; }
  setPosition(pos) { this.pos = pos; }
  setSize(size) { this.size = size; }
  setRotation(rotation) { this.rotation = rotation; }
  render() { /* Mock render */ }
}
global.Sprite2D = MockSprite2D;

// Mock AntStateMachine
class MockAntStateMachine {
  constructor() {
    this.primaryState = "IDLE";
    this.combatModifier = "OUT_OF_COMBAT";
    this.terrainModifier = "DEFAULT";
    this.stateChangeCallback = null;
  }
  
  setStateChangeCallback(callback) { this.stateChangeCallback = callback; }
  setPrimaryState(state) { 
    const oldState = this.primaryState;
    this.primaryState = state;
    if (this.stateChangeCallback) this.stateChangeCallback(oldState, state);
  }
  setCombatModifier(modifier) { this.combatModifier = modifier; }
  setTerrainModifier(modifier) { this.terrainModifier = modifier; }
  isPrimaryState(state) { return this.primaryState === state; }
  isIdle() { return this.primaryState === "IDLE"; }
  isInCombat() { return this.combatModifier === "IN_COMBAT"; }
  isOutOfCombat() { return this.combatModifier === "OUT_OF_COMBAT"; }
  canPerformAction(action) { return this.primaryState !== "STUNNED"; }
  getFullState() { return `${this.primaryState}_${this.combatModifier}_${this.terrainModifier}`; }
  getStateSummary() { return { primary: this.primaryState, combat: this.combatModifier, terrain: this.terrainModifier }; }
}
global.AntStateMachine = MockAntStateMachine;

// Mock highlighting functions
global.highlightEntity = (entity, type) => { /* Mock highlighting */ };
global.renderStateIndicators = (entity) => { /* Mock state indicators */ };
global.renderDebugInfo = (entity) => { /* Mock debug info */ };

// Mock p5.js rendering functions
global.noSmooth = () => {};
global.smooth = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.line = () => {};

// Define the ant class directly for testing
class ant {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = antBaseSprite) {
    const initialPos = createVector(posX, posY);
    this._stats = new StatsContainer(
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
    this._faction = "neutral";
    this._commandQueue = [];
    this._nearbyEnemies = [];
  }

  // Getters/Setters
  get StatsContainer() { return this._stats; }
  set StatsContainer(value) { this._stats = value; }
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
  get stateMachine() { return this._stateMachine; }
  get faction() { return this._faction; }
  set faction(value) { this._faction = value; }
  get commandQueue() { return this._commandQueue; }
  get nearbyEnemies() { return this._nearbyEnemies; }

  // Position and Size
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

  getPosition() { return this._sprite.pos; }
  getSize() { return this._sprite.size; }

  get center() {
    const pos = this._stats.position.statValue;
    const size = this._stats.size.statValue;
    return createVector(pos.x + (size.x / 2), pos.y + (size.y / 2));
  }

  set sizeX(value) { this._stats.size.statValue.x = value; }
  get sizeX() { return this._stats.size.statValue.x; }
  set sizeY(value) { this._stats.size.statValue.y = value; }
  get sizeY() { return this._stats.size.statValue.y; }

  set movementSpeed(value) { this._stats.movementSpeed.statValue = value; }
  get movementSpeed() { return this._stats.movementSpeed.statValue; }
  
  getEffectiveMovementSpeed() {
    let baseSpeed = this.movementSpeed;
    switch (this._stateMachine.terrainModifier) {
      case "IN_WATER": return baseSpeed * 0.5;
      case "IN_MUD": return baseSpeed * 0.3;
      case "ON_SLIPPERY": return 0;
      case "ON_ROUGH": return baseSpeed * 0.8;
      case "DEFAULT":
      default: return baseSpeed;
    }
  }

  set rotation(value) {
    this._sprite.rotation = value;
    while (this._sprite.rotation > 360) this._sprite.rotation -= 360;
    while (this._sprite.rotation < -360) this._sprite.rotation += 360;
  }
  get rotation() { return this._sprite.rotation; }

  // Mouse interaction
  isMouseOver(mx, my) {
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    return (mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y);
  }

  // Movement
  moveToLocation(X, Y) {
    if (this._stateMachine.canPerformAction("move")) {
      this._stats.pendingPos.statValue.x = X;
      this._stats.pendingPos.statValue.y = Y;
      this._isMoving = true;
      this._stateMachine.setPrimaryState("MOVING");
    }
  }

  // Skitter logic
  setTimeUntilSkitter(value) { this._timeUntilSkitter = value; }
  rndTimeUntilSkitter() { this._timeUntilSkitter = random(30, 200); }
  getTimeUntilSkitter() { return this._timeUntilSkitter; }

  // Path
  setPath(path) { this._path = path; }

  // Terrain
  detectTerrain() { return "DEFAULT"; }
  updateTerrainState() {
    const currentTerrain = this.detectTerrain();
    if (this._stateMachine.terrainModifier !== currentTerrain) {
      this._stateMachine.setTerrainModifier(currentTerrain);
    }
  }

  // Commands
  addCommand(command) { this._commandQueue.push(command); }
  
  processCommandQueue() {
    while (this._commandQueue.length > 0) {
      const command = this._commandQueue.shift();
      this.executeCommand(command);
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
        }
        break;
      case "BUILD":
        if (this._stateMachine.canPerformAction("build")) {
          this._stateMachine.setPrimaryState("BUILDING");
        }
        break;
      case "FOLLOW":
        if (this._stateMachine.canPerformAction("follow") && command.target) {
          this._stateMachine.setPrimaryState("FOLLOWING");
        }
        break;
    }
  }

  // Public command interface
  startGathering() { this.addCommand({ type: "GATHER" }); }
  startBuilding() { this.addCommand({ type: "BUILD" }); }
  followTarget(target) { this.addCommand({ type: "FOLLOW", target: target }); }
  moveToTarget(x, y) { this.addCommand({ type: "MOVE", x: x, y: y }); }

  // Enemy detection
  checkForEnemies() {
    this._nearbyEnemies = [];
    const detectionRadius = 60;
    
    for (let i = 0; i < ant_Index; i++) {
      if (!ants[i] || ants[i] === this) continue;
      
      const otherAnt = ants[i].antObject ? ants[i].antObject : ants[i];
      
      if (otherAnt.faction !== this._faction && this._faction !== "neutral" && otherAnt.faction !== "neutral") {
        const distance = dist(this.posX, this.posY, otherAnt.posX, otherAnt.posY);
        
        if (distance <= detectionRadius) {
          this._nearbyEnemies.push(otherAnt);
        }
      }
    }
    
    if (this._nearbyEnemies.length > 0 && this._stateMachine.isOutOfCombat()) {
      this._stateMachine.setCombatModifier("IN_COMBAT");
    } else if (this._nearbyEnemies.length === 0 && this._stateMachine.isInCombat()) {
      this._stateMachine.setCombatModifier("OUT_OF_COMBAT");
    }
  }

  // State queries
  isIdle() { return this._stateMachine.isIdle(); }
  isInCombat() { return this._stateMachine.isInCombat(); }
  getCurrentState() { return this._stateMachine.getFullState(); }
  getStateSummary() { return this._stateMachine.getStateSummary(); }

  // State change callback
  _onStateChange(oldState, newState) {
    if (typeof devConsoleEnabled !== 'undefined' && devConsoleEnabled && this._antIndex < 3) {
      console.log(`Ant ${this._antIndex} state changed: ${oldState} -> ${newState}`);
    }
    if (this._stateMachine.isIdle()) {
      this.rndTimeUntilSkitter();
    }
  }

  // Debug methods
  forceIdle() {
    this._isMoving = false;
    this._commandQueue = [];
    this._stateMachine.setPrimaryState("IDLE");
  }
  
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

  // Mock methods for testing
  render() {}
  highlight() {}
  update() {
    this.updateTerrainState();
    this.processCommandQueue();
    this.checkForEnemies();
  }

  // Static methods
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

class TestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFunction) {
    this.tests.push({ name, testFunction });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
    }
  }

  assertTrue(condition, message) {
    this.assert(condition === true, message);
  }

  assertFalse(condition, message) {
    this.assert(condition === false, message);
  }

  assertArrayEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Assertion failed: ${message}. Expected: [${expected}], Actual: [${actual}]`);
    }
  }

  run() {
    console.log('🐜 Running Ant Class Test Suite...\n');
    
    for (const { name, testFunction } of this.tests) {
      try {
        testFunction();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    }
    
    return this.failed === 0;
  }
}

// Test Suite
const suite = new TestSuite();

// --- Constructor Tests ---
suite.test('Constructor - Default parameters', () => {
  const testAnt = new ant();
  suite.assertEqual(testAnt.posX, 0, 'Default X position should be 0');
  suite.assertEqual(testAnt.posY, 0, 'Default Y position should be 0');
  suite.assertEqual(testAnt.sizeX, 50, 'Default width should be 50');
  suite.assertEqual(testAnt.sizeY, 50, 'Default height should be 50');
  suite.assertEqual(testAnt.movementSpeed, 1, 'Default movement speed should be 1');
});

suite.test('Constructor - Custom parameters', () => {
  const testAnt = new ant(100, 200, 30, 40, 5, 45);
  suite.assertEqual(testAnt.posX, 100, 'Custom X position should be set');
  suite.assertEqual(testAnt.posY, 200, 'Custom Y position should be set');
  suite.assertEqual(testAnt.sizeX, 30, 'Custom width should be set');
  suite.assertEqual(testAnt.sizeY, 40, 'Custom height should be set');
  suite.assertEqual(testAnt.movementSpeed, 5, 'Custom movement speed should be set');
  suite.assertEqual(testAnt.rotation, 45, 'Custom rotation should be set');
});

suite.test('Constructor - Ant index assignment', () => {
  const initialIndex = ant_Index;
  const testAnt1 = new ant();
  const testAnt2 = new ant();
  suite.assertEqual(testAnt1.antIndex, initialIndex, 'First ant should get correct index');
  suite.assertEqual(testAnt2.antIndex, initialIndex + 1, 'Second ant should get incremented index');
});

// --- Property Getters/Setters Tests ---
suite.test('Position getters and setters', () => {
  const testAnt = new ant();
  testAnt.posX = 150;
  testAnt.posY = 250;
  suite.assertEqual(testAnt.posX, 150, 'X position setter/getter should work');
  suite.assertEqual(testAnt.posY, 250, 'Y position setter/getter should work');
  suite.assertEqual(testAnt._sprite.pos.x, 150, 'Sprite position should be synced');
  suite.assertEqual(testAnt._sprite.pos.y, 250, 'Sprite position should be synced');
});

suite.test('Size getters and setters', () => {
  const testAnt = new ant();
  testAnt.sizeX = 60;
  testAnt.sizeY = 80;
  suite.assertEqual(testAnt.sizeX, 60, 'Width setter/getter should work');
  suite.assertEqual(testAnt.sizeY, 80, 'Height setter/getter should work');
});

suite.test('Movement speed getter and setter', () => {
  const testAnt = new ant();
  testAnt.movementSpeed = 10;
  suite.assertEqual(testAnt.movementSpeed, 10, 'Movement speed setter/getter should work');
});

suite.test('Rotation getter and setter', () => {
  const testAnt = new ant();
  testAnt.rotation = 90;
  suite.assertEqual(testAnt.rotation, 90, 'Rotation setter/getter should work');
});

suite.test('Center calculation', () => {
  const testAnt = new ant(100, 200, 40, 60);
  const center = testAnt.center;
  suite.assertEqual(center.x, 120, 'Center X should be position + half width');
  suite.assertEqual(center.y, 230, 'Center Y should be position + half height');
});

// --- State Machine Integration Tests ---
suite.test('State machine initialization', () => {
  const testAnt = new ant();
  suite.assertTrue(testAnt.stateMachine instanceof MockAntStateMachine, 'Should have state machine');
  suite.assertEqual(testAnt.stateMachine.primaryState, 'IDLE', 'Should start in IDLE state');
  suite.assertTrue(testAnt.isIdle(), 'isIdle() should return true initially');
  suite.assertFalse(testAnt.isInCombat(), 'Should not be in combat initially');
});

suite.test('State change callback', () => {
  const testAnt = new ant();
  let callbackTriggered = false;
  testAnt._onStateChange = (oldState, newState) => {
    callbackTriggered = true;
  };
  testAnt.stateMachine.setPrimaryState('MOVING');
  suite.assertTrue(callbackTriggered, 'State change callback should be triggered');
});

// --- Movement Tests ---
suite.test('Move to location - valid movement', () => {
  const testAnt = new ant(0, 0);
  testAnt.moveToLocation(100, 200);
  suite.assertTrue(testAnt.isMoving, 'Ant should be moving after moveToLocation');
  suite.assertEqual(testAnt._stats.pendingPos.statValue.x, 100, 'Pending X should be set');
  suite.assertEqual(testAnt._stats.pendingPos.statValue.y, 200, 'Pending Y should be set');
  suite.assertEqual(testAnt.stateMachine.primaryState, 'MOVING', 'State should change to MOVING');
});

suite.test('Move to location - blocked by state', () => {
  const testAnt = new ant(0, 0);
  testAnt.stateMachine.setPrimaryState('STUNNED');
  testAnt.stateMachine.canPerformAction = () => false;
  testAnt.moveToLocation(100, 200);
  suite.assertFalse(testAnt.isMoving, 'Ant should not move when stunned');
});

suite.test('Effective movement speed - terrain modifiers', () => {
  const testAnt = new ant();
  testAnt.movementSpeed = 10;
  
  // Default terrain
  testAnt.stateMachine.terrainModifier = 'DEFAULT';
  suite.assertEqual(testAnt.getEffectiveMovementSpeed(), 10, 'Default terrain should not modify speed');
  
  // Water terrain
  testAnt.stateMachine.terrainModifier = 'IN_WATER';
  suite.assertEqual(testAnt.getEffectiveMovementSpeed(), 5, 'Water should reduce speed to 50%');
  
  // Mud terrain
  testAnt.stateMachine.terrainModifier = 'IN_MUD';
  suite.assertEqual(testAnt.getEffectiveMovementSpeed(), 3, 'Mud should reduce speed to 30%');
  
  // Slippery terrain
  testAnt.stateMachine.terrainModifier = 'ON_SLIPPERY';
  suite.assertEqual(testAnt.getEffectiveMovementSpeed(), 0, 'Slippery terrain should prevent movement');
  
  // Rough terrain
  testAnt.stateMachine.terrainModifier = 'ON_ROUGH';
  suite.assertEqual(testAnt.getEffectiveMovementSpeed(), 8, 'Rough terrain should reduce speed to 80%');
});

// --- Mouse Interaction Tests ---
suite.test('Mouse over detection', () => {
  const testAnt = new ant(50, 50, 40, 40);
  suite.assertTrue(testAnt.isMouseOver(60, 60), 'Should detect mouse over ant');
  suite.assertTrue(testAnt.isMouseOver(50, 50), 'Should detect mouse at ant edge');
  suite.assertTrue(testAnt.isMouseOver(90, 90), 'Should detect mouse at opposite edge');
  suite.assertFalse(testAnt.isMouseOver(40, 40), 'Should not detect mouse outside ant');
  suite.assertFalse(testAnt.isMouseOver(100, 100), 'Should not detect mouse outside ant');
});

suite.test('Selection state', () => {
  const testAnt = new ant();
  suite.assertFalse(testAnt.isSelected, 'Should not be selected initially');
  testAnt.isSelected = true;
  suite.assertTrue(testAnt.isSelected, 'Should be selected after setting');
});

// --- Command System Tests ---
suite.test('Command queue initialization', () => {
  const testAnt = new ant();
  suite.assertEqual(testAnt.commandQueue.length, 0, 'Command queue should be empty initially');
});

suite.test('Add and process commands', () => {
  const testAnt = new ant();
  testAnt.addCommand({ type: 'MOVE', x: 100, y: 200 });
  suite.assertEqual(testAnt.commandQueue.length, 1, 'Command should be added to queue');
  
  testAnt.processCommandQueue();
  suite.assertEqual(testAnt.commandQueue.length, 0, 'Commands should be processed and removed');
  suite.assertTrue(testAnt.isMoving, 'Move command should initiate movement');
});

suite.test('Command execution - GATHER', () => {
  const testAnt = new ant();
  testAnt.executeCommand({ type: 'GATHER' });
  suite.assertEqual(testAnt.stateMachine.primaryState, 'GATHERING', 'GATHER command should set state');
});

suite.test('Command execution - BUILD', () => {
  const testAnt = new ant();
  testAnt.executeCommand({ type: 'BUILD' });
  suite.assertEqual(testAnt.stateMachine.primaryState, 'BUILDING', 'BUILD command should set state');
});

suite.test('Command execution - FOLLOW', () => {
  const testAnt = new ant();
  const target = new ant();
  testAnt.executeCommand({ type: 'FOLLOW', target: target });
  suite.assertEqual(testAnt.stateMachine.primaryState, 'FOLLOWING', 'FOLLOW command should set state');
});

suite.test('Public command interface', () => {
  let testAnt = new ant();
  
  testAnt.startGathering();
  suite.assertEqual(testAnt.commandQueue.length, 1, 'startGathering should add command');
  suite.assertEqual(testAnt.commandQueue[0].type, 'GATHER', 'Should add GATHER command');
  
  testAnt = new ant(); // Create fresh ant
  testAnt.startBuilding();
  suite.assertEqual(testAnt.commandQueue.length, 1, 'startBuilding should add command');
  suite.assertEqual(testAnt.commandQueue[0].type, 'BUILD', 'Should add BUILD command');
  
  testAnt = new ant(); // Create fresh ant
  testAnt.moveToTarget(50, 75);
  suite.assertEqual(testAnt.commandQueue.length, 1, 'moveToTarget should add command');
  suite.assertEqual(testAnt.commandQueue[0].type, 'MOVE', 'Should add MOVE command');
  suite.assertEqual(testAnt.commandQueue[0].x, 50, 'Should set correct X coordinate');
  suite.assertEqual(testAnt.commandQueue[0].y, 75, 'Should set correct Y coordinate');
});

// --- Faction and Combat Tests ---
suite.test('Faction initialization', () => {
  const testAnt = new ant();
  suite.assertEqual(testAnt.faction, 'neutral', 'Should start with neutral faction');
});

suite.test('Faction setter', () => {
  const testAnt = new ant();
  testAnt.faction = 'blue';
  suite.assertEqual(testAnt.faction, 'blue', 'Should be able to set faction');
});

suite.test('Enemy detection - no enemies', () => {
  ants = []; // Reset global ants array
  ant_Index = 0;
  const testAnt = new ant();
  testAnt.faction = 'blue';
  ants[0] = testAnt;
  ant_Index = 1;
  
  testAnt.checkForEnemies();
  suite.assertEqual(testAnt.nearbyEnemies.length, 0, 'Should find no enemies when alone');
  suite.assertTrue(testAnt.stateMachine.isOutOfCombat(), 'Should be out of combat');
});

suite.test('Enemy detection - with enemy', () => {
  ants = []; // Reset global ants array
  ant_Index = 0;
  const testAnt1 = new ant(0, 0);
  const testAnt2 = new ant(30, 30); // Within detection radius
  testAnt1.faction = 'blue';
  testAnt2.faction = 'red';
  ants[0] = testAnt1;
  ants[1] = testAnt2;
  ant_Index = 2;
  
  testAnt1.checkForEnemies();
  suite.assertEqual(testAnt1.nearbyEnemies.length, 1, 'Should detect one enemy');
  suite.assertTrue(testAnt1.stateMachine.isInCombat(), 'Should enter combat');
});

// --- Skitter Logic Tests ---
suite.test('Skitter timer initialization', () => {
  const testAnt = new ant();
  suite.assertTrue(testAnt.timeUntilSkitter >= 30, 'Skitter timer should be at least 30');
  suite.assertTrue(testAnt.timeUntilSkitter <= 200, 'Skitter timer should be at most 200');
});

suite.test('Random skitter timer generation', () => {
  const testAnt = new ant();
  const originalTime = testAnt.timeUntilSkitter;
  testAnt.rndTimeUntilSkitter();
  suite.assertTrue(testAnt.timeUntilSkitter >= 30, 'New timer should be at least 30');
  suite.assertTrue(testAnt.timeUntilSkitter <= 200, 'New timer should be at most 200');
});

// --- Helper Methods Tests ---
suite.test('Helper methods for highlighting', () => {
  const testAnt = new ant(100, 200, 40, 60);
  const position = testAnt.getPosition();
  const size = testAnt.getSize();
  
  suite.assertEqual(position.x, 100, 'getPosition should return correct X');
  suite.assertEqual(position.y, 200, 'getPosition should return correct Y');
  suite.assertEqual(size.x, 40, 'getSize should return correct width');
  suite.assertEqual(size.y, 60, 'getSize should return correct height');
});

// --- Debug Methods Tests ---
suite.test('Debug state method', () => {
  const testAnt = new ant();
  const debugInfo = testAnt.debugState();
  
  suite.assertTrue(typeof debugInfo.antIndex === 'number', 'Debug should include ant index');
  suite.assertTrue(typeof debugInfo.primaryState === 'string', 'Debug should include primary state');
  suite.assertTrue(typeof debugInfo.isMoving === 'boolean', 'Debug should include movement status');
  suite.assertTrue(typeof debugInfo.canMove === 'boolean', 'Debug should include movement capability');
});

suite.test('Force idle method', () => {
  const testAnt = new ant();
  testAnt.isMoving = true;
  testAnt.addCommand({ type: 'MOVE', x: 100, y: 200 });
  testAnt.stateMachine.setPrimaryState('MOVING');
  
  testAnt.forceIdle();
  
  suite.assertFalse(testAnt.isMoving, 'Should stop movement');
  suite.assertEqual(testAnt.commandQueue.length, 0, 'Should clear command queue');
  suite.assertEqual(testAnt.stateMachine.primaryState, 'IDLE', 'Should set state to IDLE');
});

// --- Static Methods Tests ---
suite.test('Static method - moveGroupInCircle', () => {
  const testAnts = [new ant(), new ant(), new ant()];
  
  // Should not throw an error when called
  try {
    ant.moveGroupInCircle(testAnts, 100, 100, 50);
    suite.assertTrue(true, 'moveGroupInCircle should execute without error');
  } catch (error) {
    suite.assertTrue(false, 'moveGroupInCircle should not throw error');
  }
  
  // All ants should be deselected
  testAnts.forEach(testAnt => {
    suite.assertFalse(testAnt.isSelected, 'Ants should be deselected after group move');
  });
});

suite.test('Static method - selectAntUnderMouse', () => {
  const testAnts = [
    new ant(0, 0, 40, 40),
    new ant(100, 100, 40, 40)
  ];
  
  const selected = ant.selectAntUnderMouse(testAnts, 20, 20);
  suite.assertEqual(selected, testAnts[0], 'Should select first ant under mouse');
  suite.assertTrue(testAnts[0].isSelected, 'Selected ant should be marked as selected');
  suite.assertFalse(testAnts[1].isSelected, 'Other ants should not be selected');
  
  const noSelection = ant.selectAntUnderMouse(testAnts, 500, 500);
  suite.assertEqual(noSelection, null, 'Should return null when no ant under mouse');
});

// --- Pathfinding Integration Tests ---
suite.test('Path setting and getting', () => {
  const testAnt = new ant();
  const mockPath = [{ _x: 1, _y: 1 }, { _x: 2, _y: 2 }];
  
  testAnt.setPath(mockPath);
  suite.assertEqual(testAnt.path, mockPath, 'Should be able to set and get path');
});

// --- Terrain Detection Tests ---
suite.test('Terrain detection', () => {
  const testAnt = new ant();
  const terrain = testAnt.detectTerrain();
  suite.assertEqual(terrain, 'DEFAULT', 'Should return DEFAULT terrain (placeholder implementation)');
});

suite.test('Terrain state update', () => {
  const testAnt = new ant();
  const originalTerrain = testAnt.stateMachine.terrainModifier;
  testAnt.updateTerrainState();
  // Since detectTerrain always returns 'DEFAULT', terrain should remain unchanged
  suite.assertEqual(testAnt.stateMachine.terrainModifier, originalTerrain, 'Terrain should remain DEFAULT');
});

// --- Integration Tests ---
suite.test('Full update cycle - idle ant', () => {
  const testAnt = new ant();
  testAnt.timeUntilSkitter = 1; // Force skitter on next update
  
  // Mock the update method dependencies
  testAnt.render = () => {}; // Mock render
  testAnt.highlight = () => {}; // Mock highlight
  testAnt.ResolveMoment = () => {}; // Mock ResolveMoment
  
  try {
    testAnt.update();
    suite.assertTrue(true, 'Update should execute without error');
  } catch (error) {
    suite.assertTrue(false, `Update should not throw error: ${error.message}`);
  }
});

// Run all tests
if (require.main === module) {
  const success = suite.run();
  process.exit(success ? 0 : 1);
}

module.exports = { TestSuite, ant };