/**
 * Consolidated Events System Tests
 * Generated: 2025-10-29T03:11:41.165Z
 * Source files: 4
 * Total tests: 138
 * 
 * This file contains all events system tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');


// ================================================================
// event.test.js (39 tests)
// ================================================================
/**
 * Unit Tests for Event Classes
 * Tests GameEvent base class and specific event types (DialogueEvent, SpawnEvent, TutorialEvent, BossEvent)
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

let {
  GameEvent,
  DialogueEvent,
  SpawnEvent,
  TutorialEvent,
  BossEvent
} = require('../../../Classes/events/Event');

// Import triggers for SpawnEvent integration
let {
  ViewportSpawnTrigger
} = require('../../../Classes/events/EventTrigger');

// Make globally available for tests
global.GameEvent = GameEvent;
global.DialogueEvent = DialogueEvent;
global.SpawnEvent = SpawnEvent;
global.TutorialEvent = TutorialEvent;
global.BossEvent = BossEvent;
global.ViewportSpawnTrigger = ViewportSpawnTrigger;

describe('GameEvent Base Class', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.millis = sandbox.stub().returns(1000);
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create event with required properties', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'test_event',
        type: 'dialogue',
        content: { message: 'Test' }
      });

      expect(event.id).to.equal('test_event');
      expect(event.type).to.equal('dialogue');
      expect(event.content).to.deep.equal({ message: 'Test' });
    });

    it('should initialize with default values', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'defaults',
        type: 'dialogue',
        content: {}
      });

      expect(event.active).to.be.false;
      expect(event.completed).to.be.false;
      expect(event.priority).to.equal(999); // Default low priority
    });

    it('should accept optional priority', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'priority_test',
        type: 'tutorial',
        content: {},
        priority: 5
      });

      expect(event.priority).to.equal(5);
    });

    it('should store metadata if provided', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'metadata_test',
        type: 'spawn',
        content: {},
        metadata: { difficulty: 'hard', wave: 3 }
      });

      expect(event.metadata).to.exist;
      expect(event.metadata.difficulty).to.equal('hard');
      expect(event.metadata.wave).to.equal(3);
    });
  });

  describe('Lifecycle Methods', function() {
    let event;

    beforeEach(function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      event = new GameEvent({
        id: 'lifecycle_test',
        type: 'dialogue',
        content: {}
      });
    });

    it('should trigger event and set active state', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      event.trigger();

      expect(event.active).to.be.true;
      expect(event.triggeredAt).to.exist;
    });

    it('should complete event and set completed state', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      event.trigger();
      event.complete();

      expect(event.active).to.be.false;
      expect(event.completed).to.be.true;
      expect(event.completedAt).to.exist;
    });

    it('should not complete event that is not active', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const result = event.complete();

      expect(result).to.be.false;
      expect(event.completed).to.be.false;
    });

    it('should pause active event', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      event.trigger();
      event.pause();

      expect(event.paused).to.be.true;
      expect(event.active).to.be.true; // Still active, just paused
    });

    it('should resume paused event', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      event.trigger();
      event.pause();
      event.resume();

      expect(event.paused).to.be.false;
      expect(event.active).to.be.true;
    });
  });

  describe('Callback Execution', function() {
    it('should execute onTrigger callback when triggered', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const onTrigger = sandbox.stub();
      const event = new GameEvent({
        id: 'callback_test',
        type: 'dialogue',
        content: {},
        onTrigger: onTrigger
      });

      event.trigger({ customData: 'test' });

      expect(onTrigger.calledOnce).to.be.true;
      expect(onTrigger.firstCall.args[0]).to.deep.equal({ customData: 'test' });
    });

    it('should execute onComplete callback when completed', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const onComplete = sandbox.stub();
      const event = new GameEvent({
        id: 'complete_callback',
        type: 'dialogue',
        content: {},
        onComplete: onComplete
      });

      event.trigger();
      event.complete();

      expect(onComplete.calledOnce).to.be.true;
    });

    it('should execute onUpdate callback during update', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const onUpdate = sandbox.stub();
      const event = new GameEvent({
        id: 'update_callback',
        type: 'dialogue',
        content: {},
        onUpdate: onUpdate
      });

      event.trigger();
      event.update();

      expect(onUpdate.calledOnce).to.be.true;
    });

    it('should not execute callbacks when event is paused', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const onUpdate = sandbox.stub();
      const event = new GameEvent({
        id: 'paused_callback',
        type: 'dialogue',
        content: {},
        onUpdate: onUpdate
      });

      event.trigger();
      event.pause();
      event.update();

      expect(onUpdate.called).to.be.false;
    });
  });

  describe('Event Duration', function() {
    it('should track elapsed time since trigger', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      global.millis.returns(1000);
      const event = new GameEvent({
        id: 'duration_test',
        type: 'dialogue',
        content: {}
      });

      event.trigger();
      
      global.millis.returns(3500);
      const elapsed = event.getElapsedTime();

      expect(elapsed).to.equal(2500);
    });

    it('should return 0 elapsed time for non-triggered event', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'not_triggered',
        type: 'dialogue',
        content: {}
      });

      const elapsed = event.getElapsedTime();

      expect(elapsed).to.equal(0);
    });
  });

  describe('Auto-Completion Strategies', function() {
    it('should auto-complete after specified duration', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      global.millis.returns(1000);
      const event = new GameEvent({
        id: 'timed_event',
        type: 'dialogue',
        content: {},
        autoCompleteAfter: 3000
      });

      event.trigger();
      
      // Before duration
      global.millis.returns(3999);
      event.update();
      expect(event.completed).to.be.false;
      
      // After duration
      global.millis.returns(4000);
      event.update();
      expect(event.completed).to.be.true;
    });

    it('should auto-complete when condition is met', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      // Mock EventManager for flag checking
      global.eventManager = {
        getFlag: sandbox.stub()
      };
      
      const event = new GameEvent({
        id: 'conditional_complete',
        type: 'spawn',
        content: {},
        completeWhen: {
          type: 'flag',
          flag: 'enemies_remaining',
          operator: '<=',
          value: 0
        }
      });

      event.trigger();
      
      // Condition not met
      global.eventManager.getFlag.withArgs('enemies_remaining').returns(5);
      event.update();
      expect(event.completed).to.be.false;
      
      // Condition met
      global.eventManager.getFlag.withArgs('enemies_remaining').returns(0);
      event.update();
      expect(event.completed).to.be.true;
    });

    it('should not auto-complete if no completion strategy specified', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const event = new GameEvent({
        id: 'manual_complete',
        type: 'dialogue',
        content: {}
      });

      event.trigger();
      
      // Many updates should not complete
      for (let i = 0; i < 100; i++) {
        event.update();
      }
      
      expect(event.completed).to.be.false;
    });

    it('should support custom completion callback', function() {
      if (typeof GameEvent === 'undefined') return this.skip();
      
      const customCondition = sandbox.stub();
      customCondition.onCall(0).returns(false);
      customCondition.onCall(1).returns(false);
      customCondition.onCall(2).returns(true);
      
      const event = new GameEvent({
        id: 'custom_complete',
        type: 'dialogue',
        content: {},
        completeWhen: {
          type: 'custom',
          condition: customCondition
        }
      });

      event.trigger();
      
      event.update();
      expect(event.completed).to.be.false;
      
      event.update();
      expect(event.completed).to.be.false;
      
      event.update();
      expect(event.completed).to.be.true;
    });
  });
});

describe('DialogueEvent', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create dialogue event with title and message', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'dialogue_01',
        content: {
          title: 'Welcome',
          message: 'Welcome to the colony!'
        }
      });

      expect(dialogue.type).to.equal('dialogue');
      expect(dialogue.content.title).to.equal('Welcome');
      expect(dialogue.content.message).to.equal('Welcome to the colony!');
    });

    it('should support optional buttons', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'dialogue_buttons',
        content: {
          message: 'Continue?',
          buttons: ['Yes', 'No']
        }
      });

      expect(dialogue.content.buttons).to.deep.equal(['Yes', 'No']);
    });

    it('should support speaker name', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'dialogue_speaker',
        content: {
          speaker: 'Queen Ant',
          message: 'Protect the colony!'
        }
      });

      expect(dialogue.content.speaker).to.equal('Queen Ant');
    });
  });

  describe('Button Response', function() {
    it('should handle button click response', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const onResponse = sandbox.stub();
      const dialogue = new DialogueEvent({
        id: 'button_response',
        content: {
          message: 'Choose',
          buttons: ['Option A', 'Option B']
        },
        onResponse: onResponse
      });

      dialogue.trigger();
      dialogue.handleResponse('Option A');

      expect(onResponse.calledOnce).to.be.true;
      expect(onResponse.firstCall.args[0]).to.equal('Option A');
    });

    it('should auto-complete on response if configured', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'auto_complete',
        content: {
          message: 'OK?',
          buttons: ['OK']
        },
        autoCompleteOnResponse: true
      });

      dialogue.trigger();
      dialogue.handleResponse('OK');

      expect(dialogue.completed).to.be.true;
    });
  });
});

describe('SpawnEvent', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock necessary globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
    }
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create spawn event with enemy configuration', function() {
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const spawn = new SpawnEvent({
        id: 'spawn_01',
        content: {
          enemyType: 'enemy_ant',
          count: 5,
          spawnLocations: 'viewport_edge'
        }
      });

      expect(spawn.type).to.equal('spawn');
      expect(spawn.content.enemyType).to.equal('enemy_ant');
      expect(spawn.content.count).to.equal(5);
    });

    it('should support wave configuration', function() {
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const spawn = new SpawnEvent({
        id: 'wave_spawn',
        content: {
          wave: {
            number: 3,
            enemies: [
              { type: 'enemy_ant', count: 10 },
              { type: 'enemy_beetle', count: 2 }
            ]
          }
        }
      });

      expect(spawn.content.wave.number).to.equal(3);
      expect(spawn.content.wave.enemies).to.have.lengthOf(2);
    });
  });

  describe('Spawn Location Generation', function() {
    it('should generate spawn positions at viewport edges', function() {
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const spawn = new SpawnEvent({
        id: 'edge_spawn',
        content: {
          enemyType: 'enemy_ant',
          count: 4,
          spawnLocations: 'viewport_edge'
        }
      });

      // Mock viewport data
      const mockViewport = {
        minX: 0, maxX: 1920,
        minY: 0, maxY: 1080
      };

      const positions = spawn.generateSpawnPositions(mockViewport);

      expect(positions).to.be.an('array');
      expect(positions).to.have.lengthOf(4);
      
      // Positions should be at edges
      positions.forEach(pos => {
        const atEdge = pos.x === 0 || pos.x === 1920 || pos.y === 0 || pos.y === 1080;
        expect(atEdge).to.be.true;
      });
    });

    it('should support custom spawn points', function() {
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const spawn = new SpawnEvent({
        id: 'custom_spawn',
        content: {
          enemyType: 'enemy_ant',
          count: 2,
          spawnPoints: [
            { x: 100, y: 200 },
            { x: 300, y: 400 }
          ]
        }
      });

      const positions = spawn.generateSpawnPositions();

      expect(positions).to.deep.equal([
        { x: 100, y: 200 },
        { x: 300, y: 400 }
      ]);
    });
  });

  describe('Enemy Spawning', function() {
    it('should execute spawn callback with enemy data', function() {
      if (typeof SpawnEvent === 'undefined') return this.skip();
      
      const onSpawn = sandbox.stub();
      const spawn = new SpawnEvent({
        id: 'callback_spawn',
        content: {
          enemyType: 'enemy_ant',
          count: 3
        },
        onSpawn: onSpawn
      });

      spawn.trigger();
      spawn.executeSpawn({ x: 100, y: 100 });

      expect(onSpawn.calledOnce).to.be.true;
      expect(onSpawn.firstCall.args[0]).to.include({
        enemyType: 'enemy_ant',
        position: { x: 100, y: 100 }
      });
    });
  });
});

describe('TutorialEvent', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create tutorial event with instructional content', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      const tutorial = new TutorialEvent({
        id: 'tutorial_01',
        content: {
          title: 'How to Gather',
          instructions: 'Select ants and right-click resources',
          highlightElement: 'resource-panel'
        }
      });

      expect(tutorial.type).to.equal('tutorial');
      expect(tutorial.content.title).to.equal('How to Gather');
      expect(tutorial.content.highlightElement).to.equal('resource-panel');
    });

    it('should support step-by-step tutorials', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      const tutorial = new TutorialEvent({
        id: 'multi_step',
        content: {
          steps: [
            { title: 'Step 1', text: 'First do this' },
            { title: 'Step 2', text: 'Then do that' }
          ]
        }
      });

      expect(tutorial.content.steps).to.have.lengthOf(2);
      expect(tutorial.currentStep).to.equal(0);
    });
  });

  describe('Step Navigation', function() {
    let tutorial;

    beforeEach(function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      tutorial = new TutorialEvent({
        id: 'nav_test',
        content: {
          steps: [
            { text: 'Step 1' },
            { text: 'Step 2' },
            { text: 'Step 3' }
          ]
        }
      });
    });

    it('should advance to next step', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      tutorial.trigger();
      tutorial.nextStep();

      expect(tutorial.currentStep).to.equal(1);
    });

    it('should go back to previous step', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      tutorial.trigger();
      tutorial.nextStep();
      tutorial.nextStep();
      tutorial.previousStep();

      expect(tutorial.currentStep).to.equal(1);
    });

    it('should complete tutorial at last step', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      tutorial.trigger();
      tutorial.nextStep();
      tutorial.nextStep();
      tutorial.nextStep(); // Beyond last step

      expect(tutorial.completed).to.be.true;
    });

    it('should not go before first step', function() {
      if (typeof TutorialEvent === 'undefined') return this.skip();
      
      tutorial.trigger();
      tutorial.previousStep();

      expect(tutorial.currentStep).to.equal(0);
    });
  });
});

describe('BossEvent', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Constructor', function() {
    it('should create boss event with boss configuration', function() {
      if (typeof BossEvent === 'undefined') return this.skip();
      
      const boss = new BossEvent({
        id: 'boss_01',
        content: {
          bossType: 'giant_beetle',
          health: 1000,
          spawnLocation: { x: 500, y: 500 }
        }
      });

      expect(boss.type).to.equal('boss');
      expect(boss.content.bossType).to.equal('giant_beetle');
      expect(boss.content.health).to.equal(1000);
    });

    it('should support intro dialogue', function() {
      if (typeof BossEvent === 'undefined') return this.skip();
      
      const boss = new BossEvent({
        id: 'boss_intro',
        content: {
          bossType: 'giant_beetle',
          introDialogue: {
            speaker: 'Giant Beetle',
            message: 'Prepare to be crushed!'
          }
        }
      });

      expect(boss.content.introDialogue).to.exist;
      expect(boss.content.introDialogue.speaker).to.equal('Giant Beetle');
    });

    it('should support victory/defeat conditions', function() {
      if (typeof BossEvent === 'undefined') return this.skip();
      
      const boss = new BossEvent({
        id: 'boss_conditions',
        content: {
          bossType: 'giant_beetle',
          victoryCondition: 'boss_defeated',
          defeatCondition: 'queen_dies'
        }
      });

      expect(boss.content.victoryCondition).to.equal('boss_defeated');
      expect(boss.content.defeatCondition).to.equal('queen_dies');
    });
  });

  describe('Boss Phases', function() {
    it('should support multi-phase boss fights', function() {
      if (typeof BossEvent === 'undefined') return this.skip();
      
      const boss = new BossEvent({
        id: 'phased_boss',
        content: {
          bossType: 'giant_beetle',
          phases: [
            { healthThreshold: 1.0, behavior: 'aggressive' },
            { healthThreshold: 0.5, behavior: 'enraged' },
            { healthThreshold: 0.25, behavior: 'desperate' }
          ]
        }
      });

      expect(boss.content.phases).to.have.lengthOf(3);
      expect(boss.getCurrentPhase(0.6)).to.equal(1); // 60% health = phase 2
    });
  });
});




// ================================================================
// EventFlag.test.js (28 tests)
// ================================================================
/**
 * Unit Tests: EventFlag Class
 * TDD Phase 2A: Write tests FIRST before implementation
 * 
 * Tests visual flag entity with trigger zones for Level Editor
 */

