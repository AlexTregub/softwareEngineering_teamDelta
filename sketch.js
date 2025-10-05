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
  
  // UI Debug System disabled
  // if (typeof UIDebugManager !== 'undefined' && typeof g_uiDebugManager === 'undefined') {
  //   window.g_uiDebugManager = new UIDebugManager();
  // }
  
  // Initialize dropoff UI if present (creates the Place Dropoff button)
  window.initDropoffUI();
  // Do not force spawn UI visible here; spawn UI is dev-console-only by default.
  
  // UI elements debug integration disabled
  // if (typeof initializeAllUIElements === 'function') {
  //   setTimeout(initializeAllUIElements, 200);
  // }

  // Seed at least one set of resources so the field isn't empty if interval hasn't fired yet
  try {
      g_resourceManager.forceSpawn();
  } catch (e) { /* non-fatal; spawner will populate via interval */ }

  // Initialize Universal Button Group System
  initializeUniversalButtonSystem();
  
  // Initialize Draggable Panel System
  initializeDraggablePanelSystem();
  
  // Initialize ant control panel for spawning and state management
  if (typeof initializeAntControlPanel !== 'undefined') {
    initializeAntControlPanel();
  }
  
  // Initialize UI Selection Controller for effects layer selection box
  // This must happen after RenderManager.initialize() creates the EffectsRenderer
  setTimeout(() => {
    console.log('🎯 Initializing UI Selection Controller...');
    
    // Check if required components exist
    if (typeof UISelectionController !== 'undefined' && typeof window.EffectsRenderer !== 'undefined') {
      g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
      console.log('✅ UISelectionController created successfully');
      
      // Initialize the selection box system
      if (typeof initializeUISelectionBox !== 'undefined') {
        initializeUISelectionBox();
      }
    } else {
      console.error('❌ Required components not available:');
      console.log('UISelectionController available:', typeof UISelectionController !== 'undefined');
      console.log('EffectsRenderer available:', typeof window.EffectsRenderer !== 'undefined');
      console.log('window.EffectsRenderer object:', window.EffectsRenderer);
    }
  }, 200);
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

  // Update button groups (rendering handled by RenderLayerManager)
  if (window.buttonGroupManager && 
      typeof window.buttonGroupManager.update === 'function') {
    try {
      window.buttonGroupManager.update(mouseX, mouseY, mouseIsPressed);
    } catch (error) {
      console.error('❌ Error updating button group system:', error);
    }
  }
  
  // Update draggable panels (only during PLAYING gamestate)
  if (typeof updateDraggablePanels === 'function' && GameState.getState() === 'PLAYING') {
    try {
      updateDraggablePanels();
    } catch (error) {
      console.error('❌ Error updating draggable panels:', error);
    }
  }
  
  // Render draggable panels (only during PLAYING gamestate)
  if (typeof renderDraggablePanels === 'function' && GameState.getState() === 'PLAYING') {
    try {
      renderDraggablePanels();
    } catch (error) {
      console.error('❌ Error rendering draggable panels:', error);
    }
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
  // Handle UI shortcuts first (Ctrl+Shift combinations)
  if (typeof window !== 'undefined' && window.UIManager && window.UIManager.handleKeyPress) {
    const handled = window.UIManager.handleKeyPress(keyCode, key, window.event);
    if (handled) {
      return; // UI shortcut was handled, don't process further
    }
  }
  
  // Handle render layer toggles (Shift + C/V/B/N/M)
  if (keyIsDown(SHIFT) && typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
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