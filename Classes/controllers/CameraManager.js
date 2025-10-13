/**
 * CameraManager - Unified camera management system for the ant game
 * 
 * This class consolidates all camera functionality including:
 * - Camera position and zoom management
 * - Input handling (arrow keys for camera, WASD for ants)
 * - Coordinate transformations (screen to world, world to screen)
 * - Camera following and bounds clamping
 * - Integration with existing CameraController utilities
 * 
 * Usage:
 *   const cameraManager = new CameraManager();
 *   cameraManager.initialize();
 *   cameraManager.update(); // Call in draw loop
 *   cameraManager.applyTransform(); // Apply camera transform for rendering
 */

class CameraManager {
  constructor() {
    // Camera position and zoom
    this.cameraX = 0;
    this.cameraY = 0;
    this.cameraZoom = 1;
    this.cameraPanSpeed = 10;
    
    // Camera constraints
    this.MIN_CAMERA_ZOOM = 0.5;
    this.MAX_CAMERA_ZOOM = 3;
    this.CAMERA_ZOOM_STEP = 1.1;
    
    // Camera following
    this.cameraFollowEnabled = false;
    this.cameraFollowTarget = null;
    
    // Canvas dimensions (updated from global variables)
    this.canvasWidth = 800;
    this.canvasHeight = 800;
  }

  /**
   * Initialize the camera manager
   * Should be called once in setup()
   */
  initialize() {
    // Sync with global canvas dimensions if available
    if (typeof g_canvasX !== 'undefined') this.canvasWidth = g_canvasX;
    if (typeof g_canvasY !== 'undefined') this.canvasHeight = g_canvasY;
    
    // Initialize CameraController with starting position
    if (typeof CameraController !== 'undefined') {
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    }
    
    console.log('CameraManager initialized');
  }

  /**
   * Update camera position based on input and following logic
   * Should be called every frame in the game loop
   */
  update() {
    if (!this.isInGame()) return;

    // Update canvas dimensions in case of window resize
    if (typeof g_canvasX !== 'undefined') this.canvasWidth = g_canvasX;
    if (typeof g_canvasY !== 'undefined') this.canvasHeight = g_canvasY;

    // Check for manual camera input (arrow keys only)
    const left = keyIsDown(LEFT_ARROW);
    const right = keyIsDown(RIGHT_ARROW);
    const up = keyIsDown(UP_ARROW);
    const down = keyIsDown(DOWN_ARROW);
    const manualInput = left || right || up || down;

    if (manualInput) {
      // Disable camera following when manually controlling camera
      if (this.cameraFollowEnabled) {
        this.cameraFollowEnabled = false;
        this.cameraFollowTarget = null;
      }

      const panStep = this.cameraPanSpeed / this.cameraZoom;
      
      // Move camera with arrow keys using CameraController
      if (left && typeof CameraController !== 'undefined') CameraController.moveCameraBy(-panStep, 0);
      if (right && typeof CameraController !== 'undefined') CameraController.moveCameraBy(panStep, 0);
      if (up && typeof CameraController !== 'undefined') CameraController.moveCameraBy(0, -panStep);
      if (down && typeof CameraController !== 'undefined') CameraController.moveCameraBy(0, panStep);

      // Update local variables from CameraController
      if (typeof CameraController !== 'undefined') {
        const pos = CameraController.getCameraPosition();
        this.cameraX = pos.x;
        this.cameraY = pos.y;
      }

      this.clampToBounds();
      
    } else if (this.cameraFollowEnabled) {
      // Handle camera following logic
      const primary = this.getPrimarySelectedEntity();
      const target = primary || this.cameraFollowTarget;
      if (target) {
        this.cameraFollowTarget = target;
        this.centerOnEntity(target);
      } else {
        this.cameraFollowEnabled = false;
        this.cameraFollowTarget = null;
      }
    }
  }

  /**
   * Apply camera transformation for rendering
   * Call this before rendering world objects
   */
  applyTransform() {
    push();
    
    // Apply camera transformation using CameraController position
    const cameraPos = typeof CameraController !== 'undefined' 
      ? CameraController.getCameraPosition() 
      : { x: this.cameraX, y: this.cameraY };
      
    scale(this.cameraZoom);
    translate(-cameraPos.x, -cameraPos.y);
  }

  /**
   * Restore transformation after rendering
   * Call this after rendering world objects
   */
  restoreTransform() {
    pop();
  }

  /**
   * Set camera zoom level with focus point
   * @param {number} targetZoom - Target zoom level
   * @param {number} focusX - Screen X coordinate to focus zoom on (default: center)
   * @param {number} focusY - Screen Y coordinate to focus zoom on (default: center)
   * @returns {boolean} True if zoom was changed
   */
  setZoom(targetZoom, focusX = this.canvasWidth / 2, focusY = this.canvasHeight / 2) {
    const clampedZoom = constrain(targetZoom, this.MIN_CAMERA_ZOOM, this.MAX_CAMERA_ZOOM);
    if (clampedZoom === this.cameraZoom) {
      return false;
    }

    // Get world position at focus point before zoom
    const focusWorld = typeof CameraController !== 'undefined'
      ? CameraController.screenToWorld(focusX, focusY)
      : this.screenToWorld(focusX, focusY);

    // Update zoom
    this.cameraZoom = clampedZoom;
    
    // Calculate new camera position to keep focus point at same screen location
    const newCameraX = focusWorld.worldX - focusX / this.cameraZoom;
    const newCameraY = focusWorld.worldY - focusY / this.cameraZoom;
    
    // Update both local variables and CameraController
    this.cameraX = newCameraX;
    this.cameraY = newCameraY;
    if (typeof CameraController !== 'undefined') {
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    }

    this.clampToBounds();

    // Handle camera following during zoom
    if (this.cameraFollowEnabled) {
      const target = this.cameraFollowTarget || this.getPrimarySelectedEntity();
      if (target) {
        this.centerOnEntity(target);
      } else {
        this.cameraFollowEnabled = false;
        this.cameraFollowTarget = null;
      }
    }

    return true;
  }

