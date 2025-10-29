/**
 * Debug helper to understand terrain coordinate system
 */
function debugTerrainCoordinates() {
  logNormal("\n=== Terrain Coordinate System Debug ===");
  
  if (typeof g_activeMap === 'undefined' || !g_activeMap) {
    console.error("g_activeMap not available");
    return;
  }
  
  logNormal("Grid Size (chunks):", g_activeMap._gridSizeX, "x", g_activeMap._gridSizeY);
  logNormal("Chunk Size (tiles per chunk):", g_activeMap._chunkSize);
  logNormal("Tile Size (pixels):", g_activeMap._tileSize || window.TILE_SIZE);
  logNormal("Grid Tile Span:", g_activeMap._gridTileSpan);
  logNormal("Grid Span TL:", g_activeMap._gridSpanTL);
  
  if (g_activeMap.chunkArray) {
    logNormal("\nChunkArray Info:");
    logNormal("  Size:", g_activeMap.chunkArray._sizeX, "x", g_activeMap.chunkArray._sizeY);
    logNormal("  Span Enabled:", g_activeMap.chunkArray._spanEnabled);
    logNormal("  Span Top-Left:", g_activeMap.chunkArray._spanTopLeft);
    logNormal("  Span Bottom-Right:", g_activeMap.chunkArray._spanBotRight);
    
    // Try to get chunk at origin
    logNormal("\nTrying to access chunk at [0,0]:");
    try {
      const chunk00 = g_activeMap.chunkArray.get([0, 0]);
      if (chunk00) {
        logNormal("✅ Chunk [0,0] exists");
        if (chunk00.tileData) {
          logNormal("  TileData size:", chunk00.tileData._sizeX, "x", chunk00.tileData._sizeY);
          logNormal("  TileData span:", chunk00.tileData._spanTopLeft, "to", chunk00.tileData._spanBotRight);
        } else {
          logNormal("  ❌ tileData is undefined");
        }
      } else {
        logNormal("❌ Chunk [0,0] is null");
      }
    } catch (error) {
      console.error("❌ Error accessing chunk [0,0]:", error.message);
    }
    
    // Try first chunk in array
    logNormal("\nFirst chunk in rawArray:");
    if (g_activeMap.chunkArray.rawArray && g_activeMap.chunkArray.rawArray[0]) {
      const firstChunk = g_activeMap.chunkArray.rawArray[0];
      logNormal("✅ First chunk exists");
      if (firstChunk.tileData && firstChunk.tileData.rawArray && firstChunk.tileData.rawArray[0]) {
        const firstTile = firstChunk.tileData.rawArray[0];
        logNormal("✅ First tile exists");
        logNormal("  Material:", firstTile.material);
        logNormal("  Position:", firstTile._x, firstTile._y);
      }
    }
  }
  
  logNormal("\n=== Testing Entity Position ===");
  const testEntity = queenAnt || (g_ants && g_ants[0]);
  if (testEntity) {
    const pos = testEntity.getPosition();
    logNormal("Entity position (world pixels):", pos);
    
    // Convert using the terrain's coordinate system
    if (g_activeMap.renderConversion) {
      const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
      logNormal("Grid position (via renderConversion):", gridPos);
      logNormal("Tile grid coordinates:", Math.floor(gridPos[0]), Math.floor(gridPos[1]));
      
      const chunkX = Math.floor(Math.floor(gridPos[0]) / g_activeMap._chunkSize);
      const chunkY = Math.floor(Math.floor(gridPos[1]) / g_activeMap._chunkSize);
      logNormal("Chunk coordinates:", chunkX, chunkY);
      
      // Try to get the tile
      logNormal("\nAttempting to get tile at grid position:", Math.floor(gridPos[0]), Math.floor(gridPos[1]));
      const tile = mapManager.getTileAtPosition(pos.x, pos.y);
      if (tile) {
        logNormal("✅ Successfully got tile!");
        logNormal("  Material:", tile.material);
        logNormal("  Tile grid position:", tile._x, tile._y);
      } else {
        logNormal("❌ Could not get tile");
      }
    }
    
    // Old method for comparison
    const tileSize = window.TILE_SIZE || 32;
    const oldTileX = Math.floor(pos.x / tileSize);
    const oldTileY = Math.floor(pos.y / tileSize);
    logNormal("\nOld method (pixel / tileSize):", oldTileX, oldTileY);
  }
}

if (typeof window !== 'undefined') {
  window.debugTerrainCoordinates = debugTerrainCoordinates;
}
