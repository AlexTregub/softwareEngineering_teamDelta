/**
 * E2E Test for Window Initializer
 * Verifies that centralized window initialization works correctly
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

const BASE_URL = 'http://localhost:8000';

describe('Window Initializer E2E Tests', function() {
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

  it('should load windowInitializer functions', async function() {
    const result = await page.evaluate(() => {
      return {
        hasInitializeWindowManagers: typeof window.initializeWindowManagers !== 'undefined',
        hasInitializeUIComponents: typeof window.initializeUIComponents !== 'undefined',
        hasInitializeGlobalFunctions: typeof window.initializeGlobalFunctions !== 'undefined',
        hasInitializeAllWindowObjects: typeof window.initializeAllWindowObjects !== 'undefined'
      };
    });

    console.log('WindowInitializer functions:', result);

    if (!result.hasInitializeWindowManagers) throw new Error('initializeWindowManagers not found');
    if (!result.hasInitializeUIComponents) throw new Error('initializeUIComponents not found');
    if (!result.hasInitializeGlobalFunctions) throw new Error('initializeGlobalFunctions not found');
    if (!result.hasInitializeAllWindowObjects) throw new Error('initializeAllWindowObjects not found');
  });

  it('should have initialized all managers via windowInitializer', async function() {
    const result = await page.evaluate(() => {
      return {
        hasSpatialGridManager: typeof window.spatialGridManager !== 'undefined',
        hasEntityManager: typeof window.entityManager !== 'undefined',
        hasEventManager: typeof window.eventManager !== 'undefined',
        hasEventDebugManager: typeof window.eventDebugManager !== 'undefined',
        hasBUIManager: typeof window.BUIManager !== 'undefined'
      };
    });

    console.log('Managers initialized:', result);

    if (!result.hasSpatialGridManager) throw new Error('spatialGridManager not initialized');
    if (!result.hasEntityManager) throw new Error('entityManager not initialized');
    if (!result.hasEventManager) throw new Error('eventManager not initialized');
    if (!result.hasEventDebugManager) throw new Error('eventDebugManager not initialized');
    if (!result.hasBUIManager) throw new Error('BUIManager not initialized');
  });

  it('should have initialized UI components via windowInitializer', async function() {
    const result = await page.evaluate(() => {
      return {
        hasAntCountDropdown: typeof window.antCountDropdown !== 'undefined',
        hasResourceCountDisplay: typeof window.resourceCountDisplay !== 'undefined',
        antCountDropdownExists: window.antCountDropdown !== null,
        resourceCountDisplayExists: window.resourceCountDisplay !== null
      };
    });

    console.log('UI components initialized:', result);

    if (!result.hasAntCountDropdown) throw new Error('antCountDropdown not initialized');
    if (!result.hasResourceCountDisplay) throw new Error('resourceCountDisplay not initialized');
    if (!result.antCountDropdownExists) throw new Error('antCountDropdown is null');
    if (!result.resourceCountDisplayExists) throw new Error('resourceCountDisplay is null');
  });

  it('should have initialized global helper functions', async function() {
    const result = await page.evaluate(() => {
      return {
        hasSpawnTestAnts: typeof window.spawnTestAnts !== 'undefined',
        hasSpawnAnts: typeof window.spawnAnts !== 'undefined',
        hasAddTestResources: typeof window.addTestResources !== 'undefined'
      };
    });

    console.log('Global helper functions:', result);

    if (!result.hasSpawnTestAnts) throw new Error('spawnTestAnts not registered');
    if (!result.hasSpawnAnts) throw new Error('spawnAnts not registered');
    if (!result.hasAddTestResources) throw new Error('addTestResources not registered');
  });

  it('should render all UI components after initialization', async function() {
    // Bypass menu
    await cameraHelper.ensureGameStarted(page);
    await sleep(1000);

    // Add test resources to make UI visible
    await page.evaluate(() => {
      if (typeof window.addTestResources === 'function') {
        window.addTestResources();
      }
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });

    await sleep(500);
    await saveScreenshot(page, 'window_initializer/full_ui', true);

    const state = await page.evaluate(() => {
      return {
        resourceDisplay: window.resourceCountDisplay ? {
          x: window.resourceCountDisplay.x,
          y: window.resourceCountDisplay.y,
          width: window.resourceCountDisplay.width,
          height: window.resourceCountDisplay.height
        } : null,
        antDropdown: window.antCountDropdown ? {
          x: window.antCountDropdown.x,
          y: window.antCountDropdown.y
        } : null
      };
    });

    console.log('UI components state:', state);

    if (!state.resourceDisplay) throw new Error('ResourceCountDisplay state not found');
    if (!state.antDropdown) throw new Error('AntCountDropdown state not found');
  });
});
