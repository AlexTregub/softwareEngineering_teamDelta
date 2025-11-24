/**
 * mouseEventHandlers.js
 * =====================
 * Centralized mouse event handling for p5.js mouse events.
 * All mouse-related functions extracted from sketch.js for better organization.
 * 
 * Functions:
 * - mousePressed()     - Main mouse press handler
 * - mouseDragged()     - Mouse drag handler
 * - mouseReleased()    - Mouse release handler
 * - mouseMoved()       - Mouse move/hover handler
 * - mouseWheel(event)  - Mouse wheel/scroll handler
 * - handleMouseEvent() - Helper function for delegating to mouse controller
 */

/**
 * handleMouseEvent
 * ----------------
 * Delegates mouse events to the mouse controller if the game is in an active state.
 * @param {string} type - The mouse event type (e.g., 'handleMousePressed').
 * @param {...any} args - Arguments to pass to the controller handler.
 */
function handleMouseEvent(type, ...args) {
  if (GameState.isInGame()) {
    g_mouseController[type](...args);
    if (g_activeMap && g_activeMap.renderConversion) {
      logVerbose(g_activeMap.renderConversion.convCanvasToPos([mouseX,mouseY]));
    }
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() {
  // Menu State - handle button clicks first
  if (GameState.getState() === 'MENU' || GameState.getState() === 'OPTIONS') {
    if (typeof handleButtonsClick === 'function') {
      handleButtonsClick();
      return; // Don't process other mouse events
    }
  }
  
  if (window.g_powerBrushManager && window.g_powerBrushManager.currentBrush != null) {
    console.log(`current brush: ${window.g_powerBrushManager.currentBrush}`);
    try {
      window.g_powerBrushManager.usePower(mouseX, mouseY);
    } catch (error) {
      console.error('❌ Error using power brush:', error);
    }
  }
  // Level Editor - handle clicks first if active
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleClick(mouseX, mouseY);
      return; // Don't process other mouse events
    }
  }
  
  // Tile Inspector - check first
  if (typeof tileInspectorEnabled !== 'undefined' && tileInspectorEnabled) {
    if (typeof inspectTileAtMouse === 'function') {
      inspectTileAtMouse(mouseX, mouseY);
      return; // Don't process other mouse events
    }
  }
  
  // Handle UI Debug Manager mouse events first
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
    const handled = g_uiDebugManager.handlePointerDown({ x: mouseX, y: mouseY });
    if (handled) return;
  }

  // PRIORITY 1: Check active brushes FIRST (before UI elements)
  // This ensures brush clicks work even if panels are visible
  
  // Handle Enemy Ant Brush events
  if (window.g_enemyAntBrush && window.g_enemyAntBrush.isActive) {
    console.log('🖌️ Checking g_enemyAntBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_enemyAntBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_enemyAntBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_enemyAntBrush consumed the click - returning early');
        return; // Brush consumed the event, don't process other mouse events
      }
    } catch (error) {
      console.error('❌ Error handling enemy ant brush events:', error);
    }
  }

  // Handle Resource Brush events
  if (window.g_resourceBrush && window.g_resourceBrush.isActive) {
    console.log('🖌️ Checking g_resourceBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_resourceBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_resourceBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_resourceBrush consumed the click - returning early');
        return; // Brush consumed the event, don't process other mouse events
      }
    } catch (error) {
      console.error('❌ Error handling resource brush events:', error);
    }
  }

  // Handle Building Brush events
  if (window.g_buildingBrush && window.g_buildingBrush.isActive) {
    console.log('🖌️ Checking g_buildingBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_buildingBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_buildingBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_buildingBrush consumed the click - returning early');
        return; // Brush consumed the event, don't process other mouse events
      }
    } catch (error) {
      console.error('❌ Error handling building brush events:', error);
    }
  }

  // Handle Lightning Aim Brush events
  if (window.g_lightningAimBrush && window.g_lightningAimBrush.isActive) {
    console.log('🖌️ Checking g_lightningAimBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_lightningAimBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_lightningAimBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_lightningAimBrush consumed the click - returning early');
        return;
      }
    } catch (error) {
      console.error('❌ Error handling lightning aim brush events:', error);
    }
  }

  // Handle Final Flash Aim Brush events
  if (window.g_flashAimBrush && window.g_flashAimBrush.isActive) {
    console.log('🖌️ Checking g_flashAimBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_flashAimBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_flashAimBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_flashAimBrush consumed the click - returning early');
        return;
      }
    } catch (error) {
      console.error('❌ Error handling Flash Flash aim brush events:', error);
    }
  }

  // Handle Fireball Aim Brush events (charge mechanic)
  if (window.g_fireballAimBrush && window.g_fireballAimBrush.isActive) {
    console.log('🖌️ Checking g_fireballAimBrush (active)');
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_fireballAimBrush.onMousePressed(mouseX, mouseY, buttonName);
      console.log('🖌️ g_fireballAimBrush.onMousePressed returned:', handled);
      if (handled) {
        console.log('🛑 g_fireballAimBrush consumed the click (started charging) - returning early');
        return;
      }
    } catch (error) {
      console.error('❌ Error handling Fireball aim brush events:', error);
    }
  }

  // Handle Queen Control Panel right-click for power cycling
  if (window.g_queenControlPanel && mouseButton === RIGHT) {
    try {
      const handled = window.g_queenControlPanel.handleRightClick();
      if (handled) return; // Queen panel consumed the right-click
    } catch (error) {
      console.error('❌ Error handling queen control panel right-click:', error);
    }
  }

  // PRIORITY 2: RenderManager UI elements (buttons, panels, etc.)
  // Forward to RenderManager interactive dispatch (gives adapters priority)
  console.log('📡 About to call RenderManager.dispatchPointerEvent with', { x: mouseX, y: mouseY });
  try {
    const result = RenderManager.dispatchPointerEvent('pointerdown', { x: mouseX, y: mouseY, isPressed: true });
    console.log('📡 RenderManager.dispatchPointerEvent returned:', result);
    if (result && typeof result === 'object' && result.consumed) {
      console.log(`✅ Mouse click consumed by: ${result.consumedBy} on layer ${result.layer}`);
      logVerbose(`🖱️ Mouse click consumed by ${result.consumedBy}`);
      return; // consumed by an interactive (buttons/panels/etc.)
    } else if (result === true) {
      console.log('✅ Mouse click consumed by RenderManager (unknown interactive)');
      logVerbose('🖱️ Mouse click consumed by RenderManager');
      return; // consumed by an interactive (buttons/panels/etc.)
    }
    console.log('⏭️ Mouse click NOT consumed by RenderManager, passing to other handlers');
    logVerbose('🖱️ Mouse click NOT consumed by RenderManager, passing to other handlers');
    // If not consumed, let higher-level systems decide; legacy fallbacks removed in favor of RenderManager adapters.
  } catch (e) {
    console.error('Error dispatching pointerdown to RenderManager:', e);
    // best-effort: still notify legacy controller if present to avoid breaking older flows
    try { handleMouseEvent('handleMousePressed', window.getWorldMouseX && window.getWorldMouseX(), window.getWorldMouseY && window.getWorldMouseY(), mouseButton); } catch (er) {}
  }

  // Legacy mouse controller fallbacks removed - RenderManager should handle UI dispatch.
  
  // Handle DraggablePanel mouse events
  if (window.draggablePanelManager && 
      typeof window.draggablePanelManager.handleMouseEvents === 'function') {
    try {
      const handled = window.draggablePanelManager.handleMouseEvents(mouseX, mouseY, true);
      if (handled) return; // Panel consumed the event, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling draggable panel mouse events:', error);
    }
  }

  // Handle Queen Control Panel events
  if (window.g_queenControlPanel && window.g_queenControlPanel.isQueenSelected()) {
    try {
      const handled = window.g_queenControlPanel.handleMouseClick(mouseX, mouseY);
      if (handled) return; // Queen panel consumed the event, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling queen control panel events:', error);
    }
  }
  handleMouseEvent('handleMousePressed', window.getWorldMouseX(), window.getWorldMouseY(), mouseButton);
}

