/**
 * E2E Test: managedExternally Flag Check
 * 
 * Verifies that the managedExternally flag is actually being respected
 */

const { launchBrowser, sleep } = require('../puppeteer_helper');

(async () => {
  console.log('🎯 Testing managedExternally flag...\n');
  
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000?test=1');
    await sleep(2000);
    
    await page.evaluate(() => {
      window.gameState = 'LEVEL_EDITOR';
      if (!window.g_map2 && typeof gridTerrain !== 'undefined') {
        const CHUNKS_X = 10, CHUNKS_Y = 10, CHUNK_SIZE = 8, TILE_SIZE = 32, seed = 12345;
        window.g_map2 = new gridTerrain(CHUNKS_X, CHUNKS_Y, seed, CHUNK_SIZE, TILE_SIZE, [window.innerWidth, window.innerHeight]);
      }
      if (window.levelEditor && !window.levelEditor.isActive()) {
        window.levelEditor.initialize(window.g_map2);
      }
    });
    await sleep(1000);
    
    const flagCheck = await page.evaluate(() => {
      const results = {
        panels: {},
        renderPanelsLogic: []
      };
      
      if (window.draggablePanelManager) {
        // Check each Level Editor panel
        const panelIds = ['level-editor-materials', 'level-editor-tools', 'level-editor-brush'];
        
        panelIds.forEach(id => {
          const panel = window.draggablePanelManager.panels.get(id);
          if (panel) {
            results.panels[id] = {
              exists: true,
              visible: panel.isVisible(),
              managedExternally: panel.config?.behavior?.managedExternally,
              configBehavior: JSON.stringify(panel.config?.behavior || {})
            };
            
            // Simulate the check in renderPanels()
            const shouldRender = panel.isVisible() && !panel.config.behavior.managedExternally;
            results.panels[id].shouldRenderAccordingToCheck = shouldRender;
          }
        });
        
        // Manually walk through renderPanels() logic
        const gameState = 'LEVEL_EDITOR';
        const visiblePanelIds = window.draggablePanelManager.stateVisibility[gameState] || [];
        
        results.renderPanelsLogic.push(`State: ${gameState}`);
        results.renderPanelsLogic.push(`Visible panel IDs for state: ${visiblePanelIds.join(', ')}`);
        results.renderPanelsLogic.push('');
        results.renderPanelsLogic.push('Walking through renderPanels() loop:');
        
        for (const panel of window.draggablePanelManager.panels.values()) {
          const id = panel.config.id;
          const visible = panel.isVisible();
          const managed = panel.config.behavior.managedExternally;
          const willRender = visible && !managed;
          
          results.renderPanelsLogic.push(`  Panel: ${id}`);
          results.renderPanelsLogic.push(`    isVisible(): ${visible}`);
          results.renderPanelsLogic.push(`    managedExternally: ${managed}`);
          results.renderPanelsLogic.push(`    Will render: ${willRender} ${willRender ? '← WILL CALL panel.render()' : '← SKIPPED'}`);
          results.renderPanelsLogic.push('');
        }
      }
      
      return results;
    });
    
    console.log('📊 Panel Configuration:');
    console.log('================================================================================');
    Object.keys(flagCheck.panels).forEach(id => {
      const p = flagCheck.panels[id];
      console.log(`${id}:`);
      console.log(`  Exists: ${p.exists ? '✅' : '❌'}`);
      console.log(`  Visible: ${p.visible ? '✅' : '❌'}`);
      console.log(`  managedExternally: ${p.managedExternally ? '✅ YES' : '❌ NO'}`);
      console.log(`  config.behavior: ${p.configBehavior}`);
      console.log(`  Should render (according to check): ${p.shouldRenderAccordingToCheck ? '❌ YES (PROBLEM!)' : '✅ NO (skipped)'}`);
      console.log('');
    });
    console.log('================================================================================\n');
    
    console.log('📊 renderPanels() Logic Walkthrough:');
    console.log('================================================================================');
    flagCheck.renderPanelsLogic.forEach(line => console.log(line));
    console.log('================================================================================\n');
    
    await browser.close();
    
    console.log('✨ Flag check complete!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await browser.close();
    process.exit(1);
  }
})();
