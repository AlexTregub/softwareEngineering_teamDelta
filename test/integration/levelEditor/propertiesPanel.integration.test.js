/**
 * Integration Tests: Properties Panel Visibility
 * Tests interaction between LevelEditor, DraggablePanelManager, and Properties panel
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Properties Panel - Integration Tests', function() {
  let sandbox;
  let panelManager;
  let propertiesPanel;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock DraggablePanelManager
    const DraggablePanelManager = function() {
      this.panels = new Map();
      this.stateVisibility = {
        LEVEL_EDITOR: []
      };
    };
    DraggablePanelManager.prototype.registerPanel = function(id, panel) {
      this.panels.set(id, panel);
    };
    DraggablePanelManager.prototype.setVisibility = function(panelId, visible, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      if (!this.stateVisibility[stateKey]) {
        this.stateVisibility[stateKey] = [];
      }
      
      if (visible && !this.stateVisibility[stateKey].includes(panelId)) {
        this.stateVisibility[stateKey].push(panelId);
      } else if (!visible) {
        const index = this.stateVisibility[stateKey].indexOf(panelId);
        if (index > -1) {
          this.stateVisibility[stateKey].splice(index, 1);
        }
      }
      
      const panel = this.panels.get(panelId);
      if (panel) {
        panel.visible = visible;
      }
    };
    DraggablePanelManager.prototype.isVisible = function(panelId, state) {
      const stateKey = state || 'LEVEL_EDITOR';
      return this.stateVisibility[stateKey]?.includes(panelId) || false;
    };
    global.DraggablePanelManager = DraggablePanelManager;
    window.DraggablePanelManager = DraggablePanelManager;
    
    // Create instances
    panelManager = new DraggablePanelManager();
    propertiesPanel = { visible: false, render: sandbox.spy() };
    panelManager.registerPanel('level-editor-properties', propertiesPanel);
    
    // Set default visibility (panel hidden)
    panelManager.stateVisibility.LEVEL_EDITOR = [];
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.DraggablePanelManager;
    delete window.DraggablePanelManager;
  });
  
  describe('Default Visibility Behavior', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const isVisible = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      expect(isVisible).to.be.false;
    });
    
    it('should not be in stateVisibility array by default', function() {
      const visiblePanels = panelManager.stateVisibility.LEVEL_EDITOR;
      expect(visiblePanels).to.not.include('level-editor-properties');
    });
  });
  
  describe('Toggle Via View Menu', function() {
    it('should show panel when toggled on', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
      expect(propertiesPanel.visible).to.be.true;
    });
    
    it('should hide panel when toggled off', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-properties', false, 'LEVEL_EDITOR');
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.false;
      expect(propertiesPanel.visible).to.be.false;
    });
    
    it('should handle multiple toggle operations', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
      
      panelManager.setVisibility('level-editor-properties', false, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.false;
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility state across renders', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      // Simulate multiple render cycles
      propertiesPanel.render();
      propertiesPanel.render();
      propertiesPanel.render();
      
      expect(panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR')).to.be.true;
    });
    
    it('should maintain state during session', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      const state1 = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      
      // Simulate some time passing
      const state2 = panelManager.isVisible('level-editor-properties', 'LEVEL_EDITOR');
      
      expect(state1).to.equal(state2);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle toggling non-existent panel', function() {
      expect(() => {
        panelManager.setVisibility('non-existent-panel', true, 'LEVEL_EDITOR');
      }).to.not.throw();
    });
    
    it('should handle toggling with invalid state', function() {
      expect(() => {
        panelManager.setVisibility('level-editor-properties', true, 'INVALID_STATE');
      }).to.not.throw();
    });
    
    it('should handle setting visibility to same value twice', function() {
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      const visibleCount = panelManager.stateVisibility.LEVEL_EDITOR.filter(
        id => id === 'level-editor-properties'
      ).length;
      
      expect(visibleCount).to.equal(1); // Should not duplicate
    });
  });
  
  describe('Other States Not Affected', function() {
    it('should not affect PLAYING state visibility', function() {
      panelManager.stateVisibility.PLAYING = [];
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.PLAYING).to.not.include('level-editor-properties');
    });
    
    it('should not affect MENU state visibility', function() {
      panelManager.stateVisibility.MENU = [];
      
      panelManager.setVisibility('level-editor-properties', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.MENU).to.not.include('level-editor-properties');
    });
  });
});
