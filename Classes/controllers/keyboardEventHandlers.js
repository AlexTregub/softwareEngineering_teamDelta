/**
 * keyboardEventHandlers.js
 * =========================
 * Centralized keyboard event handling for p5.js keyboard events.
 * All keyboard-related functions extracted from sketch.js for better organization.
 * 
 * Functions:
 * - handleKeyEvent()           - Helper for delegating to keyboard controller
 * - keyPressed()               - Main key press handler
 * - deactivateActiveBrushes()  - Deactivates active brushes (resource, enemy ant)
 * - getPrimarySelectedEntity() - Gets the primary selected entity
 */

/**
 * handleKeyEvent
 * --------------
 * Delegates keyboard events to the appropriate handler if the game is in an active state.
 * @param {string} type - The key event type (e.g., 'handleKeyPressed').
 * @param {...any} args - Arguments to pass to the handler.
 */
function handleKeyEvent(type, ...args) {
  if (GameState.isInGame() && typeof g_keyboardController[type] === 'function') {
    g_keyboardController[type](...args);
  }
}

/**
 * handleQueenMovement
 * -------------------
 * Handles WASD queen movement using keyIsDown() for smooth continuous movement
 * Called from draw() loop for frame-by-frame polling
 */
function handleQueenMovement() {
  const playerQueen = getQueen?.();
  if (!playerQueen || GameState.getState() !== 'PLAYING') return;
  
  if (keyIsDown(87)) playerQueen.move("s"); // W
  if (keyIsDown(65)) playerQueen.move("a"); // A
  if (keyIsDown(83)) playerQueen.move("w"); // S
  if (keyIsDown(68)) playerQueen.move("d"); // D
}

/**
 * keyPressed
 * ----------
 * Handles key press events with priority order:
 * 1. Level Editor (if active)
 * 2. Debug console keys
 * 3. ESC (multi-purpose escape)
 * 4. UI shortcuts (Ctrl+Shift)
 * 5. Render layer toggles (Shift+key)
 * 6. Game controls (no modifier)
 * 
 * See docs/KEYBINDS_REFERENCE.md for complete keybind documentation
 */
