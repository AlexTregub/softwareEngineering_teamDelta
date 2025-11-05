/**
 * @fileoverview WorldService - Unified world management facade
 * Replaces 30+ manager classes and 8 rendering classes with single service
 * 
 * Design Pattern: Facade Pattern (primary) + Service Locator + Repository
 * 
 * Consolidates:
 * - 30+ Manager classes (~8000 LOC)
 * - 8 Rendering classes (~6105 LOC)
 * - 5 Systems classes (~1927 LOC)
 * Total: 43 files (~16,032 LOC) → 1 file (~1600 LOC)
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * WorldService - Unified facade for game world management
 * 
 * Responsibilities:
 * - Entity management (spawn, query, update, destroy)
 * - Terrain management (load, query, coordinate conversion)
 * - Spatial queries (nearby entities, rectangle queries)
 * - Camera management (position, zoom, transforms)
 * - Input handling (mouse, keyboard, shortcuts)
 * - Rendering pipeline (terrain → entities → panels → HUD)
 * - UI panel management (register, z-order, drag/drop)
 * - Audio management (load, play, volume)
 * - Game state integration (pause, resume, callbacks)
 * 
 * @class WorldService
 */
class WorldService {
  /**
   * Creates a new WorldService instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.factories] - Entity factories (ant, building, resource)
   * @param {Object} [options.terrain] - Initial terrain data
   * @param {Object} [options.camera] - Initial camera position/zoom
   */
  constructor(options = {}) {
    // === ENTITIES (EntityService merged) ===
    this._entities = new Map(); // Map<id, entity>
    this._nextEntityId = 0;
    
    // Entity factories (dependency injection)
    this._antFactory = options.factories?.ant || null;
    this._buildingFactory = options.factories?.building || null;
    this._resourceFactory = options.factories?.resource || null;
    
    // === TERRAIN ===
    this._terrain = options.terrain || null;
    this._terrainCache = null; // p5.Graphics for cached terrain rendering
    this._terrainDirty = true;
    
    // === SPATIAL ===
    this._spatialGrid = options.spatialGrid || null;
    // If no spatial grid provided and SpatialGrid is available, create one
    if (!this._spatialGrid && typeof SpatialGrid !== 'undefined') {
      this._spatialGrid = new SpatialGrid(64); // 64px cell size (TILE_SIZE * 2)
    }
    
    // === CAMERA ===
    const cameraDefaults = options.camera || {};
    this._camera = {
      x: cameraDefaults.x || 0,
      y: cameraDefaults.y || 0,
      zoom: cameraDefaults.zoom || 1.0,
      minZoom: 0.5,
      maxZoom: 3.0
    };
    
    // === INPUT ===
    this._mouse = { x: 0, y: 0, pressed: false };
    this._keys = new Map();
    this._shortcuts = new Map(); // Map<key, callback>
    this._selectionBox = null; // { startX, startY, endX, endY }
    
    // === UI PANELS (DraggablePanelManager merged) ===
    this._panels = new Map(); // Map<id, panel>
    this._activePanelId = null;
    this._panelZIndex = 0;
    
    // === RENDERING ===
    this._enableDepthSort = true;
    this._activeEffects = [];
    this._hudVisible = true;
    this._crosshairEnabled = true; // MouseCrosshair merged
    this._crosshairOverEntity = false;
    this._renderLayers = ['TERRAIN', 'ENTITIES', 'EFFECTS', 'PANELS', 'HUD'];
    
    // === AUDIO ===
    this._sounds = new Map(); // Map<name, p5.SoundFile>
    this._volume = 1.0;
    this._bgm = null;
    
    // === GAME STATE ===
    this._gameState = 'MENU'; // MENU, PLAYING, PAUSED
    this._stateCallbacks = new Map(); // Map<state, callback[]>
    this._isPaused = false;
  }
  
  // ============================================================
  // ENTITY API (~250 lines - from EntityService)
  // ============================================================
  
  /**
   * Spawn a new entity in the world
   * 
   * Supports two signatures:
   * - spawnEntity(type, x, y, options)
   * - spawnEntity(type, { x, y, ...options })
   * 
   * @param {string} type - Entity type ('Ant', 'Building', 'Resource')
   * @param {number|Object} xOrOptions - X position OR options object with x, y
   * @param {number} y - Y position (if first signature)
   * @param {Object} [options={}] - Entity-specific options (if first signature)
   * @returns {Object} The spawned entity controller
   */
  spawnEntity(type, xOrOptions, y, options = {}) {
    // Handle both signatures
    let x, opts;
    if (typeof xOrOptions === 'object') {
      // Second signature: spawnEntity(type, { x, y, ...options })
      x = xOrOptions.x;
      y = xOrOptions.y;
      opts = xOrOptions;
    } else {
      // First signature: spawnEntity(type, x, y, options)
      x = xOrOptions;
      opts = options;
    }
    
    const id = this._nextEntityId++;
    let entity = null;
    
    switch(type) {
      case 'Ant':
        if (this._antFactory) {
          // Check if jobName is specified, otherwise default to Scout
          const jobName = opts.jobName || 'Scout';
          entity = this._antFactory._createAntWithJob(x, y, jobName, opts.faction || 'neutral');
        }
        break;
      case 'Building':
        if (this._buildingFactory) {
          entity = this._buildingFactory.createAntCone(x, y, opts);
        }
        break;
      case 'Resource':
        // Check max capacity before spawning
        if (this._resourceSystem && this._resourceSystem.maxCapacity) {
          const currentCount = this.getEntitiesByType('Resource').length;
          if (currentCount >= this._resourceSystem.maxCapacity) {
            console.warn(`Resource capacity reached (${this._resourceSystem.maxCapacity})`);
            return null;
          }
        }
        
        if (this._resourceFactory) {
          const resourceType = opts.resourceType || 'greenLeaf';
          entity = this._resourceFactory.createResource(resourceType, x, y, opts);
        }
        break;
      default:
        console.error(`Unknown entity type: ${type}`);
        return null;
    }
    
    if (!entity) {
      console.error(`Failed to create entity of type ${type} - factory not available`);
      return null;
    }
    
    // Enforce consistent interface (replaces EntityAccessor)
    entity._worldServiceId = id;
    entity.id = id;
    entity._id = id; // Legacy support
    entity.type = type; // Ensure type is always set
    // DON'T set entity.faction directly - controllers have read-only getter
    // Faction is set via factory options and stored in model
    if (!entity.getPosition && entity.position) {
      entity.getPosition = () => entity.position;
    }
    if (!entity.getType) {
      entity.getType = () => entity.type;
    }
    if (!entity.getFaction) {
      // Fallback: use getter if it exists, otherwise create one
      entity.getFaction = () => entity.faction;
    }
    
    this._entities.set(id, entity);
    
    // Register with spatial grid
    if (this._spatialGrid && entity.getPosition) {
      this._spatialGrid.insert(entity);
    }
    
    return entity;
  }
  
  /**
   * Get entity by ID
   * 
   * @param {number} id - Entity ID
   * @returns {Object|null} Entity controller or null
   */
  getEntityById(id) {
    return this._entities.get(id) || null;
  }
  
  /**
   * Get all entities
   * 
   * @returns {Array<Object>} All entity controllers
   */
  getAllEntities() {
    return Array.from(this._entities.values());
  }
  
