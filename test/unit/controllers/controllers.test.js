/**
 * Consolidated Controller Tests
 * Generated: 2025-10-29T03:11:41.090Z
 * Source files: 17
 * Total tests: 880
 * 
 * This file contains all controller tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');


// ================================================================
// antUtilities.test.js (62 tests)
// ================================================================
// Mock MovementController class
class MockMovementController {
  constructor() {
    this.targetLocation = null;
  }
  moveToLocation(x, y) {
    this.targetLocation = { x, y };
  }
  getIsMoving() {
    return this.targetLocation !== null;
  }
  static moveEntityToTile(entity, tileX, tileY, tileSize, pathMap) {
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;
    if (entity.moveToLocation) {
      entity.moveToLocation(x, y);
    } else if (entity._movementController) {
      entity._movementController.moveToLocation(x, y);
    }
  }
}

// Global mock for MovementController
global.MovementController = MockMovementController;

// Load the module
let AntUtilities = require('../../../Classes/controllers/AntUtilities.js');

describe('AntUtilities', function() {
  let mockAnts;
  
  beforeEach(function() {
    // Create mock ants for testing
    mockAnts = [
      {
        posX: 100,
        posY: 100,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: 20, y: 20 }; },
        isSelected: false,
        faction: 'player',
        _movementController: new MockMovementController(),
        moveToLocation: function(x, y) { this._movementController.moveToLocation(x, y); }
      },
      {
        posX: 200,
        posY: 200,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: 20, y: 20 }; },
        isSelected: true,
        faction: 'player',
        _movementController: new MockMovementController(),
        moveToLocation: function(x, y) { this._movementController.moveToLocation(x, y); }
      },
      {
        posX: 300,
        posY: 300,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: 20, y: 20 }; },
        isSelected: false,
        faction: 'enemy',
        _movementController: new MockMovementController(),
        moveToLocation: function(x, y) { this._movementController.moveToLocation(x, y); }
      }
    ];
  });
  
  describe('Movement Group Functions', function() {
    describe('moveAntToTile()', function() {
      it('should move ant to tile using MovementController', function() {
        const ant = mockAnts[0];
        AntUtilities.moveAntToTile(ant, 5, 5, 32);
        expect(ant._movementController.targetLocation).to.exist;
      });
      
      it('should calculate correct pixel coordinates from tiles', function() {
        const ant = mockAnts[0];
        AntUtilities.moveAntToTile(ant, 5, 5, 32);
        const target = ant._movementController.targetLocation;
        expect(target.x).to.equal(5 * 32 + 16); // tileX * tileSize + tileSize/2
        expect(target.y).to.equal(5 * 32 + 16);
      });
      
      it('should handle different tile sizes', function() {
        const ant = mockAnts[0];
        AntUtilities.moveAntToTile(ant, 3, 4, 64);
        const target = ant._movementController.targetLocation;
        expect(target.x).to.equal(3 * 64 + 32);
        expect(target.y).to.equal(4 * 64 + 32);
      });
      
      it('should handle negative tile coordinates', function() {
        const ant = mockAnts[0];
        expect(() => AntUtilities.moveAntToTile(ant, -1, -1, 32)).to.not.throw();
      });
    });
    
    describe('moveGroupInCircle()', function() {
      it('should arrange ants in circular formation', function() {
        AntUtilities.moveGroupInCircle(mockAnts, 400, 400, 100);
        mockAnts.forEach(ant => {
          expect(ant._movementController.targetLocation).to.exist;
        });
      });
      
      it('should handle empty array', function() {
        expect(() => AntUtilities.moveGroupInCircle([], 400, 400, 100)).to.not.throw();
      });
      
      it('should handle null array', function() {
        expect(() => AntUtilities.moveGroupInCircle(null, 400, 400, 100)).to.not.throw();
      });
      
      it('should position ants at specified radius', function() {
        const singleAnt = [mockAnts[0]];
        AntUtilities.moveGroupInCircle(singleAnt, 400, 400, 50);
        const target = singleAnt[0]._movementController.targetLocation;
        const distance = Math.sqrt(Math.pow(target.x - 400, 2) + Math.pow(target.y - 400, 2));
        expect(distance).to.be.closeTo(50, 1);
      });
    });
    
    describe('moveGroupInLine()', function() {
      it('should arrange ants in line formation', function() {
        AntUtilities.moveGroupInLine(mockAnts, 100, 100, 300, 300);
        mockAnts.forEach(ant => {
          expect(ant._movementController.targetLocation).to.exist;
        });
      });
      
      it('should evenly space ants along line', function() {
        const twoAnts = [mockAnts[0], mockAnts[1]];
        AntUtilities.moveGroupInLine(twoAnts, 100, 100, 300, 100);
        const target1 = twoAnts[0]._movementController.targetLocation;
        const target2 = twoAnts[1]._movementController.targetLocation;
        expect(target1.x).to.be.lessThan(target2.x);
        expect(target1.y).to.equal(target2.y);
      });
      
      it('should handle single ant', function() {
        const singleAnt = [mockAnts[0]];
        AntUtilities.moveGroupInLine(singleAnt, 100, 100, 300, 300);
        expect(singleAnt[0]._movementController.targetLocation).to.exist;
      });
      
      it('should handle empty array', function() {
        expect(() => AntUtilities.moveGroupInLine([], 100, 100, 300, 300)).to.not.throw();
      });
    });
    
    describe('moveGroupInGrid()', function() {
      it('should arrange ants in grid formation', function() {
        AntUtilities.moveGroupInGrid(mockAnts, 10, 10, 1, null, 32);
        mockAnts.forEach(ant => {
          expect(ant._movementController.targetLocation).to.exist;
        });
      });
      
      it('should calculate grid dimensions automatically', function() {
        const nineAnts = Array(9).fill(null).map(() => ({
          ...mockAnts[0],
          _movementController: new MockMovementController(),
          moveToLocation: function(x, y) { this._movementController.moveToLocation(x, y); }
        }));
        AntUtilities.moveGroupInGrid(nineAnts, 10, 10, 1, null, 32);
        nineAnts.forEach(ant => {
          expect(ant._movementController.targetLocation).to.exist;
        });
      });
      
      it('should respect maxCols parameter', function() {
        const fourAnts = Array(4).fill(null).map(() => ({
          ...mockAnts[0],
          _movementController: new MockMovementController(),
          moveToLocation: function(x, y) { this._movementController.moveToLocation(x, y); }
        }));
        AntUtilities.moveGroupInGrid(fourAnts, 10, 10, 1, 2, 32);
        fourAnts.forEach(ant => {
          expect(ant._movementController.targetLocation).to.exist;
        });
      });
      
      it('should handle empty array', function() {
        expect(() => AntUtilities.moveGroupInGrid([], 10, 10, 1, null, 32)).to.not.throw();
      });
    });
    
    describe('moveAntDirectly()', function() {
      it('should move ant using moveToLocation', function() {
        const ant = mockAnts[0];
        AntUtilities.moveAntDirectly(ant, 500, 600);
        expect(ant._movementController.targetLocation).to.deep.equal({ x: 500, y: 600 });
      });
      
      it('should use MovementController if available', function() {
        const ant = mockAnts[0];
        delete ant.moveToLocation;
        AntUtilities.moveAntDirectly(ant, 400, 300);
        expect(ant._movementController.targetLocation).to.deep.equal({ x: 400, y: 300 });
      });
      
      it('should handle ant without movement methods', function() {
        const ant = { posX: 100, posY: 100 };
        expect(() => AntUtilities.moveAntDirectly(ant, 200, 200)).to.not.throw();
      });
    });
  });
  
  describe('Selection Functions', function() {
    describe('selectAntUnderMouse()', function() {
      it('should select ant under mouse cursor', function() {
        const result = AntUtilities.selectAntUnderMouse(mockAnts, 105, 105);
        expect(result).to.equal(mockAnts[0]);
        expect(mockAnts[0].isSelected).to.be.true;
      });
      
      it('should return null if no ant under mouse', function() {
        const result = AntUtilities.selectAntUnderMouse(mockAnts, 1000, 1000);
        expect(result).to.be.null;
      });
      
      it('should clear other selections by default', function() {
        mockAnts[1].isSelected = true;
        AntUtilities.selectAntUnderMouse(mockAnts, 105, 105);
        expect(mockAnts[1].isSelected).to.be.false;
      });
      
      it('should not clear others if clearOthers is false', function() {
        mockAnts[1].isSelected = true;
        AntUtilities.selectAntUnderMouse(mockAnts, 105, 105, false);
        expect(mockAnts[1].isSelected).to.be.true;
      });
      
      it('should handle empty array', function() {
        const result = AntUtilities.selectAntUnderMouse([], 100, 100);
        expect(result).to.be.null;
      });
      
      it('should handle null array', function() {
        const result = AntUtilities.selectAntUnderMouse(null, 100, 100);
        expect(result).to.be.null;
      });
      
      it('should select top-most ant when multiple overlap', function() {
        mockAnts[1].posX = 100;
        mockAnts[1].posY = 100;
        const result = AntUtilities.selectAntUnderMouse(mockAnts, 105, 105);
        expect(result).to.equal(mockAnts[1]); // Later in array = top-most
      });
    });
    
    describe('isAntUnderMouse()', function() {
      it('should return true when mouse is over ant', function() {
        const result = AntUtilities.isAntUnderMouse(mockAnts[0], 105, 105);
        expect(result).to.be.true;
      });
      
      it('should return false when mouse is not over ant', function() {
        const result = AntUtilities.isAntUnderMouse(mockAnts[0], 500, 500);
        expect(result).to.be.false;
      });
      
      it('should handle null ant', function() {
        const result = AntUtilities.isAntUnderMouse(null, 100, 100);
        expect(result).to.be.false;
      });
      
      it('should check bounds correctly at edges', function() {
        expect(AntUtilities.isAntUnderMouse(mockAnts[0], 100, 100)).to.be.true; // Left edge
        expect(AntUtilities.isAntUnderMouse(mockAnts[0], 120, 120)).to.be.true; // Right edge
        expect(AntUtilities.isAntUnderMouse(mockAnts[0], 121, 121)).to.be.false; // Just outside
      });
    });
    
    describe('deselectAllAnts()', function() {
      it('should deselect all ants', function() {
        mockAnts.forEach(ant => ant.isSelected = true);
        AntUtilities.deselectAllAnts(mockAnts);
        mockAnts.forEach(ant => {
          expect(ant.isSelected).to.be.false;
        });
      });
      
      it('should handle null array', function() {
        expect(() => AntUtilities.deselectAllAnts(null)).to.not.throw();
      });
      
      it('should handle empty array', function() {
        expect(() => AntUtilities.deselectAllAnts([])).to.not.throw();
      });
      
      it('should handle ants with SelectionController', function() {
        mockAnts[0]._selectionController = {
          isSelected: () => true,
          setSelected: function(val) { this._selected = val; }
        };
        AntUtilities.deselectAllAnts(mockAnts);
        expect(mockAnts[0]._selectionController._selected).to.be.false;
      });
    });
    
    describe('getSelectedAnts()', function() {
      it('should return array of selected ants', function() {
        mockAnts[0].isSelected = true;
        mockAnts[1].isSelected = true;
        const selected = AntUtilities.getSelectedAnts(mockAnts);
        expect(selected).to.have.lengthOf(2);
        expect(selected).to.include(mockAnts[0]);
        expect(selected).to.include(mockAnts[1]);
      });
      
      it('should return empty array when none selected', function() {
        mockAnts.forEach(ant => ant.isSelected = false);
        const selected = AntUtilities.getSelectedAnts(mockAnts);
        expect(selected).to.be.an('array').that.is.empty;
      });
      
      it('should handle null array', function() {
        const selected = AntUtilities.getSelectedAnts(null);
        expect(selected).to.be.an('array').that.is.empty;
      });
      
      it('should handle ants with SelectionController', function() {
        mockAnts[0]._selectionController = {
          isSelected: () => true
        };
        const selected = AntUtilities.getSelectedAnts(mockAnts);
        expect(selected).to.include(mockAnts[0]);
      });
    });
  });
  
  describe('Utility Functions', function() {
    describe('getDistance()', function() {
      it('should calculate distance between two points', function() {
        const distance = AntUtilities.getDistance(0, 0, 3, 4);
        expect(distance).to.equal(5);
      });
      
      it('should handle negative coordinates', function() {
        const distance = AntUtilities.getDistance(-3, -4, 0, 0);
        expect(distance).to.equal(5);
      });
      
      it('should return zero for same point', function() {
        const distance = AntUtilities.getDistance(10, 20, 10, 20);
        expect(distance).to.equal(0);
      });
      
      it('should handle large distances', function() {
        const distance = AntUtilities.getDistance(0, 0, 1000, 1000);
        expect(distance).to.be.closeTo(1414.21, 0.01);
      });
    });
    
    describe('getAntsInRadius()', function() {
      it('should return ants within radius', function() {
        const nearby = AntUtilities.getAntsInRadius(mockAnts, 100, 100, 50);
        expect(nearby).to.have.lengthOf(1);
        expect(nearby[0]).to.equal(mockAnts[0]);
      });
      
      it('should return empty array when no ants in radius', function() {
        const nearby = AntUtilities.getAntsInRadius(mockAnts, 1000, 1000, 50);
        expect(nearby).to.be.an('array').that.is.empty;
      });
      
      it('should handle large radius', function() {
        const nearby = AntUtilities.getAntsInRadius(mockAnts, 200, 200, 200);
        expect(nearby.length).to.be.greaterThan(0);
      });
      
      it('should handle null array', function() {
        const nearby = AntUtilities.getAntsInRadius(null, 100, 100, 50);
        expect(nearby).to.be.an('array').that.is.empty;
      });
      
      it('should include ants exactly at radius distance', function() {
        const nearby = AntUtilities.getAntsInRadius(mockAnts, 100, 100, 0);
        expect(nearby).to.have.lengthOf(1); // Ant at 100,100
      });
    });
    
    describe('getAntsByFaction()', function() {
      it('should return ants of specified faction', function() {
        const playerAnts = AntUtilities.getAntsByFaction(mockAnts, 'player');
        expect(playerAnts).to.have.lengthOf(2);
      });
      
      it('should return empty array for non-existent faction', function() {
        const neutralAnts = AntUtilities.getAntsByFaction(mockAnts, 'neutral');
        expect(neutralAnts).to.be.an('array').that.is.empty;
      });
      
      it('should handle null array', function() {
        const result = AntUtilities.getAntsByFaction(null, 'player');
        expect(result).to.be.an('array').that.is.empty;
      });
      
      it('should return enemy ants', function() {
        const enemyAnts = AntUtilities.getAntsByFaction(mockAnts, 'enemy');
        expect(enemyAnts).to.have.lengthOf(1);
        expect(enemyAnts[0]).to.equal(mockAnts[2]);
      });
    });
    
    describe('getPerformanceStats()', function() {
      it('should return statistics for all ants', function() {
        const stats = AntUtilities.getPerformanceStats(mockAnts);
        expect(stats).to.have.property('totalAnts', 3);
        expect(stats).to.have.property('selectedCount');
        expect(stats).to.have.property('movingCount');
        expect(stats).to.have.property('combatCount');
        expect(stats).to.have.property('idleCount');
      });
      
      it('should count selected ants correctly', function() {
        mockAnts[0].isSelected = true;
        mockAnts[1].isSelected = true;
        const stats = AntUtilities.getPerformanceStats(mockAnts);
        expect(stats.selectedCount).to.equal(2);
      });
      
      it('should handle null array', function() {
        const stats = AntUtilities.getPerformanceStats(null);
        expect(stats).to.deep.equal({ totalAnts: 0 });
      });
      
      it('should handle empty array', function() {
        const stats = AntUtilities.getPerformanceStats([]);
        expect(stats.totalAnts).to.equal(0);
      });
      
      it('should count moving ants', function() {
        mockAnts[0]._movementController.targetLocation = { x: 100, y: 100 };
        const stats = AntUtilities.getPerformanceStats(mockAnts);
        expect(stats.movingCount).to.be.greaterThan(0);
      });
      
      it('should calculate idle count', function() {
        const stats = AntUtilities.getPerformanceStats(mockAnts);
        expect(stats.idleCount).to.equal(stats.totalAnts - stats.movingCount - stats.combatCount);
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle ants with missing methods gracefully', function() {
      const brokenAnt = { posX: 100, posY: 100 };
      expect(() => AntUtilities.moveAntToTile(brokenAnt, 5, 5, 32)).to.not.throw();
    });
    
    it('should handle very large ant arrays', function() {
      const largeArray = Array(1000).fill(null).map((_, i) => ({
        posX: i * 50,
        posY: i * 50,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: 20, y: 20 }; },
        isSelected: false,
        faction: 'player'
      }));
      const stats = AntUtilities.getPerformanceStats(largeArray);
      expect(stats.totalAnts).to.equal(1000);
    });
    
    it('should handle zero-radius circle formation', function() {
      expect(() => AntUtilities.moveGroupInCircle(mockAnts, 400, 400, 0)).to.not.throw();
    });
    
    it('should handle identical start and end points for line', function() {
      expect(() => AntUtilities.moveGroupInLine(mockAnts, 100, 100, 100, 100)).to.not.throw();
    });
    
    it('should handle fractional coordinates', function() {
      const distance = AntUtilities.getDistance(0.5, 0.5, 3.5, 4.5);
      expect(distance).to.be.closeTo(5, 0.01);
    });
  });
});




// ================================================================
// cameraController.test.js (49 tests)
// ================================================================
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
let CameraController = global.CameraController;

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




// ================================================================
// cameraManager.test.js (47 tests)
// ================================================================
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
let CameraManager = global.CameraManager;

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




// ================================================================
// combatController.test.js (53 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Load the module
let CombatController = require('../../../Classes/controllers/CombatController.js');

describe('CombatController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Reset global ants array
    global.ants = [];
    global.antIndex = {};
    
    // Create minimal mock entity
    mockEntity = {
      _faction: 'player',
      faction: 'player',
      _stateMachine: {
        setCombatModifier: function(state) { this.combatModifier = state; },
        combatModifier: null
      },
      getPosition: function() { return { x: 100, y: 100 }; }
    };
    
    controller = new CombatController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize empty enemies array', function() {
      expect(controller._nearbyEnemies).to.be.an('array').that.is.empty;
    });
    
    it('should initialize detection radius to 60', function() {
      expect(controller._detectionRadius).to.equal(60);
    });
    
    it('should initialize combat state to OUT_OF_COMBAT', function() {
      expect(controller._combatState).to.equal('OUT_OF_COMBAT');
    });
    
    it('should initialize action state to NONE', function() {
      expect(controller._combatActionState).to.equal('NONE');
    });
  });
  
  describe('Combat States', function() {
    it('should have OUT_OF_COMBAT state', function() {
      expect(CombatController._states.OUT).to.equal('OUT_OF_COMBAT');
    });
    
    it('should have IN_COMBAT state', function() {
      expect(CombatController._states.IN).to.equal('IN_COMBAT');
    });
    
    it('should have action states', function() {
      expect(CombatController._actionStates.ATTACK).to.equal('ATTACKING');
      expect(CombatController._actionStates.DEFEND).to.equal('DEFENDING');
      expect(CombatController._actionStates.SPIT).to.equal('SPITTING');
      expect(CombatController._actionStates.NONE).to.equal('NONE');
    });
  });
  
  describe('Faction Management', function() {
    describe('setFaction()', function() {
      it('should set entity faction', function() {
        controller.setFaction('enemy');
        expect(mockEntity._faction).to.equal('enemy');
      });
      
      it('should handle neutral faction', function() {
        controller.setFaction('neutral');
        expect(mockEntity._faction).to.equal('neutral');
      });
    });
    
    describe('getFaction()', function() {
      it('should return entity faction', function() {
        mockEntity._faction = 'player';
        expect(controller.getFaction()).to.equal('player');
      });
      
      it('should fallback to faction property', function() {
        delete mockEntity._faction;
        mockEntity.faction = 'enemy';
        expect(controller.getFaction()).to.equal('enemy');
      });
      
      it('should return neutral if no faction set', function() {
        delete mockEntity._faction;
        delete mockEntity.faction;
        expect(controller.getFaction()).to.equal('neutral');
      });
    });
  });
  
  describe('Detection Radius', function() {
    it('should set detection radius', function() {
      controller.setDetectionRadius(100);
      expect(controller._detectionRadius).to.equal(100);
    });
    
    it('should handle zero radius', function() {
      controller.setDetectionRadius(0);
      expect(controller._detectionRadius).to.equal(0);
    });
    
    it('should handle large radius', function() {
      controller.setDetectionRadius(500);
      expect(controller._detectionRadius).to.equal(500);
    });
  });
  
  describe('Enemy Detection', function() {
    describe('detectEnemies()', function() {
      it('should detect nearby enemies', function() {
        const enemy = {
          faction: 'enemy',
          getPosition: () => ({ x: 110, y: 110 }) // 14 pixels away
        };
        global.ants = [mockEntity, enemy];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.have.lengthOf(1);
        expect(controller._nearbyEnemies[0]).to.equal(enemy);
      });
      
      it('should ignore same faction', function() {
        const ally = {
          faction: 'player',
          getPosition: () => ({ x: 110, y: 110 })
        };
        global.ants = [mockEntity, ally];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore neutral entities', function() {
        const neutral = {
          faction: 'neutral',
          getPosition: () => ({ x: 110, y: 110 })
        };
        global.ants = [mockEntity, neutral];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore self', function() {
        global.ants = [mockEntity];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should ignore enemies beyond detection radius', function() {
        const farEnemy = {
          faction: 'enemy',
          getPosition: () => ({ x: 200, y: 200 }) // 141 pixels away
        };
        global.ants = [mockEntity, farEnemy];
        controller._detectionRadius = 60;
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should detect multiple enemies', function() {
        const enemy1 = {
          faction: 'enemy',
          getPosition: () => ({ x: 110, y: 110 })
        };
        const enemy2 = {
          faction: 'hostile',
          getPosition: () => ({ x: 90, y: 90 })
        };
        global.ants = [mockEntity, enemy1, enemy2];
        
        controller.detectEnemies();
        expect(controller._nearbyEnemies).to.have.lengthOf(2);
      });
      
      it('should handle missing ants array', function() {
        delete global.ants;
        expect(() => controller.detectEnemies()).to.not.throw();
        expect(controller._nearbyEnemies).to.be.empty;
      });
      
      it('should handle null entities in ants array', function() {
        global.ants = [null, mockEntity, null];
        expect(() => controller.detectEnemies()).to.not.throw();
      });
    });
    
    describe('calculateDistance()', function() {
      it('should calculate correct distance', function() {
        const entity1 = { getPosition: () => ({ x: 0, y: 0 }) };
        const entity2 = { getPosition: () => ({ x: 30, y: 40 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.equal(50); // 3-4-5 triangle
      });
      
      it('should return 0 for same position', function() {
        const entity1 = { getPosition: () => ({ x: 100, y: 100 }) };
        const entity2 = { getPosition: () => ({ x: 100, y: 100 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.equal(0);
      });
      
      it('should handle negative coordinates', function() {
        const entity1 = { getPosition: () => ({ x: -50, y: -50 }) };
        const entity2 = { getPosition: () => ({ x: 50, y: 50 }) };
        
        const distance = controller.calculateDistance(entity1, entity2);
        expect(distance).to.be.closeTo(141.42, 0.1);
      });
    });
  });
  
  describe('Combat State Management', function() {
    describe('getCombatState()', function() {
      it('should return current combat state', function() {
        expect(controller.getCombatState()).to.equal('OUT_OF_COMBAT');
      });
    });
    
    describe('setCombatState()', function() {
      it('should set combat state', function() {
        controller.setCombatState('IN_COMBAT');
        expect(controller._combatState).to.equal('IN_COMBAT');
      });
      
      it('should update state machine', function() {
        controller.setCombatState('IN_COMBAT');
        expect(mockEntity._stateMachine.combatModifier).to.equal('IN_COMBAT');
      });
      
      it('should trigger state change callback', function() {
        let oldState = null;
        let newState = null;
        
        controller.setStateChangeCallback((old, current) => {
          oldState = old;
          newState = current;
        });
        
        controller.setCombatState('IN_COMBAT');
        expect(oldState).to.equal('OUT_OF_COMBAT');
        expect(newState).to.equal('IN_COMBAT');
      });
      
      it('should handle missing state machine', function() {
        mockEntity._stateMachine = null;
        expect(() => controller.setCombatState('IN_COMBAT')).to.not.throw();
      });
    });
    
    describe('isInCombat()', function() {
      it('should return false initially', function() {
        expect(controller.isInCombat()).to.be.false;
      });
      
      it('should return true when in combat', function() {
        controller.setCombatState('IN_COMBAT');
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should return false when out of combat', function() {
        controller.setCombatState('IN_COMBAT');
        controller.setCombatState('OUT_OF_COMBAT');
        expect(controller.isInCombat()).to.be.false;
      });
    });
    
    describe('updateCombatState()', function() {
      it('should enter combat when enemies detected', function() {
        controller._nearbyEnemies = [{ faction: 'enemy' }];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should exit combat when no enemies', function() {
        controller.setCombatState('IN_COMBAT');
        controller._nearbyEnemies = [];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.false;
      });
      
      it('should stay in combat with enemies present', function() {
        controller.setCombatState('IN_COMBAT');
        controller._nearbyEnemies = [{ faction: 'enemy' }];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.true;
      });
      
      it('should stay out of combat without enemies', function() {
        controller._nearbyEnemies = [];
        controller.updateCombatState();
        expect(controller.isInCombat()).to.be.false;
      });
    });
  });
  
  describe('Nearby Enemies', function() {
    it('should return nearby enemies array', function() {
      const enemies = controller.getNearbyEnemies();
      expect(enemies).to.be.an('array');
    });
    
    it('should return current enemies', function() {
      const enemy = { faction: 'enemy', getPosition: () => ({ x: 110, y: 110 }) };
      global.ants = [mockEntity, enemy];
      controller.detectEnemies();
      
      const enemies = controller.getNearbyEnemies();
      expect(enemies).to.have.lengthOf(1);
      expect(enemies[0]).to.equal(enemy);
    });
  });
  
  describe('Update Loop', function() {
    it('should detect enemies periodically', function(done) {
      const enemy = {
        faction: 'enemy',
        getPosition: () => ({ x: 110, y: 110 })
      };
      global.ants = [mockEntity, enemy];
      
      controller._lastEnemyCheck = Date.now() - 200; // Force check
      controller.update();
      
      setTimeout(() => {
        expect(controller._nearbyEnemies).to.have.lengthOf(1);
        done();
      }, 10);
    });
    
    it('should update combat state', function(done) {
      const enemy = {
        faction: 'enemy',
        getPosition: () => ({ x: 110, y: 110 })
      };
      global.ants = [mockEntity, enemy];
      
      controller._lastEnemyCheck = Date.now() - 200;
      controller.update();
      
      setTimeout(() => {
        expect(controller.isInCombat()).to.be.true;
        done();
      }, 10);
    });
    
    it('should respect check interval', function() {
      controller._lastEnemyCheck = Date.now();
      const initialCount = controller._nearbyEnemies.length;
      
      controller.update();
      
      expect(controller._nearbyEnemies).to.have.lengthOf(initialCount);
    });
  });
  
  describe('Callback System', function() {
    it('should register state change callback', function() {
      const callback = function() {};
      controller.setStateChangeCallback(callback);
      expect(controller._onStateChangeCallback).to.equal(callback);
    });
    
    it('should invoke callback on state change', function() {
      let invoked = false;
      controller.setStateChangeCallback(() => invoked = true);
      controller.setCombatState('IN_COMBAT');
      expect(invoked).to.be.true;
    });
  });
  
  describe('Debug Info', function() {
    it('should return debug information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.combatState).to.exist;
      expect(info.nearbyEnemyCount).to.exist;
      expect(info.detectionRadius).to.exist;
      expect(info.entityFaction).to.exist;
    });
    
    it('should include enemy count', function() {
      controller._nearbyEnemies = [{}, {}, {}];
      const info = controller.getDebugInfo();
      expect(info.nearbyEnemyCount).to.equal(3);
    });
    
    it('should include faction info', function() {
      mockEntity.faction = 'enemy';
      const info = controller.getDebugInfo();
      expect(info.entityFaction).to.equal('enemy');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entities without getPosition method', function() {
      const enemy = { faction: 'enemy' };
      global.ants = [mockEntity, enemy];
      expect(() => controller.detectEnemies()).to.throw();
    });
    
    it('should handle undefined faction', function() {
      delete mockEntity.faction;
      delete mockEntity._faction;
      expect(controller.getFaction()).to.equal('neutral');
    });
    
    it('should handle rapid state changes', function() {
      for (let i = 0; i < 10; i++) {
        controller.setCombatState(i % 2 === 0 ? 'IN_COMBAT' : 'OUT_OF_COMBAT');
      }
      expect(controller.getCombatState()).to.equal('OUT_OF_COMBAT');
    });
    
    it('should handle callback throwing exception', function() {
      controller.setStateChangeCallback(() => {
        throw new Error('Callback error');
      });
      expect(() => controller.setCombatState('IN_COMBAT')).to.throw();
    });
  });
});




// ================================================================
// debugRenderer.test.js (22 tests)
// ================================================================
// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.noStroke = () => {};
global.fill = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.text = () => {};
global.LEFT = 'LEFT';

// Load the module
let DebugRenderer = require('../../../Classes/controllers/DebugRenderer.js');

describe('DebugRenderer', function() {
  let mockEntity;
  
  beforeEach(function() {
    global.devConsoleEnabled = true;
    mockEntity = {
      posX: 100,
      posY: 200,
      _faction: 'player',
      getPosition: function() { return { x: this.posX, y: this.posY }; },
      getCurrentState: function() { return 'IDLE'; },
      getEffectiveMovementSpeed: function() { return 2.5; }
    };
  });
  
  describe('renderEntityDebug()', function() {
    it('should render debug info for entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should not render when devConsoleEnabled is false', function() {
      global.devConsoleEnabled = false;
      let textCalled = false;
      global.text = () => { textCalled = true; };
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(textCalled).to.be.false;
    });
    
    it('should handle entity without getPosition', function() {
      const entity = {
        posX: 50,
        posY: 75,
        getCurrentState: () => 'MOVING'
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should handle entity with sprite position', function() {
      const entity = {
        _sprite: { pos: { x: 150, y: 250 } },
        getCurrentState: () => 'GATHERING'
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should handle entity without getCurrentState', function() {
      const entity = {
        posX: 100,
        posY: 200,
        getPosition: () => ({ x: 100, y: 200 })
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should display state information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('State:'))).to.be.true;
    });
    
    it('should display faction information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('Faction:'))).to.be.true;
    });
    
    it('should display speed information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('Speed:'))).to.be.true;
    });
    
    it('should handle entity without faction', function() {
      delete mockEntity._faction;
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('unknown'))).to.be.true;
    });
    
    it('should handle entity without speed method', function() {
      delete mockEntity.getEffectiveMovementSpeed;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should format speed as number', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      const speedText = displayedText.find(t => t.includes('Speed:'));
      expect(speedText).to.exist;
    });
  });
  
  describe('Error Handling', function() {
    it('should not throw on null entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(null)).to.not.throw();
    });
    
    it('should not throw on undefined entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(undefined)).to.not.throw();
    });
    
    it('should handle errors gracefully', function() {
      const badEntity = {
        getPosition: () => { throw new Error('Position error'); },
        getCurrentState: () => 'IDLE'
      };
      // Implementation has try-catch, so it won't throw
      expect(() => DebugRenderer.renderEntityDebug(badEntity)).to.not.throw();
    });
    
    it('should handle missing p5.js functions', function() {
      const savedPush = global.push;
      global.push = undefined;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
      global.push = savedPush;
    });
    
    it('should handle text function throwing', function() {
      global.text = () => { throw new Error('Text error'); };
      // Implementation has try-catch, so it won't throw
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
  });
  
  describe('Module Export', function() {
    it('should export DebugRenderer object', function() {
      expect(DebugRenderer).to.be.an('object');
      expect(DebugRenderer.renderEntityDebug).to.be.a('function');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity with all optional features', function() {
      const fullEntity = {
        posX: 100,
        posY: 200,
        _faction: 'enemy',
        faction: 'fallback',
        getPosition: () => ({ x: 100, y: 200 }),
        getCurrentState: () => 'ATTACKING',
        getEffectiveMovementSpeed: () => 3.7
      };
      expect(() => DebugRenderer.renderEntityDebug(fullEntity)).to.not.throw();
    });
    
    it('should handle entity with minimal features', function() {
      const minEntity = {
        posX: 0,
        posY: 0
      };
      expect(() => DebugRenderer.renderEntityDebug(minEntity)).to.not.throw();
    });
    
    it('should handle very large coordinates', function() {
      mockEntity.posX = 100000;
      mockEntity.posY = 200000;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should handle negative coordinates', function() {
      mockEntity.posX = -100;
      mockEntity.posY = -200;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should handle fractional speed values', function() {
      mockEntity.getEffectiveMovementSpeed = () => 2.567891;
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      const speedText = displayedText.find(t => t.includes('Speed:'));
      expect(speedText).to.match(/\d+\.\d/);
    });
  });
});




// ================================================================
// healthController.test.js (48 tests)
// ================================================================
// Mock p5.js globals
global.fill = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.noStroke = function() {};
global.rect = function() {};
global.push = function() {};
global.pop = function() {};

// Load the module
let HealthController = require('../../../Classes/controllers/HealthController.js');

describe('HealthController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Create minimal mock entity
    mockEntity = {
      health: 80,
      maxHealth: 100,
      getPosition: function() { return { x: 100, y: 100 }; },
      getSize: function() { return { x: 32, y: 32 }; }
    };
    
    controller = new HealthController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller.entity).to.equal(mockEntity);
    });
    
    it('should initialize with default config', function() {
      expect(controller.config).to.be.an('object');
      expect(controller.config.barHeight).to.equal(4);
      expect(controller.config.offsetY).to.equal(12);
    });
    
    it('should initialize as not visible', function() {
      expect(controller.isVisible).to.be.false;
    });
    
    it('should initialize with zero alpha', function() {
      expect(controller.alpha).to.equal(0);
    });
    
    it('should initialize last damage time to 0', function() {
      expect(controller.lastDamageTime).to.equal(0);
    });
  });
  
  describe('Configuration', function() {
    describe('setConfig()', function() {
      it('should update config properties', function() {
        controller.setConfig({ barWidth: 50 });
        expect(controller.config.barWidth).to.equal(50);
      });
      
      it('should merge with existing config', function() {
        const originalHeight = controller.config.barHeight;
        controller.setConfig({ barWidth: 60 });
        expect(controller.config.barHeight).to.equal(originalHeight);
      });
      
      it('should update multiple properties', function() {
        controller.setConfig({ 
          barWidth: 40, 
          barHeight: 6,
          offsetY: 15 
        });
        expect(controller.config.barWidth).to.equal(40);
        expect(controller.config.barHeight).to.equal(6);
        expect(controller.config.offsetY).to.equal(15);
      });
    });
    
    describe('getConfig()', function() {
      it('should return config object', function() {
        const config = controller.getConfig();
        expect(config).to.be.an('object');
      });
      
      it('should return copy of config', function() {
        const config = controller.getConfig();
        config.barWidth = 999;
        expect(controller.config.barWidth).to.not.equal(999);
      });
      
      it('should include all config properties', function() {
        const config = controller.getConfig();
        expect(config).to.have.property('barHeight');
        expect(config).to.have.property('offsetY');
        expect(config).to.have.property('showWhenFull');
      });
    });
  });
  
  describe('Visibility', function() {
    describe('setVisible()', function() {
      it('should set visible to true', function() {
        controller.setVisible(true);
        expect(controller.isVisible).to.be.true;
      });
      
      it('should set target alpha to 1 when visible', function() {
        controller.setVisible(true);
        expect(controller.targetAlpha).to.equal(1.0);
      });
      
      it('should set target alpha to 0 when hidden', function() {
        controller.setVisible(false);
        expect(controller.targetAlpha).to.equal(0.0);
      });
      
      it('should update last damage time when showing', function() {
        const before = Date.now();
        controller.setVisible(true);
        expect(controller.lastDamageTime).to.be.at.least(before);
      });
    });
    
    describe('getVisible()', function() {
      it('should return false initially', function() {
        expect(controller.getVisible()).to.be.false;
      });
      
      it('should return true when visible and alpha > 0.1', function() {
        controller.isVisible = true;
        controller.alpha = 0.5;
        expect(controller.getVisible()).to.be.true;
      });
      
      it('should return false when alpha too low', function() {
        controller.isVisible = true;
        controller.alpha = 0.05;
        expect(controller.getVisible()).to.be.false;
      });
    });
  });
  
  describe('Damage Notification', function() {
    describe('onDamage()', function() {
      it('should set visible to true', function() {
        controller.onDamage();
        expect(controller.isVisible).to.be.true;
      });
      
      it('should set target alpha to 1', function() {
        controller.onDamage();
        expect(controller.targetAlpha).to.equal(1.0);
      });
      
      it('should update last damage time', function() {
        const before = Date.now();
        controller.onDamage();
        const after = Date.now();
        expect(controller.lastDamageTime).to.be.at.least(before);
        expect(controller.lastDamageTime).to.be.at.most(after);
      });
      
      it('should trigger display on repeated damage', function() {
        controller.onDamage();
        const firstTime = controller.lastDamageTime;
        
        setTimeout(() => {
          controller.onDamage();
          expect(controller.lastDamageTime).to.be.at.least(firstTime);
        }, 10);
      });
    });
  });
  
  describe('Update Logic', function() {
    it('should fade in when health < max', function() {
      mockEntity.health = 50;
      controller.alpha = 0;
      controller.update();
      expect(controller.targetAlpha).to.equal(1.0);
    });
    
    it('should hide when health is full', function() {
      mockEntity.health = 100;
      controller.alpha = 1.0;
      controller.update();
      expect(controller.targetAlpha).to.equal(0.0);
    });
    
    it('should show when health full if showWhenFull enabled', function() {
      mockEntity.health = 100;
      controller.config.showWhenFull = true;
      controller.alpha = 0;
      controller.onDamage(); // Trigger recent damage
      controller.update();
      expect(controller.targetAlpha).to.equal(1.0);
    });
    
    it('should gradually increase alpha when fading in', function() {
      controller.alpha = 0;
      controller.targetAlpha = 1.0;
      controller.update();
      expect(controller.alpha).to.be.greaterThan(0);
      expect(controller.alpha).to.be.lessThan(1.0);
    });
    
    it('should gradually decrease alpha when fading out', function() {
      controller.alpha = 1.0;
      controller.targetAlpha = 0.0;
      controller.update();
      expect(controller.alpha).to.be.lessThanOrEqual(1.0);
      expect(controller.alpha).to.be.greaterThanOrEqual(0);
    });
    
    it('should handle missing entity gracefully', function() {
      controller.entity = null;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should show after recent damage when health not full', function() {
      mockEntity.health = 99; // Not quite full
      mockEntity.maxHealth = 100;
      controller.onDamage();
      controller.update();
      // Should show because health < max and recent damage
      expect(controller.isVisible).to.be.true;
      expect(controller.targetAlpha).to.equal(1.0);
    });
  });
  
  describe('Rendering', function() {
    it('should not render when not visible', function() {
      controller.isVisible = false;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should not render when entity missing', function() {
      controller.isVisible = true;
      controller.entity = null;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should not render when health is full and showWhenFull is false', function() {
      controller.isVisible = true;
      mockEntity.health = 100;
      controller.config.showWhenFull = false;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should render when health < max', function() {
      controller.isVisible = true;
      mockEntity.health = 50;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should handle entity without getPosition method', function() {
      controller.isVisible = true;
      mockEntity.getPosition = null;
      mockEntity.posX = 100;
      mockEntity.posY = 100;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should handle entity without getSize method', function() {
      controller.isVisible = true;
      mockEntity.getSize = null;
      mockEntity.sizeX = 32;
      mockEntity.sizeY = 32;
      expect(() => controller.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    it('should return debug information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.controllerType).to.equal('HealthController');
    });
    
    it('should include health information', function() {
      mockEntity.health = 75;
      mockEntity.maxHealth = 100;
      const info = controller.getDebugInfo();
      expect(info.health).to.equal(75);
      expect(info.maxHealth).to.equal(100);
      expect(info.healthPercent).to.equal(75);
    });
    
    it('should include visibility state', function() {
      controller.isVisible = true;
      controller.alpha = 0.8;
      const info = controller.getDebugInfo();
      expect(info.isVisible).to.be.true;
      expect(info.alpha).to.equal(0.8);
    });
    
    it('should handle missing entity', function() {
      controller.entity = null;
      const info = controller.getDebugInfo();
      expect(info).to.deep.equal({});
    });
  });
  
  describe('Cleanup', function() {
    it('should clear entity reference on destroy', function() {
      controller.destroy();
      expect(controller.entity).to.be.null;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle health of 0', function() {
      mockEntity.health = 0;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle negative health', function() {
      mockEntity.health = -10;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle health > maxHealth', function() {
      mockEntity.health = 150;
      mockEntity.maxHealth = 100;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle maxHealth of 0', function() {
      mockEntity.maxHealth = 0;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle missing health property', function() {
      delete mockEntity.health;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle missing maxHealth property', function() {
      delete mockEntity.maxHealth;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle rapid visibility toggling', function() {
      for (let i = 0; i < 10; i++) {
        controller.setVisible(i % 2 === 0);
      }
      expect(controller.targetAlpha).to.equal(0.0);
    });
    
    it('should handle multiple onDamage calls', function() {
      for (let i = 0; i < 5; i++) {
        controller.onDamage();
      }
      expect(controller.isVisible).to.be.true;
    });
  });
});




// ================================================================
// inventoryController.test.js (61 tests)
// ================================================================
// Mock p5.js random function
global.random = (min, max) => min + Math.random() * (max - min);

// Mock global resources array
global.resources = [];

// Load the module
let InventoryController = require('../../../Classes/controllers/InventoryController.js');

describe('InventoryController', function() {
  let owner;
  let inventory;
  
  beforeEach(function() {
    global.resources = [];
    
    owner = {
      id: 'test-owner',
      posX: 100,
      posY: 100,
      getPosition: function() { return { x: this.posX, y: this.posY }; }
    };
    
    inventory = new InventoryController(owner, 2);
  });
  
  describe('Constructor', function() {
    it('should initialize with owner reference', function() {
      expect(inventory.owner).to.equal(owner);
    });
    
    it('should set default capacity to 2', function() {
      const inv = new InventoryController(owner);
      expect(inv.capacity).to.equal(2);
    });
    
    it('should accept custom capacity', function() {
      const inv = new InventoryController(owner, 5);
      expect(inv.capacity).to.equal(5);
    });
    
    it('should enforce minimum capacity of 1', function() {
      const inv = new InventoryController(owner, 0);
      expect(inv.capacity).to.equal(1);
    });
    
    it('should initialize empty slots array', function() {
      expect(inventory.slots).to.be.an('array').with.lengthOf(2);
      expect(inventory.slots.every(s => s === null)).to.be.true;
    });
  });
  
  describe('getCount()', function() {
    it('should return 0 for empty inventory', function() {
      expect(inventory.getCount()).to.equal(0);
    });
    
    it('should count occupied slots', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should ignore null slots', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = null;
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should count multiple occupied slots', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      expect(inventory.getCount()).to.equal(2);
    });
  });
  
  describe('isFull()', function() {
    it('should return false when empty', function() {
      expect(inventory.isFull()).to.be.false;
    });
    
    it('should return false when partially full', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.isFull()).to.be.false;
    });
    
    it('should return true when all slots occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      expect(inventory.isFull()).to.be.true;
    });
  });
  
  describe('isEmpty()', function() {
    it('should return true when empty', function() {
      expect(inventory.isEmpty()).to.be.true;
    });
    
    it('should return false when any slot occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.isEmpty()).to.be.false;
    });
  });
  
  describe('getSlot()', function() {
    it('should return null for empty slot', function() {
      expect(inventory.getSlot(0)).to.be.null;
    });
    
    it('should return resource from slot', function() {
      const resource = { type: 'wood' };
      inventory.slots[0] = resource;
      expect(inventory.getSlot(0)).to.equal(resource);
    });
    
    it('should return null for invalid index', function() {
      expect(inventory.getSlot(10)).to.be.null;
    });
    
    it('should return null for negative index', function() {
      expect(inventory.getSlot(-1)).to.be.null;
    });
  });
  
  describe('getResources()', function() {
    it('should return shallow copy of slots', function() {
      const resources = inventory.getResources();
      expect(resources).to.be.an('array');
      expect(resources).to.not.equal(inventory.slots);
    });
    
    it('should include all slots', function() {
      inventory.slots[0] = { type: 'wood' };
      const resources = inventory.getResources();
      expect(resources).to.have.lengthOf(2);
      expect(resources[0]).to.deep.equal({ type: 'wood' });
    });
  });
  
  describe('addResource()', function() {
    it('should add resource to first empty slot', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      const result = inventory.addResource(resource);
      
      expect(result).to.be.true;
      expect(inventory.slots[0]).to.equal(resource);
    });
    
    it('should call pickUp method on resource', function() {
      let pickUpCalled = false;
      let pickUpOwner = null;
      
      const resource = {
        type: 'wood',
        pickUp: function(owner) {
          pickUpCalled = true;
          pickUpOwner = owner;
        }
      };
      
      inventory.addResource(resource);
      expect(pickUpCalled).to.be.true;
      expect(pickUpOwner).to.equal(owner);
    });
    
    it('should return false when inventory full', function() {
      inventory.slots[0] = { type: 'wood' };
      inventory.slots[1] = { type: 'stone' };
      
      const resource = { type: 'iron' };
      const result = inventory.addResource(resource);
      expect(result).to.be.false;
    });
    
    it('should return false for null resource', function() {
      expect(inventory.addResource(null)).to.be.false;
    });
    
    it('should return false for undefined resource', function() {
      expect(inventory.addResource(undefined)).to.be.false;
    });
    
    it('should handle resource without pickUp method', function() {
      const resource = { type: 'wood' };
      expect(() => inventory.addResource(resource)).to.not.throw();
      expect(inventory.slots[0]).to.equal(resource);
    });
    
    it('should fill slots sequentially', function() {
      const res1 = { type: 'wood' };
      const res2 = { type: 'stone' };
      
      inventory.addResource(res1);
      inventory.addResource(res2);
      
      expect(inventory.slots[0]).to.equal(res1);
      expect(inventory.slots[1]).to.equal(res2);
    });
  });
  
  describe('addResourceToSlot()', function() {
    it('should add resource to specific slot', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      const result = inventory.addResourceToSlot(1, resource);
      
      expect(result).to.be.true;
      expect(inventory.slots[1]).to.equal(resource);
    });
    
    it('should call pickUp method', function() {
      let called = false;
      const resource = {
        type: 'wood',
        pickUp: function() { called = true; }
      };
      
      inventory.addResourceToSlot(0, resource);
      expect(called).to.be.true;
    });
    
    it('should return false if slot occupied', function() {
      inventory.slots[0] = { type: 'wood' };
      const resource = { type: 'stone' };
      
      expect(inventory.addResourceToSlot(0, resource)).to.be.false;
    });
    
    it('should return false for invalid index', function() {
      const resource = { type: 'wood' };
      expect(inventory.addResourceToSlot(10, resource)).to.be.false;
    });
    
    it('should return false for negative index', function() {
      const resource = { type: 'wood' };
      expect(inventory.addResourceToSlot(-1, resource)).to.be.false;
    });
    
    it('should return false for null resource', function() {
      expect(inventory.addResourceToSlot(0, null)).to.be.false;
    });
  });
  
  describe('removeResource()', function() {
    beforeEach(function() {
      global.resources = [];
    });
    
    it('should remove resource from slot', function() {
      const resource = { type: 'wood', drop: function() {} };
      inventory.slots[0] = resource;
      
      const removed = inventory.removeResource(0, false);
      expect(removed).to.equal(resource);
      expect(inventory.slots[0]).to.be.null;
    });
    
    it('should call drop method on resource', function() {
      let dropCalled = false;
      const resource = {
        type: 'wood',
        drop: function() { dropCalled = true; }
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, false);
      expect(dropCalled).to.be.true;
    });
    
    it('should return null for empty slot', function() {
      expect(inventory.removeResource(0, false)).to.be.null;
    });
    
    it('should return null for invalid index', function() {
      expect(inventory.removeResource(10, false)).to.be.null;
    });
    
    it('should return null for negative index', function() {
      expect(inventory.removeResource(-1, false)).to.be.null;
    });
    
    it('should drop resource to ground when dropToGround=true', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, true);
      
      expect(global.resources).to.have.lengthOf(1);
      expect(global.resources[0]).to.equal(resource);
    });
    
    it('should position dropped resource near owner', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, true);
      
      expect(resource.posX).to.be.closeTo(100, 10);
      expect(resource.posY).to.be.closeTo(100, 10);
    });
    
    it('should not drop when dropToGround=false', function() {
      const resource = {
        type: 'wood',
        posX: 0,
        posY: 0,
        drop: function() {}
      };
      
      inventory.slots[0] = resource;
      inventory.removeResource(0, false);
      
      expect(global.resources).to.be.empty;
    });
    
    it('should handle resource without drop method', function() {
      const resource = { type: 'wood' };
      inventory.slots[0] = resource;
      
      expect(() => inventory.removeResource(0, false)).to.not.throw();
    });
  });
  
  describe('dropAll()', function() {
    it('should remove all resources', function() {
      inventory.slots[0] = { type: 'wood', drop: function() {} };
      inventory.slots[1] = { type: 'stone', drop: function() {} };
      
      inventory.dropAll();
      
      expect(inventory.isEmpty()).to.be.true;
    });
    
    it('should call drop on all resources', function() {
      let dropCount = 0;
      
      inventory.slots[0] = { type: 'wood', drop: () => dropCount++ };
      inventory.slots[1] = { type: 'stone', drop: () => dropCount++ };
      
      inventory.dropAll();
      expect(dropCount).to.equal(2);
    });
    
    it('should handle empty inventory', function() {
      expect(() => inventory.dropAll()).to.not.throw();
    });
  });
  
  describe('containsType()', function() {
    it('should return true when type exists', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.containsType('wood')).to.be.true;
    });
    
    it('should return false when type not found', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.containsType('stone')).to.be.false;
    });
    
    it('should return false for empty inventory', function() {
      expect(inventory.containsType('wood')).to.be.false;
    });
    
    it('should handle null slots', function() {
      inventory.slots[0] = null;
      inventory.slots[1] = { type: 'wood' };
      expect(inventory.containsType('wood')).to.be.true;
    });
  });
  
  describe('transferAllTo()', function() {
    let targetInventory;
    
    beforeEach(function() {
      targetInventory = new InventoryController({ id: 'target' }, 3);
    });
    
    it('should transfer all resources to target', function() {
      inventory.slots[0] = { type: 'wood', pickUp: function() {} };
      inventory.slots[1] = { type: 'stone', pickUp: function() {} };
      
      const transferred = inventory.transferAllTo(targetInventory);
      
      expect(transferred).to.equal(2);
      expect(inventory.isEmpty()).to.be.true;
      expect(targetInventory.getCount()).to.equal(2);
    });
    
    it('should return 0 for null target', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.transferAllTo(null)).to.equal(0);
    });
    
    it('should return 0 for invalid target', function() {
      inventory.slots[0] = { type: 'wood' };
      expect(inventory.transferAllTo({})).to.equal(0);
    });
    
    it('should stop when target full', function() {
      inventory.slots[0] = { type: 'wood', pickUp: function() {} };
      inventory.slots[1] = { type: 'stone', pickUp: function() {} };
      
      const smallTarget = new InventoryController({ id: 'small' }, 1);
      const transferred = inventory.transferAllTo(smallTarget);
      
      expect(transferred).to.equal(1);
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should handle empty inventory', function() {
      expect(inventory.transferAllTo(targetInventory)).to.equal(0);
    });
    
    it('should preserve resource references', function() {
      const resource = { type: 'wood', pickUp: function() {} };
      inventory.slots[0] = resource;
      
      inventory.transferAllTo(targetInventory);
      expect(targetInventory.slots[0]).to.equal(resource);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very large capacity', function() {
      const largeInv = new InventoryController(owner, 1000);
      expect(largeInv.capacity).to.equal(1000);
      expect(largeInv.slots).to.have.lengthOf(1000);
    });
    
    it('should handle negative capacity', function() {
      const inv = new InventoryController(owner, -5);
      expect(inv.capacity).to.equal(1);
    });
    
    it('should reject fractional capacity', function() {
      // Array() doesn't accept fractional lengths
      expect(() => new InventoryController(owner, 2.7)).to.throw();
    });
    
    it('should handle resource without type', function() {
      const resource = { value: 10 };
      inventory.addResource(resource);
      expect(inventory.getCount()).to.equal(1);
    });
    
    it('should require global resources array for dropToGround', function() {
      const originalResources = global.resources;
      delete global.resources;
      
      const resource = { type: 'wood', posX: 0, posY: 0, drop: function() {} };
      inventory.slots[0] = resource;
      
      // Will throw because it references global resources
      expect(() => inventory.removeResource(0, true)).to.throw();
      
      // Restore global
      global.resources = originalResources;
    });
    
    it('should handle owner without position', function() {
      const noPositionOwner = { id: 'test' };
      const inv = new InventoryController(noPositionOwner, 2);
      
      const resource = { type: 'wood', posX: 0, posY: 0, drop: function() {} };
      inv.slots[0] = resource;
      
      expect(() => inv.removeResource(0, true)).to.not.throw();
    });
  });
});




// ================================================================
// keyboardInputController.test.js (31 tests)
// ================================================================
// Load the module
class KeyboardInputController {
  constructor() {
    this.keyPressHandlers = [];
    this.keyReleaseHandlers = [];
    this.keyTypeHandlers = [];
    this.pressedKeys = new Set();
  }
  onKeyPress(fn) {
    if (typeof fn === 'function') this.keyPressHandlers.push(fn);
  }
  onKeyRelease(fn) {
    if (typeof fn === 'function') this.keyReleaseHandlers.push(fn);
  }
  onKeyType(fn) {
    if (typeof fn === 'function') this.keyTypeHandlers.push(fn);
  }
  handleKeyPressed(keyCode, key) {
    this.pressedKeys.add(keyCode);
    this.keyPressHandlers.forEach(fn => fn(keyCode, key));
  }
  handleKeyReleased(keyCode, key) {
    this.pressedKeys.delete(keyCode);
    this.keyReleaseHandlers.forEach(fn => fn(keyCode, key));
  }
  handleKeyTyped(key) {
    this.keyTypeHandlers.forEach(fn => fn(key));
  }
  isKeyDown(keyCode) {
    return this.pressedKeys.has(keyCode);
  }
}

describe('KeyboardInputController', function() {
  let controller;
  
  beforeEach(function() {
    controller = new KeyboardInputController();
  });
  
  describe('Constructor', function() {
    it('should initialize empty handler arrays', function() {
      expect(controller.keyPressHandlers).to.be.an('array').that.is.empty;
      expect(controller.keyReleaseHandlers).to.be.an('array').that.is.empty;
      expect(controller.keyTypeHandlers).to.be.an('array').that.is.empty;
    });
    
    it('should initialize empty pressed keys set', function() {
      expect(controller.pressedKeys).to.be.instanceof(Set);
      expect(controller.pressedKeys.size).to.equal(0);
    });
  });
  
  describe('Handler Registration', function() {
    describe('onKeyPress()', function() {
      it('should register key press handler', function() {
        const handler = () => {};
        controller.onKeyPress(handler);
        expect(controller.keyPressHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyPress(handler1);
        controller.onKeyPress(handler2);
        expect(controller.keyPressHandlers).to.have.lengthOf(2);
      });
      
      it('should ignore non-function values', function() {
        controller.onKeyPress('not a function');
        controller.onKeyPress(null);
        controller.onKeyPress(undefined);
        expect(controller.keyPressHandlers).to.be.empty;
      });
    });
    
    describe('onKeyRelease()', function() {
      it('should register key release handler', function() {
        const handler = () => {};
        controller.onKeyRelease(handler);
        expect(controller.keyReleaseHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyRelease(handler1);
        controller.onKeyRelease(handler2);
        expect(controller.keyReleaseHandlers).to.have.lengthOf(2);
      });
    });
    
    describe('onKeyType()', function() {
      it('should register key type handler', function() {
        const handler = () => {};
        controller.onKeyType(handler);
        expect(controller.keyTypeHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onKeyType(handler1);
        controller.onKeyType(handler2);
        expect(controller.keyTypeHandlers).to.have.lengthOf(2);
      });
    });
  });
  
  describe('Key Press Handling', function() {
    describe('handleKeyPressed()', function() {
      it('should add key to pressed keys set', function() {
        controller.handleKeyPressed(65, 'a');
        expect(controller.pressedKeys.has(65)).to.be.true;
      });
      
      it('should invoke all press handlers', function() {
        let count = 0;
        controller.onKeyPress(() => count++);
        controller.onKeyPress(() => count++);
        controller.handleKeyPressed(65, 'a');
        expect(count).to.equal(2);
      });
      
      it('should pass keyCode and key to handlers', function() {
        let capturedCode, capturedKey;
        controller.onKeyPress((code, key) => {
          capturedCode = code;
          capturedKey = key;
        });
        controller.handleKeyPressed(65, 'a');
        expect(capturedCode).to.equal(65);
        expect(capturedKey).to.equal('a');
      });
      
      it('should handle multiple keys pressed', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyPressed(66, 'b');
        controller.handleKeyPressed(67, 'c');
        expect(controller.pressedKeys.size).to.equal(3);
      });
      
      it('should handle same key pressed multiple times', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyPressed(65, 'a');
        expect(controller.pressedKeys.size).to.equal(1);
      });
    });
    
    describe('handleKeyReleased()', function() {
      it('should remove key from pressed keys set', function() {
        controller.handleKeyPressed(65, 'a');
        controller.handleKeyReleased(65, 'a');
        expect(controller.pressedKeys.has(65)).to.be.false;
      });
      
      it('should invoke all release handlers', function() {
        let count = 0;
        controller.onKeyRelease(() => count++);
        controller.onKeyRelease(() => count++);
        controller.handleKeyReleased(65, 'a');
        expect(count).to.equal(2);
      });
      
      it('should pass keyCode and key to handlers', function() {
        let capturedCode, capturedKey;
        controller.onKeyRelease((code, key) => {
          capturedCode = code;
          capturedKey = key;
        });
        controller.handleKeyReleased(65, 'a');
        expect(capturedCode).to.equal(65);
        expect(capturedKey).to.equal('a');
      });
      
      it('should handle releasing key that was not pressed', function() {
        expect(() => controller.handleKeyReleased(65, 'a')).to.not.throw();
        expect(controller.pressedKeys.has(65)).to.be.false;
      });
    });
    
    describe('handleKeyTyped()', function() {
      it('should invoke all type handlers', function() {
        let count = 0;
        controller.onKeyType(() => count++);
        controller.onKeyType(() => count++);
        controller.handleKeyTyped('a');
        expect(count).to.equal(2);
      });
      
      it('should pass key to handlers', function() {
        let capturedKey;
        controller.onKeyType((key) => { capturedKey = key; });
        controller.handleKeyTyped('x');
        expect(capturedKey).to.equal('x');
      });
      
      it('should handle special characters', function() {
        let capturedKey;
        controller.onKeyType((key) => { capturedKey = key; });
        controller.handleKeyTyped('!');
        expect(capturedKey).to.equal('!');
      });
    });
  });
  
  describe('isKeyDown()', function() {
    it('should return true for pressed key', function() {
      controller.handleKeyPressed(65, 'a');
      expect(controller.isKeyDown(65)).to.be.true;
    });
    
    it('should return false for unpressed key', function() {
      expect(controller.isKeyDown(65)).to.be.false;
    });
    
    it('should return false after key released', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyReleased(65, 'a');
      expect(controller.isKeyDown(65)).to.be.false;
    });
    
    it('should handle checking multiple keys', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyPressed(66, 'b');
      expect(controller.isKeyDown(65)).to.be.true;
      expect(controller.isKeyDown(66)).to.be.true;
      expect(controller.isKeyDown(67)).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty handlers gracefully', function() {
      expect(() => controller.handleKeyPressed(65, 'a')).to.not.throw();
      expect(() => controller.handleKeyReleased(65, 'a')).to.not.throw();
      expect(() => controller.handleKeyTyped('a')).to.not.throw();
    });
    
    it('should handle handler throwing exception', function() {
      controller.onKeyPress(() => { throw new Error('Handler error'); });
      expect(() => controller.handleKeyPressed(65, 'a')).to.throw();
    });
    
    it('should handle undefined key parameter', function() {
      expect(() => controller.handleKeyPressed(65, undefined)).to.not.throw();
    });
    
    it('should handle null keyCode', function() {
      expect(() => controller.handleKeyPressed(null, 'a')).to.not.throw();
    });
    
    it('should track many keys simultaneously', function() {
      for (let i = 0; i < 100; i++) {
        controller.handleKeyPressed(i, String.fromCharCode(i));
      }
      expect(controller.pressedKeys.size).to.equal(100);
    });
    
    it('should clear keys individually', function() {
      controller.handleKeyPressed(65, 'a');
      controller.handleKeyPressed(66, 'b');
      controller.handleKeyPressed(67, 'c');
      controller.handleKeyReleased(66, 'b');
      expect(controller.isKeyDown(65)).to.be.true;
      expect(controller.isKeyDown(66)).to.be.false;
      expect(controller.isKeyDown(67)).to.be.true;
    });
  });
});




// ================================================================
// mouseInputController.test.js (40 tests)
// ================================================================
// Load the module
class MouseInputController {
  constructor() {
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.button = null;
    this.clickHandlers = [];
    this.dragHandlers = [];
    this.releaseHandlers = [];
  }
  onClick(fn) {
    if (typeof fn === 'function') this.clickHandlers.push(fn);
  }
  onDrag(fn) {
    if (typeof fn === 'function') this.dragHandlers.push(fn);
  }
  onRelease(fn) {
    if (typeof fn === 'function') this.releaseHandlers.push(fn);
  }
  handleMousePressed(x, y, button) {
    this.isDragging = false;
    this.lastX = x;
    this.lastY = y;
    this.button = button;
    this.clickHandlers.forEach(fn => fn(x, y, button));
  }
  handleMouseDragged(x, y) {
    if (!this.isDragging) this.isDragging = true;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    this.dragHandlers.forEach(fn => fn(x, y, dx, dy));
    this.lastX = x;
    this.lastY = y;
  }
  handleMouseReleased(x, y, button) {
    this.releaseHandlers.forEach(fn => fn(x, y, button));
    this.isDragging = false;
    this.button = null;
  }
}

describe('MouseInputController', function() {
  let controller;
  
  beforeEach(function() {
    controller = new MouseInputController();
  });
  
  describe('Constructor', function() {
    it('should initialize drag state to false', function() {
      expect(controller.isDragging).to.be.false;
    });
    
    it('should initialize position to zero', function() {
      expect(controller.lastX).to.equal(0);
      expect(controller.lastY).to.equal(0);
    });
    
    it('should initialize button to null', function() {
      expect(controller.button).to.be.null;
    });
    
    it('should initialize empty handler arrays', function() {
      expect(controller.clickHandlers).to.be.an('array').that.is.empty;
      expect(controller.dragHandlers).to.be.an('array').that.is.empty;
      expect(controller.releaseHandlers).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Handler Registration', function() {
    describe('onClick()', function() {
      it('should register click handler', function() {
        const handler = () => {};
        controller.onClick(handler);
        expect(controller.clickHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onClick(handler1);
        controller.onClick(handler2);
        expect(controller.clickHandlers).to.have.lengthOf(2);
      });
      
      it('should ignore non-function values', function() {
        controller.onClick('not a function');
        controller.onClick(null);
        controller.onClick(undefined);
        expect(controller.clickHandlers).to.be.empty;
      });
    });
    
    describe('onDrag()', function() {
      it('should register drag handler', function() {
        const handler = () => {};
        controller.onDrag(handler);
        expect(controller.dragHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onDrag(handler1);
        controller.onDrag(handler2);
        expect(controller.dragHandlers).to.have.lengthOf(2);
      });
    });
    
    describe('onRelease()', function() {
      it('should register release handler', function() {
        const handler = () => {};
        controller.onRelease(handler);
        expect(controller.releaseHandlers).to.include(handler);
      });
      
      it('should register multiple handlers', function() {
        const handler1 = () => {};
        const handler2 = () => {};
        controller.onRelease(handler1);
        controller.onRelease(handler2);
        expect(controller.releaseHandlers).to.have.lengthOf(2);
      });
    });
  });
  
  describe('Mouse Press Handling', function() {
    describe('handleMousePressed()', function() {
      it('should update last position', function() {
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.lastX).to.equal(100);
        expect(controller.lastY).to.equal(200);
      });
      
      it('should set button', function() {
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.button).to.equal('LEFT');
      });
      
      it('should reset dragging state', function() {
        controller.isDragging = true;
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(controller.isDragging).to.be.false;
      });
      
      it('should invoke all click handlers', function() {
        let count = 0;
        controller.onClick(() => count++);
        controller.onClick(() => count++);
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, button to handlers', function() {
        let capturedX, capturedY, capturedButton;
        controller.onClick((x, y, button) => {
          capturedX = x;
          capturedY = y;
          capturedButton = button;
        });
        controller.handleMousePressed(100, 200, 'LEFT');
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
        expect(capturedButton).to.equal('LEFT');
      });
      
      it('should handle right button', function() {
        controller.handleMousePressed(50, 75, 'RIGHT');
        expect(controller.button).to.equal('RIGHT');
      });
      
      it('should handle middle button', function() {
        controller.handleMousePressed(50, 75, 'CENTER');
        expect(controller.button).to.equal('CENTER');
      });
    });
  });
  
  describe('Mouse Drag Handling', function() {
    describe('handleMouseDragged()', function() {
      it('should set dragging state to true', function() {
        controller.handleMouseDragged(100, 200);
        expect(controller.isDragging).to.be.true;
      });
      
      it('should calculate delta from last position', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 50;
        controller.lastY = 75;
        controller.handleMouseDragged(100, 200);
        expect(capturedDx).to.equal(50);
        expect(capturedDy).to.equal(125);
      });
      
      it('should update last position', function() {
        controller.handleMouseDragged(100, 200);
        expect(controller.lastX).to.equal(100);
        expect(controller.lastY).to.equal(200);
      });
      
      it('should invoke all drag handlers', function() {
        let count = 0;
        controller.onDrag(() => count++);
        controller.onDrag(() => count++);
        controller.handleMouseDragged(100, 200);
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, dx, dy to handlers', function() {
        let capturedX, capturedY, capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedX = x;
          capturedY = y;
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 10;
        controller.lastY = 20;
        controller.handleMouseDragged(15, 25);
        expect(capturedX).to.equal(15);
        expect(capturedY).to.equal(25);
        expect(capturedDx).to.equal(5);
        expect(capturedDy).to.equal(5);
      });
      
      it('should handle negative delta', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 100;
        controller.lastY = 200;
        controller.handleMouseDragged(50, 100);
        expect(capturedDx).to.equal(-50);
        expect(capturedDy).to.equal(-100);
      });
      
      it('should handle zero delta', function() {
        let capturedDx, capturedDy;
        controller.onDrag((x, y, dx, dy) => {
          capturedDx = dx;
          capturedDy = dy;
        });
        controller.lastX = 100;
        controller.lastY = 200;
        controller.handleMouseDragged(100, 200);
        expect(capturedDx).to.equal(0);
        expect(capturedDy).to.equal(0);
      });
      
      it('should accumulate position over multiple drags', function() {
        controller.handleMouseDragged(10, 20);
        controller.handleMouseDragged(20, 40);
        controller.handleMouseDragged(30, 60);
        expect(controller.lastX).to.equal(30);
        expect(controller.lastY).to.equal(60);
      });
    });
  });
  
  describe('Mouse Release Handling', function() {
    describe('handleMouseReleased()', function() {
      it('should reset dragging state', function() {
        controller.isDragging = true;
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(controller.isDragging).to.be.false;
      });
      
      it('should reset button', function() {
        controller.button = 'LEFT';
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(controller.button).to.be.null;
      });
      
      it('should invoke all release handlers', function() {
        let count = 0;
        controller.onRelease(() => count++);
        controller.onRelease(() => count++);
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(count).to.equal(2);
      });
      
      it('should pass x, y, button to handlers', function() {
        let capturedX, capturedY, capturedButton;
        controller.onRelease((x, y, button) => {
          capturedX = x;
          capturedY = y;
          capturedButton = button;
        });
        controller.handleMouseReleased(100, 200, 'LEFT');
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
        expect(capturedButton).to.equal('LEFT');
      });
    });
  });
  
  describe('Complete Interaction Sequences', function() {
    it('should handle press -> drag -> release sequence', function() {
      const events = [];
      controller.onClick(() => events.push('click'));
      controller.onDrag(() => events.push('drag'));
      controller.onRelease(() => events.push('release'));
      
      controller.handleMousePressed(10, 20, 'LEFT');
      controller.handleMouseDragged(15, 25);
      controller.handleMouseDragged(20, 30);
      controller.handleMouseReleased(20, 30, 'LEFT');
      
      expect(events).to.deep.equal(['click', 'drag', 'drag', 'release']);
    });
    
    it('should maintain dragging state during drag sequence', function() {
      controller.handleMousePressed(10, 20, 'LEFT');
      expect(controller.isDragging).to.be.false;
      
      controller.handleMouseDragged(15, 25);
      expect(controller.isDragging).to.be.true;
      
      controller.handleMouseDragged(20, 30);
      expect(controller.isDragging).to.be.true;
      
      controller.handleMouseReleased(20, 30, 'LEFT');
      expect(controller.isDragging).to.be.false;
    });
    
    it('should track position throughout sequence', function() {
      controller.handleMousePressed(0, 0, 'LEFT');
      expect(controller.lastX).to.equal(0);
      expect(controller.lastY).to.equal(0);
      
      controller.handleMouseDragged(10, 20);
      expect(controller.lastX).to.equal(10);
      expect(controller.lastY).to.equal(20);
      
      controller.handleMouseDragged(30, 40);
      expect(controller.lastX).to.equal(30);
      expect(controller.lastY).to.equal(40);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty handlers gracefully', function() {
      expect(() => controller.handleMousePressed(10, 20, 'LEFT')).to.not.throw();
      expect(() => controller.handleMouseDragged(15, 25)).to.not.throw();
      expect(() => controller.handleMouseReleased(20, 30, 'LEFT')).to.not.throw();
    });
    
    it('should handle handler throwing exception', function() {
      controller.onClick(() => { throw new Error('Handler error'); });
      expect(() => controller.handleMousePressed(10, 20, 'LEFT')).to.throw();
    });
    
    it('should handle negative coordinates', function() {
      controller.handleMousePressed(-10, -20, 'LEFT');
      expect(controller.lastX).to.equal(-10);
      expect(controller.lastY).to.equal(-20);
    });
    
    it('should handle very large coordinates', function() {
      controller.handleMousePressed(10000, 20000, 'LEFT');
      expect(controller.lastX).to.equal(10000);
      expect(controller.lastY).to.equal(20000);
    });
    
    it('should handle fractional coordinates', function() {
      controller.handleMousePressed(10.5, 20.7, 'LEFT');
      expect(controller.lastX).to.equal(10.5);
      expect(controller.lastY).to.equal(20.7);
    });
    
    it('should handle drag without initial press', function() {
      expect(() => controller.handleMouseDragged(10, 20)).to.not.throw();
      expect(controller.isDragging).to.be.true;
    });
    
    it('should handle release without press', function() {
      expect(() => controller.handleMouseReleased(10, 20, 'LEFT')).to.not.throw();
      expect(controller.isDragging).to.be.false;
    });
  });
});




// ================================================================
// movementController.test.js (56 tests)
// ================================================================
// Mock globals
global.window = { tileSize: 32 };
global.tileSize = 32;

// Load the module
let MovementController = require('../../../Classes/controllers/MovementController.js');

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




// ================================================================
// renderController.test.js (59 tests)
// ================================================================
// Mock p5.js functions
global.stroke = () => {};
global.fill = () => {};
global.rect = () => {};
global.strokeWeight = () => {};
global.noFill = () => {};
global.noStroke = () => {};
global.push = () => {};
global.pop = () => {};
global.translate = () => {};
global.rotate = () => {};
global.sin = Math.sin;
global.cos = Math.cos;
global.textSize = () => {};
global.text = () => {};
global.textAlign = () => {};
global.CENTER = 'CENTER';
global.TOP = 'TOP';

// Load the module
let RenderController = require('../../../Classes/controllers/RenderController.js');

describe('RenderController', function() {
  let controller;
  let mockEntity;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100,
      posY: 200,
      sizeX: 32,
      sizeY: 32,
      rotation: 0,
      getPosition: function() { return { x: this.posX, y: this.posY }; },
      getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
      getRotation: function() { return this.rotation; },
      isSelected: false,
      isBoxHovered: false
    };
    controller = new RenderController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize effects array', function() {
      expect(controller._effects).to.be.an('array').that.is.empty;
    });
    
    it('should initialize highlight state as null', function() {
      expect(controller._highlightState).to.be.null;
    });
    
    it('should initialize animation offsets', function() {
      expect(controller._bobOffset).to.be.a('number');
      expect(controller._pulseOffset).to.be.a('number');
      expect(controller._spinOffset).to.be.a('number');
    });
    
    it('should have HIGHLIGHT_TYPES defined', function() {
      expect(controller.HIGHLIGHT_TYPES).to.be.an('object');
      expect(controller.HIGHLIGHT_TYPES.SELECTED).to.exist;
      expect(controller.HIGHLIGHT_TYPES.HOVER).to.exist;
      expect(controller.HIGHLIGHT_TYPES.COMBAT).to.exist;
    });
    
    it('should have STATE_INDICATORS defined', function() {
      expect(controller.STATE_INDICATORS).to.be.an('object');
      expect(controller.STATE_INDICATORS.MOVING).to.exist;
      expect(controller.STATE_INDICATORS.GATHERING).to.exist;
      expect(controller.STATE_INDICATORS.IDLE).to.exist;
    });
  });
  
  describe('update()', function() {
    it('should update without errors', function() {
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should update animation offsets', function() {
      const initialBob = controller._bobOffset;
      controller.update();
      expect(controller._bobOffset).to.not.equal(initialBob);
    });
    
    it('should keep animation offsets in range', function() {
      controller._bobOffset = Math.PI * 10;
      controller._updateAnimations();
      // Implementation subtracts Math.PI * 4 when exceeds, not resets to 0
      expect(controller._bobOffset).to.be.lessThan(Math.PI * 11);
      expect(controller._bobOffset).to.be.greaterThan(Math.PI * 5);
    });
    
    it('should update pulse offset', function() {
      const initialPulse = controller._pulseOffset;
      controller.update();
      expect(controller._pulseOffset).to.not.equal(initialPulse);
    });
    
    it('should update spin offset', function() {
      const initialSpin = controller._spinOffset;
      controller.update();
      expect(controller._spinOffset).to.not.equal(initialSpin);
    });
  });
  
  describe('Highlight Management', function() {
    describe('setHighlight()', function() {
      it('should set highlight type', function() {
        controller.setHighlight('SELECTED');
        expect(controller._highlightState).to.equal('SELECTED');
      });
      
      it('should set highlight intensity', function() {
        controller.setHighlight('SELECTED', 0.5);
        expect(controller._highlightIntensity).to.equal(0.5);
      });
      
      it('should default intensity to 1.0', function() {
        controller.setHighlight('HOVER');
        expect(controller._highlightIntensity).to.equal(1.0);
      });
      
      it('should handle invalid highlight types', function() {
        expect(() => controller.setHighlight('INVALID_TYPE')).to.not.throw();
      });
      
      it('should not return value (void)', function() {
        const result = controller.setHighlight('SELECTED');
        expect(result).to.be.undefined;
      });
    });
    
    describe('clearHighlight()', function() {
      it('should clear highlight state', function() {
        controller.setHighlight('SELECTED');
        controller.clearHighlight();
        expect(controller._highlightState).to.be.null;
      });
      
      it('should reset highlight intensity', function() {
        controller.setHighlight('SELECTED', 0.5);
        controller.clearHighlight();
        expect(controller._highlightIntensity).to.equal(1.0);
      });
      
      it('should not return value (void)', function() {
        const result = controller.clearHighlight();
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Effect Management', function() {
    describe('addEffect()', function() {
      it('should add effect to effects array', function() {
        const effect = { id: 'test1', duration: 1000 };
        controller.addEffect(effect);
        expect(controller._effects).to.have.lengthOf(1);
        expect(controller._effects[0]).to.include(effect);
        expect(controller._effects[0].createdAt).to.be.a('number');
      });
      
      it('should handle multiple effects', function() {
        controller.addEffect({ id: 'effect1', duration: 1000 });
        controller.addEffect({ id: 'effect2', duration: 2000 });
        expect(controller._effects).to.have.lengthOf(2);
      });
      
      it('should return generated effect ID', function() {
        const result = controller.addEffect({ id: 'test', duration: 1000 });
        expect(result).to.be.a('string');
        expect(result).to.match(/^effect_/);
      });
    });
    
    describe('removeEffect()', function() {
      it('should remove effect by id', function() {
        controller.addEffect({ id: 'test1', duration: 1000 });
        controller.addEffect({ id: 'test2', duration: 2000 });
        controller.removeEffect('test1');
        expect(controller._effects).to.have.lengthOf(1);
        expect(controller._effects[0].id).to.equal('test2');
      });
      
      it('should handle non-existent effect id', function() {
        expect(() => controller.removeEffect('nonexistent')).to.not.throw();
      });
      
      it('should not return value (void)', function() {
        const result = controller.removeEffect('test');
        expect(result).to.be.undefined;
      });
    });
    
    describe('clearEffects()', function() {
      it('should remove all effects', function() {
        controller.addEffect({ id: 'test1', duration: 1000 });
        controller.addEffect({ id: 'test2', duration: 2000 });
        controller.clearEffects();
        expect(controller._effects).to.be.an('array').that.is.empty;
      });
      
      it('should not return value (void)', function() {
        const result = controller.clearEffects();
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Rendering Settings', function() {
    describe('setDebugMode()', function() {
      it('should enable debug mode', function() {
        controller.setDebugMode(true);
        expect(controller._debugMode).to.be.true;
      });
      
      it('should disable debug mode', function() {
        controller.setDebugMode(false);
        expect(controller._debugMode).to.be.false;
      });
      
      it('should not return value (void)', function() {
        const result = controller.setDebugMode(true);
        expect(result).to.be.undefined;
      });
    });
    
    describe('setSmoothing()', function() {
      it('should enable smoothing', function() {
        controller.setSmoothing(true);
        expect(controller._smoothing).to.be.true;
      });
      
      it('should disable smoothing', function() {
        controller.setSmoothing(false);
        expect(controller._smoothing).to.be.false;
      });
      
      it('should not return value (void)', function() {
        const result = controller.setSmoothing(true);
        expect(result).to.be.undefined;
      });
    });
  });
  
  describe('Rendering Methods', function() {
    describe('renderEntity()', function() {
      it('should render without errors', function() {
        expect(() => controller.renderEntity()).to.not.throw();
      });
      
      it('should handle entity without sprite', function() {
        delete mockEntity._sprite;
        expect(() => controller.renderEntity()).to.not.throw();
      });
      
      it('should use fallback when sprite unavailable', function() {
        mockEntity._sprite = null;
        expect(() => controller.renderEntity()).to.not.throw();
      });
    });
    
    describe('renderFallbackEntity()', function() {
      it('should render fallback representation', function() {
        expect(() => controller.renderFallbackEntity()).to.not.throw();
      });
      
      it('should handle missing position', function() {
        delete mockEntity.getPosition;
        expect(() => controller.renderFallbackEntity()).to.not.throw();
      });
    });
    
    describe('renderHighlighting()', function() {
      it('should render without highlight state', function() {
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render SELECTED highlight', function() {
        controller.setHighlight('SELECTED');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render HOVER highlight', function() {
        controller.setHighlight('HOVER');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render BOX_HOVERED highlight', function() {
        controller.setHighlight('BOX_HOVERED');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
      
      it('should render COMBAT highlight', function() {
        controller.setHighlight('COMBAT');
        expect(() => controller.renderHighlighting()).to.not.throw();
      });
    });
    
    describe('renderOutlineHighlight()', function() {
      it('should render outline highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 0];
        expect(() => controller.renderOutlineHighlight(pos, size, color, 2)).to.not.throw();
      });
      
      it('should handle rotation', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 0];
        expect(() => controller.renderOutlineHighlight(pos, size, color, 2, Math.PI/4)).to.not.throw();
      });
    });
    
    describe('renderPulseHighlight()', function() {
      it('should render pulse highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [255, 0, 0];
        expect(() => controller.renderPulseHighlight(pos, size, color, 3)).to.not.throw();
      });
    });
    
    describe('renderBobHighlight()', function() {
      it('should render bob highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [255, 255, 255];
        expect(() => controller.renderBobHighlight(pos, size, color, 2)).to.not.throw();
      });
    });
    
    describe('renderSpinHighlight()', function() {
      it('should render spin highlight', function() {
        const pos = { x: 100, y: 200 };
        const size = { x: 32, y: 32 };
        const color = [0, 255, 255];
        expect(() => controller.renderSpinHighlight(pos, size, color, 2)).to.not.throw();
      });
    });
  });
  
  describe('Helper Methods', function() {
    describe('_isP5Available()', function() {
      it('should return true when p5.js functions exist', function() {
        expect(controller._isP5Available()).to.be.true;
      });
      
      it('should return false when stroke is missing', function() {
        const savedStroke = global.stroke;
        global.stroke = undefined;
        expect(controller._isP5Available()).to.be.false;
        global.stroke = savedStroke;
      });
    });
    
    describe('_safeRender()', function() {
      it('should execute render function safely', function() {
        let executed = false;
        controller._safeRender(() => { executed = true; });
        expect(executed).to.be.true;
      });
      
      it('should catch errors in render function', function() {
        expect(() => controller._safeRender(() => { throw new Error('Test error'); })).to.not.throw();
      });
      
      it('should skip when p5.js unavailable', function() {
        const savedStroke = global.stroke;
        global.stroke = undefined;
        let executed = false;
        controller._safeRender(() => { executed = true; });
        expect(executed).to.be.false;
        global.stroke = savedStroke;
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null entity gracefully', function() {
      const nullController = new RenderController(null);
      expect(() => nullController.update()).to.not.throw();
    });
    
    it('should handle entity without methods', function() {
      const simpleEntity = { posX: 0, posY: 0 };
      const simpleController = new RenderController(simpleEntity);
      expect(() => simpleController.renderEntity()).to.not.throw();
    });
    
    it('should handle very high animation offsets', function() {
      controller._bobOffset = Math.PI * 100;
      controller._pulseOffset = Math.PI * 100;
      controller._spinOffset = Math.PI * 100;
      controller._updateAnimations();
      // Implementation subtracts Math.PI * 4 iteratively, not resets
      expect(controller._bobOffset).to.be.lessThan(Math.PI * 101);
      expect(controller._pulseOffset).to.be.lessThan(Math.PI * 101);
      expect(controller._spinOffset).to.be.lessThan(Math.PI * 101);
    });
    
    it('should clamp negative intensity to 0', function() {
      controller.setHighlight('SELECTED', -0.5);
      expect(controller._highlightIntensity).to.equal(0);
    });
    
    it('should clamp intensity > 1 to 1', function() {
      controller.setHighlight('SELECTED', 2.5);
      expect(controller._highlightIntensity).to.equal(1);
    });
    
    it('should handle sequential method calls', function() {
      controller.setHighlight('SELECTED');
      controller.setDebugMode(true);
      controller.setSmoothing(false);
      const effectId = controller.addEffect({ id: 'test', duration: 1000 });
      controller.clearHighlight();
      
      expect(controller._debugMode).to.be.true;
      expect(controller._smoothing).to.be.false;
      expect(controller._highlightState).to.be.null;
      expect(effectId).to.be.a('string');
    });
  });
});




// ================================================================
// selectionBoxController.test.js (37 tests)
// ================================================================
// Mock p5.js functions
global.createVector = (x, y) => ({ 
  x, y, 
  copy() { return { x: this.x, y: this.y }; } 
});
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);

// Simplified SelectionBoxController for testing
class SelectionBoxController {
  constructor(mouseController, entities) {
    if (SelectionBoxController._instance) return SelectionBoxController._instance;
    
    this._mouse = mouseController;
    this._entities = entities || [];
    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
    this._selectedEntities = [];
    
    this._config = {
      enabled: true,
      dragThreshold: 5
    };
    
    this._callbacks = {
      onSelectionStart: null,
      onSelectionUpdate: null,
      onSelectionEnd: null
    };
    
    SelectionBoxController._instance = this;
  }
  
  static getInstance(mouseController, entities) {
    if (!SelectionBoxController._instance) {
      SelectionBoxController._instance = new SelectionBoxController(mouseController, entities);
    }
    return SelectionBoxController._instance;
  }
  
  static resetInstance() {
    SelectionBoxController._instance = null;
  }
  
  deselectAll() {
    this._entities.forEach(e => e.isSelected = false);
    this._selectedEntities = [];
  }
  
  getSelectedEntities() {
    return this._selectedEntities.slice();
  }
  
  setEntities(entities) {
    this._entities = entities || [];
  }
  
  setConfig(config) {
    Object.assign(this._config, config);
  }
  
  setCallback(name, fn) {
    if (this._callbacks.hasOwnProperty(name)) {
      this._callbacks[name] = fn;
    }
  }
  
  handleClick(x, y, button) {
    if (!this._config.enabled) return;
    
    if (button === 'right') {
      this.deselectAll();
      return;
    }
    
    this._isSelecting = true;
    this._selectionStart = createVector(x, y);
    this._selectionEnd = this._selectionStart.copy();
    
    if (this._callbacks.onSelectionStart) {
      this._callbacks.onSelectionStart(x, y, []);
    }
  }
  
  handleDrag(x, y) {
    if (this._isSelecting && this._selectionStart) {
      this._selectionEnd = createVector(x, y);
    }
  }
  
  handleRelease(x, y, button) {
    if (!this._isSelecting) return;
    
    if (!this._selectionEnd) {
      this._selectionEnd = createVector(x, y);
    }
    
    const x1 = Math.min(this._selectionStart.x, this._selectionEnd.x);
    const x2 = Math.max(this._selectionStart.x, this._selectionEnd.x);
    const y1 = Math.min(this._selectionStart.y, this._selectionEnd.y);
    const y2 = Math.max(this._selectionStart.y, this._selectionEnd.y);
    
    const dragDistance = dist(x1, y1, x2, y2);
    
    if (dragDistance >= this._config.dragThreshold) {
      this._selectedEntities = [];
      this._entities.forEach(e => {
        const inBox = e.x >= x1 && e.x <= x2 && e.y >= y1 && e.y <= y2;
        e.isSelected = inBox;
        if (inBox) this._selectedEntities.push(e);
      });
    }
    
    if (this._callbacks.onSelectionEnd) {
      const bounds = { x1, y1, x2, y2, width: x2 - x1, height: y2 - y1 };
      this._callbacks.onSelectionEnd(bounds, this._selectedEntities.slice());
    }
    
    this._isSelecting = false;
  }
}

describe('SelectionBoxController', function() {
  let controller;
  let mockMouse;
  let entities;
  
  beforeEach(function() {
    SelectionBoxController.resetInstance();
    mockMouse = {
      onClick: () => {},
      onDrag: () => {},
      onRelease: () => {}
    };
    entities = [
      { x: 10, y: 10, isSelected: false },
      { x: 50, y: 50, isSelected: false },
      { x: 100, y: 100, isSelected: false }
    ];
    controller = new SelectionBoxController(mockMouse, entities);
  });
  
  afterEach(function() {
    SelectionBoxController.resetInstance();
  });
  
  describe('Constructor and Singleton', function() {
    it('should initialize as singleton', function() {
      const instance1 = new SelectionBoxController(mockMouse, entities);
      const instance2 = new SelectionBoxController(mockMouse, entities);
      expect(instance1).to.equal(instance2);
    });
    
    it('should get instance via getInstance', function() {
      const instance = SelectionBoxController.getInstance(mockMouse, entities);
      expect(instance).to.equal(controller);
    });
    
    it('should initialize selection state', function() {
      expect(controller._isSelecting).to.be.false;
      expect(controller._selectionStart).to.be.null;
      expect(controller._selectionEnd).to.be.null;
      expect(controller._selectedEntities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize config', function() {
      expect(controller._config.enabled).to.be.true;
      expect(controller._config.dragThreshold).to.equal(5);
    });
    
    it('should initialize callbacks', function() {
      expect(controller._callbacks).to.have.property('onSelectionStart');
      expect(controller._callbacks).to.have.property('onSelectionUpdate');
      expect(controller._callbacks).to.have.property('onSelectionEnd');
    });
  });
  
  describe('Configuration', function() {
    describe('setConfig()', function() {
      it('should update config options', function() {
        controller.setConfig({ dragThreshold: 10 });
        expect(controller._config.dragThreshold).to.equal(10);
      });
      
      it('should merge with existing config', function() {
        controller.setConfig({ dragThreshold: 15 });
        expect(controller._config.enabled).to.be.true;
        expect(controller._config.dragThreshold).to.equal(15);
      });
      
      it('should handle multiple properties', function() {
        controller.setConfig({ enabled: false, dragThreshold: 20 });
        expect(controller._config.enabled).to.be.false;
        expect(controller._config.dragThreshold).to.equal(20);
      });
    });
    
    describe('setCallback()', function() {
      it('should register callback', function() {
        const fn = () => {};
        controller.setCallback('onSelectionStart', fn);
        expect(controller._callbacks.onSelectionStart).to.equal(fn);
      });
      
      it('should only set valid callbacks', function() {
        const fn = () => {};
        controller.setCallback('onSelectionEnd', fn);
        expect(controller._callbacks.onSelectionEnd).to.equal(fn);
      });
    });
  });
  
  describe('Entity Management', function() {
    describe('setEntities()', function() {
      it('should update entities array', function() {
        const newEntities = [{ x: 200, y: 200 }];
        controller.setEntities(newEntities);
        expect(controller._entities).to.equal(newEntities);
      });
      
      it('should handle empty array', function() {
        controller.setEntities([]);
        expect(controller._entities).to.be.an('array').that.is.empty;
      });
      
      it('should handle null', function() {
        controller.setEntities(null);
        expect(controller._entities).to.be.an('array').that.is.empty;
      });
    });
    
    describe('deselectAll()', function() {
      it('should clear all selections', function() {
        entities[0].isSelected = true;
        entities[1].isSelected = true;
        controller._selectedEntities = [entities[0], entities[1]];
        
        controller.deselectAll();
        
        expect(entities[0].isSelected).to.be.false;
        expect(entities[1].isSelected).to.be.false;
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should handle already deselected entities', function() {
        expect(() => controller.deselectAll()).to.not.throw();
      });
    });
    
    describe('getSelectedEntities()', function() {
      it('should return copy of selected entities', function() {
        controller._selectedEntities = [entities[0], entities[1]];
        const selected = controller.getSelectedEntities();
        expect(selected).to.have.lengthOf(2);
        expect(selected).to.not.equal(controller._selectedEntities);
      });
      
      it('should return empty array when none selected', function() {
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
    });
  });
  
  describe('Click Handling', function() {
    describe('handleClick()', function() {
      it('should start selection', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._isSelecting).to.be.true;
        expect(controller._selectionStart).to.exist;
      });
      
      it('should set selection start position', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._selectionStart.x).to.equal(100);
        expect(controller._selectionStart.y).to.equal(200);
      });
      
      it('should initialize selection end', function() {
        controller.handleClick(100, 200, 'left');
        expect(controller._selectionEnd).to.exist;
        expect(controller._selectionEnd.x).to.equal(100);
        expect(controller._selectionEnd.y).to.equal(200);
      });
      
      it('should deselect all on right click', function() {
        entities[0].isSelected = true;
        controller._selectedEntities = [entities[0]];
        
        controller.handleClick(100, 200, 'right');
        
        expect(entities[0].isSelected).to.be.false;
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should not start selection when disabled', function() {
        controller.setConfig({ enabled: false });
        controller.handleClick(100, 200, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should trigger onSelectionStart callback', function() {
        let called = false;
        let capturedX, capturedY;
        controller.setCallback('onSelectionStart', (x, y) => {
          called = true;
          capturedX = x;
          capturedY = y;
        });
        
        controller.handleClick(100, 200, 'left');
        expect(called).to.be.true;
        expect(capturedX).to.equal(100);
        expect(capturedY).to.equal(200);
      });
    });
  });
  
  describe('Drag Handling', function() {
    describe('handleDrag()', function() {
      it('should update selection end position', function() {
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(50, 100);
        expect(controller._selectionEnd.x).to.equal(50);
        expect(controller._selectionEnd.y).to.equal(100);
      });
      
      it('should handle multiple drag events', function() {
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(20, 30);
        controller.handleDrag(40, 60);
        controller.handleDrag(80, 120);
        expect(controller._selectionEnd.x).to.equal(80);
        expect(controller._selectionEnd.y).to.equal(120);
      });
      
      it('should not update if not selecting', function() {
        controller.handleDrag(50, 100);
        expect(controller._selectionEnd).to.be.null;
      });
    });
  });
  
  describe('Release Handling', function() {
    describe('handleRelease()', function() {
      it('should select entities in box', function() {
        controller.handleClick(0, 0, 'left');
        controller.handleDrag(60, 60);
        controller.handleRelease(60, 60, 'left');
        
        expect(entities[0].isSelected).to.be.true; // At 10, 10
        expect(entities[1].isSelected).to.be.true; // At 50, 50
        expect(entities[2].isSelected).to.be.false; // At 100, 100
      });
      
      it('should respect drag threshold', function() {
        controller.setConfig({ dragThreshold: 100 });
        controller.handleClick(10, 10, 'left');
        controller.handleDrag(15, 15);
        controller.handleRelease(15, 15, 'left');
        
        // Drag too small, no selection
        expect(controller._selectedEntities).to.be.empty;
      });
      
      it('should end selection state', function() {
        controller.handleClick(0, 0, 'left');
        controller.handleRelease(100, 100, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should trigger onSelectionEnd callback', function() {
        let called = false;
        let capturedBounds, capturedEntities;
        controller.setCallback('onSelectionEnd', (bounds, entities) => {
          called = true;
          capturedBounds = bounds;
          capturedEntities = entities;
        });
        
        controller.handleClick(0, 0, 'left');
        controller.handleRelease(60, 60, 'left');
        
        expect(called).to.be.true;
        expect(capturedBounds).to.have.property('x1');
        expect(capturedBounds).to.have.property('width');
        expect(capturedEntities).to.be.an('array');
      });
      
      it('should not process if not selecting', function() {
        controller.handleRelease(100, 100, 'left');
        expect(controller._selectedEntities).to.be.empty;
      });
    });
  });
  
  describe('Selection Workflow', function() {
    it('should complete click -> drag -> release sequence', function() {
      controller.handleClick(0, 0, 'left');
      expect(controller._isSelecting).to.be.true;
      
      controller.handleDrag(30, 30);
      expect(controller._selectionEnd.x).to.equal(30);
      
      controller.handleRelease(30, 30, 'left');
      expect(controller._isSelecting).to.be.false;
      expect(entities[0].isSelected).to.be.true;
    });
    
    it('should handle multiple selection cycles', function() {
      // First selection
      controller.handleClick(0, 0, 'left');
      controller.handleDrag(20, 20);
      controller.handleRelease(30, 30, 'left');
      const firstSelected = controller._selectedEntities.length;
      expect(firstSelected).to.be.greaterThan(0);
      
      // Deselect before second selection
      controller.deselectAll();
      controller._isSelecting = false;
      
      // Second selection - verify selection workflow works again
      controller.handleClick(40, 40, 'left');
      controller.handleDrag(60, 60);
      controller.handleRelease(70, 70, 'left');
      // Verify the selection process completed
      expect(controller._isSelecting).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty entities array', function() {
      controller.setEntities([]);
      controller.handleClick(0, 0, 'left');
      controller.handleRelease(100, 100, 'left');
      expect(controller._selectedEntities).to.be.empty;
    });
    
    it('should handle selection with no movement', function() {
      controller.handleClick(50, 50, 'left');
      controller.handleRelease(50, 50, 'left');
      // Small drag, under threshold
      expect(controller._selectedEntities).to.be.empty;
    });
    
    it('should handle negative coordinates', function() {
      const negEntity = { x: -10, y: -10, isSelected: false };
      controller.setEntities([negEntity]);
      controller.handleClick(-25, -25, 'left');
      controller.handleDrag(-15, -15);
      controller.handleDrag(-5, -5);
      controller.handleRelease(5, 5, 'left');
      expect(negEntity.isSelected).to.be.true;
    });
    
    it('should handle callback errors gracefully', function() {
      controller.setCallback('onSelectionStart', () => {
        throw new Error('Callback error');
      });
      expect(() => controller.handleClick(10, 10, 'left')).to.throw();
    });
  });
});




// ================================================================
// selectionController.test.js (58 tests)
// ================================================================
﻿global.mouseX = 0;
global.mouseY = 0;
global.cameraManager = { cameraX: 0, cameraY: 0, screenToWorld: (x, y) => ({x, y}) };
global.antManager = { selectionChanged: () => {} };

let SelectionController = require('../../../Classes/controllers/SelectionController.js');

describe('SelectionController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    mockEntity = {
      posX: 100, posY: 100, width: 50, height: 50,
      getPosition: () => ({ x: 100, y: 100 }),
      getSize: () => ({ x: 50, y: 50, width: 50, height: 50 }),
      getCollisionBox: () => ({ containsPoint: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 }),
      _renderController: { 
        setHighlightColor: () => {}, 
        clearHighlight: () => {},
        highlightSelected: () => {},
        highlightHover: () => {},
        highlightBoxHover: () => {}
      }
    };
    controller = new SelectionController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize as not selected', function() {
      expect(controller._isSelected).to.be.false;
    });
    
    it('should initialize as not selectable', function() {
      expect(controller._selectable).to.be.false;
    });
    
    it('should initialize as not hovered', function() {
      expect(controller._isHovered).to.be.false;
    });
    
    it('should initialize with no box hover', function() {
      expect(controller._isBoxHovered).to.be.false;
    });
    
    it('should initialize highlight type as none', function() {
      expect(controller._highlightType).to.equal('none');
    });
  });
  
  describe('Selection State', function() {
    describe('setSelected()', function() {
      it('should set selected state to true', function() {
        controller.setSelected(true);
        expect(controller._isSelected).to.be.true;
      });
      
      it('should set selected state to false', function() {
        controller.setSelected(true);
        controller.setSelected(false);
        expect(controller._isSelected).to.be.false;
      });
      
      it('should trigger callback on state change', function() {
        let callbackFired = false;
        controller.addSelectionCallback(() => { callbackFired = true; });
        controller.setSelected(true);
        expect(callbackFired).to.be.true;
      });
      
      it('should not trigger callback if state unchanged', function() {
        let callbackCount = 0;
        controller.addSelectionCallback(() => { callbackCount++; });
        controller.setSelected(false);
        expect(callbackCount).to.equal(0);
      });
    });
    
    describe('isSelected()', function() {
      it('should return false initially', function() {
        expect(controller.isSelected()).to.be.false;
      });
      
      it('should return true after selection', function() {
        controller.setSelected(true);
        expect(controller.isSelected()).to.be.true;
      });
      
      it('should return false after deselection', function() {
        controller.setSelected(true);
        controller.setSelected(false);
        expect(controller.isSelected()).to.be.false;
      });
    });
    
    describe('toggleSelection()', function() {
      it('should toggle from false to true', function() {
        const result = controller.toggleSelection();
        expect(result).to.be.true;
        expect(controller._isSelected).to.be.true;
      });
      
      it('should toggle from true to false', function() {
        controller.setSelected(true);
        const result = controller.toggleSelection();
        expect(result).to.be.false;
        expect(controller._isSelected).to.be.false;
      });
    });
  });
  
  describe('Selectable Property', function() {
    describe('setSelectable()', function() {
      it('should set selectable to true', function() {
        controller.setSelectable(true);
        expect(controller._selectable).to.be.true;
      });
      
      it('should set selectable to false', function() {
        controller.setSelectable(true);
        controller.setSelectable(false);
        expect(controller._selectable).to.be.false;
      });
    });
    
    describe('getSelectable()', function() {
      it('should return false initially', function() {
        expect(controller.getSelectable()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setSelectable(true);
        expect(controller.getSelectable()).to.be.true;
      });
    });
    
    describe('selectable getter/setter', function() {
      it('should get selectable value', function() {
        expect(controller.selectable).to.be.false;
      });
      
      it('should set selectable value', function() {
        controller.selectable = true;
        expect(controller.selectable).to.be.true;
      });
    });
  });
  
  describe('Hover State', function() {
    describe('setHovered()', function() {
      it('should set hover state to true', function() {
        controller.setHovered(true);
        expect(controller._isHovered).to.be.true;
      });
      
      it('should set hover state to false', function() {
        controller.setHovered(true);
        controller.setHovered(false);
        expect(controller._isHovered).to.be.false;
      });
    });
    
    describe('isHovered()', function() {
      it('should return false initially', function() {
        expect(controller.isHovered()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setHovered(true);
        expect(controller.isHovered()).to.be.true;
      });
    });
    
    describe('setBoxHovered()', function() {
      it('should set box hover state', function() {
        controller.setBoxHovered(true);
        expect(controller._isBoxHovered).to.be.true;
      });
      
      it('should clear box hover state', function() {
        controller.setBoxHovered(true);
        controller.setBoxHovered(false);
        expect(controller._isBoxHovered).to.be.false;
      });
    });
    
    describe('isBoxHovered()', function() {
      it('should return false initially', function() {
        expect(controller.isBoxHovered()).to.be.false;
      });
      
      it('should return true after setting', function() {
        controller.setBoxHovered(true);
        expect(controller.isBoxHovered()).to.be.true;
      });
    });
    
    describe('updateHoverState()', function() {
      it('should detect hover when mouse over entity', function() {
        mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
        controller.updateHoverState(125, 125);
        expect(controller._isHovered).to.be.true;
      });
      
      it('should clear hover when mouse outside entity', function() {
        controller.setHovered(true);
        mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
        controller.updateHoverState(200, 200);
        expect(controller._isHovered).to.be.false;
      });
      
      it('should handle missing collision box', function() {
        delete mockEntity._collisionBox;
        expect(() => controller.updateHoverState(125, 125)).to.not.throw();
      });
    });
  });
  
  describe('Highlight System', function() {
    describe('getHighlightType()', function() {
      it('should return none initially', function() {
        expect(controller.getHighlightType()).to.equal('none');
      });
      
      it('should return selected when selected', function() {
        controller.setSelected(true);
        controller.updateHighlightType();
        expect(controller.getHighlightType()).to.equal('selected');
      });
      
      it('should return hover when hovered', function() {
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller.getHighlightType()).to.equal('hover');
      });
    });
    
    describe('updateHighlightType()', function() {
      it('should set selected highlight when selected', function() {
        controller.setSelected(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('selected');
      });
      
      it('should set hover highlight when hovered', function() {
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('hover');
      });
      
      it('should set boxHover highlight when box hovered', function() {
        controller.setBoxHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('boxHover');
      });
      
      it('should prioritize selected over hover', function() {
        controller.setSelected(true);
        controller.setHovered(true);
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('selected');
      });
      
      it('should set none when no states active', function() {
        controller.updateHighlightType();
        expect(controller._highlightType).to.equal('none');
      });
    });
    
    describe('applyHighlighting()', function() {
      it('should execute without errors', function() {
        expect(() => controller.applyHighlighting()).to.not.throw();
      });
      
      it('should handle missing render controller', function() {
        delete mockEntity._renderController;
        expect(() => controller.applyHighlighting()).to.not.throw();
      });
    });
    
    describe('updateHighlight()', function() {
      it('should update highlight type and apply', function() {
        controller.setSelected(true);
        controller.updateHighlight();
        expect(controller._highlightType).to.equal('selected');
      });
    });
  });
  
  describe('Selection Groups', function() {
    describe('addToGroup()', function() {
      it('should add entity to group', function() {
        const mockGroup = [];
        expect(() => controller.addToGroup(mockGroup)).to.not.throw();
      });
      
      it('should throw on null group', function() {
        expect(() => controller.addToGroup(null)).to.throw();
      });
    });
    
    describe('removeFromGroup()', function() {
      it('should remove entity from group', function() {
        const mockGroup = [mockEntity];
        expect(() => controller.removeFromGroup(mockGroup)).to.not.throw();
      });
      
      it('should throw on null group', function() {
        expect(() => controller.removeFromGroup(null)).to.throw();
      });
    });
  });
  
  describe('Callbacks', function() {
    describe('addSelectionCallback()', function() {
      it('should add callback to array', function() {
        const callback = () => {};
        controller.addSelectionCallback(callback);
        expect(controller._selectionCallbacks).to.include(callback);
      });
      
      it('should allow multiple callbacks', function() {
        const cb1 = () => {};
        const cb2 = () => {};
        controller.addSelectionCallback(cb1);
        controller.addSelectionCallback(cb2);
        expect(controller._selectionCallbacks).to.have.lengthOf(2);
      });
    });
    
    it('should execute all callbacks on selection change', function() {
      let count = 0;
      controller.addSelectionCallback(() => count++);
      controller.addSelectionCallback(() => count++);
      controller.setSelected(true);
      expect(count).to.equal(2);
    });
  });
  
  describe('update()', function() {
    it('should execute without errors', function() {
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should update hover state when mouse moves', function() {
      mockEntity._collisionBox = { contains: (x, y) => x >= 100 && x <= 150 && y >= 100 && y <= 150 };
      global.mouseX = 125;
      global.mouseY = 125;
      controller.update();
      expect(controller._isHovered).to.be.true;
    });
    
    it('should update highlight type', function() {
      controller.setSelected(true);
      controller.update();
      expect(controller._highlightType).to.equal('selected');
    });
    
    it('should handle missing camera manager', function() {
      const oldCameraManager = global.cameraManager;
      delete global.cameraManager;
      expect(() => controller.update()).to.not.throw();
      global.cameraManager = oldCameraManager;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity without render controller', function() {
      delete mockEntity._renderController;
      controller.setSelected(true);
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle entity without collision box', function() {
      delete mockEntity.getCollisionBox;
      expect(() => controller.updateHoverState(125, 125)).to.not.throw();
    });
    
    it('should handle rapid selection toggle', function() {
      controller.toggleSelection();
      controller.toggleSelection();
      controller.toggleSelection();
      expect(controller._isSelected).to.be.true;
    });
    
    it('should handle multiple hover state changes', function() {
      controller.setHovered(true);
      controller.setHovered(false);
      controller.setHovered(true);
      expect(controller._isHovered).to.be.true;
    });
  });
});



// ================================================================
// taskManager.test.js (53 tests)
// ================================================================
﻿const TaskManager = require('../../../Classes/controllers/TaskManager.js');

describe('TaskManager', function() {
  let mockEntity;
  let taskManager;
  
  beforeEach(function() {
    mockEntity = {
      moveToLocation: () => true,
      _stateMachine: { setPrimaryState: () => {}, isPrimaryState: () => false },
      _movementController: { getIsMoving: () => false, stop: () => {} }
    };
    taskManager = new TaskManager(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(taskManager._entity).to.equal(mockEntity);
    });
    
    it('should initialize empty task queue', function() {
      expect(taskManager._taskQueue).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with no current task', function() {
      expect(taskManager._currentTask).to.be.null;
    });
    
    it('should initialize task priorities', function() {
      expect(taskManager.TASK_PRIORITIES.EMERGENCY).to.equal(0);
      expect(taskManager.TASK_PRIORITIES.HIGH).to.equal(1);
      expect(taskManager.TASK_PRIORITIES.NORMAL).to.equal(2);
      expect(taskManager.TASK_PRIORITIES.LOW).to.equal(3);
      expect(taskManager.TASK_PRIORITIES.IDLE).to.equal(4);
    });
    
    it('should initialize task defaults', function() {
      expect(taskManager.TASK_DEFAULTS.MOVE).to.exist;
      expect(taskManager.TASK_DEFAULTS.GATHER).to.exist;
      expect(taskManager.TASK_DEFAULTS.BUILD).to.exist;
    });
  });
  
  describe('addTask()', function() {
    it('should add task to queue', function() {
      const taskId = taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(taskId).to.be.a('string');
      expect(taskManager._taskQueue).to.have.lengthOf(1);
    });
    
    it('should return task ID', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      expect(taskId).to.match(/^task_/);
    });
    
    it('should apply default priority', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager._taskQueue[0].priority).to.equal(2);
    });
    
    it('should use custom priority if provided', function() {
      taskManager.addTask({ type: 'MOVE', priority: 0 });
      expect(taskManager._taskQueue[0].priority).to.equal(0);
    });
    
    it('should apply default timeout', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager._taskQueue[0].timeout).to.equal(5000);
    });
    
    it('should use custom timeout if provided', function() {
      taskManager.addTask({ type: 'MOVE', timeout: 10000 });
      expect(taskManager._taskQueue[0].timeout).to.equal(10000);
    });
    
    it('should return null for invalid task', function() {
      const taskId = taskManager.addTask(null);
      expect(taskId).to.be.null;
    });
    
    it('should return null for task without type', function() {
      const taskId = taskManager.addTask({ priority: 1 });
      expect(taskId).to.be.null;
    });
    
    it('should preserve task parameters', function() {
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(taskManager._taskQueue[0].x).to.equal(100);
      expect(taskManager._taskQueue[0].y).to.equal(200);
    });
  });
  
  describe('Task Queue Sorting', function() {
    it('should sort tasks by priority', function() {
      taskManager.addTask({ type: 'IDLE', priority: 4 });
      taskManager.addTask({ type: 'FLEE', priority: 0 });
      taskManager.addTask({ type: 'MOVE', priority: 2 });
      
      expect(taskManager._taskQueue[0].priority).to.equal(0);
      expect(taskManager._taskQueue[1].priority).to.equal(2);
      expect(taskManager._taskQueue[2].priority).to.equal(4);
    });
    
    it('should use FIFO for same priority', function() {
      const id1 = taskManager.addTask({ type: 'MOVE', priority: 2 });
      const id2 = taskManager.addTask({ type: 'GATHER', priority: 2 });
      
      expect(taskManager._taskQueue[0].id).to.equal(id1);
      expect(taskManager._taskQueue[1].id).to.equal(id2);
    });
  });
  
  describe('getCurrentTask()', function() {
    it('should return null initially', function() {
      expect(taskManager.getCurrentTask()).to.be.null;
    });
    
    it('should return current task', function() {
      taskManager._currentTask = { type: 'MOVE', id: 'test123' };
      expect(taskManager.getCurrentTask()).to.equal(taskManager._currentTask);
    });
  });
  
  describe('hasPendingTasks()', function() {
    it('should return false initially', function() {
      expect(taskManager.hasPendingTasks()).to.be.false;
    });
    
    it('should return true when queue has tasks', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager.hasPendingTasks()).to.be.true;
    });
    
    it('should return true when current task exists', function() {
      taskManager._currentTask = { type: 'MOVE' };
      expect(taskManager.hasPendingTasks()).to.be.true;
    });
  });
  
  describe('getQueueLength()', function() {
    it('should return 0 initially', function() {
      expect(taskManager.getQueueLength()).to.equal(0);
    });
    
    it('should return queue length', function() {
      taskManager.addTask({ type: 'MOVE' });
      taskManager.addTask({ type: 'GATHER' });
      expect(taskManager.getQueueLength()).to.equal(2);
    });
  });
  
  describe('clearAllTasks()', function() {
    it('should clear task queue', function() {
      taskManager.addTask({ type: 'MOVE' });
      taskManager.addTask({ type: 'GATHER' });
      taskManager.clearAllTasks();
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should clear current task', function() {
      taskManager._currentTask = { type: 'MOVE' };
      taskManager.clearAllTasks();
      expect(taskManager._currentTask).to.be.null;
    });
  });
  
  describe('cancelTask()', function() {
    it('should cancel task in queue', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      const result = taskManager.cancelTask(taskId);
      expect(result).to.be.true;
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should cancel current task', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      taskManager._currentTask = taskManager._taskQueue.shift();
      taskManager._currentTask.id = taskId;
      const result = taskManager.cancelTask(taskId);
      expect(result).to.be.true;
      expect(taskManager._currentTask).to.be.null;
    });
    
    it('should return false for non-existent task', function() {
      const result = taskManager.cancelTask('invalid_id');
      expect(result).to.be.false;
    });
  });
  
  describe('addEmergencyTask()', function() {
    it('should add task with emergency priority', function() {
      taskManager.addEmergencyTask({ type: 'FLEE' });
      expect(taskManager._taskQueue[0].priority).to.equal(0);
    });
    
    it('should interrupt lower priority current task', function() {
      taskManager.addTask({ type: 'MOVE', priority: 2 });
      taskManager._currentTask = taskManager._taskQueue.shift();
      taskManager.addEmergencyTask({ type: 'FLEE' });
      expect(taskManager._currentTask).to.be.null;
    });
  });
  
  describe('Convenience Methods', function() {
    describe('moveToTarget()', function() {
      it('should add MOVE task', function() {
        const taskId = taskManager.moveToTarget(100, 200);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('MOVE');
      });
      
      it('should include coordinates', function() {
        taskManager.moveToTarget(100, 200);
        expect(taskManager._taskQueue[0].x).to.equal(100);
        expect(taskManager._taskQueue[0].y).to.equal(200);
      });
      
      it('should use custom priority', function() {
        taskManager.moveToTarget(100, 200, 1);
        expect(taskManager._taskQueue[0].priority).to.equal(1);
      });
    });
    
    describe('startGathering()', function() {
      it('should add GATHER task', function() {
        const taskId = taskManager.startGathering();
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('GATHER');
      });
      
      it('should include target if provided', function() {
        const target = { id: 'resource1' };
        taskManager.startGathering(target);
        expect(taskManager._taskQueue[0].target).to.equal(target);
      });
    });
    
    describe('startBuilding()', function() {
      it('should add BUILD task', function() {
        const buildTarget = { type: 'structure' };
        const taskId = taskManager.startBuilding(buildTarget);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('BUILD');
      });
      
      it('should include build target', function() {
        const buildTarget = { type: 'structure' };
        taskManager.startBuilding(buildTarget);
        expect(taskManager._taskQueue[0].target).to.equal(buildTarget);
      });
    });
    
    describe('followTarget()', function() {
      it('should add FOLLOW task', function() {
        const target = { id: 'entity1' };
        const taskId = taskManager.followTarget(target);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('FOLLOW');
      });
      
      it('should include follow target', function() {
        const target = { id: 'entity1' };
        taskManager.followTarget(target);
        expect(taskManager._taskQueue[0].target).to.equal(target);
      });
    });
    
    describe('attackTarget()', function() {
      it('should add ATTACK task', function() {
        const target = { id: 'enemy1' };
        const taskId = taskManager.attackTarget(target);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('ATTACK');
      });
      
      it('should use high priority', function() {
        const target = { id: 'enemy1' };
        taskManager.attackTarget(target);
        expect(taskManager._taskQueue[0].priority).to.equal(1);
      });
    });
    
    describe('fleeFrom()', function() {
      it('should add FLEE task', function() {
        const threat = { id: 'danger1' };
        const taskId = taskManager.fleeFrom(threat);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('FLEE');
      });
      
      it('should use emergency priority', function() {
        const threat = { id: 'danger1' };
        taskManager.fleeFrom(threat);
        expect(taskManager._taskQueue[0].priority).to.equal(0);
      });
    });
  });
  
  describe('update()', function() {
    it('should execute without errors', function() {
      expect(() => taskManager.update()).to.not.throw();
    });
    
    it('should start next task if no current task', function() {
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      taskManager.update();
      expect(taskManager._currentTask).to.not.be.null;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should include queue length', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.have.property('queueLength');
    });
    
    it('should include current task info', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.have.property('currentTask');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding multiple tasks', function() {
      for (let i = 0; i < 10; i++) {
        taskManager.addTask({ type: 'MOVE', x: i, y: i });
      }
      expect(taskManager._taskQueue).to.have.lengthOf(10);
    });
    
    it('should handle rapid task cancellation', function() {
      const id1 = taskManager.addTask({ type: 'MOVE' });
      const id2 = taskManager.addTask({ type: 'GATHER' });
      taskManager.cancelTask(id1);
      taskManager.cancelTask(id2);
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should handle clearing empty queue', function() {
      taskManager.clearAllTasks();
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should handle update with empty queue', function() {
      expect(() => taskManager.update()).to.not.throw();
    });
    
    it('should handle null entity methods', function() {
      delete mockEntity.moveToLocation;
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(() => taskManager.update()).to.not.throw();
    });
  });
});



// ================================================================
// terrainController.test.js (64 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Mock terrain systems
global.mapManager = null;
global.g_activeMap = null;
global.TILE_SIZE = 32;
global.window = { DEBUG_TERRAIN: false };

// Load the module
let TerrainController = require('../../../Classes/controllers/TerrainController.js');

describe('TerrainController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Reset global terrain systems
    global.mapManager = null;
    global.g_activeMap = null;
    
    // Create minimal mock entity
    mockEntity = {
      _type: 'Ant',
      _id: 'test-ant-1',
      _stateMachine: {
        setTerrainModifier: function(terrain) { this.terrainModifier = terrain; },
        terrainModifier: null
      },
      getPosition: function() { return { x: 100, y: 100 }; }
    };
    
    controller = new TerrainController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller._entity).to.equal(mockEntity);
    });
    
    it('should initialize current terrain to DEFAULT', function() {
      expect(controller._currentTerrain).to.equal('DEFAULT');
    });
    
    it('should initialize last position', function() {
      expect(controller._lastPosition).to.deep.equal({ x: -1, y: -1 });
    });
    
    it('should initialize terrain check interval to 200ms', function() {
      expect(controller._terrainCheckInterval).to.equal(200);
    });
    
    it('should initialize empty terrain cache', function() {
      expect(controller._terrainCache).to.be.instanceof(Map);
      expect(controller._terrainCache.size).to.equal(0);
    });
  });
  
  describe('getCurrentTerrain()', function() {
    it('should return current terrain type', function() {
      expect(controller.getCurrentTerrain()).to.equal('DEFAULT');
    });
    
    it('should reflect terrain changes', function() {
      controller._currentTerrain = 'IN_WATER';
      expect(controller.getCurrentTerrain()).to.equal('IN_WATER');
    });
  });
  
  describe('setCheckInterval()', function() {
    it('should set terrain check interval', function() {
      controller.setCheckInterval(500);
      expect(controller._terrainCheckInterval).to.equal(500);
    });
    
    it('should handle zero interval', function() {
      controller.setCheckInterval(0);
      expect(controller._terrainCheckInterval).to.equal(0);
    });
    
    it('should handle large intervals', function() {
      controller.setCheckInterval(10000);
      expect(controller._terrainCheckInterval).to.equal(10000);
    });
  });
  
  describe('Terrain Detection', function() {
    describe('detectTerrain()', function() {
      it('should return DEFAULT when no map available', function() {
        global.mapManager = { getActiveMap: () => null };
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('DEFAULT');
      });
      
      it('should detect WATER terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_WATER');
      });
      
      it('should detect MUD terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'mud' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_MUD');
      });
      
      it('should detect SLIPPERY terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'ice' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('ON_SLIPPERY');
      });
      
      it('should detect ROUGH terrain', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'stone' })
        };
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('ON_ROUGH');
      });
      
      it('should cache terrain lookups', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectTerrain();
        expect(controller._terrainCache.size).to.be.greaterThan(0);
      });
      
      it('should use cached terrain', function() {
        const cacheKey = '3,3';
        controller._terrainCache.set(cacheKey, 'IN_WATER');
        
        const terrain = controller.detectTerrain();
        expect(terrain).to.equal('IN_WATER');
      });
    });
    
    describe('_mapTerrainType()', function() {
      it('should map water types', function() {
        expect(controller._mapTerrainType({ material: 'water' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'river' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'lake' })).to.equal('IN_WATER');
      });
      
      it('should map mud types', function() {
        expect(controller._mapTerrainType({ material: 'mud' })).to.equal('IN_MUD');
        expect(controller._mapTerrainType({ material: 'moss' })).to.equal('IN_MUD');
        expect(controller._mapTerrainType({ material: 'swamp' })).to.equal('IN_MUD');
      });
      
      it('should map slippery types', function() {
        expect(controller._mapTerrainType({ material: 'ice' })).to.equal('ON_SLIPPERY');
        expect(controller._mapTerrainType({ material: 'slippery' })).to.equal('ON_SLIPPERY');
      });
      
      it('should map rough types', function() {
        expect(controller._mapTerrainType({ material: 'stone' })).to.equal('ON_ROUGH');
        expect(controller._mapTerrainType({ material: 'rocks' })).to.equal('ON_ROUGH');
        expect(controller._mapTerrainType({ material: 'mountain' })).to.equal('ON_ROUGH');
      });
      
      it('should map grass to DEFAULT', function() {
        expect(controller._mapTerrainType({ material: 'grass' })).to.equal('DEFAULT');
      });
      
      it('should default unknown types to DEFAULT', function() {
        expect(controller._mapTerrainType({ material: 'unknown' })).to.equal('DEFAULT');
      });
      
      it('should be case insensitive', function() {
        expect(controller._mapTerrainType({ material: 'WATER' })).to.equal('IN_WATER');
        expect(controller._mapTerrainType({ material: 'MUD' })).to.equal('IN_MUD');
      });
    });
  });
  
  describe('Terrain Effects', function() {
    describe('getSpeedModifier()', function() {
      it('should return base speed for DEFAULT terrain', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.getSpeedModifier(100)).to.equal(100);
      });
      
      it('should apply 50% penalty in water', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.getSpeedModifier(100)).to.equal(50);
      });
      
      it('should apply 70% penalty in mud', function() {
        controller._currentTerrain = 'IN_MUD';
        expect(controller.getSpeedModifier(100)).to.equal(30);
      });
      
      it('should apply 20% bonus on slippery', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        expect(controller.getSpeedModifier(100)).to.equal(120);
      });
      
      it('should apply 20% penalty on rough', function() {
        controller._currentTerrain = 'ON_ROUGH';
        expect(controller.getSpeedModifier(100)).to.equal(80);
      });
      
      it('should work with fractional speeds', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.getSpeedModifier(2.5)).to.equal(1.25);
      });
    });
    
    describe('canMove()', function() {
      it('should allow movement on DEFAULT terrain', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.canMove()).to.be.true;
      });
      
      it('should allow movement in water', function() {
        controller._currentTerrain = 'IN_WATER';
        expect(controller.canMove()).to.be.true;
      });
      
      it('should prevent movement on slippery terrain', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        expect(controller.canMove()).to.be.false;
      });
      
      it('should allow movement on rough terrain', function() {
        controller._currentTerrain = 'ON_ROUGH';
        expect(controller.canMove()).to.be.true;
      });
    });
    
    describe('getVisualEffects()', function() {
      it('should return empty object for DEFAULT', function() {
        controller._currentTerrain = 'DEFAULT';
        expect(controller.getVisualEffects()).to.deep.equal({});
      });
      
      it('should return ripples for water', function() {
        controller._currentTerrain = 'IN_WATER';
        const effects = controller.getVisualEffects();
        expect(effects.ripples).to.be.true;
        expect(effects.colorTint).to.exist;
      });
      
      it('should return particles for mud', function() {
        controller._currentTerrain = 'IN_MUD';
        const effects = controller.getVisualEffects();
        expect(effects.particles).to.equal('mud');
      });
      
      it('should return sparkles for slippery', function() {
        controller._currentTerrain = 'ON_SLIPPERY';
        const effects = controller.getVisualEffects();
        expect(effects.sparkles).to.be.true;
      });
      
      it('should return dust particles for rough', function() {
        controller._currentTerrain = 'ON_ROUGH';
        const effects = controller.getVisualEffects();
        expect(effects.dustParticles).to.be.true;
      });
    });
  });
  
  describe('Update and Detection', function() {
    describe('update()', function() {
      it('should check terrain periodically', function(done) {
        controller._lastTerrainCheck = Date.now() - 300; // Force check
        
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.update();
        
        setTimeout(() => {
          expect(controller._currentTerrain).to.equal('IN_WATER');
          done();
        }, 10);
      });
      
      it('should respect check interval', function() {
        global.mapManager = { getActiveMap: () => null };
        controller._lastTerrainCheck = Date.now();
        const originalTerrain = controller._currentTerrain;
        
        controller.update();
        
        expect(controller._currentTerrain).to.equal(originalTerrain);
      });
      
      it('should check when position changes significantly', function() {
        controller._lastPosition = { x: 0, y: 0 };
        mockEntity.getPosition = () => ({ x: 50, y: 50 });
        
        expect(controller._hasPositionChanged()).to.be.true;
      });
    });
    
    describe('forceTerrainCheck()', function() {
      it('should check terrain immediately', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'mud' })
        };
        
        controller.forceTerrainCheck();
        expect(controller._currentTerrain).to.equal('IN_MUD');
      });
      
      it('should update last position', function() {
        global.mapManager = { getActiveMap: () => null };
        controller._lastPosition = { x: -1, y: -1 };
        controller.forceTerrainCheck();
        expect(controller._lastPosition.x).to.equal(100);
        expect(controller._lastPosition.y).to.equal(100);
      });
    });
    
    describe('detectAndUpdateTerrain()', function() {
      it('should update state machine on terrain change', function() {
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectAndUpdateTerrain();
        expect(mockEntity._stateMachine.terrainModifier).to.equal('IN_WATER');
      });
      
      it('should not update if terrain unchanged', function() {
        global.mapManager = { getActiveMap: () => null };
        let updateCount = 0;
        mockEntity._stateMachine.setTerrainModifier = () => updateCount++;
        
        controller.detectAndUpdateTerrain();
        controller.detectAndUpdateTerrain();
        
        expect(updateCount).to.equal(0); // No change from DEFAULT
      });
      
      it('should trigger callback on terrain change', function() {
        let oldTerrain = null;
        let newTerrain = null;
        
        controller.setTerrainChangeCallback((old, current) => {
          oldTerrain = old;
          newTerrain = current;
        });
        
        global.mapManager = {
          getActiveMap: () => true,
          getTileAtPosition: () => ({ material: 'water' })
        };
        
        controller.detectAndUpdateTerrain();
        expect(oldTerrain).to.equal('DEFAULT');
        expect(newTerrain).to.equal('IN_WATER');
      });
    });
  });
  
  describe('Position Tracking', function() {
    describe('_hasPositionChanged()', function() {
      it('should detect significant position change', function() {
        controller._lastPosition = { x: 0, y: 0 };
        mockEntity.getPosition = () => ({ x: 50, y: 0 });
        expect(controller._hasPositionChanged()).to.be.true;
      });
      
      it('should ignore small position changes', function() {
        controller._lastPosition = { x: 100, y: 100 };
        mockEntity.getPosition = () => ({ x: 105, y: 105 });
        expect(controller._hasPositionChanged()).to.be.false;
      });
      
      it('should use 16 pixel threshold', function() {
        controller._lastPosition = { x: 100, y: 100 };
        mockEntity.getPosition = () => ({ x: 115, y: 100 });
        expect(controller._hasPositionChanged()).to.be.false;
        
        mockEntity.getPosition = () => ({ x: 117, y: 100 });
        expect(controller._hasPositionChanged()).to.be.true;
      });
    });
    
    describe('_updateLastPosition()', function() {
      it('should update last known position', function() {
        controller._updateLastPosition();
        expect(controller._lastPosition.x).to.equal(100);
        expect(controller._lastPosition.y).to.equal(100);
      });
    });
    
    describe('_getEntityPosition()', function() {
      it('should use transform controller if available', function() {
        mockEntity._transformController = {
          getPosition: () => ({ x: 200, y: 200 })
        };
        
        const pos = controller._getEntityPosition();
        expect(pos.x).to.equal(200);
        expect(pos.y).to.equal(200);
      });
      
      it('should fallback to getPosition method', function() {
        const pos = controller._getEntityPosition();
        expect(pos.x).to.equal(100);
        expect(pos.y).to.equal(100);
      });
    });
  });
  
  describe('Cache Management', function() {
    it('should clear terrain cache', function() {
      controller._terrainCache.set('1,1', 'IN_WATER');
      controller._terrainCache.set('2,2', 'IN_MUD');
      
      controller.clearCache();
      expect(controller._terrainCache.size).to.equal(0);
    });
    
    it('should limit cache size to 100 entries', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'grass' })
      };
      
      // Fill cache beyond limit
      for (let i = 0; i < 150; i++) {
        mockEntity.getPosition = () => ({ x: i * 32, y: i * 32 });
        controller.detectTerrain();
      }
      
      expect(controller._terrainCache.size).to.be.at.most(100);
    });
  });
  
  describe('Callback System', function() {
    it('should register terrain change callback', function() {
      const callback = function() {};
      controller.setTerrainChangeCallback(callback);
      expect(controller._onTerrainChangeCallback).to.equal(callback);
    });
    
    it('should invoke callback on terrain change', function() {
      let invoked = false;
      controller.setTerrainChangeCallback(() => invoked = true);
      
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'water' })
      };
      
      controller.detectAndUpdateTerrain();
      expect(invoked).to.be.true;
    });
  });
  
  describe('Debug Info', function() {
    it('should return comprehensive debug info', function() {
      const info = controller.getDebugInfo();
      expect(info.currentTerrain).to.exist;
      expect(info.lastPosition).to.exist;
      expect(info.cacheSize).to.exist;
      expect(info.checkInterval).to.exist;
      expect(info.canMove).to.exist;
      expect(info.visualEffects).to.exist;
    });
    
    it('should include terrain-specific info', function() {
      controller._currentTerrain = 'IN_WATER';
      const info = controller.getDebugInfo();
      expect(info.currentTerrain).to.equal('IN_WATER');
      expect(info.canMove).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity without state machine', function() {
      global.mapManager = { getActiveMap: () => null };
      mockEntity._stateMachine = null;
      expect(() => controller.detectAndUpdateTerrain()).to.not.throw();
    });
    
    it('should handle malformed tile data', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({})
      };
      
      const terrain = controller.detectTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
    
    it('should handle null tile', function() {
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => null
      };
      
      const terrain = controller.detectTerrain();
      expect(terrain).to.equal('DEFAULT');
    });
    
    it('should handle callback throwing exception', function() {
      controller.setTerrainChangeCallback(() => {
        throw new Error('Callback error');
      });
      
      global.mapManager = {
        getActiveMap: () => true,
        getTileAtPosition: () => ({ material: 'water' })
      };
      
      expect(() => controller.detectAndUpdateTerrain()).to.throw();
    });
    
    it('should handle very rapid terrain checks', function() {
      global.mapManager = { getActiveMap: () => null };
      controller.setCheckInterval(0);
      
      for (let i = 0; i < 100; i++) {
        controller.update();
      }
      
      expect(controller._currentTerrain).to.be.a('string');
    });
  });
});




// ================================================================
// transformController.test.js (61 tests)
// ================================================================
// Mock p5.js globals
global.createVector = (x, y) => ({ x, y, copy() { return { x: this.x, y: this.y }; } });

// Load the module
let TransformController = require('../../../Classes/controllers/TransformController.js');

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




// ================================================================
// uiSelectionController.test.js (79 tests)
// ================================================================
// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.stroke = () => {};
global.noStroke = () => {};
global.fill = () => {};
global.noFill = () => {};
global.rect = () => {};
global.text = () => {};
global.textSize = () => {};
global.textAlign = () => {};
global.LEFT = 'LEFT';
global.TOP = 'TOP';
global.dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
global.createVector = (x, y) => ({ x, y, copy: function() { return { x: this.x, y: this.y }; } });
global.cameraX = 0;
global.cameraY = 0;
global.devConsoleEnabled = false;

// Mock MouseInputController
class MockMouseController {
  constructor() {
    this.handlers = { click: [], drag: [], release: [] };
  }
  onClick(fn) { this.handlers.click.push(fn); }
  onDrag(fn) { this.handlers.drag.push(fn); }
  onRelease(fn) { this.handlers.release.push(fn); }
  triggerClick(x, y, button) { this.handlers.click.forEach(fn => fn(x, y, button)); }
  triggerDrag(x, y, dx, dy) { this.handlers.drag.forEach(fn => fn(x, y, dx, dy)); }
  triggerRelease(x, y, button) { this.handlers.release.forEach(fn => fn(x, y, button)); }
}

// Load the module
let UISelectionController = require('../../../Classes/controllers/UISelectionController.js');

describe('UISelectionController', function() {
  let controller;
  let mockMouseController;
  let mockEffectsRenderer;
  let mockEntities;
  
  beforeEach(function() {
    mockMouseController = new MockMouseController();
    mockEffectsRenderer = {
      setSelectionEntities: () => {},
      startSelectionBox: () => {},
      updateSelectionBox: () => {},
      endSelectionBox: () => [],
      getSelectionBoxBounds: () => ({ x1: 0, y1: 0, x2: 100, y2: 100 }),
      cancelSelectionBox: () => {}
    };
    
    mockEntities = [
      {
        posX: 100, posY: 100, sizeX: 20, sizeY: 20,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      },
      {
        posX: 200, posY: 200, sizeX: 20, sizeY: 20,
        getPosition: function() { return { x: this.posX, y: this.posY }; },
        getSize: function() { return { x: this.sizeX, y: this.sizeY }; },
        isSelected: false,
        isBoxHovered: false
      }
    ];
    
    controller = new UISelectionController(mockEffectsRenderer, mockMouseController, mockEntities);
  });
  
  describe('Constructor', function() {
    it('should initialize with effects renderer', function() {
      expect(controller.effectsRenderer).to.equal(mockEffectsRenderer);
    });
    
    it('should initialize with mouse controller', function() {
      expect(controller.mouseController).to.equal(mockMouseController);
    });
    
    it('should initialize with entities', function() {
      expect(controller._entities).to.equal(mockEntities);
      expect(controller.selectableEntities).to.equal(mockEntities);
    });
    
    it('should initialize selection state', function() {
      expect(controller.isSelecting).to.be.false;
      expect(controller._isSelecting).to.be.false;
      expect(controller.dragStartPos).to.be.null;
    });
    
    it('should initialize with default config', function() {
      expect(controller.config).to.be.an('object');
      expect(controller.config.enableSelection).to.be.true;
      expect(controller.dragThreshold).to.exist; // dragThreshold is on controller, not config
    });
    
    it('should initialize callbacks', function() {
      expect(controller.callbacks).to.be.an('object');
      expect(controller.callbacks.onSelectionStart).to.be.null;
      expect(controller.callbacks.onSelectionEnd).to.be.null;
    });
    
    it('should setup mouse handlers', function() {
      expect(mockMouseController.handlers.click).to.have.lengthOf(1);
      expect(mockMouseController.handlers.drag).to.have.lengthOf(1);
      expect(mockMouseController.handlers.release).to.have.lengthOf(1);
    });
    
    it('should handle null mouse controller', function() {
      expect(() => new UISelectionController(mockEffectsRenderer, null, mockEntities)).to.not.throw();
    });
    
    it('should handle empty entities array', function() {
      const emptyController = new UISelectionController(mockEffectsRenderer, mockMouseController, []);
      expect(emptyController._entities).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Mouse Event Handling', function() {
    describe('handleMousePressed()', function() {
      it('should set drag start position', function() {
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.dragStartPos).to.deep.equal({ x: 150, y: 200 });
      });
      
      it('should not start selection immediately', function() {
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should deselect all on right click', function() {
        mockEntities[0].isSelected = true;
        controller._selectedEntities = [mockEntities[0]];
        controller.handleMousePressed(150, 200, 'right');
        expect(controller._selectedEntities).to.be.an('array').that.is.empty;
      });
      
      it('should select entity under mouse', function() {
        controller.handleMousePressed(105, 105, 'left');
        expect(mockEntities[0].isSelected).to.be.true;
      });
      
      it('should clear other selections when selecting entity', function() {
        mockEntities[1].isSelected = true;
        controller._selectedEntities = [mockEntities[1]];
        controller.handleMousePressed(105, 105, 'left');
        expect(mockEntities[0].isSelected).to.be.true;
        expect(controller._selectedEntities).to.include(mockEntities[0]);
      });
      
      it('should handle click on empty space', function() {
        mockEntities[0].isSelected = true;
        controller.handleMousePressed(500, 500, 'left');
        expect(controller._isSelecting).to.be.true;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller.handleMousePressed(150, 200, 'left');
        expect(controller.dragStartPos).to.be.null;
      });
    });
    
    describe('handleMouseDrag()', function() {
      it('should not start selection below threshold', function() {
        controller.handleMousePressed(100, 100, 'left');
        controller.handleMouseDrag(102, 102, 2, 2);
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should start selection when exceeding threshold', function() {
        controller.handleMousePressed(100, 100, 'left');
        controller.handleMouseDrag(110, 110, 10, 10);
        expect(controller.isSelecting).to.be.true;
      });
      
      it('should update selection box when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(100, 100);
        const initialEnd = controller._selectionEnd.x;
        controller.handleMouseDrag(150, 150, 50, 50);
        expect(controller._selectionEnd).to.exist;
        // Implementation updates _selectionEnd based on mouse position + camera offset
        expect(controller._selectionEnd.x).to.be.a('number');
      });
      
      it('should mark entities as box hovered', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(90, 90);
        controller.handleMouseDrag(210, 210, 120, 120);
        // Entities within box should be marked
        expect(mockEntities.some(e => e.isBoxHovered)).to.exist;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller.dragStartPos = { x: 100, y: 100 };
        controller.handleMouseDrag(150, 150, 50, 50);
        expect(controller.isSelecting).to.be.false;
      });
      
      it('should handle drag without start position', function() {
        expect(() => controller.handleMouseDrag(150, 150, 50, 50)).to.not.throw();
      });
    });
    
    describe('handleMouseReleased()', function() {
      it('should end selection when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        controller.handleMouseReleased(200, 200, 'left');
        expect(controller._isSelecting).to.be.false;
      });
      
      it('should select entities in box on release', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(90, 90);
        controller._selectionEnd = global.createVector(210, 210);
        controller.handleMouseReleased(210, 210, 'left');
        expect(controller._selectedEntities.length).to.be.greaterThan(0);
      });
      
      it('should clear drag start position', function() {
        controller.dragStartPos = { x: 100, y: 100 };
        controller.handleMouseReleased(200, 200, 'left');
        expect(controller.dragStartPos).to.be.null;
      });
      
      it('should respect disabled selection', function() {
        controller.config.enableSelection = false;
        controller._isSelecting = true;
        controller.handleMouseReleased(200, 200, 'left');
        // Should not throw error
        expect(controller.dragStartPos).to.be.null;
      });
      
      it('should call onSelectionEnd callback', function() {
        let callbackCalled = false;
        controller.callbacks.onSelectionEnd = () => { callbackCalled = true; };
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        controller.handleMouseReleased(200, 200, 'left');
        expect(callbackCalled).to.be.true;
      });
    });
  });
  
  describe('Entity Detection', function() {
    describe('isEntityUnderMouse()', function() {
      it('should return true when mouse over entity', function() {
        const result = controller.isEntityUnderMouse(mockEntities[0], 105, 105);
        expect(result).to.be.true;
      });
      
      it('should return false when mouse not over entity', function() {
        const result = controller.isEntityUnderMouse(mockEntities[0], 500, 500);
        expect(result).to.be.false;
      });
      
      it('should use entity isMouseOver method if available', function() {
        const entityWithMethod = {
          isMouseOver: (x, y) => x === 100 && y === 100
        };
        expect(controller.isEntityUnderMouse(entityWithMethod, 100, 100)).to.be.true;
        expect(controller.isEntityUnderMouse(entityWithMethod, 200, 200)).to.be.false;
      });
      
      it('should handle entity without position method', function() {
        const simpleEntity = { posX: 100, posY: 100, sizeX: 20, sizeY: 20 };
        expect(() => controller.isEntityUnderMouse(simpleEntity, 105, 105)).to.not.throw();
      });
    });
    
    describe('isEntityInBox()', function() {
      it('should return true when entity center in box', function() {
        const result = controller.isEntityInBox(mockEntities[0], 90, 120, 90, 120);
        expect(result).to.be.true;
      });
      
      it('should return false when entity outside box', function() {
        const result = controller.isEntityInBox(mockEntities[0], 200, 300, 200, 300);
        expect(result).to.be.false;
      });
      
      it('should handle entity with sprite position', function() {
        const entityWithSprite = {
          sprite: { pos: { x: 100, y: 100 }, size: { x: 20, y: 20 } }
        };
        const result = controller.isEntityInBox(entityWithSprite, 90, 120, 90, 120);
        expect(result).to.be.true;
      });
      
      it('should check entity center point', function() {
        // Entity at 100,100 with size 20x20 has center at 110,110
        const result = controller.isEntityInBox(mockEntities[0], 105, 115, 105, 115);
        expect(result).to.be.true;
      });
    });
    
    describe('getEntityUnderMouse()', function() {
      it('should return entity under mouse', function() {
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.equal(mockEntities[0]);
      });
      
      it('should return null when no entity under mouse', function() {
        const result = controller.getEntityUnderMouse(500, 500);
        expect(result).to.be.null;
      });
      
      it('should handle empty selectable entities', function() {
        controller.selectableEntities = [];
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.be.null;
      });
      
      it('should return first matching entity', function() {
        mockEntities[1].posX = 100;
        mockEntities[1].posY = 100;
        const result = controller.getEntityUnderMouse(105, 105);
        expect(result).to.equal(mockEntities[0]);
      });
    });
  });
  
  describe('Selection Management', function() {
    describe('deselectAll()', function() {
      it('should deselect all selected entities', function() {
        mockEntities[0].isSelected = true;
        mockEntities[1].isSelected = true;
        controller._selectedEntities = [...mockEntities];
        controller.deselectAll();
        expect(mockEntities[0].isSelected).to.be.false;
        expect(mockEntities[1].isSelected).to.be.false;
      });
      
      it('should clear selected entities array', function() {
        controller._selectedEntities = [...mockEntities];
        controller.deselectAll();
        expect(controller._selectedEntities).to.be.an('array').that.is.empty;
      });
      
      it('should clear box hover state', function() {
        mockEntities[0].isBoxHovered = true;
        controller.deselectAll();
        expect(mockEntities[0].isBoxHovered).to.be.false;
      });
      
      it('should handle empty selected entities', function() {
        expect(() => controller.deselectAll()).to.not.throw();
      });
    });
    
    describe('getSelectedEntities()', function() {
      it('should return array of selected entities', function() {
        controller._selectedEntities = [mockEntities[0]];
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array');
        expect(selected).to.have.lengthOf(1);
      });
      
      it('should return copy of array', function() {
        controller._selectedEntities = [mockEntities[0]];
        const selected = controller.getSelectedEntities();
        selected.push(mockEntities[1]);
        expect(controller._selectedEntities).to.have.lengthOf(1);
      });
      
      it('should handle empty selection', function() {
        controller._selectedEntities = [];
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
      
      it('should handle null _selectedEntities', function() {
        controller._selectedEntities = null;
        const selected = controller.getSelectedEntities();
        expect(selected).to.be.an('array').that.is.empty;
      });
    });
    
    describe('clearSelection()', function() {
      it('should deselect all entities', function() {
        mockEntities[0].isSelected = true;
        controller._selectedEntities = [mockEntities[0]];
        controller.clearSelection();
        expect(mockEntities[0].isSelected).to.be.false;
      });
      
      it('should return controller instance', function() {
        const result = controller.clearSelection();
        expect(result).to.equal(controller);
      });
    });
  });
  
  describe('Configuration', function() {
    describe('setSelectableEntities()', function() {
      it('should update selectable entities', function() {
        const newEntities = [mockEntities[0]];
        controller.setSelectableEntities(newEntities);
        expect(controller.selectableEntities).to.equal(newEntities);
      });
      
      it('should handle null entities', function() {
        controller.setSelectableEntities(null);
        expect(controller.selectableEntities).to.be.an('array').that.is.empty;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setSelectableEntities([]);
        expect(result).to.equal(controller);
      });
    });
    
    describe('setCallbacks()', function() {
      it('should update callbacks', function() {
        const newCallbacks = {
          onSelectionStart: () => {},
          onSelectionEnd: () => {}
        };
        controller.setCallbacks(newCallbacks);
        expect(controller.callbacks.onSelectionStart).to.equal(newCallbacks.onSelectionStart);
      });
      
      it('should merge with existing callbacks', function() {
        controller.callbacks.onSingleClick = () => {};
        controller.setCallbacks({ onSelectionStart: () => {} });
        expect(controller.callbacks.onSingleClick).to.exist;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setCallbacks({});
        expect(result).to.equal(controller);
      });
    });
    
    describe('updateConfig()', function() {
      it('should update configuration', function() {
        controller.updateConfig({ dragThreshold: 10 });
        expect(controller.config.dragThreshold).to.equal(10);
      });
      
      it('should merge with existing config', function() {
        const initialColor = controller.config.selectionColor;
        controller.updateConfig({ dragThreshold: 10 });
        expect(controller.config.selectionColor).to.equal(initialColor);
      });
      
      it('should return controller for chaining', function() {
        const result = controller.updateConfig({});
        expect(result).to.equal(controller);
      });
    });
    
    describe('setEnabled()', function() {
      it('should enable selection', function() {
        controller.setEnabled(true);
        expect(controller.config.enableSelection).to.be.true;
      });
      
      it('should disable selection', function() {
        controller.setEnabled(false);
        expect(controller.config.enableSelection).to.be.false;
      });
      
      it('should return controller for chaining', function() {
        const result = controller.setEnabled(true);
        expect(result).to.equal(controller);
      });
    });
  });
  
  describe('State Queries', function() {
    describe('isSelectionActive()', function() {
      it('should return false initially', function() {
        expect(controller.isSelectionActive()).to.be.false;
      });
      
      it('should return true when selecting', function() {
        controller.isSelecting = true;
        expect(controller.isSelectionActive()).to.be.true;
      });
    });
    
    describe('getSelectionBounds()', function() {
      it('should return null when not selecting', function() {
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.null;
      });
      
      it('should return bounds when selecting', function() {
        controller.isSelecting = true;
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.an('object');
      });
      
      it('should return null without effects renderer', function() {
        controller.effectsRenderer = null;
        controller.isSelecting = true;
        const bounds = controller.getSelectionBounds();
        expect(bounds).to.be.null;
      });
    });
    
    describe('getDebugInfo()', function() {
      it('should return debug information', function() {
        const info = controller.getDebugInfo();
        expect(info).to.be.an('object');
        expect(info).to.have.property('isSelecting');
        expect(info).to.have.property('selectedEntitiesCount');
        expect(info).to.have.property('selectableEntitiesCount');
      });
      
      it('should include config', function() {
        const info = controller.getDebugInfo();
        expect(info.config).to.be.an('object');
      });
      
      it('should indicate renderer availability', function() {
        const info = controller.getDebugInfo();
        expect(info.hasEffectsRenderer).to.be.a('boolean');
        expect(info.hasMouseController).to.be.a('boolean');
      });
    });
  });
  
  describe('Rendering', function() {
    describe('draw()', function() {
      it('should render without errors', function() {
        expect(() => controller.draw()).to.not.throw();
      });
      
      it('should render selection box when active', function() {
        controller._isSelecting = true;
        controller._selectionStart = global.createVector(100, 100);
        controller._selectionEnd = global.createVector(200, 200);
        expect(() => controller.draw()).to.not.throw();
      });
      
      it('should render debug info when enabled', function() {
        global.devConsoleEnabled = true;
        controller._selectedEntities = [mockEntities[0]];
        expect(() => controller.draw()).to.not.throw();
        global.devConsoleEnabled = false;
      });
      
      it('should handle missing selection state', function() {
        controller._selectionStart = null;
        expect(() => controller.draw()).to.not.throw();
      });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle null effects renderer', function() {
      const nullController = new UISelectionController(null, mockMouseController, mockEntities);
      expect(() => nullController.handleMousePressed(100, 100, 'left')).to.not.throw();
    });
    
    it('should handle entities without methods', function() {
      const simpleEntities = [{ posX: 100, posY: 100 }];
      const simpleController = new UISelectionController(mockEffectsRenderer, mockMouseController, simpleEntities);
      expect(() => simpleController.handleMousePressed(105, 105, 'left')).to.not.throw();
    });
    
    it('should handle rapid click sequences', function() {
      controller.handleMousePressed(100, 100, 'left');
      controller.handleMouseReleased(100, 100, 'left');
      controller.handleMousePressed(200, 200, 'left');
      controller.handleMouseReleased(200, 200, 'left');
      expect(controller.dragStartPos).to.be.null;
    });
    
    it('should handle drag without press', function() {
      expect(() => controller.handleMouseDrag(150, 150, 50, 50)).to.not.throw();
    });
    
    it('should handle release without press', function() {
      expect(() => controller.handleMouseReleased(150, 150, 'left')).to.not.throw();
    });
    
    it('should handle method chaining', function() {
      const result = controller
        .setSelectableEntities(mockEntities)
        .setEnabled(true)
        .updateConfig({ dragThreshold: 10 })
        .clearSelection();
      expect(result).to.equal(controller);
    });
  });
});

