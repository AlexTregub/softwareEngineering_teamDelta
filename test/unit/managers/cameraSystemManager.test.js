/**
 * Unit Tests for CameraSystemManager
 * 
 * TDD Red Phase: These tests are written FIRST and will fail until implementation is complete.
 * 
 * CameraSystemManager switches between CameraManager (procedural levels) and 
 * CustomLevelCamera (custom levels) based on GameState.
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

// Mock CameraManager and CustomLevelCamera constructors
global.CameraManager = sinon.stub();
global.CustomLevelCamera = sinon.stub();
window.CameraManager = global.CameraManager;
window.CustomLevelCamera = global.CustomLevelCamera;

// Load required classes
const CameraSystemManager = require('../../../Classes/managers/CameraSystemManager.js');
global.CameraSystemManager = CameraSystemManager;
window.CameraSystemManager = CameraSystemManager;

describe('CameraSystemManager', function() {
  let systemManager;
  let mockCameraManager;
  let mockCustomLevelCamera;
  let mockCameraController;
  let mockMap;
  
  beforeEach(function() {
    // Reset constructor stubs
    global.CameraManager.reset();
    global.CustomLevelCamera.reset();
    
    // Create mock CameraManager
    mockCameraManager = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1.0,
      cameraFollowTarget: null,
      cameraFollowEnabled: false,
      update: sinon.stub(),
      centerOn: sinon.stub(),
      centerOnEntity: sinon.stub(),
      followEntity: sinon.stub(),
      setZoom: sinon.stub(),
      getCameraPosition: sinon.stub().returns({ x: 0, y: 0, zoom: 1.0 }),
      setCameraPosition: sinon.stub(),
      currentMap: null
    };
    
    // Create mock CustomLevelCamera
    mockCustomLevelCamera = {
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1.0,
      followTarget: null,
      followEnabled: false,
      update: sinon.stub(),
      centerOn: sinon.stub(),
      centerOnEntity: sinon.stub(),
      followEntity: sinon.stub(),
      setZoom: sinon.stub(),
      getCameraPosition: sinon.stub().returns({ x: 0, y: 0, zoom: 1.0 }),
      setCameraPosition: sinon.stub(),
      currentMap: null
    };
    
    // Create mock CameraController
    mockCameraController = {
      getCameraPosition: sinon.stub().returns({ x: 0, y: 0 }),
      setCameraPosition: sinon.stub(),
      cameraZoom: 1.0
    };
    
    // Create mock map
    mockMap = {
      getWorldBounds: sinon.stub().returns({ width: 3200, height: 3200 })
    };
    
    // Make constructors return mock cameras
    global.CameraManager.returns(mockCameraManager);
    global.CustomLevelCamera.returns(mockCustomLevelCamera);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor & Initialization', function() {
    
    it('should initialize with CameraController reference', function() {
      systemManager = new CameraSystemManager(mockCameraController);
      
      expect(systemManager.cameraController).to.equal(mockCameraController);
    });
    
    it('should initialize with both camera systems', function() {
      systemManager = new CameraSystemManager(mockCameraController);
      
      expect(systemManager.proceduralCamera).to.exist;
      expect(systemManager.customLevelCamera).to.exist;
    });
    
    it('should initialize with no active camera', function() {
      systemManager = new CameraSystemManager(mockCameraController);
      
      expect(systemManager.activeCamera).to.be.null;
    });
    
    it('should initialize with canvas dimensions', function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      
      expect(systemManager.canvasWidth).to.equal(800);
      expect(systemManager.canvasHeight).to.equal(600);
    });
  });
  
  describe('Camera Selection', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
    });
    
    it('should switch to procedural camera for PLAYING state', function() {
      systemManager.switchCamera('PLAYING');
      
      expect(systemManager.activeCamera).to.equal(mockCameraManager);
    });
    
    it('should switch to custom level camera for IN_GAME state', function() {
      systemManager.switchCamera('IN_GAME');
      
      expect(systemManager.activeCamera).to.equal(mockCustomLevelCamera);
    });
    
    it('should keep procedural camera for MENU state', function() {
      systemManager.switchCamera('MENU');
      
      expect(systemManager.activeCamera).to.equal(mockCameraManager);
    });
    
    it('should keep current camera for LEVEL_EDITOR state', function() {
      systemManager.activeCamera = mockCameraManager;
      systemManager.switchCamera('LEVEL_EDITOR');
      
      expect(systemManager.activeCamera).to.equal(mockCameraManager);
    });
    
    it('should return the active camera instance', function() {
      const camera = systemManager.switchCamera('IN_GAME');
      
      expect(camera).to.equal(mockCustomLevelCamera);
    });
  });
  
  describe('State Transfer', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
    });
    
    it('should transfer camera position when switching', function() {
      mockCameraManager.cameraX = 1000;
      mockCameraManager.cameraY = 500;
      mockCameraManager.cameraZoom = 2.0;
      systemManager.activeCamera = mockCameraManager;
      
      systemManager.switchCamera('IN_GAME');
      
      expect(mockCustomLevelCamera.setCameraPosition.calledWith(1000, 500)).to.be.true;
      expect(mockCustomLevelCamera.setZoom.calledWith(2.0)).to.be.true;
    });
    
    it('should transfer follow target when switching', function() {
      const mockQueen = { x: 100, y: 200, type: 'Queen' };
      mockCameraManager.cameraFollowTarget = mockQueen;
      mockCameraManager.cameraFollowEnabled = true;
      systemManager.activeCamera = mockCameraManager;
      
      systemManager.switchCamera('IN_GAME');
      
      expect(mockCustomLevelCamera.followEntity.calledWith(mockQueen)).to.be.true;
    });
    
    it('should transfer map reference when switching', function() {
      mockCameraManager.currentMap = mockMap;
      systemManager.activeCamera = mockCameraManager;
      
      systemManager.switchCamera('IN_GAME');
      
      expect(mockCustomLevelCamera.currentMap).to.equal(mockMap);
    });
    
    it('should not transfer state if no previous camera active', function() {
      systemManager.activeCamera = null;
      
      systemManager.switchCamera('IN_GAME');
      
      expect(mockCustomLevelCamera.setCameraPosition.called).to.be.false;
    });
    
    it('should not transfer state if switching to same camera', function() {
      systemManager.activeCamera = mockCameraManager;
      
      systemManager.switchCamera('PLAYING');
      
      expect(mockCameraManager.setCameraPosition.called).to.be.false;
    });
  });
  
  describe('Update Delegation', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
    });
    
    it('should delegate update() to active camera', function() {
      systemManager.switchCamera('PLAYING');
      
      systemManager.update();
      
      expect(mockCameraManager.update.calledOnce).to.be.true;
    });
    
    it('should not call update if no active camera', function() {
      systemManager.activeCamera = null;
      
      expect(() => systemManager.update()).to.not.throw();
    });
    
    it('should call update on correct camera after switch', function() {
      systemManager.switchCamera('PLAYING');
      systemManager.update();
      
      systemManager.switchCamera('IN_GAME');
      systemManager.update();
      
      expect(mockCameraManager.update.calledOnce).to.be.true;
      expect(mockCustomLevelCamera.update.calledOnce).to.be.true;
    });
  });
  
  describe('API Delegation', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
      systemManager.switchCamera('PLAYING');
    });
    
    it('should delegate centerOn() to active camera', function() {
      systemManager.centerOn(100, 200);
      
      expect(mockCameraManager.centerOn.calledWith(100, 200)).to.be.true;
    });
    
    it('should delegate centerOnEntity() to active camera', function() {
      const mockEntity = { x: 100, y: 200 };
      systemManager.centerOnEntity(mockEntity);
      
      expect(mockCameraManager.centerOnEntity.calledWith(mockEntity)).to.be.true;
    });
    
    it('should delegate followEntity() to active camera', function() {
      const mockEntity = { x: 100, y: 200 };
      systemManager.followEntity(mockEntity);
      
      expect(mockCameraManager.followEntity.calledWith(mockEntity)).to.be.true;
    });
    
    it('should delegate setZoom() to active camera', function() {
      systemManager.setZoom(2.5);
      
      expect(mockCameraManager.setZoom.calledWith(2.5)).to.be.true;
    });
    
    it('should return getCameraPosition() from active camera', function() {
      mockCameraManager.getCameraPosition.returns({ x: 100, y: 200, zoom: 1.5 });
      
      const pos = systemManager.getCameraPosition();
      
      expect(pos).to.deep.equal({ x: 100, y: 200, zoom: 1.5 });
    });
    
    it('should handle API calls when no active camera', function() {
      systemManager.activeCamera = null;
      
      expect(() => systemManager.centerOn(100, 200)).to.not.throw();
      expect(() => systemManager.followEntity(null)).to.not.throw();
    });
  });
  
  describe('Map Reference Management', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
    });
    
    it('should set map on active camera', function() {
      systemManager.switchCamera('IN_GAME');
      systemManager.setCurrentMap(mockMap);
      
      expect(systemManager.customLevelCamera.currentMap).to.equal(mockMap);
    });
    
    it('should set map on both cameras', function() {
      systemManager.setCurrentMap(mockMap);
      
      expect(systemManager.proceduralCamera.currentMap).to.equal(mockMap);
      expect(systemManager.customLevelCamera.currentMap).to.equal(mockMap);
    });
  });
  
  describe('Camera Property Access', function() {
    
    beforeEach(function() {
      systemManager = new CameraSystemManager(mockCameraController, 800, 600);
      systemManager.proceduralCamera = mockCameraManager;
      systemManager.customLevelCamera = mockCustomLevelCamera;
      systemManager.switchCamera('PLAYING');
    });
    
    it('should access cameraX from active camera', function() {
      mockCameraManager.cameraX = 1234;
      
      expect(systemManager.cameraX).to.equal(1234);
    });
    
    it('should access cameraY from active camera', function() {
      mockCameraManager.cameraY = 5678;
      
      expect(systemManager.cameraY).to.equal(5678);
    });
    
    it('should access cameraZoom from active camera', function() {
      mockCameraManager.cameraZoom = 2.5;
      
      expect(systemManager.cameraZoom).to.equal(2.5);
    });
    
    it('should return null for properties when no active camera', function() {
      systemManager.activeCamera = null;
      
      expect(systemManager.cameraX).to.be.null;
      expect(systemManager.cameraY).to.be.null;
      expect(systemManager.cameraZoom).to.be.null;
    });
  });
});
