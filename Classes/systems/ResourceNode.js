/**
 * ResourceNode System
 * ===================
 * Building-based resource spawning system for Ant Game.
 * 
 * Resource nodes are placed near buildings (trees, rocks, beehives, bushes) and spawn resources
 * when gathering-state ants work on them. Nodes track work progress visually and spawn
 * resources in circular batches when complete.
 * 
 * **IMPORTANT**: All position parameters use GRID COORDINATES (tiles), not pixel coordinates.
 * The system automatically converts to pixel coordinates using the terrain coordinate system.
 * 
 * Features:
 * - Ant detection within spawn radius (only GATHERING state)
 * - Visual progress indicators above nodes
 * - Weighted resource spawning (e.g., tree: 60% leaves, 30% sticks, 10% apples)
 * - Batch spawning (1-5 resources in circular distribution)
 * - Variable difficulty tiers (bush < tree < beehive < rock)
 * - Ant repositioning during gathering (every 3 seconds)
 * 
 * @class ResourceNode
 * @extends Entity
 */

// Node type definitions with properties
const NODE_TYPES = {
  tree: {
    workToGather: 100,
    spawnRadius: 2, // 2 tiles radius in grid coordinates
    resourceTypes: [
      { type: 'greenLeaf', weight: 0.6 },
      { type: 'stick', weight: 0.3 },
      { type: 'apple', weight: 0.1 }
    ],
    workRate: 1.0,
    batchSize: { min: 2, max: 4 },
    progressBarColor: '#228B22', // Forest green
    imagePath: 'Images/Buildings/tree.png',
    displayName: 'Tree'
  },
  rock: {
    workToGather: 200,
    spawnRadius: 2, // 2 tiles radius in grid coordinates
    resourceTypes: [
      { type: 'stone', weight: 1.0 }
    ],
    workRate: 0.5,
    batchSize: { min: 1, max: 2 },
    progressBarColor: '#808080', // Gray
    imagePath: 'Images/Buildings/rock.png',
    displayName: 'Rock'
  },
  beehive: {
    workToGather: 150,
    spawnRadius: 2, // 2 tiles radius in grid coordinates
    resourceTypes: [
      { type: 'honey', weight: 0.8 },
      { type: 'wax', weight: 0.2 }
    ],
    workRate: 0.75,
    batchSize: { min: 1, max: 3 },
    progressBarColor: '#FFD700', // Gold
    imagePath: 'Images/Buildings/beehive.png',
    displayName: 'Beehive'
  },
  bush: {
    workToGather: 80,
    spawnRadius: 2, // 2 tiles radius in grid coordinates
    resourceTypes: [
      { type: 'berry', weight: 0.7 },
      { type: 'greenLeaf', weight: 0.3 }
    ],
    workRate: 1.2,
    batchSize: { min: 3, max: 5 },
    progressBarColor: '#32CD32', // Lime green
    imagePath: 'Images/Buildings/bush.png',
    displayName: 'Bush'
  }
};

class ResourceNode extends Entity {
  /**
   * Create a resource node
   * @param {number} gridX - X position in grid coordinates (tiles)
   * @param {number} gridY - Y position in grid coordinates (tiles)
   * @param {string} nodeType - Type of node (tree, rock, beehive, bush)
   * @param {Object} options - Additional options
   */
  constructor(gridX, gridY, nodeType = 'tree', options = {}) {
    // Get node configuration
    const config = NODE_TYPES[nodeType];
    if (!config) {
      throw new Error(`Invalid node type: ${nodeType}. Valid types: ${Object.keys(NODE_TYPES).join(', ')}`);
    }

    // Convert grid coordinates to pixel coordinates using terrain system
    let pixelX, pixelY;
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.coordSys) {
      // Use the active map's coordinate system
      const pixelCoords = g_activeMap.coordSys.convPosToBackingCanvas([gridX, gridY]);
      pixelX = pixelCoords[0];
      pixelY = pixelCoords[1];
    } else {
      // Fallback: use TILE_SIZE if coordinate system not available
      const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
      pixelX = gridX * TILE_SIZE;
      pixelY = gridY * TILE_SIZE;
    }