/**
 * mouseDragged
 * ------------
 * Handles mouse drag events.
 */
function mouseDragged() {
  // Handle level editor drag events FIRST (before UI debug or RenderManager)
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleDrag(mouseX, mouseY);
    return; // Don't process other drag events when level editor is active
  }
  
  // Handle UI Debug Manager drag events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager !== null && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  // Forward move to RenderManager
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointermove', { x: mouseX, y: mouseY, isPressed: true });
    // If not consumed, attempt best-effort legacy notification but prefer RenderManager adapters
    if (!consumed) {
      try { handleMouseEvent('handleMouseDragged', mouseX, mouseY); } catch (e) {}
    }
  } catch (e) {
    console.error('Error dispatching pointermove to RenderManager:', e);
    try { handleMouseEvent('handleMouseDragged', mouseX, mouseY); } catch (er) {}
  }
}

/**
 * mouseReleased
 * -------------
 * Handles mouse release events.
 */
function mouseReleased() {
  // Handle level editor release events FIRST
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleMouseRelease(mouseX, mouseY);
  }
  
  // Handle UI Debug Manager release events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerUp({ x: mouseX, y: mouseY });
  }
  
  // Handle Enemy Ant Brush release events
  if (window.g_enemyAntBrush && window.g_enemyAntBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_enemyAntBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling enemy ant brush release events:', error);
    }
  }
  
  // Handle Resource Brush release events
  if (window.g_resourceBrush && window.g_resourceBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_resourceBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling resource brush release events:', error);
    }
  }

  // Handle Building Brush release events
  if (window.g_buildingBrush && window.g_buildingBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_buildingBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling building brush release events:', error);
    }
  }

  // Handle Lightning Aim Brush release events
  if (window.g_lightningAimBrush && window.g_lightningAimBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_lightningAimBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling lightning aim brush release events:', error);
    }
  }

  //Handle Flash Flash Aim Brush release events
  if (window.g_flashAimBrush && window.g_flashAimBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_flashAimBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling Final Flash aim brush release events:', error);
    }
  }

  // Handle Fireball Aim Brush release events (fires when fully charged)
  if (window.g_fireballAimBrush && window.g_fireballAimBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_fireballAimBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling Fireball aim brush release events:', error);
    }
  }
  
  // Forward to RenderManager first
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointerup', { x: mouseX, y: mouseY, isPressed: false });
    if (!consumed) {
      try { handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton); } catch (e) {}
    }
  } catch (e) {
    console.error('Error dispatching pointerup to RenderManager:', e);
    try { handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton); } catch (er) {}
  }
}

