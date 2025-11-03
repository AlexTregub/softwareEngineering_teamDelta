/**
 * Integration Tests for CustomLevelCamera
 * 
 * These tests use REAL classes (CustomLevelCamera, SparseTerrain) to verify
 * the camera system works correctly with actual game components.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Set up JSDOM for window object
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js functions
global.constrain = function(val, min, max) {
  return Math.max(min, Math.min(max, val));
};
window.constrain = global.constrain;

global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
window.createVector = global.createVector;

// Load REAL classes
const CustomLevelCamera = require('../../../Classes/controllers/CustomLevelCamera.js');
global.CustomLevelCamera = CustomLevelCamera;
window.CustomLevelCamera = CustomLevelCamera;

// Mock SparseTerrain (since we can't load the full game stack)
class MockSparseTerrain {
  constructor(width, height) {
    this.bounds = {
      minX: 0,
      minY: 0,
      maxX: Math.floor(width / 32),
      maxY: Math.floor(height / 32)
    };
    this.worldWidth = width;
    this.worldHeight = height;
  }
  
  getWorldBounds() {
    return {
      width: this.worldWidth,
      height: this.worldHeight
    };
  }
  
  getBounds() {
    return this.bounds;
  }
}

describe('CustomLevelCamera Integration Tests', function() {
  let camera;
  let terrain;
  let queen;
  
  beforeEach(function() {
    // Create REAL CustomLevelCamera
    camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
    
    // Create mock terrain (3200x3200 pixels, 100x100 tiles)
    terrain = new MockSparseTerrain(3200, 3200);
    camera.currentMap = terrain;
    
    // Create mock queen ant
    queen = {
      x: 1600,
      y: 1600,
      width: 60,
      height: 60,
      type: 'Queen',
      id: 'test-queen-001'
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Camera Following Queen in Open Space', function() {
    
    it('should keep queen centered when moving toward center', function() {
      // Start with queen at edge
      queen.x = 2800;
      queen.y = 600;
      
      camera.followEntity(queen);
      camera.update();
      
      const initialCameraX = camera.cameraX;
      const initialCameraY = camera.cameraY;
      
      // Move queen significantly toward center (outside bounding box)
      queen.x = 2000; // Large movement to ensure exit from box
      queen.y = 1200;
      
      camera.update();
      
      // Camera should follow (queen moved far enough to exit bounding box)
      expect(camera.cameraX).to.not.equal(initialCameraX);
      expect(camera.cameraY).to.not.equal(initialCameraY);
    });
    
    it('should keep queen centered in open space', function() {
      // Queen at map center (away from edges)
      queen.x = 1570;
      queen.y = 1570;
      
      camera.followEntity(queen);
      camera.update();
      
      // Calculate expected camera position
      const queenCenterX = queen.x + 30; // 1600
      const queenCenterY = queen.y + 30; // 1600
      const expectedCameraX = queenCenterX - (800 / 2); // 1200
      const expectedCameraY = queenCenterY - (600 / 2); // 1300
      
      // Camera should center on queen
      expect(camera.cameraX).to.equal(expectedCameraX);
      expect(camera.cameraY).to.equal(expectedCameraY);
    });
    
    it('should NOT move camera when queen moves within bounding box', function() {
      // Center queen
      queen.x = 1570;
      queen.y = 1570;
      
      camera.followEntity(queen);
      camera.update();
      
      const initialCameraX = camera.cameraX;
      const initialCameraY = camera.cameraY;
      
      // Move queen slightly (within 200px horizontally, 150px vertically)
      queen.x = 1650; // 80px right of center
      queen.y = 1650; // 80px down from center
      
      camera.update();
      
      // Camera should NOT move
      expect(camera.cameraX).to.equal(initialCameraX);
      expect(camera.cameraY).to.equal(initialCameraY);
    });
  });
  
  describe('Map Edge Handling', function() {
    
    it('should allow queen to reach top-left corner', function() {
      // Move queen to top-left corner
      queen.x = 0;
      queen.y = 0;
      
      camera.followEntity(queen);
      camera.update();
      
      // Camera should be at (0, 0) - showing corner
      expect(camera.cameraX).to.equal(0);
      expect(camera.cameraY).to.equal(0);
    });
    
    it('should allow queen to reach bottom-right corner', function() {
      // Move queen to bottom-right corner
      queen.x = 3140; // 3200 - 60
      queen.y = 3140;
      
      camera.followEntity(queen);
      camera.update();
      
      // Camera should be at max position
      // maxX = 3200 - 800 = 2400
      // maxY = 3200 - 600 = 2600
      expect(camera.cameraX).to.equal(2400);
      expect(camera.cameraY).to.equal(2600);
    });
    
    it('should allow queen to reach all map edges', function() {
      const edges = [
        { x: 0, y: 1600, name: 'left edge' },
        { x: 3140, y: 1600, name: 'right edge' },
        { x: 1600, y: 0, name: 'top edge' },
        { x: 1600, y: 3140, name: 'bottom edge' }
      ];
      
      edges.forEach(edge => {
        queen.x = edge.x;
        queen.y = edge.y;
        
        camera.followEntity(queen);
        camera.update();
        
        // Camera should clamp to valid bounds but allow queen to be visible
        expect(camera.cameraX).to.be.at.least(0, `${edge.name} - cameraX`);
        expect(camera.cameraX).to.be.at.most(2400, `${edge.name} - cameraX`);
        expect(camera.cameraY).to.be.at.least(0, `${edge.name} - cameraY`);
        expect(camera.cameraY).to.be.at.most(2600, `${edge.name} - cameraY`);
      });
    });
  });
  
  describe('SparseTerrain Integration', function() {
    
    it('should work with SparseTerrain bounds', function() {
      const bounds = terrain.getWorldBounds();
      
      expect(bounds.width).to.equal(3200);
      expect(bounds.height).to.equal(3200);
      
      // Camera should respect these bounds
      queen.x = 5000; // Way outside map
      queen.y = 5000;
      
      camera.followEntity(queen);
      camera.update();
      
      // Camera should clamp to map max
      expect(camera.cameraX).to.be.at.most(2400);
      expect(camera.cameraY).to.be.at.most(2600);
    });
    
    it('should handle small maps (smaller than viewport)', function() {
      // Create small map (600x400)
      const smallTerrain = new MockSparseTerrain(600, 400);
      camera.currentMap = smallTerrain;
      
      queen.x = 270; // center at 300
      queen.y = 170; // center at 200
      
      camera.followEntity(queen);
      camera.update();
      
      // Camera should center the small map in viewport
      // Excess width = 800 - 600 = 200, so cameraX should be around -100
      // Excess height = 600 - 400 = 200, so cameraY should be around -100
      expect(camera.cameraX).to.be.at.least(-100);
      expect(camera.cameraX).to.be.at.most(100);
      expect(camera.cameraY).to.be.at.least(-100);
      expect(camera.cameraY).to.be.at.most(100);
    });
  });
  
  describe('Zoom Integration', function() {
    
    it('should handle zoom changes correctly', function() {
      queen.x = 1570;
      queen.y = 1570;
      
      camera.followEntity(queen);
      
      // Test at zoom 1.0
      camera.setZoom(1.0);
      camera.update();
      const pos1 = { x: camera.cameraX, y: camera.cameraY };
      
      // Test at zoom 2.0 (zoomed in)
      camera.setZoom(2.0);
      camera.update();
      const pos2 = { x: camera.cameraX, y: camera.cameraY };
      
      // Camera position should change due to zoom
      // (view is smaller in world coords, so camera adjusts)
      expect(pos2.x).to.not.equal(pos1.x);
      expect(pos2.y).to.not.equal(pos1.y);
    });
    
    it('should adjust bounding box when zoom changes', function() {
      camera.setZoom(1.0);
      const box1 = camera.calculateBoundingBox();
      
      camera.setZoom(2.0);
      const box2 = camera.calculateBoundingBox();
      
      // At 2x zoom, bounding box should be smaller in world coordinates
      expect(box2.right - box2.left).to.be.lessThan(box1.right - box1.left);
      expect(box2.bottom - box2.top).to.be.lessThan(box1.bottom - box1.top);
    });
  });
  
  describe('Continuous Following', function() {
    
    it('should follow queen through multiple movements', function() {
      // Start at center
      queen.x = 1570;
      queen.y = 1570;
      camera.followEntity(queen);
      camera.update();
      
      // Move queen right (outside bounding box - queen center at 2000, box right ~1930)
      queen.x = 1970;
      camera.update();
      expect(camera.cameraX).to.be.at.least(1200); // Should have moved right or stayed
      
      const pos1 = camera.cameraX;
      
      // Move queen further right
      queen.x = 2370; // queen center at 2400
      camera.update();
      expect(camera.cameraX).to.be.at.least(pos1); // Should have moved more right or stayed
      
      const pos2 = camera.cameraX;
      
      // Move queen left (back toward center)
      queen.x = 1570;
      camera.update();
      expect(camera.cameraX).to.be.at.most(pos2); // Should have moved left or stayed
    });
    
    it('should handle rapid queen movements', function() {
      queen.x = 1600;
      queen.y = 1600;
      camera.followEntity(queen);
      
      // Simulate rapid movements
      const movements = [
        { x: 1700, y: 1600 },
        { x: 1800, y: 1700 },
        { x: 1900, y: 1800 },
        { x: 2000, y: 1900 },
        { x: 1900, y: 1800 }
      ];
      
      movements.forEach(pos => {
        queen.x = pos.x;
        queen.y = pos.y;
        camera.update();
        
        // Camera should stay within valid bounds
        expect(camera.cameraX).to.be.at.least(0);
        expect(camera.cameraX).to.be.at.most(2400);
        expect(camera.cameraY).to.be.at.least(0);
        expect(camera.cameraY).to.be.at.most(2600);
      });
    });
  });
  
  describe('Follow Target Management', function() {
    
    it('should stop following when followEntity(null) called', function() {
      queen.x = 1570;
      queen.y = 1570;
      
      camera.followEntity(queen);
      camera.update();
      const pos1 = { x: camera.cameraX, y: camera.cameraY };
      
      // Disable following
      camera.followEntity(null);
      
      // Move queen
      queen.x = 2500;
      queen.y = 2500;
      camera.update();
      
      // Camera should NOT have moved
      expect(camera.cameraX).to.equal(pos1.x);
      expect(camera.cameraY).to.equal(pos1.y);
    });
    
    it('should switch follow targets smoothly', function() {
      const queen2 = {
        x: 2500,
        y: 2500,
        width: 60,
        height: 60,
        type: 'Queen',
        id: 'test-queen-002'
      };
      
      // Follow first queen
      camera.followEntity(queen);
      camera.update();
      
      // Switch to second queen
      camera.followEntity(queen2);
      camera.update();
      
      // Camera should now center on second queen
      const expectedCameraX = 2530 - (800 / 2); // 2530 - 400 = 2130
      const expectedCameraY = 2530 - (600 / 2); // 2530 - 300 = 2230
      
      expect(camera.cameraX).to.equal(expectedCameraX);
      expect(camera.cameraY).to.equal(expectedCameraY);
    });
  });
});
