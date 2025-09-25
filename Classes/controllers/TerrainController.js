/**
 * TerrainController - Handles terrain detection and terrain-based state modifications
 */
class TerrainController {
  constructor(entity) {
    this._entity = entity;
    this._currentTerrain = "DEFAULT";
    this._lastPosition = { x: -1, y: -1 };
    this._terrainCheckInterval = 200; // Check every 200ms for performance
    this._lastTerrainCheck = 0;
    this._terrainCache = new Map(); // Cache terrain lookups
  }

  // --- Public API ---

  /**
   * Update terrain detection and state
   */
  update() {
    const now = Date.now();
    
    // Only check terrain periodically or when position changed significantly
    if (now - this._lastTerrainCheck > this._terrainCheckInterval || this._hasPositionChanged()) {
      this.detectAndUpdateTerrain();
      this._lastTerrainCheck = now;
      this._updateLastPosition();
    }
  }

  /**
   * Get current terrain type
   * @returns {string} Current terrain modifier
   */
  getCurrentTerrain() {
    return this._currentTerrain;
  }

  /**
   * Force terrain detection (useful for immediate updates)
   */
  forceTerrainCheck() {
    this.detectAndUpdateTerrain();
    this._updateLastPosition();
  }

  /**
   * Set terrain check interval
   * @param {number} interval - Interval in milliseconds
   */
  setCheckInterval(interval) {
    this._terrainCheckInterval = interval;
  }

  // --- Terrain Detection ---

  /**
   * Detect terrain at current position and update state if changed
   */
  detectAndUpdateTerrain() {
    const newTerrain = this.detectTerrain();
    
    if (newTerrain !== this._currentTerrain) {
      const oldTerrain = this._currentTerrain;
      this._currentTerrain = newTerrain;
      
      // Update state machine if available
      if (this._entity._stateMachine) {
        this._entity._stateMachine.setTerrainModifier(newTerrain);
      }
      
      this._onTerrainChange(oldTerrain, newTerrain);
    }
  }

  /**
   * Detect terrain type at current position
   * @returns {string} Terrain type
   */
  detectTerrain() {
    // Get entity position
    const pos = this._getEntityPosition();
    const cacheKey = `${Math.floor(pos.x / 32)},${Math.floor(pos.y / 32)}`;
    
    // Check cache first
    if (this._terrainCache.has(cacheKey)) {
      return this._terrainCache.get(cacheKey);
    }
    
    let terrainType = "DEFAULT";
    
    // Integration with terrain system (if available)
    if (typeof GRIDMAP !== 'undefined' && GRIDMAP) {
      try {
        const tileSize = window.tileSize || 32;
        const tileX = Math.floor(pos.x / tileSize);
        const tileY = Math.floor(pos.y / tileSize);
        
        const grid = GRIDMAP.getGrid();
        const tile = grid?.getArrPos([tileX, tileY]);
        
        if (tile && tile._terrainTile) {
          terrainType = this._mapTerrainType(tile._terrainTile);
        }
      } catch (error) {
        // Terrain system not available or error occurred
        console.warn("Terrain detection error:", error);
      }
    }
    
    // Cache the result
    this._terrainCache.set(cacheKey, terrainType);
    
    // Clean cache if it gets too large
    if (this._terrainCache.size > 100) {
      const firstKey = this._terrainCache.keys().next().value;
      this._terrainCache.delete(firstKey);
    }
    
    return terrainType;
  }

  /**
   * Map terrain tile to terrain modifier
   * @param {Object} terrainTile - Terrain tile object
   * @returns {string} Terrain modifier
   */
  _mapTerrainType(terrainTile) {
    // This mapping should be customized based on your terrain system
    const terrainName = terrainTile.getName ? terrainTile.getName() : terrainTile.type;
    
    switch (terrainName?.toLowerCase()) {
      case "water":
      case "river":
      case "lake":
        return "IN_WATER";
      
      case "mud":
      case "swamp":
      case "marsh":
        return "IN_MUD";
      
      case "ice":
      case "slippery":
        return "ON_SLIPPERY";
      
      case "rocks":
      case "rough":
      case "mountain":
        return "ON_ROUGH";
      
      case "grass":
      case "dirt":
      case "stone":
      case "default":
      default:
        return "DEFAULT";
    }
  }

