/**
 * Terrain Grid Debug Visualization
 * 
 * Displays a colored grid overlay on the terrain for debugging coordinate alignment.
 * Each tile gets a unique color based on its tile coordinates.
 * 
 * Usage:
 *   toggleTerrainGrid()     - Toggle visualization on/off
 *   showTerrainGrid()       - Turn on visualization
 *   hideTerrainGrid()       - Turn off visualization
 *   drawTerrainGrid()       - Call this in draw() loop (called automatically if enabled)
 */

// Global state
window.terrainGridDebugEnabled = false;
window.terrainGridOpacity = 0.3; // Transparency level (0-1)
window.terrainGridShowLabels = true; // Show tile coordinates

/**
 * Toggle terrain grid visualization on/off
 */
function toggleTerrainGrid() {
  window.terrainGridDebugEnabled = !window.terrainGridDebugEnabled;
  logNormal(`Terrain Grid Debug: ${window.terrainGridDebugEnabled ? 'ON' : 'OFF'}`);
  return window.terrainGridDebugEnabled;
}

/**
 * Enable terrain grid visualization
 */
function showTerrainGrid() {
  window.terrainGridDebugEnabled = true;
  logNormal('Terrain Grid Debug: ON');
}

/**
 * Disable terrain grid visualization
 */
function hideTerrainGrid() {
  window.terrainGridDebugEnabled = false;
  logNormal('Terrain Grid Debug: OFF');
}

/**
 * Set grid opacity
 * @param {number} opacity - Value between 0 (transparent) and 1 (opaque)
 */
function setTerrainGridOpacity(opacity) {
  window.terrainGridOpacity = Math.max(0, Math.min(1, opacity));
  logNormal(`Terrain Grid Opacity: ${window.terrainGridOpacity}`);
}

/**
 * Toggle tile coordinate labels
 */
function toggleTerrainGridLabels() {
  window.terrainGridShowLabels = !window.terrainGridShowLabels;
  logNormal(`Terrain Grid Labels: ${window.terrainGridShowLabels ? 'ON' : 'OFF'}`);
}

/**
 * Get a tile from the terrain system using tile coordinates
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {Object|null} Tile object or null if not found
 */
function getTerrainTile(tileX, tileY) {
  if (typeof g_activeMap === 'undefined' || !g_activeMap || !g_activeMap.chunkArray) {
    return null;
  }
  
  const map = g_activeMap;
  const chunkSize = map._chunkSize || CHUNK_SIZE || 8;
  
  // Calculate which chunk this tile is in
  const chunkX = Math.floor(tileX / chunkSize);
  const chunkY = Math.floor(tileY / chunkSize);
  
  // Get the chunk from the chunk array
  try {
    // Convert chunk coordinates to array position
    const chunkPos = map.chunkArray.convRelPosToArr([chunkX, chunkY]);
    if (chunkPos === null || chunkPos < 0 || chunkPos >= map.chunkArray.rawArray.length) {
      return null;
    }
    
    const chunk = map.chunkArray.rawArray[chunkPos];
    if (!chunk || !chunk.tileData) {
      return null;
    }
    
    // Calculate tile position within the chunk
    const tileInChunkX = tileX - (chunkX * chunkSize);
    const tileInChunkY = tileY - (chunkY * chunkSize);
    
    // Get the tile from the chunk's tile data
    const tilePos = chunk.tileData.convRelPosToArr([tileInChunkX, tileInChunkY]);
    if (tilePos === null || tilePos < 0 || tilePos >= chunk.tileData.rawArray.length) {
      return null;
    }
    
    return chunk.tileData.rawArray[tilePos];
  } catch (error) {
    console.warn(`Failed to get tile at (${tileX}, ${tileY}):`, error);
    return null;
  }
}

/**
 * Get the color for a tile based on its material type
 * Maps terrain materials to distinctive colors
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {Array} [r, g, b] color values (0-255)
 */
