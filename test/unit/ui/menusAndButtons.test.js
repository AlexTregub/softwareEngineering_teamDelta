/**
 * Consolidated UI Menus & Buttons Tests
 * Generated: 2025-10-29T03:11:41.118Z
 * Source files: 6
 * Total tests: 34
 * 
 * This file contains all ui menus & buttons tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// verticalButtonList.test.js (1 tests)
// ================================================================
/**
 * Basic tests for VerticalButtonList layout and debug metadata.
 */

let { setupVerticalEnvironment } = require('./testHelpers');

// Set up stubs before loading the module
let env = setupVerticalEnvironment({ imgWidth: 64, imgHeight: 32 });
let VerticalButtonList = require('../../Classes/systems/ui/verticalButtonList.js');

describe('VerticalButtonList', function() {
  after(function() {
    env.teardown();
  });

  it('groups configs by y and returns debug arrays', function() {
    const configs = [
      { x:0, y:-50, w:100, h:40, text: 'A' },
      { x:110, y:-50, w:100, h:40, text: 'B' },
      { x:0, y:10, w:200, h:50, text: 'C' }
    ];

    const vb = new VerticalButtonList(400, 300, { spacing: 8, maxWidth: 300, headerImg: null });
    const layout = vb.buildFromConfigs(configs);

    expect(layout.buttons).to.be.an('array');
    expect(layout.debugRects).to.have.lengthOf(3);
    expect(layout.groupRects).to.have.lengthOf(2); // Two rows
    expect(layout.centers).to.have.lengthOf(3);
    expect(layout.header).to.be.null;
  });
});





// ================================================================
// verticalButtonList.header.test.js (2 tests)
// ================================================================
/**
 * Tests VerticalButtonList header sizing and headerTop calculation
 */

// DUPLICATE REQUIRE REMOVED: let { setupVerticalEnvironment } = require('./testHelpers');

// Set up stubs before loading module
let env = setupVerticalEnvironment({ imgWidth: 400, imgHeight: 200 });
// DUPLICATE REQUIRE REMOVED: let VerticalButtonList = require('../../Classes/systems/ui/verticalButtonList.js');

// Create a fake image with width/height
let fakeImg = { width: 400, height: 200 };

describe('VerticalButtonList Header', function() {
  after(function() {
    env.teardown();
  });

  it('header size should respect headerMaxWidth and headerScale', function() {
    const vb = new VerticalButtonList(400, 200, { headerImg: fakeImg, headerScale: 0.5, headerMaxWidth: 150 });
    const layout = vb.buildFromConfigs([]);
    
    expect(layout.header).to.not.be.null;
    expect(layout.header.w).to.equal(150);
    expect(layout.header.h).to.equal(75);
  });

  it('headerTop should position header above groups', function() {
    const configs = [ { x:0,y:0,w:100,h:50,text:'A' } ];
    const vb = new VerticalButtonList(400, 300, { headerImg: fakeImg, headerMaxWidth: 200 });
    const layout = vb.buildFromConfigs(configs);
    
    expect(Number.isFinite(layout.headerTop)).to.be.true;
  });
});





// ================================================================
// selectionbox.all.test.js (10 tests)
// ================================================================
// Minimal browser/p5 shims so SelectionBoxController can load in Node
global.window = global;
global.createVector = function (x, y) {
  return { x: x, y: y, copy: function () { return { x: this.x, y: this.y, copy: this.copy }; } };
};
global.dist = function (x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx*dx + dy*dy); };
// No-op graphics helpers used by draw()
['push','pop','rect','line','stroke','strokeWeight','noFill','fill','textSize','textAlign','text','redraw','noStroke'].forEach(fn => global[fn] = function(){});

// Basic globals used by the controller
global.TILE_SIZE = 16;
global.cameraX = 0;
global.cameraY = 0;

