/**
 * Integration Tests: Level Editor Zoom Focus Point Bug
 * 
 * Tests to verify zoom focuses on mouse pointer correctly.
 * Bug: Zoom in Level Editor doesn't focus on mouse cursor (PLAYING state works fine)
 * 
 * TDD Approach:
 * 1. Create diagnostic test to understand the issue
 * 2. Compare PLAYING state (working) vs LEVEL_EDITOR state (broken)
 * 3. Identify the difference
 * 4. Fix and verify
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globals BEFORE requiring CameraManager
global.g_canvasX = 800;
global.g_canvasY = 600;
global.TILE_SIZE = 32;
global.mouseX = 400;
global.mouseY = 300;
global.windowWidth = 800;
global.windowHeight = 600;
global.constrain = (val, min, max) => Math.max(min, Math.min(max, val));
global.logVerbose = () => {};
global.verboseLog = () => {};
global.window = global; // CRITICAL: Makes window.CameraManager accessible as global.CameraManager
global.console = { log: () => {} };

// Mock GameState
global.GameState = {
  getState: () => 'LEVEL_EDITOR'
};

// Mock CameraController
global.CameraController = {
  getCameraPosition: () => ({ x: global.cameraX || 0, y: global.cameraY || 0 }),
  setCameraPosition: (x, y) => { global.cameraX = x; global.cameraY = y; }
};

// Mock map bounds (large enough to not constrain camera)
global.g_activeMap = {
  _xCount: 100,  // 100 tiles * 32 = 3200px
  _yCount: 100   // 100 tiles * 32 = 3200px
};

// Load CameraManager (exports to window.CameraManager, accessible via global.CameraManager)
require('../../../Classes/controllers/CameraManager');
const CameraManager = global.CameraManager;

describe('Level Editor - Zoom Focus Point Integration', function() {
  let cameraManager;

  beforeEach(function() {
    global.cameraX = 0;
    global.cameraY = 0;
    global.mouseX = 400;
    global.mouseY = 300;
    
    cameraManager = new CameraManager();
    cameraManager.initialize();
  });

  afterEach(function() {
    // Clean up
    global.cameraX = 0;
    global.cameraY = 0;
  });

  describe('Zoom Focus Point Calculation', function() {
    it('should focus zoom on mouse position', function() {
      // Set up initial state
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse at center of screen
      global.mouseX = 400;
      global.mouseY = 300;

      const initialWorldAtMouse = cameraManager.screenToWorld(400, 300);
      console.log('Initial world at mouse:', initialWorldAtMouse);
      console.log('Initial camera:', cameraManager.cameraX, cameraManager.cameraY, cameraManager.cameraZoom);
      
      // Zoom in 2x
      cameraManager.setZoom(2.0, 400, 300);

      console.log('After zoom camera:', cameraManager.cameraX, cameraManager.cameraY, cameraManager.cameraZoom);
      
      // After zoom, the same world point should still be under the mouse
      const finalWorldAtMouse = cameraManager.screenToWorld(400, 300);
      console.log('Final world at mouse:', finalWorldAtMouse);
      console.log('Diff:', finalWorldAtMouse.worldX - initialWorldAtMouse.worldX, finalWorldAtMouse.worldY - initialWorldAtMouse.worldY);

      // The world coordinates under the mouse should be approximately the same
      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1,
        'World X coordinate under mouse should remain constant when zooming');
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1,
        'World Y coordinate under mouse should remain constant when zooming');
    });

    it('should work with mouse at top-left quadrant', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse in top-left quadrant
      global.mouseX = 200;
      global.mouseY = 150;

      const initialWorldAtMouse = cameraManager.screenToWorld(200, 150);
      
      cameraManager.setZoom(1.5, 200, 150);

      const finalWorldAtMouse = cameraManager.screenToWorld(200, 150);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });

    it('should work with mouse at bottom-right quadrant', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse in bottom-right quadrant
      global.mouseX = 600;
      global.mouseY = 450;

      const initialWorldAtMouse = cameraManager.screenToWorld(600, 450);
      
      cameraManager.setZoom(0.8, 600, 450);

      const finalWorldAtMouse = cameraManager.screenToWorld(600, 450);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });

    it('should handle zoom in sequence maintaining focus', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      global.mouseX = 300;
      global.mouseY = 200;

      const initialWorldAtMouse = cameraManager.screenToWorld(300, 200);
      
      // Zoom in multiple times
      cameraManager.setZoom(1.2, 300, 200);
      cameraManager.setZoom(1.5, 300, 200);
      cameraManager.setZoom(2.0, 300, 200);

      const finalWorldAtMouse = cameraManager.screenToWorld(300, 200);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });
  });

  describe('Transform Pipeline Consistency', function() {
    it('should use same transform pipeline as applyCameraTransform', function() {
      // This test verifies that screenToWorld is the inverse of the transform applied
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.5;

      // Pick a screen point
      const screenX = 400;
      const screenY = 300;

      // Convert to world
      const world = cameraManager.screenToWorld(screenX, screenY);

      // Manually apply the transform (simulating applyCameraTransform in Level Editor)
      // Transform pipeline:
      // 1. translate(canvasCenter)
      // 2. scale(zoom)
      // 3. translate(-canvasCenter)
      // 4. translate(-cameraX, -cameraY)
      
      // Inverse:
      // 1. Add cameraX, cameraY
      // 2. translate(canvasCenter)
      // 3. divide by zoom
      // 4. translate(-canvasCenter)
      
      const canvasCenterX = global.g_canvasX / 2;
      const canvasCenterY = global.g_canvasY / 2;
      
      // Apply inverse transform manually
      let wx = screenX;
      let wy = screenY;
      
      // Inverse of translate(-cameraX, -cameraY)
      wx += cameraManager.cameraX;
      wy += cameraManager.cameraY;
      
      // Inverse of translate(-canvasCenter)
      wx += canvasCenterX;
      wy += canvasCenterY;
      
      // Inverse of scale(zoom)
      wx /= cameraManager.cameraZoom;
      wy /= cameraManager.cameraZoom;
      
      // Inverse of translate(canvasCenter)
      wx -= canvasCenterX;
      wy -= canvasCenterY;

      // Compare with screenToWorld result
      expect(Math.abs(world.worldX - wx)).to.be.lessThan(0.1,
        'Manual transform should match screenToWorld X');
      expect(Math.abs(world.worldY - wy)).to.be.lessThan(0.1,
        'Manual transform should match screenToWorld Y');
    });
  });

  describe('Diagnostic: Current Behavior', function() {
    it('should log zoom behavior for debugging', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      global.mouseX = 400;
      global.mouseY = 300;

      console.log('\n=== ZOOM DIAGNOSTIC ===');
      console.log('Initial state:');
      console.log('  cameraX:', cameraManager.cameraX);
      console.log('  cameraY:', cameraManager.cameraY);
      console.log('  cameraZoom:', cameraManager.cameraZoom);
      console.log('  mouseX:', global.mouseX);
      console.log('  mouseY:', global.mouseY);

      const beforeWorld = cameraManager.screenToWorld(global.mouseX, global.mouseY);
      console.log('World at mouse before zoom:', beforeWorld);

      // Zoom in 2x
      cameraManager.setZoom(2.0, global.mouseX, global.mouseY);

      console.log('\nAfter zoom to 2.0x:');
      console.log('  cameraX:', cameraManager.cameraX);
      console.log('  cameraY:', cameraManager.cameraY);
      console.log('  cameraZoom:', cameraManager.cameraZoom);

      const afterWorld = cameraManager.screenToWorld(global.mouseX, global.mouseY);
      console.log('World at mouse after zoom:', afterWorld);

      console.log('\nDifference:');
      console.log('  Delta X:', afterWorld.x - beforeWorld.x);
      console.log('  Delta Y:', afterWorld.y - beforeWorld.y);
      console.log('======================\n');

      // This test just logs, no assertion
      expect(true).to.be.true;
    });
  });
});
