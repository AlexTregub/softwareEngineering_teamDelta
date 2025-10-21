
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

// Buildings
let Buildings = [];

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
  preloadPauseImages();
  BuildingPreloader();
  
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

  // Disable right-click context menu to prevent interference with brush controls
  if (typeof document !== 'undefined') {
    // Global context menu prevention
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
    
    // Additional prevention for the canvas specifically
    document.addEventListener('DOMContentLoaded', function() {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        });
      }
    });
    
    // Prevent right-click from triggering browser back/forward
    document.addEventListener('mouseup', function(e) {
      if (e.button === 2) { // Right mouse button
        e.preventDefault();
        return false;
      }
    });
    
    console.log('🚫 Right-click context menu disabled for brush controls');
  }

  // Initialize Queen Control Panel system
  if (typeof initializeQueenControlPanel !== 'undefined') {
    initializeQueenControlPanel();
    console.log('👑 Queen Control Panel initialized in setup');
  }

  // Initialize Fireball System
  if (typeof window !== 'undefined' && typeof FireballManager !== 'undefined') {
    window.g_fireballManager = new FireballManager();
    console.log('🔥 Fireball System initialized in setup');
  }

  initializeMenu();  // Initialize the menu system
  renderPipelineInit();
  
  // Initialize context menu prevention for better brush control
  initializeContextMenuPrevention();
  //

  Buildings.push(createBuilding('antcone', 200, 200, 'neutral'));
}

/**
 * Initialize context menu prevention
 * Prevents right-click context menu from interfering with brush controls
 */
