const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('CameraManager + SparseTerrain Integration (Custom Levels)', function() {
  let dom, window, document;
  let cameraManager, sparseTerrain, queenEntity;
  let mockGameState;

  beforeEach(function() {
    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Setup p5.js mocks
    const p5Mocks = {
      createVector: (x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }),
      constrain: (val, min, max) => Math.max(min, Math.min(max, val)),
      LEFT_ARROW: 37,
      RIGHT_ARROW: 39,
      UP_ARROW: 38,
      DOWN_ARROW: 40,
      TILE_SIZE: 32,
      g_canvasX: 800,
      g_canvasY: 600,
      deltaTime: 16.67
    };

    Object.assign(global, p5Mocks);
    // Window has read-only performance, so assign individually
    Object.keys(p5Mocks).forEach(key => {
      if (key !== 'performance') {
        window[key] = p5Mocks[key];
      }
    });

    // Key state management
    const keyStates = new Set();
    const keyIsDownMock = (code) => keyStates.has(code);
    global.keyIsDown = keyIsDownMock;
    window.keyIsDown = keyIsDownMock;
    global._testKeyStates = keyStates; // For test manipulation

    // Mock GameState
    mockGameState = {
      getState: sinon.stub().returns('IN_GAME'),
      isInGame: sinon.stub().returns(true)
    };
    global.GameState = mockGameState;
    window.GameState = mockGameState;

    // Mock CameraController
    const mockCameraController = {
      _pos: { x: 0, y: 0 },
      getCameraPosition: function() { return { ...this._pos }; },
      setCameraPosition: function(x, y) { this._pos.x = x; this._pos.y = y; },
      moveCameraBy: function(dx, dy) { this._pos.x += dx; this._pos.y += dy; }
    };
    global.CameraController = mockCameraController;
    window.CameraController = mockCameraController;

    // Mock getEntityWorldCenter helper function
    global.getEntityWorldCenter = (entity) => {
      if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') {
        return null;
      }
      const width = entity.width || 64;
      const height = entity.height || 64;
      return {
        x: entity.x + width / 2,
        y: entity.y + height / 2
      };
    };
    window.getEntityWorldCenter = global.getEntityWorldCenter;

    // Load REAL SparseTerrain
    const SparseTerrain = require('../../../Classes/terrainUtils/SparseTerrain.js');
    window.SparseTerrain = SparseTerrain;

    // Create REAL SparseTerrain instance
    sparseTerrain = new SparseTerrain(32, 0);

    // Create test level (60x30 tiles = 1920x960 pixels)
    for (let x = 0; x < 60; x++) {
      for (let y = 0; y < 30; y++) {
        sparseTerrain.setTile(x, y, 0); // Grass
      }
    }

    // Create entity-like object with properties CameraManager needs
    // (Entity class requires too many dependencies for integration test)
    queenEntity = {
      x: 960,
      y: 480,
      width: 60,
      height: 60,
      type: 'Queen',
      id: 'test_queen'
    };

    // Load REAL CameraManager
    const CameraManager = require('../../../Classes/controllers/CameraManager.js');
    window.CameraManager = CameraManager;
    
    // Create REAL CameraManager
    cameraManager = new CameraManager(800, 600);
    cameraManager.currentLevel = sparseTerrain;
  });

  afterEach(function() {
    sinon.restore();
    dom.window.close();
  });

  describe('Arrow Key Disabling in IN_GAME State', function() {
    it('should ignore arrow keys and maintain camera follow in custom level', function() {
      // Enable camera follow on queen
      cameraManager.followEntity(queenEntity);
      
      // Record camera position after following
      const followX = cameraManager.cameraX;
      const followY = cameraManager.cameraY;
      
      // Simulate arrow key press (RIGHT)
      global._testKeyStates.add(global.RIGHT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera should NOT have moved (arrow key ignored)
      expect(cameraManager.cameraX).to.equal(followX);
      expect(cameraManager.cameraY).to.equal(followY);
      
      // Follow mode should still be active
      expect(cameraManager.cameraFollowEnabled).to.be.true;
      expect(cameraManager.cameraFollowTarget).to.equal(queenEntity);
    });

    it('should allow arrow keys in PLAYING state (procedural terrain)', function() {
      // Change to PLAYING state
      mockGameState.getState.returns('PLAYING');
      
      // Initial camera position
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 100;
      
      // Press right arrow
      global._testKeyStates.add(global.RIGHT_ARROW);
      
      // Update camera
      cameraManager.update();
      
      // Camera SHOULD have moved (arrow key works in PLAYING state)
      expect(cameraManager.cameraX).to.be.greaterThan(100);
    });
  });

  describe('Camera Following with Level Bounds', function() {
    it('should follow queen and respect SparseTerrain bounds', function() {
      // Move queen to near right edge
      queenEntity.x = 1800;
      queenEntity.y = 480;
      
      // Enable follow
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      // Camera should be clamped to level bounds
      const levelBounds = sparseTerrain.getWorldBounds();
      const maxCameraX = levelBounds.width - 800; // 1920 - 800 = 1120
      const maxCameraY = levelBounds.height - 600; // 960 - 600 = 360
      
      expect(cameraManager.cameraX).to.be.at.most(maxCameraX);
      expect(cameraManager.cameraY).to.be.at.most(maxCameraY);
    });

    it('should center on queen when queen moves', function() {
      // Initial position
      queenEntity.x = 500;
      queenEntity.y = 300;
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      const initialCameraX = cameraManager.cameraX;
      
      // Move queen
      queenEntity.x = 800;
      queenEntity.y = 300;
      
      // Update camera
      cameraManager.update();
      
      // Camera should have moved to follow queen
      expect(cameraManager.cameraX).to.not.equal(initialCameraX);
      
      // Camera should be centered on queen
      const queenCenterX = queenEntity.x + queenEntity.width / 2;
      const expectedCameraX = queenCenterX - (800 / 2);
      expect(cameraManager.cameraX).to.equal(expectedCameraX);
    });

    it('should handle queen at edge of map without going out of bounds', function() {
      // Move queen to top-left corner
      queenEntity.x = 0;
      queenEntity.y = 0;
      
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      // Camera should be at (0, 0) or close to it (clamped to bounds)
      expect(cameraManager.cameraX).to.be.at.least(0);
      expect(cameraManager.cameraY).to.be.at.least(0);
      
      // Move queen to bottom-right corner
      queenEntity.x = 1860; // Near right edge
      queenEntity.y = 900; // Near bottom edge
      
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      // Camera should be clamped to max bounds
      const levelBounds = sparseTerrain.getWorldBounds();
      expect(cameraManager.cameraX).to.be.at.most(levelBounds.width - 800);
      expect(cameraManager.cameraY).to.be.at.most(levelBounds.height - 600);
    });
  });

  describe('SparseTerrain Bounds Integration', function() {
    it('should use SparseTerrain.getWorldBounds() for clamping', function() {
      const bounds = sparseTerrain.getWorldBounds();
      
      // Bounds should match level size (60x30 tiles * 32px)
      expect(bounds.width).to.equal(1920);
      expect(bounds.height).to.equal(960);
      
      // Try to move camera beyond bounds
      cameraManager.cameraX = 3000;
      cameraManager.cameraY = 2000;
      
      cameraManager.clampToBounds();
      
      // Camera should be clamped
      expect(cameraManager.cameraX).to.equal(1120); // 1920 - 800
      expect(cameraManager.cameraY).to.equal(360);  // 960 - 600
    });

    it('should handle small levels (view larger than world)', function() {
      // Create tiny level (10x10 tiles = 320x320 pixels)
      const tinyLevel = new (window.SparseTerrain || global.SparseTerrain)(32, 0);
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          tinyLevel.setTile(x, y, 0);
        }
      }
      
      cameraManager.currentLevel = tinyLevel;
      
      // Place queen at center
      queenEntity.x = 160;
      queenEntity.y = 160;
      
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      // Camera should center world in view (negative bounds OK)
      // View is 800x600, world is 320x320
      // Camera should be centered: -(800-320)/2 = -240
      expect(cameraManager.cameraX).to.equal(-240);
      expect(cameraManager.cameraY).to.equal(-140);
    });
  });

  describe('Zoom Integration with Custom Levels', function() {
    it('should maintain correct centering when zoomed in', function() {
      cameraManager.cameraZoom = 2.0;
      
      queenEntity.x = 1000;
      queenEntity.y = 500;
      
      cameraManager.followEntity(queenEntity);
      cameraManager.update();
      
      // At 2x zoom, view dimensions are 400x300
      const queenCenterX = 1030; // 1000 + 30
      const queenCenterY = 530;  // 500 + 30
      const expectedX = queenCenterX - (400 / 2);
      const expectedY = queenCenterY - (300 / 2);
      
      expect(cameraManager.cameraX).to.equal(expectedX);
      expect(cameraManager.cameraY).to.equal(expectedY);
    });

    it('should clamp correctly at different zoom levels', function() {
      const levelBounds = sparseTerrain.getWorldBounds(); // 1920x960
      
      // Test zoom 1.0
      cameraManager.cameraZoom = 1.0;
      cameraManager.cameraX = 5000;
      cameraManager.clampToBounds();
      expect(cameraManager.cameraX).to.equal(1120); // 1920 - 800
      
      // Test zoom 2.0 (view is 400x300)
      cameraManager.cameraZoom = 2.0;
      cameraManager.cameraX = 5000;
      cameraManager.clampToBounds();
      expect(cameraManager.cameraX).to.equal(1520); // 1920 - 400
    });
  });

  describe('State-based Camera Control', function() {
    it('should switch behavior when transitioning from PLAYING to IN_GAME', function() {
      // Start in PLAYING state
      mockGameState.getState.returns('PLAYING');
      
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 100;
      
      // Arrow keys should work
      global._testKeyStates.add(global.RIGHT_ARROW);
      cameraManager.update();
      
      const playingX = cameraManager.cameraX;
      expect(playingX).to.be.greaterThan(100); // Moved
      
      // Switch to IN_GAME
      mockGameState.getState.returns('IN_GAME');
      cameraManager.cameraX = 100;
      global._testKeyStates.clear();
      global._testKeyStates.add(global.RIGHT_ARROW);
      
      // Arrow keys should NOT work
      cameraManager.update();
      expect(cameraManager.cameraX).to.equal(100); // Did NOT move
    });
  });
});
