/**
 * Unit Tests: View Menu Panel Toggle Bug Fix
 * 
 * Tests that View menu panel toggles work correctly with draggablePanelManager
 * 
 * TDD: Write FIRST, then fix bug
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('FileMenuBar - View Menu Panel Toggle', function() {
  let menuBar, mockDraggablePanelManager, mockPanel;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Mock panel
    mockPanel = {
      isVisible: sinon.stub().returns(true),
      toggleVisibility: sinon.stub()
    };
    
    // Mock draggablePanelManager (global)
    mockDraggablePanelManager = {
      togglePanel: sinon.stub().callsFake((panelId) => {
        mockPanel.toggleVisibility();
        const newState = !mockPanel.isVisible();
        mockPanel.isVisible.returns(newState);
        return newState;
      }),
      panels: new Map([
        ['level-editor-materials', mockPanel],
        ['level-editor-tools', mockPanel],
        ['level-editor-events', mockPanel],
        ['level-editor-properties', mockPanel]
      ])
    };
    
    global.draggablePanelManager = mockDraggablePanelManager;
    
    const FileMenuBar = require('../../../Classes/ui/FileMenuBar');
    menuBar = new FileMenuBar(10, 10);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
    delete global.draggablePanelManager;
  });
  
  describe('Panel Toggle with Correct IDs', function() {
    it('should use "level-editor-materials" ID for Materials Panel', function() {
      menuBar._handleTogglePanel('materials');
      
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-materials')).to.be.true;
    });
    
    it('should use "level-editor-tools" ID for Tools Panel', function() {
      menuBar._handleTogglePanel('tools');
      
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-tools')).to.be.true;
    });
    
    it('should use "level-editor-events" ID for Events Panel', function() {
      menuBar._handleTogglePanel('events');
      
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-events')).to.be.true;
    });
    
    it('should use "level-editor-properties" ID for Properties Panel', function() {
      menuBar._handleTogglePanel('properties');
      
      expect(mockDraggablePanelManager.togglePanel.calledWith('level-editor-properties')).to.be.true;
    });
  });
  
  describe('Menu State Synchronization', function() {
    it('should update menu checked state after toggle', function() {
      // Materials panel starts visible
      mockPanel.isVisible.returns(true);
      
      // Toggle should hide it
      mockDraggablePanelManager.togglePanel.returns(false);
      
      menuBar._handleTogglePanel('materials');
      
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const materialsItem = viewMenu.items.find(i => i.label === 'Materials Panel');
      
      expect(materialsItem.checked).to.be.false;
    });
    
    it('should reflect actual panel state, not toggle count', function() {
      // Panel starts visible
      mockPanel.isVisible.returns(true);
      mockDraggablePanelManager.togglePanel.returns(false); // After toggle, hidden
      
      menuBar._handleTogglePanel('materials');
      
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const materialsItem = viewMenu.items.find(i => i.label === 'Materials Panel');
      
      // Menu should show unchecked (panel hidden)
      expect(materialsItem.checked).to.be.false;
    });
    
    it('should handle rapid toggle correctly', function() {
      // Toggle 3 times rapidly
      mockDraggablePanelManager.togglePanel.onCall(0).returns(false);
      mockDraggablePanelManager.togglePanel.onCall(1).returns(true);
      mockDraggablePanelManager.togglePanel.onCall(2).returns(false);
      
      menuBar._handleTogglePanel('tools');
      menuBar._handleTogglePanel('tools');
      menuBar._handleTogglePanel('tools');
      
      const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
      const toolsItem = viewMenu.items.find(i => i.label === 'Tools Panel');
      
      // After 3 toggles (true → false → true → false), should be hidden
      expect(toolsItem.checked).to.be.false;
    });
  });
  
  describe('Global draggablePanelManager Usage', function() {
    it('should use global draggablePanelManager, not levelEditor.draggablePanels', function() {
      menuBar._handleTogglePanel('materials');
      
      expect(mockDraggablePanelManager.togglePanel.called).to.be.true;
    });
    
    it('should handle missing draggablePanelManager gracefully', function() {
      delete global.draggablePanelManager;
      
      expect(() => menuBar._handleTogglePanel('materials')).to.not.throw();
    });
  });
});
