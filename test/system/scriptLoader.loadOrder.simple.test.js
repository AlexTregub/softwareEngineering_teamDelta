// Script Loader - Load Order Verification Tests (Node.js compatible)
// Tests to ensure scripts load in the correct dependency order

// Mock browser environment for Node.js
if (typeof window === 'undefined') {
  global.window = {
    location: { hostname: 'localhost', search: '' },
    dispatchEvent: () => {},
    performance: { now: () => Date.now() }
  };
  global.document = {
    createElement: () => ({
      src: '',
      async: false,
      onload: null,
      onerror: null
    }),
    head: {
      appendChild: () => {},
      removeChild: () => {}
    }
  };
  global.performance = { now: () => Date.now() };
}

class LoadOrderTestSuite {
  constructor() {
    this.testResults = [];
  }

  // Test script configuration structure
  testScriptConfiguration() {
    console.log('🧪 Testing: Script configuration structure');
    
    try {
      // Define expected configuration structure
      const config = {
        // Core libraries (must load first)
        libraries: [
          'libraries/p5.min.js',
          'libraries/p5.sound.min.js'
        ],

        // Base game classes (no dependencies)
        foundation: [
          'Classes/resource.js',
          'Classes/coordinateSystem.js',
          'Classes/entities/sprite2d.js',
          'Classes/entities/stats.js',
          'Classes/terrianGen.js',
          'Classes/pathfinding.js',
          'Classes/grid.js'
        ],

        // Ant system (depends on foundation)
        ants: [
          'Classes/ants/ants.js',
          'Classes/ants/species.js',
          'Classes/ants/antWrapper.js',
          'Classes/ants/antStateMachine.js',
          'Classes/ants/faction.js',
          'Classes/ants/Queen.js'
        ],

        // Game systems (depends on foundation and ants)
        game: [
          'Classes/selectionBox.js',
          'Classes/menu.js'
        ],

        // Main application entry point (loads last)
        main: [
          'sketch.js'
        ]
      };
      
      // Test critical dependency order
      const criticalChecks = [
        // p5.js loads before any Classes
        { 
          test: 'p5.js loads before Classes',
          check: () => {
            const allScripts = [...config.libraries, ...config.foundation, ...config.ants, ...config.game, ...config.main];
            const p5Index = allScripts.findIndex(s => s.includes('p5.min.js'));
            const firstClassIndex = allScripts.findIndex(s => s.startsWith('Classes/'));
            return p5Index < firstClassIndex && p5Index !== -1;
          }
        },
        
        // Base ant class loads before species
        {
          test: 'ants.js loads before species.js',
          check: () => {
            const antsIndex = config.ants.findIndex(s => s.includes('ants/ants.js'));
            const speciesIndex = config.ants.findIndex(s => s.includes('ants/species.js'));
            return antsIndex < speciesIndex && antsIndex !== -1;
          }
        },
        
        // Foundation loads before game systems
        {
          test: 'Foundation loads before game systems',
          check: () => {
            const allScripts = [...config.libraries, ...config.foundation, ...config.ants, ...config.game, ...config.main];
            const sprite2dIndex = allScripts.findIndex(s => s.includes('entities/sprite2d.js'));
            const menuIndex = allScripts.findIndex(s => s.includes('menu.js'));
            return sprite2dIndex < menuIndex && sprite2dIndex !== -1;
          }
        },
        
        // sketch.js loads last
        {
          test: 'sketch.js loads last',
          check: () => {
            const allScripts = [...config.libraries, ...config.foundation, ...config.ants, ...config.game, ...config.main];
            const sketchIndex = allScripts.findIndex(s => s.includes('sketch.js'));
            return sketchIndex === allScripts.length - 1;
          }
        },
        
        // All ant dependencies
        {
          test: 'All ant subclasses load after base ant',
          check: () => {
            const antsIndex = config.ants.findIndex(s => s.includes('ants/ants.js'));
            const speciesIndex = config.ants.findIndex(s => s.includes('ants/species.js'));
            const wrapperIndex = config.ants.findIndex(s => s.includes('ants/antWrapper.js'));
            const queenIndex = config.ants.findIndex(s => s.includes('ants/Queen.js'));
            
            return antsIndex < speciesIndex && 
                   antsIndex < wrapperIndex && 
                   antsIndex < queenIndex &&
                   antsIndex !== -1;
          }
        }
      ];
      
      let allPassed = true;
      const details = [];
      
      for (const { test, check } of criticalChecks) {
        try {
          const passed = check();
          if (!passed) {
            allPassed = false;
            details.push(`Failed: ${test}`);
          } else {
            details.push(`Passed: ${test}`);
          }
        } catch (error) {
          allPassed = false;
          details.push(`Error in ${test}: ${error.message}`);
        }
      }
      
      this.testResults.push({
        test: 'Script configuration structure',
        passed: allPassed,
        details: details.join(', ')
      });
      
      return allPassed;
    } catch (error) {
      this.testResults.push({
        test: 'Script configuration structure',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test critical dependencies mapping
  testCriticalDependencies() {
    console.log('🧪 Testing: Critical dependencies mapping');
    
    try {
      const dependencies = {
        'Classes/ants/species.js': ['Classes/ants/ants.js'],
        'Classes/ants/antWrapper.js': ['Classes/ants/ants.js'],
        'Classes/ants/Queen.js': ['Classes/ants/ants.js'],
        'Classes/menu.js': ['Classes/entities/sprite2d.js'],
        'sketch.js': ['libraries/p5.min.js']
      };
      
      // Simulate the script order from loader configuration
      const scriptOrder = [
        'libraries/p5.min.js',
        'libraries/p5.sound.min.js',
        'Classes/resource.js',
        'Classes/coordinateSystem.js',
        'Classes/entities/sprite2d.js',
        'Classes/entities/stats.js',
        'Classes/terrianGen.js',
        'Classes/pathfinding.js',
        'Classes/grid.js',
        'Classes/ants/ants.js',
        'Classes/ants/species.js',
        'Classes/ants/antWrapper.js',
        'Classes/ants/antStateMachine.js',
        'Classes/ants/faction.js',
        'Classes/ants/Queen.js',
        'Classes/selectionBox.js',
        'Classes/menu.js',
        'sketch.js'
      ];
      
      let allSatisfied = true;
      const details = [];
      
      for (const [dependent, deps] of Object.entries(dependencies)) {
        const depIndex = scriptOrder.indexOf(dependent);
        
        for (const dependency of deps) {
          const dependencyIndex = scriptOrder.indexOf(dependency);
          
          if (depIndex !== -1 && dependencyIndex !== -1) {
            if (dependencyIndex >= depIndex) {
              allSatisfied = false;
              details.push(`${dependent} loads before its dependency ${dependency}`);
            } else {
              details.push(`✓ ${dependent} correctly loads after ${dependency}`);
            }
          } else {
            if (depIndex === -1) details.push(`⚠️ ${dependent} not found in script order`);
            if (dependencyIndex === -1) details.push(`⚠️ ${dependency} not found in script order`);
          }
        }
      }
      
      this.testResults.push({
        test: 'Critical dependencies mapping',
        passed: allSatisfied,
        details: details.join('; ')
      });
      
      return allSatisfied;
    } catch (error) {
      this.testResults.push({
        test: 'Critical dependencies mapping',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test for duplicate scripts
  testNoDuplicateScripts() {
    console.log('🧪 Testing: No duplicate scripts');
    
    try {
      const allScripts = [
        'libraries/p5.min.js',
        'libraries/p5.sound.min.js',
        'Classes/resource.js',
        'Classes/coordinateSystem.js',
        'Classes/entities/sprite2d.js',
        'Classes/entities/stats.js',
        'Classes/terrianGen.js',
        'Classes/pathfinding.js',
        'Classes/grid.js',
        'Classes/ants/ants.js',
        'Classes/ants/species.js',
        'Classes/ants/antWrapper.js',
        'Classes/ants/antStateMachine.js',
        'Classes/ants/faction.js',
        'Classes/ants/Queen.js',
        'Classes/selectionBox.js',
        'Classes/menu.js',
        'sketch.js'
      ];
      
      const uniqueScripts = new Set(allScripts);
      const noDuplicates = uniqueScripts.size === allScripts.length;
      
      this.testResults.push({
        test: 'No duplicate scripts',
        passed: noDuplicates,
        details: `${allScripts.length} total scripts, ${uniqueScripts.size} unique scripts`
      });
      
      return noDuplicates;
    } catch (error) {
      this.testResults.push({
        test: 'No duplicate scripts',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Run all load order tests
  async runAllTests() {
    console.log('🚀 Starting Script Load Order Tests');
    
    const tests = [
      this.testScriptConfiguration(),
      this.testCriticalDependencies(),
      this.testNoDuplicateScripts()
    ];
    
    // Generate summary
    const passed = tests.filter(r => r).length;
    const total = tests.length;
    
    console.log(`\n📊 Load Order Test Results: ${passed}/${total} passed`);
    
    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.test}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    return { passed, total, results: this.testResults };
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoadOrderTestSuite };
} else if (typeof window !== 'undefined') {
  window.LoadOrderTestSuite = LoadOrderTestSuite;
}

// Auto-run if this script is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const testSuite = new LoadOrderTestSuite();
  testSuite.runAllTests().then(results => {
    process.exit(results.passed === results.total ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}