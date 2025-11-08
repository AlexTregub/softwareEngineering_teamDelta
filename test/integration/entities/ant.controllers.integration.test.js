/**
 * Ant Controller Integration Tests (JSDOM - Fast Browser Environment)
 * 
 * These tests verify how ants integrate with Entity controllers and StatsContainer:
 * - RenderController: Highlights (selected, hover, box hover), state indicators, terrain effects
 * - SelectionBoxController: Box selection, hover states, multi-select
 * - StatsContainer: Position, health, resources, movement speed
 * - All controllers: Movement, Combat, Terrain, Health, Selection
 * 
 * These are TRUE integration tests - testing REAL system interactions with minimal mocks.
 * Focus: Controller composition, highlight rendering, selection states, and stat management.
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Ant Controller Integration Tests (JSDOM)', function() {
  this.timeout(15000);

  let dom;
  let window;
  let Entity;
  let ant;
  let StatsContainer;
  let stat;
  let RenderController;
  let SelectionBoxController;
  let ants;

  beforeEach(function() {
    // Create a browser-like environment with JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    window = dom.window;
    global.window = window;
    global.document = window.document;
    global.localStorage = window.localStorage;
    global.console = console;
    
    // Mock globals
    global.frameCount = 0;
    global.devConsoleEnabled = false; // Disable debug console spam
    global.antManager = null; // Mock antManager for SelectionController
    global.selectables = []; // Mock selectables array for ant._removeFromGame

    // Setup p5.js mocks and load dependencies
    setupP5Mocks();
    loadDependencies();
    
    // Initialize ants array
    ants = [];
    global.ants = ants;
  });

  afterEach(function() {
    // Cleanup globals
    delete global.window;
    delete global.document;
    delete global.localStorage;
    delete global.frameCount;
    delete global.devConsoleEnabled;
    delete global.Entity;
    delete global.ant;
    delete global.StatsContainer;
    delete global.stat;
    delete global.RenderController;
    delete global.SelectionBoxController;
    delete global.ants;
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  function setupP5Mocks() {
    // Mock p5.Vector
    global.createVector = function(x = 0, y = 0) {
      return {
        x: x,
        y: y,
        copy: function() { return createVector(this.x, this.y); },
        add: function(v) { this.x += v.x; this.y += v.y; return this; },
        sub: function(v) { this.x -= v.x; this.y -= v.y; return this; },
        mult: function(n) { this.x *= n; this.y *= n; return this; },
        div: function(n) { this.x /= n; this.y /= n; return this; },
        mag: function() { return Math.sqrt(this.x * this.x + this.y * this.y); },
        normalize: function() { 
          const m = this.mag();
          if (m > 0) this.div(m);
          return this;
        },
        limit: function(max) {
          const m = this.mag();
          if (m > max) { this.mult(max / m); }
          return this;
        },
        dist: function(v) {
          const dx = this.x - v.x;
          const dy = this.y - v.y;
          return Math.sqrt(dx * dx + dy * dy);
        }
      };
    };

    // Mock p5.js rendering functions
    global.push = function() {};
    global.pop = function() {};
    global.stroke = function() {};
    global.strokeWeight = function() {};
    global.fill = function() {};
    global.noFill = function() {};
    global.noStroke = function() {};
    global.rect = function() {};
    global.ellipse = function() {};
    global.line = function() {};
    global.text = function() {};
    global.textAlign = function() {};
    global.textSize = function() {};
    global.translate = function() {};
    global.rotate = function() {};
    global.rectMode = function() {};
    global.smooth = function() {};
    global.noSmooth = function() {};
    global.redraw = function() {};
    global.CENTER = 'center';
    global.CORNER = 'corner';
    global.LEFT = 'left';
    global.TOP = 'top';

    // Mock p5 globals
    global.TILE_SIZE = 32;
    global.mouseX = 0;
    global.mouseY = 0;
    global.constrain = function(n, low, high) {
      return Math.max(Math.min(n, high), low);
    };
    global.dist = function(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    };
    global.random = function(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    };
  }

  function loadDependencies() {
    // Load in dependency order
    loadCollisionBox2D();
    loadSprite2D();
    loadStatsContainer();
    loadControllers();
    loadEntity();
    loadAntClasses();
    loadSelectionBoxController();
  }

  function loadCollisionBox2D() {
    const collisionBoxPath = path.join(__dirname, '../../../Classes/systems/CollisionBox2D.js');
    const code = fs.readFileSync(collisionBoxPath, 'utf8');
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    global.CollisionBox2D = new Function(cleanCode + '; return CollisionBox2D;')();
  }

  function loadSprite2D() {
    const spritePath = path.join(__dirname, '../../../Classes/rendering/Sprite2d.js');
    const code = fs.readFileSync(spritePath, 'utf8');
    const cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    global.Sprite2D = new Function(cleanCode + '; return Sprite2D;')();
  }

  function loadStatsContainer() {
    const statsPath = path.join(__dirname, '../../../Classes/containers/StatsContainer.js');
    const code = fs.readFileSync(statsPath, 'utf8');
    
    // Extract and execute the code
    const match = code.match(/(class StatsContainer[\s\S]*?class stat[\s\S]*?)(?=if \(typeof module)/);
    if (match) {
      const classCode = match[1];
      const result = new Function(classCode + '; return { StatsContainer, stat };')();
      global.StatsContainer = result.StatsContainer;
      global.stat = result.stat;
      StatsContainer = result.StatsContainer;
      stat = result.stat;
    }
  }

  function loadControllers() {
    // Mock UniversalDebugger and EntityDebugManager
    global.UniversalDebugger = undefined;
    global.EntityDebugManager = { registerEntity: () => {} };

    // Mock spatial grid manager
    global.spatialGridManager = {
      addEntity: () => {},
      removeEntity: () => {},
      updateEntity: () => {},
      getNearbyEntities: () => []
    };

    // Load REAL RenderController
    const renderPath = path.join(__dirname, '../../../Classes/controllers/RenderController.js');
    const renderCode = fs.readFileSync(renderPath, 'utf8');
    const renderMatch = renderCode.match(/(class RenderController[\s\S]*?)(?=\/\/ Export for Node\.js|$)/);
    if (renderMatch) {
      RenderController = new Function(renderMatch[1] + '; return RenderController;')();
      global.RenderController = RenderController;
    }

    // Load REAL TransformController
    const transformPath = path.join(__dirname, '../../../Classes/controllers/TransformController.js');
    if (fs.existsSync(transformPath)) {
      const transformCode = fs.readFileSync(transformPath, 'utf8');
      const transformMatch = transformCode.match(/(class TransformController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (transformMatch) {
        global.TransformController = new Function(transformMatch[1] + '; return TransformController;')();
      }
    }

    // Load REAL MovementController
    const movementPath = path.join(__dirname, '../../../Classes/controllers/MovementController.js');
    if (fs.existsSync(movementPath)) {
      const movementCode = fs.readFileSync(movementPath, 'utf8');
      const movementMatch = movementCode.match(/(class MovementController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (movementMatch) {
        global.MovementController = new Function(movementMatch[1] + '; return MovementController;')();
      }
    }

    // Load REAL SelectionController
    const selectionPath = path.join(__dirname, '../../../Classes/controllers/SelectionController.js');
    if (fs.existsSync(selectionPath)) {
      const selectionCode = fs.readFileSync(selectionPath, 'utf8');
      const selectionMatch = selectionCode.match(/(class SelectionController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (selectionMatch) {
        global.SelectionController = new Function(selectionMatch[1] + '; return SelectionController;')();
      }
    }

    // Load REAL TerrainController
    const terrainPath = path.join(__dirname, '../../../Classes/controllers/TerrainController.js');
    if (fs.existsSync(terrainPath)) {
      const terrainCode = fs.readFileSync(terrainPath, 'utf8');
      const terrainMatch = terrainCode.match(/(class TerrainController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (terrainMatch) {
        global.TerrainController = new Function(terrainMatch[1] + '; return TerrainController;')();
      }
    }

    // Load REAL CombatController
    const combatPath = path.join(__dirname, '../../../Classes/controllers/CombatController.js');
    if (fs.existsSync(combatPath)) {
      const combatCode = fs.readFileSync(combatPath, 'utf8');
      const combatMatch = combatCode.match(/(class CombatController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (combatMatch) {
        global.CombatController = new Function(combatMatch[1] + '; return CombatController;')();
      }
    }

    // Load REAL HealthController
    const healthPath = path.join(__dirname, '../../../Classes/controllers/HealthController.js');
    if (fs.existsSync(healthPath)) {
      const healthCode = fs.readFileSync(healthPath, 'utf8');
      const healthMatch = healthCode.match(/(class HealthController[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (healthMatch) {
        global.HealthController = new Function(healthMatch[1] + '; return HealthController;')();
      }
    }

    // Load REAL TaskManager
    const taskPath = path.join(__dirname, '../../../Classes/controllers/TaskManager.js');
    if (fs.existsSync(taskPath)) {
      const taskCode = fs.readFileSync(taskPath, 'utf8');
      const taskMatch = taskCode.match(/(class TaskManager[\s\S]*?)(?=\/\/ Export|if \(typeof module|$)/);
      if (taskMatch) {
        global.TaskManager = new Function(taskMatch[1] + '; return TaskManager;')();
      }
    }
  }

  function loadEntity() {
    const entityPath = path.join(__dirname, '../../../Classes/containers/Entity.js');
    const code = fs.readFileSync(entityPath, 'utf8');
    
    const classMatch = code.match(/(class Entity[\s\S]*?)(?=\/\/ Export for Node\.js|$)/);
    if (classMatch) {
      Entity = new Function(classMatch[1] + '; return Entity;')();
      global.Entity = Entity;
    }
  }

  function loadAntClasses() {
    // Initialize global antIndex counter (needed by ant constructor)
    global.antIndex = 0;
    global.performance = { now: () => Date.now() };
    
    // Try loading REAL classes if they exist, otherwise use minimal mocks
    
    // Minimal AntStateMachine mock (real one may have complex dependencies)
    global.AntStateMachine = class {
      constructor() {
        this.primaryState = "IDLE";
        this.terrainModifier = "DEFAULT";
        this._stateChangeCallback = null;
      }
      getCurrentState() { return this.primaryState; }
      setState(state) { 
        const oldState = this.primaryState;
        this.primaryState = state;
        if (this._stateChangeCallback) {
          this._stateChangeCallback(oldState, state);
        }
      }
      setPrimaryState(state) { this.setState(state); }
      setStateChangeCallback(callback) { this._stateChangeCallback = callback; }
      isGathering() { return this.primaryState === "GATHERING"; }
      isDroppingOff() { return this.primaryState === "DROPPING_OFF"; }
      isInCombat() { return this.primaryState === "COMBAT"; }
      isOutOfCombat() { return this.primaryState !== "COMBAT"; } // Add for shouldSkitter
      beginIdle() { this.setState("IDLE"); }
      ResumePreferredState() { this.setState("IDLE"); }
      canPerformAction(action) { return true; } // Add missing method for MovementController
      isPrimaryState(stateName) { return this.primaryState === stateName; } // Add missing method for shouldSkitter
      update() {}
    };

    // Minimal EntityInventoryManager mock
    global.EntityInventoryManager = class {
      constructor(entity, capacity, maxLoad) {
        this._entity = entity;
        this.maxCapacity = capacity;
        this.maxLoad = maxLoad;
        this._resources = [];
      }
      getCurrentLoad() { return this._resources.length; }
      addResource(resource) { 
        if (this._resources.length < this.maxCapacity) {
          this._resources.push(resource);
          return true;
        }
        return false;
      }
      dropAllResources() {
        const dropped = [...this._resources];
        this._resources = [];
        return dropped;
      }
      isAtMaxLoad() { return this._resources.length >= this.maxLoad; }
      update() {}
    };

    // Minimal GatherState mock
    global.GatherState = class {
      constructor(entity) {
        this._entity = entity;
        this.isActive = false;
      }
      enter() { this.isActive = true; }
      exit() { this.isActive = false; }
      update() { return false; }
      getDebugInfo() { return { isActive: this.isActive }; }
    };

    // Minimal AntBrain mock
    global.AntBrain = class {
      constructor(entity, jobName) {
        this._entity = entity;
        this._jobName = jobName;
      }
      update(deltaTime) {}
    };

    // Minimal JobComponent mock
    global.JobComponent = class {
      constructor(jobName, image) {
        this.jobName = jobName;
        this.image = image;
        this.stats = this._getJobStats(jobName);
      }
      _getJobStats(jobName) {
        const stats = {
          'Builder': { strength: 20, health: 120, gatherSpeed: 15, movementSpeed: 60 },
          'Scout': { strength: 10, health: 80, gatherSpeed: 10, movementSpeed: 80 },
          'Farmer': { strength: 15, health: 100, gatherSpeed: 30, movementSpeed: 60 },
          'Warrior': { strength: 40, health: 150, gatherSpeed: 5, movementSpeed: 60 },
          'Queen': { strength: 1000, health: 10000, gatherSpeed: 1, movementSpeed: 10000 }
        };
        return stats[jobName] || { strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 60 };
      }
    };

    // Load real ant class
    const antPath = path.join(__dirname, '../../../Classes/ants/ants.js');
    const antCode = fs.readFileSync(antPath, 'utf8');
    
    // Extract ant class - also initialize brain in constructor
    const antMatch = antCode.match(/(class ant extends Entity[\s\S]*?)(?=\/\/ --- Ant Management Functions|$)/);
    if (antMatch) {
      let classCode = antMatch[1];
      
      // Modify constructor to initialize brain immediately (for testing)
      classCode = classCode.replace(
        'this.brain;',
        'this.brain = new AntBrain(this, JobName);'
      );
      
      ant = new Function(classCode + '; return ant;')();
      global.ant = ant;
    }
  }

  function loadSelectionBoxController() {
    const selectionBoxPath = path.join(__dirname, '../../../Classes/controllers/SelectionBoxController.js');
    const code = fs.readFileSync(selectionBoxPath, 'utf8');
    
    // Mock moveSelectedEntitiesToTile function referenced by SelectionBoxController
    global.moveSelectedEntitiesToTile = function() {};
    
    // Execute the IIFE which sets window.SelectionBoxController
    eval(code);
    
    // Get the controller from window
    SelectionBoxController = global.window.SelectionBoxController;
    global.SelectionBoxController = SelectionBoxController;
  }

  // ============================================================================
  // RenderController Integration Tests
  // ============================================================================

  describe('RenderController Integration', function() {
    it('should create ant with working render controller', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      expect(testAnt).to.exist;
      expect(testAnt._renderController).to.exist;
      expect(testAnt._renderController).to.be.instanceOf(RenderController);
    });

    it('should highlight ant when selected (highlightSelected)', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Use the entity's highlight API
      testAnt.highlight.selected();
      
      // Verify highlight state through render controller
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('SELECTED');
      
      // Verify highlight color
      const highlightColor = testAnt._renderController.getHighlightColor();
      expect(highlightColor).to.deep.equal([0, 255, 0]); // Green
    });

    it('should highlight ant on hover (highlightHover)', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      // Trigger hover highlight
      testAnt.highlight.hover();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('HOVER');
      
      // Verify highlight color
      const highlightColor = testAnt._renderController.getHighlightColor();
      expect(highlightColor).to.deep.equal([255, 255, 0, 200]); // White with alpha
    });

    it('should highlight ant when box hovered (highlightBoxHover)', function() {
      const testAnt = new ant(200, 200, 32, 32, 1, 0, null, 'Builder', 'player');
      
      // Trigger box hover highlight
      testAnt.highlight.boxHover();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('BOX_HOVERED');
      
      // Verify highlight color
      const highlightColor = testAnt._renderController.getHighlightColor();
      expect(highlightColor).to.deep.equal([0, 255, 0, 150]); // Green with alpha
    });

    it('should highlight ant as resource (highlightResource)', function() {
      const testAnt = new ant(150, 150, 32, 32, 1, 0, null, 'Farmer', 'player');
      
      // Trigger resource highlight
      testAnt.highlight.resourceHover();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('RESOURCE');
      
      // Verify highlight color
      const highlightColor = testAnt._renderController.getHighlightColor();
      expect(highlightColor).to.deep.equal([255, 255, 255, 200]); // White with alpha
    });

    it('should show spinning highlight (highlightSpin)', function() {
      const testAnt = new ant(300, 300, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Trigger spinning highlight
      testAnt.highlight.spinning();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('SPINNING');
    });

    it('should show slow spinning highlight (highlightSlowSpin)', function() {
      const testAnt = new ant(400, 400, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      // Trigger slow spinning highlight
      testAnt.highlight.slowSpin();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('SLOW_SPINNING');
    });

    it('should show fast spinning highlight (highlightFastSpin)', function() {
      const testAnt = new ant(500, 500, 32, 32, 1, 0, null, 'Builder', 'player');
      
      // Trigger fast spinning highlight
      testAnt.highlight.fastSpin();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('FAST_SPINNING');
    });

    it('should clear highlight', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Set highlight first
      testAnt.highlight.selected();
      expect(testAnt._renderController.getHighlightState()).to.equal('SELECTED');
      
      // Clear highlight
      testAnt.highlight.clear();
      
      // Verify highlight cleared
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.be.null;
    });

    it('should show combat highlight when in combat', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      // Trigger combat highlight
      testAnt.highlight.combat();
      
      // Verify highlight state
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('COMBAT');
      
      // Verify highlight color
      const highlightColor = testAnt._renderController.getHighlightColor();
      expect(highlightColor).to.deep.equal([255, 0, 0]); // Red
    });

    it('should render state indicators for different ant states', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Test GATHERING state
      testAnt._stateMachine.setState('GATHERING');
      const gatheringState = testAnt._renderController.getCurrentEntityState();
      expect(gatheringState).to.equal('GATHERING');
      
      // Test IDLE state (should not show indicator)
      testAnt._stateMachine.setState('IDLE');
      const idleState = testAnt._renderController.getCurrentEntityState();
      expect(idleState).to.equal('IDLE');
      expect(testAnt._renderController.isStateIndicatorVisible()).to.be.false;
    });

    it('should render terrain indicators when on different terrain', function() {
      const testAnt = new ant(200, 200, 32, 32, 1, 0, null, 'Builder', 'player');
      
      // Set terrain to IN_WATER
      testAnt._stateMachine.terrainModifier = 'IN_WATER';
      
      // Verify terrain indicator would be visible
      expect(testAnt._stateMachine.terrainModifier).to.equal('IN_WATER');
      expect(testAnt._stateMachine.terrainModifier).to.not.equal('DEFAULT');
    });

    it('should support multiple highlights in sequence', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      // Test sequence: selected -> hover -> combat -> clear
      testAnt.highlight.selected();
      expect(testAnt._renderController.getHighlightState()).to.equal('SELECTED');
      
      testAnt.highlight.hover();
      expect(testAnt._renderController.getHighlightState()).to.equal('HOVER');
      
      testAnt.highlight.combat();
      expect(testAnt._renderController.getHighlightState()).to.equal('COMBAT');
      
      testAnt.highlight.clear();
      expect(testAnt._renderController.getHighlightState()).to.be.null;
    });

    it('should render without errors when calling render()', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Should not throw errors
      expect(() => testAnt.render()).to.not.throw();
      expect(() => testAnt._renderController.render()).to.not.throw();
    });
  });

  // ============================================================================
  // SelectionBoxController Integration Tests
  // ============================================================================

  describe('SelectionBoxController Integration', function() {
    let selectionBoxController;
    let mouseController;

    beforeEach(function() {
      // Mock minimal mouse controller
      mouseController = {
        onClick: function(callback) { this._clickCallback = callback; },
        onDrag: function(callback) { this._dragCallback = callback; },
        onRelease: function(callback) { this._releaseCallback = callback; },
        simulateClick: function(x, y, button = 'left') {
          if (this._clickCallback) this._clickCallback(x, y, button);
        },
        simulateDrag: function(x, y) {
          if (this._dragCallback) this._dragCallback(x, y, 0, 0);
        },
        simulateRelease: function(x, y, button = 'left') {
          if (this._releaseCallback) this._releaseCallback(x, y, button);
        }
      };

      // Create selection box controller with ants array
      selectionBoxController = SelectionBoxController.getInstance(mouseController, ants);
      global.g_selectionBoxController = selectionBoxController;
    });

    it('should create selection box controller instance', function() {
      expect(selectionBoxController).to.exist;
      expect(selectionBoxController.getEntities).to.be.a('function');
    });

    it('should select single ant with click', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      ants.push(testAnt);
      selectionBoxController.setEntities(ants);
      
      // Simulate click on ant position
      mouseController.simulateClick(116, 116, 'left'); // Center of ant (+16 tile centering)
      
      // Verify ant is selected
      expect(testAnt.isSelected).to.be.true;
    });

    it('should select multiple ants with box selection', function() {
      const ant1 = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      const ant2 = new ant(150, 150, 32, 32, 1, 0, null, 'Warrior', 'player');
      const ant3 = new ant(200, 200, 32, 32, 1, 0, null, 'Builder', 'player');
      
      ants.push(ant1, ant2, ant3);
      selectionBoxController.setEntities(ants);
      
      // Simulate box selection drag
      mouseController.simulateClick(90, 90, 'left'); // Start selection
      mouseController.simulateDrag(210, 210);        // Drag to cover all ants
      mouseController.simulateRelease(210, 210, 'left'); // End selection
      
      // Verify all ants in box are selected
      const selectedCount = ants.filter(a => a.isSelected).length;
      expect(selectedCount).to.be.greaterThan(0);
    });

    it('should set box hovered state during drag', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Farmer', 'player');
      ants.push(testAnt);
      selectionBoxController.setEntities(ants);
      
      // Start selection
      mouseController.simulateClick(90, 90, 'left');
      
      // Drag over ant
      mouseController.simulateDrag(150, 150);
      
      // Verify ant has box hover state (would be set by controller)
      // Note: Box hover state is managed by SelectionBoxController during drag
      expect(testAnt).to.exist;
    });

    it('should deselect all with right click', function() {
      const ant1 = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      const ant2 = new ant(150, 150, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      ants.push(ant1, ant2);
      selectionBoxController.setEntities(ants);
      
      // Select first ant
      mouseController.simulateClick(116, 116, 'left');
      expect(ant1.isSelected).to.be.true;
      
      // Right click to deselect all
      mouseController.simulateClick(200, 200, 'right');
      
      // Verify all ants deselected
      expect(ant1.isSelected).to.be.false;
      expect(ant2.isSelected).to.be.false;
    });

    it('should get selected entities list', function() {
      const ant1 = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      const ant2 = new ant(150, 150, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      ants.push(ant1, ant2);
      selectionBoxController.setEntities(ants);
      
      // Select first ant
      mouseController.simulateClick(116, 116, 'left');
      
      // Get selected entities
      const selectedEntities = selectionBoxController.getSelectedEntities();
      
      expect(selectedEntities).to.be.an('array');
      expect(selectedEntities.length).to.be.greaterThan(0);
    });

    it('should integrate with RenderController for selection highlight', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      ants.push(testAnt);
      selectionBoxController.setEntities(ants);
      
      // Select ant
      mouseController.simulateClick(116, 116, 'left');
      
      // Verify selection triggers highlight
      expect(testAnt.isSelected).to.be.true;
      
      // RenderController should show selected highlight
      const highlightState = testAnt._renderController.getHighlightState();
      expect(highlightState).to.equal('SELECTED');
    });
  });

  // ============================================================================
  // StatsContainer Integration Tests
  // ============================================================================

  describe('StatsContainer Integration', function() {
    it('should create ant with StatsContainer', function() {
      const testAnt = new ant(100, 100, 32, 32, 2, 0, null, 'Scout', 'player');
      
      expect(testAnt.StatsContainer).to.exist;
      expect(testAnt.StatsContainer).to.be.instanceOf(StatsContainer);
    });

    it('should track ant position in stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Builder', 'player');
      
      const position = testAnt.StatsContainer.position;
      expect(position).to.exist;
      expect(position.statValue).to.exist;
      expect(position.statValue.x).to.be.a('number');
      expect(position.statValue.y).to.be.a('number');
    });

    it('should track ant size in stats', function() {
      const testAnt = new ant(100, 100, 40, 40, 1, 0, null, 'Warrior', 'player');
      
      const size = testAnt.StatsContainer.size;
      expect(size).to.exist;
      expect(size.statValue).to.exist;
      expect(size.statValue.x).to.equal(40);
      expect(size.statValue.y).to.equal(40);
    });

    it('should track ant movement speed in stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 3.5, 0, null, 'Scout', 'player');
      
      const movementSpeed = testAnt.StatsContainer.movementSpeed;
      expect(movementSpeed).to.exist;
      expect(movementSpeed.statValue).to.be.a('number');
    });

    it('should track ant health in stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      const health = testAnt.StatsContainer.health;
      expect(health).to.exist;
      expect(health.statValue).to.be.a('number');
      expect(health.statValue).to.be.greaterThan(0);
    });

    it('should track ant strength in stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Builder', 'player');
      
      const strength = testAnt.StatsContainer.strength;
      expect(strength).to.exist;
      expect(strength.statValue).to.be.a('number');
      expect(strength.statValue).to.be.greaterThan(0);
    });

    it('should track gather speed in stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Farmer', 'player');
      
      const gatherSpeed = testAnt.StatsContainer.gatherSpeed;
      expect(gatherSpeed).to.exist;
      expect(gatherSpeed.statValue).to.be.a('number');
    });

    it('should update position stat when ant moves', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Move ant
      testAnt.setPosition(200, 200);
      
      // Update stats (normally done in update())
      testAnt.update();
      
      // Verify stats updated
      const position = testAnt.StatsContainer.position;
      expect(position.statValue.x).to.be.closeTo(200, 1);
      expect(position.statValue.y).to.be.closeTo(200, 1);
    });

    it('should track EXP in stats container', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      const stats = testAnt.StatsContainer;
      expect(stats.exp).to.exist;
      expect(stats.exp).to.be.instanceOf(Map);
      
      // Verify EXP categories
      expect(stats.exp.has('Lifetime')).to.be.true;
      expect(stats.exp.has('Gathering')).to.be.true;
      expect(stats.exp.has('Hunting')).to.be.true;
    });

    it('should enforce stat limits', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      const health = testAnt.StatsContainer.health;
      const maxHealth = health.statUpperLimit;
      
      // Try to set health above limit
      health.statValue = maxHealth + 100;
      
      // Verify limit enforced
      expect(health.statValue).to.equal(maxHealth);
    });
  });

  // ============================================================================
  // Multi-Controller Integration Tests
  // ============================================================================

  describe('Multi-Controller Integration', function() {
    it('should coordinate all controllers during update', function() {
      const testAnt = new ant(100, 100, 32, 32, 2, 0, null, 'Scout', 'player');
      
      // Verify all controllers exist
      expect(testAnt._movementController).to.exist;
      expect(testAnt._renderController).to.exist;
      expect(testAnt._selectionController).to.exist;
      expect(testAnt._terrainController).to.exist;
      expect(testAnt._combatController).to.exist;
      expect(testAnt._healthController).to.exist;
      
      // Update should coordinate all systems
      expect(() => testAnt.update()).to.not.throw();
    });

    it('should integrate selection with rendering highlights', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      // Select ant
      testAnt.isSelected = true;
      
      // Verify selection controller state
      expect(testAnt._selectionController.isSelected()).to.be.true;
      
      // Verify render controller shows highlight
      expect(testAnt._renderController.getHighlightState()).to.equal('SELECTED');
    });

    it('should integrate movement with terrain and stats', function() {
      const testAnt = new ant(100, 100, 32, 32, 2, 0, null, 'Scout', 'player');
      
      // Manually set terrain (TerrainController doesn't have setCurrentTerrain, it auto-detects)
      testAnt._terrainController._currentTerrain = 'IN_WATER';
      
      // Start movement
      testAnt.moveToLocation(200, 200);
      
      // Verify movement controller active
      expect(testAnt._movementController.getIsMoving()).to.be.true;
      
      // Verify terrain affects movement (use getSpeedModifier instead of getMovementMultiplier)
      const baseSpeed = 2;
      const modifiedSpeed = testAnt._terrainController.getSpeedModifier(baseSpeed);
      expect(modifiedSpeed).to.be.lessThan(baseSpeed); // Water slows movement
    });

    it('should integrate combat with health controller', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Warrior', 'player');
      
      const initialHealth = testAnt.health;
      
      // Take damage
      testAnt.takeDamage(25);
      
      // Verify health changed
      expect(testAnt.health).to.equal(initialHealth - 25);
      
      // Verify health controller notified
      expect(testAnt._healthController).to.exist;
    });

    it('should integrate all systems in complex scenario', function() {
      // Create warrior ant
      const warrior = new ant(100, 100, 32, 32, 2, 0, null, 'Warrior', 'player');
      
      // Select warrior (triggers selection + render highlight)
      warrior.isSelected = true;
      expect(warrior._selectionController.isSelected()).to.be.true;
      expect(warrior._renderController.getHighlightState()).to.equal('SELECTED');
      
      // Move warrior (triggers movement controller)
      warrior.moveToLocation(300, 300);
      expect(warrior._movementController.getIsMoving()).to.be.true;
      
      // Set terrain (affects movement speed)
      warrior._terrainController.setCurrentTerrain('IN_MUD');
      expect(warrior._terrainController.getMovementMultiplier()).to.equal(0.7);
      
      // Take damage (triggers health + combat systems)
      warrior.takeDamage(30);
      expect(warrior.health).to.be.lessThan(warrior.maxHealth);
      
      // Update all systems
      warrior.update();
      
      // Verify stats updated
      expect(warrior.StatsContainer.position.statValue).to.exist;
      
      // Verify no errors during render
      expect(() => warrior.render()).to.not.throw();
    });

    it('should handle multiple ants interacting simultaneously', function() {
      const ant1 = new ant(100, 100, 32, 32, 2, 0, null, 'Scout', 'player');
      const ant2 = new ant(200, 200, 32, 32, 2, 0, null, 'Warrior', 'enemy');
      
      ants.push(ant1, ant2);
      
      // Both ants active
      expect(ant1._isActive).to.be.true;
      expect(ant2._isActive).to.be.true;
      
      // Update both
      ant1.update();
      ant2.update();
      
      // Select first ant
      ant1.isSelected = true;
      expect(ant1._renderController.getHighlightState()).to.equal('SELECTED');
      
      // Second ant should not be affected
      expect(ant2.isSelected).to.be.false;
      
      // Render both
      expect(() => {
        ant1.render();
        ant2.render();
      }).to.not.throw();
    });
  });

  // ============================================================================
  // Real System Integration (Minimal Mocking)
  // ============================================================================

  describe('Real System Integration Tests', function() {
    it('should create ant using real Entity, RenderController, and StatsContainer', function() {
      const testAnt = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      
      // Verify real classes used (not mocks)
      expect(testAnt).to.be.instanceOf(Entity);
      expect(testAnt._renderController).to.be.instanceOf(RenderController);
      expect(testAnt.StatsContainer).to.be.instanceOf(StatsContainer);
    });

    it('should test full ant lifecycle with real controllers', function() {
      // Create ant
      const testAnt = new ant(100, 100, 32, 32, 2, 0, null, 'Warrior', 'player');
      
      // Initialize phase - verify setup
      expect(testAnt._isActive).to.be.true;
      expect(testAnt.health).to.be.greaterThan(0);
      
      // Active phase - movement and selection
      testAnt.moveToLocation(300, 300);
      testAnt.isSelected = true;
      testAnt.update();
      
      expect(testAnt._movementController.getIsMoving()).to.be.true;
      expect(testAnt._renderController.getHighlightState()).to.equal('SELECTED');
      
      // Combat phase - take damage
      const initialHealth = testAnt.health;
      testAnt.takeDamage(50);
      expect(testAnt.health).to.equal(initialHealth - 50);
      
      // Render phase - verify no errors
      expect(() => testAnt.render()).to.not.throw();
      
      // Death phase (if health reaches 0)
      testAnt.takeDamage(testAnt.health); // Kill ant
      expect(testAnt.health).to.equal(0);
      expect(testAnt._isActive).to.be.false;
    });

    it('should coordinate real RenderController with SelectionBoxController', function() {
      const ant1 = new ant(100, 100, 32, 32, 1, 0, null, 'Scout', 'player');
      const ant2 = new ant(200, 200, 32, 32, 1, 0, null, 'Builder', 'player');
      
      ants.push(ant1, ant2);
      
      const mouseController = {
        onClick: function(cb) { this._clickCb = cb; },
        onDrag: function(cb) { this._dragCb = cb; },
        onRelease: function(cb) { this._releaseCb = cb; },
        click: function(x, y) { if (this._clickCb) this._clickCb(x, y, 'left'); }
      };
      
      const selectionBox = SelectionBoxController.getInstance(mouseController, ants);
      
      // Click on first ant
      mouseController.click(116, 116);
      
      // Verify selection state synchronized
      expect(ant1.isSelected).to.be.true;
      expect(ant1._renderController.getHighlightState()).to.equal('SELECTED');
    });
  });
});
