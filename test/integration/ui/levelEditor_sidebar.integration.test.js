/**
 * Integration Tests: LevelEditor - Sidebar Integration
 * 
 * Tests integration between LevelEditor and LevelEditorSidebar component.
 * Verifies mouse wheel delegation, click delegation, and sidebar instance wiring.
 * 
 * TDD Phase: Write tests FIRST, then implement in LevelEditor.js
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor - Sidebar Integration', function() {
  let sandbox;
  let LevelEditor;
  let mockLevelEditorPanels;
  let mockSidebar;
  let mockDraggablePanelManager;
  let mockTerrainEditor;

  // Helper to create mock terrain
  function createMockTerrain() {
    return {
      tileSize: 32,
      getAllTiles: sandbox.stub().returns([])
    };
  }

  // Helper to add convertScreenToWorld mock to editor
  function mockConvertScreenToWorld(editor) {
    editor.convertScreenToWorld = sandbox.stub().callsFake((x, y) => ({
      worldX: x || 0,
      worldY: y || 0
    }));
  }

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock p5.js functions
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }));
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.line = sandbox.stub();
    global.image = sandbox.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.RIGHT = 'right';

    // Sync to window
    window.createVector = global.createVector;
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.noStroke = global.noStroke;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.line = global.line;
    window.image = global.image;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;
    window.RIGHT = global.RIGHT;

    // Mock environment
    global.devConsoleEnabled = false;
    global.logNormal = sandbox.stub();
    global.logVerbose = sandbox.stub();
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };
    window.width = 1920;
    window.height = 1080;

    // Mock sidebar instance (what levelEditorPanels.sidebar should be)
    mockSidebar = {
      handleMouseWheel: sandbox.stub().returns(true),
      handleClick: sandbox.stub().returns(null),
      render: sandbox.stub(),
      getWidth: sandbox.stub().returns(300),
      getHeight: sandbox.stub().returns(600),
      isVisible: sandbox.stub().returns(true)
    };

    // Mock LevelEditorPanels with sidebar
    mockLevelEditorPanels = {
      initialize: sandbox.stub(),
      render: sandbox.stub(),
      handleClick: sandbox.stub().returns(false),
      handleMouseWheel: sandbox.stub().returns(false),
      sidebar: mockSidebar, // Sidebar instance
      panels: {
        sidebar: {
          state: { visible: true, minimized: false },
          getPosition: sandbox.stub().returns({ x: 1600, y: 80 }),
          getSize: sandbox.stub().returns({ width: 300, height: 600 })
        }
      }
    };

    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: new Map(),
      stateVisibility: { LEVEL_EDITOR: [] },
      register: sandbox.stub(),
      getPanel: sandbox.stub(),
      setStateVisibility: sandbox.stub(),
      handleMouseEvents: sandbox.stub().returns(false)
    };
    global.draggablePanelManager = mockDraggablePanelManager;
    window.draggablePanelManager = mockDraggablePanelManager;

    // Mock TerrainEditor
    mockTerrainEditor = {
      initialize: sandbox.stub(),
      render: sandbox.stub(),
      handleClick: sandbox.stub().returns(false),
      update: sandbox.stub(),
      setBrushSize: sandbox.stub(),
      getBrushSize: sandbox.stub().returns(1),
      selectMaterial: sandbox.stub(),
      paint: sandbox.stub(),
      canUndo: sandbox.stub().returns(false),
      canRedo: sandbox.stub().returns(false)
    };
    global.TerrainEditor = sandbox.stub().returns(mockTerrainEditor);
    window.TerrainEditor = global.TerrainEditor;

    // Mock MaterialPalette
    const mockPalette = {
      selectMaterial: sandbox.stub(),
      getSelectedMaterial: sandbox.stub().returns('grass'),
      render: sandbox.stub()
    };
    global.MaterialPalette = sandbox.stub().returns(mockPalette);
    window.MaterialPalette = global.MaterialPalette;

    // Mock ToolBar
    const mockToolbar = {
      selectTool: sandbox.stub(),
      getSelectedTool: sandbox.stub().returns('paint'),
      addButton: sandbox.stub(),
      render: sandbox.stub(),
      handleClick: sandbox.stub().returns(false),
      setEnabled: sandbox.stub(),
      onToolChange: null
    };
    global.ToolBar = sandbox.stub().returns(mockToolbar);
    window.ToolBar = global.ToolBar;

    // Mock EventEditorPanel
    const mockEventEditor = {
      initialize: sandbox.stub(),
      render: sandbox.stub(),
      handleClick: sandbox.stub().returns(false)
    };
    global.EventEditorPanel = sandbox.stub().returns(mockEventEditor);
    window.EventEditorPanel = global.EventEditorPanel;

    // Mock EventFlagLayer
    const mockEventFlagLayer = {};
    global.EventFlagLayer = sandbox.stub().returns(mockEventFlagLayer);
    window.EventFlagLayer = global.EventFlagLayer;

    // Mock MiniMap
    const mockMinimap = {
      render: sandbox.stub()
    };
    global.MiniMap = sandbox.stub().returns(mockMinimap);
    window.MiniMap = global.MiniMap;

    // Mock PropertiesPanel
    const mockPropertiesPanel = {
      setTerrain: sandbox.stub(),
      setEditor: sandbox.stub(),
      render: sandbox.stub()
    };
    global.PropertiesPanel = sandbox.stub().returns(mockPropertiesPanel);
    window.PropertiesPanel = global.PropertiesPanel;

    // Mock DynamicGridOverlay
    const mockGridOverlay = {
      render: sandbox.stub()
    };
    global.DynamicGridOverlay = sandbox.stub().returns(mockGridOverlay);
    window.DynamicGridOverlay = global.DynamicGridOverlay;

    // Mock SaveDialog / LoadDialog
    const mockSaveDialog = {
      hide: sandbox.stub(),
      isVisible: sandbox.stub().returns(false),
      onSave: null,
      onCancel: null,
      useNativeDialogs: false
    };
    const mockLoadDialog = {
      hide: sandbox.stub(),
      isVisible: sandbox.stub().returns(false),
      onLoad: null,
      onCancel: null,
      useNativeDialogs: false
    };
    global.SaveDialog = sandbox.stub().returns(mockSaveDialog);
    global.LoadDialog = sandbox.stub().returns(mockLoadDialog);
    window.SaveDialog = global.SaveDialog;
    window.LoadDialog = global.LoadDialog;

    // Mock FileMenuBar
    const mockFileMenuBar = {
      initialize: sandbox.stub(),
      render: sandbox.stub(),
      handleClick: sandbox.stub().returns(false),
      containsPoint: sandbox.stub().returns(false),
      updateBrushSizeVisibility: sandbox.stub(),
      setLevelEditor: sandbox.stub(),
      brushSizeModule: {
        getSize: sandbox.stub().returns(1),
        setSize: sandbox.stub()
      }
    };
    global.FileMenuBar = sandbox.stub().returns(mockFileMenuBar);
    window.FileMenuBar = global.FileMenuBar;

    // Mock SelectionManager
    const mockSelectionManager = {};
    global.SelectionManager = sandbox.stub().returns(mockSelectionManager);
    window.SelectionManager = global.SelectionManager;

    // Mock HoverPreviewManager
    const mockHoverPreview = {
      update: sandbox.stub(),
      render: sandbox.stub()
    };
    global.HoverPreviewManager = sandbox.stub().returns(mockHoverPreview);
    window.HoverPreviewManager = global.HoverPreviewManager;

    // Mock CameraManager
    const mockCameraManager = {
      initialize: sandbox.stub(),
      update: sandbox.stub(),
      getCameraPosition: sandbox.stub().returns({ x: 0, y: 0 }),
      getCameraZoom: sandbox.stub().returns(1)
    };
    global.CameraManager = sandbox.stub().returns(mockCameraManager);
    window.CameraManager = global.CameraManager;

    // Mock NotificationManager
    const mockNotificationManager = {
      show: sandbox.stub(),
      showSuccess: sandbox.stub(),
      showError: sandbox.stub(),
      showInfo: sandbox.stub(),
      render: sandbox.stub()
    };
    global.NotificationManager = sandbox.stub().returns(mockNotificationManager);
    window.NotificationManager = global.NotificationManager;

    // Mock global cameraManager instance (used by LevelEditor)
    global.cameraManager = {
      initialize: sandbox.stub(),
      update: sandbox.stub(),
      getCameraPosition: sandbox.stub().returns({ x: 0, y: 0 }),
      getCameraZoom: sandbox.stub().returns(1),
      cameraX: 0,
      cameraY: 0,
      cameraZoom: 1
    };
    window.cameraManager = global.cameraManager;

    // Mock LevelEditorPanels constructor
    global.LevelEditorPanels = sandbox.stub().returns(mockLevelEditorPanels);
    window.LevelEditorPanels = global.LevelEditorPanels;

    // Load LevelEditor
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.createVector;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.line;
    delete global.image;
    delete global.LEFT;
    delete global.CENTER;
    delete global.TOP;
    delete global.BOTTOM;
    delete global.RIGHT;
    delete global.devConsoleEnabled;
    delete global.logNormal;
    delete global.localStorage;
    delete global.draggablePanelManager;
    delete global.TerrainEditor;
    delete global.LevelEditorPanels;
  });

  describe('Sidebar Instance Wiring', function() {
    it('should initialize sidebar reference from levelEditorPanels', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Sidebar should be wired from levelEditorPanels
      expect(editor.sidebar).to.exist;
      expect(editor.sidebar).to.equal(mockSidebar);
    });

    it('should handle missing levelEditorPanels gracefully', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      
      // Set to null AFTER initialization
      editor.levelEditorPanels = null;

      // Should not crash when accessing sidebar
      expect(editor.sidebar).to.exist; // sidebar was already set during init
    });

    it('should handle missing panels.sidebar gracefully', function() {
      const editor = new LevelEditor();
      mockLevelEditorPanels.sidebar = null;
      editor.initialize(createMockTerrain());

mockConvertScreenToWorld(editor);

      // Should not crash, sidebar should be null
      expect(editor.sidebar).to.be.null;
    });
  });

  describe('Mouse Wheel Delegation', function() {
    it('should delegate mouse wheel to sidebar when mouse over sidebar', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Mouse over sidebar (x: 1650, y: 100)
      const mouseX = 1650;
      const mouseY = 100;
      const delta = -5; // Scroll down

      const handled = editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      // Should delegate to sidebar
      expect(mockSidebar.handleMouseWheel.calledOnce).to.be.true;
      expect(mockSidebar.handleMouseWheel.calledWith(delta, mouseX, mouseY)).to.be.true;
      expect(handled).to.be.true;
    });

    it('should not delegate mouse wheel when mouse outside sidebar', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Mouse outside sidebar (x: 100, y: 100)
      const mouseX = 100;
      const mouseY = 100;
      const delta = -5;

      editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      // Should NOT delegate to sidebar
      expect(mockSidebar.handleMouseWheel.called).to.be.false;
    });

    it('should not delegate when sidebar panel is hidden', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Hide sidebar
      mockLevelEditorPanels.panels.sidebar.state.visible = false;

      // Mouse over sidebar area (but panel hidden)
      const mouseX = 1650;
      const mouseY = 100;
      const delta = -5;

      editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      // Should NOT delegate (panel hidden)
      expect(mockSidebar.handleMouseWheel.called).to.be.false;
    });

    it('should not delegate when sidebar panel is minimized', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Minimize sidebar
      mockLevelEditorPanels.panels.sidebar.state.minimized = true;

      // Mouse over sidebar area (but panel minimized)
      const mouseX = 1650;
      const mouseY = 100;
      const delta = -5;

      editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      // Should NOT delegate (panel minimized)
      expect(mockSidebar.handleMouseWheel.called).to.be.false;
    });

    it('should return true when sidebar handles wheel event', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      mockSidebar.handleMouseWheel.returns(true);

      const mouseX = 1650;
      const mouseY = 100;
      const delta = -5;

      const handled = editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      expect(handled).to.be.true;
    });

    it('should return false when sidebar does not handle wheel event', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      mockSidebar.handleMouseWheel.returns(false);

      const mouseX = 1650;
      const mouseY = 100;
      const delta = -5;

      const handled = editor.handleMouseWheel({ delta }, false, mouseX, mouseY);

      expect(handled).to.be.false;
    });
  });

  describe('Click Delegation', function() {
    it('should delegate clicks to sidebar when inside bounds', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      // Click inside sidebar
      const mouseX = 1650;
      const mouseY = 100;

      const handled = editor.handleClick(mouseX, mouseY);

      // Should delegate to sidebar
      expect(mockSidebar.handleClick.calledOnce).to.be.true;
    });

    it('should pass correct coordinates to sidebar handleClick', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      const mouseX = 1650;
      const mouseY = 100;

      editor.handleClick(mouseX, mouseY);

      // Should pass mouseX, mouseY, panel x, panel y
      const sidebarX = 1600;
      const sidebarY = 80;
      expect(mockSidebar.handleClick.calledWith(mouseX, mouseY, sidebarX, sidebarY)).to.be.true;
    });

    it('should not delegate clicks when mouse outside sidebar', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

mockConvertScreenToWorld(editor);

      // Click outside sidebar
      const mouseX = 100;
      const mouseY = 100;

      editor.handleClick(mouseX, mouseY);

      // Should NOT delegate to sidebar
      expect(mockSidebar.handleClick.called).to.be.false;
    });

    it('should not delegate when sidebar panel is hidden', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      // Hide sidebar
      mockLevelEditorPanels.panels.sidebar.state.visible = false;

      // Click in sidebar area (but panel hidden)
      const mouseX = 1650;
      const mouseY = 100;

      editor.handleClick(mouseX, mouseY);

      // Should NOT delegate (panel hidden)
      expect(mockSidebar.handleClick.called).to.be.false;
    });

    it('should not delegate when sidebar is null', function() {
      const editor = new LevelEditor();
      mockLevelEditorPanels.sidebar = null;
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      const mouseX = 1650;
      const mouseY = 100;

      const result = editor.handleClick(mouseX, mouseY);

      // Should not crash, should return false
      expect(result).to.be.false;
    });

    it('should return true when sidebar handles click', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      mockSidebar.handleClick.returns({ type: 'minimize' });

      const mouseX = 1650;
      const mouseY = 100;

      const handled = editor.handleClick(mouseX, mouseY);

      expect(handled).to.be.true;
    });

    it('should return false when sidebar does not handle click', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      mockSidebar.handleClick.returns(null);

      const mouseX = 1650;
      const mouseY = 100;

      const handled = editor.handleClick(mouseX, mouseY);

      expect(handled).to.be.false;
    });
  });

  describe('Integration with LevelEditorPanels', function() {
    it('should check levelEditorPanels before delegating', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);
      editor.levelEditorPanels = null;

      const mouseX = 1650;
      const mouseY = 100;

      // Should not crash
      const handled = editor.handleClick(mouseX, mouseY);
      expect(handled).to.be.false;
    });

    it('should check panels.sidebar before delegating', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);
      editor.levelEditorPanels.panels = {};

      const mouseX = 1650;
      const mouseY = 100;

      // Should not crash
      const handled = editor.handleClick(mouseX, mouseY);
      expect(handled).to.be.false;
    });

    it('should use panel position from getPosition()', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());
      mockConvertScreenToWorld(editor);

      // Set custom position
      mockLevelEditorPanels.panels.sidebar.getPosition.returns({ x: 1500, y: 100 });
      mockLevelEditorPanels.panels.sidebar.getSize.returns({ width: 300, height: 600 });

      const mouseX = 1550;
      const mouseY = 150;

      editor.handleClick(mouseX, mouseY);

      // Should use custom position
      expect(mockSidebar.handleClick.calledWith(mouseX, mouseY, 1500, 100)).to.be.true;
    });

    it('should use panel size from getSize()', function() {
      const editor = new LevelEditor();
      editor.initialize(createMockTerrain());

      // Set custom size
      mockLevelEditorPanels.panels.sidebar.getPosition.returns({ x: 1600, y: 80 });
      mockLevelEditorPanels.panels.sidebar.getSize.returns({ width: 400, height: 700 });

      // Mouse at right edge
      const mouseX = 1999; // 1600 + 399 (inside)
      const mouseY = 100;

      editor.handleMouseWheel({ delta: -5 }, false, mouseX, mouseY);

      // Should delegate (inside custom size)
      expect(mockSidebar.handleMouseWheel.called).to.be.true;
    });
  });
});

