/**
 * Example E2E Test using Gherkin-Style Helpers
 * 
 * This demonstrates how to write readable, behavior-driven tests using
 * the new Gherkin-style syntax from userFlowHelpers.js
 * 
 * Compare this to traditional E2E tests - much more readable!
 */

const { launchBrowser, saveScreenshot } = require('../puppeteer_helper');
const { given, when, and, then } = require('./userFlowHelpers');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Starting Gherkin-style E2E test...\n');
    
    // Navigate to app
    await page.goto('http://localhost:8000?test=1');
    
    // ========================================================================
    // TEST 1: Entity Placement and Verification (Gherkin-style)
    // ========================================================================
    console.log('Test 1: Entity Placement');
    console.log('  Given: Level Editor is open');
    await given.levelEditorIsOpen(page);
    
    console.log('  When: User opens entity palette');
    await when.userOpensEntityPalette(page);
    
    console.log('  And: User clicks first entity template');
    await and.userClicksEntityTemplate(page, 0);
    
    console.log('  And: User places entity at grid (10, 10)');
    await and.userPlacesEntityAtGrid(page, 10, 10);
    
    console.log('  Then: Entity should exist at grid (10, 10)');
    await then.entityShouldExistAtGrid(page, 10, 10);
    
    await saveScreenshot(page, 'examples/gherkin_entity_placed', true);
    console.log('  ✅ Test 1 passed!\n');
    
    // ========================================================================
    // TEST 2: Entity Erasure (Gherkin-style)
    // ========================================================================
    console.log('Test 2: Entity Erasure');
    console.log('  When: User selects eraser tool');
    await when.userSelectsTool(page, 'eraser');
    
    console.log('  And: User clicks tool mode toggle (ENTITY)');
    await and.userClicksToolMode(page, 'ENTITY');
    
    console.log('  And: User erases entity at grid (10, 10)');
    await and.userErasesEntityAtGrid(page, 10, 10);
    
    console.log('  Then: Entity should NOT exist at grid (10, 10)');
    await then.entityShouldNotExistAtGrid(page, 10, 10);
    
    await saveScreenshot(page, 'examples/gherkin_entity_erased', true);
    console.log('  ✅ Test 2 passed!\n');
    
    // ========================================================================
    // TEST 3: Material Painting (Gherkin-style)
    // ========================================================================
    console.log('Test 3: Material Painting');
    console.log('  Given: Tool is selected (paint)');
    await given.toolIsSelected(page, 'paint');
    
    console.log('  And: Material is selected (moss)');
    await and.materialIsSelected(page, 'moss');
    
    console.log('  When: User paints at position (100, 100)');
    await when.userPaintsAtPosition(page, 100, 100);
    
    console.log('  Then: Material should be "moss" at (100, 100)');
    await then.materialShouldBe(page, 100, 100, 'moss');
    
    await saveScreenshot(page, 'examples/gherkin_material_painted', true);
    console.log('  ✅ Test 3 passed!\n');
    
    // ========================================================================
    // TEST 4: Tool Mode Switching (Gherkin-style)
    // ========================================================================
    console.log('Test 4: Tool Mode Switching');
    console.log('  When: User selects eraser tool');
    await when.userSelectsTool(page, 'eraser');
    
    console.log('  Then: Tool should be "eraser"');
    await then.toolShouldBe(page, 'eraser');
    
    console.log('  When: User clicks tool mode (TERRAIN)');
    await when.userClicksToolMode(page, 'TERRAIN');
    
    console.log('  Then: Mode should be "TERRAIN"');
    await then.modeShouldBe(page, 'TERRAIN');
    
    await saveScreenshot(page, 'examples/gherkin_tool_mode', true);
    console.log('  ✅ Test 4 passed!\n');
    
    // ========================================================================
    // ALL TESTS PASSED
    // ========================================================================
    console.log('✅ ALL GHERKIN-STYLE TESTS PASSED! 🎉');
    console.log('   4/4 tests successful');
    console.log('   Screenshots saved to test/e2e/screenshots/examples/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await saveScreenshot(page, 'examples/gherkin_error', false);
    await browser.close();
    process.exit(1);
  }
})();
