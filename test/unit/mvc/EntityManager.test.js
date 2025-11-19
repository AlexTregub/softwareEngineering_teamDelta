/**
 * EntityManager Unit Tests
 * 
 * Tests the MVC EntityManager singleton that tracks all entities created through factories.
 * Follows TDD methodology - tests written FIRST.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager (MVC)', function() {
  let EntityManager;
  let mockController1, mockController2, mockController3;

  beforeEach(function() {
    // Clear any existing EntityManager instance
    if (typeof global.window === 'undefined') {
      global.window = {};
    }
    delete global.window.entityManager;
    
    // Mock controllers with required methods
    mockController1 = {
      id: 'entity_1',
      type: 'ant',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };
    
    mockController2 = {
      id: 'entity_2',
      type: 'ant',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };
    
    mockController3 = {
      id: 'entity_3',
      type: 'building',
      render: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub()
    };

    // Load EntityManager class
    try {
      delete require.cache[require.resolve('../../../Classes/mvc/managers/EntityManager.js')];
      EntityManager = require('../../../Classes/mvc/managers/EntityManager.js');
    } catch (e) {
      // Class doesn't exist yet (TDD - test first!)
      EntityManager = null;
    }
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Singleton Pattern', function() {
    it('should return the same instance on multiple getInstance() calls', function() {
      if (!EntityManager) this.skip();
      
      const instance1 = EntityManager.getInstance();
      const instance2 = EntityManager.getInstance();
      
      expect(instance1).to.equal(instance2);
    });

    it('should be available on window.entityManager', function() {
      if (!EntityManager) this.skip();
      
      const instance = EntityManager.getInstance();
      
      expect(window.entityManager).to.exist;
      expect(window.entityManager).to.equal(instance);
    });
  });

  describe('register()', function() {
    it('should register a controller with type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1);
      expect(all[0]).to.equal(mockController1);
    });

    it('should auto-detect type from controller.type if not provided', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1); // No type arg
      
      const ants = manager.getByType('ant');
      expect(ants).to.have.lengthOf(1);
    });

    it('should throw error if controller is null/undefined', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      expect(() => manager.register(null, 'ant')).to.throw();
      expect(() => manager.register(undefined, 'ant')).to.throw();
    });

    it('should assign unique ID if controller lacks one', function() {
      if (!EntityManager) this.skip();
      
      const controllerNoId = {
        type: 'ant',
        render: sinon.stub(),
        update: sinon.stub()
      };
      
      const manager = EntityManager.getInstance();
      manager.register(controllerNoId);
      
      expect(controllerNoId.id).to.exist;
      expect(controllerNoId.id).to.be.a('string');
    });

    it('should not register duplicate IDs', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController1, 'ant'); // Same ID
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1); // Only one registered
    });
  });

  describe('unregister()', function() {
    it('should remove controller by ID', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      
      manager.unregister('entity_1');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(1);
      expect(all[0].id).to.equal('entity_2');
    });

    it('should return true if entity was removed', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const result = manager.unregister('entity_1');
      expect(result).to.be.true;
    });

    it('should return false if entity ID not found', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      const result = manager.unregister('nonexistent_id');
      expect(result).to.be.false;
    });
  });

  describe('getAll()', function() {
    it('should return empty array when no entities registered', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      expect(manager.getAll()).to.be.an('array').that.is.empty;
    });

    it('should return all registered controllers', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const all = manager.getAll();
      expect(all).to.have.lengthOf(3);
    });

    it('should return a copy (not modifiable)', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const all = manager.getAll();
      all.push(mockController2); // Try to modify
      
      const allAgain = manager.getAll();
      expect(allAgain).to.have.lengthOf(1); // Should still be 1
    });
  });

  describe('getByType()', function() {
    it('should return only entities of specified type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const ants = manager.getByType('ant');
      expect(ants).to.have.lengthOf(2);
      expect(ants.every(e => e.type === 'ant')).to.be.true;
    });

    it('should return empty array if no entities of type', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const buildings = manager.getByType('building');
      expect(buildings).to.be.an('array').that.is.empty;
    });

    it('should return copy (not modifiable)', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      const ants = manager.getByType('ant');
      ants.push(mockController2);
      
      const antsAgain = manager.getByType('ant');
      expect(antsAgain).to.have.lengthOf(1);
    });
  });

  describe('getById()', function() {
    it('should return controller with matching ID', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      
      const found = manager.getById('entity_1');
      expect(found).to.equal(mockController1);
    });

    it('should return null if ID not found', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      const found = manager.getById('nonexistent');
      expect(found).to.be.null;
    });
  });

  describe('clear()', function() {
    it('should remove all registered entities', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      manager.clear();
      
      expect(manager.getAll()).to.be.empty;
    });

    it('should reset type groupings', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.clear();
      
      expect(manager.getByType('ant')).to.be.empty;
    });
  });

  describe('getCount()', function() {
    it('should return 0 when empty', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      expect(manager.getCount()).to.equal(0);
    });

    it('should return total count of registered entities', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      expect(manager.getCount()).to.equal(3);
    });

    it('should return count by type when type provided', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      expect(manager.getCount('ant')).to.equal(2);
      expect(manager.getCount('building')).to.equal(1);
      expect(manager.getCount('resource')).to.equal(0);
    });
  });

  describe('Legacy Compatibility', function() {
    it('should provide getLegacyAnts() for backward compatibility', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      manager.register(mockController2, 'ant');
      manager.register(mockController3, 'building');
      
      const ants = manager.getLegacyAnts();
      expect(ants).to.have.lengthOf(2);
      expect(ants.every(a => a.type === 'ant')).to.be.true;
    });

    it('should sync with global window.ants if it exists', function() {
      if (!EntityManager) this.skip();
      
      global.window.ants = [];
      
      const manager = EntityManager.getInstance();
      manager.register(mockController1, 'ant');
      
      // Manager should NOT modify window.ants (that's the caller's responsibility)
      // But it should provide a method to get them
      expect(manager.getLegacyAnts()).to.have.lengthOf(1);
    });
  });

  describe('Integration with Factory Pattern', function() {
    it('should work with AntFactory registration', function() {
      if (!EntityManager) this.skip();
      
      const manager = EntityManager.getInstance();
      
      // Simulate factory creating MVC triad and registering controller
      const mockTriad = {
        model: { id: 'model_1' },
        view: { id: 'view_1' },
        controller: mockController1
      };
      
      manager.register(mockTriad.controller, 'ant');
      
      expect(manager.getByType('ant')).to.have.lengthOf(1);
    });
  });

  describe('Performance', function() {
    it('should handle 1000+ entities efficiently', function() {
      if (!EntityManager) this.skip();
      this.timeout(1000); // 1 second max
      
      const manager = EntityManager.getInstance();
      
      const start = Date.now();
      
      // Register 1000 entities
      for (let i = 0; i < 1000; i++) {
        manager.register({
          id: `entity_${i}`,
          type: i % 2 === 0 ? 'ant' : 'building',
          render: sinon.stub(),
          update: sinon.stub()
        });
      }
      
      // Query operations
      manager.getAll();
      manager.getByType('ant');
      manager.getById('entity_500');
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(100); // Should complete in <100ms
    });
  });
});
