/**
 * Integration Test: CameraManager with CustomLevelCamera
 * 
 * Tests that CameraManager properly delegates to CustomLevelCamera
 * and doesn't interfere with zoom settings.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('CameraManager - CustomLevelCamera Integration', function() {
  let CameraManager, CustomLevelCamera, GameState;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock global constrain function
    global.constrain = (value, min, max) => Math.max(min, Math.min(max, value));
    
    // Load modules
    CustomLevelCamera = require('../../../Classes/controllers/CustomLevelCamera.js');
    CameraManager = require('../../../Classes/controllers/CameraManager.js');
    GameState = require('../../../Classes/utils/GameState.js');
    
    global.CustomLevelCamera = CustomLevelCamera;
    global.CameraManager = CameraManager;
    global.GameState = GameState;
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.constrain;
    delete global.CustomLevelCamera;
    delete global.CameraManager;
    delete global.GameState;
  });
  
  describe('Camera Switching to IN_GAME State', function() {
    it('should switch to CustomLevelCamera when entering IN_GAME state', function() {
      const manager = new CameraManager(800, 600);
      
      // Simulate state change to IN_GAME
      manager.onStateChange('MENU', 'IN_GAME');
      
      expect(manager.activeCamera).to.be.instanceOf(CustomLevelCamera);
    });
    
    it('should preserve CustomLevelCamera zoom after switch', function() {
      const manager = new CameraManager(800, 600);
      
      // Switch to IN_GAME
      manager.onStateChange('MENU', 'IN_GAME');
      
      // Check that CustomLevelCamera has initial zoom of 2.0x
      expect(manager.activeCamera.cameraZoom).to.equal(2.0);
    });
  });
  
  describe('followEntity() with CustomLevelCamera', function() {
    it('should maintain zoom when following entity', function() {
      const manager = new CameraManager(800, 600);
      manager.onStateChange('MENU', 'IN_GAME');
      
      const entity = { 
        x: 2848, 
        y: 608,
        id: 'test-queen'
      };
      
      const initialZoom = manager.activeCamera.cameraZoom;
      expect(initialZoom).to.equal(2.0);
      
      // Follow entity
      manager.followEntity(entity);
      
      // Zoom should remain unchanged
      expect(manager.activeCamera.cameraZoom).to.equal(2.0);
      expect(manager.activeCamera.cameraZoom).to.equal(initialZoom);
    });
  });
  
  describe('centerOn() with CustomLevelCamera', function() {
    it('should maintain zoom when centering', function() {
      const manager = new CameraManager(800, 600);
      manager.onStateChange('MENU', 'IN_GAME');
      
      const initialZoom = manager.activeCamera.cameraZoom;
      expect(initialZoom).to.equal(2.0);
      
      // Center on position
      manager.centerOn(2848, 608);
      
      // Zoom should remain unchanged
      expect(manager.activeCamera.cameraZoom).to.equal(2.0);
      expect(manager.activeCamera.cameraZoom).to.equal(initialZoom);
    });
  });
  
  describe('Zoom Delegation', function() {
    it('should delegate getCameraPosition to active camera', function() {
      const manager = new CameraManager(800, 600);
      manager.onStateChange('MENU', 'IN_GAME');
      
      const camPos = manager.getCameraPosition();
      
      expect(camPos).to.have.property('zoom');
      expect(camPos.zoom).to.equal(2.0);
    });
  });
});