describe('Selection box consolidated tests', function() {
  describe('SelectionBoxController (browser controller)', function() {
    let Controller;
    before(function() {
      // Load the controller IIFE which attaches to window
      // If it has been loaded already by other tests, this is harmless
      try {
        require('../../Classes/controllers/SelectionBoxController.js');
      } catch (err) {
        // If requiring fails, rethrow so tests fail explicitly
        throw err;
      }
      Controller = global.SelectionBoxController;
      if (!Controller) throw new Error('SelectionBoxController not found on global/window');
    });

    it('exposes static helpers isEntityInBox and isEntityUnderMouse', function() {
      const ent = { posX: 10, posY: 10, sizeX: 10, sizeY: 10 };
      expect(Controller.isEntityUnderMouse(ent, 12, 12)).to.be.true;
      expect(Controller.isEntityUnderMouse(ent, 0, 0)).to.be.false;
      expect(Controller.isEntityInBox(ent, 5, 20, 5, 20)).to.be.true;
    });

    it('can be instantiated via getInstance and set/get entities', function() {
      const instA = Controller.getInstance(null, []);
      const instB = Controller.getInstance(null, []);
      expect(instA).to.equal(instB);
      instA.setEntities([{ posX:0,posY:0,sizeX:4,sizeY:4 }]);
      expect(instA.getEntities()).to.be.an('array').with.lengthOf(1);
    });

    it('supports enable/disable and config update/get', function() {
      const ctrl = Controller.getInstance();
      ctrl.setEnabled(false);
      expect(ctrl.isEnabled()).to.be.false;
      ctrl.setEnabled(true);
      expect(ctrl.isEnabled()).to.be.true;
      const orig = ctrl.getConfig();
      ctrl.updateConfig({ dragThreshold: 999 });
      expect(ctrl.getConfig().dragThreshold).to.equal(999);
      // restore
      ctrl.updateConfig(orig);
    });

    it('selects a single entity on click and reports via getSelectedEntities', function() {
      const e1 = { posX: 10, posY: 10, sizeX: 10, sizeY: 10, isSelected: false };
      const e2 = { posX: 100, posY: 100, sizeX: 10, sizeY: 10, isSelected: false };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([e1, e2]);
  // Ensure nothing selected
  ctrl.deselectAll();
      ctrl.handleClick(12, 12, 'left');
      const sel = ctrl.getSelectedEntities();
      expect(sel).to.be.an('array').with.lengthOf(1);
      expect(sel[0]).to.equal(e1);
      expect(e1.isSelected).to.be.true;
      // deselect
      ctrl.deselectAll();
      expect(ctrl.getSelectedEntities()).to.have.lengthOf(0);
    });

    it('performs box selection via click+drag+release respecting dragThreshold', function() {
      const a = { posX: 50, posY: 50, sizeX: 10, sizeY: 10, isSelected:false, isBoxHovered:false };
      const b = { posX: 200, posY: 200, sizeX: 10, sizeY: 10, isSelected:false, isBoxHovered:false };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([a, b]);
  // start selection by clicking empty space
  ctrl.deselectAll();
      ctrl.handleClick(0, 0, 'left');
      // drag to include 'a'
      ctrl.handleDrag(60, 60);
      // release to finalize
      ctrl.handleRelease(60, 60, 'left');
      const sel = ctrl.getSelectedEntities();
      expect(sel).to.be.an('array');
      expect(sel.some(e => e === a)).to.be.true;
      // ensure b is not selected
      expect(sel.some(e => e === b)).to.be.false;
      // cleanup
      ctrl.deselectAll();
    });

    it('invokes onSelectionEnd callback when setCallbacks provided', function(done) {
      const ent = { posX: 5, posY: 5, sizeX: 2, sizeY: 2 };
  const ctrl = Controller.getInstance();
  // Ensure controller uses our entities for this test
  ctrl.setEntities([ent]);
  ctrl.deselectAll();
      ctrl.setCallbacks({ onSelectionEnd: function(bounds, selected) { try { expect(bounds).to.be.an('object'); expect(selected).to.be.an('array'); done(); } catch (err) { done(err); } } });
      ctrl.handleClick(0,0,'left');
      ctrl.handleDrag(10,10);
      ctrl.handleRelease(10,10,'left');
    });
  });

  describe('selectionBox.mock.js (node test mock)', function() {
    const path = require('path');
    const mock = require(path.resolve(__dirname, 'selectionBox.mock.js'));

    it('exports expected functions', function() {
      expect(mock).to.have.property('handleMousePressed');
      expect(mock).to.have.property('handleMouseDragged');
      expect(mock).to.have.property('handleMouseReleased');
      expect(mock).to.have.property('isEntityInBox');
      expect(mock).to.have.property('isEntityUnderMouse');
      expect(mock).to.have.property('deselectAllEntities');
    });

    it('handleMousePressed selects entity when clicking over it', function() {
      const ent = { _sprite: { pos: { x: 10, y: 10 }, size: { x: 10, y: 10 } } };
      let called = false;
      mock.handleMousePressed([ent], 12, 12, function(){ called = true; }, null, null, 16, 0);
      expect(called).to.be.true;
    });

    it('start selection when clicking empty space and exposes global selection state', function() {
      // ensure global cleared
      if (global.isSelecting) { global.isSelecting = false; }
      mock.handleMousePressed([], 0, 0, null, null, null, 16, 0);
      expect(global.isSelecting).to.be.true;
      // simulate drag
      mock.handleMouseDragged(5, 5, []);
      expect(global.selectionEnd).to.exist;
      // release
      mock.handleMouseReleased([], null, null, 16);
      expect(global.isSelecting).to.be.false;
    });

    it('tentative move created on press and cancelled on drag', function() {
      const sel = { moveCommands: [] };
      // start press with selectedEntity to create tentative move
      mock.handleMousePressed([], 10, 10, null, sel, function(x,y,t,e){ if (e) e.moveCommands.push({x,y}); }, 16, 0);
      // ensure tentative exists
      expect(sel.moveCommands.length).to.be.at.least(1);
      // drag should cancel tentative
      mock.handleMouseDragged(20, 20, []);
      expect(sel.moveCommands.length).to.equal(0);
    });
  });
});




