const { expect } = require('chai');

// Mock globals
global.window = { tileSize: 32 };
global.tileSize = 32;

// Load the module
const MovementController = require('../../../Classes/controllers/MovementController.js');

describe('MovementController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100,
      posY: 200,
      getPosition: function() { return { x: this.posX, y: this.posY }; },
      setPosition: function(x, y) { this.posX = x; this.posY = y; },
      _sprite: { flipX: false },
      _stateMachine: {
        canPerformAction: () => true,
        setPrimaryState: () => {},
        isPrimaryState: () => false,
        isOutOfCombat: () => true
      }
    };
    controller = new MovementController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize movement state as not moving', function() {
      expect(controller._isMoving).to.be.false;
    });
    
    it('should initialize target position as null', function() {
      expect(controller._targetPosition).to.be.null;
    });
    
    it('should initialize path as null', function() {
      expect(controller._path).to.be.null;
    });
    
    it('should initialize with default speed', function() {
      expect(controller._movementSpeed).to.equal(30);
    });
    
    it('should initialize stuck detection', function() {
      expect(controller._stuckCounter).to.equal(0);
      expect(controller._maxStuckFrames).to.be.a('number');
    });
  });
  
  describe('moveToLocation()', function() {
    it('should set target position', function() {
      controller.moveToLocation(300, 400);
      expect(controller._targetPosition).to.deep.equal({ x: 300, y: 400 });
    });
    
    it('should set isMoving to true', function() {
      controller.moveToLocation(300, 400);
      expect(controller._isMoving).to.be.true;
    });
    
    it('should return true on success', function() {
      const result = controller.moveToLocation(300, 400);
      expect(result).to.be.true;
    });
    
    it('should return false when movement not allowed', function() {
      mockEntity._stateMachine.canPerformAction = () => false;
      const result = controller.moveToLocation(300, 400);
      expect(result).to.be.false;
    });
    
    it('should flip sprite when moving left', function() {
      controller.moveToLocation(50, 200);
      expect(mockEntity._sprite.flipX).to.be.true;
    });
    
    it('should not flip sprite when moving right', function() {
      controller.moveToLocation(150, 200);
      expect(mockEntity._sprite.flipX).to.be.false;
    });
    
    it('should reset stuck counter', function() {
      controller._stuckCounter = 10;
      controller.moveToLocation(300, 400);
      expect(controller._stuckCounter).to.equal(0);
    });
    
    it('should handle same position', function() {
      const result = controller.moveToLocation(100, 200);
      expect(result).to.be.true;
    });
  });
  
  describe('setPath()', function() {
    it('should set path array', function() {
      const path = [{ x: 100, y: 200 }, { x: 200, y: 300 }];
      controller.setPath(path);
      expect(controller._path).to.be.an('array');
      // followPath() shifts first element, so length is 1 less
      expect(controller._path).to.have.lengthOf(1);
    });
    
    it('should copy path array', function() {
      const path = [{ x: 100, y: 200 }];
      controller.setPath(path);
      path.push({ x: 300, y: 400 });
      // followPath() shifts first element, so path becomes empty
      expect(controller._path).to.be.an('array').that.is.empty;
    });
    
    it('should handle null path', function() {
      controller.setPath([{ x: 100, y: 200 }]);
      controller.setPath(null);
      expect(controller._path).to.be.null;
    });
    
    it('should handle empty path', function() {
      controller.setPath([]);
      expect(controller._path).to.be.an('array').that.is.empty;
    });
  });
  
  describe('getPath()', function() {
    it('should return current path', function() {
      const path = [{ x: 100, y: 200 }];
      controller.setPath(path);
      expect(controller.getPath()).to.equal(controller._path);
    });
    
    it('should return null when no path', function() {
      expect(controller.getPath()).to.be.null;
    });
  });
  
  describe('stop()', function() {
    it('should stop movement', function() {
      controller.moveToLocation(300, 400);
      controller.stop();
      expect(controller._isMoving).to.be.false;
    });
    
    it('should clear target position', function() {
      controller.moveToLocation(300, 400);
      controller.stop();
      expect(controller._targetPosition).to.be.null;
    });
    
    it('should clear path', function() {
      controller.setPath([{ x: 100, y: 200 }]);
      controller.stop();
      expect(controller._path).to.be.null;
    });
    
    it('should reset stuck counter', function() {
      controller._stuckCounter = 10;
      controller.stop();
      expect(controller._stuckCounter).to.equal(0);
    });
  });
  
  describe('getIsMoving()', function() {
    it('should return false initially', function() {
      expect(controller.getIsMoving()).to.be.false;
    });
    
    it('should return true when moving', function() {
      controller.moveToLocation(300, 400);
      expect(controller.getIsMoving()).to.be.true;
    });
    
    it('should return false after stopping', function() {
      controller.moveToLocation(300, 400);
      controller.stop();
      expect(controller.getIsMoving()).to.be.false;
    });
  });
  
  describe('getTarget()', function() {
    it('should return null initially', function() {
      expect(controller.getTarget()).to.be.null;
    });
    
    it('should return target position when moving', function() {
      controller.moveToLocation(300, 400);
      const target = controller.getTarget();
      expect(target).to.deep.equal({ x: 300, y: 400 });
    });
    
    it('should return null after stopping', function() {
      controller.moveToLocation(300, 400);
      controller.stop();
      expect(controller.getTarget()).to.be.null;
    });
  });
  
  describe('Movement Speed', function() {
    it('should get movement speed', function() {
      expect(controller.movementSpeed).to.equal(30);
    });
    
    it('should set movement speed', function() {
      controller.movementSpeed = 50;
      expect(controller.movementSpeed).to.equal(50);
    });
    
    it('should accept decimal speeds', function() {
      controller.movementSpeed = 2.5;
      expect(controller.movementSpeed).to.equal(2.5);
    });
    
    it('should accept zero speed', function() {
      controller.movementSpeed = 0;
      expect(controller.movementSpeed).to.equal(0);
    });
  });
  
  describe('update()', function() {
    it('should execute without errors when moving', function() {
      controller.moveToLocation(300, 400);
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle update when not moving', function() {
      controller._isMoving = false;
      controller._targetPosition = null;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle update while moving', function() {
      controller.moveToLocation(300, 400);
      expect(() => controller.update()).to.not.throw();
    });
  });
  
  describe('getCurrentPosition()', function() {
    it('should return entity position', function() {
      const pos = controller.getCurrentPosition();
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should reflect entity position changes', function() {
      mockEntity.posX = 150;
      mockEntity.posY = 250;
      const pos = controller.getCurrentPosition();
      expect(pos).to.deep.equal({ x: 150, y: 250 });
    });
  });
  
  describe('setEntityPosition()', function() {
    it('should set entity position', function() {
      controller.setEntityPosition({ x: 300, y: 400 });
      expect(mockEntity.posX).to.equal(300);
      expect(mockEntity.posY).to.equal(400);
    });
    
    it('should handle fractional positions', function() {
      controller.setEntityPosition({ x: 150.5, y: 250.7 });
      expect(mockEntity.posX).to.equal(150.5);
      expect(mockEntity.posY).to.equal(250.7);
    });
  });
  
  describe('resetSkitterTimer()', function() {
    it('should reset skitter timer', function() {
      controller._skitterTimer = 100;
      controller.resetSkitterTimer();
      expect(controller._skitterTimer).to.be.a('number');
      expect(controller._skitterTimer).to.be.at.least(controller._minSkitterTime);
      expect(controller._skitterTimer).to.be.at.most(controller._maxSkitterTime);
    });
    
    it('should use random value in range', function() {
      const values = [];
      for (let i = 0; i < 10; i++) {
        controller.resetSkitterTimer();
        values.push(controller._skitterTimer);
      }
      expect(new Set(values).size).to.be.greaterThan(1);
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should include movement state', function() {
      const info = controller.getDebugInfo();
      expect(info).to.have.property('isMoving');
    });
    
    it('should include target position', function() {
      const info = controller.getDebugInfo();
      expect(info).to.have.property('targetPosition');
    });
    
    it('should include path information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.have.property('pathLength');
    });
    
    it('should include speed information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.have.property('effectiveSpeed');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity without state machine', function() {
      delete mockEntity._stateMachine;
      const result = controller.moveToLocation(300, 400);
      expect(result).to.be.true;
    });
    
    it('should handle entity without sprite', function() {
      delete mockEntity._sprite;
      expect(() => controller.moveToLocation(300, 400)).to.throw();
    });
    
    it('should handle very large coordinates', function() {
      const result = controller.moveToLocation(100000, 100000);
      expect(result).to.be.true;
    });
    
    it('should handle negative coordinates', function() {
      const result = controller.moveToLocation(-100, -200);
      expect(result).to.be.true;
    });
    
    it('should handle multiple movement calls', function() {
      controller.moveToLocation(300, 400);
      controller.moveToLocation(500, 600);
      expect(controller._targetPosition).to.deep.equal({ x: 500, y: 600 });
    });
    
    it('should handle rapid start/stop', function() {
      controller.moveToLocation(300, 400);
      controller.stop();
      controller.moveToLocation(500, 600);
      controller.stop();
      expect(controller._isMoving).to.be.false;
    });
    
    it('should handle path with single node', function() {
      controller.setPath([{ x: 100, y: 200 }]);
      // followPath() shifts first element, leaving empty array
      expect(controller._path).to.be.an('array').that.is.empty;
    });
    
    it('should handle very long path', function() {
      const longPath = Array(1000).fill(null).map((_, i) => ({ x: i, y: i }));
      controller.setPath(longPath);
      // followPath() shifts first element, so length is 999
      expect(controller._path).to.have.lengthOf(999);
    });
  });
});
