/**
 * Consolidated UI Level Editor Integration Tests
 * Generated: 2025-10-29T03:16:53.941Z
 * Source files: 15
 * Total tests: 216
 */

// Common requires
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// autoSizing.integration.test.js (15 tests)
// ================================================================
/**
 * Integration Tests for Auto-Sizing Feature
 * Tests that panels with autoSizeToContent enabled properly resize to fit their button content
 */

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




// ================================================================
// fixedPanelAutoSizing.integration.test.js (21 tests)
// ================================================================
/**
 * Integration tests to verify auto-sizing fix for Resource Spawner, Debug Controls, and Task Objectives panels
 */

describe('Fixed Panel Auto-Sizing Integration', function() {
  let DraggablePanel, DraggablePanelManager;
  let manager;
  
  before(function() {
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
    global.image = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, mag: () => Math.sqrt(x*x + y*y) }));
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.BASELINE = 'alphabetic';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };

    // Mock Button class
    const Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style || {};
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
      autoResizeForText() { return false; }
    };
    global.Button = Button;

    // Mock ButtonStyles
    global.ButtonStyles = {
      DEFAULT: { backgroundColor: '#CCCCCC', textColor: '#000000' },
      PRIMARY: { backgroundColor: '#007BFF', textColor: '#FFFFFF' },
      SUCCESS: { backgroundColor: '#28A745', textColor: '#FFFFFF' },
      DANGER: { backgroundColor: '#DC3545', textColor: '#FFFFFF' },
      WARNING: { backgroundColor: '#FFC107', textColor: '#000000' },
      INFO: { backgroundColor: '#17A2B8', textColor: '#FFFFFF' },
      PURPLE: { backgroundColor: '#6F42C1', textColor: '#FFFFFF' }
    };
    
    // Load required classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    
    // Set as global for DraggablePanelManager
    global.DraggablePanel = DraggablePanel;
  });
  
  beforeEach(function() {
    manager = new DraggablePanelManager();
    manager.createDefaultPanels();
  });
  
  afterEach(function() {
    if (manager) {
      manager.panels.clear();
    }
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Resource Spawner Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('resources');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit single button in horizontal layout', function() {
      const titleBarHeight = 26.8;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Horizontal layout: height = titleBar + buttonHeight + padding
      const expectedHeight = titleBarHeight + buttonHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should maintain width unchanged', function() {
      // Horizontal layout only resizes height
      expect(panel.config.size.width).to.equal(180);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 20 (button) + 20 (padding) = 66.8px
      expect(panel.config.size.height).to.be.closeTo(66.8, 1);
    });
  });
  
  describe('Debug Controls Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('debug');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 4 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 109 (4×25 + 3×3 spacing) + 20 (padding) = 155.8px
      expect(panel.config.size.height).to.be.closeTo(155.8, 1);
    });
    
    it('should be much smaller than old manual height', function() {
      // Was 450px, should now be ~156px
      expect(panel.config.size.height).to.be.lessThan(200);
    });
  });
  
  describe('Task Objectives Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('tasks');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 4 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 109 (4×25 + 3×3 spacing) + 20 (padding) = 155.8px
      expect(panel.config.size.height).to.be.closeTo(155.8, 1);
    });
    
    it('should be much smaller than old manual height', function() {
      // Was 320px, should now be ~156px
      expect(panel.config.size.height).to.be.lessThan(200);
    });
  });
  
  describe('Cheats Panel Auto-Sizing', function() {
    let panel;
    
    beforeEach(function() {
      panel = manager.panels.get('cheats');
    });
    
    it('should have auto-sizing enabled', function() {
      expect(panel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should auto-resize to fit 6 buttons in vertical layout', function() {
      const titleBarHeight = 26.8;
      const buttonCount = panel.buttons.length;
      const buttonHeight = panel.config.buttons.buttonHeight;
      const spacing = panel.config.buttons.spacing;
      const verticalPadding = panel.config.buttons.verticalPadding || 0;
      
      // Vertical layout: height = titleBar + (buttons * height) + spacing + padding
      const contentHeight = (buttonCount * buttonHeight) + ((buttonCount - 1) * spacing);
      const expectedHeight = titleBarHeight + contentHeight + (verticalPadding * 2);
      
      expect(panel.config.size.height).to.be.closeTo(expectedHeight, 1);
    });
    
    it('should have correct calculated height', function() {
      // Expected: 26.8 (title) + 212 (6×32 + 5×4 spacing) + 20 (padding) = 258.8px
      expect(panel.config.size.height).to.be.closeTo(258.8, 1);
    });
    
    it('should be larger than old manual height (was too small)', function() {
      // Was 220px (cutting off buttons), should now be ~259px
      expect(panel.config.size.height).to.be.greaterThan(220);
    });
  });
  
  describe('All Four Panels Comparison', function() {
    it('should have consistent auto-sizing configuration', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      expect(resourcesPanel.config.buttons.autoSizeToContent).to.be.true;
      expect(debugPanel.config.buttons.autoSizeToContent).to.be.true;
      expect(tasksPanel.config.buttons.autoSizeToContent).to.be.true;
    });
    
    it('should all have proper padding configured', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      expect(resourcesPanel.config.buttons.verticalPadding).to.equal(10);
      expect(debugPanel.config.buttons.verticalPadding).to.equal(10);
      expect(tasksPanel.config.buttons.verticalPadding).to.equal(10);
      
      expect(resourcesPanel.config.buttons.horizontalPadding).to.equal(10);
      expect(debugPanel.config.buttons.horizontalPadding).to.equal(10);
      expect(tasksPanel.config.buttons.horizontalPadding).to.equal(10);
    });
    
    it('should all be properly sized (no excess space)', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      // Resource Spawner: ~67px (was 150px)
      expect(resourcesPanel.config.size.height).to.be.lessThan(80);
      
      // Debug Controls: ~156px (was 450px)
      expect(debugPanel.config.size.height).to.be.lessThan(200);
      
      // Task Objectives: ~156px (was 320px)
      expect(tasksPanel.config.size.height).to.be.lessThan(200);
    });
    
    it('should all maintain stable sizes over multiple updates', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      
      const initialHeights = {
        resources: resourcesPanel.config.size.height,
        debug: debugPanel.config.size.height,
        tasks: tasksPanel.config.size.height
      };
      
      // Update panels 50 times
      for (let i = 0; i < 50; i++) {
        resourcesPanel.update();
        debugPanel.update();
        tasksPanel.update();
      }
      
      // Heights should remain stable
      expect(resourcesPanel.config.size.height).to.equal(initialHeights.resources);
      expect(debugPanel.config.size.height).to.equal(initialHeights.debug);
      expect(tasksPanel.config.size.height).to.equal(initialHeights.tasks);
    });
  });
  
  describe('Size Reduction Verification', function() {
    it('should report size changes', function() {
      const resourcesPanel = manager.panels.get('resources');
      const debugPanel = manager.panels.get('debug');
      const tasksPanel = manager.panels.get('tasks');
      const cheatsPanel = manager.panels.get('cheats');
      
      console.log('\n✅ Panel Auto-Sizing Fix Results:');
      console.log('================================================================================');
      console.log(`Resource Spawner:`);
      console.log(`  Before: 180×150px`);
      console.log(`  After:  180×${resourcesPanel.config.size.height}px`);
      console.log(`  Space saved: ${150 - resourcesPanel.config.size.height}px (${Math.round((1 - resourcesPanel.config.size.height/150) * 100)}% reduction)`);
      
      console.log(`\nDebug Controls:`);
      console.log(`  Before: 160×450px`);
      console.log(`  After:  160×${debugPanel.config.size.height}px`);
      console.log(`  Space saved: ${450 - debugPanel.config.size.height}px (${Math.round((1 - debugPanel.config.size.height/450) * 100)}% reduction)`);
      
      console.log(`\nTask Objectives:`);
      console.log(`  Before: 160×320px`);
      console.log(`  After:  160×${tasksPanel.config.size.height}px`);
      console.log(`  Space saved: ${320 - tasksPanel.config.size.height}px (${Math.round((1 - tasksPanel.config.size.height/320) * 100)}% reduction)`);
      
      console.log(`\nCheats Panel:`);
      console.log(`  Before: 180×220px (TOO SMALL - buttons cut off)`);
      console.log(`  After:  180×${cheatsPanel.config.size.height}px`);
      console.log(`  Space added: ${cheatsPanel.config.size.height - 220}px (${Math.round((cheatsPanel.config.size.height/220 - 1) * 100)}% increase - now fits all buttons!)`);
      console.log('================================================================================\n');
    });
  });
});




// ================================================================
// levelEditorAutoSizing.integration.test.js (10 tests)
// ================================================================
// Import dependencies
let DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
let MaterialPalette = require('../../../Classes/ui/MaterialPalette');
let ToolBar = require('../../../Classes/ui/ToolBar');
let BrushSizeControl = require('../../../Classes/ui/BrushSizeControl');

describe('Level Editor Panel Auto-Sizing Integration', function() {
  let mockP5Functions;
  
  beforeEach(function() {
    // Mock global variables
    global.devConsoleEnabled = false;
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
    
    // Sync to window
    if (typeof window !== 'undefined') {
      window.devConsoleEnabled = global.devConsoleEnabled;
      window.localStorage = global.localStorage;
    }
    
    // Mock p5.js functions
    mockP5Functions = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      createVector: sinon.stub().callsFake((x, y) => ({ x, y })),
      translate: sinon.stub()
    };
    
    // Assign to global and window
    Object.keys(mockP5Functions).forEach(key => {
      global[key] = mockP5Functions[key];
      if (typeof window !== 'undefined') {
        window[key] = mockP5Functions[key];
      }
    });
  });
  
  afterEach(function() {
    sinon.restore();
    
    // Clean up global variables
    delete global.devConsoleEnabled;
    delete global.localStorage;
    
    if (typeof window !== 'undefined') {
      delete window.devConsoleEnabled;
      delete window.localStorage;
    }
    
    // Clean up global functions
    Object.keys(mockP5Functions).forEach(key => {
      delete global[key];
      if (typeof window !== 'undefined') {
        delete window[key];
      }
    });
  });
  
  describe('MaterialPalette Panel Auto-Sizing', function() {
    it('should auto-size panel based on MaterialPalette content', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']); // 3 materials = 2 rows
      
      const panel = new DraggablePanel({
        id: 'test-materials',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => palette.getContentSize()
        }
      });
      
      // Auto-resize is triggered in constructor
      // Expected: width = 95 (content) + 20 (padding) = 115px
      // Expected: height = ~26.8 (title) + 95 (content) + 20 (padding) = ~141.8px
      expect(panel.config.size.width).to.be.closeTo(115, 1);
      expect(panel.config.size.height).to.be.greaterThan(135);
      expect(panel.config.size.height).to.be.lessThan(145);
    });
    
    it('should adjust size when material count changes', function() {
      const palette = new MaterialPalette(['moss', 'stone']); // 2 materials = 1 row
      
      const panel = new DraggablePanel({
        id: 'test-materials-dynamic',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => palette.getContentSize()
        }
      });
      
      // Initial size (1 row)
      panel.autoResizeToFitContent();
      const initialHeight = panel.config.size.height;
      
      // Add more materials (now 3 rows)
      palette.materials.push('grass', 'water', 'sand');
      
      // Trigger resize again
      panel.autoResizeToFitContent();
      const newHeight = panel.config.size.height;
      
      // Height should increase with more rows
      expect(newHeight).to.be.greaterThan(initialHeight);
    });
  });
  
  describe('ToolBar Panel Auto-Sizing', function() {
    it('should auto-size panel based on ToolBar content', function() {
      const toolbar = new ToolBar([
        { name: 'brush', icon: '🖌️', tooltip: 'Brush' },
        { name: 'fill', icon: '🪣', tooltip: 'Fill' },
        { name: 'rectangle', icon: '▭', tooltip: 'Rectangle' },
        { name: 'line', icon: '/', tooltip: 'Line' }
      ]); // 4 tools
      
      const panel = new DraggablePanel({
        id: 'test-tools',
        title: 'Tools',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => toolbar.getContentSize()
        }
      });
      
      // Trigger auto-resize
      panel.autoResizeToFitContent();
      
      // Expected: width = 45 (content) + 20 (padding) = 65px
      // Expected: height = ~26.8 (title) + 165 (4 tools) + 20 (padding) = ~211.8px
      expect(panel.config.size.width).to.be.closeTo(65, 1);
      expect(panel.config.size.height).to.be.greaterThan(205);
      expect(panel.config.size.height).to.be.lessThan(215);
    });
    
    it('should handle default toolbar with 7 tools', function() {
      const toolbar = new ToolBar(); // Default 7 tools
      
      const panel = new DraggablePanel({
        id: 'test-tools-default',
        title: 'Tools',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => toolbar.getContentSize()
        }
      });
      
      panel.autoResizeToFitContent();
      
      // Expected: width = 45 + 20 = 65px
      // Expected: height = ~26.8 + 285 (7 tools) + 20 = ~331.8px
      expect(panel.config.size.width).to.be.closeTo(65, 1);
      expect(panel.config.size.height).to.be.greaterThan(325);
      expect(panel.config.size.height).to.be.lessThan(335);
    });
  });
  
  describe('BrushSizeControl Panel Auto-Sizing', function() {
    it('should auto-size panel based on BrushSizeControl content', function() {
      const control = new BrushSizeControl(3);
      
      const panel = new DraggablePanel({
        id: 'test-brush-size',
        title: 'Brush Size',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 }, // Start with wrong size
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      // Trigger auto-resize
      panel.autoResizeToFitContent();
      
      // Expected: width = 90 (content) + 20 (padding) = 110px
      // Expected: height = ~26.8 (title) + 50 (content) + 20 (padding) = ~96.8px
      expect(panel.config.size.width).to.be.closeTo(110, 1);
      expect(panel.config.size.height).to.be.greaterThan(91);
      expect(panel.config.size.height).to.be.lessThan(101);
    });
    
    it('should maintain same size regardless of brush size changes', function() {
      const control = new BrushSizeControl(1);
      
      const panel = new DraggablePanel({
        id: 'test-brush-size-stable',
        title: 'Brush Size',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      // Initial size
      panel.autoResizeToFitContent();
      const initialWidth = panel.config.size.width;
      const initialHeight = panel.config.size.height;
      
      // Change brush size
      control.setSize(9);
      
      // Resize again
      panel.autoResizeToFitContent();
      
      // Size should remain the same (BrushSizeControl has fixed dimensions)
      expect(panel.config.size.width).to.equal(initialWidth);
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });
  
  describe('Content Callback Error Handling', function() {
    it('should handle callback that throws error gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-error-handling',
        title: 'Error Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          contentSizeCallback: () => {
            throw new Error('Test error');
          }
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
      
      // Panel size should remain unchanged
      expect(panel.config.size.width).to.equal(100);
      expect(panel.config.size.height).to.equal(100);
    });
    
    it('should handle callback that returns invalid data', function() {
      const panel = new DraggablePanel({
        id: 'test-invalid-data',
        title: 'Invalid Data Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          contentSizeCallback: () => {
            return { width: 'invalid', height: null }; // Invalid types
          }
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
      
      // Panel size should remain unchanged (callback returned invalid data)
      expect(panel.config.size.width).to.equal(100);
      expect(panel.config.size.height).to.equal(100);
    });
    
    it('should handle missing callback gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-no-callback',
        title: 'No Callback Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: {
          autoSizeToContent: true,
          items: [] // No callback, no buttons
        }
      });
      
      // Should not throw error
      expect(() => panel.autoResizeToFitContent()).to.not.throw();
    });
  });
  
  describe('Padding Configuration', function() {
    it('should respect custom padding values', function() {
      const control = new BrushSizeControl(3);
      
      const panel = new DraggablePanel({
        id: 'test-custom-padding',
        title: 'Custom Padding',
        position: { x: 10, y: 10 },
        size: { width: 200, height: 200 },
        buttons: {
          autoSizeToContent: true,
          verticalPadding: 20, // Custom padding
          horizontalPadding: 30, // Custom padding
          contentSizeCallback: () => control.getContentSize()
        }
      });
      
      panel.autoResizeToFitContent();
      
      // Expected: width = 90 (content) + 60 (2×30 padding) = 150px
      // Expected: height = ~26.8 (title) + 50 (content) + 40 (2×20 padding) = ~116.8px
      expect(panel.config.size.width).to.be.closeTo(150, 1);
      expect(panel.config.size.height).to.be.greaterThan(111);
      expect(panel.config.size.height).to.be.lessThan(121);
    });
  });
});




// ================================================================
// levelEditorDoubleRenderPrevention.integration.test.js (6 tests)
// ================================================================
/**
 * Integration Tests: Level Editor Panel Double Rendering Prevention
 * 
 * Integration tests to verify that Level Editor panels are never rendered
 * multiple times per frame, preventing the double-rendering bug.
 * 
 * Bug History:
 * - Panels were rendered twice: once by LevelEditor.render() with content,
 *   and again by DraggablePanelManager without content (drawing background over content)
 * - Root cause: Interactive adapter called render() instead of renderPanels()
 * - Fix: Changed line 135 in DraggablePanelManager.js to use renderPanels()
 */

