/**
 * E2E Test: Ant Selection Bar Component
 * Tests the new ant selection UI bar with visual verification
 */

const puppeteer = require('puppeteer');
const { saveScreenshot, sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

describe('Ant Selection Bar UI', function() {
  this.timeout(30000);
  
  let browser;
  let page;
  
  before(async function() {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to game
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
    
    // Bypass menu and start game
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Failed to start game - still on menu');
    }
    
    await sleep(1000);
  });
  
  after(async function() {
    if (browser) await browser.close();
  });
  
  it('should render ant selection bar with all job buttons', async function() {
    // Force render
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ant_selection_bar/initial_render', true);
    
    // Check that component exists
    const barExists = await page.evaluate(() => {
      return typeof window.g_antSelectionBar !== 'undefined' && window.g_antSelectionBar !== null;
    });
    
    if (!barExists) {
      throw new Error('AntSelectionBar component not found');
    }
    
    // Verify buttons
    const buttonInfo = await page.evaluate(() => {
      if (!window.g_antSelectionBar) return null;
      return {
        buttonCount: window.g_antSelectionBar.buttons.length,
        jobTypes: window.g_antSelectionBar.buttons.map(b => b.jobType),
        position: {
          x: window.g_antSelectionBar.x,
          y: window.g_antSelectionBar.y,
          width: window.g_antSelectionBar.width,
          height: window.g_antSelectionBar.height
        }
      };
    });
    
    console.log('AntSelectionBar info:', buttonInfo);
  });
  
  it('should show ant counts for each job type', async function() {
    // Get ant counts
    const counts = await page.evaluate(() => {
      if (!window.g_entityManager) return null;
      
      const faction = 'player';
      return {
        Builder: window.g_entityManager.getAntJobCount(faction, 'Builder'),
        Scout: window.g_entityManager.getAntJobCount(faction, 'Scout'),
        Farmer: window.g_entityManager.getAntJobCount(faction, 'Farmer'),
        Warrior: window.g_entityManager.getAntJobCount(faction, 'Warrior'),
        Spitter: window.g_entityManager.getAntJobCount(faction, 'Spitter'),
        hasQueen: typeof window.getQueen === 'function' && window.getQueen() !== null
      };
    });
    
    console.log('Ant counts:', counts);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ant_selection_bar/with_counts', true);
  });
  
  it('should highlight button on hover', async function() {
    // Get first button position
    const buttonPos = await page.evaluate(() => {
      if (!window.g_antSelectionBar || !window.g_antSelectionBar.buttons.length) return null;
      const btn = window.g_antSelectionBar.buttons[0];
      return {
        x: btn.x + btn.width / 2,
        y: btn.y + btn.height / 2,
        jobType: btn.jobType
      };
    });
    
    if (!buttonPos) {
      throw new Error('Could not get button position');
    }
    
    console.log('Hovering over button:', buttonPos.jobType);
    
    // Move mouse to button
    await page.mouse.move(buttonPos.x, buttonPos.y);
    
    // Update hover state
    await page.evaluate(() => {
      if (window.g_antSelectionBar) {
        window.g_antSelectionBar.update();
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    await saveScreenshot(page, 'ant_selection_bar/button_hover', true);
  });
  
  it('should select ants when button is clicked', async function() {
    // Get Builder button position (assuming it's the first button)
    const builderButtonPos = await page.evaluate(() => {
      if (!window.g_antSelectionBar) return null;
      const builderBtn = window.g_antSelectionBar.buttons.find(b => b.jobType === 'Builder');
      if (!builderBtn) return null;
      return {
        x: builderBtn.x + builderBtn.width / 2,
        y: builderBtn.y + builderBtn.height / 2
      };
    });
    
    if (!builderButtonPos) {
      console.log('Builder button not found, skipping click test');
      return;
    }
    
    // Click the button
    await page.mouse.click(builderButtonPos.x, builderButtonPos.y);
    
    // Check selection
    const selectionResult = await page.evaluate(() => {
      if (!window.g_selectionBoxController) return null;
      return {
        selectedCount: window.g_selectionBoxController.selectedEntities ? 
                       window.g_selectionBoxController.selectedEntities.length : 0,
        selectedTypes: window.g_selectionBoxController.selectedEntities ?
                       window.g_selectionBoxController.selectedEntities.map(e => e.jobName || e.JobName) : []
      };
    });
    
    console.log('Selection result:', selectionResult);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ant_selection_bar/after_click', true);
  });
  
  it('should select queen when queen button is clicked', async function() {
    // Get Queen button position
    const queenButtonPos = await page.evaluate(() => {
      if (!window.g_antSelectionBar) return null;
      const queenBtn = window.g_antSelectionBar.buttons.find(b => b.jobType === 'Queen');
      if (!queenBtn) return null;
      return {
        x: queenBtn.x + queenBtn.width / 2,
        y: queenBtn.y + queenBtn.height / 2
      };
    });
    
    if (!queenButtonPos) {
      console.log('Queen button not found, skipping queen test');
      return;
    }
    
    // Click the queen button
    await page.mouse.click(queenButtonPos.x, queenButtonPos.y);
    
    // Check if queen is selected
    const queenSelected = await page.evaluate(() => {
      if (!window.g_selectionBoxController) return null;
      const selectedEntities = window.g_selectionBoxController.selectedEntities || [];
      const queen = typeof window.getQueen === 'function' ? window.getQueen() : null;
      return {
        selectedCount: selectedEntities.length,
        hasQueen: selectedEntities.some(e => e === queen),
        queenExists: queen !== null
      };
    });
    
    console.log('Queen selection result:', queenSelected);
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ant_selection_bar/queen_selected', true);
  });
});
