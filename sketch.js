// --- GRID SYSTEM ---
let g_canvasX = 800; // Default 800
let g_canvasY = 800; // Default 800
const TILE_SIZE = 32; //  Default 35
const CHUNKS_X = 20;
const CHUNKS_Y = 20;
let COORDSY;

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

// Buildings
let Buildings = [];
// Camera system - now managed by CameraSystemManager (switches between CameraManager and CustomLevelCamera)
let cameraManager; // CameraSystemManager instance

/**
 * Register entities from LevelLoader with global game arrays and systems
 * @param {Array} entities - Array of entities from LevelLoader.loadLevel()
 * @returns {Object} Counts of registered entities by type
 */
function registerEntitiesWithGameWorld(entities) {
  const counts = { ants: 0, resources: 0, buildings: 0 };
  
  if (!Array.isArray(entities) || entities.length === 0) {
    console.warn('[registerEntitiesWithGameWorld] No entities to register');
    return counts;
  }
  
  console.log('[registerEntitiesWithGameWorld] Registering', entities.length, 'entities');
  
  entities.forEach((entity, index) => {
    if (!entity || !entity.type) {
      console.warn(`[registerEntitiesWithGameWorld] Skipping invalid entity at index ${index}`);
      return;
    }
    
    // Register with appropriate global array based on type
    if (entity.type === 'Queen' || entity.type === 'Ant') {
      if (!window.ants) window.ants = [];
      window.ants.push(entity);
      counts.ants++;
      console.log(`[registerEntitiesWithGameWorld] Registered ${entity.type}:`, entity.id, 'at', entity.position);
    } else if (entity.type === 'Resource') {
      if (!window.resource_list) window.resource_list = [];
      window.resource_list.push(entity);
      counts.resources++;
      console.log(`[registerEntitiesWithGameWorld] Registered Resource:`, entity.id, 'at', entity.position);
    } else if (entity.type === 'Building') {
      if (!window.Buildings) window.Buildings = [];
      window.Buildings.push(entity);
      counts.buildings++;
      console.log(`[registerEntitiesWithGameWorld] Registered Building:`, entity.id, 'at', entity.position);
    } else {
      console.warn(`[registerEntitiesWithGameWorld] Unknown entity type: ${entity.type}`);
    }
    
    // Register with spatial grid manager if available
    if (window.spatialGridManager && typeof window.spatialGridManager.registerEntity === 'function') {
      try {
        window.spatialGridManager.registerEntity(entity);
        console.log(`[registerEntitiesWithGameWorld] Registered with spatial grid:`, entity.id);
      } catch (error) {
        console.error(`[registerEntitiesWithGameWorld] Failed to register entity ${entity.id} with spatial grid:`, error);
      }
    }
  });
  
  console.log('[registerEntitiesWithGameWorld] Registration complete. Total:', 
    `Ants: ${counts.ants}, Resources: ${counts.resources}, Buildings: ${counts.buildings}`);
  
  return counts;
}

function preload(){
  terrainPreloader();
  soundManagerPreload();
  resourcePreLoad();
  preloadPauseImages();
  BuildingPreloader();
  loadPresentationAssets();
  menuPreload();
  antsPreloader();
}


