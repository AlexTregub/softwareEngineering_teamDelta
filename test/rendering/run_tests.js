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

// Load rendering system files - MUST USE REAL CLASSES ONLY
const renderingPath = path.resolve(__dirname, '..', '..', 'Classes', 'rendering');
console.log('Loading real rendering classes from:', renderingPath);

try {
  // Verify all files exist first
  const requiredFiles = ['EntityAccessor.js', 'RenderController.js', 'EntityLayerRenderer.js', 'PerformanceMonitor.js'];
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(renderingPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required rendering files: ${missingFiles.join(', ')}`);
  }
  
  // Load the actual rendering classes and assign to global
  global.EntityAccessor = require(path.join(renderingPath, 'EntityAccessor.js'));
  console.log('✓ Loaded REAL EntityAccessor');
  
  // Load EntityLayerRenderer (exported as object)
  const entityLayerModule = require(path.join(renderingPath, 'EntityLayerRenderer.js'));
  global.EntityLayerRenderer = entityLayerModule.EntityLayerRenderer || entityLayerModule;
  console.log('✓ Loaded REAL EntityLayerRenderer');
  
  // Load RenderController
  global.RenderController = require(path.join(renderingPath, 'RenderController.js'));
  console.log('✓ Loaded REAL RenderController');
  
  // Load PerformanceMonitor (exported as object)  
  const perfModule = require(path.join(renderingPath, 'PerformanceMonitor.js'));
  global.PerformanceMonitor = perfModule.PerformanceMonitor || perfModule;
  console.log('✓ Loaded REAL PerformanceMonitor');
  
  // SUCCESS: We're now using the REAL classes, not mocks!
console.log('SUCCESS: All REAL rendering classes loaded for testing');

// Import dependency detection system
const { DependencyDetector } = require('./dependency-detector.js');

// Set up smart dependency detection and validation
setupSmartDependencies();

function setupSmartDependencies() {
  const detector = new DependencyDetector();
  const renderingPath = path.resolve(__dirname, '../../Classes/rendering');
  
  try {
    // Detect what dependencies the real classes actually need
    console.log('🔍 Scanning real rendering classes for dependencies...');
    const depResult = detector.scanRealClassDependencies(renderingPath);
    
    console.log(`📋 Found ${depResult.dependencies.size} global dependencies:`);
    console.log(`   - Game State: ${depResult.byCategory.gameState.length}`);  
    console.log(`   - p5.js: ${depResult.byCategory.p5js.length}`);
    console.log(`   - Unknown: ${depResult.byCategory.unknown.length}`);
    
    // Show warnings if any
    if (depResult.warnings.length > 0) {
      console.log('⚠️  Dependency warnings:');
      depResult.warnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    // Generate and apply mocks based on real requirements
    const mockConfig = detector.generateMockConfiguration(Array.from(depResult.dependencies));
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
  console.error('❌ CRITICAL ERROR: Could not load real rendering classes!');
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

// Load test files
const testDir = __dirname;
const specFiles = [
  path.join(testDir, 'specs', 'entity_access_spec.js'),
  path.join(testDir, 'specs', 'render_controller_spec.js'),
  path.join(testDir, 'specs', 'entity_renderer_spec.js'),
  path.join(testDir, 'specs', 'performance_spec.js')
];

console.log('Running BDD Rendering Tests...\n');

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