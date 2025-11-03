/**
 * Unit Tests for CustomLevelCamera
 * 
 * TDD Red Phase: These tests are written FIRST and will fail until implementation is complete.
 * 
 * CustomLevelCamera implements a "bounded follow" system where the camera only moves
 * when the followed entity (queen) exits a configurable bounding box centered in the viewport.
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

// Mock createVector for compatibility
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
window.createVector = global.createVector;

// Load CustomLevelCamera class
const CustomLevelCamera = require('../../../Classes/controllers/CustomLevelCamera.js');
global.CustomLevelCamera = CustomLevelCamera;
window.CustomLevelCamera = CustomLevelCamera;

describe('CustomLevelCamera', function() {
  let camera;
  let mockEntity;
  let mockMap;
  
  beforeEach(function() {
    
    // Create mock entity (queen)
    mockEntity = {
      x: 1600,
      y: 1600,
      width: 60,
      height: 60,
      type: 'Queen',
      id: 'test-queen-001'
    };
    
    // Create mock map (3200x3200 pixels, 100x100 tiles)
    mockMap = {
      tileSize: 32,
      getWorldBounds: sinon.stub().returns({ width: 3200, height: 3200 }),
      getBounds: sinon.stub().returns({ minX: 0, minY: 0, maxX: 100, maxY: 100 })
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor & Initialization', function() {
    
    it('should initialize with default canvas dimensions', function() {
      camera = new CustomLevelCamera(800, 600);
      
      expect(camera.canvasWidth).to.equal(800);
      expect(camera.canvasHeight).to.equal(600);
    });
    
    it('should initialize with default bounding box margins (25%)', function() {
      camera = new CustomLevelCamera(800, 600);
      
      expect(camera.boundingBoxMarginX).to.equal(0.25);
      expect(camera.boundingBoxMarginY).to.equal(0.25);
    });
    
    it('should initialize camera at origin (0, 0)', function() {
      camera = new CustomLevelCamera(800, 600);
      
      expect(camera.cameraX).to.equal(0);
      expect(camera.cameraY).to.equal(0);
    });
    
    it('should initialize with default zoom level (1.0)', function() {
      camera = new CustomLevelCamera(800, 600);
      
      expect(camera.cameraZoom).to.equal(1.0);
    });
    
    it('should initialize with no follow target', function() {
      camera = new CustomLevelCamera(800, 600);
      
      expect(camera.followTarget).to.be.null;
      expect(camera.followEnabled).to.be.false;
    });
    
    it('should accept custom bounding box margins', function() {
      camera = new CustomLevelCamera(800, 600, 0.3, 0.2);
      
      expect(camera.boundingBoxMarginX).to.equal(0.3);
      expect(camera.boundingBoxMarginY).to.equal(0.2);
    });
  });
  
  describe('Bounding Box Calculation', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
        camera.cameraX = 1000;
        camera.cameraY = 1000;
        camera.cameraZoom = 1.0;
      }
    });
    
    it('should calculate bounding box with correct dimensions', function() {
      const box = camera.calculateBoundingBox();
      
      // View dimensions: 800x600
      // Camera at (1000, 1000)
      // Camera center at (1400, 1300)
      // Margins: 25% = 200px horizontal, 150px vertical
      expect(box.left).to.equal(1200);   // 1400 - 200
      expect(box.right).to.equal(1600);  // 1400 + 200
      expect(box.top).to.equal(1150);    // 1300 - 150
      expect(box.bottom).to.equal(1450); // 1300 + 150
    });
    
    it('should recalculate bounding box when zoom changes', function() {
      camera.cameraZoom = 2.0; // Zoomed in (view is smaller in world coords)
      
      const box = camera.calculateBoundingBox();
      
      // View dimensions at 2x zoom: 400x300 (in world coordinates)
      // Camera center at (1200, 1150)
      // Margins: 25% = 100px horizontal, 75px vertical
      expect(box.left).to.equal(1100);   // 1200 - 100
      expect(box.right).to.equal(1300);  // 1200 + 100
      expect(box.top).to.equal(1075);    // 1150 - 75
      expect(box.bottom).to.equal(1225); // 1150 + 75
    });
    
    it('should handle asymmetric margins correctly', function() {
      camera = new CustomLevelCamera(800, 600, 0.3, 0.1);
      camera.cameraX = 1000;
      camera.cameraY = 1000;
      
      const box = camera.calculateBoundingBox();
      
      // Horizontal margin: 30% = 240px
      // Vertical margin: 10% = 60px
      expect(box.left).to.equal(1160);   // 1400 - 240
      expect(box.right).to.equal(1640);  // 1400 + 240
      expect(box.top).to.equal(1240);    // 1300 - 60
      expect(box.bottom).to.equal(1360); // 1300 + 60
    });
  });
  
  describe('Entity Center Calculation', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600);
      }
    });
    
    it('should calculate entity world center correctly', function() {
      const center = camera.getEntityWorldCenter(mockEntity);
      
      expect(center.x).to.equal(1630); // 1600 + 60/2
      expect(center.y).to.equal(1630); // 1600 + 60/2
    });
    
    it('should handle entity without width/height (default to 60)', function() {
      const entity = { x: 100, y: 200 };
      const center = camera.getEntityWorldCenter(entity);
      
      expect(center.x).to.equal(130); // 100 + 60/2
      expect(center.y).to.equal(230); // 200 + 60/2
    });
    
    it('should return null for entity without x/y coordinates', function() {
      const invalidEntity = { width: 60, height: 60 };
      const center = camera.getEntityWorldCenter(invalidEntity);
      
      expect(center).to.be.null;
    });
  });
  
  describe('Bounded Follow - Camera Within Bounds', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
        camera.cameraX = 1330; // Centered on entity at (1630, 1630)
        camera.cameraY = 1330;
        camera.followTarget = mockEntity;
        camera.followEnabled = true;
        camera.currentMap = mockMap;
      }
    });
    
    it('should NOT move camera when entity is centered in bounding box', function() {
      const initialX = camera.cameraX;
      const initialY = camera.cameraY;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.equal(initialX);
      expect(camera.cameraY).to.equal(initialY);
    });
    
    it('should NOT move camera when entity moves slightly within box', function() {
      // Move entity within bounding box (small movement)
      mockEntity.x = 1650;
      mockEntity.y = 1650;
      
      const initialX = camera.cameraX;
      const initialY = camera.cameraY;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.equal(initialX);
      expect(camera.cameraY).to.equal(initialY);
    });
  });
  
  describe('Bounded Follow - Camera Adjustment Required', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
        camera.cameraX = 1330; // Centered on entity at (1630, 1630)
        camera.cameraY = 1330;
        camera.followTarget = mockEntity;
        camera.followEnabled = true;
        camera.currentMap = mockMap;
      }
    });
    
    it('should move camera RIGHT when entity exits right edge of box', function() {
      // Bounding box right edge at 1930 (1730 + 200)
      // Move entity to 1950 (center), which exits box
      mockEntity.x = 1920; // center at 1950
      
      const initialX = camera.cameraX;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.be.greaterThan(initialX);
    });
    
    it('should move camera LEFT when entity exits left edge of box', function() {
      // Bounding box left edge at 1530 (1730 - 200)
      // Move entity to 1500 (center), which exits box
      mockEntity.x = 1470; // center at 1500
      
      const initialX = camera.cameraX;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.be.lessThan(initialX);
    });
    
    it('should move camera DOWN when entity exits bottom edge of box', function() {
      // Bounding box bottom edge at 1780 (1630 + 150)
      // Move entity to 1850 (center), which exits box
      mockEntity.y = 1820; // center at 1850
      
      const initialY = camera.cameraY;
      
      camera.updateBounded();
      
      expect(camera.cameraY).to.be.greaterThan(initialY);
    });
    
    it('should move camera UP when entity exits top edge of box', function() {
      // Bounding box top edge at 1480 (1630 - 150)
      // Move entity to 1400 (center), which exits box
      mockEntity.y = 1370; // center at 1400
      
      const initialY = camera.cameraY;
      
      camera.updateBounded();
      
      expect(camera.cameraY).to.be.lessThan(initialY);
    });
    
    it('should handle diagonal movement correctly', function() {
      // Move entity diagonally outside box
      mockEntity.x = 1920; // right
      mockEntity.y = 1820; // down
      
      const initialX = camera.cameraX;
      const initialY = camera.cameraY;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.be.greaterThan(initialX);
      expect(camera.cameraY).to.be.greaterThan(initialY);
    });
  });
  
  describe('Map Bounds Soft Clamping', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
        camera.followTarget = mockEntity;
        camera.followEnabled = true;
        camera.currentMap = mockMap;
      }
    });
    
    it('should allow entity to reach top-left corner of map', function() {
      // Move entity to top-left corner
      mockEntity.x = 0;
      mockEntity.y = 0;
      
      camera.updateBounded();
      
      // Camera should be at (0, 0) to show corner
      expect(camera.cameraX).to.equal(0);
      expect(camera.cameraY).to.equal(0);
    });
    
    it('should allow entity to reach bottom-right corner of map', function() {
      // Move entity to bottom-right corner
      mockEntity.x = 3140; // 3200 - 60
      mockEntity.y = 3140;
      
      camera.updateBounded();
      
      // Camera should be at max position
      // maxX = 3200 - 800 = 2400
      // maxY = 3200 - 600 = 2600
      expect(camera.cameraX).to.equal(2400);
      expect(camera.cameraY).to.equal(2600);
    });
    
    it('should clamp camera to map bounds when following', function() {
      // Try to move camera beyond map bounds
      mockEntity.x = 5000; // Way outside map
      mockEntity.y = 5000;
      
      camera.updateBounded();
      
      // Camera should be clamped to max position
      expect(camera.cameraX).to.be.at.most(2400);
      expect(camera.cameraY).to.be.at.most(2600);
    });
    
    it('should handle small maps (smaller than viewport) by centering', function() {
      // Small map: 600x400 (smaller than 800x600 viewport)
      mockMap.getWorldBounds.returns({ width: 600, height: 400 });
      
      // Move entity to center of small map
      mockEntity.x = 270; // center at 300
      mockEntity.y = 170; // center at 200
      
      camera.updateBounded();
      
      // Camera should center the small map in viewport
      // Excess width = 800 - 600 = 200, so minX = -100, maxX = 100
      // Excess height = 600 - 400 = 200, so minY = -100, maxY = 100
      expect(camera.cameraX).to.be.at.least(-100);
      expect(camera.cameraX).to.be.at.most(100);
      expect(camera.cameraY).to.be.at.least(-100);
      expect(camera.cameraY).to.be.at.most(100);
    });
  });
  
  describe('Follow Target Management', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600);
        camera.currentMap = mockMap;
      }
    });
    
    it('should enable following when followEntity() is called', function() {
      const result = camera.followEntity(mockEntity);
      
      expect(result).to.be.true;
      expect(camera.followEnabled).to.be.true;
      expect(camera.followTarget).to.equal(mockEntity);
    });
    
    it('should disable following when followEntity(null) is called', function() {
      camera.followEntity(mockEntity);
      expect(camera.followEnabled).to.be.true;
      
      const result = camera.followEntity(null);
      
      expect(result).to.be.false;
      expect(camera.followEnabled).to.be.false;
      expect(camera.followTarget).to.be.null;
    });
    
    it('should NOT update camera when following is disabled', function() {
      camera.followEnabled = false;
      camera.followTarget = mockEntity;
      camera.cameraX = 1000;
      camera.cameraY = 1000;
      
      const initialX = camera.cameraX;
      const initialY = camera.cameraY;
      
      // Move entity far away
      mockEntity.x = 3000;
      mockEntity.y = 3000;
      
      camera.updateBounded();
      
      expect(camera.cameraX).to.equal(initialX);
      expect(camera.cameraY).to.equal(initialY);
    });
  });
  
  describe('Zoom Integration', function() {
    
    beforeEach(function() {
      if (typeof CustomLevelCamera !== 'undefined') {
        camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
        camera.followTarget = mockEntity;
        camera.followEnabled = true;
        camera.currentMap = mockMap;
      }
    });
    
    it('should adjust bounding box when zoom changes', function() {
      camera.cameraZoom = 1.0;
      const box1 = camera.calculateBoundingBox();
      
      camera.cameraZoom = 2.0;
      const box2 = camera.calculateBoundingBox();
      
      // At 2x zoom, bounding box should be smaller in world coordinates
      expect(box2.right - box2.left).to.be.lessThan(box1.right - box1.left);
      expect(box2.bottom - box2.top).to.be.lessThan(box1.bottom - box1.top);
    });
    
    it('should setZoom and update zoom level', function() {
      camera.setZoom(2.5);
      
      expect(camera.cameraZoom).to.equal(2.5);
    });
  });
  
  describe('Configuration', function() {
    
    it('should allow changing bounding box margins', function() {
      camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
      
      camera.setMargins(0.3, 0.2);
      
      expect(camera.boundingBoxMarginX).to.equal(0.3);
      expect(camera.boundingBoxMarginY).to.equal(0.2);
    });
    
    it('should recalculate bounding box after margin change', function() {
      camera = new CustomLevelCamera(800, 600, 0.25, 0.25);
      camera.cameraX = 1000;
      camera.cameraY = 1000;
      
      const box1 = camera.calculateBoundingBox();
      
      camera.setMargins(0.1, 0.1); // Smaller margins = smaller box
      const box2 = camera.calculateBoundingBox();
      
      expect(box2.right - box2.left).to.be.lessThan(box1.right - box1.left);
      expect(box2.bottom - box2.top).to.be.lessThan(box1.bottom - box1.top);
    });
  });
});