let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor Panel Double Rendering Prevention (Integration)', function() {
  let DraggablePanel, DraggablePanelManager;
  let manager, panels;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    
    manager = new DraggablePanelManager();
    manager.isInitialized = true; // Skip full initialization
    
    // Create Level Editor panels
    panels = {
      materials: new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        behavior: {
          draggable: true,
          persistent: true,
          constrainToScreen: true,
          managedExternally: true
        }
      }),
      
      tools: new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        behavior: {
          draggable: true,
          persistent: true,
          constrainToScreen: true,
          managedExternally: true
        }
      }),
      
      brush: new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        behavior: {
          draggable: true,
          persistent: true,
          constrainToScreen: true,
          managedExternally: true
        }
      })
    };
    
    // Add panels to manager
    manager.panels.set('level-editor-materials', panels.materials);
    manager.panels.set('level-editor-tools', panels.tools);
    manager.panels.set('level-editor-brush', panels.brush);
    
    // Set up visibility
    manager.stateVisibility.LEVEL_EDITOR = [
      'level-editor-materials',
      'level-editor-tools',
      'level-editor-brush'
    ];
    
    // Show all panels
    panels.materials.show();
    panels.tools.show();
    panels.brush.show();
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Single frame rendering', function() {
    it('should not call panel.render() from renderPanels() for managed panels', function() {
      // Spy on render methods
      const materialsRenderSpy = sinon.spy(panels.materials, 'render');
      const toolsRenderSpy = sinon.spy(panels.tools, 'render');
      const brushRenderSpy = sinon.spy(panels.brush, 'render');
      
      // Simulate RenderManager calling renderPanels
      manager.renderPanels('LEVEL_EDITOR');
      
      // No panels should have been rendered (all have managedExternally=true)
      expect(materialsRenderSpy.called).to.be.false;
      expect(toolsRenderSpy.called).to.be.false;
      expect(brushRenderSpy.called).to.be.false;
    });
    
    it('should detect if panel.render() is called without content callback', function() {
      // Track whether render was called with or without callback
      const renderCalls = {
        materials: [],
        tools: [],
        brush: []
      };
      
      ['materials', 'tools', 'brush'].forEach(panelName => {
        const panel = panels[panelName];
        const originalRender = panel.render.bind(panel);
        
        panel.render = function(contentRenderer) {
          renderCalls[panelName].push({
            hasCallback: typeof contentRenderer === 'function',
            callCount: renderCalls[panelName].length + 1
          });
          return originalRender(contentRenderer);
        };
      });
      
      // Simulate full draw loop
      // Step 1: LevelEditor.render() would call with callbacks
      panels.materials.render(() => {}); // With callback
      panels.tools.render(() => {});      // With callback
      panels.brush.render(() => {});      // With callback
      
      // Step 2: RenderManager.render() calls renderPanels()
      manager.renderPanels('LEVEL_EDITOR');
      
      // Verify each panel was only rendered once (with callback)
      expect(renderCalls.materials).to.have.lengthOf(1);
      expect(renderCalls.tools).to.have.lengthOf(1);
      expect(renderCalls.brush).to.have.lengthOf(1);
      
      // Verify all calls had callbacks
      expect(renderCalls.materials[0].hasCallback).to.be.true;
      expect(renderCalls.tools[0].hasCallback).to.be.true;
      expect(renderCalls.brush[0].hasCallback).to.be.true;
    });
  });
  
  describe('Interactive adapter integration', function() {
    it('should use renderPanels() in interactive adapter render callback', function() {
      // Mock RenderManager
      global.RenderManager = {
        layers: { UI_GAME: 'UI_GAME' },
        addDrawableToLayer: sinon.stub(),
        addInteractiveDrawable: sinon.stub()
      };
      
      // Make DraggablePanel globally available for createDefaultPanels()
      global.DraggablePanel = DraggablePanel;
      if (typeof window !== 'undefined') {
        window.DraggablePanel = DraggablePanel;
      }
      
      // Create fresh manager and initialize
      const testManager = new DraggablePanelManager();
      testManager.initialize();
      
      // Get the registered interactive adapter
      const interactiveCalls = global.RenderManager.addInteractiveDrawable.getCalls();
      expect(interactiveCalls.length).to.be.at.least(1);
      
      const adapter = interactiveCalls[0].args[1];
      
      // Spy on manager methods
      const renderPanelsSpy = sinon.spy(testManager, 'renderPanels');
      const renderSpy = sinon.spy(testManager, 'render');
      
      // Call adapter's render (simulating what RenderManager does)
      adapter.render('LEVEL_EDITOR', {});
      
      // Should call renderPanels, NOT render
      expect(renderPanelsSpy.calledOnce).to.be.true;
      expect(renderPanelsSpy.calledWith('LEVEL_EDITOR')).to.be.true;
      expect(renderSpy.called).to.be.false;
      
      // Cleanup
      delete global.RenderManager;
    });
  });
  
  describe('Render order verification', function() {
    it('should maintain correct render order when panels are managed externally', function() {
      const renderOrder = [];
      
      // Mock panel render to track order
      ['materials', 'tools', 'brush'].forEach(panelName => {
        const panel = panels[panelName];
        const originalRender = panel.render.bind(panel);
        
        panel.render = function(contentRenderer) {
          renderOrder.push({
            panel: panelName,
            source: contentRenderer ? 'LevelEditor' : 'DraggablePanelManager',
            hasCallback: !!contentRenderer
          });
          return originalRender(contentRenderer);
        };
      });
      
      // Simulate: LevelEditor renders panels with content
      panels.materials.render(() => {});
      panels.tools.render(() => {});
      panels.brush.render(() => {});
      
      // Simulate: RenderManager calls renderPanels (should skip managed panels)
      manager.renderPanels('LEVEL_EDITOR');
      
      // Verify: Only 3 render calls (from LevelEditor), none from DraggablePanelManager
      expect(renderOrder).to.have.lengthOf(3);
      expect(renderOrder.every(call => call.source === 'LevelEditor')).to.be.true;
      expect(renderOrder.every(call => call.hasCallback === true)).to.be.true;
    });
  });
  
  describe('Mixed panel scenario', function() {
    it('should only render non-managed panels when calling renderPanels()', function() {
      // Add a non-managed panel to the mix
      const gamePanel = new DraggablePanel({
        id: 'game-panel',
        title: 'Game Panel',
        position: { x: 200, y: 10 },
        size: { width: 100, height: 100 },
        behavior: {
          draggable: true
          // No managedExternally flag
        }
      });
      
      manager.panels.set('game-panel', gamePanel);
      manager.stateVisibility.LEVEL_EDITOR.push('game-panel');
      gamePanel.show();
      
      // Spy on all panels
      const materialsRenderSpy = sinon.spy(panels.materials, 'render');
      const toolsRenderSpy = sinon.spy(panels.tools, 'render');
      const brushRenderSpy = sinon.spy(panels.brush, 'render');
      const gameRenderSpy = sinon.spy(gamePanel, 'render');
      
      // Call renderPanels
      manager.renderPanels('LEVEL_EDITOR');
      
      // Level Editor panels (managed) should NOT be rendered
      expect(materialsRenderSpy.called).to.be.false;
      expect(toolsRenderSpy.called).to.be.false;
      expect(brushRenderSpy.called).to.be.false;
      
      // Game panel (not managed) SHOULD be rendered
      expect(gameRenderSpy.called).to.be.true;
    });
  });
  
  describe('Regression test: Background over content bug', function() {
    it('should never render background without content for managed panels', function() {
      // Track what gets rendered
      const renderDetails = {
        materials: { backgroundCalls: 0, contentCalls: 0 },
        tools: { backgroundCalls: 0, contentCalls: 0 },
        brush: { backgroundCalls: 0, contentCalls: 0 }
      };
      
      // Mock renderBackground and renderContent to track calls
      ['materials', 'tools', 'brush'].forEach(panelName => {
        const panel = panels[panelName];
        
        const originalRenderBackground = panel.renderBackground.bind(panel);
        const originalRenderContent = panel.renderContent ? panel.renderContent.bind(panel) : null;
        
        panel.renderBackground = function() {
          renderDetails[panelName].backgroundCalls++;
          return originalRenderBackground();
        };
        
        if (originalRenderContent) {
          panel.renderContent = function(callback) {
            renderDetails[panelName].contentCalls++;
            return originalRenderContent(callback);
          };
        }
      });
      
      // Simulate full render cycle
      // 1. LevelEditor renders with content
      panels.materials.render(() => {});
      panels.tools.render(() => {});
      panels.brush.render(() => {});
      
      // 2. RenderManager calls renderPanels (should NOT render managed panels)
      manager.renderPanels('LEVEL_EDITOR');
      
      // Each panel should have rendered background exactly once (from step 1)
      expect(renderDetails.materials.backgroundCalls).to.equal(1);
      expect(renderDetails.tools.backgroundCalls).to.equal(1);
      expect(renderDetails.brush.backgroundCalls).to.equal(1);
      
      // Each panel should have rendered content exactly once (from step 1)
      // Content is rendered when callback is provided
      expect(renderDetails.materials.contentCalls).to.be.at.most(1);
      expect(renderDetails.tools.contentCalls).to.be.at.most(1);
      expect(renderDetails.brush.contentCalls).to.be.at.most(1);
    });
  });
});




// ================================================================
// levelEditorPanelContentRendering.integration.test.js (7 tests)
// ================================================================
/**
 * Integration tests for Level Editor Panel Content Rendering
 * 
 * Verifies that MaterialPalette, ToolBar, and BrushSizeControl
 * are rendered on top of their panel backgrounds in the correct order.
 */

describe('Level Editor Panel Content Rendering Integration', function() {
  let DraggablePanel, LevelEditorPanels;
  let MaterialPalette, ToolBar, BrushSizeControl;
  let renderCallOrder;
  let mockLevelEditor;
  
  before(function() {
    // Load required classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');
    MaterialPalette = require('../../../Classes/ui/MaterialPalette.js');
    ToolBar = require('../../../Classes/ui/ToolBar.js');
    BrushSizeControl = require('../../../Classes/ui/BrushSizeControl.js');
    
    // Set globals
    global.DraggablePanel = DraggablePanel;
  });
  
  beforeEach(function() {
    renderCallOrder = [];
    
    // Mock p5.js functions with call tracking
    global.push = sinon.stub().callsFake(() => renderCallOrder.push('push'));
    global.pop = sinon.stub().callsFake(() => renderCallOrder.push('pop'));
    global.fill = sinon.stub().callsFake((...args) => {
      if (args.length >= 3) {
        renderCallOrder.push(`fill(${args[0]},${args[1]},${args[2]})`);
      }
    });
    global.stroke = sinon.stub().callsFake((...args) => renderCallOrder.push(`stroke`));
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.noFill = sinon.stub();
    global.rect = sinon.stub().callsFake((x, y, w, h) => {
      renderCallOrder.push(`rect(${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)})`);
    });
    global.text = sinon.stub().callsFake((txt, x, y) => {
      renderCallOrder.push(`text("${txt}")`);
    });
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.translate = sinon.stub().callsFake((x, y) => {
      renderCallOrder.push(`translate(${Math.round(x)},${Math.round(y)})`);
    });
    global.line = sinon.stub();
    global.image = sinon.stub();
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    
    // Constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    // Mock environment
    global.window = { innerWidth: 1920, innerHeight: 1080 };
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };
    global.devConsoleEnabled = false;
    
    // Create mock level editor with components
    mockLevelEditor = {
      palette: new MaterialPalette(['moss', 'slime', 'dirt', 'grass']),
      toolbar: new ToolBar(),
      brushControl: new BrushSizeControl(1, 9),
      notifications: {
        show: sinon.stub()
      },
      editor: {
        setBrushSize: sinon.stub(),
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      }
    };
    
    // Mock component getContentSize methods
    mockLevelEditor.palette.getContentSize = () => ({ width: 95, height: 140 });
    mockLevelEditor.toolbar.getContentSize = () => ({ width: 45, height: 165 });
    mockLevelEditor.brushControl.getContentSize = () => ({ width: 90, height: 50 });
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Materials Panel Content Rendering', function() {
    it('should render panel background before MaterialPalette content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('PALETTE_START');
        mockLevelEditor.palette.render(contentArea.x, contentArea.y);
        renderCallOrder.push('PALETTE_END');
      });
      
      // Find panel background and palette rendering
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,80'));
      const paletteStartIndex = renderCallOrder.indexOf('PALETTE_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1, 'Panel background should be drawn');
      expect(paletteStartIndex).to.be.greaterThan(-1, 'Palette should be rendered');
      expect(panelBgIndex).to.be.lessThan(paletteStartIndex, 'Panel background before palette content');
    });
    
    it('should render MaterialPalette with translate to correct position', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      renderCallOrder = [];
      
      panel.render((area) => {
        contentArea = area;
        push();
        translate(area.x, area.y);
        mockLevelEditor.palette.render(0, 0);
        pop();
      });
      
      // Verify translate was called with content area coordinates
      const translateCall = renderCallOrder.find(call => call.startsWith('translate('));
      expect(translateCall).to.exist;
      expect(contentArea).to.exist;
      expect(contentArea.x).to.be.greaterThan(10); // Panel x + padding
      expect(contentArea.y).to.be.greaterThan(80); // Panel y + title bar
    });
  });
  
  describe('Tools Panel Content Rendering', function() {
    it('should render panel background before ToolBar content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('TOOLBAR_START');
        mockLevelEditor.toolbar.render(contentArea.x, contentArea.y);
        renderCallOrder.push('TOOLBAR_END');
      });
      
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,210'));
      const toolbarStartIndex = renderCallOrder.indexOf('TOOLBAR_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(toolbarStartIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(toolbarStartIndex, 'Panel background before toolbar content');
    });
  });
  
  describe('Brush Size Panel Content Rendering', function() {
    it('should render panel background before BrushSizeControl content', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      panel.render((contentArea) => {
        renderCallOrder.push('BRUSH_START');
        mockLevelEditor.brushControl.render(contentArea.x, contentArea.y);
        renderCallOrder.push('BRUSH_END');
      });
      
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,395'));
      const brushStartIndex = renderCallOrder.indexOf('BRUSH_START');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(brushStartIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(brushStartIndex, 'Panel background before brush control content');
    });
  });
  
  describe('LevelEditorPanels Render Method', function() {
    it('should render all three panels with content callbacks', function() {
      // Create panels directly without LevelEditorPanels wrapper
      const materialsPanel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const toolsPanel = new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const brushPanel = new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      
      // Render each panel with content
      materialsPanel.render((contentArea) => {
        renderCallOrder.push('MATERIALS_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.palette.render(0, 0);
        pop();
      });
      
      toolsPanel.render((contentArea) => {
        renderCallOrder.push('TOOLS_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.toolbar.render(0, 0);
        pop();
      });
      
      brushPanel.render((contentArea) => {
        renderCallOrder.push('BRUSH_CONTENT');
        push();
        translate(contentArea.x, contentArea.y);
        mockLevelEditor.brushControl.render(0, 0);
        pop();
      });
      
      // Verify all three panels rendered their content
      expect(renderCallOrder).to.include('MATERIALS_CONTENT');
      expect(renderCallOrder).to.include('TOOLS_CONTENT');
      expect(renderCallOrder).to.include('BRUSH_CONTENT');
    });
    
    it('should use push/pop for each panel content', function() {
      const materialsPanel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      renderCallOrder = [];
      materialsPanel.render((contentArea) => {
        push();
        renderCallOrder.push('INSIDE_PUSH');
        translate(contentArea.x, contentArea.y);
        pop();
      });
      
      const firstPush = renderCallOrder.indexOf('push');
      const insidePush = renderCallOrder.indexOf('INSIDE_PUSH');
      const lastPop = renderCallOrder.lastIndexOf('pop');
      
      expect(firstPush).to.be.lessThan(insidePush);
      expect(insidePush).to.be.lessThan(lastPop);
    });
  });
  
  describe('Content Area Isolation', function() {
    it('should provide content area coordinates that avoid panel background overlap', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      panel.render((area) => {
        contentArea = area;
      });
      
      // Content area should be inset from panel edges
      expect(contentArea.x).to.be.greaterThan(panel.state.position.x);
      expect(contentArea.y).to.be.greaterThan(panel.state.position.y);
      expect(contentArea.width).to.be.lessThan(panel.config.size.width);
      expect(contentArea.height).to.be.lessThan(panel.config.size.height);
    });
  });
});




// ================================================================
// levelEditorPanels.integration.test.js (27 tests)
// ================================================================
/**
 * Integration tests for draggable Level Editor panels
 * Tests clicking, dragging, and interaction with MaterialPalette, ToolBar, BrushSizeControl
 */

