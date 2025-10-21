/**
 * MapManager Usage Examples
 * =========================
 * Demonstrates how to use the MapManager for level switching and terrain queries.
 * 
 * @date 2025-10-21
 */

// =============================================================================
// BASIC USAGE - Already Set Up
// =============================================================================

// The main map (g_map2) is automatically registered as 'level1' during setup
// You can verify this:
console.log(mapManager.getInfo());
// Output: { totalMaps: 1, activeMapId: 'level1', mapIds: ['level1'], hasActiveMap: true }


// =============================================================================
// CREATING A NEW LEVEL
// =============================================================================

/**
 * Example 1: Create a new level with custom configuration
 */
function createLevel2() {
  const level2Config = {
    chunksX: 15,        // Smaller level
    chunksY: 15,
    seed: 54321,        // Different seed for different terrain
    chunkSize: 8,
    tileSize: 32,
    canvasSize: [windowWidth, windowHeight]
  };
  
  const level2 = mapManager.createProceduralMap('level2', level2Config, false);
  console.log("Level 2 created:", level2);
}

/**
 * Example 2: Create a boss arena (small, enclosed map)
 */
function createBossArena() {
  const bossArenaConfig = {
    chunksX: 5,         // Small arena
    chunksY: 5,
    seed: 99999,
    chunkSize: 8,
    tileSize: 32,
    canvasSize: [windowWidth, windowHeight]
  };
  
  const arena = mapManager.createProceduralMap('boss_arena', bossArenaConfig, false);
  
  // Could add custom terrain modifications here
  // arena.setTileMaterial(x, y, 'lava'); // If you add lava material
  
  return arena;
}


// =============================================================================
// SWITCHING BETWEEN LEVELS
// =============================================================================

/**
 * Example 3: Switch to a different level
 */
function switchToLevel2() {
  // Make sure level2 exists first
  if (!mapManager.hasMap('level2')) {
    createLevel2();
  }
  
  // Switch active map
  const success = mapManager.setActiveMap('level2');
  
  if (success) {
    console.log("Switched to level 2!");
    
    // Optionally: Reset camera to new map
    if (typeof cameraManager !== 'undefined') {
      cameraManager.resetCamera();
    }
    
    // Optionally: Teleport entities to new starting positions
    // queenAnt.setPosition(400, 400);
  }
}

/**
 * Example 4: Return to main level
 */
function returnToLevel1() {
  mapManager.setActiveMap('level1');
  console.log("Returned to level 1");
}

/**
 * Example 5: Cycle through all levels
 */
function nextLevel() {
  const mapIds = mapManager.getMapIds();
  const currentId = mapManager.getActiveMapId();
  const currentIndex = mapIds.indexOf(currentId);
  const nextIndex = (currentIndex + 1) % mapIds.length;
  
  mapManager.setActiveMap(mapIds[nextIndex]);
  console.log(`Switched to: ${mapIds[nextIndex]}`);
}


// =============================================================================
// TERRAIN QUERIES
// =============================================================================

/**
 * Example 6: Check terrain at specific position
 */
function checkTerrainAtPosition(x, y) {
  const tile = mapManager.getTileAtPosition(x, y);
  if (tile) {
    console.log(`Terrain at (${x}, ${y}):`, tile.material);
    return tile.material;
  }
  return null;
}

/**
 * Example 7: Check terrain under mouse
 */
function checkTerrainUnderMouse() {
  if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
    // Get world position (accounting for camera)
    const worldPos = cameraManager ? 
      cameraManager.screenToWorld(mouseX, mouseY) : 
      { x: mouseX, y: mouseY };
    
    const material = mapManager.getTileMaterial(worldPos.x, worldPos.y);
    console.log("Terrain under mouse:", material);
    return material;
  }
}

/**
 * Example 8: Get tile by grid coordinates
 */
function getTileByCoords(tileX, tileY) {
  const tile = mapManager.getTileAtCoords(tileX, tileY);
  if (tile) {
    console.log(`Tile at grid (${tileX}, ${tileY}):`, {
      material: tile.material,
      weight: tile.weight,
      entityCount: tile.entities?.length || 0
    });
  }
  return tile;
}


// =============================================================================
// LEVEL MANAGEMENT
// =============================================================================

/**
 * Example 9: Cleanup unused levels (save memory)
 */
function cleanupOldLevels() {
  const allMaps = mapManager.getMapIds();
  const activeId = mapManager.getActiveMapId();
  
  // Remove all except active and level1
  allMaps.forEach(id => {
    if (id !== activeId && id !== 'level1') {
      mapManager.unregisterMap(id);
      console.log(`Cleaned up map: ${id}`);
    }
  });
}

/**
 * Example 10: Pre-load multiple levels during loading screen
 */
