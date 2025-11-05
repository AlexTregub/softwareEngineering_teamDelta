/**
 * AntModel
 * ========
 * Ant-specific entity model extending EntityModel
 * 
 * Adds ant-specific properties:
 * - Job system (Scout, Warrior, Builder, Farmer, Spitter, Queen)
 * - Faction system (player, enemy, neutral)
 * - Health/combat system
 * - Movement state (target position, path)
 * - Combat state (target entity)
 * 
 * Usage:
 * ```javascript
 * const ant = new AntModel({
 *   position: { x: 100, y: 200 },
 *   jobName: 'Warrior',
 *   faction: 'player',
 *   health: 150,
 *   maxHealth: 150,
 *   damage: 25
 * });
 * 
 * ant.targetPosition = { x: 300, y: 400 };
 * ant.combatTarget = 'enemy_ant_123';
 * 
 * const json = JSON.stringify(ant); // Serialize
 * ```
 */

// Import EntityModel (Node.js)
if (typeof module !== 'undefined' && typeof EntityModel === 'undefined') {
  var EntityModel = require('./EntityModel');
}

class AntModel extends EntityModel {
  /**
   * Create ant model
   * @param {Object} data - Ant configuration
   * @param {Object} data.position - Position (REQUIRED, inherited from EntityModel)
   * @param {string} [data.jobName='Scout'] - Ant job (Scout, Warrior, Builder, Farmer, Spitter, Queen)
   * @param {string} [data.faction='player'] - Faction (player, enemy, neutral)
   * @param {number} [data.health=100] - Current health
   * @param {number} [data.maxHealth=100] - Maximum health
   * @param {number} [data.movementSpeed=1.0] - Movement speed multiplier
   * @param {number} [data.damage=10] - Damage per attack
   * @param {boolean} [data.isSelected=false] - Whether ant is selected
   * @param {Object} [data.targetPosition=null] - Movement target { x, y }
   * @param {Array} [data.path=null] - Pathfinding waypoints [{ x, y }, ...]
   * @param {string} [data.combatTarget=null] - Target entity ID for combat
   */
  constructor(data = {}) {
    // Call parent constructor (EntityModel)
    super({
      ...data,
      type: data.type || 'Ant' // Default type to 'Ant' (can be overridden for Queen)
    });
    
    // Ant-specific properties
    this.jobName = data.jobName || 'Scout';
    this.faction = data.faction || 'player';
    this.health = data.health !== undefined ? data.health : 100;
    this.maxHealth = data.maxHealth !== undefined ? data.maxHealth : 100;
    this.movementSpeed = data.movementSpeed !== undefined ? data.movementSpeed : 1.0;
    this.damage = data.damage !== undefined ? data.damage : 10;
    this.isSelected = data.isSelected || false;
    
    // Movement state
    this.targetPosition = data.targetPosition || null; // { x, y } or null
    this.path = data.path || null; // Array of { x, y } or null
    
    // Combat state
    this.combatTarget = data.combatTarget || null; // entity ID or null
  }
  
  /**
   * Serialize to JSON (includes parent properties + ant properties)
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      ...super.toJSON(), // Include EntityModel properties (id, type, position, size, enabled)
      jobName: this.jobName,
      faction: this.faction,
      health: this.health,
      maxHealth: this.maxHealth,
      movementSpeed: this.movementSpeed,
      damage: this.damage,
      isSelected: this.isSelected,
      targetPosition: this.targetPosition,
      path: this.path,
      combatTarget: this.combatTarget
    };
  }
  
  /**
   * Deserialize from JSON
   * @param {Object} json - JSON data
   * @returns {AntModel} New AntModel instance
   */
  static fromJSON(json) {
    return new AntModel(json);
  }
}

// Export for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntModel;
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.AntModel = AntModel;
}
