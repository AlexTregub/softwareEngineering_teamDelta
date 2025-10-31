/**
 * Unit Tests: GroupPlacer Utility
 * 
 * Tests group placement functionality - placing multiple entities at grid positions
 * with correct offsets maintaining formation.
 * Following TDD Red phase - these tests will fail until implementation complete.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('GroupPlacer Utility', function() {
  let GroupPlacer;
  let mockEntityFactory;
  let createdEntities;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Load actual GroupPlacer class
    GroupPlacer = require('../../../Classes/levelEditor/GroupPlacer.js');
    
    // Sync to window
    global.GroupPlacer = GroupPlacer;
    window.GroupPlacer = GroupPlacer;
  });
  
  beforeEach(function() {
    createdEntities = [];
    
    // Mock entity factory
    mockEntityFactory = sinon.stub().callsFake((templateId, worldX, worldY, properties) => {
      const entity = {
        id: `entity_${createdEntities.length}`,
        templateId: templateId,
        x: worldX,
        y: worldY,
        gridX: Math.floor(worldX / TILE_SIZE),
        gridY: Math.floor(worldY / TILE_SIZE),
        properties: { ...properties }
      };
      createdEntities.push(entity);
      return entity;
    });
    
    global.mockEntityFactory = mockEntityFactory;
  });
  
  afterEach(function() {
    sinon.restore();
    global.mockEntityFactory = null;
  });
  
  describe('Single Entity Group', function() {
    it('should place single entity at origin position', function() {
      const groupData = {
        isGroup: false,
        entities: [
          {
            baseTemplateId: 'ant_worker',
            position: { x: 0, y: 0 },
            properties: { health: 100 }
          }
        ]
      };
      
      const result = GroupPlacer.placeGroup(10, 15, groupData);
      
      expect(result).to.have.lengthOf(1);
      expect(result[0].gridX).to.equal(10);
      expect(result[0].gridY).to.equal(15);
      expect(result[0].x).to.equal(10 * 32); // World coordinates
      expect(result[0].y).to.equal(15 * 32);
    });
    
    it('should preserve entity properties', function() {
      const groupData = {
        entities: [
          {
            baseTemplateId: 'ant_soldier',
            position: { x: 0, y: 0 },
            properties: { health: 150, faction: 'player' }
          }
        ]
      };
      
      const result = GroupPlacer.placeGroup(5, 5, groupData);
      
      expect(result[0].properties).to.deep.equal({ health: 150, faction: 'player' });
    });
  });
  
  describe('Multiple Entity Group', function() {
    it('should place all entities with correct offsets', function() {
      const groupData = {
        isGroup: true,
        entities: [
          {
            baseTemplateId: 'ant_worker',
            position: { x: 0, y: 0 },
            properties: { health: 100 }
          },
          {
            baseTemplateId: 'ant_soldier',
            position: { x: 2, y: 0 },
            properties: { health: 150 }
          },
          {
            baseTemplateId: 'ant_scout',
            position: { x: 1, y: 1 },
            properties: { health: 80 }
          }
        ]
      };
      
      const result = GroupPlacer.placeGroup(10, 10, groupData);
      
      expect(result).to.have.lengthOf(3);
      
      // Origin entity at (10, 10)
      expect(result[0].gridX).to.equal(10);
      expect(result[0].gridY).to.equal(10);
      
      // Soldier at origin + (2, 0) = (12, 10)
      expect(result[1].gridX).to.equal(12);
      expect(result[1].gridY).to.equal(10);
      
      // Scout at origin + (1, 1) = (11, 11)
      expect(result[2].gridX).to.equal(11);
      expect(result[2].gridY).to.equal(11);
    });
    
    it('should maintain formation shape', function() {
      const groupData = {
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_worker', position: { x: 1, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 1 }, properties: {} },
          { baseTemplateId: 'ant_worker', position: { x: 1, y: 1 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(5, 5, groupData);
      
      expect(result).to.have.lengthOf(4);
      
      // 2x2 square formation
      expect(result[0].gridX).to.equal(5);
      expect(result[0].gridY).to.equal(5);
      expect(result[1].gridX).to.equal(6);
      expect(result[1].gridY).to.equal(5);
      expect(result[2].gridX).to.equal(5);
      expect(result[2].gridY).to.equal(6);
      expect(result[3].gridX).to.equal(6);
      expect(result[3].gridY).to.equal(6);
    });
    
    it('should handle mixed entity types', function() {
      const groupData = {
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: {} },
          { baseTemplateId: 'building_hill', position: { x: 0, y: 1 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(0, 0, groupData);
      
      expect(result).to.have.lengthOf(3);
      expect(result[0].templateId).to.equal('ant_worker');
      expect(result[1].templateId).to.equal('ant_soldier');
      expect(result[2].templateId).to.equal('building_hill');
    });
    
    it('should preserve properties for all entities', function() {
      const groupData = {
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: { health: 100, faction: 'player' } },
          { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 }, properties: { health: 150, faction: 'player', damage: 30 } }
        ]
      };
      
      const result = GroupPlacer.placeGroup(10, 10, groupData);
      
      expect(result[0].properties).to.deep.equal({ health: 100, faction: 'player' });
      expect(result[1].properties).to.deep.equal({ health: 150, faction: 'player', damage: 30 });
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty entities array', function() {
      const groupData = {
        isGroup: true,
        entities: []
      };
      
      const result = GroupPlacer.placeGroup(10, 10, groupData);
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should handle null groupData', function() {
      const result = GroupPlacer.placeGroup(10, 10, null);
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should handle missing entities property', function() {
      const groupData = {
        isGroup: true
      };
      
      const result = GroupPlacer.placeGroup(10, 10, groupData);
      
      expect(result).to.be.an('array').that.is.empty;
    });
    
    it('should handle negative grid coordinates', function() {
      const groupData = {
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_soldier', position: { x: 1, y: 1 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(-5, -5, groupData);
      
      expect(result).to.have.lengthOf(2);
      expect(result[0].gridX).to.equal(-5);
      expect(result[0].gridY).to.equal(-5);
      expect(result[1].gridX).to.equal(-4);
      expect(result[1].gridY).to.equal(-4);
    });
    
    it('should handle large offsets', function() {
      const groupData = {
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_soldier', position: { x: 100, y: 100 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(0, 0, groupData);
      
      expect(result).to.have.lengthOf(2);
      expect(result[1].gridX).to.equal(100);
      expect(result[1].gridY).to.equal(100);
    });
  });
  
  describe('World Coordinate Conversion', function() {
    it('should convert grid to world coordinates correctly', function() {
      const groupData = {
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(10, 15, groupData);
      
      expect(result[0].x).to.equal(10 * 32); // 320
      expect(result[0].y).to.equal(15 * 32); // 480
    });
    
    it('should handle TILE_SIZE correctly for multiple entities', function() {
      const groupData = {
        entities: [
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 0 }, properties: {} },
          { baseTemplateId: 'ant_soldier', position: { x: 2, y: 3 }, properties: {} }
        ]
      };
      
      const result = GroupPlacer.placeGroup(5, 5, groupData);
      
      expect(result[0].x).to.equal(5 * 32); // 160
      expect(result[0].y).to.equal(5 * 32); // 160
      expect(result[1].x).to.equal(7 * 32); // 224
      expect(result[1].y).to.equal(8 * 32); // 256
    });
  });
});