function setup() {
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
    //spawnInitialResources();
  }
  
  initializeWorld();

  // Initialize Draggable Panel System (must be after initializeWorld, before any UI that uses panels)
  if (typeof initializeDraggablePanelSystem !== 'undefined') {
    initializeDraggablePanelSystem().then(() => {
      logVerbose('✅ DraggablePanelSystem ready');
    }).catch((error) => {
      console.error('❌ Failed to initialize DraggablePanelSystem:', error);
    });
  } else {
    console.warn('⚠️ initializeDraggablePanelSystem not found - draggable panels will not work');
  }

  // Initialize TileInteractionManager for efficient mouse input handling
  g_tileInteractionManager = new TileInteractionManager(g_canvasX, g_canvasY, TILE_SIZE);

  // --- Initialize Controllers ---
  g_mouseController = new MouseInputController();
  g_keyboardController = new KeyboardInputController();
  logVerbose('[SETUP] About to create SelectionBoxController, g_mouseController:', g_mouseController, 'ants:', ants);
  g_selectionBoxController = SelectionBoxController.getInstance(g_mouseController, ants);
  logVerbose('[SETUP] Created g_selectionBoxController:', g_selectionBoxController);
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
    // UI shortcuts are now handled directly in keyPressed() function
    // This maintains compatibility with existing game input systems
  });

  // Initialize camera management system (CameraSystemManager for dual camera support)
  if (typeof CameraSystemManager !== 'undefined') {
    // Note: CameraSystemManager doesn't require a cameraController parameter
    // It creates and manages its own camera instances internally
    cameraManager = new CameraSystemManager(null, width, height);
    // Initialize with procedural camera for MENU state
    cameraManager.switchCamera('MENU');
    logVerbose('📷 CameraSystemManager initialized with dual camera support');
    
    // Register camera switching callback with GameState
    if (typeof GameState !== 'undefined' && typeof GameState.onStateChange === 'function') {
      GameState.onStateChange((newState, previousState) => {
        if (cameraManager && typeof cameraManager.switchCamera === 'function') {
          cameraManager.switchCamera(newState);
          logVerbose(`📷 Camera switched for state: ${newState}`);
        }
      });
      logVerbose('📷 Camera state change callback registered');
    }
  } else {
    // Fallback to old system if CameraSystemManager not available
    cameraManager = new CameraManager();
    cameraManager.initialize();
    logWarning('📷 Falling back to CameraManager (CameraSystemManager not available)');
  }

  // Initialize settings system (for configurable editor preferences)
  if (typeof SettingsManager !== 'undefined') {
    SettingsManager.getInstance().loadSettings();
    if (typeof SettingsPanel !== 'undefined') {
      window.settingsPanel = new SettingsPanel();
    }
  }

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
    
    logVerbose('🚫 Right-click context menu disabled for brush controls');
  }

  // Initialize Queen Control Panel system
  if (typeof initializeQueenControlPanel !== 'undefined') {
    initializeQueenControlPanel();
    logVerbose('👑 Queen Control Panel initialized in setup');
  }

  // Initialize Fireball System
  if (typeof window !== 'undefined' && typeof FireballManager !== 'undefined') {
    window.g_fireballManager = new FireballManager();
    logVerbose('🔥 Fireball System initialized in setup');
  }

  // Initialize Event Manager (singleton)
  if (typeof EventManager !== 'undefined') {
    window.eventManager = EventManager.getInstance();
    logVerbose('🎯 Event Manager initialized in setup');
  }

  // Initialize Event Debug Manager
  if (typeof EventDebugManager !== 'undefined') {
    window.eventDebugManager = new EventDebugManager();
    
    // Connect EventDebugManager to EventManager
    if (window.eventManager) {
      window.eventManager.setEventDebugManager(window.eventDebugManager);
      logVerbose('🔗 Event Debug Manager connected to Event Manager');
    }
    
    logVerbose('🐛 Event Debug Manager initialized in setup');
  }

  initializeMenu();  // Initialize the menu system
  renderPipelineInit();

  // Farmland working...
  // g_tileInteractionManager.turnToFarmland(-60,-60,0,0); // NOTE: current Y is flipped...
  // g_tileInteractionManager.turnToFarmland(0,0); // NOTE: current Y is flipped...
  
  // Register state change callback for level editor initialization
  if (typeof GameState !== 'undefined' && typeof levelEditor !== 'undefined') {
    GameState.onStateChange((newState, oldState) => {
      if (newState === 'LEVEL_EDITOR') {
        // Initialize level editor with sparse terrain for lazy loading
        if (!levelEditor.isActive()) {
          // Use SparseTerrain for lazy loading (black canvas, paint anywhere)
          // Falls back to CustomTerrain if SparseTerrain unavailable
          let terrain;
          if (typeof SparseTerrain !== 'undefined') {
            terrain = new SparseTerrain(32, 'dirt');
            logVerbose('🎨 Level Editor activated with SparseTerrain (lazy loading)');
          } else if (typeof CustomTerrain !== 'undefined') {
            terrain = new CustomTerrain(50, 50, 32, 'dirt');
            logVerbose('🎨 Level Editor activated with CustomTerrain (fallback)');
          } else {
            console.error('No terrain class available for Level Editor');
            return;
          }
          levelEditor.initialize(terrain);
        }
      } else if (oldState === 'LEVEL_EDITOR') {
        // Deactivate level editor when leaving
        levelEditor.deactivate();
        logVerbose('🎨 Level Editor deactivated');
      }
    });
  }
  
  // Start automatic BGM monitoring after menu initialization
  if (soundManager && typeof soundManager.startBGMMonitoring === 'function') {
    soundManager.startBGMMonitoring();
  }
  
  // Initialize context menu prevention for better brush control
  initializeContextMenuPrevention();
  
  // Initialize middle-click pan shortcuts
  if (typeof MiddleClickPan !== 'undefined') {
    MiddleClickPan.initialize();
    logVerbose('🖱️ Middle-click pan initialized');
  }
  //

  Buildings.push(createBuilding('hivesource', 200, 200, 'neutral'));
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
 * Global function to test context menu prevention
 */
