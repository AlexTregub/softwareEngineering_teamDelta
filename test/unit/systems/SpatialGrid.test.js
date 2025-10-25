/**
 * Unit Tests for SpatialGrid
 * Tests spatial hash grid for entity proximity queries
 */

const { expect } = require('chai');

// Mock globals
global.TILE_SIZE = 32;

// Load SpatialGrid
const SpatialGrid = require('../../../Classes/systems/SpatialGrid');

describe('SpatialGrid', function() {
  
  let grid;
  
  beforeEach(function() {
    grid = new SpatialGrid();
  });
  
  describe('Constructor', function() {
    
    it('should create grid with default cell size', function() {
      const grid = new SpatialGrid();
      
      expect(grid._cellSize).to.equal(32); // Default TILE_SIZE
      expect(grid._grid).to.be.instanceOf(Map);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should create grid with custom cell size', function() {
      const grid = new SpatialGrid(64);
      
      expect(grid._cellSize).to.equal(64);
    });
    
    it('should initialize with empty grid', function() {
      const grid = new SpatialGrid();
      
      expect(grid._grid.size).to.equal(0);
      expect(grid._entityCount).to.equal(0);
    });
  });
  
  describe('addEntity()', function() {
    
    it('should add entity to correct cell', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle multiple entities in same cell', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 60,
        getY: () => 60,
        getPosition: () => ({ x: 60, y: 60 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      expect(grid._entityCount).to.equal(2);
    });
    
    it('should handle entities at different cells', function() {
      const entity1 = {
        getX: () => 10,
        getY: () => 10,
        getPosition: () => ({ x: 10, y: 10 })
      };
      const entity2 = {
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      expect(grid._entityCount).to.equal(2);
      expect(grid._grid.size).to.be.greaterThan(1);
    });
    
    it('should handle entity at origin', function() {
      const entity = {
        getX: () => 0,
        getY: () => 0,
        getPosition: () => ({ x: 0, y: 0 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle entity with negative coordinates', function() {
      const entity = {
        getX: () => -50,
        getY: () => -50,
        getPosition: () => ({ x: -50, y: -50 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should not add same entity twice', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      grid.addEntity(entity); // Duplicate
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('removeEntity()', function() {
    
    it('should remove existing entity', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      expect(grid._entityCount).to.equal(1);
      
      grid.removeEntity(entity);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should handle removing non-existent entity', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      // Should not throw
      grid.removeEntity(entity);
      expect(grid._entityCount).to.equal(0);
    });
    
    it('should only remove specified entity', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 60,
        getY: () => 60,
        getPosition: () => ({ x: 60, y: 60 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      grid.removeEntity(entity1);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('updateEntity()', function() {
    
    let movingEntity;
    
    beforeEach(function() {
      movingEntity = {
        x: 50,
        y: 50,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      };
    });
    
    it('should update entity position to new cell', function() {
      grid.addEntity(movingEntity);
      
      // Move entity to different cell
      movingEntity.x = 150;
      movingEntity.y = 150;
      
      grid.updateEntity(movingEntity);
      
      // Entity should still be in grid
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle update in same cell', function() {
      grid.addEntity(movingEntity);
      
      // Move within same cell
      movingEntity.x = 55;
      movingEntity.y = 55;
      
      grid.updateEntity(movingEntity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle updating non-existent entity by adding it', function() {
      // Update without add should add it
      grid.updateEntity(movingEntity);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
  
  describe('queryRadius()', function() {
    
    beforeEach(function() {
      // Add entities in grid pattern
      for (let x = 0; x < 200; x += 50) {
        for (let y = 0; y < 200; y += 50) {
          grid.addEntity({
            x,
            y,
            getX: function() { return this.x; },
            getY: function() { return this.y; },
            getPosition: function() { return { x: this.x, y: this.y }; }
          });
        }
      }
    });
    
    it('should find entities within radius', function() {
      const results = grid.queryRadius(100, 100, 30);
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
      
      // All results should be within radius
      results.forEach(entity => {
        const dx = entity.x - 100;
        const dy = entity.y - 100;
        const distance = Math.sqrt(dx * dx + dy * dy);
        expect(distance).to.be.at.most(30);
      });
    });
    
    it('should return empty array when no entities nearby', function() {
      const results = grid.queryRadius(1000, 1000, 30);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
    
    it('should handle filter function', function() {
      const results = grid.queryRadius(100, 100, 100, (entity) => {
        return entity.x === 100;
      });
      
      // All results should match filter
      results.forEach(entity => {
        expect(entity.x).to.equal(100);
      });
    });
    
    it('should find entities at exact radius boundary', function() {
      const results = grid.queryRadius(50, 50, 50);
      
      // Should include entity at (100, 50) which is exactly 50 pixels away
      expect(results.some(e => e.x === 100 && e.y === 50)).to.be.true;
    });
  });
  
  describe('queryRect()', function() {
    
    beforeEach(function() {
      // Add entities in grid pattern
      for (let x = 0; x < 200; x += 50) {
        for (let y = 0; y < 200; y += 50) {
          grid.addEntity({
            x,
            y,
            getX: function() { return this.x; },
            getY: function() { return this.y; },
            getPosition: function() { return { x: this.x, y: this.y }; }
          });
        }
      }
    });
    
    it('should find entities within rectangle', function() {
      const results = grid.queryRect(80, 80, 60, 60);
      
      expect(results).to.be.an('array');
      
      // All results should be within rectangle
      results.forEach(entity => {
        expect(entity.x).to.be.at.least(80);
        expect(entity.x).to.be.at.most(140);
        expect(entity.y).to.be.at.least(80);
        expect(entity.y).to.be.at.most(140);
      });
    });
    
    it('should return empty array when no entities in rectangle', function() {
      const results = grid.queryRect(1000, 1000, 50, 50);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
    
    it('should handle filter function', function() {
      const results = grid.queryRect(0, 0, 200, 200, (entity) => {
        return entity.x === 100;
      });
      
      // All results should match filter
      results.forEach(entity => {
        expect(entity.x).to.equal(100);
      });
    });
    
    it('should handle rectangle at origin', function() {
      const results = grid.queryRect(0, 0, 50, 50);
      
      expect(results).to.be.an('array');
      expect(results.length).to.be.greaterThan(0);
    });
  });
  
  describe('queryCell()', function() {
    
    it('should return entities in specific cell', function() {
      const entity = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      
      grid.addEntity(entity);
      
      const results = grid.queryCell(50, 50);
      
      expect(results).to.be.an('array');
      expect(results).to.include(entity);
    });
    
    it('should return empty array for empty cell', function() {
      const results = grid.queryCell(1000, 1000);
      
      expect(results).to.be.an('array');
      expect(results).to.be.empty;
    });
  });
  
  describe('findNearest()', function() {
    
    beforeEach(function() {
      // Add entities at known distances
      grid.addEntity({
        id: 'far',
        x: 200,
        y: 200,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
      grid.addEntity({
        id: 'near',
        x: 110,
        y: 110,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
      grid.addEntity({
        id: 'closest',
        x: 105,
        y: 105,
        getX: function() { return this.x; },
        getY: function() { return this.y; },
        getPosition: function() { return { x: this.x, y: this.y }; }
      });
    });
    
    it('should find nearest entity', function() {
      const nearest = grid.findNearest(100, 100);
      
      expect(nearest).to.exist;
      expect(nearest.id).to.equal('closest');
    });
    
    it('should return null when no entities within maxRadius', function() {
      const nearest = grid.findNearest(100, 100, 1);
      
      expect(nearest).to.be.null;
    });
    
    it('should respect filter function', function() {
      const nearest = grid.findNearest(100, 100, Infinity, (entity) => {
        return entity.id === 'near';
      });
      
      expect(nearest).to.exist;
      expect(nearest.id).to.equal('near');
    });
    
    it('should return null when no entities', function() {
      const emptyGrid = new SpatialGrid();
      const nearest = emptyGrid.findNearest(100, 100);
      
      expect(nearest).to.be.null;
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all entities', function() {
      grid.addEntity({
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      });
      grid.addEntity({
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      });
      
      expect(grid._entityCount).to.equal(2);
      
      grid.clear();
      
      expect(grid._entityCount).to.equal(0);
      expect(grid._grid.size).to.equal(0);
    });
    
    it('should handle clearing empty grid', function() {
      grid.clear();
      
      expect(grid._entityCount).to.equal(0);
    });
  });
  
  describe('getStats()', function() {
    
    it('should return statistics object', function() {
      const stats = grid.getStats();
      
      expect(stats).to.be.an('object');
      expect(stats.totalEntities).to.be.a('number');
      expect(stats.occupiedCells).to.be.a('number');
      expect(stats.cellSize).to.be.a('number');
    });
    
    it('should reflect actual entity count', function() {
      grid.addEntity({
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      });
      grid.addEntity({
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      });
      
      const stats = grid.getStats();
      
      expect(stats.totalEntities).to.equal(2);
    });
    
    it('should include memory estimate', function() {
      const stats = grid.getStats();
      
      expect(stats.estimatedMemoryBytes).to.be.a('number');
      expect(stats.estimatedMemoryBytes).to.be.at.least(0);
    });
  });
  
  describe('getAllEntities()', function() {
    
    it('should return all entities', function() {
      const entity1 = {
        getX: () => 50,
        getY: () => 50,
        getPosition: () => ({ x: 50, y: 50 })
      };
      const entity2 = {
        getX: () => 100,
        getY: () => 100,
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity1);
      grid.addEntity(entity2);
      
      const all = grid.getAllEntities();
      
      expect(all).to.be.an('array');
      expect(all).to.have.lengthOf(2);
      expect(all).to.include(entity1);
      expect(all).to.include(entity2);
    });
    
    it('should return empty array for empty grid', function() {
      const all = grid.getAllEntities();
      
      expect(all).to.be.an('array');
      expect(all).to.be.empty;
    });
  });
  
  describe('Performance Characteristics', function() {
    
    it('should handle large number of entities efficiently', function() {
      const startTime = Date.now();
      
      // Add 1000 entities
      for (let i = 0; i < 1000; i++) {
        grid.addEntity({
          id: i,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          getX: function() { return this.x; },
          getY: function() { return this.y; },
          getPosition: function() { return { x: this.x, y: this.y }; }
        });
      }
      
      const addTime = Date.now() - startTime;
      
      // Should complete in reasonable time (< 1 second)
      expect(addTime).to.be.lessThan(1000);
      expect(grid._entityCount).to.equal(1000);
    });
    
    it('should query efficiently with many entities', function() {
      // Add 100 entities
      for (let i = 0; i < 100; i++) {
        grid.addEntity({
          id: i,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          getX: function() { return this.x; },
          getY: function() { return this.y; },
          getPosition: function() { return { x: this.x, y: this.y }; }
        });
      }
      
      const startTime = Date.now();
      
      // Perform 100 queries
      for (let i = 0; i < 100; i++) {
        grid.queryRadius(500, 500, 100);
      }
      
      const queryTime = Date.now() - startTime;
      
      // Should complete in reasonable time (< 100ms)
      expect(queryTime).to.be.lessThan(100);
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle entity with only getPosition method', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle very large coordinates', function() {
      const entity = {
        getX: () => 1000000,
        getY: () => 1000000,
        getPosition: () => ({ x: 1000000, y: 1000000 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
    
    it('should handle fractional coordinates', function() {
      const entity = {
        getX: () => 50.7,
        getY: () => 75.3,
        getPosition: () => ({ x: 50.7, y: 75.3 })
      };
      
      grid.addEntity(entity);
      
      expect(grid._entityCount).to.equal(1);
    });
  });
});
