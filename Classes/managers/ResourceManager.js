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
   * @param {number} [maxCapacity=6] - Maximum number of resources the entity can carry
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
    
    // Selection/interaction state
    this.selectedResourceType = null; // Currently selected resource type for interaction
    this.highlightSelectedType = true; // Whether to highlight selected resource type
    this.focusedCollection = false; // Whether to only collect selected resource type
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
    // Allow explicit processing of drop-off even if isDroppingOff isn't true.
    if (globalResourceArray) {
      const droppedResources = this.dropAllResources();

      // Add resources to global collection and notify resources
      for (let resource of droppedResources) {
        if (resource && typeof resource.drop === 'function') {
          try { resource.drop(); } catch (e) { /* best-effort */ }
        }
        globalResourceArray.push(resource);

        // --- update aggregated totals so tasks/UI can read progress ---
        try {
          const rtype = resource.type || resource.resourceType || resource._type || 'misc';
          const ramt = (typeof resource.amount === 'number') ? resource.amount : 1;
          addGlobalResource(rtype, ramt);
        } catch (e) { /* ignore totals update errors */ }
      }

      return droppedResources;
    }
    return [];
  }

  /**
   * Scans for nearby resources and attempts to collect them.
   * Uses the global resource system to find available resources.
   */
  checkForNearbyResources() {
    // Check if g_resourceManager (ResourceSystemManager) is available globally
    let resourceSystem = null;
    let fruits = [];

    // Try new ResourceSystemManager first
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.getResourceList === 'function') {
      resourceSystem = g_resourceManager;
      fruits = g_resourceManager.getResourceList();
    }
    // Fallback to old g_resourceList for compatibility
    else if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') {
      fruits = g_resourceList.getResourceList();
    } else {
      return; // No resource system available
    }

    // If the resource list is an array (common case), iterate backwards so we can splice safely
    if (Array.isArray(fruits)) {
      for (let i = fruits.length - 1; i >= 0; i--) {
        const resource = fruits[i];
        if (!resource) continue;

        const rx = (typeof resource.x !== 'undefined') ? resource.x : (resource.posX || (resource.getPosition && resource.getPosition().x));
        const ry = (typeof resource.y !== 'undefined') ? resource.y : (resource.posY || (resource.getPosition && resource.getPosition().y));
        if (typeof rx === 'undefined' || typeof ry === 'undefined') continue;

        const xDifference = Math.abs(Math.floor(rx - (this.parentEntity.posX || (this.parentEntity.getPosition && this.parentEntity.getPosition().x))));
        const yDifference = Math.abs(Math.floor(ry - (this.parentEntity.posY || (this.parentEntity.getPosition && this.parentEntity.getPosition().y))));

        if (xDifference <= this.collectionRange && yDifference <= this.collectionRange) {
          // Check if focused collection is enabled and if so, only collect selected type
          if (this.focusedCollection && this.selectedResourceType) {
            const resourceType = resource.type || resource._type || resource.resourceType;
            if (resourceType !== this.selectedResourceType) {
              continue; // Skip resources that don't match selected type
            }
          }
          
          // Try to collect the resource
          if (this.addResource(resource)) {
            // Notify the resource it's being picked up if it supports that API
            if (resource && typeof resource.pickUp === 'function') {
              try { resource.pickUp(this.parentEntity); } catch (e) { /* best-effort */ }
            }
            // Remove from resource system
            if (resourceSystem && typeof resourceSystem.removeResource === 'function') {
              resourceSystem.removeResource(resource);
            } else {
              // Fallback to array splice for old system
              fruits.splice(i, 1);
            }
          }

          if (this.isAtMaxLoad()) {
            const dropPointX = 0; // Default drop-off coordinates
            const dropPointY = 0;
            this.startDropOff(dropPointX, dropPointY);
            break; // Stop collecting, go drop off
          }
        }
      }
    } else if (fruits && typeof fruits === 'object') {
      // Fallback for object/dictionary shaped resource stores
      const keys = Object.keys(fruits);
      for (let key of keys) {
        const resource = fruits[key];
        if (!resource) continue;

        const rx = (typeof resource.x !== 'undefined') ? resource.x : (resource.posX || (resource.getPosition && resource.getPosition().x));
        const ry = (typeof resource.y !== 'undefined') ? resource.y : (resource.posY || (resource.getPosition && resource.getPosition().y));
        if (typeof rx === 'undefined' || typeof ry === 'undefined') continue;

        const xDifference = Math.abs(Math.floor(rx - (this.parentEntity.posX || (this.parentEntity.getPosition && this.parentEntity.getPosition().x))));
        const yDifference = Math.abs(Math.floor(ry - (this.parentEntity.posY || (this.parentEntity.getPosition && this.parentEntity.getPosition().y))));

        if (xDifference <= this.collectionRange && yDifference <= this.collectionRange) {
          if (this.addResource(resource)) {
            if (resource && typeof resource.pickUp === 'function') {
              try { resource.pickUp(this.parentEntity); } catch (e) { /* best-effort */ }
            }
            // remove key from object store
            delete fruits[key];
          }

          if (this.isAtMaxLoad()) {
            const dropPointX = 0; // Default drop-off coordinates
            const dropPointY = 0;
            this.startDropOff(dropPointX, dropPointY);
            break; // Stop collecting, go drop off
          }
        }
      }
    }
  }

  /**
   * Selects a resource type for focused interaction.
   * This allows the UI to highlight or filter resources of a specific type.
   *
   * @param {string} resourceType - The type of resource to select ('wood', 'food', 'stone', etc.)
   */
  selectResource(resourceType) {
    const previousSelection = this.selectedResourceType;
    this.selectedResourceType = resourceType;
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`ResourceManager: Selected resource type: ${resourceType} (was: ${previousSelection})`);
    } else {
      console.log(`ResourceManager: Selected resource type: ${resourceType} (was: ${previousSelection})`);
    }
    
    // Notify global resource system if available
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.setSelectedType === 'function') {
      g_resourceManager.setSelectedType(resourceType);
    } else if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.setSelectedType === 'function') {
      g_resourceList.setSelectedType(resourceType);
    }
  }

  /**
   * Gets the currently selected resource type.
   *
   * @returns {string|null} The selected resource type, or null if none selected
   */
  getSelectedResourceType() {
    return this.selectedResourceType;
  }

  /**
   * Clears the current resource type selection.
   */
  clearResourceSelection() {
    const previousSelection = this.selectedResourceType;
    this.selectedResourceType = null;
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`ResourceManager: Cleared resource selection (was: ${previousSelection})`);
    } else {
      console.log(`ResourceManager: Cleared resource selection (was: ${previousSelection})`);
    }
    
    // Notify global resource system if available
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.setSelectedType === 'function') {
      g_resourceManager.setSelectedType(null);
    } else if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.setSelectedType === 'function') {
      g_resourceList.setSelectedType(null);
    }
  }

  /**
   * Checks if a specific resource type is currently selected.
   *
   * @param {string} resourceType - The resource type to check
   * @returns {boolean} True if the specified type is selected
   */
  isResourceTypeSelected(resourceType) {
    return this.selectedResourceType === resourceType;
  }

  /**
   * Gets all resources of the currently selected type from the global resource list.
   *
   * @returns {Array} Array of resources matching the selected type
   */
  getSelectedTypeResources() {
    if (!this.selectedResourceType) {
      return [];
    }
    
    // Try new ResourceSystemManager first
    if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.getSelectedTypeResources === 'function') {
      return g_resourceManager.getSelectedTypeResources();
    }
    
    // Fallback to old system
    if (typeof g_resourceList === 'undefined' || !g_resourceList.getResourceList) {
      return [];
    }
    
    const allResources = g_resourceList.getResourceList();
    if (!Array.isArray(allResources)) {
      return [];
    }
    
    return allResources.filter(resource => {
      if (!resource) return false;
      const resourceType = resource.type || resource._type || resource.resourceType;
      return resourceType === this.selectedResourceType;
    });
  }

  /**
   * Focuses collection on the selected resource type only.
   * When enabled, the entity will only collect resources of the selected type.
   *
   * @param {boolean} focusEnabled - Whether to enable focused collection
   */
  setFocusedCollection(focusEnabled) {
    this.focusedCollection = focusEnabled;
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`ResourceManager: Focused collection ${focusEnabled ? 'enabled' : 'disabled'} for type: ${this.selectedResourceType}`);
    } else {
      console.log(`ResourceManager: Focused collection ${focusEnabled ? 'enabled' : 'disabled'} for type: ${this.selectedResourceType}`);
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
      resourceTypes: Array.isArray(this.resources) ? this.resources.map(r => (r && (r.type || r._type)) || 'unknown') : []
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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceManager;
}

