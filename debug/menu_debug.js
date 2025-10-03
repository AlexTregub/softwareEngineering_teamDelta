/**
 * @fileoverview Debug module for menu layout tuning with interactive Button controls.
 * Provides visual debugging overlay and interactive controls for adjusting menu positioning.
 * Uses real Button class instances for controls and maintains compatibility with legacy systems.
 * 
 * @author Team Delta
 * @version 1.0.0
 */

/** @type {boolean} Tracks if keyboard event listeners have been attached */
let _menuDebugListenerAttached = false;

/** @type {boolean} Tracks if pointer event listeners have been attached */
let _menuDebugPointerAttached = false;

/** @type {Array<Object>} Legacy compatibility rects for fallback hit testing */
let menuDebugControlRects = [];

/** @type {boolean} Tracks if panel is being dragged */
let menuDebugDragging = false;

/** @type {number} Y coordinate where drag started */
let menuDebugDragStartY = 0;

/** @type {number} Menu offset when drag started */
let menuDebugDragStartOffset = 0;

/** @type {Array<Button>|null} Button class instances for debug controls */
let _menuDebugButtons = null;

/** @type {boolean} Tracks if first-frame draw log has been shown */
let _drawLogged = false;

/** @type {Array<number>} History of menuYOffset values for undo/redo */
const menuYOffsetHistory = [];

/** @type {number} Current position in history array */
let menuYOffsetHistoryIndex = -1;

/**
 * Pushes a new value to the menuYOffset history for undo/redo functionality.
 * Maintains a maximum of 50 history entries.
 * 
 * @param {number} val - The menuYOffset value to add to history
 */
function _pushMenuYOffsetHistory(val) {
  if (menuYOffsetHistoryIndex < menuYOffsetHistory.length - 1) {
    menuYOffsetHistory.splice(menuYOffsetHistoryIndex + 1);
  }
  menuYOffsetHistory.push(val);
  if (menuYOffsetHistory.length > 50) menuYOffsetHistory.shift();
  menuYOffsetHistoryIndex = menuYOffsetHistory.length - 1;
}

/**
 * Initialize menu debug UI with Universal UI Debug System integration
 */
function initMenuDebugUI() {
  // Register debug panel with UI Debug System if available
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
    g_uiDebugManager.registerElement(
      'menu-debug-panel',
      { x: 8, y: (typeof g_canvasY !== 'undefined' ? g_canvasY : 600) - 108, width: 400, height: 100 },
      (x, y) => {
        // Update panel position for menu debug rendering
        if (typeof window._menuDebugPanelX !== 'undefined') {
          window._menuDebugPanelX = x;
          window._menuDebugPanelY = y;
        }
      },
      {
        label: 'Menu Debug Panel',
        isDraggable: true,
        persistKey: 'menuDebugPanel'
      }
    );
  }
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.initMenuDebugUI = initMenuDebugUI;
}

/**
 * Undos the last menuYOffset change by moving back in history.
 * Updates the menu position and persists the change to localStorage.
 */
function _undoMenuYOffset() {
  if (menuYOffsetHistoryIndex > 0) {
    menuYOffsetHistoryIndex -= 1;
    menuYOffset = menuYOffsetHistory[menuYOffsetHistoryIndex];
    try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (e) {}
    titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
    loadButtons();
  }
}

/**
 * Redos the next menuYOffset change by moving forward in history.
 * Updates the menu position and persists the change to localStorage.
 */
function _redoMenuYOffset() {
  if (menuYOffsetHistoryIndex < menuYOffsetHistory.length - 1) {
    menuYOffsetHistoryIndex += 1;
    menuYOffset = menuYOffsetHistory[menuYOffsetHistoryIndex];
    try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (e) {}
    titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
    loadButtons();
  }
}

/**
 * Handles keyboard input for debug mode toggle and menu positioning.
 * 
 * @param {KeyboardEvent} e - The keyboard event
 * @private
 */
