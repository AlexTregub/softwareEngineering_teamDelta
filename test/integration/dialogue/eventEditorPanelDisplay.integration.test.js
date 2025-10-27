/**
 * Integration Tests: EventEditorPanel Displaying DialogueEvents
 * 
 * Tests that DialogueEvents registered with EventManager appear correctly
 * in the EventEditorPanel UI within the Level Editor.
 * 
 * Tests:
 * - EventEditorPanel displays registered DialogueEvents
 * - Event count matches registered events
 * - Event details (speaker, type) are correct
 * - Multiple dialogue events are all displayed
 * - Event list updates when events are registered
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EventEditorPanel Displaying DialogueEvents (Integration)', function() {
  let EventManager;
  let EventEditorPanel;
  let DialogueEvent;
  let eventManager;
  let eventEditorPanel;
  let sandbox;
  let window;
  let document;

  beforeEach(function() {
    // Create JSDOM environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up globals
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;

    // Mock p5.js functions
    const mockP5 = {
      createVector: (x, y) => ({ x, y }),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      image: sandbox.stub(),
      LEFT: 'left',
      RIGHT: 'right',
      CENTER: 'center',
      TOP: 'top',
      BOTTOM: 'bottom',
      CORNER: 'corner'
    };

    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      window[key] = mockP5[key];
    });

    // Load classes
    EventManager = require('../../../Classes/managers/EventManager.js');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel.js');
    const EventClasses = require('../../../Classes/events/Event.js');
    DialogueEvent = EventClasses.DialogueEvent;

    // Make classes available globally
    global.EventManager = EventManager;
    global.EventEditorPanel = EventEditorPanel;
    global.DialogueEvent = DialogueEvent;
    window.EventManager = EventManager;
    window.EventEditorPanel = EventEditorPanel;
    window.DialogueEvent = DialogueEvent;

    // Create instances
    eventManager = new EventManager();
    global.eventManager = eventManager;
    window.eventManager = eventManager;

    eventEditorPanel = new EventEditorPanel();
    eventEditorPanel.initialize();
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.EventManager;
    delete global.EventEditorPanel;
    delete global.DialogueEvent;
    delete global.eventManager;
  });

  describe('Basic Display Functionality', function() {
    it('should initialize with zero events', function() {
      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);
    });

    it('should display registered DialogueEvent in event list', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      const events = eventManager.getAllEvents();

      expect(events).to.have.lengthOf(1);
      expect(events[0].id).to.equal('test_dialogue');
      expect(events[0].type).to.equal('dialogue');
    });

    it('should render event list without errors', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);

      // Render should not throw
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();
    });

    it('should call p5 text() function with event count', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);

      // Reset stub to count calls
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      // Should have called text() with event count
      const textCalls = global.text.getCalls();
      const countCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().includes('Events (2)')
      );

      expect(countCalls.length).to.be.at.least(1);
    });
  });

  describe('Multiple DialogueEvent Display', function() {
    it('should display all registered dialogue events', function() {
      const dialogues = [
        new DialogueEvent({
          id: 'dialogue_1',
          content: { speaker: 'Queen Ant', message: 'Welcome!' }
        }),
        new DialogueEvent({
          id: 'dialogue_2',
          content: { speaker: 'Worker Ant', message: 'Need resources!' }
        }),
        new DialogueEvent({
          id: 'dialogue_3',
          content: { speaker: 'Scout Ant', message: 'Found food!' }
        })
      ];

      dialogues.forEach(d => eventManager.registerEvent(d));

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(3);

      const eventIds = events.map(e => e.id);
      expect(eventIds).to.include.members(['dialogue_1', 'dialogue_2', 'dialogue_3']);
    });

    it('should render multiple events in event list', function() {
      // Register 5 dialogue events
      for (let i = 1; i <= 5; i++) {
        const dialogue = new DialogueEvent({
          id: `dialogue_${i}`,
          content: {
            speaker: `Speaker ${i}`,
            message: `Message ${i}`
          }
        });
        eventManager.registerEvent(dialogue);
      }

      // Reset stubs
      global.text.resetHistory();
      global.rect.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      // Should have rendered list items (one rect per item background)
      const rectCalls = global.rect.getCalls();
      
      // Should have called rect for event backgrounds (plus UI elements)
      // At least 5 rects for event items
      expect(rectCalls.length).to.be.at.least(5);
    });

    it('should preserve event order', function() {
      const dialogue1 = new DialogueEvent({
        id: 'first',
        priority: 1,
        content: { speaker: 'First', message: 'First' }
      });

      const dialogue2 = new DialogueEvent({
        id: 'second',
        priority: 2,
        content: { speaker: 'Second', message: 'Second' }
      });

      const dialogue3 = new DialogueEvent({
        id: 'third',
        priority: 3,
        content: { speaker: 'Third', message: 'Third' }
      });

      eventManager.registerEvent(dialogue1);
      eventManager.registerEvent(dialogue2);
      eventManager.registerEvent(dialogue3);

      const events = eventManager.getAllEvents();
      
      // Events should be in registration order (or priority order if sorted)
      expect(events[0].id).to.equal('first');
      expect(events[1].id).to.equal('second');
      expect(events[2].id).to.equal('third');
    });
  });

  describe('Event Content Display', function() {
    it('should display event ID in list', function() {
      const dialogue = new DialogueEvent({
        id: 'queen_welcome',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to the colony!'
        }
      });

      eventManager.registerEvent(dialogue);
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const idCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].includes('queen_welcome')
      );

      expect(idCalls.length).to.be.at.least(1);
    });

    it('should display event type in list', function() {
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);
      global.text.resetHistory();

      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const typeCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().toLowerCase().includes('dialogue')
      );

      expect(typeCalls.length).to.be.at.least(1);
    });

    it('should display event priority', function() {
      const dialogue = new DialogueEvent({
        id: 'high_priority',
        priority: 1,
        content: {
          speaker: 'Urgent',
          message: 'Important message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent('high_priority');

      expect(retrieved.priority).to.equal(1);
    });
  });

  describe('Event List Updates', function() {
    it('should update event count when new event is registered', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });

      eventManager.registerEvent(dialogue1);
      let events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(1);

      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });

      eventManager.registerEvent(dialogue2);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);
    });

    it('should reflect current event manager state', function() {
      // Start with no events
      let events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);

      // Add first dialogue
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { speaker: 'Speaker 1', message: 'Message 1' }
      });
      eventManager.registerEvent(dialogue1);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(1);

      // Add second dialogue
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { speaker: 'Speaker 2', message: 'Message 2' }
      });
      eventManager.registerEvent(dialogue2);
      events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);

      // Panel should show current state
      global.text.resetHistory();
      eventEditorPanel.render(10, 10, 250, 300);

      const textCalls = global.text.getCalls();
      const countCalls = textCalls.filter(call => 
        call.args[0] && call.args[0].toString().includes('Events (2)')
      );

      expect(countCalls.length).to.be.at.least(1);
    });
  });

  describe('EventEditorPanel Content Size', function() {
    it('should return valid content size', function() {
      const size = eventEditorPanel.getContentSize();

      expect(size).to.exist;
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
      expect(size.width).to.be.greaterThan(0);
      expect(size.height).to.be.greaterThan(0);
    });

    it('should return consistent size for list view', function() {
      const size1 = eventEditorPanel.getContentSize();
      const size2 = eventEditorPanel.getContentSize();

      expect(size1.width).to.equal(size2.width);
      expect(size1.height).to.equal(size2.height);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty event list', function() {
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(0);
    });

    it('should handle many dialogue events', function() {
      // Register 20 dialogue events
      for (let i = 1; i <= 20; i++) {
        const dialogue = new DialogueEvent({
          id: `dialogue_${i}`,
          content: {
            speaker: `Speaker ${i}`,
            message: `Message ${i}`
          }
        });
        eventManager.registerEvent(dialogue);
      }

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(20);

      // Rendering should not throw with many events
      expect(() => {
        eventEditorPanel.render(10, 10, 250, 300);
      }).to.not.throw();
    });

    it('should handle dialogue with very long ID', function() {
      const longId = 'very_long_dialogue_event_id_' + 'a'.repeat(100);
      const dialogue = new DialogueEvent({
        id: longId,
        content: {
          speaker: 'Speaker',
          message: 'Message'
        }
      });

      eventManager.registerEvent(dialogue);
      const retrieved = eventManager.getEvent(longId);

      expect(retrieved).to.exist;
      expect(retrieved.id).to.equal(longId);
    });

    it('should handle mixed event types when integrated', function() {
      // Register dialogue event
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Test',
          message: 'Test message'
        }
      });

      eventManager.registerEvent(dialogue);

      // Also register plain event
      eventManager.registerEvent({
        id: 'spawn_event',
        type: 'spawn',
        priority: 5
      });

      const events = eventManager.getAllEvents();
      expect(events).to.have.lengthOf(2);

      const dialogueEvents = events.filter(e => e.type === 'dialogue');
      expect(dialogueEvents).to.have.lengthOf(1);
      expect(dialogueEvents[0].id).to.equal('test_dialogue');
    });
  });
});