function testContextMenuPrevention() {
  logVerbose('🧪 Testing context menu prevention...');
  logVerbose('Right-click anywhere to test - context menu should NOT appear');
  logVerbose('If context menu still appears, try: disableContextMenu()');
  return true;
}

/**
 * Global function to force disable context menu
 */
function disableContextMenu() {
  initializeContextMenuPrevention();
  logVerbose('🔒 Context menu prevention forcibly re-applied');
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

  // OLD TERRAIN SYSTEM - Commented out, using gridTerrain instead
   g_map = new Terrain(g_canvasX,g_canvasY,TILE_SIZE);
  // MAP.randomize(g_seed); // ROLLED BACK RANDOMIZATION, ALLOWING PATHFINDING, ALL WEIGHTS SAME
  
  // New, Improved, and Chunked Terrain using MapManager
  // g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[g_canvasX,g_canvasY]);
  // disableTerrainCache(); // TEMPORARILY DISABLING CACHE. BEGIN MOVING THINGS OVER.
  g_map2 = new gridTerrain(CHUNKS_X,CHUNKS_Y,g_seed,CHUNK_SIZE,TILE_SIZE,[windowWidth,windowHeight]);
  g_map2.randomize(g_seed);
  g_map2.renderConversion.alignToCanvas(); // Snaps grid to canvas 
  
  // IMPORTANT: Set g_activeMap immediately after g_map2 creation
  g_activeMap = g_map2;
  
  // Register with MapManager (which will also update g_activeMap)
  if (typeof mapManager !== 'undefined') {
    mapManager.registerMap('level1', g_map2, true);
    logVerbose("Main map registered with MapManager as 'level1' and set as active");
  }
  
  // COORDSY = new CoordinateSystem();
  // COORDSY.setViewCornerBC(0,0);
  
  g_gridMap = new PathMap(g_map);
  g_globalTime = new GlobalTime();
  
   // Initialize the render layer manager if not already done
  RenderManager.initialize();
  queenAnt = spawnQueen();
  
  // Auto-track queen ant with camera (Phase 4.2 - Camera Following Integration)
  if (cameraManager && queenAnt) {
    cameraManager.followEntity(queenAnt);
    logVerbose('[initializeWorld] Camera now following queen ant');
  }
}

/**
 * loadCustomLevel
 * ----------------
 * Load custom level from JSON file (Level Editor export)
 * @param {string} levelPath - Path to level JSON file (e.g., 'levels/CaveTutorial.json')
 * @returns {Promise<boolean>} True if successful, false on error
 */
/**
 * Safe Logging Wrappers
 * ======================
 * Fallback to console methods if verboseLogger functions are not available
 * Handles logWarning/logWarn mismatch (verboseLogger exports logWarn, not logWarning)
 */
const safeLogNormal = (msg) => {
  if (typeof logNormal === 'function') logNormal(msg);
  else if (typeof console !== 'undefined') console.log(msg);
};

