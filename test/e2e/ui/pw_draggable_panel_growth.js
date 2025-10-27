#!/usr/bin/env node
/**
 * Puppeteer Test: Draggable Panel Growth Prevention
 * Tests that panels do NOT grow over time due to auto-resize feedback loop
 * 
 * This E2E test catches the actual bug in a real browser environment
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('Running panel growth test against', url);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console errors
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ERROR') || text.includes('WARN')) {
        console.log('PAGE LOG:', text);
      }
    });

    // Navigate to game
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // Open Level Editor (where the panels are actually used)
    console.log('\n🎨 Opening Level Editor...');
    const levelEditorOpened = await page.evaluate(() => {
      // Try to open level editor
      if (window.levelEditor) {
        // First try activate
        if (typeof window.levelEditor.activate === 'function') {
          window.levelEditor.activate();
          return true;
        }
        // Try toggle
        if (typeof window.levelEditor.toggle === 'function') {
          window.levelEditor.toggle();
          return true;
        }
        // Try setting active
        window.levelEditor.active = true;
        return true;
      }
      
      // Alternative: check if there's InputController
      if (window.InputController && window.InputController.openLevelEditor) {
        window.InputController.openLevelEditor();
        return true;
      }
      
      // Try keyboard shortcut (usually 'E' key)
      if (window.keyPressed) {
        window.key = 'e';
        window.keyCode = 69;
        window.keyPressed();
        return true;
      }
      
      return false;
    });

    if (levelEditorOpened) {
      console.log('  ✅ Level Editor opened/activated');
    } else {
      console.warn('  ⚠️ Could not open Level Editor automatically');
    }
    
    await sleep(3000); // Wait longer for Level Editor and panels to initialize

    // Test 1: Verify DraggablePanelManager exists and get panel info
    console.log('\n📋 Test 1: DraggablePanelManager availability in Level Editor');
    const managerExists = await page.evaluate(() => {
      const info = {
        hasManager: typeof window.draggablePanelManager !== 'undefined',
        panelCount: 0,
        levelEditorActive: false,
        panelIds: []
      };

      // Check if Level Editor is active
      if (window.levelEditor) {
        info.levelEditorActive = window.levelEditor.isActive || window.levelEditor.enabled || false;
      }

      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        info.panelCount = window.draggablePanelManager.panels.size;
        window.draggablePanelManager.panels.forEach((panel, id) => {
          info.panelIds.push(id);
        });
      }
      
      return info;
    });

    console.log('  Panel manager available:', managerExists.hasManager);
    console.log('  Level Editor active:', managerExists.levelEditorActive);
    console.log('  Panel count:', managerExists.panelCount);
    console.log('  Panel IDs:', managerExists.panelIds.join(', '));

    if (!managerExists.hasManager || managerExists.panelCount === 0) {
      console.log('⚠️ No panels found, checking Level Editor panels specifically...');
      
      // Check for Level Editor specific panels
      const levelEditorPanels = await page.evaluate(() => {
        const panels = [];
        
        // Check for common Level Editor panel IDs
        const possibleIds = [
          'level-editor-brushes',
          'level-editor-terrain', 
          'level-editor-entities',
          'brush-size-panel',
          'terrain-brush-panel',
          'entity-placement-panel'
        ];

        if (window.draggablePanelManager && window.draggablePanelManager.panels) {
          possibleIds.forEach(id => {
            const panel = window.draggablePanelManager.panels.get(id);
            if (panel) {
              panels.push({
                id,
                visible: panel.state?.visible || false,
                height: panel.config?.size?.height || 0
              });
            }
          });
        }

        return panels;
      });

      console.log('  Level Editor panels found:', levelEditorPanels);

      if (levelEditorPanels.length === 0) {
        console.log('❌ No Level Editor panels found. Test cannot proceed.');
        await browser.close();
        process.exit(1);
      }
    }

    // Test 2: Measure initial panel heights (focus on Level Editor panels)
    console.log('\n📋 Test 2: Get initial Level Editor panel heights');
    const initialHeights = await page.evaluate(() => {
      const heights = {};
      
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        window.draggablePanelManager.panels.forEach((panel, id) => {
          heights[id] = {
            height: panel.config.size.height,
            buttonCount: panel.buttons ? panel.buttons.length : 0,
            hasContentRenderer: !!panel.contentRenderer,
            minimized: panel.state?.minimized || false,
            visible: panel.state?.visible !== false
          };
        });
      }
      
      return heights;
    });

    console.log('  Initial heights:', JSON.stringify(initialHeights, null, 2));
    
    // Highlight Level Editor specific panels
    const levelEditorPanelIds = ['level-editor-materials', 'level-editor-tools', 'level-editor-brush'];
    const foundLevelEditorPanels = levelEditorPanelIds.filter(id => initialHeights[id]);
    
    console.log(`\n  🎯 Level Editor panels found: ${foundLevelEditorPanels.length}/3`);
    foundLevelEditorPanels.forEach(id => {
      console.log(`     - ${id}: ${initialHeights[id].height}px (visible: ${initialHeights[id].visible})`);
    });

    if (foundLevelEditorPanels.length === 0) {
      console.log('❌ No Level Editor panels found - they may not have initialized');
      await browser.close();
      process.exit(1);
    }

    // Test 3: Let game run for 10 seconds (panels auto-resize every 100ms)
    console.log('\n📋 Test 3: Running game for 10 seconds (~600 frames)...');
    await sleep(10000);

    // Test 4: Measure final panel heights
    console.log('\n📋 Test 4: Get final panel heights after 10 seconds');
    const finalHeights = await page.evaluate(() => {
      const heights = {};
      
      if (window.draggablePanelManager && window.draggablePanelManager.panels) {
        window.draggablePanelManager.panels.forEach((panel, id) => {
          const isVisible = panel.state?.visible !== false;
          
          if (isVisible) {
            heights[id] = {
              height: panel.config.size.height,
              buttonCount: panel.buttons ? panel.buttons.length : 0,
              isLevelEditorPanel: id.includes('level-editor') || 
                                 id.includes('brush') || 
                                 id.includes('terrain') ||
                                 id.includes('entity-placement')
            };
          }
        });
      }
      
      return heights;
    });

    console.log('  Final heights:', JSON.stringify(finalHeights, null, 2));

    // Test 5: Verify no significant growth
    console.log('\n📋 Test 5: Verify no panel growth');
    let testPassed = true;
    let maxGrowth = 0;

    // Check ALL panels
    for (const panelId in initialHeights) {
      if (finalHeights[panelId]) {
        const growth = finalHeights[panelId].height - initialHeights[panelId].height;
        maxGrowth = Math.max(maxGrowth, Math.abs(growth));

        const isLevelEditorPanel = panelId.startsWith('level-editor-');

        console.log(`  ${panelId}${isLevelEditorPanel ? ' 🎯' : ''}:`);
        console.log(`    Initial: ${initialHeights[panelId].height}px`);
        console.log(`    Final:   ${finalHeights[panelId].height}px`);
        console.log(`    Growth:  ${growth > 0 ? '+' : ''}${growth}px`);

        // Allow up to 5px change (the resize threshold)
        if (Math.abs(growth) >= 5) {
          console.log(`    ❌ FAILED: Panel grew by ${growth}px`);
          testPassed = false;
          
          // Extra attention to Level Editor panels
          if (isLevelEditorPanel) {
            console.log(`    ⚠️  CRITICAL: Level Editor panel is growing!`);
          }
        } else {
          console.log(`    ✅ PASSED: Stable height`);
        }
      }
    }

    console.log(`\n  Maximum growth detected: ${maxGrowth}px`);

    // Test 6: Sample height stability over time
    console.log('\n📋 Test 6: Sample height stability over 5 seconds');
    const heightSamples = await page.evaluate(() => {
      return new Promise((resolve) => {
        const samples = {};
        let sampleCount = 0;
        const maxSamples = 10;

        const interval = setInterval(() => {
          if (window.draggablePanelManager && window.draggablePanelManager.panels) {
            window.draggablePanelManager.panels.forEach((panel, id) => {
              if (!samples[id]) {
                samples[id] = [];
              }
              samples[id].push(panel.config.size.height);
            });
          }

          sampleCount++;
          if (sampleCount >= maxSamples) {
            clearInterval(interval);
            resolve(samples);
          }
        }, 500); // Sample every 500ms
      });
    });

    console.log('  Height samples:', JSON.stringify(heightSamples, null, 2));

    // Check for monotonic growth (bug symptom)
    for (const panelId in heightSamples) {
      const samples = heightSamples[panelId];
      let isGrowing = true;

      for (let i = 1; i < samples.length; i++) {
        if (samples[i] <= samples[i - 1]) {
          isGrowing = false;
          break;
        }
      }

      if (isGrowing && samples.length > 2) {
        console.log(`  ❌ ${panelId}: Height is growing monotonically (BUG!)`);
        console.log(`     Samples: ${samples.join(' → ')}`);
        testPassed = false;
      } else {
        console.log(`  ✅ ${panelId}: Height is stable (no monotonic growth)`);
      }
    }

    // Test 7: Check localStorage pollution
    console.log('\n📋 Test 7: Check localStorage write frequency');
    const storageTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Track localStorage writes
        let writeCount = 0;
        const originalSetItem = Storage.prototype.setItem;
        
        Storage.prototype.setItem = function(key, value) {
          if (key.startsWith('draggable-panel-')) {
            writeCount++;
          }
          return originalSetItem.call(this, key, value);
        };

        // Wait 5 seconds
        setTimeout(() => {
          Storage.prototype.setItem = originalSetItem;
          resolve({ writeCount });
        }, 5000);
      });
    });

    console.log(`  localStorage writes in 5 seconds: ${storageTest.writeCount}`);
    
    // Should be very few writes (auto-resize shouldn't save)
    if (storageTest.writeCount > 10) {
      console.log(`  ❌ FAILED: Too many writes (${storageTest.writeCount}), auto-resize may be saving`);
      testPassed = false;
    } else {
      console.log(`  ✅ PASSED: Reasonable write count (${storageTest.writeCount})`);
    }

    // Test 8: Verify manual drag still saves
    console.log('\n📋 Test 8: Verify manual drag saves position');
    const dragTest = await page.evaluate(() => {
      if (!window.draggablePanelManager || !window.draggablePanelManager.panels) {
        return { success: false, reason: 'No panels' };
      }

      const firstPanel = Array.from(window.draggablePanelManager.panels.values())[0];
      if (!firstPanel) {
        return { success: false, reason: 'No panel to test' };
      }

      const panelId = firstPanel.config.id;
      const initialX = firstPanel.state.position.x;
      const initialY = firstPanel.state.position.y;

      // Clear localStorage for this panel
      localStorage.removeItem(`draggable-panel-${panelId}`);

      // Simulate drag
      firstPanel.isDragging = true;
      firstPanel.dragOffset = { x: 10, y: 10 };
      firstPanel.state.position.x = initialX + 50;
      firstPanel.state.position.y = initialY + 50;
      firstPanel.handleDragging(initialX + 60, initialY + 60, false); // Release drag

      // Check if saved
      const saved = localStorage.getItem(`draggable-panel-${panelId}`);
      
      return {
        success: saved !== null,
        panelId,
        initialPos: { x: initialX, y: initialY },
        saved: saved ? JSON.parse(saved) : null
      };
    });

    if (dragTest.success) {
      console.log(`  ✅ PASSED: Manual drag saved to localStorage`);
      console.log(`     Panel: ${dragTest.panelId}`);
      console.log(`     Saved position: ${JSON.stringify(dragTest.saved.position)}`);
    } else {
      console.log(`  ❌ FAILED: Manual drag did not save (${dragTest.reason})`);
      testPassed = false;
    }

    // Final summary
    console.log('\n' + '═'.repeat(50));
    if (testPassed) {
      console.log('✅ ALL TESTS PASSED - Panel growth bug is FIXED!');
      console.log('═'.repeat(50));
      await browser.close();
      process.exit(0);
    } else {
      console.log('❌ TESTS FAILED - Panel growth bug still present');
      console.log('═'.repeat(50));
      
      // Save failure screenshot
      const screenshotPath = await saveScreenshot(page, 'ui', 'panel_growth_failure');
      console.log('Failure screenshot:', screenshotPath);
      
      await browser.close();
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Panel growth test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
})();
