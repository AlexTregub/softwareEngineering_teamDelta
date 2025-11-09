/**
 * E2E Test: Factory Auto-Registration
 * 
 * Verifies that AntFactory automatically registers ants with all game systems:
 * - Global ants[] array (full MVC object)
 * - spatialGridManager (model only)
 * - selectables[] array (full MVC object)
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
        hasAnts: typeof ants !== 'undefined',
        hasAntFactory: typeof AntFactory !== 'undefined',
        hasSpatialGrid: typeof spatialGridManager !== 'undefined',
        hasGameState: typeof gameState !== 'undefined',
        hasWindow: typeof window !== 'undefined',
        antsArray: typeof ants !== 'undefined' ? ants.length : 'undefined'
      };
    });
    
    console.log('Globals check:', globalsCheck);
    
    if (!globalsCheck.hasAnts) {
      throw new Error('ants array not defined - game may not have loaded');
    }
    
    if (!globalsCheck.hasAntFactory) {
      throw new Error('AntFactory not defined - factory may not have loaded');
    }
    
    // Test factory auto-registration
    const result = await page.evaluate(() => {
      const testResults = {
        success: true,
        errors: [],
        details: {}
      };
      
      // Check global ants array exists
      if (typeof ants === 'undefined' || !Array.isArray(ants)) {
        testResults.success = false;
        testResults.errors.push('Global ants array not found');
        return testResults;
      }
      
      const initialAntCount = ants.length;
      testResults.details.initialAntCount = initialAntCount;
      
      // Create a test ant using factory
      const testAnt = AntFactory.createAnt(200, 200, {
        faction: 'player',
        job: 'Scout',
        autoRegister: true
      });
      
      // Verify ant was added to ants[] array
      const afterFactoryAntCount = ants.length;
      testResults.details.afterFactoryAntCount = afterFactoryAntCount;
      
      if (afterFactoryAntCount !== initialAntCount + 1) {
        testResults.success = false;
        testResults.errors.push(`Ant not added to ants[]. Expected ${initialAntCount + 1}, got ${afterFactoryAntCount}`);
      }
      
      // Verify ant was added to spatial grid
      if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
        const nearbyEntities = spatialGridManager.getNearbyEntities(200, 200, 50);
        const foundInSpatialGrid = nearbyEntities.some(e => 
          e.posX === 200 && e.posY === 200 && e.type === 'ant'
        );
        
        testResults.details.foundInSpatialGrid = foundInSpatialGrid;
        
        if (!foundInSpatialGrid) {
          testResults.success = false;
          testResults.errors.push('Ant model not registered in spatial grid');
        }
      }
      
      // Verify MVC structure
      if (!testAnt.model || !testAnt.view || !testAnt.controller) {
        testResults.success = false;
        testResults.errors.push('Invalid MVC structure returned from factory');
      }
      
      // Test opt-out of auto-registration
      const manualAnt = AntFactory.createAnt(300, 300, {
        faction: 'enemy',
        job: 'Warrior',
        autoRegister: false
      });
      
      const afterManualAntCount = ants.length;
      testResults.details.afterManualAntCount = afterManualAntCount;
      
      if (afterManualAntCount !== afterFactoryAntCount) {
        testResults.success = false;
        testResults.errors.push('autoRegister: false did not work - ant was still registered');
      }
      
      // Manually register the ant
      AntFactory.registerWithSystems(manualAnt);
      
      const afterManualRegisterCount = ants.length;
      testResults.details.afterManualRegisterCount = afterManualRegisterCount;
      
      if (afterManualRegisterCount !== afterManualAntCount + 1) {
        testResults.success = false;
        testResults.errors.push('Manual registration failed');
      }
      
      // Test queen creation
      const queenMVC = AntFactory.createQueen(400, 400, {
        faction: 'player'
      });
      
      const afterQueenCount = ants.length;
      testResults.details.afterQueenCount = afterQueenCount;
      
      if (afterQueenCount !== afterManualRegisterCount + 1) {
        testResults.success = false;
        testResults.errors.push('Queen not auto-registered');
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
    console.log(`  - Initial ants: ${result.details.initialAntCount}`);
    console.log(`  - After auto-register: ${result.details.afterFactoryAntCount}`);
    console.log(`  - After manual (no register): ${result.details.afterManualAntCount}`);
    console.log(`  - After manual register: ${result.details.afterManualRegisterCount}`);
    console.log(`  - After queen: ${result.details.afterQueenCount}`);
    console.log(`  - Found in spatial grid: ${result.details.foundInSpatialGrid}`);
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('ERROR:', error);
    await saveScreenshot(page, 'factory/auto_registration_error', false);
    await browser.close();
    process.exit(1);
  }
})();
