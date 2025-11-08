/**
 * @fileoverview Building Brush Tool
 * Allows painting buildings onto the game world with grid snapping
 * 
 */

/**
 * BuildingBrush - Tool for painting buildings with mouse interaction and grid snapping
 */
class BuildingBrush extends BrushBase {
  constructor() {
    super();
    this.brushSize = 64; // Size of brush cursor (2x tile size)
    this.buildingType = 'antcone'; // Current building type to place
    this.brushColor = [139, 69, 19, 100]; // Brown with transparency
    this.brushOutlineColor = [139, 69, 19, 255]; // Solid brown outline
    this.gridSize = 32; // Grid size for snapping (TILE_SIZE)
    this.isMousePressed = false;
    this.lastPlacementPos = null; // Track last placement to avoid duplicates

    // Visual feedback properties
    this.pulseAnimation = 0;
    this.pulseSpeed = 0.05;
    
    // Building type colors
    this.buildingColors = {
      'antcone': [139, 69, 19],    // Brown
      'anthill': [160, 82, 45],     // Sienna
      'hivesource': [218, 165, 32]  // Goldenrod
    };
  }

  /**
   * Set the building type to place
   * @param {string} type - Building type ('antcone', 'anthill', 'hivesource')
   */
  setBuildingType(type) {
    this.buildingType = type;
    // Update brush color based on building type
    const color = this.buildingColors[type] || [139, 69, 19];
    this.brushColor = [...color, 100];
    this.brushOutlineColor = [...color, 255];
    logNormal(`🏗️ Building Brush type set to: ${type}`);
  }

  /**
   * Get current building type
   * @returns {string} Current building type
   */
  getBuildingType() {
    return this.buildingType;
  }

  /**
   * Toggle brush active state
   * @returns {boolean} New active state
   */
  toggle() {
    this.isActive = !this.isActive;
    logNormal(`🏗️ Building Brush ${this.isActive ? 'activated' : 'deactivated'}`);
    return this.isActive;
  }

  /**
   * Activate the brush with a specific building type
   * @param {string} type - Building type to place
   */
  activate(type) {
    if (type) {
      this.setBuildingType(type);
    }
    this.isActive = true;
    logNormal(`🏗️ Building Brush activated: ${this.buildingType}`);
  }

  /**
   * Deactivate the brush
   */
  deactivate() {
    this.isActive = false;
    this.lastPlacementPos = null;
    logNormal('🏗️ Building Brush deactivated');
  }

  /**
   * Update the brush (called every frame)
   */
  update() {
    if (!this.isActive) return;
    super.update();
    
    // Update pulse animation for visual feedback
    this.pulseAnimation += this.pulseSpeed;
    if (this.pulseAnimation > Math.PI * 2) this.pulseAnimation = 0;
  }

