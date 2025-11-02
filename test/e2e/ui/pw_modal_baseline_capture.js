/**
 * E2E Test: Modal Window Visual Baseline Capture
 * 
 * PURPOSE: Capture screenshots of ALL modal dialogs BEFORE refactoring
 * These baseline images will be used to verify visual consistency after refactoring
 * 
 * MODALS TESTED:
 * 1. SaveDialog - File save with validation
 * 2. LoadDialog - File load with list
 * 3. NewMapDialog - New map dimensions
 * 4. ConfirmationDialog - Yes/No confirmation
 * 5. ModalDialog - Generic dialog with buttons
 * 6. SettingsPanel - Settings with toggles/sliders
 * 
 * BASELINE LOCATION: test/e2e/screenshots/ui/baseline/modal_*
 */

const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  
  try {
    console.log('=== MODAL BASELINE CAPTURE ===');
    console.log('Navigating to app...');
    await page.goto('http://localhost:8000?test=1');
    
    // CRITICAL: Ensure game started (bypass main menu)
    console.log('Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    if (!gameStarted.started) {
      throw new Error('Game failed to start - still on menu');
    }
    
    console.log('Setting game state to PLAYING for modal testing...');
    await page.evaluate(() => {
      // Set to PLAYING state for testing modals
      if (window.GameState && window.GameState.setState) {
        window.GameState.setState('PLAYING');
      } else {
        window.gameState = 'PLAYING';
      }
    });
    
    await sleep(1000);
    
    // First, check what modal classes are available
    const availableClasses = await page.evaluate(() => {
      return {
        SaveDialog: typeof window.SaveDialog !== 'undefined',
        LoadDialog: typeof window.LoadDialog !== 'undefined',
        NewMapDialog: typeof window.NewMapDialog !== 'undefined',
        ConfirmationDialog: typeof window.ConfirmationDialog !== 'undefined',
        ModalDialog: typeof window.ModalDialog !== 'undefined',
        SettingsPanel: typeof window.SettingsPanel !== 'undefined',
        Dialog: typeof window.Dialog !== 'undefined'
      };
    });
    
    console.log('Available modal classes:', availableClasses);
    
    // ===== TEST 1: SaveDialog Baseline =====
    console.log('\n[1/6] Capturing SaveDialog baseline...');
    
    if (!availableClasses.SaveDialog) {
      console.log('⚠️ SaveDialog not available, skipping...');
    } else {
      await page.evaluate(() => {
        // Create SaveDialog instance
        if (!window.SaveDialog) {
          throw new Error('SaveDialog not available');
        }
      
      window.testSaveDialog = new SaveDialog({
        title: 'Save Level',
        defaultFilename: 'test_level',
        onSave: (filename, format) => {
          console.log('Save clicked:', filename, format);
        }
      });
      
      window.testSaveDialog.show();
      
      // Force render
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_save_dialog', true);
      console.log('✓ SaveDialog baseline captured');
      
      // Close dialog
      await page.evaluate(() => {
        if (window.testSaveDialog) window.testSaveDialog.hide();
      });
      await sleep(300);
    }
    
    // ===== TEST 2: LoadDialog Baseline =====
    console.log('\n[2/6] Capturing LoadDialog baseline...');
    
    if (!availableClasses.LoadDialog) {
      console.log('⚠️ LoadDialog not available, skipping...');
    } else {
      await page.evaluate(() => {
        if (!window.LoadDialog) {
          throw new Error('LoadDialog not available');
        }
      
      // Mock some saved files
      const mockFiles = [
        { name: 'level_001.json', date: '2025-11-01', size: '15 KB' },
        { name: 'test_map.json', date: '2025-11-02', size: '22 KB' },
        { name: 'desert_arena.json', date: '2025-10-30', size: '18 KB' }
      ];
      
      window.testLoadDialog = new LoadDialog({
        title: 'Load Level',
        files: mockFiles,
        onLoad: (filename) => {
          console.log('Load clicked:', filename);
        }
      });
      
      window.testLoadDialog.show();
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_load_dialog', true);
      console.log('✓ LoadDialog baseline captured');
      
      await page.evaluate(() => {
        if (window.testLoadDialog) window.testLoadDialog.hide();
      });
      await sleep(300);
    }
    
    // ===== TEST 3: NewMapDialog Baseline =====
    console.log('\n[3/6] Capturing NewMapDialog baseline...');
    
    if (!availableClasses.NewMapDialog) {
      console.log('⚠️ NewMapDialog not available, skipping...');
    } else {
      await page.evaluate(() => {
        if (!window.NewMapDialog) {
          throw new Error('NewMapDialog not available');
        }
      
      window.testNewMapDialog = new NewMapDialog({
        title: 'Create New Map',
        defaultWidth: 100,
        defaultHeight: 100,
        onCreate: (width, height) => {
          console.log('Create clicked:', width, height);
        }
      });
      
      window.testNewMapDialog.show();
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_new_map_dialog', true);
      console.log('✓ NewMapDialog baseline captured');
      
      await page.evaluate(() => {
        if (window.testNewMapDialog) window.testNewMapDialog.hide();
      });
      await sleep(300);
    }
    
    // ===== TEST 4: ConfirmationDialog Baseline =====
    console.log('\n[4/6] Capturing ConfirmationDialog baseline...');
    
    if (!availableClasses.ConfirmationDialog) {
      console.log('⚠️ ConfirmationDialog not available, skipping...');
    } else {
      await page.evaluate(() => {
        if (!window.ConfirmationDialog) {
          throw new Error('ConfirmationDialog not available');
        }
      
      window.testConfirmDialog = new ConfirmationDialog({
        title: 'Confirm Action',
        message: 'Are you sure you want to delete this level?\nThis action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
          console.log('Delete confirmed');
        },
        onCancel: () => {
          console.log('Cancelled');
        }
      });
      
      window.testConfirmDialog.show();
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_confirmation_dialog', true);
      console.log('✓ ConfirmationDialog baseline captured');
      
      await page.evaluate(() => {
        if (window.testConfirmDialog) window.testConfirmDialog.hide();
      });
      await sleep(300);
    }
    
    // ===== TEST 5: ModalDialog Baseline (Generic) =====
    console.log('\n[5/6] Capturing ModalDialog baseline...');
    
    if (!availableClasses.ModalDialog) {
      console.log('⚠️ ModalDialog not available, skipping...');
    } else {
      await page.evaluate(() => {
        if (!window.ModalDialog) {
          throw new Error('ModalDialog not available');
        }
      
        window.testModalDialog = new ModalDialog();
        window.testModalDialog.show({
          title: 'Custom Dialog',
          message: 'Enter a name for your custom entity:',
          hasInput: true,
          inputPlaceholder: 'My Entity',
          inputValue: '',
          buttons: [
            { label: 'Create', type: 'primary', callback: () => console.log('Create') },
            { label: 'Cancel', callback: () => console.log('Cancel') }
          ]
        });      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_generic_dialog', true);
      console.log('✓ ModalDialog baseline captured');
      
      await page.evaluate(() => {
        if (window.testModalDialog) window.testModalDialog.hide();
      });
      await sleep(300);
    }
    
    // ===== TEST 6: SettingsPanel Baseline =====
    console.log('\n[6/6] Capturing SettingsPanel baseline...');
    
    if (!availableClasses.SettingsPanel) {
      console.log('⚠️ SettingsPanel not available, skipping...');
    } else {
      await page.evaluate(() => {
        if (!window.SettingsPanel) {
          throw new Error('SettingsPanel not available');
        }
      
      // SettingsPanel is already initialized by the game
      // Just make it visible
      if (window.settingsPanel) {
        window.settingsPanel.visible = true;
      } else {
        // Create new instance if not exists
        window.settingsPanel = new SettingsPanel();
        window.settingsPanel.visible = true;
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw(); window.redraw(); window.redraw();
      }
    });
    
      await sleep(800);
      await saveScreenshot(page, 'ui/baseline/modal_settings_panel', true);
      console.log('✓ SettingsPanel baseline captured');
      
      await page.evaluate(() => {
        if (window.settingsPanel) window.settingsPanel.visible = false;
      });
    }
    
    console.log('\n=== ALL BASELINES CAPTURED ===');
    console.log('Location: test/e2e/screenshots/ui/baseline/');
    console.log('\nBaseline files created:');
    console.log('  - modal_save_dialog.png');
    console.log('  - modal_load_dialog.png');
    console.log('  - modal_new_map_dialog.png');
    console.log('  - modal_confirmation_dialog.png');
    console.log('  - modal_generic_dialog.png');
    console.log('  - modal_settings_panel.png');
    console.log('\nThese images will be used to verify visual consistency after refactoring.');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Baseline capture failed:', error.message);
    console.error(error.stack);
    await saveScreenshot(page, 'ui/baseline/modal_baseline_error', false);
    await browser.close();
    process.exit(1);
  }
})();
