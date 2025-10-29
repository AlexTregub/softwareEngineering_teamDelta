/**
 * Consolidated UI Panel System Tests
 * Generated: 2025-10-29T03:11:41.099Z
 * Source files: 15
 * Total tests: 393
 * 
 * This file contains all ui panel system tests merged from individual test files.
 * Each section preserves its original setup, mocks, and teardown.
 */

// Common requires (extracted from all test files)
let { expect } = require('chai');
let sinon = require('sinon');
let { JSDOM } = require('jsdom');


// ================================================================
// draggablePanel.test.js (11 tests)
// ================================================================
/**
 * Unit Tests for DraggablePanel
 * Tests panel auto-resize behavior and state management
 */

describe('DraggablePanel', () => {
  let DraggablePanel;
  let Button;
  let ButtonStyles;
  let panel;
  let saveStateStub;
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
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    localStorageGetItemStub = sinon.stub();
    localStorageSetItemStub = sinon.stub();
    global.localStorage = {
      getItem: localStorageGetItemStub,
      setItem: localStorageSetItemStub
    };

    // Mock Button class
    Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
    };
    global.Button = Button;

    // Mock ButtonStyles
    ButtonStyles = {
      DEFAULT: {
        backgroundColor: '#cccccc',
        color: '#000000'
      }
    };
    global.ButtonStyles = ButtonStyles;

    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
  });

  beforeEach(() => {
    // Reset stubs
    localStorageGetItemStub.reset();
    localStorageSetItemStub.reset();
    localStorageGetItemStub.returns(null); // No saved state by default

    // Create a test panel with buttons
    panel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      buttons: {
        layout: 'vertical',
        items: [
          { caption: 'Button 1', onClick: () => {} },
          { caption: 'Button 2', onClick: () => {} },
          { caption: 'Button 3', onClick: () => {} }
        ]
      }
    });

    // Stub saveState method for testing
    saveStateStub = sinon.stub(panel, 'saveState');
  });

  afterEach(() => {
    saveStateStub.restore();
  });

  describe('Auto-resize behavior', () => {
    it('should NOT call saveState() when auto-resizing content', () => {
      // Record initial height
      const initialHeight = panel.config.size.height;

      // Call autoResizeToFitContent
      panel.autoResizeToFitContent();

      // saveState should NOT be called
      expect(saveStateStub.called).to.be.false;
    });

    it('should update panel height without saving to localStorage', () => {
      // Force a resize scenario by modifying button heights
      panel.buttons.forEach(btn => {
        btn.height = 50; // Make buttons taller
      });

      // Call autoResizeToFitContent
      panel.autoResizeToFitContent();

      // Panel height should be updated
      expect(panel.config.size.height).to.be.greaterThan(150);

      // But saveState should NOT be called
      expect(saveStateStub.called).to.be.false;

      // localStorage should NOT be written to
      expect(localStorageSetItemStub.called).to.be.false;
    });

    it('should only save state when manually dragging (not auto-resize)', () => {
      // Restore the real saveState method temporarily
      saveStateStub.restore();
      
      // Spy on localStorage.setItem instead
      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Simulate manual drag (this SHOULD save state)
      panel.isDragging = true;
      panel.dragOffset = { x: 10, y: 10 };
      
      // Simulate drag movement
      panel.handleDragging(150, 150, true); // mouse pressed
      panel.handleDragging(150, 150, false); // mouse released (triggers saveState)

      // saveState should be called during drag release
      expect(setItemSpy.calledOnce).to.be.true;
      expect(setItemSpy.firstCall.args[0]).to.equal('draggable-panel-test-panel');

      setItemSpy.restore();
      
      // Re-stub saveState for cleanup
      saveStateStub = sinon.stub(panel, 'saveState');
    });

    it('should calculate content height correctly for vertical layout', () => {
      panel.buttons[0].height = 30;
      panel.buttons[1].height = 40;
      panel.buttons[2].height = 35;

      const contentHeight = panel.calculateContentHeight();

      // Should be: padding(10) + button1(30) + spacing(5) + button2(40) + spacing(5) + button3(35) + padding(10)
      // = 10 + 30 + 5 + 40 + 5 + 35 + 10 = 135
      expect(contentHeight).to.equal(135);
    });

    it('should update button positions after auto-resize', () => {
      const updatePositionsSpy = sinon.spy(panel, 'updateButtonPositions');

      panel.autoResizeToFitContent();

      expect(updatePositionsSpy.called).to.be.true;

      updatePositionsSpy.restore();
    });
  });

  describe('Panel growing prevention (bug fix)', () => {
    it('should maintain stable height across multiple update cycles', () => {
      const initialHeight = panel.config.size.height;

      // Simulate multiple update cycles (as would happen in the game loop)
      for (let i = 0; i < 100; i++) {
        panel.autoResizeToFitContent();
      }

      // Height should remain stable (within floating point tolerance)
      expect(Math.abs(panel.config.size.height - initialHeight)).to.be.lessThan(1);

      // saveState should NEVER be called
      expect(saveStateStub.called).to.be.false;
    });

    it('should not accumulate height from rounding errors', () => {
      const initialHeight = panel.config.size.height;

      // Simulate 1000 frames worth of updates (realistic for ~16 seconds at 60fps)
      for (let i = 0; i < 1000; i++) {
        panel.update(50, 50, false); // update includes autoResizeToFitContent
      }

      // Height should not have grown significantly
      const growth = panel.config.size.height - initialHeight;
      expect(growth).to.be.lessThan(5); // Less than the resize threshold

      // saveState should not be called from auto-resize
      expect(saveStateStub.called).to.be.false;
    });
  });

  describe('State persistence', () => {
    it('should load persisted position from localStorage on creation', () => {
      localStorageGetItemStub.returns(JSON.stringify({
        position: { x: 500, y: 300 },
        visible: true,
        minimized: false
      }));

      const newPanel = new DraggablePanel({
        id: 'persisted-panel',
        title: 'Persisted Panel',
        position: { x: 100, y: 100 }, // This will be overridden
        size: { width: 200, height: 150 }
      });

      expect(newPanel.state.position.x).to.equal(500);
      expect(newPanel.state.position.y).to.equal(300);
    });

    it('should save position when dragging ends', () => {
      saveStateStub.restore(); // Use real saveState

      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Start drag
      panel.isDragging = true;
      panel.dragOffset = { x: 10, y: 10 };
      panel.handleDragging(200, 200, true);

      // End drag (release mouse)
      panel.handleDragging(200, 200, false);

      // Should have saved state
      expect(setItemSpy.calledOnce).to.be.true;
      const savedData = JSON.parse(setItemSpy.firstCall.args[1]);
      expect(savedData.position).to.deep.equal({ x: 190, y: 190 });

      setItemSpy.restore();
      saveStateStub = sinon.stub(panel, 'saveState');
    });

    it('should NOT save size changes from auto-resize', () => {
      saveStateStub.restore(); // Use real saveState

      const setItemSpy = sinon.spy(global.localStorage, 'setItem');

      // Trigger auto-resize
      panel.buttons.forEach(btn => btn.height = 60);
      panel.autoResizeToFitContent();

      // Should NOT have saved
      expect(setItemSpy.called).to.be.false;

      setItemSpy.restore();
      saveStateStub = sinon.stub(panel, 'saveState');
    });
  });

  describe('Resize threshold', () => {
    it('should only resize when height difference exceeds threshold (5px)', () => {
      const initialHeight = panel.config.size.height;
      const initialButtonHeight = panel.buttons[0].height;

      // Make a small change (less than threshold)
      panel.buttons[0].height = initialButtonHeight + 1;
      panel.autoResizeToFitContent();

      // Panel height should not change (difference too small)
      expect(panel.config.size.height).to.equal(initialHeight);

      // Make a larger change (exceeds threshold)
      panel.buttons[0].height = initialButtonHeight + 20;
      panel.autoResizeToFitContent();

      // Panel height SHOULD change now
      expect(panel.config.size.height).to.be.greaterThan(initialHeight);
    });
  });
});




// ================================================================
// draggablePanelManager.test.js (12 tests)
// ================================================================
// Load minimal test environment
let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

// Load the class under test
let DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

describe('DraggablePanelManager (unit)', function() {
  let manager;

  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock RenderManager
    global.RenderManager = {
      layers: { UI_GAME: 'UI_GAME' },
      _drawables: {},
      clear: function() { this._drawables = {}; },
      addDrawableToLayer: function(layer, drawable) {
        if (!this._drawables[layer]) this._drawables[layer] = [];
        this._drawables[layer].push(drawable);
      }
    };
    
    // Clear globals that manager may reuse
    global.ants = [];
    global.RenderManager.clear();
    manager = new DraggablePanelManager();
  });

  afterEach(function() {
    if (manager && typeof manager.dispose === 'function') manager.dispose();
    manager = null;
    cleanupUITestEnvironment();
  });

  it('constructs with defaults', function() {
    expect(manager).to.be.an('object');
    expect(manager.panels).to.be.instanceOf(Map);
    expect(manager.isInitialized).to.be.false;
    expect(manager.gameState).to.equal('MENU');
  });

  it('initializes and registers with RenderManager', function() {
    manager.initialize();
    expect(manager.isInitialized).to.be.true;
    expect(RenderManager._drawables[RenderManager.layers.UI_GAME]).to.exist;
  });

  it('creates default panels', function() {
    manager.createDefaultPanels();
    expect(manager.hasPanel('ant_spawn')).to.be.true;
    expect(manager.hasPanel('resources')).to.be.true;
    expect(manager.hasPanel('stats')).to.be.true;
  });

  it('can add, get, and remove a panel', function() {
    manager.initialize();
    const cfg = { id: 'test-panel', title: 'Test', position: { x: 0, y: 0 }, size: { width: 10, height: 10 }, buttons: { items: [] } };
    const panel = manager.addPanel(cfg);
    expect(manager.hasPanel('test-panel')).to.be.true;
    const fetched = manager.getPanel('test-panel');
    expect(fetched).to.equal(panel);
    manager.removePanel('test-panel');
    expect(manager.hasPanel('test-panel')).to.be.false;
  });

  it('tracks panel counts and visible counts', function() {
    manager.createDefaultPanels();
    const ids = manager.getPanelIds();
    expect(ids.length).to.be.greaterThan(0);
    expect(manager.getPanelCount()).to.equal(ids.length);
    // Ensure visible count equals panelCount initially
    expect(manager.getVisiblePanelCount()).to.be.a('number');
  });

  it('toggles, shows, and hides panels', function() {
    manager.initialize();
    manager.createDefaultPanels();
    manager.addPanel({ id: 'toggle-me', title: 'Toggle', position: { x:0,y:0 }, size: { width: 10, height: 10 }, buttons: { items: [] } });
    expect(manager.hasPanel('toggle-me')).to.be.true;
    manager.hidePanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.false;
    manager.showPanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.true;
    manager.togglePanel('toggle-me');
    expect(manager.isPanelVisible('toggle-me')).to.be.false;
  });

  it('scales globally', function() {
    // Ensure min/max/defaults exist to avoid NaN
    manager.minScale = 0.5;
    manager.maxScale = 2.0;
    manager.globalScale = 1.0;
    manager.setGlobalScale(1.5);
    expect(manager.getGlobalScale()).to.equal(1.5);
    manager.scaleUp();
    expect(manager.getGlobalScale()).to.be.above(1.5);
    manager.scaleDown();
    manager.resetScale();
    expect(manager.getGlobalScale()).to.equal(1.0);
  });

  it('spawns ants via spawn commands', function() {
    manager.spawnAnts(3);
    // executeCommand should have created ants
    expect(global.ants.length).to.be.at.least(3);
  });

  it('selects and deselects ants via commands', function() {
    // spawn some ants
    manager.spawnAnts(5);
    expect(global.ants.length).to.equal(5);
    manager.selectAllAnts();
    expect(global.ants.every(a => a.isSelected)).to.be.true;
    manager.deselectAllAnts();
    expect(global.ants.every(a => !a.isSelected)).to.be.true;
  });

  it('saves and loads game using g_gameStateManager', function() {
    manager.saveGame();
    expect(g_gameStateManager._saved).to.be.true;
    manager.loadGame();
    expect(g_gameStateManager._loaded).to.be.true;
  });

  it('can dispose and clear panels', function() {
    manager.createDefaultPanels();
    expect(manager.getPanelCount()).to.be.greaterThan(0);
    manager.dispose();
    expect(manager.getPanelCount()).to.equal(0);
    expect(manager.isInitialized).to.be.false;
  });

  it('toggles debug and train mode flags', function() {
    manager.togglePanelTrainMode();
    expect(manager.debugMode.panelTrainMode).to.be.true;
    manager.togglePanelTrainMode();
    expect(manager.debugMode.panelTrainMode).to.be.false;
    manager.setPanelTrainMode(true);
    expect(manager.isPanelTrainModeEnabled()).to.be.true;
    manager.setPanelTrainMode(false);
    expect(manager.isPanelTrainModeEnabled()).to.be.false;
  });

});




// ================================================================
// draggablePanelManager.getOrCreatePanel.test.js (11 tests)
// ================================================================
/**
 * Unit Tests for DraggablePanelManager.getOrCreatePanel()
 * 
 * Following TDD: Write tests FIRST, then implement.
 * 
 * Test the getOrCreatePanel() helper method which:
 * - Returns existing panel if it exists
 * - Creates new panel if it doesn't exist
 * - Updates existing panel config if updateIfExists is true
 */

