/**
 * GroupPlacer Utility
 * Places groups of entities maintaining formation based on relative positions
 */

class GroupPlacer {
  /**
   * Place a group of entities at origin position
   * @param {number} originGridX - Origin grid X coordinate
   * @param {number} originGridY - Origin grid Y coordinate
   * @param {Object} groupData - Group data with entities array
   * @returns {Array} Array of created entity instances
   */
  static placeGroup(originGridX, originGridY, groupData) {
    if (!groupData || !groupData.entities || !Array.isArray(groupData.entities)) {
      return [];
    }
    
    const placedEntities = [];
    
    groupData.entities.forEach(entityData => {
      const finalGridX = originGridX + entityData.position.x;
      const finalGridY = originGridY + entityData.position.y;
      const finalWorldX = finalGridX * TILE_SIZE;
      const finalWorldY = finalGridY * TILE_SIZE;
      
      // Create entity using factory or constructor
      const entity = this._createEntity(
        entityData.baseTemplateId,
        finalWorldX,
        finalWorldY,
        entityData.properties
      );
      
      placedEntities.push(entity);
    });
    
    return placedEntities;
  }
  
  /**
   * Create entity instance
   * @param {string} templateId - Entity template ID
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} properties - Entity properties
   * @returns {Object} Created entity instance
   * @private
   */
  static _createEntity(templateId, worldX, worldY, properties) {
    // In tests, use mockEntityFactory if available
    if (typeof mockEntityFactory !== 'undefined' && mockEntityFactory) {
      return mockEntityFactory(templateId, worldX, worldY, properties);
    }
    
    // In production, use actual entity constructors
    // This is a placeholder - Level Editor should provide proper entity creation
    return {
      templateId: templateId,
      x: worldX,
      y: worldY,
      properties: { ...properties }
    };
  }
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.GroupPlacer = GroupPlacer;
}

// Module export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GroupPlacer;
}
