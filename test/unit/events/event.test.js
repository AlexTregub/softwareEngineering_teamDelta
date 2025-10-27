/**
 * Unit Tests for Event Classes
 * Tests GameEvent base class and specific event types (DialogueEvent, SpawnEvent, TutorialEvent, BossEvent)
 * 
 * Following TDD: These tests are written FIRST, implementation comes after review.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const {
  GameEvent,
  DialogueEvent,
  SpawnEvent,
  TutorialEvent,
  BossEvent
} = require('../../../Classes/events/Event');

// Import triggers for SpawnEvent integration
const {
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