  /**
   * Get entities by type
   * 
   * @param {string} type - Entity type to filter by
   * @returns {Array<Object>} Matching entities
   */
  getEntitiesByType(type) {
    return this.getAllEntities().filter(entity => {
      const entityType = entity.getType ? entity.getType() : entity.type;
      return entityType === type;
    });
  }
  
  /**
   * Get entities by faction
   * 
   * @param {string} faction - Faction to filter by
   * @returns {Array<Object>} Matching entities
   */
  getEntitiesByFaction(faction) {
    return this.getAllEntities().filter(entity => {
      const entityFaction = entity.getFaction ? entity.getFaction() : entity.faction;
      return entityFaction === faction;
    });
  }
  
  /**
   * Query entities with custom filter function
   * 
   * @param {Function} filterFn - Filter function (entity) => boolean
   * @returns {Array<Object>} Matching entities
   */
  queryEntities(filterFn) {
    return this.getAllEntities().filter(filterFn);
  }
  
  /**
   * Get entity count
   * 
   * @returns {number} Total number of entities
   */
  getEntityCount() {
    return this._entities.size;
  }
  
  /**
   * Clear all entities
   */
  clearAllEntities() {
    // Destroy all entities properly
    for (const id of this._entities.keys()) {
      this.destroyEntity(id);
    }
    
    // Clear spatial grid
    if (this._spatialGrid && this._spatialGrid.clear) {
      this._spatialGrid.clear();
    }
  }
  
  /**
   * Destroy entity by ID
   * 
   * @param {number} id - Entity ID to destroy
   * @returns {boolean} True if entity was destroyed
   */
  destroyEntity(id) {
    const entity = this._entities.get(id);
    if (!entity) return false;
    
    // Remove from spatial grid
    if (this._spatialGrid) {
      this._spatialGrid.remove(entity);
    }
    
    // Call entity destroy method if available
    if (entity.destroy) {
      entity.destroy();
    }
    
    this._entities.delete(id);
    return true;
  }
  
  /**
   * Update all entities
   * 
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updateEntities(deltaTime) {
    for (const entity of this._entities.values()) {
      // Skip inactive entities
      if (entity.isActive === false) continue;
      
      if (entity.update) {
        entity.update(deltaTime);
      }
      
      // Update spatial grid if entity moved
      if (this._spatialGrid && entity.getPosition) {
        this._spatialGrid.update(entity);
      }
    }
  }
  
  // ============================================================
  // TERRAIN API (~100 lines)
  // ============================================================
  
  /**
   * Load terrain data
   * 
   * @param {Object} terrainData - Terrain configuration
   * @param {number} terrainData.width - Terrain width
   * @param {number} terrainData.height - Terrain height
   * @param {Array} [terrainData.tiles] - Tile data
   */
  loadTerrain(terrainData) {
    this._terrain = terrainData;
    this._terrainDirty = true;
    
    // Initialize terrain cache if p5.js available
    if (typeof createGraphics !== 'undefined') {
      this._terrainCache = createGraphics(terrainData.width, terrainData.height);
    }
  }
  
  /**
   * Get tile at world coordinates (delegates to terrain)
   * 
   * @param {number} x - X world coordinate
   * @param {number} y - Y world coordinate
   * @returns {Object|null} Tile data or null
   */
  getTileAtWorldCoords(x, y) {
    if (!this._terrain) return null;
    
    // Delegate to terrain if it has the method
    if (this._terrain.getTileAtWorldCoords) {
      return this._terrain.getTileAtWorldCoords(x, y);
    }
    
    // Fallback: convert and use grid method
    const TILE_SIZE = 32;
    const gridX = Math.floor(x / TILE_SIZE);
    const gridY = Math.floor(y / TILE_SIZE);
    
    return this.getTileAtGridCoords(gridX, gridY);
  }
  
  /**
   * Alias for getTileAtWorldCoords (backward compatibility)
   */
  getTileAt(x, y) {
    return this.getTileAtWorldCoords(x, y);
  }
  
  /**
   * Get tile at grid coordinates (delegates to terrain)
   * 
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object|null} Tile data or null
   */
  getTileAtGridCoords(gridX, gridY) {
    if (!this._terrain) return null;
    
    // Delegate to terrain if it has the method
    if (this._terrain.getTileAtGridCoords) {
      return this._terrain.getTileAtGridCoords(gridX, gridY);
    }
    
    // Fallback: direct tile array access
    if (!this._terrain.tiles) return null;
    
    const gridWidth = Math.floor(this._terrain.width / 32);
    const gridHeight = Math.floor(this._terrain.height / 32);
    
    if (gridX < 0 || gridX >= gridWidth || gridY < 0 || gridY >= gridHeight) {
      return null;
    }
    
    const index = gridY * gridWidth + gridX;
    return this._terrain.tiles[index] || null;
  }
  
  /**
   * Get terrain type at position
   * 
   * @param {number} x - X world coordinate
   * @param {number} y - Y world coordinate
   * @returns {string|null} Terrain type or null
   */
  getTerrainType(x, y) {
    const tile = this.getTileAt(x, y);
    return tile ? tile.type : null;
  }
  
  /**
   * Convert world coordinates to grid coordinates (delegates to terrain)
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Grid coordinates {x, y}
   */
  worldToGrid(worldX, worldY) {
    // Delegate to terrain if it has the method
    if (this._terrain && this._terrain.worldToGrid) {
      return this._terrain.worldToGrid(worldX, worldY);
    }
    
    // Fallback: direct calculation
    const TILE_SIZE = 32;
    return {
      x: Math.floor(worldX / TILE_SIZE),
      y: Math.floor(worldY / TILE_SIZE)
    };
  }
  
  /**
   * Convert grid coordinates to world coordinates (delegates to terrain)
   * 
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  gridToWorld(gridX, gridY) {
    // Delegate to terrain if it has the method
    if (this._terrain && this._terrain.gridToWorld) {
      return this._terrain.gridToWorld(gridX, gridY);
    }
    
    // Fallback: direct calculation
    const TILE_SIZE = 32;
    return {
      x: gridX * TILE_SIZE,
      y: gridY * TILE_SIZE
    };
  }
  
  /**
   * Get terrain dimensions
   * 
   * @returns {Object} Terrain dimensions {rows, cols, cellSize, worldWidth, worldHeight}
   */
  getTerrainDimensions() {
    if (!this._terrain) {
      throw new Error('Terrain not loaded');
    }
    
    const TILE_SIZE = 32;
    const gridWidth = this._terrain.grid ? this._terrain.grid.cols : Math.floor(this._terrain.width / TILE_SIZE);
    const gridHeight = this._terrain.grid ? this._terrain.grid.rows : Math.floor(this._terrain.height / TILE_SIZE);
    const cellSize = this._terrain.grid ? this._terrain.grid.cellSize : TILE_SIZE;
    
    return {
      rows: gridHeight,
      cols: gridWidth,
      cellSize: cellSize,
      worldWidth: this._terrain.width,
      worldHeight: this._terrain.height
    };
  }
  
  /**
   * Check if grid coordinates are in bounds
   * 
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {boolean} True if in bounds
   */
  isInBounds(gridX, gridY) {
    if (!this._terrain) return false;
    const TILE_SIZE = 32;
    const gridWidth = Math.floor(this._terrain.width / TILE_SIZE);
    const gridHeight = Math.floor(this._terrain.height / TILE_SIZE);
    return gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight;
  }
  
