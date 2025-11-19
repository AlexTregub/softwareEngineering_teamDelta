/**
 * Ant Spawning Integration Tests
 * Tests that ants spawn when game enters PLAYING state
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupMVCTest, loadMVCClasses, loadAntModel, loadAntView, loadAntController } = require('../../helpers/mvcTestHelpers');

// Setup MVC test environment once
setupMVCTest();

describe('Ant Spawning Integration', function() {
  let EventManager;
  let EntityEvents;
  let AntFactory;
  let eventManager;
  let spawnHandler;

  beforeEach(function() {
    // Mock logging functions
    global.logNormal = sinon.stub();
    global.logVerbose = sinon.stub();
    
    // Load MVC base classes
    loadMVCClasses();
    
    // Load ant-specific classes
    loadAntModel();
    loadAntView();
    loadAntController();
    
    // Clear module cache for event system
    delete require.cache[require.resolve('../../../Classes/managers/EventManager.js')];
    delete require.cache[require.resolve('../../../Classes/events/EntityEvents.js')];
    delete require.cache[require.resolve('../../../Classes/mvc/factories/AntFactory.js')];

    // Load modules
    EventManager = require('../../../Classes/managers/EventManager.js');
    EntityEvents = require('../../../Classes/events/EntityEvents.js');
    AntFactory = require('../../../Classes/mvc/factories/AntFactory.js');

    eventManager = EventManager.getInstance();

    // Mock AntFactory.createMultiple
    sinon.stub(AntFactory, 'createMultiple').returns([
      { controller: { id: 'ant1' } },
      { controller: { id: 'ant2' } },
      { controller: { id: 'ant3' } }
    ]);
  });

  afterEach(function() {
    sinon.restore();
    if (spawnHandler) {
      eventManager.off(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
    }
  });

  describe('Event Listener Registration', function() {
    it('should allow registering listener for GAME_PLAYING_STARTED', function() {
      let listenerCalled = false;

      spawnHandler = () => {
        listenerCalled = true;
      };

      eventManager.on(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
      eventManager.emit(EntityEvents.GAME_PLAYING_STARTED, { timestamp: Date.now() });

      expect(listenerCalled).to.be.true;
    });

    it('should receive event data in listener', function() {
      let receivedData = null;

      spawnHandler = (data) => {
        receivedData = data;
      };

      eventManager.on(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
      
      const testData = { timestamp: 12345 };
      eventManager.emit(EntityEvents.GAME_PLAYING_STARTED, testData);

      expect(receivedData).to.deep.equal(testData);
    });
  });

  describe('Ant Spawning on GAME_PLAYING_STARTED', function() {
    it('should spawn ants when GAME_PLAYING_STARTED event fires', function() {
      spawnHandler = (data) => {
        AntFactory.createMultiple(5, {
          jobName: 'Worker',
          x: 400,
          y: 400,
          faction: 'player'
        });
      };

      eventManager.on(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
      eventManager.emit(EntityEvents.GAME_PLAYING_STARTED, { timestamp: Date.now() });

      expect(AntFactory.createMultiple.calledOnce).to.be.true;
      expect(AntFactory.createMultiple.firstCall.args[0]).to.equal(5);
    });

    it('should spawn ants with correct configuration', function() {
      spawnHandler = (data) => {
        AntFactory.createMultiple(3, {
          jobName: 'Worker',
          x: 400,
          y: 400,
          faction: 'player',
          spacing: 10
        });
      };

      eventManager.on(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
      eventManager.emit(EntityEvents.GAME_PLAYING_STARTED, { timestamp: Date.now() });

      const config = AntFactory.createMultiple.firstCall.args[1];
      expect(config).to.deep.include({
        jobName: 'Worker',
        x: 400,
        y: 400,
        faction: 'player',
        spacing: 10
      });
    });

    it('should emit ANTS_BATCH_SPAWNED after spawning', function() {
      const emitSpy = sinon.spy(eventManager, 'emit');

      spawnHandler = (data) => {
        const ants = AntFactory.createMultiple(3, {
          jobName: 'Worker',
          x: 400,
          y: 400
        });

        eventManager.emit(EntityEvents.ANTS_BATCH_SPAWNED, {
          count: ants.length,
          ants: ants,
          location: { x: 400, y: 400 }
        });
      };

      eventManager.on(EntityEvents.GAME_PLAYING_STARTED, spawnHandler);
      eventManager.emit(EntityEvents.GAME_PLAYING_STARTED, { timestamp: Date.now() });

      // Should have GAME_PLAYING_STARTED + ANTS_BATCH_SPAWNED
      const batchSpawnedCall = emitSpy.getCalls().find(call =>
        call.args[0] === EntityEvents.ANTS_BATCH_SPAWNED
      );

      expect(batchSpawnedCall).to.exist;
      
      const eventData = batchSpawnedCall.args[1];
      expect(eventData.count).to.equal(3);
      expect(eventData.ants).to.be.an('array');
      expect(eventData.location).to.deep.equal({ x: 400, y: 400 });
    });
  });

  describe('ANTS_BATCH_SPAWNED Event Data', function() {
    it('should include count, ants array, and location', function() {
      let batchData = null;

      const batchHandler = (data) => {
        batchData = data;
      };

      eventManager.on(EntityEvents.ANTS_BATCH_SPAWNED, batchHandler);
      
      eventManager.emit(EntityEvents.ANTS_BATCH_SPAWNED, {
        count: 5,
        ants: [{ id: 1 }, { id: 2 }],
        location: { x: 100, y: 200 }
      });

      expect(batchData).to.have.property('count', 5);
      expect(batchData).to.have.property('ants');
      expect(batchData.ants).to.be.an('array').with.length(2);
      expect(batchData).to.have.property('location');
      expect(batchData.location).to.deep.equal({ x: 100, y: 200 });

      eventManager.off(EntityEvents.ANTS_BATCH_SPAWNED, batchHandler);
    });
  });
});
