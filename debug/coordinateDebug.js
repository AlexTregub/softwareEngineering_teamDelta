/**
 * Debug helper to understand terrain coordinate system
 */
function debugTerrainCoordinates() {
  console.log("\n=== Terrain Coordinate System Debug ===");
  
  if (typeof g_activeMap === 'undefined' || !g_activeMap) {
    console.error("g_activeMap not available");
    return;
  }
  
  console.log("Grid Size (chunks):", g_activeMap._gridSizeX, "x", g_activeMap._gridSizeY);
  console.log("Chunk Size (tiles per chunk):", g_activeMap._chunkSize);
  console.log("Tile Size (pixels):", g_activeMap._tileSize || window.TILE_SIZE);
  console.log("Grid Tile Span:", g_activeMap._gridTileSpan);
  console.log("Grid Span TL:", g_activeMap._gridSpanTL);
  
  if (g_activeMap.chunkArray) {
    console.log("\nChunkArray Info:");
    console.log("  Size:", g_activeMap.chunkArray._sizeX, "x", g_activeMap.chunkArray._sizeY);
    console.log("  Span Enabled:", g_activeMap.chunkArray._spanEnabled);
    console.log("  Span Top-Left:", g_activeMap.chunkArray._spanTopLeft);
    console.log("  Span Bottom-Right:", g_activeMap.chunkArray._spanBotRight);
    
    // Try to get chunk at origin
    console.log("\nTrying to access chunk at [0,0]:");
    try {
      const chunk00 = g_activeMap.chunkArray.get([0, 0]);
      if (chunk00) {
        console.log("✅ Chunk [0,0] exists");
        if (chunk00.tileData) {
          console.log("  TileData size:", chunk00.tileData._sizeX, "x", chunk00.tileData._sizeY);
          console.log("  TileData span:", chunk00.tileData._spanTopLeft, "to", chunk00.tileData._spanBotRight);
        } else {
          console.log("  ❌ tileData is undefined");
        }
      } else {
        console.log("❌ Chunk [0,0] is null");
      }
    } catch (error) {
      console.error("❌ Error accessing chunk [0,0]:", error.message);
    }
    
    // Try first chunk in array
    console.log("\nFirst chunk in rawArray:");
    if (g_activeMap.chunkArray.rawArray && g_activeMap.chunkArray.rawArray[0]) {
      const firstChunk = g_activeMap.chunkArray.rawArray[0];
      console.log("✅ First chunk exists");
      if (firstChunk.tileData && firstChunk.tileData.rawArray && firstChunk.tileData.rawArray[0]) {
        const firstTile = firstChunk.tileData.rawArray[0];
        console.log("✅ First tile exists");
        console.log("  Material:", firstTile.material);
        console.log("  Position:", firstTile._x, firstTile._y);
      }
    }
  }
  
  console.log("\n=== Testing Entity Position ===");
  const testEntity = queenAnt || (g_ants && g_ants[0]);
  if (testEntity) {
    const pos = testEntity.getPosition();
    console.log("Entity position (world pixels):", pos);
    
    // Convert using the terrain's coordinate system
    if (g_activeMap.renderConversion) {
      const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
      console.log("Grid position (via renderConversion):", gridPos);
      console.log("Tile grid coordinates:", Math.floor(gridPos[0]), Math.floor(gridPos[1]));
      
      const chunkX = Math.floor(Math.floor(gridPos[0]) / g_activeMap._chunkSize);
      const chunkY = Math.floor(Math.floor(gridPos[1]) / g_activeMap._chunkSize);
      console.log("Chunk coordinates:", chunkX, chunkY);
      
      // Try to get the tile
      console.log("\nAttempting to get tile at grid position:", Math.floor(gridPos[0]), Math.floor(gridPos[1]));
      const tile = mapManager.getTileAtPosition(pos.x, pos.y);
      if (tile) {
        console.log("✅ Successfully got tile!");
        console.log("  Material:", tile.material);
        console.log("  Tile grid position:", tile._x, tile._y);
      } else {
        console.log("❌ Could not get tile");
      }
    }
    
    // Old method for comparison
    const tileSize = window.TILE_SIZE || 32;
    const oldTileX = Math.floor(pos.x / tileSize);
    const oldTileY = Math.floor(pos.y / tileSize);
    console.log("\nOld method (pixel / tileSize):", oldTileX, oldTileY);
  }
}

if (typeof window !== 'undefined') {
  window.debugTerrainCoordinates = debugTerrainCoordinates;
}