const safeLogError = (msg) => {
  if (typeof logError === 'function') logError(msg);
  else if (typeof console !== 'undefined') console.error(msg);
};

const safeLogWarning = (msg) => {
  if (typeof logWarning === 'function') logWarning(msg);
  else if (typeof logWarn === 'function') logWarn(msg); // verboseLogger uses logWarn
  else if (typeof console !== 'undefined') console.warn(msg);
};

/**
 * Clear Game Entities
 * ====================
 * Clears all procedurally generated entities before loading custom level
 * Ensures clean slate for JSON-defined levels
 * 
 * @returns {Object} Count of cleared entities
 */
function clearGameEntities() {
  const counts = {
    ants: (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.length : 0,
    resources: (typeof resource_list !== 'undefined' && Array.isArray(resource_list)) ? resource_list.length : 0,
    buildings: (typeof Buildings !== 'undefined' && Array.isArray(Buildings)) ? Buildings.length : 0,
    selectables: (typeof selectables !== 'undefined' && Array.isArray(selectables)) ? selectables.length : 0
  };

  safeLogNormal(`[clearGameEntities] Clearing existing entities: ${counts.ants} ants, ${counts.resources} resources, ${counts.buildings} buildings, ${counts.selectables} selectables`);

  // Clear arrays (preserve references by setting length to 0, not reassigning)
  if (typeof ants !== 'undefined' && Array.isArray(ants)) {
    ants.length = 0;
  }
  
  if (typeof resource_list !== 'undefined' && Array.isArray(resource_list)) {
    resource_list.length = 0;
  }
  
  if (typeof Buildings !== 'undefined' && Array.isArray(Buildings)) {
    Buildings.length = 0;
  }
  
  if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
    selectables.length = 0;
  }

  // Reset global queen reference
  if (typeof window !== 'undefined') {
    window.queenAnt = null;
  }
  if (typeof global !== 'undefined') {
    global.queenAnt = null;
  }

  // Clear spatial grid if available
  if (typeof spatialGridManager !== 'undefined' && 
      spatialGridManager !== null && 
      typeof spatialGridManager.clear === 'function') {
    spatialGridManager.clear();
    safeLogNormal('[clearGameEntities] Cleared spatial grid');
  }

  // CRITICAL: Stop resource spawning timer to prevent procedural generation
  // Custom levels should only have entities defined in JSON
  if (typeof g_resourceManager !== 'undefined' && 
      g_resourceManager !== null && 
      typeof g_resourceManager.stopSpawning === 'function') {
    g_resourceManager.stopSpawning();
    safeLogNormal('[clearGameEntities] Stopped resource spawning timer');
  }

  safeLogNormal(`[clearGameEntities] Cleanup complete - all entity arrays cleared`);
  
  return counts;
}

