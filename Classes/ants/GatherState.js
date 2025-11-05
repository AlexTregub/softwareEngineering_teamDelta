/**
 * @fileoverview GatherState - Autonomous resource gathering behavior for ants
 * @module GatherState
 * @author Software Engineering Team Delta - AI Assistant
 * @version 1.0.0
 */

/**
 * GatherState handles autonomous resource detection and collection within a 7-grid radius.
 * Ants in this state will continuously scan for resources, move to collect them,
 * and transition to drop-off behavior when at capacity.
 * 
 * Features:
 * - 7-grid tile radius resource detection (224 pixel radius with 32px tiles)
 * - Prioritized resource selection (closest first)
 * - Automatic pathfinding to resources
 * - Inventory management and capacity checking
 * - State transitions (to DROPPING_OFF when full, back to IDLE when done)
 * 
 * @class GatherState
 */
class GatherState {
  /**
   * Creates a new GatherState behavior handler
   * @param {Object} ant - The ant entity this state controls
   */
  constructor(ant) {
    this.ant = ant;
    this.gatherRadius = 7; // Grid tiles (7 * 32 = 224 pixels)
    this.pixelRadius = this.gatherRadius * 32; // Convert to pixels (default TILE_SIZE = 32)
    
    // State tracking
    this.targetResource = null;
    this.searchCooldown = 0;
    this.searchInterval = 30; // frames between resource scans (0.5 sec at 60fps)
    this.isActive = false;
    
    // Timeout mechanism
    this.gatherTimeout = 6000; // 6 seconds in milliseconds
    this.gatherStartTime = 0; // Track when gathering started
    this.lastResourceFoundTime = 0; // Track when we last found a resource
    
    // Continuous gathering
    this.keepGathering = true; // Continue gathering until max capacity
    this.resourcesCollected = 0; // Track resources collected this session
    
    // Debug info
    this.debugEnabled = false; // Temporarily enable debug for testing
    this.lastScanResults = 0;
    
    logVerbose(`🔍 GatherState initialized for ant - radius: ${this.gatherRadius} tiles (${this.pixelRadius}px)`);
  }

  /**
   * Activate the gather state
   */
  enter() {
    this.isActive = true;
    this.targetResource = null;
    this.searchCooldown = 0;
    this.gatherStartTime = 0;
    
    // Set ant to GATHERING primary state
    if (this.ant._stateMachine) {
      this.ant._stateMachine.setPrimaryState("GATHERING");
    }
    
    if (this.debugEnabled) {
      logNormal(`🐜 Ant ${this.ant._antIndex || 'unknown'} entered GATHER state`);
    }
  }

  /**
   * Deactivate the gather state
   */
  exit() {
    this.isActive = false;
    this.targetResource = null;
    
    if (this.debugEnabled) {
      logNormal(`🐜 Ant ${this.ant._antIndex || 'unknown'} exited GATHER state`);
    }

    return true
  }

  /**
   * Main update loop for gathering behavior
   * Called every frame while ant is in GATHERING state
   */
  update() {
    if (!this.isActive) return;

    // Check if ant is at max capacity - switch to drop-off state
    if (this.isAtMaxCapacity()) {
      this.transitionToDropOff();
      return;
    }

    // Update search cooldown
    if (this.searchCooldown > 0) {
      this.searchCooldown--;
    }

    // If we have a target resource, move toward it
    if (this.targetResource) {
      if (this.debugEnabled) {
        logNormal(`🎯 Ant ${this.ant.id} moving toward resource at (${this.targetResource.x}, ${this.targetResource.y})`);
      }
      this.updateTargetMovement();
      this.gatherStartTime  = 0;
    } 
    // Otherwise, search for new resources
    else if (this.searchCooldown <= 0) {
      if (this.debugEnabled) {
        logNormal(`🔍 Ant ${this.ant.id} searching for resources...`);
      }
      this.searchForResources();
      this.searchCooldown = this.searchInterval;
    }
    this.gatherStartTime +=  deltaTime;

    if (this.gatherStartTime >= this.gatherTimeout) { return this.exit() }
  }

  /**
   * Search for resources within the 7-grid radius
   * @returns {Array} Array of resources found within range
   */
  searchForResources() {
    const antPos = this.getAntPosition();
    if (!antPos) {
      if (this.debugEnabled) logNormal(`❌ Ant ${this.ant.id} could not get position for resource search`);
      return [];
    }

    const nearbyResources = this.getResourcesInRadius(antPos.x, antPos.y, this.pixelRadius);
    this.lastScanResults = nearbyResources.length;

    if (this.debugEnabled) {
      logNormal(`🔍 Ant ${this.ant.id} found ${nearbyResources.length} resources within ${this.gatherRadius} tiles`);
    }

    if (nearbyResources.length > 0) {
      // Sort by distance (closest first)
      nearbyResources.sort((a, b) => {
        const distA = this.getDistance(antPos.x, antPos.y, a.x, a.y);
        const distB = this.getDistance(antPos.x, antPos.y, b.x, b.y);
        return distA - distB;
      });

      // Select the closest resource as target
      this.targetResource = nearbyResources[0];
      
      if (this.debugEnabled) {
        logNormal(`🔍 Found ${nearbyResources.length} resources, targeting closest at (${this.targetResource.x}, ${this.targetResource.y})`);
      }
    }

    return nearbyResources;
  }

