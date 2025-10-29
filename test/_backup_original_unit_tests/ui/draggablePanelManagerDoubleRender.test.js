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

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

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
