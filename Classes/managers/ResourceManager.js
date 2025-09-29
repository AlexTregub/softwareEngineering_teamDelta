/**
 * @fileoverview ResourceManager class for handling entity resource collection and management
 * Manages resource carrying, drop-off behavior, and capacity limits for any game entity.
 *
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Manages resource collection, carrying capacity, and drop-off behavior for any entity.
 * Handles the complete resource management lifecycle from collection to delivery.
 *
 * @class ResourceManager
 */
class ResourceManager {
  /**
   * Creates a new ResourceManager for an entity.
   *
   * @param {Object} parentEntity - The entity this resource manager belongs to
   * @param {number} parentEntity.posX - X position of the entity
   * @param {number} parentEntity.posY - Y position of the entity
   * @param {Function} [parentEntity.moveToLocation] - Optional movement function
   * @param {number} [maxCapacity=2] - Maximum number of resources the entity can carry
   * @param {number} [collectionRange=25] - Range in pixels for resource detection
   */
  constructor(parentEntity, maxCapacity = 2, collectionRange = 25) {
    this.parentEntity = parentEntity;
    this.maxCapacity = maxCapacity;
    this.collectionRange = collectionRange;
    
    // Resource state
    this.resources = []; // Resources currently being carried
    this.isDroppingOff = false; // Whether ant is currently dropping off resources
    this.isAtMaxCapacity = false; // Whether ant has reached max capacity
  }

  /**
   * Gets the number of resources currently being carried.
   *
   * @returns {number} The current resource count
   */
  getCurrentLoad() {
    return this.resources.length;
  }

  /**
   * Checks if the ant is at maximum carrying capacity.
   *
   * @returns {boolean} True if at max capacity, false otherwise
   */
  isAtMaxLoad() {
    return this.resources.length >= this.maxCapacity;
  }

  /**
   * Gets the remaining carrying capacity.
   *
   * @returns {number} Number of additional resources that can be carried
   */
  getRemainingCapacity() {
    return this.maxCapacity - this.resources.length;
  }

  /**
   * Adds a resource to the ant's inventory if there's capacity.
   *
   * @param {Object} resource - The resource object to add
   * @returns {boolean} True if resource was added, false if at capacity
   */
  addResource(resource) {
    if (this.isAtMaxLoad()) {
      return false;
    }
    
    this.resources.push(resource);
    this.isAtMaxCapacity = this.isAtMaxLoad();
    return true;
  }

  /**
   * Removes all resources from the ant's inventory.
   * Typically called when dropping off at a collection point.
   *
   * @returns {Array} Array of resources that were removed
   */
  dropAllResources() {
    const droppedResources = [...this.resources];
    this.resources = [];
    this.isDroppingOff = false;
    this.isAtMaxCapacity = false;
    return droppedResources;
  }

  /**
   * Initiates the drop-off process by moving the entity to specified coordinates.
   *
   * @param {number} dropX - X coordinate of drop-off point
   * @param {number} dropY - Y coordinate of drop-off point
   */
  startDropOff(dropX, dropY) {
    this.isDroppingOff = true;
    this.isAtMaxCapacity = true;
    if (this.parentEntity && typeof this.parentEntity.moveToLocation === 'function') {
      this.parentEntity.moveToLocation(dropX, dropY);
    }
  }

  /**
   * Processes resource drop-off when entity reaches destination.
   * Should be called when entity reaches drop-off coordinates.
   *
   * @param {Array} globalResourceArray - Global resource collection array
   */
  processDropOff(globalResourceArray) {
    if (this.isDroppingOff && globalResourceArray) {
      const droppedResources = this.dropAllResources();
      
      // Add resources to global collection
      for (let resource of droppedResources) {
        globalResourceArray.push(resource);
      }
      
      return droppedResources;
    }
    return [];
  }

  /**
   * Scans for nearby resources and attempts to collect them.
   * Uses the global g_resourceList to find available resources.
   */
  checkForNearbyResources() {
    // Check if g_resourceList is available globally
    if (typeof g_resourceList === 'undefined' || !g_resourceList.getResourceList) {
      return;
    }

    const fruits = g_resourceList.getResourceList();
    const keys = Object.keys(fruits);

    for (let key of keys) {
      const resource = fruits[key];
      if (!resource || typeof resource.x === 'undefined' || typeof resource.y === 'undefined') {
        continue;
      }

      // Calculate distance to resource
      const xDifference = Math.abs(Math.floor(resource.x - this.parentEntity.posX));
      const yDifference = Math.abs(Math.floor(resource.y - this.parentEntity.posY));

      // Check if resource is within collection range
      if (xDifference <= this.collectionRange && yDifference <= this.collectionRange) {
        
        // Try to collect the resource
        if (this.addResource(resource)) {
          // Remove resource from global list since it's been collected
          delete fruits[key];
        }

        // If at max capacity, start drop-off process
        if (this.isAtMaxLoad()) {
          const dropPointX = 0; // Default drop-off coordinates
          const dropPointY = 0;
          this.startDropOff(dropPointX, dropPointY);
          break; // Stop collecting, go drop off
        }
      }
    }
  }

  /**
   * Updates the resource manager state each frame.
   * Should be called from the entity's update loop.
   */
  update() {
    // Only check for resources if not currently dropping off
    if (!this.isDroppingOff) {
      this.checkForNearbyResources();
    }
  }

  /**
   * Gets debug information about the resource manager state.
   *
   * @returns {Object} Debug information object
   */
  getDebugInfo() {
    return {
      currentLoad: this.getCurrentLoad(),
      maxCapacity: this.maxCapacity,
      remainingCapacity: this.getRemainingCapacity(),
      isDroppingOff: this.isDroppingOff,
      isAtMaxCapacity: this.isAtMaxCapacity,
      collectionRange: this.collectionRange,
      resourceTypes: this.resources.g_map(r => r.type || 'unknown')
    };
  }

  /**
   * Forces the entity to drop all resources immediately without moving.
   * Useful for debugging or emergency situations.
   */
  forceDropAll() {
    const dropped = this.dropAllResources();
    console.log(`ResourceManager: Force dropped ${dropped.length} resources`);
    return dropped;
  }
}

// Export for Node.js compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = ResourceManager;
}
