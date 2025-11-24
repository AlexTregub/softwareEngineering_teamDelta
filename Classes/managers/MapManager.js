/**
 * MapManager.js
 * =============
 * Centralized map management system for level switching and terrain access.
 * 
 * Features:
 * - Manages multiple terrain maps (levels)
 * - Handles active map switching
 * - Provides safe terrain queries
 * - Future-proof for save/load systems
 * 
 * @module MapManager
 * @author Team Delta
 * @date 2025-10-21
 */

class MapManager {
  constructor() {
    /** @type {Map<string, gridTerrain>} All loaded maps indexed by ID */
    this._maps = new Map();
    
    /** @type {gridTerrain|null} Currently active map */
    this._activeMap = null;
    
    /** @type {string|null} ID of currently active map */
    this._activeMapId = null;
    
    /** @type {number} Default tile size in pixels */
    this._defaultTileSize = 32;
    
    logNormal("MapManager initialized");
  }

  // --- Map Registration ---

  /**
   * Register a new map
   * @param {string} mapId - Unique identifier for this map
   * @param {gridTerrain} map - The terrain map instance
   * @param {boolean} setActive - Whether to immediately set as active map
   * @returns {boolean} True if successful
   */
  registerMap(mapId, map, setActive = false) {
    if (!mapId || typeof mapId !== 'string') {
      console.error("MapManager.registerMap: Invalid map ID");
      return false;
    }

    if (!map || typeof map.chunkArray === 'undefined') {
      console.error("MapManager.registerMap: Invalid map object");
      return false;
    }

    if (this._maps.has(mapId)) {
      console.warn(`MapManager.registerMap: Map '${mapId}' already registered, replacing`);
    }

    this._maps.set(mapId, map);
    logNormal(`MapManager: Registered map '${mapId}'`);

    if (setActive) {
      this.setActiveMap(mapId);
    }

    return true;
  }

  /**
   * Unregister a map (cleanup)
   * @param {string} mapId - ID of map to remove
   * @returns {boolean} True if removed
   */
  unregisterMap(mapId) {
    if (!this._maps.has(mapId)) {
      console.warn(`MapManager.unregisterMap: Map '${mapId}' not found`);
      return false;
    }

    // Don't allow removing active map
    if (mapId === this._activeMapId) {
      console.error("MapManager.unregisterMap: Cannot remove active map");
      return false;
    }

    this._maps.delete(mapId);
    logNormal(`MapManager: Unregistered map '${mapId}'`);
    return true;
  }

  // --- Active Map Management ---

  /**
   * Set the active map by ID
   * @param {string} mapId - ID of map to activate
   * @returns {boolean} True if successful
   */
  setActiveMap(mapId) {
    if (!this._maps.has(mapId)) {
      console.error(`MapManager.setActiveMap: Map '${mapId}' not found`);
      return false;
    }

    const map = this._maps.get(mapId);
    this._activeMap = map;
    this._activeMapId = mapId;

    // Update global reference for backwards compatibility
    if (typeof window !== 'undefined') {
      window.g_activeMap = map;
    }

    // Invalidate terrain cache to force re-render with new map
    if (map && typeof map.invalidateCache === 'function') {
      map.invalidateCache();
      logNormal(`MapManager: Terrain cache invalidated for '${mapId}'`);
    }

    logNormal(`MapManager: Active map set to '${mapId}'`);
    return true;
  }

  /**
   * Get the currently active map
   * @returns {gridTerrain|null} Active map instance
   */
  getActiveMap() {
    return this._activeMap;
  }

  /**
   * Get active map ID
   * @returns {string|null} Active map identifier
   */
  getActiveMapId() {
    return this._activeMapId;
  }

  /**
   * Get a specific map by ID
   * @param {string} mapId - Map identifier
   * @returns {gridTerrain|null} Map instance or null
   */
  getMap(mapId) {
    return this._maps.get(mapId) || null;
  }

  /**
   * Check if a map is registered
   * @param {string} mapId - Map identifier
   * @returns {boolean} True if map exists
   */
  hasMap(mapId) {
    return this._maps.has(mapId);
  }