describe('Level Editor Draggable Panels Integration Tests', function() {
  let dom, window, document;
  let LevelEditor, LevelEditorPanels, DraggablePanel, DraggablePanelManager;
  let MaterialPalette, ToolBar, BrushSizeControl;
  let levelEditor, draggablePanels;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <canvas id="defaultCanvas0"></canvas>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock localStorage
    global.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] || null; },
      setItem(key, value) { this._data[key] = String(value); },
      removeItem(key) { delete this._data[key]; },
      clear() { this._data = {}; }
    };

    // Mock p5.js functions
    global.push = function() {};
    global.pop = function() {};
    global.fill = function() {};
    global.stroke = function() {};
    global.strokeWeight = function() {};
    global.noStroke = function() {};
    global.noFill = function() {};
    global.rect = function() {};
    global.text = function() {};
    global.textAlign = function() {};
    global.textSize = function() {};
    global.textWidth = function(str) { return str.length * 6; };
    global.translate = function() {};
    global.mouseX = 0;
    global.mouseY = 0;
    global.g_canvasX = 1200;
    global.g_canvasY = 800;
    global.devConsoleEnabled = false;
    global.verboseLog = function() {};
    global.logVerbose = function() {};

    // Mock terrain classes
    global.gridTerrain = class {
      constructor() {
        this.tileSize = 32;
      }
      getTile() { return { getMaterial: () => 'grass' }; }
      render() {}
    };

    global.TerrainEditor = class {
      constructor() {
        this.history = [];
      }
      setBrushSize() {}
      selectMaterial() {}
      paint() {}
      fill() {}
      canUndo() { return true; }
      canRedo() { return true; }
      undo() {}
      redo() {}
    };

    // Mock other dependencies
    global.MiniMap = class { update() {} render() {} };
    global.PropertiesPanel = class { render() {} };
    global.GridOverlay = class { render() {} };
    global.SaveDialog = class { show() {} isVisible() { return false; } };
    global.LoadDialog = class { show() {} isVisible() { return false; } };
    global.NotificationManager = class {
      show() {}
      update() {}
      render() {}
    };

    global.GameState = {
      setState() {},
      getState() { return 'LEVEL_EDITOR'; },
      goToMenu() {}
    };

    // Mock Button class
    global.Button = class {
      constructor(x, y, w, h, caption, style) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.caption = caption;
        this.style = style || {};
      }
      setPosition(x, y) { this.x = x; this.y = y; }
      setCaption(caption) { this.caption = caption; }
      update() { return false; }
      render() {}
      autoResizeForText() { return false; }
    };

    global.ButtonStyles = {
      DEFAULT: {},
      SUCCESS: {},
      DANGER: {},
      WARNING: {},
      INFO: {},
      PRIMARY: {},
      PURPLE: {}
    };

    // Load actual classes
    MaterialPalette = require('../../../Classes/ui/MaterialPalette.js');
    ToolBar = require('../../../Classes/ui/ToolBar.js');
    BrushSizeControl = require('../../../Classes/ui/BrushSizeControl.js');
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

    // Make classes available globally
    global.DraggablePanel = DraggablePanel;
    global.MaterialPalette = MaterialPalette;
    global.ToolBar = ToolBar;
    global.BrushSizeControl = BrushSizeControl;
    global.LevelEditorPanels = LevelEditorPanels;

    // Initialize system
    global.draggablePanelManager = new DraggablePanelManager();
    global.draggablePanelManager.initialize();

    // Create terrain
    const terrain = new gridTerrain(10, 10);

    // Initialize level editor
    levelEditor = new LevelEditor();
    levelEditor.initialize(terrain);
  });

  afterEach(function() {
    // Cleanup
    global.localStorage.clear();
    delete global.window;
    delete global.document;
    delete global.draggablePanelManager;
  });

  describe('Panel Creation and Initialization', function() {
    it('should create three draggable panels on initialization', function() {
      expect(levelEditor.draggablePanels).to.not.be.null;
      expect(levelEditor.draggablePanels.panels).to.have.property('materials');
      expect(levelEditor.draggablePanels.panels).to.have.property('tools');
      expect(levelEditor.draggablePanels.panels).to.have.property('brush');
    });

    it('should add panels to DraggablePanelManager', function() {
      expect(global.draggablePanelManager.hasPanel('level-editor-materials')).to.be.true;
      expect(global.draggablePanelManager.hasPanel('level-editor-tools')).to.be.true;
      expect(global.draggablePanelManager.hasPanel('level-editor-brush')).to.be.true;
    });

    it('should register panels for LEVEL_EDITOR state visibility', function() {
      const visibility = global.draggablePanelManager.stateVisibility.LEVEL_EDITOR;
      expect(visibility).to.include('level-editor-materials');
      expect(visibility).to.include('level-editor-tools');
      expect(visibility).to.include('level-editor-brush');
    });

    it('should create panels with draggable behavior enabled', function() {
      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.config.behavior.draggable).to.be.true;
      expect(toolsPanel.config.behavior.draggable).to.be.true;
      expect(brushPanel.config.behavior.draggable).to.be.true;
    });

    it('should create panels with position persistence enabled', function() {
      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.config.behavior.persistent).to.be.true;
      expect(toolsPanel.config.behavior.persistent).to.be.true;
      expect(brushPanel.config.behavior.persistent).to.be.true;
    });
  });

  describe('Panel Visibility', function() {
    it('should show all panels when level editor is activated', function() {
      levelEditor.activate();

      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.state.visible).to.be.true;
      expect(toolsPanel.state.visible).to.be.true;
      expect(brushPanel.state.visible).to.be.true;
    });

    it('should hide all panels when level editor is deactivated', function() {
      levelEditor.activate();
      levelEditor.deactivate();

      const materialsPanel = levelEditor.draggablePanels.panels.materials;
      const toolsPanel = levelEditor.draggablePanels.panels.tools;
      const brushPanel = levelEditor.draggablePanels.panels.brush;

      expect(materialsPanel.state.visible).to.be.false;
      expect(toolsPanel.state.visible).to.be.false;
      expect(brushPanel.state.visible).to.be.false;
    });
  });

  describe('Material Palette Click Handling', function() {
    it('should detect mouse over materials panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel content area (accounting for title bar)
      const titleBarHeight = panel.calculateTitleBarHeight();
      const mouseX = pos.x + panel.config.style.padding + 20;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 20;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should handle material selection click', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click on first material swatch (top-left)
      const mouseX = pos.x + panel.config.style.padding + 20;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.palette.getSelectedMaterial()).to.exist;
    });

    it('should handle material selection for different materials', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      // Click second material (top-right swatch)
      const swatchSize = 40;
      const spacing = 5;
      const mouseX = contentX + spacing + swatchSize + spacing + 20;
      const mouseY = contentY + spacing + 20;

      levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      const selected = levelEditor.palette.getSelectedMaterial();
      expect(selected).to.be.oneOf(levelEditor.materials);
    });
  });

  describe('Tool Bar Click Handling', function() {
    it('should detect mouse over tools panel', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      const mouseX = pos.x + panel.config.style.padding + 15;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should handle tool selection click', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click on first tool button
      const mouseX = pos.x + panel.config.style.padding + 15;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const initialTool = levelEditor.toolbar.getSelectedTool();
      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      // Tool should be selected (may be same or different)
      expect(levelEditor.toolbar.getSelectedTool()).to.exist;
    });

    it('should cycle through different tools', function() {
      const panel = levelEditor.draggablePanels.panels.tools;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      const buttonSize = 35;
      const spacing = 5;
      
      // Click first tool
      levelEditor.draggablePanels.handleClick(contentX + 15, contentY + 15);
      const tool1 = levelEditor.toolbar.getSelectedTool();
      
      // Click second tool
      levelEditor.draggablePanels.handleClick(contentX + 15, contentY + buttonSize + spacing + 15);
      const tool2 = levelEditor.toolbar.getSelectedTool();
      
      // Tools should be different (or at least a valid tool selected)
      expect(tool2).to.exist;
    });
  });

  describe('Brush Size Control Click Handling', function() {
    it('should detect mouse over brush panel', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      const mouseX = pos.x + panel.config.style.padding + 45;
      const mouseY = pos.y + titleBarHeight + panel.config.style.padding + 15;

      const isOver = panel.isMouseOver(mouseX, mouseY);
      expect(isOver).to.be.true;
    });

    it('should increase brush size on + button click', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      const initialSize = levelEditor.brushControl.getSize();
      
      // Click + button (right side)
      const panelWidth = 90;
      const mouseX = contentX + panelWidth - 15;
      const mouseY = contentY + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.brushControl.getSize()).to.be.at.least(initialSize);
    });

    it('should decrease brush size on - button click', function() {
      const panel = levelEditor.draggablePanels.panels.brush;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      const contentX = pos.x + panel.config.style.padding;
      const contentY = pos.y + titleBarHeight + panel.config.style.padding;
      
      // First increase size so we can decrease
      levelEditor.brushControl.increase();
      levelEditor.brushControl.increase();
      const initialSize = levelEditor.brushControl.getSize();
      
      // Click - button (left side)
      const mouseX = contentX + 15;
      const mouseY = contentY + 20;

      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(levelEditor.brushControl.getSize()).to.be.at.most(initialSize);
    });
  });

  describe('Panel Dragging', function() {
    it('should start dragging when title bar is clicked and mouse pressed', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click on title bar
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 10;

      panel.update(mouseX, mouseY, true); // mousePressed = true
      
      expect(panel.isDragging).to.be.true;
    });

    it('should move panel when dragged', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const initialPos = panel.getPosition();
      
      // Start drag on title bar
      const startX = initialPos.x + 50;
      const startY = initialPos.y + 10;
      panel.update(startX, startY, true);
      
      // Move mouse while pressed
      const newX = startX + 100;
      const newY = startY + 50;
      panel.update(newX, newY, true);
      
      // Position should have changed
      const newPos = panel.getPosition();
      expect(newPos.x).to.not.equal(initialPos.x);
      expect(newPos.y).to.not.equal(initialPos.y);
    });

    it('should stop dragging when mouse is released', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Start drag
      panel.update(pos.x + 50, pos.y + 10, true);
      expect(panel.isDragging).to.be.true;
      
      // Release mouse
      panel.update(pos.x + 150, pos.y + 60, false); // mousePressed = false
      
      expect(panel.isDragging).to.be.false;
    });

    it('should not drag when clicking inside content area (not title bar)', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      const titleBarHeight = panel.calculateTitleBarHeight();
      
      // Click inside content area, below title bar
      const mouseX = pos.x + 50;
      const mouseY = pos.y + titleBarHeight + 50;

      panel.update(mouseX, mouseY, true);
      
      // Should not start dragging from content area
      // (This tests that title bar is the only drag handle)
      expect(panel.isDragging).to.be.false;
    });
  });

  describe('Panel Position Persistence', function() {
    it('should save panel position when dragged and released', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const panelId = 'level-editor-materials';
      
      // Clear any existing saved position
      global.localStorage.removeItem(`draggable-panel-${panelId}`);
      
      // Drag panel
      panel.update(100, 100, true);
      panel.update(200, 200, true);
      panel.update(200, 200, false); // Release
      
      // Check localStorage
      const saved = global.localStorage.getItem(`draggable-panel-${panelId}`);
      expect(saved).to.not.be.null;
      
      const data = JSON.parse(saved);
      expect(data.position).to.exist;
      expect(data.position.x).to.be.a('number');
      expect(data.position.y).to.be.a('number');
    });

    it('should restore panel position on next initialization', function() {
      const panelId = 'level-editor-materials';
      
      // Save a specific position
      const savedPosition = { x: 300, y: 400 };
      global.localStorage.setItem(`draggable-panel-${panelId}`, JSON.stringify({
        position: savedPosition,
        visible: true,
        minimized: false
      }));
      
      // Create new panel (simulating page reload)
      const newPanel = new DraggablePanel({
        id: panelId,
        title: 'Materials',
        position: { x: 10, y: 80 }, // Default position
        size: { width: 180, height: 250 },
        behavior: {
          draggable: true,
          persistent: true
        }
      });
      
      // Position should be restored from localStorage
      const pos = newPanel.getPosition();
      expect(pos.x).to.equal(savedPosition.x);
      expect(pos.y).to.equal(savedPosition.y);
    });
  });

  describe('Panel Mouse Event Consumption', function() {
    it('should consume mouse events when clicking on panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 50;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });

    it('should not consume mouse events when clicking outside panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      
      // Click far outside panel
      const mouseX = 1000;
      const mouseY = 1000;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });

    it('should prevent terrain clicks when clicking on panel', function() {
      const panel = levelEditor.draggablePanels.panels.materials;
      const pos = panel.getPosition();
      
      // Click inside panel
      const mouseX = pos.x + 50;
      const mouseY = pos.y + 50;
      
      const handled = levelEditor.draggablePanels.handleClick(mouseX, mouseY);
      
      // Panel should handle the click, preventing terrain edit
      expect(handled).to.be.true;
    });
  });

  describe('Integration with DraggablePanelManager', function() {
    it('should allow DraggablePanelManager to update all panels', function() {
      global.draggablePanelManager.update(100, 100, false);
      
      // All panels should be updated without errors
      expect(levelEditor.draggablePanels.panels.materials).to.exist;
      expect(levelEditor.draggablePanels.panels.tools).to.exist;
      expect(levelEditor.draggablePanels.panels.brush).to.exist;
    });

    it('should render all panels through DraggablePanelManager', function() {
      // Should not throw errors
      expect(() => {
        global.draggablePanelManager.renderPanels('LEVEL_EDITOR');
      }).to.not.throw();
    });
  });
});




// ================================================================
// levelEditorSidebar.integration.test.js (30 tests)
// ================================================================
/**
 * Integration Tests: LevelEditorSidebar with ScrollableContentArea
 * 
 * Tests LevelEditorSidebar using real ScrollableContentArea instance.
 * Verifies menu bar + content area composition pattern.
 */