describe('DraggablePanelManager.getOrCreatePanel()', function() {
  let dom;
  let window;
  let document;
  let sandbox;
  let DraggablePanelManager;
  let DraggablePanel;
  let manager;

  beforeEach(function() {
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true
    });
    window = dom.window;
    document = window.document;
    
    sandbox = sinon.createSandbox();

    // Set up globals
    global.window = window;
    global.document = document;
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    
    // Mock p5.js functions
    const mockP5 = {
      createVector: (x, y) => ({ x, y }),
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub()
    };
    
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      window[key] = mockP5[key];
    });

    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
    
    global.DraggablePanel = DraggablePanel;
    window.DraggablePanel = DraggablePanel;
    
    // Mock ButtonStyles
    global.ButtonStyles = {
      PRIMARY: 'primary',
      SUCCESS: 'success',
      DANGER: 'danger'
    };
    window.ButtonStyles = global.ButtonStyles;
    
    // Mock Button class
    global.Button = class MockButton {
      constructor(config) {
        this.config = config;
        this.state = { visible: true };
        this.x = config.x || 0;
        this.y = config.y || 0;
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() {}
      render() {}
    };
    window.Button = global.Button;
    
    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;
    window.devConsoleEnabled = false;
    
    // Mock localStorage
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };
    window.localStorage = global.localStorage;

    // Create manager instance
    manager = new DraggablePanelManager();
    manager.isInitialized = true; // Skip full initialization to avoid dependencies
  });

  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.DraggablePanel;
    delete global.ButtonStyles;
    delete global.Button;
    delete global.devConsoleEnabled;
    delete global.localStorage;
  });

  describe('Basic Functionality', function() {
    it('should return existing panel if it exists', function() {
      const config = {
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      // Create panel first
      const originalPanel = manager.addPanel(config);
      
      // getOrCreatePanel should return same panel
      const retrievedPanel = manager.getOrCreatePanel('test-panel', config);
      
      expect(retrievedPanel).to.equal(originalPanel);
      expect(manager.getPanelCount()).to.equal(1); // Only one panel
    });

    it('should create new panel if it does not exist', function() {
      const config = {
        id: 'new-panel',
        title: 'New Panel',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 200 }
      };
      
      expect(manager.getPanelCount()).to.equal(0);
      
      const panel = manager.getOrCreatePanel('new-panel', config);
      
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('new-panel');
      expect(panel.config.title).to.equal('New Panel');
      expect(manager.getPanelCount()).to.equal(1);
    });

    it('should use panelId from first argument', function() {
      const config = {
        id: 'config-id', // This should be ignored
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      const panel = manager.getOrCreatePanel('actual-id', config);
      
      expect(panel.config.id).to.equal('actual-id');
      expect(manager.getPanel('actual-id')).to.equal(panel);
    });
  });

  describe('Config Update Behavior', function() {
    it('should NOT update existing panel config by default', function() {
      const originalConfig = {
        id: 'update-test',
        title: 'Original Title',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      manager.addPanel(originalConfig);
      
      const newConfig = {
        id: 'update-test',
        title: 'New Title',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 250 }
      };
      
      const panel = manager.getOrCreatePanel('update-test', newConfig);
      
      // Should keep original config
      expect(panel.config.title).to.equal('Original Title');
      expect(panel.config.position.x).to.equal(100);
    });

    it('should update existing panel config when updateIfExists is true', function() {
      const originalConfig = {
        id: 'update-test',
        title: 'Original Title',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      manager.addPanel(originalConfig);
      
      const newConfig = {
        id: 'update-test',
        title: 'New Title',
        position: { x: 200, y: 200 },
        size: { width: 300, height: 250 }
      };
      
      const panel = manager.getOrCreatePanel('update-test', newConfig, true);
      
      // Should have updated config
      expect(panel.config.title).to.equal('New Title');
      expect(panel.config.position.x).to.equal(200);
      expect(panel.config.size.width).to.equal(300);
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing config parameter', function() {
      // Should not throw, should return null or undefined
      const panel = manager.getOrCreatePanel('test-id');
      expect(panel).to.be.undefined;
    });

    it('should handle null panelId', function() {
      const config = {
        id: 'test',
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      // Should not throw
      const panel = manager.getOrCreatePanel(null, config);
      expect(panel).to.be.undefined;
    });

    it('should handle undefined panelId', function() {
      const config = {
        id: 'test',
        title: 'Test',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      // Should not throw
      const panel = manager.getOrCreatePanel(undefined, config);
      expect(panel).to.be.undefined;
    });
  });

  describe('Integration with addPanel and getPanel', function() {
    it('should work seamlessly with existing addPanel/getPanel methods', function() {
      const config1 = {
        id: 'panel-1',
        title: 'Panel 1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      const config2 = {
        id: 'panel-2',
        title: 'Panel 2',
        position: { x: 300, y: 100 },
        size: { width: 200, height: 150 }
      };
      
      // Mix of addPanel and getOrCreatePanel
      manager.addPanel(config1);
      const panel2 = manager.getOrCreatePanel('panel-2', config2);
      const panel1Again = manager.getOrCreatePanel('panel-1', config1);
      
      expect(manager.getPanelCount()).to.equal(2);
      expect(manager.getPanel('panel-1')).to.equal(panel1Again);
      expect(manager.getPanel('panel-2')).to.equal(panel2);
    });

    it('should maintain panel references across multiple getOrCreatePanel calls', function() {
      const config = {
        id: 'stable-panel',
        title: 'Stable',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 }
      };
      
      const panel1 = manager.getOrCreatePanel('stable-panel', config);
      const panel2 = manager.getOrCreatePanel('stable-panel', config);
      const panel3 = manager.getOrCreatePanel('stable-panel', config);
      
      expect(panel1).to.equal(panel2);
      expect(panel2).to.equal(panel3);
      expect(manager.getPanelCount()).to.equal(1);
    });
  });

  describe('DialogueEvent Use Case', function() {
    it('should support dialogue panel reuse pattern', function() {
      // Simulate DialogueEvent behavior
      const dialogue1Config = {
        id: 'dialogue-display',
        title: 'Speaker 1',
        position: { x: 710, y: 880 },
        size: { width: 500, height: 160 },
        buttons: {
          layout: 'horizontal',
          items: [{ caption: 'Choice 1' }]
        }
      };
      
      const dialogue2Config = {
        id: 'dialogue-display',
        title: 'Speaker 2',
        position: { x: 710, y: 880 },
        size: { width: 500, height: 160 },
        buttons: {
          layout: 'horizontal',
          items: [{ caption: 'Choice A' }, { caption: 'Choice B' }]
        }
      };
      
      // First dialogue creates panel
      const panel1 = manager.getOrCreatePanel('dialogue-display', dialogue1Config);
      expect(panel1.config.title).to.equal('Speaker 1');
      
      // Second dialogue updates panel (with updateIfExists)
      const panel2 = manager.getOrCreatePanel('dialogue-display', dialogue2Config, true);
      expect(panel2).to.equal(panel1); // Same panel instance
      expect(panel2.config.title).to.equal('Speaker 2'); // Updated title
      expect(panel2.config.buttons.items).to.have.lengthOf(2); // Updated buttons
    });
  });
});




// ================================================================
// DraggablePanelManager.managedExternally.test.js (12 tests)
// ================================================================
/**
 * Unit tests for DraggablePanelManager managedExternally behavior
 * Tests that panels with managedExternally flag are not auto-rendered
 */

describe('DraggablePanelManager - managedExternally Flag', function() {
  let window, document, DraggablePanelManager, DraggablePanel;
  let manager;

  beforeEach(function() {
    // Create fresh DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js functions
    global.push = () => {};
    global.pop = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noStroke = () => {};
    global.rect = () => {};
    global.text = () => {};
    global.textSize = () => {};
    global.textAlign = () => {};

    // Mock RenderManager
    global.RenderManager = {
      addDrawableToLayer: () => {},
      addInteractiveDrawable: () => {},
      layers: {
        UI_GAME: 'ui_game'
      }
    };

    // Load DraggablePanel
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel;

    // Load DraggablePanelManager
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

    manager = new DraggablePanelManager();
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.RenderManager;
    delete global.DraggablePanel;
  });

  describe('Rendering Behavior with managedExternally', function() {
    it('should NOT render panel with managedExternally: true', function() {
      const panel = new DraggablePanel({
        id: 'test-managed',
        title: 'Managed Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      let renderCalled = false;
      const originalRender = panel.render.bind(panel);
      panel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      manager.panels.set('test-managed', panel);
      manager.stateVisibility.PLAYING = ['test-managed'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(renderCalled).to.be.false;
    });

    it('should render panel with managedExternally: false', function() {
      const panel = new DraggablePanel({
        id: 'test-normal',
        title: 'Normal Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: false
        }
      });

      let renderCalled = false;
      const originalRender = panel.render.bind(panel);
      panel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      manager.panels.set('test-normal', panel);
      manager.stateVisibility.PLAYING = ['test-normal'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(renderCalled).to.be.true;
    });

    it('should render panel when managedExternally is undefined', function() {
      const panel = new DraggablePanel({
        id: 'test-default',
        title: 'Default Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
        // No behavior.managedExternally specified
      });

      let renderCalled = false;
      const originalRender = panel.render.bind(panel);
      panel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      manager.panels.set('test-default', panel);
      manager.stateVisibility.PLAYING = ['test-default'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(renderCalled).to.be.true;
    });

    it('should NOT render hidden panel even if not managedExternally', function() {
      const panel = new DraggablePanel({
        id: 'test-hidden',
        title: 'Hidden Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      panel.hide();

      let renderCalled = false;
      const originalRender = panel.render.bind(panel);
      panel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      manager.panels.set('test-hidden', panel);
      manager.stateVisibility.PLAYING = ['test-hidden'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(renderCalled).to.be.false;
    });

    it('should NOT render managedExternally panel even if visible', function() {
      const panel = new DraggablePanel({
        id: 'test-managed-visible',
        title: 'Managed Visible Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      panel.show(); // Explicitly show it

      let renderCalled = false;
      const originalRender = panel.render.bind(panel);
      panel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      manager.panels.set('test-managed-visible', panel);
      manager.stateVisibility.PLAYING = ['test-managed-visible'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(renderCalled).to.be.false;
    });
  });

  describe('Mixed Panel Rendering', function() {
    it('should render only non-managed panels when both types exist', function() {
      const managedPanel = new DraggablePanel({
        id: 'managed',
        title: 'Managed',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: { managedExternally: true }
      });

      const normalPanel = new DraggablePanel({
        id: 'normal',
        title: 'Normal',
        position: { x: 300, y: 100 },
        size: { width: 200, height: 150 }
      });

      let managedRendered = false;
      let normalRendered = false;

      const originalManagedRender = managedPanel.render.bind(managedPanel);
      managedPanel.render = function(...args) {
        managedRendered = true;
        return originalManagedRender(...args);
      };

      const originalNormalRender = normalPanel.render.bind(normalPanel);
      normalPanel.render = function(...args) {
        normalRendered = true;
        return originalNormalRender(...args);
      };

      manager.panels.set('managed', managedPanel);
      manager.panels.set('normal', normalPanel);
      manager.stateVisibility.PLAYING = ['managed', 'normal'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      expect(managedRendered).to.be.false;
      expect(normalRendered).to.be.true;
    });

    it('should render correct count when multiple managed panels exist', function() {
      const panels = [
        { id: 'managed1', managedExternally: true },
        { id: 'normal1', managedExternally: false },
        { id: 'managed2', managedExternally: true },
        { id: 'normal2', managedExternally: false }
      ];

      let renderCount = 0;

      panels.forEach(config => {
        const panel = new DraggablePanel({
          id: config.id,
          title: config.id,
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          behavior: { managedExternally: config.managedExternally }
        });

        const originalRender = panel.render.bind(panel);
        panel.render = function(...args) {
          renderCount++;
          return originalRender(...args);
        };

        manager.panels.set(config.id, panel);
      });

      manager.stateVisibility.PLAYING = ['managed1', 'normal1', 'managed2', 'normal2'];
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      // Only the 2 normal panels should be rendered
      expect(renderCount).to.equal(2);
    });
  });

  describe('State Visibility with managedExternally', function() {
    it('should still update visibility for managedExternally panels', function() {
      const panel = new DraggablePanel({
        id: 'test-visibility',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: { managedExternally: true }
      });

      panel.hide();
      expect(panel.isVisible()).to.be.false;

      manager.panels.set('test-visibility', panel);
      manager.stateVisibility.PLAYING = ['test-visibility'];

      manager.renderPanels('PLAYING');

      // Panel should be shown even though it won't be rendered
      expect(panel.isVisible()).to.be.true;
    });

    it('should hide managedExternally panels not in state visibility', function() {
      const panel = new DraggablePanel({
        id: 'test-hide',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: { managedExternally: true }
      });

      panel.show();
      expect(panel.isVisible()).to.be.true;

      manager.panels.set('test-hide', panel);
      manager.stateVisibility.PLAYING = []; // Not in visibility list

      manager.renderPanels('PLAYING');

      expect(panel.isVisible()).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle null behavior gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-null-behavior',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      // Manually null out behavior to test edge case
      panel.config.behavior = null;

      manager.panels.set('test-null-behavior', panel);
      manager.stateVisibility.PLAYING = ['test-null-behavior'];

      // Should not crash
      expect(() => manager.renderPanels('PLAYING')).to.not.throw();
    });

    it('should handle undefined config gracefully', function() {
      const panel = new DraggablePanel({
        id: 'test-undefined',
        title: 'Test',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      // Manually delete config to test edge case
      delete panel.config.behavior;

      manager.panels.set('test-undefined', panel);
      manager.stateVisibility.PLAYING = ['test-undefined'];

      // Should not crash
      expect(() => manager.renderPanels('PLAYING')).to.not.throw();
    });
  });

  describe('Performance Implications', function() {
    it('should skip render loop for all managedExternally panels', function() {
      const managedPanels = [];
      const renderCallCounts = [];

      // Create 10 managed panels
      for (let i = 0; i < 10; i++) {
        const panel = new DraggablePanel({
          id: `managed-${i}`,
          title: `Managed ${i}`,
          position: { x: 100, y: 100 },
          size: { width: 200, height: 150 },
          behavior: { managedExternally: true }
        });

        let callCount = 0;
        const originalRender = panel.render.bind(panel);
        panel.render = function(...args) {
          callCount++;
          return originalRender(...args);
        };

        renderCallCounts.push(() => callCount);
        managedPanels.push(panel);
        manager.panels.set(`managed-${i}`, panel);
      }

      manager.stateVisibility.PLAYING = Array.from({ length: 10 }, (_, i) => `managed-${i}`);
      manager.gameState = 'PLAYING';

      manager.renderPanels('PLAYING');

      // None of the panels should have been rendered
      renderCallCounts.forEach(getCount => {
        expect(getCount()).to.equal(0);
      });
    });
  });
});




// ================================================================
// draggablePanelManagerDoubleRender.test.js (7 tests)
// ================================================================
/**
 * Unit Tests: DraggablePanelManager Double Rendering Prevention
 * 
 * Tests to ensure panels with managedExternally=true are never rendered
 * by DraggablePanelManager, preventing the double-rendering bug where
 * backgrounds are drawn over content.
 * 
 * Bug Context: Level Editor panels were rendered twice per frame:
 * 1. LevelEditor.render() with content callback (correct)
 * 2. DraggablePanelManager.render() without callback (bug - drew background over content)
 * 
 * Fix: Changed interactive adapter to call renderPanels() instead of render()
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('DraggablePanelManager - Double Rendering Prevention', function() {
  let DraggablePanelManager, DraggablePanel;
  let manager;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    
    manager = new DraggablePanelManager();
    manager.isInitialized = true; // Skip full initialization, just mark as initialized
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('renderPanels() method', function() {
    it('should skip panels with managedExternally=true', function() {
      // Create panel with managedExternally flag
      const managedPanel = new DraggablePanel({
        id: 'managed-panel',
        title: 'Managed',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        behavior: {
          managedExternally: true
        }
      });
      
      // Spy on the panel's render method
      const renderSpy = sinon.spy(managedPanel, 'render');
      
      // Add to manager
      manager.panels.set('managed-panel', managedPanel);
      manager.stateVisibility.TEST = ['managed-panel'];
      
      // Make panel visible
      managedPanel.show();
      
      // Call renderPanels
      manager.renderPanels('TEST');
      
      // Panel should NOT have been rendered
      expect(renderSpy.called).to.be.false;
    });
    
    it('should render panels WITHOUT managedExternally flag', function() {
      // Create panel without managedExternally flag
      const normalPanel = new DraggablePanel({
        id: 'normal-panel',
        title: 'Normal',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        behavior: {
          draggable: true
        }
      });
      
      // Spy on the panel's render method
      const renderSpy = sinon.spy(normalPanel, 'render');
      
      // Add to manager
      manager.panels.set('normal-panel', normalPanel);
      manager.stateVisibility.TEST = ['normal-panel'];
      
      // Make panel visible
      normalPanel.show();
      
      // Call renderPanels
      manager.renderPanels('TEST');
      
      // Panel SHOULD have been rendered
      expect(renderSpy.called).to.be.true;
    });
    
    it('should skip invisible panels even without managedExternally flag', function() {
      const invisiblePanel = new DraggablePanel({
        id: 'invisible-panel',
        title: 'Invisible',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 }
      });
      
      const renderSpy = sinon.spy(invisiblePanel, 'render');
      
      manager.panels.set('invisible-panel', invisiblePanel);
      
      // Make panel invisible
      invisiblePanel.hide();
      
      // Call renderPanels
      manager.renderPanels('TEST');
      
      // Panel should NOT have been rendered (invisible)
      expect(renderSpy.called).to.be.false;
    });
  });
  
  describe('render() method', function() {
    it('should call panel.render() for ALL panels regardless of managedExternally flag', function() {
      // This documents the OLD behavior that caused the bug
      // The render() method calls panel.render() for ALL panels,
      // without checking the managedExternally flag.
      // This is why the interactive adapter should NOT use this method.
      
      const managedPanel = new DraggablePanel({
        id: 'managed-panel',
        title: 'Managed',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        behavior: {
          managedExternally: true
        }
      });
      
      // Spy on the panel's render method BEFORE adding to manager
      const panelRenderSpy = sinon.spy(managedPanel, 'render');
      
      manager.panels.set('managed-panel', managedPanel);
      
      // Verify panel was added
      expect(manager.panels.has('managed-panel')).to.be.true;
      expect(manager.panels.size).to.equal(1);
      
      // Call manager.render() method (not renderPanels())
      // Note: render() expects contentRenderers map
      manager.render({});
      
      // Panel's render() method WILL be called because manager.render() doesn't check managedExternally
      // (This is the bug - we don't want this behavior from RenderManager)
      expect(panelRenderSpy.called).to.be.true;
      
      panelRenderSpy.restore();
    });
  });
  
  describe('Interactive adapter render callback', function() {
    it('should use renderPanels() not render() to respect managedExternally', function() {
      // This test verifies the FIX
      // The interactive adapter should call renderPanels(), not render()
      
      // Load DraggablePanel first (needed by createDefaultPanels)
      DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
      if (typeof window !== 'undefined') {
        window.DraggablePanel = DraggablePanel;
      }
      global.DraggablePanel = DraggablePanel;
      
      // Mock RenderManager
      global.RenderManager = {
        layers: { UI_GAME: 'UI_GAME' },
        addDrawableToLayer: sinon.stub(),
        addInteractiveDrawable: sinon.stub()
      };
      
      // Initialize manager (this registers the interactive adapter)
      const freshManager = new DraggablePanelManager();
      freshManager.initialize();
      
      // Get the interactive adapter that was registered
      const addInteractiveCalls = global.RenderManager.addInteractiveDrawable.getCalls();
      expect(addInteractiveCalls.length).to.be.at.least(1);
      
      const interactiveAdapter = addInteractiveCalls[0].args[1];
      expect(interactiveAdapter).to.have.property('render');
      
      // Spy on renderPanels
      const renderPanelsSpy = sinon.spy(freshManager, 'renderPanels');
      const renderSpy = sinon.spy(freshManager, 'render');
      
      // Call the adapter's render method
      interactiveAdapter.render('TEST', {});
      
      // Should have called renderPanels, not render
      expect(renderPanelsSpy.called).to.be.true;
      expect(renderSpy.called).to.be.false;
      
      // Cleanup
      delete global.RenderManager;
      delete global.DraggablePanel;
      if (typeof window !== 'undefined') {
        delete window.DraggablePanel;
      }
    });
  });
  
  describe('Level Editor panels scenario', function() {
    it('should not render Level Editor panels when they have managedExternally=true', function() {
      // Simulate the Level Editor panels setup
      const materialsPanel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        behavior: {
          managedExternally: true
        }
      });
      
      const toolsPanel = new DraggablePanel({
        id: 'level-editor-tools',
        title: 'Tools',
        position: { x: 10, y: 210 },
        size: { width: 70, height: 170 },
        behavior: {
          managedExternally: true
        }
      });
      
      const brushPanel = new DraggablePanel({
        id: 'level-editor-brush',
        title: 'Brush Size',
        position: { x: 10, y: 395 },
        size: { width: 110, height: 60 },
        behavior: {
          managedExternally: true
        }
      });
      
      // Spy on render methods
      const materialsRenderSpy = sinon.spy(materialsPanel, 'render');
      const toolsRenderSpy = sinon.spy(toolsPanel, 'render');
      const brushRenderSpy = sinon.spy(brushPanel, 'render');
      
      // Add to manager
      manager.panels.set('level-editor-materials', materialsPanel);
      manager.panels.set('level-editor-tools', toolsPanel);
      manager.panels.set('level-editor-brush', brushPanel);
      
      // Set up LEVEL_EDITOR state visibility
      manager.stateVisibility.LEVEL_EDITOR = [
        'level-editor-materials',
        'level-editor-tools',
        'level-editor-brush'
      ];
      
      // Show all panels
      materialsPanel.show();
      toolsPanel.show();
      brushPanel.show();
      
      // Call renderPanels (as the interactive adapter should)
      manager.renderPanels('LEVEL_EDITOR');
      
      // NONE of the Level Editor panels should have been rendered
      expect(materialsRenderSpy.called).to.be.false;
      expect(toolsRenderSpy.called).to.be.false;
      expect(brushRenderSpy.called).to.be.false;
    });
  });
  
  describe('Regression test for double rendering bug', function() {
    it('should only render each panel once per frame when using renderPanels()', function() {
      // Setup: Mix of managed and unmanaged panels
      const managedPanel = new DraggablePanel({
        id: 'managed',
        title: 'Managed',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        behavior: { managedExternally: true }
      });
      
      const unmanagedPanel = new DraggablePanel({
        id: 'unmanaged',
        title: 'Unmanaged',
        position: { x: 10, y: 120 },
        size: { width: 100, height: 100 }
      });
      
      const managedRenderSpy = sinon.spy(managedPanel, 'render');
      const unmanagedRenderSpy = sinon.spy(unmanagedPanel, 'render');
      
      manager.panels.set('managed', managedPanel);
      manager.panels.set('unmanaged', unmanagedPanel);
      
      manager.stateVisibility.TEST = ['managed', 'unmanaged'];
      
      managedPanel.show();
      unmanagedPanel.show();
      
      // Simulate a full frame render (what happens in sketch.js)
      // This should only call renderPanels() once
      manager.renderPanels('TEST');
      
      // Managed panel should NOT be rendered
      expect(managedRenderSpy.callCount).to.equal(0);
      
      // Unmanaged panel should be rendered exactly once
      expect(unmanagedRenderSpy.callCount).to.equal(1);
    });
  });
});




// ================================================================
// draggablePanelManagerMouseConsumption.test.js (21 tests)
// ================================================================
/**
 * Unit Tests: DraggablePanelManager Mouse Input Consumption
 * 
 * Tests to verify that DraggablePanelManager correctly aggregates
 * mouse consumption from multiple panels and handles z-order correctly.
 * 
 * Requirements:
 * - Should return true if ANY panel consumes the event
 * - Should check panels in correct z-order (topmost first)
 * - Should stop checking after first consumption
 * - Should handle overlapping panels correctly
 * - Should skip invisible/hidden panels
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('DraggablePanelManager - Mouse Input Consumption', function() {
  let DraggablePanel, DraggablePanelManager;
  let manager, panel1, panel2, panel3;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    
    // Create manager
    manager = new DraggablePanelManager();
    manager.isInitialized = true;
    
    // Create test panels (non-overlapping by default)
    panel1 = new DraggablePanel({
      id: 'panel-1',
      title: 'Panel 1',
      position: { x: 100, y: 100 },
      size: { width: 150, height: 100 }
    });
    
    panel2 = new DraggablePanel({
      id: 'panel-2',
      title: 'Panel 2',
      position: { x: 300, y: 100 },
      size: { width: 150, height: 100 }
    });
    
    panel3 = new DraggablePanel({
      id: 'panel-3',
      title: 'Panel 3',
      position: { x: 100, y: 250 },
      size: { width: 150, height: 100 }
    });
    
    // Add panels to manager
    manager.panels.set('panel-1', panel1);
    manager.panels.set('panel-2', panel2);
    manager.panels.set('panel-3', panel3);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Basic Consumption Aggregation', function() {
    it('should return true if first panel consumes event', function() {
      // Click on panel1
      const mouseX = 175; // Center of panel1
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return true if second panel consumes event', function() {
      // Click on panel2
      const mouseX = 375; // Center of panel2
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return true if third panel consumes event', function() {
      // Click on panel3
      const mouseX = 175; // Center of panel3
      const mouseY = 300;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return false if no panel consumes event', function() {
      // Click far from all panels
      const mouseX = 500;
      const mouseY = 500;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Z-Order and Overlapping Panels', function() {
    it('should check panels in reverse order (topmost first)', function() {
      // Spy on panel update methods
      const spy1 = sinon.spy(panel1, 'update');
      const spy2 = sinon.spy(panel2, 'update');
      const spy3 = sinon.spy(panel3, 'update');
      
      // Click on panel1
      manager.handleMouseEvents(175, 150, true);
      
      // All panels should be checked because panel1 is not topmost
      // (Map iteration order determines z-order, but panels are checked in reverse)
      expect(spy1.called || spy2.called || spy3.called).to.be.true;
      
      spy1.restore();
      spy2.restore();
      spy3.restore();
    });
    
    it('should stop checking after first consumption', function() {
      // Make panels overlap - panel2 on top of panel1
      panel2.state.position.x = 100;
      panel2.state.position.y = 100;
      
      // Spy on updates
      const spy1 = sinon.spy(panel1, 'update');
      const spy2 = sinon.spy(panel2, 'update');
      
      // Click on overlapping area
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should consume (one of the panels handled it)
      expect(consumed).to.be.true;
      
      // At least one panel should have been checked
      expect(spy1.called || spy2.called).to.be.true;
      
      spy1.restore();
      spy2.restore();
    });
    
    it('should prioritize topmost panel when overlapping', function() {
      // Create overlapping panels
      panel1.state.position = { x: 100, y: 100 };
      panel2.state.position = { x: 120, y: 120 }; // Overlaps panel1
      
      // Track which panel consumed
      let panel1Consumed = false;
      let panel2Consumed = false;
      
      const originalUpdate1 = panel1.update.bind(panel1);
      const originalUpdate2 = panel2.update.bind(panel2);
      
      panel1.update = function(...args) {
        const result = originalUpdate1(...args);
        if (result) panel1Consumed = true;
        return result;
      };
      
      panel2.update = function(...args) {
        const result = originalUpdate2(...args);
        if (result) panel2Consumed = true;
        return result;
      };
      
      // Click on overlapping area
      const mouseX = 140; // Inside both panels
      const mouseY = 140;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
      // One of them should have consumed (topmost in z-order)
      expect(panel1Consumed || panel2Consumed).to.be.true;
      
      // Restore
      panel1.update = originalUpdate1;
      panel2.update = originalUpdate2;
    });
  });
  
  describe('Invisible/Hidden Panel Handling', function() {
    it('should skip hidden panels', function() {
      panel1.hide();
      
      // Click where panel1 would be if visible
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should NOT consume (panel1 is hidden)
      expect(consumed).to.be.false;
    });
    
    it('should check visible panels even if others are hidden', function() {
      panel1.hide();
      
      // Click on visible panel2
      const mouseX = 375;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should consume (panel2 is visible)
      expect(consumed).to.be.true;
    });
    
    it('should return false if all panels are hidden', function() {
      panel1.hide();
      panel2.hide();
      panel3.hide();
      
      // Click anywhere
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Update vs HandleMouseEvents', function() {
    it('should call panel.update() for each panel via handleMouseEvents', function() {
      const spy1 = sinon.spy(panel1, 'update');
      
      manager.handleMouseEvents(175, 150, true);
      
      expect(spy1.called).to.be.true;
      
      spy1.restore();
    });
    
    it('should pass correct parameters to panel.update()', function() {
      const spy1 = sinon.spy(panel1, 'update');
      
      const mouseX = 175;
      const mouseY = 150;
      const mousePressed = true;
      
      manager.handleMouseEvents(mouseX, mouseY, mousePressed);
      
      expect(spy1.calledWith(mouseX, mouseY, mousePressed)).to.be.true;
      
      spy1.restore();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty panel manager', function() {
      // Create empty manager
      const emptyManager = new DraggablePanelManager();
      emptyManager.isInitialized = true;
      
      const consumed = emptyManager.handleMouseEvents(100, 100, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should handle single panel', function() {
      const singleManager = new DraggablePanelManager();
      singleManager.isInitialized = true;
      singleManager.panels.set('only-panel', panel1);
      
      // Click on panel
      const consumed = singleManager.handleMouseEvents(175, 150, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should handle uninitialized manager', function() {
      const uninitManager = new DraggablePanelManager();
      // Don't set isInitialized
      
      const consumed = uninitManager.handleMouseEvents(175, 150, true);
      
      // Should return false (manager not initialized)
      expect(consumed).to.be.false;
    });
    
    it('should handle rapid successive calls', function() {
      // Rapid clicks
      const consumed1 = manager.handleMouseEvents(175, 150, true);
      const consumed2 = manager.handleMouseEvents(175, 150, false);
      const consumed3 = manager.handleMouseEvents(375, 150, true);
      const consumed4 = manager.handleMouseEvents(500, 500, true);
      
      expect(consumed1).to.be.true; // panel1
      expect(consumed2).to.be.true; // panel1 (mouse still over)
      expect(consumed3).to.be.true; // panel2
      expect(consumed4).to.be.false; // no panel
    });
  });
  
  describe('Regression Tests', function() {
    it('should prevent tile placement when clicking on ANY panel', function() {
      // Test all three panels
      const consumed1 = manager.handleMouseEvents(175, 150, true); // panel1
      const consumed2 = manager.handleMouseEvents(375, 150, true); // panel2
      const consumed3 = manager.handleMouseEvents(175, 300, true); // panel3
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true;
      expect(consumed3).to.be.true;
    });
    
    it('should allow tile placement when clicking outside all panels', function() {
      const consumed = manager.handleMouseEvents(500, 500, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should handle mixed visible/hidden panels correctly', function() {
      panel1.hide(); // Hidden
      // panel2 visible
      panel3.hide(); // Hidden
      
      // Click on panel2 (only visible one)
      const consumed = manager.handleMouseEvents(375, 150, true);
      expect(consumed).to.be.true;
      
      // Click where hidden panel1 would be
      const consumed2 = manager.handleMouseEvents(175, 150, true);
      expect(consumed2).to.be.false;
    });
  });
  
  describe('Integration with Panel Dragging', function() {
    it('should consume events during panel drag', function() {
      // Start drag on panel1 title bar
      const titleY = 110;
      manager.handleMouseEvents(175, titleY, true);
      
      // Continue drag
      const consumed = manager.handleMouseEvents(200, 135, true);
      
      expect(consumed).to.be.true;
      expect(panel1.isDragging).to.be.true;
    });
    
    it('should not consume after drag ends outside panel', function() {
      // Start drag
      manager.handleMouseEvents(175, 110, true);
      
      // Move and release outside
      manager.handleMouseEvents(500, 500, true);
      manager.handleMouseEvents(500, 500, false);
      
      // Click outside
      const consumed = manager.handleMouseEvents(600, 600, true);
      
      expect(consumed).to.be.false;
    });
  });
});




// ================================================================
// draggablePanelMouseConsumption.test.js (25 tests)
// ================================================================
/**
 * Unit Tests: DraggablePanel Mouse Input Consumption
 * 
 * Tests to verify that panels correctly consume mouse input events,
 * preventing tile placement or other actions beneath panels when user
 * clicks on panel UI elements.
 * 
 * Requirements:
 * - Clicking on ANY part of a visible panel should consume the mouse event
 * - Clicking outside panels should NOT consume the event
 * - Invisible/hidden panels should NOT consume events
 * - Topmost panel should consume event when panels overlap
 * - Dragging panels should consume events
 * - Panel buttons should consume events
 * 
 * Bug Prevention:
 * - Prevents tile placement beneath panels (Level Editor)
 * - Prevents entity selection beneath panels
 * - Prevents unintended game actions when interacting with UI
 */

// DUPLICATE REQUIRE REMOVED: let { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('DraggablePanel - Mouse Input Consumption', function() {
  let DraggablePanel, panel;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    
    // Create a test panel (visible by default)
    panel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      behavior: {
        draggable: true,
        persistent: false
      }
    });
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Basic Mouse Consumption', function() {
    it('should consume click on panel body (center of panel)', function() {
      // Click in the center of the panel
      const mouseX = 200; // panel.x (100) + width/2 (100)
      const mouseY = 175; // panel.y (100) + height/2 (75)
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on panel title bar', function() {
      // Click on title bar (top of panel)
      const mouseX = 200; // center X
      const mouseY = 110; // Just below top edge
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on panel edge (near border)', function() {
      // Click near the right edge
      const mouseX = 295; // Near right edge (300 - 5)
      const mouseY = 175; // Center Y
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should NOT consume click outside panel bounds', function() {
      // Click far outside panel
      const mouseX = 500;
      const mouseY = 500;
      
      const consumed = panel.update(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
    
    it('should NOT consume click just outside panel edge', function() {
      // Click 1 pixel outside right edge
      const mouseX = 301; // panel.x (100) + width (200) + 1
      const mouseY = 175; // Center Y
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Visibility-Based Consumption', function() {
    it('should NOT consume click on hidden panel', function() {
      panel.hide();
      
      const mouseX = 200; // Center of panel
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should consume click on visible panel after showing', function() {
      panel.hide();
      panel.show();
      
      const mouseX = 200;
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on minimized panel title bar', function() {
      panel.toggleMinimized(); // Minimize the panel
      
      // Click on title bar of minimized panel
      const mouseX = 200;
      const mouseY = 110;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Should consume because title bar is still visible
      expect(consumed).to.be.true;
    });
  });
  
  describe('Dragging Consumption', function() {
    it('should consume events when starting drag from title bar', function() {
      const titleBarY = 110; // Within title bar
      
      // First update - start drag
      const consumed1 = panel.update(200, titleBarY, true);
      expect(consumed1).to.be.true;
      expect(panel.isDragging).to.be.true;
    });
    
    it('should consume events while dragging', function() {
      // Start drag
      panel.update(200, 110, true);
      expect(panel.isDragging).to.be.true;
      
      // Continue dragging (mouse moved)
      const consumed = panel.update(250, 150, true);
      
      expect(consumed).to.be.true;
      expect(panel.isDragging).to.be.true;
    });
    
    it('should stop consuming after drag ends', function() {
      // Start drag
      panel.update(200, 110, true);
      
      // Move while dragging
      panel.update(250, 150, true);
      
      // Release mouse
      panel.update(250, 150, false);
      expect(panel.isDragging).to.be.false;
      
      // Next click outside should not be consumed
      const consumed = panel.update(500, 500, true);
      expect(consumed).to.be.false;
    });
    
    it('should NOT start drag from panel body (only title bar)', function() {
      // Click on panel body (below title bar)
      const bodyY = 180;
      
      panel.update(200, bodyY, true);
      
      // Should NOT start dragging from body
      expect(panel.isDragging).to.be.false;
    });
  });
  
  describe('Button Interaction Consumption', function() {
    it('should consume click on panel button', function() {
      // Add a button to the panel
      const buttonClicked = sinon.spy();
      const testButton = new global.Button({
        x: 120,
        y: 140,
        width: 80,
        height: 30,
        label: 'Test',
        onClick: buttonClicked
      });
      
      panel.buttons.push(testButton);
      
      // Click on button
      const mouseX = 160; // Center of button
      const mouseY = 155;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
      expect(buttonClicked.called).to.be.true;
    });
    
    it('should consume minimize button click', function() {
      const initialMinimized = panel.isMinimized();
      
      // Click on minimize button (top-right corner)
      const titleBarHeight = panel.calculateTitleBarHeight();
      const buttonX = panel.state.position.x + panel.config.size.width - 16;
      const buttonY = panel.state.position.y + titleBarHeight / 2;
      
      const consumed = panel.update(buttonX, buttonY, true);
      
      expect(consumed).to.be.true;
      expect(panel.isMinimized()).to.not.equal(initialMinimized);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid clicks correctly', function() {
      // Rapid clicks on panel
      const consumed1 = panel.update(200, 175, true);
      const consumed2 = panel.update(200, 175, false); // Hover - should still consume
      const consumed3 = panel.update(200, 175, true);
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true; // Mouse still over panel (hover)
      expect(consumed3).to.be.true;
    });
    
    it('should handle mouse press without release', function() {
      // Press and hold
      const consumed1 = panel.update(200, 175, true);
      const consumed2 = panel.update(200, 175, true); // Still pressed
      const consumed3 = panel.update(200, 175, true); // Still pressed
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true;
      expect(consumed3).to.be.true;
    });
    
    it('should handle hover without click', function() {
      // Mouse over panel but not pressed
      const consumed = panel.update(200, 175, false);
      
      // Should still consume (hovering over panel prevents terrain interactions)
      expect(consumed).to.be.true;
    });
    
    it('should handle click-hold-drag from panel to outside', function() {
      // Start on panel (not title bar, so no drag)
      panel.update(200, 175, true);
      
      // Move outside while holding
      const consumed = panel.update(500, 500, true);
      
      // Should NOT consume (mouse is outside)
      expect(consumed).to.be.false;
    });
    
    it('should handle panel position changes during interaction', function() {
      // Click on panel
      const consumed1 = panel.update(200, 175, true);
      expect(consumed1).to.be.true;
      
      // Move panel
      panel.state.position.x = 300;
      panel.state.position.y = 300;
      
      // Same mouse position, now outside new panel position
      const consumed2 = panel.update(200, 175, true);
      expect(consumed2).to.be.false;
      
      // Click at new panel position
      const consumed3 = panel.update(400, 375, true);
      expect(consumed3).to.be.true;
    });
  });
  
  describe('Integration with isMouseOver()', function() {
    it('should use isMouseOver() for bounds checking', function() {
      const isMouseOverSpy = sinon.spy(panel, 'isMouseOver');
      
      panel.update(200, 175, true);
      
      expect(isMouseOverSpy.called).to.be.true;
      
      isMouseOverSpy.restore();
    });
    
    it('should NOT consume if isMouseOver returns false', function() {
      // Stub isMouseOver to always return false
      sinon.stub(panel, 'isMouseOver').returns(false);
      
      const consumed = panel.update(200, 175, true);
      
      expect(consumed).to.be.false;
      
      panel.isMouseOver.restore();
    });
    
    it('should consume if isMouseOver returns true', function() {
      // Stub isMouseOver to always return true
      sinon.stub(panel, 'isMouseOver').returns(true);
      
      const consumed = panel.update(500, 500, true);
      
      // Even though coordinates are outside, isMouseOver says it's inside
      expect(consumed).to.be.true;
      
      panel.isMouseOver.restore();
    });
  });
  
  describe('Regression Tests', function() {
    it('should prevent tile placement beneath panel in Level Editor', function() {
      // This is the PRIMARY use case
      // User clicks on panel - should NOT place terrain tile
      
      const mouseX = 200; // Center of panel
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Panel MUST consume to prevent tile placement
      expect(consumed).to.be.true;
    });
    
    it('should allow tile placement when clicking outside panel', function() {
      // User clicks outside panel - SHOULD place terrain tile
      
      const mouseX = 500; // Outside panel
      const mouseY = 500;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Panel MUST NOT consume to allow tile placement
      expect(consumed).to.be.false;
    });
    
    it('should consume clicks in panel padding areas', function() {
      // Click in the padding area (near edge but inside panel)
      const mouseX = 105; // Just inside left edge
      const mouseY = 105; // Just inside top edge
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
  });
});




// ================================================================
// DraggablePanel.columnHeightResize.test.js (34 tests)
// ================================================================
/**
 * Unit Tests for DraggablePanel - Auto-Sizing to Content
 * Tests the new feature where panels auto-resize width and height based on actual button content:
 * - HEIGHT: Calculated from tallest column of buttons + vertical padding
 * - WIDTH: Calculated from widest row of buttons + horizontal padding
 */

describe('DraggablePanel - Auto-Sizing to Content', () => {
  let DraggablePanel;
  let Button;
  let ButtonStyles;
  let panel;
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
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    localStorageGetItemStub = sinon.stub();
    localStorageSetItemStub = sinon.stub();
    global.localStorage = {
      getItem: localStorageGetItemStub,
      setItem: localStorageSetItemStub
    };

    // Mock Button class with height property
    Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style;
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
    ButtonStyles = {
      DEFAULT: {
        backgroundColor: '#cccccc',
        color: '#000000'
      }
    };
    global.ButtonStyles = ButtonStyles;

    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
  });

  beforeEach(() => {
    // Reset stubs
    localStorageGetItemStub.reset();
    localStorageSetItemStub.reset();
    localStorageGetItemStub.returns(null);
  });

  describe('Configuration - autoSizeToContent field', () => {
    it('should accept autoSizeToContent: true in configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 40, width: 80 }
          ]
        }
      });

      expect(panel.config.buttons.autoSizeToContent).to.equal(true);
    });

    it('should default to false when autoSizeToContent is not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        buttons: {
          layout: 'grid',
          columns: 2,
          items: [
            { caption: 'Button 1' },
            { caption: 'Button 2' }
          ]
        }
      });

      expect(panel.config.buttons.autoSizeToContent).to.be.false;
    });

    it('should accept verticalPadding configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 15,
          items: []
        }
      });

      expect(panel.config.buttons.verticalPadding).to.equal(15);
    });

    it('should default verticalPadding to 10 when not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      expect(panel.config.buttons.verticalPadding).to.equal(10);
    });

    it('should accept horizontalPadding configuration', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          horizontalPadding: 20,
          items: []
        }
      });

      expect(panel.config.buttons.horizontalPadding).to.equal(20);
    });

    it('should default horizontalPadding to 10 when not specified', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      expect(panel.config.buttons.horizontalPadding).to.equal(10);
    });
  });

  describe('calculateTallestColumnHeight() method', () => {
    it('should find tallest column in 2-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40 },  // Col 0, Row 0
            { caption: 'Button 2', height: 35 },  // Col 1, Row 0
            { caption: 'Button 3', height: 50 },  // Col 0, Row 1
            { caption: 'Button 4', height: 30 },  // Col 1, Row 1
            { caption: 'Button 5', height: 45 }   // Col 0, Row 2
          ]
        }
      });

      // Column 0: 40 + 5 + 50 + 5 + 45 = 145
      // Column 1: 35 + 5 + 30 = 70
      // Tallest = 145
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(145);
    });

    it('should find tallest column in 4-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 4,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', height: 40 },  // Col 0
            { caption: 'Btn 2', height: 60 },  // Col 1 (tallest column)
            { caption: 'Btn 3', height: 30 },  // Col 2
            { caption: 'Btn 4', height: 25 },  // Col 3
            { caption: 'Btn 5', height: 35 },  // Col 0
            { caption: 'Btn 6', height: 55 },  // Col 1
            { caption: 'Btn 7', height: 38 },  // Col 2
            { caption: 'Btn 8', height: 28 }   // Col 3
          ]
        }
      });

      // Column 0: 40 + 5 + 35 = 80
      // Column 1: 60 + 5 + 55 = 120 ← Tallest
      // Column 2: 30 + 5 + 38 = 73
      // Column 3: 25 + 5 + 28 = 58
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(120);
    });

    it('should handle uneven grid (incomplete last row)', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', height: 40 },  // Col 0
            { caption: 'Btn 2', height: 35 },  // Col 1
            { caption: 'Btn 3', height: 50 },  // Col 2
            { caption: 'Btn 4', height: 45 }   // Col 0 (last row incomplete)
          ]
        }
      });

      // Column 0: 40 + 8 + 45 = 93 ← Tallest
      // Column 1: 35
      // Column 2: 50
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(93);
    });

    it('should calculate correctly for vertical layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'vertical',
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40 },
            { caption: 'Button 2', height: 50 },
            { caption: 'Button 3', height: 30 }
          ]
        }
      });

      // Vertical layout: sum all heights + spacing
      // 40 + 5 + 50 + 5 + 30 = 130
      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(130);
    });

    it('should return 0 when no buttons exist', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(0);
    });

    it('should handle single button', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          items: [{ caption: 'Only Button', height: 50 }]
        }
      });

      const tallestHeight = panel.calculateTallestColumnHeight();
      expect(tallestHeight).to.equal(50);
    });
  });

  describe('calculateWidestRowWidth() method', () => {
    it('should find widest row in 2-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 10,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', width: 80 },  // Row 0
            { caption: 'Btn 2', width: 90 },  // Row 0
            { caption: 'Btn 3', width: 100 }, // Row 1 (widest)
            { caption: 'Btn 4', width: 120 }, // Row 1
            { caption: 'Btn 5', width: 60 }   // Row 2
          ]
        }
      });

      // Row 0: 80 + 10 + 90 = 180
      // Row 1: 100 + 10 + 120 = 230 ← Widest
      // Row 2: 60
      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(230);
    });

    it('should find widest row in 4-column grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 4,
          spacing: 5,
          autoSizeToContent: true,
          items: [
            { caption: 'A', width: 50 },  // Row 0
            { caption: 'B', width: 60 },
            { caption: 'C', width: 55 },
            { caption: 'D', width: 65 },  // Row 0 total: 50+5+60+5+55+5+65 = 245 ← Widest
            { caption: 'E', width: 40 },  // Row 1
            { caption: 'F', width: 45 },
            { caption: 'G', width: 50 },
            { caption: 'H', width: 40 }   // Row 1 total: 40+5+45+5+50+5+40 = 190
          ]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(245);
    });

    it('should handle incomplete last row', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          items: [
            { caption: 'Btn 1', width: 80 },  // Row 0
            { caption: 'Btn 2', width: 90 },
            { caption: 'Btn 3', width: 100 }, // Row 0: 80+8+90+8+100 = 286 ← Widest
            { caption: 'Btn 4', width: 120 }, // Row 1: 120 (incomplete)
          ]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(286);
    });

    it('should calculate correctly for vertical layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'vertical',
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', width: 100 },
            { caption: 'Button 2', width: 120 },
            { caption: 'Button 3', width: 80 }
          ]
        }
      });

      // Vertical layout: return widest button
      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(120);
    });

    it('should return 0 when no buttons exist', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: []
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(0);
    });

    it('should handle single button', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [{ caption: 'Only', width: 85 }]
        }
      });

      const widestWidth = panel.calculateWidestRowWidth();
      expect(widestWidth).to.equal(85);
    });
  });

  describe('autoResizeToFitContent() with autoSizeToContent', () => {
    it('should resize both width and height based on content', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 100, height: 100 }, // Initial size (will be resized)
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 15,
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },  // Row 0
            { caption: 'Btn 2', height: 35, width: 90 },  // Row 0
            { caption: 'Btn 3', height: 50, width: 70 },  // Row 1
            { caption: 'Btn 4', height: 30, width: 85 }   // Row 1
          ]
        }
      });

      // Height calculation:
      // Column 0: 40 + 5 + 50 = 95
      // Column 1: 35 + 5 + 30 = 70
      // Tallest = 95
      // Panel height = titleBar(26.8) + tallest(95) + verticalPadding(20) = 141.8
      
      // Width calculation:
      // Row 0: 80 + 5 + 90 = 175
      // Row 1: 70 + 5 + 85 = 160
      // Widest = 175
      // Panel width = widest(175) + horizontalPadding(30) = 205
      
      expect(panel.config.size.height).to.be.closeTo(141.8, 1);
      expect(panel.config.size.width).to.be.closeTo(205, 1);
    });

    it('should use standard calculation when autoSizeToContent is false', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        size: { width: 200, height: 100 },
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: false, // Explicitly disabled
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 },
            { caption: 'Button 3', height: 50, width: 70 },
            { caption: 'Button 4', height: 30, width: 85 }
          ]
        }
      });

      // Should use standard grid calculation (max height per row)
      const contentHeight = panel.calculateContentHeight();
      expect(contentHeight).to.be.closeTo(115, 1);
      
      // Width should remain at config value
      expect(panel.config.size.width).to.equal(200);
    });

    it('should include padding in both dimensions', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 20,
          horizontalPadding: 25,
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },
            { caption: 'Btn 2', height: 35, width: 90 }
          ]
        }
      });

      // Height: titleBar(26.8) + max(40,35)(40) + verticalPadding(40) = 106.8
      // Width: (80+5+90)(175) + horizontalPadding(50) = 225
      
      expect(panel.config.size.height).to.be.closeTo(106.8, 1);
      expect(panel.config.size.width).to.be.closeTo(225, 1);
    });

    it('should handle panels with uneven grids', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'A', height: 30, width: 50 },  // Row 0
            { caption: 'B', height: 35, width: 60 },
            { caption: 'C', height: 40, width: 55 },  // Complete row
            { caption: 'D', height: 45, width: 70 },  // Row 1 (incomplete)
            { caption: 'E', height: 38, width: 65 }
          ]
        }
      });

      // Tallest column:
      // Col 0: 30 + 5 + 45 = 80
      // Col 1: 35 + 5 + 38 = 78
      // Col 2: 40
      // Height = titleBar(26.8) + tallest(80) + verticalPadding(20) = 126.8

      // Widest row:
      // Row 0: 50 + 5 + 60 + 5 + 55 = 175
      // Row 1: 70 + 5 + 65 = 140
      // Width = 175 + 20 = 195
      
      expect(panel.config.size.height).to.be.closeTo(126.8, 1);
      expect(panel.config.size.width).to.be.closeTo(195, 1);
    });

    it('should not auto-size if layout is not grid', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        size: { width: 200, height: 100 },
        buttons: {
          layout: 'vertical', // Not grid layout
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 50, width: 90 }
          ]
        }
      });

      // Should fall back to standard vertical calculation
      const contentHeight = panel.calculateContentHeight();
      expect(contentHeight).to.be.closeTo(115, 1);
      
      // Width should remain unchanged
      expect(panel.config.size.width).to.equal(200);
    });
  });

  describe('Size stability with autoSizeToContent', () => {
    it('should maintain stable dimensions over multiple update cycles', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 },
            { caption: 'Button 3', height: 50, width: 70 },
            { caption: 'Button 4', height: 30, width: 85 }
          ]
        }
      });

      const initialHeight = panel.config.size.height;
      const initialWidth = panel.config.size.width;

      // Simulate 100 update cycles
      for (let i = 0; i < 100; i++) {
        panel.update();
      }

      expect(panel.config.size.height).to.equal(initialHeight);
      expect(panel.config.size.width).to.equal(initialWidth);
    });

    it('should not trigger saveState during auto-resize', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        },
        behavior: {
          persistent: true
        }
      });

      localStorageSetItemStub.resetHistory();

      // Trigger auto-resize by updating
      panel.update();

      // Should NOT have saved state (auto-resize shouldn't save)
      expect(localStorageSetItemStub.called).to.be.false;
    });

    it('should handle floating-point precision without accumulating error', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 33.333, width: 77.777 },
            { caption: 'Button 2', height: 35.5, width: 88.888 },
            { caption: 'Button 3', height: 50.666, width: 66.123 },
            { caption: 'Button 4', height: 30.25, width: 82.456 }
          ]
        }
      });

      const heights = [];
      const widths = [];
      
      for (let i = 0; i < 50; i++) {
        panel.update();
        heights.push(panel.config.size.height);
        widths.push(panel.config.size.width);
      }

      // All heights should be identical (no accumulation)
      const uniqueHeights = [...new Set(heights)];
      expect(uniqueHeights.length).to.equal(1);
      
      // All widths should be identical (no accumulation)
      const uniqueWidths = [...new Set(widths)];
      expect(uniqueWidths.length).to.equal(1);
    });
  });

  describe('Edge cases with autoSizeToContent', () => {
    it('should handle single button in grid layout', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Only Button', height: 50, width: 85 }
          ]
        }
      });

      // Height: titleBar(26.8) + button(50) + verticalPadding(20) = 96.8
      // Width: button(85) + horizontalPadding(20) = 105
      expect(panel.config.size.height).to.be.closeTo(96.8, 1);
      expect(panel.config.size.width).to.be.closeTo(105, 1);
    });

    it('should handle zero-dimension buttons gracefully', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: [
            { caption: 'Button 1', height: 0, width: 0 },
            { caption: 'Button 2', height: 40, width: 80 }
          ]
        }
      });

      // Should handle without errors
      expect(panel.config.size.height).to.be.a('number');
      expect(panel.config.size.height).to.be.greaterThan(0);
      expect(panel.config.size.width).to.be.a('number');
      expect(panel.config.size.width).to.be.greaterThan(0);
    });

    it('should handle very large grids gracefully', () => {
      const items = [];
      for (let i = 0; i < 20; i++) {
        items.push({ caption: `Button ${i}`, height: 40, width: 70 });
      }

      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 10,
          horizontalPadding: 10,
          items: items
        }
      });

      // 10 rows × 40px + 9 spacings × 5px = 400 + 45 = 445
      // Height = titleBar(26.8) + tallest(445) + verticalPadding(20) = 491.8
      
      // Each row: 70 + 5 + 70 = 145
      // Width = 145 + horizontalPadding(20) = 165
      
      expect(panel.config.size.height).to.be.closeTo(491.8, 1);
      expect(panel.config.size.width).to.be.closeTo(165, 1);
    });

    it('should handle varying button sizes in different columns/rows', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 3,
          spacing: 8,
          autoSizeToContent: true,
          verticalPadding: 12,
          horizontalPadding: 15,
          items: [
            { caption: 'S', height: 20, width: 40 },   // Row 0
            { caption: 'M', height: 35, width: 70 },
            { caption: 'L', height: 50, width: 100 },
            { caption: 'XL', height: 65, width: 130 }, // Row 1
            { caption: 'XXL', height: 80, width: 160 },
            { caption: 'Tiny', height: 15, width: 30 }
          ]
        }
      });

      // Tallest column calculation:
      // Col 0: 20 + 8 + 65 = 93
      // Col 1: 35 + 8 + 80 = 123 ← Tallest
      // Col 2: 50 + 8 + 15 = 73
      // Height = titleBar(26.8) + tallest(123) + verticalPadding(24) = 173.8

      // Widest row calculation:
      // Row 0: 40 + 8 + 70 + 8 + 100 = 226
      // Row 1: 130 + 8 + 160 + 8 + 30 = 336 ← Widest
      // Width = 336 + 30 = 366

      expect(panel.config.size.height).to.be.closeTo(173.8, 1);
      expect(panel.config.size.width).to.be.closeTo(366, 1);
    });
  });

  describe('Integration with existing features', () => {
    it('should work correctly with minimized state', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        minimized: true,
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        }
      });

      expect(panel.state.minimized).to.be.true;
      // Dimensions should still be calculated for when it's expanded
      expect(panel.config.size.height).to.be.greaterThan(0);
      expect(panel.config.size.width).to.be.greaterThan(0);
    });

    it('should work with persistent state enabled', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 },
            { caption: 'Button 2', height: 35, width: 90 }
          ]
        },
        behavior: {
          persistent: true
        }
      });

      expect(panel.config.behavior.persistent).to.be.true;
      expect(panel.config.size.height).to.be.a('number');
      expect(panel.config.size.width).to.be.a('number');
    });

    it('should respect manual dragging and saving state', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          autoSizeToContent: true,
          items: [
            { caption: 'Button 1', height: 40, width: 80 }
          ]
        },
        behavior: {
          persistent: true,
          draggable: true
        }
      });

      localStorageSetItemStub.resetHistory();

      // Simulate manual drag
      panel.isDragging = true;
      panel.handleDragging(150, 200);
      panel.isDragging = false;

      // Manual drag SHOULD save state
      expect(localStorageSetItemStub.called).to.be.true;
    });

    it('should handle different padding values for width vs height', () => {
      panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        buttons: {
          layout: 'grid',
          columns: 2,
          spacing: 5,
          autoSizeToContent: true,
          verticalPadding: 25,     // Different from horizontal
          horizontalPadding: 15,   // Different from vertical
          items: [
            { caption: 'Btn 1', height: 40, width: 80 },
            { caption: 'Btn 2', height: 35, width: 90 }
          ]
        }
      });

      // Height uses verticalPadding: titleBar(26.8) + max(40,35)(40) + vertPad(50) = 116.8
      // Width uses horizontalPadding: (80+5+90)(175) + horizPad(30) = 205
      
      expect(panel.config.size.height).to.be.closeTo(116.8, 1);
      expect(panel.config.size.width).to.be.closeTo(205, 1);
    });
  });
});




