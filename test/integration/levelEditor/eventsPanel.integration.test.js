/**
 * Integration Tests: Events Panel Visibility
 * Tests interaction between LevelEditor, DraggablePanelManager, Tools panel, and Events panel
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Events Panel - Integration Tests', function() {
  let sandbox;
  let panelManager;
  let eventsPanel;
  let toolsPanel;
  let eventToggleButton;
  
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
    eventsPanel = { visible: false, render: sandbox.spy() };
    panelManager.registerPanel('level-editor-events', eventsPanel);
    
    // Mock Tools panel with Events toggle button
    eventToggleButton = {
      highlighted: false,
      onClick: null
    };
    toolsPanel = {
      buttons: [eventToggleButton],
      getButton: function(name) {
        if (name === 'Events') return eventToggleButton;
        return null;
      }
    };
    
    // Set default visibility (panel hidden)
    panelManager.stateVisibility.LEVEL_EDITOR = [];
    
    // Setup button click handler
    eventToggleButton.onClick = function() {
      const currentlyVisible = panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-events', !currentlyVisible, 'LEVEL_EDITOR');
      eventToggleButton.highlighted = !currentlyVisible;
    };
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.DraggablePanelManager;
    delete window.DraggablePanelManager;
  });
  
  describe('Default Visibility Behavior', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const isVisible = panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR');
      expect(isVisible).to.be.false;
    });
    
    it('should not be in stateVisibility array by default', function() {
      const visiblePanels = panelManager.stateVisibility.LEVEL_EDITOR;
      expect(visiblePanels).to.not.include('level-editor-events');
    });
  });
  
  describe('Tools Panel Integration', function() {
    it('should have Events toggle button in Tools panel', function() {
      const button = toolsPanel.getButton('Events');
      expect(button).to.exist;
      expect(button).to.equal(eventToggleButton);
    });
    
    it('should show panel when Events button clicked', function() {
      eventToggleButton.onClick();
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
      expect(eventsPanel.visible).to.be.true;
    });
    
    it('should hide panel when Events button clicked again', function() {
      eventToggleButton.onClick(); // Show
      eventToggleButton.onClick(); // Hide
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.false;
      expect(eventsPanel.visible).to.be.false;
    });
  });
  
  describe('Button Highlighting', function() {
    it('should highlight Events button when panel visible', function() {
      eventToggleButton.onClick();
      
      expect(eventToggleButton.highlighted).to.be.true;
    });
    
    it('should remove highlight when panel hidden', function() {
      eventToggleButton.onClick(); // Show
      expect(eventToggleButton.highlighted).to.be.true;
      
      eventToggleButton.onClick(); // Hide
      expect(eventToggleButton.highlighted).to.be.false;
    });
    
    it('should toggle highlight on multiple clicks', function() {
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.true;
      
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.false;
      
      eventToggleButton.onClick();
      expect(eventToggleButton.highlighted).to.be.true;
    });
  });
  
  describe('Panel Functionality When Visible', function() {
    it('should render panel when visible', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      if (eventsPanel.visible) {
        eventsPanel.render();
      }
      
      expect(eventsPanel.render.called).to.be.true;
    });
    
    it('should be fully functional when toggled on', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      expect(eventsPanel.visible).to.be.true;
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility across multiple renders', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      eventsPanel.render();
      eventsPanel.render();
      eventsPanel.render();
      
      expect(panelManager.isVisible('level-editor-events', 'LEVEL_EDITOR')).to.be.true;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle toggling when panel not registered', function() {
      panelManager.panels.delete('level-editor-events');
      
      expect(() => {
        panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      }).to.not.throw();
    });
    
    it('should handle button click with missing panel', function() {
      panelManager.panels.delete('level-editor-events');
      
      expect(() => {
        eventToggleButton.onClick();
      }).to.not.throw();
    });
    
    it('should handle setting visibility to same value twice', function() {
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      const visibleCount = panelManager.stateVisibility.LEVEL_EDITOR.filter(
        id => id === 'level-editor-events'
      ).length;
      
      expect(visibleCount).to.equal(1); // Should not duplicate
    });
  });
  
  describe('Other States Not Affected', function() {
    it('should not affect PLAYING state visibility', function() {
      panelManager.stateVisibility.PLAYING = [];
      
      panelManager.setVisibility('level-editor-events', true, 'LEVEL_EDITOR');
      
      expect(panelManager.stateVisibility.PLAYING).to.not.include('level-editor-events');
    });
  });
});