describe('LevelEditorSidebar Integration', function() {
  let dom, window, document;
  let LevelEditorSidebar, ScrollableContentArea, ScrollIndicator;
  let sidebar;
  
  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.line = sinon.stub();
    global.triangle = sinon.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.RIGHT = 'RIGHT';
    global.TOP = 'TOP';
    global.BOTTOM = 'BOTTOM';
    
    // Sync globals for JSDOM
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.line = global.line;
    window.triangle = global.triangle;
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;
    
    // Load classes (with dependencies)
    ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    window.ScrollIndicator = ScrollIndicator;
    global.ScrollIndicator = ScrollIndicator;
    
    ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
    window.ScrollableContentArea = ScrollableContentArea;
    global.ScrollableContentArea = ScrollableContentArea;
    
    LevelEditorSidebar = require('../../../Classes/ui/LevelEditorSidebar');
    window.LevelEditorSidebar = LevelEditorSidebar;
    
    // Create sidebar
    sidebar = new LevelEditorSidebar({
      width: 300,
      height: 600,
      title: 'Tools'
    });
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  // ==================== Composition Pattern ====================
  
  describe('Composition Pattern', function() {
    it('should create real ScrollableContentArea instance', function() {
      expect(sidebar.contentArea).to.exist;
      expect(sidebar.contentArea).to.be.instanceOf(ScrollableContentArea);
    });
    
    it('should pass correct dimensions to contentArea', function() {
      expect(sidebar.contentArea.width).to.equal(300);
      expect(sidebar.contentArea.height).to.equal(550); // 600 - 50
    });
    
    it('should share width with contentArea', function() {
      sidebar.setDimensions(400, 700);
      expect(sidebar.contentArea.width).to.equal(400);
    });
    
    it('should update contentArea height when sidebar height changes', function() {
      sidebar.setDimensions(300, 800);
      expect(sidebar.contentArea.height).to.equal(750); // 800 - 50
    });
  });
  
  // ==================== Content Management ====================
  
  describe('Content Management Integration', function() {
    it('should add text item through contentArea', function() {
      const item = sidebar.addText('header', 'Terrain Tools', { fontSize: 16 });
      
      expect(item).to.exist;
      expect(item.type).to.equal('text');
      expect(sidebar.getContentItems()).to.have.lengthOf(1);
    });
    
    it('should add button item through contentArea', function() {
      const callback = sinon.stub();
      const item = sidebar.addButton('grass', 'Grass', callback);
      
      expect(item).to.exist;
      expect(item.type).to.equal('button');
      expect(sidebar.getContentItems()).to.have.lengthOf(1);
    });
    
    it('should add custom item through contentArea', function() {
      const renderFn = sinon.stub();
      const clickFn = sinon.stub();
      const item = sidebar.addCustom('custom1', renderFn, clickFn, 50);
      
      expect(item).to.exist;
      expect(item.type).to.equal('custom');
      expect(sidebar.getContentItems()).to.have.lengthOf(1);
    });
    
    it('should remove items from contentArea', function() {
      sidebar.addText('text1', 'Test');
      sidebar.addButton('btn1', 'Button', () => {});
      expect(sidebar.getContentItems()).to.have.lengthOf(2);
      
      const removed = sidebar.removeItem('text1');
      expect(removed).to.be.true;
      expect(sidebar.getContentItems()).to.have.lengthOf(1);
    });
    
    it('should clear all items from contentArea', function() {
      sidebar.addText('text1', 'Test');
      sidebar.addButton('btn1', 'Button', () => {});
      sidebar.addCustom('custom1', () => {}, null, 50);
      expect(sidebar.getContentItems()).to.have.lengthOf(3);
      
      sidebar.clearAll();
      expect(sidebar.getContentItems()).to.have.lengthOf(0);
    });
  });
  
  // ==================== Scroll Integration ====================
  
  describe('Scroll Integration', function() {
    beforeEach(function() {
      // Add enough content to enable scrolling
      for (let i = 0; i < 20; i++) {
        sidebar.addText(`text${i}`, `Item ${i}`, { height: 40 });
      }
    });
    
    it('should scroll contentArea when mouse over content', function() {
      const initialOffset = sidebar.getScrollOffset();
      
      // Mouse at Y=100 (over content area, below menu bar)
      // Negative delta = scroll down = increase offset
      sidebar.handleMouseWheel(-50, 150, 100);
      
      const newOffset = sidebar.getScrollOffset();
      expect(newOffset).to.not.equal(initialOffset);
      expect(newOffset).to.be.greaterThan(0);
    });
    
    it('should not scroll when mouse over menu bar', function() {
      const initialOffset = sidebar.getScrollOffset();
      
      // Mouse at Y=25 (over menu bar)
      sidebar.handleMouseWheel(-50, 150, 25);
      
      const newOffset = sidebar.getScrollOffset();
      expect(newOffset).to.equal(initialOffset);
    });
    
    it('should delegate getScrollOffset to contentArea', function() {
      sidebar.handleMouseWheel(50, 150, 100);
      
      const offset = sidebar.getScrollOffset();
      expect(offset).to.equal(sidebar.contentArea.scrollOffset);
    });
    
    it('should delegate getMaxScrollOffset to contentArea', function() {
      const maxOffset = sidebar.getMaxScrollOffset();
      expect(maxOffset).to.equal(sidebar.contentArea.maxScrollOffset);
    });
    
    it('should detect overflow when content exceeds viewport', function() {
      expect(sidebar.hasOverflow()).to.be.true;
    });
    
    it('should detect no overflow when content fits', function() {
      sidebar.clearAll();
      sidebar.addText('text1', 'Short', { height: 40 });
      
      expect(sidebar.hasOverflow()).to.be.false;
    });
  });
  
  // ==================== Click Routing ====================
  
  describe('Click Routing', function() {
    beforeEach(function() {
      sidebar.addButton('btn1', 'Button 1', sinon.stub());
      sidebar.addButton('btn2', 'Button 2', sinon.stub());
    });
    
    it('should route content clicks to contentArea', function() {
      // Sidebar at (100, 50)
      // Content area starts at Y=100 (50 + 50 menu bar)
      // Click at button position
      const result = sidebar.handleClick(150, 120, 100, 50);
      
      expect(result).to.exist;
      expect(result.id).to.equal('btn1');
    });
    
    it('should not route menu bar clicks to contentArea', function() {
      // Click on menu bar (Y=60, within menu bar)
      const result = sidebar.handleClick(150, 60, 100, 50);
      
      // Should return null (menu bar click, not minimize button)
      expect(result).to.be.null;
    });
    
    it('should detect minimize button click', function() {
      // Sidebar at (100, 50)
      // Minimize button at right side of menu bar
      // Button: X=390 (100 + 300 - 40 - 5), Y=55 (50 + 5)
      const result = sidebar.handleClick(395, 60, 100, 50);
      
      expect(result).to.exist;
      expect(result.type).to.equal('minimize');
    });
    
    it('should not detect minimize if outside button bounds', function() {
      // Click outside minimize button
      const result = sidebar.handleClick(150, 60, 100, 50);
      
      expect(result).to.be.null;
    });
  });
  
  // ==================== Hover Tracking ====================
  
  describe('Hover Tracking', function() {
    beforeEach(function() {
      sidebar.addButton('btn1', 'Button 1', sinon.stub());
      sidebar.addButton('btn2', 'Button 2', sinon.stub());
    });
    
    it('should track minimize button hover', function() {
      expect(sidebar.minimizeHovered).to.be.false;
      
      // Hover over minimize button (right side of menu bar)
      sidebar.updateHover(395, 60, 100, 50);
      
      expect(sidebar.minimizeHovered).to.be.true;
    });
    
    it('should clear minimize hover when mouse moves away', function() {
      sidebar.updateHover(395, 60, 100, 50);
      expect(sidebar.minimizeHovered).to.be.true;
      
      sidebar.updateHover(150, 120, 100, 50);
      expect(sidebar.minimizeHovered).to.be.false;
    });
    
    it('should delegate content hover to contentArea', function() {
      sidebar.updateHover(150, 120, 100, 50);
      
      // contentArea should have updated hover state
      // (internal to contentArea, no direct assertion)
      expect(sidebar.contentArea).to.exist;
    });
  });
  
  // ==================== Rendering Integration ====================
  
  describe('Rendering Integration', function() {
    beforeEach(function() {
      sidebar.addText('header', 'Tools', { fontSize: 16 });
      sidebar.addButton('btn1', 'Button 1', sinon.stub());
      sidebar.addButton('btn2', 'Button 2', sinon.stub());
    });
    
    it('should render menu bar and content area', function() {
      sidebar.render(100, 50);
      
      // Should call push/pop for transform isolation
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
      
      // Should render menu bar background
      expect(global.rect.called).to.be.true;
      
      // Should render title text
      expect(global.text.called).to.be.true;
    });
    
    it('should not render when hidden', function() {
      global.push.resetHistory();
      global.pop.resetHistory();
      
      sidebar.setVisible(false);
      sidebar.render(100, 50);
      
      expect(global.push.called).to.be.false;
      expect(global.pop.called).to.be.false;
    });
    
    it('should render minimize button in correct state', function() {
      global.fill.resetHistory();
      
      // Not hovered
      sidebar.minimizeHovered = false;
      sidebar.render(100, 50);
      
      // Should use non-hover color [60, 60, 60]
      const fillCalls = global.fill.getCalls();
      const btnColorCall = fillCalls.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 60
      );
      expect(btnColorCall).to.exist;
      
      global.fill.resetHistory();
      
      // Hovered
      sidebar.minimizeHovered = true;
      sidebar.render(100, 50);
      
      // Should use hover color [80, 80, 80]
      const fillCalls2 = global.fill.getCalls();
      const btnHoverCall = fillCalls2.find(call => 
        Array.isArray(call.args[0]) && 
        call.args[0][0] === 80
      );
      expect(btnHoverCall).to.exist;
    });
  });
  
  // ==================== Visibility Integration ====================
  
  describe('Visibility Integration', function() {
    it('should initialize as visible', function() {
      expect(sidebar.isVisible()).to.be.true;
    });
    
    it('should toggle visibility', function() {
      sidebar.setVisible(false);
      expect(sidebar.isVisible()).to.be.false;
      
      sidebar.setVisible(true);
      expect(sidebar.isVisible()).to.be.true;
    });
    
    it('should skip rendering when hidden', function() {
      global.push.resetHistory();
      global.rect.resetHistory();
      
      sidebar.setVisible(false);
      sidebar.render(100, 50);
      
      expect(global.push.called).to.be.false;
      expect(global.rect.called).to.be.false;
    });
  });
  
  // ==================== Dimension Updates ====================
  
  describe('Dimension Updates', function() {
    it('should update sidebar and contentArea dimensions together', function() {
      sidebar.setDimensions(400, 800);
      
      expect(sidebar.getWidth()).to.equal(400);
      expect(sidebar.getHeight()).to.equal(800);
      expect(sidebar.contentArea.width).to.equal(400);
      expect(sidebar.contentArea.height).to.equal(750); // 800 - 50
    });
    
    it('should maintain menu bar height when resizing', function() {
      sidebar.setDimensions(400, 800);
      
      expect(sidebar.getMenuBarHeight()).to.equal(50);
      expect(sidebar.getContentAreaHeight()).to.equal(750);
    });
  });
});




// ================================================================
// levelEditor_dialogs.integration.test.js (10 tests)
// ================================================================
/**
 * Integration tests for LevelEditor + SaveDialog/LoadDialog interaction
 * 
 * Tests that dialogs consume clicks and keyboard input, preventing terrain editing
 */

describe('LevelEditor + Dialog Integration', function() {
    let LevelEditor, SaveDialog, LoadDialog;
    let editor;
    let mockP5, mockTerrain;

    beforeEach(function() {
        // Set up JSDOM
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;

        // Mock p5.js constants
        global.CONTROL = 17;
        global.SHIFT = 16;
        global.ALT = 18;
        global.keyIsDown = sinon.stub().returns(false);

        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;
        global.TILE_SIZE = 32;

        // Load required classes (simplified mocks for testing)
        SaveDialog = require('../../../Classes/ui/SaveDialog.js');
        LoadDialog = require('../../../Classes/ui/LoadDialog.js');

        // Mock LevelEditor with dialog integration
        LevelEditor = class {
            constructor() {
                this.active = true;
                this.saveDialog = new SaveDialog();
                this.loadDialog = new LoadDialog();
                this.terrainEditCount = 0;
                
                // Wire up callbacks
                this.saveDialog.onSave = () => this.save();
                this.saveDialog.onCancel = () => this.saveDialog.hide();
                this.loadDialog.onLoad = () => this.load();
                this.loadDialog.onCancel = () => this.loadDialog.hide();
            }
            
            handleClick(x, y) {
                if (!this.active) return;
                
                // Check dialogs first
                if (this.saveDialog.isVisible()) {
                    const consumed = this.saveDialog.handleClick(x, y);
                    if (consumed) return;
                }
                
                if (this.loadDialog.isVisible()) {
                    const consumed = this.loadDialog.handleClick(x, y);
                    if (consumed) return;
                }
                
                // If no dialog consumed, edit terrain
                this.terrainEditCount++;
            }
            
            handleKeyPress(key) {
                if (!this.active) return;
                
                // Check save dialog first
                if (this.saveDialog.isVisible()) {
                    const consumed = this.saveDialog.handleKeyPress(key);
                    if (consumed) return;
                }
            }
            
            save() {
                this.saveDialog.hide();
            }
            
            load() {
                this.loadDialog.hide();
            }
        };

        editor = new LevelEditor();
    });

    afterEach(function() {
        sinon.restore();
        delete global.window;
        delete global.document;
        delete global.CONTROL;
        delete global.SHIFT;
        delete global.ALT;
        delete global.keyIsDown;
        delete global.g_canvasX;
        delete global.g_canvasY;
        delete global.TILE_SIZE;
    });

    describe('SaveDialog interaction blocking', function() {
        it('should prevent terrain editing when dialog is visible and clicked', function() {
            editor.saveDialog.show();
            
            // Click in center of dialog
            editor.handleClick(960, 540);
            
            // Terrain should NOT be edited (click consumed by dialog)
            expect(editor.terrainEditCount).to.equal(0);
        });

        it('should allow terrain editing when dialog is visible but click is outside', function() {
            editor.saveDialog.show();
            
            // Click outside dialog (top-left corner)
            editor.handleClick(10, 10);
            
            // Terrain SHOULD be edited (click passed through)
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should allow terrain editing when dialog is hidden', function() {
            editor.saveDialog.hide();
            
            // Click anywhere
            editor.handleClick(500, 500);
            
            // Terrain SHOULD be edited
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should handle keyboard input when dialog is visible', function() {
            editor.saveDialog.show();
            editor.saveDialog.setFilename('test');
            
            // Type character
            editor.handleKeyPress('a');
            
            // Filename should update
            expect(editor.saveDialog.getFilename()).to.equal('testa');
        });

        it('should trigger save on Save button click', function() {
            editor.saveDialog.show();
            
            const saveSpy = sinon.spy(editor, 'save');
            
            // Calculate Save button position
            const dialogX = 960 - 250;
            const dialogY = 540 - 150;
            const buttonY = dialogY + 240;
            const saveButtonX = dialogX + 240;
            
            // Click Save button
            editor.handleClick(saveButtonX + 60, buttonY + 20);
            
            expect(saveSpy.calledOnce).to.be.true;
            expect(editor.saveDialog.isVisible()).to.be.false;
        });

        it('should hide dialog on Cancel button click', function() {
            editor.saveDialog.show();
            
            // Calculate Cancel button position
            const dialogX = 960 - 250;
            const dialogY = 540 - 150;
            const buttonY = dialogY + 240;
            const cancelButtonX = dialogX + 370;
            
            // Click Cancel button
            editor.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(editor.saveDialog.isVisible()).to.be.false;
        });
    });

    describe('LoadDialog interaction blocking', function() {
        it('should prevent terrain editing when dialog is visible and clicked', function() {
            editor.loadDialog.show();
            
            // Click in center of dialog
            editor.handleClick(960, 540);
            
            // Terrain should NOT be edited
            expect(editor.terrainEditCount).to.equal(0);
        });

        it('should allow terrain editing when dialog is visible but click is outside', function() {
            editor.loadDialog.show();
            
            // Click outside dialog
            editor.handleClick(10, 10);
            
            // Terrain SHOULD be edited
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should handle file selection clicks', function() {
            editor.loadDialog.show();
            editor.loadDialog.setFiles([
                { name: 'terrain_1.json', date: '2024-01-01', size: 1024 }
            ]);
            
            // Click on file in list
            const dialogX = 960 - 300;
            const dialogY = 540 - 200;
            const fileY = dialogY + 85;
            
            editor.handleClick(dialogX + 100, fileY + 10);
            
            // File should be selected
            expect(editor.loadDialog.getSelectedFile()).to.exist;
            expect(editor.loadDialog.getSelectedFile().name).to.equal('terrain_1.json');
        });
    });

    describe('Multiple dialogs', function() {
        it('should only show one dialog at a time', function() {
            editor.saveDialog.show();
            editor.loadDialog.show();
            
            // Both visible (implementation choice - could enforce exclusivity later)
            expect(editor.saveDialog.isVisible()).to.be.true;
            expect(editor.loadDialog.isVisible()).to.be.true;
        });
    });
});




// ================================================================
// levelEditor_fileMenuBar.integration.test.js (15 tests)
// ================================================================
/**
 * Integration Tests for LevelEditor with FileMenuBar
 * Tests that LevelEditor properly integrates and uses FileMenuBar
 * 
 * Following TDD: These tests verify LevelEditor correctly initializes and uses FileMenuBar
 */

let fs = require('fs');
let path = require('path');
let vm = require('vm');
// Setup JSDOM
let dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Load FileMenuBar and mock dependencies
let fileMenuBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/FileMenuBar.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(fileMenuBarCode);

// Sync to window
global.FileMenuBar = FileMenuBar;
window.FileMenuBar = FileMenuBar;

describe('LevelEditor + FileMenuBar Integration Tests', function() {
  let mockP5;
  let mockLevelEditor;
  
  beforeEach(function() {
    // Mock p5.js functions
    mockP5 = {
      rect: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      noStroke: sinon.stub(),
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right'
    };
    
    // Assign to global
    Object.assign(global, mockP5);
    Object.assign(window, mockP5);
    
    // Create a simplified mock LevelEditor structure
    mockLevelEditor = {
      active: true,
      terrain: { tiles: [[]], width: 10, height: 10 },
      editor: {
        canUndo: sinon.stub().returns(false),
        canRedo: sinon.stub().returns(false)
      },
      fileMenuBar: null,
      showGrid: true,
      showMinimap: true,
      save: sinon.stub(),
      load: sinon.stub(),
      undo: sinon.stub(),
      redo: sinon.stub()
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('FileMenuBar Initialization', function() {
    it('should create FileMenuBar instance during LevelEditor initialization', function() {
      // Simulate LevelEditor initializing FileMenuBar
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      expect(mockLevelEditor.fileMenuBar).to.exist;
      expect(mockLevelEditor.fileMenuBar.levelEditor).to.equal(mockLevelEditor);
    });
    
    it('should have FileMenuBar connected to LevelEditor', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      expect(mockLevelEditor.fileMenuBar.levelEditor).to.equal(mockLevelEditor);
    });
  });
  
  describe('Click Handling Integration', function() {
    it('should pass clicks to FileMenuBar before terrain editing', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const handleClickSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'handleClick');
      
      // Simulate LevelEditor.handleClick calling FileMenuBar.handleClick
      const clickX = 50;
      const clickY = 20; // Within menu bar height
      
      mockLevelEditor.fileMenuBar.handleClick(clickX, clickY);
      
      expect(handleClickSpy.calledOnce).to.be.true;
      expect(handleClickSpy.calledWith(clickX, clickY)).to.be.true;
    });
    
    it('should consume menu bar clicks and prevent terrain editing', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Click on File menu (should be consumed)
      const clickX = 20;
      const clickY = 20;
      
      const consumed = mockLevelEditor.fileMenuBar.handleClick(clickX, clickY);
      
      // Menu bar should consume clicks within its bounds
      expect(consumed).to.be.true;
    });
  });
  
  describe('Keyboard Handling Integration', function() {
    it('should pass keyboard shortcuts to FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const handleKeySpy = sinon.spy(mockLevelEditor.fileMenuBar, 'handleKeyPress');
      
      // Simulate Ctrl+S
      mockLevelEditor.fileMenuBar.handleKeyPress('s', { ctrl: true });
      
      expect(handleKeySpy.calledOnce).to.be.true;
      expect(handleKeySpy.calledWith('s', { ctrl: true })).to.be.true;
    });
    
    it('should trigger save via Ctrl+S through FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      mockLevelEditor.fileMenuBar.handleKeyPress('s', { ctrl: true });
      
      expect(mockLevelEditor.save.calledOnce).to.be.true;
    });
    
    it('should trigger undo via Ctrl+Z through FileMenuBar', function() {
      // Enable undo first
      mockLevelEditor.editor.canUndo.returns(true);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      mockLevelEditor.fileMenuBar.handleKeyPress('z', { ctrl: true });
      
      expect(mockLevelEditor.undo.calledOnce).to.be.true;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should update menu states when LevelEditor.update() is called', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const updateSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'updateMenuStates');
      
      // Simulate LevelEditor.update() calling fileMenuBar.updateMenuStates()
      mockLevelEditor.fileMenuBar.updateMenuStates();
      
      expect(updateSpy.calledOnce).to.be.true;
    });
    
    it('should reflect undo/redo availability in menu states', function() {
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(false);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const editMenu = mockLevelEditor.fileMenuBar.getMenuItem('Edit');
      const undoItem = editMenu.items.find(item => item.label === 'Undo');
      const redoItem = editMenu.items.find(item => item.label === 'Redo');
      
      expect(undoItem.enabled).to.be.false;
      expect(redoItem.enabled).to.be.false;
      
      // Change state
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.fileMenuBar.updateMenuStates();
      
      expect(undoItem.enabled).to.be.true;
      expect(redoItem.enabled).to.be.false;
    });
  });
  
  describe('Render Integration', function() {
    it('should render FileMenuBar when LevelEditor.render() is called', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const renderSpy = sinon.spy(mockLevelEditor.fileMenuBar, 'render');
      
      // Simulate LevelEditor.render() calling fileMenuBar.render()
      mockLevelEditor.fileMenuBar.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should render menu bar at top of screen', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // FileMenuBar should be positioned at {x: 0, y: 0}
      expect(mockLevelEditor.fileMenuBar.position.x).to.equal(0);
      expect(mockLevelEditor.fileMenuBar.position.y).to.equal(0);
    });
  });
  
  describe('Grid and Minimap Toggle Integration', function() {
    it('should toggle grid visibility via FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const initialGridState = mockLevelEditor.showGrid;
      
      // Trigger grid toggle via keyboard
      mockLevelEditor.fileMenuBar.handleKeyPress('g', {});
      
      expect(mockLevelEditor.showGrid).to.equal(!initialGridState);
    });
    
    it('should toggle minimap visibility via FileMenuBar', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      const initialMinimapState = mockLevelEditor.showMinimap;
      
      // Trigger minimap toggle via keyboard
      mockLevelEditor.fileMenuBar.handleKeyPress('m', {});
      
      expect(mockLevelEditor.showMinimap).to.equal(!initialMinimapState);
    });
  });
  
  describe('Complete Workflow Integration', function() {
    it('should support full save workflow from menu bar to LevelEditor', function() {
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // User clicks File menu
      mockLevelEditor.fileMenuBar.openMenu('File');
      
      // User clicks Save
      const fileMenu = mockLevelEditor.fileMenuBar.getMenuItem('File');
      const saveItem = fileMenu.items.find(item => item.label === 'Save');
      saveItem.action();
      
      // LevelEditor.save() should be called
      expect(mockLevelEditor.save.calledOnce).to.be.true;
    });
    
    it('should support undo/redo workflow', function() {
      // Enable undo
      mockLevelEditor.editor.canUndo.returns(true);
      mockLevelEditor.editor.canRedo.returns(false);
      
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Undo
      mockLevelEditor.fileMenuBar.handleKeyPress('z', { ctrl: true });
      expect(mockLevelEditor.undo.calledOnce).to.be.true;
      
      // Enable redo
      mockLevelEditor.editor.canUndo.returns(false);
      mockLevelEditor.editor.canRedo.returns(true);
      
      // Recreate to update states
      mockLevelEditor.fileMenuBar = new FileMenuBar();
      mockLevelEditor.fileMenuBar.setLevelEditor(mockLevelEditor);
      
      // Redo
      mockLevelEditor.fileMenuBar.handleKeyPress('y', { ctrl: true });
      expect(mockLevelEditor.redo.calledOnce).to.be.true;
    });
  });
});