  /**
   * Get all registered map IDs
   * @returns {string[]} Array of map identifiers
   */
  getMapIds() {
    return Array.from(this._maps.keys());
  }

  // --- Terrain Queries ---

  /**
   * Get tile at world position from active map
   * @param {number} worldX - World X coordinate in pixels
   * @param {number} worldY - World Y coordinate in pixels
   * @returns {Tile|null} Tile object or null if not found
   */
  getTileAtPosition(worldX, worldY) {
    if (!this._activeMap) {
      return null;
    }

    try {
      // Use the map's coordinate system to convert world pixels to grid coordinates
      // This is the CORRECT way - tiles are stored at grid positions, not pixel/tileSize
      if (this._activeMap.renderConversion && typeof this._activeMap.renderConversion.convCanvasToPos === 'function') {
        const gridPos = this._activeMap.renderConversion.convCanvasToPos([worldX, worldY]);
        const gridX = Math.floor(gridPos[0]);
        const gridY = Math.floor(gridPos[1]);
        
        return this.getTileAtGridCoords(gridX, gridY);
      } else {
        // Fallback if renderConversion not available (shouldn't happen)
        console.warn("MapManager: renderConversion not available, using fallback");
        const tileSize = window.TILE_SIZE || this._defaultTileSize;
        const gridX = Math.floor(worldX / tileSize);
        const gridY = Math.floor(worldY / tileSize);
        return this.getTileAtGridCoords(gridX, gridY);
      }
    } catch (error) {
      console.warn("MapManager.getTileAtPosition error:", error);
      return null;
    }
  }

