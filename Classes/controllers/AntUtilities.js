/**
 * AntUtilities - Static utility methods for ant operations and group management
 */
class AntUtilities {
  /**
   * Move a single ant to tile coordinates
   * @param {Object} ant - Ant object
   * @param {number} tileX - Target tile X coordinate
   * @param {number} tileY - Target tile Y coordinate
   * @param {number} tileSize - Size of each tile
   * @param {Object} pathMap - Pathfinding map object
   */
  static moveAntToTile(ant, tileX, tileY, tileSize = 32, pathMap = null) {
    if (!ant) return;
    // Use pathfinding if available
    if (pathMap && typeof findPath === 'function') {
      try {
        const antPos = ant.getPosition();
        const antTileX = Math.floor(antPos.x / tileSize);
        const antTileY = Math.floor(antPos.y / tileSize);
        const grid = pathMap.getGrid();
        const startTile = grid?.getArrPos([antTileX, antTileY]);
        const endTile = grid?.getArrPos([tileX, tileY]);
        if (startTile && endTile) {
          const path = findPath(startTile, endTile, pathMap);
          if (path && ant.setPath) {
            ant.setPath(path);
            return;
          }
        }
      } catch (error) {
        console.warn("Pathfinding failed for ant:", error);
        // Fallback to direct movement
        //this.moveAntDirectly(ant, tileX * tileSize, tileY * tileSize);
        return;
      }
    }
    // Direct movement fallback
    //this.moveAntDirectly(ant, tileX * tileSize, tileY * tileSize);
  }
  
  // --- Group Movement ---

  /**
   * Move a group of ants in a circle formation
   * @param {Array} antArray - Array of ant objects
   * @param {number} x - Center X coordinate
   * @param {number} y - Center Y coordinate
   * @param {number} radius - Circle radius in pixels
   */
  static moveGroupInCircle(antArray, x, y, radius = 40) {
    if (!antArray || antArray.length === 0) return;
    
    const angleStep = (2 * Math.PI) / antArray.length;
    
    for (let i = 0; i < antArray.length; i++) {
      const ant = antArray[i];
      const angle = i * angleStep;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      
      // Move ant to position
      if (ant.moveToLocation) {
        ant.moveToLocation(x + offsetX, y + offsetY);
      }
      
      // Deselect ant
      if (ant._selectionController) {
        ant._selectionController.setSelected(false);
      } else if (ant.isSelected !== undefined) {
        ant.isSelected = false;
      }
    }
  }

  /**
   * Move a group of ants in a line formation
   * @param {Array} antArray - Array of ant objects
   * @param {number} startX - Line start X coordinate
   * @param {number} startY - Line start Y coordinate
   * @param {number} endX - Line end X coordinate
   * @param {number} endY - Line end Y coordinate
   */
  static moveGroupInLine(antArray, startX, startY, endX, endY) {
    if (!antArray || antArray.length === 0) return;
    
    const length = antArray.length;
    
    for (let i = 0; i < length; i++) {
      const ant = antArray[i];
      const t = length === 1 ? 0.5 : i / (length - 1); // Normalize position along line
      
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      
      if (ant.moveToLocation) {
        ant.moveToLocation(x, y);
      }
    }
  }

