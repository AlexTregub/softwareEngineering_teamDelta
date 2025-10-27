/**
 * Integration Tests for DialogueEvent
 * 
 * Tests DialogueEvent with real DraggablePanelManager (not mocked).
 * Verifies proper integration between DialogueEvent, DraggablePanelManager, and EventManager.
 * 
 * Run: npm run test:integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Load required classes
const { GameEvent, DialogueEvent } = require('../../../Classes/events/Event.js');
const DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
const DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

describe('DialogueEvent Integration Tests', function() {
  let dom;
  let window;
  let document;
  let sandbox;
  let draggablePanelManager;
  let mockEventManager;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up global p5.js-like environment
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Mock p5.js globals
    const mockP5Functions = {
      createVector: (x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }),
      millis: sandbox.stub().returns(1000),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textSize: sandbox.stub(),
      textAlign: sandbox.stub(),
      textWidth: sandbox.stub().callsFake((txt) => txt.length * 7),
      image: sandbox.stub(),
      loadImage: sandbox.stub().returns({ width: 64, height: 64 }),
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom',
      CORNER: 'corner',
      CORNERS: 'corners'
    };
    
    // Assign to both global and window
    Object.keys(mockP5Functions).forEach(key => {
      global[key] = mockP5Functions[key];
      window[key] = mockP5Functions[key];
    });

    // Mock EventManager
    mockEventManager = {
      events: new Map(),
      flags: new Map(),
      registerEvent: function(event) {
        this.events.set(event.id, event);
      },
      triggerEvent: sandbox.stub(),
      setFlag: function(flagName, value) {
        this.flags.set(flagName, value);
      },
      getFlag: function(flagName) {
        return this.flags.get(flagName);
      },
      completeEvent: sandbox.stub()
    };
    
    global.eventManager = mockEventManager;
    window.eventManager = mockEventManager;

    // Set DraggablePanel globally (required by DraggablePanelManager)
    global.DraggablePanel = DraggablePanel;
    window.DraggablePanel = DraggablePanel;
    
    // Mock ButtonStyles to avoid errors
    global.ButtonStyles = {
      PRIMARY: 'primary',
      SUCCESS: 'success',
      DANGER: 'danger',
      WARNING: 'warning',
      INFO: 'info',
      PURPLE: 'purple'
    };
    window.ButtonStyles = global.ButtonStyles;

    // Create REAL DraggablePanelManager (not mocked)
    draggablePanelManager = new DraggablePanelManager();
    // Don't call initialize() to avoid creating default panels with many dependencies
    draggablePanelManager.isInitialized = true; // Mark as initialized manually
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
  });

  afterEach(function() {
    sandbox.restore();
    
    // Cleanup globals
    Object.keys(global).forEach(key => {
      if (typeof global[key] !== 'function' || key === 'clearTimeout' || key === 'setTimeout') return;
      if (key.startsWith('mock') || key === 'window' || key === 'document') {
        delete global[key];
      }
    });
    
    delete global.eventManager;
    delete global.draggablePanelManager;
    delete global.DraggablePanel;
    delete global.window;
    delete global.document;
  });

  describe('Panel Creation with Real DraggablePanelManager', function() {
    it('should create visible panel with correct title', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          speaker: 'Queen Ant',
          message: 'Hello!',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Queen Ant');
      expect(panel.visible).to.be.true;
    });

    it('should create panel with non-draggable behavior', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          speaker: 'Test Speaker',
          message: 'Test message',
          choices: [{ text: 'Continue' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.behavior.draggable).to.be.false;
      expect(panel.config.behavior.closeable).to.be.false;
      expect(panel.config.behavior.minimizable).to.be.false;
    });

    it('should create panel at bottom-center of screen', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Test'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.position.y).to.be.greaterThan(800); // Near bottom
      expect(panel.config.position.x).to.be.within(600, 1200); // Near center
    });

    it('should create panel with choice buttons', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Choose',
          choices: [
            { text: 'Option A' },
            { text: 'Option B' },
            { text: 'Option C' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.buttons).to.exist;
      expect(panel.config.buttons.items).to.have.lengthOf(3);
      expect(panel.config.buttons.items[0].caption).to.equal('Option A');
      expect(panel.config.buttons.items[1].caption).to.equal('Option B');
      expect(panel.config.buttons.items[2].caption).to.equal('Option C');
    });

    it('should have horizontal button layout', function() {
      const dialogue = new DialogueEvent({
        id: 'test',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.buttons.layout).to.equal('horizontal');
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
  });

  describe('Choice Button Functionality', function() {
    it('should execute choice callback when button clicked', function() {
      const choiceCallback = sandbox.stub();
      
      const dialogue = new DialogueEvent({
        id: 'callback_test',
        content: {
          message: 'Test',
          choices: [
            { text: 'Option 1', onSelect: choiceCallback }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      expect(choiceCallback.calledOnce).to.be.true;
    });

    it('should hide panel after choice selection', function() {
      const dialogue = new DialogueEvent({
        id: 'hide_test',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.visible).to.be.true;
      
      panel.config.buttons.items[0].onClick();
      
      expect(panel.visible).to.be.false;
    });

    it('should complete dialogue event after choice', function() {
      const dialogue = new DialogueEvent({
        id: 'complete_test',
        content: {
          message: 'Test',
          choices: [{ text: 'Done' }]
        }
      });
      
      dialogue.trigger();
      expect(dialogue.active).to.be.true;
      expect(dialogue.completed).to.be.false;
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      expect(dialogue.active).to.be.false;
      expect(dialogue.completed).to.be.true;
    });
  });

  describe('EventManager Integration', function() {
    it('should track choice in eventManager flags', function() {
      const dialogue = new DialogueEvent({
        id: 'flag_test',
        content: {
          message: 'Choose',
          choices: [
            { text: 'Option A' },
            { text: 'Option B' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[1].onClick(); // Click "Option B" (index 1)
      
      expect(mockEventManager.getFlag('flag_test_choice')).to.equal(1);
    });

    it('should trigger next event when choice has nextEventId', function() {
      const dialogue = new DialogueEvent({
        id: 'branching_test',
        content: {
          message: 'Choose your path',
          choices: [
            { text: 'Path A', nextEventId: 'event_path_a' },
            { text: 'Path B', nextEventId: 'event_path_b' }
          ]
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick(); // Choose "Path A"
      
      expect(mockEventManager.triggerEvent.calledWith('event_path_a')).to.be.true;
    });

    it('should support branching dialogues', function() {
      // Create dialogue chain
      const dialogue1 = new DialogueEvent({
        id: 'start',
        content: {
          message: 'Start',
          choices: [
            { text: 'Next', nextEventId: 'middle' }
          ]
        }
      });
      
      const dialogue2 = new DialogueEvent({
        id: 'middle',
        content: {
          message: 'Middle',
          choices: [
            { text: 'End', nextEventId: 'end' }
          ]
        }
      });
      
      mockEventManager.registerEvent(dialogue1);
      mockEventManager.registerEvent(dialogue2);
      
      // Trigger first dialogue
      dialogue1.trigger();
      const panel1 = draggablePanelManager.getPanel('dialogue-display');
      expect(panel1.config.title).to.equal('Dialogue'); // Default speaker
      
      // Click to next
      panel1.config.buttons.items[0].onClick();
      expect(mockEventManager.triggerEvent.calledWith('middle')).to.be.true;
    });
  });

  describe('Content Rendering', function() {
    it('should set contentSizeCallback', function() {
      const dialogue = new DialogueEvent({
        id: 'render_test',
        content: {
          message: 'Test message'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      expect(panel.config.contentSizeCallback).to.be.a('function');
    });

    it('should render dialogue text with word wrapping', function() {
      const dialogue = new DialogueEvent({
        id: 'wrap_test',
        content: {
          message: 'This is a very long message that should be wrapped across multiple lines when rendered.'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      const contentArea = { x: 100, y: 100, width: 400, height: 100 };
      const size = panel.config.contentSizeCallback(contentArea);
      
      expect(size).to.have.property('width');
      expect(size).to.have.property('height');
      expect(global.text.called).to.be.true;
    });

    it('should render portrait if provided', function() {
      const dialogue = new DialogueEvent({
        id: 'portrait_test',
        content: {
          speaker: 'Queen',
          message: 'Hello',
          portrait: 'Images/Characters/queen.png'
        }
      });
      
      dialogue.trigger();
      
      const panel = draggablePanelManager.getPanel('dialogue-display');
      const contentArea = { x: 100, y: 100, width: 500, height: 200 };
      panel.config.contentSizeCallback(contentArea);
      
      expect(global.image.called).to.be.true;
    });
  });

  describe('Panel Reuse', function() {
    it('should reuse same panel for multiple dialogues', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Speaker 1',
          message: 'First message',
          choices: [{ text: 'OK' }]
        }
      });
      
      dialogue1.trigger();
      const panel1 = draggablePanelManager.getPanel('dialogue-display');
      const panelId1 = panel1.config.id;
      
      // Close first dialogue
      panel1.config.buttons.items[0].onClick();
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'Speaker 2',
          message: 'Second message',
          choices: [{ text: 'Continue' }]
        }
      });
      
      dialogue2.trigger();
      const panel2 = draggablePanelManager.getPanel('dialogue-display');
      
      // Should be same panel instance
      expect(panel2.config.id).to.equal(panelId1);
      expect(panel2.config.title).to.equal('Speaker 2'); // Updated
    });

    it('should update panel content for new dialogue', function() {
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          message: 'Message 1',
          choices: [{ text: 'Next' }]
        }
      });
      
      dialogue1.trigger();
      const panel = draggablePanelManager.getPanel('dialogue-display');
      panel.config.buttons.items[0].onClick();
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'New Speaker',
          message: 'Message 2',
          choices: [
            { text: 'Choice A' },
            { text: 'Choice B' }
          ]
        }
      });
      
      dialogue2.trigger();
      
      expect(panel.config.title).to.equal('New Speaker');
      expect(panel.config.buttons.items).to.have.lengthOf(2);
    });
  });

  describe('Auto-Continue Behavior', function() {
    it('should auto-continue after delay', function() {
      const dialogue = new DialogueEvent({
        id: 'auto_test',
        content: {
          message: 'This will auto-continue',
          autoContinue: true,
          autoContinueDelay: 2000,
          choices: [{ text: 'Continue' }] // Single choice
        }
      });
      
      dialogue.trigger();
      expect(dialogue.active).to.be.true;
      
      // Before delay
      global.millis.returns(2999);
      dialogue.update();
      expect(dialogue.completed).to.be.false;
      
      // After delay
      global.millis.returns(3000);
      dialogue.update();
      expect(dialogue.completed).to.be.true;
    });

    it('should not auto-continue with multiple choices', function() {
      const dialogue = new DialogueEvent({
        id: 'no_auto',
        content: {
          message: 'Choose',
          autoContinue: true,
          autoContinueDelay: 1000,
          choices: [
            { text: 'A' },
            { text: 'B' }
          ]
        }
      });
      
      dialogue.trigger();
      
      global.millis.returns(5000);
      dialogue.update();
      
      expect(dialogue.completed).to.be.false; // Should not auto-complete
    });
  });

  describe('Error Handling', function() {
    it('should gracefully handle missing eventManager', function() {
      delete global.eventManager;
      delete window.eventManager;
      
      const dialogue = new DialogueEvent({
        id: 'no_manager',
        content: {
          message: 'Test',
          choices: [{ text: 'OK', nextEventId: 'next' }]
        }
      });
      
      dialogue.trigger();
      const panel = draggablePanelManager.getPanel('dialogue-display');
      
      // Should not throw when clicking choice
      expect(() => panel.config.buttons.items[0].onClick()).to.not.throw();
      
      // Restore for cleanup
      global.eventManager = mockEventManager;
      window.eventManager = mockEventManager;
    });

    it('should gracefully handle missing draggablePanelManager', function() {
      delete global.draggablePanelManager;
      delete window.draggablePanelManager;
      
      const dialogue = new DialogueEvent({
        id: 'no_panel_manager',
        content: {
          message: 'Test'
        }
      });
      
      // Should not throw
      expect(() => dialogue.trigger()).to.not.throw();
      
      // Restore for cleanup
      global.draggablePanelManager = draggablePanelManager;
      window.draggablePanelManager = draggablePanelManager;
    });
  });
});
