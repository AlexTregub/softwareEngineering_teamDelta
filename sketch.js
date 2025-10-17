
// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
const CHUNKS_X = 20;
const CHUNKS_Y = 20;
let COORDSY;

const NONE = '\0'; 

// --- CONTROLLER DECLARATIONS ---
let g_mouseController;
let g_keyboardController;
let g_selectionBoxController;
let g_uiSelectionController; // UI Effects Layer Selection Controller
let g_tileInteractionManager; // Efficient tile-based interaction system
// --- WORLD GENERATION ---
let g_seed;
let g_map;
let g_map2;
let g_gridMap;
// --- UI ---
let g_menuFont;
// --- IDK! ----
let g_recordingPath;
// -- Queen ---
let queenAnt;

// Camera system - now managed by CameraManager
let cameraManager;

function preload(){
  terrainPreloader();
  menuPreload();
  antsPreloader();
  resourcePreLoad();
  preloadPauseImages();
  
  // Load presentation assets
  if (typeof loadPresentationAssets !== 'undefined') {
    loadPresentationAssets();
  }
}


function setup() {
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  RenderMangerOverwrite = false
  createCanvas(g_canvasX, g_canvasY);
  initializeWorld();

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);

  // Ensure selection adapter is registered with RenderManager now that controller exists
  try {
    if (!RenderManager._registeredDrawables) RenderManager._registeredDrawables = {};
    if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBoxInteractive) {
      const selectionAdapter = {
        hitTest: function(pointer) { return true; },
        onPointerDown: function(pointer) { try { g_selectionBoxController.handleClick(pointer.screen.x, pointer.screen.y, 'left'); return true; } catch(e) { return false; } },
        onPointerMove: function(pointer) { try { g_selectionBoxController.handleDrag(pointer.screen.x, pointer.screen.y); return true; } catch(e) { return false; } },
        onPointerUp: function(pointer) { try { g_selectionBoxController.handleRelease(pointer.screen.x, pointer.screen.y, 'left'); return true; } catch(e) { return false; } }
      };
      RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, selectionAdapter);
      RenderManager._registeredDrawables.selectionBoxInteractive = true;
    }
    if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBox) {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, g_selectionBoxController.draw.bind(g_selectionBoxController));
      RenderManager._registeredDrawables.selectionBox = true;
    }
  } catch (e) { console.warn('Failed to ensure selection adapter registration', e); }

  // Connect keyboard controller for general input handling
  g_keyboardController.onKeyPress((keyCode, key) => {
    // UI shortcuts are now handled directly in keyPressed() function
    // This maintains compatibility with existing game input systems
  });

  // Initialize camera management system
  cameraManager = new CameraManager();
  cameraManager.initialize();

  initializeMenu();  // Initialize the menu system
  renderPipelineInit();
}

/**
 * initializeWorld
 * ----------------
 * Encapsulates the world and map initialization that was previously inlined
 * inside setup(). Keeps setup() concise and makes the initialization reusable
 * for tests or reset logic.
 */
