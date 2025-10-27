/**
 * E2E Test: Brush Panel Hidden by Default (Enhancement #9)
 * 
 * Verifies that the draggable Brush Panel is hidden by default
 * since brush size is now controlled via menu bar inline controls.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    console.log('Ensuring game started...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start');
    }
    
    console.log('Switching to LEVEL_EDITOR state...');
    await page.evaluate(() => {
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('LEVEL_EDITOR');
      }
    });
    
    await sleep(1000);
    
    // Test 1: Verify Brush Panel is NOT visible by default
    console.log('Test 1: Brush Panel should NOT be visible by default...');
    const brushPanelVisibility = await page.evaluate(() => {
      const brushPanelId = 'level-editor-brush';
      
      // Check if panel exists in draggablePanelManager
      let panelExists = false;
      let panelVisible = false;
      
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        const panel = window.draggablePanelManager.panels.get(brushPanelId);
        if (panel) {
          panelExists = true;
          panelVisible = panel.visible || false;
        }
      }
      
      // Check state visibility
      let inStateVisibility = false;
      if (window.draggablePanelManager && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        inStateVisibility = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR.includes(brushPanelId);
      }
      
      return {
        panelExists,
        panelVisible,
        inStateVisibility,
        expectedVisible: false
      };
    });
    
    console.log('Brush Panel visibility:', brushPanelVisibility);
    
    if (brushPanelVisibility.panelVisible || brushPanelVisibility.inStateVisibility) {
      console.error('❌ FAIL: Brush Panel is visible (should be hidden)');
      await saveScreenshot(page, 'levelEditor/brush_panel_visible_fail', false);
      throw new Error('Brush Panel should be hidden by default');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/brush_panel_hidden', true);
    
    // Test 2: Verify menu bar brush controls are still present
    console.log('Test 2: Menu bar brush controls should still be present...');
    const menuBarControls = await page.evaluate(() => {
      let brushSizeModuleExists = false;
      
      if (window.levelEditor && window.levelEditor.fileMenuBar) {
        brushSizeModuleExists = !!window.levelEditor.fileMenuBar.brushSizeModule;
      }
      
      return {
        brushSizeModuleExists,
        expectedExists: true
      };
    });
    
    console.log('Menu bar controls:', menuBarControls);
    
    if (!menuBarControls.brushSizeModuleExists) {
      console.error('❌ FAIL: Menu bar brush controls not found');
      await saveScreenshot(page, 'levelEditor/menu_controls_missing_fail', false);
      throw new Error('Menu bar brush controls should exist');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/menu_brush_controls_present', true);
    
    // Test 3: Verify View menu does NOT have Brush Panel toggle
    console.log('Test 3: View menu should NOT have Brush Panel toggle...');
    const viewMenuCheck = await page.evaluate(() => {
      let hasBrushPanelToggle = false;
      
      if (window.levelEditor && 
          window.levelEditor.fileMenuBar && 
          window.levelEditor.fileMenuBar.menuItems) {
        const viewMenu = window.levelEditor.fileMenuBar.menuItems.find(m => m.label === 'View');
        if (viewMenu && viewMenu.items) {
          hasBrushPanelToggle = viewMenu.items.some(item => 
            item.label && item.label.includes('Brush Panel')
          );
        }
      }
      
      return {
        hasBrushPanelToggle,
        expectedHasToggle: false
      };
    });
    
    console.log('View menu check:', viewMenuCheck);
    
    if (viewMenuCheck.hasBrushPanelToggle) {
      console.error('❌ FAIL: View menu still has Brush Panel toggle');
      await saveScreenshot(page, 'levelEditor/view_menu_has_brush_fail', false);
      throw new Error('View menu should NOT have Brush Panel toggle');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/view_menu_no_brush_toggle', true);
    
    // Test 4: Verify other panels (Materials, Tools) are still visible
    console.log('Test 4: Other panels should still be visible...');
    const otherPanelsCheck = await page.evaluate(() => {
      let materialsPanelVisible = false;
      let toolsPanelVisible = false;
      
      if (window.draggablePanelManager && 
          window.draggablePanelManager.stateVisibility &&
          window.draggablePanelManager.stateVisibility.LEVEL_EDITOR) {
        const visiblePanels = window.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
        materialsPanelVisible = visiblePanels.includes('level-editor-materials');
        toolsPanelVisible = visiblePanels.includes('level-editor-tools');
      }
      
      return {
        materialsPanelVisible,
        toolsPanelVisible,
        expectedMaterials: true,
        expectedTools: true
      };
    });
    
    console.log('Other panels check:', otherPanelsCheck);
    
    if (!otherPanelsCheck.materialsPanelVisible || !otherPanelsCheck.toolsPanelVisible) {
      console.error('❌ FAIL: Materials or Tools panel not visible');
      await saveScreenshot(page, 'levelEditor/other_panels_missing_fail', false);
      throw new Error('Materials and Tools panels should still be visible');
    }
    
    await sleep(300);
    await saveScreenshot(page, 'levelEditor/other_panels_visible', true);
    
    console.log('✅ Brush Panel hidden by default verified!');
    console.log('✅ Menu bar brush controls still functional!');
    console.log('✅ View menu does NOT have Brush Panel toggle!');
    console.log('✅ Other panels still visible!');
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'levelEditor/brush_panel_test_error', false);
    await browser.close();
    process.exit(1);
  }
})();
