/**
 * TerrainEditor - In-game terrain editing tools
 * Provides paint, fill, line, and other editing capabilities
 */

class TerrainEditor {
  constructor(terrain) {
    this._terrain = terrain;
    this._selectedMaterial = 'moss';
    this._brushSize = 1;
    this._undoStack = [];
    this._redoStack = [];
    this._maxUndoSize = 50;
    this._gridVisible = true;
    
    // Maximum fill area (100x100 tiles = 10,000)
    this.MAX_FILL_AREA = 10000;
  }

  /**
   * Paint tile at mouse position
   * @param {number} mouseX - Mouse X position (canvas coordinates)
   * @param {number} mouseY - Mouse Y position (canvas coordinates)
   * @param {string} material - Material to paint (optional, uses selected)
   */
  paintTile(mouseX, mouseY, material = null) {
    const tilePos = this._canvasToTilePosition(mouseX, mouseY);
    const paintMaterial = material || this._selectedMaterial;

    if (!this._isInBounds(tilePos.x, tilePos.y)) {
      return;
    }

    const affectedTiles = [];
    const brushRadius = Math.floor(this._brushSize / 2);
    const isOddSize = this._brushSize % 2 !== 0;

    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      for (let dx = -brushRadius; dx <= brushRadius; dx++) {
        const x = tilePos.x + dx;
        const y = tilePos.y + dy;

        // Pattern logic: Even sizes = circular, Odd sizes = square
        if (!isOddSize) {
          // EVEN SIZES (2,4,6,8): Circular pattern
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > brushRadius) continue;
        }
        // ODD SIZES (1,3,5,7,9): Full square pattern (no distance check)

        if (this._isInBounds(x, y)) {
          const tile = this._terrain.getArrPos([x, y]);
          const oldMaterial = tile.getMaterial();
          
          affectedTiles.push({ x, y, oldMaterial, newMaterial: paintMaterial });
          
          tile.setMaterial(paintMaterial);
          tile.assignWeight();
        }
      }
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'paint', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
  }

  /**
   * Convert canvas coordinates to tile position
   * @param {number} canvasX - Canvas X coordinate
   * @param {number} canvasY - Canvas Y coordinate
   * @returns {Object} Tile position {x, y}
   * @private
   */
  _canvasToTilePosition(canvasX, canvasY) {
    return {
      x: Math.floor(canvasX / this._terrain._tileSize),
      y: Math.floor(canvasY / this._terrain._tileSize)
    };
  }

  /**
   * Check if tile coordinates are within terrain bounds
   * @param {number} x - Tile X position
   * @param {number} y - Tile Y position
   * @returns {boolean} True if in bounds
   * @private
   */
  _isInBounds(x, y) {
    // SparseTerrain (or sparse mock) may not have fixed grid size
    // Allow all coordinates if gridSize not defined
    if (!this._terrain._gridSizeX || !this._terrain._gridSizeY) {
      return true; // Sparse terrain - validates dynamically
    }
    
    // Traditional grid-based terrain (CustomTerrain, gridTerrain)
    const maxX = this._terrain._gridSizeX * this._terrain._chunkSize;
    const maxY = this._terrain._gridSizeY * this._terrain._chunkSize;
    return x >= 0 && x < maxX && y >= 0 && y < maxY;
  }
  
  /**
   * Check if queue has any valid tiles that could be filled
   * Used to determine if fill operation hit the limit artificially
   * @param {Array} queue - BFS queue of coordinates
   * @param {Set} visited - Set of visited tile keys
   * @param {string} targetMaterial - Material being replaced
   * @returns {boolean} True if queue contains fillable tiles
   * @private
   */
  _hasValidTilesInQueue(queue, visited, targetMaterial) {
    // Check a sample of queue items to see if any are valid
    // (Don't check ALL as that could be expensive)
    const samplesToCheck = Math.min(queue.length, 20);
    
    for (let i = 0; i < samplesToCheck; i++) {
      const [x, y] = queue[i];
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (!this._isInBounds(x, y)) continue;
      
      const tile = this._terrain.getArrPos([x, y]);
      if (tile.getMaterial() === targetMaterial) {
        return true; // Found at least one valid tile
      }
    }
    
    return false; // No valid tiles found in sample
  }

  /**
   * Set brush size
   * @param {number} size - Brush size (1, 3, 5, etc.)
   */
  setBrushSize(size) {
    this._brushSize = size;
  }

  /**
   * Flood fill region with material
   * @param {number} startX - Starting tile X
   * @param {number} startY - Starting tile Y
   * @param {string} replacementMaterial - Material to fill with
   * @returns {Object} Fill operation metadata: {tilesFilled, limitReached, startMaterial, newMaterial}
   */
  fillRegion(startX, startY, replacementMaterial = null) {
    if (!this._isInBounds(startX, startY)) {
      return {
        tilesFilled: 0,
        limitReached: false,
        startMaterial: null,
        newMaterial: replacementMaterial || this._selectedMaterial
      };
    }

    const fillMaterial = replacementMaterial || this._selectedMaterial;
    const targetTile = this._terrain.getArrPos([startX, startY]);
    const targetMaterial = targetTile.getMaterial();

    // Don't fill if target equals replacement
    if (targetMaterial === fillMaterial) {
      return {
        tilesFilled: 0,
        limitReached: false,
        startMaterial: targetMaterial,
        newMaterial: fillMaterial
      };
    }

    const affectedTiles = [];
    const visited = new Set();
    const queue = [[startX, startY]];
    let tilesFilled = 0;
    let limitReached = false;

    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (!this._isInBounds(x, y)) continue;

      visited.add(key);

      const tile = this._terrain.getArrPos([x, y]);
      if (tile.getMaterial() !== targetMaterial) continue;

      const oldMaterial = tile.getMaterial();
      affectedTiles.push({ x, y, oldMaterial, newMaterial: fillMaterial });

      tile.setMaterial(fillMaterial);
      tile.assignWeight();
      
      tilesFilled++;
      
      // Stop if we've reached the fill limit
      if (tilesFilled >= this.MAX_FILL_AREA) {
        // Check if there are more tiles that could be filled
        // (queue may have invalid/visited tiles, so we need to check properly)
        limitReached = this._hasValidTilesInQueue(queue, visited, targetMaterial);
        break;
      }

      // Add neighbors (including diagonals)
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
      queue.push([x + 1, y + 1]);
      queue.push([x - 1, y - 1]);
      queue.push([x + 1, y - 1]);
      queue.push([x - 1, y + 1]);
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'fill', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
    
    return {
      tilesFilled,
      limitReached,
      startMaterial: targetMaterial,
      newMaterial: fillMaterial
    };
  }

  /**
   * Fill rectangular area
   * @param {number} startX - Start tile X
   * @param {number} startY - Start tile Y
   * @param {number} endX - End tile X
   * @param {number} endY - End tile Y
   * @param {string} material - Material to fill with
   */
  fillRectangle(startX, startY, endX, endY, material = null) {
    const fillMaterial = material || this._selectedMaterial;
    const affectedTiles = [];

    // Handle reversed coordinates
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this._isInBounds(x, y)) {
          const tile = this._terrain.getArrPos([x, y]);
          const oldMaterial = tile.getMaterial();
          
          affectedTiles.push({ x, y, oldMaterial, newMaterial: fillMaterial });
          
          tile.setMaterial(fillMaterial);
          tile.assignWeight();
        }
      }
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'rectangle', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
  }

  /**
   * Draw line between two points (Bresenham algorithm)
   * @param {number} x0 - Start tile X
   * @param {number} y0 - Start tile Y
   * @param {number} x1 - End tile X
   * @param {number} y1 - End tile Y
   * @param {string} material - Material to draw with
   */
  drawLine(x0, y0, x1, y1, material = null) {
    const drawMaterial = material || this._selectedMaterial;
    const affectedTiles = [];

    // Bresenham's line algorithm
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      if (this._isInBounds(x, y)) {
        const tile = this._terrain.getArrPos([x, y]);
        const oldMaterial = tile.getMaterial();
        
        affectedTiles.push({ x, y, oldMaterial, newMaterial: drawMaterial });
        
        tile.setMaterial(drawMaterial);
        tile.assignWeight();
      }

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'line', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
  }

  /**
   * Erase tiles at specified position with brush size
   * Removes tiles from SparseTerrain or resets to default material for gridTerrain
   * @param {number} x - Tile X position (grid coordinates)
   * @param {number} y - Tile Y position (grid coordinates)
   * @param {number} brushSize - Brush size (1=single, 3=3x3, 5=5x5, etc.)
   * @returns {number} Count of tiles erased
   */
  erase(x, y, brushSize = 1) {
    const affectedTiles = [];
    const halfBrush = Math.floor(brushSize / 2);
    
    // Detect terrain type
    const isSparseTerrain = this._terrain.constructor.name === 'SparseTerrain' ||
                           (typeof this._terrain.deleteTile === 'function' && 
                            typeof this._terrain.tiles !== 'undefined');
    
    // Iterate over brush area
    for (let dy = -halfBrush; dy <= halfBrush; dy++) {
      for (let dx = -halfBrush; dx <= halfBrush; dx++) {
        const tileX = x + dx;
        const tileY = y + dy;
        
        // Skip out-of-bounds tiles
        if (!this._isInBounds(tileX, tileY)) {
          continue;
        }
        
        if (isSparseTerrain) {
          // SparseTerrain: Remove tile from storage (use getTile since tests mock it)
          const tile = this._terrain.getTile ? this._terrain.getTile(tileX, tileY) : null;
          
          if (tile) {
            const oldMaterial = tile.material;
            affectedTiles.push({ x: tileX, y: tileY, oldMaterial, newMaterial: null });
            
            // Use deleteTile if available (SparseTerrain), otherwise removeTile (mock)
            if (typeof this._terrain.deleteTile === 'function') {
              this._terrain.deleteTile(tileX, tileY);
            } else if (typeof this._terrain.removeTile === 'function') {
              this._terrain.removeTile(tileX, tileY);
            }
          }
        } else {
          // gridTerrain: Reset to default material
          const defaultMaterial = this._terrain.defaultMaterial || 'grass';
          
          // Check if terrain has getTile (mock) or getArrPos (real)
          let tile = null;
          let oldMaterial = null;
          
          if (typeof this._terrain.getTile === 'function') {
            // Mock terrain with getTile
            tile = this._terrain.getTile(tileX, tileY);
            oldMaterial = tile ? tile.material : null;
          } else if (typeof this._terrain.getArrPos === 'function') {
            // Real gridTerrain with getArrPos
            tile = this._terrain.getArrPos([tileX, tileY]);
            oldMaterial = tile ? tile.getMaterial() : null;
          }
          
          if (tile && oldMaterial && oldMaterial !== defaultMaterial) {
            affectedTiles.push({ x: tileX, y: tileY, oldMaterial, newMaterial: defaultMaterial });
            
            // Update tile material
            if (typeof this._terrain.setTile === 'function') {
              // Mock with setTile
              this._terrain.setTile(tileX, tileY, defaultMaterial);
            } else if (tile.setMaterial) {
              // Real tile with setMaterial
              tile.setMaterial(defaultMaterial);
              if (tile.assignWeight) tile.assignWeight();
            }
          }
        }
      }
    }
    
    // Record undo action if tiles were erased
    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'erase', tiles: affectedTiles });
      if (typeof this._terrain.invalidateCache === 'function') {
        this._terrain.invalidateCache();
      }
    }
    
    return affectedTiles.length;
  }

  /**
   * Record action for undo/redo
   * @param {Object} action - Action to record
   * @private
   */
  _recordAction(action) {
    this._undoStack.push(action);
    
    // Limit stack size
    if (this._undoStack.length > this._maxUndoSize) {
      this._undoStack.shift();
    }
    
    // Clear redo stack on new action
    this._redoStack = [];
  }

  /**
   * Undo last action
   */
  undo() {
    if (this._undoStack.length === 0) {
      return;
    }

    const action = this._undoStack.pop();
    this._redoStack.push(action);

    // Detect terrain type
    const isSparseTerrain = this._terrain.constructor.name === 'SparseTerrain' ||
                           (typeof this._terrain.setTile === 'function' && 
                            typeof this._terrain.tiles !== 'undefined');

    // Restore old materials
    for (const { x, y, oldMaterial } of action.tiles) {
      if (this._isInBounds(x, y)) {
        if (isSparseTerrain) {
          // SparseTerrain: Use setTile to restore
          if (typeof this._terrain.setTile === 'function') {
            this._terrain.setTile(x, y, oldMaterial);
          }
        } else {
          // gridTerrain: Use getArrPos and setMaterial
          const tile = this._terrain.getArrPos([x, y]);
          tile.setMaterial(oldMaterial);
          tile.assignWeight();
        }
      }
    }

    if (typeof this._terrain.invalidateCache === 'function') {
      this._terrain.invalidateCache();
    }
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this._undoStack.length > 0;
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this._redoStack.length === 0) {
      return;
    }

    const action = this._redoStack.pop();
    this._undoStack.push(action);

    // Detect terrain type
    const isSparseTerrain = this._terrain.constructor.name === 'SparseTerrain' ||
                           (typeof this._terrain.setTile === 'function' && 
                            typeof this._terrain.tiles !== 'undefined');

    // Restore new materials
    for (const { x, y, newMaterial } of action.tiles) {
      if (this._isInBounds(x, y)) {
        if (isSparseTerrain) {
          // SparseTerrain: Re-erase (delete) or restore
          if (newMaterial === null) {
            // Re-erase: delete the tile (use deleteTile or removeTile)
            if (typeof this._terrain.deleteTile === 'function') {
              this._terrain.deleteTile(x, y);
            } else if (typeof this._terrain.removeTile === 'function') {
              this._terrain.removeTile(x, y);
            }
          } else if (typeof this._terrain.setTile === 'function') {
            // Restore: set material
            this._terrain.setTile(x, y, newMaterial);
          }
        } else {
          // gridTerrain: Use getArrPos and setMaterial
          const tile = this._terrain.getArrPos([x, y]);
          tile.setMaterial(newMaterial);
          tile.assignWeight();
        }
      }
    }

    if (typeof this._terrain.invalidateCache === 'function') {
      this._terrain.invalidateCache();
    }
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this._redoStack.length > 0;
  }

  /**
   * Select material for painting
   * @param {string} material - Material name
   */
  selectMaterial(material) {
    this._selectedMaterial = material;
  }

  /**
   * Get list of available materials
   * @returns {Array} Array of material names
   */
  getAvailableMaterials() {
    return Object.keys(TERRAIN_MATERIALS_RANGED || {});
  }

  /**
   * Get materials by category
   * @param {string} category - Category name
   * @returns {Array} Materials in category
   */
  getMaterialsByCategory(category) {
    const categories = {
      'natural': ['moss', 'moss_0', 'moss_1'],
      'solid': ['stone'],
      'all': this.getAvailableMaterials()
    };

    return categories[category] || [];
  }

  /**
   * Pick material from tile (eyedropper)
   * @param {number} tileX - Tile X position
   * @param {number} tileY - Tile Y position
   */
  pickMaterial(tileX, tileY) {
    if (this._isInBounds(tileX, tileY)) {
      const tile = this._terrain.getArrPos([tileX, tileY]);
      this._selectedMaterial = tile.getMaterial();
    }
  }

  /**
   * Calculate grid line positions
   * @returns {Array} Array of line coordinates
   */
  getGridLines() {
    const lines = [];
    const maxX = this._terrain._gridSizeX * this._terrain._chunkSize * this._terrain._tileSize;
    const maxY = this._terrain._gridSizeY * this._terrain._chunkSize * this._terrain._tileSize;

    // Vertical lines
    for (let x = 0; x <= maxX; x += this._terrain._tileSize) {
      lines.push({ x1: x, y1: 0, x2: x, y2: maxY });
    }

    // Horizontal lines
    for (let y = 0; y <= maxY; y += this._terrain._tileSize) {
      lines.push({ x1: 0, y1: y, x2: maxX, y2: y });
    }

    return lines;
  }

  /**
   * Toggle grid visibility
   */
  toggleGrid() {
    this._gridVisible = !this._gridVisible;
  }

  /**
   * Select region for copy/paste
   * @param {number} startX - Start tile X
   * @param {number} startY - Start tile Y
   * @param {number} endX - End tile X
   * @param {number} endY - End tile Y
   * @returns {Object} Selection data
   */
  selectRegion(startX, startY, endX, endY) {
    return {
      startX: Math.min(startX, endX),
      startY: Math.min(startY, endY),
      endX: Math.max(startX, endX),
      endY: Math.max(startY, endY)
    };
  }

  /**
   * Get tiles in selection
   * @param {Object} selection - Selection data
   * @returns {Array} Array of tile materials
   */
  getTilesInSelection(selection) {
    const tiles = [];
    
    for (let y = selection.startY; y <= selection.endY; y++) {
      for (let x = selection.startX; x <= selection.endX; x++) {
        if (this._isInBounds(x, y)) {
          const tile = this._terrain.getArrPos([x, y]);
          tiles.push({
            x: x - selection.startX,
            y: y - selection.startY,
            material: tile.getMaterial()
          });
        }
      }
    }

    return tiles;
  }

  /**
   * Paste copied tiles
   * @param {number} targetX - Target tile X
   * @param {number} targetY - Target tile Y
   * @param {Array} tiles - Copied tile data
   */
  pasteTiles(targetX, targetY, tiles) {
    const affectedTiles = [];

    for (const tileData of tiles) {
      const x = targetX + tileData.x;
      const y = targetY + tileData.y;

      if (this._isInBounds(x, y)) {
        const tile = this._terrain.getArrPos([x, y]);
        const oldMaterial = tile.getMaterial();
        
        affectedTiles.push({ x, y, oldMaterial, newMaterial: tileData.material });
        
        tile.setMaterial(tileData.material);
        tile.assignWeight();
      }
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'paste', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
  }

  /**
   * Handle keyboard shortcuts
   * @param {string} key - Key pressed
   * @param {boolean} ctrlKey - Ctrl key state
   */
  handleKeyPress(key, ctrlKey = false) {
    if (ctrlKey) {
      if (key === 'z' || key === 'Z') {
        this.undo();
        return 'undo';
      } else if (key === 'y' || key === 'Y') {
        this.redo();
        return 'redo';
      }
    }

    // Number keys for brush size
    if (key >= '1' && key <= '9') {
      const size = parseInt(key);
      this.setBrushSize(size);
      return `brush-${size}`;
    }

    // Tool shortcuts
    if (key === 'b' || key === 'B') {
      return 'brush-tool';
    }

    return null;
  }

  // ========================================
  // Convenience Methods for GridTerrain Integration
  // ========================================

  /**
   * Select material for painting
   * Convenience method for setting _selectedMaterial
   * @param {string} material - Material to select
   */
  selectMaterial(material) {
    this._selectedMaterial = material;
  }

  /**
   * Get currently selected material
   * @returns {string} Current material
   */
  getSelectedMaterial() {
    return this._selectedMaterial;
  }

  /**
   * Paint at grid coordinates (convenience wrapper for paintTile)
   * Simplified API for direct grid editing without canvas coordinates
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {string} material - Material to paint (optional)
   */
  paint(gridX, gridY, material = null) {
    const paintMaterial = material || this._selectedMaterial;
    
    if (!this._isInBounds(gridX, gridY)) {
      return;
    }

    const affectedTiles = [];
    const brushRadius = Math.floor(this._brushSize / 2);
    const isOddSize = this._brushSize % 2 !== 0;

    for (let dy = -brushRadius; dy <= brushRadius; dy++) {
      for (let dx = -brushRadius; dx <= brushRadius; dx++) {
        const x = gridX + dx;
        const y = gridY + dy;

        // Pattern logic: Even sizes = circular, Odd sizes = square
        if (!isOddSize) {
          // EVEN SIZES (2,4,6,8): Circular pattern
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > brushRadius) continue;
        }
        // ODD SIZES (1,3,5,7,9): Full square pattern (no distance check)

        if (this._isInBounds(x, y)) {
          const tile = this._terrain.getArrPos([x, y]);
          const oldMaterial = tile.getMaterial();
          
          affectedTiles.push({ x, y, oldMaterial, newMaterial: paintMaterial });
          
          tile.setMaterial(paintMaterial);
          tile.assignWeight();
        }
      }
    }

    if (affectedTiles.length > 0) {
      this._recordAction({ type: 'paint', tiles: affectedTiles });
      this._terrain.invalidateCache();
    }
  }

  /**
   * Fill region at grid coordinates (convenience wrapper for fillRegion)
   * Simplified API for flood fill operations
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @param {string} material - Material to fill with (optional)
   */
  fill(gridX, gridY, material = null) {
    this.fillRegion(gridX, gridY, material);
  }
}

// Export for use in Node.js tests and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerrainEditor;
}