// ================================================================
// contentSize.test.js (11 tests)
// ================================================================
let MaterialPalette = require('../../../Classes/ui/MaterialPalette');
let ToolBar = require('../../../Classes/ui/ToolBar');
let BrushSizeControl = require('../../../Classes/ui/BrushSizeControl');

describe('Content Size Calculations', function() {
  
  describe('MaterialPalette.getContentSize()', function() {
    it('should calculate size for 2-column grid with 3 materials', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      const size = palette.getContentSize();
      
      // Width: 2 cols × 40px + 3 × 5px spacing = 80 + 15 = 95px
      expect(size.width).to.equal(95);
      
      // Height: 2 rows × (40px + 5px) + 5px top = 2×45 + 5 = 95px
      expect(size.height).to.equal(95);
    });
    
    it('should calculate size for 4 materials (2 rows)', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass']);
      const size = palette.getContentSize();
      
      // Width: same as above
      expect(size.width).to.equal(95);
      
      // Height: 2 rows × (40px + 5px) + 5px top = 95px
      expect(size.height).to.equal(95);
    });
    
    it('should calculate size for 5 materials (3 rows)', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass', 'water']);
      const size = palette.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(95);
      
      // Height: 3 rows × (40px + 5px) + 5px top = 3×45 + 5 = 140px
      expect(size.height).to.equal(140);
    });
    
    it('should handle single material (1 row)', function() {
      const palette = new MaterialPalette(['moss']);
      const size = palette.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(95);
      
      // Height: 1 row × (40px + 5px) + 5px top = 50px
      expect(size.height).to.equal(50);
    });
    
    it('should handle empty materials array', function() {
      const palette = new MaterialPalette([]);
      const size = palette.getContentSize();
      
      // Width: same structure
      expect(size.width).to.equal(95);
      
      // Height: 0 rows × (40px + 5px) + 5px top = 5px
      expect(size.height).to.equal(5);
    });
  });
  
  describe('ToolBar.getContentSize()', function() {
    it('should calculate size for default 7 tools', function() {
      const toolbar = new ToolBar();
      const size = toolbar.getContentSize();
      
      // Width: 35px + 2 × 5px spacing = 45px
      expect(size.width).to.equal(45);
      
      // Height: 7 tools × (35px + 5px) + 5px top = 7×40 + 5 = 285px
      expect(size.height).to.equal(285);
    });
    
    it('should calculate size for custom 4 tools', function() {
      const toolbar = new ToolBar([
        { name: 'tool1', icon: '🔧', tooltip: 'Tool 1' },
        { name: 'tool2', icon: '🔨', tooltip: 'Tool 2' },
        { name: 'tool3', icon: '✏️', tooltip: 'Tool 3' },
        { name: 'tool4', icon: '🖌️', tooltip: 'Tool 4' }
      ]);
      const size = toolbar.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(45);
      
      // Height: 4 tools × (35px + 5px) + 5px top = 4×40 + 5 = 165px
      expect(size.height).to.equal(165);
    });
    
    it('should calculate size for single tool', function() {
      const toolbar = new ToolBar([
        { name: 'brush', icon: '🖌️', tooltip: 'Brush' }
      ]);
      const size = toolbar.getContentSize();
      
      // Width: same
      expect(size.width).to.equal(45);
      
      // Height: 1 tool × (35px + 5px) + 5px top = 45px
      expect(size.height).to.equal(45);
    });
  });
  
  describe('BrushSizeControl.getContentSize()', function() {
    it('should return fixed dimensions', function() {
      const control = new BrushSizeControl();
      const size = control.getContentSize();
      
      expect(size.width).to.equal(90);
      expect(size.height).to.equal(50);
    });
    
    it('should return same size regardless of brush size', function() {
      const control1 = new BrushSizeControl(1);
      const control2 = new BrushSizeControl(5);
      const control3 = new BrushSizeControl(9);
      
      const size1 = control1.getContentSize();
      const size2 = control2.getContentSize();
      const size3 = control3.getContentSize();
      
      expect(size1.width).to.equal(90);
      expect(size1.height).to.equal(50);
      expect(size2.width).to.equal(90);
      expect(size2.height).to.equal(50);
      expect(size3.width).to.equal(90);
      expect(size3.height).to.equal(50);
    });
    
    it('should return same size regardless of min/max bounds', function() {
      const control = new BrushSizeControl(3, 1, 15);
      const size = control.getContentSize();
      
      expect(size.width).to.equal(90);
      expect(size.height).to.equal(50);
    });
  });
});




