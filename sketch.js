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
  
  // Initialize UI Debug System
  if (typeof UIDebugManager !== 'undefined' && typeof g_uiDebugManager === 'undefined') {
    window.g_uiDebugManager = new UIDebugManager();
  }
  
  // Initialize dropoff UI if present (creates the Place Dropoff button)
  window.initDropoffUI();
  // Do not force spawn UI visible here; spawn UI is dev-console-only by default.
  
  // Initialize all UI elements with debug system (delayed to allow UI creation)
  if (typeof initializeAllUIElements === 'function') {
    setTimeout(initializeAllUIElements, 200);
  }

  // Seed at least one set of resources so the field isn't empty if interval hasn't fired yet
  try {
      g_resourceManager.forceSpawn();
  } catch (e) { /* non-fatal; spawner will populate via interval */ }
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
  if (typeof RenderManager !== 'undefined' && !RenderManager.isInitialized) {
    RenderManager.initialize();
  }
}


/**
 * draw
 * ----
 * Main rendering loop for the game.
 * 
 * Invokes the rendering pipeline in three distinct stages:
 *   1. mapRender   - Draws the g_map background and debug grid.
 *   2. fieldRender - Renders all dynamic game entities and resources.
 *   3. uiRender    - Draws user interface elements and overlays.
 * 
 * Ensures proper visual stacking and separation between foundational layers,
 * interactive entities, and UI components. Called automatically by p5.js each frame.
 */
function draw() {
  // background(0);
  // g_map2.renderDirect();

  // Use the new layered rendering system
  if (typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
    RenderManager.render(GameState.getState());
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
  // Handle UI Debug Manager mouse events first
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
    const handled = g_uiDebugManager.handlePointerDown({ x: mouseX, y: mouseY });
    if (handled) return;
  }
  handleMouseEvent('handleMousePressed', mouseX, mouseY, mouseButton);
}

function mouseDragged() {
  // Handle UI Debug Manager drag events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  handleMouseEvent('handleMouseDragged', mouseX, mouseY);
}

function mouseReleased() {
  // Handle UI Debug Manager release events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
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
  // Handle UI Debug Manager keys first (tilde/backtick to toggle debug mode)
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager) {
    if (key === '~' || key === '`') {
      g_uiDebugManager.toggle();
      return; // UI Debug key was handled, don't process further
    }
  }
  
  // Handle UI shortcuts (Ctrl+Shift combinations)
  if (typeof window !== 'undefined' && window.UIManager && window.UIManager.handleKeyPress) {
    const handled = window.UIManager.handleKeyPress(keyCode, key, window.event);
    if (handled) {
      return; // UI shortcut was handled, don't process further
    }
  }
  
  // Handle all debug-related keys (command line, dev console, test hotkeys)
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
 * Basic debug rendering function for UI debug layer.
 * Renders basic debug information when dev console is enabled.
 */
function debugRender() {
  // Only render debug info if dev console is enabled
  if (typeof devConsoleEnabled === 'undefined' || !devConsoleEnabled) {
    return;
  }

  // Basic debug info display
  push();
  fill(255, 255, 0); // Yellow text
  noStroke();
  textAlign(LEFT);
  textSize(12);
  
  // Display basic game state information
  let debugY = 10;
  text(`Game State: ${GameState ? GameState.getState() : 'Unknown'}`, 10, debugY += 15);
  text(`Canvas: ${g_canvasX}x${g_canvasY}`, 10, debugY += 15);
  text(`Tile Size: ${TILE_SIZE}`, 10, debugY += 15);
  
  // Display entity counts if available
  if (typeof ants !== 'undefined' && ants) {
    text(`Ants: ${ants.length || 0}`, 10, debugY += 15);
  }
  if (typeof g_resourceList !== 'undefined' && g_resourceList && g_resourceList.resources) {
    text(`Resources: ${g_resourceList.resources.length || 0}`, 10, debugY += 15);
  }
  
  pop();
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
  // Only render grid if dev console is enabled
  if (typeof devConsoleEnabled === 'undefined' || !devConsoleEnabled) {
    return;
  }

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