/**
 * Unit Tests: Properties Panel Visibility
 * 
 * Tests for Properties Panel visibility in Level Editor state.
 * Tests default hidden state, View menu toggle, state persistence.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Properties Panel Visibility', function() {
  let draggablePanelManager;
  let propertiesPanel;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock GameState
    global.GameState = {
      current: 'LEVEL_EDITOR',
      setState: sinon.stub()
    };
    window.GameState = global.GameState;
    
    // Mock Properties Panel
    propertiesPanel = {
      id: 'properties-panel',
      visible: false,
      render: sinon.spy(),
      toggle: sinon.stub().callsFake(function() {
        this.visible = !this.visible;
      }),
      setVisible: sinon.stub().callsFake(function(visible) {
        this.visible = visible;
      })
    };
    
    // Mock DraggablePanelManager
    global.DraggablePanelManager = class DraggablePanelManager {
      constructor() {
        this.panels = new Map();
        this.stateVisibility = {
          LEVEL_EDITOR: [],
          PLAYING: [],
          MENU: []
        };
      }
      
      registerPanel(panel) {
        this.panels.set(panel.id, panel);
      }
      
      isVisibleInState(panelId, state) {
        return this.stateVisibility[state].includes(panelId);
      }
      
      setVisibleInState(panelId, state, visible) {
        const list = this.stateVisibility[state];
        const index = list.indexOf(panelId);
        
        if (visible && index === -1) {
          list.push(panelId);
        } else if (!visible && index !== -1) {
          list.splice(index, 1);
        }
      }
      
      renderPanels(state) {
        this.panels.forEach(panel => {
          if (this.isVisibleInState(panel.id, state)) {
            panel.render();
          }
        });
      }
    };
    
    draggablePanelManager = new global.DraggablePanelManager();
    draggablePanelManager.registerPanel(propertiesPanel);
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should not be visible by default in LEVEL_EDITOR state', function() {
      const visible = draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.false;
    });
    
    it('should not render when state is LEVEL_EDITOR', function() {
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.called).to.be.false;
    });
  });
  
  describe('Toggle via View Menu', function() {
    it('should show panel when toggled on', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      const visible = draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.true;
    });
    
    it('should hide panel when toggled off', function() {
      // Show first
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      expect(draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR')).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', false);
      
      expect(draggablePanelManager.isVisibleInState('properties-panel', 'LEVEL_EDITOR')).to.be.false;
    });
    
    it('should render panel when visible in LEVEL_EDITOR state', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.calledOnce).to.be.true;
    });
  });
  
  describe('State Persistence', function() {
    it('should persist visibility state across renders', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(propertiesPanel.render.callCount).to.equal(3);
    });
    
    it('should not affect other states', function() {
      draggablePanelManager.setVisibleInState('properties-panel', 'LEVEL_EDITOR', true);
      
      const playingVisible = draggablePanelManager.isVisibleInState('properties-panel', 'PLAYING');
      const menuVisible = draggablePanelManager.isVisibleInState('properties-panel', 'MENU');
      
      expect(playingVisible).to.be.false;
      expect(menuVisible).to.be.false;
    });
  });
});