/**
 * mouseMoved
 * ----------
 * Handles mouse move/hover events for Level Editor.
 */
function mouseMoved() {
  // Handle level editor hover for preview highlighting
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleHover(mouseX, mouseY);
  }
}

/**
 * mouseWheel
 * ----------
 * Forward mouse wheel events to active brushes so users can cycle brush types
 * with the scroll wheel. Prevents default page scrolling while in-game.
 */
function mouseWheel(event) {
  try {
    // Level Editor - Shift+scroll for brush size, normal scroll for zoom
    if (GameState.getState() === 'LEVEL_EDITOR') {
      if (window.levelEditor && levelEditor.isActive()) {
        const delta = event.deltaY || 0;
        const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
        
        // Try brush size adjustment first (if Shift is pressed)
        if (shiftPressed && levelEditor.handleMouseWheel) {
          const handled = levelEditor.handleMouseWheel(event, shiftPressed);
          if (handled) {
            event.preventDefault();
            return false;
          }
        }
        
        // Otherwise, handle zoom
        levelEditor.handleZoom(delta);
        event.preventDefault();
        return false;
      }
    }

    if (!GameState.isInGame()) return false;

    // Determine scroll direction (positive = down, negative = up)
    const delta = event.deltaY || 0;
    const step = (delta > 0) ? 1 : (delta < 0) ? -1 : 0;

    // Helper to call directional cycling on a brush if available
    const tryCycleDir = (brush) => {
      if (!brush || !brush.isActive || step === 0) return false;
      // Preferred: BrushBase-style directional API
      if (typeof brush.cycleTypeStep === 'function') { brush.cycleTypeStep(step); return true; }
      if (typeof brush.cycleType === 'function') { brush.cycleType(step); return true; }
      // Legacy resource brush method
      if (typeof brush.cycleResourceType === 'function') { if (step > 0) brush.cycleResourceType(); else { /* no backward legacy */ } return true; }
      // Fallback: adjust availableTypes index if exposed
      if (Array.isArray(brush.availableTypes) && typeof brush.currentIndex === 'number') {
        const len = brush.availableTypes.length;
        brush.currentIndex = ((brush.currentIndex + step) % len + len) % len;
        brush.currentType = brush.availableTypes[brush.currentIndex];
        if (typeof brush.onTypeChanged === 'function') { try { brush.onTypeChanged(brush.currentType); } catch(e){} }
        return true;
      }
      return false;
    };

    // Priority order: Enemy brush, Resource brush, Lightning aim brush, Queen powers
    if (window.g_enemyAntBrush && tryCycleDir(window.g_enemyAntBrush)) {
      event.preventDefault();
      return false;
    }
    if (window.g_resourceBrush && tryCycleDir(window.g_resourceBrush)) {
      event.preventDefault();
      return false;
    }
    if (window.g_lightningAimBrush && tryCycleDir(window.g_lightningAimBrush)) {
      event.preventDefault();
      return false;
    }
    if (window.g_flashAimBrush && tryCycleDir(window.g_flashAimBrush)) {
      event.preventDefault();
      return false;
    }
    if (window.g_fireballAimBrush && tryCycleDir(window.g_fireballAimBrush)) {
      event.preventDefault();
      return false;
    }
    
    // Queen power cycling with mouse wheel
    if (window.g_queenControlPanel && window.g_queenControlPanel.handleMouseWheel(delta)) {
      event.preventDefault();
      return false;
    }
    
    // If no brush consumed the event, delegate to CameraManager for zoom (PLAYING state)
    if (cameraManager && typeof cameraManager.handleMouseWheel === 'function') {
      return cameraManager.handleMouseWheel(event);
    }

  } catch (e) {
    console.error('❌ Error handling mouseWheel for brushes:', e);
  }
  // Let other handlers/processes receive the event if no brush consumed it
  return true;
}
