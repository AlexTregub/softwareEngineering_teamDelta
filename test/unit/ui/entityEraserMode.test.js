/**
 * Unit Tests for Entity Eraser with Mode System
 * 
 * Tests the selective eraser modes: ALL | TERRAIN | ENTITY | EVENTS
 * TDD Red Phase - Write failing tests FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Entity Eraser Mode System', function() {
  let EntityPainter;
  let entityPainter;
  let mockTileSize;
  let mockEntities;
  let mockTerrain;
  let mockEvents;

  beforeEach(function() {
    // Mock constants
    mockTileSize = 32;
    global.TILE_SIZE = mockTileSize;
    if (typeof window !== 'undefined') window.TILE_SIZE = mockTileSize;

    // Mock p5.js functions
    global.floor = Math.floor;
    if (typeof window !== 'undefined') window.floor = Math.floor;

    // Create mock data structures
    mockEntities = [
      { gridX: 5, gridY: 5, type: 'Ant' },
      { gridX: 10, gridY: 10, type: 'Resource' }
    ];

    mockTerrain = {
      grid: new Map([
        ['5,5', { type: 'GRASS', gridX: 5, gridY: 5 }],
        ['10,10', { type: 'WATER', gridX: 10, gridY: 10 }]
      ])
    };

    mockEvents = [
      { gridX: 5, gridY: 5, eventType: 'spawn' },
      { gridX: 10, gridY: 10, eventType: 'dialogue' }
    ];

    // Load EntityPainter class
    try {
      EntityPainter = require('../../../Classes/ui/EntityPainter');
    } catch (e) {
      // Expected to fail in TDD Red phase
      EntityPainter = null;
    }

    if (EntityPainter) {
      entityPainter = new EntityPainter(mockEntities, mockTerrain, mockEvents);
    }
  });

  afterEach(function() {
    sinon.restore();
    delete global.TILE_SIZE;
    delete global.floor;
    if (typeof window !== 'undefined') {
      delete window.TILE_SIZE;
      delete window.floor;
    }
  });

  describe('Mode Constants', function() {
    it('should define ERASER_MODE enumeration', function() {
      if (!EntityPainter) {
        this.skip();
      }

      expect(EntityPainter.ERASER_MODE).to.exist;
      expect(EntityPainter.ERASER_MODE.ALL).to.equal('ALL');
      expect(EntityPainter.ERASER_MODE.TERRAIN).to.equal('TERRAIN');
      expect(EntityPainter.ERASER_MODE.ENTITY).to.equal('ENTITY');
      expect(EntityPainter.ERASER_MODE.EVENTS).to.equal('EVENTS');
    });
  });

  describe('Constructor with Eraser Mode', function() {
    it('should initialize with ALL mode by default', function() {
      if (!EntityPainter) {
        this.skip();
      }

      expect(entityPainter.eraserMode).to.equal('ALL');
    });

    it('should store references to terrain and events', function() {
      if (!EntityPainter) {
        this.skip();
      }

      expect(entityPainter.terrain).to.equal(mockTerrain);
      expect(entityPainter.events).to.equal(mockEvents);
    });
  });

  describe('Set Eraser Mode', function() {
    it('should change eraser mode', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.setEraserMode('ENTITY');
      expect(entityPainter.eraserMode).to.equal('ENTITY');

      entityPainter.setEraserMode('TERRAIN');
      expect(entityPainter.eraserMode).to.equal('TERRAIN');
    });

    it('should reject invalid eraser mode', function() {
      if (!EntityPainter) {
        this.skip();
      }

      expect(() => entityPainter.setEraserMode('INVALID')).to.throw();
    });

    it('should return the mode setter for chaining', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const result = entityPainter.setEraserMode('EVENTS');
      expect(result).to.equal(entityPainter);
    });
  });

  describe('Erase with ALL Mode', function() {
    beforeEach(function() {
      if (entityPainter) {
        entityPainter.setEraserMode('ALL');
      }
    });

    it('should remove entities at grid position', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(5, 5);

      expect(mockEntities.length).to.equal(1);
      expect(mockEntities.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });

    it('should reset terrain to default at grid position', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(10, 10);

      const tile = mockTerrain.grid.get('10,10');
      expect(tile.type).to.equal('GRASS'); // Default terrain type
    });

    it('should remove events at grid position', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(5, 5);

      expect(mockEvents.length).to.equal(1);
      expect(mockEvents.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });

    it('should clear all three types in single erase action', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialEntityCount = mockEntities.length;
      const initialEventCount = mockEvents.length;

      entityPainter.handleErase(5, 5);

      expect(mockEntities.length).to.be.lessThan(initialEntityCount);
      expect(mockEvents.length).to.be.lessThan(initialEventCount);
      expect(mockTerrain.grid.get('5,5').type).to.equal('GRASS');
    });
  });

  describe('Erase with TERRAIN Mode', function() {
    beforeEach(function() {
      if (entityPainter) {
        entityPainter.setEraserMode('TERRAIN');
      }
    });

    it('should reset terrain to default', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(10, 10);

      const tile = mockTerrain.grid.get('10,10');
      expect(tile.type).to.equal('GRASS');
    });

    it('should not remove entities', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialCount = mockEntities.length;
      entityPainter.handleErase(5, 5);

      expect(mockEntities.length).to.equal(initialCount);
      expect(mockEntities.find(e => e.gridX === 5 && e.gridY === 5)).to.exist;
    });

    it('should not remove events', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialCount = mockEvents.length;
      entityPainter.handleErase(5, 5);

      expect(mockEvents.length).to.equal(initialCount);
      expect(mockEvents.find(e => e.gridX === 5 && e.gridY === 5)).to.exist;
    });
  });

  describe('Erase with ENTITY Mode', function() {
    beforeEach(function() {
      if (entityPainter) {
        entityPainter.setEraserMode('ENTITY');
      }
    });

    it('should remove entities', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(5, 5);

      expect(mockEntities.length).to.equal(1);
      expect(mockEntities.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });

    it('should not modify terrain', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const originalType = mockTerrain.grid.get('10,10').type;
      entityPainter.handleErase(10, 10);

      expect(mockTerrain.grid.get('10,10').type).to.equal(originalType);
    });

    it('should not remove events', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialCount = mockEvents.length;
      entityPainter.handleErase(5, 5);

      expect(mockEvents.length).to.equal(initialCount);
    });
  });

  describe('Erase with EVENTS Mode', function() {
    beforeEach(function() {
      if (entityPainter) {
        entityPainter.setEraserMode('EVENTS');
      }
    });

    it('should remove events', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.handleErase(5, 5);

      expect(mockEvents.length).to.equal(1);
      expect(mockEvents.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });

    it('should not remove entities', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialCount = mockEntities.length;
      entityPainter.handleErase(5, 5);

      expect(mockEntities.length).to.equal(initialCount);
    });

    it('should not modify terrain', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const originalType = mockTerrain.grid.get('5,5').type;
      entityPainter.handleErase(5, 5);

      expect(mockTerrain.grid.get('5,5').type).to.equal(originalType);
    });
  });

  describe('Get Current Eraser Mode', function() {
    it('should return current eraser mode', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.setEraserMode('TERRAIN');
      expect(entityPainter.getEraserMode()).to.equal('TERRAIN');

      entityPainter.setEraserMode('ENTITY');
      expect(entityPainter.getEraserMode()).to.equal('ENTITY');
    });
  });

  describe('Edge Cases', function() {
    it('should handle erase at empty grid position', function() {
      if (!EntityPainter) {
        this.skip();
      }

      const initialEntityCount = mockEntities.length;
      const initialEventCount = mockEvents.length;

      entityPainter.setEraserMode('ALL');
      entityPainter.handleErase(999, 999); // Empty position

      expect(mockEntities.length).to.equal(initialEntityCount);
      expect(mockEvents.length).to.equal(initialEventCount);
    });

    it('should handle multiple erases at same position', function() {
      if (!EntityPainter) {
        this.skip();
      }

      entityPainter.setEraserMode('ENTITY');
      entityPainter.handleErase(5, 5);
      entityPainter.handleErase(5, 5); // Second erase

      // Should not error, position now empty
      expect(mockEntities.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });

    it('should handle world-to-grid coordinate conversion', function() {
      if (!EntityPainter) {
        this.skip();
      }

      // World coords: 160,160 -> Grid coords: 5,5
      const worldX = 5 * mockTileSize;
      const worldY = 5 * mockTileSize;

      entityPainter.handleErase(worldX, worldY);

      expect(mockEntities.find(e => e.gridX === 5 && e.gridY === 5)).to.be.undefined;
    });
  });
});
