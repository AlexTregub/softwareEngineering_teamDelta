/**
 * EntityEvents - Game State Event Constants Tests
 * Tests for new game state and ant spawning event constants
 */

const { expect } = require('chai');

describe('EntityEvents - Game State Events', function() {
  let EntityEvents;

  before(function() {
    // Load EntityEvents
    EntityEvents = require('../../../Classes/events/EntityEvents.js');
  });

  describe('Game State Event Constants', function() {
    it('should have GAME_STATE_CHANGED constant', function() {
      expect(EntityEvents).to.have.property('GAME_STATE_CHANGED');
      expect(EntityEvents.GAME_STATE_CHANGED).to.be.a('string');
      expect(EntityEvents.GAME_STATE_CHANGED).to.equal('game:state:changed');
    });

    it('should have GAME_PLAYING_STARTED constant', function() {
      expect(EntityEvents).to.have.property('GAME_PLAYING_STARTED');
      expect(EntityEvents.GAME_PLAYING_STARTED).to.be.a('string');
      expect(EntityEvents.GAME_PLAYING_STARTED).to.equal('game:playing:started');
    });

    it('should have GAME_PLAYING_STOPPED constant', function() {
      expect(EntityEvents).to.have.property('GAME_PLAYING_STOPPED');
      expect(EntityEvents.GAME_PLAYING_STOPPED).to.be.a('string');
      expect(EntityEvents.GAME_PLAYING_STOPPED).to.equal('game:playing:stopped');
    });
  });

  describe('Ant Spawning Event Constants', function() {
    it('should have ANTS_BATCH_SPAWNED constant', function() {
      expect(EntityEvents).to.have.property('ANTS_BATCH_SPAWNED');
      expect(EntityEvents.ANTS_BATCH_SPAWNED).to.be.a('string');
      expect(EntityEvents.ANTS_BATCH_SPAWNED).to.equal('ants:batch:spawned');
    });

    it('should have ANT_FACTORY_READY constant', function() {
      expect(EntityEvents).to.have.property('ANT_FACTORY_READY');
      expect(EntityEvents.ANT_FACTORY_READY).to.be.a('string');
      expect(EntityEvents.ANT_FACTORY_READY).to.equal('ant:factory:ready');
    });
  });

  describe('Event Constants Immutability', function() {
    it('should not allow modification of EntityEvents object', function() {
      expect(Object.isFrozen(EntityEvents)).to.be.true;
    });

    it('should not allow adding new properties', function() {
      const attempt = () => {
        EntityEvents.NEW_PROPERTY = 'test';
      };
      
      // In strict mode or frozen objects, this would throw
      attempt();
      expect(EntityEvents).to.not.have.property('NEW_PROPERTY');
    });
  });
});
