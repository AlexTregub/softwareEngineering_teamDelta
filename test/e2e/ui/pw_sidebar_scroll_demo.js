/**
 * E2E Test: Sidebar Scrolling Demonstration
 * 
 * Purpose: Visually demonstrate the sidebar with many items requiring scrolling
 * 
 * Expected behavior:
 * - Sidebar panel appears in LEVEL_EDITOR mode
 * - Contains many buttons/items (more than fit in viewport)
 * - Scroll indicators appear (top/bottom arrows)
 * - Mouse wheel scrolling works
 * - Content scrolls smoothly
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  console.log('🎬 Starting E2E test: Sidebar scrolling demonstration\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass menu)
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('❌ Game failed to start - still on menu');
    }
    console.log('✅ Game started successfully\n');
    
    // Wait longer for terrain to fully initialize
    console.log('⏳ Waiting for terrain to initialize...');
    await sleep(2000); // Give it time to create terrain
    
    // Check terrain status
    const terrainStatus = await page.evaluate(() => {
      return {
        g_activeMap: typeof window.g_activeMap !== 'undefined' && window.g_activeMap !== null,
        g_activeMapType: typeof window.g_activeMap,
        MapManager: typeof window.MapManager !== 'undefined',
        gameState: window.gameState || window.GameState?.currentState
      };
    });
    
    console.log(`Terrain status:`, terrainStatus);
    console.log('');
    
    // Initialize Level Editor with terrain
    console.log('🔧 Initializing Level Editor...');
    const initResult = await page.evaluate(() => {
      if (!window.levelEditor) {
        return { success: false, message: 'window.levelEditor not found' };
      }
      
      // Check if already initialized
      if (window.levelEditor.terrain && window.levelEditor.levelEditorPanels) {
        return { 
          success: true, 
          message: 'Level Editor already initialized',
          alreadyInit: true 
        };
      }
      
      // Find terrain (use g_activeMap)
      const terrain = window.g_activeMap;
      
      if (!terrain) {
        return { success: false, message: 'g_activeMap terrain not found after waiting' };
      }
      
      window.levelEditor.initialize(terrain);
      
      // Check sidebar creation
      const checks = {
        levelEditorPanels: typeof window.levelEditor.levelEditorPanels !== 'undefined',
        sidebarInstance: typeof window.levelEditor.levelEditorPanels?.sidebar !== 'undefined',
        panelsSidebar: typeof window.levelEditor.levelEditorPanels?.panels?.sidebar !== 'undefined'
      };
      
      return{
        success: true,
        message: 'Level Editor initialized',
        alreadyInit: false,
        ...checks
      };
    });
    
    if (!initResult.success) {
      throw new Error(`❌ ${initResult.message}`);
    }
    console.log(`✅ ${initResult.message}`);
    if (!initResult.alreadyInit) {
      console.log(`   LevelEditorPanels: ${initResult.levelEditorPanels}`);
      console.log(`   Sidebar instance: ${initResult.sidebarInstance}`);
      console.log(`   Panel wrapper: ${initResult.panelsSidebar}\n`);
    }
    
    // Wait for panels to initialize
    await sleep(500);
    
    // Show the sidebar panel
    console.log('📂 Opening sidebar panel...');
    const showResult = await page.evaluate(() => {
      const manager = window.draggablePanelManager;
      const panel = manager.panels.get('level-editor-sidebar');
      
      if (!panel) {
        return { success: false, message: 'Sidebar panel not found' };
      }
      
      // Show the panel
      panel.show();
      
      // Add to LEVEL_EDITOR stateVisibility
      if (!manager.stateVisibility.LEVEL_EDITOR) {
        manager.stateVisibility.LEVEL_EDITOR = [];
      }
      if (!manager.stateVisibility.LEVEL_EDITOR.includes('level-editor-sidebar')) {
        manager.stateVisibility.LEVEL_EDITOR.push('level-editor-sidebar');
      }
      
      // Force render
      window.gameState = 'LEVEL_EDITOR';
      manager.gameState = 'LEVEL_EDITOR';
      
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      
      // Multiple redraws for layers
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
      
      // Get panel info
      const visible = panel.state.visible;
      const minimized = panel.state.minimized;
      const pos = panel.getPosition();
      const size = panel.getSize();
      
      return {
        success: true,
        visible,
        minimized,
        position: pos,
        size,
        message: 'Sidebar shown'
      };
    });
    
    if (!showResult.success) {
      throw new Error(`❌ ${showResult.message}`);
    }
    
    console.log(`✅ Sidebar panel status:`);
    console.log(`   Visible: ${showResult.visible}`);
    console.log(`   Minimized: ${showResult.minimized}`);
    console.log(`   Position: (${showResult.position.x}, ${showResult.position.y})`);
    console.log(`   Size: ${showResult.size.width}x${showResult.size.height}\n`);
    
    // Wait for render
    await sleep(500);
    
    // Capture screenshot at top
    console.log('📸 Capturing screenshot - top of scroll');
    await saveScreenshot(page, 'sidebar_scroll/01_top', true);
    
    // Scroll down a bit
    console.log('📜 Scrolling down...');
    await page.evaluate(() => {
      const panel = window.draggablePanelManager.panels.get('level-editor-sidebar');
      const levelEditorPanels = window.levelEditor?.levelEditorPanels;
      const sidebar = levelEditorPanels?.sidebar;
      
      if (sidebar) {
        // Simulate mouse wheel scrolling (positive delta = scroll down)
        sidebar.handleMouseWheel(300, 150, 70); // delta, mouseX, mouseY
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    console.log('📸 Capturing screenshot - middle of scroll');
    await saveScreenshot(page, 'sidebar_scroll/02_middle', true);
    
    // Scroll to bottom
    console.log('📜 Scrolling to bottom...');
    await page.evaluate(() => {
      const levelEditorPanels = window.levelEditor?.levelEditorPanels;
      const sidebar = levelEditorPanels?.sidebar;
      
      if (sidebar) {
        // Large scroll down
        sidebar.handleMouseWheel(1000, 150, 70);
      }
      
      // Force redraw
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(300);
    console.log('📸 Capturing screenshot - bottom of scroll');
    await saveScreenshot(page, 'sidebar_scroll/03_bottom', true);
    
    // Get scroll stats
    const scrollStats = await page.evaluate(() => {
      const levelEditorPanels = window.levelEditor?.levelEditorPanels;
      const sidebar = levelEditorPanels?.sidebar;
      
      if (!sidebar) {
        return { hasOverflow: false };
      }
      
      return {
        hasOverflow: sidebar.hasOverflow(),
        scrollOffset: sidebar.getScrollOffset(),
        maxScrollOffset: sidebar.getMaxScrollOffset(),
        itemCount: sidebar.getContentItems().length
      };
    });
    
    console.log('\n📊 Scroll Statistics:');
    console.log(`   Has overflow: ${scrollStats.hasOverflow}`);
    console.log(`   Item count: ${scrollStats.itemCount}`);
    console.log(`   Scroll offset: ${scrollStats.scrollOffset}`);
    console.log(`   Max scroll: ${scrollStats.maxScrollOffset}\n`);
    
    console.log('✅ Sidebar scrolling demonstration COMPLETE');
    console.log('📁 Screenshots saved to: test/e2e/screenshots/sidebar_scroll/\n');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await saveScreenshot(page, 'sidebar_scroll/error', false);
    await browser.close();
    process.exit(1);
  }
})();