function _handleDebugKeydown(e) {
  if (e.key === '`' || e.key === '~') {
    window.menuLayoutDebug = !window.menuLayoutDebug;
    e.preventDefault();
    return;
  }
  if (!window.menuLayoutDebug) return;

  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { 
    _undoMenuYOffset(); 
    e.preventDefault(); 
    return; 
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { 
    _redoMenuYOffset(); 
    e.preventDefault(); 
    return; 
  }

  const handled = _processMenuPositionKeys(e);
  if (handled) {
    _updateMenuPosition();
    e.preventDefault();
  }
}

/**
 * Processes keyboard input for menu position adjustments.
 * 
 * @param {KeyboardEvent} e - The keyboard event
 * @returns {boolean} True if the key was handled
 * @private
 */
function _processMenuPositionKeys(e) {
  let handled = false;
  const shift = e.shiftKey;
  const ctrl = e.ctrlKey || e.metaKey;
  let smallStep = 5;
  let largeStep = 25;
  const mod = shift ? 0.2 : (ctrl ? 2 : 1);
  smallStep = Math.max(1, Math.round(smallStep * mod));
  largeStep = Math.max(1, Math.round(largeStep * mod));

  if (['ArrowUp','ArrowDown','PageUp','PageDown','+','=','-','_'].includes(e.key) || e.key === 'Home') {
    _pushMenuYOffsetHistory(menuYOffset);
  }
  
  if (e.key === 'ArrowUp') { menuYOffset -= smallStep; handled = true; }
  if (e.key === 'ArrowDown') { menuYOffset += smallStep; handled = true; }
  if (e.key === 'PageUp') { menuYOffset -= largeStep; handled = true; }
  if (e.key === 'PageDown') { menuYOffset += largeStep; handled = true; }
  if (e.key === 'Home') { menuYOffset = initialMenuYOffset; handled = true; }
  if (e.key === '+' || e.key === '=') { menuYOffset -= smallStep; handled = true; }
  if (e.key === '-' || e.key === '_') { menuYOffset += smallStep; handled = true; }

  return handled;
}

/**
 * Updates menu position and persists changes after keyboard input.
 * 
 * @private
 */
function _updateMenuPosition() {
  try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {}
  titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
  loadButtons();
}

/**
 * Sets up keyboard event listeners for debug controls.
 * 
 * @private
 */
function _setupKeyboardListeners() {
  if (!_menuDebugListenerAttached) {
    window.addEventListener('keydown', _handleDebugKeydown);
    _menuDebugListenerAttached = true;
  }
}

/**
 * Initializes the menu debug system by setting up event listeners and shared state.
 * Sets up keyboard controls for toggling debug mode and adjusting menu position.
 * Sets up pointer controls for button interactions and panel dragging.
 * 
 * @public
 */
function initializeMenuDebug() {
  if (typeof window.menuLayoutDebug === 'undefined') window.menuLayoutDebug = false;
  
  _setupKeyboardListeners();
  _setupPointerListeners();

  if (menuYOffsetHistoryIndex === -1) _pushMenuYOffsetHistory(menuYOffset);
}

/**
 * Gets canvas-relative coordinates from a pointer event.
 * 
 * @param {PointerEvent} ev - The pointer event
 * @returns {{x: number, y: number}|null} Canvas coordinates or null if no canvas found
 * @private
 */
function _getCanvasCoordinates(ev) {
  const canvasEl = document.querySelector('canvas');
  if (!canvasEl) return null;
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: ev.clientX - rect.left,
    y: ev.clientY - rect.top
  };
}

/**
 * Handles button clicks for debug controls.
 * 
 * @param {number} cx - Canvas X coordinate
 * @param {number} cy - Canvas Y coordinate
 * @param {PointerEvent} ev - The pointer event
 * @returns {boolean} True if a button was clicked
 * @private
 */
