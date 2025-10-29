/**
 * Unit Tests: DialogueEvent Registration with EventManager
 * 
 * Following TDD - Tests DialogueEvent can be registered with EventManager
 * and appears correctly in the event system.
 * 
 * Tests:
 * - DialogueEvent can be registered with EventManager
 * - Registered dialogue appears in getAllEvents()
 * - Registered dialogue can be retrieved by ID
 * - DialogueEvent metadata is correct (type, priority)
 * - Multiple DialogueEvents can be registered
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DialogueEvent Registration with EventManager', function() {
  let EventManager;
  let DialogueEvent;
  let eventManager;
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock p5.js functions
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.image = sandbox.stub();

    // Load classes
    EventManager = require('../../../Classes/managers/EventManager.js');
    const EventClasses = require('../../../Classes/events/Event.js');
    DialogueEvent = EventClasses.DialogueEvent;

    // Create EventManager instance
    eventManager = new EventManager();
  });

  afterEach(function() {
    sandbox.restore();
    delete global.createVector;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.image;
  });

  describe('Basic Registration', function() {
    it('should register DialogueEvent with EventManager', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      const registered = eventManager.registerEvent(dialogue);

      expect(registered).to.be.true;
    });

    it('should appear in getAllEvents() after registration', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const allEvents = eventManager.getAllEvents();

      expect(allEvents).to.have.lengthOf(1);
      expect(allEvents[0].id).to.equal('test_dialogue');
    });

    it('should be retrievable by ID', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved).to.exist;
      expect(retrieved.id).to.equal('test_dialogue');
      expect(retrieved.type).to.equal('dialogue');
    });

    it('should have correct type metadata', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.type).to.equal('dialogue');
    });

    it('should have default priority if not specified', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.priority).to.be.a('number');
    });
  });

  describe('Multiple DialogueEvent Registration', function() {
    it('should register multiple dialogue events', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Speaker 1',
          message: 'Message 1'
        }
      });

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'Speaker 2',
          message: 'Message 2'
        }
      });

      const dialogue3 = new DialogueEvent({
        id: 'dialogue_3',
        content: {
          speaker: 'Speaker 3',
          message: 'Message 3'
        }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);
      eventManager.registerEvent(dialogue3);

      const allEvents = eventManager.getAllEvents();

      expect(allEvents).to.have.lengthOf(3);
      expect(allEvents.map(e => e.id)).to.include.members(['dialogue_1', 'dialogue_2', 'dialogue_3']);
    });

    it('should maintain distinct dialogue events', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Speaker 1',
          message: 'Message 1'
        }
      });

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'Speaker 2',
          message: 'Message 2'
        }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);

      const retrieved1 = eventManager.getEvent('dialogue_1');
      const retrieved2 = eventManager.getEvent('dialogue_2');

      expect(retrieved1.content.speaker).to.equal('Speaker 1');
      expect(retrieved2.content.speaker).to.equal('Speaker 2');
      expect(retrieved1).to.not.equal(retrieved2);
    });
  });

  describe('DialogueEvent Content Preservation', function() {
    it('should preserve speaker name after registration', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to the colony!'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.content.speaker).to.equal('Queen Ant');
    });

    it('should preserve message content after registration', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Worker Ant',
          message: 'We need more resources!'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.content.message).to.equal('We need more resources!');
    });

    it('should preserve choices after registration', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Scout Ant',
          message: 'Found food nearby!',
          choices: [
            { text: 'Gather it' },
            { text: 'Ignore it' }
          ]
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.content.choices).to.have.lengthOf(2);
      expect(retrieved.content.choices[0].text).to.equal('Gather it');
      expect(retrieved.content.choices[1].text).to.equal('Ignore it');
    });

    it('should preserve portrait after registration', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Greetings!',
          portrait: 'queen_ant.png'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('test_dialogue');

      expect(retrieved.content.portrait).to.equal('queen_ant.png');
    });
  });

  describe('Priority and Ordering', function() {
    it('should respect custom priority values', function() {
      const highPriority = new DialogueEvent({
        id: 'high_priority',
        priority: 1,
        content: {
          speaker: 'Urgent',
          message: 'High priority message'
        }
      });

      const lowPriority = new DialogueEvent({
        id: 'low_priority',
        priority: 10,
        content: {
          speaker: 'Normal',
          message: 'Low priority message'
        }
      });

      eventManager.registerEvent(highPriority);
      eventManager.registerEvent(lowPriority);

      const retrieved1 = eventManager.getEvent('high_priority');
      const retrieved2 = eventManager.getEvent('low_priority');

      expect(retrieved1.priority).to.equal(1);
      expect(retrieved2.priority).to.equal(10);
    });
  });

  describe('Duplicate Prevention', function() {
    it('should not register duplicate event IDs', function() {
      const dialogue1 = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'First',
          message: 'First message'
        }
      });

      const dialogue2 = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Second',
          message: 'Second message'
        }
      });

      const registered1 = eventManager.registerEvent(dialogue1);
      const registered2 = eventManager.registerEvent(dialogue2);

      expect(registered1).to.be.true;
      expect(registered2).to.be.false;

      const allEvents = eventManager.getAllEvents();
      expect(allEvents).to.have.lengthOf(1);
      
      // First registration should be preserved
      const retrieved = eventManager.getEvent('test_dialogue');
      expect(retrieved.content.speaker).to.equal('First');
    });
  });

  describe('Edge Cases', function() {
    it('should handle dialogue with no choices', function() {
      const dialogue = new DialogueEvent({
        id: 'auto_continue',
        content: {
          speaker: 'Narrator',
          message: 'This dialogue auto-continues.',
          autoContinue: true
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('auto_continue');

      expect(retrieved).to.exist;
      expect(retrieved.content.autoContinue).to.be.true;
    });

    it('should handle dialogue with nextEventId', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Start',
          message: 'First dialogue',
          choices: [
            { text: 'Next', nextEventId: 'dialogue_2' }
          ]
        }
      });

      eventManager.registerEvent(dialogue1);
      const retrieved = eventManager.getEvent('dialogue_1');

      expect(retrieved.content.choices[0].nextEventId).to.equal('dialogue_2');
    });

    it('should handle very long message text', function() {
      const longMessage = 'A'.repeat(1000);
      const dialogue = new DialogueEvent({
        id: 'long_message',
        content: {
          speaker: 'Verbose Ant',
          message: longMessage
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('long_message');

      expect(retrieved.content.message).to.have.lengthOf(1000);
    });
  });
});
