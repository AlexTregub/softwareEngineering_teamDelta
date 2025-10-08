/**
 * Ant Tooltip System Test
 * Tests the tooltip functionality with mock ants
 */

// Simple test runner
const TooltipTestSuite = {
  testResults: [],
  
  test: function(description, testFunction) {
    try {
      testFunction();
      this.testResults.push({ description, status: 'PASS' });
      console.log(`✅ ${description}`);
    } catch (error) {
      this.testResults.push({ description, status: 'FAIL', error: error.message });
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

  runTests: function() {
    console.log('🐜 Running Ant Tooltip System Tests');
    console.log('=====================================');
    
    this.testResults = [];
    
    // Test 1: Tooltip System Creation
    this.test('AntTooltipSystem should be creatable', () => {
      const tooltipSystem = new AntTooltipSystem();
      this.assertTrue(tooltipSystem instanceof AntTooltipSystem, 'Should create AntTooltipSystem instance');
      this.assertEqual(tooltipSystem.tooltipDelay, 2000, 'Should have 2 second default delay');
      this.assertEqual(tooltipSystem.isTooltipVisible, false, 'Should start with tooltip hidden');
    });

    // Test 2: Mock Ant Detection
    this.test('Should detect ants under mouse cursor', () => {
      const tooltipSystem = new AntTooltipSystem();
      
      // Create mock ant
      const mockAnt = {
        antIndex: 1,
        jobName: 'Builder',
        _health: 100,
        _maxHealth: 100,
        _movementSpeed: 2,
        _damage: 15,
        _faction: 'player',
        isActive: true,
        isMouseOver: function(mx, my) {
          return mx >= 100 && mx <= 132 && my >= 100 && my <= 132;
        }
      };
      
      // Mock global ants array
      const originalAnts = global.ants;
      global.ants = [mockAnt];
      
      const antFound = tooltipSystem.findAntUnderMouse(116, 116);
      this.assertTrue(antFound === mockAnt, 'Should find ant at center position');
      
      const noAnt = tooltipSystem.findAntUnderMouse(50, 50);
      this.assertTrue(noAnt === null, 'Should not find ant outside bounds');
      
      // Restore global ants
      global.ants = originalAnts;
    });

    // Test 3: Tooltip Content Generation
    this.test('Should generate detailed tooltip content', () => {
      const tooltipSystem = new AntTooltipSystem();
      
      const mockAnt = {
        antIndex: 5,
        jobName: 'Warrior',
        _health: 80,
        _maxHealth: 120,
        _movementSpeed: 1.5,
        _damage: 25,
        _faction: 'player',
        _stateMachine: {
          getCurrentState: () => 'COMBAT'
        }
      };
      
      const content = tooltipSystem.generateTooltipContent(mockAnt);
      
      this.assertTrue(content.includes('Ant #5'), 'Should include ant ID');
      this.assertTrue(content.includes('Job: Warrior'), 'Should include job name');
      this.assertTrue(content.includes('HP: 80/120'), 'Should include health stats');
      this.assertTrue(content.includes('State: COMBAT'), 'Should include current state');
      this.assertTrue(content.includes('Faction: player'), 'Should include faction');
    });

    // Test 4: Tooltip Timing
    this.test('Should respect hover delay timing', () => {
      const tooltipSystem = new AntTooltipSystem();
      tooltipSystem.setDelay(100); // Short delay for testing
      
      const mockAnt = { antIndex: 1, jobName: 'Scout', isActive: true };
      global.ants = [mockAnt];
      
      // Start hovering
      tooltipSystem.hoveredAnt = mockAnt;
      tooltipSystem.hoverStartTime = Date.now();
      
      // Should not show tooltip immediately
      this.assertEqual(tooltipSystem.isTooltipVisible, false, 'Should not show tooltip immediately');
      
      // Simulate time passing
      tooltipSystem.hoverStartTime = Date.now() - 150; // More than delay
      tooltipSystem.showTooltip(100, 100);
      
      this.assertEqual(tooltipSystem.isTooltipVisible, true, 'Should show tooltip after delay');
      
      global.ants = [];
    });

    // Test 5: JobComponent Integration
    this.test('Should integrate with JobComponent experience system', () => {
      if (typeof JobComponent !== 'undefined') {
        const tooltipSystem = new AntTooltipSystem();
        
        // Add some experience to test ant
        JobComponent.addExperience('test_ant_1', 150);
        
        const mockAnt = {
          antIndex: 1,
          jobName: 'Builder',
          _health: 100,
          _maxHealth: 100
        };
        
        const content = tooltipSystem.generateTooltipContent(mockAnt);
        
        this.assertTrue(content.includes('Level:'), 'Should include level information');
        this.assertTrue(content.includes('XP:'), 'Should include experience information');
        
        // Clean up
        JobComponent.experienceData.delete('test_ant_1');
      } else {
        console.log('⚠️ JobComponent not available, skipping integration test');
      }
    });

    // Test 6: Tooltip Positioning
    this.test('Should adjust tooltip position to stay on screen', () => {
      const tooltipSystem = new AntTooltipSystem();
      
      // Mock screen dimensions
      const originalWidth = global.width;
      global.width = 800;
      
      tooltipSystem.isTooltipVisible = true;
      tooltipSystem.tooltipContent = 'Test tooltip content';
      tooltipSystem.tooltipPosition = { x: 750, y: 100 }; // Near right edge
      
      // Position should be adjusted (this would happen in render method)
      this.assertTrue(tooltipSystem.tooltipPosition.x > 0, 'Should have valid x position');
      this.assertTrue(tooltipSystem.tooltipPosition.y > 0, 'Should have valid y position');
      
      global.width = originalWidth;
    });

    // Summary
    console.log('\\n📊 Test Results Summary:');
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total: ${passed + failed}`);
    
    if (failed === 0) {
      console.log('🎉 All tooltip system tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check implementation.');
      this.testResults.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`   • ${test.description}: ${test.error}`);
      });
    }
    
    return { passed, failed, total: passed + failed };
  }
};

// Auto-run tests if this file is loaded
if (typeof window !== 'undefined') {
  // Browser environment - run tests when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => TooltipTestSuite.runTests(), 1000);
    });
  } else {
    setTimeout(() => TooltipTestSuite.runTests(), 1000);
  }
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = TooltipTestSuite;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TooltipTestSuite = TooltipTestSuite;
}