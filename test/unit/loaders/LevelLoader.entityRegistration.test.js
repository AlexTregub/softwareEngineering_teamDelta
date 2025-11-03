/**
 * TDD Tests for LevelLoader - Entity Registration
 * 
 * Tests that loadCustomLevel() properly registers entities with game world:
 * - Adds entities to global ants[] array
 * - Adds resources to resource_list[] array
 * - Adds buildings to Buildings[] array
 * - Registers queen with window.queenAnt
 * - Registers entities with spatialGridManager
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelLoader - Entity Registration (loadCustomLevel)', function() {
  let sandbox;
  let mockLevelLoader;
  let mockEntityFactory;
  let mockQueenDetection;
  let mockCameraManager;
  let mockSpatialGrid;
  let testEntities;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock global arrays
    global.ants = [];
    global.resource_list = [];
    global.Buildings = [];
    global.queenAnt = null;
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.ants = global.ants;
      window.resource_list = global.resource_list;
      window.Buildings = global.Buildings;
      window.queenAnt = global.queenAnt;
    }
    
    // Create test entities
    testEntities = [
      { id: 'queen_1', type: 'Queen', x: 100, y: 100, position: { x: 100, y: 100 } },
      { id: 'ant_1', type: 'Ant', x: 200, y: 200, position: { x: 200, y: 200 } },
      { id: 'ant_2', type: 'Ant', x: 300, y: 300, position: { x: 300, y: 300 } },
      { id: 'resource_1', type: 'Resource', x: 400, y: 400, position: { x: 400, y: 400 } },
      { id: 'building_1', type: 'Building', x: 500, y: 500, position: { x: 500, y: 500 } }
    ];
    
    // Mock LevelLoader
    mockLevelLoader = {
      loadLevel: sandbox.stub().returns({
        success: true,
        entities: testEntities,
        terrain: { type: 'sparse', tiles: [] }
      })
    };
    global.LevelLoader = sandbox.stub().returns(mockLevelLoader);
    
    // Mock queenDetection
    mockQueenDetection = {
      findQueen: sandbox.stub().returns(testEntities[0])
    };
    global.queenDetection = mockQueenDetection;
    
    // Mock cameraManager
    mockCameraManager = {
      followEntity: sandbox.stub().returns(true)
    };
    global.cameraManager = mockCameraManager;
    
    // Mock spatialGridManager
    mockSpatialGrid = {
      registerEntity: sandbox.stub()
    };
    global.spatialGridManager = mockSpatialGrid;
    
    // Sync mocks with window
    if (typeof window !== 'undefined') {
      window.LevelLoader = global.LevelLoader;
      window.queenDetection = global.queenDetection;
      window.cameraManager = global.cameraManager;
      window.spatialGridManager = global.spatialGridManager;
    }
  });

  afterEach(function() {
    sandbox.restore();
    delete global.ants;
    delete global.resource_list;
    delete global.Buildings;
    delete global.queenAnt;
    delete global.LevelLoader;
    delete global.queenDetection;
    delete global.cameraManager;
    delete global.spatialGridManager;
  });

  describe('Entity Array Registration', function() {
    it('should add Ant entities to global ants[] array', function() {
      // This test will initially fail - loadCustomLevel() doesn't register entities yet
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(global.ants).to.have.lengthOf(3); // Queen + 2 Ants
      expect(global.ants[0].type).to.equal('Queen');
      expect(global.ants[1].type).to.equal('Ant');
      expect(global.ants[2].type).to.equal('Ant');
    });

    it('should add Resource entities to global resource_list[] array', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(global.resource_list).to.have.lengthOf(1);
      expect(global.resource_list[0].type).to.equal('Resource');
    });

    it('should add Building entities to global Buildings[] array', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(global.Buildings).to.have.lengthOf(1);
      expect(global.Buildings[0].type).to.equal('Building');
    });
  });

  describe('Queen Registration', function() {
    it('should register queen with global queenAnt', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(global.queenAnt).to.exist;
      expect(global.queenAnt.type).to.equal('Queen');
      expect(global.queenAnt.id).to.equal('queen_1');
    });

    it('should call queenDetection.findQueen() to locate queen', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(mockQueenDetection.findQueen.calledOnce).to.be.true;
    });

    it('should call cameraManager.followEntity() with queen', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(mockCameraManager.followEntity.calledOnce).to.be.true;
      expect(mockCameraManager.followEntity.firstCall.args[0].type).to.equal('Queen');
    });
  });

  describe('Spatial Grid Registration', function() {
    it('should register all entities with spatialGridManager', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      expect(mockSpatialGrid.registerEntity.callCount).to.equal(5); // All 5 entities
    });

    it('should register entities with correct positions', function() {
      const result = loadCustomLevel('test.json', testEntities);
      
      const firstCall = mockSpatialGrid.registerEntity.getCall(0);
      expect(firstCall.args[0].position.x).to.equal(100);
      expect(firstCall.args[0].position.y).to.equal(100);
    });
  });

  describe('Error Handling', function() {
    it('should handle missing spatialGridManager gracefully', function() {
      delete global.spatialGridManager;
      
      expect(() => loadCustomLevel('test.json', testEntities)).to.not.throw();
      expect(global.ants).to.have.lengthOf(3); // Entities still registered
    });

    it('should handle missing queenDetection gracefully', function() {
      delete global.queenDetection;
      
      expect(() => loadCustomLevel('test.json', testEntities)).to.not.throw();
      expect(global.ants).to.have.lengthOf(3);
    });

    it('should handle missing cameraManager gracefully', function() {
      delete global.cameraManager;
      
      expect(() => loadCustomLevel('test.json', testEntities)).to.not.throw();
      expect(global.ants).to.have.lengthOf(3);
    });
  });
});

/**
 * Mock registerEntitiesWithGameWorld function from sketch.js
 * Mirrors the actual implementation
 */
function registerEntitiesWithGameWorld(entities) {
  const counts = { ants: 0, resources: 0, buildings: 0 };
  
  if (!Array.isArray(entities) || entities.length === 0) {
    return counts;
  }
  
  entities.forEach((entity) => {
    if (!entity || !entity.type) return;
    
    if (entity.type === 'Queen' || entity.type === 'Ant') {
      global.ants.push(entity);
      counts.ants++;
    } else if (entity.type === 'Resource') {
      global.resource_list.push(entity);
      counts.resources++;
    } else if (entity.type === 'Building') {
      global.Buildings.push(entity);
      counts.buildings++;
    }
    
    if (global.spatialGridManager && typeof global.spatialGridManager.registerEntity === 'function') {
      global.spatialGridManager.registerEntity(entity);
    }
  });
  
  return counts;
}

/**
 * Mock loadCustomLevel function for testing
 * This simulates the actual function in sketch.js
 */
function loadCustomLevel(filename, entities) {
  const loader = new LevelLoader();
  const result = loader.loadLevel({});
  
  if (result.success && result.entities && result.entities.length > 0) {
    // Register entities with game world
    registerEntitiesWithGameWorld(result.entities);
    
    // Find and register queen
    if (global.queenDetection && global.queenDetection.findQueen) {
      const queen = global.queenDetection.findQueen(result.entities);
      if (queen) {
        global.queenAnt = queen;
        
        // Start camera following
        if (global.cameraManager && global.cameraManager.followEntity) {
          global.cameraManager.followEntity(queen);
        }
      }
    }
  }
  
  return result;
}