async function loadCustomLevel(levelPath) {
  try {
    safeLogNormal(`[loadCustomLevel] Loading level from: ${levelPath}`);
    
    // CRITICAL: Clear all existing entities before loading custom level
    // This ensures procedurally generated entities don't mix with JSON data
    const clearedCounts = clearGameEntities();
    safeLogNormal(`[loadCustomLevel] Cleared ${clearedCounts.ants + clearedCounts.resources + clearedCounts.buildings} entities`);
    
    // Fetch level JSON
    const response = await fetch(levelPath);
    if (!response.ok) {
      throw new Error(`Failed to load level: ${response.status} ${response.statusText}`);
    }
    
    const levelData = await response.json();
    safeLogNormal(`[loadCustomLevel] Level data loaded: ${levelData.tileCount || 0} tiles`);
    
    // Load terrain via MapManager
    const mapId = 'custom-level'; // Could extract from levelData.metadata.id
    const terrain = mapManager.loadLevel(levelData, mapId, true);
    if (!terrain) {
      throw new Error('MapManager failed to load level terrain');
    }
    safeLogNormal(`[loadCustomLevel] Terrain loaded and set as active map`);
    
    // Update global references
    g_activeMap = terrain;
    g_map2 = terrain; // For backwards compatibility
    
    // Load entities via LevelLoader
    console.log('[loadCustomLevel] DEBUG: Checking LevelLoader availability...', typeof LevelLoader !== 'undefined');
    if (typeof LevelLoader !== 'undefined') {
      console.log('[loadCustomLevel] DEBUG: Creating LevelLoader instance...');
      const loader = new LevelLoader();
      
      console.log('[loadCustomLevel] DEBUG: Calling loader.loadLevel()...');
      const result = loader.loadLevel(levelData);
      
      console.log('[loadCustomLevel] DEBUG: LevelLoader result:', result);
      console.log('[loadCustomLevel] DEBUG: Result success:', result?.success);
      console.log('[loadCustomLevel] DEBUG: Entities returned:', result?.entities?.length);
      
      if (result && result.success) {
        safeLogNormal(`[loadCustomLevel] Entities loaded: ${result.entities.length}`);
        
        // DEBUG: Log first entity (avoid circular reference by logging properties only)
        if (result.entities.length > 0) {
          const entity = result.entities[0];
          console.log('[loadCustomLevel] DEBUG: First entity type:', entity.type, 'id:', entity.id, 'position:', entity.position);
        }
        
        // CRITICAL BUG FIX: Register entities with game world
        console.log('[loadCustomLevel] DEBUG: Registering entities with game world...');
        
        // TODO: ADD ENTITIES TO ants[] ARRAY HERE
        // Register entities with global game arrays
        console.log('[loadCustomLevel] DEBUG: Registering entities with game world...');
        const registeredCounts = registerEntitiesWithGameWorld(result.entities);
        console.log('[loadCustomLevel] DEBUG: Registration complete -', 
          `Ants: ${registeredCounts.ants},`,
          `Resources: ${registeredCounts.resources},`,
          `Buildings: ${registeredCounts.buildings}`);
        
        // Find queen ant for camera following
        console.log('[loadCustomLevel] DEBUG: Checking for queen detection...', typeof findQueen !== 'undefined');
        const queenDetection = typeof findQueen !== 'undefined' ? findQueen : (typeof window.queenDetection !== 'undefined' ? window.queenDetection.findQueen : null);
        
        if (queenDetection) {
          console.log('[loadCustomLevel] DEBUG: Searching for queen in entities...');
          const queen = queenDetection(result.entities);
          console.log('[loadCustomLevel] DEBUG: Queen found:', queen ? true : false);
          
          if (queen) {
            console.log('[loadCustomLevel] DEBUG: Queen type:', queen.type, 'Position:', queen.position);
            window.queenAnt = queen;
            
            // Start camera following queen
            if (cameraManager && cameraManager.followEntity) {
              console.log('[loadCustomLevel] DEBUG: Calling cameraManager.followEntity()...');
              const followResult = cameraManager.followEntity(queen);
              console.log('[loadCustomLevel] DEBUG: followEntity result:', followResult);
              safeLogNormal('[loadCustomLevel] Camera now following queen ant');
            } else {
              console.error('[loadCustomLevel] DEBUG: CameraManager or followEntity not available!');
            }
          } else {
            safeLogWarning('[loadCustomLevel] No queen found in level');
            console.log('[loadCustomLevel] DEBUG: Entity types in level:', result.entities.map(e => e.type));
          }
        } else {
          console.error('[loadCustomLevel] DEBUG: findQueen function not available!');
        }
      } else {
        safeLogWarning('[loadCustomLevel] Entity loading failed or returned no entities');
        console.log('[loadCustomLevel] DEBUG: Result errors:', result?.errors);
      }
    } else {
      safeLogWarning('[loadCustomLevel] LevelLoader not available, skipping entity spawning');
      console.error('[loadCustomLevel] DEBUG: LevelLoader class not found in global scope!');
    }
    
    // Transition to IN_GAME state (camera will auto-switch via GameState callback)
    if (typeof GameState !== 'undefined' && GameState.goToGame) {
      GameState.goToGame();
      safeLogNormal('[loadCustomLevel] Game state set to IN_GAME');
      
      // Set map reference for both camera systems
      if (cameraManager && typeof cameraManager.setCurrentMap === 'function') {
        cameraManager.setCurrentMap(terrain);
        logVerbose('📷 Map reference set for camera systems');
      }
    }
    
    safeLogNormal(`[loadCustomLevel] Level loaded successfully: ${levelPath}`);
    return true;
  } catch (error) {
    console.error('[loadCustomLevel] Error:', error);
    safeLogError(`[loadCustomLevel] Failed to load level: ${error.message}`);
    return false;
  }
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
  // ============================================================
  // GAME LOOP PHASE 1: UPDATE ALL SYSTEMS
  // Updates must happen BEFORE rendering to show current frame data
  // ============================================================
  
  // Track draw calls for sound manager
  if (typeof soundManager !== 'undefined' && soundManager.onDraw) {
    soundManager.onDraw();
  }
  
  // Update camera (input processing, following, bounds clamping)
  // Enable for both in-game states AND Level Editor
  if (cameraManager && (GameState.isInGame() || GameState.getState() === 'LEVEL_EDITOR')) {
    cameraManager.update();
  }

  // Update game systems (only if playing or in-game)
  if (GameState.getState() === 'PLAYING' || GameState.getState() === 'IN_GAME') {
    // Update brush systems
    if (window.g_enemyAntBrush) {
      window.g_enemyAntBrush.update();
    }
    if (window.g_lightningAimBrush) {
      window.g_lightningAimBrush.update();
    }
    if (window.g_resourceBrush) {
      window.g_resourceBrush.update();
    }
    if (window.g_buildingBrush) {
      window.g_buildingBrush.update();
    }

    // Update queen control panel
    if (typeof updateQueenPanelVisibility !== 'undefined') {
      updateQueenPanelVisibility();
    }
    if (window.g_queenControlPanel) {
      window.g_queenControlPanel.update();
    }

    // Update Event Manager (triggers and active events)
    if (window.eventManager) {
      window.eventManager.update();
    }

    // Update effect systems
    if (window.g_fireballManager) {
      window.g_fireballManager.update();
    }
    if (window.g_lightningManager) {
      window.g_lightningManager.update();
    }
    if (g_globalTime) {
      g_globalTime.update();
    }

    // Update queen movement (WASD keys)
    const playerQueen = getQueen();
    if (playerQueen) {
      if (keyIsDown(87)) playerQueen.move("s"); // lazy flip of w and s
      if (keyIsDown(65)) playerQueen.move("a");
      if (keyIsDown(83)) playerQueen.move("w");
      if (keyIsDown(68)) playerQueen.move("d");
    }
  }
  
  // Update level editor (if active)
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor) {
      levelEditor.update();
    }
  }

  // ============================================================
  // GAME LOOP PHASE 2: RENDER EVERYTHING ONCE
  // RenderLayerManager handles all layered rendering
  // ============================================================
  
  // Render level editor (takes over rendering when active)
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      background(40, 40, 40); // Dark background for editor
      levelEditor.render();
    }
    // IMPORTANT: Also call RenderManager.render() in Level Editor mode
    // This ensures draggable panels get their interactive.update() calls
    RenderManager.render(GameState.getState());
  } else {
    // Normal game rendering
    RenderManager.render(GameState.getState());
  }

  // Debug visualization for coordinate system (toggle with visualizeCoordinateSystem())
  if (typeof window.drawCoordinateVisualization === 'function') {
    try {
      window.drawCoordinateVisualization();
    } catch (error) {
      console.error('❌ Error drawing coordinate visualization:', error);
    }
  }
  
  // Debug visualization for terrain grid (toggle with toggleTerrainGrid() or Ctrl+Shift+G)
  if (typeof window.drawTerrainGrid === 'function') {
    try {
      window.drawTerrainGrid();
    } catch (error) {
      console.error('❌ Error drawing terrain grid:', error);
    }
  }
  
  // Render SettingsPanel (if visible)
  if (window.settingsPanel && settingsPanel.visible) {
    settingsPanel.render();
  }
}

 /* handleMouseEvent
 * ----------------
 * Delegates mouse events to the mouse controller if the game is in an active state.
 * @param {string} type - The mouse event type (e.g., 'handleMousePressed').
 * @param {...any} args - Arguments to pass to the controller handler.
 */