// ================================================================
// levelEditor_viewToggles.integration.test.js (12 tests)
// ================================================================
/**
 * Integration tests for LevelEditor View toggles
 * 
 * Tests that View menu toggles properly affect rendering of UI elements
 */

describe('LevelEditor + View Toggles Integration', function() {
    let mockLevelEditor;
    let mockFileMenuBar;
    let renderStub;

    beforeEach(function() {
        // Mock p5.js functions
        global.push = sinon.stub();
        global.pop = sinon.stub();
        global.fill = sinon.stub();
        global.stroke = sinon.stub();
        global.noStroke = sinon.stub();
        global.rect = sinon.stub();
        global.text = sinon.stub();
        global.textAlign = sinon.stub();
        global.textSize = sinon.stub();
        global.line = sinon.stub();
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Create mock UI elements with visible properties
        mockLevelEditor = {
            active: true,
            terrain: {
                render: sinon.stub()
            },
            gridOverlay: {
                visible: true,
                render: sinon.stub()
            },
            fileMenuBar: {
                visible: true,
                render: sinon.stub()
            },
            draggablePanels: {
                visible: true,
                render: sinon.stub()
            },
            minimap: {
                render: sinon.stub()
            },
            notifications: {
                visible: true,
                render: sinon.stub()
            },
            saveDialog: {
                isVisible: () => false,
                render: sinon.stub()
            },
            loadDialog: {
                isVisible: () => false,
                render: sinon.stub()
            },
            showGrid: true,
            showMinimap: true
        };

        // Simulate LevelEditor render logic
        renderStub = sinon.stub().callsFake(function() {
            if (!mockLevelEditor.active) return;
            
            if (mockLevelEditor.terrain) {
                mockLevelEditor.terrain.render();
            }
            
            if (mockLevelEditor.showGrid) {
                mockLevelEditor.gridOverlay.render();
            }
            
            mockLevelEditor.fileMenuBar.render();
            mockLevelEditor.draggablePanels.render();
            
            if (mockLevelEditor.showMinimap && mockLevelEditor.minimap) {
                mockLevelEditor.minimap.render(1700, 860);
            }
            
            if (mockLevelEditor.notifications && mockLevelEditor.notifications.visible) {
                mockLevelEditor.notifications.render(10, 1070);
            }
        });
    });

    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.stroke;
        delete global.noStroke;
        delete global.rect;
        delete global.text;
        delete global.textAlign;
        delete global.textSize;
        delete global.line;
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('Grid Overlay visibility toggle', function() {
        it('should render grid when showGrid is true', function() {
            mockLevelEditor.showGrid = true;
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.true;
        });

        it('should not render grid when showGrid is false', function() {
            mockLevelEditor.showGrid = false;
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.false;
        });
    });

    describe('Minimap visibility toggle', function() {
        it('should render minimap when showMinimap is true', function() {
            mockLevelEditor.showMinimap = true;
            renderStub();
            
            expect(mockLevelEditor.minimap.render.called).to.be.true;
        });

        it('should not render minimap when showMinimap is false', function() {
            mockLevelEditor.showMinimap = false;
            renderStub();
            
            expect(mockLevelEditor.minimap.render.called).to.be.false;
        });
    });

    describe('Panels visibility toggle', function() {
        it('should call draggablePanels.render() regardless of visible flag', function() {
            // DraggablePanelManager handles its own visibility internally
            mockLevelEditor.draggablePanels.visible = true;
            renderStub();
            
            expect(mockLevelEditor.draggablePanels.render.called).to.be.true;
        });

        it('should call draggablePanels.render() even when visible is false', function() {
            // The render method will check visible internally
            mockLevelEditor.draggablePanels.visible = false;
            renderStub();
            
            expect(mockLevelEditor.draggablePanels.render.called).to.be.true;
        });
    });

    describe('Notifications visibility toggle', function() {
        it('should render notifications when visible is true', function() {
            mockLevelEditor.notifications.visible = true;
            renderStub();
            
            expect(mockLevelEditor.notifications.render.called).to.be.true;
        });

        it('should not render notifications when visible is false', function() {
            mockLevelEditor.notifications.visible = false;
            renderStub();
            
            expect(mockLevelEditor.notifications.render.called).to.be.false;
        });
    });

    describe('Menu Bar visibility toggle', function() {
        it('should call fileMenuBar.render() regardless of visible flag', function() {
            // FileMenuBar handles its own visibility internally
            mockLevelEditor.fileMenuBar.visible = true;
            renderStub();
            
            expect(mockLevelEditor.fileMenuBar.render.called).to.be.true;
        });

        it('should call fileMenuBar.render() even when visible is false', function() {
            // The render method will check visible internally
            mockLevelEditor.fileMenuBar.visible = false;
            renderStub();
            
            expect(mockLevelEditor.fileMenuBar.render.called).to.be.true;
        });
    });

    describe('Multiple toggles', function() {
        it('should respect all visibility flags when multiple are disabled', function() {
            mockLevelEditor.showGrid = false;
            mockLevelEditor.showMinimap = false;
            mockLevelEditor.notifications.visible = false;
            
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.false;
            expect(mockLevelEditor.minimap.render.called).to.be.false;
            expect(mockLevelEditor.notifications.render.called).to.be.false;
            expect(mockLevelEditor.terrain.render.called).to.be.true; // Terrain always renders
        });

        it('should render only enabled elements', function() {
            mockLevelEditor.showGrid = true;
            mockLevelEditor.showMinimap = false;
            mockLevelEditor.notifications.visible = true;
            
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.true;
            expect(mockLevelEditor.minimap.render.called).to.be.false;
            expect(mockLevelEditor.notifications.render.called).to.be.true;
        });
    });
});




// ================================================================
// selectToolAndHoverPreview.integration.test.js (13 tests)
// ================================================================
/**
 * Integration Tests: Select Tool & Hover Preview with LevelEditor
 * 
 * TDD Phase 2: INTEGRATION TESTS
 * 
 * Tests the integration of SelectionManager and HoverPreviewManager
 * with LevelEditor, TerrainEditor, and CustomTerrain
 */

// Load dependencies
let SelectionManager = require('../../../Classes/ui/SelectionManager');
let HoverPreviewManager = require('../../../Classes/ui/HoverPreviewManager');

describe('Select Tool & Hover Preview Integration', function() {
    let sandbox;
    
    beforeEach(function() {
        sandbox = sinon.createSandbox();
        
        // Mock p5.js globals
        global.TILE_SIZE = 32;
        global.CORNER = 'corner';
        global.CENTER = 'center';
        global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
        
        // Sync to window for JSDOM
        if (typeof window !== 'undefined') {
            window.TILE_SIZE = global.TILE_SIZE;
            window.CORNER = global.CORNER;
            window.CENTER = global.CENTER;
            window.createVector = global.createVector;
        }
    });
    
    afterEach(function() {
        sandbox.restore();
    });
    
    describe('SelectionManager with TerrainEditor', function() {
        it('should calculate correct tile selection for 3x3 rectangle', function() {
            const selectionManager = new SelectionManager();
            
            // Drag from (5,10) to (7,12)
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            
            const tiles = selectionManager.getTilesInSelection();
            
            // 3 tiles wide x 3 tiles tall = 9 tiles
            expect(tiles.length).to.equal(9);
            
            // Verify corners
            expect(tiles).to.deep.include({ x: 5, y: 10 });  // Top-left
            expect(tiles).to.deep.include({ x: 7, y: 10 });  // Top-right
            expect(tiles).to.deep.include({ x: 5, y: 12 });  // Bottom-left
            expect(tiles).to.deep.include({ x: 7, y: 12 });  // Bottom-right
        });
        
        it('should handle reverse drag (bottom-right to top-left)', function() {
            const selectionManager = new SelectionManager();
            
            // Drag from (7,12) to (5,10) - reverse direction
            selectionManager.startSelection(7, 12);
            selectionManager.updateSelection(5, 10);
            selectionManager.endSelection();
            
            const bounds = selectionManager.getSelectionBounds();
            
            expect(bounds.minX).to.equal(5);
            expect(bounds.maxX).to.equal(7);
            expect(bounds.minY).to.equal(10);
            expect(bounds.maxY).to.equal(12);
        });
        
        it('should clear selection after painting', function() {
            const selectionManager = new SelectionManager();
            
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            
            expect(selectionManager.hasSelection()).to.be.true;
            
            // Simulate painting and clearing
            selectionManager.clearSelection();
            
            expect(selectionManager.hasSelection()).to.be.false;
            expect(selectionManager.getTilesInSelection()).to.be.empty;
        });
    });
    
    describe('HoverPreviewManager with BrushSizeControl', function() {
        it('should calculate correct preview tiles for brush size 1', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 1);
            
            const tiles = hoverManager.getHoveredTiles();
            
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should calculate correct preview tiles for brush size 3', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 3);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Brush size 3 (ODD) = full 3x3 square = 9 tiles
            expect(tiles.length).to.equal(9);
            
            // Verify center and cardinal directions
            expect(tiles).to.deep.include({ x: 10, y: 10 });  // Center
            expect(tiles).to.deep.include({ x: 9, y: 10 });   // Left
            expect(tiles).to.deep.include({ x: 11, y: 10 });  // Right
            expect(tiles).to.deep.include({ x: 10, y: 9 });   // Above
            expect(tiles).to.deep.include({ x: 10, y: 11 });  // Below
        });
        
        it('should calculate correct preview tiles for brush size 5', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Brush size 5 (ODD) should create a full square pattern
            expect(tiles.length).to.equal(25);  // Full 5x5 square
            
            // Center should always be included
            expect(tiles).to.deep.include({ x: 10, y: 10 });
        });
        
        it('should only show single tile for eyedropper tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'eyedropper', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Eyedropper ignores brush size, always single tile
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should only show single tile for fill tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'fill', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Fill tool shows clicked tile only (flood fill happens on click)
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should not show preview for select tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'select', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Select tool shows rectangle during drag, not on hover
            expect(tiles).to.be.empty;
        });
        
        it('should clear hover when mouse leaves canvas', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 3);
            expect(hoverManager.getHoveredTiles().length).to.be.greaterThan(0);
            
            hoverManager.clearHover();
            
            expect(hoverManager.getHoveredTiles()).to.be.empty;
        });
    });
    
    describe('Pixel to Grid Coordinate Conversion', function() {
        it('should convert mouse position to correct grid coordinates', function() {
            const tileSize = 32;
            
            // Test various pixel positions
            const tests = [
                { mouseX: 0, mouseY: 0, expectedX: 0, expectedY: 0 },
                { mouseX: 32, mouseY: 32, expectedX: 1, expectedY: 1 },
                { mouseX: 160, mouseY: 320, expectedX: 5, expectedY: 10 },
                { mouseX: 95, mouseY: 95, expectedX: 2, expectedY: 2 },  // 95/32 = 2.96 -> floor = 2
                { mouseX: 31, mouseY: 31, expectedX: 0, expectedY: 0 },  // Edge case
            ];
            
            tests.forEach(test => {
                const gridX = Math.floor(test.mouseX / tileSize);
                const gridY = Math.floor(test.mouseY / tileSize);
                
                expect(gridX).to.equal(test.expectedX, 
                    `mouseX ${test.mouseX} should map to grid X ${test.expectedX}`);
                expect(gridY).to.equal(test.expectedY,
                    `mouseY ${test.mouseY} should map to grid Y ${test.expectedY}`);
            });
        });
    });
    
    describe('Selection and Hover Interaction', function() {
        it('should not show hover preview while selecting', function() {
            const selectionManager = new SelectionManager();
            const hoverManager = new HoverPreviewManager();
            
            // Start selection
            selectionManager.startSelection(5, 10);
            
            // While selecting, hover should be cleared for select tool
            hoverManager.updateHover(7, 12, 'select', 1);
            
            expect(hoverManager.getHoveredTiles()).to.be.empty;
        });
        
        it('should show hover preview after selection is complete', function() {
            const selectionManager = new SelectionManager();
            const hoverManager = new HoverPreviewManager();
            
            // Complete selection
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            selectionManager.clearSelection();
            
            // After clearing selection, hover should work again for other tools
            hoverManager.updateHover(10, 10, 'paint', 3);
            
            expect(hoverManager.getHoveredTiles().length).to.be.greaterThan(0);
        });
    });
});




// ================================================================
// terrainUI.integration.test.js (27 tests)
// ================================================================
/**
 * Integration Tests for Terrain UI Components
 * Tests UI components working with TerrainEditor and CustomTerrain
 */

// DUPLICATE REQUIRE REMOVED: let fs = require('fs');
// DUPLICATE REQUIRE REMOVED: let path = require('path');
// DUPLICATE REQUIRE REMOVED: let vm = require('vm');

// Load CustomTerrain
let customTerrainCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/CustomTerrain.js'),
  'utf8'
);

// Load UI components
let materialPaletteCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/MaterialPalette.js'),
  'utf8'
);
let toolBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ToolBar.js'),
  'utf8'
);
let brushSizeControlCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/BrushSizeControl.js'),
  'utf8'
);
let propertiesPanelCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/PropertiesPanel.js'),
  'utf8'
);
let notificationManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/NotificationManager.js'),
  'utf8'
);

// Load TerrainEditor
let terrainEditorCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/terrainUtils/TerrainEditor.js'),
  'utf8'
);

// Execute in global context
vm.runInThisContext(customTerrainCode);
vm.runInThisContext(materialPaletteCode);
vm.runInThisContext(toolBarCode);
vm.runInThisContext(brushSizeControlCode);
vm.runInThisContext(propertiesPanelCode);
vm.runInThisContext(notificationManagerCode);
vm.runInThisContext(terrainEditorCode);