  /**
   * Get tile at grid coordinates from active map
   * @param {number} tileGridX - Tile grid X coordinate (tile-space, considering span)
   * @param {number} tileGridY - Tile grid Y coordinate (tile-space, considering span) 
   * @returns {Tile|null} Tile object or null if not found
   */
  getTileAtGridCoords(tileGridX, tileGridY) {
    if (!this._activeMap || !this._activeMap.chunkArray) {
      return null;
    }

    try {
      // IMPORTANT: Don't try to calculate which chunk contains the tile!
      // The Grid system uses spanning coordinates with Y-axis inversion.
      // Instead, iterate through chunks and let the Grid span system handle lookup.
      
      // First, try to find the tile by iterating through the chunk array
      // This works because chunk.tileData is a Grid with span support
      const chunks = this._activeMap.chunkArray.rawArray;
      
      if (chunks && chunks.length > 0) {
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (chunk && chunk.tileData) {
            // Each chunk's tileData has a span - check if our tile is in this chunk's span
            const tileSpan = chunk.tileData.getSpanRange();
            if (tileSpan && tileSpan.length === 2) {
              const [spanStart, spanEnd] = tileSpan;
              
              // Check if tile coordinates are within this chunk's span
              // spanStart = [minX, maxY], spanEnd = [maxX, minY] due to Y-axis inversion
              const inXRange = tileGridX >= spanStart[0] && tileGridX <= spanEnd[0];
              const inYRange = tileGridY >= spanEnd[1] && tileGridY <= spanStart[1]; // Note: Y is inverted
              
              if (inXRange && inYRange) {
                // Get the tile from this chunk's tileData
                // Use rawArray access to bypass Grid's OOB check which has inverted Y-axis issues
                try {
                  // Convert span position to array position
                  const arrPos = chunk.tileData.convRelToArrPos([tileGridX, tileGridY]);
                  const flatIndex = chunk.tileData.convToFlat(arrPos);
                  const tile = chunk.tileData.rawArray[flatIndex];
                  if (tile && tile !== NONE) {
                    return tile;
                  }
                } catch (e) {
                  // Try the normal get method as fallback
                  const tile = chunk.tileData.get([tileGridX, tileGridY]);
                  if (tile) {
                    return tile;
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Silently handle errors - expected at map edges
      if (typeof window.DEBUG_TERRAIN !== 'undefined' && window.DEBUG_TERRAIN) {
        console.warn("MapManager.getTileAtGridCoords:", {tileGridX, tileGridY, error: error.message});
      }
    }

    return null;
  }

  /**
   * @deprecated Use getTileAtGridCoords instead
   */
  getTileAtCoords(tileX, tileY) {
    return this.getTileAtGridCoords(tileX, tileY);
  }

  /**
   * Get tile material at world position
   * @param {number} worldX - World X coordinate in pixels
   * @param {number} worldY - World Y coordinate in pixels
   * @returns {string|null} Material name or null
   */
  getTileMaterial(worldX, worldY) {
    const tile = this.getTileAtPosition(worldX, worldY);
    return tile?.material || null;
  }

  // --- Map Creation Helpers ---

  /**
   * Create and register a new procedural map
   * @param {string} mapId - Unique identifier for this map
   * @param {Object} config - Map configuration
   * @param {number} config.chunksX - Number of chunks horizontally
   * @param {number} config.chunksY - Number of chunks vertically
   * @param {number} config.seed - Random seed for generation
   * @param {number} config.chunkSize - Tiles per chunk
   * @param {number} config.tileSize - Pixels per tile
   * @param {number[]} config.canvasSize - [width, height] of canvas
   * @param {boolean} setActive - Whether to set as active map
   * @returns {gridTerrain|null} Created map or null if failed
   */
  createProceduralMap(mapId, config, setActive = false) {
    try {
      const {
        chunksX = 20,
        chunksY = 20,
        seed = Math.random() * 10000,
        chunkSize = 8,
        tileSize = 32,
        canvasSize = [800, 600]
      } = config;

      const map = new gridTerrain(
        chunksX,
        chunksY,
        seed,
        chunkSize,
        tileSize,
        canvasSize
      );

      map.randomize(seed);
      map.renderConversion.alignToCanvas();

      this.registerMap(mapId, map, setActive);
      return map;
    } catch (error) {
      console.error("MapManager.createProceduralMap error:", error);
      return null;
    }
  }

  // --- Utility ---

  /**
   * Get info about all registered maps
   * @returns {Object} Map information
   */
  getInfo() {
    return {
      totalMaps: this._maps.size,
      activeMapId: this._activeMapId,
      mapIds: this.getMapIds(),
      hasActiveMap: this._activeMap !== null
    };
  }

  /**
   * Clear all maps (use with caution)
   */
  clearAll() {
    this._maps.clear();
    this._activeMap = null;
    this._activeMapId = null;
    if (typeof window !== 'undefined') {
      window.g_activeMap = null;
    }
    logNormal("MapManager: All maps cleared");
  }

  // --- Level Creation & Switching ---

  /**
   * Load the moss & stone column level as the active map.
   * This level features alternating columns of moss and stone for testing
   * terrain speed modifiers (moss = IN_MUD, stone = ON_ROUGH).
   * 
   * @param {number} chunksX - Number of chunks horizontally
   * @param {number} chunksY - Number of chunks vertically
   * @param {number} seed - Random seed for generation
   * @param {number} chunkSize - Tiles per chunk
   * @param {number} tileSize - Pixels per tile
   * @param {number[]} canvasSize - [width, height] of canvas
   * @returns {boolean} True if successful, false otherwise
   */
  loadMossStoneLevel(chunksX, chunksY, seed, chunkSize, tileSize, canvasSize) {    
    try {
      // Check if createMossStoneColumnLevel function exists
      if (typeof window !== 'undefined' && typeof window.createMossStoneColumnLevel !== 'function') {
        console.error("❌ createMossStoneColumnLevel function not available");
        return false;
      }

      // Create the moss/stone column level
      const mossStoneLevel = window.createMossStoneColumnLevel(
        chunksX,
        chunksY,
        seed,
        chunkSize,
        tileSize,
        canvasSize
      );
      
      // Register with MapManager
      this.registerMap('mossStone', mossStoneLevel, true);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switch to a specific level by ID and optionally start the game.
   * Convenience function for menu buttons.
   * 
   * @param {string} levelId - The ID of the level to switch to
   * @param {boolean} startGame - Whether to start the game after switching (default: true)
   * @param {Object} levelConfig - Optional config for creating new levels (chunksX, chunksY, seed, etc.)
   * @returns {boolean} True if successful
   */
  switchToLevel(levelId, startGame = true, levelConfig = null) {
    logNormal(`🔄 Switching to level: ${levelId}`);
    
    try {
      // If the level is 'mossStone' and doesn't exist yet, create it
      if (levelId === 'mossStone') {
        const existingMap = this.getMap('mossStone');
        if (!existingMap) {
          // Use provided config or fallback to window globals
          const config = levelConfig || {
            chunksX: window.CHUNKS_X || 20,
            chunksY: window.CHUNKS_Y || 20,
            seed: window.g_seed || Math.random() * 10000,
            chunkSize: window.CHUNK_SIZE || 8,
            tileSize: window.TILE_SIZE || 32,
            canvasSize: [window.windowWidth || 800, window.windowHeight || 600]
          };
          
          this.loadMossStoneLevel(
            config.chunksX,
            config.chunksY,
            config.seed,
            config.chunkSize,
            config.tileSize,
            config.canvasSize
          );
        } else {
          this.setActiveMap('mossStone');
        }
      } else {
        // Switch to existing level
        if (!this.setActiveMap(levelId)) {
          return false;
        }
      }
      
      // CRITICAL: Invalidate terrain cache to force re-render with new terrain
      if (this._activeMap && typeof this._activeMap.invalidateCache === 'function') {
        this._activeMap.invalidateCache();
        logNormal("✅ Terrain cache invalidated - new terrain will render");
      }
      
      // Start the game if requested
      if (startGame && typeof window !== 'undefined' && typeof window.startGameTransition === 'function') {
        window.startGameTransition();
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error switching to level ${levelId}:`, error);
      return false;
    }
  }

  /**
   * Get the pixel dimensions of the active map.
   * If the map object is available, it calculates the dimensions
   * based on the number of tiles and their size. Otherwise, it defaults
   * to the canvas dimensions.
   * 
   * @returns {Object} An object containing the width and height of the map in pixels
   */
  getMapPixelDimensions() {
    if (!this._activeMap) {
      // Fallback to canvas dimensions
      if (typeof window !== 'undefined') {
        return { 
          width: window.g_canvasX || window.windowWidth || 800, 
          height: window.g_canvasY || window.windowHeight || 600 
        };
      }
      return { width: 800, height: 600 };
    }

    const tileSize = window.TILE_SIZE || this._defaultTileSize;
    const width = this._activeMap._xCount ? this._activeMap._xCount * tileSize : (window.g_canvasX || 800);
    const height = this._activeMap._yCount ? this._activeMap._yCount * tileSize : (window.g_canvasY || 600);
    
    return { width, height };
  }

  /**
   * registerGameStateCallbacks
   * ---------------------------
   * Registers GameState change callbacks for level editor and ant spawning
   * Centralizes state-dependent initialization logic
   */
  registerGameStateCallbacks() {
    if (typeof GameState === 'undefined') {
      console.warn('⚠️ GameState not available for callback registration');
      return;
    }

    // Level editor initialization callback
    if (typeof levelEditor !== 'undefined') {
      GameState.onStateChange((newState, oldState) => {
        if (newState === 'LEVEL_EDITOR') {
          if (!levelEditor.isActive()) {
            const terrain = new CustomTerrain(50, 50, 32, 'dirt');
            levelEditor.initialize(terrain);
          }
        } else if (oldState === 'LEVEL_EDITOR') {
          levelEditor.deactivate();
        }
      });
    }

    // Initial ant spawning callback
    if (typeof LegacyAntFactory !== 'undefined') {
      GameState.onStateChange((newState, oldState) => {
        if (newState === 'PLAYING' && oldState !== 'PAUSED') {
          // Only spawn ants on fresh game start (not when resuming from pause)
          if (typeof spawnInitialAnts === 'function') {
            spawnInitialAnts();
          }
        }
      });
    }

  }
}

// Create global singleton instance
if (typeof window !== 'undefined') {
  window.mapManager = new MapManager();
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
}
