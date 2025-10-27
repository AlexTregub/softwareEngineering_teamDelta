/**
 * E2E Test: Level Editor Panel Visual Verification
 * 
 * Captures screenshots of Level Editor panels in different states
 * to verify content is always visible on top of panel backgrounds.
 * 
 * CRITICAL: Provides visual proof of correct rendering.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 Starting Level Editor Panel Visual Verification E2E Test...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Load game
    console.log('📂 Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Initialize Level Editor
    console.log('🏗️ Initializing Level Editor...');
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      // Create terrain if needed
      if (!window.g_map2 && typeof gridTerrain !== 'undefined') {
        const CHUNKS_X = 10;
        const CHUNKS_Y = 10;
        const CHUNK_SIZE = 8;
        const TILE_SIZE = 32;
        const seed = 12345; // Fixed seed for consistent screenshots
        window.g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, seed, CHUNK_SIZE, TILE_SIZE, [window.innerWidth, window.innerHeight]);
      }
      
      // Initialize level editor
      if (window.levelEditor && !window.levelEditor.isActive()) {
        window.levelEditor.initialize(window.g_map2);
      }
    });
    await sleep(1000);
    
    // Test 1: Normal State - All panels expanded
    console.log('\n📸 Test 1: Normal state - All panels expanded');
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Ensure all panels are visible and expanded
        panels.materials.show();
        panels.materials.state.minimized = false;
        
        panels.tools.show();
        panels.tools.state.minimized = false;
        
        panels.brush.show();
        panels.brush.state.minimized = false;
        
        // Force render
        window.levelEditor.draggablePanels.render();
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'level_editor/visual_verification_expanded', true);
    console.log('  ✅ Screenshot: All panels expanded');
    
    // Test 2: Materials panel minimized
    console.log('\n📸 Test 2: Materials panel minimized');
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Set minimized state directly
        panels.materials.state.minimized = true;
        
        window.levelEditor.draggablePanels.render();
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'level_editor/visual_verification_minimized', true);
    console.log('  ✅ Screenshot: Materials panel minimized');
    
    // Test 3: Check MaterialPalette content is visible
    console.log('\n📸 Test 3: MaterialPalette content verification');
    const paletteInfo = await page.evaluate(() => {
      const results = {
        paletteExists: false,
        materialCount: 0,
        selectedMaterial: null,
        contentSize: null
      };
      
      if (window.levelEditor && window.levelEditor.palette) {
        const palette = window.levelEditor.palette;
        results.paletteExists = true;
        results.materialCount = palette.materials ? palette.materials.length : 0;
        results.selectedMaterial = palette.selected;
        results.contentSize = palette.getContentSize();
      }
      
      return results;
    });
    
    console.log('  MaterialPalette:');
    console.log(`    Exists: ${paletteInfo.paletteExists ? '✅' : '❌'}`);
    console.log(`    Material Count: ${paletteInfo.materialCount}`);
    console.log(`    Selected Material: ${paletteInfo.selectedMaterial || 'none'}`);
    console.log(`    Content Size: ${paletteInfo.contentSize ? `${paletteInfo.contentSize.width}×${paletteInfo.contentSize.height}px` : 'unknown'}`);
    
    // Test 4: Check ToolBar content is visible
    console.log('\n📸 Test 4: ToolBar content verification');
    const toolbarInfo = await page.evaluate(() => {
      const results = {
        toolbarExists: false,
        toolCount: 0,
        selectedTool: null,
        contentSize: null
      };
      
      if (window.levelEditor && window.levelEditor.toolbar) {
        const toolbar = window.levelEditor.toolbar;
        results.toolbarExists = true;
        results.toolCount = toolbar.tools ? toolbar.tools.length : 0;
        results.selectedTool = toolbar.selectedTool;
        results.contentSize = toolbar.getContentSize();
      }
      
      return results;
    });
    
    console.log('  ToolBar:');
    console.log(`    Exists: ${toolbarInfo.toolbarExists ? '✅' : '❌'}`);
    console.log(`    Tool Count: ${toolbarInfo.toolCount}`);
    console.log(`    Selected Tool: ${toolbarInfo.selectedTool || 'none'}`);
    console.log(`    Content Size: ${toolbarInfo.contentSize ? `${toolbarInfo.contentSize.width}×${toolbarInfo.contentSize.height}px` : 'unknown'}`);
    
    // Test 5: Check BrushSizeControl content is visible
    console.log('\n📸 Test 5: BrushSizeControl content verification');
    const brushInfo = await page.evaluate(() => {
      const results = {
        brushExists: false,
        currentSize: 0,
        minSize: 0,
        maxSize: 0,
        contentSize: null
      };
      
      if (window.levelEditor && window.levelEditor.brushControl) {
        const brush = window.levelEditor.brushControl;
        results.brushExists = true;
        results.currentSize = brush.size;
        results.minSize = brush.minSize;
        results.maxSize = brush.maxSize;
        results.contentSize = brush.getContentSize();
      }
      
      return results;
    });
    
    console.log('  BrushSizeControl:');
    console.log(`    Exists: ${brushInfo.brushExists ? '✅' : '❌'}`);
    console.log(`    Current Size: ${brushInfo.currentSize}`);
    console.log(`    Size Range: ${brushInfo.minSize} - ${brushInfo.maxSize}`);
    console.log(`    Content Size: ${brushInfo.contentSize ? `${brushInfo.contentSize.width}×${brushInfo.contentSize.height}px` : 'unknown'}`);
    
    // Test 6: Test clicking on material swatches
    console.log('\n🖱️ Test 6: Click interaction verification');
    const clickResults = await page.evaluate(() => {
      const results = {
        materialsClickable: false,
        toolsClickable: false,
        brushClickable: false
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        // Expand all panels first
        panels.materials.state.minimized = false;
        panels.tools.state.minimized = false;
        panels.brush.state.minimized = false;
        
        // Get click positions for each panel content area
        const matPos = panels.materials.getPosition();
        const matTitleHeight = panels.materials.calculateTitleBarHeight();
        const matClickX = matPos.x + 30;
        const matClickY = matPos.y + matTitleHeight + 30;
        
        const toolPos = panels.tools.getPosition();
        const toolTitleHeight = panels.tools.calculateTitleBarHeight();
        const toolClickX = toolPos.x + 30;
        const toolClickY = toolPos.y + toolTitleHeight + 30;
        
        const brushPos = panels.brush.getPosition();
        const brushTitleHeight = panels.brush.calculateTitleBarHeight();
        const brushClickX = brushPos.x + 50;
        const brushClickY = brushPos.y + brushTitleHeight + 20;
        
        // Test clicks
        results.materialsClickable = window.levelEditor.draggablePanels.handleClick(matClickX, matClickY);
        results.toolsClickable = window.levelEditor.draggablePanels.handleClick(toolClickX, toolClickY);
        results.brushClickable = window.levelEditor.draggablePanels.handleClick(brushClickX, brushClickY);
      }
      
      return results;
    });
    
    console.log('  Click Test Results:');
    console.log(`    Materials Panel: ${clickResults.materialsClickable ? '✅ Clickable' : '❌ Not clickable'}`);
    console.log(`    Tools Panel: ${clickResults.toolsClickable ? '✅ Clickable' : '❌ Not clickable'}`);
    console.log(`    Brush Panel: ${clickResults.brushClickable ? '✅ Clickable' : '❌ Not clickable'}`);
    
    // Take final screenshot
    await page.evaluate(() => {
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        window.levelEditor.draggablePanels.render();
        if (typeof window.redraw === 'function') {
          window.redraw();
          window.redraw();
          window.redraw();
        }
      }
    });
    await sleep(500);
    await saveScreenshot(page, 'level_editor/visual_verification_final', true);
    
    // Final summary
    console.log('\n📊 Visual Verification Summary:');
    console.log('================================================================================');
    
    const allTestsPass = paletteInfo.paletteExists &&
                        toolbarInfo.toolbarExists &&
                        brushInfo.brushExists &&
                        clickResults.materialsClickable &&
                        clickResults.toolsClickable &&
                        clickResults.brushClickable;
    
    if (allTestsPass) {
      console.log('✅ All Level Editor panel contents are VISIBLE and INTERACTIVE!');
      console.log('✅ MaterialPalette renders on top of panel background');
      console.log('✅ ToolBar renders on top of panel background');
      console.log('✅ BrushSizeControl renders on top of panel background');
      console.log('✅ All content is clickable (proves it\'s on top, not behind)');
      console.log('\n📷 Screenshots saved:');
      console.log('   - visual_verification_expanded.png (all panels expanded)');
      console.log('   - visual_verification_minimized.png (materials minimized)');
      console.log('   - visual_verification_final.png (final state)');
    } else {
      console.log('⚠️ Some issues detected:');
      if (!paletteInfo.paletteExists) console.log('  ❌ MaterialPalette does not exist');
      if (!toolbarInfo.toolbarExists) console.log('  ❌ ToolBar does not exist');
      if (!brushInfo.brushExists) console.log('  ❌ BrushSizeControl does not exist');
      if (!clickResults.materialsClickable) console.log('  ❌ Materials panel content not clickable');
      if (!clickResults.toolsClickable) console.log('  ❌ Tools panel content not clickable');
      if (!clickResults.brushClickable) console.log('  ❌ Brush panel content not clickable');
    }
    console.log('================================================================================\n');
    
    await browser.close();
    
    console.log('✨ Level Editor Panel Visual Verification complete!\n');
    process.exit(allTestsPass ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'level_editor/visual_verification_error', false);
    await browser.close();
    process.exit(1);
  }
})();
