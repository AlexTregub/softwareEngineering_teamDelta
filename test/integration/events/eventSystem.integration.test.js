/**
 * Integration Tests for Complete GameEvent System
 * 
 * Tests the full GameEvent lifecycle:
 * 1. GameEvent registration with EventManager
 * 2. Trigger evaluation (TimeTrigger, SpatialTrigger, FlagTrigger)
 * 3. GameEvent execution (DialogueEvent, SpawnEvent, TutorialEvent)
 * 4. Flag updates and state changes
 * 5. EventDebugManager visualization
 * 
 * Integrates with:
 * - MapManager (level detection, viewport)
 * - Entity system (spatial triggers)
 * - EventManager (coordination)
 * - EventDebugManager (debugging)
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Import GameEvent system components
const EventManager = require('../../../Classes/managers/EventManager');
const {
  EventTrigger,
  TimeTrigger,
  SpatialTrigger,
  FlagTrigger,
  ConditionalTrigger,
  ViewportSpawnTrigger
} = require('../../../Classes/events/EventTrigger');
const {
  GameEvent,
  DialogueEvent,
  SpawnEvent,
  TutorialEvent,
  BossEvent
} = require('../../../Classes/events/Event');

// Make available globally for JSDOM
global.EventManager = EventManager;
global.EventTrigger = EventTrigger;
global.TimeTrigger = TimeTrigger;
global.SpatialTrigger = SpatialTrigger;
global.FlagTrigger = FlagTrigger;
global.ConditionalTrigger = ConditionalTrigger;
global.ViewportSpawnTrigger = ViewportSpawnTrigger;
global.GameEvent = GameEvent;
global.DialogueEvent = DialogueEvent;
global.SpawnEvent = SpawnEvent;
global.TutorialEvent = TutorialEvent;
global.BossEvent = BossEvent;

describe('GameEvent System Integration Tests', function() {
  let sandbox;
  let eventManager;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.millis = sandbox.stub().returns(1000);
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    
    // Get EventManager instance (singleton)
    eventManager = EventManager.getInstance();
    eventManager.reset(); // Clear previous state
    
    // Make available globally
    global.eventManager = eventManager;
    
    // Sync window for JSDOM compatibility
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
      window.createVector = global.createVector;
      window.eventManager = global.eventManager;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Complete GameEvent Lifecycle', function() {
    it('should register GameEvent, evaluate trigger, execute, and update flags', function() {
      // 1. Register GameEvent with time trigger
      const eventConfig = {
        id: 'tutorial_start',
        type: 'dialogue',
        content: {
          title: 'Welcome',
          message: 'Welcome to the colony!'
        },
        priority: 1
      };
      
      const triggerConfig = {
        eventId: 'tutorial_start',
        type: 'time',
        oneTime: true,
        condition: {
          delay: 5000 // Trigger after 5 seconds
        }
      };
      
      eventManager.registerEvent(eventConfig);
      eventManager.registerTrigger(triggerConfig);
      
      // 2. Verify GameEvent registered
      const registeredEvent = eventManager.getEvent('tutorial_start');
      expect(registeredEvent).to.exist;
      expect(registeredEvent.id).to.equal('tutorial_start');
      
      // 3. Update before trigger time
      global.millis.returns(5999);
      eventManager.update();
      
      const activeEvents = eventManager.getActiveEvents();
      expect(activeEvents).to.have.lengthOf(0);
      
      // 4. Update after trigger time - GameEvent should activate
      global.millis.returns(6000);
      eventManager.update();
      
      const activeEventsAfterTrigger = eventManager.getActiveEvents();
      expect(activeEventsAfterTrigger.length).to.be.at.least(1);
      
      // 5. Set flag to simulate GameEvent completion
      eventManager.setFlag('tutorial_started', true);
      
      expect(eventManager.getFlag('tutorial_started')).to.be.true;
    });

    it('should handle multiple events with different priorities', function() {
      // Register high priority GameEvent
      eventManager.registerEvent({
        id: 'critical_alert',
        type: 'dialogue',
        content: { message: 'Critical!' },
        priority: 1
      });
      
      // Register low priority GameEvent
      eventManager.registerEvent({
        id: 'background_info',
        type: 'dialogue',
        content: { message: 'Info' },
        priority: 10
      });
      
      // Trigger both
      eventManager.triggerEvent('critical_alert');
      eventManager.triggerEvent('background_info');
      
      // Verify priority ordering
      const sorted = eventManager.getActiveEventsSorted();
      expect(sorted).to.have.lengthOf(2);
      expect(sorted[0].id).to.equal('critical_alert');
      expect(sorted[1].id).to.equal('background_info');
    });
  });

  describe('Trigger Type Integration', function() {
    describe('TimeTrigger Integration', function() {
      it('should trigger GameEvent after specified delay', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'delayed_event',
          type: 'dialogue',
          content: {},
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'delayed_event',
          type: 'time',
          oneTime: true,
          condition: { delay: 3000 }
        });
        
        // Before delay
        global.millis.returns(3999);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // After delay
        global.millis.returns(4000);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });

      it('should trigger GameEvent at intervals (repeatable)', function() {
        let triggerCount = 0;
        
        eventManager.registerEvent({
          id: 'interval_event',
          type: 'spawn',
          content: {},
          onTrigger: () => { triggerCount++; }
        });
        
        eventManager.registerTrigger({
          eventId: 'interval_event',
          type: 'time',
          oneTime: false,
          condition: { interval: 1000 }
        });
        
        // First trigger
        global.millis.returns(2000);
        eventManager.update();
        expect(triggerCount).to.equal(1);
        
        // Second trigger
        global.millis.returns(3000);
        eventManager.update();
        expect(triggerCount).to.equal(2);
        
        // Third trigger
        global.millis.returns(4000);
        eventManager.update();
        expect(triggerCount).to.equal(3);
      });
    });

    describe('SpatialTrigger Integration', function() {
      it('should trigger when entity enters trigger zone', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'zone_entered',
          type: 'dialogue',
          content: { message: 'You entered the sacred grove!' },
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'zone_entered',
          type: 'spatial',
          oneTime: true,
          condition: {
            x: 500,
            y: 500,
            radius: 100
          }
        });
        
        // Entity outside zone
        const entity = { id: 'player', x: 100, y: 100, type: 'Player' };
        ants = [entity]; // Spatial triggers check global ants array
        
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Entity enters zone
        entity.x = 520;
        entity.y = 510;
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });

      it('should filter by entity type', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'queen_zone',
          type: 'dialogue',
          content: { message: 'Queen detected!' },
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'queen_zone',
          type: 'spatial',
          oneTime: true,
          condition: {
            x: 0,
            y: 0,
            radius: 200,
            entityType: 'Queen'
          }
        });
        
        // Regular ant enters (should not trigger)
        const ant = { id: 'ant1', x: 50, y: 50, type: 'Ant' };
        ants = [ant];
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Queen enters (should trigger)
        const queen = { id: 'queen1', x: 50, y: 50, type: 'Queen' };
        ants = [queen];
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('FlagTrigger Integration', function() {
      it('should trigger when flag condition is met', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'flag_event',
          type: 'dialogue',
          content: { message: 'Objective complete!' },
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'flag_event',
          type: 'flag',
          oneTime: true,
          condition: {
            flag: 'resources_collected',
            operator: '>=',
            value: 100
          }
        });
        
        // Before condition met
        eventManager.setFlag('resources_collected', 50);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // After condition met
        eventManager.setFlag('resources_collected', 100);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });

      it('should support multiple flag conditions (AND logic)', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'multi_flag',
          type: 'dialogue',
          content: {},
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'multi_flag',
          type: 'flag',
          oneTime: true,
          condition: {
            flags: [
              { flag: 'objective_1', value: true },
              { flag: 'objective_2', value: true }
            ]
          }
        });
        
        // Only one objective complete
        eventManager.setFlag('objective_1', true);
        eventManager.setFlag('objective_2', false);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Both objectives complete
        eventManager.setFlag('objective_2', true);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('ConditionalTrigger Integration', function() {
      it('should trigger with custom condition function', function() {
        const onTrigger = sandbox.stub();
        
        eventManager.registerEvent({
          id: 'custom_condition',
          type: 'spawn',
          content: {},
          onTrigger: onTrigger
        });
        
        eventManager.registerTrigger({
          eventId: 'custom_condition',
          type: 'conditional',
          oneTime: true,
          condition: (context) => {
            const enemiesDefeated = eventManager.getFlag('enemies_defeated') || 0;
            const waveComplete = eventManager.getFlag('wave_complete') || false;
            return waveComplete && enemiesDefeated >= 10;
          }
        });
        
        // Conditions not met
        eventManager.setFlag('enemies_defeated', 5);
        eventManager.setFlag('wave_complete', false);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // Partial conditions met
        eventManager.setFlag('enemies_defeated', 15);
        eventManager.update();
        expect(onTrigger.called).to.be.false;
        
        // All conditions met
        eventManager.setFlag('wave_complete', true);
        eventManager.update();
        expect(onTrigger.called).to.be.true;
      });
    });

    describe('ViewportSpawnTrigger Integration', function() {
      it('should generate spawn positions at viewport edges', function() {
        // Mock g_map2
        global.g_map2 = {
          renderConversion: {
            getViewSpan: sandbox.stub().returns([
              [0, 1080],   // [minX, maxY]
              [1920, 0]    // [maxX, minY]
            ])
          }
        };
        
        const trigger = new ViewportSpawnTrigger({
          eventId: 'edge_spawn',
          condition: {
            edgeSpawn: true,
            count: 4,
            distributeEvenly: true
          }
        });
        
        const positions = trigger.generateEdgePositions(4);
        
        expect(positions).to.have.lengthOf(4);
        positions.forEach(pos => {
          expect(pos).to.have.property('x');
          expect(pos).to.have.property('y');
          expect(pos).to.have.property('edge');
          
          // Verify at edge
          const atEdge = pos.x === 0 || pos.x === 1920 || pos.y === 0 || pos.y === 1080;
          expect(atEdge).to.be.true;
        });
      });
    });
  });

  describe('GameEvent Type Integration', function() {
    describe('DialogueEvent Integration', function() {
      it('should display dialogue with auto-completion', function() {
        const dialogue = new DialogueEvent({
          id: 'welcome_message',
          content: {
            title: 'Tutorial',
            message: 'Click to continue',
            buttons: ['OK']
          },
          autoCompleteOnResponse: true
        });
        
        eventManager.registerEvent(dialogue);
        eventManager.triggerEvent('welcome_message');
        
        expect(dialogue.active).to.be.true;
        
        // Simulate button response
        dialogue.handleResponse('OK');
        
        expect(dialogue.completed).to.be.true;
        expect(dialogue.getResponse()).to.equal('OK');
      });
    });

    describe('SpawnEvent Integration', function() {
      it('should spawn enemies at viewport edges', function() {
        const spawnedEnemies = [];
        
        // Mock g_map2
        global.g_map2 = {
          renderConversion: {
            getViewSpan: () => [[0, 1080], [1920, 0]]
          }
        };
        
        const spawnEvent = new SpawnEvent({
          id: 'wave_1',
          content: {
            spawnLocations: 'viewport_edge',
            count: 4,
            enemyType: 'enemy_ant',
            wave: 1
          },
          onSpawn: (data) => {
            spawnedEnemies.push(data);
          }
        });
        
        eventManager.registerEvent(spawnEvent);
        eventManager.triggerEvent('wave_1');
        
        // Should auto-spawn on trigger
        expect(spawnedEnemies).to.have.length.greaterThan(0);
      });

      it('should use custom spawn points', function() {
        const spawnedEnemies = [];
        
        const spawnEvent = new SpawnEvent({
          id: 'custom_spawn',
          content: {
            spawnPoints: [
              { x: 100, y: 200 },
              { x: 300, y: 400 }
            ],
            enemies: ['enemy_ant']
          },
          spawnCallback: (data) => {
            spawnedEnemies.push(data);
          }
        });
        
        eventManager.registerEvent(spawnEvent);
        eventManager.triggerEvent('custom_spawn');
        
        expect(spawnedEnemies).to.have.lengthOf(2);
        expect(spawnedEnemies[0].x).to.equal(100);
        expect(spawnedEnemies[0].y).to.equal(200);
      });
    });

    describe('TutorialEvent Integration', function() {
      it('should navigate through tutorial steps', function() {
        const tutorial = new TutorialEvent({
          id: 'basic_tutorial',
          content: {
            steps: [
              { title: 'Step 1', text: 'Select your ants' },
              { title: 'Step 2', text: 'Right-click to gather' },
              { title: 'Step 3', text: 'Build a food storage' }
            ]
          }
        });
        
        eventManager.registerEvent(tutorial);
        eventManager.triggerEvent('basic_tutorial');
        
        expect(tutorial.currentStep).to.equal(0);
        
        tutorial.nextStep();
        expect(tutorial.currentStep).to.equal(1);
        
        tutorial.nextStep();
        expect(tutorial.currentStep).to.equal(2);
        
        // At last step, nextStep should complete
        tutorial.nextStep();
        expect(tutorial.completed).to.be.true;
      });
    });

    describe('BossEvent Integration', function() {
      it('should transition boss phases based on health', function() {
        const boss = new BossEvent({
          id: 'beetle_boss',
          content: {
            bossType: 'giant_beetle',
            phases: [
              { healthThreshold: 1.0, behavior: 'normal' },
              { healthThreshold: 0.5, behavior: 'enraged' },
              { healthThreshold: 0.25, behavior: 'desperate' }
            ]
          }
        });
        
        eventManager.registerEvent(boss);
        eventManager.triggerEvent('beetle_boss');
        
        // Full health - phase 1
        expect(boss.getCurrentPhase(1.0)).to.equal(1);
        
        // Half health - phase 2
        expect(boss.getCurrentPhase(0.6)).to.equal(2);
        
        // Low health - phase 3
        expect(boss.getCurrentPhase(0.3)).to.equal(3);
      });

      it('should complete on victory condition', function() {
        let bossDefeated = false;
        
        const boss = new BossEvent({
          id: 'victory_test',
          content: {
            bossType: 'test_boss',
            victoryCondition: () => bossDefeated
          }
        });
        
        eventManager.registerEvent(boss);
        eventManager.triggerEvent('victory_test');
        
        // Not defeated yet
        boss.update();
        expect(boss.completed).to.be.false;
        
        // Boss defeated
        bossDefeated = true;
        boss.update();
        expect(boss.completed).to.be.true;
      });
    });
  });

  describe('JSON Configuration Loading', function() {
    it('should load complete GameEvent configuration from JSON', function() {
      const eventJSON = {
        events: [
          {
            id: 'json_dialogue',
            type: 'dialogue',
            content: {
              title: 'From JSON',
              message: 'This GameEvent was loaded from JSON!'
            },
            priority: 5
          }
        ],
        triggers: [
          {
            eventId: 'json_dialogue',
            type: 'time',
            oneTime: true,
            condition: { delay: 2000 }
          }
        ],
        flags: {
          json_loaded: true,
          test_value: 42
        }
      };
      
      eventManager.loadFromJSON(eventJSON);
      
      // Verify GameEvent loaded
      const GameEvent = eventManager.getEvent('json_dialogue');
      expect(GameEvent).to.exist;
      expect(GameEvent.content.title).to.equal('From JSON');
      
      // Verify trigger loaded
      const triggers = eventManager.getTriggersForEvent('json_dialogue');
      expect(triggers).to.have.lengthOf(1);
      expect(triggers[0].type).to.equal('time');
      
      // Verify flags loaded
      expect(eventManager.getFlag('json_loaded')).to.be.true;
      expect(eventManager.getFlag('test_value')).to.equal(42);
    });

    it('should handle complex multi-GameEvent scenario from JSON', function() {
      const scenarioJSON = {
        events: [
          {
            id: 'wave_warning',
            type: 'dialogue',
            content: { message: 'Enemy wave incoming!' },
            priority: 1
          },
          {
            id: 'wave_spawn',
            type: 'spawn',
            content: {
              spawnLocations: 'viewport_edge',
              count: 5,
              enemyType: 'enemy_ant'
            },
            priority: 2
          },
          {
            id: 'wave_complete',
            type: 'dialogue',
            content: { message: 'Wave defeated!' },
            priority: 3
          }
        ],
        triggers: [
          {
            eventId: 'wave_warning',
            type: 'time',
            oneTime: true,
            condition: { delay: 1000 }
          },
          {
            eventId: 'wave_spawn',
            type: 'flag',
            oneTime: true,
            condition: {
              flag: 'warning_acknowledged',
              value: true
            }
          },
          {
            eventId: 'wave_complete',
            type: 'flag',
            oneTime: true,
            condition: {
              flag: 'enemies_remaining',
              operator: '<=',
              value: 0
            }
          }
        ]
      };
      
      eventManager.loadFromJSON(scenarioJSON);
      
      // Verify all events loaded
      expect(eventManager.getEvent('wave_warning')).to.exist;
      expect(eventManager.getEvent('wave_spawn')).to.exist;
      expect(eventManager.getEvent('wave_complete')).to.exist;
      
      // Verify triggers loaded
      expect(eventManager.getTriggersForEvent('wave_warning')).to.have.lengthOf(1);
      expect(eventManager.getTriggersForEvent('wave_spawn')).to.have.lengthOf(1);
      expect(eventManager.getTriggersForEvent('wave_complete')).to.have.lengthOf(1);
    });
  });

  describe('Flag System Integration', function() {
    it('should track GameEvent completion with flags', function() {
      const GameEvent = new GameEvent({
        id: 'flag_setter',
        type: 'dialogue',
        content: {},
        onComplete: () => {
          eventManager.setFlag('event_completed', true);
          eventManager.setFlag('completion_time', global.millis());
        }
      });
      
      eventManager.registerEvent(GameEvent);
      eventManager.triggerEvent('flag_setter');
      
      expect(eventManager.hasFlag('event_completed')).to.be.false;
      
      GameEvent.complete();
      
      expect(eventManager.hasFlag('event_completed')).to.be.true;
      expect(eventManager.getFlag('event_completed')).to.be.true;
      expect(eventManager.getFlag('completion_time')).to.equal(1000);
    });

    it('should use flags for GameEvent chaining', function() {
      const triggerOrder = [];
      
      // GameEvent 1: Triggered by time, sets flag on completion
      eventManager.registerEvent({
        id: 'event_1',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerOrder.push(1),
        onComplete: () => eventManager.setFlag('event_1_done', true)
      });
      
      // GameEvent 2: Triggered by event_1 completion flag
      eventManager.registerEvent({
        id: 'event_2',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerOrder.push(2)
      });
      
      eventManager.registerTrigger({
        eventId: 'event_1',
        type: 'time',
        oneTime: true,
        condition: { delay: 0 }
      });
      
      eventManager.registerTrigger({
        eventId: 'event_2',
        type: 'flag',
        oneTime: true,
        condition: {
          flag: 'event_1_done',
          value: true
        }
      });
      
      // Trigger GameEvent 1
      eventManager.update();
      expect(triggerOrder).to.deep.equal([1]);
      
      // Complete GameEvent 1 (sets flag)
      eventManager.getEvent('event_1').complete();
      
      // GameEvent 2 should now trigger
      eventManager.update();
      expect(triggerOrder).to.deep.equal([1, 2]);
    });
  });

  describe('GameEvent State Management', function() {
    it('should track active, completed, and queued events', function() {
      // Register multiple events
      eventManager.registerEvent({ id: 'event_1', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'event_2', type: 'dialogue', content: {} });
      eventManager.registerEvent({ id: 'event_3', type: 'dialogue', content: {} });
      
      // Trigger GameEvent 1 and 2
      eventManager.triggerEvent('event_1');
      eventManager.triggerEvent('event_2');
      
      const active = eventManager.getActiveEvents();
      expect(active).to.have.lengthOf(2);
      
      // Complete GameEvent 1
      eventManager.getEvent('event_1').complete();
      
      const activeAfterComplete = eventManager.getActiveEvents();
      expect(activeAfterComplete).to.have.lengthOf(1);
      expect(activeAfterComplete[0].id).to.equal('event_2');
    });

    it('should auto-complete events based on duration', function() {
      const GameEvent = new GameEvent({
        id: 'timed_event',
        type: 'dialogue',
        content: {},
        autoCompleteAfter: 3000
      });
      
      eventManager.registerEvent(GameEvent);
      eventManager.triggerEvent('timed_event');
      
      expect(GameEvent.completed).to.be.false;
      
      // Update before duration
      global.millis.returns(3999);
      GameEvent.update();
      expect(GameEvent.completed).to.be.false;
      
      // Update after duration
      global.millis.returns(4000);
      GameEvent.update();
      expect(GameEvent.completed).to.be.true;
    });
  });

  describe('Error Handling and Edge Cases', function() {
    it('should handle triggering non-existent GameEvent gracefully', function() {
      expect(() => {
        eventManager.triggerEvent('does_not_exist');
      }).to.not.throw();
    });

    it('should handle invalid JSON gracefully', function() {
      const invalidJSON = {
        events: [
          { id: 'missing_type', content: {} } // Missing type
        ]
      };
      
      expect(() => {
        eventManager.loadFromJSON(invalidJSON);
      }).to.not.throw();
    });

    it('should prevent duplicate GameEvent registration', function() {
      eventManager.registerEvent({ id: 'duplicate', type: 'dialogue', content: {} });
      
      expect(() => {
        eventManager.registerEvent({ id: 'duplicate', type: 'dialogue', content: {} });
      }).to.not.throw();
      
      // Should have only one instance
      const events = eventManager._events;
      const duplicates = events.filter(e => e.id === 'duplicate');
      expect(duplicates).to.have.lengthOf(1);
    });

    it('should handle oneTime triggers correctly', function() {
      let triggerCount = 0;
      
      eventManager.registerEvent({
        id: 'one_time',
        type: 'dialogue',
        content: {},
        onTrigger: () => triggerCount++
      });
      
      const trigger = new TimeTrigger({
        eventId: 'one_time',
        oneTime: true,
        condition: { delay: 0 }
      });
      
      trigger.initialize();
      eventManager._triggers.push(trigger);
      
      // First update - should trigger
      eventManager.update();
      expect(triggerCount).to.equal(1);
      
      // Second update - should not trigger again (oneTime)
      eventManager.update();
      expect(triggerCount).to.equal(1);
    });
  });
});

