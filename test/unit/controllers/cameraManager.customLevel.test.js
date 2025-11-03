const { expect } = require('chai');
const sinon = require('sinon');

describe('CameraManager - Custom Level (IN_GAME state)', function() {
  let cameraManager;
  let mockGameState;
  let mockCameraController;
  let keyStates;

  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.constrain = sinon.stub().callsFake((val, min, max) => Math.max(min, Math.min(max, val)));
    global.LEFT_ARROW = 37;
    global.RIGHT_ARROW = 39;
    global.UP_ARROW = 38;
    global.DOWN_ARROW = 40;
    global.TILE_SIZE = 32;
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.deltaTime = 16.67; // 60fps
    
    // Mock getEntityWorldCenter (CRITICAL for CameraManager)
    global.getEntityWorldCenter = sinon.stub().callsFake((entity) => {
      if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') {
        return null;
      }
      const width = entity.width || 64;
      const height = entity.height || 64;
      return {
        x: entity.x + width / 2,
        y: entity.y + height / 2
      };
    });
    
    // Key state tracking
    keyStates = new Set();
    global.keyIsDown = sinon.stub().callsFake((code) => keyStates.has(code));

    // Mock GameState
    mockGameState = {
      getState: sinon.stub().returns('IN_GAME'),
      isInGame: sinon.stub().returns(true)
    };
    global.GameState = mockGameState;

    // Mock CameraController
    mockCameraController = {
      getCameraPosition: sinon.stub().returns({ x: 0, y: 0 }),
      setCameraPosition: sinon.stub(),
      moveCameraBy: sinon.stub()
    };
    global.CameraController = mockCameraController;

    // Load CameraManager
    const CameraManager = require('../../../Classes/controllers/CameraManager.js');
    cameraManager = new CameraManager(800, 600);
  });

  afterEach(function() {
    sinon.restore();
    keyStates.clear();
  });

  describe('Arrow Key Behavior in IN_GAME State', function() {
    it('should NOT respond to arrow keys when in IN_GAME state', function() {
      // Set game state to IN_GAME (custom level)
      mockGameState.getState.returns('IN_GAME');
      
      // Simulate arrow key press
      keyStates.add(global.RIGHT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera should NOT move (moveCameraBy should not be called)
      expect(mockCameraController.moveCameraBy.called).to.be.false;
    });

    it('should NOT disable follow mode when arrow keys pressed in IN_GAME state', function() {
      // Enable follow mode
      const mockQueen = { x: 1000, y: 1000, width: 64, height: 64 };
      cameraManager.followEntity(mockQueen);
      expect(cameraManager.cameraFollowEnabled).to.be.true;
      
      // Set game state to IN_GAME
      mockGameState.getState.returns('IN_GAME');
      
      // Simulate arrow key press
      keyStates.add(global.LEFT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Follow mode should STILL be enabled (not disabled by arrow keys)
      expect(cameraManager.cameraFollowEnabled).to.be.true;
      expect(mockCameraController.moveCameraBy.called).to.be.false;
    });

    it('should respond to arrow keys when in PLAYING state (procedural game)', function() {
      // Set game state to PLAYING (procedural terrain)
      mockGameState.getState.returns('PLAYING');
      
      // Simulate arrow key press
      keyStates.add(global.RIGHT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera SHOULD move in PLAYING state
      expect(mockCameraController.moveCameraBy.called).to.be.true;
    });

    it('should respond to arrow keys when in LEVEL_EDITOR state', function() {
      // Set game state to LEVEL_EDITOR
      mockGameState.getState.returns('LEVEL_EDITOR');
      mockGameState.isInGame.returns(false);
      
      // Simulate arrow key press
      keyStates.add(global.UP_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera SHOULD move in LEVEL_EDITOR state
      expect(mockCameraController.moveCameraBy.called).to.be.true;
    });

    it('should test all four arrow keys are disabled in IN_GAME state', function() {
      mockGameState.getState.returns('IN_GAME');
      
      // Test each arrow key
      const arrows = [global.LEFT_ARROW, global.RIGHT_ARROW, global.UP_ARROW, global.DOWN_ARROW];
      
      arrows.forEach(arrowKey => {
        mockCameraController.moveCameraBy.resetHistory();
        keyStates.clear();
        keyStates.add(arrowKey);
        
        cameraManager.update();
        
        expect(mockCameraController.moveCameraBy.called).to.be.false;
      });
    });
  });

  describe('Camera Following in IN_GAME State', function() {
    it('should continue following queen when arrow keys pressed', function() {
      const mockQueen = { x: 1500, y: 800, width: 64, height: 64 };
      
      // Enable follow mode
      cameraManager.followEntity(mockQueen);
      mockGameState.getState.returns('IN_GAME');
      
      // Record initial camera position
      const initialX = cameraManager.cameraX;
      const initialY = cameraManager.cameraY;
      
      // Press arrow key
      keyStates.add(global.RIGHT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera should center on queen (follow mode active)
      // Expected camera position: queenCenter - (viewWidth/2, viewHeight/2)
      const queenCenterX = mockQueen.x + mockQueen.width / 2;
      const queenCenterY = mockQueen.y + mockQueen.height / 2;
      const expectedCameraX = queenCenterX - (800 / 2);
      const expectedCameraY = queenCenterY - (600 / 2);
      
      expect(cameraManager.cameraX).to.equal(expectedCameraX);
      expect(cameraManager.cameraY).to.equal(expectedCameraY);
    });

    it('should center on queen center point, not top-left corner', function() {
      const mockQueen = { x: 2848, y: 608, width: 60, height: 60 };
      
      cameraManager.followEntity(mockQueen);
      mockGameState.getState.returns('IN_GAME');
      
      cameraManager.update();
      
      // Queen center: (2848 + 30, 608 + 30) = (2878, 638)
      // Camera should be at: (2878 - 400, 638 - 300) = (2478, 338)
      expect(cameraManager.cameraX).to.equal(2478);
      expect(cameraManager.cameraY).to.equal(338);
    });
  });

  describe('clampToBounds with SparseTerrain', function() {
    it('should clamp camera to level bounds', function() {
      // Mock level bounds (SparseTerrain size)
      const mockLevel = {
        getWorldBounds: sinon.stub().returns({ width: 1869, height: 937 })
      };
      cameraManager.currentLevel = mockLevel;
      
      // Also set g_activeMap for fallback
      global.g_activeMap = mockLevel;
      
      // Try to move camera beyond bounds
      cameraManager.cameraX = 2000; // Beyond right edge
      cameraManager.cameraY = 1000; // Beyond bottom edge
      
      cameraManager.clampToBounds();
      
      // Camera should be clamped to max bounds
      // maxX = 1869 - (800/1.0) = 1069
      // maxY = 937 - (600/1.0) = 337
      expect(cameraManager.cameraX).to.equal(1069);
      expect(cameraManager.cameraY).to.equal(337);
      expect(mockLevel.getWorldBounds.called).to.be.true;
    });

    it('should NOT clamp when bounds equal canvas size (no level loaded)', function() {
      // No level loaded, bounds will equal canvas size
      cameraManager.currentLevel = null;
      global.g_activeMap = null;
      
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 100;
      
      cameraManager.clampToBounds();
      
      // Camera should NOT be clamped (no real bounds)
      expect(cameraManager.cameraX).to.equal(100);
      expect(cameraManager.cameraY).to.equal(100);
    });

    it('should use SparseTerrain bounds from currentLevel', function() {
      const mockSparseLevel = {
        getWorldBounds: sinon.stub().returns({ width: 3200, height: 2400 })
      };
      cameraManager.currentLevel = mockSparseLevel;
      global.g_activeMap = mockSparseLevel;
      
      cameraManager.cameraX = 5000; // Way beyond bounds
      cameraManager.cameraY = 5000;
      
      cameraManager.clampToBounds();
      
      // maxX = 3200 - 800 = 2400
      // maxY = 2400 - 600 = 1800
      expect(cameraManager.cameraX).to.equal(2400);
      expect(cameraManager.cameraY).to.equal(1800);
      expect(mockSparseLevel.getWorldBounds.called).to.be.true;
    });
  });

  describe('Zoom-aware Camera Centering', function() {
    it('should account for zoom when centering on entity', function() {
      const mockQueen = { x: 1000, y: 1000, width: 64, height: 64 };
      cameraManager.cameraZoom = 2.0; // 2x zoom
      
      cameraManager.centerOnEntity(mockQueen);
      
      // View dimensions at 2x zoom: 800/2 = 400, 600/2 = 300
      // Queen center: (1032, 1032)
      // Expected camera: (1032 - 200, 1032 - 150) = (832, 882)
      expect(cameraManager.cameraX).to.equal(832);
      expect(cameraManager.cameraY).to.equal(882);
    });

    it('should update view dimensions when zoom changes', function() {
      const mockQueen = { x: 500, y: 500, width: 64, height: 64 };
      
      // Zoom 1.0
      cameraManager.cameraZoom = 1.0;
      cameraManager.centerOnEntity(mockQueen);
      const pos1X = cameraManager.cameraX;
      
      // Zoom 0.5 (zoomed out)
      cameraManager.cameraZoom = 0.5;
      cameraManager.centerOnEntity(mockQueen);
      const pos2X = cameraManager.cameraX;
      
      // Camera position should be different due to zoom change
      expect(pos1X).to.not.equal(pos2X);
    });
  });
});
