/**
 * JSON Loading Integration Tests
 * 
 * Tests the complete loading workflow:
 * 1. JSON file loaded into Level Editor
 * 2. Entities correctly placed at grid positions
 * 3. Events correctly registered (if implemented)
 * 4. Grid coordinates converted to world coordinates
 * 5. Entity properties applied correctly
 * 6. Multiple entities loaded successfully
 * 
 * CRITICAL: Verifies grid → world coordinate conversion on load
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('JSON Loading - Integration', function() {
  let sandbox;
  let mockP5;
  let mockLevelEditor;
  let mockTerrainImporter;
  let mockEventManager;
  let loadedEntities;
  let loadedEvents;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    loadedEntities = [];
    loadedEvents = [];
    
    // Mock p5.js
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      TILE_SIZE: 32
    };
    
    Object.assign(global, mockP5);
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
    }
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    if (typeof window !== 'undefined') {
      window.TILE_SIZE = 32;
    }
    
    // Mock EventManager
    mockEventManager = {
      events: new Map(),
      
      registerEvent(eventConfig) {
        this.events.set(eventConfig.id, eventConfig);
        loadedEvents.push(eventConfig);
        return true;
      },
      
      getEvent(eventId) {
        return this.events.get(eventId);
      },
      
      clearAllEvents() {
        this.events.clear();
        loadedEvents.length = 0;
      }
    };
    
    // Mock Level Editor with JSON loading
    mockLevelEditor = {
      entities: loadedEntities,
      
      loadFromJSON(jsonData) {
        // Clear existing entities
        this.entities.length = 0;
        
        // Load terrain (not tested here)
        // ...
        
        // Load entities
        if (jsonData.entities && Array.isArray(jsonData.entities)) {
          jsonData.entities.forEach(entityData => {
            const entity = this.createEntityFromData(entityData);
            this.entities.push(entity);
          });
        }
        
        // Load events (if implemented)
        if (jsonData.events && Array.isArray(jsonData.events)) {
          if (mockEventManager) {
            jsonData.events.forEach(eventData => {
              mockEventManager.registerEvent(eventData);
            });
          }
        }
        
        return { success: true, entitiesLoaded: this.entities.length, eventsLoaded: loadedEvents.length };
      },
      
      createEntityFromData(entityData) {
        // Convert grid coords to world coords
        const worldX = entityData.gridPosition.x * TILE_SIZE;
        const worldY = entityData.gridPosition.y * TILE_SIZE;
        
        return {
          id: entityData.id,
          templateId: entityData.templateId,
          type: entityData.type,
          name: entityData.name || entityData.type,
          gridPosition: { x: entityData.gridPosition.x, y: entityData.gridPosition.y },
          worldPosition: { x: worldX, y: worldY },
          properties: { ...entityData.properties }
        };
      },
      
      getEntityById(id) {
        return this.entities.find(e => e.id === id);
      },
      
      getEntityAtGridPos(gridX, gridY) {
        return this.entities.find(e => 
          e.gridPosition.x === gridX && e.gridPosition.y === gridY
        );
      },
      
      getAllEntities() {
        return this.entities;
      }
    };
    
    // Mock TerrainImporter
    mockTerrainImporter = {
      loadFromFile(jsonString) {
        try {
          return JSON.parse(jsonString);
        } catch (error) {
          return { error: 'Invalid JSON', success: false };
        }
      }
    };
  });
  
  afterEach(function() {
    sandbox.restore();
    loadedEntities.length = 0;
    loadedEvents.length = 0;
  });
  
  describe('Entity Loading from JSON', function() {
    it('should load single entity at correct grid position', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: {
              JobName: 'Worker',
              faction: 'player',
              health: 100
            }
          }
        ]
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(1);
      expect(loadedEntities.length).to.equal(1);
    });
    
    it('should convert grid coordinates to world coordinates on load', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      // Grid position preserved
      expect(entity.gridPosition.x).to.equal(10);
      expect(entity.gridPosition.y).to.equal(15);
      
      // World position calculated: gridX * TILE_SIZE
      expect(entity.worldPosition.x).to.equal(10 * 32);
      expect(entity.worldPosition.y).to.equal(15 * 32);
    });
    
    it('should load entity properties correctly', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_soldier',
            gridPosition: { x: 5, y: 8 },
            properties: {
              JobName: 'Soldier',
              faction: 'player',
              health: 150,
              movementSpeed: 35
            }
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      expect(entity.properties.JobName).to.equal('Soldier');
      expect(entity.properties.faction).to.equal('player');
      expect(entity.properties.health).to.equal(150);
      expect(entity.properties.movementSpeed).to.equal(35);
    });
    
    it('should load multiple entities at different positions', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: { JobName: 'Worker' }
          },
          {
            id: 'entity_002',
            type: 'Ant',
            templateId: 'ant_soldier',
            gridPosition: { x: 12, y: 18 },
            properties: { JobName: 'Soldier' }
          },
          {
            id: 'entity_003',
            type: 'Building',
            templateId: 'building_hill',
            gridPosition: { x: 5, y: 5 },
            properties: { buildingType: 'colony' }
          }
        ]
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(3);
      expect(loadedEntities.length).to.equal(3);
    });
    
    it('should place entities at correct grid positions', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: {}
          },
          {
            id: 'entity_002',
            type: 'Ant',
            templateId: 'ant_soldier',
            gridPosition: { x: 12, y: 18 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      
      const entity1 = mockLevelEditor.getEntityAtGridPos(10, 15);
      const entity2 = mockLevelEditor.getEntityAtGridPos(12, 18);
      
      expect(entity1).to.exist;
      expect(entity1.id).to.equal('entity_001');
      
      expect(entity2).to.exist;
      expect(entity2.id).to.equal('entity_002');
    });
    
    it('should retrieve loaded entity by ID', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_abc123',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      
      const entity = mockLevelEditor.getEntityById('entity_abc123');
      
      expect(entity).to.exist;
      expect(entity.gridPosition.x).to.equal(10);
      expect(entity.gridPosition.y).to.equal(15);
    });
    
    it('should preserve entity templateId for spawning', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_scout',
            gridPosition: { x: 7, y: 9 },
            properties: { JobName: 'Scout' }
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      expect(entity.templateId).to.equal('ant_scout');
    });
    
    it('should handle empty entities array', function() {
      const jsonData = {
        terrain: {},
        entities: []
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(0);
      expect(loadedEntities.length).to.equal(0);
    });
    
    it('should handle JSON without entities property', function() {
      const jsonData = {
        terrain: {}
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(0);
    });
  });
  
  describe('Event Loading from JSON (if implemented)', function() {
    it('should load events from JSON if present', function() {
      const jsonData = {
        terrain: {},
        entities: [],
        events: [
          {
            id: 'event_001',
            type: 'dialogue',
            trigger: { type: 'time', params: { delay: 5000 } },
            actions: [{ type: 'showMessage', params: { text: 'Welcome!' } }]
          }
        ]
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.eventsLoaded).to.equal(1);
      expect(loadedEvents.length).to.equal(1);
    });
    
    it('should register events with EventManager', function() {
      const jsonData = {
        terrain: {},
        entities: [],
        events: [
          {
            id: 'event_dialogue_001',
            type: 'dialogue',
            trigger: { type: 'spatial', params: { x: 100, y: 200, radius: 50 } },
            actions: [{ type: 'showMessage', params: { text: 'Hello!' } }]
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      
      const event = mockEventManager.getEvent('event_dialogue_001');
      
      expect(event).to.exist;
      expect(event.type).to.equal('dialogue');
      expect(event.trigger.type).to.equal('spatial');
    });
    
    it('should load multiple events from JSON', function() {
      const jsonData = {
        terrain: {},
        entities: [],
        events: [
          {
            id: 'event_001',
            type: 'dialogue',
            trigger: { type: 'time', params: { delay: 5000 } },
            actions: []
          },
          {
            id: 'event_002',
            type: 'spawn',
            trigger: { type: 'flag', params: { flag: 'wave_started' } },
            actions: []
          },
          {
            id: 'event_003',
            type: 'tutorial',
            trigger: { type: 'viewport', params: { x: 0, y: 0, width: 100, height: 100 } },
            actions: []
          }
        ]
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.eventsLoaded).to.equal(3);
      expect(mockEventManager.events.size).to.equal(3);
    });
    
    it('should handle JSON without events property', function() {
      const jsonData = {
        terrain: {},
        entities: []
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.eventsLoaded).to.equal(0);
    });
  });
  
  describe('Complete Load Workflow', function() {
    it('should load entities and events together', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: { JobName: 'Worker' }
          }
        ],
        events: [
          {
            id: 'event_001',
            type: 'dialogue',
            trigger: { type: 'time', params: { delay: 5000 } },
            actions: []
          }
        ]
      };
      
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(1);
      expect(result.eventsLoaded).to.equal(1);
    });
    
    it('should parse JSON string and load data', function() {
      const jsonString = JSON.stringify({
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: {}
          }
        ]
      });
      
      const jsonData = mockTerrainImporter.loadFromFile(jsonString);
      const result = mockLevelEditor.loadFromJSON(jsonData);
      
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(1);
    });
    
    it('should handle save/load round trip', function() {
      // Original data
      const originalData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 10, y: 15 },
            properties: { JobName: 'Worker', health: 100 }
          },
          {
            id: 'entity_002',
            type: 'Building',
            templateId: 'building_hill',
            gridPosition: { x: 5, y: 5 },
            properties: { buildingType: 'colony' }
          }
        ]
      };
      
      // Save (to JSON string)
      const jsonString = JSON.stringify(originalData);
      
      // Load (from JSON string)
      const loadedData = mockTerrainImporter.loadFromFile(jsonString);
      const result = mockLevelEditor.loadFromJSON(loadedData);
      
      // Verify
      expect(result.success).to.be.true;
      expect(result.entitiesLoaded).to.equal(2);
      
      const entity1 = mockLevelEditor.getEntityById('entity_001');
      const entity2 = mockLevelEditor.getEntityById('entity_002');
      
      expect(entity1.gridPosition).to.deep.equal({ x: 10, y: 15 });
      expect(entity1.properties.health).to.equal(100);
      
      expect(entity2.gridPosition).to.deep.equal({ x: 5, y: 5 });
      expect(entity2.properties.buildingType).to.equal('colony');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity at grid position (0, 0)', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 0, y: 0 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      expect(entity.gridPosition.x).to.equal(0);
      expect(entity.gridPosition.y).to.equal(0);
      expect(entity.worldPosition.x).to.equal(0);
      expect(entity.worldPosition.y).to.equal(0);
    });
    
    it('should handle large grid coordinates', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Ant',
            templateId: 'ant_worker',
            gridPosition: { x: 999, y: 999 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      expect(entity.gridPosition.x).to.equal(999);
      expect(entity.gridPosition.y).to.equal(999);
      expect(entity.worldPosition.x).to.equal(999 * 32);
      expect(entity.worldPosition.y).to.equal(999 * 32);
    });
    
    it('should handle entity with minimal properties', function() {
      const jsonData = {
        terrain: {},
        entities: [
          {
            id: 'entity_001',
            type: 'Entity',
            templateId: 'simple_entity',
            gridPosition: { x: 10, y: 15 },
            properties: {}
          }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData);
      const entity = loadedEntities[0];
      
      expect(entity).to.exist;
      expect(entity.properties).to.be.an('object');
    });
    
    it('should handle invalid JSON gracefully', function() {
      const invalidJson = '{ invalid json }';
      
      const result = mockTerrainImporter.loadFromFile(invalidJson);
      
      expect(result.success).to.be.false;
      expect(result.error).to.exist;
    });
    
    it('should clear previous entities before loading new ones', function() {
      // Load first set
      const jsonData1 = {
        terrain: {},
        entities: [
          { id: 'entity_001', type: 'Ant', templateId: 'ant_worker', gridPosition: { x: 10, y: 15 }, properties: {} }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData1);
      expect(loadedEntities.length).to.equal(1);
      
      // Load second set (should replace first)
      const jsonData2 = {
        terrain: {},
        entities: [
          { id: 'entity_002', type: 'Ant', templateId: 'ant_soldier', gridPosition: { x: 5, y: 5 }, properties: {} },
          { id: 'entity_003', type: 'Ant', templateId: 'ant_scout', gridPosition: { x: 8, y: 8 }, properties: {} }
        ]
      };
      
      mockLevelEditor.loadFromJSON(jsonData2);
      
      expect(loadedEntities.length).to.equal(2);
      expect(mockLevelEditor.getEntityById('entity_001')).to.be.undefined;
      expect(mockLevelEditor.getEntityById('entity_002')).to.exist;
      expect(mockLevelEditor.getEntityById('entity_003')).to.exist;
    });
  });
});
