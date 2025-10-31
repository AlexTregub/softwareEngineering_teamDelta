/**
 * Entity Painter Panel Bug Fix - Unit Tests
 * 
 * Tests for EntityPalette panel creation in LevelEditorPanels
 * and FileMenuBar panel ID mapping.
 * 
 * TDD Red Phase: All tests should FAIL initially (panel doesn't exist yet)
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js functions
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, add: () => {}, sub: () => {}, mag: () => 0 }));
global.push = sinon.stub();
global.pop = sinon.stub();
global.fill = sinon.stub();
global.noFill = sinon.stub();
global.stroke = sinon.stub();
global.noStroke = sinon.stub();
global.rect = sinon.stub();
global.ellipse = sinon.stub();
global.text = sinon.stub();
global.textSize = sinon.stub();
global.textAlign = sinon.stub();
global.image = sinon.stub();
global.imageMode = sinon.stub();
global.CORNER = 0;
global.CENTER = 1;
global.LEFT = 37;
global.RIGHT = 39;
global.TOP = 38;
global.BOTTOM = 40;

// Mock other globals needed by DraggablePanel
global.devConsoleEnabled = false;
global.localStorage = {
  getItem: sinon.stub().returns(null),
  setItem: sinon.stub(),
  removeItem: sinon.stub()
};
global.logNormal = sinon.stub();

// Mock window object
global.window = {
  width: 1024,
  height: 768,
  localStorage: global.localStorage
};

// Sync window and global
if (typeof window !== 'undefined') {
  window.createVector = global.createVector;
  window.push = global.push;
  window.pop = global.pop;
  window.fill = global.fill;
  window.stroke = global.stroke;
  window.rect = global.rect;
  window.text = global.text;
  window.devConsoleEnabled = global.devConsoleEnabled;
  window.localStorage = global.localStorage;
}

// Load classes
const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
const LevelEditorSidebar = require('../../../Classes/ui/LevelEditorSidebar');
const DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
const DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
const EntityPalette = require('../../../Classes/ui/EntityPalette');
const FileMenuBar = require('../../../Classes/ui/FileMenuBar');

// Make classes globally available (LevelEditorPanels needs them)
if (typeof global !== 'undefined') {
  global.ScrollIndicator = ScrollIndicator;
  global.ScrollableContentArea = ScrollableContentArea;
  global.LevelEditorSidebar = LevelEditorSidebar;
  global.DraggablePanel = DraggablePanel;
}
if (typeof window !== 'undefined') {
  window.ScrollIndicator = ScrollIndicator;
  window.ScrollableContentArea = ScrollableContentArea;
  window.LevelEditorSidebar = LevelEditorSidebar;
  window.DraggablePanel = DraggablePanel;
}

describe('Entity Painter Panel Bug Fix - Unit Tests', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Reset stubs
    global.push.resetHistory();
    global.pop.resetHistory();
    global.fill.resetHistory();
    global.stroke.resetHistory();
    global.rect.resetHistory();
    global.text.resetHistory();
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  // Helper: Create mock LevelEditor
  function createMockLevelEditor() {
    return {
      entityPalette: new EntityPalette(),
      palette: { render: sinon.stub(), getContentSize: sinon.stub().returns({ width: 95, height: 95 }) },
      toolbar: { render: sinon.stub(), getContentSize: sinon.stub().returns({ width: 45, height: 285 }) },
      brushControl: { render: sinon.stub(), getContentSize: sinon.stub().returns({ width: 90, height: 50 }) },
      eventEditor: { render: sinon.stub(), getContentSize: sinon.stub().returns({ width: 180, height: 250 }) },
      notifications: { show: sinon.stub() }
    };
  }
  
  // Helper: Create mock DraggablePanelManager
  function createMockDraggablePanelManager() {
    const manager = {
      panels: new Map(),
      stateVisibility: {
        LEVEL_EDITOR: []
      },
      togglePanel: sinon.stub().returns(true),
      setStateVisibility: sinon.stub()
    };
    
    // Make it globally available
    if (typeof global !== 'undefined') global.draggablePanelManager = manager;
    if (typeof window !== 'undefined') window.draggablePanelManager = manager;
    
    return manager;
  }
  
  describe('EntityPalette Panel Creation', function() {
    it('should create entityPalette panel in LevelEditorPanels', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // TEST WILL FAIL: panels.entityPalette doesn't exist yet
      expect(panels.panels.entityPalette).to.exist;
      expect(panels.panels.entityPalette.config.id).to.equal('level-editor-entity-palette');
    });
    
    it('should register entity-palette with draggablePanelManager', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // TEST WILL FAIL: Panel not registered
      const registered = mockManager.panels.has('level-editor-entity-palette');
      expect(registered).to.be.true;
    });
    
    it('should configure entity-palette as hidden by default', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // TEST WILL FAIL: Panel doesn't exist
      const panel = panels.panels.entityPalette;
      expect(panel).to.exist;
      expect(panel.state.visible).to.be.false; // Hidden by default
    });
    
    it('should configure entity-palette with correct properties', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // TEST WILL FAIL: Panel doesn't exist
      const panel = panels.panels.entityPalette;
      expect(panel).to.exist;
      expect(panel.config.title).to.equal('Entity Palette');
      expect(panel.config.behavior.draggable).to.be.true;
      expect(panel.config.behavior.managedExternally).to.be.true;
    });
    
    it('should have contentSizeCallback that delegates to EntityPalette', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      levelEditor.entityPalette.getContentSize = sinon.stub().returns({ width: 200, height: 280 });
      
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // TEST WILL FAIL: Panel doesn't exist
      const panel = panels.panels.entityPalette;
      expect(panel).to.exist;
      expect(panel.config.buttons.contentSizeCallback).to.be.a('function');
      
      const size = panel.config.buttons.contentSizeCallback();
      expect(size.width).to.equal(200);
      expect(size.height).to.equal(280);
    });
  });
  
  describe('FileMenuBar Entity Painter Toggle', function() {
    it('should have entity-painter in panelIdMap', function() {
      // This test verifies the panelIdMap internal structure
      // Since _handleTogglePanel is private, we test via integration
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      
      // Create a mock panel to toggle
      const mockPanel = {
        state: { visible: false },
        toggleVisibility: sinon.stub(),
        isVisible: sinon.stub().returns(true)
      };
      mockManager.panels.set('level-editor-entity-palette', mockPanel);
      mockManager.togglePanel.returns(true);
      
      const fileMenuBar = new FileMenuBar({ levelEditor });
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // TEST WILL FAIL: panelIdMap['entity-painter'] is undefined
      // So togglePanel won't be called with correct ID
      expect(mockManager.togglePanel.calledWith('level-editor-entity-palette')).to.be.true;
    });
    
    it('should update menu checked state when toggling entity-painter', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      
      // Create mock panel
      const mockPanel = {
        state: { visible: false },
        toggleVisibility: sinon.stub(),
        isVisible: sinon.stub().returns(true)
      };
      mockManager.panels.set('level-editor-entity-palette', mockPanel);
      mockManager.togglePanel.returns(true);
      
      const fileMenuBar = new FileMenuBar({ levelEditor });
      
      // Find View menu and Entity Painter item
      const viewMenu = fileMenuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      expect(entityPainterItem).to.exist;
      expect(entityPainterItem.checked).to.be.false; // Initially unchecked
      
      // Toggle panel
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // TEST WILL FAIL: checked state won't update because panelId is undefined
      expect(entityPainterItem.checked).to.be.true;
    });
  });
  
  describe('EntityPalette Instance Verification', function() {
    it('should have EntityPalette instance in LevelEditor', function() {
      const levelEditor = createMockLevelEditor();
      
      expect(levelEditor.entityPalette).to.exist;
      expect(levelEditor.entityPalette).to.be.instanceOf(EntityPalette);
      expect(typeof levelEditor.entityPalette.render).to.equal('function');
      expect(typeof levelEditor.entityPalette.handleClick).to.equal('function');
      expect(typeof levelEditor.entityPalette.getContentSize).to.equal('function');
    });
  });
  
  describe('Toolbar Button Toggle', function() {
    it('should toggle entity-palette panel when ant button clicked', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      
      // Create mock panel
      const mockPanel = {
        state: { visible: false },
        toggleVisibility: sinon.stub(),
        isVisible: sinon.stub().returns(false)
      };
      mockManager.panels.set('level-editor-entity-palette', mockPanel);
      mockManager.togglePanel = sinon.stub().returns(true);
      
      // Create toolbar with entity-painter tool (matching ToolBar structure)
      const toolbar = {
        tools: {
          'entity_painter': {
            name: 'entity_painter',
            icon: '🐜',
            tooltip: 'Entity Painter',
            onClick: null
          }
        }
      };
      levelEditor.toolbar = toolbar;
      
      // Create FileMenuBar (needed for toggle logic)
      const fileMenuBar = new FileMenuBar({ levelEditor });
      levelEditor.fileMenuBar = fileMenuBar;
      
      // Simulate LevelEditor initialization logic (sets onClick handler)
      if (toolbar.tools && toolbar.tools['entity_painter']) {
        toolbar.tools['entity_painter'].onClick = () => {
          if (levelEditor.fileMenuBar) {
            levelEditor.fileMenuBar._handleTogglePanel('entity-painter');
          }
        };
      }
      
      // Get entity_painter tool
      const entityPainterTool = toolbar.tools['entity_painter'];
      expect(entityPainterTool).to.exist;
      
      // Verify onClick handler is set
      expect(entityPainterTool.onClick).to.be.a('function');
      
      // Click entity_painter tool (should toggle panel)
      entityPainterTool.onClick();
      
      // Verify panel was toggled
      expect(mockManager.togglePanel.calledWith('level-editor-entity-palette')).to.be.true;
    });
    
    it('should sync View menu checked state when toolbar button clicked', function() {
      const mockManager = createMockDraggablePanelManager();
      const levelEditor = createMockLevelEditor();
      
      // Create mock panel
      const mockPanel = {
        state: { visible: false },
        show: sinon.stub(),
        isVisible: sinon.stub().returns(true)
      };
      mockManager.panels.set('level-editor-entity-palette', mockPanel);
      mockManager.togglePanel = sinon.stub().returns(true);
      
      // Create FileMenuBar
      const fileMenuBar = new FileMenuBar({ levelEditor });
      levelEditor.fileMenuBar = fileMenuBar;
      
      // Create toolbar with entity_painter tool
      const toolbar = {
        tools: {
          'entity_painter': {
            name: 'entity_painter',
            icon: '🐜',
            onClick: null
          }
        }
      };
      levelEditor.toolbar = toolbar;
      
      // Simulate LevelEditor initialization (sets onClick handler)
      if (toolbar.tools && toolbar.tools['entity_painter']) {
        toolbar.tools['entity_painter'].onClick = () => {
          if (levelEditor.fileMenuBar) {
            levelEditor.fileMenuBar._handleTogglePanel('entity-painter');
          }
        };
      }
      
      // Find View menu item
      const viewMenu = fileMenuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      expect(entityPainterItem.checked).to.be.false; // Initially unchecked
      
      // Get entity_painter tool
      const entityPainterTool = toolbar.tools['entity_painter'];
      
      // Verify onClick handler is set
      expect(entityPainterTool.onClick).to.be.a('function');
      
      // Click tool (should toggle panel AND sync menu state)
      entityPainterTool.onClick();
      
      // Verify menu state synced
      expect(entityPainterItem.checked).to.be.true;
    });
  });
});
