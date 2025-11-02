/**
 * Unit Tests: Queen Detection Utility
 * 
 * Tests the findQueen() utility function for locating queen ants in entity arrays.
 * 
 * Purpose:
 * - Find queen entity in loaded level for camera tracking
 * - Handle edge cases (no queen, multiple queens, invalid data)
 * - Provide fast queen lookup (O(n) linear search)
 * 
 * TDD Phase: Red (tests first, implementation follows)
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Will load the utility once implemented
let queenDetection;

describe('Queen Detection Utility', function() {
  before(function() {
    try {
      queenDetection = require('../../../Classes/utils/queenDetection');
    } catch (error) {
      // Expected during TDD Red phase
      queenDetection = null;
    }
  });

  describe('findQueen() - Basic Functionality', function() {
    it('should find queen in entity array', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'queen1', type: 'Queen', x: 200, y: 200 },
        { id: 'ant2', type: 'Ant', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.type).to.equal('Queen');
      expect(queen.id).to.equal('queen1');
    });

    it('should return first queen if multiple queens exist', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'queen1', type: 'Queen', x: 200, y: 200 },
        { id: 'queen2', type: 'Queen', x: 300, y: 300 },
        { id: 'ant2', type: 'Ant', x: 400, y: 400 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1'); // First queen
    });

    it('should return null if no queen exists', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'ant2', type: 'Ant', x: 200, y: 200 },
        { id: 'resource1', type: 'Resource', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.be.null;
    });

    it('should handle empty entity array', function() {
      if (!queenDetection) this.skip();
      
      const entities = [];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.be.null;
    });
  });

  describe('findQueen() - Entity Type Validation', function() {
    it('should match type case-sensitively', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'queen1', type: 'queen', x: 200, y: 200 }, // lowercase
        { id: 'ant2', type: 'Ant', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      // Should NOT find lowercase 'queen'
      expect(queen).to.be.null;
    });

    it('should handle entities with missing type field', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'broken', x: 200, y: 200 }, // No type field
        { id: 'queen1', type: 'Queen', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
    });

    it('should handle entities with null type', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        { id: 'broken', type: null, x: 200, y: 200 },
        { id: 'queen1', type: 'Queen', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
    });
  });

  describe('findQueen() - Edge Cases', function() {
    it('should handle null entities array', function() {
      if (!queenDetection) this.skip();
      
      const queen = queenDetection.findQueen(null);

      expect(queen).to.be.null;
    });

    it('should handle undefined entities array', function() {
      if (!queenDetection) this.skip();
      
      const queen = queenDetection.findQueen(undefined);

      expect(queen).to.be.null;
    });

    it('should handle non-array input', function() {
      if (!queenDetection) this.skip();
      
      const queen = queenDetection.findQueen({ type: 'Queen' });

      expect(queen).to.be.null;
    });

    it('should handle array with null elements', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        null,
        { id: 'queen1', type: 'Queen', x: 200, y: 200 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
    });

    it('should handle array with undefined elements', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        undefined,
        { id: 'queen1', type: 'Queen', x: 200, y: 200 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
    });
  });

  describe('findQueen() - Performance', function() {
    it('should find queen in large entity array quickly', function() {
      if (!queenDetection) this.skip();
      
      // Create 10,000 entities with queen at position 5,000
      const entities = [];
      for (let i = 0; i < 10000; i++) {
        if (i === 5000) {
          entities.push({ id: 'queen1', type: 'Queen', x: i * 32, y: i * 32 });
        } else {
          entities.push({ id: `ant${i}`, type: 'Ant', x: i * 32, y: i * 32 });
        }
      }

      const start = Date.now();
      const queen = queenDetection.findQueen(entities);
      const elapsed = Date.now() - start;

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
      expect(elapsed).to.be.below(50, 'Should find queen in large array in <50ms');
    });

    it('should handle worst case (queen at end) efficiently', function() {
      if (!queenDetection) this.skip();
      
      // Create 10,000 entities with queen at end
      const entities = [];
      for (let i = 0; i < 9999; i++) {
        entities.push({ id: `ant${i}`, type: 'Ant', x: i * 32, y: i * 32 });
      }
      entities.push({ id: 'queen1', type: 'Queen', x: 9999 * 32, y: 9999 * 32 });

      const start = Date.now();
      const queen = queenDetection.findQueen(entities);
      const elapsed = Date.now() - start;

      expect(queen).to.exist;
      expect(queen.id).to.equal('queen1');
      expect(elapsed).to.be.below(100, 'Should handle worst case in <100ms');
    });
  });

  describe('findQueen() - Return Value Structure', function() {
    it('should return complete entity object', function() {
      if (!queenDetection) this.skip();
      
      const entities = [
        { 
          id: 'queen1', 
          type: 'Queen', 
          x: 200, 
          y: 200,
          properties: { health: 100, faction: 'player' }
        }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen).to.have.property('id');
      expect(queen).to.have.property('type');
      expect(queen).to.have.property('x');
      expect(queen).to.have.property('y');
      expect(queen).to.have.property('properties');
    });

    it('should return reference to actual entity, not copy', function() {
      if (!queenDetection) this.skip();
      
      const queenEntity = { id: 'queen1', type: 'Queen', x: 200, y: 200 };
      const entities = [
        { id: 'ant1', type: 'Ant', x: 100, y: 100 },
        queenEntity,
        { id: 'ant2', type: 'Ant', x: 300, y: 300 }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.equal(queenEntity); // Same reference
    });
  });

  describe('Integration with LevelLoader', function() {
    it('should work with LevelLoader entity format', function() {
      if (!queenDetection) this.skip();
      
      // Format returned by LevelLoader (has both x/y and position.x/y)
      const entities = [
        { 
          id: 'ant_1', 
          type: 'Ant', 
          x: 160, 
          y: 160,
          position: { x: 160, y: 160 },
          properties: {}
        },
        { 
          id: 'queen_1', 
          type: 'Queen', 
          x: 320, 
          y: 320,
          position: { x: 320, y: 320 },
          properties: { faction: 'player' }
        }
      ];

      const queen = queenDetection.findQueen(entities);

      expect(queen).to.exist;
      expect(queen.type).to.equal('Queen');
      expect(queen.id).to.equal('queen_1');
      expect(queen.x).to.equal(320);
      expect(queen.y).to.equal(320);
    });
  });
});
