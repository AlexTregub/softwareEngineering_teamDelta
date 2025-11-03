/**
 * CustomLevelCamera - Bounded Follow Camera System for Custom Levels
 * 
 * Implements a "bounded follow" algorithm where the camera only moves when the 
 * followed entity (queen) exits a configurable bounding box centered in the viewport.
 * 
 * Key Features:
 * - Queen stays centered within a flexible bounding box (default 25% margins)
 * - Camera only moves when queen exits the box
 * - Soft map bounds clamping (allows queen to reach all map edges)
 * - Zoom-aware calculations
 * - Compatible with CameraController sync
 * 
 * Usage:
 *   const camera = new CustomLevelCamera(800, 600);
 *   camera.followEntity(queen);
 *   camera.currentMap = mapManager;
 *   camera.updateBounded(); // Call in draw loop
 */

class CustomLevelCamera {
  /**
   * Creates a new CustomLevelCamera instance.
   * 
   * @param {number} canvasWidth - Canvas width in pixels (e.g., 800)
   * @param {number} canvasHeight - Canvas height in pixels (e.g., 600)
   * @param {number} marginX - Horizontal bounding box margin as percentage (default 0.25 = 25%)
   * @param {number} marginY - Vertical bounding box margin as percentage (default 0.25 = 25%)
   */
  constructor(canvasWidth, canvasHeight, marginX = 0.25, marginY = 0.25) {
    // Canvas dimensions
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Camera position (top-left corner of viewport in world coordinates)
    this.cameraX = 0;
    this.cameraY = 0;
    
    // Zoom level
    this.cameraZoom = 1.0;
    
    // Follow target
    this.followTarget = null;
    this.followEnabled = false;
    
    // Bounding box configuration (percentage of viewport)
    this.boundingBoxMarginX = marginX;
    this.boundingBoxMarginY = marginY;
    
    // Map reference (for bounds checking)
    this.currentMap = null;
  }
  
  /**
   * Calculates the current bounding box in world coordinates.
   * The bounding box is a centered rectangle where the queen can move freely
   * without triggering camera movement.
   * 
   * @returns {Object} Bounding box with {left, right, top, bottom} in world coordinates
   */
  calculateBoundingBox() {
    // Calculate view dimensions in world coordinates (accounting for zoom)
    const viewWidth = this.canvasWidth / this.cameraZoom;
    const viewHeight = this.canvasHeight / this.cameraZoom;
    
    // Calculate camera center in world coordinates
    const cameraCenterX = this.cameraX + (viewWidth / 2);
    const cameraCenterY = this.cameraY + (viewHeight / 2);
    
    // Calculate bounding box margins in world coordinates
    const boxMarginX = viewWidth * this.boundingBoxMarginX;
    const boxMarginY = viewHeight * this.boundingBoxMarginY;
    
    // Return bounding box edges
    return {
      left: cameraCenterX - boxMarginX,
      right: cameraCenterX + boxMarginX,
      top: cameraCenterY - boxMarginY,
      bottom: cameraCenterY + boxMarginY
    };
  }
  
  /**
   * Gets the world center position of an entity.
   * 
   * @param {Object} entity - Entity with x, y, width, height properties
   * @returns {Object|null} Center position {x, y} or null if invalid entity
   */
  getEntityWorldCenter(entity) {
    if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') {
      return null;
    }
    
    // Default to 60 if width/height not specified
    const width = entity.width || 60;
    const height = entity.height || 60;
    
