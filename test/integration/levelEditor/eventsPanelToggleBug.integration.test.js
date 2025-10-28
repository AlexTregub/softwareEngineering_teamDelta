/**
 * Integration Tests: Events Panel Toggle Bug
 * Tests for the bug where clicking Events button toggles panel on then immediately off
 * 
 * Bug Description:
 * - Click Events button in toolbar
 * - Panel toggles ON
 * - Panel immediately toggles OFF again
 * - Root cause: Multiple handlers processing the same click event
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupIntegrationTestEnvironment, cleanupIntegrationTestEnvironment } = require('../../helpers/integrationTestHelpers');

describe('Events Panel Toggle Bug - Integration Tests', function() {
  let terrain;
  let LevelEditor, EventEditorPanel, EventFlagLayer, EventFlag;
  let ToolBar, MaterialPalette, LevelEditorPanels;
  
  before(function() {
    setupIntegrationTestEnvironment();
    
    // Load REAL classes
    EventFlag = require('../../../Classes/events/EventFlag');
    EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    ToolBar = require('../../../Classes/ui/ToolBar');
    MaterialPalette = require('../../../Classes/ui/MaterialPalette');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    global.EventFlag = EventFlag;
    global.EventFlagLayer = EventFlagLayer;
    global.ToolBar = ToolBar;
    global.MaterialPalette = MaterialPalette;
    global.LevelEditorPanels = LevelEditorPanels;
    global.EventEditorPanel = EventEditorPanel;
    global.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Restore cameraManager if deleted
    if (!global.cameraManager) {
      global.cameraManager = {
        getZoom: () => 1,
        getPosition: () => ({ x: 0, y: 0 }),
        screenToWorld: (x, y) => ({ x, y }),
        worldToScreen: (x, y) => ({ x, y }),
        setPosition: sinon.stub(),
        setZoom: sinon.stub(),
        update: sinon.stub()
      };
    }
    
    // Create mock terrain
    terrain = {
      _xCount: 32,
      _yCount: 32,
      _tileSize: 32,
      grid: {
        get: sinon.stub().returns({ type: 0 }),
        set: sinon.stub()
      },
      getTileAtGridCoords: sinon.stub().returns({ type: 0 })
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  after(function() {
    cleanupIntegrationTestEnvironment();
  });
  
  describe('Panel Toggle State After Click', function() {
    it('should keep panel visible after clicking Events button', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Get panel initial state (should be hidden)
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      expect(panel).to.exist;
      expect(panel.state.visible).to.be.false;
      
      // Simulate clicking Events button in toolbar
      // Find the Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      // Events button is in the toolbar (need to find its Y position)
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Click the Events button (via levelEditorPanels which calls onClick)
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(handled).to.be.true;
      
      // Panel should NOW be visible
      expect(panel.state.visible).to.be.true;
    });
    
    it('should NOT toggle panel off if draggablePanelManager also processes click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // First click - toggle ON
      levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
      
      // Simulate draggablePanelManager ALSO processing the same click
      // This is what happens in LevelEditor.handleClick() - PRIORITY 5
      const panelConsumed = global.draggablePanelManager.handleMouseEvents(eventsButtonX, eventsButtonY, true);
      
      // Panel should STILL be visible (not toggled off)
      expect(panel.state.visible).to.be.true;
    });
    
    it('should maintain panel state through full handleClick flow', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      expect(panel.state.visible).to.be.false;
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Simulate the FULL click flow (as it happens in LevelEditor.handleClick)
      // PRIORITY 4: levelEditorPanels.handleClick
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      expect(handled).to.be.true;
      expect(panel.state.visible).to.be.true; // Panel should be ON
      
      // PRIORITY 5: draggablePanelManager.handleMouseEvents (this might toggle it off!)
      if (handled) {
        // If panel click was handled, draggablePanelManager should NOT process it
        // This is the bug: handleClick returns true but then draggablePanelManager STILL runs
      } else {
        const panelConsumed = global.draggablePanelManager.handleMouseEvents(eventsButtonX, eventsButtonY, true);
      }
      
      // Final state: Panel should STILL be visible
      expect(panel.state.visible).to.be.true;
    });
  });
  
  describe('Click Event Consumption', function() {
    it('should stop event propagation after levelEditorPanels handles click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Click Events button
      const handled = levelEditor.levelEditorPanels.handleClick(eventsButtonX, eventsButtonY);
      
      // If handled is true, LevelEditor.handleClick should RETURN early
      // and NOT call draggablePanelManager.handleMouseEvents
      expect(handled).to.be.true;
    });
    
    it('should return early from LevelEditor.handleClick if panel handled click', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      // Spy on draggablePanelManager.handleMouseEvents
      const handleMouseEventsSpy = sinon.spy(global.draggablePanelManager, 'handleMouseEvents');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Call LevelEditor.handleClick (full flow)
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      
      // draggablePanelManager.handleMouseEvents should NOT be called
      // because levelEditorPanels.handleClick returned true
      expect(handleMouseEventsSpy.called).to.be.false;
    });
  });
  
  describe('Multiple Toggle Clicks', function() {
    it('should toggle panel on → off → on correctly', function() {
      const levelEditor = new LevelEditor();
      levelEditor.initialize(terrain);
      
      const panel = global.draggablePanelManager.panels.get('level-editor-events');
      
      // Get Events button coordinates
      const toolsPanel = global.draggablePanelManager.panels.get('level-editor-tools');
      const toolPos = toolsPanel.getPosition();
      const titleBarHeight = toolsPanel.calculateTitleBarHeight();
      const contentX = toolPos.x + toolsPanel.config.style.padding;
      const contentY = toolPos.y + titleBarHeight + toolsPanel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      const tools = levelEditor.toolbar.getAllTools();
      const eventsIndex = tools.indexOf('events');
      const eventsButtonY = contentY + spacing + eventsIndex * (buttonSize + spacing) + buttonSize / 2;
      const eventsButtonX = contentX + spacing + buttonSize / 2;
      
      // Initial: hidden
      expect(panel.state.visible).to.be.false;
      
      // Click 1: Show
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
      
      // Click 2: Hide
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.false;
      
      // Click 3: Show again
      levelEditor.handleClick(eventsButtonX, eventsButtonY);
      expect(panel.state.visible).to.be.true;
    });
  });
});
