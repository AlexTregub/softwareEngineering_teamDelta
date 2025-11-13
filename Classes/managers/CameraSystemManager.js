/**
 * CameraSystemManager - Camera System Switcher
 * 
 * Manages multiple camera systems and switches between them based on GameState:
 * - CameraManager: For procedural levels (PLAYING state)
 * - CustomLevelCamera: For custom JSON levels (IN_GAME state)
 * 
 * Provides seamless state transfer when switching cameras, including:
 * - Camera position (x, y)
 * - Zoom level
 * - Follow target
 * - Map reference
 * 
 * Usage:
 *   const systemManager = new CameraSystemManager(cameraController, 800, 600);
 *   systemManager.switchCamera('IN_GAME'); // Switch to custom level camera
 *   systemManager.update(); // Delegates to active camera
 */

class CameraSystemManager {
  /**
   * Creates a new CameraSystemManager instance.
   * 
   * @param {CameraController} cameraController - The CameraController instance
   * @param {number} canvasWidth - Canvas width in pixels (default: 800)
   * @param {number} canvasHeight - Canvas height in pixels (default: 600)
   */
  constructor(cameraController, canvasWidth = 800, canvasHeight = 600) {
    this.cameraController = cameraController;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Initialize both camera systems
    this.proceduralCamera = null;
    this.customLevelCamera = null;
    this.activeCamera = null;
    
    // Initialize camera systems
    this._initializeCameras();
  }
  
  /**
   * Initializes both camera systems.
   * @private
   */
  _initializeCameras() {
    // Initialize CameraManager for procedural levels
    // Note: CameraManager doesn't accept constructor parameters - it initializes itself
    if (typeof CameraManager !== 'undefined') {
      this.proceduralCamera = new CameraManager();
      // Call initialize() to set up the camera properly
      if (typeof this.proceduralCamera.initialize === 'function') {
        this.proceduralCamera.initialize();
      }
    }
    
    // Initialize CustomLevelCamera for custom levels
    if (typeof CustomLevelCamera !== 'undefined') {
      this.customLevelCamera = new CustomLevelCamera(
        this.canvasWidth,
        this.canvasHeight
      );
    }
  }
  
  /**
   * Switches to the appropriate camera system based on GameState.
   * 
   * @param {string} gameState - The current GameState ('PLAYING', 'IN_GAME', 'MENU', 'LEVEL_EDITOR')
   * @returns {Object|null} The newly active camera, or null if no camera selected
   */
  switchCamera(gameState) {
    let newCamera = null;
    
    // Select camera based on state
    if (gameState === 'IN_GAME') {
      newCamera = this.customLevelCamera;
    } else if (gameState === 'PLAYING' || gameState === 'MENU') {
      newCamera = this.proceduralCamera;
    } else if (gameState === 'LEVEL_EDITOR') {
      // Keep current camera for level editor
      return this.activeCamera;
    }
    
    // Transfer state if switching to a different camera
    if (newCamera && newCamera !== this.activeCamera && this.activeCamera) {
      this._transferState(this.activeCamera, newCamera);
    }
    
    // Set new active camera
    this.activeCamera = newCamera;
    
    return this.activeCamera;
  }
  
  /**
   * Transfers state from one camera to another.
   * 
   * @param {Object} fromCamera - Source camera
   * @param {Object} toCamera - Destination camera
   * @private
   */
  _transferState(fromCamera, toCamera) {
    if (!fromCamera || !toCamera) {
      return;
    }
    
    // Transfer camera position and zoom
    if (typeof toCamera.setCameraPosition === 'function') {
      toCamera.setCameraPosition(fromCamera.cameraX, fromCamera.cameraY);
    } else {
      toCamera.cameraX = fromCamera.cameraX;
      toCamera.cameraY = fromCamera.cameraY;
    }
    
    if (typeof toCamera.setZoom === 'function') {
      toCamera.setZoom(fromCamera.cameraZoom);
    } else {
      toCamera.cameraZoom = fromCamera.cameraZoom;
    }
    
    // Transfer follow target
    const followTarget = fromCamera.cameraFollowTarget || fromCamera.followTarget;
    const followEnabled = fromCamera.cameraFollowEnabled || fromCamera.followEnabled;
    
    if (followEnabled && followTarget && typeof toCamera.followEntity === 'function') {
      toCamera.followEntity(followTarget);
    }
    
    // Transfer map reference
    if (fromCamera.currentMap) {
      toCamera.currentMap = fromCamera.currentMap;
    }
  }
  
  /**
   * Initializes the camera system (for fallback CameraManager compatibility).
   * Called once during setup.
   */
  initialize() {
    if (this.activeCamera && typeof this.activeCamera.initialize === 'function') {
      this.activeCamera.initialize();
    }
  }
  
  /**
   * Updates the active camera.
   * Called every frame from the game loop.
   */
  update() {
    if (this.activeCamera && typeof this.activeCamera.update === 'function') {
      this.activeCamera.update();
    }
  }
  