// === Global resource totals helpers ===
// Maintains aggregated counts of resources by type (updated on drop-off)
const _resourceTotals = {};

/**
 * Increment global total for a resource type.
 * @param {string} type
 * @param {number} amount
 */
function addGlobalResource(type, amount = 1) {
  if (!type) return;
  const amt = Number(amount) || 0;
  _resourceTotals[type] = (_resourceTotals[type] || 0) + amt;

  // Debug: show change and current totals
  try {
    console.log(`[ResourceManager] addGlobalResource: ${type} +${amt} -> ${_resourceTotals[type]}`);
    console.log('[ResourceManager] totals:', getResourceTotals());
    console.log('added resource')
  } catch (e) { /* ignore logging errors */ }

  return _resourceTotals[type];
}

/**
 * Remove/consume resource from global totals (returns true if successful).
 * @param {string} type
 * @param {number} amount
 */
function removeGlobalResource(type, amount = 1) {
  if (!type) return false;
  const amt = Number(amount) || 0;
  const have = _resourceTotals[type] || 0;
  if (have < amt) {
    console.warn(`[ResourceManager] removeGlobalResource failed: ${type} has ${have}, tried to remove ${amt}`);
    return false;
  }
  _resourceTotals[type] = have - amt;
  if (_resourceTotals[type] <= 0) delete _resourceTotals[type];

  // Debug: show change and current totals
  try {
    console.log(`[ResourceManager] removeGlobalResource: ${type} -${amt} -> ${_resourceTotals[type] || 0}`);
    console.log('[ResourceManager] totals:', getResourceTotals());
  } catch (e) { /* ignore logging errors */ }

  return true;
}

/**
 * Return a copy of the global resource totals map.
 * @returns {Object<string, number>}
 */
function getResourceTotals() {
  return Object.assign({}, _resourceTotals);
}

/**
 * Return count for a specific resource type, or total of all types if no type provided.
 * @param {string} [type]
 * @returns {number}
 */
function getResourceCount(type) {
  if (!type) {
    return Object.values(_resourceTotals).reduce((s, v) => s + v, 0);
  }
  return _resourceTotals[String(type)] || 0;
}

// Debug helper you can call from console or UI
function logResourceTotals() {
  try {
    console.log('test resource totals log:');
    console.log('[ResourceManager] current totals:', getResourceTotals());
  } catch (e) { /* ignore */ }
}

// expose to global for UI / Task systems
if (typeof window !== 'undefined') {
  window.addGlobalResource = window.addGlobalResource || addGlobalResource;
  window.removeGlobalResource = window.removeGlobalResource || removeGlobalResource;
  window.getResourceTotals = window.getResourceTotals || getResourceTotals;
  window.getResourceCount = window.getResourceCount || getResourceCount;
  window.logResourceTotals = window.logResourceTotals || logResourceTotals;
}
