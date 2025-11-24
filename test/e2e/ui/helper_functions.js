/**
 * E2E Test for Helper Functions in Window Initializer
 * Verifies spawnTestAnts, spawnAnts, and addTestResources work correctly
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';

describe('Helper Functions E2E Tests', function() {
  this.timeout(60000);
  let browser, page;

  before(async function() {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  after(async function() {
    if (browser) await browser.close();
  });

  beforeEach(async function() {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await sleep(2000);
  });

  afterEach(async function() {
    if (page) await page.close();
  });

  it('should have helper functions available from windowInitializer', async function() {
    const result = await page.evaluate(() => {
      return {
        hasSpawnTestAnts: typeof window.spawnTestAnts === 'function',
        hasSpawnAnts: typeof window.spawnAnts === 'function',
        hasAddTestResources: typeof window.addTestResources === 'function'
      };
    });

    console.log('Helper functions:', result);

    if (!result.hasSpawnTestAnts) throw new Error('spawnTestAnts not found');
    if (!result.hasSpawnAnts) throw new Error('spawnAnts not found');
    if (!result.hasAddTestResources) throw new Error('addTestResources not found');
  });

  it('should execute addTestResources successfully', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      try {
        const totals = window.addTestResources();
        return {
          success: true,
          totals: totals,
          displayResources: window.resourceCountDisplay ? {
            stick: window.resourceCountDisplay.resources.stick,
            stone: window.resourceCountDisplay.resources.stone,
            greenLeaf: window.resourceCountDisplay.resources.greenLeaf,
            mapleLeaf: window.resourceCountDisplay.resources.mapleLeaf
          } : null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('addTestResources result:', result);

    if (!result.success) throw new Error(`addTestResources failed: ${result.error}`);
    if (!result.totals) throw new Error('No totals returned');
    
    await sleep(500);
    await saveScreenshot(page, 'helper_functions/add_test_resources', true);
  });

  it('should execute spawnTestAnts successfully', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      try {
        const initialCount = typeof ants !== 'undefined' ? ants.length : 0;
        const squad = window.spawnTestAnts();
        const finalCount = typeof ants !== 'undefined' ? ants.length : 0;
        
        return {
          success: true,
          initialCount: initialCount,
          finalCount: finalCount,
          antsSpawned: finalCount - initialCount,
          hasScout: squad && squad.scout !== null,
          hasBuilder: squad && squad.builder !== null,
          hasFarmer: squad && squad.farmer !== null,
          hasWarrior: squad && squad.warrior !== null,
          hasSpitter: squad && squad.spitter !== null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('spawnTestAnts result:', result);

    if (!result.success) throw new Error(`spawnTestAnts failed: ${result.error}`);
    if (result.antsSpawned !== 5) throw new Error(`Expected 5 ants spawned, got ${result.antsSpawned}`);
    
    await sleep(500);
    await saveScreenshot(page, 'helper_functions/spawn_test_ants', true);
  });

  it('should execute spawnAnts with parameters successfully', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      try {
        const initialCount = typeof ants !== 'undefined' ? ants.length : 0;
        const spawnedAnts = window.spawnAnts(3, 'Scout');
        const finalCount = typeof ants !== 'undefined' ? ants.length : 0;
        
        return {
          success: true,
          initialCount: initialCount,
          finalCount: finalCount,
          antsSpawned: finalCount - initialCount,
          spawnedArray: Array.isArray(spawnedAnts),
          spawnedCount: spawnedAnts ? spawnedAnts.length : 0
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('spawnAnts result:', result);

    if (!result.success) throw new Error(`spawnAnts failed: ${result.error}`);
    if (result.antsSpawned !== 3) throw new Error(`Expected 3 ants spawned, got ${result.antsSpawned}`);
    
    await sleep(500);
    await saveScreenshot(page, 'helper_functions/spawn_ants_custom', true);
  });

  it('should have all helper functions work together', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      try {
        // Add resources
        window.addTestResources();
        
        // Spawn test squad
        window.spawnTestAnts();
        
        // Spawn additional ants
        window.spawnAnts(2, 'Warrior');
        
        // Force render
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
        
        return {
          success: true,
          totalAnts: typeof ants !== 'undefined' ? ants.length : 0,
          resources: window.getResourceTotals ? window.getResourceTotals() : {},
          displayResources: window.resourceCountDisplay ? {
            stick: window.resourceCountDisplay.resources.stick,
            stone: window.resourceCountDisplay.resources.stone
          } : null
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('Combined test result:', result);

    if (!result.success) throw new Error(`Combined test failed: ${result.error}`);
    if (result.totalAnts < 7) throw new Error(`Expected at least 7 ants, got ${result.totalAnts}`);
    
    await sleep(500);
    await saveScreenshot(page, 'helper_functions/combined_test', true);
  });
});
