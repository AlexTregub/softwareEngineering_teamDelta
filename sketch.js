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
let g_tileInteractionManager; // Efficient tile-based interaction system
// --- WORLD GENERATION ---
let g_seed;
let g_map;
let g_map2;
let g_gridMap;
let g_activeMap; // Reference to currently active terrain map (for level switching)
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
  console.log('[SETUP] About to create SelectionBoxController, g_mouseController:', g_mouseController, 'ants:', ants);
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);
  console.log('[SETUP] Created g_selectionBoxController:', g_selectionBoxController);
  window.g_selectionBoxController = g_selectionBoxController; // Ensure it's on window object

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

  // Initialize spatial grid manager for efficient entity queries
  if (typeof SpatialGridManager !== 'undefined') {
    window.spatialGridManager = new SpatialGridManager(TILE_SIZE * 2); // 64px cells
    logNormal('SpatialGridManager initialized with 64px cells');
    
    // Register spatial grid visualization in debug layer (only renders when enabled)
    if (typeof RenderManager !== 'undefined') {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
        if (window.VISUALIZE_SPATIAL_GRID && spatialGridManager) {
          spatialGridManager.visualize({ color: 'rgba(0, 255, 0, 0.3)' });
        }
      });
    }
  }
  
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
  
  // New, Improved, and Chunked Terrain using MapManager
  // g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[g_canvasX,g_canvasY]);
  // disableTerrainCache(); // TEMPORARILY DISABLING CACHE. BEGIN MOVING THINGS OVER.
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[windowWidth,windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion.alignToCanvas(); // Snaps grid to canvas 
  
  // IMPORTANT: Set g_activeMap immediately after g_map2 creation
  g_activeMap = g_map2;
  
  // Register with MapManager (which will also update g_activeMap)
  if (typeof mapManager !== 'undefined') {
    mapManager.registerMap('level1', g_map2, true);
    console.log("Main map registered with MapManager as 'level1' and set as active");
  }
  
  // COORDSY = new CoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  g_gridMap = new PathMap(g_map);
  
   // Initialize the render layer manager if not already done
  RenderManager.initialize();
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

    // Update and draw tile inspector hover overlay
    if (typeof updateHoveredTile === 'function') {
      updateHoveredTile(mouseX, mouseY);
    }
    if (typeof drawHoveredTileOverlay === 'function') {
      drawHoveredTileOverlay();
    }
    if (typeof drawInspectedTileIndicator === 'function') {
      drawInspectedTileIndicator();
    }
    if (typeof drawInspectorStatus === 'function') {
      drawInspectorStatus();
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
    if (g_activeMap && g_activeMap.renderConversion) {
      console.log(g_activeMap.renderConversion.convCanvasToPos([mouseX,mouseY]));
    }
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() { 
  // Tile Inspector - check first
  if (typeof tileInspectorEnabled !== 'undefined' && tileInspectorEnabled) {
    if (typeof inspectTileAtMouse === 'function') {
      inspectTileAtMouse(mouseX, mouseY);
      return; // Don't process other mouse events
    }
  }
  
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
  // Tile Inspector toggle (T key)
  if (key === 't' || key === 'T') {
    if (typeof toggleTileInspector === 'function') {
      toggleTileInspector();
      return;
    }
  }
  
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
 * getEntityWorldCenter
 * --------------------
 * Calculates the center position of an entity in world coordinates.
 * This function determines the position and size of the entity, either
 * through its methods or directly from its properties, and computes
 * the center point.
 *
 * @param {Object} entity - The entity whose center position is to be calculated.
 * @returns {Object|null} - An object containing the x and y coordinates of the center, or null if the entity is invalid.
 */
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

/**
 * getMapPixelDimensions
 * ---------------------
 * Returns the pixel dimensions of the active map.
 * If the map object (g_activeMap) is available, it calculates the dimensions
 * based on the number of tiles and their size. Otherwise, it defaults
 * to the canvas dimensions.
 *
 * @returns {Object} - An object containing the width and height of the map in pixels.
 */
function getMapPixelDimensions() {
  if (!g_activeMap) {
    return { width: g_canvasX, height: g_canvasY };
  }

  const width = g_activeMap._xCount ? g_activeMap._xCount * TILE_SIZE : g_canvasX;
  const height = g_activeMap._yCount ? g_activeMap._yCount * TILE_SIZE : g_canvasY;
  const gridSize = g_activeMap.getGridSizePixels()
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
  pop();
}

/**
 * setActiveMap
 * ------------
 * Sets the currently active terrain map by ID. Future-proof for level switching.
 * Delegates to MapManager for centralized map management.
 * 
 * @param {string|gridTerrain} mapIdOrMap - Map ID string or terrain map instance
 * @returns {boolean} True if successful, false if invalid
 * 
 * @example
 * // Switch by ID
 * setActiveMap('level2');
 * 
 * // Switch by creating new map
 * const newMap = new gridTerrain(20, 20, seed, 8, 32, [windowWidth, windowHeight]);
 * mapManager.registerMap('level2', newMap);
 * setActiveMap('level2');
 */
function setActiveMap(mapIdOrMap) {
  if (typeof mapManager === 'undefined') {
    console.error("setActiveMap: MapManager not available");
    return false;
  }
  
  // If passed a string ID, use MapManager
  if (typeof mapIdOrMap === 'string') {
    return mapManager.setActiveMap(mapIdOrMap);
  }
  
  // If passed a map object, register it and set active
  if (mapIdOrMap && typeof mapIdOrMap.chunkArray !== 'undefined') {
    const tempId = `map_${Date.now()}`;
    mapManager.registerMap(tempId, mapIdOrMap, true);
    return true;
  }
  
  console.error("setActiveMap: Invalid argument");
  return false;
}

/**
 * getActiveMap
 * ------------
 * Returns the currently active terrain map.
 * Delegates to MapManager for centralized access.
 * 
 * @returns {gridTerrain|null} The active terrain map, or null if none set
 */
function getActiveMap() {
  if (typeof mapManager !== 'undefined') {
    return mapManager.getActiveMap();
  }
  return g_activeMap || null;
}

// Dynamic window resizing:
function windowResized() {
  if (g_activeMap && g_activeMap.renderConversion) {
    g_activeMap.renderConversion.setCanvasSize([windowWidth,windowHeight]);
  }
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;

  resizeCanvas(g_canvasX,g_canvasY);
}