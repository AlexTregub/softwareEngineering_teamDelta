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

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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
