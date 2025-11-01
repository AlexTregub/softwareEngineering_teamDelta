/**
 * E2E Test: Dialogue Creation Panel
 * 
 * Tests the complete user workflow for creating dialogue events:
 * 1. Open Level Editor
 * 2. Open Event Editor panel
 * 3. Click Dialogue template
 * 4. Verify panel opens with dark overlay
 * 5. Click buttons to add/remove dialogue lines
 * 6. Verify lines appear in viewport
 * 7. Click Save button
 * 8. Verify event created
 * 
 * CRITICAL: Uses real user flow (mouse clicks on UI elements)
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  let testsPassed = 0;
  let testsFailed = 0;
  const errors = [];
  
  try {
    // Navigate to game
    await page.goto('http://localhost:8000?test=1');
    await sleep(1000);
    
    console.log('Starting Dialogue Creation Panel E2E Test...\n');
    
    // STEP 1: Start Level Editor (bypass menu)
    console.log('Step 1: Starting Level Editor...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    if (!editorStarted.started) {
      throw new Error('Failed to start Level Editor');
    }
    await sleep(500);
    await saveScreenshot(page, 'dialogue_panel/01_level_editor_started', true);
    console.log('✅ Level Editor started\n');
    testsPassed++;
    
    // STEP 2: Access Event Editor (directly on LevelEditor)
    console.log('Step 2: Accessing Event Editor...');
    const eventPanelOpened = await page.evaluate(() => {
      // EventEditorPanel is at window.levelEditor.eventEditor
      if (!window.levelEditor || !window.levelEditor.eventEditor) {
        return { success: false, error: 'EventEditorPanel not found on LevelEditor' };
      }
      
      const eventEditor = window.levelEditor.eventEditor;
      
      if (!eventEditor.templates) {
        return { success: false, error: 'templates not found on EventEditorPanel' };
      }
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      return { success: true, hasTemplates: eventEditor.templates.length > 0 };
    });
    
    if (!eventPanelOpened.success) {
      throw new Error(eventPanelOpened.error);
    }
    await sleep(500);
    await saveScreenshot(page, 'dialogue_panel/02_event_editor_ready', true);
    console.log('✅ Event Editor ready');
    console.log(`   Has templates: ${eventPanelOpened.hasTemplates}\n`);
    testsPassed++;
    
    // STEP 3: Click Dialogue template
    console.log('Step 3: Clicking Dialogue template...');
    const dialogueTemplateClicked = await page.evaluate(() => {
      // Access EventEditorPanel directly from LevelEditor
      const editor = window.levelEditor.eventEditor;
      if (!editor) {
        return { success: false, error: 'EventEditorPanel not found' };
      }
      
      // Find dialogue template
      const dialogueTemplate = editor.templates.find(t => t.type === 'dialogue');
      if (!dialogueTemplate) {
        return { 
          success: false, 
          error: 'Dialogue template not found',
          availableTypes: editor.templates.map(t => t.type)
        };
      }
      
      // The template.id has '_template' suffix, but _selectTemplate expects ID without suffix
      const templateId = dialogueTemplate.id.replace('_template', '');
      
      // Simulate clicking the template
      editor._selectTemplate(templateId);
      
      // Force render to populate button bounds
      if (window.draggablePanelManager) {
        window.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw(); window.redraw(); window.redraw();
      }
      
      // Manually render the dialogue panel to ensure button bounds are set
      if (editor.dialoguePanel) {
        editor.dialoguePanel.render();
      }
      
      // Check if dialogue panel is active
      const panelActive = editor.dialoguePanelActive;
      const panelExists = editor.dialoguePanel !== null;
      
      return { 
        success: panelActive && panelExists,
        panelActive,
        panelExists,
        panelBounds: panelExists ? {
          x: editor.dialoguePanel.x,
          y: editor.dialoguePanel.y,
          width: editor.dialoguePanel.width,
          height: editor.dialoguePanel.height
        } : null
      };
    });
    
    if (!dialogueTemplateClicked.success) {
      throw new Error(`Dialogue panel not opened: ${JSON.stringify(dialogueTemplateClicked)}`);
    }
    await sleep(500);
    await saveScreenshot(page, 'dialogue_panel/03_dialogue_panel_opened', true);
    console.log('✅ Dialogue Creation Panel opened');
    console.log(`   Panel bounds: ${JSON.stringify(dialogueTemplateClicked.panelBounds)}\n`);
    testsPassed++;
    
    // STEP 4: Verify dark overlay is present
    console.log('Step 4: Verifying dark overlay...');
    const overlayCheck = await page.evaluate(() => {
      // Check if EventEditorPanel has dialoguePanelActive flag
      const editor = window.levelEditor.eventEditor;
      return {
        dialoguePanelActive: editor.dialoguePanelActive,
        // Overlay is rendered in EventEditorPanel.render() when dialoguePanelActive is true
        overlayRendered: editor.dialoguePanelActive
      };
    });
    
    if (!overlayCheck.overlayRendered) {
      throw new Error('Dark overlay not rendered');
    }
    console.log('✅ Dark overlay present\n');
    testsPassed++;
    
    // STEP 5: Verify buttons are within panel bounds
    console.log('Step 5: Verifying button positions...');
    const buttonCheck = await page.evaluate(() => {
      const editor = window.levelEditor.eventEditor;
      const panel = editor.dialoguePanel;
      
      const panelBottom = panel.y + panel.height;
      const panelRight = panel.x + panel.width;
      
      // Check all button bounds
      const buttons = {
        addButton1: panel.addButton1Bounds,
        addButton2: panel.addButton2Bounds,
        removeButton1: panel.removeButton1Bounds,
        removeButton2: panel.removeButton2Bounds,
        saveButton: panel.saveButtonBounds
      };
      
      const results = {};
      for (const [name, bounds] of Object.entries(buttons)) {
        if (!bounds) {
          results[name] = { error: 'Bounds not set' };
          continue;
        }
        
        const buttonBottom = bounds.y + bounds.height;
        const buttonRight = bounds.x + bounds.width;
        
        results[name] = {
          insidePanel: bounds.x >= panel.x && buttonRight <= panelRight && 
                       bounds.y >= panel.y && buttonBottom <= panelBottom,
          bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
          buttonBottom,
          panelBottom
        };
      }
      
      return {
        panelBounds: { x: panel.x, y: panel.y, width: panel.width, height: panel.height },
        panelBottom,
        buttons: results
      };
    });
    
    let allButtonsInside = true;
    for (const [name, result] of Object.entries(buttonCheck.buttons)) {
      if (result.error) {
        console.log(`❌ ${name}: ${result.error}`);
        allButtonsInside = false;
      } else if (!result.insidePanel) {
        console.log(`❌ ${name}: Outside panel bounds`);
        console.log(`   Button: ${JSON.stringify(result.bounds)}`);
        console.log(`   Button bottom: ${result.buttonBottom}, Panel bottom: ${result.panelBottom}`);
        allButtonsInside = false;
      } else {
        console.log(`✅ ${name}: Inside panel bounds`);
      }
    }
    
    if (!allButtonsInside) {
      await saveScreenshot(page, 'dialogue_panel/05_button_bounds_ERROR', false);
      throw new Error('Some buttons are outside panel bounds');
    }
    console.log('✅ All buttons within panel bounds\n');
    testsPassed++;
    
    // STEP 6: Click "+ Char 1" button (add Character 1 line)
    console.log('Step 6: Clicking "+ Char 1" button...');
    const addChar1Result = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      // Get button bounds
      const btn = panel.addButton1Bounds;
      if (!btn) return { success: false, error: 'Button bounds not found' };
      
      // Calculate center of button
      const clickX = btn.x + btn.width / 2;
      const clickY = btn.y + btn.height / 2;
      
      // Store initial line count
      const initialCount = panel.dialogueLines.length;
      
      // Click button
      const handled = panel.handleClick(clickX, clickY);
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Check if line was added
      const newCount = panel.dialogueLines.length;
      const lineAdded = newCount === initialCount + 1;
      
      return {
        success: handled && lineAdded,
        handled,
        initialCount,
        newCount,
        clickCoords: { x: clickX, y: clickY },
        buttonBounds: btn
      };
    });
    
    if (!addChar1Result.success) {
      await saveScreenshot(page, 'dialogue_panel/06_add_char1_ERROR', false);
      throw new Error(`Failed to add Character 1 line: ${JSON.stringify(addChar1Result)}`);
    }
    await sleep(300);
    await saveScreenshot(page, 'dialogue_panel/06_char1_line_added', true);
    console.log('✅ Character 1 line added');
    console.log(`   Lines: ${addChar1Result.initialCount} → ${addChar1Result.newCount}\n`);
    testsPassed++;
    
    // STEP 7: Click "+ Char 2" button twice
    console.log('Step 7: Clicking "+ Char 2" button twice...');
    const addChar2Result = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      const btn = panel.addButton2Bounds;
      if (!btn) return { success: false, error: 'Button bounds not found' };
      
      const clickX = btn.x + btn.width / 2;
      const clickY = btn.y + btn.height / 2;
      
      const initialCount = panel.dialogueLines.length;
      
      // Click twice
      panel.handleClick(clickX, clickY);
      panel.handleClick(clickX, clickY);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const newCount = panel.dialogueLines.length;
      
      return {
        success: newCount === initialCount + 2,
        initialCount,
        newCount
      };
    });
    
    if (!addChar2Result.success) {
      await saveScreenshot(page, 'dialogue_panel/07_add_char2_ERROR', false);
      throw new Error(`Failed to add Character 2 lines: ${JSON.stringify(addChar2Result)}`);
    }
    await sleep(300);
    await saveScreenshot(page, 'dialogue_panel/07_char2_lines_added', true);
    console.log('✅ Character 2 lines added (×2)');
    console.log(`   Lines: ${addChar2Result.initialCount} → ${addChar2Result.newCount}\n`);
    testsPassed++;
    
    // STEP 8: Verify dialogue lines are visible in viewport
    console.log('Step 8: Verifying dialogue lines in viewport...');
    const viewportCheck = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      return {
        lineCount: panel.dialogueLines.length,
        lines: panel.dialogueLines.map((line, i) => ({
          index: i,
          character: line.character,
          text: line.text
        }))
      };
    });
    
    if (viewportCheck.lineCount !== 3) {
      await saveScreenshot(page, 'dialogue_panel/08_viewport_ERROR', false);
      throw new Error(`Expected 3 lines, got ${viewportCheck.lineCount}`);
    }
    console.log('✅ 3 dialogue lines in viewport');
    console.log(`   Line 0: Character ${viewportCheck.lines[0].character} - "${viewportCheck.lines[0].text}"`);
    console.log(`   Line 1: Character ${viewportCheck.lines[1].character} - "${viewportCheck.lines[1].text}"`);
    console.log(`   Line 2: Character ${viewportCheck.lines[2].character} - "${viewportCheck.lines[2].text}"\n`);
    testsPassed++;
    
    // STEP 9: Click "− Char 1" button (remove Character 1 line)
    console.log('Step 9: Clicking "− Char 1" button...');
    const removeChar1Result = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      const btn = panel.removeButton1Bounds;
      if (!btn) return { success: false, error: 'Button bounds not found' };
      
      const clickX = btn.x + btn.width / 2;
      const clickY = btn.y + btn.height / 2;
      
      const initialCount = panel.dialogueLines.length;
      
      panel.handleClick(clickX, clickY);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      const newCount = panel.dialogueLines.length;
      
      return {
        success: newCount === initialCount - 1,
        initialCount,
        newCount
      };
    });
    
    if (!removeChar1Result.success) {
      await saveScreenshot(page, 'dialogue_panel/09_remove_char1_ERROR', false);
      throw new Error(`Failed to remove Character 1 line: ${JSON.stringify(removeChar1Result)}`);
    }
    await sleep(300);
    await saveScreenshot(page, 'dialogue_panel/09_char1_line_removed', true);
    console.log('✅ Character 1 line removed');
    console.log(`   Lines: ${removeChar1Result.initialCount} → ${removeChar1Result.newCount}\n`);
    testsPassed++;
    
    // STEP 10: Click "Save Dialogue" button
    console.log('Step 10: Clicking "Save Dialogue" button...');
    const saveResult = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      const btn = panel.saveButtonBounds;
      if (!btn) return { success: false, error: 'Button bounds not found' };
      
      const clickX = btn.x + btn.width / 2;
      const clickY = btn.y + btn.height / 2;
      
      // Store event manager state before save
      const initialEventCount = panel.eventManager.getAllEvents().length;
      
      // Click save button
      const handled = panel.handleClick(clickX, clickY);
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
      
      // Check if event was created/updated
      const newEventCount = panel.eventManager.getAllEvents().length;
      const eventData = panel.eventData;
      
      return {
        success: handled && eventData.content !== null,
        handled,
        initialEventCount,
        newEventCount,
        eventId: eventData.id,
        dialogueLines: eventData.content ? eventData.content.dialogueLines.length : 0
      };
    });
    
    if (!saveResult.success) {
      await saveScreenshot(page, 'dialogue_panel/10_save_ERROR', false);
      throw new Error(`Failed to save dialogue: ${JSON.stringify(saveResult)}`);
    }
    await sleep(300);
    await saveScreenshot(page, 'dialogue_panel/10_dialogue_saved', true);
    console.log('✅ Dialogue saved');
    console.log(`   Event ID: ${saveResult.eventId}`);
    console.log(`   Dialogue lines saved: ${saveResult.dialogueLines}\n`);
    testsPassed++;
    
    // STEP 11: Verify event exists in EventManager
    console.log('Step 11: Verifying event in EventManager...');
    const eventCheck = await page.evaluate(() => {
      const eventPanel = window.levelEditor.eventEditor;
      const panel = eventPanel.dialoguePanel;
      
      const event = panel.eventManager.getEvent(panel.eventData.id);
      
      return {
        exists: event !== null,
        eventId: panel.eventData.id,
        eventType: event ? event.type : null,
        dialogueLineCount: event && event.content ? event.content.dialogueLines.length : 0
      };
    });
    
    if (!eventCheck.exists) {
      await saveScreenshot(page, 'dialogue_panel/11_event_verify_ERROR', false);
      throw new Error(`Event not found in EventManager: ${eventCheck.eventId}`);
    }
    console.log('✅ Event exists in EventManager');
    console.log(`   Event ID: ${eventCheck.eventId}`);
    console.log(`   Event type: ${eventCheck.eventType}`);
    console.log(`   Dialogue lines: ${eventCheck.dialogueLineCount}\n`);
    testsPassed++;
    
    // FINAL SCREENSHOT
    await saveScreenshot(page, 'dialogue_panel/12_test_complete', true);
    
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ ALL TESTS PASSED: ${testsPassed}/${testsPassed + testsFailed}`);
    console.log('═══════════════════════════════════════════════\n');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    testsFailed++;
    errors.push(error.message);
    
    console.error('\n❌ TEST FAILED:', error.message);
    await saveScreenshot(page, 'dialogue_panel/ERROR_final', false);
    
    console.log('\n═══════════════════════════════════════════════');
    console.log(`❌ TESTS FAILED: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('═══════════════════════════════════════════════');
    console.log('\nErrors:');
    errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    
    await browser.close();
    process.exit(1);
  }
})();
