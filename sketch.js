// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Defg++ client.cpp -o client ault 35
const CHUNKS_X = 20;
const CHUNKS_Y = 20;

const NONE = '\0'; 

// --- CONTROLLER DECLARATIONS ---
let g_mouseController;
let g_keyboardController;
let g_selectionBoxController;
let g_tileInteractionManager;
// Add a single list used by selection systems (ants + buildings)
let selectables = [];
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
// -- Time ---
let g_globalTime;
let g_timeOfDayOverlay;

// GameObjects list (NPC, Buildings, etc.)
let Buildings = [];

// Camera system - now managed by CameraManager
let cameraManager;

let terrariaFont;

function preload(){
  // return; // !!! REMOVE BEFORE DEV

  smoothingPreload();
  terrainPreloader();

  // return
  soundManagerPreload();
  resourcePreLoad();
  preloadPauseImages();
  BuildingPreloader();
  NPCPreloader();
  QuestUIPreloader()
  loadPresentationAssets();
  menuPreload();
  antsPreloader(); // MVC ant sprites
  terrariaFont = loadFont('Images/Assets/Terraria.TTF');
}


function setup() {
  // TEMPORARY
  // disableTerrainCache()

  createCanvas(windowWidth,windowHeight) 

  if (!TEST_GRID()) {
    console.log("GRID MALFORMED.")
    return
  } 

  // square(0,0,100)
  // image(GRASS_IMAGE,0,0,32,32)
  // square(10,10,100)

  if (!TEST_CHUNK()) {
    console.log("CHUNK MALFORMED.")
    // TEST_CHUNK()
  }

  if (!TEST_CAM_RENDER_CONVERTER()){
    console.log("CAMERA RENDER CONVERTER MALFORMED.")
  }

  if (!TEST_BASIC_TERRAIN()) {
    console.log("BASIC TERRAIN FUNCTIONALITY MALFORMED.")
  }
 
  // return; // !!! REMOVE BEFORE DEV

  // Initialize TaskLibrary before other systems that depend on it
  /*window.taskLibrary = window.taskLibrary || new TaskLibrary();//abe
  logNormal('[Setup] TaskLibrary initialized:', window.taskLibrary.availableTasks?.length || 0, 'tasks');
*/
  
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  RenderMangerOverwrite = false
  createCanvas(g_canvasX, g_canvasY);
  
  // Initialize spatial grid manager FIRST (before any entities are created)
  if (typeof SpatialGridManager !== 'undefined') {
    window.spatialGridManager = new SpatialGridManager(TILE_SIZE); // Match terrain tile size (32px)
    logNormal(`SpatialGridManager initialized with ${TILE_SIZE}px cells (matching terrain tiles)`);
    
    // Register spatial grid visualization in debug layer (only renders when enabled)
    if (typeof RenderManager !== 'undefined') {
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
        if (window.VISUALIZE_SPATIAL_GRID && spatialGridManager) {
          spatialGridManager.visualize({ color: 'rgba(0, 255, 0, 0.3)' });
        }
      });
    }
  }

  // Now spawn initial resources (after spatial grid exists)
  if (typeof spawnInitialResources === 'function') {
    spawnInitialResources();
  }
  
  initializeWorld();
  initializeDraggablePanelSystem()

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, selectables);
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
    if (!key) return;
    if (key.toUpperCase() === 'X') {
      if (window.g_speedUpButton && typeof window.g_speedUpButton.changeGameSpeed === 'function') {
        window.g_speedUpButton.changeGameSpeed();
      }
    }
    if (key === '1' || key === '2' || key === '3') { 
      if(window.g_powerBrushManager && typeof window.g_powerBrushManager.switchPower === 'function'){
        window.g_powerBrushManager.switchPower(key);
      }
    }
    // UI shortcuts are now handled directly in keyPressed() function
    // This maintains compatibility with existing game input systems
  });

  // Initialize camera management system
  cameraManager = new CameraManager();
  cameraManager.initialize();

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
  }

  initializeQueenControlPanel();
  // window.g_fireballManager = new FireballManager();
  window.eventManager = EventManager.getInstance();
  window.eventDebugManager = new EventDebugManager();
  window.eventManager.setEventDebugManager(window.eventDebugManager);

  initializeMenu();  // Initialize the menu system
  renderPipelineInit();

  // Farmland working...
  // g_tileInteractionManager.turnToFarmland(-60,-60,0,0); // NOTE: current Y is flipped...
  // g_tileInteractionManager.turnToFarmland(0,0); // NOTE: current Y is flipped...
  
  // Register state change callback for level editor initialization
  if (typeof GameState !== 'undefined' && typeof levelEditor !== 'undefined') {
    GameState.onStateChange((newState, oldState) => {
      if (newState === 'LEVEL_EDITOR') {
        // Initialize level editor with current or new terrain
        if (!levelEditor.isActive()) {
          // Always create a fresh blank terrain for the editor (ignore existing game map)
          // CustomTerrain: simple 2D grid, much faster than gridTerrain
          // Parameters: width (tiles), height (tiles), tileSize (pixels), defaultMaterial
          const terrain = new CustomTerrain(50, 50, 32, 'dirt');
          levelEditor.initialize(terrain);
        }
      } else if (oldState === 'LEVEL_EDITOR') {
        levelEditor.deactivate();
      }
    });
  }
  soundManager.startBGMMonitoring();
  initializeContextMenuPrevention();
  Buildings.push(createBuilding('anthill', 400, 400, 'player'));
  window.QuestManager.preloadAssets();

  // --- initialize shop manager ---
  window.BUIManager = new BUIManager();
  window.BUIManager.preload();
  //window.draggablePanelManager.createDefaultPanels();
}