// ================================================================
// ScrollableContentArea.test.js (85 tests)
// ================================================================
/**
 * Unit Tests: ScrollableContentArea Component (TDD - Phase 1A)
 * 
 * Tests reusable scrollable content container with viewport culling.
 * High-performance scrollable content rendering with item management.
 * 
 * TDD: Write FIRST before implementation exists!
 */

describe('ScrollableContentArea', function() {
  let contentArea, mockP5, mockScrollIndicator;
  
  beforeEach(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      stroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      LEFT: 'LEFT',
      CENTER: 'CENTER'
    };
    
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.stroke = mockP5.stroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.LEFT = mockP5.LEFT;
    global.CENTER = mockP5.CENTER;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.push = global.push;
      window.pop = global.pop;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
    }
    
    // Mock ScrollIndicator
    mockScrollIndicator = {
      height: 20,
      canScrollUp: sinon.stub(),
      canScrollDown: sinon.stub(),
      renderTop: sinon.stub(),
      renderBottom: sinon.stub(),
      getTotalHeight: sinon.stub()
    };
    
    // Mock ScrollIndicator constructor
    global.ScrollIndicator = sinon.stub().returns(mockScrollIndicator);
    if (typeof window !== 'undefined') {
      window.ScrollIndicator = global.ScrollIndicator;
    }
    
    // ScrollableContentArea doesn't exist yet - tests will fail (EXPECTED)
    const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
    contentArea = new ScrollableContentArea();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default width', function() {
      expect(contentArea.width).to.equal(200);
    });
    
    it('should initialize with default height', function() {
      expect(contentArea.height).to.equal(400);
    });
    
    it('should initialize with default scrollOffset', function() {
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should initialize with default maxScrollOffset', function() {
      expect(contentArea.maxScrollOffset).to.equal(0);
    });
    
    it('should initialize with default scrollSpeed', function() {
      expect(contentArea.scrollSpeed).to.equal(20);
    });
    
    it('should initialize with empty contentItems array', function() {
      expect(contentArea.contentItems).to.be.an('array').with.lengthOf(0);
    });
    
    it('should initialize with default itemPadding', function() {
      expect(contentArea.itemPadding).to.equal(5);
    });
    
    it('should initialize with default backgroundColor', function() {
      expect(contentArea.backgroundColor).to.deep.equal([50, 50, 50]);
    });
    
    it('should initialize with default textColor', function() {
      expect(contentArea.textColor).to.deep.equal([220, 220, 220]);
    });
    
    it('should create ScrollIndicator instance', function() {
      expect(global.ScrollIndicator.calledOnce).to.be.true;
      expect(contentArea.scrollIndicator).to.equal(mockScrollIndicator);
    });
    
    it('should accept custom width option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ width: 300 });
      expect(custom.width).to.equal(300);
    });
    
    it('should accept custom height option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ height: 600 });
      expect(custom.height).to.equal(600);
    });
    
    it('should accept custom scrollSpeed option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ scrollSpeed: 30 });
      expect(custom.scrollSpeed).to.equal(30);
    });
    
    it('should accept custom backgroundColor option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ backgroundColor: [100, 100, 100] });
      expect(custom.backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should accept onItemClick callback', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const callback = sinon.stub();
      const custom = new ScrollableContentArea({ onItemClick: callback });
      expect(custom.onItemClick).to.equal(callback);
    });
    
    it('should accept onScroll callback', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const callback = sinon.stub();
      const custom = new ScrollableContentArea({ onScroll: callback });
      expect(custom.onScroll).to.equal(callback);
    });
  });
  
  describe('addText()', function() {
    it('should add text item to contentItems', function() {
      contentArea.addText('text1', 'Hello World');
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('text1');
      expect(contentArea.contentItems[0].type).to.equal('text');
      expect(contentArea.contentItems[0].text).to.equal('Hello World');
    });
    
    it('should use default height for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].height).to.equal(25);
    });
    
    it('should use custom height if provided', function() {
      contentArea.addText('text1', 'Hello', { height: 40 });
      
      expect(contentArea.contentItems[0].height).to.equal(40);
    });
    
    it('should use default fontSize for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].fontSize).to.equal(12);
    });
    
    it('should use custom fontSize if provided', function() {
      contentArea.addText('text1', 'Hello', { fontSize: 16 });
      
      expect(contentArea.contentItems[0].fontSize).to.equal(16);
    });
    
    it('should use default color for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].color).to.deep.equal([220, 220, 220]);
    });
    
    it('should use custom color if provided', function() {
      contentArea.addText('text1', 'Hello', { color: [255, 0, 0] });
      
      expect(contentArea.contentItems[0].color).to.deep.equal([255, 0, 0]);
    });
    
    it('should create render function for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].render).to.be.a('function');
    });
    
    it('should return the created item', function() {
      const item = contentArea.addText('text1', 'Hello');
      
      expect(item.id).to.equal('text1');
      expect(item.type).to.equal('text');
    });
  });
  
  describe('addButton()', function() {
    it('should add button item to contentItems', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('btn1');
      expect(contentArea.contentItems[0].type).to.equal('button');
      expect(contentArea.contentItems[0].label).to.equal('Click Me');
    });
    
    it('should use default height for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].height).to.equal(30);
    });
    
    it('should use custom height if provided', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub(), { height: 40 });
      
      expect(contentArea.contentItems[0].height).to.equal(40);
    });
    
    it('should store click callback', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click', callback);
      
      expect(contentArea.contentItems[0].clickCallback).to.equal(callback);
    });
    
    it('should use default backgroundColor', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].backgroundColor).to.deep.equal([70, 130, 180]);
    });
    
    it('should use custom backgroundColor if provided', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub(), { backgroundColor: [100, 100, 100] });
      
      expect(contentArea.contentItems[0].backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should initialize isHovered to false', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].isHovered).to.be.false;
    });
    
    it('should create render function for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].render).to.be.a('function');
    });
    
    it('should create containsPoint function for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].containsPoint).to.be.a('function');
    });
    
    it('should return the created item', function() {
      const item = contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(item.id).to.equal('btn1');
      expect(item.type).to.equal('button');
    });
  });
  
  describe('addCustom()', function() {
    it('should add custom item to contentItems', function() {
      const renderFn = sinon.stub();
      contentArea.addCustom('custom1', renderFn, null, 50);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('custom1');
      expect(contentArea.contentItems[0].type).to.equal('custom');
    });
    
    it('should use provided height', function() {
      contentArea.addCustom('custom1', sinon.stub(), null, 75);
      
      expect(contentArea.contentItems[0].height).to.equal(75);
    });
    
    it('should use default height if not provided', function() {
      contentArea.addCustom('custom1', sinon.stub(), null);
      
      expect(contentArea.contentItems[0].height).to.equal(30);
    });
    
    it('should store render function', function() {
      const renderFn = sinon.stub();
      contentArea.addCustom('custom1', renderFn, null, 50);
      
      expect(contentArea.contentItems[0].render).to.equal(renderFn);
    });
    
    it('should store click callback if provided', function() {
      const clickFn = sinon.stub();
      contentArea.addCustom('custom1', sinon.stub(), clickFn, 50);
      
      expect(contentArea.contentItems[0].clickCallback).to.equal(clickFn);
    });
    
    it('should create containsPoint function if clickFn provided', function() {
      contentArea.addCustom('custom1', sinon.stub(), sinon.stub(), 50);
      
      expect(contentArea.contentItems[0].containsPoint).to.be.a('function');
    });
    
    it('should not create containsPoint if clickFn is null', function() {
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(contentArea.contentItems[0].containsPoint).to.be.null;
    });
    
    it('should return the created item', function() {
      const item = contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(item.id).to.equal('custom1');
      expect(item.type).to.equal('custom');
    });
  });
  
  describe('removeItem()', function() {
    it('should remove item by id', function() {
      contentArea.addText('text1', 'Hello');
      contentArea.addText('text2', 'World');
      
      const result = contentArea.removeItem('text1');
      
      expect(result).to.be.true;
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('text2');
    });
    
    it('should return false if item not found', function() {
      contentArea.addText('text1', 'Hello');
      
      const result = contentArea.removeItem('nonexistent');
      
      expect(result).to.be.false;
      expect(contentArea.contentItems).to.have.lengthOf(1);
    });
    
    it('should update scroll bounds after removal', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      contentArea.addText('text1', 'Hello');
      
      spy.resetHistory();
      contentArea.removeItem('text1');
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('clearAll()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should remove all items', function() {
      contentArea.addText('text1', 'Hello');
      contentArea.addButton('btn1', 'Click', sinon.stub());
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      contentArea.clearAll();
      
      expect(contentArea.contentItems).to.have.lengthOf(0);
    });
    
    it('should reset scrollOffset to 0', function() {
      contentArea.scrollOffset = 100;
      
      contentArea.clearAll();
      
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should update scroll bounds', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      
      contentArea.clearAll();
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('calculateTotalHeight()', function() {
    it('should return 0 for empty content', function() {
      expect(contentArea.calculateTotalHeight()).to.equal(0);
    });
    
    it('should sum heights of all items', function() {
      contentArea.addText('text1', 'Hello', { height: 25 });
      contentArea.addButton('btn1', 'Click', sinon.stub(), { height: 30 });
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(contentArea.calculateTotalHeight()).to.equal(105); // 25 + 30 + 50
    });
  });
  
  describe('getVisibleHeight()', function() {
    it('should subtract indicator height from total height', function() {
      mockScrollIndicator.getTotalHeight.returns(40); // Both indicators
      
      const visibleHeight = contentArea.getVisibleHeight();
      
      expect(visibleHeight).to.equal(360); // 400 - 40
    });
    
    it('should return full height when no indicators', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      
      const visibleHeight = contentArea.getVisibleHeight();
      
      expect(visibleHeight).to.equal(400);
    });
  });
  
  describe('calculateMaxScrollOffset()', function() {
    it('should return 0 when content fits in viewport', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.addText('text1', 'Hello', { height: 25 });
      
      expect(contentArea.calculateMaxScrollOffset()).to.equal(0);
    });
    
    it('should calculate correct max offset when content overflows', function() {
      mockScrollIndicator.getTotalHeight.returns(40);
      contentArea.addText('text1', 'Item 1', { height: 100 });
      contentArea.addText('text2', 'Item 2', { height: 100 });
      contentArea.addText('text3', 'Item 3', { height: 100 });
      contentArea.addText('text4', 'Item 4', { height: 100 });
      
      // Total: 400px, Visible: 360px (400 - 40)
      // Max scroll: 400 - 360 = 40
      expect(contentArea.calculateMaxScrollOffset()).to.equal(40);
    });
  });
  
  describe('updateScrollBounds()', function() {
    it('should recalculate maxScrollOffset', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      
      contentArea.updateScrollBounds();
      
      expect(contentArea.maxScrollOffset).to.equal(0);
    });
    
    it('should clamp scrollOffset if needed', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.scrollOffset = 100;
      contentArea.addText('text1', 'Hello', { height: 25 });
      
      contentArea.updateScrollBounds();
      
      expect(contentArea.scrollOffset).to.equal(0); // Clamped
    });
  });
  
  describe('clampScrollOffset()', function() {
    it('should clamp to 0 if negative', function() {
      contentArea.scrollOffset = -50;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should clamp to maxScrollOffset if too large', function() {
      contentArea.maxScrollOffset = 100;
      contentArea.scrollOffset = 150;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(100);
    });
    
    it('should not change if within valid range', function() {
      contentArea.maxScrollOffset = 100;
      contentArea.scrollOffset = 50;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(50);
    });
  });
  
  describe('getVisibleItems()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should return all items when content fits viewport', function() {
      contentArea.addText('text1', 'Item 1', { height: 50 });
      contentArea.addText('text2', 'Item 2', { height: 50 });
      
      const visible = contentArea.getVisibleItems();
      
      expect(visible).to.have.lengthOf(2);
    });
    
    it('should return only visible items when scrolled', function() {
      // Add items that exceed viewport
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      
      contentArea.scrollOffset = 0;
      const visible = contentArea.getVisibleItems();
      
      // Viewport is 400px, items are 50px each = 8 items visible
      expect(visible.length).to.be.lte(9); // Allow some overlap
    });
    
    it('should calculate correct y positions relative to viewport', function() {
      contentArea.addText('text1', 'Item 1', { height: 50 });
      contentArea.addText('text2', 'Item 2', { height: 50 });
      contentArea.scrollOffset = 25;
      
      const visible = contentArea.getVisibleItems();
      
      expect(visible[0].y).to.equal(-25); // First item partially scrolled
      expect(visible[1].y).to.equal(25); // Second item visible
    });
    
    it('should early exit when past viewport bottom', function() {
      // Add many items
      for (let i = 0; i < 100; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      
      const visible = contentArea.getVisibleItems();
      
      // Should not return all 100 items
      expect(visible.length).to.be.lessThan(20);
    });
  });
  
  describe('handleMouseWheel()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(40);
      // Add content that requires scrolling
      for (let i = 0; i < 10; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 100 });
      }
      contentArea.updateScrollBounds();
      contentArea.scrollOffset = 50; // Start in middle
    });
    
    it('should return false when no scrolling needed', function() {
      contentArea.contentItems = [];
      contentArea.updateScrollBounds();
      
      const result = contentArea.handleMouseWheel(-10);
      
      expect(result).to.be.false;
    });
    
    it('should increase scrollOffset when delta negative (scroll down)', function() {
      const oldOffset = contentArea.scrollOffset;
      
      contentArea.handleMouseWheel(-10);
      
      expect(contentArea.scrollOffset).to.be.greaterThan(oldOffset);
    });
    
    it('should decrease scrollOffset when delta positive (scroll up)', function() {
      const oldOffset = contentArea.scrollOffset;
      
      contentArea.handleMouseWheel(10);
      
      expect(contentArea.scrollOffset).to.be.lessThan(oldOffset);
    });
    
    it('should apply scrollSpeed multiplier', function() {
      contentArea.scrollOffset = 50;
      contentArea.scrollSpeed = 20;
      
      contentArea.handleMouseWheel(-1);
      
      // -1 * (20/10) = -2, with subtraction: 50 - (-2) = 52
      expect(contentArea.scrollOffset).to.equal(52);
    });
    
    it('should clamp to valid range', function() {
      contentArea.scrollOffset = contentArea.maxScrollOffset - 1;
      
      contentArea.handleMouseWheel(-100); // Try to scroll way down
      
      expect(contentArea.scrollOffset).to.equal(contentArea.maxScrollOffset);
    });
    
    it('should trigger onScroll callback when scrolled', function() {
      const callback = sinon.stub();
      contentArea.onScroll = callback;
      
      contentArea.handleMouseWheel(-10);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.calledWith(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.true;
    });
    
    it('should not trigger onScroll if scroll did not change', function() {
      const callback = sinon.stub();
      contentArea.onScroll = callback;
      contentArea.scrollOffset = 0;
      
      contentArea.handleMouseWheel(10); // Try to scroll up when at top
      
      expect(callback.called).to.be.false;
    });
    
    it('should return true if scrolled', function() {
      const result = contentArea.handleMouseWheel(-10);
      
      expect(result).to.be.true;
    });
  });
  
  describe('handleClick()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should return null when no items clicked', function() {
      contentArea.addText('text1', 'Hello', { height: 50 });
      
      const clicked = contentArea.handleClick(10, 500, 0, 0); // Click outside
      
      expect(clicked).to.be.null;
    });
    
    it('should detect click on button', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback, { height: 50 });
      
      const clicked = contentArea.handleClick(100, 25, 0, 0); // Click in middle
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn1');
    });
    
    it('should trigger item clickCallback', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback, { height: 50 });
      
      contentArea.handleClick(100, 25, 0, 0);
      
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should trigger global onItemClick callback', function() {
      const globalCallback = sinon.stub();
      contentArea.onItemClick = globalCallback;
      const itemCallback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', itemCallback, { height: 50 });
      
      contentArea.handleClick(100, 25, 0, 0);
      
      expect(globalCallback.calledOnce).to.be.true;
    });
    
    it('should account for scroll offset in click detection', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Item 1', sinon.stub(), { height: 50 });
      contentArea.addButton('btn2', 'Item 2', callback, { height: 50 });
      contentArea.scrollOffset = 25; // Scroll down
      
      // Click at y=40 (viewport space) should hit second item
      // btn1: content y=0-50, viewport y=-25 to 25
      // btn2: content y=50-100, viewport y=25 to 75
      // Click at y=40 is clearly in btn2
      const clicked = contentArea.handleClick(100, 40, 0, 0);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn2');
    });
    
    it('should not click items not visible in viewport', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.addButton('btn1', 'Item 1', sinon.stub(), { height: 50 });
      contentArea.scrollOffset = 100; // Scroll past first item
      
      const clicked = contentArea.handleClick(100, 25, 0, 0);
      
      expect(clicked).to.be.null; // First item not in viewport
    });
  });
  
  describe('updateHover()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should set isHovered true when mouse over button', function() {
      contentArea.addButton('btn1', 'Click Me', sinon.stub(), { height: 50 });
      
      contentArea.updateHover(100, 25, 0, 0);
      
      expect(contentArea.contentItems[0].isHovered).to.be.true;
    });
    
    it('should set isHovered false when mouse not over button', function() {
      contentArea.addButton('btn1', 'Click Me', sinon.stub(), { height: 50 });
      contentArea.contentItems[0].isHovered = true;
      
      contentArea.updateHover(10, 500, 0, 0); // Far away
      
      expect(contentArea.contentItems[0].isHovered).to.be.false;
    });
    
    it('should not affect text items (no isHovered property)', function() {
      contentArea.addText('text1', 'Hello', { height: 50 });
      
      // Should not throw error
      expect(() => contentArea.updateHover(100, 25, 0, 0)).to.not.throw();
    });
  });
  
  describe('setDimensions()', function() {
    it('should update width', function() {
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.width).to.equal(300);
    });
    
    it('should update height', function() {
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.height).to.equal(600);
    });
    
    it('should update scroll bounds', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      
      contentArea.setDimensions(300, 600);
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('getTotalHeight()', function() {
    it('should return height property', function() {
      expect(contentArea.getTotalHeight()).to.equal(400);
    });
  });
});




