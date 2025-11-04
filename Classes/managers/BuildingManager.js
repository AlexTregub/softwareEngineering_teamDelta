/**
 * BuildingManager
 * ---------------
 * Simplified manager for building lifecycle and coordination.
 * 
 * Responsibilities:
 * - Central tracking of all buildings
 * - Delegate creation to BuildingFactory
 * - Coordinate updates for all buildings
 * - Manage building lifecycle (add/remove)
 * 
 * Usage:
 * ```javascript
 * const manager = new BuildingManager();
 * const building = manager.createBuilding('antcone', x, y, 'player');
 * manager.update(deltaTime);
 * ```
 */

// Load BuildingFactory (browser uses window.* directly, Node.js requires it)
let BuildingFactory;
if (typeof require !== 'undefined') {
  BuildingFactory = require('../factories/BuildingFactory');
} else {
  BuildingFactory = window.BuildingFactory;
}

class BuildingManager {
  constructor() {
    /**
     * Central tracking of all buildings
     * @type {Array<BuildingController>}
     */
    this.buildings = [];
  }
  
  /**
   * Create a building and add to tracking.
   * Delegates to BuildingFactory for creation.
   * 
   * @param {string} type - Building type ('antcone', 'anthill', 'hivesource')
   * @param {number} x - X position in world coordinates
   * @param {number} y - Y position in world coordinates
   * @param {string} [faction='neutral'] - Building faction
   * @returns {BuildingController|null} Created building or null if invalid type
   */
  createBuilding(type, x, y, faction = 'neutral') {
    if (!type) return null;
    
    // Normalize type to lowercase for case-insensitive matching
    const normalizedType = String(type).toLowerCase();
    
    let building = null;
    
    // Delegate to BuildingFactory based on type
    if (normalizedType === 'antcone') {
      building = BuildingFactory.createAntCone(x, y, faction);
    } else if (normalizedType === 'anthill') {
      building = BuildingFactory.createAntHill(x, y, faction);
    } else if (normalizedType === 'hivesource') {
      building = BuildingFactory.createHiveSource(x, y, faction);
    } else {
      console.warn(`Unknown building type: ${type}`);
      return null;
    }
    
    if (building) {
      // Track building
      this.buildings.push(building);
    }
    
    return building;
  }
  
  /**
   * Update all buildings.
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    this.buildings.forEach(building => {
      if (building && typeof building.update === 'function') {
        building.update(deltaTime);
      }
    });
  }
  
  /**
   * Get all buildings.
   * @returns {Array<BuildingController>} All tracked buildings
   */
  getAllBuildings() {
    return this.buildings;
  }
  
  /**
   * Get building count.
   * @returns {number} Number of tracked buildings
   */
  getBuildingCount() {
    return this.buildings.length;
  }
  
  /**
   * Remove a building from tracking.
   * @param {BuildingController} building - Building to remove
   */
  removeBuilding(building) {
    const index = this.buildings.indexOf(building);
    if (index !== -1) {
      this.buildings.splice(index, 1);
    }
  }
  
  /**
   * Clear all buildings.
   */
  clear() {
    this.buildings.length = 0;
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingManager;
}

if (typeof window !== 'undefined') {
  window.BuildingManager = BuildingManager;
}
