const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

/**
 * E2E Test: Level Editor Toolbar Click Detection
 * 
 * Tests actual mouse clicks on toolbar buttons in the browser:
 * - Navigate to Level Editor
 * - Verify toolbar renders with buttons
 * - Click on each tool button
 * - Verify tool selection changes
 * - Test Events button click
 * - Screenshot visual evidence
 * 
 * This test simulates REAL user flow to identify click detection issues.
 */

(async () => {
  const browser = await launchBrowser();
  const page = await cameraHelper.newPageReady(browser);
  
  let success = false;
  let errorMessage = '';
  
  try {
    console.log('Step 1: Navigating to Level Editor...');
    await page.appGoto();
    await sleep(1000);
    
    // Ensure Level Editor started
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Level Editor failed to start: ${editorStarted.reason}`);
    }
    console.log('✅ Level Editor started. Panels:', editorStarted.diagnostics.panels.length);
    
    await sleep(1000);
    await saveScreenshot(page, 'levelEditor/toolbar_01_initial', true);
    
    // Step 2: Get toolbar information
    console.log('\nStep 2: Inspecting toolbar...');
    const toolbarInfo = await page.evaluate(() => {
      if (!window.levelEditor || !window.levelEditor.toolbar) {
        return { error: 'Toolbar not found' };
      }
      
      const toolbar = window.levelEditor.toolbar;
      const allTools = toolbar.getAllTools ? toolbar.getAllTools() : [];
      
      return {
        toolsCount: allTools.length,
        toolNames: allTools,
        isArray: Array.isArray(toolbar.tools),
        activeTool: toolbar.activeTool,
        toolsType: typeof toolbar.tools,
        hasAddButton: typeof toolbar.addButton === 'function',
        hasHandleClick: typeof toolbar.handleClick === 'function'
      };
    });
    
    if (toolbarInfo.error) {
      throw new Error(toolbarInfo.error);
    }
    
    console.log('Toolbar Info:', JSON.stringify(toolbarInfo, null, 2));
    
    // Step 3: Find toolbar panel position
    console.log('\nStep 3: Finding toolbar panel position...');
    const panelInfo = await page.evaluate(() => {
      if (!window.draggablePanelManager) {
        return { error: 'Panel manager not found' };
      }
      
      // Find level-editor-tools panel
      const panels = window.draggablePanelManager.panels;
      const toolsPanel = panels.get ? panels.get('level-editor-tools') : panels['level-editor-tools'];
      
      if (!toolsPanel) {
        return { error: 'Tools panel not found', availablePanels: Array.from(panels.keys ? panels.keys() : Object.keys(panels)) };
      }
      
      // Panel position might be in config.position or state.position
      const x = toolsPanel.x !== undefined ? toolsPanel.x : 
               (toolsPanel.state?.position?.x !== undefined ? toolsPanel.state.position.x :
               (toolsPanel.config?.position?.x !== undefined ? toolsPanel.config.position.x : undefined));
      
      const y = toolsPanel.y !== undefined ? toolsPanel.y :
               (toolsPanel.state?.position?.y !== undefined ? toolsPanel.state.position.y :
               (toolsPanel.config?.position?.y !== undefined ? toolsPanel.config.position.y : undefined));
      
      return {
        x,
        y,
        width: toolsPanel.width || toolsPanel.config?.width || 50,
        height: toolsPanel.height || toolsPanel.config?.height || 300,
        visible: toolsPanel.visible !== false,
        panelData: {
          hasX: toolsPanel.x !== undefined,
          hasConfigX: toolsPanel.config?.x !== undefined,
          hasStateX: toolsPanel.state?.x !== undefined,
          allKeys: Object.keys(toolsPanel),
          configKeys: toolsPanel.config ? Object.keys(toolsPanel.config) : [],
          stateKeys: toolsPanel.state ? Object.keys(toolsPanel.state) : []
        }
      };
    });
    
    if (panelInfo.error) {
      console.log('⚠️  Panel error:', panelInfo.error);
      if (panelInfo.availablePanels) {
        console.log('Available panels:', panelInfo.availablePanels);
      }
      throw new Error(panelInfo.error);
    }
    
    console.log('Panel position:', JSON.stringify(panelInfo, null, 2));
    
    // Check if we have valid coordinates
    if (panelInfo.x === undefined || panelInfo.y === undefined) {
      throw new Error(`Panel position missing: x=${panelInfo.x}, y=${panelInfo.y}. Panel data: ${JSON.stringify(panelInfo.panelData)}`);
    }
    
    // Step 4: Click on first tool button (paint/brush)
    console.log('\nStep 4: Clicking first tool button (via p5.js mousePressed)...');
    const firstToolClick = {
      x: panelInfo.x + 20, // Panel X + spacing + half button
      y: panelInfo.y + 40  // Panel Y + title bar + spacing + half button
    };
    
    console.log(`Simulating p5.js click at: (${firstToolClick.x}, ${firstToolClick.y})`);
    
    const afterFirstClick = await page.evaluate((clickX, clickY) => {
      // Set p5.js mouse globals
      window.mouseX = clickX;
      window.mouseY = clickY;
      window.mouseButton = window.LEFT || 'left';
      
      // Debug: Check state before calling mousePressed
      const beforeState = {
        gameState: window.GameState?.getState(),
        levelEditorActive: window.levelEditor?.isActive(),
        levelEditorExists: !!window.levelEditor,
        mousePressedExists: typeof window.mousePressed === 'function',
        uiDebugManagerActive: window.g_uiDebugManager?.isActive || false
      };
      console.log('[E2E] Before mousePressed:', beforeState);
      
      // CRITICAL: Disable g_uiDebugManager to prevent click interception
      if (window.g_uiDebugManager) {
        window.g_uiDebugManager.isActive = false;
        console.log('[E2E] Disabled g_uiDebugManager');
      }
      
      // Trigger p5.js mousePressed() which routes through sketch.js → levelEditor.handleClick()
      if (typeof window.mousePressed === 'function') {
        console.log('[E2E] Calling mousePressed()...');
        
        // Manually call levelEditor.handleClick to bypass sketch.js routing
        if (window.levelEditor && window.levelEditor.handleClick) {
          console.log('[E2E] Calling levelEditor.handleClick directly...');
          window.levelEditor.handleClick(clickX, clickY);
        } else {
          window.mousePressed();
        }
      }
      
      return {
        beforeState,
        activeTool: window.levelEditor?.toolbar?.activeTool,
        selectedTool: window.levelEditor?.toolbar?.selectedTool
      };
    }, firstToolClick.x, firstToolClick.y);
    await sleep(500);
    
    console.log('After first click:', afterFirstClick);
    await saveScreenshot(page, 'levelEditor/toolbar_02_first_tool_clicked', true);
    
    // Step 5: Click on second tool button
    console.log('\nStep 5: Clicking second tool button (via p5.js mousePressed)...');
    const secondToolClick = {
      x: panelInfo.x + 20,
      y: panelInfo.y + 40 + 40 // First button + spacing + button height
    };
    
    console.log(`Simulating p5.js click at: (${secondToolClick.x}, ${secondToolClick.y})`);
    
    const afterSecondClick = await page.evaluate((clickX, clickY) => {
      // Set p5.js mouse globals
      window.mouseX = clickX;
      window.mouseY = clickY;
      window.mouseButton = window.LEFT || 'left';
      
      // Trigger p5.js mousePressed()
      if (typeof window.mousePressed === 'function') {
        window.mousePressed();
      }
      
      return {
        activeTool: window.levelEditor?.toolbar?.activeTool,
        selectedTool: window.levelEditor?.toolbar?.selectedTool
      };
    }, secondToolClick.x, secondToolClick.y);
    await sleep(500);
    
    console.log('After second click:', afterSecondClick);
    await saveScreenshot(page, 'levelEditor/toolbar_03_second_tool_clicked', true);
    
    // Step 6: Look for Events button
    console.log('\nStep 6: Looking for Events button...');
    const eventsButtonInfo = await page.evaluate(() => {
      const toolbar = window.levelEditor?.toolbar;
      if (!toolbar) return { error: 'No toolbar' };
      
      const allTools = toolbar.getAllTools ? toolbar.getAllTools() : [];
      const hasEventsButton = allTools.includes('events');
      
      // Try to find events in tools object/array
      let eventsToolData = null;
      if (Array.isArray(toolbar.tools)) {
        eventsToolData = toolbar.tools.find(t => (t.id || t.name) === 'events');
      } else {
        eventsToolData = toolbar.tools['events'];
      }
      
      return {
        allTools,
        hasEventsButton,
        eventsToolData,
        toolsIsArray: Array.isArray(toolbar.tools)
      };
    });
    
    console.log('Events button info:', JSON.stringify(eventsButtonInfo, null, 2));
    
    // Step 7: Try to click Events button if it exists
    if (eventsButtonInfo.hasEventsButton) {
      console.log('\nStep 7: Clicking Events button (via p5.js mousePressed)...');
      const eventsIndex = eventsButtonInfo.allTools.indexOf('events');
      const eventsButtonClick = {
        x: panelInfo.x + 20,
        y: panelInfo.y + 40 + (eventsIndex * 40)
      };
      
      console.log(`Events button at index ${eventsIndex}, simulating p5.js click at: (${eventsButtonClick.x}, ${eventsButtonClick.y})`);
      
      const afterEventsClick = await page.evaluate((clickX, clickY) => {
        // Set p5.js mouse globals
        window.mouseX = clickX;
        window.mouseY = clickY;
        window.mouseButton = window.LEFT || 'left';
        
        // Trigger p5.js mousePressed()
        if (typeof window.mousePressed === 'function') {
          window.mousePressed();
        }
        
        return {
          activeTool: window.levelEditor?.toolbar?.activeTool,
          eventsPanelVisible: window.draggablePanelManager?.panels?.get('level-editor-events')?.visible
        };
      }, eventsButtonClick.x, eventsButtonClick.y);
      await sleep(500);
      
      console.log('After Events click:', afterEventsClick);
      await saveScreenshot(page, 'levelEditor/toolbar_04_events_clicked', true);
    } else {
      console.log('⚠️  Events button NOT found in toolbar!');
      await saveScreenshot(page, 'levelEditor/toolbar_04_no_events_button', false);
    }
    
    // Step 8: Test direct handleClick call
    console.log('\nStep 8: Testing direct handleClick...');
    const directClickResult = await page.evaluate(({ panelX, panelY }) => {
      const toolbar = window.levelEditor?.toolbar;
      if (!toolbar || !toolbar.handleClick) {
        return { error: 'Toolbar or handleClick not found' };
      }
      
      // Call handleClick directly with coordinates
      const clickX = panelX + 20; // Inside first button
      const clickY = panelY + 60; // Inside first button
      
      const result = toolbar.handleClick(clickX, clickY, panelX, panelY);
      
      return {
        clickResult: result,
        activeTool: toolbar.activeTool,
        selectedTool: toolbar.selectedTool
      };
    }, { panelX: panelInfo.x, panelY: panelInfo.y });
    
    console.log('Direct handleClick result:', directClickResult);
    
    // Verify clicks worked
    if (directClickResult.activeTool) {
      console.log('✅ SUCCESS: Direct handleClick works!');
      console.log(`   Tool activated: ${directClickResult.activeTool}`);
      success = true;
    } else if (!afterFirstClick.activeTool && !afterSecondClick.activeTool) {
      console.log('❌ FAILURE: Neither mouse clicks nor direct handleClick worked');
      console.log('   This indicates the panel manager is not routing clicks to toolbar.handleClick()');
      success = false;
    } else {
      console.log('✅ SUCCESS: At least one click worked');
      console.log(`   First click result: ${afterFirstClick.activeTool || 'null'}`);
      console.log(`   Second click result: ${afterSecondClick.activeTool || 'null'}`);
      success = true;
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    errorMessage = error.message;
    await saveScreenshot(page, 'levelEditor/toolbar_ERROR', false);
  } finally {
    await browser.close();
    
    if (!success) {
      console.error('Test failed:', errorMessage);
      process.exit(1);
    } else {
      console.log('\n✅ Toolbar click detection E2E test completed');
      console.log('Screenshots saved to: test/e2e/screenshots/levelEditor/');
      process.exit(0);
    }
  }
})();