function keyPressed() {
  const k = key.toLowerCase();
  const isInGame = GameState.isInGame();
  
  // ========================================
  // PRIORITY 1: Level Editor Mode
  // ========================================
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor?.isActive()) {
      levelEditor.handleKeyPress(key);
    }
    return;
  }
  
  // ========================================
  // PRIORITY 2: Debug Console
  // ========================================
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return;
  }
  
  // ========================================
  // PRIORITY 3: ESC - Multi-purpose Escape
  // ========================================
  if (keyCode === ESCAPE) {
    // Order: deselect entities → deactivate brushes → clear selection box
    if (typeof deselectAllEntities === 'function') deselectAllEntities();
    if (deactivateActiveBrushes()) return;
    if (g_selectionBoxController) {
      g_selectionBoxController.deselectAll();
      return;
    }
  }
  
  // ========================================
  // PRIORITY 4: UI Manager Shortcuts (Ctrl+Shift)
  // ========================================
  if (window.UIManager?.handleKeyPress) {
    if (window.UIManager.handleKeyPress(keyCode, key, window.event)) return;
  }
  
  // ========================================
  // PRIORITY 5: Render Layer Toggles (Shift+key)
  // ========================================
  if (keyIsDown(SHIFT) && RenderManager?.isInitialized) {
    const layerMap = {
      'c': 'terrain',
      'v': 'entities', 
      'b': 'effects',
      'n': 'ui_game',
      'm': 'ui_debug',
      ',': 'ui_menu'
    };
    
    if (layerMap[k]) {
      RenderManager.toggleLayer(layerMap[k]);
      logVerbose('🔧 Layer States:', RenderManager.getLayerStates());
      return;
    }
    
    if (k === '.') { // Enable all layers
      RenderManager.enableAllLayers();
      logVerbose('🔧 All layers enabled');
      return;
    }
    
    if (k === 'z' && typeof toggleSprintImageInMenu !== 'undefined') {
      toggleSprintImageInMenu();
      return;
    }
  }
  
  // ========================================
  // PRIORITY 6: Debug Keys (no modifier)
  // ========================================
  if (k === '`' || k === '~') {
    if (typeof toggleCoordinateDebug === 'function') {
      toggleCoordinateDebug();
      return;
    }
  }
  
  if (k === 't') {
    if (typeof toggleTileInspector === 'function') {
      toggleTileInspector();
      return;
    }
  }
  
  if (typeof handleTerrainGridKeys === 'function' && handleTerrainGridKeys()) {
    return;
  }
  
  // ========================================
  // PRIORITY 7: Game Controls (in-game only)
  // ========================================
  if (!isInGame) return;
  
  // Speed Control (X key)
  if (k === 'x') {
    if (window.g_speedUpButton?.changeGameSpeed) {
      window.g_speedUpButton.changeGameSpeed();
      return;
    }
  }
  
  // Queen Movement (WASD - continuous polling in draw loop handled separately)
  // Note: Actual movement is handled in sketch.js draw() via keyIsDown() for smooth continuous movement
  // This section is for documentation purposes - WASD uses keyIsDown() not keyPressed events
  
  // Queen Commands (R = rally, Shift+R = reset zoom to avoid conflict)
  const playerQueen = getQueen();
  if (playerQueen instanceof QueenAnt) {
    if (k === 'r' && !keyIsDown(SHIFT)) {
      playerQueen.emergencyRally();
      return;
    }
  }
  
  // Camera Controls
  if (cameraManager) {
    if (k === 'f') {
      cameraManager.toggleFollow();
      return;
    }
    
    if (k === 'h') {
      const mapCenterX = (CHUNKS_X * 8 * TILE_SIZE) / 2;
      const mapCenterY = (CHUNKS_Y * 8 * TILE_SIZE) / 2;
      cameraManager.centerOn(mapCenterX, mapCenterY);
      return;
    }
    
    if (k === 'o') {
      cameraManager.setZoom(0.2);
      return;
    }
    
    if (k === 'r' && keyIsDown(SHIFT)) { // Shift+R for reset zoom (avoid conflict with rally)
      cameraManager.setZoom(1.0);
      return;
    }
    
    // Zoom controls
    const currentZoom = cameraManager.getZoom();
    const ZOOM_STEP = 1.1;
    
    if (k === '-' || k === '_' || keyCode === 189 || keyCode === 109) {
      setCameraZoom(currentZoom / ZOOM_STEP);
      return;
    }
    
    if (k === '=' || k === '+' || keyCode === 187 || keyCode === 107) {
      setCameraZoom(currentZoom * ZOOM_STEP);
      return;
    }
  }
  
  // Unit Management (U = release ants, Shift+U = upgrade building)
  if (k === 'u') {
    if (keyIsDown(SHIFT)) {
      // Upgrade selected building 10x
      const selectedEntity = getPrimarySelectedEntity();
      if (selectedEntity?.upgradeBuilding) {
        for (let i = 0; i < 10; i++) {
          selectedEntity.upgradeBuilding();
        }
      }
    } else {
      // Release ants from all buildings
      Buildings.forEach(building => building._releaseAnts());
    }
    return;
  }
  
  // Interaction (E key - NPC/Buildings)
  if (k === 'e') {
    // Priority: active NPC → nearby NPC → anthill → dead buildings
    if (window.currentNPC) {
      window.currentNPC.advanceDialogue();
      return;
    }
    
    const nearbyNPC = NPCList.find(n => n.isPlayerNearby);
    if (nearbyNPC) {
      nearbyNPC.startDialogue(NPCDialogues[nearbyNPC.name.toLowerCase()]);
      return;
    }
    
    const nearbyHill = Buildings.find(b => 
      b.isPlayerNearby && b.buildingType === "anthill" && b._faction === "player"
    );
    if (nearbyHill) {
      if (!window.BUIManager.active) {
        window.BUIManager.open(nearbyHill);
      } else {
        window.BUIManager.close();
      }
      return;
    }
    
    const deadBuilding = Buildings.find(b => 
      b.isPlayerNearby && b._faction !== "player" && b._isDead
    );
    if (deadBuilding) {
      window.BUIManager.rebuild(deadBuilding);
      return;
    }
  }
  
  // Building UI Manager
  if (window.BUIManager?.active) {
    if (window.BUIManager.handleKeyPress(key)) return;
  }

    // Power Button Shortcuts (1, 2 keys)
  if (k === '1' || k === '2') {
    console.log(`🔢 Power button shortcut pressed: ${k}`);
    console.log(`   g_powerButtonPanel exists: ${typeof window.g_powerButtonPanel !== 'undefined'}`);
    
    if (window.g_powerButtonPanel) {
      const powerIndex = parseInt(k) - 1;
      console.log(`   Power index: ${powerIndex}`);
      console.log(`   Total buttons: ${window.g_powerButtonPanel.buttons?.length}`);
      
      const button = window.g_powerButtonPanel.buttons[powerIndex];
      console.log(`   Button found: ${button !== undefined}`);
      
      if (button && button.controller) {
        console.log(`   Button power: ${button.powerName}`);
        console.log(`   Button position: (${button.view.x}, ${button.view.y})`);
        // Simulate click at button center
        const clicked = button.controller.handleClick(button.view.x, button.view.y);
        console.log(`   Click handled: ${clicked}`);
        return;
      } else {
        console.log(`   ❌ Button or controller not available`);
      }
    } else {
      console.log(`   ❌ g_powerButtonPanel not found on window`);
    }
  }
  
  // Power Brush Manager (3, 4, 5 keys)
  if (k === '3' || k === '4' || k === '5') {
    if (window.g_powerBrushManager?.switchPower) {
      window.g_powerBrushManager.switchPower(key);
      return;
    }
  }
  
  // Fallback to keyboard controller
  handleKeyEvent('handleKeyPressed', keyCode, key);
}

