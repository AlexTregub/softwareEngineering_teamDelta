/**
 * BuildingModel - Pure data model for buildings
 * Extends EntityModel with building-specific properties
 * Framework-agnostic, JSON-serializable
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityModel === 'undefined') {
  var EntityModel = require('./EntityModel');
}

class BuildingModel extends EntityModel {
  /**
   * Creates a new BuildingModel
   * @param {Object} data - Building data
   * @param {number} data.x - X position
   * @param {number} data.y - Y position
   * @param {number} [data.width=64] - Building width (default larger than entities)
   * @param {number} [data.height=64] - Building height (default larger than entities)
   * @param {string} [data.buildingType='AntHill'] - Type of building (AntHill, Cone, Hive, Tower)
   * @param {string} [data.faction='player'] - Faction (player, enemy, neutral)
   * @param {number} [data.level=1] - Building level/tier
   * @param {boolean} [data.canUpgrade=true] - Whether building can be upgraded
   * @param {Object} [data.upgradeCost] - Cost to upgrade (resource type -> amount)
   * @param {number} [data.health] - Current health (optional)
   * @param {number} [data.maxHealth] - Maximum health (optional)
   * @param {boolean} [data.enabled=true] - Whether building is enabled
   */
  constructor(data = {}) {
    // Call parent constructor with building-specific defaults
    super({
      ...data,
      type: 'Building',
      position: { x: data.x, y: data.y },
      size: {
        width: data.width !== undefined ? data.width : 64,
        height: data.height !== undefined ? data.height : 64
      }
    });
    
    /**
     * Building type (AntHill, Cone, Hive, Tower)
     * @type {string}
     */
    this.buildingType = data.buildingType || 'AntHill';
    
    /**
     * Faction that owns this building (player, enemy, neutral)
     * @type {string}
     */
    this.faction = data.faction || 'player';
    
    /**
     * Building level/tier (1-10)
     * @type {number}
     */
    this.level = data.level !== undefined ? data.level : 1;
    
    /**
     * Whether building can be upgraded
     * @type {boolean}
     */
    this.canUpgrade = data.canUpgrade !== undefined ? data.canUpgrade : true;
    
    /**
     * Cost to upgrade building (e.g., { greenLeaf: 50, stick: 25 })
     * @type {Object}
     */
    this.upgradeCost = data.upgradeCost !== undefined 
      ? data.upgradeCost 
      : { greenLeaf: 50, stick: 25 };
    
    /**
     * Current health (optional - not all buildings have health)
     * @type {number|undefined}
     */
    this.health = data.health;
    
    /**
     * Maximum health (optional - not all buildings have health)
     * @type {number|undefined}
     */
    this.maxHealth = data.maxHealth;
  }
  
  /**
   * Serialize building to JSON
   * @returns {Object} JSON representation with flattened position
   */
  toJSON() {
    const parentJSON = super.toJSON();
    const json = {
      ...parentJSON,
      x: parentJSON.position.x,
      y: parentJSON.position.y,
      width: parentJSON.size.width,
      height: parentJSON.size.height,
      buildingType: this.buildingType,
      faction: this.faction,
      level: this.level,
      canUpgrade: this.canUpgrade,
      upgradeCost: this.upgradeCost
    };
    
    // Only include health if it's defined
    if (this.health !== undefined) {
      json.health = this.health;
    }
    if (this.maxHealth !== undefined) {
      json.maxHealth = this.maxHealth;
    }
    
    return json;
  }
  
  /**
   * Create BuildingModel from JSON data
   * @param {Object} json - JSON data
   * @returns {BuildingModel} New BuildingModel instance
   */
  static fromJSON(json) {
    return new BuildingModel(json);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingModel;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.BuildingModel = BuildingModel;
}
