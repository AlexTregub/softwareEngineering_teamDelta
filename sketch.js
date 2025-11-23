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
  initializeWindowManagers();
  
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
  window.g_selectionBoxController = g_selectionBoxController;

  // Register selection box with RenderManager
  if (g_selectionBoxController && typeof g_selectionBoxController.registerWithRenderManager === 'function') {
    g_selectionBoxController.registerWithRenderManager();
  }

  // Initialize camera management system
  cameraManager = new CameraManager();
  cameraManager.initialize();

  initializeContextMenuPrevention();
  initializeQueenControlPanel();
  initializeMenu();
  renderPipelineInit();
  mapManager.registerGameStateCallbacks();
  soundManager.startBGMMonitoring();
  window.QuestManager.preloadAssets();

  // Note: BUIManager initialized by windowInitializer
  if (window.BUIManager && typeof window.BUIManager.preload === 'function') {
    window.BUIManager.preload();
  }

  // Game Event
  gameEventManager = new GameEventManager();
  gameEventManager.startEvent('Wave'); // Waves / Additional hives...
  
  // Register AntCountDisplay interactive AFTER all other systems
  if (typeof g_antCountDisplay !== 'undefined' && g_antCountDisplay.registerInteractive) {
    g_antCountDisplay.registerInteractive();
  }
}

/**
 * initializeContextMenuPrevention
 * --------------------------------
 * Prevents right-click context menu from interfering with brush controls
 * Sets up multiple layers of prevention for cross-browser compatibility
 */
function initializeContextMenuPrevention() {
  if (typeof document === 'undefined') return;

  // Method 1: Global context menu prevention
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  // Method 2: Canvas-specific prevention
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
  
  // Method 3: Prevent right-click from triggering browser back/forward
  document.addEventListener('mouseup', function(e) {
    if (e.button === 2) { // Right mouse button
      e.preventDefault();
      return false;
    }
  });

  // Method 4: Document-level prevention
  document.oncontextmenu = function(e) {
    e.preventDefault();
    return false;
  };
  
  // Method 5: Window-level prevention
  if (typeof window !== 'undefined') {
    window.oncontextmenu = function(e) {
      e.preventDefault();
      return false;
    };
  }
  
  // Method 6: p5.js canvas-specific prevention (applied when canvas exists)
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
 * updatePlayingState
 * ------------------
 * Updates all systems during PLAYING game state
 */
function updatePlayingState() {
  ++frameCount;
  
  if (!window.g_powerManager) window.g_powerManager = new PowerManager();
  
  // Update systems
  if (window.g_powerBrushManager) {
    window.g_powerBrushManager.updateAllBrushes();
    window.g_powerBrushManager.update();
  }
  if (typeof updateQueenPanelVisibility !== 'undefined') updateQueenPanelVisibility();
  if (window.g_queenControlPanel) window.g_queenControlPanel.update();
  
  // Update managers
  if (window.eventManager) window.eventManager.update();
  if (window.g_fireballManager) window.g_fireballManager.update();
  if (window.g_lightningManager) window.g_lightningManager.update();
  if (window.g_flashManager) window.g_flashManager.update();
  if (window.g_powerManager) window.g_powerManager.update();
  if (g_globalTime) g_globalTime.update();
  
  // Player movement
  if (typeof handleQueenMovement !== 'undefined') handleQueenMovement();
  
  // Dialogue
  if (window.DIAManager && typeof DIAManager.update === 'function') DIAManager.update();
}

/**
 * renderPowers
 * ------------
 * Renders all power-related systems
 */
function renderPowers() {
  if (window.g_powerManager) window.g_powerManager.render();
  if (window.g_powerBrushManager) window.g_powerBrushManager.render();
  if (window.g_naturePower) window.g_naturePower.render();
}

/**
 * updateDialogueProximity
 * -----------------------
 * Checks if player is too far from NPC and closes dialogue
 */
function updateDialogueProximity() {
  const playerQueen = getQueen?.();
  if (window.DIAManager && DIAManager.active && window.currentNPC && playerQueen) {
    const distToNPC = dist(playerQueen.posX, playerQueen.posY, window.currentNPC._x, window.currentNPC._y);
    if (distToNPC > 150) {
      DIAManager.close();
      window.currentNPC.dialogueActive = false;
      window.currentNPC = null;
    }
  }
}

/**
 * renderUIOverlays
 * ----------------
 * Renders quest UI, dialogue, and building UI overlays
 */
function renderUIOverlays() {
  if (window.QuestManager?.renderUI) window.QuestManager.renderUI();
  
  if (window.DIAManager) {
    window.DIAManager.update();
    window.DIAManager.render();
  }
  
  if (window.BUIManager) {
    window.BUIManager.update();
    window.BUIManager.render();
  }
}

/**
 * renderDebugOverlays
 * -------------------
 * Renders debug visualizations if enabled
 */
function renderDebugOverlays() {
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
 * draw
 * ----
 * Main rendering loop for the game.
 * Uses the RenderManager to render the current game state.
 * Called automatically by p5.js at the frame rate.
 */
let spiderSpawned;
function draw() {
  // Spawn boss spider after 300 frames
  if (frameCount >= 300 && GameState.isInGame() && !spiderSpawned) {
    new Spider();
    spiderSpawned = true;
  }

  // Handle terrain import
  if (IMPORTED_JSON_TERRAIN !== NONE) {
    g_activeMap = IMPORTED_JSON_TERRAIN;
    g_activeMap.invalidateCache();
    g_activeMap.renderConversion.forceTileUpdate();
    g_activeMap.render();
    console.log("SWAPPED");
    IMPORTED_JSON_TERRAIN = NONE;
  }

  // ============================================================
  // PHASE 1: UPDATE SYSTEMS
  // ============================================================
  
  if (soundManager?.onDraw) soundManager.onDraw();
  
  if (cameraManager && (GameState.isInGame() || GameState.getState() === 'LEVEL_EDITOR')) {
    cameraManager.update();
  }

  const gameState = GameState.getState();
  
  if (gameState === 'PLAYING') {
    updatePlayingState();
  } else if (gameState === 'LEVEL_EDITOR' && window.levelEditor) {
    levelEditor.update();
  }

  // ============================================================
  // PHASE 2: RENDER
  // ============================================================
  
  if (gameState === 'LEVEL_EDITOR') {
    if (window.levelEditor?.isActive()) {
      background(40, 40, 40);
      levelEditor.render();
    }
    RenderManager.render(gameState);
  } else {
    RenderManager.render(gameState);
    renderPowers();
  }

  // Post-render overlays
  updateDialogueProximity();
  renderUIOverlays();
  renderDebugOverlays();
  
  if (gameEventManager) gameEventManager.update();
} 
// ===== CONSOLE HELPER FUNCTIONS =====
// All helper functions (spawnInitialAnts, spawnTestAnts, spawnAnts, addTestResources) 
// are now centralized in windowInitializer.js

// Make functions globally available using centralized initializer
if (typeof initializeGlobalFunctions !== 'undefined') {
  initializeGlobalFunctions();
}