// ================================================================
// spawn-interaction.regression.test.js (0 tests)
// ================================================================
// Spawn and Interaction Regression Test
// Tests that spawning ants doesn't break click and drag functionality

// Mock p5.js functions and globals
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.random = (min, max) => Math.random() * (max - min) + min;
global.Math = global.Math || {};

// Mock game state
let ants = [];
let antIndex = 0;
let selectedAnt = null;
let width = 800;
let height = 600;
let JobImages = {};
let devConsoleEnabled = true;

// Mock Job and ant classes for testing
class MockAnt {
  constructor(posX = 0, posY = 0, sizeX = 32, sizeY = 32) {
    this.posX = posX;
    this.posY = posY;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.isSelected = false;
    this.isBoxHovered = false;
    this.faction = 'neutral';
    this._sprite = {
      pos: { x: posX, y: posY },
      size: { x: sizeX, y: sizeY }
    };
  }

  isMouseOver(mx, my) {
    return (
      mx >= this.posX &&
      mx <= this.posX + this.sizeX &&
      my >= this.posY &&
      my <= this.posY + this.sizeY
    );
  }

  getPosition() {
    return { x: this.posX, y: this.posY };
  }

  getSize() {
    return { x: this.sizeX, y: this.sizeY };
  }

  moveToLocation(x, y) {
    this.posX = x;
    this.posY = y;
    this._sprite.pos.x = x;
    this._sprite.pos.y = y;
  }

  update() {
    // Mock update
  }
}

class MockJob extends MockAnt {
  constructor(baseAnt, JobName, image) {
    super(baseAnt.posX, baseAnt.posY, baseAnt.sizeX, baseAnt.sizeY);
    this.JobName = JobName;
    this.image = image;
    // Copy other properties from baseAnt
    Object.assign(this, baseAnt);
  }
}

class MockAntWrapper {
  constructor(antObject, Job) {
    this.antObject = antObject;
    this.Job = Job;
  }

