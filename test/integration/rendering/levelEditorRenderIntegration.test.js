/**
 * Integration tests for Level Editor + RenderLayerManager + Game State
 * Tests the interaction between these three systems
 */

const { expect } = require('chai');
const { JSDOM } = require('jsdom');

describe('Level Editor + RenderLayerManager + Game State Integration', function() {
  let window, document, RenderLayerManager, GameStateManager;
  let renderManager, gameState, levelEditor;

  beforeEach(function() {
    // Create fresh DOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock p5.js globals
    global.mouseX = 0;
    global.mouseY = 0;
    global.mouseIsPressed = false;
    global.width = 800;
    global.height = 600;
    global.frameCount = 0;

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
    global.background = () => {};
    global.translate = () => {};
    global.scale = () => {};
    global.image = () => {};

    // Mock camera manager
    global.cameraManager = {
      getZoom: () => 1.0,
      screenToWorld: (x, y) => ({ worldX: x, worldY: y })
    };

    // Mock active map
    global.g_activeMap = {
      render: () => {},
      renderConversion: {
        convCanvasToPos: (coords) => [coords[0], coords[1]]
      }
    };

    // Mock canvas dimensions
    global.g_canvasX = 800;
    global.g_canvasY = 600;

    // Load GameStateManager class
    delete require.cache[require.resolve('../../../Classes/managers/GameStateManager.js')];
    GameStateManager = require('../../../Classes/managers/GameStateManager.js');

    // Load RenderLayerManager
    delete require.cache[require.resolve('../../../Classes/rendering/RenderLayerManager.js')];
    RenderLayerManager = require('../../../Classes/rendering/RenderLayerManager.js');

    // Create instances
    gameState = new GameStateManager();
    gameState.setState('MENU');
    
    renderManager = new RenderLayerManager();
    renderManager.initialize();
    global.RenderManager = renderManager;
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.RenderManager;
    delete global.mouseX;
    delete global.mouseY;
    delete global.mouseIsPressed;
    delete global.cameraManager;
    delete global.g_activeMap;
  });

  describe('Game State: LEVEL_EDITOR Recognition', function() {
    it('should recognize LEVEL_EDITOR as a valid game state', function() {
      gameState.setState('LEVEL_EDITOR');
      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should return correct layers for LEVEL_EDITOR state', function() {
      const layers = renderManager.getLayersForState('LEVEL_EDITOR');
      
      expect(layers).to.be.an('array');
      expect(layers).to.include(renderManager.layers.UI_GAME);
      expect(layers).to.include(renderManager.layers.UI_DEBUG);
    });

    it('should NOT include terrain layers in LEVEL_EDITOR state', function() {
      const layers = renderManager.getLayersForState('LEVEL_EDITOR');
      
      expect(layers).to.not.include(renderManager.layers.TERRAIN);
      expect(layers).to.not.include(renderManager.layers.ENTITIES);
      expect(layers).to.not.include(renderManager.layers.EFFECTS);
    });

    it('should not warn about unknown state for LEVEL_EDITOR', function() {
      let warningCalled = false;
      const originalWarn = console.warn;
      console.warn = (msg) => {
        if (msg.includes('Unknown game state')) {
          warningCalled = true;
        }
      };

      renderManager.getLayersForState('LEVEL_EDITOR');

      console.warn = originalWarn;
      expect(warningCalled).to.be.false;
    });
  });

  describe('RenderLayerManager: LEVEL_EDITOR Mode', function() {
    it('should skip terrain rendering in LEVEL_EDITOR mode', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      renderManager.renderTerrainLayer('LEVEL_EDITOR');

      expect(terrainRendered).to.be.false;
    });

    it('should render terrain in PLAYING mode', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      renderManager.renderTerrainLayer('PLAYING');

      expect(terrainRendered).to.be.true;
    });

    it('should render UI_GAME layer in LEVEL_EDITOR mode', function() {
      let uiGameRendered = false;
      
      renderManager.layerRenderers.set('ui_game', () => {
        uiGameRendered = true;
      });

      renderManager.render('LEVEL_EDITOR');

      expect(uiGameRendered).to.be.true;
    });

    it('should not call background(0) when rendering terrain in LEVEL_EDITOR', function() {
      let backgroundCalled = false;
      const originalBg = global.background;
      global.background = () => { backgroundCalled = true; };

      renderManager.renderTerrainLayer('LEVEL_EDITOR');

      global.background = originalBg;
      expect(backgroundCalled).to.be.false;
    });
  });

  describe('Interactive Drawable System in LEVEL_EDITOR', function() {
    it('should call update() on interactive drawables during render', function() {
      let updateCalled = false;

      const interactive = {
        hitTest: () => true,
        update: (pointer) => {
          updateCalled = true;
        }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(updateCalled).to.be.true;
    });

    it('should provide pointer object to interactive.update()', function() {
      let receivedPointer = null;

      const interactive = {
        hitTest: () => true,
        update: (pointer) => {
          receivedPointer = pointer;
        }
      };

      global.mouseX = 100;
      global.mouseY = 200;
      global.mouseIsPressed = true;

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(receivedPointer).to.not.be.null;
      expect(receivedPointer.screen).to.exist;
      expect(receivedPointer.screen.x).to.equal(100);
      expect(receivedPointer.screen.y).to.equal(200);
      expect(receivedPointer.isPressed).to.be.true;
    });

    it('should call render() on interactive drawables after update', function() {
      const callOrder = [];

      const interactive = {
        hitTest: () => true,
        update: () => {
          callOrder.push('update');
        },
        render: () => {
          callOrder.push('render');
        }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);
      renderManager.render('LEVEL_EDITOR');

      expect(callOrder).to.deep.equal(['update', 'render']);
    });

    it('should process multiple interactive drawables in LEVEL_EDITOR', function() {
      let interactive1Updated = false;
      let interactive2Updated = false;

      const interactive1 = {
        hitTest: () => true,
        update: () => { interactive1Updated = true; }
      };

      const interactive2 = {
        hitTest: () => true,
        update: () => { interactive2Updated = true; }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive1);
      renderManager.addInteractiveDrawable('ui_game', interactive2);
      renderManager.render('LEVEL_EDITOR');

      expect(interactive1Updated).to.be.true;
      expect(interactive2Updated).to.be.true;
    });
  });

  describe('DraggablePanelManager Integration', function() {
    let DraggablePanelManager, draggablePanelManager;

    beforeEach(function() {
      // Load DraggablePanel first
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
      global.DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

      // Load DraggablePanelManager
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
      DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

      draggablePanelManager = new DraggablePanelManager();
      global.draggablePanelManager = draggablePanelManager;
    });

    it('should auto-register with RenderManager on initialize', function() {
      draggablePanelManager.initialize();

      const interactives = renderManager.layerInteractives.get('ui_game');
      expect(interactives).to.exist;
      expect(interactives.length).to.be.greaterThan(0);
    });

    it('should receive update calls when RenderManager.render() is called', function() {
      draggablePanelManager.initialize();
      
      let updateCalled = false;
      const originalUpdate = draggablePanelManager.update.bind(draggablePanelManager);
      draggablePanelManager.update = function(...args) {
        updateCalled = true;
        return originalUpdate(...args);
      };

      renderManager.render('LEVEL_EDITOR');

      expect(updateCalled).to.be.true;
    });

    it('should add LEVEL_EDITOR to stateVisibility when Level Editor panels initialize', function() {
      draggablePanelManager.initialize();

      // Load LevelEditorPanels
      delete require.cache[require.resolve('../../../Classes/systems/ui/LevelEditorPanels.js')];
      const LevelEditorPanels = require('../../../Classes/systems/ui/LevelEditorPanels.js');

      // Mock UI components
      global.MaterialPalette = class { render() {} handleClick() {} containsPoint() { return false; } };
      global.ToolBar = class { render() {} handleClick() {} containsPoint() { return false; } };
      global.BrushSizeControl = class { render() {} handleClick() {} containsPoint() { return false; } };

      const mockLevelEditor = {};
      const editorPanels = new LevelEditorPanels(mockLevelEditor);
      editorPanels.initialize();

      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.exist;
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-materials');
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-tools');
      expect(draggablePanelManager.stateVisibility.LEVEL_EDITOR).to.include('level-editor-brush');
    });

    it('should NOT auto-render panels with managedExternally flag', function() {
      draggablePanelManager.initialize();

      // Create a panel with managedExternally flag
      const managedPanel = new global.DraggablePanel({
        id: 'test-managed',
        title: 'Managed Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      let renderCalled = false;
      const originalRender = managedPanel.render.bind(managedPanel);
      managedPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-managed', managedPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-managed'];

      // Call renderPanels (this is what happens during RenderManager.render())
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel should NOT have been rendered by the manager
      expect(renderCalled).to.be.false;
    });

    it('should auto-render panels WITHOUT managedExternally flag', function() {
      draggablePanelManager.initialize();

      // Create a normal panel (no managedExternally flag)
      const normalPanel = new global.DraggablePanel({
        id: 'test-normal',
        title: 'Normal Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      let renderCalled = false;
      const originalRender = normalPanel.render.bind(normalPanel);
      normalPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-normal', normalPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-normal'];

      // Call renderPanels
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel SHOULD have been rendered by the manager
      expect(renderCalled).to.be.true;
    });

    it('should update managedExternally panels but not render them', function() {
      draggablePanelManager.initialize();

      const managedPanel = new global.DraggablePanel({
        id: 'test-managed-update',
        title: 'Managed Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behavior: {
          managedExternally: true
        }
      });

      let updateCalled = false;
      let renderCalled = false;

      const originalUpdate = managedPanel.update.bind(managedPanel);
      managedPanel.update = function(...args) {
        updateCalled = true;
        return originalUpdate(...args);
      };

      const originalRender = managedPanel.render.bind(managedPanel);
      managedPanel.render = function(...args) {
        renderCalled = true;
        return originalRender(...args);
      };

      draggablePanelManager.panels.set('test-managed-update', managedPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-managed-update'];

      // Simulate RenderManager calling update on interactives
      global.mouseX = 150;
      global.mouseY = 150;
      global.mouseIsPressed = false;
      
      draggablePanelManager.update(150, 150, false);
      draggablePanelManager.renderPanels('LEVEL_EDITOR');

      // Panel should be updated but NOT rendered
      expect(updateCalled).to.be.true;
      expect(renderCalled).to.be.false;
    });
  });

  describe('Render Pipeline Flow', function() {
    it('should execute render pipeline in correct order for LEVEL_EDITOR', function() {
      const executionOrder = [];

      renderManager.layerRenderers.set('ui_game', () => {
        executionOrder.push('ui_game_renderer');
      });

      renderManager.addDrawableToLayer('ui_game', () => {
        executionOrder.push('drawable');
      });

      const interactive = {
        hitTest: () => true,
        update: () => { executionOrder.push('interactive_update'); },
        render: () => { executionOrder.push('interactive_render'); }
      };
      renderManager.addInteractiveDrawable('ui_game', interactive);

      renderManager.render('LEVEL_EDITOR');

      // Expected order: interactive_update → ui_game_renderer → drawable → interactive_render
      expect(executionOrder.indexOf('interactive_update')).to.be.lessThan(executionOrder.indexOf('ui_game_renderer'));
      expect(executionOrder.indexOf('ui_game_renderer')).to.be.lessThan(executionOrder.indexOf('drawable'));
      expect(executionOrder.indexOf('drawable')).to.be.lessThan(executionOrder.indexOf('interactive_render'));
    });

    it('should handle errors in interactive updates gracefully', function() {
      const interactive = {
        hitTest: () => true,
        update: () => { throw new Error('Test error'); }
      };

      renderManager.addInteractiveDrawable('ui_game', interactive);

      expect(() => renderManager.render('LEVEL_EDITOR')).to.not.throw();
    });

    it('should track render stats for LEVEL_EDITOR', function() {
      renderManager.render('LEVEL_EDITOR');

      expect(renderManager.renderStats.frameCount).to.be.greaterThan(0);
      expect(renderManager.renderStats.lastFrameTime).to.be.a('number');
    });
  });

  describe('State Transitions', function() {
    it('should handle transition from MENU to LEVEL_EDITOR', function() {
      gameState.setState('MENU');
      renderManager.render('MENU');

      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should handle transition from PLAYING to LEVEL_EDITOR', function() {
      gameState.setState('PLAYING');
      renderManager.render('PLAYING');

      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(gameState.getState()).to.equal('LEVEL_EDITOR');
    });

    it('should handle transition from LEVEL_EDITOR back to PLAYING', function() {
      gameState.setState('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      gameState.setState('PLAYING');
      renderManager.render('PLAYING');

      expect(gameState.getState()).to.equal('PLAYING');
    });

    it('should render different layers after state transition', function() {
      let terrainRendered = false;
      global.g_activeMap.render = () => { terrainRendered = true; };

      // In LEVEL_EDITOR: terrain should NOT render
      renderManager.render('LEVEL_EDITOR');
      expect(terrainRendered).to.be.false;

      // In PLAYING: terrain SHOULD render
      renderManager.render('PLAYING');
      expect(terrainRendered).to.be.true;
    });
  });

  describe('Panel Dragging in LEVEL_EDITOR', function() {
    let DraggablePanelManager, draggablePanelManager, testPanel;

    beforeEach(function() {
      // Load DraggablePanel
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanel.js')];
      global.DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');

      // Load DraggablePanelManager
      delete require.cache[require.resolve('../../../Classes/systems/ui/DraggablePanelManager.js')];
      DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');

      draggablePanelManager = new DraggablePanelManager();
      global.draggablePanelManager = draggablePanelManager;
      draggablePanelManager.initialize();

      // Create a test panel
      testPanel = new global.DraggablePanel({
        id: 'test-panel',
        title: 'Test Panel',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 }
      });

      draggablePanelManager.panels.set('test-panel', testPanel);
      draggablePanelManager.stateVisibility.LEVEL_EDITOR = ['test-panel'];
    });

    it('should start dragging when title bar is clicked', function() {
      // Click on title bar (y = 100 to 130)
      global.mouseX = 150;
      global.mouseY = 110;
      global.mouseIsPressed = true;

      // Simulate mousePressed event
      draggablePanelManager.handleMouseEvents(150, 110, true);

      expect(testPanel.isDragging).to.be.true;
    });

    it('should update panel position during drag', function() {
      // Start drag
      global.mouseX = 150;
      global.mouseY = 110;
      draggablePanelManager.handleMouseEvents(150, 110, true);

      // Move mouse while dragging
      global.mouseX = 200;
      global.mouseY = 160;
      global.mouseIsPressed = true;

      // Call update (this happens via RenderManager.render())
      renderManager.render('LEVEL_EDITOR');

      // Position should have changed
      expect(testPanel.position.x).to.not.equal(100);
      expect(testPanel.position.y).to.not.equal(100);
    });

    it('should stop dragging when mouse is released', function() {
      // Start drag
      draggablePanelManager.handleMouseEvents(150, 110, true);
      expect(testPanel.isDragging).to.be.true;

      // Release mouse
      global.mouseIsPressed = false;
      testPanel.update(200, 160, false);

      expect(testPanel.isDragging).to.be.false;
    });

    it('should receive continuous updates through RenderManager', function() {
      let updateCount = 0;
      const originalUpdate = testPanel.update.bind(testPanel);
      testPanel.update = function(...args) {
        updateCount++;
        return originalUpdate(...args);
      };

      // Render multiple frames
      renderManager.render('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');
      renderManager.render('LEVEL_EDITOR');

      expect(updateCount).to.be.greaterThan(0);
    });
  });
});
