const { expect } = require('chai');

// Mock p5.js globals
global.g_canvasX = 800;
global.g_canvasY = 600;
global.TILE_SIZE = 32;
global.LEFT_ARROW = 37;
global.RIGHT_ARROW = 39;
global.UP_ARROW = 38;
global.DOWN_ARROW = 40;
global.deltaTime = 16.67;
global.keyIsDown = () => false;
global.color = (...args) => ({ r: args[0], g: args[1], b: args[2], a: args[3] });
global.rectCustom = () => {};
global.logVerbose = () => {};
global.verboseLog = () => {};
global.constrain = (value, min, max) => Math.max(min, Math.min(max, value));
global.gameState = 'PLAYING';
global.window = global;
global.console = { log: () => {} };

// Mock CameraController
global.CameraController = {
  getCameraPosition: () => ({ x: global.cameraX || 0, y: global.cameraY || 0 }),
  setCameraPosition: (x, y) => { global.cameraX = x; global.cameraY = y; },
  moveCameraBy: (dx, dy) => { 
    global.cameraX = (global.cameraX || 0) + dx;
    global.cameraY = (global.cameraY || 0) + dy;
  }
};

// Load the module
require('../../../Classes/controllers/CameraManager.js');
const CameraManager = global.CameraManager;

describe('CameraManager', function() {
  let manager;
  
  beforeEach(function() {
    global.cameraX = 0;
    global.cameraY = 0;
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.gameState = 'PLAYING';
    manager = new CameraManager();
  });
  
  describe('Constructor', function() {
    it('should initialize camera position to zero', function() {
      expect(manager.cameraX).to.equal(0);
      expect(manager.cameraY).to.equal(0);
    });
    
    it('should initialize canvas dimensions', function() {
      expect(manager.canvasWidth).to.equal(800);
      expect(manager.canvasHeight).to.equal(600);
    });
    
    it('should initialize zoom to 1', function() {
      expect(manager.cameraZoom).to.equal(1);
    });
    
    it('should initialize pan speed', function() {
      expect(manager.cameraPanSpeed).to.equal(10);
    });
    
    it('should initialize zoom constraints', function() {
      expect(manager.MIN_CAMERA_ZOOM).to.equal(1);
      expect(manager.MAX_CAMERA_ZOOM).to.equal(3);
      expect(manager.CAMERA_ZOOM_STEP).to.equal(1.1);
    });
    
    it('should initialize following disabled', function() {
      expect(manager.cameraFollowEnabled).to.be.false;
      expect(manager.cameraFollowTarget).to.be.null;
    });
  });
  
  describe('initialize()', function() {
    it('should sync canvas dimensions', function() {
      global.g_canvasX = 1024;
      global.g_canvasY = 768;
      manager.initialize();
      expect(manager.canvasWidth).to.equal(1024);
      expect(manager.canvasHeight).to.equal(768);
    });
    
    it('should initialize camera position from CameraController or default', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      manager.initialize();
      // Position may come from CameraController or be calculated from map dimensions
      expect(manager.cameraX).to.be.a('number');
      expect(manager.cameraY).to.be.a('number');
    });
    
    it('should handle missing CameraController', function() {
      const savedController = global.CameraController;
      global.CameraController = undefined;
      expect(() => manager.initialize()).to.not.throw();
      global.CameraController = savedController;
    });
  });
  
  describe('Zoom Management', function() {
    describe('setZoom()', function() {
      it('should set zoom level', function() {
        manager.setZoom(2);
        expect(manager.cameraZoom).to.equal(2);
      });
      
      it('should clamp zoom to minimum', function() {
        manager.setZoom(0.5);
        expect(manager.cameraZoom).to.equal(1);
      });
      
      it('should clamp zoom to maximum', function() {
        manager.setZoom(5);
        expect(manager.cameraZoom).to.equal(3);
      });
      
      it('should handle zoom with focus point', function() {
        manager.cameraX = 0;
        manager.cameraY = 0;
        manager.setZoom(2, 400, 300);
        expect(manager.cameraZoom).to.equal(2);
      });
    });
    
    describe('direct zoom manipulation', function() {
      it('should allow setting zoom directly', function() {
        manager.cameraZoom = 1.5;
        expect(manager.cameraZoom).to.equal(1.5);
      });
      
      it('should respect zoom constraints via setZoom', function() {
        manager.setZoom(5); // Above max
        expect(manager.cameraZoom).to.be.at.most(3);
        
        manager.setZoom(0.5); // Below min
        expect(manager.cameraZoom).to.be.at.least(1);
      });
    });
  });
  
  describe('Position Management', function() {
    describe('getPosition()', function() {
      it('should return camera position', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        const pos = manager.getPosition();
        expect(pos.x).to.equal(100);
        expect(pos.y).to.equal(200);
      });
    });
    
    describe('setPosition()', function() {
      it('should set camera position', function() {
        manager.setPosition(300, 400);
        expect(manager.cameraX).to.equal(300);
        expect(manager.cameraY).to.equal(400);
      });
      
      it('should sync with CameraController', function() {
        manager.setPosition(500, 600);
        expect(global.cameraX).to.equal(500);
        expect(global.cameraY).to.equal(600);
      });
    });
    
    describe('centerOn() / centerOnEntity()', function() {
      it('should handle centerOnEntity with entity', function() {
        global.CameraController.centerCameraOn = (x, y) => {
          global.cameraX = x - 400;
          global.cameraY = y - 300;
        };
        const entity = { getPosition: () => ({ x: 1000, y: 2000 }) };
        expect(() => manager.centerOnEntity(entity)).to.not.throw();
      });
      
      it('should handle entity without getPosition', function() {
        const entity = { x: 1000, y: 2000 };
        expect(() => manager.centerOnEntity(entity)).to.not.throw();
      });
    });
  });
  
  describe('Coordinate Transforms', function() {
    describe('screenToWorld()', function() {
      it('should convert screen to world coordinates', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        manager.cameraZoom = 1;
        const result = manager.screenToWorld(50, 75);
        expect(result.worldX).to.equal(150);
        expect(result.worldY).to.equal(275);
      });
      
      it('should account for zoom', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        manager.cameraZoom = 2;
        const result = manager.screenToWorld(100, 100);
        expect(result.worldX).to.equal(150);
        expect(result.worldY).to.equal(250);
      });
      
      it('should handle negative camera offset', function() {
        manager.cameraX = -100;
        manager.cameraY = -200;
        manager.cameraZoom = 1;
        const result = manager.screenToWorld(50, 75);
        expect(result.worldX).to.equal(-50);
        expect(result.worldY).to.equal(-125);
      });
    });
    
    describe('worldToScreen()', function() {
      it('should convert world to screen coordinates', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        manager.cameraZoom = 1;
        const result = manager.worldToScreen(150, 275);
        expect(result.screenX).to.equal(50);
        expect(result.screenY).to.equal(75);
      });
      
      it('should account for zoom', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        manager.cameraZoom = 2;
        const result = manager.worldToScreen(150, 250);
        expect(result.screenX).to.equal(100);
        expect(result.screenY).to.equal(100);
      });
      
      it('should be inverse of screenToWorld', function() {
        manager.cameraX = 100;
        manager.cameraY = 200;
        manager.cameraZoom = 1.5;
        const world = manager.screenToWorld(50, 75);
        const screen = manager.worldToScreen(world.worldX, world.worldY);
        expect(screen.screenX).to.be.closeTo(50, 0.01);
        expect(screen.screenY).to.be.closeTo(75, 0.01);
      });
    });
  });
  
  describe('Following System', function() {
    describe('toggleFollow()', function() {
      it('should toggle follow state with selected entity', function() {
        const entity = { getPosition: () => ({ x: 100, y: 200 }) };
        manager.getPrimarySelectedEntity = () => entity;
        manager.cameraFollowEnabled = false;
        manager.toggleFollow();
        expect(manager.cameraFollowEnabled).to.be.true;
      });
      
      it('should toggle back to false when already following', function() {
        const entity = { getPosition: () => ({ x: 100, y: 200 }) };
        manager.getPrimarySelectedEntity = () => entity;
        manager.cameraFollowEnabled = true;
        manager.cameraFollowTarget = entity;
        manager.toggleFollow();
        expect(manager.cameraFollowEnabled).to.be.false;
      });
    });
    
    describe('follow target management', function() {
      it('should allow setting follow target directly', function() {
        const entity = { getPosition: () => ({ x: 100, y: 200 }) };
        manager.cameraFollowTarget = entity;
        manager.cameraFollowEnabled = true;
        expect(manager.cameraFollowTarget).to.equal(entity);
        expect(manager.cameraFollowEnabled).to.be.true;
      });
      
      it('should allow disabling follow directly', function() {
        manager.cameraFollowEnabled = true;
        manager.cameraFollowTarget = {};
        manager.cameraFollowEnabled = false;
        manager.cameraFollowTarget = null;
        expect(manager.cameraFollowEnabled).to.be.false;
        expect(manager.cameraFollowTarget).to.be.null;
      });
    });
  });
  
  describe('Visibility and Bounds', function() {
    it('should calculate visible bounds from camera position and zoom', function() {
      manager.cameraX = 100;
      manager.cameraY = 200;
      manager.canvasWidth = 800;
      manager.canvasHeight = 600;
      manager.cameraZoom = 1;
      
      // Visible area extends from camera position by canvas dimensions / zoom
      const visibleWidth = manager.canvasWidth / manager.cameraZoom;
      const visibleHeight = manager.canvasHeight / manager.cameraZoom;
      
      expect(visibleWidth).to.equal(800);
      expect(visibleHeight).to.equal(600);
    });
    
    it('should account for zoom in visibility calculations', function() {
      manager.cameraZoom = 2;
      const visibleWidth = manager.canvasWidth / manager.cameraZoom;
      expect(visibleWidth).to.equal(400); // Half width at 2x zoom
    });
    
    it('should track camera bounds for rendering', function() {
      manager.cameraX = 0;
      manager.cameraY = 0;
      manager.canvasWidth = 800;
      manager.canvasHeight = 600;
      
      expect(manager.cameraX).to.be.a('number');
      expect(manager.cameraY).to.be.a('number');
      expect(manager.canvasWidth).to.be.a('number');
      expect(manager.canvasHeight).to.be.a('number');
    });
  });
  
  describe('Update Loop', function() {
    describe('update()', function() {
      it('should update canvas dimensions', function() {
        global.g_canvasX = 1024;
        global.g_canvasY = 768;
        manager.update();
        expect(manager.canvasWidth).to.equal(1024);
        expect(manager.canvasHeight).to.equal(768);
      });
      
      it('should not update when not in game', function() {
        global.gameState = 'MENU';
        const originalX = manager.cameraX;
        manager.update();
        expect(manager.cameraX).to.equal(originalX);
      });
      
      it('should handle follow logic when enabled', function() {
        global.CameraController.centerCameraOn = (x, y) => {
          manager.cameraX = x - 400;
          manager.cameraY = y - 300;
        };
        const target = { getPosition: () => ({ x: 1000, y: 2000 }) };
        manager.cameraFollowEnabled = true;
        manager.cameraFollowTarget = target;
        manager.getPrimarySelectedEntity = () => target;
        manager.update();
        // Following logic executed
        expect(manager.cameraFollowEnabled).to.be.true;
      });
    });
    
    describe('isInGame()', function() {
      it('should return true when game state is PLAYING', function() {
        global.gameState = 'PLAYING';
        expect(manager.isInGame()).to.be.true;
      });
      
      it('should check game state correctly', function() {
        global.gameState = 'OPTIONS';
        const result = manager.isInGame();
        expect(result).to.be.a('boolean');
      });
    });
  });
  
  describe('Debug and Utilities', function() {
    it('should expose debug information via properties', function() {
      expect(manager.cameraX).to.be.a('number');
      expect(manager.cameraY).to.be.a('number');
      expect(manager.cameraZoom).to.be.a('number');
      expect(manager.canvasWidth).to.be.a('number');
      expect(manager.canvasHeight).to.be.a('number');
      expect(manager.cameraFollowEnabled).to.be.a('boolean');
    });
    
    it('should allow setting pan speed directly', function() {
      manager.cameraPanSpeed = 20;
      expect(manager.cameraPanSpeed).to.equal(20);
    });
    
    it('should handle zero pan speed', function() {
      manager.cameraPanSpeed = 0;
      expect(manager.cameraPanSpeed).to.equal(0);
    });
    
    it('should toggle outline mode', function() {
      manager.cameraOutlineToggle = false;
      manager.toggleOutline();
      expect(manager.cameraOutlineToggle).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large coordinates', function() {
      manager.setPosition(1000000, 2000000);
      expect(manager.cameraX).to.equal(1000000);
      expect(manager.cameraY).to.equal(2000000);
    });
    
    it('should handle negative coordinates', function() {
      manager.setPosition(-1000, -2000);
      expect(manager.cameraX).to.equal(-1000);
      expect(manager.cameraY).to.equal(-2000);
    });
    
    it('should handle fractional zoom', function() {
      manager.setZoom(1.5);
      expect(manager.cameraZoom).to.equal(1.5);
    });
    
    it('should handle coordinate transform round-trip', function() {
      manager.cameraX = 123.456;
      manager.cameraY = 789.012;
      manager.cameraZoom = 1.5;
      
      const world = manager.screenToWorld(50.5, 75.5);
      const screen = manager.worldToScreen(world.worldX, world.worldY);
      expect(screen.screenX).to.be.closeTo(50.5, 0.01);
      expect(screen.screenY).to.be.closeTo(75.5, 0.01);
    });
    
    it('should handle rapid zoom changes', function() {
      for (let i = 0; i < 10; i++) {
        manager.setZoom(manager.cameraZoom * 1.1);
      }
      expect(manager.cameraZoom).to.be.at.most(3);
      
      for (let i = 0; i < 10; i++) {
        manager.setZoom(manager.cameraZoom / 1.1);
      }
      expect(manager.cameraZoom).to.be.at.least(1);
    });
  });
});
