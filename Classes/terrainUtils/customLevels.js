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
  console.log("🏛️ Creating Moss & Stone Column Level");
  
  // Create base terrain
  const terrain = new gridTerrain(chunksX, chunksY, seed, chunkSize, tileSize, canvasSize);
  
  // Apply custom column pattern to all chunks
  const chunkCount = chunksX * chunksY;
  
  for (let i = 0; i < chunkCount; i++) {
    const chunk = terrain.chunkArray.rawArray[i];
    applyColumnPattern(chunk);
  }
  
  // Align to canvas
  terrain.renderConversion.alignToCanvas();
  
  console.log("✅ Moss & Stone Column Level created");
  return terrain;
}

/**
 * Applies alternating moss and stone column pattern to a chunk
 * 
 * @param {Chunk} chunk - The chunk to apply the pattern to
 */
function applyColumnPattern(chunk) {
  const width = chunk.tileData.getSize()[0];
  const height = chunk.tileData.getSize()[1];
  
  // Iterate through all tiles in the chunk
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileIndex = chunk.tileData.convToFlat([x, y]);
      const tile = chunk.tileData.rawArray[tileIndex];
      
      // Get absolute tile position (including chunk offset)
      const chunkPos = chunk._chunkPos;
      const absoluteX = chunkPos[0] * width + x;
      
      // Determine material based on column position
      // Even columns = moss, Odd columns = stone
      if (absoluteX % 2 === 0) {
        tile._materialSet = 'moss_0';
      } else {
        tile._materialSet = 'stone';
      }
      
      // Update tile weight based on material
      if (tile._materialSet === 'moss_0' || tile._materialSet === 'moss_1') {
        tile._weight = 2; // Moss weight
      } else if (tile._materialSet === 'stone') {
        tile._weight = 100; // Stone weight (heavy)
      }
    }
  }
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
  console.log("♟️ Creating Moss & Stone Checkerboard Level");
  
  // Create base terrain
  const terrain = new gridTerrain(chunksX, chunksY, seed, chunkSize, tileSize, canvasSize);
  
  // Apply custom checkerboard pattern to all chunks
  const chunkCount = chunksX * chunksY;
  
  for (let i = 0; i < chunkCount; i++) {
    const chunk = terrain.chunkArray.rawArray[i];
    applyCheckerboardPattern(chunk);
  }
  
  // Align to canvas
  terrain.renderConversion.alignToCanvas();
  
  console.log("✅ Moss & Stone Checkerboard Level created");
  return terrain;
}

/**
 * Applies checkerboard moss and stone pattern to a chunk
 * 
 * @param {Chunk} chunk - The chunk to apply the pattern to
 */
function applyCheckerboardPattern(chunk) {
  const width = chunk.tileData.getSize()[0];
  const height = chunk.tileData.getSize()[1];
  
  // Iterate through all tiles in the chunk
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileIndex = chunk.tileData.convToFlat([x, y]);
      const tile = chunk.tileData.rawArray[tileIndex];
      
      // Get absolute tile position (including chunk offset)
      const chunkPos = chunk._chunkPos;
      const absoluteX = chunkPos[0] * width + x;
      const absoluteY = chunkPos[1] * height + y;
      
      // Checkerboard pattern: moss if (x+y) is even, stone if odd
      if ((absoluteX + absoluteY) % 2 === 0) {
        tile._materialSet = 'moss_0';
        tile._weight = 2;
      } else {
        tile._materialSet = 'stone';
        tile._weight = 100;
      }
    }
  }
}

// Export functions to global scope for easy access
window.createMossStoneColumnLevel = createMossStoneColumnLevel;
window.createMossStoneCheckerboardLevel = createMossStoneCheckerboardLevel;

console.log("🎮 Custom Levels Module Loaded");
console.log("  - createMossStoneColumnLevel()");
console.log("  - createMossStoneCheckerboardLevel()");
