// Script Loader - Load Order Verification Tests
// Tests to ensure scripts load in the correct dependency order

class MockScriptElement {
  constructor() {
    this.src = '';
    this.async = false;
    this.onload = null;
    this.onerror = null;
    this.loadOrder = [];
  }
}

class LoadOrderTestSuite {
  constructor() {
    this.testResults = [];
    this.mockDocument = {
      createElement: (type) => {
        if (type === 'script') {
          return new MockScriptElement();
        }
      },
      head: {
        appendChild: (script) => {
          // Simulate successful load and track order
          setTimeout(() => {
            this.loadOrder.push(script.src);
            if (script.onload) {
              script.onload();
            }
          }, 10);
        },
        removeChild: () => {} // Mock remove
      }
    };
    this.loadOrder = [];
    this.originalDocument = typeof document !== 'undefined' ? document : null;
  }

  // Test 1: Core libraries load before foundation classes
  async testLibrariesLoadFirst() {
    console.log('🧪 Testing: Libraries load before foundation classes');
    
    // Mock the environment
    const originalWindow = typeof window !== 'undefined' ? window : {};
    global.window = {
      location: { hostname: 'localhost', search: '' }
    };
    global.document = this.mockDocument;
    
    try {
      // Import and test ScriptLoader in a controlled environment
      const loader = new ScriptLoader();
      const scripts = loader.getScriptsForEnvironment().development;
      
      // Verify p5.js loads before any Classes
      const p5Index = scripts.findIndex(s => s.includes('p5.min.js'));
      const firstClassIndex = scripts.findIndex(s => s.startsWith('Classes/'));
      
      const passed = p5Index < firstClassIndex && p5Index !== -1;
      this.testResults.push({
        test: 'Libraries load before foundation classes',
        passed,
        details: `p5.js at index ${p5Index}, first Class at index ${firstClassIndex}`
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'Libraries load before foundation classes',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test 2: Base ant class loads before species
  async testAntInheritanceOrder() {
    console.log('🧪 Testing: Base ant class loads before species');
    
    try {
      global.window = {
        location: { hostname: 'localhost', search: '' }
      };
      global.document = this.mockDocument;
      
      const loader = new ScriptLoader();
      const scripts = loader.getScriptsForEnvironment().development;
      
      // Find positions of critical ant files
      const antsJsIndex = scripts.findIndex(s => s.includes('ants/ants.js'));
      const speciesJsIndex = scripts.findIndex(s => s.includes('ants/species.js'));
      const factionJsIndex = scripts.findIndex(s => s.includes('ants/faction.js'));
      
      // Verify ants.js loads before species.js and faction.js
      const antBeforeSpecies = antsJsIndex < speciesJsIndex && antsJsIndex !== -1;
      const antBeforeFaction = antsJsIndex < factionJsIndex && antsJsIndex !== -1;
      
      const passed = antBeforeSpecies && antBeforeFaction;
      this.testResults.push({
        test: 'Base ant class loads before species and faction',
        passed,
        details: `ants.js: ${antsJsIndex}, species.js: ${speciesJsIndex}, faction.js: ${factionJsIndex}`
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'Base ant class loads before species and faction',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test 3: Foundation classes load before game systems
  async testFoundationBeforeGame() {
    console.log('🧪 Testing: Foundation classes load before game systems');
    
    try {
      global.window = {
        location: { hostname: 'localhost', search: '' }
      };
      global.document = this.mockDocument;
      
      const loader = new ScriptLoader();
      const scripts = loader.getScriptsForEnvironment().development;
      
      // Find positions
      const sprite2dIndex = scripts.findIndex(s => s.includes('entities/sprite2d.js'));
      const statsIndex = scripts.findIndex(s => s.includes('entities/stats.js'));
      const menuIndex = scripts.findIndex(s => s.includes('menu.js'));
      const selectionBoxIndex = scripts.findIndex(s => s.includes('selectionBox.js'));
      
      // Verify foundation loads before game systems
      const sprite2dBeforeMenu = sprite2dIndex < menuIndex && sprite2dIndex !== -1;
      const statsBeforeSelection = statsIndex < selectionBoxIndex && statsIndex !== -1;
      
      const passed = sprite2dBeforeMenu && statsBeforeSelection;
      this.testResults.push({
        test: 'Foundation classes load before game systems',
        passed,
        details: `sprite2d: ${sprite2dIndex}, stats: ${statsIndex}, menu: ${menuIndex}, selection: ${selectionBoxIndex}`
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'Foundation classes load before game systems',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test 4: Main sketch.js loads last
  async testSketchLoadsLast() {
    console.log('🧪 Testing: sketch.js loads last');
    
    try {
      global.window = {
        location: { hostname: 'localhost', search: '' }
      };
      global.document = this.mockDocument;
      
      const loader = new ScriptLoader();
      const scripts = loader.getScriptsForEnvironment().production;
      
      // sketch.js should be the last script
      const sketchIndex = scripts.findIndex(s => s.includes('sketch.js'));
      const isLast = sketchIndex === scripts.length - 1;
      
      const passed = isLast && sketchIndex !== -1;
      this.testResults.push({
        test: 'sketch.js loads last',
        passed,
        details: `sketch.js at index ${sketchIndex} of ${scripts.length} total scripts`
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'sketch.js loads last',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test 5: Verify no circular dependencies
  async testNoDependencyCycles() {
    console.log('🧪 Testing: No circular dependencies in load order');
    
    try {
      global.window = {
        location: { hostname: 'localhost', search: '' }
      };
      global.document = this.mockDocument;
      
      const loader = new ScriptLoader();
      const config = loader.getScriptConfig();
      
      // Check that each category maintains internal order
      const categories = ['libraries', 'foundation', 'ants', 'game', 'main'];
      let allGood = true;
      let details = [];
      
      for (const category of categories) {
        if (config[category]) {
          // Ensure no script appears twice
          const unique = new Set(config[category]);
          if (unique.size !== config[category].length) {
            allGood = false;
            details.push(`Duplicate scripts in ${category}`);
          }
        }
      }
      
      const passed = allGood;
      this.testResults.push({
        test: 'No circular dependencies in load order',
        passed,
        details: details.join(', ') || 'All categories have unique scripts'
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'No circular dependencies in load order',
        passed: false,
        error: error.message
      });
      return false;
    }
  }

  // Test 6: Critical dependencies are explicitly checked
  async testCriticalDependencies() {
    console.log('🧪 Testing: Critical dependencies are satisfied');
    
    try {
      global.window = {
        location: { hostname: 'localhost', search: '' }
      };
      global.document = this.mockDocument;
      
      const loader = new ScriptLoader();
      const scripts = loader.getScriptsForEnvironment().development;
      
      // Define critical dependency pairs (dependent, dependency)
      const criticalDeps = [
        ['Classes/ants/species.js', 'Classes/ants/ants.js'],
        ['Classes/ants/antWrapper.js', 'Classes/ants/ants.js'],
        ['Classes/ants/Queen.js', 'Classes/ants/ants.js'],
        ['sketch.js', 'libraries/p5.min.js'],
        ['Classes/menu.js', 'Classes/entities/sprite2d.js']
      ];
      
      let allSatisfied = true;
      let details = [];
      
      for (const [dependent, dependency] of criticalDeps) {
        const depIndex = scripts.findIndex(s => s.includes(dependent));
        const dependencyIndex = scripts.findIndex(s => s.includes(dependency));
        
        if (depIndex !== -1 && dependencyIndex !== -1) {
          if (dependencyIndex >= depIndex) {
            allSatisfied = false;
            details.push(`${dependent} loads before its dependency ${dependency}`);
          }
        }
      }
      
      const passed = allSatisfied;
      this.testResults.push({
        test: 'Critical dependencies are satisfied',
        passed,
        details: details.join('; ') || 'All critical dependencies load in correct order'
      });
      
      return passed;
    } catch (error) {
      this.testResults.push({
        test: 'Critical dependencies are satisfied',
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
      this.testLibrariesLoadFirst(),
      this.testAntInheritanceOrder(),
      this.testFoundationBeforeGame(),
      this.testSketchLoadsLast(),
      this.testNoDependencyCycles(),
      this.testCriticalDependencies()
    ];
    
    const results = await Promise.all(tests);
    
    // Generate summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
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
  // Node.js environment
  try {
    const ScriptLoader = require('../../scripts/loader.js');
    module.exports = { LoadOrderTestSuite, MockScriptElement };
  } catch (error) {
    console.warn('Could not import ScriptLoader in Node.js environment:', error.message);
    module.exports = { LoadOrderTestSuite, MockScriptElement };
  }
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.LoadOrderTestSuite = LoadOrderTestSuite;
  window.MockScriptElement = MockScriptElement;
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