/**
 * getPrimarySelectedEntity
 * -------------------------
 * Retrieves the primary selected entity from the ant manager or the global
 * selectedAnt variable. This function ensures compatibility with both the
 * new ant manager system and the legacy global selection.
 *
 * @returns {Object|null} - The primary selected entity, or null if none is selected.
 */
function getPrimarySelectedEntity() {
  if (typeof antManager !== 'undefined' &&
      antManager &&
      typeof antManager.getSelectedAnt === 'function') {
    const managed = antManager.getSelectedAnt();
    if (managed) {
      return managed;
    }
  }

  if (typeof selectedAnt !== 'undefined' && selectedAnt) {
    return selectedAnt;
  }

  return null;
}

/**
 * deactivateActiveBrushes
 * -----------------------
 * Deactivates any active brushes (resource, enemy ant) and logs the action.
 * Returns true if any brush was deactivated.
 * 
 * @returns {boolean} - True if any brush was deactivated, false otherwise.
 */
function deactivateActiveBrushes() {
  let deactivated = false;
  if (typeof g_resourceBrush !== 'undefined' && g_resourceBrush && g_resourceBrush.isActive) {
    g_resourceBrush.toggle();
    logNormal('🎨 Resource brush deactivated via ESC key');
    deactivated = true;
  }
  if (typeof g_enemyAntBrush !== 'undefined' && g_enemyAntBrush && g_enemyAntBrush.isActive) {
    g_enemyAntBrush.toggle();
    logNormal('🎨 Enemy brush deactivated via ESC key');
    deactivated = true;
  }
  return deactivated;
}