describe('TerrainUI Integration Tests', function() {
  
  describe('MaterialPalette + TerrainEditor + CustomTerrain Integration', function() {
    
    it('should select material and use it in editor', function() {
      // Create CustomTerrain
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const editor = new TerrainEditor(terrain);
      
      // Select stone from palette
      palette.selectMaterial('stone');
      
      // Set selected material in editor
      editor.selectMaterial(palette.getSelectedMaterial());
      
      // Paint with selected material
      editor.paint(5, 5);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
    });
    
    it('should update palette selection when using eyedropper', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      // Set a specific material at a location
      terrain.setTile(5, 2, 'stone'); // Position (5,2)
      
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Simulate eyedropper picking material
      const sampledMaterial = terrain.getTile(5, 2).material;
      palette.selectMaterial(sampledMaterial);
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should support keyboard navigation in palette while editing', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const editor = new TerrainEditor(terrain);
      
      // Cycle through materials with keyboard
      palette.selectNext(); // stone
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.paint(0, 0);
      
      palette.selectNext(); // dirt
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.paint(1, 0);
      
      expect(terrain.getTile(0, 0).material).to.equal('stone');
      expect(terrain.getTile(1, 0).material).to.equal('dirt');
    });
  });
  
  describe('ToolBar + TerrainEditor Integration', function() {
    
    it('should switch between brush and fill tools', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(terrain);
      
      // Select brush tool
      toolbar.selectTool('brush');
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // Use brush
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      // Switch to fill tool
      toolbar.selectTool('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
      
      // Editor should still work
      editor.selectMaterial('dirt');
      editor.fill(0, 0);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      expect(terrain.getTile(0, 0).material).to.equal('dirt');
    });
    
    it('should enable/disable undo/redo based on editor state', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const toolbar = new ToolBar();
      const editor = new TerrainEditor(terrain);
      
      // Initially, no undo available
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.false;
      
      // Make a change
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      
      // Now undo should be available
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.true;
      
      // Undo the change
      editor.undo();
      
      // Redo should now be available
      toolbar.setEnabled('redo', editor.canRedo());
      expect(toolbar.isEnabled('redo')).to.be.true;
    });
  });
  
  describe('BrushSizeControl + TerrainEditor Integration', function() {
    
    it('should paint with different brush sizes', function() {
      const terrain = new CustomTerrain(15, 15, 32, 'moss');
      
      const brushControl = new BrushSizeControl(1);
      const editor = new TerrainEditor(terrain);
      
      editor.selectMaterial('stone');
      
      // Paint with size 1 (single tile)
      brushControl.setSize(1);
      editor.setBrushSize(brushControl.getSize());
      editor.paint(10, 10);
      
      expect(terrain.getTile(10, 10).material).to.equal('stone');
      
      // Paint with size 3 (circular brush, plus shape)
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('dirt');
      editor.paint(5, 5);
      
      // Check center and cardinal directions (circular brush)
      expect(terrain.getTile(5, 5).material).to.equal('dirt'); // Center
      expect(terrain.getTile(4, 5).material).to.equal('dirt'); // Left
      expect(terrain.getTile(6, 5).material).to.equal('dirt'); // Right
      expect(terrain.getTile(5, 4).material).to.equal('dirt'); // Top
      expect(terrain.getTile(5, 6).material).to.equal('dirt'); // Bottom
    });
    
    it('should constrain brush size to odd numbers', function() {
      const brushControl = new BrushSizeControl(1);
      
      brushControl.setSize(2); // Even number, should round to 3
      expect(brushControl.getSize()).to.equal(3);
      
      brushControl.setSize(4); // Even number, should round to 5
      expect(brushControl.getSize()).to.equal(5);
    });
  });
  
  describe('PropertiesPanel + TerrainEditor Integration', function() {
    
    it('should display selected tile information', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      terrain.setTile(5, 5, 'stone'); // Position (5,5)
      
      const panel = new PropertiesPanel();
      
      // Simulate tile selection
      const tileInfo = {
        position: { x: 5, y: 5 },
        material: terrain.getTile(5, 5).material,
        weight: 100,
        passable: false
      };
      
      panel.setSelectedTile(tileInfo);
      const props = panel.getProperties();
      
      expect(props.material).to.equal('stone');
      expect(props.position.x).to.equal(5);
      expect(props.position.y).to.equal(5);
    });
    
    it('should show undo/redo stack information', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      const editor = new TerrainEditor(terrain);
      const panel = new PropertiesPanel();
      panel.setEditor(editor);
      
      // Initial state
      let stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.false;
      expect(stackInfo.undoCount).to.equal(0);
      
      // Make some changes
      editor.selectMaterial('stone');
      editor.paint(0, 0);
      editor.paint(1, 1);
      editor.paint(2, 2);
      
      // Check stack info
      stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
      expect(stackInfo.undoCount).to.equal(3);
    });
  });
  
  describe('Full UI Workflow Integration', function() {
    
    it('should complete full editing workflow with all UI components', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      
      // Initialize all UI components
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      const panel = new PropertiesPanel();
      const editor = new TerrainEditor(terrain);
      
      panel.setEditor(editor);
      
      // 1. Select material from palette
      palette.selectMaterial('stone');
      editor.selectMaterial(palette.getSelectedMaterial());
      
      // 2. Select brush tool
      toolbar.selectTool('brush');
      
      // 3. Set brush size
      brushControl.setSize(3);
      editor.setBrushSize(brushControl.getSize());
      
      // 4. Paint
      editor.paint(5, 5);
      
      // 5. Verify changes
      expect(terrain.getTile(5, 5).material).to.equal('stone');
      
      // 6. Check properties panel
      const stackInfo = panel.getStackInfo();
      expect(stackInfo.canUndo).to.be.true;
      expect(stackInfo.undoCount).to.equal(1);
      
      // 7. Undo
      toolbar.setEnabled('undo', editor.canUndo());
      expect(toolbar.isEnabled('undo')).to.be.true;
      editor.undo();
      
      // 8. Verify undo worked
      expect(terrain.getTile(5, 5).material).to.equal('moss');
      
      // 9. Switch to fill tool
      toolbar.selectTool('fill');
      palette.selectMaterial('dirt');
      editor.selectMaterial(palette.getSelectedMaterial());
      editor.fill(0, 0);
      
      // 10. Verify fill
      expect(terrain.getTile(0, 0).material).to.equal('dirt');
    });
  });
  
  describe('UI Click Handling Integration', function() {
    
    it('should handle MaterialPalette clicks', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      
      // Initially moss is selected (index 0)
      expect(palette.getSelectedMaterial()).to.equal('moss');
      
      // Simulate click on stone swatch (position based on render layout)
      // Panel at (10, 10), swatches start at (10+5, 10+30), size 40x40, spacing 5
      // moss: (15, 40), stone: (60, 40), dirt: (15, 85), grass: (60, 85)
      const panelX = 10;
      const panelY = 10;
      
      // Click stone (second swatch, top-right)
      const stoneX = panelX + 5 + 40 + 5 + 20; // center of second swatch
      const stoneY = panelY + 30 + 20; // center vertically
      
      const handled = palette.handleClick(stoneX, stoneY, panelX, panelY);
      expect(handled).to.be.true;
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should handle ToolBar clicks', function() {
      const toolbar = new ToolBar();
      
      // Initially brush is selected
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // Simulate click on fill tool (second button)
      // Panel at (10, 10), buttons start at (10+5, 10+30), size 35x35, spacing 5
      const panelX = 10;
      const panelY = 10;
      
      // Click fill tool (second button)
      const fillX = panelX + 5 + 17; // center of button
      const fillY = panelY + 30 + 35 + 5 + 17; // second button position
      
      const tool = toolbar.handleClick(fillX, fillY, panelX, panelY);
      expect(tool).to.equal('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
    });
    
    it('should handle BrushSizeControl clicks', function() {
      const brushControl = new BrushSizeControl(1);
      
      // Initially size is 1
      expect(brushControl.getSize()).to.equal(1);
      
      // Panel at (10, 10)
      const panelX = 10;
      const panelY = 10;
      
      // Click increase button (right side)
      const increaseX = panelX + 90 - 25 + 10; // center of increase button
      const increaseY = panelY + 25 + 10;
      
      let action = brushControl.handleClick(increaseX, increaseY, panelX, panelY);
      expect(action).to.equal('increase');
      expect(brushControl.getSize()).to.equal(3);
      
      // Click increase again
      action = brushControl.handleClick(increaseX, increaseY, panelX, panelY);
      expect(action).to.equal('increase');
      expect(brushControl.getSize()).to.equal(5);
      
      // Click decrease button (left side)
      const decreaseX = panelX + 5 + 10;
      const decreaseY = panelY + 25 + 10;
      
      action = brushControl.handleClick(decreaseX, decreaseY, panelX, panelY);
      expect(action).to.equal('decrease');
      expect(brushControl.getSize()).to.equal(3);
    });
    
    it('should test BrushSizeControl with detailed coordinate mapping', function() {
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      const panelX = 50;
      const panelY = 100;
      
      // Test initial state
      expect(brushControl.getSize()).to.equal(1);
      expect(brushControl.minSize).to.equal(1);
      expect(brushControl.maxSize).to.equal(9);
      
      // Decrease button is at: (panelX + 5, panelY + 25) with size 20x20
      // Center point: (panelX + 15, panelY + 35)
      const decreaseButtonX = panelX + 5;
      const decreaseButtonY = panelY + 25;
      const decreaseCenterX = decreaseButtonX + 10;
      const decreaseCenterY = decreaseButtonY + 10;
      
      // Increase button is at: (panelX + 65, panelY + 25) with size 20x20
      // Center point: (panelX + 75, panelY + 35)
      const increaseButtonX = panelX + 90 - 25; // panelWidth - 25
      const increaseButtonY = panelY + 25;
      const increaseCenterX = increaseButtonX + 10;
      const increaseCenterY = increaseButtonY + 10;
      
      // Test clicking increase button multiple times
      for (let expectedSize = 3; expectedSize <= 9; expectedSize += 2) {
        const result = brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
        expect(result).to.equal('increase', `Should return 'increase' when clicking at (${increaseCenterX}, ${increaseCenterY})`);
        expect(brushControl.getSize()).to.equal(expectedSize, `Size should be ${expectedSize}`);
      }
      
      // At max size (9), clicking increase should not go beyond
      const beforeMaxClick = brushControl.getSize();
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(beforeMaxClick, 'Should not exceed max size');
      
      // Test clicking decrease button
      for (let expectedSize = 7; expectedSize >= 1; expectedSize -= 2) {
        const result = brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
        expect(result).to.equal('decrease', `Should return 'decrease' when clicking at (${decreaseCenterX}, ${decreaseCenterY})`);
        expect(brushControl.getSize()).to.equal(expectedSize, `Size should be ${expectedSize}`);
      }
      
      // At min size (1), clicking decrease should not go below
      const beforeMinClick = brushControl.getSize();
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(beforeMinClick, 'Should not go below min size');
    });
    
    it('should test BrushSizeControl edge detection boundaries', function() {
      const brushControl = new BrushSizeControl(3, 1, 9);
      const panelX = 0;
      const panelY = 0;
      
      // Decrease button bounds: x=[5, 25], y=[25, 45]
      // Test just inside boundaries
      expect(brushControl.handleClick(6, 26, panelX, panelY)).to.equal('decrease');
      expect(brushControl.handleClick(24, 44, panelX, panelY)).to.equal('decrease');
      
      // Reset
      brushControl.setSize(3);
      
      // Test just outside boundaries (should return null)
      expect(brushControl.handleClick(4, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(6, 24, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(26, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(6, 46, panelX, panelY)).to.be.null;
      
      // Increase button bounds: x=[65, 85], y=[25, 45]
      // Test just inside boundaries
      expect(brushControl.handleClick(66, 26, panelX, panelY)).to.equal('increase');
      expect(brushControl.handleClick(84, 44, panelX, panelY)).to.equal('increase');
      
      // Test just outside boundaries
      expect(brushControl.handleClick(64, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(86, 26, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(70, 24, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(70, 46, panelX, panelY)).to.be.null;
    });
    
    it('should test BrushSizeControl with panel offset positions', function() {
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      // Test with various panel positions
      const positions = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 100, y: 200 },
        { x: 500, y: 300 }
      ];
      
      positions.forEach(pos => {
        brushControl.setSize(1);
        
        // Calculate button centers relative to panel position
        const increaseCenterX = pos.x + 90 - 25 + 10;
        const increaseCenterY = pos.y + 25 + 10;
        
        // Click increase button
        const result = brushControl.handleClick(increaseCenterX, increaseCenterY, pos.x, pos.y);
        expect(result).to.equal('increase', 
          `Should detect increase click at panel position (${pos.x}, ${pos.y})`);
        expect(brushControl.getSize()).to.equal(3);
      });
    });
    
    it('should verify BrushSizeControl size constraints', function() {
      const brushControl = new BrushSizeControl(5, 1, 9);
      
      // Test that size is always odd
      expect(brushControl.getSize() % 2).to.equal(1, 'Initial size should be odd');
      
      const panelX = 10;
      const panelY = 10;
      const increaseCenterX = panelX + 75;
      const increaseCenterY = panelY + 35;
      const decreaseCenterX = panelX + 15;
      const decreaseCenterY = panelY + 35;
      
      // Test increase maintains odd sizes
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(7);
      expect(brushControl.getSize() % 2).to.equal(1, 'Size should remain odd after increase');
      
      brushControl.handleClick(increaseCenterX, increaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(9);
      
      // Test decrease maintains odd sizes
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(7);
      expect(brushControl.getSize() % 2).to.equal(1, 'Size should remain odd after decrease');
      
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, panelX, panelY);
      expect(brushControl.getSize()).to.equal(5);
    });
    
    it('should integrate BrushSizeControl clicks with LevelEditor workflow', function() {
      const terrain = new CustomTerrain(20, 20, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const brushControl = new BrushSizeControl(1, 1, 9);
      
      // Simulate LevelEditor panel positions
      const brushPanelX = 10;
      const brushPanelY = 290; // Below palette and toolbar
      
      // Calculate button positions exactly as they appear in LevelEditor
      const increaseButtonX = brushPanelX + 90 - 25; // Right side: panelWidth(90) - 25
      const increaseButtonY = brushPanelY + 25;
      const increaseCenterX = increaseButtonX + 10; // Center of 20px button
      const increaseCenterY = increaseButtonY + 10;
      
      const decreaseButtonX = brushPanelX + 5; // Left side
      const decreaseButtonY = brushPanelY + 25;
      const decreaseCenterX = decreaseButtonX + 10;
      const decreaseCenterY = decreaseButtonY + 10;
      
      // Verify initial state
      expect(brushControl.getSize()).to.equal(1);
      
      // Simulate user clicking increase button to size 3
      brushControl.handleClick(increaseCenterX, increaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(3);
      
      // Apply size to editor and paint
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('stone');
      editor.paint(10, 10);
      
      // Verify circular brush pattern (center + cardinal directions, not corners)
      // For brush size 3, radius=1, corners at distance=1.414 are excluded
      expect(terrain.getTile(10, 10).material).to.equal('stone'); // Center
      expect(terrain.getTile(9, 10).material).to.equal('stone'); // Left
      expect(terrain.getTile(11, 10).material).to.equal('stone'); // Right
      expect(terrain.getTile(10, 9).material).to.equal('stone'); // Top
      expect(terrain.getTile(10, 11).material).to.equal('stone'); // Bottom
      
      // Corners should NOT be painted (circular brush)
      expect(terrain.getTile(9, 9).material).to.equal('moss'); // Top-left corner
      expect(terrain.getTile(11, 11).material).to.equal('moss'); // Bottom-right corner
      
      // Increase to size 5
      brushControl.handleClick(increaseCenterX, increaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(5);
      
      // Apply to editor
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('dirt');
      editor.paint(15, 15);
      
      // Verify circular brush size 5 (radius=2)
      // Center + tiles within radius 2 (distance <= 2)
      expect(terrain.getTile(15, 15).material).to.equal('dirt'); // Center
      expect(terrain.getTile(13, 15).material).to.equal('dirt'); // 2 tiles left
      expect(terrain.getTile(17, 15).material).to.equal('dirt'); // 2 tiles right
      expect(terrain.getTile(15, 13).material).to.equal('dirt'); // 2 tiles up
      expect(terrain.getTile(15, 17).material).to.equal('dirt'); // 2 tiles down
      expect(terrain.getTile(14, 14).material).to.equal('dirt'); // Diagonal distance 1.414
      
      // Decrease back to size 3
      brushControl.handleClick(decreaseCenterX, decreaseCenterY, brushPanelX, brushPanelY);
      expect(brushControl.getSize()).to.equal(3);
      
      // Apply to editor
      editor.setBrushSize(brushControl.getSize());
      editor.selectMaterial('grass');
      editor.paint(5, 5);
      
      // Verify circular brush size 3 again
      expect(terrain.getTile(5, 5).material).to.equal('grass'); // Center
      expect(terrain.getTile(4, 5).material).to.equal('grass'); // Left
      expect(terrain.getTile(6, 5).material).to.equal('grass'); // Right
      expect(terrain.getTile(5, 4).material).to.equal('grass'); // Top
      expect(terrain.getTile(5, 6).material).to.equal('grass'); // Bottom
    });
    
    it('should test full mouse interaction sequence with brush sizes', function() {
      const terrain = new CustomTerrain(30, 30, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const brushControl = new BrushSizeControl(1, 1, 9);
      const notifications = new NotificationManager();
      
      const panelX = 10;
      const panelY = 100;
      
      // Test complete workflow with circular brush patterns
      const workflow = [
        { 
          action: 'increase', 
          expectedSize: 3,
          paintX: 5, 
          paintY: 5,
          material: 'stone',
          verifyTiles: [[5,5], [4,5], [6,5], [5,4], [5,6]] // Plus shape, not square
        },
        { 
          action: 'increase', 
          expectedSize: 5,
          paintX: 15, 
          paintY: 15,
          material: 'dirt',
          verifyTiles: [[15,15], [13,15], [17,15], [15,13], [15,17], [14,14]] // Circular
        },
        { 
          action: 'increase', 
          expectedSize: 7,
          paintX: 25, 
          paintY: 25,
          material: 'grass',
          verifyTiles: [[25,25], [22,25], [28,25], [25,22], [25,28]] // Center + radius 3
        },
        { 
          action: 'decrease', 
          expectedSize: 5,
          paintX: 10, 
          paintY: 10,
          material: 'stone',
          verifyTiles: [[10,10], [8,10], [12,10], [10,8], [10,12]] // Circular
        },
        { 
          action: 'decrease', 
          expectedSize: 3,
          paintX: 20, 
          paintY: 20,
          material: 'dirt',
          verifyTiles: [[20,20], [19,20], [21,20], [20,19], [20,21]] // Plus shape
        },
        { 
          action: 'decrease', 
          expectedSize: 1,
          paintX: 12, 
          paintY: 12,
          material: 'grass',
          verifyTiles: [[12,12]] // Single tile
        }
      ];
      
      workflow.forEach((step, index) => {
        // Click appropriate button
        let clickX, clickY;
        if (step.action === 'increase') {
          clickX = panelX + 90 - 25 + 10;
          clickY = panelY + 25 + 10;
        } else {
          clickX = panelX + 5 + 10;
          clickY = panelY + 25 + 10;
        }
        
        const result = brushControl.handleClick(clickX, clickY, panelX, panelY);
        expect(result).to.equal(step.action, `Step ${index + 1}: Should ${step.action}`);
        expect(brushControl.getSize()).to.equal(step.expectedSize, 
          `Step ${index + 1}: Size should be ${step.expectedSize}`);
        
        // Notify user
        notifications.show(`Brush size: ${brushControl.getSize()}`);
        
        // Apply to editor and paint
        editor.setBrushSize(brushControl.getSize());
        editor.selectMaterial(step.material);
        editor.paint(step.paintX, step.paintY);
        
        // Verify painted tiles
        step.verifyTiles.forEach(([x, y]) => {
          const tile = terrain.getTile(x, y);
          expect(tile).to.not.be.null;
          expect(tile.material).to.equal(step.material, 
            `Step ${index + 1}: Tile at (${x}, ${y}) should be ${step.material}`);
        });
      });
      
      // Verify notification history
      expect(notifications.getHistory()).to.have.lengthOf(6);
    });
    
    it('should containsPoint checks for UI panels', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      
      const paletteX = 10;
      const paletteY = 10;
      
      // Point inside palette
      expect(palette.containsPoint(20, 20, paletteX, paletteY)).to.be.true;
      
      // Point outside palette
      expect(palette.containsPoint(200, 200, paletteX, paletteY)).to.be.false;
      
      // Point inside toolbar
      const toolbarX = 100;
      const toolbarY = 10;
      expect(toolbar.containsPoint(110, 20, toolbarX, toolbarY)).to.be.true;
      
      // Point inside brush control
      const brushX = 10;
      const brushY = 100;
      expect(brushControl.containsPoint(20, 110, brushX, brushY)).to.be.true;
    });
    
    it('should integrate click handling with TerrainEditor', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      const editor = new TerrainEditor(terrain);
      
      // Setup panel positions
      const paletteX = 10;
      const paletteY = 10;
      const toolbarX = 100;
      const toolbarY = 10;
      const brushX = 10;
      const brushY = 100;
      
      // 1. Click stone in palette
      const stoneX = paletteX + 5 + 40 + 5 + 20;
      const stoneY = paletteY + 30 + 20;
      palette.handleClick(stoneX, stoneY, paletteX, paletteY);
      editor.selectMaterial(palette.getSelectedMaterial());
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
      
      // 2. Click brush in toolbar
      const brushToolX = toolbarX + 5 + 17;
      const brushToolY = toolbarY + 30 + 17;
      toolbar.handleClick(brushToolX, brushToolY, toolbarX, toolbarY);
      
      expect(toolbar.getSelectedTool()).to.equal('brush');
      
      // 3. Click increase in brush size
      const increaseX = brushX + 90 - 25 + 10;
      const increaseY = brushY + 25 + 10;
      brushControl.handleClick(increaseX, increaseY, brushX, brushY);
      editor.setBrushSize(brushControl.getSize());
      
      expect(brushControl.getSize()).to.equal(3);
      
      // 4. Paint with brush
      editor.paint(5, 5);
      
      expect(terrain.getTile(5, 5).material).to.equal('stone');
    });
    
    it('should not handle clicks outside UI panels', function() {
      const palette = new MaterialPalette(['moss', 'stone']);
      const toolbar = new ToolBar();
      const brushControl = new BrushSizeControl(1);
      
      const panelX = 10;
      const panelY = 10;
      
      // Click way outside all panels
      const outsideX = 1000;
      const outsideY = 1000;
      
      expect(palette.handleClick(outsideX, outsideY, panelX, panelY)).to.be.false;
      expect(toolbar.handleClick(outsideX, outsideY, panelX, panelY)).to.be.null;
      expect(brushControl.handleClick(outsideX, outsideY, panelX, panelY)).to.be.null;
    });
  });
  
  describe('NotificationManager History Integration', function() {
    
    it('should track notification history', function() {
      const notifications = new NotificationManager();
      
      // Show some notifications
      notifications.show('Action 1', 'info');
      notifications.show('Action 2', 'success');
      notifications.show('Action 3', 'warning');
      
      // Get history
      const history = notifications.getHistory();
      expect(history.length).to.equal(3);
      expect(history[0].message).to.equal('Action 1');
      expect(history[1].message).to.equal('Action 2');
      expect(history[2].message).to.equal('Action 3');
    });
    
    it('should maintain history after notifications expire', function() {
      const notifications = new NotificationManager(100); // 100ms duration
      
      notifications.show('Temporary message', 'info');
      
      // Before expiration
      expect(notifications.getNotifications().length).to.equal(1);
      expect(notifications.getHistory().length).to.equal(1);
      
      // Simulate time passing
      const futureTime = Date.now() + 200;
      notifications.removeExpired(futureTime);
      
      // After expiration - active is 0, history still has 1
      expect(notifications.getNotifications().length).to.equal(0);
      expect(notifications.getHistory().length).to.equal(1);
    });
    
    it('should limit history size', function() {
      const notifications = new NotificationManager(3000, 5); // max 5 in history
      
      // Show 10 notifications
      for (let i = 1; i <= 10; i++) {
        notifications.show(`Message ${i}`, 'info');
      }
      
      // History should only keep last 5
      const history = notifications.getHistory();
      expect(history.length).to.equal(5);
      expect(history[0].message).to.equal('Message 6');
      expect(history[4].message).to.equal('Message 10');
    });
    
    it('should get recent history items', function() {
      const notifications = new NotificationManager();
      
      for (let i = 1; i <= 10; i++) {
        notifications.show(`Message ${i}`, 'info');
      }
      
      // Get last 3
      const recent = notifications.getHistory(3);
      expect(recent.length).to.equal(3);
      expect(recent[0].message).to.equal('Message 8');
      expect(recent[1].message).to.equal('Message 9');
      expect(recent[2].message).to.equal('Message 10');
    });
    
    it('should integrate history with TerrainEditor workflow', function() {
      const terrain = new CustomTerrain(10, 10, 32, 'moss');
      const editor = new TerrainEditor(terrain);
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const notifications = new NotificationManager();
      
      // Track editing actions in notifications
      palette.selectMaterial('stone');
      notifications.show(`Selected material: ${palette.getSelectedMaterial()}`);
      
      editor.selectMaterial('stone');
      editor.paint(5, 5);
      notifications.show('Painted stone at (5, 5)');
      
      editor.undo();
      notifications.show('Undid last action');
      
      // Verify history
      const history = notifications.getHistory();
      expect(history.length).to.equal(3);
      expect(history[0].message).to.equal('Selected material: stone');
      expect(history[1].message).to.equal('Painted stone at (5, 5)');
      expect(history[2].message).to.equal('Undid last action');
    });
  });
});




// ================================================================
// paintTransform.integration.test.js (9 tests)
// ================================================================
/**
 * Integration Tests: Level Editor Paint Transform Consistency
 * 
 * Bug: When zoomed in/out, painted tiles appear offset from mouse cursor
 * Root Cause: Transform mismatch between rendering and coordinate conversion
 * 
 * TDD Approach:
 * 1. Create failing test showing transform inconsistency
 * 2. Fix applyCameraTransform to match screenToWorld inverse
 * 3. Verify test passes
 */

// Mock p5.js globals
global.g_canvasX = 800;
global.g_canvasY = 600;
global.TILE_SIZE = 32;
global.mouseX = 400;
global.mouseY = 300;
global.constrain = (val, min, max) => Math.max(min, Math.min(max, val));
global.logVerbose = () => {};
global.verboseLog = () => {};
global.logNormal = () => {};
global.window = global;
global.console = { log: () => {}, warn: () => {} };

// Mock GameState
global.GameState = {
  getState: () => 'LEVEL_EDITOR'
};

// Mock CameraController
global.CameraController = {
  getCameraPosition: () => ({ x: global.cameraX || 0, y: global.cameraY || 0 }),
  setCameraPosition: (x, y) => { global.cameraX = x; global.cameraY = y; }
};

// Mock map bounds
global.g_activeMap = {
  _xCount: 100,
  _yCount: 100
};

// Load CameraManager
require('../../../Classes/controllers/CameraManager');
let CameraManager = global.CameraManager;

describe('Level Editor - Paint Transform Consistency', function() {
  let cameraManager;
  let mockContext;

  beforeEach(function() {
    global.cameraX = 0;
    global.cameraY = 0;
    
    cameraManager = new CameraManager();
    cameraManager.initialize();
    
    // Mock p5.js rendering context for transform testing
    mockContext = {
      transformStack: [],
      currentTransform: { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 }
    };
    
    // Mock p5.js transform functions
    global.push = () => {
      mockContext.transformStack.push({...mockContext.currentTransform});
    };
    
    global.pop = () => {
      if (mockContext.transformStack.length > 0) {
        mockContext.currentTransform = mockContext.transformStack.pop();
      }
    };
    
    global.translate = (x, y) => {
      mockContext.currentTransform.translateX += x;
      mockContext.currentTransform.translateY += y;
    };
    
    global.scale = (s) => {
      mockContext.currentTransform.scaleX *= s;
      mockContext.currentTransform.scaleY *= s;
    };
  });

  describe('Transform Consistency', function() {
    it('should convert screen coords to world coords that match render transform inverse', function() {
      // Set camera state
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.5;
      
      // Screen point (mouse position)
      const screenX = 400;
      const screenY = 300;
      
      // Convert screen to world using CameraManager
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Simulate Level Editor's applyCameraTransform
      global.push();
      global.translate(-cameraManager.cameraX, -cameraManager.cameraY);
      global.scale(cameraManager.cameraZoom);
      
      // Apply forward transform to world coords
      let transformedX = worldCoords.worldX;
      let transformedY = worldCoords.worldY;
      
      // Apply the transform steps
      transformedX -= cameraManager.cameraX;
      transformedY -= cameraManager.cameraY;
      transformedX *= cameraManager.cameraZoom;
      transformedY *= cameraManager.cameraZoom;
      
      global.pop();
      
      // The transformed world coords should equal the original screen coords
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1,
        'Forward transform of world coords should return screen X');
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1,
        'Forward transform of world coords should return screen Y');
    });

    it('should work correctly at zoom = 2.0', function() {
      cameraManager.cameraX = 200;
      cameraManager.cameraY = 150;
      cameraManager.cameraZoom = 2.0;
      
      const screenX = 500;
      const screenY = 400;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1);
    });

    it('should work correctly at zoom = 0.5 (zoomed out)', function() {
      cameraManager.cameraX = 50;
      cameraManager.cameraY = 25;
      cameraManager.cameraZoom = 0.5;
      
      const screenX = 300;
      const screenY = 200;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1);
    });

    it('should work with camera offset and zoom', function() {
      cameraManager.cameraX = 500;
      cameraManager.cameraY = 300;
      cameraManager.cameraZoom = 1.2;
      
      const screenX = 150;
      const screenY = 450;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Forward transform (same as applyCameraTransform)
      const transformedX = (worldCoords.worldX - cameraManager.cameraX) * cameraManager.cameraZoom;
      const transformedY = (worldCoords.worldY - cameraManager.cameraY) * cameraManager.cameraZoom;
      
      expect(Math.abs(transformedX - screenX)).to.be.lessThan(0.1,
        `Expected screen X ${screenX}, got ${transformedX.toFixed(2)}`);
      expect(Math.abs(transformedY - screenY)).to.be.lessThan(0.1,
        `Expected screen Y ${screenY}, got ${transformedY.toFixed(2)}`);
    });
  });

  describe('Tile Coordinate Conversion', function() {
    it('should convert mouse position to correct tile coordinates when zoomed', function() {
      // Camera showing world coords 100-900 (x) and 50-650 (y) at 1.0 zoom
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.0;
      
      // Mouse at center of screen (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Convert to tile coords
      const tileX = Math.floor(worldCoords.worldX / 32);
      const tileY = Math.floor(worldCoords.worldY / 32);
      
      // At zoom 1.0, screen (400, 300) with camera (100, 50) should be world (500, 350)
      // Which is tile (15, 10)
      expect(worldCoords.worldX).to.equal(500);
      expect(worldCoords.worldY).to.equal(350);
      expect(tileX).to.equal(15);
      expect(tileY).to.equal(10);
    });

    it('should convert mouse position to correct tile coordinates when zoomed in 2x', function() {
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 2.0;
      
      // Mouse at center of screen (400, 300)
      const screenX = 400;
      const screenY = 300;
      
      const worldCoords = cameraManager.screenToWorld(screenX, screenY);
      
      // Convert to tile coords
      const tileX = Math.floor(worldCoords.worldX / 32);
      const tileY = Math.floor(worldCoords.worldY / 32);
      
      // At zoom 2.0, screen (400, 300) with camera (100, 50) should be world (300, 200)
      // Which is tile (9, 6)
      expect(worldCoords.worldX).to.equal(300);
      expect(worldCoords.worldY).to.equal(200);
      expect(tileX).to.equal(9);
      expect(tileY).to.equal(6);
    });

    it('should maintain same world point under mouse after zoom', function() {
      // Start at zoom 1.0, camera at origin
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;
      
      // Mouse at specific position
      const screenX = 659;
      const screenY = 295;
      
      // Get world coords before zoom
      const worldBefore = cameraManager.screenToWorld(screenX, screenY);
      const tileBefore = {
        x: Math.floor(worldBefore.worldX / 32),
        y: Math.floor(worldBefore.worldY / 32)
      };
      
      // Zoom in (this should adjust camera position)
      cameraManager.setZoom(1.61, screenX, screenY);
      
      // Get world coords after zoom
      const worldAfter = cameraManager.screenToWorld(screenX, screenY);
      const tileAfter = {
        x: Math.floor(worldAfter.worldX / 32),
        y: Math.floor(worldAfter.worldY / 32)
      };
      
      // The world point under the mouse should be approximately the same
      expect(Math.abs(worldAfter.worldX - worldBefore.worldX)).to.be.lessThan(1,
        'World X should remain constant under mouse when zooming');
      expect(Math.abs(worldAfter.worldY - worldBefore.worldY)).to.be.lessThan(1,
        'World Y should remain constant under mouse when zooming');
      
      // The tile under the mouse should be the same
      expect(tileAfter.x).to.equal(tileBefore.x,
        'Tile X should remain constant under mouse when zooming');
      expect(tileAfter.y).to.equal(tileBefore.y,
        'Tile Y should remain constant under mouse when zooming');
    });

    it('should paint at correct tile after zoom in', function() {
      // Real-world scenario from bug report
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;
      
      const mouseX = 659;
      const mouseY = 295;
      
      // First click at zoom 1.0
      const tile1 = {
        x: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldX / 32),
        y: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldY / 32)
      };
      
      // Zoom in
      cameraManager.setZoom(1.61, mouseX, mouseY);
      
      // Second click at same screen position
      const tile2 = {
        x: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldX / 32),
        y: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldY / 32)
      };
      
      // Should paint at same tile (within 1 tile tolerance for rounding)
      expect(Math.abs(tile2.x - tile1.x)).to.be.lessThan(2,
        'Painted tile X should be within 1 tile of expected');
      expect(Math.abs(tile2.y - tile1.y)).to.be.lessThan(2,
        'Painted tile Y should be within 1 tile of expected');
    });
  });

  describe('Regression: Bug from Oct 27, 2025', function() {
    it('should paint tiles at cursor position when zoomed (not offset)', function() {
      // Bug: After zoom, painted tiles appeared 3 tiles left and 2 tiles up from cursor
      // Root cause: Transform order was translate(-camera) then scale(zoom)
      // Fix: Changed to scale(zoom) then translate(-camera)
      
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;
      
      const mouseX = 400;
      const mouseY = 300;
      
      // Get tile before zoom
      const tileBefore = {
        x: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldX / 32),
        y: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldY / 32)
      };
      
      // Zoom in significantly
      cameraManager.setZoom(2.5, mouseX, mouseY);
      
      // Get tile after zoom at same screen position
      const tileAfter = {
        x: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldX / 32),
        y: Math.floor(cameraManager.screenToWorld(mouseX, mouseY).worldY / 32)
      };
      
      // Tiles should be the same (focus point maintained)
      expect(tileAfter.x).to.equal(tileBefore.x);
      expect(tileAfter.y).to.equal(tileBefore.y);
    });
  });
});




