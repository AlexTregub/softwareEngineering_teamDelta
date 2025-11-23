// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Defg++ client.cpp -o client ault 35
const CHUNKS_X = 50;
const CHUNKS_Y = 50;
let frameCount = 0;

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
let g_antCountDisplay; // Ant population display component
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

let IMPORTED_JSON_TERRAIN = NONE

let gameEventManager;

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
  antsPreloader();
  animationPreloader();
  terrariaFont = loadFont('Images/Assets/Terraria.TTF');
}


function setup() {
  // TEMPORARY
  // disableTerrainCache()
  // let importButton = createButton('Import json map')
  // importButton.mousePressed(importTerrain)

  // return

  createCanvas(windowWidth,windowHeight) 

  // if (!TEST_GRID()) {
  //   console.log("GRID MALFORMED.")
  //   return
  // } 

  // square(0,0,100)
  // image(GRASS_IMAGE,0,0,32,32)
  // square(10,10,100)

  // if (!TEST_CHUNK()) {
  //   console.log("CHUNK MALFORMED.")
  //   // TEST_CHUNK()
  // }

  // if (!TEST_CAM_RENDER_CONVERTER()){
  //   console.log("CAMERA RENDER CONVERTER MALFORMED.")
  // }

  // if (!TEST_BASIC_TERRAIN()) {
  //   console.log("BASIC TERRAIN FUNCTIONALITY MALFORMED.")
  // }
 
  // return; // !!! REMOVE BEFORE DEV

  // Initialize TaskLibrary before other systems that depend on it
  // window.taskLibrary = window.taskLibrary || new TaskLibrary();
  // logNormal('[Setup] TaskLibrary initialized:', window.taskLibrary.availableTasks?.length || 0, 'tasks');

  
  g_canvasX = windowWidth;
  g_canvasY = windowHeight;
  RenderMangerOverwrite = false
  createCanvas(g_canvasX, g_canvasY);
  
  // Initialize all window managers using centralized initializer
  if (typeof initializeWindowManagers !== 'undefined') {
    initializeWindowManagers();
  } else {
    console.error('❌ windowInitializer.js not loaded');
  }
  
  // Register spatial grid visualization in debug layer (only renders when enabled)
  if (typeof RenderManager !== 'undefined' && window.spatialGridManager) {
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_DEBUG, () => {
      if (window.VISUALIZE_SPATIAL_GRID && spatialGridManager) {
        spatialGridManager.visualize({ color: 'rgba(0, 255, 0, 0.3)' });
      }
    });
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
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);
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
    if (key === '3' || key === '4' || key === '5') { 
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
  // Note: EventManager and EventDebugManager initialized by windowInitializer

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
  
  // Register state change callback for spawning initial ants
  if (typeof GameState !== 'undefined' && typeof LegacyAntFactory !== 'undefined') {
    GameState.onStateChange((newState, oldState) => {
      if (newState === 'PLAYING' && oldState !== 'PAUSED') {
        // Only spawn ants on fresh game start (not when resuming from pause)
        spawnInitialAnts();
      }
    });
  }
  
  soundManager.startBGMMonitoring();
  initializeContextMenuPrevention();
  // Buildings.push(createBuilding('anthill', 400, 400, 'player')); // Initial hive
  window.QuestManager.preloadAssets();

  // Note: BUIManager initialized by windowInitializer
  if (window.BUIManager && typeof window.BUIManager.preload === 'function') {
    window.BUIManager.preload();
  }
  //window.draggablePanelManager.createDefaultPanels();

  // Game Event
  gameEventManager = new GameEventManager();
  gameEventManager.startEvent('Wave'); // Waves / Additional hives...



  console.log("SAMPLING EXAMPLE")
  // console.log("Grass @",g_activeMap.sampleTiles("grass",10))
  // console.log("Stone peaks @",g_activeMap.sampleTiles("stone_1",10))
  // console.log("Beaches @",g_activeMap.sampleTiles("sand",10))
  // console.log("Deep water @",g_activeMap.sampleTiles("waterCave",10))
  // console.log("Grass OR Sand",g_activeMap.sampleTiles(["grass","sand"],100))
  // console.log("Grass OR Sand OR Stone peaks @",g_activeMap.sampleTiles(["grass","sand","stone_1"],1000))
  // console.log("SETUPRESULT:",window)

  // drop(importTerrain)
  
  // ==========================================
  // REGISTER INTERACTIVE LAST FOR PRIORITY
  // ==========================================
  // Register AntCountDisplay interactive AFTER all other systems
  // so it's checked FIRST in reverse-order dispatch
  if (typeof g_antCountDisplay !== 'undefined' && typeof RenderManager !== 'undefined') {
    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, {
      id: 'ant-count-display',
      hitTest: (pointer) => {
        if (!g_antCountDisplay || GameState.getState() !== 'PLAYING') return false;
        
        // RenderManager passes pointer.screen.x/y for UI layers
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        
        return g_antCountDisplay.isMouseOver(x, y);
      },
      onPointerDown: (pointer) => {
        if (!g_antCountDisplay || GameState.getState() !== 'PLAYING') return false;
        
        // RenderManager passes pointer.screen.x/y for UI layers
        const x = pointer.screen ? pointer.screen.x : pointer.x;
        const y = pointer.screen ? pointer.screen.y : pointer.y;
        
        return g_antCountDisplay.handleClick(x, y);
      }
    });
  }
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

