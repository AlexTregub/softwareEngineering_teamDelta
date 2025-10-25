const { expect } = require('chai');
const TileInteractionManager = require('../../../Classes/managers/TileInteractionManager.js');

describe('TileInteractionManager', function() {
  let manager;
  let mockObject1, mockObject2, mockUIElement;
  
  beforeEach(function() {
    manager = new TileInteractionManager(32, 20, 15);
    
    // Mock global antManager
    global.antManager = null;
    global.window = { mouseX: 0, mouseY: 0 };
    
    // Create mock game objects
    mockObject1 = {
      id: 'obj1',
      zIndex: 1,
      getPosition: function() { return { x: 50, y: 50 }; },
      sprite: { pos: { x: 50, y: 50 } }
    };
    
    mockObject2 = {
      id: 'obj2',
      zIndex: 5,
      getPosition: function() { return { x: 50, y: 50 }; },
      handleClick: function(x, y, btn) { this.clicked = true; }
    };
    
    mockUIElement = {
      id: 'ui1',
      containsPoint: function(x, y) { 
        return x >= 10 && x <= 100 && y >= 10 && y <= 50; 
      },
      handleClick: function(x, y, btn) { this.clicked = true; }
    };
  });
  
  afterEach(function() {
    // Cleanup globals
    delete global.antManager;
    delete global.window;
  });
  
  describe('Constructor', function() {
    it('should initialize with tile size', function() {
      expect(manager.tileSize).to.equal(32);
    });
    
    it('should initialize with grid dimensions', function() {
      expect(manager.gridWidth).to.equal(20);
      expect(manager.gridHeight).to.equal(15);
    });
    
    it('should initialize empty tile map', function() {
      expect(manager.tileMap).to.be.instanceOf(Map);
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should initialize empty UI elements array', function() {
      expect(manager.uiElements).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with debug disabled', function() {
      expect(manager.debugEnabled).to.be.false;
    });
  });
  
  describe('pixelToTile()', function() {
    it('should convert pixel to tile coordinates', function() {
      const result = manager.pixelToTile(50, 50);
      expect(result.tileX).to.equal(1);
      expect(result.tileY).to.equal(1);
    });
    
    it('should calculate tile center', function() {
      const result = manager.pixelToTile(50, 50);
      expect(result.centerX).to.equal(48); // 1 * 32 + 16
      expect(result.centerY).to.equal(48);
    });
    
    it('should handle 0,0 coordinates', function() {
      const result = manager.pixelToTile(0, 0);
      expect(result.tileX).to.equal(0);
      expect(result.tileY).to.equal(0);
      expect(result.centerX).to.equal(16);
      expect(result.centerY).to.equal(16);
    });
    
    it('should handle negative coordinates', function() {
      const result = manager.pixelToTile(-10, -20);
      expect(result.tileX).to.equal(-1);
      expect(result.tileY).to.equal(-1);
    });
    
    it('should handle large coordinates', function() {
      const result = manager.pixelToTile(1000, 2000);
      expect(result.tileX).to.equal(31);
      expect(result.tileY).to.equal(62);
    });
    
    it('should handle fractional coordinates', function() {
      const result = manager.pixelToTile(45.7, 67.3);
      expect(result.tileX).to.equal(1);
      expect(result.tileY).to.equal(2);
    });
  });
  
  describe('getTileKey()', function() {
    it('should create tile key string', function() {
      const key = manager.getTileKey(5, 10);
      expect(key).to.equal('5,10');
    });
    
    it('should handle 0,0 coordinates', function() {
      const key = manager.getTileKey(0, 0);
      expect(key).to.equal('0,0');
    });
    
    it('should handle negative coordinates', function() {
      const key = manager.getTileKey(-5, -10);
      expect(key).to.equal('-5,-10');
    });
    
    it('should create unique keys for different tiles', function() {
      const key1 = manager.getTileKey(1, 2);
      const key2 = manager.getTileKey(2, 1);
      expect(key1).to.not.equal(key2);
    });
  });
  
  describe('isValidTile()', function() {
    it('should return true for valid tiles', function() {
      expect(manager.isValidTile(0, 0)).to.be.true;
      expect(manager.isValidTile(10, 7)).to.be.true;
      expect(manager.isValidTile(19, 14)).to.be.true;
    });
    
    it('should return false for negative coordinates', function() {
      expect(manager.isValidTile(-1, 0)).to.be.false;
      expect(manager.isValidTile(0, -1)).to.be.false;
    });
    
    it('should return false for out-of-bounds coordinates', function() {
      expect(manager.isValidTile(20, 0)).to.be.false;
      expect(manager.isValidTile(0, 15)).to.be.false;
      expect(manager.isValidTile(100, 100)).to.be.false;
    });
    
    it('should validate upper bounds correctly', function() {
      expect(manager.isValidTile(19, 14)).to.be.true;
      expect(manager.isValidTile(20, 14)).to.be.false;
      expect(manager.isValidTile(19, 15)).to.be.false;
    });
  });
  
  describe('addObjectToTile()', function() {
    it('should add object to tile', function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(mockObject1);
    });
    
    it('should not add to invalid tile', function() {
      manager.addObjectToTile(mockObject1, -1, -1);
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should not add duplicate objects', function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects.length).to.equal(1);
    });
    
    it('should sort objects by z-index', function() {
      manager.addObjectToTile(mockObject1, 5, 5); // z-index 1
      manager.addObjectToTile(mockObject2, 5, 5); // z-index 5
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects[0]).to.equal(mockObject2); // Higher z-index first
    });
    
    it('should handle objects with no z-index', function() {
      const noZIndex = { id: 'noZ' };
      manager.addObjectToTile(noZIndex, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(noZIndex);
    });
    
    it('should add to multiple tiles', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject1, 2, 2);
      expect(manager.getObjectsInTile(1, 1)).to.include(mockObject1);
      expect(manager.getObjectsInTile(2, 2)).to.include(mockObject1);
    });
  });
  
  describe('removeObjectFromTile()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject2, 5, 5);
    });
    
    it('should remove object from tile', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.not.include(mockObject1);
    });
    
    it('should keep other objects in tile', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.include(mockObject2);
    });
    
    it('should clean up empty tiles', function() {
      manager.removeObjectFromTile(mockObject1, 5, 5);
      manager.removeObjectFromTile(mockObject2, 5, 5);
      expect(manager.tileMap.has('5,5')).to.be.false;
    });
    
    it('should handle removing non-existent object', function() {
      const nonExistent = { id: 'none' };
      expect(() => manager.removeObjectFromTile(nonExistent, 5, 5)).to.not.throw();
    });
    
    it('should handle removing from non-existent tile', function() {
      expect(() => manager.removeObjectFromTile(mockObject1, 10, 10)).to.not.throw();
    });
  });
  
  describe('updateObjectPosition()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
    });
    
    it('should move object to new tile', function() {
      manager.updateObjectPosition(mockObject1, 5, 5, 10, 10);
      expect(manager.getObjectsInTile(5, 5)).to.not.include(mockObject1);
      expect(manager.getObjectsInTile(10, 10)).to.include(mockObject1);
    });
    
    it('should handle undefined old coordinates', function() {
      manager.updateObjectPosition(mockObject2, undefined, undefined, 7, 7);
      expect(manager.getObjectsInTile(7, 7)).to.include(mockObject2);
    });
    
    it('should work with debug enabled', function() {
      manager.setDebugEnabled(true);
      expect(() => manager.updateObjectPosition(mockObject1, 5, 5, 6, 6)).to.not.throw();
    });
  });
  
  describe('getObjectsAtPixel()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 1, 1);
    });
    
    it('should return objects at pixel location', function() {
      const objects = manager.getObjectsAtPixel(48, 48); // Tile 1,1
      expect(objects).to.include(mockObject1);
    });
    
    it('should return empty array for empty tile', function() {
      const objects = manager.getObjectsAtPixel(200, 200);
      expect(objects).to.be.an('array').that.is.empty;
    });
    
    it('should handle edge coordinates', function() {
      const objects = manager.getObjectsAtPixel(32, 32); // Tile 1,1
      expect(objects).to.include(mockObject1);
    });
  });
  
  describe('getObjectsInTile()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 5, 5);
      manager.addObjectToTile(mockObject2, 5, 5);
    });
    
    it('should return all objects in tile', function() {
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.have.lengthOf(2);
      expect(objects).to.include(mockObject1);
      expect(objects).to.include(mockObject2);
    });
    
    it('should return empty array for empty tile', function() {
      const objects = manager.getObjectsInTile(10, 10);
      expect(objects).to.be.an('array').that.is.empty;
    });
    
    it('should return objects sorted by z-index', function() {
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects[0].zIndex).to.be.greaterThan(objects[1].zIndex);
    });
  });
  
  describe('registerUIElement()', function() {
    it('should register UI element', function() {
      manager.registerUIElement(mockUIElement);
      expect(manager.uiElements).to.have.lengthOf(1);
    });
    
    it('should register with priority', function() {
      manager.registerUIElement(mockUIElement, 10);
      expect(manager.uiElements[0].priority).to.equal(10);
    });
    
    it('should default priority to 0', function() {
      manager.registerUIElement(mockUIElement);
      expect(manager.uiElements[0].priority).to.equal(0);
    });
    
    it('should sort by priority descending', function() {
      const ui1 = { id: 'ui1' };
      const ui2 = { id: 'ui2' };
      const ui3 = { id: 'ui3' };
      
      manager.registerUIElement(ui1, 5);
      manager.registerUIElement(ui2, 10);
      manager.registerUIElement(ui3, 1);
      
      expect(manager.uiElements[0].priority).to.equal(10);
      expect(manager.uiElements[1].priority).to.equal(5);
      expect(manager.uiElements[2].priority).to.equal(1);
    });
    
    it('should register multiple UI elements', function() {
      manager.registerUIElement(mockUIElement);
      manager.registerUIElement({ id: 'ui2' });
      expect(manager.uiElements).to.have.lengthOf(2);
    });
  });
  
  describe('unregisterUIElement()', function() {
    beforeEach(function() {
      manager.registerUIElement(mockUIElement);
    });
    
    it('should remove UI element', function() {
      manager.unregisterUIElement(mockUIElement);
      expect(manager.uiElements).to.be.empty;
    });
    
    it('should handle removing non-existent element', function() {
      const nonExistent = { id: 'none' };
      expect(() => manager.unregisterUIElement(nonExistent)).to.not.throw();
    });
    
    it('should keep other elements', function() {
      const ui2 = { id: 'ui2' };
      manager.registerUIElement(ui2);
      manager.unregisterUIElement(mockUIElement);
      expect(manager.uiElements).to.have.lengthOf(1);
    });
  });
  
  describe('handleMouseClick()', function() {
    it('should prioritize UI elements', function() {
      manager.registerUIElement(mockUIElement);
      const result = manager.handleMouseClick(50, 30, 'LEFT');
      expect(mockUIElement.clicked).to.be.true;
      expect(result.entityClicked).to.be.false;
    });
    
    it('should handle object clicks', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      const result = manager.handleMouseClick(48, 48, 'LEFT');
      expect(mockObject2.clicked).to.be.true;
      expect(result.entityClicked).to.be.true;
    });
    
    it('should return tile center for valid clicks', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      const result = manager.handleMouseClick(48, 48, 'LEFT');
      expect(result.tileCenter).to.have.property('x');
      expect(result.tileCenter).to.have.property('y');
    });
    
    it('should handle clicks on empty tiles', function() {
      const result = manager.handleMouseClick(200, 200, 'LEFT');
      expect(result.entityClicked).to.be.false;
    });
    
    it('should handle invalid tile clicks', function() {
      const result = manager.handleMouseClick(-10, -10, 'LEFT');
      expect(result.tileCenter).to.be.null;
    });
    
    it('should handle different mouse buttons', function() {
      manager.addObjectToTile(mockObject2, 1, 1);
      manager.handleMouseClick(48, 48, 'RIGHT');
      expect(mockObject2.clicked).to.be.true;
    });
    
    it('should work with debug enabled', function() {
      manager.setDebugEnabled(true);
      expect(() => manager.handleMouseClick(100, 100, 'LEFT')).to.not.throw();
    });
  });
  
  describe('handleMouseRelease()', function() {
    it('should check objects at pixel', function() {
      const mockWithController = {
        _interactionController: {
          handleMouseRelease: function(x, y, btn) { 
            this.released = true;
            return true;
          }
        }
      };
      manager.addObjectToTile(mockWithController, 1, 1);
      
      const result = manager.handleMouseRelease(48, 48, 'LEFT');
      expect(result).to.be.true;
    });
    
    it('should return false when no objects handle release', function() {
      const result = manager.handleMouseRelease(200, 200, 'LEFT');
      expect(result).to.be.false;
    });
  });
  
  describe('handleTileClick()', function() {
    it('should be overridable', function() {
      const result = manager.handleTileClick(5, 5, 160, 160, 'LEFT');
      expect(result).to.be.a('boolean');
    });
    
    it('should handle different buttons', function() {
      manager.handleTileClick(5, 5, 160, 160, 'RIGHT');
      // Should not throw
    });
  });
  
  describe('setDebugEnabled()', function() {
    it('should enable debug mode', function() {
      manager.setDebugEnabled(true);
      expect(manager.debugEnabled).to.be.true;
    });
    
    it('should disable debug mode', function() {
      manager.setDebugEnabled(true);
      manager.setDebugEnabled(false);
      expect(manager.debugEnabled).to.be.false;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information', function() {
      const info = manager.getDebugInfo();
      expect(info).to.have.property('occupiedTiles');
      expect(info).to.have.property('totalObjects');
      expect(info).to.have.property('uiElements');
      expect(info).to.have.property('gridSize');
      expect(info).to.have.property('tileSize');
    });
    
    it('should count occupied tiles correctly', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 2, 2);
      const info = manager.getDebugInfo();
      expect(info.occupiedTiles).to.equal(2);
    });
    
    it('should count total objects correctly', function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 1, 1);
      const info = manager.getDebugInfo();
      expect(info.totalObjects).to.equal(2);
    });
    
    it('should count UI elements', function() {
      manager.registerUIElement(mockUIElement);
      const info = manager.getDebugInfo();
      expect(info.uiElements).to.equal(1);
    });
    
    it('should include grid size', function() {
      const info = manager.getDebugInfo();
      expect(info.gridSize).to.equal('20x15');
    });
  });
  
  describe('clear()', function() {
    beforeEach(function() {
      manager.addObjectToTile(mockObject1, 1, 1);
      manager.addObjectToTile(mockObject2, 2, 2);
      manager.registerUIElement(mockUIElement);
    });
    
    it('should clear all objects', function() {
      manager.clear();
      expect(manager.tileMap.size).to.equal(0);
    });
    
    it('should clear UI elements', function() {
      manager.clear();
      expect(manager.uiElements).to.be.empty;
    });
    
    it('should result in empty debug info', function() {
      manager.clear();
      const info = manager.getDebugInfo();
      expect(info.occupiedTiles).to.equal(0);
      expect(info.totalObjects).to.equal(0);
      expect(info.uiElements).to.equal(0);
    });
  });
  
  describe('addObject()', function() {
    it('should add object at its position', function() {
      manager.addObject(mockObject1);
      const { tileX, tileY } = manager.pixelToTile(50, 50);
      const objects = manager.getObjectsInTile(tileX, tileY);
      expect(objects).to.include(mockObject1);
    });
    
    it('should handle null object', function() {
      expect(() => manager.addObject(null)).to.not.throw();
    });
    
    it('should handle object without position', function() {
      const noPos = { id: 'noPos' };
      expect(() => manager.addObject(noPos)).to.not.throw();
    });
    
    it('should use getPosition if available', function() {
      const withGetPos = {
        id: 'hasGetPos',
        getPosition: () => ({ x: 100, y: 100 })
      };
      manager.addObject(withGetPos);
      const { tileX, tileY } = manager.pixelToTile(100, 100);
      expect(manager.getObjectsInTile(tileX, tileY)).to.include(withGetPos);
    });
    
    it('should use sprite.pos as fallback', function() {
      const withSprite = {
        id: 'hasSprite',
        sprite: { pos: { x: 150, y: 150 } }
      };
      manager.addObject(withSprite);
      const { tileX, tileY } = manager.pixelToTile(150, 150);
      expect(manager.getObjectsInTile(tileX, tileY)).to.include(withSprite);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large grid', function() {
      const bigManager = new TileInteractionManager(32, 1000, 1000);
      bigManager.addObjectToTile(mockObject1, 500, 500);
      expect(bigManager.getObjectsInTile(500, 500)).to.include(mockObject1);
    });
    
    it('should handle small tile size', function() {
      const smallTile = new TileInteractionManager(1, 100, 100);
      const result = smallTile.pixelToTile(50, 50);
      expect(result.tileX).to.equal(50);
      expect(result.tileY).to.equal(50);
    });
    
    it('should handle many objects in one tile', function() {
      for (let i = 0; i < 100; i++) {
        manager.addObjectToTile({ id: `obj${i}`, zIndex: i }, 5, 5);
      }
      const objects = manager.getObjectsInTile(5, 5);
      expect(objects).to.have.lengthOf(100);
    });
    
    it('should handle rapid add/remove cycles', function() {
      for (let i = 0; i < 50; i++) {
        manager.addObjectToTile(mockObject1, 5, 5);
        manager.removeObjectFromTile(mockObject1, 5, 5);
      }
      expect(manager.getObjectsInTile(5, 5)).to.be.empty;
    });
  });
});
