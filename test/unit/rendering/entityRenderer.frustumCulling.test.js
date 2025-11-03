/**
 * Unit Test: EntityRenderer Frustum Culling with Camera Transform
 * 
 * TDD: Write test FIRST to expose the frustum culling bug
 * 
 * BUG: isEntityInViewport() checks world coordinates against screen dimensions
 * without accounting for camera translation. Entities at (2848, 608) world coords
 * are outside the 800x600 screen bounds, so they're culled even though they
 * should be visible after camera transform.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js globals
global.g_canvasX = 800;
global.g_canvasY = 600;

// Mock EntityAccessor
global.EntityAccessor = {
  getPosition: (entity) => entity.position || { x: entity.x, y: entity.y },
  getSizeWH: (entity) => ({ width: entity.width || 32, height: entity.height || 32 })
};

// Load EntityRenderer
const EntityRenderer = require('../../../Classes/rendering/EntityLayerRenderer.js');

describe('EntityRenderer - Frustum Culling with Camera', function() {
  let renderer;
  
  beforeEach(function() {
    renderer = new EntityRenderer();
    renderer.config.enableFrustumCulling = true;
    renderer.config.cullMargin = 50;
  });
  
  describe('Bug: isEntityInViewport() ignores camera transform', function() {
    
    it('should FAIL to render entity at world (2848, 608) without camera transform', function() {
      // Entity at world coordinates (2848, 608) - outside screen (800x600)
      const entity = {
        x: 2848,
        y: 608,
        position: { x: 2848, y: 2848 },
        width: 32,
        height: 32
      };
      
      // Without camera transform, entity is outside viewport
      const shouldRender = renderer.isEntityInViewport(entity);
      
      // This test documents the BUG - entity should NOT be visible
      // because frustum culling uses world coords directly
      expect(shouldRender).to.be.false;
    });
    
    it('should render entity when camera is centered on it (FIXED)', function() {
      // Mock camera manager with camera centered on entity
      global.cameraManager = {
        cameraX: 2848 - 400, // Center entity horizontally (800px width / 2)
        cameraY: 608 - 300,  // Center entity vertically (600px height / 2)
        cameraZoom: 1.0,
        worldToScreen: function(worldX, worldY) {
          return {
            screenX: (worldX - this.cameraX) * this.cameraZoom,
            screenY: (worldY - this.cameraY) * this.cameraZoom
          };
        }
      };
      
      const entity = {
        x: 2848,
        y: 608,
        position: { x: 2848, y: 608 },
        width: 32,
        height: 32
      };
      
      // WITH proper camera transform, entity should be at screen center (400, 300)
      const screenPos = cameraManager.worldToScreen(entity.x, entity.y);
      
      // Entity SHOULD be visible after transform
      expect(screenPos.screenX).to.be.closeTo(400, 10);
      expect(screenPos.screenY).to.be.closeTo(300, 10);
      
      // After fix, isEntityInViewport() now uses worldToScreen()
      const shouldRender = renderer.isEntityInViewport(entity);
      
      // FIXED: Now returns true (entity in viewport after camera transform)
      expect(shouldRender).to.be.true;
    });
  });
  
  describe('Fix: isEntityInViewport() should use camera.worldToScreen()', function() {
    
    it('should convert world coords to screen coords before viewport check', function() {
      // This test defines the CORRECT behavior we want
      
      global.cameraManager = {
        cameraX: 2448, // Camera at (2448, 308) to center entity at (2848, 608)
        cameraY: 308,
        cameraZoom: 1.0,
        worldToScreen: function(worldX, worldY) {
          return {
            screenX: (worldX - this.cameraX) * this.cameraZoom,
            screenY: (worldY - this.cameraY) * this.cameraZoom
          };
        }
      };
      
      const entity = {
        x: 2848,
        y: 608,
        position: { x: 2848, y: 608 },
        width: 32,
        height: 32
      };
      
      // After fix, isEntityInViewport should:
      // 1. Call cameraManager.worldToScreen(entity.x, entity.y)
      // 2. Check if screenX, screenY is within (0, 0) to (800, 600)
      const shouldRender = renderer.isEntityInViewport(entity);
      
      // With camera transform, entity at world (2848, 608) becomes screen (400, 300)
      // which IS within viewport (0, 0) to (800, 600)
      expect(shouldRender).to.be.true;
    });
    
    it('should handle entities outside viewport after transform', function() {
      global.cameraManager = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1.0,
        worldToScreen: function(worldX, worldY) {
          return {
            screenX: (worldX - this.cameraX) * this.cameraZoom,
            screenY: (worldY - this.cameraY) * this.cameraZoom
          };
        }
      };
      
      // Entity far outside viewport
      const entity = {
        x: 10000,
        y: 10000,
        position: { x: 10000, y: 10000 },
        width: 32,
        height: 32
      };
      
      const shouldRender = renderer.isEntityInViewport(entity);
      
      // Entity at screen (10000, 10000) is outside viewport (800, 600)
      expect(shouldRender).to.be.false;
    });
  });
});