  /**
   * Move a group of ants in a grid formation
   * @param {Array} antArray - Array of ant objects
   * @param {number} centerX - Grid center X coordinate
   * @param {number} centerY - Grid center Y coordinate
   * @param {number} spacing - Spacing between ants
   * @param {number} maxCols - Maximum columns in grid
   */
  /**
   * Move a group of ants in a grid formation using tile-based movement and pathfinding
   * @param {Array} antArray - Array of ant objects
   * @param {number} centerTileX - Grid center tile X coordinate
   * @param {number} centerTileY - Grid center tile Y coordinate
   * @param {number} tileSpacing - Spacing between ants in tiles
   * @param {number} maxCols - Maximum columns in grid
   * @param {number} tileSize - Size of each tile
   * @param {Object} pathMap - Pathfinding map object
   */
  static moveGroupInGrid(antArray, centerTileX, centerTileY, tileSpacing = 1, maxCols = null, tileSize = 32, pathMap = null) {
    if (!antArray || antArray.length === 0) return;
    const count = antArray.length;
    const cols = maxCols || Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    // Calculate grid start tile (top-left)
    const gridWidth = (cols - 1) * tileSpacing;
    const gridHeight = (rows - 1) * tileSpacing;
    const startTileX = centerTileX - Math.floor(gridWidth / 2);
    const startTileY = centerTileY - Math.floor(gridHeight / 2);
    for (let i = 0; i < count; i++) {
      const ant = antArray[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tileX = startTileX + col * tileSpacing;
      const tileY = startTileY + row * tileSpacing;
      this.moveAntToTile(ant, tileX, tileY, tileSize, pathMap);
    }
  }

  // --- Selection Utilities ---

  /**
   * Select ant under mouse cursor
   * @param {Array} ants - Array of all ants
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @param {boolean} clearOthers - Whether to clear other selections
   * @returns {Object|null} Selected ant object or null
   */
  static selectAntUnderMouse(ants, mouseX, mouseY, clearOthers = true) {
    if (!ants || ants.length === 0) return null;
    
    let selectedAnt = null;
    
    // Clear other selections if requested
    if (clearOthers) {
      this.deselectAllAnts(ants);
    }
    
    // Find ant under mouse (iterate backwards for top-most ant)
    for (let i = ants.length - 1; i >= 0; i--) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      if (this.isAntUnderMouse(antObj, mouseX, mouseY)) {
        // Select this ant
        if (antObj._selectionController) {
          antObj._selectionController.setSelected(true);
        } else if (antObj.isSelected !== undefined) {
          antObj.isSelected = true;
        }
        
        selectedAnt = antObj;
        break;
      }
    }
    
    return selectedAnt;
  }

  /**
   * Check if ant is under mouse cursor
   * @param {Object} ant - Ant object
   * @param {number} mouseX - Mouse X coordinate
   * @param {number} mouseY - Mouse Y coordinate
   * @returns {boolean} True if ant is under mouse
   */
  static isAntUnderMouse(ant, mouseX, mouseY) {
    if (!ant) return false;
    
    // Use interaction controller if available
    if (ant._interactionController) {
      return ant._interactionController.isMouseOver();
    }
    
    // Use ant's isMouseOver method if available
    if (ant.isMouseOver) {
      return ant.isMouseOver(mouseX, mouseY);
    }
    
    // Fallback to basic bounds checking
    const pos = ant.getPosition();
    const size = ant.getSize();
    
    return (
      mouseX >= pos.x &&
      mouseX <= pos.x + size.x &&
      mouseY >= pos.y &&
      mouseY <= pos.y + size.y
    );
  }