  /**
   * Handle mouse wheel zoom
   * @param {Event} event - Mouse wheel event
   * @returns {boolean} False to prevent default behavior
   */
  handleMouseWheel(event) {
    if (!this.isInGame()) { 
      return true; 
    }

    const wheelDelta = event?.deltaY ?? 0;
    if (wheelDelta === 0) { 
      return false; 
    }

    const zoomFactor = wheelDelta > 0 ? (1 / this.CAMERA_ZOOM_STEP) : this.CAMERA_ZOOM_STEP;
    const targetZoom = this.cameraZoom * zoomFactor;
    this.setZoom(targetZoom, mouseX, mouseY);

    return false;
  }

  /**
   * Center camera on world coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   */
  centerOn(worldX, worldY) {
    // Use CameraController's built-in centering function
    if (typeof CameraController !== 'undefined') {
      CameraController.centerCameraOn(worldX, worldY);
      
      // Update local variables
      const pos = CameraController.getCameraPosition();
      this.cameraX = pos.x;
      this.cameraY = pos.y;
    } else {
      // Fallback implementation
      const viewWidth = this.canvasWidth / this.cameraZoom;
      const viewHeight = this.canvasHeight / this.cameraZoom;

      this.cameraX = worldX - viewWidth / 2;
      this.cameraY = worldY - viewHeight / 2;
    }

    this.clampToBounds();
  }

  /**
   * Center camera on an entity
   * @param {Object} entity - Entity with position properties
   */
  centerOnEntity(entity) {
    const center = this.getEntityWorldCenter(entity);
    if (center) {
      this.centerOn(center.x, center.y);
    }
  }

  /**
   * Toggle camera following for the primary selected entity
   */
  toggleFollow() {
    const target = this.getPrimarySelectedEntity();

    if (this.cameraFollowEnabled) {
      if (!target || target === this.cameraFollowTarget) {
        this.cameraFollowEnabled = false;
        this.cameraFollowTarget = null;
        return;
      }
    }

    if (target) {
      this.cameraFollowEnabled = true;
      this.cameraFollowTarget = target;
      this.centerOnEntity(target);
    }
  }

  /**
   * Clamp camera position to world bounds
   */
  clampToBounds() {
    if (typeof getMapPixelDimensions !== 'function') {
      return; // Can't clamp without map dimensions
    }

    const { width, height } = getMapPixelDimensions();
    const viewWidth = this.canvasWidth / this.cameraZoom;
    const viewHeight = this.canvasHeight / this.cameraZoom;

    let minX = 0;
    let maxX = width - viewWidth;
    if (viewWidth >= width) {
      const excessX = viewWidth - width;
      minX = -excessX / 2;
      maxX = excessX / 2;
    } else {
      maxX = Math.max(0, maxX);
    }

    let minY = 0;
    let maxY = height - viewHeight;
    if (viewHeight >= height) {
      const excessY = viewHeight - height;
      minY = -excessY / 2;
      maxY = excessY / 2;
    } else {
      maxY = Math.max(0, maxY);
    }

    this.cameraX = constrain(this.cameraX, minX, maxX);
    this.cameraY = constrain(this.cameraY, minY, maxY);

    // Update CameraController with clamped position
    if (typeof CameraController !== 'undefined') {
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} px - Screen X coordinate
   * @param {number} py - Screen Y coordinate
   * @returns {Object} World coordinates {worldX, worldY}
   */
  screenToWorld(px = mouseX, py = mouseY) {
    // Use CameraController for consistent coordinate conversion
    if (typeof CameraController !== 'undefined') {
      return CameraController.screenToWorld(px, py);
    }
    
    // Fallback implementation
    return {
      worldX: this.cameraX + px / this.cameraZoom,
      worldY: this.cameraY + py / this.cameraZoom
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {screenX, screenY}
   */
  worldToScreen(worldX, worldY) {
    // Use CameraController for consistent coordinate conversion
    if (typeof CameraController !== 'undefined') {
      return CameraController.worldToScreen(worldX, worldY);
    }
    
    // Fallback implementation
    return {
      screenX: (worldX - this.cameraX) * this.cameraZoom,
      screenY: (worldY - this.cameraY) * this.cameraZoom
    };
  }

  /**
   * Get current world mouse position
   * @returns {Object} World coordinates {worldX, worldY}
   */
  getWorldMousePosition() {
    return this.screenToWorld(mouseX, mouseY);
  }

  // Getter methods for compatibility
  getX() { return this.cameraX; }
  getY() { return this.cameraY; }
  getZoom() { return this.cameraZoom; }
  getPosition() { return { x: this.cameraX, y: this.cameraY }; }
  
  // Setter methods
  setPosition(x, y) {
    this.cameraX = x;
    this.cameraY = y;
    if (typeof CameraController !== 'undefined') {
      CameraController.setCameraPosition(x, y);
    }
  }

  // Utility methods (stubs - these should reference actual game functions)
  isInGame() {
    return typeof GameState !== 'undefined' ? GameState.isInGame() : true;
  }

  getPrimarySelectedEntity() {
    // This should reference your actual selected entity logic
    return typeof getPrimarySelectedEntity === 'function' ? getPrimarySelectedEntity() : null;
  }

  getEntityWorldCenter(entity) {
    // This should reference your actual entity center calculation
    return typeof getEntityWorldCenter === 'function' ? getEntityWorldCenter(entity) : null;
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.CameraManager = CameraManager;
}