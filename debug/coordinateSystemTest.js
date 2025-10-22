/**
 * Coordinate System Test
 * Verifies that entity positions, spatial grid, and terrain tiles are all synchronized
 * 
 * Usage: Run testCoordinateAlignment() in console after game loads
 */

function testCoordinateAlignment() {
  console.log('\n=== COORDINATE SYSTEM ALIGNMENT TEST ===\n');

  // Test 1: Get an ant's position
  if (typeof ants !== 'undefined' && ants.length > 0) {
    const testAnt = ants[0];
    const antPos = testAnt.getPosition();
    console.log(`🐜 Test Ant Position: (${antPos.x}, ${antPos.y})`);

    // Test 2: What tile is the ant on according to MapManager?
    if (typeof mapManager !== 'undefined' && mapManager) {
      const tile = mapManager.getTileAtPosition(antPos.x, antPos.y);
      console.log(`🗺️ Tile at ant position:`, tile ? tile._materialSet : 'null');
    }

    // Test 3: Convert ant position to tile coordinates
    if (typeof CoordinateConverter !== 'undefined') {
      const tileCoords = CoordinateConverter.worldToTile(antPos.x, antPos.y);
      console.log(`📐 Ant tile coordinates: (${tileCoords.x}, ${tileCoords.y})`);
    }

    // Test 4: Query spatial grid at ant position
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager._grid) {
      const cellSize = spatialGridManager._grid._cellSize;
      const cellX = Math.floor(antPos.x / cellSize);
      const cellY = Math.floor(antPos.y / cellSize);
      console.log(`🔲 Spatial grid cell: (${cellX}, ${cellY}) [cell size: ${cellSize}px]`);
      
      const nearbyEntities = spatialGridManager._grid.queryRadius(antPos.x, antPos.y, 10);
      console.log(`🔍 Nearby entities (10px radius): ${nearbyEntities.length}`);
      console.log(`   Should include the test ant: ${nearbyEntities.includes(testAnt) ? '✅ YES' : '❌ NO'}`);
    }

    // Test 5: Screen to world conversion
    if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
      const worldMouse = CoordinateConverter.screenToWorld(mouseX, mouseY);
      console.log(`\n🖱️ Mouse Screen: (${mouseX}, ${mouseY})`);
      console.log(`🌍 Mouse World: (${worldMouse.x}, ${worldMouse.y})`);
      
      const mouseTile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
      console.log(`🗺️ Mouse Tile: (${mouseTile.x}, ${mouseTile.y})`);
    }
  } else {
    console.log('❌ No ants available for testing');
  }

  // Test 6: Y-axis inversion check
  if (typeof g_map2 !== 'undefined' && g_map2 && g_map2.renderConversion) {
    console.log(`\n🔄 Y-axis inversion test:`);
    
    // Test two points: (100, 100) and (100, 200)
    const point1 = [100, 100];
    const point2 = [100, 200];
    
    const tile1 = g_map2.renderConversion.convCanvasToPos(point1);
    const tile2 = g_map2.renderConversion.convCanvasToPos(point2);
    
    console.log(`   Canvas (100, 100) → Tile (${tile1[0].toFixed(2)}, ${tile1[1].toFixed(2)})`);
    console.log(`   Canvas (100, 200) → Tile (${tile2[0].toFixed(2)}, ${tile2[1].toFixed(2)})`);
    console.log(`   Y difference: ${(tile2[1] - tile1[1]).toFixed(2)} (negative = inverted)`);
  }

  console.log('\n=== END TEST ===\n');
}

