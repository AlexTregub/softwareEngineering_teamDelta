/**
 * E2E Test: Verify Panel Object Identity
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Panel Object Identity Check');
  
  await page.goto('http://localhost:8000?test=1');
  await sleep(1000);
  
  // Enter Level Editor
  await page.evaluate(() => {
    if (window.GameState && typeof window.GameState.setState === 'function') {
      window.GameState.setState('LEVEL_EDITOR');
    }
    if (window.levelEditor && window.g_map2) {
      window.levelEditor.initialize(window.g_map2);
    }
  });
  
  await sleep(1000);
  
  // Check if panels are the same object
  const check = await page.evaluate(() => {
    const globalPanel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    const localPanel = window.levelEditor?.levelEditorPanels?.panels?.entityPalette;
    
    if (!globalPanel) return { error: 'Global panel not found' };
    if (!localPanel) return { error: 'Local panel not found' };
    
    return {
      sameObject: globalPanel === localPanel,
      globalVisible: globalPanel.state.visible,
      localVisible: localPanel.state.visible,
      globalPos: globalPanel.state.position,
      localPos: localPanel.state.position
    };
  });
  
  console.log('Panel Identity Check:');
  console.log('  Same object:', check.sameObject);
  console.log('  Global visible:', check.globalVisible);
  console.log('  Local visible:', check.localVisible);
  console.log('  Global position:', check.globalPos);
  console.log('  Local position:', check.localPos);
  
  if (check.sameObject) {
    console.log('\n✅ Panels are the SAME object');
    console.log('Visibility states should sync automatically');
  } else {
    console.log('\n❌ Panels are DIFFERENT objects');
    console.log('This is a registration bug');
  }
  
  // Now show the panel and check again
  console.log('\n🖱️  Calling panel.show()...');
  
  const showResult = await page.evaluate(() => {
    const panel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    if (!panel) return { error: 'Panel not found' };
    
    const before = panel.state.visible;
    
    // Wrap show() to log
    panel.show();
    
    const after = panel.state.visible;
    
    if (window.draggablePanelManager) {
      window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      showCalled: true,
      before,
      after
    };
  });
  
  console.log('show() result:', showResult);
  
  await sleep(500);
  
  const afterShow = await page.evaluate(() => {
    const globalPanel = window.draggablePanelManager?.panels.get('level-editor-entity-palette');
    const localPanel = window.levelEditor?.levelEditorPanels?.panels?.entityPalette;
    
    return {
      globalVisible: globalPanel?.state.visible,
      localVisible: localPanel?.state.visible
    };
  });
  
  console.log('\nAfter calling show():');
  console.log('  Global visible:', afterShow.globalVisible);
  console.log('  Local visible:', afterShow.localVisible);
  
  if (afterShow.globalVisible === afterShow.localVisible) {
    console.log('\n✅ Visibility states ARE synced');
  } else {
    console.log('\n❌ Visibility states NOT synced');
    console.log('This explains why handleMouseWheel returns false');
  }
  
  await browser.close();
})();