function initializeWorld() {

  g_seed = hour()*minute()*floor(second()/10);

  g_map = new Terrain(g_canvasX,g_canvasY,TILE_SIZE);
  // MAP.randomize(g_seed); // ROLLED BACK RANDOMIZATION, ALLOWING PATHFINDING, ALL WEIGHTS SAME
  
  // New, Improved, and Chunked Terrain
  // g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[g_canvasX,g_canvasY]);
  // disableTerrainCache(); // TEMPORARILY DISABLING CACHE. BEGIN MOVING THINGS OVER.
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[windowWidth,windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion.alignToCanvas(); // Snaps grid to canvas 
  
  // COORDSY = new CoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  g_gridMap = new PathMap(g_map);
  
   // Initialize the render layer manager if not already done
  RenderManager.initialize();
  // Register common drawables once (guarded to avoid double-registration)
  try {
    if (!RenderManager._registeredDrawables) RenderManager._registeredDrawables = {};

    // Register SelectionBoxController as an interactive so RenderManager dispatches pointer events to it
    try {
      if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBoxInteractive) {
        const selectionAdapter = {
          hitTest: function(pointer) {
            // Always allow selection adapter to receive events on the UI layer
            return true;
          },
          _toWorld: function(px, py) {
            try {
              const cam = (typeof window !== 'undefined' && window.g_cameraManager) ? window.g_cameraManager : (typeof cameraManager !== 'undefined' ? cameraManager : null);
              if (cam && typeof cam.screenToWorld === 'function') {
                const w = cam.screenToWorld(px, py);
                return { x: (w.worldX !== undefined ? w.worldX : (w.x !== undefined ? w.x : px)), y: (w.worldY !== undefined ? w.worldY : (w.y !== undefined ? w.y : py)) };
              }
              // fallback: use global camera offsets if present
              const camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : 0;
              const camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : 0;
              return { x: px + camX, y: py + camY };
            } catch (e) { return { x: px, y: py }; }
          },
          onPointerDown: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleClick === 'function') {
                // SelectionBoxController expects screen-local coordinates (it adds cameraX internally)
                g_selectionBoxController.handleClick(pointer.screen.x, pointer.screen.y, 'left');
                return true;
              }
            } catch (e) { console.warn('selectionAdapter.onPointerDown failed', e); }
            return false;
          },
          onPointerMove: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleDrag === 'function') {
                g_selectionBoxController.handleDrag(pointer.screen.x, pointer.screen.y);
                return true;
              }
            } catch (e) { /* ignore */ }
            return false;
          },
          onPointerUp: function(pointer) {
            try {
              if (g_selectionBoxController && typeof g_selectionBoxController.handleRelease === 'function') {
                g_selectionBoxController.handleRelease(pointer.screen.x, pointer.screen.y, 'left');
                return true;
              }
            } catch (e) { /* ignore */ }
            return false;
          }
        };
        RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, selectionAdapter);
        RenderManager._registeredDrawables.selectionBoxInteractive = true;
      }
    } catch (e) { console.warn('Failed to register selection adapter with RenderManager', e); }
    // Selection box should render in the UI_GAME layer
    if (g_selectionBoxController && !RenderManager._registeredDrawables.selectionBox) {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, g_selectionBoxController.draw.bind(g_selectionBoxController));
      RenderManager._registeredDrawables.selectionBox = true;
    }

    // Gather debug renderer overlays (effects layer)
    if (typeof g_gatherDebugRenderer !== 'undefined' && g_gatherDebugRenderer && !RenderManager._registeredDrawables.gatherDebug) {
      if (typeof g_gatherDebugRenderer.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.EFFECTS, g_gatherDebugRenderer.render.bind(g_gatherDebugRenderer));
        RenderManager._registeredDrawables.gatherDebug = true;
      }
    }

    // Dropoff UI and pause menu UI belong to UI_GAME layer if available
    if (typeof window !== 'undefined') {
      if (typeof window.drawDropoffUI === 'function' && !RenderManager._registeredDrawables.drawDropoffUI) {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.drawDropoffUI.bind(window));
        RenderManager._registeredDrawables.drawDropoffUI = true;
      }
      if (typeof window.renderPauseMenuUI === 'function' && !RenderManager._registeredDrawables.renderPauseMenuUI) {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.renderPauseMenuUI.bind(window));
        RenderManager._registeredDrawables.renderPauseMenuUI = true;
      }
    }

    // Draggable panels: ensure the manager is registered to UI layer
    if (typeof window !== 'undefined' && window.draggablePanelManager && !RenderManager._registeredDrawables.draggablePanelManager) {
      if (typeof window.draggablePanelManager.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.draggablePanelManager.render.bind(window.draggablePanelManager));
        RenderManager._registeredDrawables.draggablePanelManager = true;
      }
    }

    // Button groups: update is still handled in update cycle, but rendering belongs to UI_GAME
    if (window.buttonGroupManager && !RenderManager._registeredDrawables.buttonGroupManager) {
      if (typeof window.buttonGroupManager.render === 'function') {
        RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, window.buttonGroupManager.render.bind(window.buttonGroupManager));
        RenderManager._registeredDrawables.buttonGroupManager = true;
      }
    }
  } catch (err) {
    console.error('❌ Error registering drawables with RenderManager:', err);
  }
  queenAnt = spawnQueen();
}

/**
 * draw
 * ----
 * Main rendering loop for the game.
 * uses the RenderManager to render the current game state.
 * Also updates draggable panels if in the PLAYING state.
 * Called automatically by p5.js at the frame rate.
 */

function draw() {  
  // Input-driven updates are handled by interactive adapters registered with RenderManager.
  // Draggable panels and other UI elements now receive pointer events via RenderManager.

  RenderManager.render(GameState.getState());

  // --- PLAYING ---
  if (GameState.isInGame()) {
    // Update camera before rendering (RenderManager will apply transforms
    // for the different layers during the render pass).
    if (cameraManager) {
      cameraManager.update();
    }

    const playerQueen = getQueen();
    if (playerQueen) {
      // WASD key codes: W=87 A=65 S=83 D=68
      if (keyIsDown(87)) playerQueen.move("w");
      if (keyIsDown(65)) playerQueen.move("a");
      if (keyIsDown(83)) playerQueen.move("s");
      if (keyIsDown(68)) playerQueen.move("d");
    }
  }

  // Note: rendering of draggable panels is handled via RenderManager's
  // ui_game layer (DraggablePanelManager integrates into the render layer).
  // We intentionally do NOT call renderDraggablePanels() here to avoid a
  // second draw pass within the same frame which would leave a ghost of
  // the pre-update positions.

}

 /* handleMouseEvent
 * ----------------
 * Delegates mouse events to the mouse controller if the game is in an active state.
 * @param {string} type - The mouse event type (e.g., 'handleMousePressed').
 * @param {...any} args - Arguments to pass to the controller handler.
 */
