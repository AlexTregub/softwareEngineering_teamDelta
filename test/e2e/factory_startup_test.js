/**
 * E2E Test: AntFactory Auto-Registration (MVC Architecture)
 * 
 * Verifies that AntFactory automatically registers ants with all game systems:
 * - spatialGridManager (model only - single source of truth)
 * - selectables[] array (full MVC object for selection)
 * 
 * Note: Old ants[] array has been REMOVED in favor of spatialGridManager
 */

const { launchBrowser, sleep, saveScreenshot } = require('./puppeteer_helper');
const cameraHelper = require('./camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    
    // Check console for any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
    
    // Wait for basic globals
    await sleep(2000);
    
    // Check what globals are available
    const globalsCheck = await page.evaluate(() => {
      return {
        hasAntFactory: typeof AntFactory !== 'undefined',
        hasSpatialGrid: typeof spatialGridManager !== 'undefined',
        spatialGridHasAddEntity: (typeof spatialGridManager !== 'undefined' && spatialGridManager) 
          ? typeof spatialGridManager.addEntity === 'function'
          : false,
        spatialGridHasGetCount: (typeof spatialGridManager !== 'undefined' && spatialGridManager)
          ? typeof spatialGridManager.getEntityCountByType === 'function'
          : false,
        hasSelectables: typeof selectables !== 'undefined',
        hasGameState: typeof gameState !== 'undefined',
        spatialGridEntityCount: (typeof spatialGridManager !== 'undefined' && spatialGridManager) 
          ? spatialGridManager.getEntityCountByType('Ant') // Capital 'Ant'
          : 0
      };
    });
    
    console.log('Globals check:', globalsCheck);
    
    if (!globalsCheck.hasAntFactory) {
      throw new Error('AntFactory not defined - factory may not have loaded');
    }
    
    if (!globalsCheck.hasSpatialGrid) {
      throw new Error('spatialGridManager not defined - spatial grid may not have loaded');
    }
    
    // Test factory auto-registration
    const result = await page.evaluate(() => {
      const testResults = {
        success: true,
        errors: [],
        details: {}
      };
      
      // Check spatial grid exists (single source of truth)
      if (typeof spatialGridManager === 'undefined' || !spatialGridManager) {
        testResults.success = false;
        testResults.errors.push('spatialGridManager not found');
        return testResults;
      }
      
      const initialAntCount = spatialGridManager.getEntityCountByType('Ant'); // Capital 'Ant' to match model.type
      testResults.details.initialAntCount = initialAntCount;
      
      // Create a test ant using factory (auto-registers by default)
      const testAnt = AntFactory.createAnt(200, 200, {
        faction: 'player',
        job: 'Scout',
        autoRegister: true
      });
      
      // Debug: Check what was returned
      testResults.details.antStructure = {
        hasModel: !!testAnt.model,
        hasView: !!testAnt.view,
        hasController: !!testAnt.controller,
        modelType: testAnt.model ? testAnt.model.type : 'none',
        modelTypeCapitalized: testAnt.model ? testAnt.model.type : 'none',
        modelHasGetX: testAnt.model && typeof testAnt.model.getX === 'function',
        modelHasGetY: testAnt.model && typeof testAnt.model.getY === 'function',
        modelHasGetPosition: testAnt.model && typeof testAnt.model.getPosition === 'function',
        modelPosX: testAnt.model ? testAnt.model.posX : 'none',
        modelPosY: testAnt.model ? testAnt.model.posY : 'none'
      };
      
      // Try manually calling addEntity and checking result
      if (testAnt.model) {
        try {
          // Check type BEFORE adding
          testResults.details.modelTypeBeforeAdd = testAnt.model.type;
          testResults.details.modelTypeViaGetter = typeof testAnt.model.type;
          testResults.details.modelTypeProperty = Object.prototype.hasOwnProperty.call(testAnt.model, 'type');
          testResults.details.modelPrivateType = testAnt.model._type;
          
          const addResult = spatialGridManager.addEntity(testAnt.model);
          testResults.details.manualAddResult = addResult;
          testResults.details.countAfterManualAdd = spatialGridManager.getEntityCountByType('Ant');
          
          // Check all entities
          testResults.details.totalEntitiesInGrid = spatialGridManager.getEntityCount();
          testResults.details.allEntities = spatialGridManager.getAllEntities().map(e => ({
            type: e.type,
            _type: e._type,
            hasType: Object.prototype.hasOwnProperty.call(e, 'type'),
            has_Type: Object.prototype.hasOwnProperty.call(e, '_type')
          }));
          
          // Check the type map
          testResults.details.typeMapKeys = Array.from(spatialGridManager._entitiesByType.keys());
        } catch (e) {
          testResults.details.manualAddError = e.message + ' | ' + e.stack;
        }
      }
      
      // Try getting position to verify model works
      if (testAnt.model && typeof testAnt.model.getPosition === 'function') {
        try {
          const pos = testAnt.model.getPosition();
          testResults.details.modelPosition = { x: pos.x, y: pos.y };
        } catch (e) {
          testResults.details.modelPositionError = e.message;
        }
      }
      
      // Check if spatialGridManager has the methods we need
      testResults.details.spatialGridMethods = {
        hasAddEntity: typeof spatialGridManager.addEntity === 'function',
        hasGetEntityCountByType: typeof spatialGridManager.getEntityCountByType === 'function',
        hasGetNearbyEntities: typeof spatialGridManager.getNearbyEntities === 'function'
      };
      
      // Verify ant model was added to spatial grid (single source of truth)
      const afterFactoryAntCount = spatialGridManager.getEntityCountByType('Ant'); // Capital 'Ant'
      testResults.details.afterFactoryAntCount = afterFactoryAntCount;
      
      if (afterFactoryAntCount !== initialAntCount + 1) {
        testResults.success = false;
        testResults.errors.push(`Ant model not added to spatial grid. Expected ${initialAntCount + 1}, got ${afterFactoryAntCount}`);
      }
      
      // Verify ant model is findable in spatial grid by position
      const nearbyEntities = spatialGridManager.getNearbyEntities(200, 200, 50);
      const foundInSpatialGrid = nearbyEntities.some(e => 
        Math.abs(e.posX - 200) < 5 && Math.abs(e.posY - 200) < 5 && e.type === 'Ant' // Capital 'Ant'
      );
      
      testResults.details.foundInSpatialGrid = foundInSpatialGrid;
      
      if (!foundInSpatialGrid) {
        testResults.success = false;
        testResults.errors.push('Ant model not findable in spatial grid at expected position');
      }
      
      // Verify MVC structure
      if (!testAnt.model || !testAnt.view || !testAnt.controller) {
        testResults.success = false;
        testResults.errors.push('Invalid MVC structure returned from factory');
      }
      
      // Verify selectables array contains full MVC object
      if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
        const foundInSelectables = selectables.some(s => s === testAnt);
        testResults.details.foundInSelectables = foundInSelectables;
        
        if (!foundInSelectables) {
          testResults.success = false;
          testResults.errors.push('Ant MVC object not registered in selectables array');
        }
      }
      
      // Test opt-out of auto-registration
      const manualAnt = AntFactory.createAnt(300, 300, {
        faction: 'enemy',
        job: 'Warrior',
        autoRegister: false
      });
      
      const afterManualAntCount = spatialGridManager.getEntityCountByType('Ant'); // Capital 'Ant'
      testResults.details.afterManualAntCount = afterManualAntCount;
      
      if (afterManualAntCount !== afterFactoryAntCount) {
        testResults.success = false;
        testResults.errors.push('autoRegister: false did not work - ant was still registered');
      }
      
      // Manually register the ant
      AntFactory.registerWithSystems(manualAnt);
      
      const afterManualRegisterCount = spatialGridManager.getEntityCountByType('Ant'); // Capital 'Ant'
      testResults.details.afterManualRegisterCount = afterManualRegisterCount;
      
      if (afterManualRegisterCount !== afterManualAntCount + 1) {
        testResults.success = false;
        testResults.errors.push('Manual registration failed');
      }
      
      // Test queen creation
      const queenMVC = AntFactory.createQueen(400, 400, {
        faction: 'player'
      });
      
      const afterQueenCount = spatialGridManager.getEntityCountByType('Ant'); // Capital 'Ant'
      testResults.details.afterQueenCount = afterQueenCount;
      
      if (afterQueenCount !== afterManualRegisterCount + 1) {
        testResults.success = false;
        testResults.errors.push('Queen not auto-registered');
      }
      
      // Verify queen has QueenController
      const hasQueenController = queenMVC.controller && queenMVC.controller.constructor.name === 'QueenController';
      testResults.details.hasQueenController = hasQueenController;
      
      if (!hasQueenController) {
        testResults.success = false;
        testResults.errors.push('Queen does not have QueenController');
      }
      
      // Force redraw to show all ants
      window.gameState = 'PLAYING';
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      return testResults;
    });
    
    console.log('Test Results:', JSON.stringify(result, null, 2));
    
    // Take screenshot
    await sleep(500);
    await saveScreenshot(page, 'factory/auto_registration', result.success);
    
    if (!result.success) {
      console.error('TEST FAILED:');
      result.errors.forEach(err => console.error('  -', err));
      await browser.close();
      process.exit(1);
    }
    
    console.log('✓ All factory auto-registration tests passed!');
    console.log(`  - Initial ants in spatial grid: ${result.details.initialAntCount}`);
    console.log(`  - After auto-register: ${result.details.afterFactoryAntCount}`);
    console.log(`  - After manual (no register): ${result.details.afterManualAntCount}`);
    console.log(`  - After manual register: ${result.details.afterManualRegisterCount}`);
    console.log(`  - After queen: ${result.details.afterQueenCount}`);
    console.log(`  - Found in spatial grid: ${result.details.foundInSpatialGrid}`);
    console.log(`  - Found in selectables: ${result.details.foundInSelectables}`);
    console.log(`  - Queen has QueenController: ${result.details.hasQueenController}`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('ERROR:', error);
    await saveScreenshot(page, 'factory/auto_registration_error', false);
    await browser.close();
    process.exit(1);
  }
})();
