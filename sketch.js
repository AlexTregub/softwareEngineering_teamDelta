
// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
const CHUNKS_X = 20;
const CHUNKS_Y = 20;

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


/**
 * preload
 * -------
 * Preloads game assets and resources used during runtime.
 * Called by p5.js before setup to ensure textures, sprites, sounds, and fonts are available.
 * Assigns loaded assets to globals consumed by rendering and game systems.
 */
let MAP;
let cameraX = 0;
let cameraY = 0;
let cameraPanSpeed = 10;
let cameraZoom = 1;
const MIN_CAMERA_ZOOM = 0.5;
const MAX_CAMERA_ZOOM = 3;
const CAMERA_ZOOM_STEP = 1.1;
let cameraFollowEnabled = false;
let cameraFollowTarget = null;

function preload(){
  terrainPreloader();
  menuPreload();
  antsPreloader();
  resourcePreLoad();
  
  // Load presentation assets
  if (typeof loadPresentationAssets !== 'undefined') {
    loadPresentationAssets();
  }
}


function setup() {
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  createCanvas(g_canvasX, g_canvasY);
  initializeWorld();

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);

  // Connect keyboard controller for general input handling
  g_keyboardController.onKeyPress((keyCode, key) => {
    // UI shortcuts are now handled directly in keyPressed() function
    // This maintains compatibility with existing game input systems
  });

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
  
  // COORDSY = MAP.getCoordinateSystem();
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
  if (GameState.getState() === 'PLAYING') {  updateDraggablePanels(); }

  updatePresentationPanels(GameState.getState());

  // Update presentation panels for state-based visibility
  if (typeof updatePresentationPanels !== 'undefined') {
    updatePresentationPanels(GameState.getState());
  }
  RenderManager.render(GameState.getState());


  // background(0);
  // g_map2.renderDirect();

  // Use the new layered rendering system
  // Update legacy draggable panels BEFORE rendering so the render pipeline
  // sees the latest panel positions (avoids a pre-update render that leaves
  // a ghost image of the previous frame's positions).
  if (GameState.getState() === 'PLAYING') {
    try {
      if (typeof updateDraggablePanels !== 'undefined') { // Avoid double call
        updateDraggablePanels();
      }
    } catch (error) {
      console.error('❌ Error updating legacy draggable panels (pre-render):', error);
    }
  }

  if (RenderManager && RenderManager.isInitialized) {
    RenderManager.render(GameState.getState());
    // console.log(frameRate());
  }
      // Render debug visualization for ant gathering (overlays on top)
  if (typeof g_gatherDebugRenderer !== 'undefined' && g_gatherDebugRenderer) {
    g_gatherDebugRenderer.render();
  }
  // Update button groups (rendering handled by RenderLayerManager)
  if (window.buttonGroupManager) {
    try {
      window.buttonGroupManager.update(mouseX, mouseY, mouseIsPressed);
    } catch (error) {
      console.error('❌ Error updating button group system:', error);
    }

    
  }

    // --- PLAYING ---
  if (GameState.isInGame()) {
    push();
    scale(cameraZoom);
    translate(-cameraX, -cameraY);

    if (typeof drawSelectionBox === 'function') drawSelectionBox();

    pop();
    updateCamera();
    
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

    // Handle Universal Button Group System clicks
  if (window.buttonGroupManager && 
      typeof window.buttonGroupManager.handleClick === 'function') {
    try {
      const handled = window.buttonGroupManager.handleClick(mouseX, mouseY);
      if (handled) return; // Button was clicked, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling button click:', error);
    }
  }

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

  handleMouseEvent('handleMousePressed', window.getWorldMouseX(), window.getWorldMouseY(), mouseButton);
}

