/**
 * Integration Tests for Auto-Sizing Feature
 * Tests that panels with autoSizeToContent enabled properly resize to fit their button content
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DraggablePanel Auto-Sizing Integration Tests', () => {
  let DraggablePanel;
  let DraggablePanelManager;
  let Button;
  let ButtonStyles;
  let manager;
  let localStorageGetItemStub;
  let localStorageSetItemStub;

  before(() => {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.textFont = sinon.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock CollisionBox2D
    global.CollisionBox2D = class {
      constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
      }
      updateDimensions() {}
      containsPoint() { return false; }
    };

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      draggablePanelManager: null
    };

    // Mock localStorage
    localStorageGetItemStub = sinon.stub();
    localStorageSetItemStub = sinon.stub();
    global.localStorage = {
      getItem: localStorageGetItemStub,
      setItem: localStorageSetItemStub
    };

    // Sync to window
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.noStroke = global.noStroke;
    window.rect = global.rect;
    window.textSize = global.textSize;
    window.textAlign = global.textAlign;
    window.text = global.text;
    window.textWidth = global.textWidth;
    window.textFont = global.textFont;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.TOP = global.TOP;
    window.devConsoleEnabled = global.devConsoleEnabled;
    window.localStorage = global.localStorage;
    window.CollisionBox2D = global.CollisionBox2D;

    // Load dependencies
    Button = require('../../../Classes/systems/Button.js');
    ButtonStyles = Button.ButtonStyles; // Extract ButtonStyles from Button module
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

    // Sync to window AND global (for DraggablePanelManager.createDefaultPanels)
    window.Button = Button;
    window.ButtonStyles = ButtonStyles;
    window.DraggablePanel = DraggablePanel;
    window.DraggablePanelManager = DraggablePanelManager;
    global.Button = Button;
    global.ButtonStyles = ButtonStyles;
    global.DraggablePanel = DraggablePanel;
    global.DraggablePanelManager = DraggablePanelManager;
  });

  beforeEach(() => {
    // Reset stubs
    localStorageGetItemStub.reset();
    localStorageSetItemStub.reset();
    localStorageGetItemStub.returns(null);

    // Create fresh manager instance
    manager = new DraggablePanelManager();
    global.window.draggablePanelManager = manager;
    window.draggablePanelManager = manager;
  });

  afterEach(() => {
    if (manager) {
      manager.panels.clear();
      manager = null;
    }
    global.window.draggablePanelManager = null;
    window.draggablePanelManager = null;
  });

  after(() => {
    sinon.restore();
  });

  describe('ant_spawn Panel Auto-Sizing', () => {
    it('should enable auto-sizing on ant_spawn panel', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('ant_spawn');
      
      expect(panel).to.exist;
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });

    it('should auto-size height based on button content', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('ant_spawn');
      
      // Calculate expected height
      const titleBarHeight = panel.calculateTitleBarHeight();
      const buttonHeight = 24; // From config
      const spacing = 3; // From config
      const buttonCount = panel.buttons.length;
      const verticalPadding = panel.config.buttons.verticalPadding;
      
      // Expected: titleBar + (buttons * height) + (spaces * spacing) + (verticalPadding * 2)
      const expectedContentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedPanelHeight = titleBarHeight + expectedContentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedPanelHeight, 2);
    });

    it('should maintain stable height over multiple updates', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('ant_spawn');
      
      const initialHeight = panel.config.size.height;
      
      // Run multiple update cycles
      for (let i = 0; i < 10; i++) {
        panel.update(0, 0, false);
      }
      
      expect(panel.config.size.height).to.equal(initialHeight);
    });

    it('should have correct vertical padding applied', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('ant_spawn');
      
      expect(panel.config.buttons.verticalPadding).to.equal(10);
      expect(panel.config.buttons.horizontalPadding).to.equal(10);
    });
  });

  describe('health_controls Panel Auto-Sizing', () => {
    it('should enable auto-sizing on health_controls panel', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('health_controls');
      
      expect(panel).to.exist;
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });

    it('should auto-size height based on button content', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('health_controls');
      
      // Calculate expected height
      const titleBarHeight = panel.calculateTitleBarHeight();
      const buttonHeight = 30; // From config
      const spacing = 5; // From config
      const buttonCount = panel.buttons.length;
      const verticalPadding = panel.config.buttons.verticalPadding;
      
      // Expected: titleBar + (buttons * height) + (spaces * spacing) + (verticalPadding * 2)
      const expectedContentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedPanelHeight = titleBarHeight + expectedContentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedPanelHeight, 2);
    });

    it('should maintain stable height over multiple updates', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('health_controls');
      
      const initialHeight = panel.config.size.height;
      
      // Run multiple update cycles
      for (let i = 0; i < 10; i++) {
        panel.update(0, 0, false);
      }
      
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });

  describe('buildings Panel Auto-Sizing', () => {
    it('should enable auto-sizing on buildings panel', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('buildings');
      
      expect(panel).to.exist;
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });

    it('should auto-size height based on button content', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('buildings');
      
      // Calculate expected height
      const titleBarHeight = panel.calculateTitleBarHeight();
      const buttonHeight = 35; // From config
      const spacing = 5; // From config
      const buttonCount = panel.buttons.length;
      const verticalPadding = panel.config.buttons.verticalPadding;
      
      // Expected: titleBar + (buttons * height) + (spaces * spacing) + (verticalPadding * 2)
      const expectedContentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedPanelHeight = titleBarHeight + expectedContentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedPanelHeight, 2);
    });

    it('should maintain stable height over multiple updates', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('buildings');
      
      const initialHeight = panel.config.size.height;
      
      // Run multiple update cycles
      for (let i = 0; i < 10; i++) {
        panel.update(0, 0, false);
      }
      
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });

  describe('Auto-Sizing Behavior', () => {
    it('should not resize width for vertical layout panels', () => {
      manager.createDefaultPanels();
      const panel = manager.panels.get('ant_spawn');
      
      const initialWidth = panel.config.size.width;
      
      // Run update (which calls autoResizeToFitContent)
      panel.update(0, 0, false);
      
      // Width should remain unchanged for vertical layouts
      expect(panel.config.size.width).to.equal(initialWidth);
    });

    it('should only resize enabled panels', () => {
      manager.createDefaultPanels();
      
      // Get panels with and without auto-sizing
      const autoSizedPanel = manager.panels.get('ant_spawn');
      const normalPanel = manager.panels.get('resources'); // This doesn't have autoSizeToContent
      
      expect(autoSizedPanel.config.buttons.autoSizeToContent).to.be.true;
      expect(normalPanel.config.buttons.autoSizeToContent).to.not.be.true;
    });

    it('should apply correct padding to all auto-sized panels', () => {
      manager.createDefaultPanels();
      
      const panelsToCheck = ['ant_spawn', 'health_controls', 'buildings'];
      
      panelsToCheck.forEach(panelId => {
        const panel = manager.panels.get(panelId);
        if (panel && panel.config.buttons.autoSizeToContent) {
          expect(panel.config.buttons.verticalPadding).to.equal(10);
          expect(panel.config.buttons.horizontalPadding).to.equal(10);
        }
      });
    });

    it('should not cause panel growth over time', () => {
      manager.createDefaultPanels();
      
      const panels = ['ant_spawn', 'health_controls', 'buildings'];
      const initialHeights = {};
      
      // Capture initial heights
      panels.forEach(panelId => {
        const panel = manager.panels.get(panelId);
        initialHeights[panelId] = panel.config.size.height;
      });
      
      // Run 100 update cycles
      for (let i = 0; i < 100; i++) {
        panels.forEach(panelId => {
          const panel = manager.panels.get(panelId);
          panel.update(0, 0, false);
        });
      }
      
      // Verify heights haven't changed
      panels.forEach(panelId => {
        const panel = manager.panels.get(panelId);
        expect(panel.config.size.height).to.equal(initialHeights[panelId]);
      });
    });
  });

  describe('Width Preservation for Vertical Layouts', () => {
    it('should preserve width when autoSizeToContent is enabled on vertical layout', () => {
      const panel = new DraggablePanel({
        id: 'test-vertical',
        title: 'Test',
        size: { width: 150, height: 100 },
        buttons: {
          layout: 'vertical',
          autoSizeToContent: true,
          verticalPadding: 10,
          items: [
            { caption: 'Button 1', height: 30, width: 80 },
            { caption: 'Button 2', height: 30, width: 80 }
          ]
        }
      });

      const initialWidth = panel.config.size.width;
      panel.update(0, 0, false);
      
      expect(panel.config.size.width).to.equal(initialWidth);
    });
  });
});