  update() {
    if (this.antObject && this.antObject.update) {
      this.antObject.update();
    }
  }
}

// Mock functions
function assignJob() {
  const Job = ['DeLozier', 'Worker', 'Soldier', 'Scout'];
  return Job[Math.floor(Math.random() * Job.length)];
}

// Import the selection box functions
let selectionBox = require('./selectionBox.mock.js');
let { handleMousePressed, handleMouseDragged, handleMouseReleased } = selectionBox;

// Mock command line spawn function (simplified version)
function mockSpawnCommand(count, type = 'ant', faction = 'neutral') {
  console.log(`🐜 Spawning ${count} ${type}(s) with faction: ${faction}`);
  
  const startingCount = antIndex;
  
  for (let i = 0; i < count; i++) {
    // Create the base ant
    let sizeR = Math.random() * 15;
    let baseAnt = new MockAnt(
      Math.random() * (width - 50), 
      Math.random() * (height - 50), 
      20 + sizeR, 
      20 + sizeR
    );
    
    let JobName = assignJob();
    
    // Create Job object
    let JobAnt = new MockJob(baseAnt, JobName, null);
    
    // Create wrapper
    ants[antIndex] = new MockAntWrapper(JobAnt, JobName);
    
    // Set faction if specified
    if (faction !== 'neutral') {
      const antObj = ants[antIndex].antObject;
      if (antObj) {
        antObj.faction = faction;
      }
    }
    
    antIndex++;
  }
  
  const actualSpawned = antIndex - startingCount;
  console.log(`✅ Spawned ${actualSpawned} ants. Total ants: ${antIndex}`);
  return actualSpawned;
}

// Mock AntClickControl function
function AntClickControl() {
  // Move selected ant if one is already selected
  if (selectedAnt) {
    selectedAnt.moveToLocation(mockMouseX, mockMouseY);
    selectedAnt.isSelected = false;
    selectedAnt = null;
    return;
  }

  // Otherwise, select the ant under the mouse
  selectedAnt = null;
  for (let i = 0; i < antIndex; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    antObj.isSelected = false;
  }
  for (let i = 0; i < antIndex; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    if (antObj.isMouseOver(mockMouseX, mockMouseY)) {
      antObj.isSelected = true;
      selectedAnt = antObj;
      break;
    }
  }
}

// Mock mouse coordinates
let mockMouseX = 100;
let mockMouseY = 100;

