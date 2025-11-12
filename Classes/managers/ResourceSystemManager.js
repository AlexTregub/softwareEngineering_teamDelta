/**
 * @fileoverview ResourceSystemManager - Unified resource management system
 * Combines resource collection (resourcesArray) and spawning (ResourceSpawner) functionality
 * with enhanced resource type selection and UI integration capabilities.
 *
 */

/**
 * Manages the complete resource ecosystem including collection, spawning, and selection.
 * Combines the functionality of resourcesArray and ResourceSpawner into a unified system.
 *
 * @class ResourceSystemManager
 */
class ResourceSystemManager {
  /**
   * Creates a new ResourceSystemManager.
   *
   * @param {number} [spawnInterval=1] - Time between spawns in seconds
   * @param {number} [maxCapacity=50] - Maximum number of resources to maintain
   * @param {Object} [options={}] - Configuration options
   */
  constructor(spawnInterval = 1, maxCapacity = 50, options = {}) {
    // Resource collection (resourcesArray functionality)
    this.resources = [];
    
    // Resource spawning (ResourceSpawner functionality)
    this.maxCapacity = maxCapacity;
    this.spawnInterval = spawnInterval;
    this.timer = null;
    this.isActive = false;
    
    // Resource selection and UI integration
    this.selectedResourceType = null;
    this.highlightSelectedType = false;
    this.focusedCollection = false;
    
    // Spawning configuration
    this.assets = {
      greenLeaf: { 
        weight: 0.5, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createGreenLeaf(x, y);
        }
      },

      mapleLeaf: { 
        weight: 0.8, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createMapleLeaf(x, y);
        }
      },

