/**
 * queenDetection.js
 * Queen Detection Utility - Locate queen ant in entity arrays
 * 
 * PURPOSE:
 * - Find queen entity in loaded level for camera tracking
 * - Handle edge cases (no queen, multiple queens, invalid data)
 * - Provide fast queen lookup (O(n) linear search)
 * 
 * USAGE:
 *   const { findQueen } = require('./utils/queenDetection');
 *   const queen = findQueen(entities);
 *   if (queen) {
 *     cameraManager.followEntity(queen);
 *   }
 * 
 * PERFORMANCE:
 * - O(n) linear search through entity array
 * - Stops at first queen found
 * - <50ms for 10,000 entities
 * - <100ms worst case (queen at end)
 */

/**
 * Find queen entity in entity array
 * @param {Array} entities - Array of entity objects
 * @returns {Object|null} Queen entity object or null if not found
 * 
 * @example
 * const entities = [
 *   { id: 'ant1', type: 'Ant', x: 100, y: 100 },
 *   { id: 'queen1', type: 'Queen', x: 200, y: 200 }
 * ];
 * const queen = findQueen(entities);
 * console.log(queen.id); // 'queen1'
 */
function findQueen(entities) {
  // Validate input
  if (!entities || !Array.isArray(entities)) {
    return null;
  }

  // Handle empty array
  if (entities.length === 0) {
    return null;
  }

  // Linear search for first queen (O(n))
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];

    // Skip null/undefined elements
    if (!entity) {
      continue;
    }

    // Check if entity has type field and it equals 'Queen' (case-sensitive)
    if (entity.type === 'Queen') {
      return entity; // Return reference to actual entity
    }
  }

  // No queen found
  return null;
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findQueen
  };
}

// Export for browser (game)
if (typeof window !== 'undefined') {
  window.queenDetection = {
    findQueen
  };
}