function _handleButtonClick(cx, cy, ev) {
  if (_menuDebugButtons && Array.isArray(_menuDebugButtons)) {
    for (const btn of _menuDebugButtons) {
      const b = btn.getBounds ? btn.getBounds() : { x: btn.x, y: btn.y, width: btn.width, height: btn.height };
      if (cx >= b.x && cy >= b.y && cx <= b.x + b.width && cy <= b.y + b.height) {
        if ((btn._action !== 'undo') && (btn._action !== 'redo')) _pushMenuYOffsetHistory(menuYOffset);
        
        try {
          if (typeof btn.action === 'function') btn.action();
          else if (typeof btn.onClick === 'function') btn.onClick(btn);
        } catch (err) {}
        
        _updateMenuPosition();
        ev.preventDefault();
        return true;
      }
    }
  }
  return false;
}

/**
 * Handles legacy rect-based button clicks for fallback compatibility.
 * 
 * @param {number} cx - Canvas X coordinate
 * @param {number} cy - Canvas Y coordinate
 * @param {PointerEvent} ev - The pointer event
 * @returns {boolean} True if a button was clicked
 * @private
 */
function _handleLegacyButtonClick(cx, cy, ev) {
  for (const r of menuDebugControlRects) {
    if (cx >= r.x && cy >= r.y && cx <= r.x + r.w && cy <= r.y + r.h) {
      if (r.action !== 'undo' && r.action !== 'redo') _pushMenuYOffsetHistory(menuYOffset);
      if (r.action === 'inc') menuYOffset += r.amount;
      if (r.action === 'dec') menuYOffset -= r.amount;
      if (r.action === 'reset') menuYOffset = initialMenuYOffset;
      if (r.action === 'save') { try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {} }
      if (r.action === 'undo') { _undoMenuYOffset(); }
      if (r.action === 'redo') { _redoMenuYOffset(); }
      _updateMenuPosition();
      ev.preventDefault();
      return true;
    }
  }
  return false;
}

/**
 * Checks if coordinates are within the debug panel drag area.
 * 
 * @param {number} cx - Canvas X coordinate
 * @param {number} cy - Canvas Y coordinate
 * @returns {boolean} True if within drag area
 * @private
 */
function _isInPanelDragArea(cx, cy) {
  const panelX = 8;
  const panelY = (g_canvasY - 108);
  const panelW = 380;
  const panelH = 100;
  return cx >= panelX && cy >= panelY && cx <= panelX + panelW && cy <= panelY + panelH;
}

/**
 * Handles pointer down events for debug controls.
 * 
 * @param {PointerEvent} ev - The pointer event
 * @private
 */
function _handlePointerDown(ev) {
  if (!window.menuLayoutDebug) return;
  try {
    const coords = _getCanvasCoordinates(ev);
    if (!coords) return;
    
    const { x: cx, y: cy } = coords;
    
    if (_handleButtonClick(cx, cy, ev)) return;
    if (_handleLegacyButtonClick(cx, cy, ev)) return;
    
    if (_isInPanelDragArea(cx, cy)) {
      menuDebugDragging = true;
      menuDebugDragStartY = cy;
      menuDebugDragStartOffset = menuYOffset;
      _pushMenuYOffsetHistory(menuYOffset);
      ev.preventDefault();
    }
  } catch (err) {}
}

/**
 * Handles pointer move events for panel dragging.
 * 
 * @param {PointerEvent} ev - The pointer event
 * @private
 */
function _handlePointerMove(ev) {
  if (!window.menuLayoutDebug) return;
  if (!menuDebugDragging) return;
  try {
    const coords = _getCanvasCoordinates(ev);
    if (!coords) return;
    
    const dy = coords.y - menuDebugDragStartY;
    menuYOffset = menuDebugDragStartOffset + Math.round(dy);
    titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
    loadButtons();
    ev.preventDefault();
  } catch (err) {}
}

/**
 * Handles pointer up events to end dragging.
 * 
 * @param {PointerEvent} ev - The pointer event
 * @private
 */
