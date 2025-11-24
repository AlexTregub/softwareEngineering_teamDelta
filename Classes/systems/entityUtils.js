/**
 * entityUtils.js
 * ==============
 * Utility functions for working with entities.
 * Provides helper functions for entity position, size, and coordinate calculations.
 */

/**
 * getEntityWorldCenter
 * --------------------
 * Calculates the center position of an entity in world coordinates.
 * This function determines the position and size of the entity, either
 * through its methods or directly from its properties, and computes
 * the center point.
 *
 * @param {Object} entity - The entity whose center position is to be calculated.
 * @returns {Object|null} - An object containing the x and y coordinates of the center, or null if the entity is invalid.
 */
function getEntityWorldCenter(entity) {
  if (!entity) return null;

  const pos = typeof entity.getPosition === 'function'
    ? entity.getPosition()
    : (entity.sprite?.pos ?? { x: entity.posX ?? 0, y: entity.posY ?? 0 });

  const size = typeof entity.getSize === 'function'
    ? entity.getSize()
    : (entity.sprite?.size ?? { x: entity.sizeX ?? TILE_SIZE, y: entity.sizeY ?? TILE_SIZE });

  const posX = pos?.x ?? pos?.[0] ?? 0;
  const posY = pos?.y ?? pos?.[1] ?? 0;
  const sizeX = size?.x ?? size?.[0] ?? TILE_SIZE;
  const sizeY = size?.y ?? size?.[1] ?? TILE_SIZE;

  return {
    x: posX + sizeX / 2,
    y: posY + sizeY / 2
  };
}

/**
 * getMapPixelDimensions
 * ---------------------
 * Returns the pixel dimensions of the active map.
 * If the map object (g_activeMap) is available, it calculates the dimensions
 * based on the number of tiles and their size. Otherwise, it defaults
 * to the canvas dimensions.
 *
 * @returns {Object} - An object containing the width and height of the map in pixels.
 */
function getMapPixelDimensions() {
  if (!g_activeMap) {
    return { width: g_canvasX, height: g_canvasY };
  }

  const width = g_activeMap._xCount ? g_activeMap._xCount * TILE_SIZE : g_canvasX;
  const height = g_activeMap._yCount ? g_activeMap._yCount * TILE_SIZE : g_canvasY;
  //const gridSize = g_activeMap.getGridSizePixels()
  return { width, height };
}