  /**
   * Render the brush cursor and visual feedback
   */
  render() {
    if (!this.isActive || typeof mouseX === 'undefined' || typeof mouseY === 'undefined') return;

    // Save current drawing settings
    push();

    // Get grid size
    const gridSize = (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : 32;
    
    // Calculate snapped position
    const snappedX = Math.floor(mouseX / gridSize) * gridSize;
    const snappedY = Math.floor(mouseY / gridSize) * gridSize;

    // Calculate pulsing effect
    const pulseScale = 1 + Math.sin(this.pulseAnimation) * 0.05;
    const currentSize = this.brushSize * pulseScale;

    // Draw grid-snapped rectangle fill
    fill(this.brushColor[0], this.brushColor[1], this.brushColor[2], this.brushColor[3]);
    noStroke();
    rectMode(CORNER);
    rect(snappedX, snappedY, currentSize, currentSize);

    // Draw grid-snapped rectangle outline
    stroke(this.brushOutlineColor[0], this.brushOutlineColor[1], this.brushOutlineColor[2], this.brushOutlineColor[3]);
    strokeWeight(2);
    noFill();
    rect(snappedX, snappedY, currentSize, currentSize);

    // Draw crosshair at center of snapped position
    const centerX = snappedX + currentSize / 2;
    const centerY = snappedY + currentSize / 2;
    stroke(this.brushOutlineColor[0], this.brushOutlineColor[1], this.brushOutlineColor[2], 200);
    strokeWeight(1);
    line(centerX - 8, centerY, centerX + 8, centerY);
    line(centerX, centerY - 8, centerX, centerY + 8);

    // Draw grid overlay
    stroke(this.brushOutlineColor[0], this.brushOutlineColor[1], this.brushOutlineColor[2], 100);
    strokeWeight(1);
    for (let x = snappedX; x <= snappedX + currentSize; x += gridSize) {
      line(x, snappedY, x, snappedY + currentSize);
    }
    for (let y = snappedY; y <= snappedY + currentSize; y += gridSize) {
      line(snappedX, y, snappedX + currentSize, y);
    }

    // Draw brush info text
    fill(255, 255, 255, 200);
    textAlign(LEFT, TOP);
    textSize(10);
    const buildingNames = {
      'antcone': 'Ant Cone',
      'anthill': 'Ant Hill',
      'hivesource': 'Hive Source'
    };
    text(`Building: ${buildingNames[this.buildingType] || this.buildingType}`, mouseX + currentSize + 5, mouseY - 15);
    text(`Grid: ${gridSize}px`, mouseX + currentSize + 5, mouseY - 5);

    // Restore drawing settings
    pop();
  }

  /**
   * Handle mouse press events
   * @param {number} mx - Mouse X coordinate
   * @param {number} my - Mouse Y coordinate
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMousePressed(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    if (button === 'LEFT') {
      this.isMousePressed = true;
      this.tryPlaceBuilding(mx, my);
      return true; // Consume the event
    }
    
    return false;
  }

  /**
   * Handle mouse release events
   * @param {number} mx - Mouse X coordinate
   * @param {number} my - Mouse Y coordinate
   * @param {string} button - Mouse button ('LEFT', 'RIGHT', 'CENTER')
   * @returns {boolean} True if event was handled
   */
  onMouseReleased(mx, my, button = 'LEFT') {
    if (!this.isActive) return false;

    if (button === 'LEFT') {
      this.isMousePressed = false;
      this.lastPlacementPos = null; // Reset placement tracking
      return true; // Consume the event
    }
    
    return false;
  }

  /**
   * Try to place a building at the specified location
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {boolean} True if building was placed
   */
  tryPlaceBuilding(x, y) {
    // Convert screen coordinates to world coordinates if needed
    let worldX = x;
    let worldY = y;
    
    if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.screenToWorld) {
      const worldPos = CoordinateConverter.screenToWorld(x, y);
      worldX = worldPos.x;
      worldY = worldPos.y;
    }

    // Get grid size
    const gridSize = (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : 32;
    
    // Snap to grid
    const snappedX = Math.floor(worldX / gridSize) * gridSize;
    const snappedY = Math.floor(worldY / gridSize) * gridSize;

    // Check if we already placed a building at this exact location (prevent duplicates)
    if (this.lastPlacementPos && 
        this.lastPlacementPos.x === snappedX && 
        this.lastPlacementPos.y === snappedY) {
      return false;
    }

    // Create building
    if (typeof createBuilding === 'function') {
      const building = createBuilding(this.buildingType, snappedX, snappedY, 'Player', true);
      
      if (building && typeof Buildings !== 'undefined') {
        Buildings.push(building);
        
        // Register with TileInteractionManager
        if (typeof g_tileInteractionManager !== 'undefined' && g_tileInteractionManager) {
          g_tileInteractionManager.addObject(building, 'building');
        }
        
        // Track this placement
        this.lastPlacementPos = { x: snappedX, y: snappedY };
        
        logNormal(`🏗️ Building placed: ${this.buildingType} at (${snappedX}, ${snappedY})`);
        return true;
      }
    } else {
      console.warn('⚠️ createBuilding function not available');
    }
    
    return false;
  }
}

/**
 * Initialize the building brush system
 * @returns {BuildingBrush} Initialized building brush instance
 */
function initializeBuildingBrush() {
  const brush = new BuildingBrush();
  
  // Register with brush manager if available
  if (typeof window !== 'undefined' && window.BrushManager) {
    window.BrushManager.registerBrush('building', brush);
  }
  
  return brush;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.BuildingBrush = BuildingBrush;
  window.initializeBuildingBrush = initializeBuildingBrush;
  // Auto-initialize
  window.g_buildingBrush = initializeBuildingBrush();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BuildingBrush, initializeBuildingBrush };
}