function getTileColor(tileX, tileY) {
  // Try to get the actual tile from the terrain system
  const tile = getTerrainTile(tileX, tileY);
  
  if (tile && tile._materialSet) {
    const material = tile._materialSet.toLowerCase();
    
    // Map material types to colors (matching the actual terrain textures)
    const materialColors = {
      'grass': [80, 180, 80],       // Green
      'dirt': [139, 90, 43],        // Brown
      'stone': [128, 128, 128],     // Gray
      'moss_0': [85, 107, 47],      // Dark olive green (moss)
      'moss_1': [85, 107, 47],      // Dark olive green (moss)
      'water': [50, 120, 200],      // Blue
      /*
      'sand': [230, 200, 140],      // Sandy yellow
      'mud': [101, 67, 33],         // Dark brown
      'ice': [180, 220, 255],       // Light blue
      'snow': [240, 248, 255],      // White
      'lava': [255, 69, 0],         // Red-orange
      'wood': [139, 69, 19],        // Dark wood
      'metal': [192, 192, 192],     // Silver
      'rough': [160, 140, 120],     // Tan/beige
      'default': [200, 200, 200]    // Light gray */
    };
    
    return materialColors[material] || materialColors['default'];
  }
  
  // Fallback: Generate a consistent color based on coordinates
  const hash = (tileX * 73856093) ^ (tileY * 19349663);
  const r = (hash & 0xFF0000) >> 16;
  const g = (hash & 0x00FF00) >> 8;
  const b = (hash & 0x0000FF);
  
  return [
    Math.min(255, r + 50),
    Math.min(255, g + 50),
    Math.min(255, b + 50)
  ];
}

/**
 * Draw the terrain grid overlay
 * Call this in the main draw() loop
 */
function drawTerrainGrid() {
  if (!window.terrainGridDebugEnabled) return;
  
  // Check if terrain system exists
  if (typeof g_activeMap === 'undefined' || !g_activeMap) {
    return;
  }
  
  const map = g_activeMap;
  const tileSize = TILE_SIZE || 32;
  
  push();
  
  // Get visible tile range from renderConversion if available
  let visibleTiles = {
    minX: 0,
    maxX: Math.ceil(width / tileSize),
    minY: 0,
    maxY: Math.ceil(height / tileSize)
  };
  
  if (map.renderConversion) {
    const viewSpan = map.renderConversion.getViewSpan();
    if (viewSpan && viewSpan.length === 2) {
      // ViewSpan format: [[minX, maxY], [maxX, minY]]
      visibleTiles.minX = Math.floor(viewSpan[0][0]) - 1;
      visibleTiles.maxX = Math.ceil(viewSpan[1][0]) + 1;
      visibleTiles.minY = Math.floor(viewSpan[1][1]) - 1;
      visibleTiles.maxY = Math.ceil(viewSpan[0][1]) + 1;
    }
  }
  
  // Draw each visible tile
  for (let tileX = visibleTiles.minX; tileX <= visibleTiles.maxX; tileX++) {
    for (let tileY = visibleTiles.minY; tileY <= visibleTiles.maxY; tileY++) {
      
      // Get screen position for this tile
      let screenX, screenY;
      
      if (map.renderConversion) {
        // Use terrain's conversion system
        const screenPos = map.renderConversion.convPosToCanvas([tileX, tileY]);
        screenX = screenPos[0];
        screenY = screenPos[1];
      } else {
        // Fallback to simple calculation
        screenX = tileX * tileSize;
        screenY = tileY * tileSize;
      }
      
      // Skip tiles that are off-screen
      if (screenX + tileSize < 0 || screenX > width || 
          screenY + tileSize < 0 || screenY > height) {
        continue;
      }
      
      // Get unique color for this tile
      const [r, g, b] = getTileColor(tileX, tileY);
      
      // Draw tile background
      fill(r, g, b, window.terrainGridOpacity * 255);
      stroke(0, 0, 0, window.terrainGridOpacity * 255);
      strokeWeight(1);
      rect(screenX, screenY, tileSize, tileSize);
      
      // Draw tile info if enabled
      if (window.terrainGridShowLabels && tileSize > 20) {
        // Get material name from the actual terrain tile
        let labelText = `${tileX},${tileY}`;
        const tile = getTerrainTile(tileX, tileY);
        if (tile && tile._materialSet) {
          labelText = `${tile._materialSet}\n(${tileX},${tileY})`;
        }
        
        fill(0, 0, 0, 200);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(Math.min(10, tileSize / 4));
        text(labelText, screenX + tileSize/2, screenY + tileSize/2);
      }
    }
  }
  
  // Draw legend
  drawTerrainGridLegend();
  
  pop();
}

