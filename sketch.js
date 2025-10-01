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
  g_canvasX = window.innerWidth;
  g_canvasY = window.innerHeight;
  createCanvas(g_canvasX, g_canvasY);
  initializeWorld();

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);

  initializeMenu();  // Initialize the menu system
  // Initialize dropoff UI if present (creates the Place Dropoff button)
  if (typeof window !== 'undefined' && typeof window.initDropoffUI === 'function') {
    window.initDropoffUI();
  }
  // Do not force spawn UI visible here; spawn UI is dev-console-only by default.

  // g_seed at least one set of resources so the field isn't empty if interval hasn't fired yet
  try {
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.spawn === 'function') {
      g_resourceManager.spawn();
    }
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
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[g_canvasX,g_canvasY]);
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
  // Clear the canvas
  background(0);

  // Use the new layered rendering system
  if (typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
    RenderManager.render(GameState.getState());
  }
}

/**
 * Legacy rendering fallback
 * Used when the new rendering system is not available
 */
function legacyRender() {
  // --- PLAYING ---
  if (GameState.isInGame()) {
    if (typeof drawSelectionBox === 'function') drawSelectionBox();
    drawDebugGrid(TILE_SIZE, g_gridMap.width, g_gridMap.height);

    if (typeof drawDevConsoleIndicator === 'function') {
      drawDevConsoleIndicator();
    }  
    if (typeof drawCommandLine === 'function') {
      drawCommandLine();
    }
  }

  mapRender();
  fieldRender();
  uiRender();
}

/**
 * mapRender
 * ---------
 * Legacy terrain rendering function - now primarily used as fallback
 * The new RenderLayerManager handles terrain rendering through its terrain layer
 */
function mapRender(){
  // Check if we should use the new rendering system
  if (typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
    // Let RenderLayerManager handle terrain rendering
    return;
  }
  
  // Legacy fallback terrain rendering
  if (typeof g_map2 !== 'undefined' && g_map2 && typeof g_map2.render === 'function') {
    g_map2.render();
  }
}

/**
 * fieldRender
 * -----------
 * Legacy entity rendering function - now primarily used as fallback
 * The new RenderLayerManager handles entity rendering through EntityLayerRenderer
 */
function fieldRender(){
  // Check if we should use the new rendering system
  if (typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
    // Let RenderLayerManager handle entity rendering
    return;
  }
  
  // Legacy fallback entity rendering
  const gameState = GameState.getState();
  
  switch (gameState) {
    case GameState.STATES.MENU:
    case GameState.STATES.OPTIONS:
      // No field entities to render in menu states
      break;
      
    case GameState.STATES.DEBUG_MENU:
    case GameState.STATES.PLAYING:
      // Active gameplay - render all entities and resources
      if (typeof antsUpdateAndRender === 'function') {
        antsUpdateAndRender();
      } else if (typeof antsUpdate === 'function') {
        antsUpdate();
      }
      
      if (g_resourceList && typeof g_resourceList.updateAll === 'function') {
        g_resourceList.updateAll();
      }
      if (g_resourceList && typeof g_resourceList.drawAll === 'function') {
        g_resourceList.drawAll();
      }
      break;
      
    case GameState.STATES.PAUSED:
    case GameState.STATES.GAME_OVER:
      // Paused/game over - show entities but no updates
      if (typeof antsRender === 'function') {
        antsRender();
      }
      if (g_resourceList && typeof g_resourceList.drawAll === 'function') {
        g_resourceList.drawAll();
      }
      break;
      
    default:
      console.warn(`Unknown game state in fieldRender: ${gameState}`);
      break;
  }
}


/**
 * uiRender
 * --------
 * Legacy UI rendering function - now primarily used as fallback
 * The new RenderLayerManager handles UI rendering through dedicated UI layers
 */