function addListeners() {
  
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
  
  logVerbose('🚫 Multiple layers of right-click context menu prevention initialized');
}

/**
 * Test context menu prevention (debug utility)
 */
function testContextMenuPrevention() {
}

/**
 * Disable context menu (utility function)
 */
function disableContextMenu(event) {
  if (event) {
    event.preventDefault();
  }
  return false;
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

  // OLD TERRAIN SYSTEM - Commented out, using gridTerrain instead
   g_map = new Terrain(g_canvasX,g_canvasY,TILE_SIZE);
  // MAP.randomize(g_seed); // ROLLED BACK RANDOMIZATION, ALLOWING PATHFINDING, ALL WEIGHTS SAME
  
  // New, Improved, and Chunked Terrain using MapManager
  // g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[g_canvasX,g_canvasY]);
  // disableTerrainCache(); // TEMPORARILY DISABLING CACHE. BEGIN MOVING THINGS OVER.
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[windowWidth,windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion.alignToCanvas(); // Snaps grid to canvas 

  // g_map2.setMat([0,0],'farmland')
  
  // IMPORTANT: Set g_activeMap immediately after g_map2 creation
  g_activeMap = g_map2;

  g_activeMap.setMat([0,0],'farmland')
  
  // Register with MapManager (which will also update g_activeMap)
  if (typeof mapManager !== 'undefined') {
    mapManager.registerMap('level1', g_map2, true);
    logVerbose("Main map registered with MapManager as 'level1' and set as active");
  }
     
  g_gridMap = new PathMap(g_map);
  g_globalTime = new GlobalTime();
  
  // Initialize Time of Day Overlay system
  g_timeOfDayOverlay = new TimeOfDayOverlay(g_globalTime);
  window.g_timeOfDayOverlay = g_timeOfDayOverlay; // Make globally available

  window.g_speedUpButton = new SpeedUpButton();
  window.g_powerManager = new PowerManager();
  window.g_powerBrushManager = new PowerBrushManager();
  window.g_naturePower = new PowerManager(true);
  
   // Initialize the render layer manager if not already done
  RenderManager.initialize();
  
  // Spawn queen using MVC factory
  queenAnt = spawnQueen();

  // npc test
  Buildings.push(createNPC(100,100));
}

/**
 * Spawn queen ant using MVC factory pattern
 * Factory automatically registers with all game systems (spatialGridManager, selectables[], etc.)
 * @returns {Object} Queen MVC components {model, view, controller}
 */
function spawnQueen() {
  const queenX = g_canvasX / 2;
  const queenY = g_canvasY / 2;
  
  // Create queen using AntFactory (auto-registers with all systems)
  const queenMVC = AntFactory.createQueen(queenX, queenY, {
    faction: 'player',
    size: 60
  });
  
  console.log('Queen spawned at', queenX, queenY);
  
  return queenMVC;
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
  // TEST_CHUNK()
  // return
  // ============================================================
  // GAME LOOP PHASE 1: UPDATE ALL SYSTEMS
  // ============================================================

  if (typeof soundManager !== 'undefined' && soundManager.onDraw) {
    soundManager.onDraw();
  }

  if (cameraManager && (GameState.isInGame() || GameState.getState() === 'LEVEL_EDITOR')) {
    cameraManager.update();
  }

  if (GameState.getState() === 'PLAYING') {
    if (typeof updateQueenPanelVisibility === "function") updateQueenPanelVisibility();
    if (!window.g_powerManager) window.g_powerManager = new PowerManager();

    // --- Update gameplay systems ---
    if (window.eventManager) window.eventManager.update();
    if (window.g_enemyAntBrush) window.g_enemyAntBrush.update();
    if (window.g_lightningAimBrush) window.g_lightningAimBrush.update();
    if (window.g_resourceBrush) window.g_resourceBrush.update();
    if (window.g_buildingBrush) window.g_buildingBrush.update();
    if (window.g_flashAimBrush) window.g_flashAimBrush.update();
    if (window.g_queenControlPanel) window.g_queenControlPanel.update();
    if (window.g_lightningManager) window.g_lightningManager.update();
    if (window.g_flashManager) window.g_flashManager.update();
    if (window.g_powerManager) window.g_powerManager.update();
    if (window.g_powerBrushManager) window.g_powerBrushManager.update();
    if (g_globalTime) g_globalTime.update();

    // --- Player Movement ---
    const playerQueen = getQueen();
    if (playerQueen) {
      // Handle both MVC queen ({ model, view, controller }) and old Entity queen
      const moveQueen = (direction) => {
        if (playerQueen.controller && typeof playerQueen.controller.move === 'function') {
          // MVC queen
          playerQueen.controller.move(direction);
        } else if (typeof playerQueen.move === 'function') {
          // Old Entity queen
          playerQueen.move(direction);
        }
      };
      
      if (keyIsDown(87)) moveQueen("s"); // W
      if (keyIsDown(65)) moveQueen("a"); // A
      if (keyIsDown(83)) moveQueen("w"); // S
      if (keyIsDown(68)) moveQueen("d"); // D
    }

    // --- DIAManager update (typewriter effect, etc) ---
    if (typeof DIAManager.update === 'function') { DIAManager.update(); }

    // --- Update + Render Shop UI ---
    
  }

  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor) levelEditor.update();
  }

  // ============================================================
  // GAME LOOP PHASE 2: RENDER EVERYTHING
  // ============================================================

  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      background(40, 40, 40);
      levelEditor.render();
    }
    RenderManager.render(GameState.getState());
  } else {
    RenderManager.render(GameState.getState());
    if (window.g_powerManager) window.g_powerManager.render(); //USE THIS FOR POWERS
    if (window.g_powerBrushManager) window.g_powerBrushManager.render(); //USE THIS FOR POWERS
    if (window.g_naturePower) window.g_naturePower.render();
  }

  const playerQueen = getQueen?.();
  if (window.DIAManager && DIAManager.active && window.currentNPC && playerQueen) {
    const distToNPC = dist(playerQueen.posX, playerQueen.posY, window.currentNPC._x, window.currentNPC._y);
    if (distToNPC > 150) { 
      DIAManager.close();
      window.currentNPC.dialogueActive = false;
      window.currentNPC = null;
    }
  }

  // --- Render Quest UI (if any) ---
  if (window.QuestManager && typeof window.QuestManager.renderUI === 'function') {
    window.QuestManager.renderUI();
  }

  // --- Render Dialogue Box ---
  if (window.DIAManager) {
    window.DIAManager.update();
    window.DIAManager.render();
  }

  if (window.BUIManager) {
    window.BUIManager.update();
    window.BUIManager.render();
  }

  // --- Debug stuff ---
  if (typeof window.drawCoordinateVisualization === 'function') {
    try { window.drawCoordinateVisualization(); }
    catch (error) { console.error('❌ Error drawing coordinate visualization:', error); }
  }

  if (typeof window.drawTerrainGrid === 'function') {
    try { window.drawTerrainGrid(); }
    catch (error) { console.error('❌ Error drawing terrain grid:', error); }
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() { 

    switch(GameState.getState()){
    case 'MENU':
      break;
    case 'PLAYING':
      g_mouseController[type](...args);
      brushInGameMousePresses();
      UIInGameMousePresses();
      break;
    case 'OPTIONS':
      break;
    case 'DEBUG_MENU':
      break;
    case 'PAUSED':
      break;
    case 'GAME_OVER':
      break;
    case 'KANBAN':
      break;
    case 'LEVEL_EDITOR':
      levelEditor.handleClick(mouseX, mouseY);
      break;

    default:
      console.warn("Sketch.MousePressed: Invalid state")
      break;
    }
  return;
}

  // PRIORITY 1: Check active brushes FIRST (before UI elements)
  function brushInGameMousePresses(){
    brushCheckIfExists()
    switch(mouseButton){
      case LEFT:
        if (window.g_powerBrushManager.currentBrush != null) { window.g_powerBrushManager.usePower(mouseX, mouseY); return true;}
        if (window.g_enemyAntBrush.isActive) { window.g_enemyAntBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_resourceBrush.isActive) { window.g_resourceBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_buildingBrush.isActive) { window.g_buildingBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_lightningAimBrush.isActive) { window.g_lightningAimBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_flashAimBrush.isActive) { window.g_flashAimBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        break;
      case CENTER:
        break;
      case RIGHT:
        if (window.g_enemyAntBrush.isActive) { window.g_enemyAntBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_resourceBrush.isActive) { window.g_resourceBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_buildingBrush.isActive) { window.g_buildingBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_lightningAimBrush.isActive) { window.g_lightningAimBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        if (window.g_flashAimBrush.isActive) { window.g_flashAimBrush.onMousePressed(mouseX, mouseY, mouseButton); return true }
        break;
      default:
        return;
    }
   
  }

  function brushCheckIfExists() {
    if (typeof window.g_enemyAntBrush === "undefined") {console.warn("g_enemyAntBrush is undefined")}
    if (typeof window.g_resourceBrush === "undefined") {console.warn("g_resourceBrush is undefined")}
    if (typeof window.g_buildingBrush === "undefined") {console.warn("g_buildingBrush is undefined")}
    if (typeof window.g_lightningAimBrush === "undefined") {console.warn("g_lightningAimBrush is undefined")}
    if (typeof window.g_flashAimBrush === "undefined") {console.warn("g_flashAimBrush is undefined")}
  }

  // PRIORITY 2: RenderManager UI elements (buttons, panels, etc.)
  function UIInGameMousePresses() {
    UICheckIfExists();
    switch(mouseButton){
      case LEFT:
        if (window.g_uiDebugManager.isActive) { window.g_uiDebugManager.handlePointerDown({ x: mouseX, y: mouseY }); return true; }
        if (window.g_queenControlPanel.isQueenSelected()) { window.g_queenControlPanel.handleMouseClick(window.getWorldMouseX(), window.getWorldMouseY()); return true; }
        if (window.g_renderLayerManager.dispatchPointerEvent('pointerdown', { x: mouseX, y: mouseY, isPressed: true })) { return true; }
        if (window.draggablePanelManager.handleMouseEvents(mouseX, mouseY, true)) { return true; }
        break;
      case CENTER:
        break;
      case RIGHT:
        if (window.g_queenControlPanel.isActive) { window.g_queenControlPanel.handleRightClick(); return true }
        break;
      default:
        return;
    }
  }

  function UICheckIfExists(){
    if (typeof window.g_uiDebugManager === "undefined") {console.warn("g_uiDebugManager is undefined")}
    if (typeof window.g_queenControlPanel === "undefined") {console.warn("g_queenControlPanel is undefined")}
    if (typeof window.g_renderLayerManager === "undefined") {console.warn("RenderManager is undefined")}
  }


function mouseDragged() {
  // Handle level editor drag events FIRST (before UI debug or RenderManager)
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleDrag(mouseX, mouseY);
    return; // Don't process other drag events when level editor is active
  }
  
  // Handle UI Debug Manager drag events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager !== null && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  
  // Forward to RenderManager for UI/panel drag handling
  try {
    RenderManager.dispatchPointerEvent('pointermove', { x: mouseX, y: mouseY, isPressed: true });
  } catch (e) {
    console.error('❌ Error dispatching pointermove to RenderManager:', e);
  }
}

function mouseReleased() {

  // Handle level editor release events FIRST
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleMouseRelease(mouseX, mouseY);
  }
  
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

  //Handle Flash Flash Aim Brush release events
  if (window.g_flashAimBrush && window.g_flashAimBrush.isActive) {
    try {
      const buttonName = mouseButton === LEFT ? 'LEFT' : mouseButton === RIGHT ? 'RIGHT' : 'CENTER';
      window.g_flashAimBrush.onMouseReleased(mouseX, mouseY, buttonName);
    } catch (error) {
      console.error('❌ Error handling Final Flash aim brush release events:', error);
    }
  }
  
  // Forward to RenderManager for UI/panel event handling
  try {
    RenderManager.dispatchPointerEvent('pointerup', { x: mouseX, y: mouseY, isPressed: false });
  } catch (e) {
    console.error('❌ Error dispatching pointerup to RenderManager:', e);
  }
}

/**
 * mouseMoved - Handle hover events for Level Editor
 */
function mouseMoved() {
  // Handle level editor hover for preview highlighting
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleHover(mouseX, mouseY);
  }
}