// Simple test framework
class TestSuite {
  constructor(name) {
    this.name = name;
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  test(name, testFn) {
    const verbose = !!process.env.TEST_VERBOSE;
    try {
      testFn();
      this.passed++;
      this.tests.push({ name, status: 'PASS' });
      if (verbose) console.log(`✅ ${name}`);
    } catch (error) {
      this.failed++;
      this.tests.push({ name, status: 'FAIL', error: error.message });
      if (verbose) console.log(`❌ ${name}: ${error.message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  assertFalse(condition, message) {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  }

  summary() {
    const total = this.passed + this.failed;
    console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed > 0) {
      console.log('\nFailures:');
      for (const t of this.tests) {
        if (t.status === 'FAIL') {
          console.log(` - ${t.name}: ${t.error}`);
        }
      }
      return false;
    }
    return true;
  }
}

// TEST SUITE
console.log('🧪 Running Spawn and Interaction Regression Test Suite...\n');

let testSuite = new TestSuite('Spawn Interaction Tests');

// Test 1: Basic spawning doesn't break the ants array
testSuite.test('Basic spawning functionality', () => {
  // Reset state
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  
  // Spawn some ants
  const spawned = mockSpawnCommand(3, 'ant', 'player');
  
  testSuite.assertEqual(spawned, 3, 'Should spawn exactly 3 ants');
  testSuite.assertEqual(antIndex, 3, 'antIndex should be updated correctly');
  testSuite.assertEqual(ants.length, 3, 'ants array should have 3 elements');
  
  // Check ant structure
  for (let i = 0; i < antIndex; i++) {
    testSuite.assertTrue(ants[i] !== null, `Ant ${i} should not be null`);
    testSuite.assertTrue(ants[i] !== undefined, `Ant ${i} should not be undefined`);
    testSuite.assertTrue(ants[i].antObject !== null, `Ant ${i} antObject should not be null`);
    testSuite.assertTrue(ants[i].antObject !== undefined, `Ant ${i} antObject should not be undefined`);
  }
});

// Test 2: Mouse over detection works after spawning
testSuite.test('Mouse over detection after spawning', () => {
  // Reset and spawn
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  mockSpawnCommand(1, 'ant', 'player');
  
  // Position ant at a known location
  const ant = ants[0].antObject;
  ant.posX = 100;
  ant.posY = 100;
  ant.sizeX = 32;
  ant.sizeY = 32;
  ant._sprite.pos.x = 100;
  ant._sprite.pos.y = 100;
  ant._sprite.size.x = 32;
  ant._sprite.size.y = 32;
  
  // Test mouse over detection
  testSuite.assertTrue(ant.isMouseOver(116, 116), 'Should detect mouse over ant center');
  testSuite.assertFalse(ant.isMouseOver(50, 50), 'Should not detect mouse outside ant bounds');
});

// Test 3: Single ant selection works after spawning
testSuite.test('Single ant selection after spawning', () => {
  // Reset and spawn
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  mockSpawnCommand(2, 'ant', 'player');
  
  // Position ants at known locations
  ants[0].antObject.posX = 100;
  ants[0].antObject.posY = 100;
  ants[1].antObject.posX = 200;
  ants[1].antObject.posY = 200;
  
  // Simulate clicking on first ant
  mockMouseX = 116;
  mockMouseY = 116;
  AntClickControl();
  
  testSuite.assertTrue(ants[0].antObject.isSelected, 'First ant should be selected');
  testSuite.assertFalse(ants[1].antObject.isSelected, 'Second ant should not be selected');
  testSuite.assertEqual(selectedAnt, ants[0].antObject, 'selectedAnt should point to first ant');
});

// Test 4: Box selection works after spawning
testSuite.test('Box selection after spawning', () => {
  // Reset and spawn
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  mockSpawnCommand(3, 'ant', 'player');
  
  // Position ants
  ants[0].antObject.posX = 100;
  ants[0].antObject.posY = 100;
  ants[1].antObject.posX = 150;
  ants[1].antObject.posY = 150;
  ants[2].antObject.posX = 300;
  ants[2].antObject.posY = 300;
  
  // Update sprite positions to match
  for (let i = 0; i < 3; i++) {
    ants[i].antObject._sprite.pos.x = ants[i].antObject.posX;
    ants[i].antObject._sprite.pos.y = ants[i].antObject.posY;
  }
  
  // Simulate box selection
  handleMousePressed(ants, 90, 90, () => {}, null, () => {}, 32, 'LEFT');
  handleMouseDragged(180, 180, ants);
  handleMouseReleased(ants, null, () => {}, 32);
  
  testSuite.assertTrue(ants[0].antObject.isSelected, 'First ant should be selected by box');
  testSuite.assertTrue(ants[1].antObject.isSelected, 'Second ant should be selected by box');
  testSuite.assertFalse(ants[2].antObject.isSelected, 'Third ant should not be selected by box');
});

// Test 5: Click and drag sequence doesn't cause errors
testSuite.test('Click and drag sequence after spawning', () => {
  // Reset and spawn
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  mockSpawnCommand(5, 'ant', 'player');
  
  // Position ants randomly but ensure they have valid properties
  for (let i = 0; i < antIndex; i++) {
    const ant = ants[i].antObject;
    ant.posX = Math.random() * 400 + 50;
    ant.posY = Math.random() * 400 + 50;
    ant._sprite.pos.x = ant.posX;
    ant._sprite.pos.y = ant.posY;
    ant._sprite.size.x = ant.sizeX;
    ant._sprite.size.y = ant.sizeY;
  }
  
  // Test multiple interactions without errors
  let errorCount = 0;
  
  try {
    // Simulate mouse press
    handleMousePressed(ants, 200, 200, AntClickControl, selectedAnt, () => {}, 32, 'LEFT');
    
    // Simulate drag
    handleMouseDragged(250, 250, ants);
    
    // Simulate release
    handleMouseReleased(ants, selectedAnt, () => {}, 32);
    
    // Simulate another interaction
    handleMousePressed(ants, 100, 100, AntClickControl, selectedAnt, () => {}, 32, 'LEFT');
    handleMouseReleased(ants, selectedAnt, () => {}, 32);
    
  } catch (error) {
    errorCount++;
    console.error('Error during interaction:', error);
  }
  
  testSuite.assertEqual(errorCount, 0, 'No errors should occur during click and drag sequence');
});

// Test 6: Multiple spawn cycles don't break interactions
testSuite.test('Multiple spawn cycles', () => {
  // Reset
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  
  // Spawn multiple times
  mockSpawnCommand(2, 'ant', 'red');
  mockSpawnCommand(3, 'ant', 'blue');
  mockSpawnCommand(1, 'ant', 'green');
  
  testSuite.assertEqual(antIndex, 6, 'Should have 6 total ants');
  
  // Check all ants are valid
  for (let i = 0; i < antIndex; i++) {
    const wrapper = ants[i];
    testSuite.assertTrue(wrapper !== null, `Wrapper ${i} should not be null`);
    testSuite.assertTrue(wrapper.antObject !== null, `AntObject ${i} should not be null`);
    testSuite.assertTrue(typeof wrapper.antObject.isMouseOver === 'function', `AntObject ${i} should have isMouseOver method`);
  }
  
  // Test interaction still works
  let interactionError = false;
  try {
    handleMousePressed(ants, 150, 150, AntClickControl, selectedAnt, () => {}, 32, 'LEFT');
  } catch (error) {
    interactionError = true;
  }
  
  testSuite.assertFalse(interactionError, 'Interaction should work after multiple spawn cycles');
});

// Test 7: Spawning with different factions doesn't break selection
testSuite.test('Faction-based spawning and selection', () => {
  // Reset
  ants = [];
  antIndex = 0;
  selectedAnt = null;
  
  // Spawn ants with different factions
  mockSpawnCommand(2, 'ant', 'team1');
  mockSpawnCommand(2, 'ant', 'team2');
  
  // Check faction assignment
  testSuite.assertEqual(ants[0].antObject.faction, 'team1', 'First ant should have team1 faction');
  testSuite.assertEqual(ants[2].antObject.faction, 'team2', 'Third ant should have team2 faction');
  
  // Test selection works with factions
  ants[0].antObject.posX = 100;
  ants[0].antObject.posY = 100;
  
  mockMouseX = 116;
  mockMouseY = 116;
  AntClickControl();
  
  testSuite.assertTrue(ants[0].antObject.isSelected, 'Factioned ant should be selectable');
});

// Run the tests
testSuite.summary();

console.log('\n🔍 Regression Test Analysis:');
console.log('- Tested basic spawning functionality');
console.log('- Verified mouse over detection works after spawning');
console.log('- Confirmed single and box selection work with spawned ants');
console.log('- Ensured click and drag sequences don\'t cause errors');
console.log('- Validated multiple spawn cycles maintain functionality');
console.log('- Checked faction-based spawning doesn\'t break selection');

// Export for use in main test suite
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testSuite,
    mockSpawnCommand,
    MockAnt,
    MockJob,
    MockAntWrapper
  };
}



// ================================================================
// BrushSizeMenuModule.test.js (11 tests)
// ================================================================
/**
 * Unit Tests: BrushSizeMenuModule
 * 
 * Tests for brush size menu module component that integrates with MenuBar.
 * Tests component initialization, size selection, rendering, and event emission.
 */

let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../../helpers/uiTestHelpers');

describe('BrushSizeMenuModule', function() {
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Load the BrushSizeMenuModule class
    // This will fail initially since the class doesn't exist yet
    try {
      const BrushSizeMenuModule = require('../../../../Classes/ui/menuBar/BrushSizeMenuModule');
      global.BrushSizeMenuModule = BrushSizeMenuModule;
    } catch (e) {
      // Expected to fail - class doesn't exist yet
      global.BrushSizeMenuModule = undefined;
    }
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Initialization', function() {
    it('should initialize with default size of 1', function() {
      expect(global.BrushSizeMenuModule).to.not.be.undefined;
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      expect(module.getSize()).to.equal(1);
    });
    
    it('should accept custom initial size within valid range', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0,
        initialSize: 5
      });
      
      expect(module.getSize()).to.equal(5);
    });
  });
  
  describe('Size Range Validation', function() {
    it('should accept sizes 1-99', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      // Test boundary values
      module.setSize(1);
      expect(module.getSize()).to.equal(1);
      
      module.setSize(50);
      expect(module.getSize()).to.equal(50);
      
      module.setSize(99);
      expect(module.getSize()).to.equal(99);
    });
    
    it('should clamp size below 1 to 1', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      module.setSize(0);
      expect(module.getSize()).to.equal(1);
      
      module.setSize(-5);
      expect(module.getSize()).to.equal(1);
    });
    
    it('should clamp size above 99 to 99', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      module.setSize(100);
      expect(module.getSize()).to.equal(99);
      
      module.setSize(200);
      expect(module.getSize()).to.equal(99);
    });
  });
  
  describe('Rendering', function() {
    it('should render size display when visible', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5
      });
      
      // Make visible
      module.visible = true;
      
      // Render should be called
      module.render();
      
      // Verify text() was called for size display
      expect(global.text.called).to.be.true;
      expect(global.text.calledWith(5)).to.be.true;
    });
    
    it('should render +/- buttons', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5
      });
      
      module.visible = true;
      module.render();
      
      // Verify rect() was called for buttons (should be called at least twice)
      expect(global.rect.callCount).to.be.at.least(2);
      
      // Verify '+' and '-' text rendered
      expect(global.text.calledWith('-')).to.be.true;
      expect(global.text.calledWith('+')).to.be.true;
    });
  });
  
  describe('Event Emission', function() {
    it('should emit brushSizeChanged event on size selection', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        onSizeChange: onSizeChange
      });
      
      module.setSize(7);
      
      expect(onSizeChange.calledOnce).to.be.true;
      expect(onSizeChange.calledWith(7)).to.be.true;
    });
    
    it('should not emit event if size unchanged', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 3,
        onSizeChange: onSizeChange
      });
      
      onSizeChange.resetHistory();
      
      module.setSize(3); // Same size
      
      expect(onSizeChange.called).to.be.false;
    });
  });
  
  describe('Click Handling', function() {
    it('should handle click on increase button', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5,
        onSizeChange: onSizeChange
      });
      
      module.visible = true;
      
      // Use increase method (button functionality)
      module.increase();
      
      expect(onSizeChange.called).to.be.true;
      expect(module.getSize()).to.equal(6);
    });
    
    it('should handle click on decrease button', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5,
        onSizeChange: onSizeChange
      });
      
      module.visible = true;
      
      // Use decrease method (button functionality)
      module.decrease();
      
      expect(onSizeChange.called).to.be.true;
      expect(module.getSize()).to.equal(4);
    });
  });
});




// ================================================================
// fileMenuBarInteraction.test.js (10 tests)
// ================================================================
/**
 * Unit Tests: FileMenuBar Interaction (Bug Fix #3)
 * 
 * Tests for proper menu bar click handling when dropdown is open
 * 
 * TDD: Write tests FIRST, then fix the bug
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../../helpers/uiTestHelpers');

// Load FileMenuBar
let FileMenuBar = require('../../../../Classes/ui/FileMenuBar.js');

describe('FileMenuBar - Interaction Bug Fix', function() {
  let menuBar;
  
  beforeEach(function() {
    setupUITestEnvironment();
    menuBar = new FileMenuBar({ x: 0, y: 0, height: 40 });
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Menu Bar Clickability When Dropdown Open', function() {
    it('should handle clicks on menu bar even when dropdown is open', function() {
      // Force calculation of menu positions (normally done on first render)
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      expect(menuBar.openMenuName).to.equal('File');
      
      // Click on Edit menu (should switch to Edit dropdown)
      // File: x=10, width=52 (4*8+20), ends at 62
      // Edit: starts at x=62
      const editX = 70; // Inside Edit menu bounds
      const barY = 20; // Middle of menu bar
      
      const handled = menuBar.handleClick(editX, barY);
      
      expect(handled).to.be.true;
      expect(menuBar.openMenuName).to.equal('Edit'); // Should switch to Edit
    });
    
    it('should handle clicks on dropdown items when dropdown is open', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      
      // Mock action for first item (New)
      const newAction = sinon.spy();
      menuBar.menuItems[0].items[0].action = newAction;
      
      // Click on first dropdown item (New)
      const itemX = 10; // Left edge of dropdown
      const itemY = 50; // First item in dropdown
      
      const handled = menuBar.handleClick(itemX, itemY);
      
      expect(handled).to.be.true;
      expect(newAction.called).to.be.true;
      expect(menuBar.openMenuName).to.be.null; // Menu should close after action
    });
    
    it('should close dropdown when clicking outside menu area', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      expect(menuBar.openMenuName).to.equal('File');
      
      // Click outside menu bar (on canvas)
      const canvasX = 400;
      const canvasY = 300;
      
      const handled = menuBar.handleClick(canvasX, canvasY);
      
      expect(handled).to.be.true; // Click consumed by closing menu
      expect(menuBar.openMenuName).to.be.null; // Menu should close
    });
    
    it('should remain clickable after opening and closing dropdown', function() {
      // Force calculation of menu positions
      menuBar._calculateMenuPositions();
      
      // Open File menu
      menuBar.openMenu('File');
      
      // Close menu
      menuBar.closeMenu();
      
      // Click on Edit menu (should work normally)
      const editX = 70; // Inside Edit menu bounds
      const barY = 20;
      
      const handled = menuBar.handleClick(editX, barY);
      
      expect(handled).to.be.true;
      expect(menuBar.openMenuName).to.equal('Edit');
    });
  });
  
  describe('Input Consumption Priority', function() {
    it('should return true when handling menu bar clicks', function() {
      const barX = 10;
      const barY = 20;
      
      const handled = menuBar.handleClick(barX, barY);
      
      expect(handled).to.be.true; // Consumed
    });
    
    it('should return true when handling dropdown clicks', function() {
      menuBar.openMenu('File');
      
      const itemX = 10;
      const itemY = 50;
      
      const handled = menuBar.handleClick(itemX, itemY);
      
      expect(handled).to.be.true; // Consumed
    });
    
    it('should return true when closing menu via outside click', function() {
      menuBar.openMenu('File');
      
      const outsideX = 400;
      const outsideY = 300;
      
      const handled = menuBar.handleClick(outsideX, outsideY);
      
      expect(handled).to.be.true; // Consumed (closing menu)
    });
    
    it('should return false when click is not on menu bar and menu is closed', function() {
      const outsideX = 400;
      const outsideY = 300;
      
      const handled = menuBar.handleClick(outsideX, outsideY);
      
      expect(handled).to.be.false; // Not consumed
    });
  });
  
  describe('Menu State Notifications', function() {
    it('should notify LevelEditor when menu opens', function() {
      const mockLevelEditor = {
        setMenuOpen: sinon.spy()
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.openMenu('File');
      
      expect(mockLevelEditor.setMenuOpen.calledWith(true)).to.be.true;
    });
    
    it('should notify LevelEditor when menu closes', function() {
      const mockLevelEditor = {
        setMenuOpen: sinon.spy()
      };
      
      menuBar.setLevelEditor(mockLevelEditor);
      menuBar.openMenu('File');
      menuBar.closeMenu();
      
      expect(mockLevelEditor.setMenuOpen.calledWith(false)).to.be.true;
    });
  });
});