function handleMouseEvent(type, ...args) {
  if (GameState.isInGame()) {
    g_mouseController[type](...args);
    if (g_activeMap && g_activeMap.renderConversion) {
      logVerbose(g_activeMap.renderConversion.convCanvasToPos([mouseX,mouseY]));
    }
  }
}

/**
 * mousePressed
 * ------------
 * Handles mouse press events by delegating to the mouse controller.
 */
function mousePressed() {
  // Settings Panel - check first (modal overlay)
  if (window.settingsPanel && settingsPanel.visible) {
    settingsPanel.handleClick(mouseX, mouseY);
    return;
  }
  
  // Middle-click pan - handle before all other mouse events
  if (mouseButton === CENTER && typeof MiddleClickPan !== 'undefined') {
    if (MiddleClickPan.handlePress()) return;
  }
  
  // Level Editor - handle clicks first if active
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleClick(mouseX, mouseY);
      return; // Don't process other mouse events
    }
  }
  
  // Tile Inspector - check first
  if (typeof tileInspectorEnabled !== 'undefined' && tileInspectorEnabled) {
    if (typeof inspectTileAtMouse === 'function') {
      inspectTileAtMouse(mouseX, mouseY);
      return; // Don't process other mouse events
    }
  }
  
  // Handle UI Debug Manager mouse events first
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager && g_uiDebugManager.isActive) {
    const handled = g_uiDebugManager.handlePointerDown({ x: mouseX, y: mouseY });
    if (handled) return;
  }

  // PRIORITY 1: Check active brushes FIRST (before UI elements)
  // This ensures brush clicks work even if panels are visible
  
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

  // Handle Queen Control Panel right-click for power cycling
  if (window.g_queenControlPanel && mouseButton === RIGHT) {
    try {
      const handled = window.g_queenControlPanel.handleRightClick();
      if (handled) return; // Queen panel consumed the right-click
    } catch (error) {
      console.error('❌ Error handling queen control panel right-click:', error);
    }
  }

  // PRIORITY 2: RenderManager UI elements (buttons, panels, etc.)
  // Forward to RenderManager interactive dispatch (gives adapters priority)
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointerdown', { x: mouseX, y: mouseY, isPressed: true });
    if (consumed) {
      logVerbose('🖱️ Mouse click consumed by RenderManager');
      return; // consumed by an interactive (buttons/panels/etc.)
    }
    logVerbose('🖱️ Mouse click NOT consumed by RenderManager, passing to other handlers');
    // If not consumed, let higher-level systems decide; legacy fallbacks removed in favor of RenderManager adapters.
  } catch (e) {
    console.error('Error dispatching pointerdown to RenderManager:', e);
    // best-effort: still notify legacy controller if present to avoid breaking older flows
    try { handleMouseEvent('handleMousePressed', window.getWorldMouseX && window.getWorldMouseX(), window.getWorldMouseY && window.getWorldMouseY(), mouseButton); } catch (er) {}
  }

  // Legacy mouse controller fallbacks removed - RenderManager should handle UI dispatch.
  
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
  // Settings Panel - handle slider dragging
  if (window.settingsPanel && settingsPanel.visible) {
    settingsPanel.handleMouseDrag(mouseX, mouseY);
    return;
  }
  
  // Middle-click pan - handle before all other drag events
  if (mouseButton === CENTER && typeof MiddleClickPan !== 'undefined') {
    if (MiddleClickPan.handleDrag()) return;
  }
  
  // Handle level editor drag events FIRST (before UI debug or RenderManager)
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleDrag(mouseX, mouseY);
    return; // Don't process other drag events when level editor is active
  }
  
  // Handle UI Debug Manager drag events
  if (typeof g_uiDebugManager !== 'undefined' && g_uiDebugManager !== null && g_uiDebugManager.isActive) {
    g_uiDebugManager.handlePointerMove({ x: mouseX, y: mouseY });
  }
  // Forward move to RenderManager
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointermove', { x: mouseX, y: mouseY, isPressed: true });
    // If not consumed, attempt best-effort legacy notification but prefer RenderManager adapters
    if (!consumed) {
      try { handleMouseEvent('handleMouseDragged', mouseX, mouseY); } catch (e) {}
    }
  } catch (e) {
    console.error('Error dispatching pointermove to RenderManager:', e);
    try { handleMouseEvent('handleMouseDragged', mouseX, mouseY); } catch (er) {}
  }
}