function _handlePointerUp(ev) {
  if (!window.menuLayoutDebug) return;
  if (!menuDebugDragging) return;
  menuDebugDragging = false;
  _updateMenuPosition();
  
  if (_menuDebugButtons) {
    for (const btn of _menuDebugButtons) {
      btn.isPressed = false;
    }
  }
}

/**
 * Sets up pointer event listeners for debug controls.
 * 
 * @private
 */
function _setupPointerListeners() {
  if (!_menuDebugPointerAttached) {
    window.addEventListener('pointerdown', _handlePointerDown);
    window.addEventListener('pointermove', _handlePointerMove);
    window.addEventListener('pointerup', _handlePointerUp);
    _menuDebugPointerAttached = true;
  }
}

/**
 * Draws the menu header debug information.
 * 
 * @private
 */
function _drawMenuHeaderDebug() {
  if (menuHeader && menuHeader.img) {
    const hx = g_canvasX / 2 - menuHeader.w / 2;
    const hy = menuHeader.y;
    rect(hx, hy, menuHeader.w, menuHeader.h);
    noStroke();
    fill(255,0,0);
    textSize(12);
    textAlign(LEFT, TOP);
    text(`header: ${menuHeader.w}x${menuHeader.h}`, hx + 4, hy + 4);
  }
}

/**
 * Draws debug rectangles for menu elements.
 * 
 * @param {Array<Object>} debugRects - Array of debug rectangle data
 * @private
 */
function _drawDebugRects(debugRects) {
  debugRects.forEach(r => {
    stroke(0,255,255);
    noFill();
    strokeWeight(1.5);
    rect(r.x, r.y, r.w, r.h);
    noStroke();
    fill(0,255,255);
    textSize(12);
    textAlign(LEFT, TOP);
    const label = `${r.text} ${r.w}x${r.h}`;
    text(label, r.x + 4, r.y + 4);
  });
}

/**
 * Draws debug group rectangles for clustered menu elements.
 * 
 * @param {Array<Object>} debugRects - Array of debug rectangle data
 * @private
 */
function _drawDebugGroups(debugRects) {
  if (debugRects.length === 0) return;
  
  const tol = 8;
  const rects = debugRects.slice().sort((a,b) => a.y - b.y);
  const clusters = [];
  
  rects.forEach(r => {
    let placed = false;
    for (const c of clusters) {
      const meanY = c.reduce((s,i) => s + i.y, 0) / c.length;
      if (Math.abs(meanY - r.y) <= tol) { c.push(r); placed = true; break; }
    }
    if (!placed) clusters.push([r]);
  });
  
  const pad = 20;
  clusters.forEach(groupItems => {
    let minX = Math.min(...groupItems.map(i => i.x));
    let minY = Math.min(...groupItems.map(i => i.y));
    let maxX = Math.max(...groupItems.map(i => i.x + i.w));
    let maxY = Math.max(...groupItems.map(i => i.y + i.h));
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const gw = maxX - minX, gh = maxY - minY;
    stroke(0,200,0); strokeWeight(3); noFill(); rect(minX,minY,gw,gh);
    noStroke(); fill(0,150); rect(minX + 4, minY + 4, 100, 20);
    fill(200,255,200); textSize(12); textAlign(LEFT, TOP); text(`group ${gw}x${gh}`, minX + 8, minY + 6);
  });
}

/**
 * Draws debug center points for menu elements.
 * 
 * @param {Array<Object>} centers - Array of center point data
 * @private
 */
function _drawDebugCenters(centers) {
  centers.forEach(c => {
    noStroke(); fill(255,255,0); ellipse(c.cx, c.cy, 6, 6);
    fill(255,255,0); textSize(10); textAlign(LEFT, TOP); text(`${c.text}`, c.cx + 6, c.cy - 6);
  });
}

/**
 * Draws debug image information.
 * 
 * @param {Array<Object>} debugImgs - Array of debug image data
 * @private
 */
function _drawDebugImages(debugImgs) {
  if (debugImgs.length === 0) return;
  
  noStroke(); fill(255); textSize(11); textAlign(LEFT, TOP);
  debugImgs.forEach((d,i) => text(`img ${d.text} intrinsic ${d.iw}x${d.ih} drawn ${d.dw}x${d.dh}`, 8, 8 + 14 * i));
}