// Visual debug mode - shows entity positions and spatial grid cells
function visualizeCoordinateSystem() {
  if (!window.VISUALIZE_COORDS) {
    window.VISUALIZE_COORDS = true;
    console.log('✅ Coordinate visualization enabled');
    console.log('   - Green boxes = entity positions');
    console.log('   - Red grid = spatial grid cells');
    console.log('   - Blue dots = entity centers');
  } else {
    window.VISUALIZE_COORDS = false;
    console.log('❌ Coordinate visualization disabled');
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
  console.log('\n🔍 === COORDINATE SYSTEM DIAGNOSTICS ===\n');
  
  // Test 1: Entity-to-tile alignment
  if (typeof ants !== 'undefined' && ants.length > 0) {
    console.log('📍 TEST 1: Entity-to-Tile Alignment');
    const ant = ants[0];
    const pos = ant.getPosition();
    console.log('  Entity position:', pos);
    
    if (typeof CoordinateConverter !== 'undefined') {
      const tile = CoordinateConverter.worldToTile(pos.x, pos.y);
      console.log('  Calculated tile:', tile);
    }
    
    if (typeof mapManager !== 'undefined') {
      const tileFromManager = mapManager.getTileAtPosition(pos.x, pos.y);
      console.log('  Manager tile:', tileFromManager ? tileFromManager._materialSet : 'null');
    }
    console.log('');
  }
  
  // Test 2: Spatial grid alignment
  if (typeof ants !== 'undefined' && ants.length > 0 && 
      typeof spatialGridManager !== 'undefined' && spatialGridManager._grid) {
    console.log('🔲 TEST 2: Spatial Grid Alignment');
    const ant = ants[0];
    const pos = ant.getPosition();
    const grid = spatialGridManager._grid;
    
    const cellKey = grid._getKey(pos.x, pos.y);
    console.log('  Entity at:', pos);
    console.log('  Grid cell key:', cellKey);
    
    const nearby = grid.queryRadius(pos.x, pos.y, 5);
    console.log('  Nearby entities (5px radius):', nearby.length);
    console.log('  Includes test ant:', nearby.includes(ant) ? '✅ YES' : '❌ NO');
    console.log('');
  }
  
  // Test 3: Round-trip coordinate conversion
  console.log('🔄 TEST 3: Round-trip Conversion');
  const testScreen = { x: 200, y: 300 };
  console.log('  Original screen:', testScreen);
  
  if (typeof CoordinateConverter !== 'undefined') {
    const world = CoordinateConverter.screenToWorld(testScreen.x, testScreen.y);
    console.log('  → World coords:', world);
    
    const backToScreen = CoordinateConverter.worldToScreen(world.x, world.y);
    console.log('  → Back to screen:', backToScreen);
    
    const deltaX = Math.abs(backToScreen.x - testScreen.x);
    const deltaY = Math.abs(backToScreen.y - testScreen.y);
    console.log('  Round-trip error:', { x: deltaX.toFixed(2), y: deltaY.toFixed(2) });
    console.log('  Precision:', (deltaX < 1 && deltaY < 1) ? '✅ GOOD' : '⚠️ LOSSY');
  }
  console.log('');
  
  // Test 4: Y-axis inversion verification
  console.log('🔃 TEST 4: Y-Axis Inversion Check');
  if (typeof CoordinateConverter !== 'undefined') {
    const point1 = CoordinateConverter.screenToWorld(100, 100);
    const point2 = CoordinateConverter.screenToWorld(100, 200);
    console.log('  Screen Y=100 → World:', point1);
    console.log('  Screen Y=200 → World:', point2);
    
    const yDiff = point2.y - point1.y;
    console.log('  Y difference:', yDiff.toFixed(2));
    
    if (yDiff < 0) {
      console.log('  ⚠️ Y-AXIS IS INVERTED (higher screen Y = lower world Y)');
    } else if (yDiff > 0) {
      console.log('  ✅ Y-AXIS NORMAL (higher screen Y = higher world Y)');
    } else {
      console.log('  ❌ Y-AXIS BROKEN (no movement detected)');
    }
  }
  console.log('');
  
  // Test 5: Terrain system availability
  console.log('🗺️ TEST 5: Terrain System Check');
  console.log('  g_map2 exists:', typeof g_map2 !== 'undefined' ? '✅' : '❌');
  console.log('  renderConversion exists:', 
    (typeof g_map2 !== 'undefined' && g_map2 && g_map2.renderConversion) ? '✅' : '❌');
  console.log('  TILE_SIZE defined:', typeof TILE_SIZE !== 'undefined' ? `✅ (${TILE_SIZE}px)` : '❌');
  console.log('  CoordinateConverter.isAvailable():', 
    (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) ? '✅' : '❌');
  console.log('');
  
  // Test 6: Entity coordinate space detection
  if (typeof ants !== 'undefined' && ants.length > 0) {
    console.log('🐜 TEST 6: Entity Coordinate Space Detection');
    const ant = ants[0];
    const pos = ant.getPosition();
    
    // Check if position values suggest tile-space (typically < 50) or pixel-space (typically > 100)
    const avgCoord = (pos.x + pos.y) / 2;
    console.log('  Average coordinate value:', avgCoord.toFixed(2));
    
    if (avgCoord < 50) {
      console.log('  💡 LIKELY: Tile-space coordinates (values < 50)');
    } else if (avgCoord > 100) {
      console.log('  💡 LIKELY: Pixel-space coordinates (values > 100)');
    } else {
      console.log('  💡 AMBIGUOUS: Could be either tile or pixel space');
    }
    
    if (typeof TILE_SIZE !== 'undefined') {
      const estimatedTilePos = { x: pos.x / TILE_SIZE, y: pos.y / TILE_SIZE };
      console.log('  If pixel-space, tile would be:', estimatedTilePos);
    }
  }
  console.log('');
  
  console.log('=== END DIAGNOSTICS ===\n');
  console.log('📖 See COORDINATE_SYSTEM_ANALYSIS.md for detailed explanation');
}

// Export to window
if (typeof window !== 'undefined') {
  window.testCoordinateAlignment = testCoordinateAlignment;
  window.visualizeCoordinateSystem = visualizeCoordinateSystem;
  window.drawCoordinateVisualization = drawCoordinateVisualization;
  window.runCoordinateDiagnostics = runCoordinateDiagnostics;
}

console.log('📊 Coordinate System Test loaded');
console.log('   Commands:');
console.log('   - testCoordinateAlignment() - Run basic alignment test');
console.log('   - runCoordinateDiagnostics() - Run comprehensive diagnostics');
console.log('   - visualizeCoordinateSystem() - Toggle visual debug mode');