// ================================================================
// ScrollIndicator.test.js (59 tests)
// ================================================================
/**
 * Unit Tests: ScrollIndicator Component (TDD - Phase 1A)
 * 
 * Tests reusable scroll indicator for showing scroll state (top/bottom arrows).
 * Visual feedback for scrollable content overflow.
 * 
 * TDD: Write FIRST before implementation exists!
 */

describe('ScrollIndicator', function() {
  let indicator, mockP5;
  
  beforeEach(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      stroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      CENTER: 'CENTER'
    };
    
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.stroke = mockP5.stroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.CENTER = mockP5.CENTER;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.push = global.push;
      window.pop = global.pop;
      window.CENTER = global.CENTER;
    }
    
    // ScrollIndicator doesn't exist yet - tests will fail (EXPECTED)
    const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    indicator = new ScrollIndicator();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default height', function() {
      expect(indicator.height).to.equal(20);
    });
    
    it('should initialize with default backgroundColor', function() {
      expect(indicator.backgroundColor).to.deep.equal([60, 60, 60]);
    });
    
    it('should initialize with default arrowColor', function() {
      expect(indicator.arrowColor).to.deep.equal([200, 200, 200]);
    });
    
    it('should initialize with default hoverColor', function() {
      expect(indicator.hoverColor).to.deep.equal([255, 255, 255]);
    });
    
    it('should initialize with default fontSize', function() {
      expect(indicator.fontSize).to.equal(14);
    });
    
    it('should initialize with default fadeEnabled', function() {
      expect(indicator.fadeEnabled).to.equal(true);
    });
    
    it('should accept custom height option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      expect(customIndicator.height).to.equal(30);
    });
    
    it('should accept custom backgroundColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ backgroundColor: [100, 100, 100] });
      expect(customIndicator.backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should accept custom arrowColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ arrowColor: [255, 0, 0] });
      expect(customIndicator.arrowColor).to.deep.equal([255, 0, 0]);
    });
    
    it('should accept custom hoverColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ hoverColor: [0, 255, 0] });
      expect(customIndicator.hoverColor).to.deep.equal([0, 255, 0]);
    });
    
    it('should accept custom fontSize option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ fontSize: 18 });
      expect(customIndicator.fontSize).to.equal(18);
    });
    
    it('should accept custom fadeEnabled option (false)', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ fadeEnabled: false });
      expect(customIndicator.fadeEnabled).to.equal(false);
    });
  });
  
  describe('canScrollUp()', function() {
    it('should return false when scrollOffset is 0', function() {
      expect(indicator.canScrollUp(0)).to.be.false;
    });
    
    it('should return true when scrollOffset is greater than 0', function() {
      expect(indicator.canScrollUp(10)).to.be.true;
      expect(indicator.canScrollUp(100)).to.be.true;
      expect(indicator.canScrollUp(1)).to.be.true;
    });
    
    it('should return false when scrollOffset is negative (edge case)', function() {
      expect(indicator.canScrollUp(-5)).to.be.false;
    });
  });
  
  describe('canScrollDown()', function() {
    it('should return false when scrollOffset equals maxScrollOffset', function() {
      expect(indicator.canScrollDown(100, 100)).to.be.false;
    });
    
    it('should return false when maxScrollOffset is 0 (no scrolling)', function() {
      expect(indicator.canScrollDown(0, 0)).to.be.false;
    });
    
    it('should return true when scrollOffset is less than maxScrollOffset', function() {
      expect(indicator.canScrollDown(0, 100)).to.be.true;
      expect(indicator.canScrollDown(50, 100)).to.be.true;
      expect(indicator.canScrollDown(99, 100)).to.be.true;
    });
    
    it('should return false when scrollOffset is greater than maxScrollOffset (edge case)', function() {
      expect(indicator.canScrollDown(150, 100)).to.be.false;
    });
    
    it('should return false when maxScrollOffset is negative (edge case)', function() {
      expect(indicator.canScrollDown(0, -10)).to.be.false;
    });
  });
  
  describe('renderTop()', function() {
    it('should not render when cannot scroll up (scrollOffset = 0)', function() {
      indicator.renderTop(10, 20, 300, 0, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should render background rect when can scroll up', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.rect.calledOnce).to.be.true;
      expect(mockP5.rect.calledWith(10, 20, 300, 20)).to.be.true;
    });
    
    it('should render up arrow when can scroll up', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↑', 160, 30)).to.be.true; // x + width/2, y + height/2
    });
    
    it('should apply backgroundColor for background', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      // Should call fill with backgroundColor before rect
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(1);
      expect(fillCalls[0].calledWith([60, 60, 60])).to.be.true;
    });
    
    it('should apply arrowColor when not hovered', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([200, 200, 200])).to.be.true;
    });
    
    it('should apply hoverColor when hovered', function() {
      indicator.renderTop(10, 20, 300, 50, true);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([255, 255, 255])).to.be.true;
    });
    
    it('should call push and pop for state isolation', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
    });
    
    it('should set textAlign to CENTER', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.textAlign.calledWith('CENTER', 'CENTER')).to.be.true;
    });
    
    it('should set textSize to fontSize', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.textSize.calledWith(14)).to.be.true;
    });
  });
  
  describe('renderBottom()', function() {
    it('should not render when cannot scroll down (scrollOffset = maxScrollOffset)', function() {
      indicator.renderBottom(10, 20, 300, 100, 100, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should render background rect when can scroll down', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.rect.calledOnce).to.be.true;
      expect(mockP5.rect.calledWith(10, 20, 300, 20)).to.be.true;
    });
    
    it('should render down arrow when can scroll down', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↓', 160, 30)).to.be.true; // x + width/2, y + height/2
    });
    
    it('should apply backgroundColor for background', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(1);
      expect(fillCalls[0].calledWith([60, 60, 60])).to.be.true;
    });
    
    it('should apply arrowColor when not hovered', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([200, 200, 200])).to.be.true;
    });
    
    it('should apply hoverColor when hovered', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, true);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([255, 255, 255])).to.be.true;
    });
    
    it('should call push and pop for state isolation', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
    });
    
    it('should set textAlign to CENTER', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.textAlign.calledWith('CENTER', 'CENTER')).to.be.true;
    });
    
    it('should set textSize to fontSize', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.textSize.calledWith(14)).to.be.true;
    });
  });
  
  describe('containsPointTop()', function() {
    it('should return true when point is inside top indicator', function() {
      const result = indicator.containsPointTop(100, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return false when point is to the left of indicator', function() {
      const result = indicator.containsPointTop(40, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is to the right of indicator', function() {
      const result = indicator.containsPointTop(260, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is above indicator', function() {
      const result = indicator.containsPointTop(100, 10, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is below indicator', function() {
      const result = indicator.containsPointTop(100, 50, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return true when point is on left edge (boundary)', function() {
      const result = indicator.containsPointTop(50, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on right edge (boundary)', function() {
      const result = indicator.containsPointTop(250, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on top edge (boundary)', function() {
      const result = indicator.containsPointTop(100, 20, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on bottom edge (boundary)', function() {
      const result = indicator.containsPointTop(100, 40, 50, 20, 200);
      expect(result).to.be.true;
    });
  });
  
  describe('containsPointBottom()', function() {
    it('should return true when point is inside bottom indicator', function() {
      const result = indicator.containsPointBottom(100, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return false when point is to the left of indicator', function() {
      const result = indicator.containsPointBottom(40, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is to the right of indicator', function() {
      const result = indicator.containsPointBottom(260, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is above indicator', function() {
      const result = indicator.containsPointBottom(100, 10, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is below indicator', function() {
      const result = indicator.containsPointBottom(100, 50, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return true when point is on boundaries', function() {
      expect(indicator.containsPointBottom(50, 30, 50, 20, 200)).to.be.true; // left edge
      expect(indicator.containsPointBottom(250, 30, 50, 20, 200)).to.be.true; // right edge
      expect(indicator.containsPointBottom(100, 20, 50, 20, 200)).to.be.true; // top edge
      expect(indicator.containsPointBottom(100, 40, 50, 20, 200)).to.be.true; // bottom edge
    });
  });
  
  describe('getTotalHeight()', function() {
    it('should return 0 when cannot scroll (scrollOffset = 0, maxScrollOffset = 0)', function() {
      const height = indicator.getTotalHeight(0, 0);
      expect(height).to.equal(0);
    });
    
    it('should return height when can only scroll up (at bottom)', function() {
      const height = indicator.getTotalHeight(100, 100);
      expect(height).to.equal(20);
    });
    
    it('should return height when can only scroll down (at top)', function() {
      const height = indicator.getTotalHeight(0, 100);
      expect(height).to.equal(20);
    });
    
    it('should return double height when can scroll both directions', function() {
      const height = indicator.getTotalHeight(50, 100);
      expect(height).to.equal(40);
    });
    
    it('should return 0 when scrollOffset is negative and maxScrollOffset is 0 (edge case)', function() {
      const height = indicator.getTotalHeight(-10, 0);
      expect(height).to.equal(0);
    });
    
    it('should account for custom height setting', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      
      const height = customIndicator.getTotalHeight(50, 100);
      expect(height).to.equal(60); // 30 * 2 (both arrows)
    });
  });
});




// ================================================================
// LevelEditorPanels.test.js (28 tests)
// ================================================================
/**
 * Unit tests for LevelEditorPanels
 * Tests panel configuration, managedExternally flag, and rendering delegation
 */

describe('LevelEditorPanels', function() {
  let window, document, LevelEditorPanels, DraggablePanel;
  let mockLevelEditor;

  beforeEach(function() {
    // Create fresh DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js functions
    global.push = () => {};
    global.pop = () => {};
    global.translate = () => {};
    global.fill = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noStroke = () => {};
    global.rect = () => {};
    global.text = () => {};
    global.line = () => {};

    // Mock localStorage
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Load DraggablePanel
    delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel;

    // Load LevelEditorPanels
    delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
    LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

    // Create mock level editor
    mockLevelEditor = {
      palette: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        getSelectedMaterial: () => 'dirt'
      },
      toolbar: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        setEnabled: () => {}
      },
      brushControl: {
        render: () => {},
        handleClick: () => null,
        containsPoint: () => false,
        getSize: () => 1
      },
      editor: {
        setBrushSize: () => {},
        canUndo: () => false,
        canRedo: () => false
      },
      notifications: {
        show: () => {}
      }
    };

    // Mock draggablePanelManager in both window and global
    global.draggablePanelManager = {
      panels: new Map(),
      stateVisibility: {}
    };
    window.draggablePanelManager = global.draggablePanelManager;
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.DraggablePanel;
    delete global.draggablePanelManager;
    delete global.push;
    delete global.pop;
    delete global.translate;
  });

  describe('Panel Configuration', function() {
    it('should create three panels on initialization', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(editorPanels.panels.materials).to.exist;
      expect(editorPanels.panels.tools).to.exist;
      expect(editorPanels.panels.brush).to.exist;
    });

    it('should set correct sizes for materials panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const materialsPanel = editorPanels.panels.materials;
      expect(materialsPanel.config.size.width).to.equal(120);
      // Height includes title bar height (25px) - test actual value
      expect(materialsPanel.config.size.height).to.equal(140);
    });

    it('should set correct sizes for tools panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const toolsPanel = editorPanels.panels.tools;
      expect(toolsPanel.config.size.width).to.equal(70);
      // Height includes title bar height (25px) - test actual value
      expect(toolsPanel.config.size.height).to.equal(195);
    });

    it('should set correct sizes for brush panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      const brushPanel = editorPanels.panels.brush;
      expect(brushPanel.config.size.width).to.equal(110);
      // Height includes title bar height (25px) - test actual value
      expect(brushPanel.config.size.height).to.equal(85);
    });

    it('should set correct positions for all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(editorPanels.panels.materials.config.position).to.deep.equal({ x: 10, y: 80 });
      expect(editorPanels.panels.tools.config.position).to.deep.equal({ x: 10, y: 210 });
      expect(editorPanels.panels.brush.config.position).to.deep.equal({ x: 10, y: 395 });
    });
  });

  describe('managedExternally Flag', function() {
    it('should set managedExternally to true for materials panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.materials).to.exist;
      expect(editorPanels.panels.materials.config.behavior.managedExternally).to.be.true;
    });

    it('should set managedExternally to true for tools panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.tools).to.exist;
      expect(editorPanels.panels.tools.config.behavior.managedExternally).to.be.true;
    });

    it('should set managedExternally to true for brush panel', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      expect(editorPanels.panels.brush).to.exist;
      expect(editorPanels.panels.brush.config.behavior.managedExternally).to.be.true;
    });

    it('should keep other behavior flags intact', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const initialized = editorPanels.initialize();

      expect(initialized).to.be.true;
      const panel = editorPanels.panels.materials;
      expect(panel).to.exist;
      expect(panel.config.behavior.draggable).to.be.true;
      expect(panel.config.behavior.persistent).to.be.true;
      expect(panel.config.behavior.constrainToScreen).to.be.true;
    });
  });

  describe('Panel Registration', function() {
    it('should add all panels to draggablePanelManager', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(global.draggablePanelManager.panels.has('level-editor-materials')).to.be.true;
      expect(global.draggablePanelManager.panels.has('level-editor-tools')).to.be.true;
      expect(global.draggablePanelManager.panels.has('level-editor-brush')).to.be.true;
    });

    it('should add panel IDs to LEVEL_EDITOR state visibility', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.exist;
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-materials');
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-tools');
      expect(global.draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-brush');
    });

    it('should return false if draggablePanelManager not found', function() {
      delete global.draggablePanelManager;
      global.window.draggablePanelManager = undefined;

      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      const result = editorPanels.initialize();

      expect(result).to.be.false;
    });

    it('should log error if draggablePanelManager not found', function() {
      delete global.draggablePanelManager;
      global.window.draggablePanelManager = undefined;

      let errorLogged = false;
      const originalError = console.error;
      console.error = (msg) => {
        if (msg.includes('DraggablePanelManager not found')) {
          errorLogged = true;
        }
      };

      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      console.error = originalError;
      expect(errorLogged).to.be.true;
    });
  });

  describe('Rendering', function() {
    it('should render materials panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.true;
    });

    it('should render tools panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let toolbarRendered = false;
      mockLevelEditor.toolbar.render = () => { toolbarRendered = true; };

      editorPanels.render();

      expect(toolbarRendered).to.be.true;
    });

    it('should render brush panel with content renderer', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let brushRendered = false;
      mockLevelEditor.brushControl.render = () => { brushRendered = true; };

      editorPanels.render();

      expect(brushRendered).to.be.true;
    });

    it('should skip rendering minimized panels content', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Minimize materials panel
      editorPanels.panels.materials.state.minimized = true;

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.false;
    });

    it('should skip rendering hidden panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Hide materials panel
      editorPanels.panels.materials.state.visible = false;

      let paletteRendered = false;
      mockLevelEditor.palette.render = () => { paletteRendered = true; };

      editorPanels.render();

      expect(paletteRendered).to.be.false;
    });

    it('should translate content to panel content area', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let translateCalled = false;
      let translateX, translateY;

      global.translate = (x, y) => {
        translateCalled = true;
        translateX = x;
        translateY = y;
      };

      editorPanels.render();

      expect(translateCalled).to.be.true;
      expect(translateX).to.be.a('number');
      expect(translateY).to.be.a('number');
    });
  });

  describe('Show/Hide', function() {
    it('should show all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      // Hide panels first
      editorPanels.panels.materials.hide();
      editorPanels.panels.tools.hide();
      editorPanels.panels.brush.hide();

      // Now show all
      editorPanels.show();

      expect(editorPanels.panels.materials.isVisible()).to.be.true;
      expect(editorPanels.panels.tools.isVisible()).to.be.true;
      expect(editorPanels.panels.brush.isVisible()).to.be.true;
    });

    it('should hide all panels', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      editorPanels.hide();

      expect(editorPanels.panels.materials.isVisible()).to.be.false;
      expect(editorPanels.panels.tools.isVisible()).to.be.false;
      expect(editorPanels.panels.brush.isVisible()).to.be.false;
    });
  });

  describe('Click Handling', function() {
    it('should delegate clicks to MaterialPalette', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.palette.containsPoint = () => true;
      mockLevelEditor.palette.handleClick = () => {
        clickHandled = true;
        return 'grass';
      };

      const result = editorPanels.handleClick(50, 100);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should delegate clicks to ToolBar', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.toolbar.containsPoint = () => true;
      mockLevelEditor.toolbar.handleClick = () => {
        clickHandled = true;
        return 'paint';
      };

      const result = editorPanels.handleClick(50, 250);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should delegate clicks to BrushSizeControl', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      let clickHandled = false;
      mockLevelEditor.brushControl.containsPoint = () => true;
      mockLevelEditor.brushControl.handleClick = () => {
        clickHandled = true;
        return 'increase';
      };

      const result = editorPanels.handleClick(50, 420);

      expect(clickHandled).to.be.true;
      expect(result).to.be.true;
    });

    it('should return false if no panel contains click', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      mockLevelEditor.palette.containsPoint = () => false;
      mockLevelEditor.toolbar.containsPoint = () => false;
      mockLevelEditor.brushControl.containsPoint = () => false;

      const result = editorPanels.handleClick(500, 500);

      expect(result).to.be.false;
    });

    it('should skip hidden panels when handling clicks', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      editorPanels.panels.materials.hide();

      let clickHandled = false;
      mockLevelEditor.palette.containsPoint = () => true;
      mockLevelEditor.palette.handleClick = () => {
        clickHandled = true;
        return 'grass';
      };

      const result = editorPanels.handleClick(50, 100);

      expect(clickHandled).to.be.false;
      expect(result).to.be.false;
    });
  });

  describe('Edge Cases', function() {
    it('should handle missing levelEditor properties gracefully', function() {
      const editorPanels = new LevelEditorPanels({});
      editorPanels.initialize();

      expect(() => editorPanels.render()).to.not.throw();
      expect(() => editorPanels.handleClick(50, 50)).to.not.throw();
    });

    it('should handle null panels gracefully', function() {
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      // Don't initialize - panels will be null

      expect(() => editorPanels.render()).to.not.throw();
      expect(() => editorPanels.handleClick(50, 50)).to.not.throw();
      expect(() => editorPanels.show()).to.not.throw();
      expect(() => editorPanels.hide()).to.not.throw();
    });
  });
});




