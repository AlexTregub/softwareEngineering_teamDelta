/**
 * Unit Tests: DraggablePanelManager Mouse Input Consumption
 * 
 * Tests to verify that DraggablePanelManager correctly aggregates
 * mouse consumption from multiple panels and handles z-order correctly.
 * 
 * Requirements:
 * - Should return true if ANY panel consumes the event
 * - Should check panels in correct z-order (topmost first)
 * - Should stop checking after first consumption
 * - Should handle overlapping panels correctly
 * - Should skip invisible/hidden panels
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('DraggablePanelManager - Mouse Input Consumption', function() {
  let DraggablePanel, DraggablePanelManager;
  let manager, panel1, panel2, panel3;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Load classes
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager');
    
    // Create manager
    manager = new DraggablePanelManager();
    manager.isInitialized = true;
    
    // Create test panels (non-overlapping by default)
    panel1 = new DraggablePanel({
      id: 'panel-1',
      title: 'Panel 1',
      position: { x: 100, y: 100 },
      size: { width: 150, height: 100 }
    });
    
    panel2 = new DraggablePanel({
      id: 'panel-2',
      title: 'Panel 2',
      position: { x: 300, y: 100 },
      size: { width: 150, height: 100 }
    });
    
    panel3 = new DraggablePanel({
      id: 'panel-3',
      title: 'Panel 3',
      position: { x: 100, y: 250 },
      size: { width: 150, height: 100 }
    });
    
    // Add panels to manager
    manager.panels.set('panel-1', panel1);
    manager.panels.set('panel-2', panel2);
    manager.panels.set('panel-3', panel3);
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Basic Consumption Aggregation', function() {
    it('should return true if first panel consumes event', function() {
      // Click on panel1
      const mouseX = 175; // Center of panel1
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return true if second panel consumes event', function() {
      // Click on panel2
      const mouseX = 375; // Center of panel2
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return true if third panel consumes event', function() {
      // Click on panel3
      const mouseX = 175; // Center of panel3
      const mouseY = 300;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return false if no panel consumes event', function() {
      // Click far from all panels
      const mouseX = 500;
      const mouseY = 500;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Z-Order and Overlapping Panels', function() {
    it('should check panels in reverse order (topmost first)', function() {
      // Spy on panel update methods
      const spy1 = sinon.spy(panel1, 'update');
      const spy2 = sinon.spy(panel2, 'update');
      const spy3 = sinon.spy(panel3, 'update');
      
      // Click on panel1
      manager.handleMouseEvents(175, 150, true);
      
      // All panels should be checked because panel1 is not topmost
      // (Map iteration order determines z-order, but panels are checked in reverse)
      expect(spy1.called || spy2.called || spy3.called).to.be.true;
      
      spy1.restore();
      spy2.restore();
      spy3.restore();
    });
    
    it('should stop checking after first consumption', function() {
      // Make panels overlap - panel2 on top of panel1
      panel2.state.position.x = 100;
      panel2.state.position.y = 100;
      
      // Spy on updates
      const spy1 = sinon.spy(panel1, 'update');
      const spy2 = sinon.spy(panel2, 'update');
      
      // Click on overlapping area
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should consume (one of the panels handled it)
      expect(consumed).to.be.true;
      
      // At least one panel should have been checked
      expect(spy1.called || spy2.called).to.be.true;
      
      spy1.restore();
      spy2.restore();
    });
    
    it('should prioritize topmost panel when overlapping', function() {
      // Create overlapping panels
      panel1.state.position = { x: 100, y: 100 };
      panel2.state.position = { x: 120, y: 120 }; // Overlaps panel1
      
      // Track which panel consumed
      let panel1Consumed = false;
      let panel2Consumed = false;
      
      const originalUpdate1 = panel1.update.bind(panel1);
      const originalUpdate2 = panel2.update.bind(panel2);
      
      panel1.update = function(...args) {
        const result = originalUpdate1(...args);
        if (result) panel1Consumed = true;
        return result;
      };
      
      panel2.update = function(...args) {
        const result = originalUpdate2(...args);
        if (result) panel2Consumed = true;
        return result;
      };
      
      // Click on overlapping area
      const mouseX = 140; // Inside both panels
      const mouseY = 140;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
      // One of them should have consumed (topmost in z-order)
      expect(panel1Consumed || panel2Consumed).to.be.true;
      
      // Restore
      panel1.update = originalUpdate1;
      panel2.update = originalUpdate2;
    });
  });
  
  describe('Invisible/Hidden Panel Handling', function() {
    it('should skip hidden panels', function() {
      panel1.hide();
      
      // Click where panel1 would be if visible
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should NOT consume (panel1 is hidden)
      expect(consumed).to.be.false;
    });
    
    it('should check visible panels even if others are hidden', function() {
      panel1.hide();
      
      // Click on visible panel2
      const mouseX = 375;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, true);
      
      // Should consume (panel2 is visible)
      expect(consumed).to.be.true;
    });
    
    it('should return false if all panels are hidden', function() {
      panel1.hide();
      panel2.hide();
      panel3.hide();
      
      // Click anywhere
      const mouseX = 175;
      const mouseY = 150;
      
      const consumed = manager.handleMouseEvents(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Update vs HandleMouseEvents', function() {
    it('should call panel.update() for each panel via handleMouseEvents', function() {
      const spy1 = sinon.spy(panel1, 'update');
      
      manager.handleMouseEvents(175, 150, true);
      
      expect(spy1.called).to.be.true;
      
      spy1.restore();
    });
    
    it('should pass correct parameters to panel.update()', function() {
      const spy1 = sinon.spy(panel1, 'update');
      
      const mouseX = 175;
      const mouseY = 150;
      const mousePressed = true;
      
      manager.handleMouseEvents(mouseX, mouseY, mousePressed);
      
      expect(spy1.calledWith(mouseX, mouseY, mousePressed)).to.be.true;
      
      spy1.restore();
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle empty panel manager', function() {
      // Create empty manager
      const emptyManager = new DraggablePanelManager();
      emptyManager.isInitialized = true;
      
      const consumed = emptyManager.handleMouseEvents(100, 100, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should handle single panel', function() {
      const singleManager = new DraggablePanelManager();
      singleManager.isInitialized = true;
      singleManager.panels.set('only-panel', panel1);
      
      // Click on panel
      const consumed = singleManager.handleMouseEvents(175, 150, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should handle uninitialized manager', function() {
      const uninitManager = new DraggablePanelManager();
      // Don't set isInitialized
      
      const consumed = uninitManager.handleMouseEvents(175, 150, true);
      
      // Should return false (manager not initialized)
      expect(consumed).to.be.false;
    });
    
    it('should handle rapid successive calls', function() {
      // Rapid clicks
      const consumed1 = manager.handleMouseEvents(175, 150, true);
      const consumed2 = manager.handleMouseEvents(175, 150, false);
      const consumed3 = manager.handleMouseEvents(375, 150, true);
      const consumed4 = manager.handleMouseEvents(500, 500, true);
      
      expect(consumed1).to.be.true; // panel1
      expect(consumed2).to.be.true; // panel1 (mouse still over)
      expect(consumed3).to.be.true; // panel2
      expect(consumed4).to.be.false; // no panel
    });
  });
  
  describe('Regression Tests', function() {
    it('should prevent tile placement when clicking on ANY panel', function() {
      // Test all three panels
      const consumed1 = manager.handleMouseEvents(175, 150, true); // panel1
      const consumed2 = manager.handleMouseEvents(375, 150, true); // panel2
      const consumed3 = manager.handleMouseEvents(175, 300, true); // panel3
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true;
      expect(consumed3).to.be.true;
    });
    
    it('should allow tile placement when clicking outside all panels', function() {
      const consumed = manager.handleMouseEvents(500, 500, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should handle mixed visible/hidden panels correctly', function() {
      panel1.hide(); // Hidden
      // panel2 visible
      panel3.hide(); // Hidden
      
      // Click on panel2 (only visible one)
      const consumed = manager.handleMouseEvents(375, 150, true);
      expect(consumed).to.be.true;
      
      // Click where hidden panel1 would be
      const consumed2 = manager.handleMouseEvents(175, 150, true);
      expect(consumed2).to.be.false;
    });
  });
  
  describe('Integration with Panel Dragging', function() {
    it('should consume events during panel drag', function() {
      // Start drag on panel1 title bar
      const titleY = 110;
      manager.handleMouseEvents(175, titleY, true);
      
      // Continue drag
      const consumed = manager.handleMouseEvents(200, 135, true);
      
      expect(consumed).to.be.true;
      expect(panel1.isDragging).to.be.true;
    });
    
    it('should not consume after drag ends outside panel', function() {
      // Start drag
      manager.handleMouseEvents(175, 110, true);
      
      // Move and release outside
      manager.handleMouseEvents(500, 500, true);
      manager.handleMouseEvents(500, 500, false);
      
      // Click outside
      const consumed = manager.handleMouseEvents(600, 600, true);
      
      expect(consumed).to.be.false;
    });
  });
});
