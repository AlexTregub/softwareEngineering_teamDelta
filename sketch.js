
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
let g_coordsy;
// --- UI ---
let g_menuFont;
// --- IDK! ----
let g_recordingPath;

/**
 * preload
 * -------
 * Preloads game assets and resources used during runtime.
 * Called by p5.js before setup to ensure textures, sprites, sounds, and fonts are available.
 * Assigns loaded assets to globals consumed by rendering and game systems.
 */
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
  
  // Initialize faction systems
  if (typeof initializeFactionManager !== 'undefined') {
    initializeFactionManager();
  }
  
  if (typeof initializePlayerFactionSetup !== 'undefined') {
    initializePlayerFactionSetup();
  }
  
  // Initialize entity tooltip system
  if (typeof initializeEntityTooltips !== 'undefined') {
    initializeEntityTooltips();
  }
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
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[windowWidth,windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion._camPosition = [-0.5,0]; // TEMPORARY, ALIGNING MAP WITH OTHER...
  
  // COORDSY = MAP.getCoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  g_gridMap = new PathMap(g_map);
  g_coordsy = g_map.getCoordinateSystem(); // Get Backing canvas coordinate system
  g_coordsy.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera
   // Initialize the render layer manager if not already done
  RenderManager.initialize();
 
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
  RenderManager.render(GameState.getState());
  
  // Update and render faction setup (must be after main rendering to appear on top)
  if (typeof g_playerFactionSetup !== 'undefined' && g_playerFactionSetup) {
    g_playerFactionSetup.update();
    g_playerFactionSetup.render();
  }
  
  // Render entity tooltips (must be after main rendering to appear on top)
  if (typeof renderEntityTooltips !== 'undefined') {
    renderEntityTooltips();
  }
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
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() {
  // Handle faction setup mouse events first (highest priority)
  if (typeof g_playerFactionSetup !== 'undefined' && g_playerFactionSetup && g_playerFactionSetup.isVisible()) {
    // The draggable panel handles mouse clicks internally via update(), so we don't need to handle them here
    // The panel's handleMouseDown() method is called from its update() method, which runs every frame
    return; // Don't process other mouse events when faction setup is visible
  }
  
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

function mouseMoved() {
  // Update entity tooltips on mouse movement
  if (typeof updateEntityTooltips !== 'undefined') {
    updateEntityTooltips(mouseX, mouseY);
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
  // Handle faction setup keyboard input first (highest priority)
  if (typeof g_playerFactionSetup !== 'undefined' && g_playerFactionSetup && g_playerFactionSetup.isVisible()) {
    const handled = g_playerFactionSetup.handleKeyInput(key, keyCode);
    if (handled) return;
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
    }
    
    if (handled) {
      // Display current layer states
      console.log('🔧 Layer States:', RenderManager.getLayerStates());
      return; // Layer toggle was handled, don't process further
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
  stroke(255, 255, 0, 100); // Semi-transparent yellow
  strokeWeight(1);
  noFill();

  // Draw vertical grid lines
  for (let x = 0; x <= gridWidth * tileSize; x += tileSize) {
    line(x, 0, x, gridHeight * tileSize);
  }

  // Draw horizontal grid lines  
  for (let y = 0; y <= gridHeight * tileSize; y += tileSize) {
    line(0, y, gridWidth * tileSize, y);
  }

  pop();
}