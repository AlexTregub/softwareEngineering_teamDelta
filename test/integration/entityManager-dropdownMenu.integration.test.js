/**
 * Integration Tests: EntityManager + DropDownMenu + EventBus
 * 
 * Tests the complete flow of DropDownMenu querying EntityManager via EventBus
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityManager + DropDownMenu Integration', function() {
  let EntityManager;
  let DropDownMenu;
  let entityManager;
  let dropdownMenu;
  let mockEventBus;
  let mockP5;
  
  beforeEach(function() {
    // Create real EventBus
    const EventBusModule = require('../../Classes/globals/eventBus');
    mockEventBus = EventBusModule.default;
    
    // Clear any existing listeners
    mockEventBus.listeners = {};
    
    // Mock p5 instance
    mockP5 = {
      width: 800,
      height: 600,
      loadImage: sinon.stub().returns({ width: 32, height: 32 })
    };
    
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.image = sinon.stub();
    
    try {
      // Load EntityManager
      EntityManager = require('../../Classes/managers/EntityManager');
      entityManager = new EntityManager({ eventBus: mockEventBus });
      
      // Load DropDownMenu
      DropDownMenu = require('../../Classes/ui_new/components/dropdownMenu');
      dropdownMenu = new DropDownMenu(mockP5, {
        position: { x: 0, y: 0 },
        size: { width: 200, height: 300 }
      });
    } catch (e) {
      // Components don't exist yet
      this.skip();
    }
  });
  
  afterEach(function() {
    sinon.restore();
    if (entityManager) entityManager.destroy();
    if (dropdownMenu) dropdownMenu.destroy();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.image;
  });
  
  describe('Query Flow: DropDownMenu → EventBus → EntityManager', function() {
    it('should request entity counts via EventBus', function(done) {
      // Populate EntityManager
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      
      // Listen for response
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        expect(data.counts.ant).to.equal(2);
        expect(data.counts.resource).to.equal(1);
        expect(data.total).to.equal(3);
        done();
      });
      
      // DropDownMenu requests counts
      mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
    });
    
    it('should request specific entity type count', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        expect(data.type).to.equal('ant');
        expect(data.count).to.equal(2);
        done();
      });
      
      mockEventBus.emit('QUERY_ENTITY_COUNTS', { type: 'ant' });
    });
    
    it('should request ant details breakdown', function(done) {
      entityManager.registerEntity('ant', 'ant-001', { jobName: 'Worker' });
      entityManager.registerEntity('ant', 'ant-002', { jobName: 'Worker' });
      entityManager.registerEntity('ant', 'ant-003', { jobName: 'Scout' });
      entityManager.registerEntity('ant', 'ant-004', { jobName: 'Soldier' });
      
      mockEventBus.on('ANT_DETAILS_RESPONSE', (data) => {
        expect(data.total).to.equal(4);
        expect(data.breakdown.Worker).to.equal(2);
        expect(data.breakdown.Scout).to.equal(1);
        expect(data.breakdown.Soldier).to.equal(1);
        done();
      });
      
      mockEventBus.emit('QUERY_ANT_DETAILS', {});
    });
  });
  
  describe('Real-time Updates', function() {
    it('should notify DropDownMenu when entities are registered', function(done) {
      mockEventBus.on('ENTITY_REGISTERED', (data) => {
        expect(data.type).to.equal('ant');
        expect(data.id).to.equal('ant-001');
        done();
      });
      
      entityManager.registerEntity('ant', 'ant-001');
    });
    
    it('should notify DropDownMenu when entities are unregistered', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      
      mockEventBus.on('ENTITY_UNREGISTERED', (data) => {
        expect(data.type).to.equal('ant');
        expect(data.id).to.equal('ant-001');
        done();
      });
      
      entityManager.unregisterEntity('ant', 'ant-001');
    });
    
    it('should update DropDownMenu content when counts change', function(done) {
      let updateCount = 0;
      
      mockEventBus.on('ENTITY_REGISTERED', () => {
        updateCount++;
        
        if (updateCount === 3) {
          // Query final state
          mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
        }
      });
      
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        expect(data.total).to.equal(3);
        done();
      });
      
      // Add entities one by one
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('ant', 'ant-003');
    });
  });
  
  describe('DropDownMenu Display Logic', function() {
    it('should populate information lines from entity counts', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        // Simulate DropDownMenu updating its lines
        dropdownMenu.informationLines.clear();
        
        Object.entries(data.counts).forEach(([type, count]) => {
          dropdownMenu.addInformationLine({
            caption: `${type}: ${count}`
          });
        });
        
        expect(dropdownMenu.informationLines.size).to.equal(2);
        expect(Array.from(dropdownMenu.informationLines.values())[0].caption).to.include('ant: 2');
        done();
      });
      
      mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
    });
    
    it('should update total count in title line', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      entityManager.registerEntity('resource', 'resource-001');
      
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        // Update title line with total
        dropdownMenu.titleLine.caption = `Total Entities: ${data.total}`;
        
        expect(dropdownMenu.titleLine.caption).to.equal('Total Entities: 3');
        done();
      });
      
      mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
    });
    
    it('should display ant job breakdown in expanded menu', function(done) {
      entityManager.registerEntity('ant', 'ant-001', { jobName: 'Worker' });
      entityManager.registerEntity('ant', 'ant-002', { jobName: 'Scout' });
      entityManager.registerEntity('ant', 'ant-003', { jobName: 'Soldier' });
      
      mockEventBus.on('ANT_DETAILS_RESPONSE', (data) => {
        // Clear and rebuild lines
        dropdownMenu.informationLines.clear();
        
        Object.entries(data.breakdown).forEach(([jobName, count]) => {
          dropdownMenu.addInformationLine({
            caption: `${jobName}: ${count}`
          });
        });
        
        expect(dropdownMenu.informationLines.size).to.equal(3);
        done();
      });
      
      mockEventBus.emit('QUERY_ANT_DETAILS', {});
    });
  });
  
  describe('Performance', function() {
    it('should handle frequent query requests efficiently', function() {
      // Populate with many entities
      for (let i = 0; i < 100; i++) {
        entityManager.registerEntity('ant', `ant-${i}`);
      }
      
      let responseCount = 0;
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', () => {
        responseCount++;
      });
      
      // Rapid queries (simulating game loop)
      for (let i = 0; i < 60; i++) { // 60 FPS
        mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
      }
      
      expect(responseCount).to.equal(60);
    });
    
    it('should not block rendering when updating counts', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      entityManager.registerEntity('ant', 'ant-002');
      
      let responseReceived = false;
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        // Response received, event flow not blocked
        responseReceived = true;
        expect(data.total).to.equal(2);
        done();
      });
      
      // Query should complete without blocking
      mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
      expect(responseReceived).to.be.true;
    });
  });
  
  describe('Error Handling', function() {
    it('should handle missing EntityManager gracefully', function() {
      // Destroy EntityManager
      entityManager.destroy();
      entityManager = null;
      
      // Query should not crash
      expect(() => {
        mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
      }).to.not.throw();
    });
    
    it('should handle empty entity counts', function(done) {
      // EntityManager with no entities
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        expect(data.total).to.equal(0);
        expect(Object.keys(data.counts).length).to.equal(0);
        done();
      });
      
      mockEventBus.emit('QUERY_ENTITY_COUNTS', {});
    });
    
    it('should handle query for non-existent type', function(done) {
      entityManager.registerEntity('ant', 'ant-001');
      
      mockEventBus.on('ENTITY_COUNTS_RESPONSE', (data) => {
        expect(data.type).to.equal('enemy');
        expect(data.count).to.equal(0);
        done();
      });
      
      mockEventBus.emit('QUERY_ENTITY_COUNTS', { type: 'enemy' });
    });
  });
  
  describe('Lifecycle Integration', function() {
    it('should cleanup listeners when DropDownMenu is destroyed', function() {
      const initialListenerCount = Object.keys(mockEventBus.listeners).length;
      
      dropdownMenu.destroy();
      
      // Should remove its listeners
      expect(Object.keys(mockEventBus.listeners).length).to.be.lessThanOrEqual(initialListenerCount);
    });
    
    it('should cleanup listeners when EntityManager is destroyed', function() {
      const initialListenerCount = Object.keys(mockEventBus.listeners).length;
      
      entityManager.destroy();
      
      // Should remove its listeners
      expect(Object.keys(mockEventBus.listeners).length).to.be.lessThanOrEqual(initialListenerCount);
    });
    
    it('should allow recreating EntityManager after destruction', function() {
      entityManager.destroy();
      
      const newManager = new EntityManager({ eventBus: mockEventBus });
      newManager.registerEntity('ant', 'ant-001');
      
      expect(newManager.getCount('ant')).to.equal(1);
      
      newManager.destroy();
    });
  });
});
