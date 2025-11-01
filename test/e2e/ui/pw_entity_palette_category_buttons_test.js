/**
 * E2E Test: Entity Palette Category Button Clicks
 * 
 * Tests that category buttons (Entities/Buildings/Resources/Custom) are clickable
 * in the Entity Palette panel within the Level Editor.
 * 
 * This test specifically addresses the handoff bug report:
 * "I can now click on the entity's in the debug panel, but I cannot select 
 *  any of the radio buttons so I can't look at the other catagories"
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('Loading Level Editor...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure Level Editor started (bypass menu)
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error('Failed to start Level Editor - still on main menu');
    }
    console.log('✓ Level Editor started');
    
    await sleep(1000);
    
    // Get Entity Palette panel
    const panelCheck = await page.evaluate(() => {
      const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
      return {
        exists: !!panel,
        visible: panel ? panel.visible : false,
        position: panel ? { x: panel.config.position.x, y: panel.config.position.y } : null
      };
    });
    
    console.log('Panel check:', panelCheck);
    
    if (!panelCheck.exists) {
      throw new Error('Entity Palette panel not registered in draggablePanelManager');
    }
    
    // Make panel visible if not already
    if (!panelCheck.visible) {
      console.log('Making panel visible...');
      await page.evaluate(() => {
        const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
        if (panel) {
          panel.visible = true;
        }
      });
      await sleep(500);
    }
    
    // Force render
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot 1: Initial state (Entities category)
    await saveScreenshot(page, 'entity_palette_bugs/01_initial_entities_category', true);
    console.log('✓ Screenshot 1: Initial state');
    
    // Test 1: Click Buildings button (middle button)
    console.log('\\nTest 1: Clicking Buildings button...');
    const test1 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      const entityPalette = window.levelEditor?.entityPalette;
      
      if (!panel || !entityPalette) {
        return { success: false, error: 'Panel or EntityPalette not found' };
      }
      
      const panelPos = { x: panel.config.position.x, y: panel.config.position.y };
      const panelWidth = panel.config.size.width;
      const titleBarHeight = 30;
      const padding = 10;
      
      // Calculate content area
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      
      // Click in the middle of the button area (Buildings is middle third)
      const buttonHeight = 30;
      const buttonWidth = (panelWidth - padding * 2) / 4; // 4 buttons
      const clickX = contentX + (buttonWidth * 1.5); // Middle of second button
      const clickY = contentY + (buttonHeight / 2);
      
      // Get category before click
      const categoryBefore = entityPalette.currentCategory;
      
      // Simulate click
      const result = entityPalette.handleClick(clickX, clickY, contentX, contentY, panelWidth - padding * 2);
      
      // Get category after click
      const categoryAfter = entityPalette.currentCategory;
      
      return {
        success: true,
        clickPos: { x: clickX, y: clickY },
        categoryBefore: categoryBefore,
        categoryAfter: categoryAfter,
        clickResult: result,
        changed: categoryBefore !== categoryAfter
      };
    });
    
    console.log('Test 1 result:', JSON.stringify(test1, null, 2));
    
    if (!test1.success) {
      throw new Error(test1.error || 'Test 1 failed');
    }
    
    if (!test1.changed) {
      console.log('⚠️  WARNING: Category did not change! This is the BUG.');
      console.log(`   Category before: ${test1.categoryBefore}`);
      console.log(`   Category after: ${test1.categoryAfter}`);
      console.log(`   Click result: ${JSON.stringify(test1.clickResult)}`);
    } else {
      console.log(`✓ Category changed: ${test1.categoryBefore} → ${test1.categoryAfter}`);
    }
    
    // Force render after click
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot 2: After clicking Buildings
    await saveScreenshot(page, 'entity_palette_bugs/02_after_buildings_click', test1.changed);
    console.log('✓ Screenshot 2: After Buildings click');
    
    // Test 2: Click Resources button (third button)
    console.log('\\nTest 2: Clicking Resources button...');
    const test2 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      const entityPalette = window.levelEditor?.entityPalette;
      
      if (!panel || !entityPalette) {
        return { success: false, error: 'Panel or EntityPalette not found' };
      }
      
      const panelPos = { x: panel.config.position.x, y: panel.config.position.y };
      const panelWidth = panel.config.size.width;
      const titleBarHeight = 30;
      const padding = 10;
      
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      
      const buttonHeight = 30;
      const buttonWidth = (panelWidth - padding * 2) / 4;
      const clickX = contentX + (buttonWidth * 2.5); // Middle of third button
      const clickY = contentY + (buttonHeight / 2);
      
      const categoryBefore = entityPalette.currentCategory;
      const result = entityPalette.handleClick(clickX, clickY, contentX, contentY, panelWidth - padding * 2);
      const categoryAfter = entityPalette.currentCategory;
      
      return {
        success: true,
        clickPos: { x: clickX, y: clickY },
        categoryBefore: categoryBefore,
        categoryAfter: categoryAfter,
        clickResult: result,
        changed: categoryBefore !== categoryAfter
      };
    });
    
    console.log('Test 2 result:', JSON.stringify(test2, null, 2));
    
    if (!test2.success) {
      throw new Error(test2.error || 'Test 2 failed');
    }
    
    if (!test2.changed) {
      console.log('⚠️  WARNING: Category did not change! This is the BUG.');
    } else {
      console.log(`✓ Category changed: ${test2.categoryBefore} → ${test2.categoryAfter}`);
    }
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot 3: After clicking Resources
    await saveScreenshot(page, 'entity_palette_bugs/03_after_resources_click', test2.changed);
    console.log('✓ Screenshot 3: After Resources click');
    
    // Test 3: Click Custom button (fourth button)
    console.log('\\nTest 3: Clicking Custom button...');
    const test3 = await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-entity-palette');
      const entityPalette = window.levelEditor?.entityPalette;
      
      if (!panel || !entityPalette) {
        return { success: false, error: 'Panel or EntityPalette not found' };
      }
      
      const panelPos = { x: panel.config.position.x, y: panel.config.position.y };
      const panelWidth = panel.config.size.width;
      const titleBarHeight = 30;
      const padding = 10;
      
      const contentX = panelPos.x + padding;
      const contentY = panelPos.y + titleBarHeight + padding;
      
      const buttonHeight = 30;
      const buttonWidth = (panelWidth - padding * 2) / 4;
      const clickX = contentX + (buttonWidth * 3.5); // Middle of fourth button
      const clickY = contentY + (buttonHeight / 2);
      
      const categoryBefore = entityPalette.currentCategory;
      const result = entityPalette.handleClick(clickX, clickY, contentX, contentY, panelWidth - padding * 2);
      const categoryAfter = entityPalette.currentCategory;
      
      return {
        success: true,
        clickPos: { x: clickX, y: clickY },
        categoryBefore: categoryBefore,
        categoryAfter: categoryAfter,
        clickResult: result,
        changed: categoryBefore !== categoryAfter
      };
    });
    
    console.log('Test 3 result:', JSON.stringify(test3, null, 2));
    
    if (!test3.success) {
      throw new Error(test3.error || 'Test 3 failed');
    }
    
    if (!test3.changed) {
      console.log('⚠️  WARNING: Category did not change! This is the BUG.');
    } else {
      console.log(`✓ Category changed: ${test3.categoryBefore} → ${test3.categoryAfter}`);
    }
    
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot 4: After clicking Custom
    await saveScreenshot(page, 'entity_palette_bugs/04_after_custom_click', test3.changed);
    console.log('✓ Screenshot 4: After Custom click');
    
    // Final results
    console.log('\\n========================================');
    console.log('FINAL RESULTS:');
    console.log('========================================');
    console.log(`Test 1 (Buildings): ${test1.changed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 2 (Resources): ${test2.changed ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Test 3 (Custom):    ${test3.changed ? '✓ PASS' : '✗ FAIL'}`);
    
    const allPassed = test1.changed && test2.changed && test3.changed;
    
    if (allPassed) {
      console.log('\\n✓ All category button clicks working correctly!');
    } else {
      console.log('\\n✗ Some category buttons NOT working - BUG CONFIRMED');
    }
    
    await browser.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'entity_palette_bugs/error', false);
    await browser.close();
    process.exit(1);
  }
})();