      stick: { 
        weight: 0.6, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createStick(x, y);
        }
      },

      stone: { 
        weight: 0.3, 
        make: () => {
          const x = random(0, g_canvasX - 20);
          const y = random(0, g_canvasY - 20);
          return Resource.createStone(x, y);
        }
      },
    };

    // Configuration options
    this.options = {
      autoStart: true,
      enableLogging: true,
      ...options
    };

    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal('ResourceSystemManager: Initialized with spawn interval:', spawnInterval, 'max capacity:', maxCapacity);
    } else {
      logNormal('ResourceSystemManager: Initialized with spawn interval:', spawnInterval, 'max capacity:', maxCapacity);
    }

    // Initialize the system
    this._initialize();
  }

  /**
   * Initialize the resource system based on game state.
   * @private
   */
  _initialize() {
    // Register for game state changes to start/stop spawning automatically
    if (typeof GameState !== 'undefined') {
      GameState.onStateChange((newState, oldState) => {
        if (newState === 'PLAYING') {
          this.startSpawning();
        } else {
          this.stopSpawning();
        }
      });

      // If we're already in PLAYING state when created, start immediately
      if (GameState.getState() === 'PLAYING' && this.options.autoStart) {
        this.startSpawning();
      }
    } else {
      // Fallback for environments without GameState (like tests) - start immediately if autoStart is enabled
      if (this.options.autoStart) {
        this.startSpawning();
      }
    }
  }

  // ===== RESOURCE COLLECTION METHODS (resourcesArray functionality) =====

  /**
   * Gets the array of all resources in the system.
   *
   * @returns {Array} Array of resource objects
   */
  getResourceList() {
    return this.resources;
  }

  /**
   * Adds a resource to the collection.
   *
   * @param {Object} resource - The resource to add
   * @returns {boolean} True if added successfully, false if at capacity
   */
  addResource(resource) {
    if (this.resources.length >= this.maxCapacity) {
      return false;
    }
    
    this.resources.push(resource);
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`ResourceSystemManager: Added resource (${this.resources.length}/${this.maxCapacity})`);
    }
    
    return true;
  }

  /**
   * Removes a specific resource from the collection.
   *
   * @param {Object} resource - The resource to remove
   * @returns {boolean} True if removed, false if not found
   */
  removeResource(resource) {
    const index = this.resources.indexOf(resource);
    if (index > -1) {
      this.resources.splice(index, 1);
      
      if (typeof globalThis.logVerbose === 'function') {
        globalThis.logVerbose(`ResourceSystemManager: Removed resource (${this.resources.length}/${this.maxCapacity})`);
      }
      
      return true;
    }
    return false;
  }

  /**
   * Removes all resources from the collection.
   *
   * @returns {Array} Array of removed resources
   */
  clearAllResources() {
    const removedResources = [...this.resources];
    this.resources = [];
    
    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal(`ResourceSystemManager: Cleared ${removedResources.length} resources`);
    } else {
      logNormal(`ResourceSystemManager: Cleared ${removedResources.length} resources`);
    }
    
    return removedResources;
  }

  /**
   * Renders all resources in the collection.
   */
  drawAll() {
    for (const r of this.resources) {
      console.log(r);
      // Prefer modern Entity/Controller render path; fallback to legacy draw if encountered
      try {
        if (r && typeof r.render === 'function') r.render();
        else if (r && typeof r.draw === 'function') r.draw();
      } catch (e) { /* tolerate faulty draw implementations */ }
    }
  }

  /**
   * Updates all resources in the collection.
   */
  updateAll() {
    for (const r of this.resources) {
      try {
        if (r && typeof r.update === 'function') r.update();
      } catch (_) { /* ignore individual update errors */ }
    }
  }

  // ===== RESOURCE SPAWNING METHODS (ResourceSpawner functionality) =====

  /**
   * Start the resource spawning timer.
   */
  startSpawning() {
    if (!this.isActive) {
      this.isActive = true;
      this.timer = setInterval(() => this.spawn(), this.spawnInterval * 1000);
      
      if (typeof globalThis.logNormal === 'function') {
        globalThis.logNormal('ResourceSystemManager: Started spawning resources');
      } else {
        logNormal('ResourceSystemManager: Started spawning resources');
      }
    }
  }

  /**
   * Stop the resource spawning timer.
   */
  stopSpawning() {
    if (this.isActive) {
      this.isActive = false;
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      if (typeof globalThis.logNormal === 'function') {
        globalThis.logNormal('ResourceSystemManager: Stopped spawning resources');
      } else {
        logNormal('ResourceSystemManager: Stopped spawning resources');
      }
    }
  }

  /**
   * Spawn a new resource based on weighted random selection.
   * @private
   */
  spawn() {
    // Only spawn if active and not at capacity
    if (!this.isActive || this.resources.length >= this.maxCapacity) return;

    let keys = Object.keys(this.assets);
    let total = keys.reduce((sum, k) => sum + this.assets[k].weight, 0);
    let r = random() * total;

    let chosenKey;
    for (let k of keys) {
      r -= this.assets[k].weight;
      if (r <= 0) {
        chosenKey = k;
        break;
      }
    }

    let chosen = this.assets[chosenKey].make();
    this.addResource(chosen);
    
    if (typeof globalThis.logDebug === 'function') {
      globalThis.logDebug(`ResourceSystemManager: Spawned ${chosenKey} at (${chosen.getPosition ? chosen.getPosition().x : chosen.x}, ${chosen.getPosition ? chosen.getPosition().y : chosen.y})`);
    }
  }

  /**
   * Manually spawn a resource for testing or immediate spawning.
   */
  forceSpawn() {
    const wasActive = this.isActive;
    this.isActive = true; // Temporarily enable for this spawn
    this.spawn();
    this.isActive = wasActive; // Restore previous state
  }

  // ===== RESOURCE SELECTION METHODS (UI Integration) =====

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
      globalThis.logVerbose(`ResourceSystemManager: Selected resource type: ${resourceType} (was: ${previousSelection})`);
    } else {
      logNormal(`ResourceSystemManager: Selected resource type: ${resourceType} (was: ${previousSelection})`);
    }
    
    // Notify resources of selection change if they support it
    this.resources.forEach(resource => {
      if (resource && typeof resource.setSelected === 'function') {
        const resourceType = resource.type || resource._type || resource.resourceType;
        resource.setSelected(resourceType === this.selectedResourceType);
      }
    });
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
      globalThis.logVerbose(`ResourceSystemManager: Cleared resource selection (was: ${previousSelection})`);
    } else {
      logNormal(`ResourceSystemManager: Cleared resource selection (was: ${previousSelection})`);
    }
    
    // Clear selection from all resources
    this.resources.forEach(resource => {
      if (resource && typeof resource.setSelected === 'function') {
        resource.setSelected(false);
      }
    });
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
   * Gets all resources of the currently selected type.
   *
   * @returns {Array} Array of resources matching the selected type
   */
  getSelectedTypeResources() {
    if (!this.selectedResourceType) {
      return [];
    }
    
    return this.resources.filter(resource => {
      if (!resource) return false;
      const resourceType = resource.type || resource._type || resource.resourceType;
      return resourceType === this.selectedResourceType;
    });
  }

  /**
   * Gets resources by type.
   *
   * @param {string} resourceType - The type to filter by
   * @returns {Array} Array of resources matching the specified type
   */
  getResourcesByType(resourceType) {
    return this.resources.filter(resource => {
      if (!resource) return false;
      const rType = resource.type || resource._type || resource.resourceType;
      return rType === resourceType;
    });
  }

  /**
   * Sets the selected type for highlighting purposes.
   *
   * @param {string|null} resourceType - The resource type to highlight, or null to clear
   */
  setSelectedType(resourceType) {
    this.selectResource(resourceType);
  }

  /**
   * Focuses collection on the selected resource type only.
   * When enabled, entities will only collect resources of the selected type.
   *
   * @param {boolean} focusEnabled - Whether to enable focused collection
   */
  setFocusedCollection(focusEnabled) {
    this.focusedCollection = focusEnabled;
    
    if (typeof globalThis.logVerbose === 'function') {
      globalThis.logVerbose(`ResourceSystemManager: Focused collection ${focusEnabled ? 'enabled' : 'disabled'} for type: ${this.selectedResourceType}`);
    } else {
      logNormal(`ResourceSystemManager: Focused collection ${focusEnabled ? 'enabled' : 'disabled'} for type: ${this.selectedResourceType}`);
    }
  }

  // ===== RESOURCE REGISTRATION METHODS =====

  /**
   * Register a new resource type with complete configuration.
   * This method handles everything needed to add a new resource type:
   * - Image loading and caching
   * - Factory method creation
   * - Spawn configuration
   * - Behavior settings
   * - Initial bulk spawning
   *
   * @param {string} resourceType - The name/type of the resource (e.g., 'stone', 'wood')
   * @param {Object} config - Resource configuration object
   * @param {string} config.imagePath - Path to the resource image
   * @param {number} [config.weight=0] - Spawn weight for random generation (0 = no random spawning)
   * @param {boolean} [config.canBePickedUp=true] - Whether entities can pick up this resource
   * @param {number} [config.initialSpawnCount=0] - Number to spawn at game start
   * @param {string} [config.spawnPattern='random'] - Spawn pattern: 'random', 'grid', 'perimeter'
   * @param {Object} [config.size] - Resource size {width, height}
   * @param {number} [config.size.width=20] - Width in pixels
   * @param {number} [config.size.height=20] - Height in pixels
   * @param {boolean} [config.isObstacle=false] - Whether this resource blocks movement
   * @param {string} [config.displayName] - Display name for UI (defaults to resourceType)
   * @param {string} [config.category='resource'] - Resource category for organization
   */
  registerResourceType(resourceType, config) {
    // Validate inputs
    if (!resourceType || typeof resourceType !== 'string') {
      throw new Error('ResourceSystemManager: resourceType must be a non-empty string');
    }
    
    if (!config || typeof config !== 'object') {
      throw new Error('ResourceSystemManager: config must be an object');
    }

    if (!config.imagePath) {
      throw new Error(`ResourceSystemManager: imagePath required for resource type '${resourceType}'`);
    }

    // Set defaults
    const resourceConfig = {
      weight: 0,
      canBePickedUp: true,
      initialSpawnCount: 0,
      spawnPattern: 'random',
      size: { width: 20, height: 20 },
      isObstacle: false,
      displayName: resourceType,
      category: 'resource',
      deferSpawning: false,  // New option to defer spawning
      ...config
    };

    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal(`ResourceSystemManager: Registering resource type '${resourceType}'`, resourceConfig);
    } else {
      logNormal(`ResourceSystemManager: Registering resource type '${resourceType}'`, resourceConfig);
    }

    // 1. Load and cache the image
    let resourceImage = null;
    try {
      if (typeof loadImage === 'function') {
        resourceImage = loadImage(resourceConfig.imagePath);
        
        // Cache the image globally for the resource type
        const globalImageName = resourceType + 'Image';
        if (typeof globalThis !== 'undefined') {
          globalThis[globalImageName] = resourceImage;
        }
        if (typeof window !== 'undefined') {
          window[globalImageName] = resourceImage;
        }
      }
    } catch (e) {
      console.warn(`ResourceSystemManager: Failed to load image for '${resourceType}':`, e.message);
    }

    // 2. Update Resource._getImageForType to handle this resource type
    if (typeof Resource !== 'undefined' && Resource._getImageForType) {
      const originalGetImageForType = Resource._getImageForType;
      Resource._getImageForType = function(type) {
        if (type === resourceType || type === resourceConfig.displayName.toLowerCase()) {
          return resourceImage;
        }
        return originalGetImageForType.call(this, type);
      };
    }

    // 3. Create factory method on Resource class
    if (typeof Resource !== 'undefined') {
      const factoryMethodName = 'create' + resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
      Resource[factoryMethodName] = function(x, y) {
        const resourceOptions = {
          resourceType: resourceType,
          imagePath: resourceImage,
          canBePickedUp: resourceConfig.canBePickedUp,
          isObstacle: resourceConfig.isObstacle,
          category: resourceConfig.category,
          displayName: resourceConfig.displayName
        };

        const resource = new Resource(x, y, resourceConfig.size.width, resourceConfig.size.height, resourceOptions);
        
        // Override pickUp method if resource can't be picked up
        if (!resourceConfig.canBePickedUp) {
          resource.pickUp = function(antObject) {
            // Do nothing - resource cannot be picked up
            if (typeof globalThis.logVerbose === 'function') {
              globalThis.logVerbose(`Resource '${resourceType}' cannot be picked up`);
            }
            return false;
          };
        }

        return resource;
      };

      if (typeof globalThis.logVerbose === 'function') {
        globalThis.logVerbose(`ResourceSystemManager: Created factory method Resource.${factoryMethodName}()`);
      }
    }

    // 4. Add to spawning assets if weight > 0
    if (resourceConfig.weight > 0) {
      this.assets[resourceType] = {
        weight: resourceConfig.weight,
        make: () => {
          const x = random(0, g_canvasX - resourceConfig.size.width);
          const y = random(0, g_canvasY - resourceConfig.size.height);
          const factoryMethod = Resource['create' + resourceType.charAt(0).toUpperCase() + resourceType.slice(1)];
          return factoryMethod ? factoryMethod(x, y) : null;
        }
      };

      if (typeof globalThis.logVerbose === 'function') {
        globalThis.logVerbose(`ResourceSystemManager: Added '${resourceType}' to spawn assets with weight ${resourceConfig.weight}`);
      }
    }

    // 5. Handle initial bulk spawning (unless deferred)
    if (resourceConfig.initialSpawnCount > 0 && !resourceConfig.deferSpawning) {
      this._spawnResourcesAtStartup(resourceType, resourceConfig);
    } else if (resourceConfig.deferSpawning) {
      // Store for later spawning
      if (!this._deferredSpawns) {
        this._deferredSpawns = [];
      }
      this._deferredSpawns.push({ resourceType, config: resourceConfig });
    }

    // Store the config for later reference
    if (!this.registeredResourceTypes) {
      this.registeredResourceTypes = {};
    }
    this.registeredResourceTypes[resourceType] = resourceConfig;

    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal(`ResourceSystemManager: Successfully registered resource type '${resourceType}'`);
    } else {
      logNormal(`ResourceSystemManager: Successfully registered resource type '${resourceType}'`);
    }
  }

  /**
   * Spawn all deferred resources (call this after spatial grid is initialized)
   */
  spawnDeferredResources() {
    if (!this._deferredSpawns || this._deferredSpawns.length === 0) {
      logNormal('ResourceSystemManager: No deferred spawns to process');
      return;
    }

    logNormal(`ResourceSystemManager: Spawning ${this._deferredSpawns.length} deferred resource types`);
    
    for (const { resourceType, config } of this._deferredSpawns) {
      this._spawnResourcesAtStartup(resourceType, config);
    }
    
    // Clear deferred list
    this._deferredSpawns = [];
  }

  /**
   * Spawn resources at game startup based on configuration.
   * @private
   */
  _spawnResourcesAtStartup(resourceType, config) {
    const factoryMethodName = 'create' + resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    const factoryMethod = Resource[factoryMethodName];
    
    if (!factoryMethod) {
      console.warn(`ResourceSystemManager: Factory method ${factoryMethodName} not found for initial spawn`);
      return;
    }

    const spawnCount = config.initialSpawnCount;
    let spawnedCount = 0;

    // Determine spawn positions based on pattern
    const positions = this._generateSpawnPositions(spawnCount, config);

    for (const pos of positions) {
      const resource = factoryMethod(pos.x, pos.y);
      if (resource && this.addResource(resource)) {
        spawnedCount++;
      }
    }

    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal(`ResourceSystemManager: Spawned ${spawnedCount}/${spawnCount} ${resourceType} resources at startup`);
    } else {
      logNormal(`ResourceSystemManager: Spawned ${spawnedCount}/${spawnCount} ${resourceType} resources at startup`);
    }
  }

  /**
   * Generate spawn positions based on pattern.
   * Converts all positions to terrain-aligned coordinates.
   * @private
   */
  _generateSpawnPositions(count, config) {
    let positions = [];
    const { width, height } = config.size;
    const pattern = config.spawnPattern;

    switch (pattern) {
      case 'grid':
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        const stepX = (g_canvasX - width) / (cols + 1);
        const stepY = (g_canvasY - height) / (rows + 1);
        
        for (let row = 0; row < rows && positions.length < count; row++) {
          for (let col = 0; col < cols && positions.length < count; col++) {
            let x = stepX * (col + 1);
            let y = stepY * (row + 1);
            
            // Convert to terrain-aligned coordinates
            if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
              const worldPos = CoordinateConverter.screenToWorld(x, y);
              x = worldPos.x;
              y = worldPos.y;
            }
            
            positions.push({ x, y });
          }
        }
        break;

      case 'perimeter':
        // Spawn around the edges of the canvas
        for (let i = 0; i < count; i++) {
          const side = i % 4;
          const progress = (i / count) * (g_canvasX + g_canvasY) * 2;
          
          let x, y;
          if (side === 0) { // Top
            x = random(width, g_canvasX - width);
            y = random(0, height * 2);
          } else if (side === 1) { // Right
            x = random(g_canvasX - width * 2, g_canvasX - width);
            y = random(height, g_canvasY - height);
          } else if (side === 2) { // Bottom
            x = random(width, g_canvasX - width);
            y = random(g_canvasY - height * 2, g_canvasY - height);
          } else { // Left
            x = random(0, width * 2);
            y = random(height, g_canvasY - height);
          }
          
          // Convert to terrain-aligned coordinates
          if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
            const worldPos = CoordinateConverter.screenToWorld(x, y);
            x = worldPos.x;
            y = worldPos.y;
          }
          
          positions.push({ x, y });
        }
        break;

      case 'random':
      default:
        // Use improved distribution algorithm for better spread
        // Note: _generateWellDistributedPositions will also apply coordinate conversion
        positions = this._generateWellDistributedPositions(count, width, height);
        break;
    }

    return positions;
  }

  /**
   * Generate well-distributed positions across the canvas using Poisson disk sampling approach.
   * This ensures resources are spread out evenly without clustering.
   * All positions are converted to terrain-aligned coordinates.
   * @private
   */
  _generateWellDistributedPositions(count, resourceWidth, resourceHeight) {
    const positions = [];
    const minDistance = Math.min(g_canvasX, g_canvasY) / Math.sqrt(count) * 0.8; // Minimum distance between resources
    const maxAttempts = 30; // Maximum attempts to place each resource
    
    // Add some padding from edges
    const padding = Math.max(resourceWidth, resourceHeight);
    const canvasWidth = g_canvasX - padding * 2;
    const canvasHeight = g_canvasY - padding * 2;
    
    for (let i = 0; i < count; i++) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < maxAttempts) {
        // Generate candidate position
        let candidateX = random(padding, g_canvasX - padding - resourceWidth);
        let candidateY = random(padding, g_canvasY - padding - resourceHeight);
        
        // Convert to terrain-aligned coordinates
        if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
          const worldPos = CoordinateConverter.screenToWorld(candidateX, candidateY);
          candidateX = worldPos.x;
          candidateY = worldPos.y;
        }
        
        // Check minimum distance from existing positions
        let tooClose = false;
        for (const existing of positions) {
          const distance = Math.sqrt(
            Math.pow(candidateX - existing.x, 2) + 
            Math.pow(candidateY - existing.y, 2)
          );
          
          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          positions.push({ x: candidateX, y: candidateY });
          placed = true;
        }
        
        attempts++;
      }
      
      // If we couldn't place with minimum distance, place randomly as fallback
      if (!placed) {
        let fallbackX = random(padding, g_canvasX - padding - resourceWidth);
        let fallbackY = random(padding, g_canvasY - padding - resourceHeight);
        
        // Convert fallback position too
        if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
          const worldPos = CoordinateConverter.screenToWorld(fallbackX, fallbackY);
          fallbackX = worldPos.x;
          fallbackY = worldPos.y;
        }
        
        positions.push({ x: fallbackX, y: fallbackY });
      }
    }
    
    return positions;
  }

  /**
   * Get all registered resource types and their configurations.
   * @returns {Object} Object with resource type names as keys and configs as values
   */
  getRegisteredResourceTypes() {
    return this.registeredResourceTypes || {};
  }

  // ===== UTILITY METHODS =====

  /**
   * Gets comprehensive system status information.
   *
   * @returns {Object} System status object
   */
  getSystemStatus() {
    const resourceCounts = {};
    this.resources.forEach(resource => {
      const type = resource?.type || resource?._type || resource?.resourceType || 'unknown';
      resourceCounts[type] = (resourceCounts[type] || 0) + 1;
    });

    return {
      totalResources: this.resources.length,
      maxCapacity: this.maxCapacity,
      capacityUsed: (this.resources.length / this.maxCapacity * 100).toFixed(1) + '%',
      isSpawningActive: this.isActive,
      spawnInterval: this.spawnInterval,
      selectedResourceType: this.selectedResourceType,
      focusedCollection: this.focusedCollection,
      resourceCounts: resourceCounts
    };
  }

  /**
   * Gets debug information about the resource system.
   *
   * @returns {Object} Debug information object
   */
  getDebugInfo() {
    return {
      ...this.getSystemStatus(),
      resourceDetails: this.resources.map((resource, index) => ({
        index: index,
        type: resource?.type || resource?._type || resource?.resourceType || 'unknown',
        position: resource?.getPosition ? resource.getPosition() : { x: resource?.x, y: resource?.y },
        isCarried: resource?.isCarried || false
      }))
    };
  }

  /**
   * Updates the entire resource system.
   * Should be called each frame.
   */
  update() {
    this.updateAll();
  }

  /**
   * Renders the entire resource system.
   * Should be called each frame.
   */
  render() {
    this.drawAll();
  }

  /**
   * Cleanup method to stop spawning and clear resources.
   */
  destroy() {
    this.stopSpawning();
    this.clearAllResources();
    
    if (typeof globalThis.logNormal === 'function') {
      globalThis.logNormal('ResourceSystemManager: Destroyed');
    } else {
      logNormal('ResourceSystemManager: Destroyed');
    }
  }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceSystemManager;
}