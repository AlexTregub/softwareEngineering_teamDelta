/**
 * Unit tests for DraggablePanelManager managedExternally behavior
 * Tests that panels with managedExternally flag are not auto-rendered
 */

const { expect } = require('chai');
const { JSDOM } = require('jsdom');

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
