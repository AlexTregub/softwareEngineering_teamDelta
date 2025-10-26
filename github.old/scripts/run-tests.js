#!/usr/bin/env node

/**
 * Automated Test Runner for GitHub Actions
 * Runs rendering system tests in Node.js environment without browser
 */

const { JSDOM } = require('jsdom');
const { expect } = require('chai');

// Set up DOM environment for testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Mock p5.js environment
global.createVector = function(x, y) {
  return { 
    x: x, 
    y: y, 
    copy: function() { 
      return createVector(this.x, this.y); 
    } 
  };
};

global.performance = {
  now: function() { return Date.now(); },
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// Load rendering system classes
try {
  // Read and evaluate our JavaScript files
  const fs = require('fs');
  const path = require('path');
  
  const basePath = path.join(__dirname, '../../Classes/rendering');
  
  // Load EntityAccessor
  const entityAccessorPath = path.join(basePath, 'EntityAccessor.js');
  if (fs.existsSync(entityAccessorPath)) {
    const entityAccessorCode = fs.readFileSync(entityAccessorPath, 'utf8');
    eval(entityAccessorCode);
    global.EntityAccessor = EntityAccessor;
    console.log('✅ EntityAccessor loaded successfully');
  }
  
  // Load RenderController  
  const renderControllerPath = path.join(basePath, 'RenderController.js');
  if (fs.existsSync(renderControllerPath)) {
    const renderControllerCode = fs.readFileSync(renderControllerPath, 'utf8');
    eval(renderControllerCode);
    global.RenderController = RenderController;
    console.log('✅ RenderController loaded successfully');
  }
  
  // Load EntityLayerRenderer
  const entityRendererPath = path.join(basePath, 'EntityLayerRenderer.js');
  if (fs.existsSync(entityRendererPath)) {
    const entityRendererCode = fs.readFileSync(entityRendererPath, 'utf8');
    eval(entityRendererCode);
    global.EntityLayerRenderer = EntityLayerRenderer;
    console.log('✅ EntityLayerRenderer loaded successfully');
  }
  
  // Load PerformanceMonitor
  const perfMonitorPath = path.join(basePath, 'PerformanceMonitor.js');
  if (fs.existsSync(perfMonitorPath)) {
    const perfMonitorCode = fs.readFileSync(perfMonitorPath, 'utf8');
    eval(perfMonitorCode);
    global.PerformanceMonitor = PerformanceMonitor;
    console.log('✅ PerformanceMonitor loaded successfully');
  }
  
} catch (error) {
  console.error('❌ Error loading rendering system:', error.message);
  process.exit(1);
}

// Simple test runner
function runTests(testType) {
  console.log(`\n🧪 Running ${testType} tests...\n`);
  
  let passed = 0;
  let failed = 0;
  
  function describe(name, fn) {
    console.log(`📋 ${name}`);
    fn();
  }
  
  function it(name, fn) {
    try {
      fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      failed++;
    }
  }
  
  // Set up global test functions
  global.describe = describe;
  global.it = it;
  global.expect = expect;
  global.beforeEach = function(fn) { fn(); }; // Simple beforeEach
  
  // Run specific test type
  switch (testType) {
    case 'entity_access':
      runEntityAccessTests();
      break;
    case 'render_controller':
      runRenderControllerTests();
      break; 
    case 'entity_renderer':
      runEntityRendererTests();
      break;
    case 'performance':
      runPerformanceTests();
      break;
    default:
      console.log('❌ Unknown test type:', testType);
      process.exit(1);
  }
  
  // Report results
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

function runEntityAccessTests() {
  describe('EntityAccessor', function() {
    it('should access entity position from getPosition method', function() {
      const entity = {
        getPosition: function() { return { x: 100, y: 200 }; }
      };
      const position = EntityAccessor.getPosition(entity);
      expect(position).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should access entity position from position property', function() {
      const entity = { position: { x: 150, y: 250 } };
      const position = EntityAccessor.getPosition(entity);
      expect(position).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should return default position for null entity', function() {
      const position = EntityAccessor.getPosition(null);
      expect(position).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should access entity size from getSize method', function() {
      const entity = {
        getSize: function() { return { x: 32, y: 48 }; }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 32, y: 48 });
    });
    
    it('should convert size to width/height format', function() {
      const entity = {
        getSize: function() { return { x: 32, y: 48 }; }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size.width).to.equal(32);
      expect(size.height).to.equal(48);
    });
  });
}

function runRenderControllerTests() {
  describe('RenderController', function() {
    it('should create RenderController with entity', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 }),
        getSize: () => ({ x: 32, y: 32 })
      };
      const controller = new RenderController(entity);
      expect(controller._entity).to.equal(entity);
    });
    
    it('should delegate position access to EntityAccessor', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 })
      };
      const controller = new RenderController(entity);
      const position = controller.getEntityPosition();
      expect(position).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should manage highlight states', function() {
      const entity = { getPosition: () => ({ x: 0, y: 0 }) };
      const controller = new RenderController(entity);
      controller.setHighlight('SELECTED', 1.5);
      expect(controller._highlightState).to.equal('SELECTED');
      expect(controller._highlightIntensity).to.equal(1.5);
    });
    
    it('should manage visual effects', function() {
      const entity = { getPosition: () => ({ x: 0, y: 0 }) };
      const controller = new RenderController(entity);
      const effectId = controller.addEffect({ type: 'FLOATING_TEXT', text: 'Test' });
      expect(controller._effects).to.have.lengthOf(1);
      expect(effectId).to.be.a('string');
    });
  });
}

function runEntityRendererTests() {
  describe('EntityRenderer', function() {
    it('should create EntityLayerRenderer', function() {
      const renderer = new EntityLayerRenderer();
      expect(renderer.renderGroups).to.be.an('object');
    });
    
    it('should delegate position access to EntityAccessor', function() {
      const renderer = new EntityLayerRenderer();
      const entity = { x: 150, y: 250 };
      const position = renderer.getEntityPosition(entity);
      expect(position).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should delegate size access to EntityAccessor', function() {
      const renderer = new EntityLayerRenderer();
      const entity = { width: 40, height: 60 };
      const size = renderer.getEntitySize(entity);
      expect(size.width).to.equal(40);
      expect(size.height).to.equal(60);
    });
  });
}

function runPerformanceTests() {
  describe('Performance Monitoring', function() {
    it('should create PerformanceMonitor', function() {
      const monitor = new PerformanceMonitor();
      expect(monitor.frameData).to.be.an('object');
    });
    
    it('should track frame timing', function() {
      const monitor = new PerformanceMonitor();
      monitor.startFrame();
      expect(monitor.frameData.currentFrameStart).to.be.a('number');
    });
    
    it('should calculate frame statistics', function() {
      const monitor = new PerformanceMonitor();
      monitor.frameData.frameTime = 16.67; // 60 FPS
      const stats = monitor.getFrameStats();
      expect(stats.fps).to.be.closeTo(60, 1);
    });
  });
}

// Run tests based on command line argument
const testType = process.argv[2] || 'entity_access';
runTests(testType);