// ================================================================
// levelEditorPanelRendering.test.js (7 tests)
// ================================================================
/**
 * Unit tests for Level Editor Panel Rendering Order
 * 
 * Verifies that panel content (MaterialPalette, ToolBar, BrushSizeControl)
 * is rendered ON TOP of the panel background, not underneath it.
 */

describe('Level Editor Panel Rendering Order', function() {
  let DraggablePanel;
  let renderCallOrder;
  
  beforeEach(function() {
    renderCallOrder = [];
    
    // Mock p5.js rendering functions to track call order
    global.push = sinon.stub().callsFake(() => renderCallOrder.push('push'));
    global.pop = sinon.stub().callsFake(() => renderCallOrder.push('pop'));
    global.fill = sinon.stub().callsFake((...args) => {
      renderCallOrder.push(`fill(${args.join(',')})`);
    });
    global.stroke = sinon.stub().callsFake((...args) => {
      renderCallOrder.push(`stroke(${args.join(',')})`);
    });
    global.strokeWeight = sinon.stub().callsFake((w) => {
      renderCallOrder.push(`strokeWeight(${w})`);
    });
    global.noStroke = sinon.stub();
    global.rect = sinon.stub().callsFake((x, y, w, h) => {
      renderCallOrder.push(`rect(${x},${y},${w},${h})`);
    });
    global.text = sinon.stub().callsFake((txt, x, y) => {
      renderCallOrder.push(`text("${txt}",${x},${y})`);
    });
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.translate = sinon.stub().callsFake((x, y) => {
      renderCallOrder.push(`translate(${x},${y})`);
    });
    global.line = sinon.stub().callsFake((x1, y1, x2, y2) => {
      renderCallOrder.push(`line(${x1},${y1},${x2},${y2})`);
    });
    global.noFill = sinon.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    
    // Mock window and localStorage
    global.window = { innerWidth: 1920, innerHeight: 1080 };
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };
    global.devConsoleEnabled = false;
    
    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Panel Background vs Content Rendering Order', function() {
    it('should render background before content', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentRendered = false;
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_CALLBACK');
        contentRendered = true;
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find indices of background rect and content callback
      const backgroundIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,10'));
      const contentIndex = renderCallOrder.indexOf('CONTENT_CALLBACK');
      
      expect(contentRendered).to.be.true;
      expect(backgroundIndex).to.be.greaterThan(-1, 'Background rect should be drawn');
      expect(contentIndex).to.be.greaterThan(-1, 'Content callback should be called');
      expect(backgroundIndex).to.be.lessThan(contentIndex, 'Background should be drawn BEFORE content');
    });
    
    it('should render title bar before content', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Materials',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentRendered = false;
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_CALLBACK');
        contentRendered = true;
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find indices of title text and content callback
      const titleIndex = renderCallOrder.findIndex(call => call.includes('text("Materials"'));
      const contentIndex = renderCallOrder.indexOf('CONTENT_CALLBACK');
      
      expect(contentRendered).to.be.true;
      expect(titleIndex).to.be.greaterThan(-1, 'Title should be drawn');
      expect(contentIndex).to.be.greaterThan(-1, 'Content callback should be called');
      expect(titleIndex).to.be.lessThan(contentIndex, 'Title should be drawn BEFORE content');
    });
    
    it('should call content renderer with correct content area coordinates', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      let contentArea = null;
      const contentRenderer = (area) => {
        contentArea = area;
      };
      
      panel.render(contentRenderer);
      
      expect(contentArea).to.exist;
      expect(contentArea.x).to.be.greaterThan(10, 'Content X should include left padding');
      expect(contentArea.y).to.be.greaterThan(80, 'Content Y should include title bar and top padding');
    });
    
    it('should use push/pop to isolate content rendering', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      const contentRenderer = () => {
        renderCallOrder.push('CONTENT_START');
        // Simulate content rendering with translate
        if (typeof translate === 'function') {
          translate(5, 5);
        }
        renderCallOrder.push('CONTENT_END');
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      const firstPush = renderCallOrder.indexOf('push');
      const contentStart = renderCallOrder.indexOf('CONTENT_START');
      const contentEnd = renderCallOrder.indexOf('CONTENT_END');
      const lastPop = renderCallOrder.lastIndexOf('pop');
      
      expect(firstPush).to.be.lessThan(contentStart, 'push() before content');
      expect(contentEnd).to.be.lessThan(lastPop, 'pop() after content');
    });
  });
  
  describe('Minimized Panel Rendering', function() {
    it('should NOT call content renderer when panel is minimized', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      panel.state.minimized = true;
      
      let contentRendered = false;
      const contentRenderer = () => {
        contentRendered = true;
      };
      
      panel.render(contentRenderer);
      
      expect(contentRendered).to.be.false;
    });
    
    it('should render background and title even when minimized', function() {
      const panel = new DraggablePanel({
        id: 'test-panel',
        title: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 100, height: 100 },
        buttons: { layout: 'vertical', spacing: 0, items: [] }
      });
      
      panel.state.minimized = true;
      
      renderCallOrder = [];
      panel.render();
      
      const hasBackground = renderCallOrder.some(call => call.startsWith('rect('));
      const hasTitle = renderCallOrder.some(call => call.includes('text('));
      
      expect(hasBackground).to.be.true;
      expect(hasTitle).to.be.true;
    });
  });
  
  describe('Level Editor Panel Specific Tests', function() {
    it('should render MaterialPalette content on top of panel background', function() {
      const panel = new DraggablePanel({
        id: 'level-editor-materials',
        title: 'Materials',
        position: { x: 10, y: 80 },
        size: { width: 120, height: 115 },
        buttons: {
          layout: 'vertical',
          spacing: 0,
          items: [],
          managedExternally: true
        }
      });
      
      const contentRenderer = (contentArea) => {
        renderCallOrder.push('MATERIAL_PALETTE_START');
        // Simulate MaterialPalette rendering
        fill(0, 128, 0); // Green material
        rect(contentArea.x, contentArea.y, 40, 40);
        renderCallOrder.push('MATERIAL_PALETTE_END');
      };
      
      renderCallOrder = [];
      panel.render(contentRenderer);
      
      // Find panel background and material palette
      const panelBgIndex = renderCallOrder.findIndex(call => call.startsWith('rect(10,80'));
      const materialStartIndex = renderCallOrder.indexOf('MATERIAL_PALETTE_START');
      const materialEndIndex = renderCallOrder.indexOf('MATERIAL_PALETTE_END');
      
      expect(panelBgIndex).to.be.greaterThan(-1);
      expect(materialStartIndex).to.be.greaterThan(-1);
      expect(materialEndIndex).to.be.greaterThan(-1);
      expect(panelBgIndex).to.be.lessThan(materialStartIndex, 'Panel background before material palette');
      expect(materialStartIndex).to.be.lessThan(materialEndIndex, 'Material palette rendering sequence');
    });
  });
});




