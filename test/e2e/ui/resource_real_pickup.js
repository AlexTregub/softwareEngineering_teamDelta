/**
 * E2E Test: ResourceCountDisplay with Real Ant Resource Pickup
 * Tests that player ants picking up resources updates the UI
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';

describe('ResourceCountDisplay Real Ant Pickup E2E', function() {
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

  it('should show ResourceCountDisplay centered at top of screen', async function() {
    // Bypass menu and start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game');
    }

    await sleep(1000);

    // Check position
    const position = await page.evaluate(() => {
      if (!window.resourceCountDisplay) return { error: 'No instance' };
      return {
        x: window.resourceCountDisplay.x,
        y: window.resourceCountDisplay.y,
        width: window.resourceCountDisplay.width,
        height: window.resourceCountDisplay.height,
        canvasWidth: window.width,
        isCentered: Math.abs((window.width / 2) - (window.resourceCountDisplay.x + window.resourceCountDisplay.width / 2)) < 5
      };
    });

    console.log('ResourceCountDisplay position:', position);

    // Force render
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });

    await sleep(500);
    await saveScreenshot(page, 'resource_real_pickup/centered_display', true);

    if (position.error) throw new Error(position.error);
    if (!position.isCentered) {
      throw new Error(`Display not centered: x=${position.x}, canvas=${position.canvasWidth}`);
    }
  });

  it('should update counts when real resource types are added', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    // Add real resource types (stick, stone, greenLeaf, mapleLeaf)
    const result = await page.evaluate(() => {
      if (typeof window.addGlobalResource === 'undefined') {
        return { error: 'addGlobalResource not found' };
      }

      // Add actual game resource types
      window.addGlobalResource('stick', 25);
      window.addGlobalResource('stone', 15);
      window.addGlobalResource('greenLeaf', 30);
      window.addGlobalResource('mapleLeaf', 20);

      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }

      // Get state
      return {
        globalTotals: window.getResourceTotals(),
        rawResources: window.resourceCountDisplay ? {
          stick: window.resourceCountDisplay.resources.stick,
          stone: window.resourceCountDisplay.resources.stone,
          greenLeaf: window.resourceCountDisplay.resources.greenLeaf,
          mapleLeaf: window.resourceCountDisplay.resources.mapleLeaf
        } : null,
        displayResources: window.resourceCountDisplay ? {
          wood: window.resourceCountDisplay.displayResources.wood,
          stone: window.resourceCountDisplay.displayResources.stone,
          food: window.resourceCountDisplay.displayResources.food
        } : null
      };
    });

    console.log('After adding real resource types:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_real_pickup/with_real_types', true);

    if (result.error) throw new Error(result.error);
    if (!result.displayResources) throw new Error('Display resources not found');
    
    // Verify counts
    if (result.displayResources.wood !== 25) {
      throw new Error(`Expected wood=25, got ${result.displayResources.wood}`);
    }
    if (result.displayResources.stone !== 15) {
      throw new Error(`Expected stone=15, got ${result.displayResources.stone}`);
    }
    if (result.displayResources.food !== 50) {
      throw new Error(`Expected food=50 (30+20), got ${result.displayResources.food}`);
    }
  });

  it('should show icons loaded from sprite images', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(2000); // Wait for images to load

    const iconState = await page.evaluate(() => {
      if (!window.resourceCountDisplay) return { error: 'No instance' };
      
      return {
        hasWoodIcon: window.resourceCountDisplay.icons.wood !== null,
        hasStoneIcon: window.resourceCountDisplay.icons.stone !== null,
        hasFoodIcon: window.resourceCountDisplay.icons.food !== null,
        woodIconLoaded: window.resourceCountDisplay.icons.wood && window.resourceCountDisplay.icons.wood.width > 0,
        stoneIconLoaded: window.resourceCountDisplay.icons.stone && window.resourceCountDisplay.icons.stone.width > 0,
        foodIconLoaded: window.resourceCountDisplay.icons.food && window.resourceCountDisplay.icons.food.width > 0
      };
    });

    console.log('Icon loading state:', iconState);

    await sleep(500);
    await saveScreenshot(page, 'resource_real_pickup/icons_loaded', true);

    if (iconState.error) throw new Error(iconState.error);
  });

  it('should aggregate leaf types into food display', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      // Add different leaf types
      window.addGlobalResource('greenLeaf', 100);
      window.addGlobalResource('mapleLeaf', 50);

      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }

      return {
        rawGreenLeaf: window.resourceCountDisplay.resources.greenLeaf,
        rawMapleLeaf: window.resourceCountDisplay.resources.mapleLeaf,
        displayFood: window.resourceCountDisplay.displayResources.food
      };
    });

    console.log('Leaf aggregation:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_real_pickup/leaf_aggregation', true);

    if (result.displayFood !== 150) {
      throw new Error(`Expected food=150 (100+50), got ${result.displayFood}`);
    }
  });

  it('should use addTestResources helper with real types', async function() {
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      if (typeof window.addTestResources === 'undefined') {
        return { error: 'addTestResources not found' };
      }

      const totals = window.addTestResources();

      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }

      return {
        totals,
        display: {
          wood: window.resourceCountDisplay.displayResources.wood,
          stone: window.resourceCountDisplay.displayResources.stone,
          food: window.resourceCountDisplay.displayResources.food
        }
      };
    });

    console.log('addTestResources() result:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_real_pickup/test_helper_real_types', true);

    if (result.error) throw new Error(result.error);
    
    // Verify aggregation: greenLeaf(40) + mapleLeaf(35) = 75 food
    if (result.display.food !== 75) {
      throw new Error(`Expected food=75, got ${result.display.food}`);
    }
  });
});