    // Call parent constructor with Entity base (Entity uses pixel coordinates internally)
    super(pixelX, pixelY, 32, 32, {
      type: 'ResourceNode',
      imagePath: config.imagePath,
      selectable: false,
      useSpatialGrid: false, // Nodes are static, don't need spatial grid
      ...options
    });

    // Store grid coordinates
    this.gridX = gridX;
    this.gridY = gridY;
    
    // Node configuration
    this.nodeType = nodeType;
    this.config = config;
    
    // Work tracking
    this.currentWork = 0;
    this.workToGather = config.workToGather;
    this.workRate = config.workRate;
    
    // Spawn configuration
    this.spawnRadius = config.spawnRadius;
    this.resourceTypes = config.resourceTypes;
    this.batchSize = config.batchSize;
    
    // Visual properties
    this.progressBarColor = config.progressBarColor;
    this.displayName = config.displayName;
    this.progressBarHeight = 6;
    this.progressBarWidth = 40;
    this.progressBarOffset = -10; // Pixels above node
    
    // State tracking
    this.isActive = true;
    this.lastSpawnTime = 0;
    this.flashTimer = 0; // For visual feedback when spawning
    
    // Ant tracking
    this.nearbyAnts = [];
    this.lastAntCheck = 0;
    this.antCheckInterval = 500; // Check every 500ms
    this.lastAntRepositionTime = 0;
    this.antRepositionInterval = 3000; // Reposition every 3 seconds
    