  /**
   * Cache terrain layer to graphics buffer
   * @private
   */
  _cacheTerrainLayer() {
    if (!this._terrainCache || !this._terrain) return;
    
    this._terrainCache.push();
    this._terrainCache.background(34, 139, 34); // Green background
    
    // Render tiles if available
    if (this._terrain.tiles && typeof this._terrain.renderTile === 'function') {
      for (const tile of this._terrain.tiles) {
        this._terrain.renderTile(this._terrainCache, tile);
      }
    }
    
    this._terrainCache.pop();
    this._terrainDirty = false;
  }
  
  // ============================================================
  // SPATIAL QUERY API (~50 lines)
  // ============================================================
  
  /**
   * Get entities near a point
   * 
   * @param {number} x - X world coordinate
   * @param {number} y - Y world coordinate
   * @param {number} radius - Search radius
   * @param {Object} options - Filter options (type, faction)
   * @returns {Array<Object>} Nearby entities
   */
  getNearbyEntities(x, y, radius, options = {}) {
    let results;
    
    if (!this._spatialGrid) {
      // Fallback: linear search
      results = this.getAllEntities().filter(entity => {
        const pos = entity.getPosition ? entity.getPosition() : entity.position;
        if (!pos) return false;
        const dx = pos.x - x;
        const dy = pos.y - y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
      });
    } else {
      // Delegate to spatial grid
      results = this._spatialGrid.getNearbyEntities(x, y, radius, options);
    }
    
    // Apply filters (in case spatial grid doesn't support them)
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }
    if (options.faction) {
      results = results.filter(e => e.faction === options.faction);
    }
    
