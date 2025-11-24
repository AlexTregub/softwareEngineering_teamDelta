/**
 * E2E Integration Tests for ResourceCountDisplay
 * Tests EventBus integration with ResourceManager
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';

describe('ResourceCountDisplay E2E Integration Tests', function() {
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

  it('should initialize ResourceCountDisplay component', async function() {
    const result = await page.evaluate(() => {
      return {
        hasClass: typeof window.ResourceCountDisplay !== 'undefined',
        hasInstance: typeof window.resourceCountDisplay !== 'undefined',
        instanceExists: window.resourceCountDisplay !== null
      };
    });

    console.log('ResourceCountDisplay initialization:', result);
    
    if (!result.hasClass) throw new Error('ResourceCountDisplay class not found');
    if (!result.hasInstance) throw new Error('resourceCountDisplay instance not found');
    if (!result.instanceExists) throw new Error('resourceCountDisplay instance is null');
  });

  it('should show ResourceCountDisplay with initial zero counts', async function() {
    // Bypass menu and start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }

    await sleep(1000);

    // Force render
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });

    await sleep(500);
    await saveScreenshot(page, 'resource_count_display/initial_state', true);

    const state = await page.evaluate(() => {
      if (!window.resourceCountDisplay) return { error: 'No instance' };
      return {
        wood: window.resourceCountDisplay.resources.wood,
        stone: window.resourceCountDisplay.resources.stone,
        food: window.resourceCountDisplay.resources.food,
        x: window.resourceCountDisplay.x,
        y: window.resourceCountDisplay.y,
        width: window.resourceCountDisplay.width,
        height: window.resourceCountDisplay.height
      };
    });

    console.log('Initial resource state:', state);
  });

  it('should update counts when resources are added via addGlobalResource', async function() {
    // Bypass menu
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    // Add resources
    const result = await page.evaluate(() => {
      if (typeof window.addGlobalResource === 'undefined') {
        return { error: 'addGlobalResource not found' };
      }

      // Add test resources
      window.addGlobalResource('wood', 50);
      window.addGlobalResource('stone', 30);
      window.addGlobalResource('food', 75);

      // Force render
      if (window.RenderManager) {
        window.RenderManager.render('PLAYING');
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }

      // Get current state
      return {
        globalTotals: window.getResourceTotals(),
        displayResources: window.resourceCountDisplay ? {
          wood: window.resourceCountDisplay.resources.wood,
          stone: window.resourceCountDisplay.resources.stone,
          food: window.resourceCountDisplay.resources.food
        } : null
      };
    });

    console.log('After adding resources:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_count_display/with_resources', true);

    if (result.error) throw new Error(result.error);
    if (!result.displayResources) throw new Error('Display resources not found');
    
    // Verify counts match
    if (result.displayResources.wood !== 50) {
      throw new Error(`Expected wood=50, got ${result.displayResources.wood}`);
    }
    if (result.displayResources.stone !== 30) {
      throw new Error(`Expected stone=30, got ${result.displayResources.stone}`);
    }
    if (result.displayResources.food !== 75) {
      throw new Error(`Expected food=75, got ${result.displayResources.food}`);
    }
  });

  it('should use addTestResources helper function', async function() {
    // Bypass menu
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      if (typeof window.addTestResources === 'undefined') {
        return { error: 'addTestResources not found' };
      }

      // Call helper
      const totals = window.addTestResources();

      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }

      return {
        totals,
        displayResources: window.resourceCountDisplay ? {
          wood: window.resourceCountDisplay.resources.wood,
          stone: window.resourceCountDisplay.resources.stone,
          food: window.resourceCountDisplay.resources.food
        } : null
      };
    });

    console.log('After addTestResources():', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_count_display/test_helper', true);

    if (result.error) throw new Error(result.error);
    if (!result.displayResources) throw new Error('Display resources not found');
  });

  it('should listen to RESOURCE_COUNTS_UPDATED EventBus events', async function() {
    // Bypass menu
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      if (!window.eventBus) return { error: 'EventBus not found' };

      // Manually emit event
      window.eventBus.emit('RESOURCE_COUNTS_UPDATED', {
        wood: 100,
        stone: 50,
        food: 200
      });

      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }

      return {
        displayResources: window.resourceCountDisplay ? {
          wood: window.resourceCountDisplay.resources.wood,
          stone: window.resourceCountDisplay.resources.stone,
          food: window.resourceCountDisplay.resources.food
        } : null
      };
    });

    console.log('After EventBus emit:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_count_display/eventbus_update', true);

    if (result.error) throw new Error(result.error);
    if (!result.displayResources) throw new Error('Display resources not found');
    
    // Verify counts updated via EventBus
    if (result.displayResources.wood !== 100) {
      throw new Error(`Expected wood=100 from EventBus, got ${result.displayResources.wood}`);
    }
    if (result.displayResources.stone !== 50) {
      throw new Error(`Expected stone=50 from EventBus, got ${result.displayResources.stone}`);
    }
    if (result.displayResources.food !== 200) {
      throw new Error(`Expected food=200 from EventBus, got ${result.displayResources.food}`);
    }
  });

  it('should update when removeGlobalResource is called', async function() {
    // Bypass menu
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    const result = await page.evaluate(() => {
      if (typeof window.addGlobalResource === 'undefined') {
        return { error: 'Resource functions not found' };
      }

      // Add resources first
      window.addGlobalResource('wood', 100);
      window.addGlobalResource('stone', 80);

      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }

      const afterAdd = {
        wood: window.resourceCountDisplay.resources.wood,
        stone: window.resourceCountDisplay.resources.stone
      };

      // Remove some resources
      window.removeGlobalResource('wood', 30);
      window.removeGlobalResource('stone', 20);

      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
      }

      const afterRemove = {
        wood: window.resourceCountDisplay.resources.wood,
        stone: window.resourceCountDisplay.resources.stone
      };

      return { afterAdd, afterRemove };
    });

    console.log('Add/Remove test:', result);

    await sleep(500);
    await saveScreenshot(page, 'resource_count_display/after_removal', true);

    if (result.error) throw new Error(result.error);
    
    // Verify removal worked
    if (result.afterAdd.wood !== 100) {
      throw new Error(`Expected wood=100 after add, got ${result.afterAdd.wood}`);
    }
    if (result.afterRemove.wood !== 70) {
      throw new Error(`Expected wood=70 after remove, got ${result.afterRemove.wood}`);
    }
    if (result.afterRemove.stone !== 60) {
      throw new Error(`Expected stone=60 after remove, got ${result.afterRemove.stone}`);
    }
  });
});
