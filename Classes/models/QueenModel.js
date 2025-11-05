/**
 * @file AntModel.js
 * @description Data model for ant entities (Phase 3.1 - MVC Refactoring)
 * 
 * AntModel contains:
 * - Identity (antIndex, jobName, name, faction, type)
 * - Position & Movement (position, size, rotation, movementSpeed)
 * - Health System (health, maxHealth, damage, attackRange)
 * - Combat System (combatTarget, enemies, attack logic)
 * - Resource System (ResourceManager integration)
 * - State Machine (AntStateMachine integration)
 * - Job System (JobComponent integration)
 * - Behavior System (GatherState integration)
 * 
 * @extends BaseModel
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseModel = (typeof require !== 'undefined') ? require('./BaseModel') : window.BaseModel;
const JobComponent = (typeof require !== 'undefined') ? require('../ants/JobComponent') : window.JobComponent;
const AntStateMachine = (typeof require !== 'undefined') ? require('../ants/antStateMachine') : window.AntStateMachine;
const ResourceManager = (typeof require !== 'undefined') ? require('../managers/ResourceManager') : window.ResourceManager;
const StatsContainer = (typeof require !== 'undefined') ? require('../containers/StatsContainer') : window.StatsContainer;

// Note: GatherState will be integrated later

// Global ant index counter (auto-increment)
let nextAntIndex = 0;

class QueenModel extends AntModel {
 
  
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