function initializeContextMenuPrevention() {
  // Method 1: Document-level prevention
  if (typeof document !== 'undefined') {
    document.oncontextmenu = function(e) {
      e.preventDefault();
      return false;
    };
  }
  
  // Method 2: Window-level prevention
  if (typeof window !== 'undefined') {
    window.oncontextmenu = function(e) {
      e.preventDefault();
      return false;
    };
  }
  
  // Method 3: p5.js canvas-specific prevention
  // This will be applied when the canvas is created
  try {
    if (typeof select !== 'undefined') {
      const canvas = select('canvas');
      if (canvas) {
        canvas.elt.oncontextmenu = function(e) {
          e.preventDefault();
          return false;
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not set canvas context menu prevention:', error);
  }
  
  console.log('🚫 Multiple layers of right-click context menu prevention initialized');
}

/**
 * Global function to test context menu prevention
 */
function testContextMenuPrevention() {
  console.log('🧪 Testing context menu prevention...');
  console.log('Right-click anywhere to test - context menu should NOT appear');
  console.log('If context menu still appears, try: disableContextMenu()');
  return true;
}

/**
 * Global function to force disable context menu
 */
function disableContextMenu() {
  initializeContextMenuPrevention();
  console.log('🔒 Context menu prevention forcibly re-applied');
  return true;
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.testContextMenuPrevention = testContextMenuPrevention;
  window.disableContextMenu = disableContextMenu;
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
  if (typeof window.renderPauseMenuUI === 'function') {
    window.renderPauseMenuUI();
  }
  // Draw dropoff UI (button, placement preview) after other UI elements
  if (typeof window !== 'undefined' && typeof window.drawDropoffUI === 'function') {
    window.drawDropoffUI();
  }
  
  // Render Enemy Ant Brush (on top of other UI elements)
  if (window.g_enemyAntBrush) {
    try {
      window.g_enemyAntBrush.render();
    } catch (error) {
      console.error('❌ Error rendering enemy ant brush:', error);
    }
  }
  
  // Render Resource Brush (on top of other UI elements)
  if (window.g_resourceBrush) {
    try {
      window.g_resourceBrush.render();
    } catch (error) {
      console.error('❌ Error rendering resource brush:', error);
    }
  }
  
  // Render Building Brush (on top of other UI elements)
  if (window.g_buildingBrush) {
    try {
      window.g_buildingBrush.render();
    } catch (error) {
      console.error('❌ Error rendering building brush:', error);
    }
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

  // Update Enemy Ant Brush
  if (window.g_enemyAntBrush) {
    try {
      window.g_enemyAntBrush.update();
    } catch (error) {
      console.error('❌ Error updating enemy ant brush:', error);
    }
  }

    // Update Enemy Ant Brush
  if (window.g_lightningAimBrush) {
    try {
      window.g_lightningAimBrush.update();
    } catch (error) {
      console.error('❌ Error updating enemy ant brush:', error);
    }
  }

  // Update Resource Brush
  if (window.g_resourceBrush) {
    try {
      window.g_resourceBrush.update();
    } catch (error) {
      console.error('❌ Error updating resource brush:', error);
    }
  }

  // Update Building Brush
  if (window.g_buildingBrush) {
    try {
      window.g_buildingBrush.update();
    } catch (error) {
      console.error('❌ Error updating building brush:', error);
    }
  }

  // Update Queen Control Panel visibility
  if (typeof updateQueenPanelVisibility !== 'undefined') {
    try {
      updateQueenPanelVisibility();
    } catch (error) {
      console.error('❌ Error updating queen panel visibility:', error);
    }
  }

  // Update Queen Control Panel
  if (window.g_queenControlPanel) {
    try {
      window.g_queenControlPanel.update();
    } catch (error) {
      console.error('❌ Error updating queen control panel:', error);
    }
  }

  // Update Fireball System
  if (window.g_fireballManager) {
    try {
      window.g_fireballManager.update();
    } catch (error) {
      console.error('❌ Error updating fireball system:', error);
    }
  }

  // Update Lightning System (soot stains, timed effects)
  if (window.g_lightningManager) {
    try {
      window.g_lightningManager.update();
    } catch (error) {
      console.error('❌ Error updating lightning system:', error);
    }
  }

  if (GameState.getState() === 'PLAYING') {
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

  // Handle Enemy Ant Brush events
  if (window.g_enemyAntBrush && window.g_enemyAntBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_enemyAntBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling enemy ant brush events:', error);
    }
  }

  // Handle Resource Brush events
  if (window.g_resourceBrush && window.g_resourceBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_resourceBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling resource brush events:', error);
    }
  }

  // Handle Building Brush events
  if (window.g_buildingBrush && window.g_buildingBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_buildingBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return; // Brush consumed the event, don't process other mouse events
    } catch (error) {
      console.error('❌ Error handling building brush events:', error);
    }
  }

  // Handle Lightning Aim Brush events
  if (window.g_lightningAimBrush && window.g_lightningAimBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      const handled = window.g_lightningAimBrush.onMousePressed(mouseX, mouseY, buttonName);
      if (handled) return;
    } catch (error) {
      console.error('❌ Error handling lightning aim brush events:', error);
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

function mouseDragged() {
  // Handle UI Debug Manager drag events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager !== null && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  handleMouseEvent('handleMouseDragged', mouseX, mouseY);
}

function mouseReleased() {
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
  
  handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton);
}

/**
 * mouseWheel
 * ---------
 * Forward mouse wheel events to active brushes so users can cycle brush types
 * with the scroll wheel. Prevents default page scrolling while in-game.
 */
function mouseWheel(event) {
  try {
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

    // Priority order: Enemy brush, Resource brush, Lightning aim brush
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

  } catch (e) {
    console.error('❌ Error handling mouseWheel for brushes:', e);
  }
  // Let other handlers/processes receive the event if no brush consumed it
  return true;
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
  if (keyCode === ESCAPE) {
    if (deactivateActiveBrushes()) {
      return;
    }
    // Then handle selection box clearing
    if (g_selectionBoxController) {
      g_selectionBoxController.deselectAll();
      return;
    }
  }
  handleKeyEvent('handleKeyPressed', keyCode, key);
}

/**
 * Deactivates any active brushes (resource, enemy ant) and logs the action.
 * Returns true if any brush was deactivated.
 */
function deactivateActiveBrushes() {
  let deactivated = false;
  if (typeof g_resourceBrush !== 'undefined' && g_resourceBrush && g_resourceBrush.isActive) {
    g_resourceBrush.toggle();
    console.log('🎨 Resource brush deactivated via ESC key');
    deactivated = true;
  }
  if (typeof g_enemyAntBrush !== 'undefined' && g_enemyAntBrush && g_enemyAntBrush.isActive) {
    g_enemyAntBrush.toggle();
    console.log('🎨 Enemy brush deactivated via ESC key');
    deactivated = true;
  }
  return deactivated;
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