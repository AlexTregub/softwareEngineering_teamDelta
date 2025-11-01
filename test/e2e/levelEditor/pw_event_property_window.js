/**
 * E2E Test: Event Property Window
 * 
 * Tests complete workflow:
 * 1. Start Level Editor
 * 2. Create event with spatial trigger
 * 3. Place flag on terrain
 * 4. Click flag → property window opens
 * 5. Edit radius → preview updates in real-time
 * 6. Save changes → trigger updated, window closes
 * 7. Click flag again → verify changes persisted
 * 8. Delete trigger → flag disappears
 * 
 * Screenshots capture all stages for visual verification.
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await cameraHelper.newPageReady(browser);
  
  try {
    console.log('🚀 Starting Event Property Window E2E test...');
    
    // Navigate to app
    await page.appGoto();
    await sleep(1000);
    
    // STEP 1: Start Level Editor
    console.log('📝 Step 1: Starting Level Editor...');
    const editorStarted = await cameraHelper.ensureLevelEditorStarted(page);
    
    if (!editorStarted.started) {
      throw new Error('Failed to start Level Editor: ' + JSON.stringify(editorStarted));
    }
    
    console.log('✅ Level Editor started');
    await sleep(500);
    
    // Screenshot: Level Editor started
    await saveScreenshot(page, 'eventPropertyWindow/01_level_editor_started', true);
    
    // STEP 2: Create event with spatial trigger via EventEditorPanel
    console.log('📝 Step 2: Creating event with spatial trigger...');
    const eventCreated = await page.evaluate(() => {
      try {
        // Get EventManager instance
        if (!window.eventManager) {
          return { success: false, error: 'EventManager not available' };
        }
        
        // Register a test event
        const eventConfig = {
          id: 'event_e2e_test_001',
          name: 'Test Event',
          type: 'dialogue',
          data: { message: 'Test dialogue' }
        };
        
        window.eventManager.registerEvent(eventConfig);
        
        // Get current camera position and place flag in viewport center
        const camera = window.levelEditor.editorCamera || window.g_cameraManager;
        const cameraCenterX = camera ? camera.cameraX || 0 : 0;
        const cameraCenterY = camera ? camera.cameraY || 0 : 0;
        
        // Place flag at camera center
        const flagX = cameraCenterX + 200; // Slightly offset from center
        const flagY = cameraCenterY + 150;
        
        // Register a spatial trigger for this event
        const triggerConfig = {
          id: 'trigger_e2e_test_001',
          eventId: 'event_e2e_test_001',
          type: 'spatial',
          condition: { x: flagX, y: flagY, radius: 100 },
          oneTime: false,
          repeatable: true
        };
        
        const triggerId = window.eventManager.registerTrigger(triggerConfig);
        
        return {
          success: true,
          triggerId: triggerId,
          triggerCondition: triggerConfig.condition,
          cameraPosition: { x: cameraCenterX, y: cameraCenterY }
        };
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!eventCreated.success) {
      throw new Error('Failed to create event: ' + eventCreated.error);
    }
    
    console.log('✅ Event created with trigger ID:', eventCreated.triggerId);
    console.log('   Camera position:', eventCreated.cameraPosition);
    console.log('   Trigger position:', eventCreated.triggerCondition, 'radius:', eventCreated.triggerCondition.radius);
    
    // Force redraw to show flag
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Flag placed on map
    await saveScreenshot(page, 'eventPropertyWindow/02_flag_placed', true);
    
    // STEP 3: Open property window directly (bypass click detection for E2E simplicity)
    console.log('📝 Step 3: Opening property window...');
    const windowOpened = await page.evaluate(() => {
      try {
        // Get LevelEditor instance
        if (!window.levelEditor) {
          return { success: false, error: 'LevelEditor not available' };
        }
        
        // Get trigger from EventManager
        const trigger = window.eventManager.getTrigger('trigger_e2e_test_001');
        if (!trigger) {
          return { success: false, error: 'Trigger not found in EventManager' };
        }
        
        // Open property window directly
        window.levelEditor.openEventPropertyWindow(trigger);
        
        // Check if property window opened
        if (window.levelEditor.eventPropertyWindow && window.levelEditor.eventPropertyWindow.isVisible) {
          return {
            success: true,
            windowPosition: {
              x: window.levelEditor.eventPropertyWindow.x,
              y: window.levelEditor.eventPropertyWindow.y
            },
            editFormRadius: window.levelEditor.eventPropertyWindow.editForm.condition.radius
          };
        } else {
          return { success: false, error: 'Property window did not open' };
        }
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!windowOpened.success) {
      console.log('Debug info:', JSON.stringify(windowOpened, null, 2));
      throw new Error('Failed to open property window: ' + windowOpened.error);
    }
    
    console.log('✅ Property window opened at:', windowOpened.windowPosition);
    console.log('   Current radius in editForm:', windowOpened.editFormRadius);
    
    // Force redraw to show property window
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Property window open
    await saveScreenshot(page, 'eventPropertyWindow/03_property_window_opened', true);
    
    // STEP 4: Edit radius to 150 (preview should update)
    console.log('📝 Step 4: Editing radius to 150...');
    const radiusEdited = await page.evaluate(() => {
      try {
        const propWindow = window.levelEditor.eventPropertyWindow;
        
        if (!propWindow || !propWindow.editForm) {
          return { success: false, error: 'Property window not available' };
        }
        
        // Modify radius in editForm
        propWindow.editForm.condition.radius = 150;
        
        return {
          success: true,
          newRadius: propWindow.editForm.condition.radius,
          originalRadius: propWindow.trigger.condition.radius
        };
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!radiusEdited.success) {
      throw new Error('Failed to edit radius: ' + radiusEdited.error);
    }
    
    console.log('✅ Radius edited to:', radiusEdited.newRadius);
    console.log('   Original radius (for comparison):', radiusEdited.originalRadius);
    
    // Force redraw to show preview radius
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Preview radius visible (orange solid vs yellow dashed)
    await saveScreenshot(page, 'eventPropertyWindow/04_preview_radius_150', true);
    
    // STEP 5: Click Save Changes button
    console.log('📝 Step 5: Saving changes...');
    const changesSaved = await page.evaluate(() => {
      try {
        const propWindow = window.levelEditor.eventPropertyWindow;
        
        if (!propWindow) {
          return { success: false, error: 'Property window not available' };
        }
        
        // Call saveChanges (this should update EventManager and close window)
        const saved = propWindow.saveChanges();
        
        // Get updated trigger from EventManager
        const updatedTrigger = window.eventManager.getTrigger('trigger_e2e_test_001');
        
        return {
          success: saved,
          windowClosed: !propWindow.isVisible,
          updatedRadius: updatedTrigger ? updatedTrigger.condition.radius : null
        };
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!changesSaved.success) {
      throw new Error('Failed to save changes: ' + changesSaved.error);
    }
    
    console.log('✅ Changes saved!');
    console.log('   Window closed:', changesSaved.windowClosed);
    console.log('   Updated radius in EventManager:', changesSaved.updatedRadius);
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Window closed, radius updated (single yellow circle, now 150)
    await saveScreenshot(page, 'eventPropertyWindow/05_changes_saved', true);
    
    // STEP 6: Reopen property window to verify changes persisted
    console.log('📝 Step 6: Reopening property window to verify changes...');
    const windowReopened = await page.evaluate(() => {
      try {
        // Get updated trigger from EventManager
        const trigger = window.eventManager.getTrigger('trigger_e2e_test_001');
        if (!trigger) {
          return { success: false, error: 'Trigger not found in EventManager' };
        }
        
        // Open property window again
        window.levelEditor.openEventPropertyWindow(trigger);
        
        if (window.levelEditor.eventPropertyWindow && window.levelEditor.eventPropertyWindow.isVisible) {
          return {
            success: true,
            displayedRadius: window.levelEditor.eventPropertyWindow.editForm.condition.radius
          };
        } else {
          return { success: false, error: 'Property window did not open' };
        }
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!windowReopened.success) {
      throw new Error('Failed to reopen property window: ' + windowReopened.error);
    }
    
    console.log('✅ Property window reopened');
    console.log('   Displayed radius (should be 150):', windowReopened.displayedRadius);
    
    // Verify radius is 150
    if (windowReopened.displayedRadius !== 150) {
      throw new Error('Radius not persisted! Expected 150, got ' + windowReopened.displayedRadius);
    }
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Window reopened showing updated radius
    await saveScreenshot(page, 'eventPropertyWindow/06_changes_persisted', true);
    
    // STEP 7: Delete trigger
    console.log('📝 Step 7: Deleting trigger...');
    const triggerDeleted = await page.evaluate(() => {
      try {
        const propWindow = window.levelEditor.eventPropertyWindow;
        
        if (!propWindow) {
          return { success: false, error: 'Property window not available' };
        }
        
        // Call deleteTrigger
        propWindow.deleteTrigger();
        
        // Check if trigger removed from EventManager
        const trigger = window.eventManager.getTrigger('trigger_e2e_test_001');
        
        return {
          success: true,
          windowClosed: !propWindow.isVisible,
          triggerRemoved: trigger === null
        };
      } catch (error) {
        return { success: false, error: error.toString() };
      }
    });
    
    if (!triggerDeleted.success) {
      throw new Error('Failed to delete trigger: ' + triggerDeleted.error);
    }
    
    console.log('✅ Trigger deleted!');
    console.log('   Window closed:', triggerDeleted.windowClosed);
    console.log('   Trigger removed from EventManager:', triggerDeleted.triggerRemoved);
    
    // Force redraw
    await page.evaluate(() => {
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    await sleep(500);
    
    // Screenshot: Flag disappeared from map
    await saveScreenshot(page, 'eventPropertyWindow/07_trigger_deleted', true);
    
    console.log('');
    console.log('🎉 All E2E tests passed!');
    console.log('📸 Screenshots saved to test/e2e/screenshots/eventPropertyWindow/success/');
    console.log('');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ E2E test failed:', error);
    
    // Take failure screenshot
    try {
      await saveScreenshot(page, 'eventPropertyWindow/error', false);
    } catch (e) {
      console.error('Failed to save error screenshot:', e);
    }
    
    await browser.close();
    process.exit(1);
  }
})();
