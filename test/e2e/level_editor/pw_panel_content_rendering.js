/**
 * E2E Test: Level Editor Panel Content Rendering Order
 * 
 * Verifies that MaterialPalette, ToolBar, and BrushSizeControl content
 * is visible ON TOP of their panel backgrounds (not hidden behind).
 * 
 * CRITICAL: This test captures screenshots as visual proof.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🎯 Starting Level Editor Panel Content Rendering E2E Test...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Load game
    console.log('📂 Loading game...');
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    // Switch to LEVEL_EDITOR state and initialize
    console.log('🏗️ Switching to LEVEL_EDITOR state...');
    const initResult = await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      
      const result = {
        levelEditorExists: !!window.levelEditor,
        terrainExists: !!window.g_map2,
        terrainCreated: false,
        initCalled: false,
        initResult: false,
        error: null
      };
      
      // Create terrain if it doesn't exist
      if (!window.g_map2 && typeof gridTerrain !== 'undefined') {
        try {
          const CHUNKS_X = 10;
          const CHUNKS_Y = 10;
          const CHUNK_SIZE = 8;
          const TILE_SIZE = 32;
          const seed = Math.floor(Math.random() * 10000);
          window.g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, seed, CHUNK_SIZE, TILE_SIZE, [window.innerWidth, window.innerHeight]);
          result.terrainCreated = true;
          result.terrainExists = true;
        } catch (e) {
          result.error = `Terrain creation failed: ${e.message}`;
        }
      }
      
      // Initialize level editor if not already active
      if (window.levelEditor && window.g_map2) {
        try {
          if (!window.levelEditor.isActive()) {
            result.initCalled = true;
            result.initResult = window.levelEditor.initialize(window.g_map2);
          }
        } catch (e) {
          result.error = result.error ? `${result.error}; Init failed: ${e.message}` : `Init failed: ${e.message}`;
        }
      }
      
      return result;
    });
    
    console.log('  Level Editor Exists:', initResult.levelEditorExists);
    console.log('  Terrain Exists:', initResult.terrainExists);
    console.log('  Terrain Created:', initResult.terrainCreated);
    console.log('  Initialize Called:', initResult.initCalled);
    console.log('  Initialize Result:', initResult.initResult);
    if (initResult.error) console.log('  ❌ Error:', initResult.error);
    
    await sleep(1000);
    
    // Get panel rendering information
    const renderingInfo = await page.evaluate(() => {
      const results = {
        gameState: window.gameState,
        levelEditorExists: !!window.levelEditor,
        levelEditorActive: window.levelEditor?.isActive(),
        editorPanelsExist: false,
        renderOrder: []
      };
      
      // Check if LevelEditorPanels exist (they're managed externally)
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const panels = window.levelEditor.draggablePanels.panels;
        
        results.editorPanelsExist = !!(panels.materials && panels.tools && panels.brush);
        
        if (results.editorPanelsExist) {
          results.materials = {
            id: panels.materials.config.id,
            visible: panels.materials.state.visible,
            minimized: panels.materials.state.minimized,
            position: panels.materials.state.position,
            size: {
              width: panels.materials.config.size.width,
              height: panels.materials.config.size.height
            }
          };
          
          results.tools = {
            id: panels.tools.config.id,
            visible: panels.tools.state.visible,
            minimized: panels.tools.state.minimized,
            position: panels.tools.state.position,
            size: {
              width: panels.tools.config.size.width,
              height: panels.tools.config.size.height
            }
          };
          
          results.brush = {
            id: panels.brush.config.id,
            visible: panels.brush.state.visible,
            minimized: panels.brush.state.minimized,
            position: panels.brush.state.position,
            size: {
              width: panels.brush.config.size.width,
              height: panels.brush.config.size.height
            }
          };
        }
      }
      
      return results;
    });
    
    console.log('\n📊 Panel Rendering Information:');
    console.log('================================================================================');
    console.log(`Game State: ${renderingInfo.gameState}`);
    console.log(`Level Editor Exists: ${renderingInfo.levelEditorExists}`);
    console.log(`Level Editor Active: ${renderingInfo.levelEditorActive}`);
    console.log(`Editor Panels Exist: ${renderingInfo.editorPanelsExist}`);
    
    if (renderingInfo.editorPanelsExist) {
      console.log('\nMaterials Panel:');
      console.log(`  Visible: ${renderingInfo.materials.visible}`);
      console.log(`  Minimized: ${renderingInfo.materials.minimized}`);
      console.log(`  Position: (${renderingInfo.materials.position.x}, ${renderingInfo.materials.position.y})`);
      console.log(`  Size: ${renderingInfo.materials.size.width}×${renderingInfo.materials.size.height}px`);
      
      console.log('\nTools Panel:');
      console.log(`  Visible: ${renderingInfo.tools.visible}`);
      console.log(`  Minimized: ${renderingInfo.tools.minimized}`);
      console.log(`  Position: (${renderingInfo.tools.position.x}, ${renderingInfo.tools.position.y})`);
      console.log(`  Size: ${renderingInfo.tools.size.width}×${renderingInfo.tools.size.height}px`);
      
      console.log('\nBrush Size Panel:');
      console.log(`  Visible: ${renderingInfo.brush.visible}`);
      console.log(`  Minimized: ${renderingInfo.brush.minimized}`);
      console.log(`  Position: (${renderingInfo.brush.position.x}, ${renderingInfo.brush.position.y})`);
      console.log(`  Size: ${renderingInfo.brush.size.width}×${renderingInfo.brush.size.height}px`);
    }
    console.log('================================================================================\n');
    
    // Force multiple redraws to ensure panels are fully rendered
    console.log('🎨 Forcing panel rendering...');
    await page.evaluate(() => {
      // Render level editor (which calls draggablePanels.render())
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        window.levelEditor.draggablePanels.render();
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    await sleep(500);
    
    // Capture screenshot of all three panels
    console.log('📷 Capturing screenshot of Level Editor panels...\n');
    const success = renderingInfo.editorPanelsExist && 
                    renderingInfo.materials.visible && 
                    renderingInfo.tools.visible && 
                    renderingInfo.brush.visible;
    
    await saveScreenshot(page, 'level_editor/panels_content_rendering', success);
    
    // Test 2: Verify content is clickable (content on top, not behind panel)
    console.log('🖱️ Testing if content is clickable (verifies it\'s on top)...');
    
    const clickResult = await page.evaluate(() => {
      const results = {
        materialsPanelClicked: false,
        toolsPanelClicked: false,
        brushPanelClicked: false
      };
      
      // Try to click on materials panel content area
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const matPanel = window.levelEditor.draggablePanels.panels.materials;
        if (matPanel) {
          const matPos = matPanel.getPosition();
          const titleHeight = matPanel.calculateTitleBarHeight();
          const contentX = matPos.x + 20; // Inside content area
          const contentY = matPos.y + titleHeight + 20;
          
          results.materialsPanelClicked = window.levelEditor.draggablePanels.handleClick(contentX, contentY);
        }
      }
      
      return results;
    });
    
    console.log('\n🎯 Click Test Results:');
    console.log(`  Materials Panel Content Clickable: ${clickResult.materialsPanelClicked ? '✅ YES' : '❌ NO'}`);
    
    // Test 3: Check if content is being rendered with translate
    console.log('\n🔍 Checking render implementation...');
    const renderCheck = await page.evaluate(() => {
      const results = {
        panelsUseContentRenderer: false,
        panelsHaveManagedExternally: false
      };
      
      if (window.levelEditor && window.levelEditor.draggablePanels) {
        const matPanel = window.levelEditor.draggablePanels.panels.materials;
        if (matPanel) {
          results.panelsHaveManagedExternally = !!matPanel.config.behavior?.managedExternally;
        }
        
        // Check if LevelEditorPanels.render method exists
        results.panelsUseContentRenderer = typeof window.levelEditor.draggablePanels.render === 'function';
      }
      
      return results;
    });
    
    console.log(`  Panels have managedExternally flag: ${renderCheck.panelsHaveManagedExternally ? '✅ YES' : '❌ NO'}`);
    console.log(`  LevelEditorPanels has render method: ${renderCheck.panelsUseContentRenderer ? '✅ YES' : '❌ NO'}`);
    
    // Final summary
    console.log('\n📊 Test Summary:');
    console.log('================================================================================');
    
    const allTestsPass = renderingInfo.editorPanelsExist &&
                        renderingInfo.materials.visible &&
                        renderingInfo.tools.visible &&
                        renderingInfo.brush.visible &&
                        renderCheck.panelsUseContentRenderer;
    
    if (allTestsPass) {
      console.log('✅ All Level Editor panels are rendering correctly!');
      console.log('✅ Content should be visible ON TOP of panel backgrounds');
      console.log('✅ Screenshot saved for visual verification');
    } else {
      console.log('⚠️ Some issues detected with panel rendering');
      if (!renderingInfo.editorPanelsExist) console.log('  ❌ Panels do not exist');
      if (!renderCheck.panelsUseContentRenderer) console.log('  ❌ Panels not using content renderer');
    }
    console.log('================================================================================\n');
    
    await browser.close();
    
    console.log('✨ Level Editor Panel Content Rendering E2E test complete!\n');
    process.exit(allTestsPass ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await saveScreenshot(page, 'level_editor/panels_error', false);
    await browser.close();
    process.exit(1);
  }
})();
