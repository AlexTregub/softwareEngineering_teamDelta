const { expect } = require('chai');

// Mock p5.js globals
global.mouseX = 0;
global.mouseY = 0;
global.cameraX = 0;
global.cameraY = 0;
global.g_canvasX = 800;
global.g_canvasY = 800;
global.window = global;

// Load the module
require('../../../Classes/controllers/CameraController.js');
const CameraController = global.CameraController;

describe('CameraController', function() {
  beforeEach(function() {
    // Reset camera position
    global.cameraX = 0;
    global.cameraY = 0;
    global.mouseX = 0;
    global.mouseY = 0;
  });
  
  describe('getWorldMouseX()', function() {
    it('should return mouse X with camera offset', function() {
      global.mouseX = 100;
      global.cameraX = 50;
      expect(CameraController.getWorldMouseX()).to.equal(150);
    });
    
    it('should handle zero camera offset', function() {
      global.mouseX = 100;
      global.cameraX = 0;
      expect(CameraController.getWorldMouseX()).to.equal(100);
    });
    
    it('should handle negative camera offset', function() {
      global.mouseX = 100;
      global.cameraX = -50;
      expect(CameraController.getWorldMouseX()).to.equal(50);
    });
    
    it('should handle undefined mouseX', function() {
      global.mouseX = undefined;
      global.cameraX = 50;
      expect(CameraController.getWorldMouseX()).to.equal(50);
    });
  });
  
  describe('getWorldMouseY()', function() {
    it('should return mouse Y with camera offset', function() {
      global.mouseY = 200;
      global.cameraY = 75;
      expect(CameraController.getWorldMouseY()).to.equal(275);
    });
    
    it('should handle zero camera offset', function() {
      global.mouseY = 200;
      global.cameraY = 0;
      expect(CameraController.getWorldMouseY()).to.equal(200);
    });
    
    it('should handle negative camera offset', function() {
      global.mouseY = 200;
      global.cameraY = -100;
      expect(CameraController.getWorldMouseY()).to.equal(100);
    });
    
    it('should handle undefined mouseY', function() {
      global.mouseY = undefined;
      global.cameraY = 75;
      expect(CameraController.getWorldMouseY()).to.equal(75);
    });
  });
  
  describe('getWorldMouse()', function() {
    it('should return object with world and screen coordinates', function() {
      global.mouseX = 100;
      global.mouseY = 200;
      global.cameraX = 50;
      global.cameraY = 75;
      
      const result = CameraController.getWorldMouse();
      expect(result.worldX).to.equal(150);
      expect(result.worldY).to.equal(275);
      expect(result.screenX).to.equal(100);
      expect(result.screenY).to.equal(200);
    });
    
    it('should handle zero offsets', function() {
      global.mouseX = 100;
      global.mouseY = 200;
      global.cameraX = 0;
      global.cameraY = 0;
      
      const result = CameraController.getWorldMouse();
      expect(result.worldX).to.equal(100);
      expect(result.worldY).to.equal(200);
    });
    
    it('should handle undefined mouse position', function() {
      global.mouseX = undefined;
      global.mouseY = undefined;
      global.cameraX = 50;
      global.cameraY = 75;
      
      const result = CameraController.getWorldMouse();
      expect(result.worldX).to.equal(50);
      expect(result.worldY).to.equal(75);
      expect(result.screenX).to.equal(0);
      expect(result.screenY).to.equal(0);
    });
  });
  
  describe('screenToWorld()', function() {
    it('should convert screen coordinates to world coordinates', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      
      const result = CameraController.screenToWorld(50, 75);
      expect(result.worldX).to.equal(150);
      expect(result.worldY).to.equal(275);
    });
    
    it('should handle zero camera offset', function() {
      global.cameraX = 0;
      global.cameraY = 0;
      
      const result = CameraController.screenToWorld(50, 75);
      expect(result.worldX).to.equal(50);
      expect(result.worldY).to.equal(75);
    });
    
    it('should handle negative camera offset', function() {
      global.cameraX = -100;
      global.cameraY = -200;
      
      const result = CameraController.screenToWorld(50, 75);
      expect(result.worldX).to.equal(-50);
      expect(result.worldY).to.equal(-125);
    });
    
    it('should handle large coordinates', function() {
      global.cameraX = 10000;
      global.cameraY = 20000;
      
      const result = CameraController.screenToWorld(500, 300);
      expect(result.worldX).to.equal(10500);
      expect(result.worldY).to.equal(20300);
    });
  });
  
  describe('worldToScreen()', function() {
    it('should convert world coordinates to screen coordinates', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      
      const result = CameraController.worldToScreen(150, 275);
      expect(result.screenX).to.equal(50);
      expect(result.screenY).to.equal(75);
    });
    
    it('should handle zero camera offset', function() {
      global.cameraX = 0;
      global.cameraY = 0;
      
      const result = CameraController.worldToScreen(50, 75);
      expect(result.screenX).to.equal(50);
      expect(result.screenY).to.equal(75);
    });
    
    it('should handle negative results', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      
      const result = CameraController.worldToScreen(50, 75);
      expect(result.screenX).to.equal(-50);
      expect(result.screenY).to.equal(-125);
    });
    
    it('should be inverse of screenToWorld', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      
      const world = CameraController.screenToWorld(50, 75);
      const screen = CameraController.worldToScreen(world.worldX, world.worldY);
      expect(screen.screenX).to.equal(50);
      expect(screen.screenY).to.equal(75);
    });
  });
  
  describe('setCameraPosition()', function() {
    it('should set camera position in window', function() {
      CameraController.setCameraPosition(100, 200);
      expect(global.cameraX).to.equal(100);
      expect(global.cameraY).to.equal(200);
    });
    
    it('should handle zero position', function() {
      CameraController.setCameraPosition(0, 0);
      expect(global.cameraX).to.equal(0);
      expect(global.cameraY).to.equal(0);
    });
    
    it('should handle negative position', function() {
      CameraController.setCameraPosition(-100, -200);
      expect(global.cameraX).to.equal(-100);
      expect(global.cameraY).to.equal(-200);
    });
    
    it('should overwrite previous position', function() {
      CameraController.setCameraPosition(100, 200);
      CameraController.setCameraPosition(300, 400);
      expect(global.cameraX).to.equal(300);
      expect(global.cameraY).to.equal(400);
    });
  });
  
  describe('moveCameraBy()', function() {
    it('should move camera by delta', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      CameraController.moveCameraBy(50, 75);
      expect(global.cameraX).to.equal(150);
      expect(global.cameraY).to.equal(275);
    });
    
    it('should handle negative delta', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      CameraController.moveCameraBy(-50, -75);
      expect(global.cameraX).to.equal(50);
      expect(global.cameraY).to.equal(125);
    });
    
    it('should handle zero delta', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      CameraController.moveCameraBy(0, 0);
      expect(global.cameraX).to.equal(100);
      expect(global.cameraY).to.equal(200);
    });
    
    it('should accumulate multiple moves', function() {
      CameraController.setCameraPosition(0, 0);
      CameraController.moveCameraBy(10, 20);
      CameraController.moveCameraBy(5, 10);
      expect(global.cameraX).to.equal(15);
      expect(global.cameraY).to.equal(30);
    });
  });
  
  describe('getCameraPosition()', function() {
    it('should return current camera position', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should return zero when undefined', function() {
      global.cameraX = undefined;
      global.cameraY = undefined;
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(0);
      expect(pos.y).to.equal(0);
    });
    
    it('should reflect changes after setCameraPosition', function() {
      CameraController.setCameraPosition(300, 400);
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(300);
      expect(pos.y).to.equal(400);
    });
  });
  
  describe('centerCameraOn()', function() {
    it('should center camera on world position', function() {
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      CameraController.centerCameraOn(1000, 2000);
      expect(global.cameraX).to.equal(600); // 1000 - 400
      expect(global.cameraY).to.equal(1700); // 2000 - 300
    });
    
    it('should handle centering on origin', function() {
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      CameraController.centerCameraOn(0, 0);
      expect(global.cameraX).to.equal(-400);
      expect(global.cameraY).to.equal(-300);
    });
    
    it('should handle negative world coordinates', function() {
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      CameraController.centerCameraOn(-1000, -2000);
      expect(global.cameraX).to.equal(-1400);
      expect(global.cameraY).to.equal(-2300);
    });
  });
  
  describe('getVisibleBounds()', function() {
    it('should return visible world bounds', function() {
      global.cameraX = 100;
      global.cameraY = 200;
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      
      const bounds = CameraController.getVisibleBounds();
      expect(bounds.left).to.equal(100);
      expect(bounds.right).to.equal(900);
      expect(bounds.top).to.equal(200);
      expect(bounds.bottom).to.equal(800);
    });
    
    it('should handle zero camera position', function() {
      global.cameraX = 0;
      global.cameraY = 0;
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      
      const bounds = CameraController.getVisibleBounds();
      expect(bounds.left).to.equal(0);
      expect(bounds.right).to.equal(800);
      expect(bounds.top).to.equal(0);
      expect(bounds.bottom).to.equal(600);
    });
    
    it('should handle negative camera position', function() {
      global.cameraX = -100;
      global.cameraY = -200;
      global.g_canvasX = 800;
      global.g_canvasY = 600;
      
      const bounds = CameraController.getVisibleBounds();
      expect(bounds.left).to.equal(-100);
      expect(bounds.right).to.equal(700);
      expect(bounds.top).to.equal(-200);
      expect(bounds.bottom).to.equal(400);
    });
  });
  
  describe('isPositionVisible()', function() {
    beforeEach(function() {
      global.cameraX = 100;
      global.cameraY = 200;
      global.g_canvasX = 800;
      global.g_canvasY = 600;
    });
    
    it('should return true for position in center', function() {
      expect(CameraController.isPositionVisible(500, 500)).to.be.true;
    });
    
    it('should return true for position at left edge', function() {
      expect(CameraController.isPositionVisible(100, 500)).to.be.true;
    });
    
    it('should return true for position at right edge', function() {
      expect(CameraController.isPositionVisible(900, 500)).to.be.true;
    });
    
    it('should return true for position at top edge', function() {
      expect(CameraController.isPositionVisible(500, 200)).to.be.true;
    });
    
    it('should return true for position at bottom edge', function() {
      expect(CameraController.isPositionVisible(500, 800)).to.be.true;
    });
    
    it('should return false for position left of bounds', function() {
      expect(CameraController.isPositionVisible(50, 500)).to.be.false;
    });
    
    it('should return false for position right of bounds', function() {
      expect(CameraController.isPositionVisible(1000, 500)).to.be.false;
    });
    
    it('should return false for position above bounds', function() {
      expect(CameraController.isPositionVisible(500, 100)).to.be.false;
    });
    
    it('should return false for position below bounds', function() {
      expect(CameraController.isPositionVisible(500, 900)).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large coordinates', function() {
      CameraController.setCameraPosition(1000000, 2000000);
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(1000000);
      expect(pos.y).to.equal(2000000);
    });
    
    it('should handle fractional coordinates', function() {
      CameraController.setCameraPosition(100.5, 200.7);
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(100.5);
      expect(pos.y).to.equal(200.7);
    });
    
    it('should handle rapid position changes', function() {
      for (let i = 0; i < 100; i++) {
        CameraController.setCameraPosition(i * 10, i * 20);
      }
      const pos = CameraController.getCameraPosition();
      expect(pos.x).to.equal(990);
      expect(pos.y).to.equal(1980);
    });
    
    it('should handle coordinate conversion round-trip', function() {
      global.cameraX = 123.456;
      global.cameraY = 789.012;
      
      const world = CameraController.screenToWorld(50.5, 75.5);
      const screen = CameraController.worldToScreen(world.worldX, world.worldY);
      expect(screen.screenX).to.be.closeTo(50.5, 0.0001);
      expect(screen.screenY).to.be.closeTo(75.5, 0.0001);
    });
  });
});