  /**
   * Deselect all ants
   * @param {Array} ants - Array of all ants
   */
  static deselectAllAnts(ants) {
    if (!ants) return;
    
    for (let i = 0; i < ants.length; i++) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      if (antObj._selectionController) {
        antObj._selectionController.setSelected(false);
      } else if (antObj.isSelected !== undefined) {
        antObj.isSelected = false;
      }
    }
  }

  /**
   * Get all selected ants
   * @param {Array} ants - Array of all ants
   * @returns {Array} Array of selected ants
   */
  static getSelectedAnts(ants) {
    if (!ants) return [];
    
    const selected = [];
    
    for (let i = 0; i < ants.length; i++) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      const isSelected = antObj._selectionController ? 
        antObj._selectionController.isSelected() : 
        (antObj.isSelected || false);
      
      if (isSelected) {
        selected.push(antObj);
      }
    }
    
    return selected;
  }

  // --- Pathfinding Utilities ---

  /**
   * Move selected ants to tile coordinates
   * @param {Array} selectedAnts - Array of selected ants
   * @param {number} tileX - Target tile X coordinate
   * @param {number} tileY - Target tile Y coordinate
   * @param {number} tileSize - Size of each tile
   * @param {Object} pathMap - Pathfinding map object
   */
  static moveSelectedAntsToTile(selectedAnts, tileX, tileY, tileSize = 32, pathMap = null) {
    if (!selectedAnts || selectedAnts.length === 0) return;
    
    const radius = 2; // Formation radius in tiles
    const angleStep = (2 * Math.PI) / selectedAnts.length;
    
    for (let i = 0; i < selectedAnts.length; i++) {
      const ant = selectedAnts[i];
      
      // Calculate formation position
      const angle = i * angleStep;
      const offsetTileX = tileX + Math.round(Math.cos(angle) * radius);
      const offsetTileY = tileY + Math.round(Math.sin(angle) * radius);
      
      // Use pathfinding if available
      if (pathMap && typeof findPath === 'function') {
        try {
          const antPos = ant.getPosition();
          const antTileX = Math.floor(antPos.x / tileSize);
          const antTileY = Math.floor(antPos.y / tileSize);
          
          const grid = pathMap.getGrid();
          const startTile = grid?.getArrPos([antTileX, antTileY]);
          const endTile = grid?.getArrPos([offsetTileX, offsetTileY]);
          
          if (startTile && endTile) {
            const path = findPath(startTile, endTile, pathMap);
            if (path && ant.setPath) {
              ant.setPath(path);
            }
          }
        } catch (error) {
          console.warn("Pathfinding failed for ant:", error);
          // Fallback to direct movement
          //this.moveAntDirectly(ant, offsetTileX * tileSize, offsetTileY * tileSize);
        }
      } else {
        // Direct movement fallback
        //this.moveAntDirectly(ant, offsetTileX * tileSize, offsetTileY * tileSize);
      }
      
      // Deselect ant after movement command
      if (ant._selectionController) {
        ant._selectionController.setSelected(false);
      } else if (ant.isSelected !== undefined) {
        ant.isSelected = false;
      }
    }
  }

  /**
   * Move ant directly to coordinates
   * @param {Object} ant - Ant object
   * @param {number} x - Target X coordinate
   * @param {number} y - Target Y coordinate
   */
  static moveAntDirectly(ant, x, y) {
    if (ant.moveToLocation) {
      ant.moveToLocation(x, y);
    } else if (ant._movementController) {
      ant._movementController.moveToLocation(x, y);
    }
  }

  // --- Utility Functions ---

  /**
   * Get distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance in pixels
   */
  static getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get ants within radius of position
   * @param {Array} ants - Array of all ants
   * @param {number} centerX - Center X coordinate
   * @param {number} centerY - Center Y coordinate
   * @param {number} radius - Search radius
   * @returns {Array} Array of ants within radius
   */
  static getAntsInRadius(ants, centerX, centerY, radius) {
    if (!ants) return [];
    
    const nearbyAnts = [];
    
    for (let i = 0; i < ants.length; i++) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      const pos = antObj.getPosition ? antObj.getPosition() : 
        antObj.getPosition();
      
      const distance = this.getDistance(centerX, centerY, pos.x, pos.y);
      
      if (distance <= radius) {
        nearbyAnts.push(antObj);
      }
    }
    
    return nearbyAnts;
  }

  /**
   * Get ants of specific faction
   * @param {Array} ants - Array of all ants
   * @param {string} faction - Faction name
   * @returns {Array} Array of ants in faction
   */
  static getAntsByFaction(ants, faction) {
    if (!ants) return [];
    
    const factionAnts = [];
    
    for (let i = 0; i < ants.length; i++) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      if (antObj.faction === faction) {
        factionAnts.push(antObj);
      }
    }
    
    return factionAnts;
  }

  /**
   * Get performance statistics for ant operations
   * @param {Array} ants - Array of all ants
   * @returns {Object} Performance statistics
   */
  static getPerformanceStats(ants) {
    if (!ants) return { totalAnts: 0 };
    
    let totalAnts = 0;
    let selectedCount = 0;
    let movingCount = 0;
    let combatCount = 0;
    
    for (let i = 0; i < ants.length; i++) {
      const ant = ants[i];
      const antObj = ant.antObject ? ant.antObject : ant;
      
      if (antObj) {
        totalAnts++;
        
        // Count selected
        const isSelected = antObj._selectionController ? 
          antObj._selectionController.isSelected() : 
          (antObj.isSelected || false);
        if (isSelected) selectedCount++;
        
        // Count moving
        const isMoving = antObj._movementController ? 
          antObj._movementController.getIsMoving() : 
          (antObj.isMoving || false);
        if (isMoving) movingCount++;
        
        // Count in combat
        const inCombat = antObj._combatController ? 
          antObj._combatController.isInCombat() : 
          (antObj.isInCombat && antObj.isInCombat());
        if (inCombat) combatCount++;
      }
    }
    
    return {
      totalAnts,
      selectedCount,
      movingCount,
      combatCount,
      idleCount: totalAnts - movingCount - combatCount
    };
  }
}