function uiRender(){
  // Check if we should use the new rendering system
  if (typeof RenderManager !== 'undefined' && RenderManager.isInitialized) {
    // Let RenderLayerManager handle UI rendering
    return;
  }
  
  // Legacy fallback UI rendering
  const gameState = GameState.getState();
  
  // Always update menu state
  if (typeof updateMenu === 'function') {
    updateMenu();
  }
  
  switch (gameState) {
    case GameState.STATES.MENU:
    case GameState.STATES.OPTIONS:
    case GameState.STATES.DEBUG_MENU:
      if (typeof renderMenu === 'function') {
        renderMenu();
      }
      break;
      
    case GameState.STATES.PLAYING:
      // Active gameplay UI
      if (typeof renderCurrencies === 'function') {
        renderCurrencies();
      }
      
      if (typeof window !== 'undefined') {
        if (typeof window.updateDropoffUI === 'function') {
          window.updateDropoffUI();
        }
        if (typeof window.drawDropoffUI === 'function') {
          window.drawDropoffUI();
        }
      }
      
      if (typeof window.renderSpawnUI === 'function') {
        window.renderSpawnUI();
      }
      
      if (g_selectionBoxController) { 
        g_selectionBoxController.draw(); 
      }
      
      if (typeof debugRender === 'function') {
        debugRender();
      }
      break;
      
    case GameState.STATES.PAUSED:
      // Paused UI
      if (typeof renderCurrencies === 'function') {
        renderCurrencies();
      }
      
      // Pause overlay
      fill(0, 0, 0, 150);
      rect(0, 0, g_canvasX, g_canvasY);
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(48);
      text("PAUSED", g_canvasX / 2, g_canvasY / 2);
      textSize(24);
      text("Press ESC to resume", g_canvasX / 2, g_canvasY / 2 + 60);
      break;
      
    case GameState.STATES.GAME_OVER:
      // Game over UI
      if (typeof renderCurrencies === 'function') {
        renderCurrencies();
      }
      
      // Game over overlay
      fill(0, 0, 0, 180);
      rect(0, 0, g_canvasX, g_canvasY);
      fill(255, 100, 100);
      textAlign(CENTER, CENTER);
      textSize(64);
      text("GAME OVER", g_canvasX / 2, g_canvasY / 2 - 50);
      fill(255);
      textSize(24);
      text("Press R to restart or ESC for menu", g_canvasX / 2, g_canvasY / 2 + 50);
      break;
      
    default:
      console.warn(`Unknown game state in uiRender: ${gameState}`);
      if (typeof renderMenu === 'function') {
        renderMenu();
      }
      break;
  }
}

/**
 * debugRender
 * -----------
 * Renders development and diagnostic overlays (developer console indicator,
 * in-game command line, etc.). Should be invoked after UI rendering so
 * diagnostic elements are visually prioritized above gameplay and UI components.
 *
 * Handles conditional display based on developer console state and input focus.
 */
function debugRender() {
  drawDevConsoleIndicator();
  drawCommandLine();

  // Draw global performance graph when debug mode is enabled
  if (typeof getEntityDebugManager === 'function') {
    const manager = getEntityDebugManager();
    if (manager && manager.isDebugEnabled && manager.showGlobalPerformance) {

      // Position in top-right corner, with some margin from the edge
      const graphX = g_canvasX - 360;
      const graphY = 10;
      const graphWidth = 350;
      const graphHeight = 200;
      
      manager.drawGlobalPerformanceGraph(graphX, graphY, graphWidth, graphHeight, {
        backgroundColor: [0, 0, 0, 200],
        borderColor: [100, 200, 255],
        titleColor: [100, 200, 255],
        textColor: [255, 255, 255],
        highlightColor: [255, 255, 100],
        showEntityBreakdown: true
      });
        manager.update();
      }
    }
}

function drawDebugGrid(tileSize, gridWidth, gridHeight) {
  stroke(100, 100, 100, 100); // light gray grid lines
  strokeWeight(1);
  noFill();

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      rect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  // Highlight tile under mouse
  const tileX = Math.floor(mouseX / tileSize);
  const tileY = Math.floor(mouseY / tileSize);
  
  // Fill the tile with transparent yellow
  fill(255, 255, 0, 50); // transparent yellow
  noStroke();
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
  
  // Add a border to make the tile more visible
  noFill();
  stroke(255, 255, 0, 150); // more opaque yellow border
  strokeWeight(2);
  rect(tileX * tileSize, tileY * tileSize, tileSize, tileSize);
  
  // Show tile center dot to indicate where ant will move
  if (selectedAnt) {
    fill(255, 0, 0, 200); // red dot for movement target
    noStroke();
    const tileCenterX = tileX * tileSize + tileSize / 2;
    const tileCenterY = tileY * tileSize + tileSize / 2;
    ellipse(tileCenterX, tileCenterY, 6, 6);
  }

  // Highlight selected ant's current tile
  if (selectedAnt) {
    const pos = selectedAnt.getPosition();
    const antTileX = Math.floor(pos.x / tileSize);
    const antTileY = Math.floor(pos.y / tileSize);
    fill(0, 255, 0, 80); // transparent green
    noStroke();
    rect(antTileX * tileSize, antTileY * tileSize, tileSize, tileSize);
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
function mousePressed()  { handleMouseEvent('handleMousePressed', mouseX, mouseY, mouseButton); }
function mouseDragged()  { handleMouseEvent('handleMouseDragged', mouseX, mouseY); }
function mouseReleased() { handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton); }

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
  if (keyCode === ESCAPE && g_selectionBoxController) {
    g_selectionBoxController.deselectAll();
    return;
  }
  handleKeyEvent('handleKeyPressed', keyCode, key);
}