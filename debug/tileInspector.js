/**
 * Tile Inspector Tool
 * ===================
 * Click on tiles to see their information
 * 
 * Usage:
 * - Press 'T' to toggle tile inspector mode
 * - Click on any tile to see info
 */

// Global state
window.tileInspectorEnabled = false;
window.lastInspectedTile = null;
window.hoveredTile = null; // Track tile under mouse

/**
 * Toggle tile inspector mode
 */
function toggleTileInspector() {
  window.tileInspectorEnabled = !window.tileInspectorEnabled;
  
  if (window.tileInspectorEnabled) {
  } else {
  }
}

/**
 * Inspect tile at mouse position
 */
function inspectTileAtMouse(mouseX, mouseY) {
  if (!window.tileInspectorEnabled) return;
  
  
  // Get world position (accounting for camera)
  let worldX = mouseX;
  let worldY = mouseY;
  
  if (typeof cameraManager !== 'undefined' && cameraManager && typeof cameraManager.screenToWorld === 'function') {
    try {
      const worldPos = cameraManager.screenToWorld(mouseX, mouseY);
      if (worldPos && typeof worldPos.x !== 'undefined' && typeof worldPos.y !== 'undefined') {
        worldX = worldPos.x;
        worldY = worldPos.y;
      } else {
      }
    } catch (e) {
    }
  } else {
  }
  
  // Convert to grid coordinates
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([worldX, worldY]);
    
    const tileGridX = Math.floor(gridPos[0]);
    const tileGridY = Math.floor(gridPos[1]);
    
    // Calculate chunk
    const chunkX = Math.floor(tileGridX / g_activeMap._chunkSize);
    const chunkY = Math.floor(tileGridY / g_activeMap._chunkSize);
    
    // Try to get the tile
    let tile = null;
    if (typeof mapManager !== 'undefined') {
      tile = mapManager.getTileAtPosition(worldX, worldY);
    }
    
    if (tile) {
      
      window.lastInspectedTile = {
        gridX: tileGridX,
        gridY: tileGridY,
        worldX: worldX,
        worldY: worldY,
        material: tile.material,
        tile: tile
      };
    } else {
      
      // Show valid tile range
      if (g_activeMap && g_activeMap._gridTileSpan) {
      }
    }
    
    // Check entities at this location
    if (typeof spatialGridManager !== 'undefined') {
      const tileSize = window.TILE_SIZE || 32;
      const entities = spatialGridManager.getEntitiesInRect(
        worldX - tileSize/2, 
        worldY - tileSize/2, 
        tileSize, 
        tileSize
      );
      
      entities.forEach(entity => {
        const pos = entity.getPosition();
        // Entity at pos
      });
    }
  } else {
  }
  
}

/**
 * Draw visual indicator for inspected tile
 */