function antLoopPropertyCheck(property) {
  for (let i = 0; i < ant_Index; i++) {
    if (!ants[i]) continue;
    let antObj = ants[i].antObject ? ants[i].antObject : ants[i];
    return antObj[property];
  } 
  IncorrectParamPassed("Boolean", property);
}

// --- Move Selected Ant to Tile ---
function moveSelectedAntToTile(mx, my, tileSize) {
  // Use SelectionBoxController's selectedEntities for single selection
  const controller = typeof SelectionBoxController !== 'undefined' ? SelectionBoxController.getInstance() : null;
  const selectedEntities = controller ? controller.getSelectedEntities() : [];

  if (!selectedEntities || selectedEntities.length !== 1) {
    return;
  }
  let selectedAnt = selectedEntities[0];
  // Unwrap if this is a wrapper object
  if (selectedAnt && selectedAnt.antObject) selectedAnt = selectedAnt.antObject;

  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  if (AntUtilities && typeof AntUtilities.moveAntToTile === 'function') {
    AntUtilities.moveAntToTile(selectedAnt, tileX, tileY, tileSize, GRIDMAP);
  }
  selectedAnt.isSelected = false;
  if (controller) controller.deselectAll();
}
function moveSelectedAntsToTile(mx, my, tileSize) {
  // Use SelectionBoxController's selectedEntities
  const controller = typeof SelectionBoxController !== 'undefined' ? SelectionBoxController.getInstance() : null;
  const selectedEntities = controller ? controller.getSelectedEntities() : [];
  if (!selectedEntities || selectedEntities.length === 0) {
    return;
  }

  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  const grid = GRIDMAP.getGrid();

  const radius = 2; // in tiles
  const angleStep = (2 * Math.PI) / selectedEntities.length;

  for (let i = 0; i < selectedEntities.length; i++) {
    let ant = selectedEntities[i];
    // Unwrap if this is a wrapper object
    if (ant && ant.antObject) ant = ant.antObject;

    // assign each ant its own destination tile around the click
    const angle = i * angleStep;
    const offsetTileX = tileX + Math.round(Math.cos(angle) * radius);
    const offsetTileY = tileY + Math.round(Math.sin(angle) * radius);

    // Use robust property access
    let antCenterX, antCenterY;
    if (typeof ant.getPosition === 'function' && typeof ant.getSize === 'function') {
      const pos = ant.getPosition();
      const size = ant.getSize();
      antCenterX = pos.x + size.x / 2;
      antCenterY = pos.y + size.y / 2;
    } else {
      continue;
    }
    const antX = Math.floor(antCenterX / tileSize);
    const antY = Math.floor(antCenterY / tileSize);

    const startTile = grid.getArrPos([antX, antY]);
    const endTile = grid.getArrPos([offsetTileX, offsetTileY]);

    if (startTile && endTile) {
      const newPath = findPath(startTile, endTile, GRIDMAP);
      if (typeof ant.setPath === 'function') {
        ant.setPath(newPath);
      }
    }
    ant.isSelected = false;
  }
  // Deselect all after issuing movement
  if (controller) controller.deselectAll();
}

// Export for Node.js testing
if (typeof module !== "undefined" && module.exports) {
  module.exports = AntUtilities;
}