// ================================================================
// propertiesPanel.test.js (17 tests)
// ================================================================
/**
 * Unit Tests - PropertiesPanel
 * 
 * Tests for:
 * 1. Tile count calculation from CustomTerrain
 * 2. Display of actual terrain data
 * 3. Proper integration as content within DraggablePanel
 * 4. Update method to refresh tile counts
 */

describe('PropertiesPanel - Unit Tests', function() {
  let PropertiesPanel;
  let panel;
  let mockTerrain;
  let mockEditor;

  beforeEach(function() {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.line = sinon.stub();
    global.CENTER = 'center';
    global.TOP = 'top';
    global.LEFT = 'left';

    // Sync to window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.line = global.line;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.LEFT = global.LEFT;
    }

    // Mock terrain with CustomTerrain-like interface
    mockTerrain = {
      width: 10,
      height: 10,
      tiles: [],
      getTileCount: sinon.stub().returns(100),
      getStatistics: sinon.stub().returns({
        totalTiles: 100,
        materials: { grass: 60, dirt: 40 },
        diversity: 0.50
      })
    };

    // Create tiles array
    for (let y = 0; y < 10; y++) {
      mockTerrain.tiles[y] = [];
      for (let x = 0; x < 10; x++) {
        mockTerrain.tiles[y][x] = {
          material: x < 5 ? 'grass' : 'dirt',
          weight: 1,
          passable: true
        };
      }
    }

    // Mock editor
    mockEditor = {
      canUndo: sinon.stub().returns(true),
      canRedo: sinon.stub().returns(false),
      undoStack: [1, 2, 3],
      redoStack: []
    };

    // Load PropertiesPanel
    PropertiesPanel = require('../../../Classes/ui/PropertiesPanel');
    panel = new PropertiesPanel();
  });

  afterEach(function() {
    sinon.restore();
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.stroke;
    delete global.strokeWeight;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.line;
    delete global.CENTER;
    delete global.TOP;
    delete global.LEFT;
  });

  describe('Terrain Statistics', function() {
    it('should calculate total tiles from CustomTerrain', function() {
      panel.setTerrain(mockTerrain);
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(100);
    });

    it('should get material diversity from terrain', function() {
      panel.setTerrain(mockTerrain);
      const stats = panel.getStatistics();
      
      expect(stats.diversity).to.equal(0.50);
    });

    it('should return 0 tiles when no terrain set', function() {
      const stats = panel.getStatistics();
      
      expect(stats.totalTiles).to.equal(0);
      expect(stats.diversity).to.equal(0);
    });

    it('should update tile count when terrain changes', function() {
      panel.setTerrain(mockTerrain);
      let stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(100);

      // Change terrain statistics
      mockTerrain.getStatistics.returns({
        totalTiles: 150,
        materials: { grass: 90, dirt: 60 },
        diversity: 0.60
      });

      stats = panel.getStatistics();
      expect(stats.totalTiles).to.equal(150);
      expect(stats.diversity).to.equal(0.60);
    });
  });

  describe('Update Method', function() {
    it('should have update method to refresh data', function() {
      expect(panel.update).to.be.a('function');
    });

    it('should refresh statistics when update is called', function() {
      panel.setTerrain(mockTerrain);
      panel.setEditor(mockEditor);

      // Initial state
      let displayItems = panel.getDisplayItems();
      const initialTileCount = displayItems.find(item => item.label === 'Total Tiles');
      expect(initialTileCount.value).to.equal('100');

      // Change terrain
      mockTerrain.getStatistics.returns({
        totalTiles: 200,
        materials: { grass: 120, dirt: 80 },
        diversity: 0.60
      });

      // Update should refresh
      panel.update();

      displayItems = panel.getDisplayItems();
      const updatedTileCount = displayItems.find(item => item.label === 'Total Tiles');
      expect(updatedTileCount.value).to.equal('200');
    });
  });

  describe('Content Size for DraggablePanel', function() {
    it('should have getContentSize method', function() {
      expect(panel.getContentSize).to.be.a('function');
    });

    it('should return fixed content dimensions', function() {
      const size = panel.getContentSize();
      
      expect(size).to.have.property('width');
      expect(size).to.have.property('height');
      expect(size.width).to.be.a('number');
      expect(size.height).to.be.a('number');
    });

    it('should return consistent size for layout', function() {
      const size1 = panel.getContentSize();
      const size2 = panel.getContentSize();
      
      expect(size1.width).to.equal(size2.width);
      expect(size1.height).to.equal(size2.height);
    });
  });

  describe('Rendering as Panel Content', function() {
    it('should accept absolute coordinates for rendering', function() {
      panel.setTerrain(mockTerrain);
      panel.setEditor(mockEditor);

      const contentX = 100;
      const contentY = 200;

      global.text.resetHistory();

      panel.render(contentX, contentY);

      // Verify text was called with offset coordinates
      expect(global.text.called).to.be.true;
      
      // Get first text call (should be a label or value)
      const firstCall = global.text.getCalls().find(call => call.args.length >= 3);
      if (firstCall) {
        const xCoord = firstCall.args[1];
        const yCoord = firstCall.args[2];
        
        // Coordinates should be offset from content position
        expect(xCoord).to.be.at.least(contentX);
        expect(yCoord).to.be.at.least(contentY);
      }
    });

    it('should not render background when used as panel content', function() {
      panel.setTerrain(mockTerrain);

      global.rect.resetHistory();

      // Render with panel flag
      panel.render(10, 10, { isPanelContent: true });

      // Should not draw panel background
      expect(global.rect.called).to.be.false;
    });

    it('should render background when standalone', function() {
      panel.setTerrain(mockTerrain);

      global.rect.resetHistory();

      // Render without panel flag
      panel.render(10, 10);

      // Should draw panel background
      expect(global.rect.called).to.be.true;
    });
  });

  describe('Display Items', function() {
    it('should include Total Tiles in display', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      const tileItem = items.find(item => item.label === 'Total Tiles');
      expect(tileItem).to.exist;
      expect(tileItem.value).to.equal('100');
    });

    it('should include Diversity in display', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      const diversityItem = items.find(item => item.label === 'Diversity');
      expect(diversityItem).to.exist;
      expect(diversityItem.value).to.equal('0.50');
    });

    it('should include Undo/Redo status', function() {
      panel.setEditor(mockEditor);
      const items = panel.getDisplayItems();

      const undoItem = items.find(item => item.label === 'Undo Available');
      const redoItem = items.find(item => item.label === 'Redo Available');
      
      expect(undoItem).to.exist;
      expect(undoItem.value).to.equal('Yes');
      expect(redoItem).to.exist;
      expect(redoItem.value).to.equal('No');
    });
  });

  describe('Selected Tile Properties', function() {
    it('should display selected tile when set', function() {
      const tile = {
        position: { x: 5, y: 5 },
        material: 'stone',
        weight: 2,
        passable: false
      };

      panel.setSelectedTile(tile);
      const items = panel.getDisplayItems();

      const materialItem = items.find(item => item.label === 'Material');
      expect(materialItem).to.exist;
      expect(materialItem.value).to.equal('stone');
    });

    it('should not display tile properties when no tile selected', function() {
      panel.setTerrain(mockTerrain);
      const items = panel.getDisplayItems();

      // Should have terrain stats but not tile-specific props
      const tileItem = items.find(item => item.label === 'Total Tiles');
      const materialItem = items.find(item => item.label === 'Material');
      
      expect(tileItem).to.exist; // Terrain stat
      expect(materialItem).to.not.exist; // Tile-specific
    });
  });
});