    return {
      x: entity.x + (width / 2),
      y: entity.y + (height / 2)
    };
  }
  
  /**
   * Updates camera position using bounded follow algorithm.
   * Camera only moves when the followed entity exits the bounding box.
   * 
   * Called every frame from the game loop.
   */
  updateBounded() {
    // Skip if following disabled or no target
    if (!this.followEnabled || !this.followTarget) {
      return;
    }
    
    // Get entity center position
    const entityCenter = this.getEntityWorldCenter(this.followTarget);
    if (!entityCenter) {
      return;
    }
    
    // Calculate current bounding box
    const box = this.calculateBoundingBox();
    
    // Calculate camera adjustment needed
    let dx = 0;
    let dy = 0;
    
    // Check if entity is outside bounding box
    if (entityCenter.x < box.left) {
      dx = entityCenter.x - box.left;
    } else if (entityCenter.x > box.right) {
      dx = entityCenter.x - box.right;
    }
    
    if (entityCenter.y < box.top) {
      dy = entityCenter.y - box.top;
    } else if (entityCenter.y > box.bottom) {
      dy = entityCenter.y - box.bottom;
    }
    
    // Apply camera adjustment
    this.cameraX += dx;
    this.cameraY += dy;
    
    // Apply map bounds clamping
    this.clampToMapBounds();
  }
  
  /**
   * Clamps camera position to map bounds (soft clamping).
   * Allows the followed entity to reach all map edges while keeping
   * the camera within valid bounds.
   */
  clampToMapBounds() {
    if (!this.currentMap) {
      return;
    }
    
    // Get map bounds in world coordinates
    const mapBounds = this.currentMap.getWorldBounds();
    if (!mapBounds) {
      return;
    }
    
    const mapWidth = mapBounds.width;
    const mapHeight = mapBounds.height;
    
    // Calculate view dimensions in world coordinates
    const viewWidth = this.canvasWidth / this.cameraZoom;
    const viewHeight = this.canvasHeight / this.cameraZoom;
    
    // Calculate min/max camera positions
    let minX = 0;
    let minY = 0;
    let maxX = mapWidth - viewWidth;
    let maxY = mapHeight - viewHeight;
    
    // Handle case where viewport is larger than map (center the map)
    if (viewWidth >= mapWidth) {
      minX = -(viewWidth - mapWidth) / 2;
      maxX = minX;
    }
    
    if (viewHeight >= mapHeight) {
      minY = -(viewHeight - mapHeight) / 2;
      maxY = minY;
    }
    
    // Apply clamping
    if (typeof constrain === 'function') {
      this.cameraX = constrain(this.cameraX, minX, maxX);
      this.cameraY = constrain(this.cameraY, minY, maxY);
    } else {
      // Fallback if constrain not available
      this.cameraX = Math.max(minX, Math.min(maxX, this.cameraX));
      this.cameraY = Math.max(minY, Math.min(maxY, this.cameraY));
    }
  }
  
  /**
   * Enables or disables following an entity.
   * 
   * @param {Object|null} entity - Entity to follow, or null to disable following
   * @returns {boolean} True if following enabled, false otherwise
   */
  followEntity(entity) {
    if (!entity) {
      this.followEnabled = false;
      this.followTarget = null;
      return false;
    }
    
    this.followEnabled = true;
    this.followTarget = entity;
    
    // Immediately center on entity
    const entityCenter = this.getEntityWorldCenter(entity);
    if (entityCenter) {
      const viewWidth = this.canvasWidth / this.cameraZoom;
      const viewHeight = this.canvasHeight / this.cameraZoom;
      
      this.cameraX = entityCenter.x - (viewWidth / 2);
      this.cameraY = entityCenter.y - (viewHeight / 2);
      
      this.clampToMapBounds();
    }
    
    return true;
  }
  
  /**
   * Sets the zoom level.
   * 
   * @param {number} zoom - New zoom level (1.0 = normal, 2.0 = 2x zoomed in)
   */
  setZoom(zoom) {
    this.cameraZoom = zoom;
  }
  
  /**
   * Sets the bounding box margin percentages.
   * 
   * @param {number} marginX - Horizontal margin (0.0 to 1.0)
   * @param {number} marginY - Vertical margin (0.0 to 1.0)
   */
  setMargins(marginX, marginY) {
    this.boundingBoxMarginX = marginX;
    this.boundingBoxMarginY = marginY;
  }
  
  /**
   * Gets the current camera position and zoom.
   * 
   * @returns {Object} Camera state {x, y, zoom}
   */
  getCameraPosition() {
    return {
      x: this.cameraX,
      y: this.cameraY,
      zoom: this.cameraZoom
    };
  }
  
  /**
   * Sets the current camera position.
   * 
   * @param {number} x - Camera X position in world coordinates
   * @param {number} y - Camera Y position in world coordinates
   */
  setCameraPosition(x, y) {
    this.cameraX = x;
    this.cameraY = y;
  }
  
  /**
   * Centers the camera on a specific world position.
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   */
  centerOn(worldX, worldY) {
    const viewWidth = this.canvasWidth / this.cameraZoom;
    const viewHeight = this.canvasHeight / this.cameraZoom;
    
    this.cameraX = worldX - (viewWidth / 2);
    this.cameraY = worldY - (viewHeight / 2);
    
    this.clampToMapBounds();
  }
  
  /**
   * Centers the camera on an entity.
   * 
   * @param {Object} entity - Entity to center on
   */
  centerOnEntity(entity) {
    const center = this.getEntityWorldCenter(entity);
    if (center) {
      this.centerOn(center.x, center.y);
    }
  }
  
  /**
   * Converts world coordinates to screen coordinates.
   * CRITICAL: Required by EntityLayerRenderer for frustum culling.
   * 
   * Screen coords = (world coords - camera position) * zoom
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {screenX, screenY}
   */
  worldToScreen(worldX, worldY) {
    return {
      screenX: (worldX - this.cameraX) * this.cameraZoom,
      screenY: (worldY - this.cameraY) * this.cameraZoom
    };
  }
  
  /**
   * Converts screen coordinates to world coordinates.
   * 
   * World coords = (screen coords / zoom) + camera position
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {worldX, worldY}
   */
  screenToWorld(screenX, screenY) {
    return {
      worldX: (screenX / this.cameraZoom) + this.cameraX,
      worldY: (screenY / this.cameraZoom) + this.cameraY
    };
  }
  
  /**
   * Main update method - delegates to bounded follow algorithm.
   * Called every frame from the game loop.
   */
  update() {
    this.updateBounded();
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomLevelCamera;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.CustomLevelCamera = CustomLevelCamera;
}