// No global exports needed - context menu prevention is automatic

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
  
  if (typeof AntCountDisplayComponent !== 'undefined') {
    g_antCountDisplay = new AntCountDisplayComponent(20, 80, {
      sprites: {} // Auto-loads from JobImages global
    });
    
    // Expose to window for E2E tests
    window.g_antCountDisplay = g_antCountDisplay;
    
    if (typeof RenderManager !== 'undefined') {
      // Update drawable - queries ants array
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (g_antCountDisplay && GameState.getState() === 'PLAYING') {
          g_antCountDisplay.update();
        }
      });
      
      // Render drawable - draws the panel
      RenderManager.addDrawableToLayer(RenderManager.layers.UI_GAME, () => {
        if (g_antCountDisplay && GameState.getState() === 'PLAYING') {
          g_antCountDisplay.render('PLAYING');
        }
      });
      
      // Interactive registration moved to END of setup() for priority
      }
  } else {
    console.warn('⚠️ AntCountDisplayComponent not loaded');
  }
  
  // Initialize UI components using centralized initializer
  if (typeof initializeUIComponents !== 'undefined') {
    initializeUIComponents(window);
  } else {
    console.error('❌ initializeUIComponents not available');
  }


  // Main hive, initial, anthill
  Buildings.push(createBuilding('anthill', 400, 400, 'player')); // Initial hive

  queenAnt = spawnQueen(); // Queen spawn post anthill

  // npc test
  Buildings.push(createNPC(350,500));
  // Boss
  // let spider = new Spider(); 
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
  

  // EXAMPLE OF LOADING JSON FILE...
  // if (frameCount == 300) {
  //   importTerrainLP("/src/levels/tutorialCave_Start.json")
  // }

  if (frameCount == 300) {
    let spider = new Spider()
  }

  if (!(IMPORTED_JSON_TERRAIN === NONE)) { // LOADER... OVERWRITES g_activeMap
    g_activeMap = IMPORTED_JSON_TERRAIN

    g_activeMap.invalidateCache()
    g_activeMap.renderConversion.forceTileUpdate()

    g_activeMap.render() // Potential clipping...

    console.log("SWAPPED")
    IMPORTED_JSON_TERRAIN = NONE
  }
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
    ++frameCount; // Frames in game

    // --- Update gameplay systems ---
    if (window.g_enemyAntBrush) window.g_enemyAntBrush.update();
    if (window.g_lightningAimBrush) window.g_lightningAimBrush.update();
    if (window.g_resourceBrush) window.g_resourceBrush.update();
    if (window.g_buildingBrush) window.g_buildingBrush.update();
    if (window.g_flashAimBrush) window.g_flashAimBrush.update();

    if (typeof updateQueenPanelVisibility !== 'undefined') updateQueenPanelVisibility();
    if (window.g_queenControlPanel) window.g_queenControlPanel.update();

    if (window.eventManager) window.eventManager.update();
    if (window.g_fireballManager) window.g_fireballManager.update();
    if (window.g_lightningManager) window.g_lightningManager.update();
    if (window.g_flashManager) window.g_flashManager.update();
    if (window.g_powerManager) window.g_powerManager.update();
    if (!window.g_powerManager) window.g_powerManager = new PowerManager();
    if (window.g_powerBrushManager) window.g_powerBrushManager.update();
    if (g_globalTime) g_globalTime.update();

    // --- Player Movement ---
    const playerQueen = getQueen();
    if (playerQueen) {
      if (keyIsDown(87)) playerQueen.move("s"); // W
      if (keyIsDown(65)) playerQueen.move("a"); // A
      if (keyIsDown(83)) playerQueen.move("w"); // S
      if (keyIsDown(68)) playerQueen.move("d"); // D
    }

    // --- DIAManager update (typewriter effect, etc) ---
    if (window.DIAManager && typeof DIAManager.update === 'function') {
      DIAManager.update();
    }

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

gameEventManager.update()

} 
// ===== CONSOLE HELPER FUNCTIONS =====
// All helper functions (spawnInitialAnts, spawnTestAnts, spawnAnts, addTestResources) 
// are now centralized in windowInitializer.js

// Make functions globally available using centralized initializer
if (typeof initializeGlobalFunctions !== 'undefined') {
  initializeGlobalFunctions();
}