/**
 * mouseWheel
 * ---------
 * Forward mouse wheel events to active brushes so users can cycle brush types
 * with the scroll wheel. Prevents default page scrolling while in-game.
 */
function mouseWheel(event) {
  try {
    // Level Editor - Shift+scroll for brush size, normal scroll for zoom
    if (GameState.getState() === 'LEVEL_EDITOR') {
      if (window.levelEditor && levelEditor.isActive()) {
        const delta = event.deltaY || 0;
        const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
        
        // Try brush size adjustment first (if Shift is pressed)
        if (shiftPressed && levelEditor.handleMouseWheel) {
          const handled = levelEditor.handleMouseWheel(event, shiftPressed);
          if (handled) {
            event.preventDefault();
            return false;
          }
        }
        
        // Otherwise, handle zoom
        levelEditor.handleZoom(delta);
        event.preventDefault();
        return false;
      }
    }

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

    // Priority order: Enemy brush, Resource brush, Lightning aim brush, Queen powers
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
    if (window.g_flashAimBrush && tryCycleDir(window.g_flashAimBrush)) {
      event.preventDefault();
      return false;
    }
    
    // Queen power cycling with mouse wheel
    if (window.g_queenControlPanel && window.g_queenControlPanel.handleMouseWheel(delta)) {
      event.preventDefault();
      return false;
    }
    
    // If no brush consumed the event, delegate to CameraManager for zoom (PLAYING state)
    if (cameraManager && typeof cameraManager.handleMouseWheel === 'function') {
      return cameraManager.handleMouseWheel(event);
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
  
  // Level Editor keyboard shortcuts (if active)
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleKeyPress(key);
    }
  }
  
  // Handle all debug-related keys FIRST (command line, dev console, test hotkeys)
  // This must come before coordinate debug to allow command line to work
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
    return; // Debug console key was handled
  }
  
  // Coordinate Debug Overlay toggle (Tilde ~ key)
  // Only if dev console is not enabled (so backtick can open command line)
  if (key === '`' || key === '~') {
    if (typeof toggleCoordinateDebug === 'function') {
      toggleCoordinateDebug();
      return;
    }
  }
  
  // Tile Inspector toggle (T key)
  if (key === 't' || key === 'T') {
    if (typeof toggleTileInspector === 'function') {
      toggleTileInspector();
      return;
    }
  }
  
  // Handle terrain grid debug shortcuts (Ctrl+Shift+G/O/L)
  if (typeof handleTerrainGridKeys === 'function' && handleTerrainGridKeys()) {
    return; // Terrain grid shortcut was handled
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
      logVerbose('🔧 Layer States:', RenderManager.getLayerStates());
      return; // Layer toggle was handled, don't process further
    }
  }

    // --- Queen Commands ---
  let playerQueen = getQueen();
  if (playerQueen && playerQueen.controller) {
    if (key.toLowerCase() === 'r') {
      if (typeof playerQueen.controller.emergencyRally === 'function') {
        playerQueen.controller.emergencyRally();
      }
      return;
    } 
    if (key.toLowerCase() === 'm') {
      if (typeof playerQueen.controller.gatherAntsAt === 'function') {
        playerQueen.controller.gatherAntsAt(mouseX, mouseY);
      }
      return;
    }
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

  if ((key === 'f' || key === 'F') && GameState.isInGame()) {
    cameraManager.toggleFollow();
  }

  if(key === 'U' || key === 'u'){
    let selectedEntity = getPrimarySelectedEntity();
    if(selectedEntity){
      for(let i = 0; i < 10; i++){
        selectedEntity.upgradeBuilding();
      }
    }
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
  if (key === 'e' || key === 'E') {
    // continue NPC dialogue if active
    if (window.currentNPC) {
      window.currentNPC.advanceDialogue();
      return;
    }
  
    // talk to nearby NPC if close
    const antony = NPCList.find(n => n.name === "Antony" && n.isPlayerNearby);
    if (antony) {
      antony.startDialogue(NPCDialogues.antony);
      return;
    }
  
    // interact with nearby anthill
    const nearbyHill = Buildings.find(b => b.isPlayerNearby && b.buildingType === "anthill");
    if (nearbyHill) {
      console.log("Interacting with nearby anthill:", nearbyHill);
      if (!window.BUIManager.active) {
        window.BUIManager.open(nearbyHill);
      } else {
        window.BUIManager.close();
      }
      return;
    }
  }
  
  if (window.BUIManager?.active) {
    const handled = window.BUIManager.handleKeyPress(key);
    if (handled) return;
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
 * getQueen
 * --------
 * Retrieves the player queen from the global queenAnt variable or finds it
 * in the spatial grid. Returns the MVC object for the queen.
 *
 * @returns {Object|null} - The queen MVC object {model, view, controller}, or null if not found.
 */
function getQueen() {
  // First check global queenAnt variable (set during initialization)
  if (typeof queenAnt !== 'undefined' && queenAnt) {
    return queenAnt;
  }
  
  // Fallback: search spatial grid for queen ant
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
    const allAnts = spatialGridManager.getEntitiesByType('Ant');
    for (const ant of allAnts) {
      // Check if this is a queen - look for QueenController
      if (ant.controller && ant.controller.constructor && ant.controller.constructor.name === 'QueenController') {
        return ant;
      }
      // Fallback: check for isQueen property on model
      if (ant.model && (ant.model.isQueen || ant.model._isQueen)) {
        return ant;
      }
    }
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
  //const gridSize = g_activeMap.getGridSizePixels()
  return { width, height };
}



  

/**
 * Deactivates any active brushes (resource, enemy ant) and logs the action.
 * Returns true if any brush was deactivated.
 */
function deactivateActiveBrushes() {
  let deactivated = false;
  if (typeof g_resourceBrush !== 'undefined' && g_resourceBrush && g_resourceBrush.isActive) {
    g_resourceBrush.toggle();
    logNormal('🎨 Resource brush deactivated via ESC key');
    deactivated = true;
  }
  if (typeof g_enemyAntBrush !== 'undefined' && g_enemyAntBrush && g_enemyAntBrush.isActive) {
    g_enemyAntBrush.toggle();
    logNormal('🎨 Enemy brush deactivated via ESC key');
    deactivated = true;
  }
  return deactivated;
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

/**
 * loadMossStoneLevel
 * ------------------
 * Creates and loads the moss & stone column level as the active map.
 * This level features alternating columns of moss and stone for testing
 * terrain speed modifiers (moss = IN_MUD, stone = ON_ROUGH).
 * 
 * @returns {boolean} True if successful, false otherwise
 */
function loadMossStoneLevel() {
  logNormal("🏛️ Loading Moss & Stone Column Level");
  
  try {
    // Create the moss/stone column level
    const mossStoneLevel = createMossStoneColumnLevel(
      CHUNKS_X,
      CHUNKS_Y,
      g_seed,
      CHUNK_SIZE,
      TILE_SIZE,
      [windowWidth, windowHeight]
    );
    
    // Register with MapManager
    if (typeof mapManager !== 'undefined') {
      mapManager.registerMap('mossStone', mossStoneLevel, true);
      logNormal("✅ Moss & Stone level registered and set as active");
      return true;
    } else {
      console.error("❌ MapManager not available");
      return false;
    }
  } catch (error) {
    console.error("❌ Failed to load Moss & Stone level:", error);
    return false;
  }
}

/**
 * switchToLevel
 * -------------
 * Switches to a specific level by ID and starts the game.
 * Convenience function for menu buttons.
 * 
 * @param {string} levelId - The ID of the level to switch to
 */
function switchToLevel(levelId) {
  logNormal(`🔄 Switching to level: ${levelId}`);
  
  // If the level is 'mossStone' and doesn't exist yet, create it
  if (levelId === 'mossStone') {
    const existingMap = mapManager.getMap('mossStone');
    if (!existingMap) {
      loadMossStoneLevel();
    } else {
      mapManager.setActiveMap('mossStone');
    }
  } else {
    // Switch to existing level
    setActiveMap(levelId);
  }
  
  // CRITICAL: Invalidate terrain cache to force re-render with new terrain
  if (g_activeMap && typeof g_activeMap.invalidateCache === 'function') {
    g_activeMap.invalidateCache();
    logNormal("✅ Terrain cache invalidated - new terrain will render");
  }
  
  // Start the game
  startGameTransition();
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
