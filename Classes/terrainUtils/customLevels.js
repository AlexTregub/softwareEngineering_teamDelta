/**
 * Custom Level Definitions
 * 
 * This file contains custom terrain generation patterns for special levels.
 * Each level can have its own unique terrain generation logic.
 */

/**
 * Creates a terrain level made entirely of moss and stone columns
 * 
 * @param {number} chunksX - Number of chunks horizontally
 * @param {number} chunksY - Number of chunks vertically
 * @param {number} seed - Random seed for generation
 * @param {number} chunkSize - Size of each chunk in tiles
 * @param {number} tileSize - Size of each tile in pixels
 * @param {Array} canvasSize - Canvas dimensions [width, height]
 * @returns {gridTerrain} The generated terrain
 */
function createMossStoneColumnLevel(chunksX, chunksY, seed, chunkSize = CHUNK_SIZE, tileSize = TILE_SIZE, canvasSize = [windowWidth, windowHeight]) {
  
  // Create terrain with 'columns' generation mode
  const terrain = new gridTerrain(chunksX, chunksY, seed, chunkSize, tileSize, canvasSize, 'columns');
  
  // Align to canvas
  terrain.renderConversion.alignToCanvas();
  
  return terrain;
}

/**
 * Creates a checkerboard pattern of moss and stone
 * 
 * @param {number} chunksX - Number of chunks horizontally
 * @param {number} chunksY - Number of chunks vertically
 * @param {number} seed - Random seed for generation
 * @param {number} chunkSize - Size of each chunk in tiles
 * @param {number} tileSize - Size of each tile in pixels
 * @param {Array} canvasSize - Canvas dimensions [width, height]
 * @returns {gridTerrain} The generated terrain
 */
function createMossStoneCheckerboardLevel(chunksX, chunksY, seed, chunkSize = CHUNK_SIZE, tileSize = TILE_SIZE, canvasSize = [windowWidth, windowHeight]) {
  
  // Create terrain with 'checkerboard' generation mode
  const terrain = new gridTerrain(chunksX, chunksY, seed, chunkSize, tileSize, canvasSize, 'checkerboard');
  
  // Align to canvas
  terrain.renderConversion.alignToCanvas();
  
  return terrain;
}

// Export functions to global scope for easy access
window.createMossStoneColumnLevel = createMossStoneColumnLevel;
window.createMossStoneCheckerboardLevel = createMossStoneCheckerboardLevel;