  /**
   * Get all resources within the specified radius of a position
   * @param {number} centerX - Center X coordinate 
   * @param {number} centerY - Center Y coordinate
   * @param {number} radius - Search radius in pixels
   * @returns {Array} Array of resources within radius
   */
  getResourcesInRadius(centerX, centerY, radius) {
    const nearbyResources = [];
    
    try {
      // Try to get resources from the unified resource system
      let resourceList = [];
      
      if (typeof resourceManager !== 'undefined' && resourceManager) {
        resourceList = resourceManager.getResourceList ? resourceManager.getResourceList() : [];
        if (this.debugEnabled) {
          logNormal(`🔍 Using resourceManager, found ${resourceList.length} total resources`);
        }
      }

      // Check each resource
      for (let i = 0; i < resourceList.length; i++) {
        const resource = resourceList[i];
        if (!resource) continue;

        // Get resource position
        const rx = resource.x !== undefined ? resource.x : 
                  resource.posX !== undefined ? resource.posX :
                  (resource.getPosition && resource.getPosition().x);
        const ry = resource.y !== undefined ? resource.y :
                  resource.posY !== undefined ? resource.posY :
                  (resource.getPosition && resource.getPosition().y);

        if (rx === undefined || ry === undefined) continue;

        // Check if resource is within radius
        const distance = this.getDistance(centerX, centerY, rx, ry);
        if (distance <= radius) {
          nearbyResources.push({
            resource: resource,
            x: rx,
            y: ry,
            distance: distance,
            type: resource.type || resource._type || resource.resourceType || 'unknown'
          });
        }
      }
    } catch (error) {
      console.warn('GatherState: Error scanning for resources:', error);
    }

    return nearbyResources;
  }

  /**
   * Update movement toward the current target resource
   */
  updateTargetMovement() {
    if (!this.targetResource) return;

    const antPos = this.getAntPosition();
    if (!antPos) return;

    // Check if we've reached the target resource
    const distance = this.getDistance(antPos.x, antPos.y, this.targetResource.x, this.targetResource.y);
    const collectionRange = 15; // pixels - close enough to collect

    if (distance <= collectionRange) {
      this.attemptResourceCollection();
    } else {
      // Move toward the resource
      this.moveToResource(this.targetResource.x, this.targetResource.y);
    }
  }

  /**
   * Attempt to collect the target resource
   */
  attemptResourceCollection() {
    if (!this.targetResource) return;

    try {
      // Try to collect the resource using the ant's resource manager
      let collected = false;
      collected = this.ant._resourceManager.addResource(this.targetResource.resource);

      if (collected) {
        // Remove resource from global system
        this.removeResourceFromSystem(this.targetResource.resource);
        
        if (this.debugEnabled) {
          logNormal(`✅ Collected ${this.targetResource.type} resource`);
        }
      }
    } catch (error) {
      console.warn('GatherState: Error collecting resource:', error);
    }

    // Clear target regardless of success/failure
    this.targetResource = null;
  }

  /**
   * Remove a resource from the global resource system
   * @param {Object} resource - The resource to remove
   */
  removeResourceFromSystem(resource) {
    try {
      // Try unified resource system first
      if (typeof resourceManager !== 'undefined' && resourceManager && resourceManager.removeResource) {
        resourceManager.removeResource(resource);
      }
    } catch (error) {
      console.warn('GatherState: Error removing resource from system:', error);
    }
  }

  /**
   * Move the ant toward a target position
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate  
   */
  moveToResource(targetX, targetY) {
    try {
      if (this.ant._movementController && this.ant._movementController.moveToLocation) {
        this.ant._movementController.moveToLocation(targetX, targetY);
      }
    } catch (error) {
      console.warn('GatherState: Error moving to resource:', error);
    }
  }

  /**
   * Check if ant is at maximum carrying capacity
   * @returns {boolean} True if ant is at max capacity
   */
  isAtMaxCapacity() {
    try {
      if (this.ant._resourceManager) {
        return this.ant._resourceManager.isAtMaxLoad && this.ant._resourceManager.isAtMaxLoad();
      }
    } catch (error) {
      console.warn('GatherState: Error checking capacity:', error);
    }
    return false;
  }

  /**
   * Transition ant to drop-off state when at capacity
   */
  transitionToDropOff() {
    if (this.debugEnabled) {
      logNormal(`📦 Ant ${this.ant._antIndex || 'unknown'} at max capacity, transitioning to drop-off`);
    }

    // Set ant to DROPPING_OFF state
    if (this.ant._stateMachine) {
      this.ant._stateMachine.setPrimaryState("DROPPING_OFF");
    }

    // If the ant has a resource manager with drop-off functionality, use it
    if (this.ant._resourceManager && this.ant._resourceManager.startDropOff) {
      // Find nearest drop-off location (default to origin for now)
      this.ant._resourceManager.startDropOff(0, 0);
    }

    this.exit();
  }

  /**
   * Get the ant's current position
   * @returns {Object|null} Position object with x, y properties
   */
  getAntPosition() {
    try {
      if (this.ant.getPosition) {
        return this.ant.getPosition();
      } else if (this.ant.posX !== undefined && this.ant.posY !== undefined) {
        return { x: this.ant.posX, y: this.ant.posY };
      }
    } catch (error) {
      console.warn('GatherState: Error getting ant position:', error);
    }
    return null;
  }

  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y  
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance in pixels
   */
  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get debug information about the gather state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      isActive: this.isActive,
      gatherRadius: `${this.gatherRadius} tiles (${this.pixelRadius}px)`,
      hasTarget: !!this.targetResource,
      targetType: this.targetResource ? this.targetResource.type : 'none',
      searchCooldown: this.searchCooldown,
      lastScanResults: this.lastScanResults,
      atCapacity: this.isAtMaxCapacity()
    };
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled - Whether to enable debug output
   */
  setDebugEnabled(enabled) {
    this.debugEnabled = enabled;
    logNormal(`🐛 GatherState debug ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GatherState;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
  window.GatherState = GatherState;
}