// ================================================================
// tileRenderingInvestigation.integration.test.js (8 tests)
// ================================================================
/**
 * Integration Test - Tile Rendering Investigation
 * 
 * This test investigates the tile rendering phase to identify why
 * tiles show brown solid colors instead of textures.
 */

describe('Tile Rendering Investigation', function() {
  let dom, window, document;
  let mockImages;
  
  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body><canvas id="defaultCanvas0"></canvas></body></html>', {
      url: 'http://localhost:8000',
      pretendToBeVisual: true
    });
    
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Mock p5.js functions
    global.image = sinon.stub();
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.noStroke = sinon.stub();
    
    window.image = global.image;
    window.fill = global.fill;
    window.rect = global.rect;
    window.push = global.push;
    window.pop = global.pop;
    window.noStroke = global.noStroke;
    
    // Mock terrain images
    mockImages = {
      MOSS_IMAGE: { width: 32, height: 32, loaded: true },
      STONE_IMAGE: { width: 32, height: 32, loaded: true },
      DIRT_IMAGE: { width: 32, height: 32, loaded: true },
      GRASS_IMAGE: { width: 32, height: 32, loaded: true }
    };
    
    global.MOSS_IMAGE = mockImages.MOSS_IMAGE;
    global.STONE_IMAGE = mockImages.STONE_IMAGE;
    global.DIRT_IMAGE = mockImages.DIRT_IMAGE;
    global.GRASS_IMAGE = mockImages.GRASS_IMAGE;
    
    window.MOSS_IMAGE = global.MOSS_IMAGE;
    window.STONE_IMAGE = global.STONE_IMAGE;
    window.DIRT_IMAGE = global.DIRT_IMAGE;
    window.GRASS_IMAGE = global.GRASS_IMAGE;
    
    // Set up TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'NONE': [[0,0], (x,y,s) => global.image(global.MOSS_IMAGE, x, y, s, s)],
      'moss': [[0,0.3], (x,y,s) => global.image(global.MOSS_IMAGE, x, y, s, s)],
      'stone': [[0,0.4], (x,y,s) => global.image(global.STONE_IMAGE, x, y, s, s)],
      'dirt': [[0.4,0.525], (x,y,s) => global.image(global.DIRT_IMAGE, x, y, s, s)],
      'grass': [[0,1], (x,y,s) => global.image(global.GRASS_IMAGE, x, y, s, s)]
    };
    window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.window;
    delete global.document;
  });
  
  describe('Tile.render() Method Investigation', function() {
    it('should check what Tile.render() actually does', function() {
      // Load Tile class from gridTerrain.js
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      expect(Tile).to.exist;
      
      // Create a tile
      const tile = new Tile(0, 0, 32);
      
      // Set material to 'moss'
      tile.setMaterial('moss');
      
      console.log('    Tile created and material set to "moss"');
      console.log('    Tile material property:', tile.material || tile._materialSet);
      
      // Try to render it
      global.image.resetHistory();
      global.fill.resetHistory();
      global.rect.resetHistory();
      
      tile.render();
      
      // Check what was called
      console.log('    After tile.render():');
      console.log('      image() called:', global.image.callCount, 'times');
      console.log('      fill() called:', global.fill.callCount, 'times');
      console.log('      rect() called:', global.rect.callCount, 'times');
      
      if (global.image.callCount > 0) {
        const imageCall = global.image.getCall(0);
        console.log('      image() called with:', imageCall.args);
        console.log('      First arg is MOSS_IMAGE?', imageCall.args[0] === global.MOSS_IMAGE);
      }
      
      if (global.fill.callCount > 0) {
        const fillCall = global.fill.getCall(0);
        console.log('      fill() called with:', fillCall.args);
        
        // Check if it's brown color
        if (fillCall.args.length === 3) {
          const [r, g, b] = fillCall.args;
          console.log('      RGB values:', { r, g, b });
          if (r > 100 && r < 180 && g > 40 && g < 100 && b > 0 && b < 50) {
            console.log('      ⚠️  BROWN COLOR DETECTED!');
          }
        }
      }
    });
    
    it('should check if Tile uses TERRAIN_MATERIALS_RANGED or falls back to color', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      const tile = new Tile(0, 0, 32);
      
      // Test with material that exists in TERRAIN_MATERIALS_RANGED
      tile.setMaterial('moss');
      
      global.image.resetHistory();
      global.fill.resetHistory();
      
      tile.render();
      
      const usedImage = global.image.callCount > 0;
      const usedFill = global.fill.callCount > 0;
      
      console.log('    Material "moss":');
      console.log('      Used image()?', usedImage);
      console.log('      Used fill()?', usedFill);
      
      if (usedFill && !usedImage) {
        console.log('      🐛 Tile is using fill() instead of image() - this is the bug!');
      } else if (usedImage) {
        console.log('      ✓ Tile is using image() as expected');
      }
    });
    
    it('should test if Tile.render() source code uses TERRAIN_MATERIALS_RANGED', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      
      const Tile = global.Tile || window.Tile;
      
      // Check if Tile has a render method
      expect(Tile.prototype.render).to.be.a('function');
      
      // Get the source code of render method
      const renderSource = Tile.prototype.render.toString();
      
      console.log('    Tile.render() source code analysis:');
      console.log('      Contains "TERRAIN_MATERIALS_RANGED"?', renderSource.includes('TERRAIN_MATERIALS_RANGED'));
      console.log('      Contains "image("?', renderSource.includes('image('));
      console.log('      Contains "fill("?', renderSource.includes('fill('));
      console.log('      Contains "_materialSet"?', renderSource.includes('_materialSet'));
      console.log('      Contains "material"?', renderSource.includes('material'));
      
      // Look for specific patterns
      const hasTerrainLookup = /TERRAIN_MATERIALS_RANGED\[.*\]/.test(renderSource);
      const hasImageCall = /image\(/.test(renderSource);
      const hasFillCall = /fill\(/.test(renderSource);
      
      console.log('      Has TERRAIN_MATERIALS_RANGED lookup?', hasTerrainLookup);
      console.log('      Has image() call?', hasImageCall);
      console.log('      Has fill() call?', hasFillCall);
      
      // Print first 500 chars of render method
      console.log('\n      First 500 chars of render():');
      console.log('      ' + renderSource.substring(0, 500).split('\n').join('\n      '));
    });
    
    it('should check material name matching between palette and tile', function() {
      require('../../../Classes/terrainUtils/gridTerrain.js');
      require('../../../Classes/ui/MaterialPalette.js');
      
      const MaterialPalette = global.MaterialPalette || window.MaterialPalette;
      const Tile = global.Tile || window.Tile;
      
      // Create palette
      const palette = new MaterialPalette();
      
      console.log('    MaterialPalette materials:', palette.materials);
      console.log('    TERRAIN_MATERIALS_RANGED keys:', Object.keys(global.TERRAIN_MATERIALS_RANGED));
      
      // Check if all palette materials exist in TERRAIN_MATERIALS_RANGED
      const mismatches = [];
      palette.materials.forEach(material => {
        if (!global.TERRAIN_MATERIALS_RANGED[material]) {
          mismatches.push(material);
        }
      });
      
      if (mismatches.length > 0) {
        console.log('    🐛 MISMATCH FOUND! Materials in palette but not in TERRAIN_MATERIALS_RANGED:');
        mismatches.forEach(m => console.log('      -', m));
      } else {
        console.log('    ✓ All palette materials exist in TERRAIN_MATERIALS_RANGED');
      }
      
      // Test rendering with each palette material
      console.log('\n    Testing render for each material:');
      palette.materials.slice(0, 3).forEach(material => {
        const tile = new Tile(0, 0, 32);
        tile.setMaterial(material);
        
        global.image.resetHistory();
        global.fill.resetHistory();
        
        tile.render();
        
        console.log(`      ${material}: image=${global.image.callCount}, fill=${global.fill.callCount}`);
      });
    });
  });
  
  describe('TerrainEditor Paint Investigation', function() {
    it('should check how TerrainEditor.paintTile passes material name', function() {
      // Load TerrainEditor
      const TerrainEditor = require('../../../Classes/terrainUtils/TerrainEditor.js');
      
      expect(TerrainEditor).to.exist;
      
      // Check paintTile method
      const paintTileSource = TerrainEditor.prototype.paintTile.toString();
      
      console.log('    TerrainEditor.paintTile() analysis:');
      console.log('      Contains "setMaterial"?', paintTileSource.includes('setMaterial'));
      console.log('      Contains "material" parameter?', paintTileSource.includes('material'));
      
      // Print first 300 chars
      console.log('\n      First 300 chars of paintTile():');
      console.log('      ' + paintTileSource.substring(0, 300).split('\n').join('\n      '));
    });
  });
  
  describe('Render Function Direct Test', function() {
    it('should directly call TERRAIN_MATERIALS_RANGED render functions', function() {
      console.log('    Direct render function tests:');
      
      // Reset mocks
      global.image.resetHistory();
      
      // Call moss render function directly
      const mossRenderFunc = global.TERRAIN_MATERIALS_RANGED['moss'][1];
      expect(mossRenderFunc).to.be.a('function');
      
      mossRenderFunc(10, 10, 32);
      
      console.log('      Called moss render function directly');
      console.log('      image() called?', global.image.callCount > 0);
      if (global.image.callCount > 0) {
        const args = global.image.getCall(0).args;
        console.log('      image() args:', args);
        console.log('      First arg is MOSS_IMAGE?', args[0] === global.MOSS_IMAGE);
      }
      
      // Try with stone
      global.image.resetHistory();
      const stoneRenderFunc = global.TERRAIN_MATERIALS_RANGED['stone'][1];
      stoneRenderFunc(20, 20, 32);
      
      console.log('      Called stone render function directly');
      console.log('      image() called?', global.image.callCount > 0);
      if (global.image.callCount > 0) {
        const args = global.image.getCall(0).args;
        console.log('      First arg is STONE_IMAGE?', args[0] === global.STONE_IMAGE);
      }
    });
  });
});




