const { expect } = require('chai');

// Mock logging functions on globalThis
globalThis.logDebug = globalThis.logDebug || function() {};
globalThis.logVerbose = globalThis.logVerbose || function() {};
globalThis.logNormal = globalThis.logNormal || function() {};

// Mock SpatialGrid before requiring SpatialGridManager
global.SpatialGrid = require('../../../Classes/systems/SpatialGrid.js');

const SpatialGridManager = require('../../../Classes/managers/SpatialGridManager.js');

describe('SpatialGridManager', function() {
  let manager;
  let mockEntity1, mockEntity2, mockEntity3, mockEntity4;
  
  beforeEach(function() {
    manager = new SpatialGridManager(64);
    
    // Create mock entities
    mockEntity1 = {
      id: 'entity1',
      type: 'Ant',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 100,
      _y: 100
    };
    
    mockEntity2 = {
      id: 'entity2',
      type: 'Ant',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 200,
      _y: 200
    };
    
    mockEntity3 = {
      id: 'entity3',
      type: 'Resource',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 150,
      _y: 150
    };
    
    mockEntity4 = {
      id: 'entity4',
      type: 'Building',
      getX: function() { return this._x; },
      getY: function() { return this._y; },
      _x: 300,
      _y: 300
    };
  });
  
  describe('Constructor', function() {
    it('should initialize with empty entities', function() {
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should initialize _allEntities array', function() {
      expect(manager._allEntities).to.be.an('array').that.is.empty;
    });
    
    it('should initialize _entitiesByType map', function() {
      expect(manager._entitiesByType).to.be.instanceOf(Map);
      expect(manager._entitiesByType.size).to.equal(0);
    });
    
    it('should initialize stats', function() {
      const stats = manager.getStats();
      expect(stats.operations.adds).to.equal(0);
      expect(stats.operations.removes).to.equal(0);
      expect(stats.operations.updates).to.equal(0);
      expect(stats.operations.queries).to.equal(0);
    });
    
    it('should create spatial grid', function() {
      expect(manager._grid).to.exist;
      expect(manager.getGrid()).to.exist;
    });
    
    it('should accept custom cell size', function() {
      const customManager = new SpatialGridManager(128);
      expect(customManager._grid._cellSize).to.equal(128);
    });
  });
  
  describe('addEntity()', function() {
    it('should add entity successfully', function() {
      const result = manager.addEntity(mockEntity1);
      expect(result).to.be.true;
      expect(manager.getEntityCount()).to.equal(1);
    });
    
    it('should return false for null entity', function() {
      const result = manager.addEntity(null);
      expect(result).to.be.false;
    });
    
    it('should return false for undefined entity', function() {
      const result = manager.addEntity(undefined);
      expect(result).to.be.false;
    });
    
    it('should add entity to _allEntities array', function() {
      manager.addEntity(mockEntity1);
      expect(manager._allEntities).to.include(mockEntity1);
    });
    
    it('should track entity by type', function() {
      manager.addEntity(mockEntity1);
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.include(mockEntity1);
    });
    
    it('should increment add count', function() {
      const beforeStats = manager.getStats();
      manager.addEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.adds).to.equal(beforeStats.operations.adds + 1);
    });
    
    it('should add multiple entities', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      expect(manager.getEntityCount()).to.equal(3);
    });
    
    it('should maintain insertion order', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      const all = manager.getAllEntities();
      expect(all[0]).to.equal(mockEntity1);
      expect(all[1]).to.equal(mockEntity2);
      expect(all[2]).to.equal(mockEntity3);
    });
    
    it('should track multiple types', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity3);
      manager.addEntity(mockEntity4);
      expect(manager._entitiesByType.size).to.equal(3);
    });
  });
  
  describe('removeEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should remove entity successfully', function() {
      const result = manager.removeEntity(mockEntity1);
      expect(result).to.be.true;
      expect(manager.getEntityCount()).to.equal(2);
    });
    
    it('should return false for null entity', function() {
      const result = manager.removeEntity(null);
      expect(result).to.be.false;
    });
    
    it('should remove entity from _allEntities array', function() {
      manager.removeEntity(mockEntity1);
      expect(manager._allEntities).to.not.include(mockEntity1);
    });
    
    it('should remove entity from type tracking', function() {
      manager.removeEntity(mockEntity1);
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.not.include(mockEntity1);
    });
    
    it('should clean up empty type arrays', function() {
      manager.removeEntity(mockEntity3); // Only Resource
      expect(manager._entitiesByType.has('Resource')).to.be.false;
    });
    
    it('should increment remove count', function() {
      const beforeStats = manager.getStats();
      manager.removeEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.removes).to.equal(beforeStats.operations.removes + 1);
    });
    
    it('should handle removing non-existent entity', function() {
      const result = manager.removeEntity(mockEntity4);
      expect(result).to.be.false;
    });
    
    it('should maintain array integrity after removal', function() {
      manager.removeEntity(mockEntity2);
      expect(manager.getAllEntities()).to.deep.equal([mockEntity1, mockEntity3]);
    });
  });
  
  describe('updateEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
    });
    
    it('should update entity position', function() {
      mockEntity1._x = 500;
      mockEntity1._y = 500;
      const result = manager.updateEntity(mockEntity1);
      expect(result).to.be.true;
    });
    
    it('should return false for null entity', function() {
      const result = manager.updateEntity(null);
      expect(result).to.be.false;
    });
    
    it('should increment update count', function() {
      const beforeStats = manager.getStats();
      manager.updateEntity(mockEntity1);
      const afterStats = manager.getStats();
      expect(afterStats.operations.updates).to.equal(beforeStats.operations.updates + 1);
    });
    
    it('should handle multiple updates', function() {
      for (let i = 0; i < 10; i++) {
        mockEntity1._x = i * 10;
        manager.updateEntity(mockEntity1);
      }
      const stats = manager.getStats();
      expect(stats.operations.updates).to.be.at.least(10);
    });
  });
  
  describe('getNearbyEntities()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
      manager.addEntity(mockEntity4); // 300, 300
    });
    
    it('should find entities within radius', function() {
      const nearby = manager.getNearbyEntities(100, 100, 100);
      expect(nearby.length).to.be.greaterThan(0);
    });
    
    it('should filter by type', function() {
      const nearbyAnts = manager.getNearbyEntities(150, 150, 100, { type: 'Ant' });
      for (const entity of nearbyAnts) {
        expect(entity.type).to.equal('Ant');
      }
    });
    
    it('should use custom filter function', function() {
      const filter = (entity) => entity.id === 'entity1';
      const nearby = manager.getNearbyEntities(100, 100, 200, { filter });
      expect(nearby).to.have.lengthOf(1);
      expect(nearby[0].id).to.equal('entity1');
    });
    
    it('should combine type and custom filter', function() {
      const customFilter = (entity) => entity._x < 150;
      const nearby = manager.getNearbyEntities(100, 100, 200, { type: 'Ant', filter: customFilter });
      for (const entity of nearby) {
        expect(entity.type).to.equal('Ant');
        expect(entity._x).to.be.lessThan(150);
      }
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.getNearbyEntities(100, 100, 50);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
    
    it('should return empty array when no entities nearby', function() {
      const nearby = manager.getNearbyEntities(10000, 10000, 10);
      expect(nearby).to.be.an('array').that.is.empty;
    });
  });
  
  describe('getEntitiesInRect()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
      manager.addEntity(mockEntity4); // 300, 300
    });
    
    it('should find entities in rectangle', function() {
      const inRect = manager.getEntitiesInRect(50, 50, 200, 200);
      expect(inRect.length).to.be.greaterThan(0);
    });
    
    it('should filter by type', function() {
      const antsInRect = manager.getEntitiesInRect(0, 0, 250, 250, { type: 'Ant' });
      for (const entity of antsInRect) {
        expect(entity.type).to.equal('Ant');
      }
    });
    
    it('should use custom filter', function() {
      const filter = (entity) => entity.id.includes('2');
      const inRect = manager.getEntitiesInRect(0, 0, 500, 500, { filter });
      for (const entity of inRect) {
        expect(entity.id).to.include('2');
      }
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.getEntitiesInRect(0, 0, 100, 100);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
    
    it('should return empty array for empty rectangle', function() {
      const inRect = manager.getEntitiesInRect(10000, 10000, 10, 10);
      expect(inRect).to.be.an('array').that.is.empty;
    });
  });
  
  describe('findNearestEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // 100, 100
      manager.addEntity(mockEntity2); // 200, 200
      manager.addEntity(mockEntity3); // 150, 150
    });
    
    it('should find nearest entity', function() {
      const nearest = manager.findNearestEntity(105, 105);
      expect(nearest).to.equal(mockEntity1);
    });
    
    it('should return null when no entities', function() {
      manager.clear();
      const nearest = manager.findNearestEntity(100, 100);
      expect(nearest).to.be.null;
    });
    
    it('should respect maxRadius', function() {
      const nearest = manager.findNearestEntity(100, 100, 10);
      expect(nearest).to.equal(mockEntity1);
    });
    
    it('should return null when outside maxRadius', function() {
      const nearest = manager.findNearestEntity(10000, 10000, 10);
      expect(nearest).to.be.null;
    });
    
    it('should filter by type', function() {
      const nearest = manager.findNearestEntity(155, 155, Infinity, { type: 'Resource' });
      expect(nearest).to.equal(mockEntity3);
    });
    
    it('should use custom filter', function() {
      const filter = (entity) => entity.id !== 'entity1';
      const nearest = manager.findNearestEntity(100, 100, Infinity, { filter });
      expect(nearest.id).to.not.equal('entity1');
    });
    
    it('should increment query count', function() {
      const beforeStats = manager.getStats();
      manager.findNearestEntity(100, 100);
      const afterStats = manager.getStats();
      expect(afterStats.operations.queries).to.equal(beforeStats.operations.queries + 1);
    });
  });
  
  describe('getAllEntities()', function() {
    it('should return empty array initially', function() {
      expect(manager.getAllEntities()).to.be.an('array').that.is.empty;
    });
    
    it('should return all entities', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
      const all = manager.getAllEntities();
      expect(all).to.have.lengthOf(3);
      expect(all).to.include(mockEntity1);
      expect(all).to.include(mockEntity2);
      expect(all).to.include(mockEntity3);
    });
    
    it('should return reference to internal array', function() {
      const arr1 = manager.getAllEntities();
      const arr2 = manager.getAllEntities();
      expect(arr1).to.equal(arr2);
    });
  });
  
  describe('getEntitiesByType()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // Ant
      manager.addEntity(mockEntity2); // Ant
      manager.addEntity(mockEntity3); // Resource
      manager.addEntity(mockEntity4); // Building
    });
    
    it('should return entities of specified type', function() {
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(2);
      expect(ants).to.include(mockEntity1);
      expect(ants).to.include(mockEntity2);
    });
    
    it('should return empty array for non-existent type', function() {
      const none = manager.getEntitiesByType('NonExistent');
      expect(none).to.be.an('array').that.is.empty;
    });
    
    it('should return single entity type', function() {
      const resources = manager.getEntitiesByType('Resource');
      expect(resources).to.have.lengthOf(1);
      expect(resources[0]).to.equal(mockEntity3);
    });
  });
  
  describe('getEntityCount()', function() {
    it('should return 0 initially', function() {
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should return correct count after adds', function() {
      manager.addEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(1);
      manager.addEntity(mockEntity2);
      expect(manager.getEntityCount()).to.equal(2);
    });
    
    it('should return correct count after removes', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.removeEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(1);
    });
  });
  
  describe('getEntityCountByType()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1); // Ant
      manager.addEntity(mockEntity2); // Ant
      manager.addEntity(mockEntity3); // Resource
    });
    
    it('should return count for type', function() {
      expect(manager.getEntityCountByType('Ant')).to.equal(2);
      expect(manager.getEntityCountByType('Resource')).to.equal(1);
    });
    
    it('should return 0 for non-existent type', function() {
      expect(manager.getEntityCountByType('NonExistent')).to.equal(0);
    });
    
    it('should update after removal', function() {
      manager.removeEntity(mockEntity1);
      expect(manager.getEntityCountByType('Ant')).to.equal(1);
    });
  });
  
  describe('hasEntity()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
    });
    
    it('should return true for managed entity', function() {
      expect(manager.hasEntity(mockEntity1)).to.be.true;
    });
    
    it('should return false for non-managed entity', function() {
      expect(manager.hasEntity(mockEntity2)).to.be.false;
    });
    
    it('should return false after removal', function() {
      manager.removeEntity(mockEntity1);
      expect(manager.hasEntity(mockEntity1)).to.be.false;
    });
  });
  
  describe('clear()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should clear all entities', function() {
      manager.clear();
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should clear _allEntities array', function() {
      manager.clear();
      expect(manager._allEntities).to.be.empty;
    });
    
    it('should clear type tracking', function() {
      manager.clear();
      expect(manager._entitiesByType.size).to.equal(0);
    });
    
    it('should clear spatial grid', function() {
      manager.clear();
      const stats = manager.getStats();
      expect(stats.totalEntities).to.equal(0);
    });
  });
  
  describe('rebuildGrid()', function() {
    beforeEach(function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.addEntity(mockEntity3);
    });
    
    it('should rebuild grid from entities', function() {
      expect(() => manager.rebuildGrid()).to.not.throw();
    });
    
    it('should maintain entity count', function() {
      const before = manager.getEntityCount();
      manager.rebuildGrid();
      const after = manager.getEntityCount();
      expect(after).to.equal(before);
    });
    
    it('should work after clearing grid manually', function() {
      manager._grid.clear();
      manager.rebuildGrid();
      const stats = manager.getStats();
      expect(stats.entityCount).to.be.greaterThan(0);
    });
  });
  
  describe('getStats()', function() {
    it('should return statistics object', function() {
      const stats = manager.getStats();
      expect(stats).to.be.an('object');
      expect(stats).to.have.property('totalEntities');
      expect(stats).to.have.property('entityTypes');
      expect(stats).to.have.property('operations');
    });
    
    it('should track operations', function() {
      manager.addEntity(mockEntity1);
      manager.removeEntity(mockEntity1);
      manager.addEntity(mockEntity2);
      manager.updateEntity(mockEntity2);
      manager.getNearbyEntities(100, 100, 50);
      
      const stats = manager.getStats();
      expect(stats.operations.adds).to.equal(2);
      expect(stats.operations.removes).to.equal(1);
      expect(stats.operations.updates).to.be.at.least(1);
      expect(stats.operations.queries).to.be.at.least(1);
    });
    
    it('should include grid stats', function() {
      const stats = manager.getStats();
      expect(stats).to.have.property('cellSize');
      expect(stats).to.have.property('cellCount');
    });
  });
  
  describe('getGrid()', function() {
    it('should return spatial grid instance', function() {
      const grid = manager.getGrid();
      expect(grid).to.exist;
      expect(grid).to.equal(manager._grid);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding same entity twice', function() {
      manager.addEntity(mockEntity1);
      manager.addEntity(mockEntity1);
      expect(manager.getEntityCount()).to.equal(2); // Array allows duplicates
    });
    
    it('should handle rapid add/remove cycles', function() {
      for (let i = 0; i < 100; i++) {
        manager.addEntity(mockEntity1);
        manager.removeEntity(mockEntity1);
      }
      expect(manager.getEntityCount()).to.equal(0);
    });
    
    it('should handle entities with no type', function() {
      const noType = {
        id: 'noType',
        getX: () => 50,
        getY: () => 50
      };
      manager.addEntity(noType);
      const unknown = manager.getEntitiesByType('Unknown');
      expect(unknown).to.include(noType);
    });
    
    it('should handle large number of entities', function() {
      for (let i = 0; i < 1000; i++) {
        const entity = {
          id: `entity${i}`,
          type: 'Test',
          getX: () => Math.random() * 1000,
          getY: () => Math.random() * 1000
        };
        manager.addEntity(entity);
      }
      expect(manager.getEntityCount()).to.equal(1000);
    });
    
    it('should handle queries with no results', function() {
      const nearby = manager.getNearbyEntities(10000, 10000, 10);
      const inRect = manager.getEntitiesInRect(10000, 10000, 10, 10);
      const nearest = manager.findNearestEntity(10000, 10000, 10);
      
      expect(nearby).to.be.empty;
      expect(inRect).to.be.empty;
      expect(nearest).to.be.null;
    });
  });
});
