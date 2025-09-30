// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
const NONE = '\0'; 

// --- CONTROLLER DECLARATIONS ---
let g_mouseController;
let g_keyboardController;
let g_selectionBoxController;
let g_tileInteractionManager; // Efficient tile-based interaction system
// --- WORLD GENERATION ---
let g_seed;
let g_map;
let g_gridMap;
let g_coordsy;
// --- UI ---
let g_menuFont;
// --- IDK! ----
let g_recordingPath;


function preload(){
  test_stats();
  terrainPreloader();
  Ants_Preloader();
  resourcePreLoad();
  menuPreload();
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
  mapRender();
  fieldRender();
  uiRender();
}

/**
 * mapRender
 * ---------
 * Renders the game g_map background and overlays the debug grid.
 * 
 * This function should be called prior to rendering dynamic entities and UI elements,
 * ensuring the g_map and grid are drawn as the foundational visual layer.
 * 
 * The debug grid assists with tile-based visualization and interaction, supporting
 * development and gameplay features such as selection and movement targeting.
 */
function mapRender(){
  g_map.render();
  drawDebugGrid(TILE_SIZE, Math.floor((g_canvasX + 300) / TILE_SIZE), Math.floor((g_canvasY + 300) / TILE_SIZE));
}

/**
 * fieldRender
 * -----------
 * Renders all dynamic game entities and resources to the canvas.
 * Intended to be invoked after the map background is drawn and before UI elements are rendered.
 * 
 * Serves as the primary rendering layer for game objects, ensuring proper visual stacking and separation
 * between g_map, entities, and UI components.
 */
function fieldRender(){
  antsUpdate();
  g_resourceList.drawAll();
}


/**
 * uiRender
 * --------
 * Renders all user interface elements and overlays, including selection boxes,
 * developer console indicators, and command line input.
 *
 * This function should be called after rendering the g_map and game entities,
 * ensuring UI components are visually layered above all gameplay elements.
 *
 * Handles conditional rendering of UI features based on game state and controller availability.
 */
function uiRender(){
  updateMenu(); // Update menu state and handle transitions
  if (renderMenu()) return; // Render menu if active, otherwise render game
  renderCurrencies();
  if (g_selectionBoxController) { g_selectionBoxController.draw(); }
  if(g_recordingPath){ } // (Recording logic here if needed)
  // Render spawn/delete UI (canvas-based) if available
  if (typeof window.renderSpawnUI === 'function') {
    window.renderSpawnUI();
  }
  debugRender();
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
}

/**
 * preload
 * -------
 * Preloads game assets and resources used during runtime.
 * Called by p5.js before setup to ensure textures, sprites, sounds, and fonts are available.
 * Assigns loaded assets to globals consumed by rendering and game systems.
 */
function preload(){
  terrainPreloader();
  g_menuFont = loadFont("Images/Assets/Terraria.TTF");
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

// Command line functionality has been moved to debug/commandLine.js

////// MAIN

function setup() {
  antsPreloader();
  resourcePreLoad();
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  createCanvas(g_canvasX, g_canvasY);

  g_seed = hour()*minute()*floor(second()/10);

  g_map = new Terrain(g_canvasX + 300,g_canvasY + 300,TILE_SIZE);
  g_map.randomize(g_seed);
  g_coordsy = g_map.getCoordinateSystem();
  g_coordsy.setViewCornerBC(0,0);

  g_gridMap = new PathMap(g_map);
  g_coordsy = g_map.getCoordinateSystem(); // Get Backing canvas coordinate system
  g_coordsy.setViewCornerBC(0,0); // Top left corner of VIEWING canvas on BACKING canvas, (0,0) by default. Included to demonstrate use. Update as needed with camera

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);

  initializeMenu();  // Initialize the menu system
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