function preloadAllLevels() {
  const levelConfigs = [
    { id: 'forest', chunksX: 20, chunksY: 20, seed: 11111 },
    { id: 'desert', chunksX: 25, chunksY: 25, seed: 22222 },
    { id: 'cave', chunksX: 15, chunksY: 15, seed: 33333 }
  ];
  
  levelConfigs.forEach(config => {
    mapManager.createProceduralMap(config.id, {
      chunksX: config.chunksX,
      chunksY: config.chunksY,
      seed: config.seed,
      chunkSize: 8,
      tileSize: 32,
      canvasSize: [windowWidth, windowHeight]
    }, false);
    
    console.log(`Preloaded level: ${config.id}`);
  });
  
  console.log("All levels preloaded!");
}


// =============================================================================
// ADVANCED: CUSTOM MAP TRANSITIONS
// =============================================================================

/**
 * Example 11: Fade transition between levels
 */
function transitionToLevel(newLevelId, fadeDuration = 1000) {
  // This is a concept example - you'd need to implement fade rendering
  console.log(`Starting transition to ${newLevelId}...`);
  
  // Fade out
  setTimeout(() => {
    // Switch map
    mapManager.setActiveMap(newLevelId);
    console.log("Map switched during fade");
    
    // Fade in
    setTimeout(() => {
      console.log("Transition complete!");
    }, fadeDuration / 2);
  }, fadeDuration / 2);
}

/**
 * Example 12: Portal system - enter portal to switch maps
 */
function checkPortalEntry(entity) {
  const entityPos = entity.getPosition();
  
  // Define portal zones (example coordinates)
  const portals = [
    { x: 100, y: 100, radius: 50, targetMap: 'level2', targetX: 800, targetY: 800 },
    { x: 500, y: 500, radius: 50, targetMap: 'boss_arena', targetX: 400, targetY: 400 }
  ];
  
  portals.forEach(portal => {
    const dx = entityPos.x - portal.x;
    const dy = entityPos.y - portal.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < portal.radius) {
      // Entity entered portal!
      console.log(`Entering portal to ${portal.targetMap}`);
      
      if (!mapManager.hasMap(portal.targetMap)) {
        // Create level if it doesn't exist
        createLevel2(); // Or create appropriate level
      }
      
      mapManager.setActiveMap(portal.targetMap);
      entity.setPosition(portal.targetX, portal.targetY);
    }
  });
}


// =============================================================================
// DEBUGGING / TESTING
// =============================================================================

/**
 * Example 13: List all available maps
 */
function listAllMaps() {
  const info = mapManager.getInfo();
  console.log("=== Map Manager Status ===");
  console.log(`Total Maps: ${info.totalMaps}`);
  console.log(`Active Map: ${info.activeMapId}`);
  console.log(`All Maps: ${info.mapIds.join(', ')}`);
  
  info.mapIds.forEach(id => {
    const map = mapManager.getMap(id);
    console.log(`  ${id}:`, {
      chunks: `${map.chunksX}x${map.chunksY}`,
      chunkSize: map._chunkSize,
      tileSize: map.tileSize
    });
  });
}

/**
 * Example 14: Validate map integrity
 */
function validateActiveMap() {
  const map = mapManager.getActiveMap();
  if (!map) {
    console.error("No active map!");
    return false;
  }
  
  console.log("Validating map...");
  let valid = true;
  
  // Check if chunks are accessible
  try {
    const testChunk = map.chunkArray?.get?.([0, 0]);
    if (!testChunk) {
      console.error("Cannot access chunk [0,0]");
      valid = false;
    } else {
      const testTile = testChunk.tileArray?.get?.([0, 0]);
      if (!testTile) {
        console.error("Cannot access tile in chunk");
        valid = false;
      } else {
        console.log("✓ Map structure valid");
      }
    }
  } catch (error) {
    console.error("Map validation error:", error);
    valid = false;
  }
  
  return valid;
}


// =============================================================================
// KEYBOARD SHORTCUTS (add to your input handler)
// =============================================================================

/**
 * Example 15: Hook up keyboard shortcuts for level switching
 */
function handleLevelSwitchKeys(key) {
  switch(key) {
    case '1':
      mapManager.setActiveMap('level1');
      console.log("Switched to Level 1");
      break;
    case '2':
      if (!mapManager.hasMap('level2')) createLevel2();
      mapManager.setActiveMap('level2');
      console.log("Switched to Level 2");
      break;
    case '3':
      if (!mapManager.hasMap('boss_arena')) createBossArena();
      mapManager.setActiveMap('boss_arena');
      console.log("Switched to Boss Arena");
      break;
    case 'n':
      nextLevel();
      break;
    case 'm':
      listAllMaps();
      break;
  }
}

// Add to your keyPressed() function in sketch.js:
// if (key === '1' || key === '2' || key === '3' || key === 'n' || key === 'm') {
//   handleLevelSwitchKeys(key);
// }


// =============================================================================
// CONSOLE COMMANDS (for debugging)
// =============================================================================

// Type these in the browser console during development:
// 
// mapManager.getInfo()                          - View all maps
// mapManager.setActiveMap('level2')             - Switch to level 2
// mapManager.getTileAtPosition(400, 400)        - Check tile at position
// validateActiveMap()                           - Validate current map
// listAllMaps()                                 - Detailed map info
// nextLevel()                                   - Cycle to next level