  // --- Terrain Effects ---

  /**
   * Get movement speed modifier for current terrain
   * @param {number} baseSpeed - Base movement speed
   * @returns {number} Modified movement speed
   */
  getSpeedModifier(baseSpeed) {
    switch (this._currentTerrain) {
      case "IN_WATER":
        return baseSpeed * 0.5; // 50% speed in water
      case "IN_MUD":
        return baseSpeed * 0.3; // 30% speed in mud
      case "ON_SLIPPERY":
        return 0; // Can't move on slippery terrain
      case "ON_ROUGH":
        return baseSpeed * 0.8; // 80% speed on rough terrain
      case "DEFAULT":
      default:
        return baseSpeed; // Normal speed
    }
  }

  /**
   * Check if current terrain allows movement
   * @returns {boolean} True if movement is allowed
   */
  canMove() {
    return this._currentTerrain !== "ON_SLIPPERY";
  }

  /**
   * Get terrain-specific visual effects
   * @returns {Object} Visual effects object
   */
  getVisualEffects() {
    switch (this._currentTerrain) {
      case "IN_WATER":
        return { ripples: true, colorTint: [0, 100, 200, 50] };
      case "IN_MUD":
        return { particles: "mud", colorTint: [139, 69, 19, 30] };
      case "ON_SLIPPERY":
        return { sparkles: true, colorTint: [200, 200, 255, 40] };
      case "ON_ROUGH":
        return { dustParticles: true };
      default:
        return {};
    }
  }

  // --- Private Methods ---

  /**
   * Get entity position (with fallbacks)
   * @returns {Object} Position object with x, y
   */
  _getEntityPosition() {
    if (this._entity._transformController) {
      return this._entity._transformController.getPosition();
    } else if (this._entity.getPosition) {
      return this._entity.getPosition();
    } else {
      return { 
        ...this._entity.getPosition() 
      };
    }
  }

  /**
   * Check if position has changed significantly
   * @returns {boolean} True if position changed
   */
  _hasPositionChanged() {
    const pos = this._getEntityPosition();
    const threshold = 16; // pixels
    
    return (
      Math.abs(pos.x - this._lastPosition.x) > threshold ||
      Math.abs(pos.y - this._lastPosition.y) > threshold
    );
  }

  /**
   * Update last known position
   */
  _updateLastPosition() {
    const pos = this._getEntityPosition();
    this._lastPosition.x = pos.x;
    this._lastPosition.y = pos.y;
  }

  /**
   * Handle terrain changes
   * @param {string} oldTerrain - Previous terrain type
   * @param {string} newTerrain - New terrain type
   */
  _onTerrainChange(oldTerrain, newTerrain) {
    // Override in subclasses or set callback for custom behavior
    if (this._onTerrainChangeCallback) {
      this._onTerrainChangeCallback(oldTerrain, newTerrain);
    }
  }

  /**
   * Set callback for terrain changes
   * @param {Function} callback - Callback function
   */
  setTerrainChangeCallback(callback) {
    this._onTerrainChangeCallback = callback;
  }

  // --- Utility Methods ---

  /**
   * Clear terrain cache
   */
  clearCache() {
    this._terrainCache.clear();
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      currentTerrain: this._currentTerrain,
      lastPosition: { ...this._lastPosition },
      cacheSize: this._terrainCache.size,
      checkInterval: this._terrainCheckInterval,
      canMove: this.canMove(),
      visualEffects: this.getVisualEffects()
    };
  }
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = TerrainController;
}