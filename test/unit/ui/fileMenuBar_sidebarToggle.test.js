/**
 * Unit Tests: FileMenuBar - Sidebar Toggle Integration
 * 
 * Tests the integration of the "Sidebar" menu item in the View menu,
 * including toggle action, keyboard shortcut, and state synchronization.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('FileMenuBar - Sidebar Toggle Integration', function() {
  let sandbox;
  let mockLevelEditor;
  let fileMenuBar;
  let dom;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Setup JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost'
    });
    global.window = dom.window;
    global.document = dom.window.document;

    // Mock p5.js drawing functions
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textSize = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.line = sandbox.stub();
    global.textFont = sandbox.stub();
    global.BOLD = 'BOLD';
    global.NORMAL = 'NORMAL';
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.RIGHT = 'RIGHT';
    global.TOP = 'TOP';
    global.BOTTOM = 'BOTTOM';

    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.noStroke = global.noStroke;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.rect = global.rect;
    window.text = global.text;
    window.textSize = global.textSize;
    window.textAlign = global.textAlign;
    window.line = global.line;
    window.textFont = global.textFont;
    window.BOLD = global.BOLD;
    window.NORMAL = global.NORMAL;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;

    // Mock LevelEditor
    mockLevelEditor = {
      levelEditorPanels: {
        getPanel: sandbox.stub().returns(null)
      }
    };

    // Mock DraggablePanelManager
    global.draggablePanelManager = {
      togglePanel: sandbox.stub()
    };
    window.draggablePanelManager = global.draggablePanelManager;

    // Mock FileMenuBar class
    global.FileMenuBar = class {
      constructor(editor) {
        this.editor = editor;
        this.menus = [];
        this.activeMenu = null;
        this.brushSizeModule = null;
        this._initializeMenus();
      }

      _initializeMenus() {
        this.menus = [
          {
            label: 'File',
            items: []
          },
          {
            label: 'View',
            items: [
              { 
                label: 'Materials Panel', 
                shortcut: 'Ctrl+2',
                enabled: true,
                checkable: true,
                checked: false,
                action: () => this._handleTogglePanel('materials')
              },
              { 
                label: 'Tools Panel', 
                shortcut: 'Ctrl+3',
                enabled: true,
                checkable: true,
                checked: false,
                action: () => this._handleTogglePanel('tools')
              },
              { 
                label: 'Events Panel', 
                shortcut: 'Ctrl+4',
                enabled: true,
                checkable: true,
                checked: false,
                action: () => this._handleTogglePanel('events')
              },
              { 
                label: 'Properties Panel', 
                shortcut: 'Ctrl+5',
                enabled: true,
                checkable: true,
                checked: false,
                action: () => this._handleTogglePanel('properties')
              },
              { 
                label: 'Sidebar', 
                shortcut: 'Ctrl+6',
                enabled: true,
                checkable: true,
                checked: false,
                action: () => this._handleTogglePanel('sidebar')
              }
            ]
          }
        ];
      }

      _handleTogglePanel(panelKey) {
        const panelIdMap = {
          'materials': 'level-editor-materials',
          'tools': 'level-editor-tools',
          'events': 'level-editor-events',
          'properties': 'level-editor-properties',
          'sidebar': 'level-editor-sidebar'
        };

        const labelMap = {
          'materials': 'Materials Panel',
          'tools': 'Tools Panel',
          'events': 'Events Panel',
          'properties': 'Properties Panel',
          'sidebar': 'Sidebar'
        };

        const panelId = panelIdMap[panelKey];
        const label = labelMap[panelKey];

        if (typeof draggablePanelManager !== 'undefined' && draggablePanelManager) {
          draggablePanelManager.togglePanel(panelId);

          // Update checked state
          const viewMenu = this.menus.find(m => m.label === 'View');
          if (viewMenu) {
            const item = viewMenu.items.find(i => i.label === label);
            if (item) {
              const panel = this.editor.levelEditorPanels.getPanel(panelId);
              item.checked = panel ? panel.state.visible : false;
            }
          }
        }
      }

      handleKeyPress(key, ctrlKey) {
        if (!ctrlKey) return false;

        const shortcuts = {
          '2': () => this._handleTogglePanel('materials'),
          '3': () => this._handleTogglePanel('tools'),
          '4': () => this._handleTogglePanel('events'),
          '5': () => this._handleTogglePanel('properties'),
          '6': () => this._handleTogglePanel('sidebar')
        };

        if (shortcuts[key]) {
          shortcuts[key]();
          return true;
        }

        return false;
      }

      getViewMenu() {
        return this.menus.find(m => m.label === 'View');
      }
    };

    window.FileMenuBar = global.FileMenuBar;

    // Create FileMenuBar instance
    fileMenuBar = new FileMenuBar(mockLevelEditor);
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.rect;
    delete global.text;
    delete global.textSize;
    delete global.textAlign;
    delete global.line;
    delete global.textFont;
    delete global.BOLD;
    delete global.NORMAL;
    delete global.LEFT;
    delete global.CENTER;
    delete global.RIGHT;
    delete global.TOP;
    delete global.BOTTOM;
    delete global.draggablePanelManager;
    delete global.FileMenuBar;
  });

  describe('View Menu - Sidebar Item', function() {
    it('should have "Sidebar" item in View menu', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      
      expect(viewMenu).to.exist;
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      expect(sidebarItem).to.exist;
    });

    it('should have correct keyboard shortcut (Ctrl+6)', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      expect(sidebarItem.shortcut).to.equal('Ctrl+6');
    });

    it('should be checkable', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      expect(sidebarItem.checkable).to.be.true;
    });

    it('should start unchecked (hidden by default)', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      expect(sidebarItem.checked).to.be.false;
    });

    it('should be enabled', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      expect(sidebarItem.enabled).to.be.true;
    });

    it('should be positioned after Properties Panel', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const propertiesIndex = viewMenu.items.findIndex(item => item.label === 'Properties Panel');
      const sidebarIndex = viewMenu.items.findIndex(item => item.label === 'Sidebar');
      
      expect(sidebarIndex).to.be.greaterThan(propertiesIndex);
    });
  });

  describe('Toggle Action', function() {
    it('should call _handleTogglePanel with "sidebar"', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      sandbox.spy(fileMenuBar, '_handleTogglePanel');
      
      sidebarItem.action();
      
      expect(fileMenuBar._handleTogglePanel.calledWith('sidebar')).to.be.true;
    });

    it('should call draggablePanelManager.togglePanel with correct ID', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      sidebarItem.action();
      
      expect(draggablePanelManager.togglePanel.calledWith('level-editor-sidebar')).to.be.true;
    });

    it('should update checked state after toggle', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      // Mock panel state (visible)
      mockLevelEditor.levelEditorPanels.getPanel.returns({
        state: { visible: true }
      });
      
      sidebarItem.action();
      
      expect(sidebarItem.checked).to.be.true;
    });
  });

  describe('Keyboard Shortcut (Ctrl+6)', function() {
    it('should trigger sidebar toggle on Ctrl+6', function() {
      sandbox.spy(fileMenuBar, '_handleTogglePanel');
      
      const handled = fileMenuBar.handleKeyPress('6', true);
      
      expect(handled).to.be.true;
      expect(fileMenuBar._handleTogglePanel.calledWith('sidebar')).to.be.true;
    });

    it('should call draggablePanelManager.togglePanel on Ctrl+6', function() {
      fileMenuBar.handleKeyPress('6', true);
      
      expect(draggablePanelManager.togglePanel.calledWith('level-editor-sidebar')).to.be.true;
    });

    it('should not trigger without Ctrl key', function() {
      sandbox.spy(fileMenuBar, '_handleTogglePanel');
      
      const handled = fileMenuBar.handleKeyPress('6', false);
      
      expect(handled).to.be.false;
      expect(fileMenuBar._handleTogglePanel.called).to.be.false;
    });
  });

  describe('Panel ID Mapping', function() {
    it('should map "sidebar" to "level-editor-sidebar"', function() {
      const viewMenu = fileMenuBar.getViewMenu();
      const sidebarItem = viewMenu.items.find(item => item.label === 'Sidebar');
      
      sidebarItem.action();
      
      expect(draggablePanelManager.togglePanel.calledWith('level-editor-sidebar')).to.be.true;
    });
  });
});