function handleMouseEvent(type, ...args) {
  if (GameState.isInGame()) {
    g_mouseController[type](...args);
    console.log(g_map2.renderConversion.convCanvasToPos([mouseX,mouseY]));
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() { 
  // Handle UI Debug Manager mouse events first
  if (g_uiDebugManager && g_uiDebugManager.isActive) {
    const handled = g_uiDebugManager.handlePointerDown({ x: mouseX, y: mouseY });
    if (handled) return;
  }

  // Forward to RenderManager interactive dispatch first (gives adapters priority)
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointerdown', { x: mouseX, y: mouseY, isPressed: true });
    if (consumed) return; // consumed by an interactive (buttons/panels/etc.)
    // If not consumed, let higher-level systems decide; legacy fallbacks removed in favor of RenderManager adapters.
  } catch (e) {
    console.error('Error dispatching pointerdown to RenderManager:', e);
    // best-effort: still notify legacy controller if present to avoid breaking older flows
    try { handleMouseEvent('handleMousePressed', window.getWorldMouseX && window.getWorldMouseX(), window.getWorldMouseY && window.getWorldMouseY(), mouseButton); } catch (er) {}
  }

  // Legacy mouse controller fallbacks removed - RenderManager should handle UI dispatch.
}

function mouseDragged() {
  // Handle UI Debug Manager drag events
  if (g_uiDebugManager && g_uiDebugManager.isActive) {
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

function mouseReleased() {
  // Handle UI Debug Manager release events
  if (g_uiDebugManager && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerUp({ x: mouseX, y: mouseY });
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

// KEYBOARD INTERACTIONS

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
 * keyPressed
 * ----------
 * Handles key press events, prioritizing debug keys and ESC for selection clearing.
 */
function keyPressed() {
  // Handle all debug-related keys (command line, dev console, test hotkeys)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
  }
  
  if (keyCode === ESCAPE) {
    if (typeof deselectAllEntities === 'function') {
      deselectAllEntities();
    }
  }

  // Handle UI shortcuts first (Ctrl+Shift combinations)
  if (window.UIManager && window.UIManager.handleKeyPress) {
    const handled = window.UIManager.handleKeyPress(keyCode, key, window.event);
    if (handled) {
      return; // UI shortcut was handled, don't process further
    }
  }
  
  // Handle render layer toggles (Shift + C/V/B/N/M)
  if (keyIsDown(SHIFT) && RenderManager && RenderManager.isInitialized) {
    let handled = false;
    
    switch (key.toLowerCase()) {
      case 'c': // Shift+C - Toggle TERRAIN layer
        RenderManager.toggleLayer('terrain');
        handled = true;
        break;
      case 'v': // Shift+V - Toggle ENTITIES layer
        RenderManager.toggleLayer('entities');
        handled = true;
        break;
      case 'b': // Shift+B - Toggle EFFECTS layer
        RenderManager.toggleLayer('effects');
        handled = true;
        break;
      case 'n': // Shift+N - Toggle UI_GAME layer
        RenderManager.toggleLayer('ui_game');
        handled = true;
        break;
      case 'm': // Shift+M - Toggle UI_DEBUG layer
        RenderManager.toggleLayer('ui_debug');
        handled = true;
        break;
      case ',': // Shift+, - Toggle UI_MENU layer (comma key)
        RenderManager.toggleLayer('ui_menu');
        handled = true;
        break;
      case '.': // Shift+. - Enable all layers (period key)
        RenderManager.enableAllLayers();
        handled = true;
        break;
      case 'z': // Shift+1 - Toggle Sprint 5 image in menu
        if (typeof toggleSprintImageInMenu !== 'undefined') {
          toggleSprintImageInMenu();
        } else {
          console.warn('toggleSprintImageInMenu function not available');
        }
        handled = true;
        break;
        break;        
    }
    
    if (handled) {
      // Display current layer states
      console.log('🔧 Layer States:', RenderManager.getLayerStates());
      return; // Layer toggle was handled, don't process further
    }
  }

    // --- Queen Movement (Using WASD) ---
  let playerQueen = getQueen();
  if (typeof playerQueen !== "undefined" && playerQueen instanceof QueenAnt) {
    if (key.toLowerCase() === 'r') {
      playerQueen.emergencyRally();
      return;
    } 
    if (key.toLowerCase() === 'm') {
      playerQueen.gatherAntsAt(mouseX, mouseY);
      return;
    }
  }

  if (keyCode === ESCAPE && g_selectionBoxController) {
    g_selectionBoxController.deselectAll();
    return;
  }
  handleKeyEvent('handleKeyPressed', keyCode, key);

  if ((key === 'f' || key === 'F') && GameState.isInGame()) {
    cameraManager.toggleFollow();
  }
  
  // Camera navigation shortcuts
  if (GameState.isInGame() && cameraManager) {
    if (key === 'h' || key === 'H') {
      // 'H' for Home - Center camera on map center
      const mapCenterX = (CHUNKS_X * 8 * TILE_SIZE) / 2;
      const mapCenterY = (CHUNKS_Y * 8 * TILE_SIZE) / 2;
      cameraManager.centerOn(mapCenterX, mapCenterY);
    }
    
    if (key === 'o' || key === 'O') {
      // 'O' for Overview - Zoom out to see more of the map
      cameraManager.setZoom(0.2);
    }
    
    if (key === 'r' || key === 'R') {
      // 'R' for Reset zoom
      cameraManager.setZoom(1.0);
    }
  }

  if (GameState.isInGame() && cameraManager) {
    const currentZoom = cameraManager.getZoom();
    const CAMERA_ZOOM_STEP = 1.1; // Moved constant here since it's no longer global
    
    if (key === '-' || key === '_' || keyCode === 189 || keyCode === 109) {
      setCameraZoom(currentZoom / CAMERA_ZOOM_STEP);
    } else if (key === '=' || key === '+' || keyCode === 187 || keyCode === 107) {
      setCameraZoom(currentZoom * CAMERA_ZOOM_STEP);
    }
  }
}

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

function getEntityWorldCenter(entity) {
  if (!entity) return null;

  const pos = typeof entity.getPosition === 'function'
    ? entity.getPosition()
    : (entity.sprite?.pos ?? { x: entity.posX ?? 0, y: entity.posY ?? 0 });

  const size = typeof entity.getSize === 'function'
    ? entity.getSize()
    : (entity.sprite?.size ?? { x: entity.sizeX ?? TILE_SIZE, y: entity.sizeY ?? TILE_SIZE });

  const posX = pos?.x ?? pos?.[0] ?? 0;
  const posY = pos?.y ?? pos?.[1] ?? 0;
  const sizeX = size?.x ?? size?.[0] ?? TILE_SIZE;
  const sizeY = size?.y ?? size?.[1] ?? TILE_SIZE;

  return {
    x: posX + sizeX / 2,
    y: posY + sizeY / 2
  };
}

function getMapPixelDimensions() {
  if (!g_map2) {
    return { width: g_canvasX, height: g_canvasY };
  }

  const width = g_map2._xCount ? g_map2._xCount * TILE_SIZE : g_canvasX;
  const height = g_map2._yCount ? g_map2._yCount * TILE_SIZE : g_canvasY;
  const gridSize = g_map2.getGridSizePixels()
  return { width, height };
}



function mouseWheel(event) {
  // Delegate to CameraManager
  if (cameraManager) {
    return cameraManager.handleMouseWheel(event);
  }
  return true;
}
  

// DEBUG RENDERING FUNCTIONS
// These functions provide basic debug visualization capability


/**
 * drawDebugGrid
 * -------------
 * Draws a debug grid overlay for tile-based debugging.
 * @param {number} tileSize - Size of each tile in pixels
 * @param {number} gridWidth - Width of the grid in tiles
 * @param {number} gridHeight - Height of the grid in tiles
 */
function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  push();
  stroke(100, 100, 100, 100); // light gray grid lines
  const zoom = cameraManager ? cameraManager.getZoom() : 1;
  strokeWeight(1 / zoom);
  noFill();

  // Draw vertical grid lines
  for (let x = 0; x <= gridWidth * tileSize; x += tileSize) {
    line(x, 0, x, gridHeight * tileSize);
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  fill(255, 255, 0, 50); // transparent yellow
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);

  // Highlight selected ant's current tile
  if (selectedAnt) {
    const antTileX = Math.floor(selectedAnt.posX / tileSize);
    const antTileY = Math.floor(selectedAnt.posY / tileSize);
    fill(0, 255, 0, 80); // transparent green
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);
  }

  pop();
}

// Dynamic window resizing:
function windowResized() {
  g_map2.renderConversion.setCanvasSize([windowWidth,windowHeight]);
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;

  resizeCanvas(g_canvasX,g_canvasY);
}