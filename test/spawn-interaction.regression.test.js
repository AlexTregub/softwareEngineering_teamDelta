// Spawn and Interaction Regression Test
// Tests that spawning ants doesn't break click and drag functionality

// Mock p5.js functions and globals
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.random = (min, max) => Math.random() * (max - min) + min;
global.Math = global.Math || {};

// Mock game state
let ants = [];
let ant_Index = 0;
let selectedAnt = null;
let width = 800;
let height = 600;
let speciesImages = {};
let devConsoleEnabled = true;

// Mock Species and ant classes for testing
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

class MockSpecies extends MockAnt {
  constructor(baseAnt, speciesName, image) {
    super(baseAnt.posX, baseAnt.posY, baseAnt.sizeX, baseAnt.sizeY);
    this.speciesName = speciesName;
    this.image = image;
    // Copy other properties from baseAnt
    Object.assign(this, baseAnt);
  }
}

class MockAntWrapper {
  constructor(antObject, species) {
    this.antObject = antObject;
    this.species = species;
  }

  update() {
    if (this.antObject && this.antObject.update) {
      this.antObject.update();
    }
  }
}

// Mock functions
function assignSpecies() {
  const species = ['DeLozier', 'Worker', 'Soldier', 'Scout'];
  return species[Math.floor(Math.random() * species.length)];
}

// Import the selection box functions
const selectionBox = require('./selectionBox.mock.js');
const { handleMousePressed, handleMouseDragged, handleMouseReleased } = selectionBox;

// Mock command line spawn function (simplified version)
function mockSpawnCommand(count, type = 'ant', faction = 'neutral') {
  console.log(`🐜 Spawning ${count} ${type}(s) with faction: ${faction}`);
  
  const startingCount = ant_Index;
  
  for (let i = 0; i < count; i++) {
    // Create the base ant
    let sizeR = Math.random() * 15;
    let baseAnt = new MockAnt(
      Math.random() * (width - 50), 
      Math.random() * (height - 50), 
      20 + sizeR, 
      20 + sizeR
    );
    
    let speciesName = assignSpecies();
    
    // Create Species object
    let speciesAnt = new MockSpecies(baseAnt, speciesName, null);
    
    // Create wrapper
    ants[ant_Index] = new MockAntWrapper(speciesAnt, speciesName);
    
    // Set faction if specified
    if (faction !== 'neutral') {
      const antObj = ants[ant_Index].antObject;
      if (antObj) {
        antObj.faction = faction;
      }
    }
    
    ant_Index++;
  }
  
  const actualSpawned = ant_Index - startingCount;
  console.log(`✅ Spawned ${actualSpawned} ants. Total ants: ${ant_Index}`);
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
  for (let i = 0; i < ant_Index; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    antObj.isSelected = false;
  }
  for (let i = 0; i < ant_Index; i++) {
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
    try {
      testFn();
      this.passed++;
      this.tests.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.failed++;
      this.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
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
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    }
    return this.failed === 0;
  }
}

// TEST SUITE
console.log('🧪 Running Spawn and Interaction Regression Test Suite...\n');

const testSuite = new TestSuite('Spawn Interaction Tests');

// Test 1: Basic spawning doesn't break the ants array
testSuite.test('Basic spawning functionality', () => {
  // Reset state
  ants = [];
  ant_Index = 0;
  selectedAnt = null;
  
  // Spawn some ants
  const spawned = mockSpawnCommand(3, 'ant', 'player');
  
  testSuite.assertEqual(spawned, 3, 'Should spawn exactly 3 ants');
  testSuite.assertEqual(ant_Index, 3, 'ant_Index should be updated correctly');
  testSuite.assertEqual(ants.length, 3, 'ants array should have 3 elements');
  
  // Check ant structure
  for (let i = 0; i < ant_Index; i++) {
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
  ant_Index = 0;
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
  ant_Index = 0;
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
  ant_Index = 0;
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
  ant_Index = 0;
  selectedAnt = null;
  mockSpawnCommand(5, 'ant', 'player');
  
  // Position ants randomly but ensure they have valid properties
  for (let i = 0; i < ant_Index; i++) {
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
  ant_Index = 0;
  selectedAnt = null;
  
  // Spawn multiple times
  mockSpawnCommand(2, 'ant', 'red');
  mockSpawnCommand(3, 'ant', 'blue');
  mockSpawnCommand(1, 'ant', 'green');
  
  testSuite.assertEqual(ant_Index, 6, 'Should have 6 total ants');
  
  // Check all ants are valid
  for (let i = 0; i < ant_Index; i++) {
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
  ant_Index = 0;
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
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    testSuite,
    mockSpawnCommand,
    MockAnt,
    MockSpecies,
    MockAntWrapper
  };
}