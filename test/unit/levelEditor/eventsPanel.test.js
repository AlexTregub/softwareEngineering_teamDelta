/**
 * Unit Tests: Events Panel Visibility
 * 
 * Tests for Events Panel visibility and Tools panel integration.
 * Tests default hidden state, Tools panel toggle button, button highlighting.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Events Panel Visibility', function() {
  let draggablePanelManager;
  let toolsPanel;
  let eventsPanel;
  let eventsToggleButton;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock GameState
    global.GameState = {
      current: 'LEVEL_EDITOR',
      setState: sinon.stub()
    };
    window.GameState = global.GameState;
    
    // Mock Events Panel
    eventsPanel = {
      id: 'events-panel',
      visible: false,
      render: sinon.spy()
    };
    
    // Mock Events Toggle Button
    eventsToggleButton = {
      label: 'Events',
      highlighted: false,
      onClick: sinon.spy(),
      render: sinon.spy(),
      setHighlight: sinon.stub().callsFake(function(highlight) {
        this.highlighted = highlight;
      })
    };
    
    // Mock Tools Panel
    toolsPanel = {
      id: 'tools-panel',
      buttons: [],
      addButton: sinon.stub().callsFake(function(button) {
        this.buttons.push(button);
      }),
      getButton: sinon.stub().callsFake(function(label) {
        return this.buttons.find(b => b.label === label);
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
        
        // Update button highlight if Tools panel exists
        const button = toolsPanel.getButton('Events');
        if (button) {
          button.setHighlight(visible);
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
    draggablePanelManager.registerPanel(eventsPanel);
    
    global.draggablePanelManager = draggablePanelManager;
    window.draggablePanelManager = draggablePanelManager;
    
    // Add Events button to Tools panel
    toolsPanel.addButton(eventsToggleButton);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Visibility', function() {
    it('should not be visible by default', function() {
      const visible = draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.false;
    });
    
    it('should not render when state is LEVEL_EDITOR', function() {
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.called).to.be.false;
    });
  });
  
  describe('Tools Panel Integration', function() {
    it('should have Events toggle button in Tools panel', function() {
      const button = toolsPanel.getButton('Events');
      
      expect(button).to.exist;
      expect(button.label).to.equal('Events');
    });
    
    it('should show panel when Events button clicked', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      const visible = draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR');
      
      expect(visible).to.be.true;
    });
    
    it('should hide panel when Events button clicked again', function() {
      // Show first
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      expect(draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR')).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', false);
      
      expect(draggablePanelManager.isVisibleInState('events-panel', 'LEVEL_EDITOR')).to.be.false;
    });
  });
  
  describe('Button Highlighting', function() {
    it('should highlight Events button when panel visible', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      const button = toolsPanel.getButton('Events');
      
      expect(button.highlighted).to.be.true;
    });
    
    it('should remove highlight when panel hidden', function() {
      // Show first
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      expect(toolsPanel.getButton('Events').highlighted).to.be.true;
      
      // Hide
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', false);
      
      expect(toolsPanel.getButton('Events').highlighted).to.be.false;
    });
  });
  
  describe('Render Behavior', function() {
    it('should render panel when visible', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.calledOnce).to.be.true;
    });
    
    it('should persist visibility across renders', function() {
      draggablePanelManager.setVisibleInState('events-panel', 'LEVEL_EDITOR', true);
      
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      draggablePanelManager.renderPanels('LEVEL_EDITOR');
      
      expect(eventsPanel.render.callCount).to.equal(2);
    });
  });
});
