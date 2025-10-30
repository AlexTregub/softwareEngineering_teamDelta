const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('CameraManager - Pan Methods (Middle-Click Drag)', function() {
  let CameraManager;
  let cameraManager;
  
  before(function() {
    // Set up JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js globals
    global.cursor = sinon.stub();
    global.ARROW = 'default';
    global.constrain = (value, min, max) => Math.max(min, Math.min(max, value));
    global.TILE_SIZE = 32;
    
    // Mock map with large bounds to prevent clamping during tests
    global.g_activeMap = {
      _xCount: 1000,
      _yCount: 1000,
      setCameraPosition: sinon.stub()
    };
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    // Sync to window
    window.cursor = global.cursor;
    window.ARROW = global.ARROW;
    window.constrain = global.constrain;
    window.TILE_SIZE = global.TILE_SIZE;
    window.g_activeMap = global.g_activeMap;
    window.g_canvasX = global.g_canvasX;
    window.g_canvasY = global.g_canvasY;
  });
  
  beforeEach(function() {
    // Reset mocks
    global.cursor.resetHistory();
    
    // Load CameraManager
    CameraManager = require('../../../Classes/controllers/CameraManager.js');
    cameraManager = new CameraManager();
    
    // Reset camera to known state
    cameraManager.cameraX = 0;
    cameraManager.cameraY = 0;
    cameraManager._isPanning = false;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Initial State', function() {
    it('should initialize with isPanning = false', function() {
      expect(cameraManager.isPanning()).to.be.false;
    });
  });
  
  describe('startPan()', function() {
    it('should set isPanning = true', function() {
      cameraManager.startPan(100, 200);
      expect(cameraManager.isPanning()).to.be.true;
    });
    
    it('should store pan start mouse position', function() {
      cameraManager.startPan(150, 250);
      expect(cameraManager._panStartX).to.equal(150);
      expect(cameraManager._panStartY).to.equal(250);
    });
    
    it('should store camera start position', function() {
      cameraManager.cameraX = 500;
      cameraManager.cameraY = 600;
      
      cameraManager.startPan(100, 200);
      
      expect(cameraManager._cameraStartX).to.equal(500);
      expect(cameraManager._cameraStartY).to.equal(600);
    });
    
    it('should change cursor to grab', function() {
      cameraManager.startPan(100, 200);
      expect(global.cursor.calledWith('grab')).to.be.true;
    });
    
    it('should reset state if called multiple times', function() {
      cameraManager.startPan(100, 200);
      expect(cameraManager._panStartX).to.equal(100);
      
      cameraManager.startPan(300, 400);
      expect(cameraManager._panStartX).to.equal(300);
      expect(cameraManager._panStartY).to.equal(400);
    });
  });
  
  describe('updatePan()', function() {
    let clampStub;
    
    beforeEach(function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.startPan(100, 100); // Start pan at (100, 100)
      
      // Stub clampToBounds to prevent bounds clamping during tests
      clampStub = sinon.stub(cameraManager, 'clampToBounds');
    });
    
    afterEach(function() {
      clampStub.restore();
    });
    
    it('should move camera opposite to mouse drag (right drag = left camera move)', function() {
      // Drag mouse 50px to the right
      cameraManager.updatePan(150, 100);
      
      // Camera should move -50px (left)
      expect(cameraManager.cameraX).to.equal(-50);
      expect(cameraManager.cameraY).to.equal(0);
    });
    
    it('should move camera opposite to mouse drag (left drag = right camera move)', function() {
      // Drag mouse 50px to the left
      cameraManager.updatePan(50, 100);
      
      // Camera should move +50px (right)
      expect(cameraManager.cameraX).to.equal(50);
      expect(cameraManager.cameraY).to.equal(0);
    });
    
    it('should move camera opposite to mouse drag (down drag = up camera move)', function() {
      // Drag mouse 50px down
      cameraManager.updatePan(100, 150);
      
      // Camera should move -50px (up)
      expect(cameraManager.cameraX).to.equal(0);
      expect(cameraManager.cameraY).to.equal(-50);
    });
    
    it('should move camera opposite to mouse drag (diagonal)', function() {
      // Drag mouse 50px right, 30px down
      cameraManager.updatePan(150, 130);
      
      // Camera should move -50px left, -30px up
      expect(cameraManager.cameraX).to.equal(-50);
      expect(cameraManager.cameraY).to.equal(-30);
    });
    
    it('should calculate delta relative to pan start position', function() {
      cameraManager.cameraX = 200;
      cameraManager.cameraY = 300;
      cameraManager.startPan(100, 100);
      
      // First drag
      cameraManager.updatePan(120, 110);
      expect(cameraManager.cameraX).to.equal(180); // 200 - (120 - 100)
      expect(cameraManager.cameraY).to.equal(290); // 300 - (110 - 100)
      
      // Second drag from same start
      cameraManager.updatePan(140, 130);
      expect(cameraManager.cameraX).to.equal(160); // 200 - (140 - 100)
      expect(cameraManager.cameraY).to.equal(270); // 300 - (130 - 100)
    });
    
    it('should not move camera if not panning', function() {
      cameraManager.endPan(); // Stop panning
      
      const initialX = cameraManager.cameraX;
      const initialY = cameraManager.cameraY;
      
      cameraManager.updatePan(200, 200);
      
      expect(cameraManager.cameraX).to.equal(initialX);
      expect(cameraManager.cameraY).to.equal(initialY);
    });
    
    it('should handle negative mouse coordinates', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.startPan(0, 0);
      
      cameraManager.updatePan(-50, -50);
      
      expect(cameraManager.cameraX).to.equal(50);
      expect(cameraManager.cameraY).to.equal(50);
    });
    
    it('should handle large delta values', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.startPan(100, 100);
      
      cameraManager.updatePan(1000, 1000);
      
      expect(cameraManager.cameraX).to.equal(-900);
      expect(cameraManager.cameraY).to.equal(-900);
    });
  });
  
  describe('endPan()', function() {
    beforeEach(function() {
      cameraManager.startPan(100, 200);
      cameraManager.updatePan(150, 250);
    });
    
    it('should set isPanning = false', function() {
      cameraManager.endPan();
      expect(cameraManager.isPanning()).to.be.false;
    });
    
    it('should clear pan start position', function() {
      cameraManager.endPan();
      expect(cameraManager._panStartX).to.equal(0);
      expect(cameraManager._panStartY).to.equal(0);
    });
    
    it('should clear camera start position', function() {
      cameraManager.endPan();
      expect(cameraManager._cameraStartX).to.equal(0);
      expect(cameraManager._cameraStartY).to.equal(0);
    });
    
    it('should restore default cursor', function() {
      global.cursor.resetHistory(); // Clear previous calls
      cameraManager.endPan();
      expect(global.cursor.calledWith(global.ARROW)).to.be.true;
    });
    
    it('should not affect camera position', function() {
      const finalX = cameraManager.cameraX;
      const finalY = cameraManager.cameraY;
      
      cameraManager.endPan();
      
      expect(cameraManager.cameraX).to.equal(finalX);
      expect(cameraManager.cameraY).to.equal(finalY);
    });
  });
  
  describe('isPanning()', function() {
    it('should return false initially', function() {
      expect(cameraManager.isPanning()).to.be.false;
    });
    
    it('should return true after startPan()', function() {
      cameraManager.startPan(100, 200);
      expect(cameraManager.isPanning()).to.be.true;
    });
    
    it('should return false after endPan()', function() {
      cameraManager.startPan(100, 200);
      cameraManager.endPan();
      expect(cameraManager.isPanning()).to.be.false;
    });
  });
  
  describe('Pan Workflow', function() {
    let clampStub;
    
    beforeEach(function() {
      // Stub clampToBounds to prevent bounds clamping during tests
      clampStub = sinon.stub(cameraManager, 'clampToBounds');
    });
    
    afterEach(function() {
      clampStub.restore();
    });
    
    it('should support complete pan lifecycle', function() {
      // Initial state
      expect(cameraManager.isPanning()).to.be.false;
      
      // Start pan
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 100;
      cameraManager.startPan(200, 200);
      expect(cameraManager.isPanning()).to.be.true;
      
      // Update pan
      cameraManager.updatePan(250, 250);
      expect(cameraManager.cameraX).to.equal(50);  // 100 - (250 - 200)
      expect(cameraManager.cameraY).to.equal(50);  // 100 - (250 - 200)
      
      // End pan
      cameraManager.endPan();
      expect(cameraManager.isPanning()).to.be.false;
    });
    
    it('should support multiple pan sessions', function() {
      // First pan
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.startPan(100, 100);
      cameraManager.updatePan(150, 150);
      expect(cameraManager.cameraX).to.equal(-50);
      cameraManager.endPan();
      
      // Second pan (camera already moved)
      cameraManager.startPan(200, 200);
      cameraManager.updatePan(250, 250);
      expect(cameraManager.cameraX).to.equal(-100); // -50 - (250 - 200)
      cameraManager.endPan();
      
      expect(cameraManager.isPanning()).to.be.false;
    });
  });
  
  describe('Pan Speed Multiplier (Settings Integration)', function() {
    let mockSettingsManager;
    let clampStub;
    
    beforeEach(function() {
      // Mock SettingsManager
      mockSettingsManager = {
        getInstance: sinon.stub().returnsThis(),
        get: sinon.stub().returns(1.0) // Default speed
      };
      
      global.SettingsManager = mockSettingsManager;
      window.SettingsManager = mockSettingsManager;
      
      // Stub clampToBounds
      clampStub = sinon.stub(cameraManager, 'clampToBounds');
      
      // Reset camera state
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 100;
      cameraManager.startPan(200, 200);
    });
    
    afterEach(function() {
      clampStub.restore();
      delete global.SettingsManager;
      delete window.SettingsManager;
    });
    
    it('should apply 1.0x speed multiplier (default)', function() {
      mockSettingsManager.get.returns(1.0);
      
      cameraManager.updatePan(250, 250); // Drag 50px right, 50px down
      
      // Camera should move opposite direction: 50px left, 50px up
      expect(cameraManager.cameraX).to.equal(50); // 100 - (50 * 1.0)
      expect(cameraManager.cameraY).to.equal(50); // 100 - (50 * 1.0)
    });
    
    it('should apply 0.5x speed multiplier (slower)', function() {
      mockSettingsManager.get.returns(0.5);
      
      cameraManager.updatePan(250, 250); // Drag 50px
      
      // Camera should move only 25px (50 * 0.5)
      expect(cameraManager.cameraX).to.equal(75); // 100 - (50 * 0.5)
      expect(cameraManager.cameraY).to.equal(75); // 100 - (50 * 0.5)
    });
    
    it('should apply 2.0x speed multiplier (faster)', function() {
      mockSettingsManager.get.returns(2.0);
      
      cameraManager.updatePan(250, 250); // Drag 50px
      
      // Camera should move 100px (50 * 2.0)
      expect(cameraManager.cameraX).to.equal(0); // 100 - (50 * 2.0)
      expect(cameraManager.cameraY).to.equal(0); // 100 - (50 * 2.0)
    });
    
    it('should apply 3.0x speed multiplier (maximum)', function() {
      mockSettingsManager.get.returns(3.0);
      
      cameraManager.updatePan(250, 250); // Drag 50px
      
      // Camera should move 150px (50 * 3.0)
      expect(cameraManager.cameraX).to.equal(-50); // 100 - (50 * 3.0)
      expect(cameraManager.cameraY).to.equal(-50); // 100 - (50 * 3.0)
    });
    
    it('should query SettingsManager for panSpeed setting', function() {
      mockSettingsManager.get.resetHistory();
      
      cameraManager.updatePan(250, 250);
      
      expect(mockSettingsManager.get.called).to.be.true;
      expect(mockSettingsManager.get.firstCall.args[0]).to.equal('camera.panSpeed');
    });
    
    it('should use default 1.0x if SettingsManager unavailable', function() {
      delete global.SettingsManager;
      delete window.SettingsManager;
      
      cameraManager.updatePan(250, 250);
      
      // Should default to 1.0x speed
      expect(cameraManager.cameraX).to.equal(50); // 100 - (50 * 1.0)
      expect(cameraManager.cameraY).to.equal(50);
    });
    
    it('should use default 1.0x if setting not found', function() {
      mockSettingsManager.get.returns(undefined);
      
      cameraManager.updatePan(250, 250);
      
      // Should default to 1.0x speed (from second argument)
      expect(cameraManager.cameraX).to.equal(50);
      expect(cameraManager.cameraY).to.equal(50);
    });
    
    it('should maintain pan accuracy with different speeds', function() {
      // Test that relative distances are proportional to speed
      const speeds = [0.5, 1.0, 2.0, 3.0];
      const expectedDistances = [25, 50, 100, 150]; // 50px drag * speed
      
      speeds.forEach((speed, index) => {
        // Reset for each test
        cameraManager.cameraX = 100;
        cameraManager.cameraY = 100;
        cameraManager.startPan(200, 200);
        
        mockSettingsManager.get.returns(speed);
        cameraManager.updatePan(250, 250);
        
        const actualDistance = 100 - cameraManager.cameraX; // Distance moved
        expect(actualDistance).to.equal(expectedDistances[index]);
      });
    });
    
    it('should apply speed consistently in both X and Y axes', function() {
      mockSettingsManager.get.returns(1.5);
      
      // Asymmetric drag (30px X, 40px Y)
      cameraManager.updatePan(230, 240);
      
      // Both axes should use same multiplier
      const deltaX = 100 - cameraManager.cameraX; // Should be 30 * 1.5 = 45
      const deltaY = 100 - cameraManager.cameraY; // Should be 40 * 1.5 = 60
      
      expect(deltaX).to.equal(45);
      expect(deltaY).to.equal(60);
    });
  });
});
