/**
 * Unit tests for EntityMVCAdapter
 * TDD: Write tests FIRST, then implement
 * 
 * Purpose: Adapter wraps legacy Entity to expose MVC model interface
 * Allows MVC views/controllers to work with legacy entities during migration
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const EntityMVCAdapter = require('../../../Classes/adapters/EntityMVCAdapter');

describe('EntityMVCAdapter', function() {
  let legacyEntity, adapter;
  
  beforeEach(function() {
    // Mock legacy Entity structure
    legacyEntity = {
      _collisionBox: {
        x: 100,
        y: 200,
        width: 32,
        height: 32
      },
      _isActive: true,
      _type: 'Ant',
      _id: 'legacy_ant_123',
      
      // Legacy methods
      setPosition: sinon.stub(),
      getPosition: sinon.stub().returns({ x: 100, y: 200 }),
      setSize: sinon.stub(),
      getSize: sinon.stub().returns({ width: 32, height: 32 }),
      
      // Ant-specific legacy properties
      _JobName: 'Scout',
      _faction: 'player',
      _stats: {
        health: 100,
        maxHealth: 100
      }
    };
    
    adapter = new EntityMVCAdapter(legacyEntity);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should create an adapter wrapping legacy entity', function() {
      expect(adapter).to.exist;
      expect(adapter).to.be.an.instanceOf(EntityMVCAdapter);
    });
    
    it('should throw if legacy entity is null', function() {
      expect(() => new EntityMVCAdapter(null)).to.throw('Legacy entity required');
    });
    
    it('should store reference to legacy entity', function() {
      expect(adapter._legacyEntity).to.equal(legacyEntity);
    });
  });
  
  describe('Position Methods (EntityModel interface)', function() {
    it('should delegate getPosition() to legacy entity', function() {
      const pos = adapter.getPosition();
      
      expect(legacyEntity.getPosition.calledOnce).to.be.true;
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should delegate setPosition() to legacy entity', function() {
      adapter.setPosition(150, 250);
      
      expect(legacyEntity.setPosition.calledOnce).to.be.true;
      expect(legacyEntity.setPosition.calledWith(150, 250)).to.be.true;
    });
  });
  
  describe('Size Methods (EntityModel interface)', function() {
    it('should delegate getSize() to legacy entity', function() {
      const size = adapter.getSize();
      
      expect(legacyEntity.getSize.calledOnce).to.be.true;
      expect(size.width).to.equal(32);
      expect(size.height).to.equal(32);
    });
    
    it('should delegate setSize() to legacy entity', function() {
      adapter.setSize(64, 64);
      
      expect(legacyEntity.setSize.calledOnce).to.be.true;
      expect(legacyEntity.setSize.calledWith(64, 64)).to.be.true;
    });
  });
  
  describe('Core Properties (EntityModel interface)', function() {
    it('should expose id from legacy entity', function() {
      expect(adapter.id).to.equal('legacy_ant_123');
    });
    
    it('should expose type from legacy entity', function() {
      expect(adapter.type).to.equal('Ant');
    });
    
    it('should expose enabled state from legacy entity', function() {
      expect(adapter.enabled).to.be.true;
      
      legacyEntity._isActive = false;
      expect(adapter.enabled).to.be.false;
    });
    
    it('should allow setting enabled state', function() {
      adapter.enabled = false;
      
      expect(legacyEntity._isActive).to.be.false;
    });
  });
  
  describe('Ant-Specific Properties (AntModel interface)', function() {
    it('should expose jobName from legacy ant', function() {
      expect(adapter.jobName).to.equal('Scout');
    });
    
    it('should expose faction from legacy ant', function() {
      expect(adapter.faction).to.equal('player');
    });
    
    it('should expose health from legacy ant stats', function() {
      expect(adapter.health).to.equal(100);
    });
    
    it('should expose maxHealth from legacy ant stats', function() {
      expect(adapter.maxHealth).to.equal(100);
    });
    
    it('should handle missing stats gracefully', function() {
      legacyEntity._stats = null;
      
      expect(adapter.health).to.be.undefined;
      expect(adapter.maxHealth).to.be.undefined;
    });
  });
  
  describe('MVC View Compatibility', function() {
    it('should work with AntView.render()', function() {
      // Mock AntView render call (expects model with getPosition, jobName, etc.)
      const mockRender = function(model) {
        const pos = model.getPosition();
        return {
          rendered: true,
          position: pos,
          jobName: model.jobName,
          faction: model.faction
        };
      };
      
      const result = mockRender(adapter);
      
      expect(result.rendered).to.be.true;
      expect(result.position.x).to.equal(100);
      expect(result.jobName).to.equal('Scout');
    });
  });
  
  describe('MVC Controller Compatibility', function() {
    it('should work with AntController.update()', function() {
      // Mock AntController update (expects model with enabled check)
      const mockUpdate = function(model, deltaTime) {
        if (!model.enabled) return false;
        
        const pos = model.getPosition();
        model.setPosition(pos.x + 1, pos.y + 1);
        return true;
      };
      
      const updated = mockUpdate(adapter, 16);
      
      expect(updated).to.be.true;
      expect(legacyEntity.setPosition.called).to.be.true;
    });
  });
  
  describe('Legacy Entity Access', function() {
    it('should provide getLegacyEntity() for direct access', function() {
      const legacy = adapter.getLegacyEntity();
      
      expect(legacy).to.equal(legacyEntity);
    });
    
    it('should allow access to legacy-specific methods', function() {
      const legacy = adapter.getLegacyEntity();
      
      // Legacy entity might have methods not in MVC interface
      expect(legacy._JobName).to.equal('Scout');
      expect(legacy._collisionBox).to.exist;
    });
  });
  
  describe('Performance', function() {
    it('should wrap 100 legacy entities quickly', function() {
      const entities = [];
      for (let i = 0; i < 100; i++) {
        entities.push({
          _collisionBox: { x: i, y: i, width: 32, height: 32 },
          _isActive: true,
          _type: 'Ant',
          _id: `ant_${i}`,
          getPosition: () => ({ x: i, y: i }),
          setPosition: () => {},
          getSize: () => ({ width: 32, height: 32 }),
          setSize: () => {}
        });
      }
      
      const startTime = Date.now();
      
      const adapters = entities.map(e => new EntityMVCAdapter(e));
      
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.lessThan(50); // Should be very fast
      expect(adapters).to.have.length(100);
    });
  });
});
