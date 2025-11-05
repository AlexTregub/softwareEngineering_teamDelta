/**
 * @file QueenModel.js
 * @description Data model for Queen entities. Since Queens are ants,
 * they should do all the things ants can do, but the player should be 
 * able to turn them on or disable them (like not having the queen go 
 * after resources)
 * 
 * @extends BaseModel
 */
class QueenModel extends AntModel {
    constructor(x, y, width, height, options = {}){

    }

    // =====================================
    // Powers
    // =====================================


  // ========================================
  // Serialization Methods
  // ========================================
  /**
   * Serialize to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON()
    };
  }
  
  /**
   * Reconstruct from JSON
   * @param {Object} data - JSON data
   * @returns {AntModel} Reconstructed model
   * @static
   */
  static fromJSON(data) {
    const model = new QueenModel(
      data.position.x,
      data.position.y,
      data.size.width,
      data.size.height,
      {
        antIndex: data.antIndex,
        jobName: data.jobName,
        name: data.name,
        faction: data.faction,
        rotation: data.rotation,
        health: data.health,
        maxHealth: data.maxHealth,
        damage: data.damage,
        attackRange: data.attackRange,
        movementSpeed: data.movementSpeed
      }
    );
    
    model._isActive = data.isActive;
    
    return model;
  }
}

// ========================================
// Module Exports
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntModel;
}
if (typeof window !== 'undefined') {
  window.AntModel = AntModel;
}