describe('EventFlag', function() {
  let EventFlag;
  
  before(function() {
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.circle = sinon.stub();
    global.rect = sinon.stub();
    global.rectMode = sinon.stub();
    global.CENTER = 'center';
    global.CORNER = 'corner';
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.text = sinon.stub();
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.color = global.color;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.circle = global.circle;
      window.rect = global.rect;
      window.rectMode = global.rectMode;
      window.CENTER = global.CENTER;
      window.CORNER = global.CORNER;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.text = global.text;
    }
    
    // Load EventFlag class (will fail initially)
    try {
      EventFlag = require('../../../Classes/events/EventFlag');
    } catch (e) {
      // Class doesn't exist yet - expected for TDD
      EventFlag = null;
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with position and circle shape by default', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 200,
        radius: 50,
        eventId: 'test-event-1'
      });
      
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.radius).to.equal(50);
      expect(flag.eventId).to.equal('test-event-1');
      expect(flag.shape).to.equal('circle');
    });
    
    it('should initialize with rectangle shape when specified', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'test-event-2'
      });
      
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.width).to.equal(80);
      expect(flag.height).to.equal(60);
      expect(flag.shape).to.equal('rectangle');
    });
    
    it('should generate unique ID if not provided', function() {
      if (!EventFlag) this.skip();
      
      const flag1 = new EventFlag({ x: 0, y: 0, radius: 10, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 0, y: 0, radius: 10, eventId: 'evt-1' });
      
      expect(flag1.id).to.exist;
      expect(flag2.id).to.exist;
      expect(flag1.id).to.not.equal(flag2.id);
    });
    
    it('should use provided ID if given', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'custom-flag-id',
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.id).to.equal('custom-flag-id');
    });
    
    it('should set default color if not provided', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.color).to.exist;
    });
    
    it('should accept custom color', function() {
      if (!EventFlag) this.skip();
      
      const customColor = { r: 255, g: 0, b: 0, a: 128 };
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        color: customColor
      });
      
      expect(flag.color).to.equal(customColor);
    });
    
    it('should default to repeatable trigger', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.oneTime).to.be.false;
    });
    
    it('should support one-time trigger flag', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        oneTime: true
      });
      
      expect(flag.oneTime).to.be.true;
    });
  });
  
  describe('Validation', function() {
    it('should throw error if eventId is missing', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, radius: 10 });
      }).to.throw(/eventId/);
    });
    
    it('should throw error if position is missing', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ radius: 10, eventId: 'evt-1' });
      }).to.throw(/position|x|y/i);
    });
    
    it('should throw error if circle has no radius', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, shape: 'circle', eventId: 'evt-1' });
      }).to.throw(/radius/);
    });
    
    it('should throw error if rectangle has no width or height', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, shape: 'rectangle', eventId: 'evt-1' });
      }).to.throw(/width|height/i);
    });
    
    it('should handle negative radius by using absolute value', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: -50,
        eventId: 'evt-1'
      });
      
      expect(flag.radius).to.equal(50);
    });
  });
  
  describe('containsPoint()', function() {
    it('should detect point inside circle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      // Point at center
      expect(flag.containsPoint(100, 100)).to.be.true;
      
      // Point near edge (inside)
      expect(flag.containsPoint(140, 100)).to.be.true;
      
      // Point on edge (use <= for inclusive)
      expect(flag.containsPoint(150, 100)).to.be.true;
    });
    
    it('should detect point outside circle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      // Point outside
      expect(flag.containsPoint(200, 200)).to.be.false;
      expect(flag.containsPoint(151, 100)).to.be.false;
    });
    
    it('should detect point inside rectangle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      // Center point (rectangle centered at x, y)
      expect(flag.containsPoint(100, 100)).to.be.true;
      
      // Point near edge (inside)
      expect(flag.containsPoint(130, 120)).to.be.true;
    });
    
    it('should detect point outside rectangle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      // Point outside
      expect(flag.containsPoint(200, 200)).to.be.false;
      expect(flag.containsPoint(50, 50)).to.be.false;
    });
  });
  
  describe('render()', function() {
    it('should render circle flag when editorMode is true', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.circle.resetHistory();
      
      flag.render(true);
      
      expect(global.circle.calledOnce).to.be.true;
    });
    
    it('should render rectangle flag when editorMode is true', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      global.rect.resetHistory();
      
      flag.render(true);
      
      expect(global.rect.calledOnce).to.be.true;
    });
    
    it('should NOT render when editorMode is false', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.circle.resetHistory();
      global.rect.resetHistory();
      
      flag.render(false);
      
      expect(global.circle.called).to.be.false;
      expect(global.rect.called).to.be.false;
    });
    
    it('should use push/pop for style isolation', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.push.resetHistory();
      global.pop.resetHistory();
      
      flag.render(true);
      
      expect(global.push.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
    });
  });
  
  describe('exportToJSON()', function() {
    it('should export circle flag to JSON', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'flag-1',
        x: 100,
        y: 200,
        radius: 50,
        eventId: 'evt-1',
        oneTime: true
      });
      
      const json = flag.exportToJSON();
      
      expect(json.id).to.equal('flag-1');
      expect(json.x).to.equal(100);
      expect(json.y).to.equal(200);
      expect(json.radius).to.equal(50);
      expect(json.shape).to.equal('circle');
      expect(json.eventId).to.equal('evt-1');
      expect(json.oneTime).to.be.true;
    });
    
    it('should export rectangle flag to JSON', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'flag-2',
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-2'
      });
      
      const json = flag.exportToJSON();
      
      expect(json.id).to.equal('flag-2');
      expect(json.width).to.equal(80);
      expect(json.height).to.equal(60);
      expect(json.shape).to.equal('rectangle');
    });
    
    it('should include color in export', function() {
      if (!EventFlag) this.skip();
      
      const customColor = { r: 255, g: 0, b: 0, a: 128 };
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        color: customColor
      });
      
      const json = flag.exportToJSON();
      
      expect(json.color).to.deep.equal(customColor);
    });
  });
  
  describe('importFromJSON()', function() {
    it('should create EventFlag from JSON data', function() {
      if (!EventFlag) this.skip();
      
      const data = {
        id: 'flag-1',
        x: 100,
        y: 200,
        radius: 50,
        shape: 'circle',
        eventId: 'evt-1',
        oneTime: true,
        color: { r: 255, g: 0, b: 0, a: 128 }
      };
      
      const flag = EventFlag.importFromJSON(data);
      
      expect(flag.id).to.equal('flag-1');
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.radius).to.equal(50);
      expect(flag.eventId).to.equal('evt-1');
      expect(flag.oneTime).to.be.true;
    });
    
    it('should handle rectangle import', function() {
      if (!EventFlag) this.skip();
      
      const data = {
        id: 'flag-2',
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-2'
      };
      
      const flag = EventFlag.importFromJSON(data);
      
      expect(flag.shape).to.equal('rectangle');
      expect(flag.width).to.equal(80);
      expect(flag.height).to.equal(60);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero radius', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 0,
        eventId: 'evt-1'
      });
      
      expect(flag.radius).to.equal(0);
      expect(flag.containsPoint(0, 0)).to.be.true;
      expect(flag.containsPoint(1, 1)).to.be.false;
    });
    
    it('should handle very large coordinates', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100000,
        y: 100000,
        radius: 50,
        eventId: 'evt-1'
      });
      
      expect(flag.x).to.equal(100000);
      expect(flag.containsPoint(100000, 100000)).to.be.true;
    });
  });
});