/**
 * Draw a legend showing controls and info
 */
function drawTerrainGridLegend() {
  push();
  
  // Background
  fill(0, 0, 0, 180);
  noStroke();
  const legendWidth = 220;
  const legendHeight = 120;
  rect(10, height - legendHeight - 10, legendWidth, legendHeight, 5);
  
  // Text
  fill(255);
  textAlign(LEFT, TOP);
  textSize(11);
  
  let y = height - legendHeight - 5;
  text("TERRAIN GRID DEBUG", 15, y);
  y += 18;
  
  textSize(10);
  fill(200);
  text("Toggle: Ctrl+Shift+G", 15, y);
  y += 15;
  text("Opacity: Ctrl+Shift+O", 15, y);
  y += 15;
  text("Labels: Ctrl+Shift+L", 15, y);
  y += 15;
  
  fill(150, 255, 150);
  text(`Opacity: ${(window.terrainGridOpacity * 100).toFixed(0)}%`, 15, y);
  y += 15;
  text(`Labels: ${window.terrainGridShowLabels ? 'ON' : 'OFF'}`, 15, y);
  y += 15;
  
  fill(255, 255, 150);
  text(`Colors: Tile Materials`, 15, y);
  
  pop();
}

/**
 * Handle keyboard shortcuts for terrain grid
 * Call this from keyPressed() in sketch.js
 */
function handleTerrainGridKeys() {
  // Ctrl+Shift+G - Toggle grid
  if (keyIsDown(CONTROL) && keyIsDown(SHIFT) && key === 'G') {
    if (typeof event !== 'undefined' && event.preventDefault) {
      event.preventDefault();
    }
    toggleTerrainGrid();
    return true;
  }
  
  // Ctrl+Shift+O - Cycle opacity
  if (keyIsDown(CONTROL) && keyIsDown(SHIFT) && key === 'O') {
    if (typeof event !== 'undefined' && event.preventDefault) {
      event.preventDefault();
    }
    const opacities = [0.1, 0.2, 0.3, 0.5, 0.7];
    const currentIndex = opacities.findIndex(o => Math.abs(o - window.terrainGridOpacity) < 0.05);
    const nextIndex = (currentIndex + 1) % opacities.length;
    setTerrainGridOpacity(opacities[nextIndex]);
    return true;
  }
  
  // Ctrl+Shift+L - Toggle labels
  if (keyIsDown(CONTROL) && keyIsDown(SHIFT) && key === 'L') {
    if (typeof event !== 'undefined' && event.preventDefault) {
      event.preventDefault();
    }
    toggleTerrainGridLabels();
    return true;
  }
  
  return false;
}

// Make functions globally available
window.toggleTerrainGrid = toggleTerrainGrid;
window.showTerrainGrid = showTerrainGrid;
window.hideTerrainGrid = hideTerrainGrid;
window.setTerrainGridOpacity = setTerrainGridOpacity;
window.toggleTerrainGridLabels = toggleTerrainGridLabels;
window.drawTerrainGrid = drawTerrainGrid;
window.handleTerrainGridKeys = handleTerrainGridKeys;
window.getTerrainTile = getTerrainTile; // Helper for debugging

logNormal('Terrain Grid Debug loaded. Use toggleTerrainGrid() or Ctrl+Shift+G');
