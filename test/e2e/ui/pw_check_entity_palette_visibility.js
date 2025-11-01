/**
 * E2E Test: Check Entity Palette Panel Visibility
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  console.log('🧪 Entity Palette Panel Visibility Check');
  
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
  
  // Show Entity Palette
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
  
  // Check panel visibility
  const info = await page.evaluate(() => {
    const panelMgr = window.levelEditor?.levelEditorPanels;
    if (!panelMgr) return { error: 'levelEditorPanels not found' };
    if (!panelMgr.panels) return { error: 'panels not found' };
    
    const entityPalettePanel = panelMgr.panels.entityPalette || panelMgr.panels['entity-palette'] || panelMgr.panels['entityPalette'];
    
    return {
      panelsKeys: Object.keys(panelMgr.panels),
      entityPalettePanelExists: !!entityPalettePanel,
      entityPaletteState: entityPalettePanel ? entityPalettePanel.state : null,
      levelEditorHasEntityPalette: !!panelMgr.levelEditor?.entityPalette
    };
  });
  
  console.log('Level Editor Panels Info:');
  console.log(JSON.stringify(info, null, 2));
  
  await browser.close();
})();