function drawInspectedTileIndicator() {
  if (!window.tileInspectorEnabled || !window.lastInspectedTile) return;
  
  const tile = window.lastInspectedTile;
  const tileSize = window.TILE_SIZE || 32;
  
  push();
  
  // Draw highlight box around tile
  noFill();
  stroke(0, 255, 255); // Cyan
  strokeWeight(3);
  rectMode(CENTER);
  rect(tile.worldX, tile.worldY, tileSize, tileSize);
  
  // Draw crosshair at exact click point
  stroke(255, 255, 0); // Yellow
  strokeWeight(2);
  line(tile.worldX - 10, tile.worldY, tile.worldX + 10, tile.worldY);
  line(tile.worldX, tile.worldY - 10, tile.worldX, tile.worldY + 10);
  
  // Draw label
  fill(0, 255, 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  text(`${tile.material}`, tile.worldX, tile.worldY - tileSize/2 - 10);
  text(`(${tile.gridX}, ${tile.gridY})`, tile.worldX, tile.worldY + tileSize/2 + 10);
  
  pop();
}

/**
 * Draw hover overlay for tile under mouse
 */
function drawHoveredTileOverlay() {
  if (!window.tileInspectorEnabled || !window.hoveredTile) return;
  
  const tile = window.hoveredTile;
  const tileSize = window.TILE_SIZE || 32;
  
  push();
  
  // Draw semi-transparent white overlay
  fill(255, 255, 255, 80); // White with transparency
  noStroke();
  rectMode(CENTER);
  rect(tile.worldX, tile.worldY, tileSize, tileSize);
  
  // Draw thin border
  noFill();
  stroke(255, 255, 255, 150);
  strokeWeight(1);
  rect(tile.worldX, tile.worldY, tileSize, tileSize);
  
  pop();
}

/**
 * Show inspector status in corner of screen
 */
function drawInspectorStatus() {
  if (!window.tileInspectorEnabled) return;
  
  push();
  
  // Get screen coordinates (not world)
  if (typeof cameraManager !== 'undefined' && cameraManager) {
    // Draw in screen space
    resetMatrix();
  }
  
  // Main status box
  fill(0, 200);
  noStroke();
  rect(10, 10, 200, 40);
  
  fill(0, 255, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  text("🔍 Tile Inspector ON", 20, 15);
  text("Press 'T' to toggle", 20, 32);
  
  // Debug coordinates box
  if (window.hoverDebugCoords) {
    const d = window.hoverDebugCoords;
    const boxHeight = 160;
    
    fill(0, 220);
    rect(10, 60, 280, boxHeight);
    
    fill(255, 255, 0);
    textSize(11);
    let y = 68;
    text("📍 Coordinate Debug:", 15, y); y += 16;
    
    fill(255);
    text(`Screen: (${d.screenX.toFixed(0)}, ${d.screenY.toFixed(0)})`, 15, y); y += 14;
    
    if (d.worldX !== undefined) {
      text(`World: (${d.worldX.toFixed(1)}, ${d.worldY.toFixed(1)})`, 15, y); y += 14;
    } else if (d.noCamera) {
      fill(255, 150, 0);
      text(`World: No camera`, 15, y); y += 14;
      fill(255);
    }
    
    if (d.gridX !== undefined) {
      text(`Grid: (${d.gridX.toFixed(2)}, ${d.gridY.toFixed(2)})`, 15, y); y += 14;
      text(`Tile: (${d.tileGridX}, ${d.tileGridY})`, 15, y); y += 14;
    }
    
    if (window.hoveredTile) {
      const material = window.hoveredTile.material;
      fill(0, 255, 0);
      text(`✓ Found: ${material}`, 15, y); y += 14;
      fill(255);
      text(`Tile pos: (${window.hoveredTile.gridX}, ${window.hoveredTile.gridY})`, 15, y); y += 14;
      
      // Show entity count
      const entityCount = window.hoveredTile.entityCount || 0;
      if (entityCount > 0) {
        fill(0, 255, 255);
        text(`👥 Entities: ${entityCount}`, 15, y); y += 14;
        fill(255);
      } else {
        fill(150);
        text(`👥 Entities: 0`, 15, y); y += 14;
        fill(255);
      }
    } else {
      fill(255, 100, 100);
      text(`✗ No tile found`, 15, y);
      fill(255);
    }
  }
  
  pop();
}

/**
 * Update hovered tile based on mouse position
 * Call this from draw() or mouseMoved()
 */
function updateHoveredTile(mouseX, mouseY) {
  if (!window.tileInspectorEnabled) {
    window.hoveredTile = null;
    return;
  }
  
  // Get world position (accounting for camera)
  let worldX = mouseX;
  let worldY = mouseY;
  
  // DEBUG: Log raw mouse position
  const debugCoords = { screenX: mouseX, screenY: mouseY };
  
  if (typeof cameraManager !== 'undefined' && cameraManager && typeof cameraManager.screenToWorld === 'function') {
    try {
      const worldPos = cameraManager.screenToWorld(mouseX, mouseY);
      if (worldPos && typeof worldPos.x !== 'undefined' && typeof worldPos.y !== 'undefined') {
        worldX = worldPos.x;
        worldY = worldPos.y;
        debugCoords.worldX = worldX;
        debugCoords.worldY = worldY;
      }
    } catch (e) {
      // Use mouse position as fallback
      debugCoords.cameraError = e.message;
    }
  } else {
    debugCoords.noCamera = true;
  }
  
  // Convert to grid coordinates
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    const gridPos = g_activeMap.renderConversion.convCanvasToPos([worldX, worldY]);
    
    // Use ROUNDING to get integer tile coordinates - this makes the highlight follow the mouse smoothly
    const tileGridX = Math.round(gridPos[0]);
    const tileGridY = Math.round(gridPos[1]);
    
    debugCoords.gridX = gridPos[0];
    debugCoords.gridY = gridPos[1];
    debugCoords.tileGridX = tileGridX;
    debugCoords.tileGridY = tileGridY;
    
    // Store debug info for display
    window.hoverDebugCoords = debugCoords;
    
    // Get tile at this position
    let tile = null;
    if (typeof mapManager !== 'undefined' && mapManager) {
      // Query with integer tile coordinates - the Grid span system uses integers
      // even though tiles internally store half-coordinates (tile._x, tile._y)
      tile = mapManager.getTileAtGridCoords(tileGridX, tileGridY);
    }
    
    if (tile) {
      const tileSize = window.TILE_SIZE || 32;
      
      // 🔍 DEBUG: Log tile's actual stored coordinates
      if (tile) {
      } else {
        // Log chunk spans for debugging
        if (typeof mapManager !== 'undefined' && mapManager._activeMap && mapManager._activeMap.chunkArray) {
          const chunks = mapManager._activeMap.chunkArray.rawArray;
          chunks.slice(0, 3).forEach((chunk, i) => {
            if (chunk && chunk.tileData) {
              const span = chunk.tileData.getSpanRange();
            }
          });
        }
      }
      
      // Calculate the tile's TOP-LEFT corner in world space
      // Then offset to center for drawing
      let tileCenterWorldPos = [worldX, worldY];
      
      // Snap to tile grid for visual alignment
      if (g_activeMap.renderConversion && typeof g_activeMap.renderConversion.convPosToCanvas === 'function') {
        // Get the tile corner position
        const tileCornerPos = g_activeMap.renderConversion.convPosToCanvas([tileGridX, tileGridY]);
        // Center of tile is corner + half tile size
        tileCenterWorldPos = [tileCornerPos[0], tileCornerPos[1]];
      }
      
      // Get material - try multiple property names
      let material = tile._material || tile.material || tile.type || 'unknown';
      
      // DEBUG: Log the actual tile object to see what properties it has
      if (material === 'unknown') {
      }
      
      // Get entities at this tile position
      let entitiesAtTile = [];
      if (typeof window.spatialGridManager !== 'undefined' && window.spatialGridManager) {
        try {
          const tileSize = window.TILE_SIZE || 32;
          // Query entities in a small rect around the tile center
          entitiesAtTile = window.spatialGridManager.getEntitiesInRect(
            tileCenterWorldPos[0] - tileSize/2,
            tileCenterWorldPos[1] - tileSize/2,
            tileSize,
            tileSize
          ) || [];
        } catch (error) {
          console.warn('Error querying entities:', error);
          entitiesAtTile = [];
        }
      }
      
      window.hoveredTile = {
        tile: tile,
        gridX: tileGridX,
        gridY: tileGridY,
        worldX: tileCenterWorldPos[0],
        worldY: tileCenterWorldPos[1],
        material: material,
        entities: entitiesAtTile,
        entityCount: entitiesAtTile.length
      };
    } else {
      window.hoveredTile = null;
    }
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.toggleTileInspector = toggleTileInspector;
  window.inspectTileAtMouse = inspectTileAtMouse;
  window.drawInspectedTileIndicator = drawInspectedTileIndicator;
  window.drawHoveredTileOverlay = drawHoveredTileOverlay;
  window.updateHoveredTile = updateHoveredTile;
  window.drawInspectorStatus = drawInspectorStatus;
  
}