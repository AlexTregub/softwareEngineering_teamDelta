/**
 * Debug Test: Count Materials Panels
 * 
 * Purpose: Check how many "Materials" panels exist and their configurations
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  let browser;
  let success = false;
  
  try {
    console.log('🔍 Checking for Materials Panels...\n');
    
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.goto('http://localhost:8000?test=1', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    await sleep(2000);
    
    // Ensure Level Editor started
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error(`Failed to start Level Editor: ${editorStarted.error}`);
    }
    
    await sleep(1000);
    
    // Search for all panels with "material" in the name
    const panelInfo = await page.evaluate(() => {
      const results = {
        allPanelIds: [],
        materialPanels: [],
        draggablePanelManager: null,
        levelEditorPanels: null
      };
      
      // Check DraggablePanelManager
      if (window.draggablePanelManager) {
        results.draggablePanelManager = {
          exists: true,
          panelIds: Array.from(window.draggablePanelManager.panels.keys())
        };
        results.allPanelIds.push(...results.draggablePanelManager.panelIds);
        
        // Find material-related panels
        results.draggablePanelManager.panelIds.forEach(id => {
          if (id.toLowerCase().includes('material')) {
            const panel = window.draggablePanelManager.panels.get(id);
            results.materialPanels.push({
              id: id,
              source: 'DraggablePanelManager',
              title: panel.title || 'N/A',
              visible: panel.visible || false,
              hasContent: !!panel.content,
              contentType: panel.content ? panel.content.constructor.name : 'N/A',
              position: { x: panel.x, y: panel.y },
              size: { width: panel.width, height: panel.height }
            });
          }
        });
      }
      
      // Check LevelEditor structure
      results.levelEditorStructure = {
        exists: !!window.levelEditor,
        hasPanels: !!(window.levelEditor && window.levelEditor.panels),
        hasPalette: !!(window.levelEditor && window.levelEditor.palette),
        hasLevelEditorPanels: !!window.levelEditorPanels,
        levelEditorKeys: window.levelEditor ? Object.keys(window.levelEditor).filter(k => k.includes('panel') || k.includes('Panel') || k.includes('palette') || k.includes('Palette')) : []
      };
      
      // Check window.levelEditorPanels (might be separate)
      if (window.levelEditorPanels) {
        results.levelEditorPanels = {
          exists: true,
          source: 'window.levelEditorPanels',
          hasMaterialsPanel: !!window.levelEditorPanels.panels.materials,
          hasPalette: !!(window.levelEditor && window.levelEditor.palette)
        };
      } else if (window.levelEditor && window.levelEditor.panels) {
        results.levelEditorPanels = {
          exists: true,
          source: 'window.levelEditor.panels',
          hasMaterialsPanel: !!window.levelEditor.panels.materials,
          hasPalette: !!window.levelEditor.palette
        };
        
        if (window.levelEditor.panels.materials) {
          const matPanel = window.levelEditor.panels.materials;
          results.materialPanels.push({
            id: 'levelEditor.panels.materials',
            source: 'LevelEditorPanels',
            title: matPanel.title || 'N/A',
            visible: matPanel.state ? matPanel.state.visible : 'N/A',
            hasContent: !!matPanel.content,
            contentType: matPanel.content ? matPanel.content.constructor.name : 'N/A',
            position: matPanel.getPosition ? matPanel.getPosition() : 'N/A',
            paletteReference: window.levelEditor.palette ? 'levelEditor.palette exists' : 'N/A'
          });
        }
      }
      
      // Check if palette is accessible
      if (window.levelEditor && window.levelEditor.palette) {
        results.paletteInfo = {
          exists: true,
          hasCategories: !!(window.levelEditor.palette.categories),
          categoryCount: window.levelEditor.palette.categories ? window.levelEditor.palette.categories.length : 0,
          hasHandleClick: typeof window.levelEditor.palette.handleClick === 'function'
        };
      }
      
      // Check if MaterialPalette class exists
      results.materialPaletteClass = {
        exists: typeof window.MaterialPalette !== 'undefined',
        isFunction: typeof window.MaterialPalette === 'function'
      };
      
      return results;
    });
    
    console.log('📊 Panel Search Results:\n');
    console.log('='.repeat(70));
    
    console.log('\n1. All Panel IDs in DraggablePanelManager:');
    if (panelInfo.draggablePanelManager) {
      panelInfo.draggablePanelManager.panelIds.forEach(id => {
        console.log(`   - ${id}`);
      });
    } else {
      console.log('   ❌ DraggablePanelManager not found');
    }
    
    console.log('\n2. Material-Related Panels Found:');
    if (panelInfo.materialPanels.length > 0) {
      panelInfo.materialPanels.forEach((panel, idx) => {
        console.log(`\n   Panel ${idx + 1}:`);
        console.log(`   ├─ ID: ${panel.id}`);
        console.log(`   ├─ Source: ${panel.source}`);
        console.log(`   ├─ Title: ${panel.title}`);
        console.log(`   ├─ Visible: ${panel.visible}`);
        console.log(`   ├─ Content Type: ${panel.contentType}`);
        console.log(`   ├─ Position: ${JSON.stringify(panel.position)}`);
        if (panel.size) {
          console.log(`   └─ Size: ${JSON.stringify(panel.size)}`);
        }
        if (panel.paletteReference) {
          console.log(`   └─ Palette: ${panel.paletteReference}`);
        }
      });
    } else {
      console.log('   ❌ No material-related panels found');
    }
    
    console.log('\n3. LevelEditor Structure:');
    if (panelInfo.levelEditorStructure) {
      console.log(`   LevelEditor exists: ${panelInfo.levelEditorStructure.exists}`);
      console.log(`   Has panels property: ${panelInfo.levelEditorStructure.hasPanels}`);
      console.log(`   Has palette property: ${panelInfo.levelEditorStructure.hasPalette}`);
      console.log(`   window.levelEditorPanels exists: ${panelInfo.levelEditorStructure.hasLevelEditorPanels}`);
      if (panelInfo.levelEditorStructure.levelEditorKeys.length > 0) {
        console.log(`   Relevant keys: ${panelInfo.levelEditorStructure.levelEditorKeys.join(', ')}`);
      }
    }
    
    console.log('\n4. LevelEditorPanels Status:');
    if (panelInfo.levelEditorPanels) {
      console.log(`   ✅ Found (source: ${panelInfo.levelEditorPanels.source})`);
      console.log(`   Has materials panel: ${panelInfo.levelEditorPanels.hasMaterialsPanel}`);
      console.log(`   Has palette: ${panelInfo.levelEditorPanels.hasPalette}`);
    } else {
      console.log('   ❌ LevelEditorPanels not found');
    }
    
    console.log('\n5. Palette Info:');
    if (panelInfo.paletteInfo) {
      console.log(`   ✅ Palette exists`);
      console.log(`   Has categories: ${panelInfo.paletteInfo.hasCategories}`);
      console.log(`   Category count: ${panelInfo.paletteInfo.categoryCount}`);
      console.log(`   Has handleClick: ${panelInfo.paletteInfo.hasHandleClick}`);
    } else {
      console.log('   ❌ Palette not found');
    }
    
    console.log('\n6. MaterialPalette Class:');
    console.log(`   Exists: ${panelInfo.materialPaletteClass.exists}`);
    console.log(`   Is Function: ${panelInfo.materialPaletteClass.isFunction}`);
    
    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 SUMMARY: Found ${panelInfo.materialPanels.length} material-related panel(s)\n`);
    
    if (panelInfo.materialPanels.length > 1) {
      console.log('⚠️  WARNING: Multiple material panels detected!');
      console.log('   This could cause click handling conflicts.\n');
    }
    
    await saveScreenshot(page, 'debug/materials_panels', true);
    success = true;
    
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
