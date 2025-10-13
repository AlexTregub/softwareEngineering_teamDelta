

// Expose movement functions globally for browser usage
if (typeof window !== 'undefined') {
  window.moveSelectedEntityToTile = moveSelectedEntityToTile;
  window.moveSelectedEntitiesToTile = moveSelectedEntitiesToTile;
}

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
   * @param {Object} pathMap - Pathfinding g_map object
   */
  static moveAntToTile(ant, tileX, tileY, tileSize = 32, pathMap = null) {
    // Use the generic movement controller for all entity movement
    MovementController.moveEntityToTile(ant, tileX, tileY, tileSize, pathMap);
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
   * @param {Object} pathMap - Pathfinding g_map object
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
      
      if (this.isAntUnderMouse(ant, mouseX, mouseY)) {
        // Select this ant
        if (ant._selectionController) {
          ant._selectionController.setSelected(true);
        } else if (ant.isSelected !== undefined) {
          ant.isSelected = true;
        }
        
        selectedAnt = ant;
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
      
      if (ant._selectionController) {
        ant._selectionController.setSelected(false);
      } else if (ant.isSelected !== undefined) {
        ant.isSelected = false;
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
      
      const isSelected = ant._selectionController ? 
        ant._selectionController.isSelected() : 
        (ant.isSelected || false);
      
      if (isSelected) {
        selected.push(ant);
      }
    }
    
    return selected;
  }

  /**
   * Synchronize selection between individual ant.isSelected properties and SelectionBoxController
   * This ensures both selection systems are consistent
   * @param {Array} ants - Array of all ants
   */
  static synchronizeSelections(ants) {
    if (!ants) return;
    
    // Get currently selected ants based on individual properties
    const selectedAnts = this.getSelectedAnts(ants);
    
    // Update SelectionBoxController to match
    const controller = typeof SelectionBoxController !== 'undefined' ? SelectionBoxController.getInstance() : null;
    if (controller) {
      // Clear the controller's selection
      controller.deselectAll();
      
      // Set the controller's selected entities to match individual selections
      if (selectedAnts.length > 0) {
        selectedAnts.forEach(ant => {
          ant.isSelected = true; // Ensure it's marked as selected
        });
        
        // Update the controller's internal selected entities array
        if (controller._selectedEntities) {
          controller._selectedEntities = [...selectedAnts];
        }
      }
    }
    
    // Update global selectedAnt if only one ant is selected
    if (selectedAnts.length === 1) {
      if (typeof selectedAnt !== 'undefined') {
        selectedAnt = selectedAnts[0];
      }
      if (typeof antManager !== 'undefined' && antManager && antManager.setSelectedAnt) {
        antManager.setSelectedAnt(selectedAnts[0]);
      }
    } else {
      // Clear single selection if multiple or no ants selected
      if (typeof selectedAnt !== 'undefined') {
        selectedAnt = null;
      }
      if (typeof antManager !== 'undefined' && antManager && antManager.clearSelection) {
        antManager.clearSelection();
      }
    }
  }

  // --- Pathfinding Utilities ---

  /**
   * Move selected ants to tile coordinates
   * @param {Array} selectedAnts - Array of selected ants
   * @param {number} tileX - Target tile X coordinate
   * @param {number} tileY - Target tile Y coordinate
   * @param {number} tileSize - Size of each tile
   * @param {Object} pathMap - Pathfinding g_map object
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

    // --- Spawning Functions ---

  /**
   * Spawn ant with specific job, faction, and optional custom image
   * @param {number} x - Spawn X coordinate
   * @param {number} y - Spawn Y coordinate
   * @param {string} jobName - Job type from JobComponent
   * @param {string} faction - Faction name (red, blue, neutral)
   * @param {Object} customImage - Optional custom image (uses job default if null)
   * @returns {Object} Spawned ant object
   */
  static spawnAnt(x, y, jobName = "Scout", faction = "neutral", customImage = null) {
    if (typeof JobComponent === 'undefined') {
      console.warn('JobComponent not available for spawning');
      return null;
    }

    // Validate job name
    const availableJobs = JobComponent.getAllJobs();
    if (!availableJobs.includes(jobName)) {
      console.warn(`Invalid job name: ${jobName}. Using Scout.`);
      jobName = "Scout";
    }

    // Validate faction
    const validFactions = ["red", "blue", "neutral"];
    if (!validFactions.includes(faction)) {
      console.warn(`Invalid faction: ${faction}. Using neutral.`);
      faction = "neutral";
    }

    // Determine image to use
    let imageToUse = customImage;
    if (!imageToUse && typeof JobImages !== 'undefined') {
      imageToUse = JobImages[jobName] || JobImages["Scout"];
    }
    if (!imageToUse && typeof antBaseSprite !== 'undefined') {
      imageToUse = antBaseSprite;
    }

    try {
      // Create ant using existing ant constructor
      const newAnt = new ant(
        x, y,
        20, 20, // Default size
        30, 0,   // Movement speed, rotation
        imageToUse,
        jobName,
        faction
      );

      // Assign job using component system
      newAnt.assignJob(jobName, imageToUse);

      // Add to global ants array if it exists
      if (ants && Array.isArray(ants)) {
        ants.push(newAnt);
      }

      // Register with TileInteractionManager if available
      if (g_tileInteractionManager) {
        g_tileInteractionManager.addObject(newAnt, 'ant');
      }

      // Update UI Selection Box entities
      if (updateUISelectionEntities) {
        updateUISelectionEntities();
      }

      return newAnt;
    } catch (error) {
      console.error('Error spawning ant:', error);
      return null;
    }
  }

  /**
   * Spawn multiple ants of the same type
   * @param {number} count - Number of ants to spawn
   * @param {string} jobName - Job type
   * @param {string} faction - Faction name
   * @param {number} centerX - Center X for formation
   * @param {number} centerY - Center Y for formation
   * @param {number} radius - Spawn radius
   * @returns {Array} Array of spawned ants
   */
  static spawnMultipleAnts(count, jobName = "Scout", faction = "neutral", centerX = 400, centerY = 400, radius = 50) {
    const spawnedAnts = [];
    const angleStep = (2 * Math.PI) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      const spawnX = centerX + Math.cos(angle) * radius;
      const spawnY = centerY + Math.sin(angle) * radius;

      const ant = this.spawnAnt(spawnX, spawnY, jobName, faction);
      if (ant) {
        spawnedAnts.push(ant);
      }
    }

    return spawnedAnts;
  }

  // --- State Management Functions ---

  /**
   * Change state of all selected ants
   * @param {Array} ants - Array of all ants
   * @param {string} primaryState - New primary state
   * @param {string} combatModifier - Optional combat modifier
   * @param {string} terrainModifier - Optional terrain modifier
   */
  static changeSelectedAntsState(ants, primaryState, combatModifier = null, terrainModifier = null) {
    const selectedAnts = this.getSelectedAnts(ants);
    
    if (selectedAnts.length === 0) {
      console.log('No ants selected for state change');
      return;
    }

    let changedCount = 0;
    for (const ant of selectedAnts) {
      if (ant._stateMachine && typeof ant._stateMachine.setState === 'function') {
        const success = ant._stateMachine.setState(primaryState, combatModifier, terrainModifier);
        if (success) {
          changedCount++;
        }
      }
    }

    console.log(`Changed state of ${changedCount} ants to ${primaryState}`);
    
    // Synchronize selection systems after state change
    this.synchronizeSelections(ants);
  }

  /**
   * Set all selected ants to IDLE state
   * @param {Array} ants - Array of all ants
   */
  static setSelectedAntsIdle(ants) {
    this.changeSelectedAntsState(ants, "IDLE", "OUT_OF_COMBAT", "DEFAULT");
  }

  /**
   * Set all selected ants to GATHERING state
   * @param {Array} ants - Array of all ants
   */
  static setSelectedAntsGathering(ants) {
    this.changeSelectedAntsState(ants, "GATHERING", "OUT_OF_COMBAT", "DEFAULT");
  }

  /**
   * Set all selected ants to PATROL state
   * @param {Array} ants - Array of all ants
   */
  static setSelectedAntsPatrol(ants) {
    this.changeSelectedAntsState(ants, "PATROL", "OUT_OF_COMBAT", "DEFAULT");
  }

  /**
   * Set all selected ants to combat state
   * @param {Array} ants - Array of all ants
   */
  static setSelectedAntsCombat(ants) {
    this.changeSelectedAntsState(ants, "MOVING", "IN_COMBAT", "DEFAULT");
  }

  /**
   * Set all selected ants to BUILDING state
   * @param {Array} ants - Array of all ants
   */
  static setSelectedAntsBuilding(ants) {
    this.changeSelectedAntsState(ants, "BUILDING", "OUT_OF_COMBAT", "DEFAULT");
  }

  /**
   * Set selected ants to GATHERING state for autonomous resource collection
   * @param {Array} ants - Array of all ants
   * @returns {number} Number of ants set to gathering state
   */
  static setSelectedAntsGathering(ants) {
    const selected = this.getSelectedAnts(ants);
    let gatheringCount = 0;
    
    selected.forEach(ant => {
      if (ant._stateMachine && ant._stateMachine.canPerformAction('gather')) {
        ant._stateMachine.setPrimaryState('GATHERING');
        gatheringCount++;
      }
    });
    
    console.log(`🔍 Set ${gatheringCount} ants to GATHERING state (7-grid radius)`);
    this.synchronizeSelections(ants);
    return gatheringCount;
  }

  /**
   * Get ants currently in gathering state
   * @param {Array} ants - Array of all ants
   * @returns {Array} Array of ants in gathering state
   */
  static getGatheringAnts(ants) {
    if (!ants) return [];
    
    return ants.filter(ant => {
      return ant && ant._stateMachine && ant._stateMachine.isGathering && ant._stateMachine.isGathering();
    });
  }

  /**
   * Stop gathering for selected ants (return to idle)
   * @param {Array} ants - Array of all ants
   * @returns {number} Number of ants stopped from gathering
   */
  static stopSelectedAntsGathering(ants) {
    const selected = this.getSelectedAnts(ants);
    let stoppedCount = 0;
    
    selected.forEach(ant => {
      if (ant._stateMachine && ant._stateMachine.isGathering && ant._stateMachine.isGathering()) {
        ant._stateMachine.setPrimaryState('IDLE');
        stoppedCount++;
      }
    });
    
    console.log(`⏹️ Stopped ${stoppedCount} ants from gathering`);
    this.synchronizeSelections(ants);
    return stoppedCount;
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
      
      const pos = ant.getPosition ? ant.getPosition() : 
        ant.getPosition();
      
      const distance = this.getDistance(centerX, centerY, pos.x, pos.y);
      
      if (distance <= radius) {
        nearbyAnts.push(ant);
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
      
      if (ant.faction === faction) {
        factionAnts.push(ant);
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
      
      if (ant) {
        totalAnts++;
        
        // Count selected
        const isSelected = ant._selectionController ? 
          ant._selectionController.isSelected() : 
          (ant.isSelected || false);
        if (isSelected) selectedCount++;
        
        // Count moving
        const isMoving = ant._movementController ? 
          ant._movementController.getIsMoving() : 
          (ant.isMoving || false);
        if (isMoving) movingCount++;
        
        // Count in combat
        const inCombat = ant._combatController ? 
          ant._combatController.isInCombat() : 
          (ant.isInCombat && ant.isInCombat());
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
  for (let i = 0; i < antIndex; i++) {
    if (!ants[i]) continue;
    return ants[i][property];
  } 
  IncorrectParamPassed("Boolean", property);
}

// --- Move Selected Ant to Tile ---
// --- Generic moveSelectedEntityToTile ---
function moveSelectedEntityToTile(mx, my, tileSize) {
  let selectedEntity = null;
  let useMultiSelection = false;

  // First, check SelectionBoxController's selectedEntities (for drag selection and button selection)
  const controller = typeof SelectionBoxController !== 'undefined' ? SelectionBoxController.getInstance() : null;
  const selectedEntities = controller ? controller.getSelectedEntities() : [];

  if (selectedEntities && selectedEntities.length > 0) {
    // If multiple entities selected, use multi-selection movement
    if (selectedEntities.length > 1) {
      moveSelectedEntitiesToTile(mx, my, tileSize);
      return;
    } else {
      // Single entity in multi-selection system
      selectedEntity = selectedEntities[0];
      useMultiSelection = true;
    }
  }

  // Fallback to global selectedAnt (for individual mouse click selection)
  if (!selectedEntity && typeof selectedAnt !== 'undefined' && selectedAnt) {
    selectedEntity = selectedAnt;
    useMultiSelection = false;
  }

  // If still no selection found, check if antManager exists
  if (!selectedEntity && typeof antManager !== 'undefined' && antManager && antManager.getSelectedAnt) {
    selectedEntity = antManager.getSelectedAnt();
    useMultiSelection = false;
  }

  // No selected entity found
  if (!selectedEntity) {
    return;
  }

  // Move the entity
  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  
  if (typeof MovementController !== 'undefined' && MovementController.moveEntityToTile) {
    MovementController.moveEntityToTile(selectedEntity, tileX, tileY, tileSize, g_gridMap);
  } else {
    // Fallback to direct movement
    AntUtilities.moveAntDirectly(selectedEntity, mx, my);
  }

  // Deselect based on which system was used
  if (useMultiSelection) {
    selectedEntity.isSelected = false;
    if (controller) controller.deselectAll();
  } else {
    selectedEntity.isSelected = false;
    if (typeof selectedAnt !== 'undefined') {
      selectedAnt = null;
    }
    if (typeof antManager !== 'undefined' && antManager && antManager.clearSelection) {
      antManager.clearSelection();
    }
  }
}

function moveSelectedEntitiesToTile(mx, my, tileSize) {
  // Use SelectionBoxController's selectedEntities
  const controller = typeof SelectionBoxController !== 'undefined' ? SelectionBoxController.getInstance() : null;
  const selectedEntities = controller ? controller.getSelectedEntities() : [];
  if (!selectedEntities || selectedEntities.length === 0) {
    return;
  }

  const tileX = Math.floor(mx / tileSize);
  const tileY = Math.floor(my / tileSize);
  const grid = g_gridMap.getGrid();

  const radius = 2; // in tiles
  const angleStep = (2 * Math.PI) / selectedEntities.length;

  for (let i = 0; i < selectedEntities.length; i++) {
    let entity = selectedEntities[i];
    // Now working with direct ant objects - no unwrapping needed

    // assign each entity its own destination tile around the click
    const angle = i * angleStep;
    const offsetTileX = tileX + Math.round(Math.cos(angle) * radius);
    const offsetTileY = tileY + Math.round(Math.sin(angle) * radius);

    // Use robust property access
    let entityCenterX, entityCenterY;
    if (typeof entity.getPosition === 'function' && typeof entity.getSize === 'function') {
      const pos = entity.getPosition();
      const size = entity.getSize();
      entityCenterX = pos.x + size.x / 2;
      entityCenterY = pos.y + size.y / 2;
    } else {
      continue;
    }
    const entityX = Math.floor(entityCenterX / tileSize);
    const entityY = Math.floor(entityCenterY / tileSize);

    const startTile = grid.getArrPos([entityX, entityY]);
    const endTile = grid.getArrPos([offsetTileX, offsetTileY]);

    if (startTile && endTile) {
      const newPath = findPath(startTile, endTile, g_gridMap);
      if (typeof entity.setPath === 'function') {
        entity.setPath(newPath);
      }
    }
    entity.isSelected = false;
  }
  // Deselect all after issuing movement
  if (controller) controller.deselectAll();
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntUtilities;
}