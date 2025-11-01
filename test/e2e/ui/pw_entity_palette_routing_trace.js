/**
 * E2E Test: Trace LevelEditor.handleMouseWheel Routing
 * 
 * Test Strategy:
 * Log which delegation path is taken in LevelEditor.handleMouseWheel
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 LevelEditor.handleMouseWheel Routing Trace');
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  console.log('⏳ Entering Level Editor...');
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(1000);
  
  // Show Entity Palette
  console.log('⏳ Showing Entity Palette...');
  await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (panel) {
      panel.show();
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    }
  });
  
  await sleep(500);
  
  // Wrap LevelEditor.handleMouseWheel to log routing
  await page.evaluate(() => {
    window._routingLog = [];
    
    const originalHandleMouseWheel = window.levelEditor.handleMouseWheel.bind(window.levelEditor);
    window.levelEditor.handleMouseWheel = function(event, shiftKey, mouseX, mouseY) {
      const log = { checks: [] };
      
      // Log active state
      log.active = this.active;
      if (!this.active) {
        log.checks.push('NOT_ACTIVE');
        return false;
      }
      
      // Log mouse position
      log.mouseX = mouseX;
      log.mouseY = mouseY;
      
      // Sidebar check
      if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.sidebar) {
        const sidebarPanel = this.levelEditorPanels.panels.sidebar;
        const sidebarVisible = sidebarPanel.state && sidebarPanel.state.visible;
        const sidebarMinimized = sidebarPanel.state && sidebarPanel.state.minimized;
        
        log.checks.push({
          name: 'SIDEBAR',
          visible: sidebarVisible,
          minimized: sidebarMinimized,
          hasSidebar: !!this.sidebar
        });
        
        if (sidebarVisible && !sidebarMinimized && this.sidebar) {
          const pos = sidebarPanel.state.position;
          const width = this.sidebar.width || 250;
          const height = this.sidebar.height || 600;
          const mouseOver = mouseX >= pos.x && mouseX <= pos.x + width &&
                           mouseY >= pos.y && mouseY <= pos.y + height;
          
          log.checks[log.checks.length - 1].bounds = { x: pos.x, y: pos.y, width, height };
          log.checks[log.checks.length - 1].mouseOver = mouseOver;
          
          if (mouseOver) {
            const delta = event.deltaY || event.delta || 0;
            const handled = this.sidebar.handleMouseWheel(delta, mouseX, mouseY);
            log.checks[log.checks.length - 1].handled = handled;
            
            if (handled) {
              log.consumedBy = 'SIDEBAR';
              window._routingLog.push(log);
              return true;
            }
          }
        }
      }
      
      // Entity Palette check
      if (this.levelEditorPanels && this.levelEditorPanels.handleMouseWheel) {
        log.checks.push({
          name: 'ENTITY_PALETTE',
          hasPanels: true
        });
        
        const delta = event.deltaY || event.delta || 0;
        const handled = this.levelEditorPanels.handleMouseWheel(delta, mouseX, mouseY);
        log.checks[log.checks.length - 1].handled = handled;
        
        if (handled) {
          log.consumedBy = 'ENTITY_PALETTE';
          window._routingLog.push(log);
          return true;
        }
      }
      
      // Materials panel check
      if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.materials) {
        const materialsPanel = this.levelEditorPanels.panels.materials;
        const materialsVisible = materialsPanel.state && materialsPanel.state.visible;
        const materialsMinimized = materialsPanel.state && materialsPanel.state.minimized;
        
        log.checks.push({
          name: 'MATERIALS',
          visible: materialsVisible,
          minimized: materialsMinimized,
          hasPalette: !!this.palette
        });
        
        if (materialsVisible && !materialsMinimized && this.palette) {
          const pos = materialsPanel.state.position;
          const width = this.palette.width || 400;
          const height = this.palette.height || 500;
          const mouseOver = mouseX >= pos.x && mouseX <= pos.x + width &&
                           mouseY >= pos.y && mouseY <= pos.y + height;
          
          log.checks[log.checks.length - 1].bounds = { x: pos.x, y: pos.y, width, height };
          log.checks[log.checks.length - 1].mouseOver = mouseOver;
          
          if (mouseOver) {
            const delta = event.deltaY || event.delta || 0;
            this.palette.handleMouseWheel(delta);
            log.consumedBy = 'MATERIALS';
            window._routingLog.push(log);
            return true;
          }
        }
      }
      
      log.consumedBy = 'NONE';
      window._routingLog.push(log);
      return false;
    };
  });
  
  // Get panel center
  const panelInfo = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return null;
    
    const pos = panel.getPosition();
    const width = panel.state.width || 220;
    const titleBarHeight = panel.calculateTitleBarHeight();
    
    return {
      centerX: Math.floor(pos.x + width / 2),
      centerY: Math.floor(pos.y + titleBarHeight + 50)
    };
  });
  
  console.log('Panel center:', panelInfo.centerX, panelInfo.centerY);
  
  // Call handleMouseWheel
  console.log('\n🖱️  Calling LevelEditor.handleMouseWheel...\n');
  
  await page.evaluate((mouseX, mouseY) => {
    const mockEvent = {
      deltaY: 100,
      delta: 100,
      preventDefault: () => {}
    };
    
    window.levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
  }, panelInfo.centerX, panelInfo.centerY);
  
  await sleep(200);
  
  // Get routing log
  const routingLog = await page.evaluate(() => window._routingLog);
  
  if (routingLog.length === 0) {
    console.log('❌ handleMouseWheel was NOT CALLED');
    await browser.close();
    process.exit(1);
  }
  
  const log = routingLog[0];
  
  console.log('Active:', log.active);
  console.log('Mouse Position:', log.mouseX, log.mouseY);
  console.log('\nDelegation Checks:');
  
  log.checks.forEach(check => {
    console.log(`\n  ${check.name}:`);
    console.log('    visible:', check.visible);
    console.log('    minimized:', check.minimized);
    if (check.bounds) {
      console.log('    bounds:', check.bounds);
      console.log('    mouseOver:', check.mouseOver);
    }
    console.log('    handled:', check.handled);
  });
  
  console.log('\n==================================================');
  console.log('Event consumed by:', log.consumedBy);
  console.log('==================================================');
  
  const success = log.consumedBy === 'ENTITY_PALETTE';
  
  if (!success) {
    console.log('\n❌ Event NOT routed to Entity Palette');
    if (log.consumedBy === 'SIDEBAR') {
      console.log('Issue: Sidebar consumed the event');
    } else if (log.consumedBy === 'MATERIALS') {
      console.log('Issue: Materials panel consumed the event');
    } else {
      console.log('Issue: No delegation handled the event');
    }
  } else {
    console.log('\n✅ Event correctly routed to Entity Palette');
  }
  
  await saveScreenshot(page, 'ui/entity_palette_routing_trace', success);
  await browser.close();
  process.exit(success ? 0 : 1);
})();
