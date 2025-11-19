/**
 * GameStateManager - Event Emission Tests
 * Tests that GameStateManager emits events via EventManager
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('GameStateManager - Event Emission', function() {
  let GameStateManager;
  let EventManager;
  let EntityEvents;
  let gameState;
  let eventManager;

  beforeEach(function() {
    // Mock global functions needed by EventManager
    global.logNormal = sinon.stub();
    global.logVerbose = sinon.stub();
    
    // Clear module cache to get fresh instances
    delete require.cache[require.resolve('../../../Classes/managers/GameStateManager.js')];
    delete require.cache[require.resolve('../../../Classes/managers/EventManager.js')];
    delete require.cache[require.resolve('../../../Classes/events/EntityEvents.js')];

    // Load modules
    GameStateManager = require('../../../Classes/managers/GameStateManager.js');
    EventManager = require('../../../Classes/managers/EventManager.js');
    EntityEvents = require('../../../Classes/events/EntityEvents.js');

    // Create instances
    eventManager = EventManager.getInstance();
    gameState = new GameStateManager();

    // Spy on EventManager emit method
    sinon.spy(eventManager, 'emit');
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('setState() Event Emissions', function() {
    it('should emit GAME_STATE_CHANGED when state changes', function() {
      gameState.setState('PLAYING');

      // Find the GAME_STATE_CHANGED call
      const stateChangedCall = eventManager.emit.getCalls().find(call =>
        call.args[0] === EntityEvents.GAME_STATE_CHANGED
      );
      
      expect(stateChangedCall).to.exist;
      expect(stateChangedCall.args[0]).to.equal(EntityEvents.GAME_STATE_CHANGED);
      
      const eventData = stateChangedCall.args[1];
      expect(eventData).to.have.property('oldState', 'MENU');
      expect(eventData).to.have.property('newState', 'PLAYING');
    });

    it('should emit GAME_PLAYING_STARTED when entering PLAYING state', function() {
      gameState.setState('PLAYING');

      // Should emit both GAME_STATE_CHANGED and GAME_PLAYING_STARTED
      expect(eventManager.emit.callCount).to.equal(2);
      
      const calls = eventManager.emit.getCalls();
      const playingStartedCall = calls.find(call => 
        call.args[0] === EntityEvents.GAME_PLAYING_STARTED
      );

      expect(playingStartedCall).to.exist;
      const eventData = playingStartedCall.args[1];
      expect(eventData).to.have.property('timestamp');
      expect(eventData.timestamp).to.be.a('number');
    });

    it('should emit GAME_PLAYING_STOPPED when leaving PLAYING state', function() {
      // First enter PLAYING state
      gameState.setState('PLAYING');
      eventManager.emit.resetHistory();

      // Then leave PLAYING state
      gameState.setState('PAUSED');

      const calls = eventManager.emit.getCalls();
      const playingStoppedCall = calls.find(call => 
        call.args[0] === EntityEvents.GAME_PLAYING_STOPPED
      );

      expect(playingStoppedCall).to.exist;
      const eventData = playingStoppedCall.args[1];
      expect(eventData).to.have.property('reason');
      expect(eventData.reason).to.equal('PAUSED');
    });

    it('should not emit events when skipCallbacks is true', function() {
      gameState.setState('PLAYING', true);

      expect(eventManager.emit.called).to.be.false;
    });

    it('should include timestamp in GAME_STATE_CHANGED event', function() {
      const beforeTime = Date.now();
      gameState.setState('PLAYING');
      const afterTime = Date.now();

      const stateChangedCall = eventManager.emit.getCalls().find(call =>
        call.args[0] === EntityEvents.GAME_STATE_CHANGED
      );

      const eventData = stateChangedCall.args[1];
      expect(eventData).to.have.property('timestamp');
      expect(eventData.timestamp).to.be.at.least(beforeTime);
      expect(eventData.timestamp).to.be.at.most(afterTime);
    });
  });

  describe('Multiple State Transitions', function() {
    it('should emit GAME_PLAYING_STOPPED when transitioning PLAYING -> MENU', function() {
      gameState.setState('PLAYING');
      eventManager.emit.resetHistory();

      gameState.setState('MENU');

      const calls = eventManager.emit.getCalls();
      const playingStoppedCall = calls.find(call => 
        call.args[0] === EntityEvents.GAME_PLAYING_STOPPED
      );

      expect(playingStoppedCall).to.exist;
      expect(playingStoppedCall.args[1].reason).to.equal('MENU');
    });

    it('should emit GAME_PLAYING_STOPPED when transitioning PLAYING -> GAME_OVER', function() {
      gameState.setState('PLAYING');
      eventManager.emit.resetHistory();

      gameState.setState('GAME_OVER');

      const calls = eventManager.emit.getCalls();
      const playingStoppedCall = calls.find(call => 
        call.args[0] === EntityEvents.GAME_PLAYING_STOPPED
      );

      expect(playingStoppedCall).to.exist;
      expect(playingStoppedCall.args[1].reason).to.equal('GAME_OVER');
    });

    it('should not emit GAME_PLAYING_STOPPED when transitioning MENU -> OPTIONS', function() {
      gameState.setState('OPTIONS');

      const calls = eventManager.emit.getCalls();
      const playingStoppedCall = calls.find(call => 
        call.args[0] === EntityEvents.GAME_PLAYING_STOPPED
      );

      expect(playingStoppedCall).to.not.exist;
    });
  });

  describe('Event Data Validation', function() {
    it('should include all required fields in GAME_STATE_CHANGED', function() {
      gameState.setState('PLAYING');

      const stateChangedCall = eventManager.emit.getCalls().find(call =>
        call.args[0] === EntityEvents.GAME_STATE_CHANGED
      );

      const eventData = stateChangedCall.args[1];
      expect(eventData).to.have.all.keys('oldState', 'newState', 'timestamp');
    });

    it('should include all required fields in GAME_PLAYING_STARTED', function() {
      gameState.setState('PLAYING');

      const playingStartedCall = eventManager.emit.getCalls().find(call =>
        call.args[0] === EntityEvents.GAME_PLAYING_STARTED
      );

      const eventData = playingStartedCall.args[1];
      expect(eventData).to.have.all.keys('timestamp');
    });

    it('should include all required fields in GAME_PLAYING_STOPPED', function() {
      gameState.setState('PLAYING');
      eventManager.emit.resetHistory();
      gameState.setState('PAUSED');

      const playingStoppedCall = eventManager.emit.getCalls().find(call =>
        call.args[0] === EntityEvents.GAME_PLAYING_STOPPED
      );

      const eventData = playingStoppedCall.args[1];
      expect(eventData).to.have.all.keys('reason', 'timestamp');
    });
  });
});
