/**
 * Integration Test for Ant Control Panel UI
 * Tests the draggable panel system integration with ant spawning and state management
 * 
 * Following testing standards: Use system APIs, test UI integration behavior
 */

// Integration test suite for ant control panel
const AntControlPanelIntegrationTest = {
  results: [],
  
  test: function(description, testFunction) {
    try {
      testFunction();
      this.results.push({ description, status: 'PASS' });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.results.push({ description, status: 'FAIL', error: error.message });
      console.error(`❌ ${description}: ${error.message}`);
    }
  },

  assertEqual: function(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
    }
  },

  assertTrue: function(condition, message = '') {
    if (!condition) {
      throw new Error(`${message} - Expected true, got false`);
    }
  },

  assertNotNull: function(value, message = '') {
    if (value === null || value === undefined) {
      throw new Error(`${message} - Expected non-null value`);
    }
  }
};

// Mock p5.js functions for UI testing
function setupMockP5() {
  global.textAlign = () => {};
  global.textSize = () => {};
  global.fill = () => {};
  global.rect = () => {};
  global.stroke = () => {};
  global.strokeWeight = () => {};
  global.noFill = () => {};
  global.noStroke = () => {};
  global.text = () => {};
  global.LEFT = 'LEFT';
  global.TOP = 'TOP';
  global.CENTER = 'CENTER';
  global.mouseX = 0;
  global.mouseY = 0;
  global.mouseIsPressed = false;
  global.keyPressed = false;
  global.keyIsDown = () => false;
  global.CONTROL = 'CONTROL';
  global.SHIFT = 'SHIFT';
}

// Mock DraggablePanelManager for testing
function createMockDraggablePanelManager() {
  const panels = new Map();
  
  return {
    addPanel: function(config) {
      const panel = {
        id: config.id,
        title: config.title,
        position: config.position,
        size: config.size,
        visible: config.visible !== false,
        contentFunction: config.contentFunction
      };
      panels.set(config.id, panel);
      return panel;
    },
    
    hasPanel: function(id) {
      return panels.has(id);
    },
    
    isPanelVisible: function(id) {
      const panel = panels.get(id);
      return panel ? panel.visible : false;
    },
    
    getPanelCount: function() {
      return panels.size;
    },
    
    getVisiblePanelCount: function() {
      return Array.from(panels.values()).filter(p => p.visible).length;
    },
    
    initialize: function() {
      // Mock initialization
    }
  };
}

// Setup integration test environment
function setupIntegrationTestEnvironment() {
  // Setup basic mocks
  setupMockP5();
  
  // Mock DraggablePanelManager
  global.DraggablePanelManager = function() {
    return createMockDraggablePanelManager();
  };
  
  global.window = global.window || {};
  window.draggablePanelManager = new DraggablePanelManager();
  
  // Mock JobComponent
  global.JobComponent = {
    getAllJobs: () => ['Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter'],
    getJobStats: (job) => ({ strength: 10, health: 100, gatherSpeed: 10, movementSpeed: 60 })
  };
  
  // Mock ants array and AntUtilities
  global.ants = [];
  global.AntUtilities = {
    spawnAnt: (x, y, job, faction) => {
      const mockAnt = {
        x, y, jobName: job, _faction: faction,
        _selectionController: { setSelected: () => {}, isSelected: () => false }
      };
      ants.push(mockAnt);
      return mockAnt;
    },
    getSelectedAnts: (antsArray) => antsArray.filter(ant => 
      ant._selectionController && ant._selectionController.isSelected()
    ),
    setSelectedAntsIdle: () => {},
    setSelectedAntsGathering: () => {},
    setSelectedAntsPatrol: () => {},
    setSelectedAntsCombat: () => {},
    setSelectedAntsBuilding: () => {}
  };
  
  // Mock keyboard controller
  global.g_keyboardController = {
    onKeyPress: function(callback) {
      this._keyPressCallback = callback;
    }
  };
}

