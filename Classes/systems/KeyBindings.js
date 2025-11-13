/**
 * KeyBindings
 * -----------
 * Centralized keyboard binding configuration.
 * Registers all key commands for different game states.
 */

/**
 * Initialize all keyboard bindings
 * @param {KeyBindingManager} manager - The key binding manager
 */
function initializeKeyBindings(manager) {
  // Clear any existing bindings
  manager.clearAll();
  
  // ========================================
  // GLOBAL BINDINGS (work in all states)
  // ========================================
  
  manager.registerGlobal(new KeyCommand('`', {}, 
    () => { if (typeof toggleCoordinateDebug === 'function') toggleCoordinateDebug(); },
    'Toggle coordinate debug overlay'
  ));
  
  manager.registerGlobal(new KeyCommand('~', {}, 
    () => { if (typeof toggleCoordinateDebug === 'function') toggleCoordinateDebug(); },
    'Toggle coordinate debug overlay'
  ));
  
  manager.registerGlobal(new KeyCommand('t', {}, 
    () => { if (typeof toggleTileInspector === 'function') toggleTileInspector(); },
    'Toggle tile inspector'
  ));
  
  // ========================================
  // PLAYING STATE BINDINGS
  // ========================================
  
  // ESC - Deselect/Cancel
  manager.register('PLAYING', new KeyCommand('escape', {}, () => {
    if (typeof deselectAllEntities === 'function') deselectAllEntities();
    deactivateActiveBrushes();
    if (g_selectionBoxController) g_selectionBoxController.deselectAll();
  }, 'Deselect entities and deactivate brushes'));
  
  // Camera Controls
  manager.register('PLAYING', new KeyCommand('f', {}, 
    () => { if (cameraManager) cameraManager.toggleFollow(); },
    'Toggle camera follow'
  ));
  
  manager.register('PLAYING', new KeyCommand('h', {}, () => {
    if (cameraManager) {
      const mapCenterX = (CHUNKS_X * 8 * TILE_SIZE) / 2;
      const mapCenterY = (CHUNKS_Y * 8 * TILE_SIZE) / 2;
      cameraManager.centerOn(mapCenterX, mapCenterY);
    }
  }, 'Center camera on map (Home)'));
  
  manager.register('PLAYING', new KeyCommand('o', {}, 
    () => { if (cameraManager) cameraManager.setZoom(0.2); },
    'Overview zoom (zoom out)'
  ));
  
  manager.register('PLAYING', new KeyCommand('r', {}, 
    () => { if (cameraManager) cameraManager.setZoom(1.0); },
    'Reset zoom to 1.0'
  ));
  
  // Queen Commands
  manager.register('PLAYING', new KeyCommand('r', {}, () => {
    const playerQueen = getQueen();
    if (playerQueen?.controller?.emergencyRally) {
      playerQueen.controller.emergencyRally();
    }
  }, 'Queen emergency rally'));
  
  manager.register('PLAYING', new KeyCommand('m', {}, () => {
    const playerQueen = getQueen();
    if (playerQueen?.controller?.gatherAntsAt) {
      playerQueen.controller.gatherAntsAt(mouseX, mouseY);
    }
  }, 'Gather ants at mouse position'));
  
  // Building Upgrade
  manager.register('PLAYING', new KeyCommand('u', {}, () => {
    let selectedEntity = getPrimarySelectedEntity();
    if (selectedEntity) {
      for (let i = 0; i < 10; i++) {
        selectedEntity.upgradeBuilding();
      }
    }
  }, 'Upgrade selected building (x10)'));
  
  // Interaction
  manager.register('PLAYING', new KeyCommand('e', {}, () => {
    // Continue NPC dialogue if active
    if (window.currentNPC) {
      window.currentNPC.advanceDialogue();
      return;
    }
    
    // Talk to nearby NPC if close
    const antony = NPCList.find(n => n.name === "Antony" && n.isPlayerNearby);
    if (antony) {
      antony.startDialogue(NPCDialogues.antony);
      return;
    }
    
    // Interact with nearby anthill
    const nearbyHill = Buildings.find(b => b.isPlayerNearby && b.buildingType === "anthill");
    if (nearbyHill) {
      console.log("Interacting with nearby anthill:", nearbyHill);
      if (!window.BUIManager.active) {
        window.BUIManager.open(nearbyHill);
      } else {
        window.BUIManager.close();
      }
    }
  }, 'Interact with NPCs/buildings'));
  
  // Render Layer Toggles (Shift+Key)
  manager.register('PLAYING', new KeyCommand('c', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('terrain'); },
    'Toggle TERRAIN layer'
  ));
  
  manager.register('PLAYING', new KeyCommand('v', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('entities'); },
    'Toggle ENTITIES layer'
  ));
  
  manager.register('PLAYING', new KeyCommand('b', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('effects'); },
    'Toggle EFFECTS layer'
  ));
  
  manager.register('PLAYING', new KeyCommand('n', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('ui_game'); },
    'Toggle UI_GAME layer'
  ));
  
  manager.register('PLAYING', new KeyCommand('m', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('ui_debug'); },
    'Toggle UI_DEBUG layer'
  ));
  
  manager.register('PLAYING', new KeyCommand(',', {shift: true}, 
    () => { if (RenderManager) RenderManager.toggleLayer('ui_menu'); },
    'Toggle UI_MENU layer'
  ));
  
  manager.register('PLAYING', new KeyCommand('.', {shift: true}, 
    () => { if (RenderManager) RenderManager.enableAllLayers(); },
    'Enable all render layers'
  ));
  
  manager.register('PLAYING', new KeyCommand('z', {shift: true}, () => {
    if (typeof toggleSprintImageInMenu !== 'undefined') {
      toggleSprintImageInMenu();
    }
  }, 'Toggle sprint 5 image in menu'));
  
  // ========================================
  // LEVEL_EDITOR STATE BINDINGS
  // ========================================
  
  // Level editor handles its own keys internally via levelEditor.handleKeyPress()
  // No specific bindings needed here
  
  // ========================================
  // MENU STATE BINDINGS
  // ========================================
  
  // Add menu-specific bindings here as needed
  
  console.log('✅ Keyboard bindings initialized');
}

/**
 * Print help text for current state
 * @param {string} state - Current game state
 */
function printKeyboardHelp(state = null) {
  if (typeof window.g_keyBindingManager !== 'undefined') {
    console.log(window.g_keyBindingManager.generateHelp(state));
  }
}

// Global exports
if (typeof window !== 'undefined') {
  window.initializeKeyBindings = initializeKeyBindings;
  window.printKeyboardHelp = printKeyboardHelp;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeKeyBindings, printKeyboardHelp };
}
