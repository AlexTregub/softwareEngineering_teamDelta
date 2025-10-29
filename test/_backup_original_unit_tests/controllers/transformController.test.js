const { expect } = require('chai');

// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Load the module
const TransformController = require('../../../Classes/controllers/TransformController.js');

describe('TransformController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Create minimal mock entity
    mockEntity = {
      _collisionBox: {
        x: 0,
        y: 0,
        width: 32,
        height: 32
      },
      _sprite: {
        setPosition: function(pos) { this.position = pos; },
        setSize: function(size) { this.size = size; },
        setRotation: function(rot) { this.rotation = rot; },
        position: createVector(0, 0),
        size: createVector(32, 32),
        rotation: 0
      },
      _stats: null
    };
    
    controller = new TransformController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize isDirty to false', function() {
      expect(controller._isDirty).to.be.false;
    });
    
    it('should initialize cached position from collision box', function() {
      expect(controller._lastPosition.x).to.equal(0);
      expect(controller._lastPosition.y).to.equal(0);
    });
    
    it('should initialize cached size from collision box', function() {
      expect(controller._lastSize.x).to.equal(32);
      expect(controller._lastSize.y).to.equal(32);
    });
    
    it('should initialize rotation to 0', function() {
      expect(controller._lastRotation).to.equal(0);
    });
  });
  
  describe('Position Management', function() {
    describe('setPosition()', function() {
      it('should update cached position', function() {
        controller.setPosition(100, 200);
        expect(controller._lastPosition.x).to.equal(100);
        expect(controller._lastPosition.y).to.equal(200);
      });
      
      it('should mark controller as dirty', function() {
        controller.setPosition(50, 50);
        expect(controller._isDirty).to.be.true;
      });
      
      it('should update stats if available', function() {
        mockEntity._stats = {
          position: {
            statValue: { x: 0, y: 0 }
          }
        };
        controller.setPosition(75, 85);
        expect(mockEntity._stats.position.statValue.x).to.equal(75);
        expect(mockEntity._stats.position.statValue.y).to.equal(85);
      });
      
      it('should handle negative coordinates', function() {
        controller.setPosition(-50, -100);
        expect(controller._lastPosition.x).to.equal(-50);
        expect(controller._lastPosition.y).to.equal(-100);
      });
      
      it('should handle fractional coordinates', function() {
        controller.setPosition(12.5, 34.7);
        expect(controller._lastPosition.x).to.be.closeTo(12.5, 0.01);
        expect(controller._lastPosition.y).to.be.closeTo(34.7, 0.01);
      });
    });
    
    describe('getPosition()', function() {
      it('should return position from stats when available', function() {
        mockEntity._stats = {
          position: {
            statValue: { x: 100, y: 200 }
          }
        };
        const pos = controller.getPosition();
        expect(pos.x).to.equal(100);
        expect(pos.y).to.equal(200);
      });
      
      it('should return cached position when stats unavailable', function() {
        controller.setPosition(50, 60);
        const pos = controller.getPosition();
        expect(pos.x).to.equal(50);
        expect(pos.y).to.equal(60);
      });
      
      it('should fallback to collision box', function() {
        mockEntity._collisionBox.x = 25;
        mockEntity._collisionBox.y = 35;
        controller._lastPosition = null;
        const pos = controller.getPosition();
        expect(pos.x).to.equal(25);
        expect(pos.y).to.equal(35);
      });
      
      it('should return {0,0} as absolute fallback', function() {
        mockEntity._collisionBox = null;
        controller._lastPosition = null;
        const pos = controller.getPosition();
        expect(pos.x).to.equal(0);
        expect(pos.y).to.equal(0);
      });
    });
    
    describe('getCenter()', function() {
      it('should calculate center point', function() {
        controller.setPosition(0, 0);
        controller.setSize(100, 100);
        const center = controller.getCenter();
        expect(center.x).to.equal(50);
        expect(center.y).to.equal(50);
      });
      
      it('should handle offset positions', function() {
        controller.setPosition(50, 50);
        controller.setSize(40, 60);
        const center = controller.getCenter();
        expect(center.x).to.equal(70);
        expect(center.y).to.equal(80);
      });
      
      it('should handle negative positions', function() {
        controller.setPosition(-100, -100);
        controller.setSize(50, 50);
        const center = controller.getCenter();
        expect(center.x).to.equal(-75);
        expect(center.y).to.equal(-75);
      });
    });
  });
  
  describe('Size Management', function() {
    describe('setSize()', function() {
      it('should update cached size', function() {
        controller.setSize(64, 128);
        expect(controller._lastSize.x).to.equal(64);
        expect(controller._lastSize.y).to.equal(128);
      });
      
      it('should mark controller as dirty', function() {
        controller.setSize(50, 50);
        expect(controller._isDirty).to.be.true;
      });
      
      it('should update stats if available', function() {
        mockEntity._stats = {
          size: {
            statValue: { x: 32, y: 32 }
          }
        };
        controller.setSize(80, 90);
        expect(mockEntity._stats.size.statValue.x).to.equal(80);
        expect(mockEntity._stats.size.statValue.y).to.equal(90);
      });
      
      it('should handle zero size', function() {
        controller.setSize(0, 0);
        expect(controller._lastSize.x).to.equal(0);
        expect(controller._lastSize.y).to.equal(0);
      });
    });
    
    describe('getSize()', function() {
      it('should return size from stats when available', function() {
        mockEntity._stats = {
          size: {
            statValue: { x: 64, y: 128 }
          }
        };
        const size = controller.getSize();
        expect(size.x).to.equal(64);
        expect(size.y).to.equal(128);
      });
      
      it('should return cached size when stats unavailable', function() {
        controller.setSize(75, 85);
        const size = controller.getSize();
        expect(size.x).to.equal(75);
        expect(size.y).to.equal(85);
      });
      
      it('should fallback to collision box', function() {
        mockEntity._collisionBox.width = 45;
        mockEntity._collisionBox.height = 55;
        controller._lastSize = null;
        const size = controller.getSize();
        expect(size.x).to.equal(45);
        expect(size.y).to.equal(55);
      });
      
      it('should return {32,32} as absolute fallback', function() {
        mockEntity._collisionBox = null;
        controller._lastSize = null;
        const size = controller.getSize();
        expect(size.x).to.equal(32);
        expect(size.y).to.equal(32);
      });
    });
  });
  
  describe('Rotation Management', function() {
    describe('setRotation()', function() {
      it('should set rotation', function() {
        controller.setRotation(45);
        expect(controller.getRotation()).to.equal(45);
      });
      
      it('should normalize rotation above 360', function() {
        controller.setRotation(400);
        expect(controller.getRotation()).to.equal(40);
      });
      
      it('should normalize negative rotation', function() {
        controller.setRotation(-45);
        expect(controller.getRotation()).to.equal(315);
      });
      
      it('should mark controller as dirty', function() {
        controller._isDirty = false;
        controller.setRotation(90);
        expect(controller._isDirty).to.be.true;
      });
      
      it('should handle multiple rotations past 360', function() {
        controller.setRotation(800);
        expect(controller.getRotation()).to.equal(80);
      });
    });
    
    describe('rotate()', function() {
      it('should rotate by delta amount', function() {
        controller.setRotation(45);
        controller.rotate(45);
        expect(controller.getRotation()).to.equal(90);
      });
      
      it('should handle negative delta', function() {
        controller.setRotation(90);
        controller.rotate(-45);
        expect(controller.getRotation()).to.equal(45);
      });
      
      it('should normalize after rotation', function() {
        controller.setRotation(350);
        controller.rotate(30);
        expect(controller.getRotation()).to.equal(20);
      });
    });
  });
  
  describe('Utility Methods', function() {
    describe('contains()', function() {
      it('should return true for point inside bounds', function() {
        controller.setPosition(0, 0);
        controller.setSize(100, 100);
        expect(controller.contains(50, 50)).to.be.true;
      });
      
      it('should return false for point outside bounds', function() {
        controller.setPosition(0, 0);
        controller.setSize(100, 100);
        expect(controller.contains(150, 150)).to.be.false;
      });
      
      it('should handle edge cases - on boundary', function() {
        controller.setPosition(0, 0);
        controller.setSize(100, 100);
        expect(controller.contains(0, 0)).to.be.true;
        expect(controller.contains(100, 100)).to.be.true;
      });
      
      it('should handle negative positions', function() {
        controller.setPosition(-50, -50);
        controller.setSize(100, 100);
        expect(controller.contains(0, 0)).to.be.true;
        expect(controller.contains(-25, -25)).to.be.true;
      });
    });
    
    describe('getDistanceTo()', function() {
      it('should calculate distance to another controller', function() {
        controller.setPosition(0, 0);
        
        const other = new TransformController(mockEntity);
        other.setPosition(30, 40);
        
        const distance = controller.getDistanceTo(other);
        expect(distance).to.equal(50); // 3-4-5 triangle
      });
      
      it('should calculate distance to plain object', function() {
        controller.setPosition(0, 0);
        const distance = controller.getDistanceTo({ x: 30, y: 40 });
        expect(distance).to.equal(50);
      });
      
      it('should return 0 for same position', function() {
        controller.setPosition(100, 100);
        const distance = controller.getDistanceTo({ x: 100, y: 100 });
        expect(distance).to.equal(0);
      });
    });
    
    describe('translate()', function() {
      it('should move by offset', function() {
        controller.setPosition(50, 50);
        controller.translate(25, 35);
        const pos = controller.getPosition();
        expect(pos.x).to.equal(75);
        expect(pos.y).to.equal(85);
      });
      
      it('should handle negative offset', function() {
        controller.setPosition(100, 100);
        controller.translate(-25, -50);
        const pos = controller.getPosition();
        expect(pos.x).to.equal(75);
        expect(pos.y).to.equal(50);
      });
    });
    
    describe('scale()', function() {
      it('should scale size by factor', function() {
        controller.setSize(50, 100);
        controller.scale(2);
        const size = controller.getSize();
        expect(size.x).to.equal(100);
        expect(size.y).to.equal(200);
      });
      
      it('should handle fractional scale', function() {
        controller.setSize(100, 100);
        controller.scale(0.5);
        const size = controller.getSize();
        expect(size.x).to.equal(50);
        expect(size.y).to.equal(50);
      });
    });
  });
  
  describe('Sprite Synchronization', function() {
    describe('syncSprite()', function() {
      it('should update sprite position', function() {
        controller.setPosition(100, 200);
        controller.syncSprite();
        expect(mockEntity._sprite.position.x).to.equal(100);
        expect(mockEntity._sprite.position.y).to.equal(200);
      });
      
      it('should update sprite size', function() {
        controller.setSize(64, 128);
        controller.syncSprite();
        expect(mockEntity._sprite.size.x).to.equal(64);
        expect(mockEntity._sprite.size.y).to.equal(128);
      });
      
      it('should update sprite rotation', function() {
        controller.setRotation(45);
        controller.syncSprite();
        expect(mockEntity._sprite.rotation).to.equal(45);
      });
      
      it('should handle missing sprite gracefully', function() {
        mockEntity._sprite = null;
        expect(() => controller.syncSprite()).to.not.throw();
      });
    });
    
    describe('update()', function() {
      it('should sync sprite when dirty', function() {
        controller.setPosition(50, 60);
        controller.update();
        expect(mockEntity._sprite.position.x).to.equal(50);
        expect(controller._isDirty).to.be.false;
      });
      
      it('should not sync sprite when clean', function() {
        controller._isDirty = false;
        const originalPos = mockEntity._sprite.position.x;
        controller.update();
        expect(mockEntity._sprite.position.x).to.equal(originalPos);
      });
    });
    
    describe('forceSyncSprite()', function() {
      it('should sync even when not dirty', function() {
        controller._isDirty = false;
        controller.setPosition(75, 85);
        controller._isDirty = false; // Force clean
        controller.forceSyncSprite();
        expect(mockEntity._sprite.position.x).to.equal(75);
      });
      
      it('should reset dirty flag', function() {
        controller._isDirty = true;
        controller.forceSyncSprite();
        expect(controller._isDirty).to.be.false;
      });
    });
  });
  
  describe('Bounds and Collision', function() {
    describe('getBounds()', function() {
      it('should return bounding box', function() {
        controller.setPosition(10, 20);
        controller.setSize(30, 40);
        const bounds = controller.getBounds();
        expect(bounds.x).to.equal(10);
        expect(bounds.y).to.equal(20);
        expect(bounds.width).to.equal(30);
        expect(bounds.height).to.equal(40);
      });
    });
    
    describe('intersects()', function() {
      it('should detect intersection', function() {
        controller.setPosition(0, 0);
        controller.setSize(50, 50);
        
        const other = new TransformController(mockEntity);
        other.setPosition(25, 25);
        other.setSize(50, 50);
        
        expect(controller.intersects(other)).to.be.true;
      });
      
      it('should detect no intersection', function() {
        controller.setPosition(0, 0);
        controller.setSize(50, 50);
        
        const other = new TransformController(mockEntity);
        other.setPosition(100, 100);
        other.setSize(50, 50);
        
        expect(controller.intersects(other)).to.be.false;
      });
      
      it('should detect edge touching', function() {
        controller.setPosition(0, 0);
        controller.setSize(50, 50);
        
        const other = new TransformController(mockEntity);
        other.setPosition(50, 0);
        other.setSize(50, 50);
        
        // Edge touching counts as intersection
        expect(controller.intersects(other)).to.be.true;
      });
    });
  });
  
  describe('Debug Info', function() {
    it('should return comprehensive debug info', function() {
      controller.setPosition(100, 200);
      controller.setSize(64, 128);
      controller.setRotation(45);
      
      const info = controller.getDebugInfo();
      expect(info.position.x).to.equal(100);
      expect(info.size.x).to.equal(64);
      expect(info.rotation).to.equal(45);
      expect(info.center).to.exist;
      expect(info.bounds).to.exist;
      expect(info.isDirty).to.exist;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large coordinates', function() {
      controller.setPosition(1e6, 1e6);
      const pos = controller.getPosition();
      expect(pos.x).to.equal(1e6);
      expect(pos.y).to.equal(1e6);
    });
    
    it('should handle zero size', function() {
      controller.setSize(0, 0);
      const size = controller.getSize();
      expect(size.x).to.equal(0);
      expect(size.y).to.equal(0);
    });
    
    it('should handle entity without stats system', function() {
      mockEntity._stats = null;
      expect(() => controller.setPosition(50, 50)).to.not.throw();
      expect(() => controller.setSize(64, 64)).to.not.throw();
    });
    
    it('should handle multiple 360-degree rotations', function() {
      controller.setRotation(1000);
      expect(controller.getRotation()).to.be.lessThan(360);
    });
  });
});