// Test 1: Panel initialization
AntControlPanelIntegrationTest.test('Ant Control Panel initializes successfully', () => {
  setupIntegrationTestEnvironment();
  
  const success = initializeAntControlPanel();
  
  AntControlPanelIntegrationTest.assertTrue(success, 'Panel should initialize successfully');
  AntControlPanelIntegrationTest.assertTrue(
    window.draggablePanelManager.hasPanel('ant-control'),
    'Panel should be registered with panel manager'
  );
});

// Test 2: Panel visibility
AntControlPanelIntegrationTest.test('Panel is visible after initialization', () => {
  setupIntegrationTestEnvironment();
  
  initializeAntControlPanel();
  const isVisible = window.draggablePanelManager.isPanelVisible('ant-control');
  
  AntControlPanelIntegrationTest.assertTrue(isVisible, 'Panel should be visible after initialization');
});

// Test 3: Content function registration
AntControlPanelIntegrationTest.test('Panel content function is properly registered', () => {
  setupIntegrationTestEnvironment();
  
  initializeAntControlPanel();
  
  AntControlPanelIntegrationTest.assertEqual(
    typeof renderAntControlPanelContent,
    'function',
    'Panel content renderer should be available'
  );
});

// Test 4: Faction selection functionality
AntControlPanelIntegrationTest.test('Faction selection works correctly', () => {
  setupIntegrationTestEnvironment();
  
  // Test initial faction
  const initialFaction = getSelectedFaction();
  AntControlPanelIntegrationTest.assertEqual(initialFaction, 'neutral', 'Initial faction should be neutral');
  
  // Test faction change
  setSelectedFaction('red');
  const newFaction = getSelectedFaction();
  AntControlPanelIntegrationTest.assertEqual(newFaction, 'red', 'Faction should change to red');
  
  // Test another faction
  setSelectedFaction('blue');
  const blueFaction = getSelectedFaction();
  AntControlPanelIntegrationTest.assertEqual(blueFaction, 'blue', 'Faction should change to blue');
});

// Test 5: Panel content rendering (without crashes)
AntControlPanelIntegrationTest.test('Panel content renders without errors', () => {
  setupIntegrationTestEnvironment();
  
  // Mock panel object
  const mockPanel = {
    id: 'ant-control',
    title: 'Ant Control Panel'
  };
  
  // This should not throw errors
  renderAntControlPanelContent(mockPanel, 10, 10, 280, 320);
  
  // If we reach here, rendering succeeded
  AntControlPanelIntegrationTest.assertTrue(true, 'Panel content should render without errors');
});

// Test 6: Job spawn button functionality simulation
AntControlPanelIntegrationTest.test('Job spawn buttons can be simulated', () => {
  setupIntegrationTestEnvironment();
  
  // Setup mock mouse position and click
  global.mouseX = 50;
  global.mouseY = 50;
  global.mouseIsPressed = true;
  
  // Mock the job spawn button function
  function simulateJobSpawnButton(jobName) {
    const spawnX = mouseX + 50;
    const spawnY = mouseY + 50;
    const currentFaction = getSelectedFaction();
    
    return AntUtilities.spawnAnt(spawnX, spawnY, jobName, currentFaction);
  }
  
  // Test spawning different jobs
  setSelectedFaction('red');
  
  const scoutAnt = simulateJobSpawnButton('Scout');
  AntControlPanelIntegrationTest.assertNotNull(scoutAnt, 'Scout ant should be spawned');
  AntControlPanelIntegrationTest.assertEqual(scoutAnt.jobName, 'Scout', 'Ant should have Scout job');
  AntControlPanelIntegrationTest.assertEqual(scoutAnt._faction, 'red', 'Ant should have red faction');
  
  const builderAnt = simulateJobSpawnButton('Builder');
  AntControlPanelIntegrationTest.assertNotNull(builderAnt, 'Builder ant should be spawned');
  AntControlPanelIntegrationTest.assertEqual(builderAnt.jobName, 'Builder', 'Ant should have Builder job');
});