function mouseDragged() {
  // Handle UI Debug Manager drag events
  if (g_uiDebugManager && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  handleMouseEvent('handleMouseDragged', mouseX, mouseY);
}

function mouseReleased() {
  // Handle UI Debug Manager release events
  if (g_uiDebugManager && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerUp({ x: mouseX, y: mouseY });
  }
  handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton);
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
    return; // Debug key was handled, don't process further
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

  // Handle all debug-related keys (unified debug system handles both console and UI debug)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return; // Debug key was handled, don't process further
  }
  if (keyCode === ESCAPE && g_selectionBoxController) {
    g_selectionBoxController.deselectAll();
    return;
  }
  handleKeyEvent('handleKeyPressed', keyCode, key);

  if ((key === 'f' || key === 'F') && isInGame()) {
    toggleCameraFollow();
  }

  if (GameState.isInGame()) {
    if (key === '-' || key === '_' || keyCode === 189 || keyCode === 109) {
      setCameraZoom(cameraZoom / CAMERA_ZOOM_STEP);
    } else if (key === '=' || key === '+' || keyCode === 187 || keyCode === 107) {
      setCameraZoom(cameraZoom * CAMERA_ZOOM_STEP);
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
  if (!MAP) {
    return { width: g_canvasX, height: g_canvasY };
  }

  const width = MAP._xCount ? MAP._xCount * TILE_SIZE : g_canvasX;
  const height = MAP._yCount ? MAP._yCount * TILE_SIZE : g_canvasY;

  return { width, height };
}

function clampCameraToBounds() {
  const { width, height } = getMapPixelDimensions();
  const viewWidth = g_canvasX / cameraZoom;
  const viewHeight = g_canvasY / cameraZoom;

  let minX = 0;
  let maxX = width - viewWidth;
  if (viewWidth >= width) {
    const excessX = viewWidth - width;
    minX = -excessX / 2;
    maxX = excessX / 2;
  } else {
    maxX = Math.max(0, maxX);
  }

  let minY = 0;
  let maxY = height - viewHeight;
  if (viewHeight >= height) {
    const excessY = viewHeight - height;
    minY = -excessY / 2;
    maxY = excessY / 2;
  } else {
    maxY = Math.max(0, maxY);
  }

  cameraX = constrain(cameraX, minX, maxX);
  cameraY = constrain(cameraY, minY, maxY);

  if (COORDSY && typeof COORDSY.setViewCornerBC === 'function') {
    COORDSY.setViewCornerBC([cameraX, cameraY]);
  }
}

function centerCameraOn(worldX, worldY) {
  const viewWidth = g_canvasX / cameraZoom;
  const viewHeight = g_canvasY / cameraZoom;

  cameraX = worldX - viewWidth / 2;
  cameraY = worldY - viewHeight / 2;

  clampCameraToBounds();
}

function centerCameraOnEntity(entity) {
  const center = getEntityWorldCenter(entity);
  if (center) {
    centerCameraOn(center.x, center.y);
  }
}

function screenToWorld(px = mouseX, py = mouseY, zoomOverride) {
  const zoom = typeof zoomOverride === 'number' ? zoomOverride : cameraZoom;

  return {
    x: cameraX + px / zoom,
    y: cameraY + py / zoom
  };
}

function getWorldMousePosition(px = mouseX, py = mouseY, zoomOverride) {
  return screenToWorld(px, py, zoomOverride);
}

function worldToScreen(worldX, worldY) {
  return {
    x: (worldX - cameraX) * cameraZoom,
    y: (worldY - cameraY) * cameraZoom
  };
}

function setCameraZoom(targetZoom, focusX = g_canvasX / 2, focusY = g_canvasY / 2) {
  const clampedZoom = constrain(targetZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM);
  if (clampedZoom === cameraZoom) {
    return false;
  }

  const currentZoom = (typeof cameraZoom === 'number' && cameraZoom !== 0) ? cameraZoom : 1;
  const focusWorld = screenToWorld(focusX, focusY, currentZoom);

  cameraZoom = clampedZoom;
  cameraX = focusWorld.x - focusX / cameraZoom;
  cameraY = focusWorld.y - focusY / cameraZoom;

  clampCameraToBounds();

  if (cameraFollowEnabled) {
    const target = cameraFollowTarget || getPrimarySelectedEntity();
    if (target) {
      centerCameraOnEntity(target);
    } else {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }
  }

  return true;
}

function toggleCameraFollow() {
  const target = getPrimarySelectedEntity();

  if (cameraFollowEnabled) {
    if (!target || target === cameraFollowTarget) {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
      return;
    }
  }

  if (target) {
    cameraFollowEnabled = true;
    cameraFollowTarget = target;
    centerCameraOnEntity(target);
  }
}

function updateCamera() {
  if (!GameState.isInGame()) return;

  const left = keyIsDown(LEFT_ARROW) || keyIsDown(65);
  const right = keyIsDown(RIGHT_ARROW) || keyIsDown(68);
  const up = keyIsDown(UP_ARROW) || keyIsDown(87);
  const down = keyIsDown(DOWN_ARROW) || keyIsDown(83);
  const manualInput = left || right || up || down;

  if (manualInput) {
    if (cameraFollowEnabled) {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }

    const panStep = cameraPanSpeed / cameraZoom;
    switch (manualInput){
      case left: cameraX -= panStep;
      case right: cameraX += panStep;
      case up: cameraY -= panStep;
      case down: cameraY += panStep;
    }

    clampCameraToBounds();
  } else if (cameraFollowEnabled) {
    const primary = getPrimarySelectedEntity();
    const target = primary || cameraFollowTarget;
    if (target) {
      cameraFollowTarget = target;
      centerCameraOnEntity(target);
    } else {
      cameraFollowEnabled = false;
      cameraFollowTarget = null;
    }
  }

  if (typeof originalConsoleLog === 'function') {
    originalConsoleLog(cameraX, cameraY);
  }
}

function mouseWheel(event) {
  if (!isInGame()) { return true; }

  const wheelDelta = event?.deltaY ?? 0;
  if (wheelDelta === 0) { return false; }

  const zoomFactor = wheelDelta > 0 ? (1 / CAMERA_ZOOM_STEP) : CAMERA_ZOOM_STEP;
  const targetZoom = cameraZoom * zoomFactor;
  setCameraZoom(targetZoom, mouseX, mouseY);

  return false;
}
  

// DEBUG RENDERING FUNCTIONS
// These functions provide basic debug visualization capability

/**
 * debugRender
 * -----------
 * Debug rendering function - now using draggable panels instead of static overlay.
 * The debug information is now displayed in the Debug Info draggable panel.
 */
function debugRender() {
  // Debug info is now handled by the Debug Info draggable panel
  // No static debug rendering needed here anymore
  return;
}

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
  const zoom = (typeof cameraZoom === 'number' && cameraZoom !== 0) ? cameraZoom : 1;
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
  // background(0);

  resizeCanvas(g_canvasX,g_canvasY);
}