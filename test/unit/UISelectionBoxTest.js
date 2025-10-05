/**
 * UI Selection Box Test Suite
 * Tests for the new UI effects layer selection box functionality
 */

class UISelectionBoxTest {
  constructor() {
    this.testResults = [];
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Run all tests
   */
  runAllTests() {
    console.log('🧪 Starting UI Selection Box Tests...');
    
    this.testControllerInitialization();
    this.testEffectsRendererIntegration();
    this.testSelectionBoxRendering();
    this.testMouseInteraction();
    this.testEntitySelection();
    this.testCallbacks();
    
    this.printResults();
  }

  /**
   * Test controller initialization
   */
  testControllerInitialization() {
    this.test('Controller Initialization', () => {
      // Check if controller exists
      if (typeof g_uiSelectionController === 'undefined' || !g_uiSelectionController) {
        throw new Error('UISelectionController not initialized');
      }

      // Check if controller has required methods
      const requiredMethods = ['startSelectionBox', 'updateSelectionBox', 'endSelectionBox', 'setSelectableEntities'];
      for (const method of requiredMethods) {
        if (typeof g_uiSelectionController[method] !== 'function') {
          throw new Error(`Missing method: ${method}`);
        }
      }

      return true;
    });
  }

  /**
   * Test effects renderer integration
   */
  testEffectsRendererIntegration() {
    this.test('Effects Renderer Integration', () => {
      // Check if EffectsRenderer exists
      if (typeof window.EffectsRenderer === 'undefined' || !window.EffectsRenderer) {
        throw new Error('EffectsRenderer not available');
      }

      // Check if EffectsRenderer has selection box methods
      const requiredMethods = ['startSelectionBox', 'updateSelectionBox', 'endSelectionBox', 'renderSelectionBox'];
      for (const method of requiredMethods) {
        if (typeof window.EffectsRenderer[method] !== 'function') {
          throw new Error(`EffectsRenderer missing method: ${method}`);
        }
      }

      return true;
    });
  }

  /**
   * Test selection box rendering functionality
   */
  testSelectionBoxRendering() {
    this.test('Selection Box Rendering', () => {
      if (!window.EffectsRenderer) throw new Error('EffectsRenderer not available');

      // Start a test selection box
      window.EffectsRenderer.startSelectionBox(100, 100);

      // Check if selection box is active
      if (!window.EffectsRenderer.selectionBox.active) {
        throw new Error('Selection box not activated');
      }

      // Update selection box
      window.EffectsRenderer.updateSelectionBox(200, 200);

      // Get bounds
      const bounds = window.EffectsRenderer.getSelectionBoxBounds();
      if (!bounds || bounds.width !== 100 || bounds.height !== 100) {
        throw new Error('Selection box bounds incorrect');
      }

      // End selection box
      window.EffectsRenderer.endSelectionBox();

      // Check if selection box is deactivated
      if (window.EffectsRenderer.selectionBox.active) {
        throw new Error('Selection box not deactivated');
      }

      return true;
    });
  }

  /**
   * Test mouse interaction system
   */
  testMouseInteraction() {
    this.test('Mouse Interaction', () => {
      if (!g_uiSelectionController) throw new Error('UISelectionController not available');

      // Test configuration
      const originalConfig = { ...g_uiSelectionController.config };
      
      g_uiSelectionController.updateConfig({
        enableSelection: true,
        dragThreshold: 5
      });

      if (!g_uiSelectionController.config.enableSelection) {
        throw new Error('Configuration not applied');
      }

      // Restore original config
      g_uiSelectionController.updateConfig(originalConfig);

      return true;
    });
  }

  /**
   * Test entity selection logic
   */
  testEntitySelection() {
    this.test('Entity Selection', () => {
      if (!g_uiSelectionController) throw new Error('UISelectionController not available');

      // Create mock entities
      const mockEntities = [
        { x: 50, y: 50, width: 20, height: 20, posX: 50, posY: 50, sizeX: 20, sizeY: 20 },
        { x: 100, y: 100, width: 20, height: 20, posX: 100, posY: 100, sizeX: 20, sizeY: 20 }
      ];

      // Set selectable entities
      g_uiSelectionController.setSelectableEntities(mockEntities);

      // Check if entities were set
      const debugInfo = g_uiSelectionController.getDebugInfo();
      if (debugInfo.selectableEntitiesCount !== 2) {
        throw new Error('Entities not set correctly');
      }

      return true;
    });
  }

  /**
   * Test callback system
   */
  testCallbacks() {
    this.test('Callback System', () => {
      if (!g_uiSelectionController) throw new Error('UISelectionController not available');

      let callbackTriggered = false;

      // Set test callback
      g_uiSelectionController.setCallbacks({
        onSelectionStart: () => {
          callbackTriggered = true;
        }
      });

      // Simulate selection start
      g_uiSelectionController.handleMousePressed(100, 100, 0);
      g_uiSelectionController.handleMouseDrag(110, 110, 10, 10);

      if (!callbackTriggered) {
        throw new Error('Callback not triggered');
      }

      // Clean up
      g_uiSelectionController.handleMouseReleased(110, 110, 0);

      return true;
    });
  }

  /**
   * Test integration with existing ant system
   */
  testAntIntegration() {
    this.test('Ant Integration', () => {
      if (typeof ants === 'undefined' || !Array.isArray(ants)) {
        throw new Error('Ants array not available');
      }

      if (typeof updateUISelectionEntities === 'undefined') {
        throw new Error('updateUISelectionEntities function not available');
      }

      // Update selection entities
      updateUISelectionEntities();

      // Check debug info
      const debugInfo = getUISelectionDebugInfo();
      if (!debugInfo || typeof debugInfo.totalAnts !== 'number') {
        throw new Error('Debug info not available');
      }

      return true;
    });
  }

  /**
   * Test helper method
   */
  test(name, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        this.testResults.push({ name, status: 'PASS' });
        this.passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        throw new Error('Test returned false');
      }
    } catch (error) {
      this.testResults.push({ name, status: 'FAIL', error: error.message });
      this.failed++;
      console.log(`❌ ${name}: FAILED - ${error.message}`);
    }
  }

  /**
   * Print test results summary
   */
  printResults() {
    console.log('\n🧪 UI Selection Box Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (this.failed > 0) {
      console.log('\n❌ Failed tests:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }

    return this.failed === 0;
  }
}

/**
 * Manual testing functions for interactive testing
 */

/**
 * Test selection box visually
 */
function testSelectionBoxVisual() {
  console.log('🎯 Starting visual selection box test...');
  console.log('📍 Click and drag to create a selection box');
  console.log('🐜 The selection box should appear on the effects layer');
  console.log('✨ Selection should trigger sparkle effects');
  
  if (typeof setUISelectionEnabled !== 'undefined') {
    setUISelectionEnabled(true);
    console.log('✅ Selection box enabled for testing');
  }
}

/**
 * Test with existing ants
 */
function testSelectionWithAnts() {
  console.log('🐜 Testing selection with current ants...');
  
  if (typeof ants !== 'undefined' && ants.length > 0) {
    console.log(`📊 Found ${ants.length} ants to test with`);
    
    if (typeof updateUISelectionEntities !== 'undefined') {
      updateUISelectionEntities();
      console.log('🔄 Updated selection entities');
    }
    
    console.log('📍 Try selecting ants with click and drag');
  } else {
    console.log('⚠️ No ants found. Spawn some ants first:');
    console.log('  Use: AntUtilities.spawnAnt(mouseX, mouseY)');
  }
}

/**
 * Get detailed debug info
 */
function debugUISelection() {
  console.log('🔍 UI Selection Debug Information:');
  
  if (typeof getUISelectionDebugInfo !== 'undefined') {
    const info = getUISelectionDebugInfo();
    console.log(info);
  } else {
    console.log('❌ Debug function not available');
  }
  
  if (g_uiSelectionController) {
    console.log('🎛️ Controller Status:', g_uiSelectionController.getDebugInfo());
  }
  
  if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer) {
    console.log('🎨 Effects Renderer Selection Box:', window.EffectsRenderer.selectionBox);
  }
}

// Auto-run basic tests when loaded
if (typeof window !== 'undefined') {
  // Export test functions
  window.UISelectionBoxTest = UISelectionBoxTest;
  window.testSelectionBoxVisual = testSelectionBoxVisual;
  window.testSelectionWithAnts = testSelectionWithAnts;
  window.debugUISelection = debugUISelection;
  
  // Run tests after a delay to ensure system is ready
  setTimeout(() => {
    if (g_uiSelectionController) {
      console.log('🧪 Running UI Selection Box Tests...');
      const testSuite = new UISelectionBoxTest();
      testSuite.runAllTests();
      
      if (testSuite.failed === 0) {
        console.log('🎉 All UI Selection Box tests passed!');
        console.log('💡 Try: testSelectionBoxVisual() for interactive testing');
      }
    } else {
      console.log('⚠️ UI Selection Box system not ready - tests skipped');
    }
  }, 2000);
}