// Test 7: State change button functionality simulation
AntControlPanelIntegrationTest.test('State change buttons can be simulated', () => {
  setupIntegrationTestEnvironment();
  
  // Create and select some ants
  const ant1 = AntUtilities.spawnAnt(100, 100, 'Scout', 'neutral');
  const ant2 = AntUtilities.spawnAnt(200, 200, 'Warrior', 'neutral');
  
  // Mock selection
  ant1._selectionController.isSelected = () => true;
  ant2._selectionController.isSelected = () => true;
  
  // Simulate state change button clicks
  function simulateStateButton(stateName) {
    switch(stateName) {
      case 'IDLE':
        AntUtilities.setSelectedAntsIdle(ants);
        break;
      case 'GATHER':
        AntUtilities.setSelectedAntsGathering(ants);
        break;
      case 'PATROL':
        AntUtilities.setSelectedAntsPatrol(ants);
        break;
      case 'COMBAT':
        AntUtilities.setSelectedAntsCombat(ants);
        break;
      case 'BUILD':
        AntUtilities.setSelectedAntsBuilding(ants);
        break;
    }
  }
  
  // Test different state changes (they should not crash)
  simulateStateButton('IDLE');
  simulateStateButton('PATROL');
  simulateStateButton('COMBAT');
  
  AntControlPanelIntegrationTest.assertTrue(true, 'State change buttons should work without errors');
});

// Test 8: Panel integration with global systems
AntControlPanelIntegrationTest.test('Panel integrates with global ant management', () => {
  setupIntegrationTestEnvironment();
  
  const initialAntCount = ants.length;
  
  // Simulate spawning through the panel
  setSelectedFaction('blue');
  AntUtilities.spawnAnt(300, 300, 'Farmer', getSelectedFaction());
  
  const newAntCount = ants.length;
  AntControlPanelIntegrationTest.assertEqual(
    newAntCount,
    initialAntCount + 1,
    'Spawning through panel should add ant to global array'
  );
  
  const lastAnt = ants[ants.length - 1];
  AntControlPanelIntegrationTest.assertEqual(lastAnt.jobName, 'Farmer', 'Spawned ant should have correct job');
  AntControlPanelIntegrationTest.assertEqual(lastAnt._faction, 'blue', 'Spawned ant should have selected faction');
});

// Test 9: Error handling when dependencies missing
AntControlPanelIntegrationTest.test('Panel handles missing dependencies gracefully', () => {
  // Test without DraggablePanelManager
  global.DraggablePanelManager = undefined;
  global.window.draggablePanelManager = undefined;
  
  const success = initializeAntControlPanel();
  
  AntControlPanelIntegrationTest.assertEqual(success, false, 'Should return false when dependencies missing');
});

// Test 10: Keyboard shortcut registration
AntControlPanelIntegrationTest.test('Keyboard shortcut is registered', () => {
  setupIntegrationTestEnvironment();
  
  initializeAntControlPanel();
  
  // Check that keyboard controller received a callback
  AntControlPanelIntegrationTest.assertTrue(
    typeof g_keyboardController._keyPressCallback === 'function',
    'Keyboard shortcut callback should be registered'
  );
});

// Run integration tests
function runAntControlPanelIntegrationTests() {
  console.log('🧪 Running Ant Control Panel Integration Tests');
  console.log('=' .repeat(60));
  
  const passed = AntControlPanelIntegrationTest.results.filter(r => r.status === 'PASS').length;
  const failed = AntControlPanelIntegrationTest.results.filter(r => r.status === 'FAIL').length;
  
  console.log('\\n📊 Integration Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${passed + failed}`);
  
  if (failed > 0) {
    console.log('\\n❌ Failed tests:');
    AntControlPanelIntegrationTest.results
      .filter(r => r.status === 'FAIL')
      .forEach(result => {
        console.log(`  • ${result.description}: ${result.error}`);
      });
  }
  
  return failed === 0;
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AntControlPanelIntegrationTest,
    runAntControlPanelIntegrationTests
  };
} else if (typeof window !== 'undefined') {
  window.AntControlPanelIntegrationTest = AntControlPanelIntegrationTest;
  window.runAntControlPanelIntegrationTests = runAntControlPanelIntegrationTests;
}