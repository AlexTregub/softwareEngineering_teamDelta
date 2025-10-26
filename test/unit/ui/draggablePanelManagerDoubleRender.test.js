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

describe('DraggablePanelManager - Double Rendering Prevention', function() {
  let DraggablePanelManager, DraggablePanel;
  let manager;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.fill = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.translate = sinon.stub();
    global.line = sinon.stub();
    global.noFill = sinon.stub();
    
    // Mock other globals
    global.devConsoleEnabled = false;
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    global.BASELINE = 'baseline';
    global.ButtonStyles = {
      SUCCESS: { bg: [0, 255, 0], fg: [255, 255, 255] },
      DANGER: { bg: [255, 0, 0], fg: [255, 255, 255] },
      WARNING: { bg: [255, 255, 0], fg: [0, 0, 0] }
    };
    
    // Mock Button class
    global.Button = class Button {
      constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 50;
        this.height = config.height || 20;
        this.label = config.label || '';
        this.onClick = config.onClick || (() => {});
      }
      
      render() {}
      
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      
      isMouseOver(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
      }
    };
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.fill = global.fill;
      window.rect = global.rect;
      window.text = global.text;
      window.textSize = global.textSize;
      window.textAlign = global.textAlign;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
      window.line = global.line;
      window.noFill = global.noFill;
      window.devConsoleEnabled = global.devConsoleEnabled;
      window.localStorage = global.localStorage;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.RIGHT = global.RIGHT;
      window.TOP = global.TOP;
      window.BOTTOM = global.BOTTOM;
      window.BASELINE = global.BASELINE;
      window.ButtonStyles = global.ButtonStyles;
      window.Button = global.Button;
    }
    
    // Make p5.js functions globally available (bare function calls in source code)
    // DraggablePanel.render() uses: if (typeof push === 'function')
    // This check looks for bare `push` in the execution context
    if (typeof globalThis !== 'undefined') {
      globalThis.push = global.push;
      globalThis.pop = global.pop;
      globalThis.fill = global.fill;
      globalThis.rect = global.rect;
      globalThis.text = global.text;
      globalThis.textSize = global.textSize;
      globalThis.textAlign = global.textAlign;
      globalThis.stroke = global.stroke;
      globalThis.strokeWeight = global.strokeWeight;
      globalThis.noStroke = global.noStroke;
      globalThis.translate = global.translate;
      globalThis.line = global.line;
      globalThis.noFill = global.noFill;
    }
    
    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    
    manager = new DraggablePanelManager();
    manager.isInitialized = true; // Skip full initialization, just mark as initialized
  });
  
  afterEach(function() {
    sinon.restore();
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
