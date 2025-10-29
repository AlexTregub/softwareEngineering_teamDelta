/**
 * Unit Tests for Event Trigger Classes
 * Tests EventTrigger base class and specific trigger types (TimeTrigger, SpatialTrigger, FlagTrigger, etc.)
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const {
  EventTrigger,
  TimeTrigger,
  SpatialTrigger,
  FlagTrigger,
  ConditionalTrigger,
  ViewportSpawnTrigger
} = require('../../../Classes/events/EventTrigger');

// Make globally available for tests
global.EventTrigger = EventTrigger;
global.TimeTrigger = TimeTrigger;
global.SpatialTrigger = SpatialTrigger;
global.FlagTrigger = FlagTrigger;
global.ConditionalTrigger = ConditionalTrigger;
global.ViewportSpawnTrigger = ViewportSpawnTrigger;

describe('EventTrigger Base Class', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    global.millis = sandbox.stub().returns(1000);
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create trigger with event ID and type', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      const trigger = new EventTrigger({
        eventId: 'test_event',
        type: 'time'
      });

      expect(trigger.eventId).to.equal('test_event');
      expect(trigger.type).to.equal('time');
    });

    it('should default to one-time trigger', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      const trigger = new EventTrigger({
        eventId: 'test_event',
        type: 'time'
      });

      expect(trigger.oneTime).to.be.true;
    });

    it('should support repeatable triggers', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      const trigger = new EventTrigger({
        eventId: 'repeatable',
        type: 'time',
        oneTime: false
      });

      expect(trigger.oneTime).to.be.false;
    });

    it('should initialize as not triggered', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      const trigger = new EventTrigger({
        eventId: 'test_event',
        type: 'time'
      });

      expect(trigger.hasTriggered).to.be.false;
    });
  });

  describe('Trigger State', function() {
    let trigger;

    beforeEach(function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      trigger = new EventTrigger({
        eventId: 'state_test',
        type: 'time'
      });
    });

    it('should mark trigger as activated', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      trigger.activate();

      expect(trigger.hasTriggered).to.be.true;
      expect(trigger.triggeredAt).to.exist;
    });

    it('should reset trigger state', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      trigger.activate();
      trigger.reset();

      expect(trigger.hasTriggered).to.be.false;
      expect(trigger.triggeredAt).to.be.null;
    });

    it('should not activate twice if one-time', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      trigger.activate();
      const secondActivation = trigger.activate();

      expect(secondActivation).to.be.false;
    });

    it('should allow multiple activations if repeatable', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      trigger.oneTime = false;
      
      trigger.activate();
      const secondActivation = trigger.activate();

      expect(secondActivation).to.be.true;
    });
  });

  describe('Condition Checking', function() {
    it('should have abstract checkCondition method', function() {
      if (typeof EventTrigger === 'undefined') return this.skip();
      
      const trigger = new EventTrigger({
        eventId: 'abstract_test',
        type: 'time'
      });

      // Base class checkCondition should exist
      expect(trigger.checkCondition).to.be.a('function');
    });
  });
});

describe('TimeTrigger', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    global.millis = sandbox.stub().returns(0);
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Delay-based Trigger', function() {
    it('should trigger after specified delay', function() {
      if (typeof TimeTrigger === 'undefined') return this.skip();
      
      const trigger = new TimeTrigger({
        eventId: 'delay_event',
        condition: { delay: 5000 }
      });

      global.millis.returns(0);
      trigger.initialize();
      
      global.millis.returns(4999);
      expect(trigger.checkCondition()).to.be.false;
      
      global.millis.returns(5000);
      expect(trigger.checkCondition()).to.be.true;
    });

    it('should trigger immediately with zero delay', function() {
      if (typeof TimeTrigger === 'undefined') return this.skip();
      
      const trigger = new TimeTrigger({
        eventId: 'immediate_event',
        condition: { delay: 0 }
      });

      trigger.initialize();
      expect(trigger.checkCondition()).to.be.true;
    });
  });

  describe('Interval-based Trigger', function() {
    it('should trigger repeatedly at intervals', function() {
      if (typeof TimeTrigger === 'undefined') return this.skip();
      
      const trigger = new TimeTrigger({
        eventId: 'interval_event',
        condition: { interval: 1000 },
        oneTime: false
      });

      global.millis.returns(0);
      trigger.initialize();
      
      global.millis.returns(1000);
      expect(trigger.checkCondition()).to.be.true;
      
      trigger.reset(); // Reset for next interval
      
      global.millis.returns(2000);
      expect(trigger.checkCondition()).to.be.true;
    });
  });

  describe('Specific Time Trigger', function() {
    it('should trigger at specific game time', function() {
      if (typeof TimeTrigger === 'undefined') return this.skip();
      
      // Mock game time system (assuming day/night cycle integration)
      global.gameTime = { getCurrentTime: sandbox.stub().returns(1200) };
      if (typeof window !== 'undefined') {
        window.gameTime = global.gameTime;
      }

      const trigger = new TimeTrigger({
        eventId: 'time_of_day_event',
        condition: { gameTime: 1200 } // Noon
      });

      expect(trigger.checkCondition()).to.be.true;
      
      global.gameTime.getCurrentTime.returns(1100);
      expect(trigger.checkCondition()).to.be.false;
    });
  });
});

describe('SpatialTrigger', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.dist = sandbox.stub().callsFake((x1, y1, x2, y2) => {
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    });
    
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.dist = global.dist;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Radius-based Trigger', function() {
    it('should trigger when entity enters radius', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const trigger = new SpatialTrigger({
        eventId: 'radius_event',
        condition: {
          x: 500,
          y: 500,
          radius: 100
        }
      });

      // Entity far away
      let triggered = trigger.checkCondition({ x: 700, y: 700 });
      expect(triggered).to.be.false;

      // Entity within radius
      triggered = trigger.checkCondition({ x: 550, y: 550 });
      expect(triggered).to.be.true;
    });

    it('should trigger when specific entity type enters', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const trigger = new SpatialTrigger({
        eventId: 'queen_trigger',
        condition: {
          x: 300,
          y: 300,
          radius: 50,
          entityType: 'Queen'
        }
      });

      // Wrong entity type
      let triggered = trigger.checkCondition({ x: 310, y: 310, type: 'Ant' });
      expect(triggered).to.be.false;

      // Correct entity type
      triggered = trigger.checkCondition({ x: 310, y: 310, type: 'Queen' });
      expect(triggered).to.be.true;
    });
  });

  describe('Region-based Trigger', function() {
    it('should trigger when entity enters rectangular region', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const trigger = new SpatialTrigger({
        eventId: 'region_event',
        condition: {
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150
        }
      });

      // Outside region
      let triggered = trigger.checkCondition({ x: 50, y: 50 });
      expect(triggered).to.be.false;

      // Inside region
      triggered = trigger.checkCondition({ x: 200, y: 150 });
      expect(triggered).to.be.true;
    });
  });

  describe('Entry/Exit Tracking', function() {
    it('should track when entity enters trigger zone', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const onEnter = sandbox.stub();
      const trigger = new SpatialTrigger({
        eventId: 'enter_track',
        condition: { x: 0, y: 0, radius: 100 },
        onEnter: onEnter
      });

      trigger.checkCondition({ x: 50, y: 50, id: 'entity_1' });

      expect(onEnter.calledOnce).to.be.true;
      expect(trigger.entitiesInside).to.include('entity_1');
    });

    it('should track when entity exits trigger zone', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const onExit = sandbox.stub();
      const trigger = new SpatialTrigger({
        eventId: 'exit_track',
        condition: { x: 0, y: 0, radius: 100 },
        onExit: onExit
      });

      // Enter
      trigger.checkCondition({ x: 50, y: 50, id: 'entity_1' });
      
      // Exit
      trigger.checkCondition({ x: 200, y: 200, id: 'entity_1' });

      expect(onExit.calledOnce).to.be.true;
      expect(trigger.entitiesInside).to.not.include('entity_1');
    });
  });

  describe('Level Editor Flag Integration', function() {
    it('should support invisible flag positioning', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const trigger = new SpatialTrigger({
        eventId: 'editor_flag',
        condition: {
          x: 250,
          y: 350,
          radius: 64,
          flagId: 'tutorial_flag_01'
        },
        editorVisible: true // Visible in level editor
      });

      expect(trigger.condition.flagId).to.equal('tutorial_flag_01');
      expect(trigger.editorVisible).to.be.true;
    });

    it('should serialize for level editor export', function() {
      if (typeof SpatialTrigger === 'undefined') return this.skip();
      
      const trigger = new SpatialTrigger({
        eventId: 'export_test',
        condition: {
          x: 100,
          y: 200,
          radius: 50
        }
      });

      const serialized = trigger.toJSON();

      expect(serialized).to.deep.include({
        eventId: 'export_test',
        type: 'spatial',
        condition: {
          x: 100,
          y: 200,
          radius: 50
        }
      });
    });
  });
});

describe('FlagTrigger', function() {
  let sandbox;
  let mockEventManager;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock EventManager for flag checking
    mockEventManager = {
      getFlag: sandbox.stub(),
      hasFlag: sandbox.stub()
    };
    
    global.eventManager = mockEventManager;
    if (typeof window !== 'undefined') {
      window.eventManager = mockEventManager;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Simple Flag Trigger', function() {
    it('should trigger when flag is set to expected value', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'flag_event',
        condition: {
          flag: 'boss_defeated',
          value: true
        }
      });

      mockEventManager.getFlag.withArgs('boss_defeated').returns(false);
      expect(trigger.checkCondition()).to.be.false;

      mockEventManager.getFlag.withArgs('boss_defeated').returns(true);
      expect(trigger.checkCondition()).to.be.true;
    });

    it('should trigger when flag exists', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'flag_exists',
        condition: {
          flag: 'any_flag',
          exists: true
        }
      });

      mockEventManager.hasFlag.withArgs('any_flag').returns(false);
      expect(trigger.checkCondition()).to.be.false;

      mockEventManager.hasFlag.withArgs('any_flag').returns(true);
      expect(trigger.checkCondition()).to.be.true;
    });
  });

  describe('Comparison Operators', function() {
    beforeEach(function() {
      mockEventManager.getFlag.withArgs('score').returns(50);
    });

    it('should support greater than comparison', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'score_high',
        condition: {
          flag: 'score',
          operator: '>',
          value: 40
        }
      });

      expect(trigger.checkCondition()).to.be.true;
    });

    it('should support greater than or equal comparison', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'score_gte',
        condition: {
          flag: 'score',
          operator: '>=',
          value: 50
        }
      });

      expect(trigger.checkCondition()).to.be.true;
    });

    it('should support less than comparison', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'score_low',
        condition: {
          flag: 'score',
          operator: '<',
          value: 60
        }
      });

      expect(trigger.checkCondition()).to.be.true;
    });

    it('should support not equal comparison', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'score_neq',
        condition: {
          flag: 'score',
          operator: '!=',
          value: 100
        }
      });

      expect(trigger.checkCondition()).to.be.true;
    });
  });

  describe('Multiple Flag Conditions (AND logic)', function() {
    it('should require all flags to match', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      mockEventManager.getFlag.withArgs('has_key').returns(true);
      mockEventManager.getFlag.withArgs('door_unlocked').returns(false);
      mockEventManager.getFlag.withArgs('boss_defeated').returns(true);

      const trigger = new FlagTrigger({
        eventId: 'multi_flag',
        condition: {
          flags: [
            { flag: 'has_key', value: true },
            { flag: 'door_unlocked', value: true },
            { flag: 'boss_defeated', value: true }
          ]
        }
      });

      // Not all conditions met
      expect(trigger.checkCondition()).to.be.false;

      mockEventManager.getFlag.withArgs('door_unlocked').returns(true);
      
      // All conditions met
      expect(trigger.checkCondition()).to.be.true;
    });
  });

  describe('Flag Change Detection', function() {
    it('should trigger only when flag changes to target value', function() {
      if (typeof FlagTrigger === 'undefined') return this.skip();
      
      const trigger = new FlagTrigger({
        eventId: 'change_detect',
        condition: {
          flag: 'quest_status',
          value: 'completed',
          triggerOnChange: true
        }
      });

      mockEventManager.getFlag.withArgs('quest_status').returns('active');
      trigger.checkCondition(); // Initialize previous value
      
      // Same value - no trigger
      expect(trigger.checkCondition()).to.be.false;

      mockEventManager.getFlag.withArgs('quest_status').returns('completed');
      
      // Value changed to target - trigger!
      expect(trigger.checkCondition()).to.be.true;
    });
  });
});

describe('ConditionalTrigger', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Custom Function Condition', function() {
    it('should trigger when custom function returns true', function() {
      if (typeof ConditionalTrigger === 'undefined') return this.skip();
      
      let conditionMet = false;
      
      const trigger = new ConditionalTrigger({
        eventId: 'custom_condition',
        condition: () => conditionMet
      });

      expect(trigger.checkCondition()).to.be.false;
      
      conditionMet = true;
      expect(trigger.checkCondition()).to.be.true;
    });

    it('should pass context to condition function', function() {
      if (typeof ConditionalTrigger === 'undefined') return this.skip();
      
      const conditionFn = sandbox.stub().returns(true);
      
      const trigger = new ConditionalTrigger({
        eventId: 'context_test',
        condition: conditionFn
      });

      const context = { wave: 5, difficulty: 'hard' };
      trigger.checkCondition(context);

      expect(conditionFn.calledOnce).to.be.true;
      expect(conditionFn.firstCall.args[0]).to.deep.equal(context);
    });
  });

  describe('Complex Condition Combinations', function() {
    it('should support AND/OR logic combinations', function() {
      if (typeof ConditionalTrigger === 'undefined') return this.skip();
      
      global.eventManager = {
        getFlag: sandbox.stub()
      };
      
      global.eventManager.getFlag.withArgs('wave_complete').returns(true);
      global.eventManager.getFlag.withArgs('enemies_defeated').returns(10);

      const trigger = new ConditionalTrigger({
        eventId: 'complex_condition',
        condition: (context) => {
          const waveComplete = global.eventManager.getFlag('wave_complete');
          const enemyCount = global.eventManager.getFlag('enemies_defeated');
          return waveComplete && enemyCount >= 10;
        }
      });

      expect(trigger.checkCondition()).to.be.true;
    });
  });
});

describe('ViewportSpawnTrigger', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock gridTerrain getViewSpan
    global.g_map2 = {
      renderConversion: {
        getViewSpan: sandbox.stub().returns([
          [0, 1080],   // [minX, maxY]
          [1920, 0]    // [maxX, minY]
        ])
      }
    };
    
    if (typeof window !== 'undefined') {
      window.g_map2 = global.g_map2;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Viewport Edge Detection', function() {
    it('should get current viewport bounds', function() {
      if (typeof ViewportSpawnTrigger === 'undefined') return this.skip();
      
      const trigger = new ViewportSpawnTrigger({
        eventId: 'viewport_spawn',
        condition: { edgeSpawn: true }
      });

      const viewport = trigger.getViewportBounds();

      expect(viewport).to.deep.equal({
        minX: 0,
        maxX: 1920,
        minY: 0,
        maxY: 1080
      });
    });

    it('should generate spawn positions at viewport edges', function() {
      if (typeof ViewportSpawnTrigger === 'undefined') return this.skip();
      
      const trigger = new ViewportSpawnTrigger({
        eventId: 'edge_spawn_test',
        condition: {
          edgeSpawn: true,
          count: 4
        }
      });

      const positions = trigger.generateEdgePositions(4);

      expect(positions).to.be.an('array');
      expect(positions).to.have.lengthOf(4);
      
      // All positions should be at viewport edges
      positions.forEach(pos => {
        const atLeftEdge = pos.x === 0;
        const atRightEdge = pos.x === 1920;
        const atTopEdge = pos.y === 0;
        const atBottomEdge = pos.y === 1080;
        
        const isAtEdge = atLeftEdge || atRightEdge || atTopEdge || atBottomEdge;
        expect(isAtEdge).to.be.true;
      });
    });

    it('should distribute spawns across different edges', function() {
      if (typeof ViewportSpawnTrigger === 'undefined') return this.skip();
      
      const trigger = new ViewportSpawnTrigger({
        eventId: 'distributed_spawn',
        condition: {
          edgeSpawn: true,
          count: 8,
          distributeEvenly: true
        }
      });

      const positions = trigger.generateEdgePositions(8);
      
      // Should have spawns on multiple edges
      const leftEdge = positions.filter(p => p.x === 0).length;
      const rightEdge = positions.filter(p => p.x === 1920).length;
      const topEdge = positions.filter(p => p.y === 0).length;
      const bottomEdge = positions.filter(p => p.y === 1080).length;

      // Verify distribution (with some tolerance)
      const totalEdges = (leftEdge > 0 ? 1 : 0) + (rightEdge > 0 ? 1 : 0) + 
                        (topEdge > 0 ? 1 : 0) + (bottomEdge > 0 ? 1 : 0);
      
      expect(totalEdges).to.be.at.least(2); // At least 2 edges used
    });
  });

  describe('Integration with SpawnEvent', function() {
    it('should provide spawn positions to SpawnEvent', function() {
      if (typeof ViewportSpawnTrigger === 'undefined') return this.skip();
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const trigger = new ViewportSpawnTrigger({
        eventId: 'spawn_integration',
        condition: {
          edgeSpawn: true,
          count: 5
        }
      });

      const positions = trigger.generateEdgePositions(5);
      
      // These positions should be usable by SpawnEvent
      expect(positions).to.be.an('array');
      positions.forEach(pos => {
        expect(pos).to.have.property('x');
        expect(pos).to.have.property('y');
      });
    });
  });
});
