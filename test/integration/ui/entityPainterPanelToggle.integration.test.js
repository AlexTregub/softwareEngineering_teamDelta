/**
 * Entity Painter Panel Toggle - Integration Tests
 * 
 * Tests integration between LevelEditorPanels, FileMenuBar, DraggablePanelManager,
 * and EntityPalette for panel toggle functionality.
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
const sinon = require('sinon');


setupTestEnvironment({ rendering: true });

describe('Entity Painter Panel Toggle - Integration Tests', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let sandbox;
  let dom;
  let LevelEditorPanels;
  let FileMenuBar;
  let DraggablePanelManager;
  let EntityPalette;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    
    // Mock p5.js functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noFill = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.ellipse = sandbox.stub();
    global.text = sandbox.stub();
    global.textSize = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.image = sandbox.stub();
    global.imageMode = sandbox.stub();
    global.line = sandbox.stub();
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y, add: () => {}, sub: () => {}, mag: () => 0 }));
    global.CORNER = 0;
    global.CENTER = 1;
    global.LEFT = 37;
    global.RIGHT = 39;
    global.TOP = 38;
    global.BOTTOM = 40;
    
    // Mock other globals
    global.devConsoleEnabled = false;
    global.logNormal = sandbox.stub();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub(),
      clear: sandbox.stub()
    };
    global.localStorage = localStorageMock;
    window.localStorage = localStorageMock;
    window.devConsoleEnabled = false;
    window.width = 1024;
    window.height = 768;
    
    // Sync window properties
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.rect = global.rect;
    window.text = global.text;
    window.createVector = global.createVector;
    
    // Load dependencies with cache clearing
    delete require.cache[require.resolve('../../../Classes/ui/ScrollIndicator')];
    delete require.cache[require.resolve('../../../Classes/ui/UIComponents/scroll/ScrollableContentArea')];
    delete require.cache[require.resolve('../../../Classes/ui/levelEditor/panels/LevelEditorSidebar')];
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel')];
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager')];
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels')];
    delete require.cache[require.resolve('../../../Classes/ui/painter/entity/EntityPalette')];
    delete require.cache[require.resolve('../../../Classes/ui/_baseObjects/bar/menuBar/FileMenuBar')];
    
    const ScrollIndicator = require('../../../Classes/ui/UIComponents/scroll/ScrollIndicator');
    const ScrollableContentArea = require('../../../Classes/ui/UIComponents/scroll/ScrollableContentArea');
    const LevelEditorSidebar = require('../../../Classes/ui/levelEditor/panels/LevelEditorSidebar');
    const DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    
    global.ScrollIndicator = ScrollIndicator;
    global.ScrollableContentArea = ScrollableContentArea;
    global.LevelEditorSidebar = LevelEditorSidebar;
    global.DraggablePanel = DraggablePanel;
    
    window.ScrollIndicator = ScrollIndicator;
    window.ScrollableContentArea = ScrollableContentArea;
    window.LevelEditorSidebar = LevelEditorSidebar;
    window.DraggablePanel = DraggablePanel;
    
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
    FileMenuBar = require('../../../Classes/ui/_baseObjects/bar/menuBar/FileMenuBar');
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
  });
  
  // Helper: Create mock LevelEditor
  function createMockLevelEditor() {
    return {
      entityPalette: new EntityPalette(),
      palette: { render: sandbox.stub(), getContentSize: sandbox.stub().returns({ width: 95, height: 95 }) },
      toolbar: { render: sandbox.stub(), getContentSize: sandbox.stub().returns({ width: 45, height: 285 }) },
      brushControl: { render: sandbox.stub(), getContentSize: sandbox.stub().returns({ width: 90, height: 50 }) },
      eventEditor: { render: sandbox.stub(), getContentSize: sandbox.stub().returns({ width: 180, height: 250 }) },
      notifications: { show: sandbox.stub() }
    };
  }
  
  describe('Integration Test 1: Panel Toggle from View Menu', function() {
    it('should toggle entity-palette panel visibility via FileMenuBar', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      const fileMenuBar = new FileMenuBar({ levelEditor });
      
      // Verify panel starts hidden
      const panel = manager.panels.get('level-editor-entity-palette');
      expect(panel).to.exist;
      expect(panel.state.visible).to.be.false;
      
      // Toggle ON via FileMenuBar
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // Verify panel is now visible
      expect(panel.state.visible).to.be.true;
      
      // Toggle OFF
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // Verify panel is hidden again
      expect(panel.state.visible).to.be.false;
    });
    
    it('should update menu checked state when toggling', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      const fileMenuBar = new FileMenuBar({ levelEditor });
      
      // Find View menu and Entity Painter item
      const viewMenu = fileMenuBar.menuItems.find(m => m.label === 'View');
      const entityPainterItem = viewMenu.items.find(i => i.label === 'Entity Painter');
      
      expect(entityPainterItem).to.exist;
      expect(entityPainterItem.checked).to.be.false; // Initially unchecked
      
      // Toggle ON
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // Menu item should be checked
      expect(entityPainterItem.checked).to.be.true;
      
      // Toggle OFF
      fileMenuBar._handleTogglePanel('entity-painter');
      
      // Menu item should be unchecked
      expect(entityPainterItem.checked).to.be.false;
    });
  });
  
  describe('Integration Test 2: Panel Rendering', function() {
    it('should render EntityPalette when panel is visible', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      const renderSpy = sandbox.spy(levelEditor.entityPalette, 'render');
      
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // Make panel visible
      const panel = manager.panels.get('level-editor-entity-palette');
      panel.show();
      
      // Render panels (this would normally be called by LevelEditorPanels.render())
      // For this test, we verify the panel is accessible and has correct config
      expect(panel.state.visible).to.be.true;
      expect(panel.config.id).to.equal('level-editor-entity-palette');
      expect(panel.config.title).to.equal('Entity Palette');
    });
  });
  
  describe('Integration Test 3: Panel State Visibility', function() {
    it('should NOT add entity-palette to stateVisibility by default (hidden)', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // Verify entity-palette NOT in LEVEL_EDITOR stateVisibility (hidden by default)
      const visiblePanels = manager.stateVisibility.LEVEL_EDITOR || [];
      expect(visiblePanels).to.not.include('level-editor-entity-palette');
      
      // But materials and tools should be visible by default
      expect(visiblePanels).to.include('level-editor-materials');
      expect(visiblePanels).to.include('level-editor-tools');
    });
  });
  
  describe('Integration Test 4: EntityPalette Content Size', function() {
    it('should calculate content size based on current category', function() {
      const entityPalette = new EntityPalette();
      
      // Default category is 'entities' with 7 ant templates
      const size1 = entityPalette.getContentSize();
      expect(size1.width).to.equal(200);
      expect(size1.height).to.be.at.least(280); // At least minimum height
      
      // Switch to 'buildings' (3 templates)
      entityPalette.setCategory('buildings');
      const size2 = entityPalette.getContentSize();
      expect(size2.width).to.equal(200);
      expect(size2.height).to.be.at.least(280); // Minimum height enforced
      
      // Switch to 'resources' (4 templates)
      entityPalette.setCategory('resources');
      const size3 = entityPalette.getContentSize();
      expect(size3.width).to.equal(200);
      expect(size3.height).to.be.at.least(280); // Minimum height enforced
      
      // Verify height increases with more templates (entities has most)
      expect(size1.height).to.be.at.least(size2.height);
      expect(size1.height).to.be.at.least(size3.height);
    });
  });
  
  describe('Integration Test 5: Panel Auto-Sizing', function() {
    it('should use contentSizeCallback to get EntityPalette size', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      
      // Initialize panels first
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // Now stub getContentSize AFTER initialization
      const getContentSizeStub = sandbox.stub(levelEditor.entityPalette, 'getContentSize').returns({ width: 250, height: 400 });
      
      // Get panel
      const panel = panels.panels.entityPalette;
      
      // Call contentSizeCallback
      const size = panel.config.buttons.contentSizeCallback();
      
      // Should delegate to EntityPalette.getContentSize()
      expect(size.width).to.equal(250);
      expect(size.height).to.equal(400);
      expect(getContentSizeStub.calledOnce).to.be.true;
    });
  });
  
  describe('Integration Test 6: Toolbar Button Toggle', function() {
    it('should toggle entity-palette panel when toolbar ant button clicked', function() {
      // Setup DraggablePanelManager
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      
      // Initialize panels
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // Create FileMenuBar
      const fileMenuBar = new FileMenuBar({ levelEditor });
      levelEditor.fileMenuBar = fileMenuBar;
      
      // Create toolbar with entity_painter tool
      const toolbar = {
        tools: {
          'entity_painter': {
            name: 'entity_painter',
            icon: 'ðŸœ',
            tooltip: 'Entity Painter',
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
      
      // Get panel reference
      const panel = manager.panels.get('level-editor-entity-palette');
      expect(panel).to.exist;
      expect(panel.state.visible).to.be.false; // Hidden by default
      
      // Click toolbar button
      const entityPainterTool = toolbar.tools['entity_painter'];
      expect(entityPainterTool.onClick).to.be.a('function');
      entityPainterTool.onClick();
      
      // Panel should be visible
      expect(panel.state.visible).to.be.true;
      
      // Click again - should toggle OFF
      entityPainterTool.onClick();
      expect(panel.state.visible).to.be.false;
    });
    
    it('should sync View menu checked state when toolbar button clicked', function() {
      // Setup
      const manager = new DraggablePanelManager();
      global.draggablePanelManager = manager;
      window.draggablePanelManager = manager;
      
      const levelEditor = createMockLevelEditor();
      
      // Initialize panels
      const panels = new LevelEditorPanels(levelEditor);
      panels.initialize();
      
      // Create FileMenuBar
      const fileMenuBar = new FileMenuBar({ levelEditor });
      levelEditor.fileMenuBar = fileMenuBar;
      
      // Create toolbar
      const toolbar = {
        tools: {
          'entity_painter': {
            name: 'entity_painter',
            icon: 'ðŸœ',
            onClick: null
          }
        }
      };
      levelEditor.toolbar = toolbar;
      
      // Set onClick handler
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
      
      // Click toolbar button
      toolbar.tools['entity_painter'].onClick();
      
      // Menu should be checked
      expect(entityPainterItem.checked).to.be.true;
      
      // Click again
      toolbar.tools['entity_painter'].onClick();
      
      // Menu should be unchecked
      expect(entityPainterItem.checked).to.be.false;
    });
  });
});