// ================================================================
// EventFlagLayer.test.js (36 tests)
// ================================================================
/**
 * Unit Tests: EventFlagLayer Class
 * TDD Phase 3A: Write tests FIRST before implementation
 * 
 * Tests collection manager for EventFlags in Level Editor
 */

describe('EventFlagLayer', function() {
  let EventFlagLayer, EventFlag;
  
  before(function() {
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.circle = sinon.stub();
    global.rect = sinon.stub();
    global.rectMode = sinon.stub();
    global.CENTER = 'center';
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.color = global.color;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.circle = global.circle;
      window.rect = global.rect;
      window.rectMode = global.rectMode;
      window.CENTER = global.CENTER;
    }
    
    // Load dependencies
    EventFlag = require('../../../Classes/events/EventFlag');
    
    // Make EventFlag globally available for importFromJSON
    global.EventFlag = EventFlag;
    if (typeof window !== 'undefined') {
      window.EventFlag = EventFlag;
    }
    
    // Load EventFlagLayer class (will fail initially)
    try {
      EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    } catch (e) {
      // Class doesn't exist yet - expected for TDD
      EventFlagLayer = null;
    }
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with empty flags collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(layer.flags).to.exist;
      expect(layer.flags.size).to.equal(0);
    });
    
    it('should initialize with no selected flag', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(layer.selectedFlagId).to.be.null;
    });
    
    it('should accept optional terrain reference', function() {
      if (!EventFlagLayer) this.skip();
      
      const mockTerrain = { width: 1000, height: 1000 };
      const layer = new EventFlagLayer(mockTerrain);
      
      expect(layer.terrain).to.equal(mockTerrain);
    });
  });
  
  describe('addFlag()', function() {
    it('should add flag to collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      layer.addFlag(flag);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.flags.has(flag.id)).to.be.true;
    });
    
    it('should return the added flag', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      const result = layer.addFlag(flag);
      
      expect(result).to.equal(flag);
    });
    
    it('should allow adding multiple flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      expect(layer.flags.size).to.equal(2);
    });
    
    it('should replace flag with same ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ id: 'flag-1', x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.flags.get('flag-1').x).to.equal(200);
    });
  });
  
  describe('removeFlag()', function() {
    it('should remove flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.removeFlag('flag-1');
      
      expect(layer.flags.size).to.equal(0);
      expect(layer.flags.has('flag-1')).to.be.false;
    });
    
    it('should return true if flag was removed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const result = layer.removeFlag('flag-1');
      
      expect(result).to.be.true;
    });
    
    it('should return false if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const result = layer.removeFlag('nonexistent');
      
      expect(result).to.be.false;
    });
    
    it('should clear selection if selected flag is removed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.removeFlag('flag-1');
      
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('getFlag()', function() {
    it('should retrieve flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const retrieved = layer.getFlag('flag-1');
      
      expect(retrieved).to.equal(flag);
    });
    
    it('should return null if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const retrieved = layer.getFlag('nonexistent');
      
      expect(retrieved).to.be.null;
    });
  });
  
  describe('getAllFlags()', function() {
    it('should return empty array when no flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flags = layer.getAllFlags();
      
      expect(flags).to.be.an('array');
      expect(flags.length).to.equal(0);
    });
    
    it('should return array of all flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const flags = layer.getAllFlags();
      
      expect(flags).to.be.an('array');
      expect(flags.length).to.equal(2);
      expect(flags).to.include(flag1);
      expect(flags).to.include(flag2);
    });
  });
  
  describe('findFlagsAtPosition()', function() {
    it('should find flag at position', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const found = layer.findFlagsAtPosition(100, 100);
      
      expect(found).to.be.an('array');
      expect(found.length).to.equal(1);
      expect(found[0]).to.equal(flag);
    });
    
    it('should return empty array if no flags at position', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const found = layer.findFlagsAtPosition(500, 500);
      
      expect(found).to.be.an('array');
      expect(found.length).to.equal(0);
    });
    
    it('should find multiple overlapping flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 110, y: 110, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const found = layer.findFlagsAtPosition(105, 105);
      
      expect(found.length).to.equal(2);
    });
  });
  
  describe('selectFlag()', function() {
    it('should select flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      
      expect(layer.selectedFlagId).to.equal('flag-1');
    });
    
    it('should deselect if null is passed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.selectFlag(null);
      
      expect(layer.selectedFlagId).to.be.null;
    });
    
    it('should return true if flag exists', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const result = layer.selectFlag('flag-1');
      
      expect(result).to.be.true;
    });
    
    it('should return false if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const result = layer.selectFlag('nonexistent');
      
      expect(result).to.be.false;
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('getSelectedFlag()', function() {
    it('should return selected flag instance', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      
      const selected = layer.getSelectedFlag();
      
      expect(selected).to.equal(flag);
    });
    
    it('should return null if no flag selected', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const selected = layer.getSelectedFlag();
      
      expect(selected).to.be.null;
    });
  });
  
  describe('render()', function() {
    it('should call render on all flags when editorMode is true', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      // Spy on render methods
      const spy1 = sinon.spy(flag1, 'render');
      const spy2 = sinon.spy(flag2, 'render');
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      layer.render(true);
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy1.calledWith(true)).to.be.true;
      expect(spy2.calledOnce).to.be.true;
      expect(spy2.calledWith(true)).to.be.true;
    });
    
    it('should not render when editorMode is false', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const spy = sinon.spy(flag, 'render');
      
      layer.addFlag(flag);
      layer.render(false);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(false)).to.be.true;
    });
    
    it('should handle empty collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(() => layer.render(true)).to.not.throw();
    });
  });
  
  describe('exportToJSON()', function() {
    it('should export empty array when no flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const json = layer.exportToJSON();
      
      expect(json).to.be.an('array');
      expect(json.length).to.equal(0);
    });
    
    it('should export all flags to JSON array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ id: 'flag-2', x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const json = layer.exportToJSON();
      
      expect(json).to.be.an('array');
      expect(json.length).to.equal(2);
      expect(json[0].id).to.equal('flag-1');
      expect(json[1].id).to.equal('flag-2');
    });
  });
  
  describe('importFromJSON()', function() {
    it('should import flags from JSON array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const data = [
        { id: 'flag-1', x: 100, y: 100, radius: 50, shape: 'circle', eventId: 'evt-1' },
        { id: 'flag-2', x: 200, y: 200, radius: 50, shape: 'circle', eventId: 'evt-2' }
      ];
      
      layer.importFromJSON(data);
      
      expect(layer.flags.size).to.equal(2);
      expect(layer.getFlag('flag-1')).to.exist;
      expect(layer.getFlag('flag-2')).to.exist;
    });
    
    it('should clear existing flags before import', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const existingFlag = new EventFlag({ x: 50, y: 50, radius: 25, eventId: 'evt-old' });
      
      layer.addFlag(existingFlag);
      
      const data = [
        { id: 'flag-1', x: 100, y: 100, radius: 50, shape: 'circle', eventId: 'evt-1' }
      ];
      
      layer.importFromJSON(data);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.getFlag('flag-1')).to.exist;
    });
    
    it('should handle empty array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      layer.importFromJSON([]);
      
      expect(layer.flags.size).to.equal(0);
    });
  });
  
  describe('clear()', function() {
    it('should remove all flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      layer.clear();
      
      expect(layer.flags.size).to.equal(0);
    });
    
    it('should clear selection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.clear();
      
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding null flag gracefully', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(() => layer.addFlag(null)).to.throw();
    });
    
    it('should handle large number of flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      for (let i = 0; i < 1000; i++) {
        const flag = new EventFlag({
          x: i * 10,
          y: i * 10,
          radius: 50,
          eventId: `evt-${i}`
        });
        layer.addFlag(flag);
      }
      
      expect(layer.flags.size).to.equal(1000);
    });
  });
});




// ================================================================
// eventTrigger.test.js (35 tests)
// ================================================================
/**
 * Unit Tests for Event Trigger Classes
 * Tests EventTrigger base class and specific trigger types (TimeTrigger, SpatialTrigger, FlagTrigger, etc.)
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

let {
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

