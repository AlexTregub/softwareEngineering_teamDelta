const { expect } = require('chai');
const path = require('path');

describe('UIController', () => {
  let UIController, UIManager;
  
  before(() => {
    // Mock window/global environment
    global.window = global.window || {};
    
    // Load the module
    const module = require(path.resolve(__dirname, '../../../Classes/rendering/UIController.js'));
    UIController = module.UIController;
    UIManager = module.UIManager;
  });
  
  afterEach(() => {
    // Clean up global mocks
    delete global.UIRenderer;
    delete global.GameState;
    delete global.ants;
    delete global.g_performanceMonitor;
    delete global.getEntityDebugManager;
    delete global.toggleDevConsole;
    delete global.showDevConsole;
    delete global.hideDevConsole;
    delete global.console.log;
  });
  
  describe('Constructor', () => {
    it('should create instance with null uiRenderer', () => {
      const controller = new UIController();
      expect(controller.uiRenderer).to.be.null;
    });
    
    it('should initialize as not initialized', () => {
      const controller = new UIController();
      expect(controller.initialized).to.be.false;
    });
    
    it('should create key bindings Map', () => {
      const controller = new UIController();
      expect(controller.keyBindings).to.be.instanceOf(Map);
    });
    
    it('should have CTRL+SHIFT+1 binding for performance overlay', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+1')).to.equal('togglePerformanceOverlay');
    });
    
    it('should have CTRL+SHIFT+2 binding for entity inspector', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+2')).to.equal('toggleEntityInspector');
    });
    
    it('should have CTRL+SHIFT+3 binding for debug console', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+3')).to.equal('toggleDebugConsole');
    });
    
    it('should have CTRL+SHIFT+4 binding for minimap', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+4')).to.equal('toggleMinimap');
    });
    
    it('should have CTRL+SHIFT+5 binding for start game', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('CTRL+SHIFT+5')).to.equal('startGame');
    });
    
    it('should have BACKTICK binding for debug console', () => {
      const controller = new UIController();
      expect(controller.keyBindings.get('BACKTICK')).to.equal('toggleDebugConsole');
    });
  });
  
  describe('initialize()', () => {
    it('should return false when UIRenderer not available', () => {
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.false;
      expect(controller.initialized).to.be.false;
    });
    
    it('should return true when UIRenderer available on window', () => {
      global.window.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.true;
      expect(controller.initialized).to.be.true;
    });
    
    it('should return true when UIRenderer available on global', () => {
      global.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      const result = controller.initialize();
      expect(result).to.be.true;
    });
    
    it('should set uiRenderer reference', () => {
      const mockUIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      global.window.UIRenderer = mockUIRenderer;
      
      const controller = new UIController();
      controller.initialize();
      expect(controller.uiRenderer).to.equal(mockUIRenderer);
    });
    
    it('should enable performance overlay by default', () => {
      global.window.UIRenderer = {
        debugUI: {
          performanceOverlay: { enabled: false }
        }
      };
      
      const controller = new UIController();
      controller.initialize();
      expect(controller.uiRenderer.debugUI.performanceOverlay.enabled).to.be.true;
    });
  });
  
  describe('handleKeyPress()', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } },
        togglePerformanceOverlay: () => {},
        toggleEntityInspector: () => {},
        toggleDebugConsole: () => {},
        enableMinimap: () => {},
        disableMinimap: () => {}
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should return false when not initialized', () => {
      const uninit = new UIController();
      const result = uninit.handleKeyPress(49, '1');
      expect(result).to.be.false;
    });
    
    it('should handle backtick (192) for debug console', () => {
      const result = controller.handleKeyPress(192, '`');
      expect(result).to.be.true;
    });
    
    it('should handle Shift+N (78) for toggle all UI', () => {
      const event = { shiftKey: true, ctrlKey: false };
      const result = controller.handleKeyPress(78, 'N', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+1 for performance overlay', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(49, '1', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+2 for entity inspector', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(50, '2', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+3', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(51, '3', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+4 for minimap', () => {
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(52, '4', event);
      expect(result).to.be.true;
    });
    
    it('should handle Ctrl+Shift+5 for start game', () => {
      global.GameState = { startGame: () => {} };
      const event = { ctrlKey: true, shiftKey: true };
      const result = controller.handleKeyPress(53, '5', event);
      expect(result).to.be.true;
    });
    
    it('should return false for unhandled keys', () => {
      const result = controller.handleKeyPress(65, 'A');
      expect(result).to.be.false;
    });
  });
  
  describe('Mouse Event Handlers', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        interactionUI: {
          selectionBox: { active: false },
          contextMenu: { active: false }
        },
        startSelectionBox: () => {},
        updateSelectionBox: () => {},
        endSelectionBox: () => {},
        showContextMenu: () => {},
        hideContextMenu: () => {},
        showTooltip: () => {},
        hideTooltip: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    describe('handleMousePressed()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMousePressed(100, 200, 0);
        expect(result).to.be.false;
      });
      
      it('should start selection box on left click', () => {
        let called = false;
        mockUIRenderer.startSelectionBox = () => { called = true; };
        controller.handleMousePressed(100, 200, 0);
        expect(called).to.be.true;
      });
      
      it('should handle right click for context menu', () => {
        controller.getContextMenuItems = () => ['Item 1', 'Item 2'];
        let called = false;
        mockUIRenderer.showContextMenu = () => { called = true; };
        const result = controller.handleMousePressed(100, 200, 2);
        expect(called).to.be.true;
      });
      
      it('should not show context menu when no items', () => {
        controller.getContextMenuItems = () => [];
        const result = controller.handleMousePressed(100, 200, 2);
        expect(result).to.be.false;
      });
    });
    
    describe('handleMouseDragged()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseDragged(150, 250);
        expect(result).to.be.false;
      });
      
      it('should update selection box when active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = true;
        let called = false;
        mockUIRenderer.updateSelectionBox = () => { called = true; };
        const result = controller.handleMouseDragged(150, 250);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
      
      it('should return false when selection box not active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = false;
        const result = controller.handleMouseDragged(150, 250);
        expect(result).to.be.false;
      });
    });
    
    describe('handleMouseReleased()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseReleased(200, 300, 0);
        expect(result).to.be.false;
      });
      
      it('should end selection box when active', () => {
        mockUIRenderer.interactionUI.selectionBox.active = true;
        let called = false;
        mockUIRenderer.endSelectionBox = () => { called = true; };
        const result = controller.handleMouseReleased(200, 300, 0);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
      
      it('should hide context menu when active', () => {
        mockUIRenderer.interactionUI.contextMenu.active = true;
        let called = false;
        mockUIRenderer.hideContextMenu = () => { called = true; };
        const result = controller.handleMouseReleased(200, 300, 0);
        expect(result).to.be.true;
        expect(called).to.be.true;
      });
    });
    
    describe('handleMouseMoved()', () => {
      it('should return false when not initialized', () => {
        const uninit = new UIController();
        const result = uninit.handleMouseMoved(250, 350);
        expect(result).to.be.false;
      });
      
      it('should update tooltips on mouse move', () => {
        let called = false;
        controller.updateTooltips = () => { called = true; };
        controller.handleMouseMoved(250, 350);
        expect(called).to.be.true;
      });
    });
  });
  
  describe('Tooltip and Entity Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        showTooltip: () => {},
        hideTooltip: () => {}
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    describe('getEntityAtPosition()', () => {
      it('should return null when no ants', () => {
        const result = controller.getEntityAtPosition(100, 100);
        expect(result).to.be.null;
      });
      
      it('should return ant within hover radius', () => {
        global.ants = [
          { x: 100, y: 100 }
        ];
        
        const result = controller.getEntityAtPosition(105, 105);
        expect(result).to.not.be.null;
        expect(result.x).to.equal(100);
      });
      
      it('should return null when ant too far', () => {
        global.ants = [
          { x: 100, y: 100 }
        ];
        
        const result = controller.getEntityAtPosition(150, 150);
        expect(result).to.be.null;
      });
      
      it('should skip null ants', () => {
        global.ants = [null, { x: 100, y: 100 }];
        const result = controller.getEntityAtPosition(105, 105);
        expect(result).to.not.be.null;
      });
    });
    
    describe('getEntityTooltipText()', () => {
      it('should generate basic tooltip', () => {
        const entity = {};
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.be.a('string');
      });
      
      it('should include constructor name', () => {
        class Ant {}
        const entity = new Ant();
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('Ant');
      });
      
      it('should include entity id', () => {
        const entity = { id: 'ant-123' };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('ant-123');
      });
      
      it('should include current state', () => {
        const entity = { currentState: 'MOVING' };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('MOVING');
      });
      
      it('should include health', () => {
        const entity = { health: 75 };
        const text = controller.getEntityTooltipText(entity);
        expect(text).to.include('Health: 75');
      });
    });
    
    describe('getContextMenuItems()', () => {
      it('should return entity-specific items when entity hovered', () => {
        controller.getEntityAtPosition = () => ({ isSelected: () => false });
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Inspect Entity');
        expect(items).to.include('Select');
      });
      
      it('should include Deselect for selected entities', () => {
        controller.getEntityAtPosition = () => ({ isSelected: () => true });
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Deselect');
      });
      
      it('should return general items when no entity', () => {
        controller.getEntityAtPosition = () => null;
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Build Here');
        expect(items).to.include('Set Waypoint');
      });
      
      it('should always include Cancel', () => {
        controller.getEntityAtPosition = () => null;
        const items = controller.getContextMenuItems(100, 100);
        expect(items).to.include('Cancel');
      });
    });
  });
  
  describe('UI Toggle Methods', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } },
        togglePerformanceOverlay: () => {},
        toggleEntityInspector: () => {},
        toggleDebugConsole: () => {},
        enableMinimap: () => {},
        disableMinimap: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    describe('togglePerformanceOverlay()', () => {
      it('should use g_performanceMonitor when available', () => {
        let toggled = false;
        global.g_performanceMonitor = {
          debugDisplay: { enabled: false },
          setDebugDisplay: (val) => { toggled = true; }
        };
        
        controller.togglePerformanceOverlay();
        expect(toggled).to.be.true;
      });
      
      it('should fallback to uiRenderer', () => {
        let called = false;
        mockUIRenderer.togglePerformanceOverlay = () => { called = true; };
        controller.togglePerformanceOverlay();
        expect(called).to.be.true;
      });
    });
    
    describe('toggleEntityInspector()', () => {
      it('should use EntityDebugManager when available', () => {
        let toggled = false;
        global.getEntityDebugManager = () => ({
          toggleGlobalDebug: () => { toggled = true; }
        });
        
        controller.toggleEntityInspector();
        expect(toggled).to.be.true;
      });
      
      it('should fallback to uiRenderer', () => {
        let called = false;
        mockUIRenderer.toggleEntityInspector = () => { called = true; };
        controller.toggleEntityInspector();
        expect(called).to.be.true;
      });
    });
    
    describe('toggleMinimap()', () => {
      it('should disable minimap when enabled', () => {
        let disabled = false;
        mockUIRenderer.hudElements.minimap.enabled = true;
        mockUIRenderer.disableMinimap = () => { disabled = true; };
        controller.toggleMinimap();
        expect(disabled).to.be.true;
      });
      
      it('should enable minimap when disabled', () => {
        let enabled = false;
        mockUIRenderer.hudElements.minimap.enabled = false;
        mockUIRenderer.enableMinimap = () => { enabled = true; };
        controller.toggleMinimap();
        expect(enabled).to.be.true;
      });
    });
  });
  
  describe('Game State Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        menuSystems: {
          mainMenu: { active: false },
          pauseMenu: { active: false }
        }
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should start game when GameState available', () => {
      let started = false;
      global.GameState = {
        startGame: () => { started = true; }
      };
      
      controller.startGame();
      expect(started).to.be.true;
    });
    
    it('should show main menu', () => {
      controller.showMainMenu();
      expect(controller.uiRenderer.menuSystems.mainMenu.active).to.be.true;
    });
    
    it('should hide main menu', () => {
      controller.uiRenderer.menuSystems.mainMenu.active = true;
      controller.hideMainMenu();
      expect(controller.uiRenderer.menuSystems.mainMenu.active).to.be.false;
    });
    
    it('should show pause menu', () => {
      controller.showPauseMenu();
      expect(controller.uiRenderer.menuSystems.pauseMenu.active).to.be.true;
    });
    
    it('should hide pause menu', () => {
      controller.uiRenderer.menuSystems.pauseMenu.active = true;
      controller.hidePauseMenu();
      expect(controller.uiRenderer.menuSystems.pauseMenu.active).to.be.false;
    });
  });
  
  describe('Individual Panel Show/Hide Methods', () => {
    let controller;
    
    beforeEach(() => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        hudElements: { minimap: { enabled: false } }
      };
      
      controller = new UIController();
      controller.initialize();
    });
    
    it('should show performance overlay', () => {
      global.g_performanceMonitor = {
        setDebugDisplay: (val) => {
          global.g_performanceMonitor._enabled = val;
        },
        _enabled: false
      };
      
      controller.showPerformanceOverlay();
      expect(global.g_performanceMonitor._enabled).to.be.true;
    });
    
    it('should hide performance overlay', () => {
      global.g_performanceMonitor = {
        setDebugDisplay: (val) => {
          global.g_performanceMonitor._enabled = val;
        },
        _enabled: true
      };
      
      controller.hidePerformanceOverlay();
      expect(global.g_performanceMonitor._enabled).to.be.false;
    });
    
    it('should show entity inspector', () => {
      let shown = false;
      global.getEntityDebugManager = () => ({
        enableGlobalDebug: () => { shown = true; }
      });
      
      controller.showEntityInspector();
      expect(shown).to.be.true;
    });
    
    it('should hide entity inspector', () => {
      let hidden = false;
      global.getEntityDebugManager = () => ({
        disableGlobalDebug: () => { hidden = true; }
      });
      
      controller.hideEntityInspector();
      expect(hidden).to.be.true;
    });
    
    it('should show minimap', () => {
      controller.showMinimap();
      expect(controller.uiRenderer.hudElements.minimap.enabled).to.be.true;
    });
    
    it('should hide minimap', () => {
      controller.uiRenderer.hudElements.minimap.enabled = true;
      controller.hideMinimap();
      expect(controller.uiRenderer.hudElements.minimap.enabled).to.be.false;
    });
  });
  
  describe('Configuration and Utility Methods', () => {
    let controller, mockUIRenderer;
    
    beforeEach(() => {
      mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        updateConfig: () => {},
        getStats: () => ({ rendered: 100 }),
        selectEntityForInspection: () => {}
      };
      
      global.window.UIRenderer = mockUIRenderer;
      controller = new UIController();
      controller.initialize();
    });
    
    it('should configure UI renderer', () => {
      let configured = false;
      mockUIRenderer.updateConfig = () => { configured = true; };
      controller.configure({ someOption: true });
      expect(configured).to.be.true;
    });
    
    it('should get stats from UI renderer', () => {
      const stats = controller.getStats();
      expect(stats).to.have.property('rendered', 100);
    });
    
    it('should return null stats when no UI renderer', () => {
      controller.uiRenderer = null;
      const stats = controller.getStats();
      expect(stats).to.be.null;
    });
    
    it('should get UI renderer reference', () => {
      const renderer = controller.getUIRenderer();
      expect(renderer).to.equal(mockUIRenderer);
    });
    
    it('should select entity for inspection', () => {
      let selected = false;
      mockUIRenderer.selectEntityForInspection = () => { selected = true; };
      controller.selectEntityForInspection({ id: 'entity-1' });
      expect(selected).to.be.true;
    });
  });
  
  describe('Module Exports', () => {
    it('should export UIController class', () => {
      expect(UIController).to.be.a('function');
      expect(UIController.name).to.equal('UIController');
    });
    
    it('should export UIManager instance', () => {
      expect(UIManager).to.be.instanceOf(UIController);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle initialize when console.log not available', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      expect(() => controller.initialize()).to.not.throw();
    });
    
    it('should handle toggleDebugConsole with uiRenderer fallback', () => {
      const mockUIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } },
        toggleDebugConsole: () => {}
      };
      global.window.UIRenderer = mockUIRenderer;
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.toggleDebugConsole()).to.not.throw();
    });
    
    it('should handle startGame when GameState not available', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.startGame()).to.not.throw();
    });
    
    it('should handle getEntityAtPosition with entities missing coordinates', () => {
      global.ants = [
        {},
        { x: 100 },
        { y: 100 }
      ];
      
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      
      const controller = new UIController();
      controller.initialize();
      
      const result = controller.getEntityAtPosition(100, 100);
      expect(result).to.be.null;
    });
    
    it('should handle toggleAllUI without draggablePanelManager', () => {
      global.window.UIRenderer = {
        debugUI: { performanceOverlay: { enabled: false } }
      };
      global.window.draggablePanelManager = null;
      
      const controller = new UIController();
      controller.initialize();
      
      expect(() => controller.toggleAllUI()).to.not.throw();
    });
  });
});
