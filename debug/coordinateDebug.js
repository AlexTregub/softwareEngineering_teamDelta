/**
 * Debug helper to understand terrain coordinate system
 */
function debugTerrainCoordinates() {
  
  if (typeof g_activeMap === 'undefined' || !g_activeMap) {
    console.error("g_activeMap not available");
    return;
  }
  
  
  if (g_activeMap.chunkArray) {
    
    // Try to get chunk at origin
    try {
      const chunk00 = g_activeMap.chunkArray.get([0, 0]);
      if (chunk00) {
        if (chunk00.tileData) {
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error("❌ Error accessing chunk [0,0]:", error.message);
    }
    
    // Try first chunk in array
    if (g_activeMap.chunkArray.rawArray && g_activeMap.chunkArray.rawArray[0]) {
      const firstChunk = g_activeMap.chunkArray.rawArray[0];
      if (firstChunk.tileData && firstChunk.tileData.rawArray && firstChunk.tileData.rawArray[0]) {
        const firstTile = firstChunk.tileData.rawArray[0];
      }
    }
  }
  
  const testEntity = queenAnt || (g_ants && g_ants[0]);
  if (testEntity) {
    const pos = testEntity.getPosition();
    
    // Convert using the terrain's coordinate system
    if (g_activeMap.renderConversion) {
      const gridPos = g_activeMap.renderConversion.convCanvasToPos([pos.x, pos.y]);
      
      const chunkX = Math.floor(Math.floor(gridPos[0]) / g_activeMap._chunkSize);
      const chunkY = Math.floor(Math.floor(gridPos[1]) / g_activeMap._chunkSize);
      
      // Try to get the tile
      const tile = mapManager.getTileAtPosition(pos.x, pos.y);
      if (tile) {
      } else {
      }
    }
    
    // Old method for comparison
    const tileSize = window.TILE_SIZE || 32;
    const oldTileX = Math.floor(pos.x / tileSize);
    const oldTileY = Math.floor(pos.y / tileSize);
  }
}

if (typeof window !== 'undefined') {
  window.debugTerrainCoordinates = debugTerrainCoordinates;
}