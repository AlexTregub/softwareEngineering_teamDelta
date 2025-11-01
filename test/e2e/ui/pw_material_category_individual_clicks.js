/**
 * E2E Test: Material Category Individual Click Detection
 * 
 * Purpose: Test each category individually with real mouse clicks
 * to verify that clicks on a category header toggle THAT category,
 * not a different one.
 * 
 * Bug Documentation:
 * - Simulates mouse clicks on each of the 6 categories
 * - Records actual click coordinates vs expected coordinates
 * - Verifies that the clicked category (and ONLY that category) toggles
 * - Takes screenshots showing which category was clicked vs which responded
 * 
 * Categories to test:
 * 1. Ground Materials (index 0)
 * 2. Stone Materials (index 1)
 * 3. Vegetation Materials (index 2)
 * 4. Water Materials (index 3)
 * 5. Cave Materials (index 4)
 * 6. Special Materials (index 5)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Starting Material Category Individual Click Test...\n');
    
    // Launch browser and navigate
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📂 Loading game at http://localhost:8000?test=1');
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // Ensure Level Editor started (NOT game)
    console.log('🎮 Ensuring Level Editor started...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    
    if (!editorStarted.started) {
      throw new Error(`❌ Failed to start Level Editor: ${editorStarted.error}`);
    }
    console.log('✅ Level Editor started\n');
    
    await sleep(1000);
    
    // Ensure Material Palette panel is visible
    console.log('🎨 Opening Material Palette panel...');
    await page.evaluate(() => {
      const state = 'LEVEL_EDITOR';
      
      // Ensure panel exists and is visible
      if (window.draggablePanelManager) {
        // Add to state visibility if not already there
        if (!window.draggablePanelManager.stateVisibility[state]) {
          window.draggablePanelManager.stateVisibility[state] = [];
        }
        
        if (!window.draggablePanelManager.stateVisibility[state].includes('level-editor-materials')) {
          window.draggablePanelManager.stateVisibility[state].push('level-editor-materials');
        }
        
        // Force render
        window.draggablePanelManager.renderPanels(state);
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    console.log('✅ Material Palette panel opened\n');
    
    // Get Material Palette panel info
    const panelInfo = await page.evaluate(() => {
      const draggablePanelManager = window.draggablePanelManager;
      if (!draggablePanelManager) {
        return { error: 'DraggablePanelManager not found' };
      }
      
      // Debug: List all available panels
      const availablePanels = Array.from(draggablePanelManager.panels.keys());
      
      const materialPalettePanel = draggablePanelManager.panels.get('level-editor-materials');
      if (!materialPalettePanel) {
        return { 
          error: 'Material Palette panel not found',
          availablePanels: availablePanels 
        };
      }
      
      // Get palette from levelEditor, not from panel.content
      if (!window.levelEditor || !window.levelEditor.palette) {
        return { error: 'LevelEditor.palette not found' };
      }
      
      const palette = window.levelEditor.palette;
      
      if (!palette.categories || palette.categories.length === 0) {
        return { error: 'No categories loaded in palette' };
      }
      
      // Get panel bounds (with defaults if not set)
      const panelX = materialPalettePanel.x || 10;
      const panelY = materialPalettePanel.y || 80;
      const panelWidth = materialPalettePanel.width || 250;
      
      // Calculate content area the SAME way LevelEditorPanels does
      const matPos = materialPalettePanel.getPosition();
      const titleBarHeight = materialPalettePanel.calculateTitleBarHeight();
      const padding = materialPalettePanel.config.style.padding;
      
      const contentX = matPos.x + padding;
      const contentY = matPos.y + titleBarHeight + padding;
      
      // Search bar
      const searchBarHeight = 45;
      
      // Get category info
      const categories = [];
      let currentY = contentY + searchBarHeight;
      
      palette.categories.forEach((category, index) => {
        const categoryHeight = category.getHeight();
        const categoryHeaderHeight = 30; // Fixed header height
        
        categories.push({
          index: index,
          name: category.name,
          currentState: category.expanded ? 'EXPANDED' : 'COLLAPSED',
          y: currentY,
          height: categoryHeight,
          headerHeight: categoryHeaderHeight,
          headerCenterY: currentY + (categoryHeaderHeight / 2)
        });
        
        currentY += categoryHeight;
      });
      
      return {
        panelX: matPos.x,
        panelY: matPos.y,
        panelWidth,
        titleBarHeight,
        padding,
        contentX,
        contentY,
        searchBarHeight,
        categories
      };
    });
    
    if (panelInfo.error) {
      if (panelInfo.availablePanels) {
        console.log(`Available panels: ${panelInfo.availablePanels.join(', ')}`);
      }
      throw new Error(`❌ ${panelInfo.error}`);
    }
    
    console.log('📊 Material Palette Panel Info:');
    console.log(`   Panel: (${panelInfo.panelX}, ${panelInfo.panelY}), Width: ${panelInfo.panelWidth}`);
    console.log(`   Title Bar Height: ${panelInfo.titleBarHeight}, Padding: ${panelInfo.padding}`);
    console.log(`   Content Area: (${panelInfo.contentX}, ${panelInfo.contentY})`);
    console.log(`   Search Bar Height: ${panelInfo.searchBarHeight}\n`);
    
    console.log('📋 Categories:');
    panelInfo.categories.forEach(cat => {
      console.log(`   ${cat.index}. ${cat.name}:`);
      console.log(`      State: ${cat.currentState}`);
      console.log(`      Y Position: ${cat.y}`);
      console.log(`      Total Height: ${cat.height}px`);
      console.log(`      Header Height: ${cat.headerHeight}px`);
      console.log(`      Header Center Y: ${cat.headerCenterY}`);
    });
    console.log('');
    
    // Test data to track results
    const testResults = [];
    let allTestsPassed = true;
    
    // Test each category individually
    for (const category of panelInfo.categories) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🎯 Testing Category ${category.index}: "${category.name}"`);
      console.log(`${'='.repeat(70)}\n`);
      
      // Calculate click coordinates (center of category header)
      const clickX = panelInfo.contentX + (panelInfo.panelWidth / 2);
      const clickY = category.headerCenterY;
      
      console.log(`📍 Click Coordinates:`);
      console.log(`   Expected Category: "${category.name}" (index ${category.index})`);
      console.log(`   Click X: ${clickX}`);
      console.log(`   Click Y: ${clickY}`);
      console.log(`   Initial State: ${category.currentState}\n`);
      
      // Perform click
      console.log(`🖱️  Clicking at (${clickX}, ${clickY})...`);
      
      // Enable console logging
      page.on('console', msg => {
        if (msg.text().includes('[MaterialPalette]') || msg.text().includes('[DEBUG]')) {
          console.log('   BROWSER:', msg.text());
        }
      });
      
      // Log the actual panelY/contentY being used
      await page.evaluate(() => {
        const matPanel = window.draggablePanelManager.panels.get('level-editor-materials');
        const matPos = matPanel.getPosition();
        const titleBarHeight = matPanel.calculateTitleBarHeight();
        const contentY = matPos.y + titleBarHeight + matPanel.config.style.padding;
        console.log(`[DEBUG] Panel position: ${matPos.y}, titleBarHeight: ${titleBarHeight}, padding: ${matPanel.config.style.padding}, contentY: ${contentY}`);
      });
      
      await page.mouse.click(clickX, clickY);
      await sleep(300);
      
      // Force redraw
      await page.evaluate(() => {
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
      });
      await sleep(200);
      
      // Check which category actually changed
      const afterClickState = await page.evaluate((targetIndex) => {
        const palette = window.levelEditor.palette;
        
        const states = [];
        palette.categories.forEach((cat, index) => {
          states.push({
            index: index,
            name: cat.name,
            state: cat.expanded ? 'EXPANDED' : 'COLLAPSED'
          });
        });
        
        return states;
      }, category.index);
      
      console.log(`\n📊 After Click States:`);
      afterClickState.forEach(cat => {
        const changed = cat.state !== panelInfo.categories[cat.index].currentState;
        const isTarget = cat.index === category.index;
        const marker = changed ? '🔄' : '  ';
        const highlight = isTarget ? '👉' : '  ';
        console.log(`   ${marker} ${highlight} ${cat.index}. ${cat.name}: ${cat.state}${changed ? ' (CHANGED)' : ''}`);
      });
      
      // Determine test result
      const targetCategory = afterClickState[category.index];
      const targetChanged = targetCategory.state !== category.currentState;
      
      // Check if any OTHER category changed
      const otherChanges = afterClickState.filter((cat, idx) => {
        return idx !== category.index && cat.state !== panelInfo.categories[idx].currentState;
      });
      
      const testPassed = targetChanged && otherChanges.length === 0;
      
      const result = {
        categoryIndex: category.index,
        categoryName: category.name,
        clickX: clickX,
        clickY: clickY,
        expectedCategory: category.name,
        initialState: category.currentState,
        afterState: targetCategory.state,
        targetChanged: targetChanged,
        otherChanges: otherChanges,
        passed: testPassed
      };
      
      testResults.push(result);
      
      console.log(`\n✅ Test Result:`);
      if (testPassed) {
        console.log(`   ✅ PASSED: Clicked "${category.name}", and ONLY "${category.name}" toggled`);
        console.log(`   State: ${category.currentState} → ${targetCategory.state}`);
      } else {
        allTestsPassed = false;
        console.log(`   ❌ FAILED: Click behavior incorrect!`);
        
        if (!targetChanged) {
          console.log(`   ❌ Problem: Clicked "${category.name}" but it did NOT toggle`);
          console.log(`      Expected: ${category.currentState} → ${category.currentState === 'EXPANDED' ? 'COLLAPSED' : 'EXPANDED'}`);
          console.log(`      Actual: ${category.currentState} → ${targetCategory.state}`);
        }
        
        if (otherChanges.length > 0) {
          console.log(`   ❌ Problem: Other categories changed unexpectedly:`);
          otherChanges.forEach(cat => {
            console.log(`      - "${cat.name}" (index ${cat.index}): ${panelInfo.categories[cat.index].currentState} → ${cat.state}`);
          });
        }
      }
      
      // Update panel info for next iteration
      panelInfo.categories[category.index].currentState = targetCategory.state;
      afterClickState.forEach((cat, idx) => {
        panelInfo.categories[idx].currentState = cat.state;
      });
      
      // CRITICAL: Recalculate Y positions after state changes
      // Query actual heights from browser (they depend on material counts)
      const updatedPositions = await page.evaluate(() => {
        const palette = window.levelEditor.palette;
        const matPanel = window.draggablePanelManager.panels.get('level-editor-materials');
        const matPos = matPanel.getPosition();
        const titleBarHeight = matPanel.calculateTitleBarHeight();
        const padding = matPanel.config.style.padding;
        const contentY = matPos.y + titleBarHeight + padding;
        
        let currentY = contentY + 45; // search bar
        const positions = [];
        
        palette.categories.forEach((category, index) => {
          const height = category.getHeight();
          positions.push({
            index,
            y: currentY,
            height,
            headerCenterY: currentY + 15
          });
          currentY += height;
        });
        
        return positions;
      });
      
      // Update positions
      updatedPositions.forEach(pos => {
        panelInfo.categories[pos.index].y = pos.y;
        panelInfo.categories[pos.index].height = pos.height;
        panelInfo.categories[pos.index].headerCenterY = pos.headerCenterY;
      });
    }
    
    // Summary
    console.log(`\n\n${'='.repeat(70)}`);
    console.log(`📊 TEST SUMMARY`);
    console.log(`${'='.repeat(70)}\n`);
    
    const passedCount = testResults.filter(r => r.passed).length;
    const failedCount = testResults.filter(r => !r.passed).length;
    
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`✅ Passed: ${passedCount}`);
    console.log(`❌ Failed: ${failedCount}\n`);
    
    if (failedCount > 0) {
      console.log(`\n🐛 BUG DETECTED: Category Click Mismatch\n`);
      console.log(`Failed Tests:\n`);
      
      testResults.filter(r => !r.passed).forEach(result => {
        console.log(`❌ Category: "${result.categoryName}" (index ${result.categoryIndex})`);
        console.log(`   Click Coordinates: (${result.clickX}, ${result.clickY})`);
        console.log(`   Expected: Click "${result.expectedCategory}" and toggle it`);
        
        if (!result.targetChanged) {
          console.log(`   ❌ Actual: Clicked "${result.categoryName}" but it did NOT toggle`);
        }
        
        if (result.otherChanges.length > 0) {
          console.log(`   ❌ Actual: Wrong categories toggled:`);
          result.otherChanges.forEach(cat => {
            console.log(`      - "${cat.name}" toggled instead`);
          });
        }
        console.log('');
      });
      
      console.log(`\n💡 Debugging Info:`);
      console.log(`   This suggests the Y-coordinate calculation in MaterialPalette.handleClick()`);
      console.log(`   is not correctly mapping click coordinates to categories.`);
      console.log(`   The click coordinates are correct (calculated from panel bounds + category positions),`);
      console.log(`   but handleClick() is determining the WRONG category from those coordinates.\n`);
    }
    
    // Take final screenshot
    await saveScreenshot(page, 'ui/material_category_individual_clicks', allTestsPassed);
    
    success = allTestsPassed;
    
    if (success) {
      console.log(`\n✅ SUCCESS: All categories respond correctly to individual clicks!\n`);
    } else {
      console.log(`\n❌ FAILURE: Category click detection bug confirmed!\n`);
    }
    
  } catch (error) {
    console.error(`\n❌ Test error: ${error.message}`);
    console.error(error.stack);
    success = false;
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(success ? 0 : 1);
  }
})();
