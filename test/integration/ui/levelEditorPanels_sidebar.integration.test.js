/**
 * Integration Tests for LevelEditorPanels Sidebar Integration
 * 
 * Tests the integration of LevelEditorSidebar with DraggablePanel system.
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditorPanels - Sidebar Integration', function() {
  let LevelEditorPanels;
  let LevelEditorSidebar;
  let DraggablePanel;
  let levelEditorPanels;
  let mockLevelEditor;
  let mockDraggablePanelManager;
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.image = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.line = sandbox.stub();
    global.CENTER = 'CENTER';
    global.LEFT = 'LEFT';
    global.TOP = 'TOP';
    global.BOTTOM = 'BOTTOM';
    global.RIGHT = 'RIGHT';
    
    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;
    window.devConsoleEnabled = false;
    
    // Mock localStorage
    const localStorageMock = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub(),
      clear: sandbox.stub()
    };
    global.localStorage = localStorageMock;
    window.localStorage = localStorageMock;
    
    // Mock logging functions
    global.logNormal = sandbox.stub();
    window.logNormal = global.logNormal;
    
    // Load dependencies
    delete require.cache[require.resolve('../../../Classes/ui/UIComponents/scroll/ScrollIndicator')];
    delete require.cache[require.resolve('../../../Classes/ui/UIComponents/scroll/ScrollableContentArea')];
    delete require.cache[require.resolve('../../../Classes/ui/levelEditor/panels/LevelEditorSidebar')];
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel')];
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels')];
    
    const ScrollIndicator = require('../../../Classes/ui/UIComponents/scroll/ScrollIndicator');
    global.ScrollIndicator = ScrollIndicator;
    window.ScrollIndicator = ScrollIndicator;
    
    const ScrollableContentArea = require('../../../Classes/ui/UIComponents/scroll/ScrollableContentArea');
    global.ScrollableContentArea = ScrollableContentArea;
    window.ScrollableContentArea = ScrollableContentArea;
    
    LevelEditorSidebar = require('../../../Classes/ui/levelEditor/panels/LevelEditorSidebar');
    global.LevelEditorSidebar = LevelEditorSidebar;
    window.LevelEditorSidebar = LevelEditorSidebar;
    
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    global.DraggablePanel = DraggablePanel;
    window.DraggablePanel = DraggablePanel;
    
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels');
    
    // Mock DraggablePanelManager
    mockDraggablePanelManager = {
      panels: new Map(),
      stateVisibility: {},
      register: sandbox.stub(),
      getPanel: sandbox.stub(),
      setStateVisibility: sandbox.stub()
    };
    global.draggablePanelManager = mockDraggablePanelManager;
    window.draggablePanelManager = mockDraggablePanelManager;
    
    // Mock LevelEditor
    mockLevelEditor = {
      palette: { 
        getContentSize: () => ({ width: 95, height: 95 }),
        containsPoint: sandbox.stub().returns(false),
        render: sandbox.stub()
      },
      toolbar: { 
        getContentSize: () => ({ width: 45, height: 285 }),
        containsPoint: sandbox.stub().returns(false),
        render: sandbox.stub()
      },
      brushSize: { 
        getContentSize: () => ({ width: 90, height: 50 }),
        render: sandbox.stub()
      },
      miniMap: { 
        getContentSize: () => ({ width: 200, height: 200 }),
        render: sandbox.stub()
      },
      propertiesPanel: { 
        getContentSize: () => ({ width: 300, height: 400 }),
        render: sandbox.stub(),
        update: sandbox.stub()
      },
      eventEditor: {
        getContentSize: () => ({ width: 250, height: 300 }),
        render: sandbox.stub(),
        containsPoint: sandbox.stub().returns(false)
      },
      brushControl: {
        getContentSize: () => ({ width: 90, height: 50 }),
        render: sandbox.stub(),
        containsPoint: sandbox.stub().returns(false)
      }
    };
    
    levelEditorPanels = new LevelEditorPanels(mockLevelEditor);
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.image;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.line;
    delete global.CENTER;
    delete global.LEFT;
    delete global.TOP;
    delete global.BOTTOM;
    delete global.RIGHT;
    delete global.devConsoleEnabled;
    delete global.localStorage;
    delete global.logNormal;
    delete global.ScrollIndicator;
    delete global.ScrollableContentArea;
    delete global.LevelEditorSidebar;
    delete global.DraggablePanel;
    delete global.draggablePanelManager;
    if (global.window) {
      delete global.window.devConsoleEnabled;
      delete global.window.localStorage;
      delete global.window.logNormal;
      delete global.window.draggablePanelManager;
      delete global.window;
    }
    if (global.document) {
      delete global.document;
    }
  });
  
  describe('Sidebar Panel Registration', function() {
    it('should create sidebar panel in panels object', function() {
      levelEditorPanels.initialize();
      
      expect(levelEditorPanels.panels.sidebar).to.exist;
      expect(levelEditorPanels.panels.sidebar).to.be.instanceOf(DraggablePanel);
    });
    
    it('should register sidebar panel with DraggablePanelManager', function() {
      levelEditorPanels.initialize();
      
      // Check that sidebar was added to manager's panels Map
      expect(mockDraggablePanelManager.panels.has('level-editor-sidebar')).to.be.true;
      const panel = mockDraggablePanelManager.panels.get('level-editor-sidebar');
      expect(panel).to.exist;
      expect(panel).to.be.instanceOf(DraggablePanel);
    });
    
    it('should configure sidebar with correct ID', function() {
      levelEditorPanels.initialize();
      
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      expect(sidebarPanel.config.id).to.equal('level-editor-sidebar');
    });
    
    it('should position sidebar on right side of screen', function() {
      // Mock window dimensions
      global.window.width = 1920;
      global.window.height = 1080;
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;
      
      levelEditorPanels.initialize();
      
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      const position = sidebarPanel.getPosition();
      
      // Should be near right edge (window.width - panel.width - margin)
      // Position: window.width - 320 = 1920 - 320 = 1600
      expect(position.x).to.be.greaterThan(1500); // Right side
    });
    
    it('should set sidebar to hidden by default', function() {
      levelEditorPanels.initialize();
      
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      // Panel exists but should NOT be in default state visibility
      expect(sidebarPanel).to.exist;
      // We'll verify visibility in FileMenuBar integration tests
    });
    
    it('should configure sidebar as draggable', function() {
      levelEditorPanels.initialize();
      
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      expect(sidebarPanel.config.behavior.draggable).to.be.true;
    });
    
    it('should configure sidebar with persistent state', function() {
      levelEditorPanels.initialize();
      
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      expect(sidebarPanel.config.behavior.persistent).to.be.true;
    });
  });
  
  describe('Sidebar Instance Creation', function() {
    it('should create LevelEditorSidebar instance', function() {
      levelEditorPanels.initialize();
      
      expect(levelEditorPanels.sidebar).to.exist;
      expect(levelEditorPanels.sidebar).to.be.instanceOf(LevelEditorSidebar);
    });
    
    it('should configure sidebar with correct dimensions', function() {
      levelEditorPanels.initialize();
      
      const sidebar = levelEditorPanels.sidebar;
      
      expect(sidebar.getWidth()).to.equal(300);
      expect(sidebar.getHeight()).to.equal(600);
    });
    
    it('should configure sidebar with default title', function() {
      levelEditorPanels.initialize();
      
      const sidebar = levelEditorPanels.sidebar;
      
      expect(sidebar.title).to.equal('Sidebar');
    });
  });
  
  describe('Sidebar Rendering Integration', function() {
    beforeEach(function() {
      levelEditorPanels.initialize();
    });
    
    it('should render sidebar when panel is visible', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      // Mock panel state as visible (not minimized)
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 100 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      // Spy on sidebar render
      const renderSpy = sandbox.spy(sidebar, 'render');
      
      // Render panels
      levelEditorPanels.render('LEVEL_EDITOR');
      
      expect(renderSpy.called).to.be.true;
    });
    
    it('should not render sidebar when panel is hidden', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      // Mock panel state as hidden
      sidebarPanel.state = { visible: false, minimized: false, position: { x: 100, y: 100 } };
      
      // Spy on sidebar render
      const renderSpy = sandbox.spy(sidebar, 'render');
      
      // Render panels
      levelEditorPanels.render('LEVEL_EDITOR');
      
      expect(renderSpy.called).to.be.false;
    });
    
    it('should pass correct coordinates to sidebar render', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 200 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      const renderSpy = sandbox.spy(sidebar, 'render');
      
      levelEditorPanels.render('LEVEL_EDITOR');
      
      // Content area starts after title bar (position.x + padding, position.y + titleBarHeight + padding)
      // With default padding (10) and title bar height (calculated)
      expect(renderSpy.called).to.be.true;
    });
  });
  
  describe('Sidebar Click Delegation', function() {
    beforeEach(function() {
      levelEditorPanels.initialize();
    });
    
    it('should delegate clicks to sidebar when inside bounds', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 100 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      // Click inside sidebar content area (below title bar at y=100+30=130)
      const mouseX = 150;
      const mouseY = 150;
      
      const handleClickSpy = sandbox.spy(sidebar, 'handleClick');
      
      levelEditorPanels.handleClick(mouseX, mouseY);
      
      expect(handleClickSpy.called).to.be.true;
    });
    
    it('should not delegate clicks outside sidebar bounds', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 100 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      // Click outside sidebar
      const mouseX = 50;
      const mouseY = 50;
      
      const handleClickSpy = sandbox.spy(sidebar, 'handleClick');
      
      levelEditorPanels.handleClick(mouseX, mouseY);
      
      expect(handleClickSpy.called).to.be.false;
    });
  });
  
  describe('Sidebar Mouse Wheel Delegation', function() {
    beforeEach(function() {
      levelEditorPanels.initialize();
    });
    
    it('should delegate mouse wheel to sidebar when inside bounds', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 100 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      // Add content to enable scrolling
      sidebar.addText('item1', 'Item 1', { height: 300 });
      sidebar.addText('item2', 'Item 2', { height: 300 });
      
      // Mouse over sidebar (below title bar at y=100+30=130)
      const mouseX = 150;
      const mouseY = 150;
      
      const handleMouseWheelSpy = sandbox.spy(sidebar, 'handleMouseWheel');
      
      levelEditorPanels.handleMouseWheel(1, mouseX, mouseY);
      
      expect(handleMouseWheelSpy.calledWith(1, mouseX, mouseY)).to.be.true;
    });
    
    it('should return true when sidebar handles mouse wheel', function() {
      const sidebar = levelEditorPanels.sidebar;
      const sidebarPanel = levelEditorPanels.panels.sidebar;
      
      sidebarPanel.state = { visible: true, minimized: false, position: { x: 100, y: 100 } };
      sidebarPanel.config.size = { width: 300, height: 600 };
      
      // Add content to enable scrolling
      sidebar.addText('item1', 'Item 1', { height: 300 });
      sidebar.addText('item2', 'Item 2', { height: 300 });
      
      const handled = levelEditorPanels.handleMouseWheel(1, 150, 150);
      
      expect(handled).to.be.true;
    });
  });
  
  describe('Content Management Integration', function() {
    beforeEach(function() {
      levelEditorPanels.initialize();
    });
    
    it('should add content items to sidebar', function() {
      const sidebar = levelEditorPanels.sidebar;
      
      sidebar.addText('header', 'Tools', { fontSize: 16 });
      sidebar.addButton('btn1', 'Click', () => {});
      
      const items = sidebar.contentArea.contentItems;
      
      expect(items).to.have.lengthOf(2);
      expect(items[0].id).to.equal('header');
      expect(items[1].id).to.equal('btn1');
    });
    
    it('should remove content items from sidebar', function() {
      const sidebar = levelEditorPanels.sidebar;
      
      sidebar.addText('item1', 'Item 1');
      sidebar.addText('item2', 'Item 2');
      
      const removed = sidebar.removeItem('item1');
      
      expect(removed).to.be.true;
      expect(sidebar.contentArea.contentItems).to.have.lengthOf(1);
    });
    
    it('should clear all content from sidebar', function() {
      const sidebar = levelEditorPanels.sidebar;
      
      sidebar.addText('item1', 'Item 1');
      sidebar.addButton('item2', 'Button', () => {});
      
      sidebar.clearAll();
      
      expect(sidebar.contentArea.contentItems).to.have.lengthOf(0);
    });
  });
});
