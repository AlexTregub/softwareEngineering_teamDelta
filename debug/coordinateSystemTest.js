/**
 * Coordinate System Test
 * Verifies that entity positions, spatial grid, and terrain tiles are all synchronized
 * 
 * Usage: Run testCoordinateAlignment() in console after game loads
 */

function testCoordinateAlignment() {

  // Test 1: Get an ant's position
  if (typeof ants !== 'undefined' && ants.length > 0) {
    const testAnt = ants[0];
    const antPos = testAnt.getPosition();

    // Test 2: What tile is the ant on according to MapManager?
    if (typeof mapManager !== 'undefined' && mapManager) {
      const tile = mapManager.getTileAtPosition(antPos.x, antPos.y);
    }

    // Test 3: Convert ant position to tile coordinates
    if (typeof CoordinateConverter !== 'undefined') {
      const tileCoords = CoordinateConverter.worldToTile(antPos.x, antPos.y);
    }

    // Test 4: Query spatial grid at ant position
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager._grid) {
      const cellSize = spatialGridManager._grid._cellSize;
      const cellX = Math.floor(antPos.x / cellSize);
      const cellY = Math.floor(antPos.y / cellSize);
      
      const nearbyEntities = spatialGridManager._grid.queryRadius(antPos.x, antPos.y, 10);
    }

    // Test 5: Screen to world conversion
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
      
      const mouseTile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
    }
  } else {
  }

  // Test 6: Y-axis inversion check
  if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) {
    
    // Test two points: (100, 100) and (100, 200)
    const point1 = [100, 100];
    const point2 = [100, 200];
    
    const tile1 = g_activeMap.renderConversion.convCanvasToPos(point1);
    const tile2 = g_activeMap.renderConversion.convCanvasToPos(point2);
    
  }

}

// Visual debug mode - shows entity positions and spatial grid cells
function visualizeCoordinateSystem() {
  if (!window.VISUALIZE_COORDS) {
    window.VISUALIZE_COORDS = true;
  } else {
    window.VISUALIZE_COORDS = false;
  }
}

// Add to draw loop (call from sketch.js or add via console)
function drawCoordinateVisualization() {
  if (!window.VISUALIZE_COORDS) return;

  push();
  
  // Draw entity positions (entities are already in correct screen space)
  if (typeof ants !== 'undefined' && Array.isArray(ants)) {
    for (const ant of ants) {
      if (!ant || !ant.isActive) continue;
      const pos = ant.getPosition();
      
      // Green box around entity (entities render at their stored positions)
      stroke(0, 255, 0);
      strokeWeight(2);
      noFill();
      rect(pos.x - 16, pos.y - 16, 32, 32);
      
      // Blue dot at center
      fill(0, 100, 255);
      noStroke();
      circle(pos.x, pos.y, 4);
      
      // Show coordinates
      fill(255);
      stroke(0);
      strokeWeight(1);
      textAlign(CENTER, CENTER);
      textSize(10);
      text(`(${Math.round(pos.x)}, ${Math.round(pos.y)})`, pos.x, pos.y - 25);
    }
  }
  
  // Draw spatial grid cells (only populated cells)
  if (typeof spatialGridManager !== 'undefined' && spatialGridManager._grid) {
    const grid = spatialGridManager._grid;
    const cellSize = grid._cellSize;
    
    stroke(255, 0, 0, 100);
    strokeWeight(2);
    fill(255, 0, 0, 30); // Transparent red fill
    
    for (const [key, cell] of grid._grid.entries()) {
      const [cellX, cellY] = key.split(',').map(Number);
      const worldX = cellX * cellSize;
      const worldY = cellY * cellSize;
      
      rect(worldX, worldY, cellSize, cellSize);
      
      // Show entity count
      fill(255, 255, 255, 200); // White text with good contrast
      stroke(0, 0, 0, 150);
      strokeWeight(3);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(cell.size, worldX + cellSize / 2, worldY + cellSize / 2);
    }
  }
  
  pop();
}

// Advanced diagnostic tests
function runCoordinateDiagnostics() {
  
  // Test 1: Entity-to-tile alignment
  if (typeof ants !== 'undefined' && ants.length > 0) {
    const ant = ants[0];
    const pos = ant.getPosition();
    
    if (typeof CoordinateConverter !== 'undefined') {
      const tile = CoordinateConverter.worldToTile(pos.x, pos.y);
    }
    
    if (typeof mapManager !== 'undefined') {
      const tileFromManager = mapManager.getTileAtPosition(pos.x, pos.y);
    }
  }
  
  // Test 2: Spatial grid alignment
  if (typeof ants !== 'undefined' && ants.length > 0 && 
      typeof spatialGridManager !== 'undefined' && spatialGridManager._grid) {
    const ant = ants[0];
    const pos = ant.getPosition();
    const grid = spatialGridManager._grid;
    
    const cellKey = grid._getKey(pos.x, pos.y);
    
    const nearby = grid.queryRadius(pos.x, pos.y, 5);
  }
  
  // Test 3: Round-trip coordinate conversion
  const testScreen = { x: 200, y: 300 };
  
  if (typeof CoordinateConverter !== 'undefined') {
    const world = CoordinateConverter.screenToWorld(testScreen.x, testScreen.y);
    
    const backToScreen = CoordinateConverter.worldToScreen(world.x, world.y);
    
    const deltaX = Math.abs(backToScreen.x - testScreen.x);
    const deltaY = Math.abs(backToScreen.y - testScreen.y);
  }
  
  // Test 4: Y-axis inversion verification
  if (typeof CoordinateConverter !== 'undefined') {
    const point1 = CoordinateConverter.screenToWorld(100, 100);
    const point2 = CoordinateConverter.screenToWorld(100, 200);
    
    const yDiff = point2.y - point1.y;
    
    if (yDiff < 0) {
    } else if (yDiff > 0) {
    } else {
    }
  }
  
  // Test 5: Terrain system availability
    (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion) ? '✅' : '❌');
    (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) ? '✅' : '❌');
  
  // Test 6: Entity coordinate space detection
  if (typeof ants !== 'undefined' && ants.length > 0) {
    const ant = ants[0];
    const pos = ant.getPosition();
    
    // Check if position values suggest tile-space (typically < 50) or pixel-space (typically > 100)
    const avgCoord = (pos.x + pos.y) / 2;
    
    if (avgCoord < 50) {
    } else if (avgCoord > 100) {
    } else {
    }
    
    if (typeof TILE_SIZE !== 'undefined') {
      const estimatedTilePos = { x: pos.x / TILE_SIZE, y: pos.y / TILE_SIZE };
    }
  }
  
}

// Export to window
if (typeof window !== 'undefined') {
  window.testCoordinateAlignment = testCoordinateAlignment;
  window.visualizeCoordinateSystem = visualizeCoordinateSystem;
  window.drawCoordinateVisualization = drawCoordinateVisualization;
  window.runCoordinateDiagnostics = runCoordinateDiagnostics;
}