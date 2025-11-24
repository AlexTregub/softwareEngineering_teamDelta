/**
 * Integration Tests: Entity → EventBus → EntityManager
 * 
 * Tests that Entity base class automatically registers/unregisters with EntityManager
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Entity → EntityManager Integration', function() {
  let EntityManager;
  let Entity;
  let entityManager;
  let mockEventBus;
  
  beforeEach(function() {
    // Create real EventBus
    const EventBusModule = require('../../Classes/globals/eventBus');
    mockEventBus = EventBusModule.default;
    
    // Clear any existing listeners
    mockEventBus.listeners = {};
    
    // Mock global dependencies for Entity
    global.CollisionBox2D = class {
      constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
      }
      setPosition(x, y) { this.x = x; this.y = y; }
      setSize(w, h) { this.width = w; this.height = h; }
      getPosition() { return { x: this.x, y: this.y }; }
      getSize() { return { x: this.width, y: this.height }; }
    };
    
    global.Sprite2D = class {
      constructor(img, pos, size, rot) {
        this.image = img;
        this.position = pos;
        this.size = size;
        this.rotation = rot;
      }
      setPosition(pos) { this.position = pos; }
      setSize(size) { this.size = size; }
      setImage(img) { this.image = img; }
    };
    
    global.createVector = (x, y) => ({ x, y });
    global.spatialGridManager = { addEntity: sinon.stub(), removeEntity: sinon.stub() };
    
    // Mock all controller classes that Entity tries to use
    global.TransformController = undefined; // Entity checks if these exist
    global.MovementController = undefined;
    global.RenderController = undefined;
    global.SelectionController = undefined;
    global.CombatController = undefined;
    global.TerrainController = undefined;
    global.TaskManager = undefined;
    global.HealthController = undefined;
    global.InteractionController = undefined;
    global.InventoryController = undefined;
    global.UniversalDebugger = undefined;
    
    try {
      // Load EntityManager
      EntityManager = require('../../Classes/managers/EntityManager');
      entityManager = new EntityManager({ eventBus: mockEventBus });
      
      // Load Entity
      Entity = require('../../Classes/containers/Entity');
    } catch (e) {
      console.error('Failed to load modules:', e);
      this.skip();
    }
  });
  
  afterEach(function() {
    sinon.restore();
    if (entityManager) entityManager.destroy();
    delete global.CollisionBox2D;
    delete global.Sprite2D;
    delete global.createVector;
    delete global.spatialGridManager;
  });
  
  describe('Entity Creation Auto-Registration', function() {
    it('should auto-register generic entity on creation', function() {
      const entity = new Entity(100, 100, 32, 32, { type: 'TestEntity' });
      
      const counts = entityManager.getCounts();
      expect(counts.testentity).to.equal(1);
    });
    
    it('should auto-register ant entity on creation', function() {
      const ant = new Entity(100, 100, 32, 32, {
        type: 'Ant',
        JobName: 'Worker',
        faction: 'player'
      });
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(1);
    });
    
    it('should auto-register resource entity on creation', function() {
      const resource = new Entity(100, 100, 20, 20, {
        type: 'Resource',
        resourceType: 'leaf'
      });
      
      const counts = entityManager.getCounts();
      expect(counts.resource).to.equal(1);
    });
    
    it('should auto-register building entity on creation', function() {
      const building = new Entity(100, 100, 64, 64, {
        type: 'Building',
        buildingType: 'anthill',
        faction: 'player'
      });
      
      const counts = entityManager.getCounts();
      expect(counts.building).to.equal(1);
    });
    
    it('should register multiple entities of different types', function() {
      new Entity(100, 100, 32, 32, { type: 'Ant', JobName: 'Scout', faction: 'player' });
      new Entity(200, 200, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      new Entity(300, 300, 20, 20, { type: 'Resource', resourceType: 'stick' });
      new Entity(400, 400, 64, 64, { type: 'Building', buildingType: 'anthill', faction: 'player' });
      
      const counts = entityManager.getCounts();
      expect(counts.ant).to.equal(2);
      expect(counts.resource).to.equal(1);
      expect(counts.building).to.equal(1);
      expect(entityManager.getTotalCount()).to.equal(4);
    });
  });
  
  describe('Entity Destruction Auto-Unregistration', function() {
    it('should auto-unregister entity on destroy', function() {
      const entity = new Entity(100, 100, 32, 32, { type: 'TestEntity' });
      
      expect(entityManager.getCount('testentity')).to.equal(1);
      
      entity.destroy();
      
      expect(entityManager.getCount('testentity')).to.equal(0);
    });
    
    it('should unregister ant and update counts', function() {
      const ant = new Entity(100, 100, 32, 32, {
        type: 'Ant',
        JobName: 'Worker',
        faction: 'player'
      });
      
      expect(entityManager.getCount('ant')).to.equal(1);
      
      ant.destroy();
      
      expect(entityManager.getCount('ant')).to.equal(0);
    });
    
    it('should handle multiple entities being destroyed', function() {
      const ant1 = new Entity(100, 100, 32, 32, { type: 'Ant', JobName: 'Scout', faction: 'player' });
      const ant2 = new Entity(200, 200, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      const ant3 = new Entity(300, 300, 32, 32, { type: 'Ant', JobName: 'Soldier', faction: 'player' });
      
      expect(entityManager.getCount('ant')).to.equal(3);
      
      ant1.destroy();
      expect(entityManager.getCount('ant')).to.equal(2);
      
      ant2.destroy();
      expect(entityManager.getCount('ant')).to.equal(1);
      
      ant3.destroy();
      expect(entityManager.getCount('ant')).to.equal(0);
    });
    
    it('should not double-unregister if destroy called twice', function() {
      const entity = new Entity(100, 100, 32, 32, { type: 'TestEntity' });
      
      expect(entityManager.getCount('testentity')).to.equal(1);
      
      entity.destroy();
      expect(entityManager.getCount('testentity')).to.equal(0);
      
      // Call destroy again (should not crash or underflow)
      entity.destroy();
      expect(entityManager.getCount('testentity')).to.equal(0);
    });
  });
  
  describe('Ant Job Metadata Tracking', function() {
    it('should track ant job types from metadata', function() {
      new Entity(100, 100, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      new Entity(200, 200, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      new Entity(300, 300, 32, 32, { type: 'Ant', JobName: 'Scout', faction: 'player' });
      
      const antDetails = entityManager.getAntDetails();
      expect(antDetails.Worker).to.equal(2);
      expect(antDetails.Scout).to.equal(1);
    });
    
    it('should update job counts when ants are destroyed', function() {
      const worker1 = new Entity(100, 100, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      const worker2 = new Entity(200, 200, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' });
      const scout = new Entity(300, 300, 32, 32, { type: 'Ant', JobName: 'Scout', faction: 'player' });
      
      expect(entityManager.getAntDetails().Worker).to.equal(2);
      
      worker1.destroy();
      
      expect(entityManager.getAntDetails().Worker).to.equal(1);
      expect(entityManager.getAntDetails().Scout).to.equal(1);
    });
  });
  
  describe('Real-time Event Flow', function() {
    it('should emit ENTITY_REGISTERED when entity created', function(done) {
      mockEventBus.on('ENTITY_REGISTERED', (data) => {
        expect(data.type).to.equal('testentity');
        expect(data.id).to.be.a('string');
        expect(data.metadata).to.be.an('object');
        done();
      });
      
      new Entity(100, 100, 32, 32, { type: 'TestEntity' });
    });
    
    it('should emit ENTITY_UNREGISTERED when entity destroyed', function(done) {
      const entity = new Entity(100, 100, 32, 32, { type: 'TestEntity' });
      
      mockEventBus.on('ENTITY_UNREGISTERED', (data) => {
        expect(data.type).to.equal('testentity');
        expect(data.id).to.be.a('string');
        done();
      });
      
      entity.destroy();
    });
    
    it('should maintain accurate counts during rapid create/destroy', function() {
      const entities = [];
      
      // Create 10 entities
      for (let i = 0; i < 10; i++) {
        entities.push(new Entity(i * 50, i * 50, 32, 32, { type: 'Ant', JobName: 'Worker', faction: 'player' }));
      }
      
      expect(entityManager.getCount('ant')).to.equal(10);
      
      // Destroy 5 entities
      for (let i = 0; i < 5; i++) {
        entities[i].destroy();
      }
      
      expect(entityManager.getCount('ant')).to.equal(5);
      
      // Create 3 more
      for (let i = 0; i < 3; i++) {
        entities.push(new Entity(i * 50 + 500, i * 50, 32, 32, { type: 'Ant', JobName: 'Scout', faction: 'player' }));
      }
      
      expect(entityManager.getCount('ant')).to.equal(8);
      expect(entityManager.getAntDetails().Worker).to.equal(5);
      expect(entityManager.getAntDetails().Scout).to.equal(3);
    });
  });
});