// ================================================================
// UIObject.test.js (53 tests)
// ================================================================
/**
 * Unit Tests: UIObject Base Class
 * 
 * Tests for the UIObject base class with integrated CacheManager support.
 * Following TDD approach - these tests define expected behavior.
 * 
 * Test Coverage:
 * - Constructor & Initialization
 * - Cache Management
 * - Rendering Pattern
 * - Visibility & Common Properties
 * - Cleanup & Destruction
 * - Inheritance & Extensibility
 */

describe('UIObject Base Class - Unit Tests', function() {
  let UIObject;
  let mockCacheManager;
  let mockCache;
  let mockBuffer;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createGraphics = sinon.stub().callsFake((w, h) => {
      return {
        width: w,
        height: h,
        clear: sinon.stub(),
        background: sinon.stub(),
        stroke: sinon.stub(),
        fill: sinon.stub(),
        line: sinon.stub(),
        rect: sinon.stub(),
        remove: sinon.stub(),
        _estimatedMemory: w * h * 4
      };
    });
    
    global.image = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createGraphics = global.createGraphics;
      window.image = global.image;
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
    }
    
    // Create mock cache buffer
    mockBuffer = global.createGraphics(100, 100);
    
    // Create mock cache
    mockCache = {
      name: 'test-cache',
      strategy: 'fullBuffer',
      memoryUsage: 40000,
      valid: false,
      hits: 0,
      lastAccessed: 0,
      _buffer: mockBuffer
    };
    
    // Mock CacheManager
    mockCacheManager = {
      register: sinon.stub(),
      getCache: sinon.stub().returns(mockCache),
      invalidate: sinon.stub(),
      removeCache: sinon.stub(),
      hasCache: sinon.stub().returns(true),
      getInstance: sinon.stub().returnsThis()
    };
    
    global.CacheManager = {
      getInstance: () => mockCacheManager
    };
    
    if (typeof window !== 'undefined') {
      window.CacheManager = global.CacheManager;
    }
    
    // Load UIObject
    UIObject = require('../../../Classes/ui/UIObject');
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.createGraphics;
    delete global.image;
    delete global.push;
    delete global.pop;
    delete global.translate;
    delete global.CacheManager;
    
    if (typeof window !== 'undefined') {
      delete window.createGraphics;
      delete window.image;
      delete window.push;
      delete window.pop;
      delete window.translate;
      delete window.CacheManager;
    }
  });
  
  // ===================================================================
  // Test Suite 1: Constructor & Initialization
  // ===================================================================
  
  describe('Constructor & Initialization', function() {
    it('should initialize with default config (100x100, fullBuffer, visible=true)', function() {
      const obj = new UIObject();
      
      expect(obj.width).to.equal(100);
      expect(obj.height).to.equal(100);
      expect(obj.visible).to.be.true;
      expect(obj._cacheStrategy).to.equal('fullBuffer');
      expect(obj._cacheEnabled).to.be.true;
    });
    
    it('should accept custom width/height', function() {
      const obj = new UIObject({ width: 200, height: 150 });
      
      expect(obj.width).to.equal(200);
      expect(obj.height).to.equal(150);
    });
    
    it('should accept custom position (x, y)', function() {
      const obj = new UIObject({ x: 50, y: 75 });
      
      expect(obj.x).to.equal(50);
      expect(obj.y).to.equal(75);
    });
    
    it('should accept custom cache strategy', function() {
      const strategies = ['fullBuffer', 'dirtyRect', 'throttled', 'tiled', 'none'];
      
      strategies.forEach(strategy => {
        const obj = new UIObject({ cacheStrategy: strategy });
        expect(obj._cacheStrategy).to.equal(strategy);
      });
    });
    
    it('should set visible flag correctly', function() {
      const visibleObj = new UIObject({ visible: true });
      const hiddenObj = new UIObject({ visible: false });
      
      expect(visibleObj.visible).to.be.true;
      expect(hiddenObj.visible).to.be.false;
    });
    
    it('should register cache with CacheManager if strategy not "none"', function() {
      const obj = new UIObject({ width: 100, height: 100, cacheStrategy: 'fullBuffer' });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      
      const registerCall = mockCacheManager.register.firstCall;
      expect(registerCall.args[1]).to.equal('fullBuffer');
      expect(registerCall.args[2].width).to.equal(100);
      expect(registerCall.args[2].height).to.equal(100);
    });
    
    it('should NOT register cache if strategy="none"', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      expect(mockCacheManager.register.called).to.be.false;
      expect(obj._cacheEnabled).to.be.false;
    });
    
    it('should generate unique cache name including class name', function() {
      const obj1 = new UIObject();
      const obj2 = new UIObject();
      
      expect(obj1._cacheName).to.include('UIObject');
      expect(obj2._cacheName).to.include('UIObject');
      expect(obj1._cacheName).to.not.equal(obj2._cacheName);
    });
    
    it('should handle CacheManager unavailable gracefully', function() {
      delete global.CacheManager;
      if (typeof window !== 'undefined') {
        delete window.CacheManager;
      }
      
      const obj = new UIObject();
      
      expect(obj._cacheEnabled).to.be.false;
      expect(obj._cache).to.be.null;
    });
    
    it('should validate width/height are positive numbers', function() {
      const obj = new UIObject({ width: 100, height: 100 });
      
      expect(obj.width).to.be.a('number');
      expect(obj.height).to.be.a('number');
      expect(obj.width).to.be.above(0);
      expect(obj.height).to.be.above(0);
    });
  });
  
  // ===================================================================
  // Test Suite 2: Cache Management
  // ===================================================================
  
  describe('Cache Management', function() {
    it('should set _isDirty flag to true when markDirty() called', function() {
      const obj = new UIObject();
      obj._isDirty = false;
      
      obj.markDirty();
      
      expect(obj._isDirty).to.be.true;
    });
    
    it('should invalidate CacheManager cache when markDirty() called', function() {
      const obj = new UIObject();
      
      obj.markDirty();
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
      expect(mockCacheManager.invalidate.firstCall.args[0]).to.equal(obj._cacheName);
    });
    
    it('should pass region to CacheManager.invalidate() when markDirty(region) called', function() {
      const obj = new UIObject();
      const region = { x: 10, y: 10, width: 50, height: 50 };
      
      obj.markDirty(region);
      
      expect(mockCacheManager.invalidate.calledOnce).to.be.true;
      expect(mockCacheManager.invalidate.firstCall.args[1]).to.deep.equal(region);
    });
    
    it('should return true from isDirty() after markDirty() called', function() {
      const obj = new UIObject();
      
      obj.markDirty();
      
      expect(obj.isDirty()).to.be.true;
    });
    
    it('should return false from isDirty() after render completes', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub(); // Override abstract method
      obj.markDirty();
      
      obj.render();
      
      expect(obj.isDirty()).to.be.false;
    });
    
    it('should return p5.Graphics buffer from getCacheBuffer()', function() {
      const obj = new UIObject();
      
      const buffer = obj.getCacheBuffer();
      
      expect(buffer).to.equal(mockBuffer);
    });
    
    it('should return null from getCacheBuffer() if caching disabled', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      const buffer = obj.getCacheBuffer();
      
      expect(buffer).to.be.null;
    });
    
    it('should automatically create cache on construction with fullBuffer strategy', function() {
      const obj = new UIObject({ cacheStrategy: 'fullBuffer' });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      expect(obj._cache).to.not.be.null;
    });
    
    it('should include class name in cache name for debugging', function() {
      const obj = new UIObject();
      
      expect(obj._cacheName).to.include('UIObject');
    });
    
    it('should create separate caches for multiple UIObject instances', function() {
      const obj1 = new UIObject();
      const obj2 = new UIObject();
      
      expect(obj1._cacheName).to.not.equal(obj2._cacheName);
      expect(mockCacheManager.register.calledTwice).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 3: Rendering Pattern
  // ===================================================================
  
  describe('Rendering Pattern', function() {
    it('should skip rendering if visible=false', function() {
      const obj = new UIObject({ visible: false });
      obj.renderToCache = sinon.stub();
      obj.renderToScreen = sinon.stub();
      
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
      expect(obj.renderToScreen.called).to.be.false;
    });
    
    it('should call renderToCache() if cache dirty', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.render();
      
      expect(obj.renderToCache.calledOnce).to.be.true;
      expect(obj.renderToCache.firstCall.args[0]).to.equal(mockBuffer);
    });
    
    it('should NOT call renderToCache() if cache clean', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj._isDirty = false;
      
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
    });
    
    it('should call renderToScreen() every frame', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.renderToScreen = sinon.stub();
      obj._isDirty = false;
      
      obj.render();
      
      expect(obj.renderToScreen.calledOnce).to.be.true;
    });
    
    it('should throw error when renderToCache() called (abstract method)', function() {
      const obj = new UIObject();
      
      expect(() => obj.renderToCache(mockBuffer)).to.throw(/must implement renderToCache/);
    });
    
    it('should draw cached buffer with image() when cache exists', function() {
      const obj = new UIObject({ x: 10, y: 20 });
      obj._isDirty = false;
      
      obj.renderToScreen();
      
      expect(global.image.calledOnce).to.be.true;
      expect(global.image.firstCall.args[0]).to.equal(mockBuffer);
      expect(global.image.firstCall.args[1]).to.equal(10);
      expect(global.image.firstCall.args[2]).to.equal(20);
    });
    
    it('should call renderDirect() fallback when no cache', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      obj.renderDirect = sinon.stub();
      
      obj.renderToScreen();
      
      expect(global.push.calledOnce).to.be.true;
      expect(global.translate.calledOnce).to.be.true;
      expect(obj.renderDirect.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
    });
    
    it('should do nothing in default renderDirect() implementation', function() {
      const obj = new UIObject();
      
      // Should not throw
      expect(() => obj.renderDirect()).to.not.throw();
    });
    
    it('should clear dirty flag after successful renderToCache()', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.render();
      
      expect(obj._isDirty).to.be.false;
    });
    
    it('should work without cache in fallback mode', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      obj.renderDirect = sinon.stub();
      
      obj.render();
      
      expect(obj.renderDirect.calledOnce).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 4: Visibility & Common Properties
  // ===================================================================
  
  describe('Visibility & Common Properties', function() {
    it('should hide component when setVisible(false) called', function() {
      const obj = new UIObject({ visible: true });
      
      obj.setVisible(false);
      
      expect(obj.visible).to.be.false;
    });
    
    it('should show component when setVisible(true) called', function() {
      const obj = new UIObject({ visible: false });
      
      obj.setVisible(true);
      
      expect(obj.visible).to.be.true;
    });
    
    it('should return current visibility state from isVisible()', function() {
      const obj = new UIObject({ visible: true });
      
      expect(obj.isVisible()).to.be.true;
      
      obj.setVisible(false);
      expect(obj.isVisible()).to.be.false;
    });
    
    it('should skip render when visible=false (no cache update)', function() {
      const obj = new UIObject();
      obj.renderToCache = sinon.stub();
      obj.markDirty();
      
      obj.setVisible(false);
      obj.render();
      
      expect(obj.renderToCache.called).to.be.false;
      expect(obj._isDirty).to.be.true; // Still dirty - not rendered
    });
    
    it('should store position (x, y) correctly', function() {
      const obj = new UIObject({ x: 100, y: 200 });
      
      expect(obj.x).to.equal(100);
      expect(obj.y).to.equal(200);
    });
    
    it('should store size (width, height) correctly', function() {
      const obj = new UIObject({ width: 300, height: 400 });
      
      expect(obj.width).to.equal(300);
      expect(obj.height).to.equal(400);
    });
    
    it('should pass protected flag to CacheManager', function() {
      const obj = new UIObject({ protected: true });
      
      expect(mockCacheManager.register.calledOnce).to.be.true;
      const registerCall = mockCacheManager.register.firstCall;
      expect(registerCall.args[2].protected).to.be.true;
    });
    
    it('should not cause multiple cache invalidations on property updates', function() {
      const obj = new UIObject();
      mockCacheManager.invalidate.resetHistory();
      
      obj.x = 50;
      obj.y = 75;
      obj.width = 200;
      obj.height = 150;
      
      // Properties don't auto-invalidate - must call markDirty() manually
      expect(mockCacheManager.invalidate.called).to.be.false;
    });
  });
  
  // ===================================================================
  // Test Suite 5: Cleanup & Destruction
  // ===================================================================
  
  describe('Cleanup & Destruction', function() {
    it('should remove cache from CacheManager when destroy() called', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
      expect(mockCacheManager.removeCache.firstCall.args[0]).to.equal(obj._cacheName);
    });
    
    it('should nullify cache reference on destroy()', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(obj._cache).to.be.null;
    });
    
    it('should disable caching flag on destroy()', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      expect(obj._cacheEnabled).to.be.false;
    });
    
    it('should allow destroy() to be called multiple times safely', function() {
      const obj = new UIObject();
      
      obj.destroy();
      obj.destroy();
      obj.destroy();
      
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
    });
    
    it('should work even if cache never created', function() {
      const obj = new UIObject({ cacheStrategy: 'none' });
      
      expect(() => obj.destroy()).to.not.throw();
    });
    
    it('should call CacheManager.removeCache() with correct cache name', function() {
      const obj = new UIObject();
      const cacheName = obj._cacheName;
      
      obj.destroy();
      
      expect(mockCacheManager.removeCache.firstCall.args[0]).to.equal(cacheName);
    });
    
    it('should free memory after destruction (cache removed from manager)', function() {
      const obj = new UIObject();
      
      obj.destroy();
      
      // Verify cache removal was called (memory cleanup handled by CacheManager)
      expect(mockCacheManager.removeCache.calledOnce).to.be.true;
    });
  });
  
  // ===================================================================
  // Test Suite 6: Inheritance & Extensibility
  // ===================================================================
  
  describe('Inheritance & Extensibility', function() {
    it('should allow subclass to override renderToCache()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {
          buffer.background(255, 0, 0);
        }
      }
      
      const obj = new TestUIObject();
      obj.markDirty();
      
      obj.render();
      
      expect(mockBuffer.background.calledOnce).to.be.true;
      expect(mockBuffer.background.firstCall.args).to.deep.equal([255, 0, 0]);
    });
    
    it('should allow subclass to override renderToScreen()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
        renderToScreen() {
          this.customRenderCalled = true;
        }
      }
      
      const obj = new TestUIObject();
      obj.render();
      
      expect(obj.customRenderCalled).to.be.true;
    });
    
    it('should allow subclass to override renderDirect()', function() {
      class TestUIObject extends UIObject {
        renderDirect() {
          this.directRenderCalled = true;
        }
      }
      
      const obj = new TestUIObject({ cacheStrategy: 'none' });
      obj.render();
      
      expect(obj.directRenderCalled).to.be.true;
    });
    
    it('should allow subclass to override update()', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
        update() {
          this.updateCalled = true;
        }
      }
      
      const obj = new TestUIObject();
      obj.update();
      
      expect(obj.updateCalled).to.be.true;
    });
    
    it('should allow subclass to add custom properties', function() {
      class TestUIObject extends UIObject {
        constructor(config) {
          super(config);
          this.customProperty = config.customProperty || 'default';
        }
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new TestUIObject({ customProperty: 'custom value' });
      
      expect(obj.customProperty).to.equal('custom value');
    });
    
    it('should include subclass name in cache name (not "UIObject")', function() {
      class CustomUIComponent extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new CustomUIComponent();
      
      expect(obj._cacheName).to.include('CustomUIComponent');
      expect(obj._cacheName).to.not.include('UIObject');
    });
    
    it('should not interfere between multiple subclass instances', function() {
      class ComponentA extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      class ComponentB extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const objA = new ComponentA();
      const objB = new ComponentB();
      
      objA.markDirty();
      
      expect(objA._isDirty).to.be.true;
      expect(objB._isDirty).to.be.true; // Starts dirty
    });
    
    it('should allow subclass to disable caching via constructor', function() {
      class TestUIObject extends UIObject {
        renderToCache(buffer) {} // No-op
      }
      
      const obj = new TestUIObject({ cacheStrategy: 'none' });
      
      expect(obj._cacheEnabled).to.be.false;
      expect(mockCacheManager.register.called).to.be.false;
    });
  });
});

