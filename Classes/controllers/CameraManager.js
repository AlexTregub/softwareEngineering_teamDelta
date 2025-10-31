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
    // Don't rely on global canvas values at construction time — they may not be set yet.
    // We'll set a safe default here and compute the real center in initialize().
    this.cameraX = 0;
    this.cameraY = 0;
    this.canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : 800;
    this.canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : 600;
    this.cameraZoom = 1;
    this.cameraPanSpeed = 20;
    
    // Camera constraints (state-aware: PLAYING uses 1.0, LEVEL_EDITOR uses 0.5)
    this.MIN_CAMERA_ZOOM_PLAYING = 1.0;  // PLAYING state minimum zoom
    this.MIN_CAMERA_ZOOM_EDITOR = 0.05;   // LEVEL_EDITOR state minimum zoom
    this.MAX_CAMERA_ZOOM = 3;
    this.CAMERA_ZOOM_STEP = 1.1;
    
    // Camera following
    this.cameraFollowEnabled = false;
    this.cameraFollowTarget = null;

    // Camera toggles
    this.cameraOutlineToggle = false;
    
    // Middle-click pan state
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._cameraStartX = 0;
    this._cameraStartY = 0;
    
    // Level-specific bounds (null = use current map, or set custom bounds for level)
    this.customBounds = null; // { width: number, height: number }
    this.currentLevel = null; // Reference to current level map (defaults to g_activeMap)
  }

  /**
   * Initialize the camera manager
   * Should be called once in setup()
   */
  initialize() {    
    // Ensure we have up-to-date canvas dimensions
    this.canvasWidth = (typeof g_canvasX !== 'undefined') ? g_canvasX : this.canvasWidth || 800;
    this.canvasHeight = (typeof g_canvasY !== 'undefined') ? g_canvasY : this.canvasHeight || 600;

    // Compute an initial camera position based on available data.
    // Prefer an existing CameraController position if present; otherwise center on the canvas.
    if (typeof CameraController !== 'undefined' && typeof CameraController.getCameraPosition === 'function') {
      const ccPos = CameraController.getCameraPosition();
      if (ccPos && typeof ccPos.x === 'number' && typeof ccPos.y === 'number') {
        this.cameraX = ccPos.x;
        this.cameraY = ccPos.y;
      } else {
        // If map dimensions are available, center the view on the full map (top-left camera coords)
        if (typeof getMapPixelDimensions === 'function') {
          const dims = getMapPixelDimensions();
          if (dims && dims.width > 0 && dims.height > 0) {
            const viewWidth = this.canvasWidth / this.cameraZoom;
            const viewHeight = this.canvasHeight / this.cameraZoom;
            this.cameraX = (dims.width - viewWidth) / 2;
            this.cameraY = (dims.height - viewHeight) / 2;
          } else {
            this.cameraX = this.canvasWidth / 2;
            this.cameraY = this.canvasHeight / 2;
          }
        } else {
          this.cameraX = this.canvasWidth / 2;
          this.cameraY = this.canvasHeight / 2;
        }
      }
      // Sync CameraController to our computed values to ensure a single source of truth
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    } else {
      // No CameraController yet - center locally and wait for an available controller later
      this.cameraX = this.cameraX || (this.canvasWidth / 2);
      this.cameraY = this.cameraY || (this.canvasHeight / 2);
    }

    // Clamp to bounds if map dimensions are available (safe-guarded inside clampToBounds)
    try { this.clampToBounds(); } catch (e) { /* ignore if clamp depends on uninitialized systems */ }

    logVerbose('CameraManager initialized', { cameraX: this.cameraX, cameraY: this.cameraY, canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight });

    // If the terrain exists at initialization time, sync its camera position so the render
    // converter and CameraManager agree. Convert camera pixel center to tile coordinates.
    if (typeof g_activeMap !== 'undefined' && g_activeMap && typeof g_activeMap.setCameraPosition === 'function') {
      const viewCenterX = this.cameraX + (this.canvasWidth / (2 * this.cameraZoom));
      const viewCenterY = this.cameraY + (this.canvasHeight / (2 * this.cameraZoom));
      const centerTilePos = [ viewCenterX / TILE_SIZE, viewCenterY / TILE_SIZE ];
      try { g_activeMap.setCameraPosition(centerTilePos); } catch (e) { /* ignore */ }
    }
  }

  /**
   * Update camera position based on input and following logic
   * Should be called every frame in the game loop
   */
  update() {
    // Allow camera updates in both normal game and Level Editor
    const isLevelEditor = (typeof GameState !== 'undefined' && GameState.getState() === 'LEVEL_EDITOR');
    const isInGame = this.isInGame();
    
    if (!isInGame && !isLevelEditor) return;
    
    this.drawCameraBounds();
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

      // Use deltaTime for framerate-independent panning
      // deltaTime is in milliseconds, convert to seconds and multiply by speed
      const dt = (typeof deltaTime !== 'undefined' ? deltaTime : 16.67) / 1000.0; // Default to ~60fps
      const panStep = (this.cameraPanSpeed * dt * 60) / this.cameraZoom; // *60 to maintain similar speed to old system
      
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
  // compute view center in world pixels, account for zoom
  const viewCenterX = this.cameraX + (g_canvasX / (2 * this.cameraZoom));
  const viewCenterY = this.cameraY + (g_canvasY / (2 * this.cameraZoom));

  // convert to tile/world coordinates expected by gridTerrain (array of #[tileX, tileY])
  const centerTilePos = [ viewCenterX / TILE_SIZE, viewCenterY / TILE_SIZE ];

  // pass a plain array, not a p5.Vector
  if (typeof g_activeMap !== 'undefined' && g_activeMap && typeof g_activeMap.setCameraPosition === 'function') {
    g_activeMap.setCameraPosition(centerTilePos);
  }
}

  /**
   * Start panning camera with middle-click drag
   * @param {number} mouseX - Initial mouse X position
   * @param {number} mouseY - Initial mouse Y position
   */
  startPan(mouseX, mouseY) {
    this._isPanning = true;
    this._panStartX = mouseX;
    this._panStartY = mouseY;
    this._cameraStartX = this.cameraX;
    this._cameraStartY = this.cameraY;
    
    // Change cursor to indicate pan mode
    if (typeof cursor === 'function') {
      cursor('grab');
    }
  }

  /**
   * Update camera position during middle-click drag
   * Applies pan speed multiplier from SettingsManager for configurable sensitivity
   * @param {number} mouseX - Current mouse X position
   * @param {number} mouseY - Current mouse Y position
   */
  updatePan(mouseX, mouseY) {
    if (!this._isPanning) return;
    
    // Get pan speed multiplier from SettingsManager (default: 1.0x)
    // Multiplier allows user to control pan sensitivity (0.5x = slower, 2.0x = faster)
    let panSpeedMultiplier = 1.0;
    if (typeof SettingsManager !== 'undefined' && SettingsManager.getInstance) {
      const settingsValue = SettingsManager.getInstance().get('camera.panSpeed', 1.0);
      panSpeedMultiplier = settingsValue !== undefined && settingsValue !== null ? settingsValue : 1.0;
    }
    
    // Calculate delta from pan start position
    const deltaX = mouseX - this._panStartX;
    const deltaY = mouseY - this._panStartY;
    
    // Move camera opposite to drag direction with speed multiplier (intuitive "grab and drag" behavior)
    // Multiplier preserves zoom-based scaling while allowing user to adjust overall sensitivity
    this.cameraX = this._cameraStartX - (deltaX * panSpeedMultiplier);
    this.cameraY = this._cameraStartY - (deltaY * panSpeedMultiplier);
    
    // Apply camera bounds if needed
    this.clampToBounds();
    
    // Sync with CameraController if available
    if (typeof CameraController !== 'undefined' && typeof CameraController.setCameraPosition === 'function') {
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    }
  }

  /**
   * End panning and restore cursor
   */
  endPan() {
    this._isPanning = false;
    this._panStartX = 0;
    this._panStartY = 0;
    this._cameraStartX = 0;
    this._cameraStartY = 0;
    
    // Restore default cursor
    if (typeof cursor === 'function' && typeof ARROW !== 'undefined') {
      cursor(ARROW);
    }
  }

  /**
   * Check if currently panning
   * @returns {boolean} True if panning active
   */
  isPanning() {
    return this._isPanning || false;
  }

  /**
   * Draws a rect around the border of what the camera is able to see, should be just outside the range
   * of the canvas at any time. This is for debugging to make sure the camera and the world map
   * are still in snyc
   */
  drawCameraBounds(){
    if (this.cameraOutlineToggle) {
      rectCustom( color(0,0,255,100), color(0,0,255,100),
      30,                                                 // strokeWidth
      createVector(this.cameraX, this.cameraY),        // pos
      createVector(this.canvasWidth, this.canvasHeight),// size
      false,                                            // shouldFill
      true,                                             // shouldStroke
    );}
  }

  /**
   * Toggles the cameraBounds outline, needs to be assigned to a keypress/button
   */
  toggleOutline() { this.cameraOutlineToggle = !this.cameraOutlineToggle }

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
      
    // IMPORTANT: Order matters! Translate first, then scale
    // This way scaling happens around the translated origin, not the screen origin
    translate(-cameraPos.x, -cameraPos.y);
    scale(this.cameraZoom);
  }

  /**
   * Restore transformation after rendering
   * Call this after rendering world objects
   */
  restoreTransform() {
    pop();
  }

  /**
   * Get the appropriate minimum zoom based on current game state
   * @returns {number} Minimum zoom level
   */
  getMinZoom() {
    // Check if we're in Level Editor mode
    const isLevelEditor = (typeof window !== 'undefined' && window.GameState) 
      ? window.GameState.getState() === 'LEVEL_EDITOR'
      : false;
    
    return isLevelEditor ? this.MIN_CAMERA_ZOOM_EDITOR : this.MIN_CAMERA_ZOOM_PLAYING;
  }

  /**
   * Set camera zoom level with focus point
   * @param {number} targetZoom - Target zoom level
   * @param {number} focusX - Screen X coordinate to focus zoom on (default: center)
   * @param {number} focusY - Screen Y coordinate to focus zoom on (default: center)
   * @returns {boolean} True if zoom was changed
   */
  setZoom(targetZoom, focusX = this.canvasWidth / 2, focusY = this.canvasHeight / 2) {
    const minZoom = this.getMinZoom();
    const clampedZoom = constrain(targetZoom, minZoom, this.MAX_CAMERA_ZOOM);
    if (clampedZoom === this.cameraZoom) {
      return false;
    }

    // Get world position at focus point before zoom
    const focusWorld = this.screenToWorld(focusX, focusY);

    // DEBUG: Comprehensive zoom debugging
    if (typeof console !== 'undefined') {
      logVerbose('[CameraManager] setZoom DETAILED DEBUG', {
        zoomChange: {
          from: this.cameraZoom,
          to: clampedZoom,
          factor: clampedZoom / this.cameraZoom
        },
        focusPoint: {
          screen: { x: focusX, y: focusY },
          world: focusWorld,
          screenPercent: {
            x: ((focusX / this.canvasWidth) * 100).toFixed(1) + '%',
            y: ((focusY / this.canvasHeight) * 100).toFixed(1) + '%'
          }
        },
        cameraBefore: {
          x: this.cameraX,
          y: this.cameraY,
          zoom: this.cameraZoom
        },
        canvasSize: {
          width: this.canvasWidth,
          height: this.canvasHeight
        }
      });
    }

    // Store old zoom for calculation
    const oldZoom = this.cameraZoom;
    
    // Update zoom
    this.cameraZoom = clampedZoom;
    
    // Calculate new camera position to keep focus point at same screen location
    // 
    // Transform pipeline (corrected): translate(-cameraX, -cameraY) -> scale(zoom)
    // A world point (wx, wy) appears on screen at: (wx - cameraX) * zoom, (wy - cameraY) * zoom
    // 
    // We want the same world point to appear at the same screen coordinates after zoom:
    // (focusWorld.worldX - newCameraX) * newZoom = focusX
    // (focusWorld.worldY - newCameraY) * newZoom = focusY
    // 
    // Solving for new camera position:
    // newCameraX = focusWorld.worldX - focusX / newZoom
    // newCameraY = focusWorld.worldY - focusY / newZoom
    const newCameraX = focusWorld.worldX - focusX / clampedZoom;
    const newCameraY = focusWorld.worldY - focusY / clampedZoom;
    
    // Update both local variables and CameraController
    this.cameraX = newCameraX;
    this.cameraY = newCameraY;
    if (typeof CameraController !== 'undefined') {
      CameraController.setCameraPosition(this.cameraX, this.cameraY);
    }

    if (typeof console !== 'undefined') {
      // Test the zoom focus calculation
      const testScreenCoords = this.worldToScreen(focusWorld.worldX, focusWorld.worldY);
      
      logVerbose('[CameraManager] setZoom RESULT VERIFICATION', {
        cameraMovement: {
          deltaX: newCameraX - this.cameraX,
          deltaY: newCameraY - this.cameraY,
          direction: this.getCameraMovementDirection(this.cameraX, this.cameraY, newCameraX, newCameraY)
        },
        zoomFocus: {
          originalScreen: { x: focusX, y: focusY },
          worldPoint: focusWorld,
          recalculatedScreen: testScreenCoords,
          screenError: {
            x: Math.abs(focusX - testScreenCoords.screenX),
            y: Math.abs(focusY - testScreenCoords.screenY)
          }
        },
        newCamera: {
          x: newCameraX,
          y: newCameraY,
          zoom: clampedZoom
        }
      });
    }

    this.clampToBounds();

    // DEBUG: Final verification after bounds clamping
    if (typeof console !== 'undefined') {
      const finalScreenCoords = this.worldToScreen(focusWorld.worldX, focusWorld.worldY);
      logVerbose('[CameraManager] FINAL STATE after clampToBounds', {
        finalCamera: { x: this.cameraX, y: this.cameraY, zoom: this.cameraZoom },
        boundsEffect: {
          cameraChanged: (this.cameraX !== newCameraX) || (this.cameraY !== newCameraY),
          originalCalculated: { x: newCameraX, y: newCameraY },
          afterBounds: { x: this.cameraX, y: this.cameraY }
        },
        focusAccuracy: {
          target: { x: focusX, y: focusY },
          actual: finalScreenCoords,
          error: {
            x: Math.abs(focusX - finalScreenCoords.screenX).toFixed(2),
            y: Math.abs(focusY - finalScreenCoords.screenY).toFixed(2)
          }
        }
      });
    }

    // DEBUG: Print terrain converter and camera controller state after zoom so we can
    // see whether the render converter (g_activeMap) or CameraController are out of sync.
    try {
      const ccPos = (typeof CameraController !== 'undefined' && typeof CameraController.getCameraPosition === 'function')
        ? CameraController.getCameraPosition()
        : null;

      if (typeof g_activeMap !== 'undefined' && g_activeMap) {
        const conv = g_activeMap.renderConversion || {};
        const convPos = conv._camPosition ?? null;
        const convCenter = conv._canvasCenter ?? null;
        const stats = typeof g_activeMap.getCacheStats === 'function' ? g_activeMap.getCacheStats() : null;
        logVerbose('[CameraManager] post-zoom state', {
          cameraX: this.cameraX,
          cameraY: this.cameraY,
          cameraZoom: this.cameraZoom,
          cameraControllerPos: ccPos,
          g_activeMap_convPos: convPos,
          g_activeMap_convCenter: convCenter,
          g_activeMap_stats: stats
        });
      } else {
        logVerbose('[CameraManager] post-zoom state', { cameraX: this.cameraX, cameraY: this.cameraY, cameraZoom: this.cameraZoom, cameraControllerPos: ccPos, g_activeMap: null });
      }
    } catch (e) {
      console.warn('CameraManager: post-zoom debug failed', e);
    }

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

    // DEBUG: Mouse coordinates and wheel direction
    logVerbose('[CameraManager] handleMouseWheel DEBUG', {
      wheelDelta,
      zoomDirection: wheelDelta > 0 ? 'zoom out' : 'zoom in',
      mouseX: typeof mouseX !== 'undefined' ? mouseX : 'undefined',
      mouseY: typeof mouseY !== 'undefined' ? mouseY : 'undefined',
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      mousePosition: {
        relative: {
          x: typeof mouseX !== 'undefined' ? (mouseX / this.canvasWidth * 100).toFixed(1) + '%' : 'N/A',
          y: typeof mouseY !== 'undefined' ? (mouseY / this.canvasHeight * 100).toFixed(1) + '%' : 'N/A'
        },
        quadrant: this.getMouseQuadrant()
      }
    });

    const zoomFactor = wheelDelta > 0 ? (1 / this.CAMERA_ZOOM_STEP) : this.CAMERA_ZOOM_STEP;
    const targetZoom = this.cameraZoom * zoomFactor;
    this.setZoom(targetZoom, mouseX, mouseY);

    return false;
  }

  /**
   * Helper to determine which quadrant of the screen the mouse is in
   */
  getMouseQuadrant() {
    if (typeof mouseX === 'undefined' || typeof mouseY === 'undefined') {
      return 'unknown';
    }
    
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    
    if (mouseX < centerX && mouseY < centerY) return 'NW (top-left)';
    if (mouseX >= centerX && mouseY < centerY) return 'NE (top-right)';
    if (mouseX < centerX && mouseY >= centerY) return 'SW (bottom-left)';
    return 'SE (bottom-right)';
  }

  /**
   * Helper to describe camera movement direction
   */
  getCameraMovementDirection(oldX, oldY, newX, newY) {
    const deltaX = newX - oldX;
    const deltaY = newY - oldY;
    
    const directions = [];
    if (Math.abs(deltaY) > 1) {
      directions.push(deltaY > 0 ? 'south' : 'north');
    }
    if (Math.abs(deltaX) > 1) {
      directions.push(deltaX > 0 ? 'east' : 'west');
    }
    
    return directions.length > 0 ? directions.join('-') : 'no movement';
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
      console.warn("Camera not set correctly. CameraController not yet init.")
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
   * Set custom level bounds for camera clamping
   * @param {Object} bounds - {width: number, height: number} or null to use current map
   * @param {Object} levelMap - Reference to level map object (defaults to g_activeMap)
   */
  setLevelBounds(bounds = null, levelMap = null) {
    this.customBounds = bounds;
    this.currentLevel = levelMap;
    logVerbose('CameraManager: Level bounds updated', { bounds, levelMap: levelMap ? 'set' : 'null' });
  }

  /**
   * Get current level bounds (pixels)
   * @returns {Object} {width: number, height: number}
   */
  getLevelBounds() {
    // Use custom bounds if set
    if (this.customBounds) {
      return this.customBounds;
    }
    
    // Use specified level or default to g_activeMap
    const map = this.currentLevel || (typeof g_activeMap !== 'undefined' ? g_activeMap : null);
    
    // Try to get dimensions from map
    if (map && map._xCount > 0 && map._yCount > 0) {
      const tileSize = (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : 32;
      return {
        width: map._xCount * tileSize,
        height: map._yCount * tileSize
      };
    }
    
    // Fallback to getMapPixelDimensions if available
    if (typeof getMapPixelDimensions === 'function') {
      return getMapPixelDimensions();
    }
    
    // Last resort: use canvas size (no clamping)
    return {
      width: this.canvasWidth,
      height: this.canvasHeight
    };
  }

  /**
   * Clamp camera position to world bounds
   * Now level-aware and configurable
   */
  clampToBounds() {
    const bounds = this.getLevelBounds();
    
    // If bounds equals canvas size, we're probably not initialized yet
    if (bounds.width === this.canvasWidth && bounds.height === this.canvasHeight) {
      // Don't clamp if we don't have real map bounds yet
      const map = this.currentLevel || (typeof g_activeMap !== 'undefined' ? g_activeMap : null);
      if (map && !(map._xCount > 0 && map._yCount > 0)) {
        return;
      }
    }

    const viewWidth = this.canvasWidth / this.cameraZoom;
    const viewHeight = this.canvasHeight / this.cameraZoom;

    let minX = 0;
    let maxX = bounds.width - viewWidth;
    if (viewWidth >= bounds.width) {
      // View is larger than world - center world in view
      const excessX = viewWidth - bounds.width;
      minX = -excessX / 2;
      maxX = excessX / 2;
    } else {
      maxX = Math.max(0, maxX);
    }

    let minY = 0;
    let maxY = bounds.height - viewHeight;
    if (viewHeight >= bounds.height) {
      // View is larger than world - center world in view
      const excessY = viewHeight - bounds.height;
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
    // Zoom-aware conversion from screen (pixels) to world coordinates.
    // With corrected transform order: translate first, then scale
    // Screen point (px, py) -> World point calculation:
    // Inverse of: translate(-cameraX, -cameraY) then scale(zoom)
    
    const result = {
      worldX: this.cameraX + px / this.cameraZoom,
      worldY: this.cameraY + py / this.cameraZoom
    };
    
    logVerbose('[CameraManager] screenToWorld DEBUG', {
      input: { px, py },
      camera: { x: this.cameraX, y: this.cameraY, zoom: this.cameraZoom },
      calculation: {
        worldX: `${this.cameraX} + ${px} / ${this.cameraZoom} = ${result.worldX}`,
        worldY: `${this.cameraY} + ${py} / ${this.cameraZoom} = ${result.worldY}`
      },
      result
    });
    
    return result;
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Screen coordinates {screenX, screenY}
   */
  worldToScreen(worldX, worldY) {
    // Zoom-aware conversion from world to screen coordinates.
    // With corrected transform order: translate first, then scale
    // Forward transform: translate(-cameraX, -cameraY) then scale(zoom)
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

// Global utility functions for camera-aware mouse coordinates
/**
 * Get world mouse coordinates that account for camera position and zoom
 * This is a global convenience function that uses the active CameraManager instance
 * @returns {Object} World coordinates {x, y} or screen coordinates if no camera manager
 */
function getWorldMouseX() {
  if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function') {
    const worldPos = window.g_cameraManager.screenToWorld(mouseX, mouseY);
    if (window.g_mouseDebugEnabled) {
      logVerbose(`[getWorldMouseX] Screen: ${mouseX} -> World: ${worldPos.worldX} (Camera: ${window.g_cameraManager.cameraX}, Zoom: ${window.g_cameraManager.cameraZoom})`);
    }
    return worldPos.worldX;
  }
  // Fallback to screen coordinates if no camera manager
  const fallbackX = typeof mouseX !== 'undefined' ? mouseX : 0;
  if (window.g_mouseDebugEnabled) {
    logVerbose(`[getWorldMouseX] Fallback mode: ${fallbackX} (no camera manager)`);
  }
  return fallbackX;
}

function getWorldMouseY() {
  if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function') {
    const worldPos = window.g_cameraManager.screenToWorld(mouseX, mouseY);
    if (window.g_mouseDebugEnabled) {
      logVerbose(`[getWorldMouseY] Screen: ${mouseY} -> World: ${worldPos.worldY} (Camera: ${window.g_cameraManager.cameraY}, Zoom: ${window.g_cameraManager.cameraZoom})`);
    }
    return worldPos.worldY;
  }
  // Fallback to screen coordinates if no camera manager
  const fallbackY = typeof mouseY !== 'undefined' ? mouseY : 0;
  if (window.g_mouseDebugEnabled) {
    logVerbose(`[getWorldMouseY] Fallback mode: ${fallbackY} (no camera manager)`);
  }
  return fallbackY;
}

/**
 * Get world mouse position as an object
 * @returns {Object} World coordinates {x, y}
 */
function getWorldMousePosition() {
  if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function') {
    const worldPos = window.g_cameraManager.screenToWorld(mouseX, mouseY);
    if (window.g_mouseDebugEnabled) {
      logVerbose(`[getWorldMousePosition] Screen: (${mouseX}, ${mouseY}) -> World: (${worldPos.worldX}, ${worldPos.worldY}) | Camera: (${window.g_cameraManager.cameraX}, ${window.g_cameraManager.cameraY}), Zoom: ${window.g_cameraManager.cameraZoom}`);
    }
    return { x: worldPos.worldX, y: worldPos.worldY };
  }
  // Fallback to screen coordinates if no camera manager
  const fallback = { 
    x: typeof mouseX !== 'undefined' ? mouseX : 0, 
    y: typeof mouseY !== 'undefined' ? mouseY : 0 
  };
  if (window.g_mouseDebugEnabled) {
    logVerbose(`[getWorldMousePosition] Fallback mode: (${fallback.x}, ${fallback.y}) (no camera manager)`);
  }
  return fallback;
}

// Debug system for mouse coordinate functions
let g_mouseDebugInterval = null;

/**
 * Start periodic debug output for mouse coordinate functions (once per second)
 */
function startMouseDebug() {
  if (typeof window !== 'undefined') {
    window.g_mouseDebugEnabled = true;
    logVerbose("[Mouse Debug] Starting periodic debug output (1 second intervals)");
    
    // Clear any existing interval
    if (g_mouseDebugInterval) {
      clearInterval(g_mouseDebugInterval);
    }
    
    // Start new interval to call functions every second
    g_mouseDebugInterval = setInterval(() => {
      logVerbose("=== Mouse Debug Sample (1s interval) ===");
      const worldX = getWorldMouseX();
      const worldY = getWorldMouseY();
      const worldPos = getWorldMousePosition();
      logVerbose(`Summary: Screen(${typeof mouseX !== 'undefined' ? mouseX : 'N/A'}, ${typeof mouseY !== 'undefined' ? mouseY : 'N/A'}) -> World(${worldX}, ${worldY})`);
      logVerbose("=====================================");
    }, 1000);
  }
}

/**
 * Stop periodic debug output for mouse coordinate functions
 */
function stopMouseDebug() {
  if (typeof window !== 'undefined') {
    window.g_mouseDebugEnabled = false;
    logVerbose("[Mouse Debug] Stopping periodic debug output");
    
    if (g_mouseDebugInterval) {
      clearInterval(g_mouseDebugInterval);
      g_mouseDebugInterval = null;
    }
  }
}

/**
 * Toggle debug mode for mouse coordinate functions
 */
function toggleMouseDebug() {
  if (typeof window !== 'undefined' && window.g_mouseDebugEnabled) {
    stopMouseDebug();
  } else {
    startMouseDebug();
  }
}

// Export for global use
if (typeof window !== 'undefined') {
  window.CameraManager = CameraManager;
  window.getWorldMouseX = getWorldMouseX;
  window.getWorldMouseY = getWorldMouseY;
  window.getWorldMousePosition = getWorldMousePosition;
  window.startMouseDebug = startMouseDebug;
  window.stopMouseDebug = stopMouseDebug;
  window.toggleMouseDebug = toggleMouseDebug;
  window.g_mouseDebugEnabled = false; // Initialize as disabled
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CameraManager;
}


