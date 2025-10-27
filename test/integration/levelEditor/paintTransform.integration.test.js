/**
 * Integration Tests: Level Editor Paint Transform Consistency
 * 
 * Bug: When zoomed in/out, painted tiles appear offset from mouse cursor
 * Root Cause: Transform mismatch between rendering and coordinate conversion
 * 
 * TDD Approach:
 * 1. Create failing test showing transform inconsistency
 * 2. Fix applyCameraTransform to match screenToWorld inverse
 * 3. Verify test passes
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globals
global.g_canvasX = 800;
global.g_canvasY = 600;
global.TILE_SIZE = 32;
global.mouseX = 400;
global.mouseY = 300;
global.constrain = (val, min, max) => Math.max(min, Math.min(max, val));
global.logVerbose = () => {};
global.verboseLog = () => {};
global.logNormal = () => {};
global.window = global;
global.console = { log: () => {}, warn: () => {} };

// Mock GameState
global.GameState = {
  getState: () => 'LEVEL_EDITOR'
};

// Mock CameraController
global.CameraController = {
  getCameraPosition: () => ({ x: global.cameraX || 0, y: global.cameraY || 0 }),
  setCameraPosition: (x, y) => { global.cameraX = x; global.cameraY = y; }
};

// Mock map bounds
global.g_activeMap = {
  _xCount: 100,
  _yCount: 100
};

// Load CameraManager
require('../../../Classes/controllers/CameraManager');
const CameraManager = global.CameraManager;

describe('Level Editor - Paint Transform Consistency', function() {
  let cameraManager;
  let mockContext;

  beforeEach(function() {
    global.cameraX = 0;
    global.cameraY = 0;
    
    cameraManager = new CameraManager();
    cameraManager.initialize();
    
    // Mock p5.js rendering context for transform testing
    mockContext = {
      transformStack: [],
      currentTransform: { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 }
    };
    
    // Mock p5.js transform functions
    global.push = () => {
      mockContext.transformStack.push({...mockContext.currentTransform});
    };
    
    global.pop = () => {
      if (mockContext.transformStack.length > 0) {
        mockContext.currentTransform = mockContext.transformStack.pop();
      }
    };
    
    global.translate = (x, y) => {
      mockContext.currentTransform.translateX += x;
      mockContext.currentTransform.translateY += y;
    };
    
    global.scale = (s) => {
      mockContext.currentTransform.scaleX *= s;
      mockContext.currentTransform.scaleY *= s;
    };
  });

  describe('Transform Consistency', function() {
    it('should convert screen coords to world coords that match render transform inverse', function() {
      // Set camera state
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.5;
      
      // Screen point (mouse position)
      const screenX = 400;
      const screenY = 300;
      
      // Convert screen to world using CameraManager
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Simulate Level Editor's applyCameraTransform
      global.push();
      global.translate(-cameraManager.cameraX, -cameraManager.cameraY);
      global.scale(cameraManager.cameraZoom);
      
      // Apply forward transform to world coords
      let transformedX = worldCoords.worldX;
      let transformedY = worldCoords.worldY;
      
      // Apply the transform steps
      transformedX -= cameraManager.cameraX;
      transformedY -= cameraManager.cameraY;
      transformedX *= cameraManager.cameraZoom;
      transformedY *= cameraManager.cameraZoom;
      
      global.pop();
      
      // The transformed world coords should equal the original screen coords
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1,
        'Forward transform of world coords should return screen X');
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1,
        'Forward transform of world coords should return screen Y');
    });

    it('should work correctly at zoom = 2.0', function() {
      cameraManager.cameraX = 200;
      cameraManager.cameraY = 150;
      cameraManager.cameraZoom = 2.0;
      
      const screenX = 500;
      const screenY = 400;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1);
    });

    it('should work correctly at zoom = 0.5 (zoomed out)', function() {
      cameraManager.cameraX = 50;
      cameraManager.cameraY = 25;
      cameraManager.cameraZoom = 0.5;
      
      const screenX = 300;
      const screenY = 200;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1);
    });

    it('should work with camera offset and zoom', function() {
      cameraManager.cameraX = 500;
      cameraManager.cameraY = 300;
      cameraManager.cameraZoom = 1.2;
      
      const screenX = 150;
      const screenY = 450;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform (same as applyCameraTransform)
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1,
        `Expected screen X ${screenX}, got ${transformedX.toFixed(2)}`);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1,
        `Expected screen Y ${screenY}, got ${transformedY.toFixed(2)}`);
    });
  });

  describe('Tile Coordinate Conversion', function() {
    it('should convert mouse position to correct tile coordinates when zoomed', function() {
      // Camera showing world coords 100-900 (x) and 50-650 (y) at 1.0 zoom
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.0;
      
      // Mouse at center of screen (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Convert to tile coords
      const tileX = Math.floor(worldCoords.worldX / 32);
      const tileY = Math.floor(worldCoords.worldY / 32);
      
      // At zoom 1.0, screen (400, 300) with camera (100, 50) should be world (500, 350)
      // Which is tile (15, 10)
      expect(worldCoords.worldX).to.equal(500);
      expect(worldCoords.worldY).to.equal(350);
      expect(tileX).to.equal(15);
      expect(tileY).to.equal(10);
    });

    it('should convert mouse position to correct tile coordinates when zoomed in 2x', function() {
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 2.0;
      
      // Mouse at center of screen (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Convert to tile coords
      const tileX = Math.floor(worldCoords.worldX / 32);
      const tileY = Math.floor(worldCoords.worldY / 32);
      
      // At zoom 2.0, screen (400, 300) with camera (100, 50) should be world (300, 200)
      // Which is tile (9, 6)
      expect(worldCoords.worldX).to.equal(300);
      expect(worldCoords.worldY).to.equal(200);
      expect(tileX).to.equal(9);
      expect(tileY).to.equal(6);
    });
  });
});
