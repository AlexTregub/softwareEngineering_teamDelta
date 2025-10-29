const { expect } = require('chai');
const path = require('path');

describe('EntityAccessor', () => {
  let EntityAccessor;
  
  before(() => {
    // Load the class
    EntityAccessor = require(path.resolve(__dirname, '../../../Classes/rendering/EntityAccessor.js'));
  });
  
  describe('getPosition()', () => {
    it('should return default position for null entity', () => {
      const pos = EntityAccessor.getPosition(null);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should return default position for undefined entity', () => {
      const pos = EntityAccessor.getPosition(undefined);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should use getPosition() method when available', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 })
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should use position property when getPosition not available', () => {
      const entity = {
        position: { x: 150, y: 250 }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 150, y: 250 });
    });
    
    it('should prefer getPosition() over position property', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 }),
        position: { x: 150, y: 250 }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });
    
    it('should use _sprite.pos when position not available', () => {
      const entity = {
        _sprite: {
          pos: { x: 175, y: 275 }
        }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 175, y: 275 });
    });
    
    it('should use sprite.pos when _sprite not available', () => {
      const entity = {
        sprite: {
          pos: { x: 185, y: 285 }
        }
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 185, y: 285 });
    });
    
    it('should use posX/posY properties as fallback', () => {
      const entity = {
        posX: 200,
        posY: 300
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 200, y: 300 });
    });
    
    it('should use x/y properties as final fallback', () => {
      const entity = {
        x: 225,
        y: 325
      };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 225, y: 325 });
    });
    
    it('should handle entity with only x coordinate', () => {
      const entity = { x: 100 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 }); // Both must be defined
    });
    
    it('should handle entity with only y coordinate', () => {
      const entity = { y: 200 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 }); // Both must be defined
    });
    
    it('should handle zero coordinates', () => {
      const entity = { x: 0, y: 0 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should handle negative coordinates', () => {
      const entity = { x: -50, y: -100 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: -50, y: -100 });
    });
    
    it('should handle very large coordinates', () => {
      const entity = { x: 999999, y: 888888 };
      const pos = EntityAccessor.getPosition(entity);
      expect(pos).to.deep.equal({ x: 999999, y: 888888 });
    });
  });
  
  describe('getSize()', () => {
    it('should return default size for null entity', () => {
      const size = EntityAccessor.getSize(null);
      expect(size).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should return default size for undefined entity', () => {
      const size = EntityAccessor.getSize(undefined);
      expect(size).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should use getSize() method when available', () => {
      const entity = {
        getSize: () => ({ x: 50, y: 60 })
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 50, y: 60 });
    });
    
    it('should use size property with x/y format', () => {
      const entity = {
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 40, y: 45 });
    });
    
    it('should use size property with width/height format', () => {
      const entity = {
        size: { width: 55, height: 65 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 55, y: 65 });
    });
    
    it('should prefer x/y over width/height in size property', () => {
      const entity = {
        size: { x: 40, y: 45, width: 55, height: 65 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 40, y: 45 });
    });
    
    it('should prefer getSize() over size property', () => {
      const entity = {
        getSize: () => ({ x: 50, y: 60 }),
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 50, y: 60 });
    });
    
    it('should use _sprite.size when size not available', () => {
      const entity = {
        _sprite: {
          size: { x: 35, y: 38 }
        }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 35, y: 38 });
    });
    
    it('should use sprite.size when _sprite not available', () => {
      const entity = {
        sprite: {
          size: { x: 42, y: 48 }
        }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 42, y: 48 });
    });
    
    it('should use sizeX/sizeY properties as fallback', () => {
      const entity = {
        sizeX: 70,
        sizeY: 80
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 70, y: 80 });
    });
    
    it('should use width/height properties as final fallback', () => {
      const entity = {
        width: 90,
        height: 100
      };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 90, y: 100 });
    });
    
    it('should handle entity with only width', () => {
      const entity = { width: 50 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 20, y: 20 }); // Both must be defined
    });
    
    it('should handle entity with only height', () => {
      const entity = { height: 60 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 20, y: 20 }); // Both must be defined
    });
    
    it('should handle zero size', () => {
      const entity = { width: 0, height: 0 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 0, y: 0 });
    });
    
    it('should handle very large size', () => {
      const entity = { width: 5000, height: 6000 };
      const size = EntityAccessor.getSize(entity);
      expect(size).to.deep.equal({ x: 5000, y: 6000 });
    });
    
    it('should handle partial size property (x only)', () => {
      const entity = {
        size: { x: 30 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size.x).to.equal(30);
      expect(size.y).to.equal(20); // Default
    });
    
    it('should handle partial size property (y only)', () => {
      const entity = {
        size: { y: 35 }
      };
      const size = EntityAccessor.getSize(entity);
      expect(size.x).to.equal(20); // Default
      expect(size.y).to.equal(35);
    });
  });
  
  describe('getSizeWH()', () => {
    it('should return size with width/height properties', () => {
      const entity = { width: 50, height: 60 };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 50);
      expect(size).to.have.property('height', 60);
    });
    
    it('should convert x/y to width/height', () => {
      const entity = {
        size: { x: 40, y: 45 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 40);
      expect(size).to.have.property('height', 45);
    });
    
    it('should return default size in width/height format', () => {
      const size = EntityAccessor.getSizeWH(null);
      expect(size).to.have.property('width', 20);
      expect(size).to.have.property('height', 20);
    });
    
    it('should handle mixed format (x and height)', () => {
      const entity = {
        size: { x: 35, height: 42 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 35);
      expect(size).to.have.property('height', 42);
    });
    
    it('should handle mixed format (width and y)', () => {
      const entity = {
        size: { width: 38, y: 48 }
      };
      const size = EntityAccessor.getSizeWH(entity);
      expect(size).to.have.property('width', 38);
      expect(size).to.have.property('height', 48);
    });
  });
  
  describe('getCenter()', () => {
    it('should calculate center from position and size', () => {
      const entity = {
        x: 100,
        y: 200,
        width: 50,
        height: 60
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 125, y: 230 });
    });
    
    it('should use default values for null entity', () => {
      const center = EntityAccessor.getCenter(null);
      expect(center).to.deep.equal({ x: 10, y: 10 }); // 0 + 20/2
    });
    
    it('should handle zero position', () => {
      const entity = { x: 0, y: 0, width: 40, height: 40 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should handle negative position', () => {
      const entity = { x: -50, y: -100, width: 30, height: 40 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: -35, y: -80 });
    });
    
    it('should handle odd sizes correctly', () => {
      const entity = { x: 100, y: 200, width: 51, height: 61 };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 125.5, y: 230.5 });
    });
    
    it('should work with getPosition/getSize methods', () => {
      const entity = {
        getPosition: () => ({ x: 150, y: 250 }),
        getSize: () => ({ x: 80, y: 100 })
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center).to.deep.equal({ x: 190, y: 300 });
    });
  });
  
  describe('hasPosition()', () => {
    it('should return false for null entity', () => {
      expect(EntityAccessor.hasPosition(null)).to.be.false;
    });
    
    it('should return false for undefined entity', () => {
      expect(EntityAccessor.hasPosition(undefined)).to.be.false;
    });
    
    it('should return true when getPosition exists', () => {
      const entity = { getPosition: () => ({}) };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when position property exists', () => {
      const entity = { position: { x: 0, y: 0 } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when _sprite.pos exists', () => {
      const entity = { _sprite: { pos: { x: 0, y: 0 } } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when sprite.pos exists', () => {
      const entity = { sprite: { pos: { x: 0, y: 0 } } };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when posX/posY exist', () => {
      const entity = { posX: 0, posY: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return true when x/y exist', () => {
      const entity = { x: 0, y: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
    
    it('should return false when only x exists', () => {
      const entity = { x: 100 };
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return false when only y exists', () => {
      const entity = { y: 200 };
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return false for empty object', () => {
      const entity = {};
      expect(EntityAccessor.hasPosition(entity)).to.be.false;
    });
    
    it('should return true for x/y even if zero', () => {
      const entity = { x: 0, y: 0 };
      expect(EntityAccessor.hasPosition(entity)).to.be.true;
    });
  });
  
  describe('hasSize()', () => {
    it('should return false for null entity', () => {
      expect(EntityAccessor.hasSize(null)).to.be.false;
    });
    
    it('should return false for undefined entity', () => {
      expect(EntityAccessor.hasSize(undefined)).to.be.false;
    });
    
    it('should return true when getSize exists', () => {
      const entity = { getSize: () => ({}) };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when size property exists', () => {
      const entity = { size: { x: 20, y: 20 } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when _sprite.size exists', () => {
      const entity = { _sprite: { size: { x: 20, y: 20 } } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when sprite.size exists', () => {
      const entity = { sprite: { size: { x: 20, y: 20 } } };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when sizeX/sizeY exist', () => {
      const entity = { sizeX: 20, sizeY: 20 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return true when width/height exist', () => {
      const entity = { width: 20, height: 20 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
    
    it('should return false when only width exists', () => {
      const entity = { width: 50 };
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return false when only height exists', () => {
      const entity = { height: 60 };
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return false for empty object', () => {
      const entity = {};
      expect(EntityAccessor.hasSize(entity)).to.be.false;
    });
    
    it('should return true for width/height even if zero', () => {
      const entity = { width: 0, height: 0 };
      expect(EntityAccessor.hasSize(entity)).to.be.true;
    });
  });
  
  describe('getBounds()', () => {
    it('should return bounds with x, y, width, height', () => {
      const entity = { x: 100, y: 200, width: 50, height: 60 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 100,
        y: 200,
        width: 50,
        height: 60
      });
    });
    
    it('should use default values for null entity', () => {
      const bounds = EntityAccessor.getBounds(null);
      expect(bounds).to.deep.equal({
        x: 0,
        y: 0,
        width: 20,
        height: 20
      });
    });
    
    it('should handle getPosition/getSize methods', () => {
      const entity = {
        getPosition: () => ({ x: 150, y: 250 }),
        getSize: () => ({ x: 80, y: 100 })
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 150,
        y: 250,
        width: 80,
        height: 100
      });
    });
    
    it('should handle negative coordinates', () => {
      const entity = { x: -50, y: -100, width: 30, height: 40 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: -50,
        y: -100,
        width: 30,
        height: 40
      });
    });
    
    it('should handle zero size', () => {
      const entity = { x: 100, y: 200, width: 0, height: 0 };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 100,
        y: 200,
        width: 0,
        height: 0
      });
    });
    
    it('should handle position from one source and size from another', () => {
      const entity = {
        position: { x: 120, y: 180 },
        width: 45,
        height: 55
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds).to.deep.equal({
        x: 120,
        y: 180,
        width: 45,
        height: 55
      });
    });
  });
  
  describe('Fallback Chain Priority', () => {
    it('should follow correct position priority chain', () => {
      const entity = {
        getPosition: () => ({ x: 1, y: 1 }),
        position: { x: 2, y: 2 },
        _sprite: { pos: { x: 3, y: 3 } },
        sprite: { pos: { x: 4, y: 4 } },
        posX: 5, posY: 5,
        x: 6, y: 6
      };
      
      // Should use getPosition (highest priority)
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 1, y: 1 });
      
      // Remove getPosition, should use position
      delete entity.getPosition;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 2, y: 2 });
      
      // Remove position, should use _sprite.pos
      delete entity.position;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 3, y: 3 });
      
      // Remove _sprite, should use sprite.pos
      delete entity._sprite;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 4, y: 4 });
      
      // Remove sprite, should use posX/posY
      delete entity.sprite;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 5, y: 5 });
      
      // Remove posX/posY, should use x/y
      delete entity.posX;
      delete entity.posY;
      expect(EntityAccessor.getPosition(entity)).to.deep.equal({ x: 6, y: 6 });
    });
    
    it('should follow correct size priority chain', () => {
      const entity = {
        getSize: () => ({ x: 1, y: 1 }),
        size: { x: 2, y: 2 },
        _sprite: { size: { x: 3, y: 3 } },
        sprite: { size: { x: 4, y: 4 } },
        sizeX: 5, sizeY: 5,
        width: 6, height: 6
      };
      
      // Should use getSize (highest priority)
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 1, y: 1 });
      
      // Remove getSize, should use size
      delete entity.getSize;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 2, y: 2 });
      
      // Remove size, should use _sprite.size
      delete entity.size;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 3, y: 3 });
      
      // Remove _sprite, should use sprite.size
      delete entity._sprite;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 4, y: 4 });
      
      // Remove sprite, should use sizeX/sizeY
      delete entity.sprite;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 5, y: 5 });
      
      // Remove sizeX/sizeY, should use width/height
      delete entity.sizeX;
      delete entity.sizeY;
      expect(EntityAccessor.getSize(entity)).to.deep.equal({ x: 6, y: 6 });
    });
  });
  
  describe('Edge Cases and Integration', () => {
    it('should handle entity with mixed position/size formats', () => {
      const entity = {
        getPosition: () => ({ x: 100, y: 200 }),
        size: { width: 50, height: 60 }
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds.x).to.equal(100);
      expect(bounds.y).to.equal(200);
      expect(bounds.width).to.equal(50);
      expect(bounds.height).to.equal(60);
    });
    
    it('should handle entity with partial sprite data', () => {
      const entity = {
        _sprite: { pos: { x: 150, y: 250 } },
        width: 70,
        height: 80
      };
      const pos = EntityAccessor.getPosition(entity);
      const size = EntityAccessor.getSize(entity);
      expect(pos).to.deep.equal({ x: 150, y: 250 });
      expect(size).to.deep.equal({ x: 70, y: 80 });
    });
    
    it('should handle entity with function-based properties', () => {
      let callCount = 0;
      const entity = {
        getPosition: () => {
          callCount++;
          return { x: 100, y: 200 };
        },
        getSize: () => {
          callCount++;
          return { x: 50, y: 60 };
        }
      };
      
      EntityAccessor.getBounds(entity);
      expect(callCount).to.equal(2); // Both methods called once
    });
    
    it('should handle very large numbers without precision loss', () => {
      const entity = {
        x: 9999999.5,
        y: 8888888.25,
        width: 1000000.75,
        height: 2000000.125
      };
      const bounds = EntityAccessor.getBounds(entity);
      expect(bounds.x).to.equal(9999999.5);
      expect(bounds.y).to.equal(8888888.25);
      expect(bounds.width).to.equal(1000000.75);
      expect(bounds.height).to.equal(2000000.125);
    });
    
    it('should handle fractional coordinates and sizes', () => {
      const entity = {
        x: 100.5,
        y: 200.75,
        width: 50.25,
        height: 60.125
      };
      const center = EntityAccessor.getCenter(entity);
      expect(center.x).to.equal(125.625);
      expect(center.y).to.equal(230.8125);
    });
  });
});