  /**
   * Handles mouse wheel events for zooming.
   * 
   * @param {Event} event - Mouse wheel event
   * @returns {boolean} True if event was handled
   */
  handleMouseWheel(event) {
    if (this.activeCamera && typeof this.activeCamera.handleMouseWheel === 'function') {
      return this.activeCamera.handleMouseWheel(event);
    }
    return false;
  }
  
  /**
   * Toggles camera following on/off.
   */
  toggleFollow() {
    if (this.activeCamera && typeof this.activeCamera.toggleFollow === 'function') {
      this.activeCamera.toggleFollow();
    }
  }
  
  /**
   * Centers the camera on a world position.
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   */
  centerOn(worldX, worldY) {
    if (this.activeCamera && typeof this.activeCamera.centerOn === 'function') {
      this.activeCamera.centerOn(worldX, worldY);
    }
  }
  
  /**
   * Centers the camera on an entity.
   * 
   * @param {Object} entity - Entity to center on
   */
  centerOnEntity(entity) {
    if (this.activeCamera && typeof this.activeCamera.centerOnEntity === 'function') {
      this.activeCamera.centerOnEntity(entity);
    }
  }
  
  /**
   * Enables or disables following an entity.
   * 
   * @param {Object|null} entity - Entity to follow, or null to disable
   * @returns {boolean} True if following enabled, false otherwise
   */
  followEntity(entity) {
    if (this.activeCamera && typeof this.activeCamera.followEntity === 'function') {
      return this.activeCamera.followEntity(entity);
    }
    return false;
  }
  
  /**
   * Sets the zoom level.
   * 
   * @param {number} zoom - New zoom level
   */
  setZoom(zoom) {
    if (this.activeCamera && typeof this.activeCamera.setZoom === 'function') {
      this.activeCamera.setZoom(zoom);
    }
  }
  
  /**
   * Gets the current camera position and zoom.
   * 
   * @returns {Object|null} Camera state {x, y, zoom} or null if no active camera
   */
  getCameraPosition() {
    if (this.activeCamera && typeof this.activeCamera.getCameraPosition === 'function') {
      return this.activeCamera.getCameraPosition();
    }
    return null;
  }
  
  /**
   * Sets the current map for both camera systems.
   * 
   * @param {Object} map - The map instance (MapManager or SparseTerrain)
   */
  setCurrentMap(map) {
    if (this.proceduralCamera) {
      this.proceduralCamera.currentMap = map;
    }
    if (this.customLevelCamera) {
      this.customLevelCamera.currentMap = map;
    }
  }
  
  /**
   * Converts world coordinates to screen coordinates.
   * CRITICAL: Required by EntityLayerRenderer for frustum culling.
   * 
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {screenX, screenY}
   */
  worldToScreen(worldX, worldY) {
    if (this.activeCamera && typeof this.activeCamera.worldToScreen === 'function') {
      return this.activeCamera.worldToScreen(worldX, worldY);
    }
    // Fallback: return world coords as-is (no transform)
    return { screenX: worldX, screenY: worldY };
  }
  
  /**
   * Converts screen coordinates to world coordinates.
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} World coordinates {worldX, worldY}
   */
  screenToWorld(screenX, screenY) {
    if (this.activeCamera && typeof this.activeCamera.screenToWorld === 'function') {
      return this.activeCamera.screenToWorld(screenX, screenY);
    }
    // Fallback: return screen coords as-is (no transform)
    return { worldX: screenX, worldY: screenY };
  }
  
  /**
   * Gets the active camera's zoom level.
   * @returns {number} Camera zoom level (default 1.0 if no active camera)
   */
  getZoom() {
    if (this.activeCamera) {
      // Try method first, then property
      if (typeof this.activeCamera.getZoom === 'function') {
        return this.activeCamera.getZoom();
      }
      if (typeof this.activeCamera.cameraZoom === 'number') {
        return this.activeCamera.cameraZoom;
      }
    }
    return 1.0; // Default zoom
  }
  
  /**
   * Gets the active camera's X position.
   * @returns {number|null} Camera X position or null
   */
  get cameraX() {
    return this.activeCamera ? this.activeCamera.cameraX : null;
  }
  
  /**
   * Gets the active camera's Y position.
   * @returns {number|null} Camera Y position or null
   */
  get cameraY() {
    return this.activeCamera ? this.activeCamera.cameraY : null;
  }
  
  /**
   * Gets the active camera's zoom level.
   * @returns {number|null} Camera zoom or null
   */
  get cameraZoom() {
    return this.activeCamera ? this.activeCamera.cameraZoom : null;
  }
  
  /**
   * Gets the canvas width.
   * @returns {number} Canvas width in pixels
   */
  get canvasWidth() {
    return this._canvasWidth;
  }
  
  /**
   * Sets the canvas width.
   * @param {number} width - Canvas width in pixels
   */
  set canvasWidth(width) {
    this._canvasWidth = width;
  }
  
  /**
   * Gets the canvas height.
   * @returns {number} Canvas height in pixels
   */
  get canvasHeight() {
    return this._canvasHeight;
  }
  
  /**
   * Sets the canvas height.
   * @param {number} height - Canvas height in pixels
   */
  set canvasHeight(height) {
    this._canvasHeight = height;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CameraSystemManager;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.CameraSystemManager = CameraSystemManager;
}
