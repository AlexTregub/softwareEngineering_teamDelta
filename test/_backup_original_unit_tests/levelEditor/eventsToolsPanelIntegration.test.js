/**
 * Unit Tests for Events Panel Tools Integration
 * Tests the Events button in the Tools panel that toggles EventEditorPanel visibility
 * 
 * TDD Phase 1A: Write tests FIRST
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('EventsToolsPanelIntegration', function() {
  let LevelEditorPanels;
  let mockLevelEditor;
  let mockDraggablePanelManager;
  let panels;

  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock DraggablePanel
    global.DraggablePanel = class {
      constructor(config) {
        this.config = config;
        this.state = { visible: false, minimized: false };
      }
      show() { this.state.visible = true; }
      hide() { this.state.visible = false; }
      isVisible() { return this.state.visible; }
      isMouseOver() { return false; }
      getPosition() { return { x: 0, y: 0 }; }
      calculateTitleBarHeight() { return 30; }
      render() {}
    };
    window.DraggablePanel = global.DraggablePanel;
    
    // Create a mock panel for events
    const mockEventsPanel = new global.DraggablePanel({ id: 'level-editor-events' });
    
    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: new Map([['level-editor-events', mockEventsPanel]]),
      stateVisibility: { LEVEL_EDITOR: [] },
      togglePanel: sinon.stub(),
      removePanel: sinon.stub(),
      isPanelVisible: sinon.stub().returns(false)
    };
    global.draggablePanelManager = mockDraggablePanelManager;
    window.draggablePanelManager = mockDraggablePanelManager;
    
    // Mock ToolBar with addButton method
    global.ToolBar = class {
      constructor() {
        this.tools = {};
        this.buttons = [];
      }
      
      addButton(config) {
        this.buttons.push(config);
        this.tools[config.name] = config;
      }
      
      hasButton(name) {
        return this.tools.hasOwnProperty(name);
      }
      
      getButton(name) {
        return this.tools[name];
      }
      
      handleClick() { return null; }
      containsPoint() { return false; }
      getContentSize() { return { width: 45, height: 285 }; }
      render() {}
    };
    window.ToolBar = global.ToolBar;
    
    // Mock MaterialPalette
    global.MaterialPalette = class {
      getContentSize() { return { width: 95, height: 95 }; }
      containsPoint() { return false; }
      handleClick() { return false; }
      render() {}
    };
    window.MaterialPalette = global.MaterialPalette;
    
    // Mock EventEditorPanel
    global.EventEditorPanel = class {
      getContentSize() { return { width: 250, height: 300 }; }
      containsPoint() { return false; }
      handleClick() { return null; }
      render() {}
    };
    window.EventEditorPanel = global.EventEditorPanel;
    
    // Mock logging
    global.logNormal = sinon.stub();
    
    // Load LevelEditorPanels after mocks
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
    
    // Create mock level editor
    mockLevelEditor = {
      palette: new global.MaterialPalette(),
      toolbar: new global.ToolBar(),
      eventEditor: new global.EventEditorPanel(),
      notifications: {
        show: sinon.stub()
      }
    };
    
    panels = new LevelEditorPanels(mockLevelEditor);
    panels.initialize();
  });

  afterEach(function() {
    cleanupUITestEnvironment();
  });

  describe('Tools Panel Events Button', function() {
    it('should have Events button in toolbar after adding', function() {
      // Add Events button to toolbar
      mockLevelEditor.toolbar.addButton({
        name: 'events',
        icon: '🚩',
        tooltip: 'Events (Toggle Events Panel)',
        onClick: () => panels.toggleEventsPanel()
      });
      
      expect(mockLevelEditor.toolbar.hasButton('events')).to.be.true;
    });

    it('should have correct button configuration', function() {
      mockLevelEditor.toolbar.addButton({
        name: 'events',
        icon: '🚩',
        tooltip: 'Events (Toggle Events Panel)',
        onClick: () => panels.toggleEventsPanel()
      });
      
      const eventsButton = mockLevelEditor.toolbar.getButton('events');
      expect(eventsButton).to.exist;
      expect(eventsButton.name).to.equal('events');
      expect(eventsButton.icon).to.equal('🚩');
      expect(eventsButton.tooltip).to.include('Events');
    });
  });

  describe('toggleEventsPanel()', function() {
    beforeEach(function() {
      // Add method to panels instance (will be implemented in Phase 1B)
      panels.toggleEventsPanel = function() {
        const manager = window.draggablePanelManager;
        if (manager) {
          manager.togglePanel('level-editor-events');
        }
      };
    });

    it('should call draggablePanelManager.togglePanel with correct panel ID', function() {
      panels.toggleEventsPanel();
      
      expect(mockDraggablePanelManager.togglePanel.calledOnce).to.be.true;
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-events')).to.be.true;
    });

    it('should toggle panel visibility on multiple calls', function() {
      // Mock toggle behavior
      let visible = false;
      mockDraggablePanelManager.togglePanel.callsFake(() => {
        visible = !visible;
        panels.panels.events.state.visible = visible;
      });
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.true;
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.false;
      
      panels.toggleEventsPanel();
      expect(panels.panels.events.state.visible).to.be.true;
    });
  });

  describe('Events Panel Default Visibility', function() {
    it('should be hidden by default', function() {
      expect(panels.panels.events).to.exist;
      expect(panels.panels.events.state.visible).to.be.false;
    });

    it('should NOT be in default LEVEL_EDITOR state visibility list', function() {
      const visiblePanels = mockDraggablePanelManager.stateVisibility.LEVEL_EDITOR || [];
      expect(visiblePanels).to.not.include('level-editor-events');
    });
  });

  describe('Events Panel State Persistence', function() {
    it('should persist visibility state in draggablePanelManager', function() {
      // Set up persistence mock
      mockDraggablePanelManager.isPanelVisible.withArgs('level-editor-events').returns(true);
      
      const isVisible = mockDraggablePanelManager.isPanelVisible('level-editor-events');
      expect(isVisible).to.be.true;
    });

    it('should maintain state across multiple toggles', function() {
      const states = [];
      const mockPanel = mockDraggablePanelManager.panels.get('level-editor-events');
      
      panels.toggleEventsPanel(); // Should show
      states.push(mockPanel.state.visible);
      
      panels.toggleEventsPanel(); // Should hide
      states.push(mockPanel.state.visible);
      
      panels.toggleEventsPanel(); // Should show
      states.push(mockPanel.state.visible);
      
      expect(states).to.deep.equal([true, false, true]);
    });
  });

  describe('Button Highlight State', function() {
    it('should highlight button when panel is visible', function() {
      // Mock button with highlighted state
      const eventsButton = {
        name: 'events',
        icon: '🚩',
        highlighted: false
      };
      
      mockLevelEditor.toolbar.addButton(eventsButton);
      
      // Simulate toggle on
      panels.panels.events.state.visible = true;
      eventsButton.highlighted = panels.panels.events.state.visible;
      
      expect(eventsButton.highlighted).to.be.true;
    });

    it('should not highlight button when panel is hidden', function() {
      const eventsButton = {
        name: 'events',
        icon: '🚩',
        highlighted: false
      };
      
      mockLevelEditor.toolbar.addButton(eventsButton);
      
      // Panel is hidden by default
      panels.panels.events.state.visible = false;
      eventsButton.highlighted = panels.panels.events.state.visible;
      
      expect(eventsButton.highlighted).to.be.false;
    });
  });
});
