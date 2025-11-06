/**
 * EntityMVCAdapter - Adapter pattern for legacy Entity system
 * 
 * **Purpose**: Bridge between legacy Entity class and new MVC system
 * - Wraps legacy Entity instances
 * - Exposes MVC model interface (EntityModel, AntModel, etc.)
 * - Allows MVC views/controllers to work with legacy entities
 * - Enables gradual migration without breaking existing game
 * 
 * **Usage**:
 * ```javascript
 * // Wrap legacy entity
 * const legacyAnt = new ant(100, 200, 32, 32, 1, 0, antBaseSprite, 'Scout');
 * const adapter = new EntityMVCAdapter(legacyAnt);
 * 
 * // Use with MVC view
 * const antView = new AntView();
 * antView.render(adapter, graphics);
 * 
 * // Use with MVC controller
 * const antController = new AntController();
 * antController.update(adapter, deltaTime);
 * 
 * // Access legacy entity directly when needed
 * const legacy = adapter.getLegacyEntity();
 * legacy.someOldMethod();
 * ```
 */

class EntityMVCAdapter {
  /**
   * Create adapter wrapping legacy entity
   * @param {Object} legacyEntity - Legacy Entity instance
   * @throws {Error} If legacy entity is null
   */
  constructor(legacyEntity) {
    if (!legacyEntity) {
      throw new Error('Legacy entity required');
    }
    
    this._legacyEntity = legacyEntity;
  }
  
  // ===========================
  // EntityModel Interface
  // ===========================
  
  /**
   * Get entity ID
   * @returns {string} Entity ID
   */
  get id() {
    return this._legacyEntity._id;
  }
  
  /**
   * Get entity type
   * @returns {string} Entity type
   */
  get type() {
    return this._legacyEntity._type;
  }
  
  /**
   * Get/set enabled state
   * @returns {boolean} Whether entity is active
   */
  get enabled() {
    return this._legacyEntity._isActive;
  }
  
  set enabled(value) {
    this._legacyEntity._isActive = value;
  }
  
  /**
   * Get position (delegates to legacy entity)
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return this._legacyEntity.getPosition();
  }
  
  /**
   * Set position (delegates to legacy entity)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this._legacyEntity.setPosition(x, y);
  }
  
  /**
   * Get size (delegates to legacy entity)
   * @returns {Object} Size {width, height}
   */
  getSize() {
    return this._legacyEntity.getSize();
  }
  
  /**
   * Set size (delegates to legacy entity)
   * @param {number} width - Width
   * @param {number} height - Height
   */
  setSize(width, height) {
    this._legacyEntity.setSize(width, height);
  }
  
  // ===========================
  // AntModel Interface
  // ===========================
  
  /**
   * Get job name (ant-specific)
   * @returns {string|undefined} Job name
   */
  get jobName() {
    return this._legacyEntity._JobName;
  }
  
  /**
   * Get faction (ant-specific)
   * @returns {string|undefined} Faction
   */
  get faction() {
    return this._legacyEntity._faction;
  }
  
  /**
   * Get health (ant-specific)
   * @returns {number|undefined} Current health
   */
  get health() {
    return this._legacyEntity._stats ? this._legacyEntity._stats.health : undefined;
  }
  
  /**
   * Get max health (ant-specific)
   * @returns {number|undefined} Maximum health
   */
  get maxHealth() {
    return this._legacyEntity._stats ? this._legacyEntity._stats.maxHealth : undefined;
  }
  
  /**
   * Get selection state (ant-specific)
   * @returns {boolean} Whether ant is selected
   */
  get isSelected() {
    return this._legacyEntity.isSelected || false;
  }
  
  /**
   * Get target position (movement)
   * @returns {Object|null} Target position {x, y}
   */
  get targetPosition() {
    return this._legacyEntity.targetPosition || null;
  }
  
  /**
   * Get path (pathfinding waypoints)
   * @returns {Array|null} Path waypoints
   */
  get path() {
    return this._legacyEntity.path || null;
  }
  
  /**
   * Get combat target (combat system)
   * @returns {string|null} Target entity ID
   */
  get combatTarget() {
    return this._legacyEntity.combatTarget || null;
  }
  
  // ===========================
  // ResourceModel Interface
  // ===========================
  
  /**
   * Get resource type
   * @returns {string|undefined} Resource type
   */
  get resourceType() {
    return this._legacyEntity.resourceType;
  }
  
  /**
   * Get resource amount
   * @returns {number|undefined} Resource amount
   */
  get amount() {
    return this._legacyEntity.amount;
  }
  
  /**
   * Get carrier ID
   * @returns {string|null} ID of entity carrying this resource
   */
  get carriedBy() {
    return this._legacyEntity.carriedBy || null;
  }
  
  /**
   * Get resource weight
   * @returns {number|undefined} Resource weight
   */
  get weight() {
    return this._legacyEntity.weight;
  }
  
  // ===========================
  // BuildingModel Interface
  // ===========================
  
  /**
   * Get building type
   * @returns {string|undefined} Building type
   */
  get buildingType() {
    return this._legacyEntity.buildingType;
  }
  
  /**
   * Get building level
   * @returns {number|undefined} Building level
   */
  get level() {
    return this._legacyEntity.level;
  }
  
  /**
   * Get upgrade capability
   * @returns {boolean|undefined} Whether building can upgrade
   */
  get canUpgrade() {
    return this._legacyEntity.canUpgrade;
  }
  
  /**
   * Get upgrade cost
   * @returns {Object|undefined} Upgrade cost
   */
  get upgradeCost() {
    return this._legacyEntity.upgradeCost;
  }
  
  // ===========================
  // Legacy Access
  // ===========================
  
  /**
   * Get wrapped legacy entity
   * Use this for accessing legacy-specific methods/properties
   * @returns {Object} Legacy Entity instance
   */
  getLegacyEntity() {
    return this._legacyEntity;
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EntityMVCAdapter;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.EntityMVCAdapter = EntityMVCAdapter;
}