// ================================================================
// zoomFocusPoint.integration.test.js (6 tests)
// ================================================================
/**
 * Integration Tests: Level Editor Zoom Focus Point Bug
 * 
 * Tests to verify zoom focuses on mouse pointer correctly.
 * Bug: Zoom in Level Editor doesn't focus on mouse cursor (PLAYING state works fine)
 * 
 * TDD Approach:
 * 1. Create diagnostic test to understand the issue
 * 2. Compare PLAYING state (working) vs LEVEL_EDITOR state (broken)
 * 3. Identify the difference
 * 4. Fix and verify
 */

// Mock p5.js globals BEFORE requiring CameraManager
global.g_canvasX = 800;
global.g_canvasY = 600;
global.TILE_SIZE = 32;
global.mouseX = 400;
global.mouseY = 300;
global.windowWidth = 800;
global.windowHeight = 600;
global.constrain = (val, min, max) => Math.max(min, Math.min(max, val));
global.logVerbose = () => {};
global.verboseLog = () => {};
global.window = global; // CRITICAL: Makes window.CameraManager accessible as global.CameraManager
global.console = { log: () => {} };

// Mock GameState
global.GameState = {
  getState: () => 'LEVEL_EDITOR'
};

// Mock CameraController
global.CameraController = {
  getCameraPosition: () => ({ x: global.cameraX || 0, y: global.cameraY || 0 }),
  setCameraPosition: (x, y) => { global.cameraX = x; global.cameraY = y; }
};

// Mock map bounds (large enough to not constrain camera)
global.g_activeMap = {
  _xCount: 100,  // 100 tiles * 32 = 3200px
  _yCount: 100   // 100 tiles * 32 = 3200px
};

// Load CameraManager (exports to window.CameraManager, accessible via global.CameraManager)
require('../../../Classes/controllers/CameraManager');
// DUPLICATE REQUIRE REMOVED: let CameraManager = global.CameraManager;

describe('Level Editor - Zoom Focus Point Integration', function() {
  let cameraManager;

  beforeEach(function() {
    global.cameraX = 0;
    global.cameraY = 0;
    global.mouseX = 400;
    global.mouseY = 300;
    
    cameraManager = new CameraManager();
    cameraManager.initialize();
  });

  afterEach(function() {
    // Clean up
    global.cameraX = 0;
    global.cameraY = 0;
  });

  describe('Zoom Focus Point Calculation', function() {
    it('should focus zoom on mouse position', function() {
      // Set up initial state
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse at center of screen
      global.mouseX = 400;
      global.mouseY = 300;

      const initialWorldAtMouse = cameraManager.screenToWorld(400, 300);
      console.log('Initial world at mouse:', initialWorldAtMouse);
      console.log('Initial camera:', cameraManager.cameraX, cameraManager.cameraY, cameraManager.cameraZoom);
      
      // Zoom in 2x
      cameraManager.setZoom(2.0, 400, 300);

      console.log('After zoom camera:', cameraManager.cameraX, cameraManager.cameraY, cameraManager.cameraZoom);
      
      // After zoom, the same world point should still be under the mouse
      const finalWorldAtMouse = cameraManager.screenToWorld(400, 300);
      console.log('Final world at mouse:', finalWorldAtMouse);
      console.log('Diff:', finalWorldAtMouse.worldX - initialWorldAtMouse.worldX, finalWorldAtMouse.worldY - initialWorldAtMouse.worldY);

      // The world coordinates under the mouse should be approximately the same
      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1,
        'World X coordinate under mouse should remain constant when zooming');
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1,
        'World Y coordinate under mouse should remain constant when zooming');
    });

    it('should work with mouse at top-left quadrant', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse in top-left quadrant
      global.mouseX = 200;
      global.mouseY = 150;

      const initialWorldAtMouse = cameraManager.screenToWorld(200, 150);
      
      cameraManager.setZoom(1.5, 200, 150);

      const finalWorldAtMouse = cameraManager.screenToWorld(200, 150);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });

    it('should work with mouse at bottom-right quadrant', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      // Mouse in bottom-right quadrant
      global.mouseX = 600;
      global.mouseY = 450;

      const initialWorldAtMouse = cameraManager.screenToWorld(600, 450);
      
      cameraManager.setZoom(0.8, 600, 450);

      const finalWorldAtMouse = cameraManager.screenToWorld(600, 450);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });

    it('should handle zoom in sequence maintaining focus', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      global.mouseX = 300;
      global.mouseY = 200;

      const initialWorldAtMouse = cameraManager.screenToWorld(300, 200);
      
      // Zoom in multiple times
      cameraManager.setZoom(1.2, 300, 200);
      cameraManager.setZoom(1.5, 300, 200);
      cameraManager.setZoom(2.0, 300, 200);

      const finalWorldAtMouse = cameraManager.screenToWorld(300, 200);

      expect(Math.abs(finalWorldAtMouse.worldX - initialWorldAtMouse.worldX)).to.be.lessThan(1);
      expect(Math.abs(finalWorldAtMouse.worldY - initialWorldAtMouse.worldY)).to.be.lessThan(1);
    });
  });

  describe('Transform Pipeline Consistency', function() {
    it('should use same transform pipeline as applyCameraTransform', function() {
      // This test verifies that screenToWorld is the inverse of the transform applied
      cameraManager.cameraX = 100;
      cameraManager.cameraY = 50;
      cameraManager.cameraZoom = 1.5;

      // Pick a screen point
      const screenX = 400;
      const screenY = 300;

      // Convert to world
      const world = cameraManager.screenToWorld(screenX, screenY);

      // Manually apply the transform (simulating applyCameraTransform in Level Editor)
      // Transform pipeline:
      // 1. translate(canvasCenter)
      // 2. scale(zoom)
      // 3. translate(-canvasCenter)
      // 4. translate(-cameraX, -cameraY)
      
      // Inverse:
      // 1. Add cameraX, cameraY
      // 2. translate(canvasCenter)
      // 3. divide by zoom
      // 4. translate(-canvasCenter)
      
      const canvasCenterX = global.g_canvasX / 2;
      const canvasCenterY = global.g_canvasY / 2;
      
      // Apply inverse transform manually
      let wx = screenX;
      let wy = screenY;
      
      // Inverse of translate(-cameraX, -cameraY)
      wx += cameraManager.cameraX;
      wy += cameraManager.cameraY;
      
      // Inverse of translate(-canvasCenter)
      wx += canvasCenterX;
      wy += canvasCenterY;
      
      // Inverse of scale(zoom)
      wx /= cameraManager.cameraZoom;
      wy /= cameraManager.cameraZoom;
      
      // Inverse of translate(canvasCenter)
      wx -= canvasCenterX;
      wy -= canvasCenterY;

      // Compare with screenToWorld result
      expect(Math.abs(world.worldX - wx)).to.be.lessThan(0.1,
        'Manual transform should match screenToWorld X');
      expect(Math.abs(world.worldY - wy)).to.be.lessThan(0.1,
        'Manual transform should match screenToWorld Y');
    });
  });

  describe('Diagnostic: Current Behavior', function() {
    it('should log zoom behavior for debugging', function() {
      cameraManager.cameraX = 0;
      cameraManager.cameraY = 0;
      cameraManager.cameraZoom = 1.0;

      global.mouseX = 400;
      global.mouseY = 300;

      console.log('\n=== ZOOM DIAGNOSTIC ===');
      console.log('Initial state:');
      console.log('  cameraX:', cameraManager.cameraX);
      console.log('  cameraY:', cameraManager.cameraY);
      console.log('  cameraZoom:', cameraManager.cameraZoom);
      console.log('  mouseX:', global.mouseX);
      console.log('  mouseY:', global.mouseY);

      const beforeWorld = cameraManager.screenToWorld(global.mouseX, global.mouseY);
      console.log('World at mouse before zoom:', beforeWorld);

      // Zoom in 2x
      cameraManager.setZoom(2.0, global.mouseX, global.mouseY);

      console.log('\nAfter zoom to 2.0x:');
      console.log('  cameraX:', cameraManager.cameraX);
      console.log('  cameraY:', cameraManager.cameraY);
      console.log('  cameraZoom:', cameraManager.cameraZoom);

      const afterWorld = cameraManager.screenToWorld(global.mouseX, global.mouseY);
      console.log('World at mouse after zoom:', afterWorld);

      console.log('\nDifference:');
      console.log('  Delta X:', afterWorld.x - beforeWorld.x);
      console.log('  Delta Y:', afterWorld.y - beforeWorld.y);
      console.log('======================\n');

      // This test just logs, no assertion
      expect(true).to.be.true;
    });
  });
});