/**
 * Draws the debug control panel with instructions and current offset.
 * 
 * @private
 */
function _drawDebugPanel() {
  noStroke(); 
  fill(0,180);
  const panelX = 8, panelY = g_canvasY - 108, panelW = 380, panelH = 100;
  rect(panelX, panelY, panelW, panelH);
  
  fill(255); 
  textSize(12); 
  textAlign(LEFT, TOP);
  const hints = [
    "Keyboard: ArrowUp/Down = ±5px | PageUp/Down = ±25px | Home = reset",
    "Modifiers: Shift = finer (0.2x), Ctrl/Cmd = coarser (2x)",
    `Current menuYOffset: ${menuYOffset}`
  ];
  hints.forEach((t,i) => text(t, panelX + 8, panelY + 8 + 16 * i));
}

/**
 * Gets the button definitions for debug controls.
 * 
 * @returns {Array<Object>} Button configuration definitions
 * @private
 */
function _getButtonDefinitions() {
  return [
    { label: '-25', action: 'dec', amount: 25 },
    { label: '-5', action: 'dec', amount: 5 },
    { label: 'Undo', action: 'undo', amount: 0 },
    { label: 'Reset', action: 'reset', amount: 0 },
    { label: 'Redo', action: 'redo', amount: 0 },
    { label: '+5', action: 'inc', amount: 5 },
    { label: '+25', action: 'inc', amount: 25 }
  ];
}

/**
 * Creates Button instances for debug controls if they don't exist.
 * 
 * @private
 */
function _createDebugButtons() {
  const btnDefs = _getButtonDefinitions();
  const panelX = 8, panelY = g_canvasY - 108;
  const btnY = panelY + 56; const btnH = 28; const btnW = 56;
  
  if (!_menuDebugButtons) _menuDebugButtons = [];
  if (_menuDebugButtons.length !== btnDefs.length) {
    _menuDebugButtons.length = 0;
    let bx = panelX + 8;
    
    for (const d of btnDefs) {
      const btn = new Button(bx, btnY, btnW, btnH, d.label, { onClick: () => {
        console.log('menu_debug button clicked:', d.label, d.action);
        btn._action = d.action;
        try { if (d.action !== 'undo' && d.action !== 'redo') _pushMenuYOffsetHistory(menuYOffset); } catch (e) {}
        try { if (d.action === 'inc') menuYOffset += d.amount; } catch (e) {}
        try { if (d.action === 'dec') menuYOffset -= d.amount; } catch (e) {}
        try { if (d.action === 'reset') menuYOffset = initialMenuYOffset; } catch (e) {}
        try { if (d.action === 'undo') _undoMenuYOffset(); } catch (e) {}
        try { if (d.action === 'redo') _redoMenuYOffset(); } catch (e) {}
        try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {}
        try { titleTargetY = g_canvasY / 2 - 150 + menuYOffset; } catch (e) {}
        try { loadButtons(); } catch (e) {}
      }});
      btn._action = d.action;
      _menuDebugButtons.push(btn);
      bx += btnW + 8;
    }
    
    try { if (typeof setActiveButtons === 'function') setActiveButtons(_menuDebugButtons); } catch (err) {}
    console.log('menu_debug_buttons_test initialized - buttons created:', _menuDebugButtons.length);
  }
}

/**
 * Renders Button instances for debug controls.
 * 
 * @private
 */