    return results;
  }
  
  /**
   * Get entities in rectangle
   * 
   * @param {number} x - Rectangle X
   * @param {number} y - Rectangle Y
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {Object} options - Filter options (type, faction)
   * @returns {Array<Object>} Entities in rectangle
   */
  getEntitiesInRect(x, y, width, height, options = {}) {
    let results;
    
    if (!this._spatialGrid) {
      // Fallback: linear search
      results = this.getAllEntities().filter(entity => {
        const pos = entity.getPosition ? entity.getPosition() : entity.position;
        if (!pos) return false;
        return pos.x >= x && pos.x <= x + width &&
               pos.y >= y && pos.y <= y + height;
      });
    } else {
      // Delegate to spatial grid
      results = this._spatialGrid.getEntitiesInRect(x, y, width, height, options);
    }
    
    // Apply filters (in case spatial grid doesn't support them)
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }
    if (options.faction) {
      results = results.filter(e => e.faction === options.faction);
    }
    
    return results;
  }
  
  /**
   * Find nearest entity to a point
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Nearest entity or null
   */
  findNearestEntity(x, y) {
    const entities = this.getAllEntities();
    if (entities.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const entity of entities) {
      const pos = entity.getPosition ? entity.getPosition() : entity.position;
      if (!pos) continue;
      
      const dx = pos.x - x;
      const dy = pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = entity;
      }
    }
    
    return nearest;
  }
  
  // ============================================================
  // CAMERA API (~100 lines)
  // ============================================================
  
  /**
   * Set camera position
   * 
   * @param {number} x - Camera X position
   * @param {number} y - Camera Y position
   */
  setCameraPosition(x, y) {
    this._camera.x = x;
    this._camera.y = y;
  }
  
  /**
   * Get camera position
   * 
   * @returns {Object} Camera position {x, y}
   */
  getCameraPosition() {
    return { x: this._camera.x, y: this._camera.y };
  }
  
  /**
   * Set camera zoom
   * 
   * @param {number} zoom - Zoom level (0.5 - 3.0)
   */
  setCameraZoom(zoom) {
    this._camera.zoom = Math.max(this._camera.minZoom, 
                                  Math.min(this._camera.maxZoom, zoom));
  }
  
  /**
   * Get camera zoom
   * 
   * @returns {number} Current zoom level
   */
  getCameraZoom() {
    return this._camera.zoom;
  }
  
  /**
   * Get camera object (full state)
   * 
   * @returns {Object} Camera object with x, y, zoom
   */
  getCamera() {
    return {
      x: this._camera.x,
      y: this._camera.y,
      zoom: this._camera.zoom
    };
  }
  
  /**
   * Move camera by delta
   * 
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  moveCamera(dx, dy) {
    this._camera.x += dx;
    this._camera.y += dy;
  }
  
  /**
   * Center camera on entity
   * 
   * @param {Object} entity - Entity to center on
   */
  centerCameraOnEntity(entity) {
    const pos = entity.getPosition ? entity.getPosition() : entity.position;
    if (pos) {
      this._camera.x = pos.x;
      this._camera.y = pos.y;
    }
  }
  
  /**
   * Get camera bounds (viewport)
   * 
   * @param {number} screenWidth - Screen width (optional, uses global width if not provided)
   * @param {number} screenHeight - Screen height (optional, uses global height if not provided)
   * @returns {Object} Camera bounds {minX, minY, maxX, maxY}
   */
  getCameraBounds(screenWidth, screenHeight) {
    const w = screenWidth || (typeof width !== 'undefined' ? width : 800);
    const h = screenHeight || (typeof height !== 'undefined' ? height : 600);
    
    const worldWidth = w / this._camera.zoom;
    const worldHeight = h / this._camera.zoom;
    
    return {
      minX: this._camera.x - worldWidth / 2,
      minY: this._camera.y - worldHeight / 2,
      maxX: this._camera.x + worldWidth / 2,
      maxY: this._camera.y + worldHeight / 2
    };
  }
  
  /**
   * Convert screen coordinates to world coordinates
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {x, y}
   */
  screenToWorld(screenX, screenY) {
    // Screen coordinates are relative to top-left (0,0)
    // Camera position is the world coordinate at the screen center
    // Need to convert screen coords to relative-to-center, then apply camera transform
    const w = (typeof width !== 'undefined') ? width : 800;
    const h = (typeof height !== 'undefined') ? height : 600;
    
    return {
      x: this._camera.x + (screenX - w / 2) / this._camera.zoom,
      y: this._camera.y + (screenY - h / 2) / this._camera.zoom
    };
  }
  
  /**
   * Convert world coordinates to screen coordinates
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {x, y}
   */
  worldToScreen(worldX, worldY) {
    // Camera position is the world coordinate at the screen center
    // Convert world coords relative to camera, apply zoom, then offset by screen center
    const w = (typeof width !== 'undefined') ? width : 800;
    const h = (typeof height !== 'undefined') ? height : 600;
    
    return {
      x: (worldX - this._camera.x) * this._camera.zoom + w / 2,
      y: (worldY - this._camera.y) * this._camera.zoom + h / 2
    };
  }
  
  // ============================================================
  // ANT-SPECIFIC API (~150 lines)
  // ============================================================
  
  /**
   * Get ants by job name
   * 
   * @param {string} jobName - Job name to filter by
   * @returns {Array<Object>} Ants with matching job
   */
  getAntsByJob(jobName) {
    return this.getEntitiesByType('Ant').filter(ant => {
      const job = ant.getJobName ? ant.getJobName() : ant.jobName;
      return job === jobName;
    });
  }
  
  /**
   * Get selected ants
   * 
   * @returns {Array<Object>} Selected ants
   */
  getSelectedAnts() {
    return this.getEntitiesByType('Ant').filter(ant => {
      // Support both function and property forms
      if (typeof ant.isSelected === 'function') {
        return ant.isSelected();
      }
      if (ant.getSelected) {
        return ant.getSelected();
      }
      return ant.isSelected === true;
    });
  }
  
  /**
   * Select all ants
   */
  selectAllAnts() {
    const ants = this.getEntitiesByType('Ant');
    for (const ant of ants) {
      if (ant.setSelected) {
        ant.setSelected(true);
      } else {
        ant.isSelected = true;
      }
    }
  }
  
  /**
   * Clear all ant selections
   */
  clearAntSelections() {
    const ants = this.getEntitiesByType('Ant');
    for (const ant of ants) {
      if (ant.setSelected) {
        ant.setSelected(false);
      } else {
        ant.isSelected = false;
      }
    }
  }
  
  /**
   * Clear all ant selections (alias for clearAntSelections)
   */
  clearAntSelection() {
    return this.clearAntSelections();
  }
  
  /**
   * Check if any ant is selected
   * 
   * @returns {boolean} True if at least one ant is selected
   */
  hasSelectedAnts() {
    return this.getSelectedAnts().length > 0;
  }
  
  /**
   * Check if any ant is selected (alias for hasSelectedAnts)
   * 
   * @returns {boolean} True if at least one ant is selected
   */
  hasAntSelection() {
    return this.hasSelectedAnts();
  }
  
  /**
   * Move selected ants in formation
   * 
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   * @param {string} formation - Formation type ('circle', 'line', 'grid')
   */
  moveAntsInFormation(targetX, targetY, formation = 'circle') {
    const selectedAnts = this.getSelectedAnts();
    if (selectedAnts.length === 0) return;
    
    if (formation === 'circle') {
      const radius = 50;
      const angleStep = (2 * Math.PI) / selectedAnts.length;
      
      selectedAnts.forEach((ant, i) => {
        const angle = i * angleStep;
        const x = targetX + Math.cos(angle) * radius;
        const y = targetY + Math.sin(angle) * radius;
        
        if (ant.moveToLocation) {
          ant.moveToLocation(x, y);
        }
      });
    } else if (formation === 'line') {
      const spacing = 30;
      const startX = targetX - (selectedAnts.length * spacing) / 2;
      
      selectedAnts.forEach((ant, i) => {
        const x = startX + i * spacing;
        
        if (ant.moveToLocation) {
          ant.moveToLocation(x, targetY);
        }
      });
    } else if (formation === 'grid') {
      const cols = Math.ceil(Math.sqrt(selectedAnts.length));
      const spacing = 30;
      
      selectedAnts.forEach((ant, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = targetX + col * spacing;
        const y = targetY + row * spacing;
        
        if (ant.moveToLocation) {
          ant.moveToLocation(x, y);
        }
      });
    }
  }
  
  /**
   * Move ants in circle formation
   * 
   * @param {Array<Object>} ants - Ants to move
   * @param {number} centerX - Circle center X
   * @param {number} centerY - Circle center Y
   * @param {number} radius - Circle radius
   */
  moveAntsInCircle(ants, centerX, centerY, radius = 50) {
    if (!ants || ants.length === 0) return;
    
    const angleStep = (2 * Math.PI) / ants.length;
    
    ants.forEach((ant, i) => {
      const angle = i * angleStep;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (ant.moveToLocation) {
        ant.moveToLocation(x, y);
      }
    });
  }
  
  /**
   * Move ants in line formation
   * 
   * @param {Array<Object>} ants - Ants to move
   * @param {number} startX - Line start X
   * @param {number} startY - Line start Y
   * @param {number} endX - Line end X
   * @param {number} endY - Line end Y
   */
  moveAntsInLine(ants, startX, startY, endX, endY) {
    if (!ants || ants.length === 0) return;
    
    const dx = endX - startX;
    const dy = endY - startY;
    
    ants.forEach((ant, i) => {
      const t = ants.length > 1 ? i / (ants.length - 1) : 0;
      const x = startX + dx * t;
      const y = startY + dy * t;
      
      if (ant.moveToLocation) {
        ant.moveToLocation(x, y);
      }
    });
  }
  
  /**
   * Move ants in grid formation
   * 
   * @param {Array<Object>} ants - Ants to move
   * @param {number} startX - Grid start X
   * @param {number} startY - Grid start Y
   * @param {number} spacing - Spacing between ants
   * @param {number} cols - Number of columns (optional, auto-calculates if not provided)
   */
  moveAntsInGrid(ants, startX, startY, spacing = 32, cols = null) {
    if (!ants || ants.length === 0) return;
    
    const columns = cols || Math.ceil(Math.sqrt(ants.length));
    
    ants.forEach((ant, i) => {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      
      if (ant.moveToLocation) {
        ant.moveToLocation(x, y);
      }
    });
  }
  
  /**
   * Set state for selected ants
   * 
   * @param {string} state - State to set
   */
  setSelectedAntsState(state) {
    const selectedAnts = this.getSelectedAnts();
    for (const ant of selectedAnts) {
      if (ant.setState) {
        ant.setState(state);
      }
    }
  }
  
  /**
   * Change state for selected ants (alias for setSelectedAntsState)
   * 
   * @param {string} state - State to set
   */
  changeSelectedAntsState(state) {
    return this.setSelectedAntsState(state);
  }
  
  /**
   * Set selected ants to idle state
   */
  setSelectedAntsIdle() {
    const selectedAnts = this.getSelectedAnts();
    for (const ant of selectedAnts) {
      if (ant.setState) {
        ant.setState('idle');
      } else if (ant.changeState) {
        ant.changeState('idle');
      }
    }
  }
  
  /**
   * Set selected ants to gathering state
   */
  setSelectedAntsGathering() {
    const selectedAnts = this.getSelectedAnts();
    for (const ant of selectedAnts) {
      if (ant.setState) {
        ant.setState('gathering');
      } else if (ant.changeState) {
        ant.changeState('gathering');
      }
    }
  }
  
  /**
   * Pause entity
   * 
   * @param {number|Object} entityOrId - Entity ID or entity object
   */
  pauseEntity(entityOrId) {
    const entity = typeof entityOrId === 'number' ? 
                   this.getEntityById(entityOrId) : 
                   entityOrId;
    
    if (entity) {
      if (entity.setPaused) {
        entity.setPaused(true);
      } else if (entity.setActive) {
        entity.setActive(false);
      } else {
        entity.isActive = false;
      }
    }
  }
  
  /**
   * Resume entity
   * 
   * @param {number|Object} entityOrId - Entity ID or entity object
   */
  resumeEntity(entityOrId) {
    const entity = typeof entityOrId === 'number' ? 
                   this.getEntityById(entityOrId) : 
                   entityOrId;
    
    if (entity) {
      if (entity.setPaused) {
        entity.setPaused(false);
      } else if (entity.setActive) {
        entity.setActive(true);
      } else {
        entity.isActive = true;
      }
    }
  }
  
  /**
   * Pause/resume ant (legacy method)
   * 
   * @param {number} antId - Ant entity ID
   * @param {boolean} paused - True to pause, false to resume
   */
  setAntPaused(antId, paused) {
    if (paused) {
      this.pauseEntity(antId);
    } else {
      this.resumeEntity(antId);
    }
  }
  
  // ============================================================
  // RESOURCE MANAGEMENT API (~200 lines)
  // ============================================================
  
  /**
   * Initialize resource spawning system
   * @private
   */
  _initResourceSystem() {
    this._resourceSystem = {
      active: false,
      spawnInterval: 5000, // 5 seconds
      lastSpawnTime: 0,
      maxCapacity: 100,
      registeredTypes: new Map(), // Map<type, config>
      selectedType: null,
      focusedCollection: false
    };
  }
  
  /**
   * Start automatic resource spawning
   */
  startResourceSpawning() {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    this._resourceSystem.active = true;
    this._resourceSystem.lastSpawnTime = Date.now();
  }
  
  /**
   * Stop automatic resource spawning
   */
  stopResourceSpawning() {
    if (this._resourceSystem) {
      this._resourceSystem.active = false;
    }
  }
  
  /**
   * Set max resource capacity
   * 
   * @param {number} capacity - Maximum resources
   */
  setResourceMaxCapacity(capacity) {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    this._resourceSystem.maxCapacity = capacity;
  }
  
  /**
   * Get resources by type
   * 
   * @param {string} type - Resource type
   * @returns {Array<Object>} Resources of that type
   */
  getResourcesByType(type) {
    return this.getEntitiesByType('Resource').filter(resource => {
      // Check multiple possible property names
      const resType = resource.resourceType || 
                      (resource.getResourceType && resource.getResourceType()) ||
                      (resource.getType && resource.getType()) || 
                      resource.type;
      return resType === type;
    });
  }
  
  /**
   * Select resource type for focused collection
   * 
   * @param {string} type - Resource type to select
   */
  selectResourceType(type) {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    this._resourceSystem.selectedType = type;
  }
  
  /**
   * Get selected resource type
   * 
   * @returns {string|null} Selected resource type or null
   */
  getSelectedResourceType() {
    return this._resourceSystem ? this._resourceSystem.selectedType : null;
  }
  
  /**
   * Clear resource type selection
   */
  clearResourceTypeSelection() {
    if (this._resourceSystem) {
      this._resourceSystem.selectedType = null;
    }
  }
  
  /**
   * Clear resource selection (alias for clearResourceTypeSelection)
   */
  clearResourceSelection() {
    return this.clearResourceTypeSelection();
  }
  
  /**
   * Check if resource type is selected
   * 
   * @param {string} type - Resource type
   * @returns {boolean} True if selected
   */
  isResourceTypeSelected(type) {
    return this._resourceSystem && this._resourceSystem.selectedType === type;
  }
  
  /**
   * Get selected resource type resources
   * 
   * @returns {Array<Object>} Resources of selected type
   */
  getSelectedTypeResources() {
    if (!this._resourceSystem || !this._resourceSystem.selectedType) {
      return [];
    }
    return this.getResourcesByType(this._resourceSystem.selectedType);
  }
  
  /**
   * Enable/disable focused collection mode
   * 
   * @param {boolean} enabled - True to enable focused collection
   */
  setFocusedCollection(enabled) {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    this._resourceSystem.focusedCollection = enabled;
  }
  
  /**
   * Check if focused collection is enabled
   * 
   * @returns {boolean} True if focused collection is enabled
   */
  isFocusedCollectionEnabled() {
    return this._resourceSystem ? this._resourceSystem.focusedCollection === true : false;
  }
  
  /**
   * Register resource type for spawning
   * 
   * @param {string} type - Resource type
   * @param {Object} config - Spawn configuration
   */
  registerResourceType(type, config) {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    this._resourceSystem.registeredTypes.set(type, config);
    
    // If initialSpawnCount is specified, spawn resources immediately
    if (config.initialSpawnCount && config.initialSpawnCount > 0) {
      for (let i = 0; i < config.initialSpawnCount; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 600;
        // Use greenLeaf as base, then override resourceType property
        const resource = this.spawnEntity('Resource', { x, y, resourceType: 'greenLeaf', ...config });
        if (resource) {
          resource.resourceType = type; // Override with custom type
        }
      }
    }
  }
  
  /**
   * Get registered resource types
   * 
   * @returns {Object} Map of registered resource types
   */
  getRegisteredResourceTypes() {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    // Convert Map to plain object for easier testing
    const types = {};
    for (const [key, value] of this._resourceSystem.registeredTypes) {
      types[key] = value;
    }
    return types;
  }
  
  /**
   * Force spawn resource immediately
   * 
   * @param {string} [type='greenLeaf'] - Resource type
   * @returns {Object|null} Spawned resource or null
   */
  forceSpawnResource(type = 'greenLeaf') {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    
    // Spawn at random position
    const x = Math.random() * 800;
    const y = Math.random() * 600;
    
    return this.spawnEntity('Resource', { x, y, resourceType: type });
  }
  
  /**
   * Get resource system status
   * 
   * @returns {Object} Resource system status
   */
  getResourceSystemStatus() {
    if (!this._resourceSystem) {
      this._initResourceSystem();
    }
    
    const resourceCount = this.getEntitiesByType('Resource').length;
    
    return {
      active: this._resourceSystem.active,
      isSpawningActive: this._resourceSystem.active, // Alias for active
      count: resourceCount,
      totalResources: resourceCount, // Alias for count
      maxCapacity: this._resourceSystem.maxCapacity,
      selectedType: this._resourceSystem.selectedType,
      registeredTypes: Array.from(this._resourceSystem.registeredTypes.keys())
    };
  }
  
  /**
   * Remove resource from collection
   * 
   * @param {number} resourceId - Resource entity ID
   * @returns {boolean} True if removed
   */
  removeResource(resourceId) {
    return this.destroyEntity(resourceId);
  }
  
  /**
   * Update resource spawning system
   * @private
   */
  _updateResourceSpawning() {
    if (!this._resourceSystem || !this._resourceSystem.active) return;
    
    const now = Date.now();
    const timeSinceLastSpawn = now - this._resourceSystem.lastSpawnTime;
    
    if (timeSinceLastSpawn >= this._resourceSystem.spawnInterval) {
      const resourceCount = this.getEntitiesByType('Resource').length;
      
      if (resourceCount < this._resourceSystem.maxCapacity) {
        // Spawn random resource type
        const types = Array.from(this._resourceSystem.registeredTypes.keys());
        if (types.length > 0) {
          const randomType = types[Math.floor(Math.random() * types.length)];
          this.forceSpawnResource(randomType);
        }
      }
      
      this._resourceSystem.lastSpawnTime = now;
    }
  }
  
  /**
   * Get nearby entities on walkable terrain
   * 
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array<Object>} Nearby entities on walkable terrain
   */
  getNearbyEntitiesOnWalkableTerrain(x, y, radius) {
    const nearby = this.getNearbyEntities(x, y, radius);
    
    return nearby.filter(entity => {
      const pos = entity.getPosition ? entity.getPosition() : entity.position;
      if (!pos) return false;
      
      const terrainType = this.getTerrainType(pos.x, pos.y);
      // Assume 'water' and 'stone' are unwalkable
      return terrainType !== 'water' && terrainType !== 'stone';
    });
  }
  
  // ============================================================
  // INPUT HANDLING API (~150 lines)
  // ============================================================
  
  /**
   * Handle mouse press event
   * 
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMousePress(x, y) {
    this._mouse.x = x;
    this._mouse.y = y;
    this._mouse.pressed = true;
    
    // Start selection box
    const worldPos = this.screenToWorld(x, y);
    this._selectionBox = {
      startX: worldPos.x,
      startY: worldPos.y,
      endX: worldPos.x,
      endY: worldPos.y
    };
  }
  
  /**
   * Handle mouse move event
   * 
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMouseMove(x, y) {
    this._mouse.x = x;
    this._mouse.y = y;
    
    // Update selection box if dragging
    if (this._mouse.pressed && this._selectionBox) {
      const worldPos = this.screenToWorld(x, y);
      this._selectionBox.endX = worldPos.x;
      this._selectionBox.endY = worldPos.y;
    }
    
    // Update crosshair state
    this._updateCrosshairState();
  }
  
  /**
   * Handle mouse release event
   * 
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  handleMouseRelease(x, y) {
    this._mouse.x = x;
    this._mouse.y = y;
    this._mouse.pressed = false;
    
    // Complete selection box
    if (this._selectionBox) {
      const minX = Math.min(this._selectionBox.startX, this._selectionBox.endX);
      const maxX = Math.max(this._selectionBox.startX, this._selectionBox.endX);
      const minY = Math.min(this._selectionBox.startY, this._selectionBox.endY);
      const maxY = Math.max(this._selectionBox.startY, this._selectionBox.endY);
      
      // Get entities in selection box
      const selected = this.getEntitiesInRect(minX, minY, maxX - minX, maxY - minY);
      
      // Notify entities of selection
      for (const entity of selected) {
        if (entity.setSelected) {
          entity.setSelected(true);
        }
      }
      
      this._selectionBox = null;
    }
  }
  
  /**
   * Handle key press event
   * 
   * @param {string} key - Key pressed
   */
  handleKeyPress(key) {
    this._keys.set(key, true);
    
    // Check for shortcuts
    const callback = this._shortcuts.get(key);
    if (callback) {
      callback();
    }
  }
  
  /**
   * Handle key release event
   * 
   * @param {string} key - Key released
   */
  handleKeyRelease(key) {
    this._keys.delete(key);
  }
  
  /**
   * Register keyboard shortcut
   * 
   * @param {string} key - Key to bind
   * @param {Function} callback - Callback function
   */
  registerShortcut(key, callback) {
    this._shortcuts.set(key, callback);
  }
  
  /**
   * Check if key is currently pressed
   * 
   * @param {string} key - Key to check
   * @returns {boolean} True if key is pressed
   */
  isKeyPressed(key) {
    return this._keys.has(key);
  }
  
  /**
   * Get current selection box
   * 
   * @returns {Object|null} Selection box or null
   */
  getSelectionBox() {
    return this._selectionBox;
  }
  
  /**
   * Update crosshair hover state
   * @private
   */
  _updateCrosshairState() {
    const worldPos = this.screenToWorld(this._mouse.x, this._mouse.y);
    const nearbyEntities = this.getNearbyEntities(worldPos.x, worldPos.y, 20);
    this._crosshairOverEntity = nearbyEntities.length > 0;
  }
  
  // ============================================================
  // UI PANEL MANAGEMENT API (~100 lines - from DraggablePanelManager)
  // ============================================================
  
  /**
   * Register UI panel
   * 
   * @param {Object} panel - Panel instance
   * @returns {string} Panel ID
   */
  registerPanel(panel) {
    const id = panel.id || `panel_${this._panels.size}`;
    panel.id = id;
    panel.zIndex = this._panelZIndex++;
    this._panels.set(id, panel);
    return id;
  }
  
  /**
   * Remove UI panel
   * 
   * @param {string} id - Panel ID
   * @returns {boolean} True if panel was removed
   */
  removePanel(id) {
    return this._panels.delete(id);
  }
  
  /**
   * Bring panel to front
   * 
   * @param {string} id - Panel ID
   */
  bringToFront(id) {
    const panel = this._panels.get(id);
    if (panel) {
      panel.zIndex = this._panelZIndex++;
      this._activePanelId = id;
    }
  }
  
  /**
   * Get panel by ID
   * 
   * @param {string} id - Panel ID
   * @returns {Object|null} Panel instance or null
   */
  getPanelById(id) {
    return this._panels.get(id) || null;
  }
  
  /**
   * Get all panels
   * 
   * @returns {Array<Object>} All panel instances
   */
  getAllPanels() {
    return Array.from(this._panels.values());
  }
  
  /**
   * Get visible panels
   * 
   * @returns {Array<Object>} Visible panels
   */
  getVisiblePanels() {
    return this.getAllPanels().filter(panel => panel.visible !== false);
  }
  
  /**
   * Update all panels
   * 
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  updatePanels(deltaTime) {
    for (const panel of this._panels.values()) {
      if (panel.update) {
        panel.update(deltaTime);
      }
    }
  }
  
  /**
   * Unregister panel by ID
   * 
   * @param {string} panelId - Panel ID
   * @returns {boolean} True if unregistered
   */
  unregisterPanel(panelId) {
    return this.removePanel(panelId);
  }
  
  /**
   * Hide panel by ID
   * 
   * @param {string} panelId - Panel ID
   */
  hidePanel(panelId) {
    const panel = this.getPanelById(panelId);
    if (panel) {
      panel.visible = false;
      if (panel.setVisible) {
        panel.setVisible(false);
      }
    }
  }
  
  /**
   * Show panel by ID
   * 
   * @param {string} panelId - Panel ID
   */
  showPanel(panelId) {
    const panel = this.getPanelById(panelId);
    if (panel) {
      panel.visible = true;
      if (panel.setVisible) {
        panel.setVisible(true);
      }
      this.bringToFront(panelId);
    }
  }
  
  /**
   * Toggle panel visibility
   * 
   * @param {string} panelId - Panel ID
   */
  togglePanel(panelId) {
    const panel = this.getPanelById(panelId);
    if (!panel) return;
    
    const isVisible = panel.visible !== false;
    if (isVisible) {
      this.hidePanel(panelId);
    } else {
      this.showPanel(panelId);
    }
  }
  
  /**
   * Check if panel is visible
   * 
   * @param {string} panelId - Panel ID
   * @returns {boolean} True if visible
   */
  isPanelVisible(panelId) {
    const panel = this.getPanelById(panelId);
    return panel && panel.visible !== false;
  }
  
  /**
   * Start dragging panel
   * 
   * @param {string} panelId - Panel ID
   * @param {number} offsetX - X offset from panel origin
   * @param {number} offsetY - Y offset from panel origin
   */
  startPanelDrag(panelId, offsetX, offsetY) {
    const panel = this.getPanelById(panelId);
    if (panel) {
      this._panelDragState = {
        panelId,
        offsetX,
        offsetY,
        active: true
      };
      this.bringToFront(panelId);
    }
  }
  
  /**
   * Update panel drag position
   * 
   * @param {number} mouseX - Current mouse X
   * @param {number} mouseY - Current mouse Y
   */
  updatePanelDrag(mouseX, mouseY) {
    if (!this._panelDragState || !this._panelDragState.active) return;
    
    const panel = this.getPanelById(this._panelDragState.panelId);
    if (panel) {
      panel.x = mouseX - this._panelDragState.offsetX;
      panel.y = mouseY - this._panelDragState.offsetY;
      
      if (panel.setPosition) {
        panel.setPosition(panel.x, panel.y);
      }
    }
  }
  
  /**
   * Stop dragging panel
   */
  stopPanelDrag() {
    if (this._panelDragState) {
      this._panelDragState.active = false;
      this._panelDragState = null;
    }
  }
  
  // ============================================================
  // RENDERING API (~200 lines)
  // ============================================================
  
  /**
   * Render entire world
   * 
   * Layer order: TERRAIN → ENTITIES → EFFECTS → PANELS → HUD
   */
  render() {
    // Layer 1: Terrain (with simple cache)
    this._renderTerrain();
    
    // Layer 2: Entities (depth-sorted if needed)
    this._renderEntities();
    
    // Layer 3: Effects
    this._renderEffects();
    
    // Layer 4: UI Panels (z-ordered)
    this._renderPanels();
    
    // Layer 5: HUD (crosshair, selection box, custom)
    if (this._hudVisible) {
      this._renderHUD();
      
      // Custom HUD renderer if provided
      if (this._customHUDRenderer) {
        this._customHUDRenderer();
      }
    }
    
    // Layer 6: Debug overlays if enabled
    if (this._debugRenderEnabled) {
      this.renderWithDebug(this._debugRenderOptions);
    }
  }
  
  /**
   * Render terrain layer
   * @private
   */
  _renderTerrain() {
    if (!this._terrain) return;
    
    if (typeof push === 'undefined') return; // No p5.js
    
    // Use cached terrain if available and not dirty
    if (this._terrainCache && !this._terrainDirty) {
      push();
      image(this._terrainCache, 0, 0);
      pop();
    } else if (this._terrainCache) {
      // Recache terrain
      this._cacheTerrainLayer();
      push();
      image(this._terrainCache, 0, 0);
      pop();
    } else {
      // No cache - render directly
      push();
      fill(34, 139, 34); // Green
      noStroke();
      rect(0, 0, this._terrain.width, this._terrain.height);
      pop();
    }
  }
  
  /**
   * Render entities layer
   * @private
   */
  _renderEntities() {
    const entities = this.getAllEntities();
    
    // Depth sort if enabled (y-axis sorting for isometric feel)
    if (this._enableDepthSort) {
      entities.sort((a, b) => {
        const posA = a.getPosition ? a.getPosition() : a.position;
        const posB = b.getPosition ? b.getPosition() : b.position;
        if (!posA || !posB) return 0;
        return posA.y - posB.y;
      });
    }
    
    // Render each entity
    for (const entity of entities) {
      if (entity.render) {
        entity.render();
      }
    }
  }
  
  /**
   * Render effects layer
   * @private
   */
  _renderEffects() {
    for (const effect of this._activeEffects) {
      if (effect.render) {
        effect.render();
      }
    }
    
    // Remove inactive effects
    this._activeEffects = this._activeEffects.filter(effect => {
      return effect.isActive !== false;
    });
  }
  
  /**
   * Render panels layer
   * @private
   */
  _renderPanels() {
    // Sort panels by z-index
    const sortedPanels = this.getAllPanels()
      .filter(panel => panel.visible !== false)
      .sort((a, b) => a.zIndex - b.zIndex);
    
    for (const panel of sortedPanels) {
      if (panel.render) {
        panel.render();
      }
    }
  }
  
  /**
   * Render HUD layer (crosshair, selection box)
   * @private
   */
  _renderHUD() {
    if (typeof push === 'undefined') return; // No p5.js
    
    // Render crosshair
    if (this._crosshairEnabled) {
      this._renderCrosshair();
    }
    
    // Render selection box
    if (this._selectionBox) {
      this._renderSelectionBox();
    }
  }
  
  /**
   * Render mouse crosshair (merged from MouseCrosshair.js)
   * @private
   */
  _renderCrosshair() {
    const color = this._crosshairOverEntity 
      ? [0, 255, 0, 200] // Green when over entity
      : [255, 255, 255, 150]; // White normally
    
    push();
    stroke(color);
    strokeWeight(2);
    const size = 20;
    const x = this._mouse.x;
    const y = this._mouse.y;
    line(x - size, y, x + size, y);
    line(x, y - size, x, y + size);
    pop();
  }
  
  /**
   * Render selection box
   * @private
   */
  _renderSelectionBox() {
    if (!this._selectionBox) return;
    
    const start = this.worldToScreen(this._selectionBox.startX, this._selectionBox.startY);
    const end = this.worldToScreen(this._selectionBox.endX, this._selectionBox.endY);
    
    push();
    stroke(0, 255, 0);
    strokeWeight(2);
    noFill();
    rect(start.x, start.y, end.x - start.x, end.y - start.y);
    pop();
  }
  
  /**
   * Enable/disable depth sorting
   * 
   * @param {boolean} enabled - True to enable depth sorting
   */
  setDepthSortEnabled(enabled) {
    this._enableDepthSort = enabled;
  }
  
  /**
   * Enable/disable crosshair
   * 
   * @param {boolean} enabled - True to enable crosshair
   */
  setCrosshairEnabled(enabled) {
    this._crosshairEnabled = enabled;
  }
  
  /**
   * Enable/disable HUD
   * 
   * @param {boolean} visible - True to show HUD
   */
  setHUDVisible(visible) {
    this._hudVisible = visible;
  }
  
  /**
   * Mark terrain cache as dirty (force re-render)
   */
  invalidateTerrainCache() {
    this._terrainDirty = true;
  }
  
  /**
   * Add visual effect
   * 
   * @param {Object} effect - Effect object with render() method
   */
  addEffect(effect) {
    this._activeEffects.push(effect);
  }
  
  /**
   * Remove visual effect
   * 
   * @param {Object} effect - Effect object to remove
   */
  removeEffect(effect) {
    const index = this._activeEffects.indexOf(effect);
    if (index !== -1) {
      this._activeEffects.splice(index, 1);
    }
  }
  
  /**
   * Clear all visual effects
   */
  clearEffects() {
    this._activeEffects = [];
  }
  
  /**
   * Render with debug overlay
   * 
   * @param {Object} options - Debug render options
   */
  renderWithDebug(options = {}) {
    this.render();
    
    if (typeof push === 'undefined') return;
    
    push();
    
    // Debug overlays
    if (options.showGrid) {
      this._renderDebugGrid();
    }
    
    if (options.showEntityBounds) {
      this._renderDebugEntityBounds();
    }
    
    if (options.showSpatialGrid) {
      this._renderDebugSpatialGrid();
    }
    
    pop();
  }
  
  /**
   * Render debug grid
   * @private
   */
  _renderDebugGrid() {
    if (!this._terrain) return;
    
    stroke(255, 255, 255, 50);
    strokeWeight(1);
    
    const tileSize = 32; // Standard tile size
    const width = this._terrain.width;
    const height = this._terrain.height;
    
    // Vertical lines
    for (let x = 0; x <= width; x += tileSize) {
      line(x, 0, x, height);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += tileSize) {
      line(0, y, width, y);
    }
  }
  
  /**
   * Render debug entity bounds
   * @private
   */
  _renderDebugEntityBounds() {
    const entities = this.getAllEntities();
    
    stroke(255, 0, 0, 150);
    strokeWeight(1);
    noFill();
    
    for (const entity of entities) {
      const pos = entity.getPosition ? entity.getPosition() : entity.position;
      if (!pos) continue;
      
      const size = entity.getSize ? entity.getSize() : { width: 32, height: 32 };
      rect(pos.x, pos.y, size.width, size.height);
    }
  }
  
  /**
   * Render debug spatial grid
   * @private
   */
  _renderDebugSpatialGrid() {
    if (!this._spatialGrid) return;
    
    stroke(0, 255, 255, 100);
    strokeWeight(1);
    noFill();
    
    const cellSize = 64; // SpatialGrid cell size
    const width = this._terrain ? this._terrain.width : 800;
    const height = this._terrain ? this._terrain.height : 600;
    
    for (let x = 0; x <= width; x += cellSize) {
      for (let y = 0; y <= height; y += cellSize) {
        rect(x, y, cellSize, cellSize);
      }
    }
  }
  
  // ============================================================
  // AUDIO API (~50 lines)
  // ============================================================
  
  /**
   * Load sound file
   * 
   * @param {string} name - Sound name
   * @param {string} path - Path to sound file
   */
  loadSound(name, path) {
    if (typeof loadSound !== 'undefined') {
      this._sounds.set(name, loadSound(path));
    }
  }
  
  /**
   * Play sound
   * 
   * @param {string} name - Sound name
   */
  playSound(name) {
    const sound = this._sounds.get(name);
    if (sound && sound.play) {
      sound.setVolume(this._volume);
      sound.play();
    }
  }
  
  /**
   * Set global volume
   * 
   * @param {number} volume - Volume level (0.0 - 1.0)
   */
  setVolume(volume) {
    this._volume = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Play background music
   * 
   * @param {string} name - Music track name
   */
  playBackgroundMusic(name) {
    const track = this._sounds.get(name);
    if (track && track.loop) {
      track.setVolume(this._volume);
      track.loop();
      this._bgm = track;
    }
  }
  
  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    if (this._bgm && this._bgm.stop) {
      this._bgm.stop();
      this._bgm = null;
    }
  }
  
  /**
   * Stop a specific sound
   * 
   * @param {string} name - Sound name
   */
  stopSound(name) {
    const sound = this._sounds.get(name);
    if (sound && sound.stop) {
      sound.stop();
    }
  }
  
  /**
   * Get current volume
   * 
   * @returns {number} Volume level (0.0 - 1.0)
   */
  getVolume() {
    return this._volume;
  }
  
  /**
   * Set volume for sound category
   * 
   * @param {string} category - Category ('sfx', 'music')
   * @param {number} volume - Volume level (0.0 - 1.0)
   */
  setVolumeCategory(category, volume) {
    if (!this._volumeCategories) {
      this._volumeCategories = {
        sfx: 1.0,
        music: 1.0
      };
    }
    this._volumeCategories[category] = Math.max(0, Math.min(1, volume));
  }
  
  /**
   * Play sound with category volume
   * 
   * @param {string} name - Sound name
   * @param {string} category - Category ('sfx', 'music')
   */
  playSoundWithCategory(name, category = 'sfx') {
    const sound = this._sounds.get(name);
    if (sound && sound.play) {
      const categoryVolume = this._volumeCategories?.[category] || 1.0;
      sound.setVolume(this._volume * categoryVolume);
      sound.play();
    }
  }
  
  /**
   * Is background music playing?
   * 
   * @returns {boolean} True if BGM is playing
   */
  isBackgroundMusicPlaying() {
    return this._bgm !== null && this._bgm.isPlaying && this._bgm.isPlaying();
  }
  
  /**
   * Set background music for game state
   * 
   * @param {string} state - Game state ('MENU', 'PLAYING', 'PAUSED')
   * @param {string} musicName - Music track name
   */
  setStateBGM(state, musicName) {
    if (!this._stateBGM) {
      this._stateBGM = {};
    }
    this._stateBGM[state] = musicName;
  }
  
  // ============================================================
  // GAME STATE API (~50 lines)
  // ============================================================
  
  /**
   * Set game state
   * 
   * @param {string} state - Game state ('MENU', 'PLAYING', 'PAUSED')
   */
  setGameState(state) {
    const oldState = this._gameState;
    this._gameState = state;
    
    // Trigger callbacks
    const callbacks = this._stateCallbacks.get(state) || [];
    for (const callback of callbacks) {
      callback(state, oldState);
    }
  }
  
  /**
   * Get current game state
   * 
   * @returns {string} Current game state
   */
  getGameState() {
    return this._gameState;
  }
  
  /**
   * Register game state callback
   * 
   * @param {string} state - State to listen for
   * @param {Function} callback - Callback function
   */
  onStateChange(state, callback) {
    if (!this._stateCallbacks.has(state)) {
      this._stateCallbacks.set(state, []);
    }
    this._stateCallbacks.get(state).push(callback);
  }
  
  /**
   * Pause game
   */
  pause() {
    this._isPaused = true;
    this.setGameState('PAUSED');
  }
  
  /**
   * Resume game
   */
  resume() {
    this._isPaused = false;
    this.setGameState('PLAYING');
  }
  
  /**
   * Check if game is paused
   * 
   * @returns {boolean} True if paused
   */
  isPaused() {
    return this._isPaused;
  }
  
  // ============================================================
  // UPDATE LOOP (~50 lines)
  // ============================================================
  
  /**
   * Update all world systems
   * 
   * @param {number} deltaTime - Time since last frame (seconds)
   */
  update(deltaTime) {
    if (this._isPaused) return;
    
    // Update entities
    this.updateEntities(deltaTime);
    
    // Update panels
    this.updatePanels(deltaTime);
    
    // Update resource spawning
    this._updateResourceSpawning();
    
    // Update effects
    for (const effect of this._activeEffects) {
      if (effect.update) {
        effect.update(deltaTime);
      }
    }
    
    // Update crosshair hover state
    if (this._crosshairEnabled && this._mouse) {
      const worldPos = this.screenToWorld(this._mouse.x, this._mouse.y);
      const nearby = this.getNearbyEntities(worldPos.x, worldPos.y, 20);
      this._crosshairOverEntity = nearby.length > 0;
    }
  }
  
  // ============================================================
  // ADDITIONAL HELPER METHODS
  // ============================================================
  
  /**
   * Set custom HUD renderer
   * 
   * @param {Function} renderer - Custom HUD render function
   */
  setHUDRenderer(renderer) {
    this._customHUDRenderer = renderer;
  }
  
  /**
   * Enable/disable debug rendering
   * 
   * @param {boolean} enabled - True to enable debug overlays
   * @param {Object} options - Debug options
   */
  enableDebugRender(enabled, options = {}) {
    this._debugRenderEnabled = enabled;
    this._debugRenderOptions = options;
  }
  
  /**
   * Get panel (alias for getPanelById)
   * 
   * @param {string} panelId - Panel ID
   * @returns {Object|null} Panel instance
   */
  getPanel(panelId) {
    return this.getPanelById(panelId);
  }
  
  /**
   * Bring panel to front (alias for bringToFront)
   * 
   * @param {string} panelId - Panel ID
   */
  bringPanelToFront(panelId) {
    this.bringToFront(panelId);
  }
}

// Browser/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorldService;
}
if (typeof window !== 'undefined') {
  window.WorldService = WorldService;
}