    // Performance optimization - cache spatial queries
    this._cachedNearbyEntities = null;
    this._cacheTime = 0;
    this._cacheLifetime = 1000; // 1 second cache
  }

  /**
   * Add work progress from gathering ants
   * @param {number} amount - Amount of work to add
   * @returns {boolean} - True if work was added
   */
  addWork(amount) {
    if (!this.isActive || this.currentWork >= this.workToGather) {
      return false;
    }
    
    this.currentWork = Math.min(this.currentWork + amount, this.workToGather);
    return true;
  }

  /**
   * Get current work progress as percentage (0-1)
   * @returns {number} - Progress from 0 to 1
   */
  getProgress() {
    return this.currentWork / this.workToGather;
  }

  /**
   * Check if node is ready to spawn resources
   * @returns {boolean}
   */
  isReadyToSpawn() {
    return this.currentWork >= this.workToGather;
  }

  /**
   * Reset work progress after spawning
   */
  resetWork() {
    this.currentWork = 0;
    this.lastSpawnTime = Date.now();
    this.flashTimer = 300; // Flash for 300ms
  }

  /**
   * Detect nearby ants within spawn radius (only GATHERING state)
   * @returns {Array} - Array of gathering-state ants
   */
  detectNearbyAnts() {
    const now = Date.now();
    
    // Use cached results if available
    if (this._cachedNearbyEntities && (now - this._cacheTime) < this._cacheLifetime) {
      return this._filterGatheringAnts(this._cachedNearbyEntities);
    }
    
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    const spawnRadiusPixels = this.spawnRadius * TILE_SIZE;
    
    // Use spatial grid manager for efficient proximity queries
    if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
      const entities = spatialGridManager.getNearbyEntities(
        this.getPosition().x,
        this.getPosition().y,
        spawnRadiusPixels
      );
      
      this._cachedNearbyEntities = entities;
      this._cacheTime = now;
      
      return this._filterGatheringAnts(entities);
    }
    
    // No spatial grid available - return empty array
    console.warn('ResourceNode: spatialGridManager not available for ant detection');
    return [];
  }

  /**
   * Filter ants to only include those in GATHERING state
   * @private
   * @param {Array} entities - Array of entities to filter
   * @returns {Array} - Array of gathering-state ants
   */
  _filterGatheringAnts(entities) {
    if (!entities || !Array.isArray(entities)) return [];
    
    return entities.filter(entity => {
      // Check if entity is an ant
      if (!entity || entity.type !== 'Ant') return false;
      
      // Check if ant has state machine
      if (!entity.stateMachine) return false;
      
      // Check if ant is in GATHERING state
      const currentState = entity.stateMachine.getCurrentState 
        ? entity.stateMachine.getCurrentState()
        : entity.stateMachine.currentState;
      
      return currentState === 'GATHERING' || currentState === 'gathering';
    });
  }

  /**
   * Check if an ant is within spawn radius
   * @param {Object} ant - Ant entity to check
   * @returns {boolean}
   */
  isAntInRange(ant) {
    if (!ant) return false;
    
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    
    // Get positions in pixels
    const nodePos = this.getPosition();
    const antPos = ant.getPosition ? ant.getPosition() : { x: ant.x || 0, y: ant.y || 0 };
    
    // Calculate spawn radius in pixels
    const spawnRadiusPixels = this.spawnRadius * TILE_SIZE;
    
    const dx = nodePos.x - antPos.x;
    const dy = nodePos.y - antPos.y;
    const distanceSquared = dx * dx + dy * dy;
    
    return distanceSquared <= (spawnRadiusPixels * spawnRadiusPixels);
  }

  /**
   * Select resource type based on weighted randomization
   * @returns {string} - Resource type identifier
   */
  selectResourceType() {
    const totalWeight = this.resourceTypes.reduce((sum, rt) => sum + rt.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const resourceType of this.resourceTypes) {
      random -= resourceType.weight;
      if (random <= 0) {
        return resourceType.type;
      }
    }
    
    // Fallback to first type
    return this.resourceTypes[0].type;
  }

  /**
   * Spawn a single resource at the node position
   * @param {string} resourceType - Type of resource to spawn
   * @returns {Object|null} - Spawned resource object or null
   */
  spawnResource(resourceType) {
    // Check if resource manager is available
    if (typeof g_entityInventoryManager === 'undefined' || !g_entityInventoryManager) {
      console.warn('ResourceNode: g_entityInventoryManager not available');
      return null;
    }
    
    const nodePos = this.getPosition();
    
    // Spawn resource at node position (resource manager will handle exact placement)
    const resource = g_entityInventoryManager.spawnResource(resourceType, nodePos.x, nodePos.y);
    
    return resource;
  }

  /**
   * Spawn a batch of resources in circular distribution around node
   * @returns {Array} - Array of spawned resource objects
   */
  spawnBatch() {
    if (!this.isReadyToSpawn()) {
      return [];
    }
    
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    const spawnedResources = [];
    const batchCount = Math.floor(
      Math.random() * (this.batchSize.max - this.batchSize.min + 1) + this.batchSize.min
    );
    
    const nodePos = this.getPosition();
    const angleStep = (Math.PI * 2) / batchCount;
    const spawnDistance = 0.75 * TILE_SIZE; // Spawn resources ~0.75 tiles from node center
    
    for (let i = 0; i < batchCount; i++) {
      const angle = angleStep * i;
      const x = nodePos.x + Math.cos(angle) * spawnDistance;
      const y = nodePos.y + Math.sin(angle) * spawnDistance;
      
      const resourceType = this.selectResourceType();
      
      // Spawn resource at calculated position
      if (typeof g_entityInventoryManager !== 'undefined' && g_entityInventoryManager) {
        const resource = g_entityInventoryManager.spawnResource(resourceType, x, y);
        if (resource) {
          spawnedResources.push(resource);
        }
      }
    }
    
    // Reset work progress
    this.resetWork();
    
    return spawnedResources;
  }

  /**
   * Reposition ants around the node in circular pattern
   * @param {Array} gatheringAnts - Array of ants to reposition
   */
  repositionAnts(gatheringAnts) {
    if (!gatheringAnts || gatheringAnts.length === 0) return;
    
    const TILE_SIZE = typeof window !== 'undefined' && window.TILE_SIZE ? window.TILE_SIZE : 32;
    const nodePos = this.getPosition();
    const angleStep = (Math.PI * 2) / gatheringAnts.length;
    const workDistance = this.spawnRadius * TILE_SIZE * 0.7; // 70% of spawn radius in pixels
    
    gatheringAnts.forEach((ant, index) => {
      const angle = angleStep * index;
      const targetX = nodePos.x + Math.cos(angle) * workDistance;
      const targetY = nodePos.y + Math.sin(angle) * workDistance;
      
      // Move ant to new position
      if (ant.moveToLocation) {
        ant.moveToLocation(targetX, targetY);
      }
    });
  }

  /**
   * Render progress bar above the node
   */
  renderProgressBar() {
    if (!this.isActive || this.currentWork === 0) return;
    
    // Get p5.js instance (global or from window)
    const p = typeof window !== 'undefined' ? window : globalThis;
    if (typeof p.push !== 'function') return; // p5 not available
    
    const nodePos = this.getPosition();
    const progress = this.getProgress();
    
    p.push();
    
    // Position above node
    const barX = nodePos.x - this.progressBarWidth / 2;
    const barY = nodePos.y + this.progressBarOffset;
    
    // Background bar (gray)
    p.fill(60, 60, 60, 200);
    p.noStroke();
    p.rect(barX, barY, this.progressBarWidth, this.progressBarHeight);
    
    // Progress bar (colored)
    if (progress > 0) {
      p.fill(this.progressBarColor);
      p.rect(barX, barY, this.progressBarWidth * progress, this.progressBarHeight);
    }
    
    // Flash effect when spawning
    if (this.flashTimer > 0) {
      const alpha = (this.flashTimer / 300) * 255;
      p.fill(255, 255, 255, alpha);
      p.rect(barX, barY, this.progressBarWidth, this.progressBarHeight);
    }
    
    // Border
    p.stroke(0);
    p.strokeWeight(1);
    p.noFill();
    p.rect(barX, barY, this.progressBarWidth, this.progressBarHeight);
    
    p.pop();
  }

  /**
   * Update node state
   * @param {number} deltaTime - Time elapsed since last update (ms)
   */
  update(deltaTime = 16) {
    if (!this.isActive) return;
    
    const now = Date.now();
    
    // Update flash timer
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - deltaTime);
    }
    
    // Detect nearby ants periodically
    if (now - this.lastAntCheck > this.antCheckInterval) {
      this.nearbyAnts = this.detectNearbyAnts();
      this.lastAntCheck = now;
    }
    
    // Add work from nearby gathering ants
    if (this.nearbyAnts.length > 0 && !this.isReadyToSpawn()) {
      const workPerAnt = this.workRate * (deltaTime / 1000) * 60; // Normalize to 60fps
      const totalWork = workPerAnt * this.nearbyAnts.length;
      this.addWork(totalWork);
    }
    
    // Reposition ants periodically
    if (this.nearbyAnts.length > 0 && now - this.lastAntRepositionTime > this.antRepositionInterval) {
      this.repositionAnts(this.nearbyAnts);
      this.lastAntRepositionTime = now;
    }
    
    // Auto-spawn when ready
    if (this.isReadyToSpawn()) {
      this.spawnBatch();
    }
  }

  /**
   * Render the node
   */
  render() {
    // Render base entity (sprite)
    if (super.render) {
      super.render();
    }
    
    // Render progress bar
    this.renderProgressBar();
  }

  /**
   * Deactivate the node (stops spawning)
   */
  deactivate() {
    this.isActive = false;
    this.currentWork = 0;
    this.nearbyAnts = [];
  }

  /**
   * Activate the node (resumes spawning)
   */
  activate() {
    this.isActive = true;
  }

  /**
   * Get node statistics for debugging
   * @returns {Object}
   */
  getStats() {
    return {
      nodeType: this.nodeType,
      displayName: this.displayName,
      gridX: this.gridX,
      gridY: this.gridY,
      isActive: this.isActive,
      currentWork: this.currentWork,
      workToGather: this.workToGather,
      progress: this.getProgress(),
      nearbyAntsCount: this.nearbyAnts.length,
      isReadyToSpawn: this.isReadyToSpawn(),
      lastSpawnTime: this.lastSpawnTime
    };
  }

  /**
   * Get grid coordinates (read-only)
   * @returns {Object} - {x, y} in grid coordinates
   */
  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }
}

// Export for module systems and browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResourceNode, NODE_TYPES };
} else {
  // Browser global
  if (typeof window !== 'undefined') {
    window.ResourceNode = ResourceNode;
    window.NODE_TYPES = NODE_TYPES;
  }
}
