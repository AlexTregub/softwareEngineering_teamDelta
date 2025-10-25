const { expect } = require('chai');

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
const AntUtilities = require('../../../Classes/controllers/AntUtilities.js');

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
