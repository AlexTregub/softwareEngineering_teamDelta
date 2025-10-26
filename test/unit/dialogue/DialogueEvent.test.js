/**
 * Unit Tests for DialogueEvent
 * 
 * Tests the DialogueEvent class which integrates with DraggablePanel system
 * to display dialogue with choices, speaker names, and branching logic.
 * 
 * Following TDD: These tests are written FIRST, implementation comes after.
 * 
 * Design Goals:
 * - Reuse existing DraggablePanel infrastructure
 * - Integrate cleanly with EventManager
 * - Support branching dialogue via nextEventId
 * - Track player choices with event flags
 * - Easy to extend with portraits, animations, sound in future
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DialogueEvent', function() {
  let sandbox;
  let mockEventManager;
  let mockDraggablePanelManager;
  let DialogueEvent;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.millis = sandbox.stub().returns(1000);
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.text = sandbox.stub();
    global.textSize = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textWidth = sandbox.stub().callsFake((txt) => txt.length * 7);
    global.rect = sandbox.stub();
    global.image = sandbox.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    if (typeof window !== 'undefined') {
      window.millis = global.millis;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.text = global.text;
      window.textSize = global.textSize;
      window.textAlign = global.textAlign;
      window.textWidth = global.textWidth;
      window.rect = global.rect;
      window.image = global.image;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.BOTTOM = global.BOTTOM;
      window.innerWidth = 1920;
      window.innerHeight = 1080;
    }

    // Mock EventManager
    mockEventManager = {
      triggerEvent: sandbox.stub(),
      setFlag: sandbox.stub(),
      getFlag: sandbox.stub(),
      completeEvent: sandbox.stub()
    };
    
    global.eventManager = mockEventManager;
    if (typeof window !== 'undefined') {
      window.eventManager = mockEventManager;
    }

    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: new Map(),
      getOrCreatePanel: sandbox.stub(),
      showPanel: sandbox.stub(),
      hidePanel: sandbox.stub(),
      removePanel: sandbox.stub()
    };
    
    global.draggablePanelManager = mockDraggablePanelManager;
    if (typeof window !== 'undefined') {
      window.draggablePanelManager = mockDraggablePanelManager;
    }

    // DialogueEvent will be defined after tests are reviewed
    if (typeof global.DialogueEvent !== 'undefined') {
      DialogueEvent = global.DialogueEvent;
    }
  });

  afterEach(function() {
    sandbox.restore();
    delete global.eventManager;
    delete global.draggablePanelManager;
    if (typeof window !== 'undefined') {
      delete window.eventManager;
      delete window.draggablePanelManager;
    }
  });

  describe('Constructor', function() {
    it('should create dialogue event with required properties', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to the colony!',
          choices: [
            { text: 'Thank you!' }
          ]
        }
      });

      expect(dialogue.id).to.equal('test_dialogue');
      expect(dialogue.type).to.equal('dialogue');
      expect(dialogue.content.speaker).to.equal('Queen Ant');
      expect(dialogue.content.message).to.equal('Welcome to the colony!');
      expect(dialogue.content.choices).to.be.an('array');
    });

    it('should default to "Dialogue" speaker if not provided', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'no_speaker',
        content: {
          message: 'Hello world'
        }
      });

      expect(dialogue.content.speaker).to.exist;
    });

    it('should create default "Continue" choice if no choices provided', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'auto_continue',
        content: {
          message: 'This dialogue auto-continues'
        }
      });

      const choices = dialogue.getChoices();
      expect(choices).to.have.lengthOf(1);
      expect(choices[0].text).to.equal('Continue');
    });

    it('should store portrait image path if provided', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'with_portrait',
        content: {
          speaker: 'Queen Ant',
          message: 'Greetings',
          portrait: 'Images/Characters/queen.png'
        }
      });

      expect(dialogue.content.portrait).to.equal('Images/Characters/queen.png');
    });

    it('should validate message is not empty', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      expect(() => {
        new DialogueEvent({
          id: 'empty_message',
          content: {
            speaker: 'Test',
            message: ''
          }
        });
      }).to.throw();
    });

    it('should store optional metadata', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'with_metadata',
        content: {
          message: 'Test'
        },
        metadata: {
          questId: 'main_quest_1',
          importance: 'high',
          voiceFile: 'audio/dialogue/queen_01.mp3'
        }
      });

      expect(dialogue.metadata.questId).to.equal('main_quest_1');
      expect(dialogue.metadata.importance).to.equal('high');
      expect(dialogue.metadata.voiceFile).to.equal('audio/dialogue/queen_01.mp3');
    });
  });

  describe('Panel Creation and Display', function() {
    it('should create dialogue panel when triggered', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome!'
        }
      });

      dialogue.trigger();

      expect(mockDraggablePanelManager.getOrCreatePanel.calledOnce).to.be.true;
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.id).to.equal('dialogue-display');
      expect(panelConfig.title).to.equal('Queen Ant');
    });

    it('should show panel after creation', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          message: 'Test'
        }
      });

      dialogue.trigger();

      expect(mockPanel.show.calledOnce).to.be.true;
    });

    it('should configure panel as non-draggable', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: { message: 'Test' }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.behavior.draggable).to.be.false;
    });

    it('should configure panel as non-closeable', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: { message: 'Test' }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.behavior.closeable).to.be.false;
    });

    it('should position panel at bottom-center of screen', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      global.window = { innerWidth: 1920, innerHeight: 1080 };
      if (typeof window !== 'undefined') {
        window.innerWidth = 1920;
        window.innerHeight = 1080;
      }
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: { message: 'Test' }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.position.y).to.be.greaterThan(800); // Near bottom
      expect(panelConfig.position.x).to.be.closeTo(1920 / 2, 300); // Near center
    });

    it('should set panel width based on content', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: { message: 'Test' }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.size.width).to.be.greaterThan(300);
      expect(panelConfig.size.width).to.be.lessThan(800);
    });
  });

  describe('Choice Button Generation', function() {
    it('should create buttons for each choice', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'multi_choice',
        content: {
          message: 'Choose wisely',
          choices: [
            { text: 'Option A' },
            { text: 'Option B' },
            { text: 'Option C' }
          ]
        }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.buttons.items).to.have.lengthOf(3);
      expect(panelConfig.buttons.items[0].caption).to.equal('Option A');
      expect(panelConfig.buttons.items[1].caption).to.equal('Option B');
      expect(panelConfig.buttons.items[2].caption).to.equal('Option C');
    });

    it('should use horizontal layout for buttons', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.buttons.layout).to.equal('horizontal');
    });

    it('should enable auto-sizing for button area', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.buttons.autoSizeToContent).to.be.true;
    });

    it('should attach onClick handlers to choice buttons', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'test_dialogue',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });

      dialogue.trigger();

      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      expect(panelConfig.buttons.items[0].onClick).to.be.a('function');
    });
  });

  describe('Choice Selection and Callbacks', function() {
    it('should execute choice callback when selected', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
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
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick();

      expect(choiceCallback.calledOnce).to.be.true;
    });

    it('should trigger next event when choice has nextEventId', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
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
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick(); // Select "Path A"

      expect(mockEventManager.triggerEvent.calledWith('event_path_a')).to.be.true;
    });

    it('should set event flag when choice is selected', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'flag_test',
        content: {
          message: 'Test',
          choices: [
            { text: 'Choice 1' },
            { text: 'Choice 2' }
          ]
        }
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[1].onClick(); // Select choice index 1

      expect(mockEventManager.setFlag.calledWith('flag_test_choice', 1)).to.be.true;
    });

    it('should hide panel after choice selection', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'hide_test',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick();

      expect(mockDraggablePanelManager.hidePanel.calledWith('dialogue-display')).to.be.true;
    });

    it('should complete dialogue event after choice selection', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'complete_test',
        content: {
          message: 'Test',
          choices: [{ text: 'Done' }]
        }
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick();

      expect(dialogue.completed).to.be.true;
    });

    it('should pass choice data to callback', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const choiceCallback = sandbox.stub();
      const dialogue = new DialogueEvent({
        id: 'data_test',
        content: {
          message: 'Test',
          choices: [
            {
              text: 'Option 1',
              data: { reward: 'gold', amount: 100 },
              onSelect: choiceCallback
            }
          ]
        }
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick();

      expect(choiceCallback.calledOnce).to.be.true;
      const callbackArg = choiceCallback.firstCall.args[0];
      expect(callbackArg.data.reward).to.equal('gold');
      expect(callbackArg.data.amount).to.equal(100);
    });
  });

  describe('Content Rendering with contentSizeCallback', function() {
    it('should set contentSizeCallback for custom dialogue rendering', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'render_test',
        content: {
          message: 'This is a test message'
        }
      });

      dialogue.trigger();

      expect(mockPanel.config.contentSizeCallback).to.be.a('function');
    });

    it('should render dialogue text with word wrapping', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const longMessage = 'This is a very long message that should be wrapped across multiple lines when rendered in the dialogue panel.';
      
      const dialogue = new DialogueEvent({
        id: 'wrap_test',
        content: {
          message: longMessage
        }
      });

      dialogue.trigger();

      const contentArea = { x: 100, y: 100, width: 400, height: 100 };
      mockPanel.config.contentSizeCallback(contentArea);

      // Should have called text() multiple times for wrapped lines
      expect(global.text.callCount).to.be.greaterThan(1);
    });

    it('should return content size from contentSizeCallback', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'size_test',
        content: {
          message: 'Test'
        }
      });

      dialogue.trigger();

      const contentArea = { x: 0, y: 0, width: 500, height: 200 };
      const size = mockPanel.config.contentSizeCallback(contentArea);

      expect(size).to.have.property('width');
      expect(size).to.have.property('height');
      expect(size.width).to.be.greaterThan(0);
      expect(size.height).to.be.greaterThan(0);
    });

    it('should use push/pop for rendering isolation', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'isolation_test',
        content: {
          message: 'Test'
        }
      });

      dialogue.trigger();

      const contentArea = { x: 0, y: 0, width: 500, height: 200 };
      mockPanel.config.contentSizeCallback(contentArea);

      expect(global.push.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
    });

    it('should set text properties for dialogue rendering', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'style_test',
        content: {
          message: 'Styled text'
        }
      });

      dialogue.trigger();

      const contentArea = { x: 0, y: 0, width: 500, height: 200 };
      mockPanel.config.contentSizeCallback(contentArea);

      expect(global.textSize.called).to.be.true;
      expect(global.textAlign.called).to.be.true;
      expect(global.fill.called).to.be.true;
    });
  });

  describe('Portrait Rendering (Future Extension)', function() {
    it('should render portrait if provided', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      // Mock image loading
      const mockPortrait = { width: 64, height: 64 };
      global.loadImage = sandbox.stub().returns(mockPortrait);
      
      const dialogue = new DialogueEvent({
        id: 'portrait_test',
        content: {
          speaker: 'Queen Ant',
          message: 'Greetings',
          portrait: 'Images/Characters/queen.png'
        }
      });

      dialogue.trigger();

      const contentArea = { x: 100, y: 100, width: 500, height: 200 };
      mockPanel.config.contentSizeCallback(contentArea);

      // Should attempt to draw portrait
      expect(global.image.called).to.be.true;
    });

    it('should reserve space for portrait in layout', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const mockPortrait = { width: 64, height: 64 };
      global.loadImage = sandbox.stub().returns(mockPortrait);
      
      const dialogue = new DialogueEvent({
        id: 'layout_test',
        content: {
          message: 'Test',
          portrait: 'Images/Characters/queen.png'
        }
      });

      dialogue.trigger();

      const contentArea = { x: 100, y: 100, width: 500, height: 200 };
      mockPanel.config.contentSizeCallback(contentArea);

      // Text should be offset to make room for portrait
      const textCalls = global.text.getCalls();
      if (textCalls.length > 0) {
        const textX = textCalls[0].args[1];
        expect(textX).to.be.greaterThan(contentArea.x + 64); // Portrait width offset
      }
    });
  });

  describe('Auto-Continue Behavior', function() {
    it('should auto-continue after delay if configured', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      global.millis.returns(1000);
      
      const dialogue = new DialogueEvent({
        id: 'auto_continue_test',
        content: {
          message: 'This dialogue auto-continues',
          autoContinue: true,
          autoContinueDelay: 3000
        }
      });

      dialogue.trigger();
      
      // Before delay
      global.millis.returns(3999);
      dialogue.update();
      expect(dialogue.completed).to.be.false;
      
      // After delay
      global.millis.returns(4000);
      dialogue.update();
      expect(dialogue.completed).to.be.true;
    });

    it('should not auto-continue if user has choices', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      global.millis.returns(1000);
      
      const dialogue = new DialogueEvent({
        id: 'no_auto_with_choices',
        content: {
          message: 'Choose',
          autoContinue: true,
          autoContinueDelay: 1000,
          choices: [
            { text: 'Option A' },
            { text: 'Option B' }
          ]
        }
      });

      dialogue.trigger();
      
      global.millis.returns(5000);
      dialogue.update();
      
      // Should not auto-complete with multiple choices
      expect(dialogue.completed).to.be.false;
    });
  });

  describe('Panel Reuse', function() {
    it('should reuse existing dialogue panel if available', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: { message: 'First' }
      });
      
      dialogue1.trigger();
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: { message: 'Second' }
      });
      
      dialogue2.trigger();

      // Should have called getOrCreatePanel twice with same ID
      expect(mockDraggablePanelManager.getOrCreatePanel.callCount).to.equal(2);
      expect(mockDraggablePanelManager.getOrCreatePanel.firstCall.args[0]).to.equal('dialogue-display');
      expect(mockDraggablePanelManager.getOrCreatePanel.secondCall.args[0]).to.equal('dialogue-display');
    });

    it('should update panel content for new dialogue', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue1 = new DialogueEvent({
        id: 'dialogue_1',
        content: {
          speaker: 'Speaker 1',
          message: 'Message 1'
        }
      });
      
      dialogue1.trigger();
      const firstConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      
      const dialogue2 = new DialogueEvent({
        id: 'dialogue_2',
        content: {
          speaker: 'Speaker 2',
          message: 'Message 2'
        }
      });
      
      dialogue2.trigger();
      const secondConfig = mockDraggablePanelManager.getOrCreatePanel.secondCall.args[1];

      expect(firstConfig.title).to.equal('Speaker 1');
      expect(secondConfig.title).to.equal('Speaker 2');
    });
  });

  describe('Integration with Event System', function() {
    it('should inherit from Event base class', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      if (typeof Event === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'inheritance_test',
        content: { message: 'Test' }
      });

      expect(dialogue).to.be.instanceOf(Event);
    });

    it('should support event priority', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const dialogue = new DialogueEvent({
        id: 'priority_test',
        content: { message: 'Important!' },
        priority: 1
      });

      expect(dialogue.priority).to.equal(1);
    });

    it('should support onTrigger callback', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const onTriggerSpy = sandbox.stub();
      
      const dialogue = new DialogueEvent({
        id: 'callback_test',
        content: { message: 'Test' },
        onTrigger: onTriggerSpy
      });

      dialogue.trigger();

      expect(onTriggerSpy.calledOnce).to.be.true;
    });

    it('should support onComplete callback', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const onCompleteSpy = sandbox.stub();
      
      const dialogue = new DialogueEvent({
        id: 'complete_callback_test',
        content: {
          message: 'Test',
          choices: [{ text: 'Done' }]
        },
        onComplete: onCompleteSpy
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      panelConfig.buttons.items[0].onClick();

      expect(onCompleteSpy.calledOnce).to.be.true;
    });
  });

  describe('JSON Configuration Loading', function() {
    it('should load from JSON event definition', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      const jsonConfig = {
        id: 'json_dialogue',
        type: 'dialogue',
        content: {
          speaker: 'Queen Ant',
          message: 'Welcome to JSON land!',
          choices: [
            { text: 'Hello!', nextEventId: 'greeting_response' }
          ]
        },
        priority: 5
      };

      const dialogue = new DialogueEvent(jsonConfig);

      expect(dialogue.id).to.equal('json_dialogue');
      expect(dialogue.content.speaker).to.equal('Queen Ant');
      expect(dialogue.content.message).to.equal('Welcome to JSON land!');
      expect(dialogue.content.choices).to.have.lengthOf(1);
      expect(dialogue.priority).to.equal(5);
    });
  });

  describe('Error Handling', function() {
    it('should handle missing eventManager gracefully', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      delete global.eventManager;
      if (typeof window !== 'undefined') {
        delete window.eventManager;
      }
      
      const mockPanel = {
        show: sandbox.stub(),
        hide: sandbox.stub(),
        config: {}
      };
      
      mockDraggablePanelManager.getOrCreatePanel.returns(mockPanel);
      
      const dialogue = new DialogueEvent({
        id: 'no_manager',
        content: {
          message: 'Test',
          choices: [{ text: 'OK' }]
        }
      });

      dialogue.trigger();
      
      const panelConfig = mockDraggablePanelManager.getOrCreatePanel.firstCall.args[1];
      
      // Should not throw when clicking choice
      expect(() => panelConfig.buttons.items[0].onClick()).to.not.throw();
    });

    it('should handle missing draggablePanelManager gracefully', function() {
      if (typeof DialogueEvent === 'undefined') return this.skip();
      
      delete global.draggablePanelManager;
      if (typeof window !== 'undefined') {
        delete window.draggablePanelManager;
      }
      
      const dialogue = new DialogueEvent({
        id: 'no_panel_manager',
        content: { message: 'Test' }
      });

      // Should not throw when triggering
      expect(() => dialogue.trigger()).to.not.throw();
    });
  });
});
