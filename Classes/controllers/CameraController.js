/**
 * CameraController - Global camera system for handling viewport movement and mouse coordinate compensation
 * 
 * This controller provides:
 * - Camera position management
 * - Mouse coordinate conversion between screen and world space
 * - Global utilities for camera-aware interactions
 * 
 * Usage:
 *   CameraController.setCameraPosition(x, y);
 *   const worldPos = CameraController.getWorldMouse();
 *   const screenPos = CameraController.worldToScreen(worldX, worldY);
 */

// Initialize camera position variables globally
if (typeof window !== 'undefined') {
  if (typeof window.cameraX === 'undefined') window.cameraX = 0;
  if (typeof window.cameraY === 'undefined') window.cameraY = 0;
}

class CameraController {
  /**
   * Get camera-compensated mouse X coordinate
   * @returns {number} Mouse X position adjusted for camera offset
   */
  static getWorldMouseX() {
    return (typeof mouseX !== 'undefined' ? mouseX : 0) + (typeof cameraX !== 'undefined' ? cameraX : 0);
  }

  /**
   * Get camera-compensated mouse Y coordinate
   * @returns {number} Mouse Y position adjusted for camera offset
   */
  static getWorldMouseY() {
    return (typeof mouseY !== 'undefined' ? mouseY : 0) + (typeof cameraY !== 'undefined' ? cameraY : 0);
  }

  /**
   * Get camera-compensated mouse coordinates as an object
   * @returns {Object} Object with worldX, worldY, screenX, and screenY properties
   */
  static getWorldMouse() {
    return {
      worldX: this.getWorldMouseX(),
      worldY: this.getWorldMouseY(),
      screenX: typeof mouseX !== 'undefined' ? mouseX : 0,
      screenY: typeof mouseY !== 'undefined' ? mouseY : 0
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} Object with worldX and worldY properties
   */
  static screenToWorld(screenX, screenY) {
    return {
      worldX: screenX + (typeof cameraX !== 'undefined' ? cameraX : 0),
      worldY: screenY + (typeof cameraY !== 'undefined' ? cameraY : 0)
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object} Object with screenX and screenY properties
   */
  static worldToScreen(worldX, worldY) {
    return {
      screenX: worldX - (typeof cameraX !== 'undefined' ? cameraX : 0),
      screenY: worldY - (typeof cameraY !== 'undefined' ? cameraY : 0)
    };
  }

  /**
   * Set camera position
   * @param {number} x - Camera X position
   * @param {number} y - Camera Y position
   */
  static setCameraPosition(x, y) {
    if (typeof window !== 'undefined') {
      window.cameraX = x;
      window.cameraY = y;
    }
    if (typeof globalThis !== 'undefined') {
      globalThis.cameraX = x;
      globalThis.cameraY = y;
    }
  }

  /**
   * Move camera by relative offset
   * @param {number} deltaX - Change in X position
   * @param {number} deltaY - Change in Y position
   */
  static moveCameraBy(deltaX, deltaY) {
    const currentX = typeof cameraX !== 'undefined' ? cameraX : 0;
    const currentY = typeof cameraY !== 'undefined' ? cameraY : 0;
    this.setCameraPosition(currentX + deltaX, currentY + deltaY);
  }

  /**
   * Get current camera position
   * @returns {Object} Object with x and y properties
   */
  static getCameraPosition() {
    return {
      x: typeof cameraX !== 'undefined' ? cameraX : 0,
      y: typeof cameraY !== 'undefined' ? cameraY : 0
    };
  }

  /**
   * Center camera on a specific world position
   * @param {number} worldX - World X coordinate to center on
   * @param {number} worldY - World Y coordinate to center on
   */
  static centerCameraOn(worldX, worldY) {
    this.setCameraPosition(
      worldX/ 2,
      worldY/2
    );
  }

  /**
   * Get the visible world bounds based on current camera position
   * @returns {Object} Object with left, right, top, bottom properties
   */
  static getVisibleBounds() {
    const canvasWidth = typeof g_canvasX !== 'undefined' ? g_canvasX : 800;
    const canvasHeight = typeof g_canvasY !== 'undefined' ? g_canvasY : 800;
    const camera = this.getCameraPosition();
    
    return {
      left: camera.x,
      right: camera.x + canvasWidth,
      top: camera.y,
      bottom: camera.y + canvasHeight
    };
  }

  /**
   * Check if a world position is visible on screen
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {boolean} True if position is visible
   */
  static isPositionVisible(worldX, worldY) {
    const bounds = this.getVisibleBounds();
    return worldX >= bounds.left && worldX <= bounds.right &&
           worldY >= bounds.top && worldY <= bounds.bottom;
  }
}

// Camera functions have been moved to CameraManager.js
// Use cameraManager.methodName() instead of these functions:

function screenToWorld(px = mouseX, py = mouseY) {
  return cameraManager ? cameraManager.screenToWorld(px, py) : { worldX: px, worldY: py };
}

function getWorldMousePosition(px = mouseX, py = mouseY) {
  return cameraManager ? cameraManager.screenToWorld(px, py) : { worldX: px, worldY: py };
}

function worldToScreen(worldX, worldY) {
  return cameraManager ? cameraManager.worldToScreen(worldX, worldY) : { screenX: worldX, screenY: worldY };
}

function setCameraZoom(targetZoom, focusX, focusY) {
  return cameraManager ? cameraManager.setZoom(targetZoom, focusX, focusY) : false;
}

function centerCameraOn(worldX, worldY) {
  if (cameraManager) cameraManager.centerOn(worldX, worldY);
}

function centerCameraOnEntity(entity) {
  if (cameraManager) cameraManager.centerOnEntity(entity);
}

function toggleCameraFollow() {
  if (cameraManager) cameraManager.toggleFollow();
}

// Expose camera controller and utilities globally
if (typeof window !== 'undefined') {
  window.CameraController = CameraController;
  
  // Convenient global functions for common operations
  window.getWorldMouseX = () => CameraController.getWorldMouseX();
  window.getWorldMouseY = () => CameraController.getWorldMouseY();
  window.getWorldMouse = () => CameraController.getWorldMouse();
  window.screenToWorld = (screenX, screenY) => CameraController.screenToWorld(screenX, screenY);
  window.worldToScreen = (worldX, worldY) => CameraController.worldToScreen(worldX, worldY);
  window.setCameraPosition = (x, y) => CameraController.setCameraPosition(x, y);
  window.moveCameraBy = (deltaX, deltaY) => CameraController.moveCameraBy(deltaX, deltaY);
  window.getCameraPosition = () => CameraController.getCameraPosition();
  window.centerCameraOn = (worldX, worldY) => CameraController.centerCameraOn(worldX, worldY);
  window.getVisibleBounds = () => CameraController.getVisibleBounds();
  window.isPositionVisible = (worldX, worldY) => CameraController.isPositionVisible(worldX, worldY);
}