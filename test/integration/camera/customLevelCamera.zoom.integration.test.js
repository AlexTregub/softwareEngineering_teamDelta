/**
 * Integration Test: CustomLevelCamera Zoom Initialization
 * 
 * Tests that CustomLevelCamera:
 * 1. Initializes with correct zoom level (2.0x)
 * 2. Maintains zoom after centerOn() call
 * 3. Respects minZoom/maxZoom constraints
 */

const { expect } = require('chai');

const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');


setupTestEnvironment({ rendering: true });

describe('CustomLevelCamera - Zoom Initialization', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let dom, window, CustomLevelCamera;
  
  before(function() {
    // Create JSDOM environment
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    
    // Load CustomLevelCamera
    const CustomLevelCameraModule = require('../../../Classes/controllers/CustomLevelCamera.js');
    CustomLevelCamera = CustomLevelCameraModule;
    global.CustomLevelCamera = CustomLevelCamera;
    window.CustomLevelCamera = CustomLevelCamera;
  });
  
  after(function() {
    delete global.window;
    delete global.document;
    delete global.CustomLevelCamera;
  });
  
  describe('Constructor Initialization', function() {
    it('should initialize with zoom at 2.0x', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      expect(camera.cameraZoom).to.equal(2.0);
    });
    
    it('should set minZoom to 1.5x', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      expect(camera.minZoom).to.equal(1.5);
    });
    
    it('should set maxZoom to 4.0x', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      expect(camera.maxZoom).to.equal(4.0);
    });
  });
  
  describe('centerOn() Method', function() {
    it('should maintain zoom level after centering', function() {
      const camera = new CustomLevelCamera(800, 600);
      const initialZoom = camera.cameraZoom;
      
      // Center on a position
      camera.centerOn(1000, 1000);
      
      expect(camera.cameraZoom).to.equal(initialZoom);
      expect(camera.cameraZoom).to.equal(2.0);
    });
    
    it('should calculate correct camera position when centering', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      // Center on Queen at (2848, 608)
      camera.centerOn(2848, 608);
      
      // With 800x600 viewport and 2.0x zoom:
      // viewWidth = 800 / 2.0 = 400
      // viewHeight = 600 / 2.0 = 300
      // cameraX = 2848 - (400 / 2) = 2848 - 200 = 2648
      // cameraY = 608 - (300 / 2) = 608 - 150 = 458
      
      expect(camera.cameraX).to.equal(2648);
      expect(camera.cameraY).to.equal(458);
    });
  });
  
  describe('setZoom() Method', function() {
    it('should clamp zoom to minZoom', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      camera.setZoom(1.0); // Below minZoom
      
      expect(camera.cameraZoom).to.equal(1.5); // Clamped to minZoom
    });
    
    it('should clamp zoom to maxZoom', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      camera.setZoom(5.0); // Above maxZoom
      
      expect(camera.cameraZoom).to.equal(4.0); // Clamped to maxZoom
    });
    
    it('should accept valid zoom values', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      camera.setZoom(3.0);
      
      expect(camera.cameraZoom).to.equal(3.0);
    });
  });
  
  describe('followEntity() Method', function() {
    it('should enable follow mode', function() {
      const camera = new CustomLevelCamera(800, 600);
      const entity = { x: 1000, y: 1000 };
      
      const result = camera.followEntity(entity);
      
      expect(result).to.be.true;
      expect(camera.followEnabled).to.be.true;
      expect(camera.followTarget).to.equal(entity);
    });
    
    it('should center on entity when follow enabled', function() {
      const camera = new CustomLevelCamera(800, 600);
      const entity = { x: 2848, y: 608, width: 32, height: 32 };
      
      camera.followEntity(entity);
      
      // Should center on entity (accounting for entity center offset)
      const expectedX = 2648; // 2848 - (800/2.0)/2
      const expectedY = 458;  // 608 - (600/2.0)/2
      
      // Allow small tolerance due to entity center calculations
      expect(camera.cameraX).to.be.closeTo(expectedX, 20);
      expect(camera.cameraY).to.be.closeTo(expectedY, 20);
    });
    
    it('should NOT change zoom when following entity', function() {
      const camera = new CustomLevelCamera(800, 600);
      const initialZoom = camera.cameraZoom;
      const entity = { x: 1000, y: 1000 };
      
      camera.followEntity(entity);
      
      expect(camera.cameraZoom).to.equal(initialZoom);
      expect(camera.cameraZoom).to.equal(2.0);
    });
  });
  
  describe('Zoom Persistence After Operations', function() {
    it('should maintain 2.0x zoom through multiple operations', function() {
      const camera = new CustomLevelCamera(800, 600);
      
      // Initial zoom check
      expect(camera.cameraZoom).to.equal(2.0);
      
      // After centerOn
      camera.centerOn(1000, 1000);
      expect(camera.cameraZoom).to.equal(2.0);
      
      // After followEntity
      const entity = { x: 2000, y: 2000 };
      camera.followEntity(entity);
      expect(camera.cameraZoom).to.equal(2.0);
      
      // After another centerOn
      camera.centerOn(3000, 3000);
      expect(camera.cameraZoom).to.equal(2.0);
    });
  });
});
