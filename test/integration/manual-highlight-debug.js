/**
 * Manual Highlighting Debug Test
 * Simple browser-based debugging without Selenium
 */

// Add this to your browser console to debug highlighting issues
function debugHighlightingSystem() {
  console.log('🔍 HIGHLIGHTING SYSTEM DEBUG');
  console.log('============================\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: RenderController Availability
  console.log('1. Testing RenderController Availability...');
  const renderControllerTest = {
    name: 'RenderController Availability',
    renderControllerDefined: typeof RenderController !== 'undefined',
    renderControllerType: typeof RenderController,
    hasPrototype: typeof RenderController !== 'undefined' && !!RenderController.prototype,
    highlightMethods: typeof RenderController !== 'undefined' ? {
      hasSetHighlight: typeof RenderController.prototype.setHighlight === 'function',
      hasClearHighlight: typeof RenderController.prototype.clearHighlight === 'function',
      hasRenderHighlighting: typeof RenderController.prototype.renderHighlighting === 'function'
    } : null
  };
  results.tests.push(renderControllerTest);
  console.log('   ✅ RenderController defined:', renderControllerTest.renderControllerDefined);
  console.log('   ✅ Highlight methods available:', renderControllerTest.highlightMethods);

  // Test 2: ShareholderDemo Availability
  console.log('\n2. Testing ShareholderDemo Availability...');
  const demoTest = {
    name: 'ShareholderDemo Availability',
    demoFunctionAvailable: typeof window.startShareholderDemo === 'function',
    demoObjectAvailable: typeof window.shareholderDemo !== 'undefined',
    initFunctionAvailable: typeof initializeShareholderDemo === 'function'
  };
  
  if (!demoTest.demoObjectAvailable && demoTest.initFunctionAvailable) {
    console.log('   🔧 Initializing ShareholderDemo...');
    try {
      initializeShareholderDemo();
      demoTest.initializationSuccessful = true;
      demoTest.demoObjectAvailable = typeof window.shareholderDemo !== 'undefined';
    } catch (error) {
      demoTest.initializationError = error.message;
    }
  }
  
  results.tests.push(demoTest);
  console.log('   ✅ Demo function available:', demoTest.demoFunctionAvailable);
  console.log('   ✅ Demo object available:', demoTest.demoObjectAvailable);

  // Test 3: Test Ant Creation and Controller System
  console.log('\n3. Testing Ant Creation and Controllers...');
  let antTest = { name: 'Ant Controller System' };
  
  try {
    if (window.shareholderDemo && !window.shareholderDemo.testAnt) {
      console.log('   🔧 Creating test ant...');
      window.shareholderDemo.spawnTestAnt();
    }
    
    const ant = window.shareholderDemo?.testAnt;
    antTest = {
      name: 'Ant Controller System',
      antCreated: !!ant,
      hasControllers: !!ant?._controllers,
      controllersSize: ant?._controllers?.size || 0,
      controllerKeys: ant?._controllers ? Array.from(ant._controllers.keys()) : [],
      hasRenderController: !!ant?._renderController,
      renderControllerType: typeof ant?._renderController,
      antIsActive: ant?.isActive,
      antPosition: ant?.getPosition ? ant.getPosition() : null
    };
    
    results.tests.push(antTest);
    console.log('   ✅ Ant created:', antTest.antCreated);
    console.log('   ✅ Controllers available:', antTest.controllerKeys);
    console.log('   ✅ Render controller:', antTest.hasRenderController);
    console.log('   ✅ Ant active:', antTest.antIsActive);
    
  } catch (error) {
    antTest.error = error.message;
    results.tests.push(antTest);
    console.log('   ❌ Error creating ant:', error.message);
  }

  // Test 4: P5.js Function Availability
  console.log('\n4. Testing P5.js Function Availability...');
  const p5Test = {
    name: 'P5.js Functions',
    stroke: typeof stroke,
    fill: typeof fill,
    rect: typeof rect,
    strokeWeight: typeof strokeWeight,
    noFill: typeof noFill,
    noStroke: typeof noStroke
  };
  
  const missingP5Functions = Object.entries(p5Test)
    .filter(([key, value]) => key !== 'name' && value !== 'function')
    .map(([key]) => key);
  
  p5Test.allAvailable = missingP5Functions.length === 0;
  p5Test.missingFunctions = missingP5Functions;
  
  results.tests.push(p5Test);
  console.log('   ✅ All P5.js functions available:', p5Test.allAvailable);
  if (!p5Test.allAvailable) {
    console.log('   ❌ Missing functions:', missingP5Functions);
  }

  // Test 5: Direct Highlight Setting
  console.log('\n5. Testing Direct Highlight Setting...');
  let highlightTest = { name: 'Direct Highlighting' };
  
  try {
    const ant = window.shareholderDemo?.testAnt;
    if (ant && ant._renderController) {
      // Test direct RenderController highlighting
      ant._renderController.setHighlight('SELECTED', 1.0);
      
      highlightTest = {
        name: 'Direct Highlighting',
        highlightSet: true,
        highlightState: ant._renderController.getHighlightState(),
        isHighlighted: ant._renderController.isHighlighted(),
        highlightIntensity: ant._renderController.getHighlightIntensity(),
        highlightColor: ant._renderController.getHighlightColor()
      };
      
      console.log('   ✅ Highlight set via RenderController');
      console.log('   📊 State:', highlightTest.highlightState);
      console.log('   📊 Active:', highlightTest.isHighlighted);
      
    } else {
      highlightTest.error = 'No ant or render controller available';
      console.log('   ❌ No ant or render controller available');
    }
    
    results.tests.push(highlightTest);
    
  } catch (error) {
    highlightTest.error = error.message;
    results.tests.push(highlightTest);
    console.log('   ❌ Error setting highlight:', error.message);
  }

  // Test 6: Entity API Highlighting
  console.log('\n6. Testing Entity API Highlighting...');
  let entityApiTest = { name: 'Entity API Highlighting' };
  
  try {
    const ant = window.shareholderDemo?.testAnt;
    if (ant && ant.highlight) {
      // Clear and test Entity API
      ant.highlight.clear();
      ant.highlight.set('HOVER', 0.8);
      
      entityApiTest = {
        name: 'Entity API Highlighting',
        hasHighlightAPI: !!ant.highlight,
        highlightSet: true,
        highlightState: ant._renderController?.getHighlightState(),
        isHighlighted: ant._renderController?.isHighlighted(),
        entityApiWorking: ant._renderController?.getHighlightState() === 'HOVER'
      };
      
      console.log('   ✅ Highlight set via Entity API');
      console.log('   📊 API Working:', entityApiTest.entityApiWorking);
      
    } else {
      entityApiTest.error = 'No ant or highlight API available';
      console.log('   ❌ No ant or highlight API available');
    }
    
    results.tests.push(entityApiTest);
    
  } catch (error) {
    entityApiTest.error = error.message;
    results.tests.push(entityApiTest);
    console.log('   ❌ Error with Entity API:', error.message);
  }

  // Test 7: Render Pipeline Test
  console.log('\n7. Testing Render Pipeline...');
  let renderTest = { name: 'Render Pipeline' };
  
  try {
    const ant = window.shareholderDemo?.testAnt;
    if (ant) {
      // Set highlight and force render
      ant.highlight?.set('SELECTED', 1.0);
      
      console.log('   🔧 Forcing ant render...');
      ant.render();
      
      renderTest = {
        name: 'Render Pipeline',
        renderExecuted: true,
        highlightAfterRender: ant._renderController?.getHighlightState(),
        stillHighlighted: ant._renderController?.isHighlighted()
      };
      
      console.log('   ✅ Render executed');
      console.log('   📊 Highlight after render:', renderTest.highlightAfterRender);
      console.log('   📊 Still highlighted:', renderTest.stillHighlighted);
      
    } else {
      renderTest.error = 'No ant available for render test';
    }
    
    results.tests.push(renderTest);
    
  } catch (error) {
    renderTest.error = error.message;
    results.tests.push(renderTest);
    console.log('   ❌ Render error:', error.message);
  }

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('==========');
  const passedTests = results.tests.filter(test => !test.error && 
    (test.renderControllerDefined || test.demoObjectAvailable || test.antCreated || 
     test.allAvailable || test.highlightSet || test.entityApiWorking || test.renderExecuted)).length;
  const totalTests = results.tests.length;
  
  console.log(`✅ Tests passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success rate: ${(passedTests/totalTests*100).toFixed(1)}%`);
  
  const failedTests = results.tests.filter(test => test.error);
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.error}`);
    });
  }
  
  // Store results globally for inspection
  window.highlightDebugResults = results;
  console.log('\n💾 Results saved to window.highlightDebugResults');
  
  return results;
}

// Integration with global test runner
if (typeof window !== 'undefined') {
  window.debugHighlightingSystem = debugHighlightingSystem;
  
  // Register with global test runner
  if (typeof globalThis !== 'undefined' && typeof globalThis.registerTest === 'function') {
    globalThis.registerTest('Highlighting System Debug', debugHighlightingSystem);
    
    // Check if tests should run automatically
    if (typeof globalThis.shouldRunTests === 'function' && globalThis.shouldRunTests()) {
      // Run automatically after a short delay to ensure everything is loaded
      setTimeout(() => {
        if (typeof window.startShareholderDemo === 'function') {
          if (typeof globalThis.logNormal === 'function') {
            globalThis.logNormal('🔍 Auto-running highlighting system debug...');
          } else if (globalThis.globalDebugVerbosity >= 2) {
            console.log('🔍 Auto-running highlighting system debug...');
          }
          debugHighlightingSystem();
        } else {
          if (typeof globalThis.logQuiet === 'function') {
            globalThis.logQuiet('⏳ ShareholderDemo not ready. Run debugHighlightingSystem() manually.');
          } else if (globalThis.globalDebugVerbosity >= 1) {
            console.log('⏳ ShareholderDemo not ready. Run debugHighlightingSystem() manually.');
          }
        }
      }, 3000);
    } else {
      if (typeof globalThis.logQuiet === 'function') {
        globalThis.logQuiet('🔍 Highlighting System Debug tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
      } else if (globalThis.globalDebugVerbosity >= 1) {
        console.log('🔍 Highlighting System Debug tests available but disabled. Use enableTests() to enable or runTests() to run manually.');
      }
    }
  } else {
    // Fallback behavior when global test runner is not available
    if (typeof globalThis.logQuiet === 'function') {
      globalThis.logQuiet('🔍 Highlighting System Debug available. Run debugHighlightingSystem() manually.');
    } else if (globalThis.globalDebugVerbosity >= 1) {
      console.log('🔍 Highlighting System Debug available. Run debugHighlightingSystem() manually.');
    }
  }
}