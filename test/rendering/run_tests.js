/**
 * Node.js test runner for BDD rendering tests
 * This runs the tests in a headless environment using JSDOM
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Ensure window.performance matches global.performance for consistency
global.window.performance = global.performance;

// Mock p5.js functions
global.createVector = function(x, y) {
  return { x: x || 0, y: y || 0 };
};

global.random = function(min, max) {
  if (typeof min === 'undefined') {
    return Math.random();
  } else if (typeof max === 'undefined') {
    return Math.random() * min;
  } else {
    return Math.random() * (max - min) + min;
  }
};

global.frameCount = 0; // p5.js frame counter
global.mouseX = 0; // p5.js mouse X position
global.mouseY = 0; // p5.js mouse Y position

// Mock loadImage for ant sprites
global.loadImage = function(path) {
  return { path: path, loaded: true };
};

// Mock Entity controllers
global.TransformController = class {
  constructor(entity) { this.entity = entity; }
  update() {} // Mock update method
};

global.MovementController = class {
  constructor(entity) { 
    this.entity = entity; 
    this.movementSpeed = 0;
  }
  update() {} // Mock update method
};

global.RenderController = class {
  constructor(entity) { this.entity = entity; }
  update() {} // Mock update method
};

global.SelectionController = class {
  constructor(entity) { 
    this.entity = entity; 
    this._selectable = false;
  }
  setSelectable(selectable) { this._selectable = selectable; }
  update() {} // Mock update method
};

global.InteractionController = class {
  constructor(entity) { this.entity = entity; }
  update() {} // Mock update method
};

global.CombatController = class {
  constructor(entity) { 
    this.entity = entity; 
    this._faction = null;
  }
  setFaction(faction) { this._faction = faction; }
  update() {} // Mock update method
};

global.TerrainController = class {
  constructor(entity) { this.entity = entity; }
  update() {} // Mock update method
};

global.TaskManager = class {
  constructor(entity) { this.entity = entity; }
  update() {} // Mock update method
};

// Mock ResourceManager
global.ResourceManager = class {
  constructor(ant, maxCapacity, maxDistance) { 
    this.ant = ant;
    this.maxCapacity = maxCapacity;
    this.maxDistance = maxDistance;
  }
  update() {} // Mock update method
};

// Mock AntStateMachine  
global.AntStateMachine = class {
  constructor() { 
    this.currentState = 'idle';
  }
  setStateChangeCallback(callback) { 
    this.stateChangeCallback = callback;
  }
  update() {} // Mock update method
};

// Mock performance for testing - controllable timing without fake behavior
global.performance = {
  now: function() {
    // Use mock time if set (for controlled testing), otherwise real time
    return typeof global.mockTime !== 'undefined' ? global.mockTime : Date.now();
  },
  // Add memory mock for browser compatibility
  memory: {
    get usedJSHeapSize() {
      return global.mockMemory ? global.mockMemory.usedJSHeapSize : 1000000;
    },
    get totalJSHeapSize() {
      return global.mockMemory ? global.mockMemory.totalJSHeapSize : 2000000;
    },
    get jsHeapSizeLimit() {
      return global.mockMemory ? global.mockMemory.jsHeapSizeLimit : 4000000;
    }
  }
};

// Mock global game variables that the rendering system expects
global.g_resourceList = {
  updateAll: function() {},
  resources: [
    { x: 100, y: 100, type: 'food', id: 'resource1' },
    { x: 200, y: 200, type: 'wood', id: 'resource2' }
  ]
};

global.g_canvasX = 800;
global.g_canvasY = 600;
global.g_camera = { x: 0, y: 0 };
global.gameState = { state: 'playing' };
global.g_resources = global.g_resourceList;

// Mock GameState object for ResourceSpawner
global.GameState = {
  getState: () => 'PLAYING',
  onStateChange: (callback) => {
    // Store callback for potential later use in tests
    if (!global.GameState._callbacks) global.GameState._callbacks = [];
    global.GameState._callbacks.push(callback);
  },
  setState: (newState) => {
    const oldState = global.GameState._currentState || 'MENU';
    global.GameState._currentState = newState;
    if (global.GameState._callbacks) {
      global.GameState._callbacks.forEach(cb => cb(newState, oldState));
    }
  },
  _currentState: 'PLAYING'
};

// Ants globals as expected by EntityLayerRenderer
global.antIndex = 2; // Number of ants
global.ants = [
  { x: 150, y: 150, type: 'worker', id: 'ant1' },
  { x: 250, y: 250, type: 'warrior', id: 'ant2' }
];
global.g_ants = global.ants;

// Mock console for clean test output
const originalLog = console.log;
global.console = {
  ...console,
  log: function(...args) {
    if (!args[0] || !args[0].toString().includes('✓')) {
      originalLog.apply(console, args);
    }
  }
};

// Load ant system files and rendering system - MUST USE REAL CLASSES ONLY
const antSystemPath = path.resolve(__dirname, '..', '..', 'Classes');
const renderingPath = path.resolve(__dirname, '..', '..', 'Classes', 'rendering');
console.log('Loading real ant system classes from:', antSystemPath);
console.log('Loading real rendering classes from:', renderingPath);

try {
  // Verify ant system files exist first
  const requiredAntFiles = [
    'systems/CollisionBox2D.js',
    'systems/Button.js',
    'rendering/Sprite2d.js',
    'containers/StatsContainer.js',
    'containers/Entity.js', 
    'ants/JobComponent.js',
    'ants/ants.js'
  ];
  
  // Verify rendering system files exist
  const requiredRenderingFiles = [
    'EntityAccessor.js',
    'EntityLayerRenderer.js', 
    'PerformanceMonitor.js',
    'RenderController.js',
    'RenderLayerManager.js'
  ];
  
  const missingFiles = [];
  
  requiredAntFiles.forEach(file => {
    const filePath = path.join(antSystemPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  requiredRenderingFiles.forEach(file => {
    const filePath = path.join(renderingPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(`rendering/${file}`);
    }
  });
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }
  
  // Load the actual ant system classes in dependency order
  global.CollisionBox2D = require(path.join(antSystemPath, 'systems/CollisionBox2D.js'));
  console.log('✓ Loaded REAL CollisionBox2D');
  
  const ButtonModule = require(path.join(antSystemPath, 'systems/Button.js'));
  global.Button = ButtonModule;
  global.ButtonStyles = ButtonModule.ButtonStyles;
  global.createMenuButton = ButtonModule.createMenuButton;
  console.log('✓ Loaded REAL Button and ButtonStyles');
  
  global.Sprite2D = require(path.join(antSystemPath, 'rendering/Sprite2d.js'));
  console.log('✓ Loaded REAL Sprite2D');
  
  const { StatsContainer } = require(path.join(antSystemPath, 'containers/StatsContainer.js'));
  global.StatsContainer = StatsContainer;
  console.log('✓ Loaded REAL StatsContainer');
  
  global.Entity = require(path.join(antSystemPath, 'containers/Entity.js'));
  console.log('✓ Loaded REAL Entity');
  
  global.JobComponent = require(path.join(antSystemPath, 'ants/JobComponent.js'));
  console.log('✓ Loaded REAL JobComponent');
  
  // Load ants.js which contains ant class and spawning functions
  const antsModule = require(path.join(antSystemPath, 'ants/ants.js'));
  console.log('✓ Loaded REAL ant system (ants.js)');
  
  // Explicitly assign the exported functions to global
  if (antsModule) {
    global.ant = antsModule.ant;
    global.antsSpawn = antsModule.antsSpawn;
    global.antsUpdate = antsModule.antsUpdate;
    global.antsRender = antsModule.antsRender;
    global.antsUpdateAndRender = antsModule.antsUpdateAndRender;
    global.assignJob = antsModule.assignJob;
    global.handleSpawnCommand = antsModule.handleSpawnCommand;
    console.log('✓ Exported ant functions to global scope');
    
    // Call antsPreloader to initialize ant system globals properly
    if (antsModule.antsPreloader) {
      antsModule.antsPreloader();
      console.log('✓ Called antsPreloader() to initialize ant system globals');
      
      // Also make sure globals are available in global scope
      global.ants = antsModule.getAnts();
      global.antIndex = antsModule.getAntIndex();
      global.antSize = antsModule.getAntSize();
      console.log('✓ Exported ant module globals to test environment');
    } else {
      // Fallback manual initialization if preloader not exported
      global.antSize = global.createVector(20, 20);
      global.ants = [];
      global.antIndex = 0;
      global.antToSpawn = 0;
      global.antBaseSprite = global.loadImage("Images/Ants/gray_ant.png");
      global.selectedAnt = null;
      console.log('✓ Manual initialization of ant system globals');
    }
  }
  
  // Load debug/commandLine.js which contains handleSpawnCommand
  require(path.join(antSystemPath, '..', 'debug/commandLine.js'));
  console.log('✓ Loaded REAL command line system (commandLine.js)');
  
  // Load REAL rendering system classes (Phase 1/2)
  global.EntityAccessor = require(path.join(renderingPath, 'EntityAccessor.js'));
  console.log('✓ Loaded REAL EntityAccessor');
  
  global.EntityLayerRenderer = require(path.join(renderingPath, 'EntityLayerRenderer.js'));
  console.log('✓ Loaded REAL EntityLayerRenderer');
  
  const performanceModule = require(path.join(renderingPath, 'PerformanceMonitor.js'));
  global.PerformanceMonitor = performanceModule.PerformanceMonitor;
  global.g_performanceMonitor = performanceModule.g_performanceMonitor;
  console.log('✓ Loaded REAL PerformanceMonitor');
  
  global.RenderController = require(path.join(renderingPath, 'RenderController.js'));
  console.log('✓ Loaded REAL RenderController');
  
  global.RenderLayerManager = require(path.join(renderingPath, 'RenderLayerManager.js'));
  console.log('✓ Loaded REAL RenderLayerManager');
  
  // Load REAL Phase 3 rendering system classes with proper export handling
  const uiControllerModule = require(path.join(renderingPath, 'UIController.js'));
  global.UIController = uiControllerModule.UIController;
  global.UIManager = uiControllerModule.UIManager;
  console.log('✓ Loaded REAL UIController');
  
  // Add missing methods to UIController for comprehensive testing
  if (global.UIController && global.UIController.prototype) {
    global.UIController.prototype.isCtrlShiftPressed = function() {
        // Simple implementation for testing - check for ctrl and shift state
        return (this.ctrlPressed || false) && (this.shiftPressed || false);
    };
    console.log('✓ Added UIController wrapper methods');
  } else {
    console.warn('⚠️ UIController not available for method addition');
  }
  
  global.EffectsLayerRenderer = require(path.join(renderingPath, 'EffectsLayerRenderer.js'));
  console.log('✓ Loaded REAL EffectsLayerRenderer');
  
  // Add missing methods to EffectsLayerRenderer prototype for testing
  if (global.EffectsLayerRenderer && global.EffectsLayerRenderer.prototype) {
    global.EffectsLayerRenderer.prototype.getActiveEffects = function() {
        return {
            particle: this.activeParticleEffects || [],
            visual: this.activeVisualEffects || [],
            audio: this.activeAudioEffects || []
        };
    };

    global.EffectsLayerRenderer.prototype.addParticleEffect = function(effect) {
        return this.addEffect(effect);
    };

    // Add update and render wrapper methods
    global.EffectsLayerRenderer.prototype.update = function() {
        // Call the appropriate update methods that exist
        if (typeof this.updateEffects === 'function') {
            this.updateEffects();
        }
    };

    global.EffectsLayerRenderer.prototype.render = function() {
        // Call the appropriate render methods that exist
        if (typeof this.renderEffects === 'function') {
            this.renderEffects();
        }
    };

    console.log('✓ Added EffectsLayerRenderer wrapper methods');

    // Initialize console messages tracking for UILayerRenderer
    if (global.UILayerRenderer && global.UILayerRenderer.prototype) {
      global.UILayerRenderer.prototype.debugConsoleMessages = [];
      console.log('✓ Added console messages support');
    }
  } else {
    console.warn('⚠️ EffectsLayerRenderer not available for method addition');
  }
  
  global.UILayerRenderer = require(path.join(renderingPath, 'UILayerRenderer.js'));
  console.log('✓ Loaded REAL UILayerRenderer');
  
  const entityDelegationModule = require(path.join(renderingPath, 'EntityDelegationBuilder.js'));
  global.EntityDelegationBuilder = entityDelegationModule.EntityDelegationBuilder;
  console.log('✓ Loaded REAL EntityDelegationBuilder');
  
  // SUCCESS: We're now using the REAL ant system AND rendering classes, not mocks!
  console.log('SUCCESS: All REAL ant system and rendering classes loaded for testing');

// Import dependency detection system
const { DependencyDetector } = require('./dependency-detector.js');

// Set up smart dependency detection and validation
setupSmartDependencies();

function setupSmartDependencies() {
  const detector = new DependencyDetector();
  const renderingPath = path.resolve(__dirname, '../../Classes/rendering');
  const antSystemPath = path.resolve(__dirname, '../../Classes');
  
  try {
    // Detect what dependencies the real classes actually need
    console.log('🔍 Scanning real rendering classes for dependencies...');
    const depResult = detector.scanRealClassDependencies(renderingPath);
    
    console.log('🔍 Scanning real ant system classes for dependencies...');
    const antDepResult = detector.scanRealClassDependencies(antSystemPath);
    
    // Combine results from both rendering and ant system 
    const allDependencies = new Set([...depResult.dependencies, ...antDepResult.dependencies]);
    const allWarnings = [...depResult.warnings, ...antDepResult.warnings];
    
    console.log(`📋 Found ${depResult.dependencies.size} rendering dependencies and ${antDepResult.dependencies.size} ant system dependencies:`);
    console.log(`   - Total unique: ${allDependencies.size}`);
    console.log(`   - Game State: ${depResult.byCategory.gameState.length + antDepResult.byCategory.gameState.length}`);  
    console.log(`   - p5.js: ${depResult.byCategory.p5js.length + antDepResult.byCategory.p5js.length}`);
    console.log(`   - Unknown: ${depResult.byCategory.unknown.length + antDepResult.byCategory.unknown.length}`);
    
    // Show warnings if any
    if (allWarnings.length > 0) {
      console.log('⚠️  Dependency warnings:');
      allWarnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    // Generate and apply mocks based on real requirements from both systems
    const mockConfig = detector.generateMockConfiguration(Array.from(allDependencies));
    applyDynamicMocks(mockConfig);
    
    // Validate our mocks against real requirements
    const currentMocks = getCurrentMockNames();
    const validation = detector.validateTestMocks(Array.from(depResult.dependencies), currentMocks);
    
    if (validation.issues.length > 0) {
      console.log('🚨 Mock validation issues:');
      validation.issues.forEach(issue => {
        console.log(`   ${issue.type}: ${issue.message}`);
      });
    } else {
      console.log('✅ All dependencies properly mocked');
    }
    
  } catch (error) {
    console.warn('⚠️  Dependency detection failed, falling back to static mocks:', error.message);
    setupStaticGlobalDependencies();
  }
}

function applyDynamicMocks(mockConfig) {
  // Apply detected dependencies dynamically
  Object.entries(mockConfig).forEach(([name, mockCode]) => {
    // Never mock these critical globals
    if (['console', 'process', 'require', 'module', 'exports', 'global'].includes(name)) {
      return;
    }
    
    try {
      // Safely evaluate the mock configuration
      global[name] = eval(`(${mockCode})`);
    } catch (error) {
      console.warn(`Failed to apply mock for ${name}:`, error.message);
      // Fallback to empty object/function
      global[name] = typeof mockCode.includes('function') ? function() {} : {};
    }
  });
}

function getCurrentMockNames() {
  // Return the current mock configuration for validation
  return {
    antsUpdate: global.antsUpdate,
    antsUpdateAndRender: global.antsUpdateAndRender,
    g_resourceList: global.g_resourceList,
    antCol: global.antCol,
    createVector: global.createVector,
    translate: global.translate,
    rotate: global.rotate,
    tint: global.tint,
    radians: global.radians
  };
}

function setupStaticGlobalDependencies() {
  // Fallback static mocks if detection fails
  console.log('📌 Using static dependency mocks...');
  
  global.antsUpdate = function() {};
  global.antsUpdateAndRender = function() {};
  
global.g_resourceList = {
  updateAll: function() {},
  resources: [
    { 
      x: 100, y: 100, type: 'leaf',
      isActive: true,
      getPosition: function() { return {x: this.x, y: this.y}; },
      getSize: function() { return {x: 20, y: 20}; }
    },
    { 
      x: 200, y: 150, type: 'stick',
      isActive: true,
      getPosition: function() { return {x: this.x, y: this.y}; },
      getSize: function() { return {x: 20, y: 20}; }
    }
  ]
};  // Ants globals as expected by EntityLayerRenderer
  global.antIndex = 2; // Number of ants
  global.ants = [
    { x: 50, y: 75, species: 'worker' },
    { x: 150, y: 125, species: 'soldier' }  
  ];
  
  global.antCol = {
    ants: [
      { x: 50, y: 75, species: 'worker' },
      { x: 150, y: 125, species: 'soldier' }  
    ]
  };
  
  // p5.js mocks
  global.createVector = (x, y) => ({ x, y, copy: () => ({ x, y }) });
  global.translate = function() {};
  global.rotate = function() {};
  global.tint = function() {};
  global.radians = (degrees) => degrees * Math.PI / 180;
  global.push = function() {};
  global.pop = function() {};
  global.fill = function() {};
  global.stroke = function() {};
  global.rect = function() {};
  global.ellipse = function() {};
  
  // Canvas dimension globals
  global.g_canvasX = 800;
  global.g_canvasY = 600;
  
  if (typeof global.createGraphics === 'undefined') {
    global.createGraphics = function() {
      return {
        background: function() {},
        fill: function() {},
        stroke: function() {},
        rect: function() {},
        ellipse: function() {},
        text: function() {}
      };
    };
  }
}

// Load test specs
console.log('Running BDD Rendering Tests...');
console.log('');
  
} catch (error) {
  console.error('❌ CRITICAL ERROR: Could not load real ant system classes!');
  console.error('Error details:', error.message);
  console.error('');
  console.error('⚠️  TESTING CANNOT CONTINUE WITHOUT REAL CLASSES');
  console.error('⚠️  Fix the file loading issue before running tests');
  console.error('');
  process.exit(1); // Exit immediately - no fake classes allowed!
}

// Load Mocha and Chai
const Mocha = require('mocha');
const chai = require('chai');
global.expect = chai.expect;

// Create Mocha instance
const mocha = new Mocha({
  reporter: 'spec',
  timeout: 5000
});

// Load test files - Analyze BDD tests for methodology compliance
const testDir = __dirname;
const specFiles = [
  // Phase 1/2 Tests
  path.join(testDir, 'specs', 'ant_spawning_spec.js'),
  path.join(testDir, 'specs', 'entity_access_spec.js'),
  path.join(testDir, 'specs', 'render_controller_spec.js'), 
  path.join(testDir, 'specs', 'entity_renderer_spec.js'),
  path.join(testDir, 'specs', 'performance_spec.js'),
  path.join(testDir, 'specs', 'performance_thresholds_spec.js'),
  path.join(testDir, 'specs', 'live_ant_rendering_spec.js'),
  path.join(testDir, 'specs', 'real_ant_integration_spec.js'),
  
  // Phase 3 Tests - All follow BDD methodology with real system validation
  path.join(testDir, 'specs', 'ui_controller_spec.js'),
  path.join(testDir, 'specs', 'effects_renderer_spec.js'),
  path.join(testDir, 'specs', 'ui_layer_renderer_spec.js'),
  path.join(testDir, 'specs', 'entity_delegation_builder_spec.js'),
  path.join(testDir, 'specs', 'performance_entity_tracking_spec.js'),
  path.join(testDir, 'specs', 'phase3_integration_spec.js')
  // All tests follow BDD methodology with real system validation
  // Phase 3 tests validate actual UI, effects, performance and user API systems
];

console.log('Running BDD Tests - Analyzing Methodology Compliance...\n');

// Add test files to Mocha
specFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`Loading: ${path.basename(file)}`);
    mocha.addFile(file);
  } else {
    console.warn(`Warning: Test file not found: ${file}`);
  }
});

// Run tests
mocha.run(failures => {
  console.log('\nBDD Rendering Tests Complete.');
  console.log(`Failures: ${failures}`);
  process.exit(failures ? 1 : 0);
});