function mouseReleased() {
  // Settings Panel - stop slider dragging
  if (window.settingsPanel && settingsPanel.visible) {
    settingsPanel.handleMouseRelease();
    return;
  }
  
  // Middle-click pan - handle before all other release events
  if (mouseButton === CENTER && typeof MiddleClickPan !== 'undefined') {
    if (MiddleClickPan.handleRelease()) return;
  }
  
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
  
  // Forward to RenderManager first
  try {
    const consumed = RenderManager.dispatchPointerEvent('pointerup', { x: mouseX, y: mouseY, isPressed: false });
    if (!consumed) {
      try { handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton); } catch (e) {}
    }
  } catch (e) {
    console.error('Error dispatching pointerup to RenderManager:', e);
    try { handleMouseEvent('handleMouseReleased', mouseX, mouseY, mouseButton); } catch (er) {}
  }
}

/**
 * mouseMoved - Handle hover events for Level Editor
 */
function mouseMoved() {
  // Handle level editor hover for preview highlighting
  if (typeof levelEditor !== 'undefined' && levelEditor.isActive()) {
    levelEditor.handleHover(mouseX, mouseY);
    
    // Handle drag cursor updates
    if (typeof levelEditor.handleMouseMoved === 'function') {
      levelEditor.handleMouseMoved(mouseX, mouseY);
    }
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
    // Level Editor - delegate to LevelEditor for all scroll events
    if (GameState.getState() === 'LEVEL_EDITOR') {
      if (window.levelEditor && levelEditor.isActive()) {
        const delta = event.deltaY || 0;
        const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
        
        // ALWAYS try LevelEditor.handleMouseWheel first (checks panels, brush size, etc.)
        // LevelEditor will decide what to do based on mouse position and Shift key
        if (levelEditor.handleMouseWheel) {
          const handled = levelEditor.handleMouseWheel(event, shiftPressed, mouseX, mouseY);
          if (handled) {
            event.preventDefault();
            return false;
          }
        }
        
        // If not handled by LevelEditor, fall back to zoom
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
 * doubleClicked
 * -------------
 * Handles double-click events by delegating to the appropriate system.
 */
function doubleClicked() {
  // Level Editor - handle double-clicks if active
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      levelEditor.handleDoubleClick(mouseX, mouseY);
      return false; // Prevent default behavior
    }
  }
  
  // Allow default behavior for other states
  return true;
}

/**
 * keyPressed
 * ----------
 * Handles key press events, prioritizing debug keys and ESC for selection clearing.
 */
function keyPressed() {
  // Settings Panel - Escape to close (check first, highest priority)
  if (keyCode === ESCAPE && window.settingsPanel && settingsPanel.visible) {
    settingsPanel.close();
    return;
  }
  
  // Level Editor keyboard shortcuts (if active)
  if (GameState.getState() === 'LEVEL_EDITOR') {
    if (window.levelEditor && levelEditor.isActive()) {
      // Escape key: Clear cursor attachment (entity placement mode)
      if (keyCode === ESCAPE && levelEditor.getCursorAttachment && levelEditor.getCursorAttachment()) {
        levelEditor.clearCursorAttachment();
        console.log('✅ [ENTITY] Cursor attachment cleared (Escape pressed)');
        return; // Handled, don't propagate
      }
      
      levelEditor.handleKeyPress(key);
    }
  }
  
  // Coordinate Debug Overlay toggle (Tilde ~ key)
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
  
  // Handle all debug-related keys (command line, dev console, test hotkeys)
  if (typeof handleDebugConsoleKeys === 'function' && handleDebugConsoleKeys(keyCode, key)) {
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