function _renderButtonInstances() {
  const panelX = 8, panelY = g_canvasY - 108;
  const btnY = panelY + 56; const btnW = 56;
  
  const mx = (typeof window._mouseX !== 'undefined') ? window._mouseX : (typeof mouseX !== 'undefined' ? mouseX : 0);
  const my = (typeof window._mouseY !== 'undefined') ? window._mouseY : (typeof mouseY !== 'undefined' ? mouseY : 0);
  const mPressed = (typeof window._mouseIsPressed !== 'undefined') ? window._mouseIsPressed : (typeof mouseIsPressed !== 'undefined' ? mouseIsPressed : false);
  
  let bx = panelX + 8;
  for (const b of _menuDebugButtons) {
    try { if (typeof b.setPosition === 'function') b.setPosition(bx, btnY); } catch (e) {}
    try { if (typeof b.update === 'function') b.update(mx, my, mPressed); } catch (e) {}
    try { if (typeof b.render === 'function') b.render(); } catch (e) {}
    
    const bb = b.getBounds ? b.getBounds() : { x: b.x, y: b.y, width: b.width, height: b.height };
    menuDebugControlRects.push({ x: bb.x, y: bb.y, w: bb.width, h: bb.height, action: b._action, amount: 0 });
    bx += btnW + 8;
  }

  if (!_drawLogged) { 
    console.log('menu_debug buttons drawn (first frame)'); 
    _drawLogged = true; 
  }
}

/**
 * Renders fallback buttons when Button class is not available.
 * 
 * @private
 */
function _renderFallbackButtons() {
  const btnDefs = _getButtonDefinitions();
  const panelX = 8, panelY = g_canvasY - 108;
  const btnY = panelY + 56; const btnH = 28; const btnW = 56;
  
  let bx = panelX + 8;
  for (const b of btnDefs) {
    // Use centralized button styles if available, otherwise fallback to hardcoded values
    const styles = (typeof ButtonStyles !== 'undefined') ? ButtonStyles.DEBUG_FALLBACK : {
      backgroundColor: '#3C3C3C',
      borderColor: '#C8C8C8',
      textColor: '#FFFFFF',
      borderWidth: 1,
      cornerRadius: 4,
      fontSize: 12
    };
    
    stroke(styles.borderColor); 
    strokeWeight(styles.borderWidth); 
    fill(styles.backgroundColor); 
    rect(bx, btnY, btnW, btnH, styles.cornerRadius);
    
    noStroke(); 
    fill(styles.textColor); 
    textSize(styles.fontSize); 
    textAlign(CENTER, CENTER); 
    text(b.label, bx + btnW/2, btnY + btnH/2);
    
    menuDebugControlRects.push({ x: bx, y: btnY, w: btnW, h: btnH, action: b.action, amount: b.amount });
    bx += btnW + 8;
  }
}

/**
 * Draws debug control buttons, using Button class instances when available.
 * 
 * @private
 */
function _drawDebugButtons() {
  menuDebugControlRects.length = 0;
  const useButtonClass = (typeof Button === 'function');

  if (useButtonClass) {
    _createDebugButtons();
    _renderButtonInstances();
  } else {
    _renderFallbackButtons();
  }
}

/**
 * Renders the debug overlay with visual debugging information and interactive controls.
 * Displays bounding boxes for menu elements, control buttons, and drag handle.
 * Creates and manages Button class instances for user interaction.
 * 
 * @public
 */
function drawMenuDebug() {
  if (!window.menuLayoutDebug) return;
  try {
    push();
    noFill();
    stroke(255,0,0);
    strokeWeight(2);
    
    const layout = (window.menuLayoutData || {});
    const menuDebugRects = layout.debugRects || [];
    const menuDebugGroups = layout.groupRects || [];
    const menuDebugCenters = layout.centers || [];
    const menuDebugImgs = layout.debugImgs || [];

    _drawMenuHeaderDebug();
    _drawDebugRects(menuDebugRects);
    _drawDebugGroups(menuDebugRects);
    _drawDebugCenters(menuDebugCenters);
    _drawDebugImages(menuDebugImgs);

    _drawDebugPanel();
    _drawDebugButtons();

    pop();
  } catch (err) {
    console.warn('Debug rendering error:', err);
  }
}

/**
 * Expose debug functions to global scope for integration with main menu system.
 */
window.initializeMenuDebug = initializeMenuDebug;
window.drawMenuDebug = drawMenuDebug;
