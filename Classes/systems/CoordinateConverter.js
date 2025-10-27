/**
 * CoordinateConverter - Centralized coordinate conversion utility
 * 
 * Provides unified API for converting between screen/world/tile coordinate spaces.
 * Handles Y-axis inversion via terrain system automatically.
 * 
 * @module CoordinateConverter
 * @requires g_activeMap.renderConversion (terrain coordinate system)
 * @requires TILE_SIZE (global tile size constant)
 * 
 * @example
 * // Convert mouse click to world coordinates
 * const worldPos = CoordinateConverter.screenToWorld(mouseX, mouseY);
 * 
 * @example
 * // Render UI element at entity's world position
 * const screenPos = CoordinateConverter.worldToScreen(entity.posX, entity.posY);
 * text("Label", screenPos.x, screenPos.y - 10);
 * 
 * @example
 * // Get tile coordinates from mouse
 * const tile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
 * logNormal(`Mouse over tile ${tile.x}, ${tile.y}`);
 */

(function() {
  'use strict';

  const CoordinateConverter = {
    
    /**
     * Convert screen coordinates to world pixel coordinates
     * Handles camera position and Y-axis inversion via terrain system
     * 
     * @param {number} screenX - X coordinate in screen space (canvas pixels)
     * @param {number} screenY - Y coordinate in screen space (canvas pixels)
     * @returns {{x: number, y: number}} World coordinates in pixels
     * 
     * @example
     * function mousePressed() {
     *   const worldPos = CoordinateConverter.screenToWorld(mouseX, mouseY);
     *   logNormal('Clicked at world:', worldPos.x, worldPos.y);
     * }
     */
    screenToWorld: function(screenX, screenY) {
      try {
        // Primary: Use terrain's coordinate system (includes Y-axis inversion)
        if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
            typeof g_activeMap.renderConversion.convCanvasToPos === 'function' && 
            typeof TILE_SIZE !== 'undefined') {
          
          // Get tile position from screen coords (handles Y inversion internally)
          const tilePos = g_activeMap.renderConversion.convCanvasToPos([screenX, screenY]);
          
          // Convert tile position to world pixel position
          const worldX = tilePos[0] * TILE_SIZE;
          const worldY = tilePos[1] * TILE_SIZE;
          
          return { x: worldX, y: worldY };
        }
        
        // Fallback 1: Use camera manager if available
        if (typeof window !== 'undefined' && window.g_cameraManager && 
            typeof window.g_cameraManager.screenToWorld === 'function') {
          const result = window.g_cameraManager.screenToWorld(screenX, screenY);
          return { 
            x: result.worldX !== undefined ? result.worldX : (result.x !== undefined ? result.x : screenX), 
            y: result.worldY !== undefined ? result.worldY : (result.y !== undefined ? result.y : screenY) 
          };
        }
        
        // Fallback 2: Use CameraController static method
        if (typeof CameraController !== 'undefined' && 
            typeof CameraController.screenToWorld === 'function') {
          const result = CameraController.screenToWorld(screenX, screenY);
          return { 
            x: result.worldX !== undefined ? result.worldX : (result.x !== undefined ? result.x : screenX), 
            y: result.worldY !== undefined ? result.worldY : (result.y !== undefined ? result.y : screenY) 
          };
        }
        
        // Fallback 3: Use global camera position (no zoom support)
        const camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? 
                     window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
        const camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? 
                     window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
        
        return { x: screenX + camX, y: screenY + camY };
        
      } catch (e) {
        console.warn('CoordinateConverter.screenToWorld error:', e);
        return { x: screenX, y: screenY };
      }
    },

    /**
     * Convert world pixel coordinates to screen coordinates
     * Handles camera position and Y-axis inversion via terrain system
     * 
     * @param {number} worldX - X coordinate in world space (pixels)
     * @param {number} worldY - Y coordinate in world space (pixels)
     * @returns {{x: number, y: number}} Screen coordinates in pixels
     * 
     * @example
     * function drawEntityLabel(entity) {
     *   const screenPos = CoordinateConverter.worldToScreen(entity.posX, entity.posY);
     *   text(entity.name, screenPos.x, screenPos.y - 20);
     * }
     */
    worldToScreen: function(worldX, worldY) {
      try {
        // Primary: Use terrain's coordinate system (includes Y-axis inversion)
        if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
            typeof g_activeMap.renderConversion.convPosToCanvas === 'function' && 
            typeof TILE_SIZE !== 'undefined') {
          
          // Convert world pixel position to tile position
          const tileX = worldX / TILE_SIZE;
          const tileY = worldY / TILE_SIZE;
          
          // Get screen position from terrain system (handles Y inversion internally)
          const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
          
          return { x: Math.round(screenPos[0]), y: Math.round(screenPos[1]) };
        }
        
        // Fallback 1: Use camera manager if available
        if (typeof window !== 'undefined' && window.g_cameraManager && 
            typeof window.g_cameraManager.worldToScreen === 'function') {
          const result = window.g_cameraManager.worldToScreen(worldX, worldY);
          return { 
            x: result.screenX !== undefined ? result.screenX : (result.x !== undefined ? result.x : worldX), 
            y: result.screenY !== undefined ? result.screenY : (result.y !== undefined ? result.y : worldY) 
          };
        }
        
        // Fallback 2: Use CameraController static method
        if (typeof CameraController !== 'undefined' && 
            typeof CameraController.worldToScreen === 'function') {
          const result = CameraController.worldToScreen(worldX, worldY);
          return { 
            x: result.screenX !== undefined ? result.screenX : (result.x !== undefined ? result.x : worldX), 
            y: result.screenY !== undefined ? result.screenY : (result.y !== undefined ? result.y : worldY) 
          };
        }
        
        // Fallback 3: Use global camera position (no zoom support)
        const camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? 
                     window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
        const camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? 
                     window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
        
        return { x: Math.round(worldX - camX), y: Math.round(worldY - camY) };
        
      } catch (e) {
        console.warn('CoordinateConverter.worldToScreen error:', e);
        return { x: worldX, y: worldY };
      }
    },

    /**
     * Convert screen coordinates to world tile coordinates
     * Convenience method for tile-based operations
     * 
     * @param {number} screenX - X coordinate in screen space (canvas pixels)
     * @param {number} screenY - Y coordinate in screen space (canvas pixels)
     * @returns {{x: number, y: number}} Tile coordinates (floored integers)
     * 
     * @example
     * function highlightTileUnderMouse() {
     *   const tile = CoordinateConverter.screenToWorldTile(mouseX, mouseY);
     *   logNormal(`Mouse over tile [${tile.x}, ${tile.y}]`);
     * }
     */
    screenToWorldTile: function(screenX, screenY) {
      try {
        // Use terrain system directly if available (most accurate)
        if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
            typeof g_activeMap.renderConversion.convCanvasToPos === 'function') {
          const tilePos = g_activeMap.renderConversion.convCanvasToPos([screenX, screenY]);
          return { x: Math.floor(tilePos[0]), y: Math.floor(tilePos[1]) };
        }
        
        // Fallback: Convert to world pixels then divide by tile size
        const worldPos = this.screenToWorld(screenX, screenY);
        const tileSize = this.getTileSize();
        return { 
          x: Math.floor(worldPos.x / tileSize), 
          y: Math.floor(worldPos.y / tileSize) 
        };
        
      } catch (e) {
        console.warn('CoordinateConverter.screenToWorldTile error:', e);
        const tileSize = this.getTileSize();
        return { x: Math.floor(screenX / tileSize), y: Math.floor(screenY / tileSize) };
      }
    },

    /**
     * Convert world tile coordinates to screen coordinates
     * Returns the screen position of the tile's top-left corner
     * 
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {{x: number, y: number}} Screen coordinates of tile top-left corner
     * 
     * @example
     * function drawTileHighlight(tileX, tileY) {
     *   const screenPos = CoordinateConverter.worldTileToScreen(tileX, tileY);
     *   fill(255, 255, 0, 50);
     *   rect(screenPos.x, screenPos.y, TILE_SIZE, TILE_SIZE);
     * }
     */
    worldTileToScreen: function(tileX, tileY) {
      try {
        // Use terrain system directly if available (most accurate)
        if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && 
            typeof g_activeMap.renderConversion.convPosToCanvas === 'function') {
          const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
          return { x: Math.round(screenPos[0]), y: Math.round(screenPos[1]) };
        }
        
        // Fallback: Convert tile to world pixels then to screen
        const worldPos = this.tileToWorld(tileX, tileY);
        return this.worldToScreen(worldPos.x, worldPos.y);
        
      } catch (e) {
        console.warn('CoordinateConverter.worldTileToScreen error:', e);
        const tileSize = this.getTileSize();
        return { x: tileX * tileSize, y: tileY * tileSize };
      }
    },

    /**
     * Convert world pixel coordinates to tile coordinates
     * 
     * @param {number} worldX - X coordinate in world space (pixels)
     * @param {number} worldY - Y coordinate in world space (pixels)
     * @returns {{x: number, y: number}} Tile coordinates (floored integers)
     * 
     * @example
     * const entityTile = CoordinateConverter.worldToTile(entity.posX, entity.posY);
     */
    worldToTile: function(worldX, worldY) {
      const tileSize = this.getTileSize();
      return { 
        x: Math.floor(worldX / tileSize), 
        y: Math.floor(worldY / tileSize) 
      };
    },

    /**
     * Convert tile coordinates to world pixel coordinates
     * Returns the world position of the tile's top-left corner
     * 
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {{x: number, y: number}} World coordinates in pixels
     * 
     * @example
     * const worldPos = CoordinateConverter.tileToWorld(10, 15);
     * entity.moveToLocation(worldPos.x, worldPos.y);
     */
    tileToWorld: function(tileX, tileY) {
      const tileSize = this.getTileSize();
      return { 
        x: tileX * tileSize, 
        y: tileY * tileSize 
      };
    },

    /**
     * Check if the terrain coordinate system is available
     * 
     * @returns {boolean} True if terrain system is ready for use
     * 
     * @example
     * if (CoordinateConverter.isAvailable()) {
     *   // Safe to use coordinate conversions
     * }
     */
    isAvailable: function() {
      return typeof g_activeMap !== 'undefined' && 
             g_activeMap !== null && 
             g_activeMap.renderConversion && 
             typeof g_activeMap.renderConversion.convCanvasToPos === 'function' && 
             typeof g_activeMap.renderConversion.convPosToCanvas === 'function' &&
             typeof TILE_SIZE !== 'undefined';
    },

    /**
     * Get the current tile size
     * 
     * @returns {number} Tile size in pixels (defaults to 32 if undefined)
     */
    getTileSize: function() {
      return typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32;
    },

    /**
     * Get debug information about the coordinate system
     * 
     * @returns {Object} Debug information
     * 
     * @example
     * console.table(CoordinateConverter.getDebugInfo());
     */
    getDebugInfo: function() {
      return {
        terrainSystemAvailable: this.isAvailable(),
        g_activeMapExists: typeof g_activeMap !== 'undefined' && g_activeMap !== null,
        renderConversionExists: typeof g_activeMap !== 'undefined' && g_activeMap && !!g_activeMap.renderConversion,
        tileSizeDefined: typeof TILE_SIZE !== 'undefined',
        tileSize: this.getTileSize(),
        cameraManagerExists: typeof window !== 'undefined' && !!window.g_cameraManager,
        cameraControllerExists: typeof CameraController !== 'undefined',
        fallbackCameraX: typeof cameraX !== 'undefined' ? cameraX : (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined' ? window.cameraX : 'undefined'),
        fallbackCameraY: typeof cameraY !== 'undefined' ? cameraY : (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined' ? window.cameraY : 'undefined')
      };
    }
  };

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.CoordinateConverter = CoordinateConverter;
  }

  // Also support module.exports for Node.js testing environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoordinateConverter;
  }

})();
