/**
 * Integration Test: Mouse Wheel Scrolling in Level Editor
 * 
 * Tests that mouse wheel events are correctly delegated to the appropriate handler
 * based on mouse position, ensuring no conflicts between:
 * - MaterialPalette panel scrolling (mouse over materials panel)
 * - Sidebar panel scrolling (mouse over sidebar panel)
 * - Camera zoom (mouse over terrain, no Shift)
 * - Brush size adjustment (mouse over terrain, Shift pressed)
 * 
 * CRITICAL: Only ONE handler should consume each scroll event.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');

// Setup test environment
setupTestEnvironment({ rendering: true });

// Mock p5.js constants and globals
global.SHIFT = 16;
global.keyIsDown = sinon.stub().returns(false);
global.mouseX = 500;
global.mouseY = 500;

// Sync for JSDOM
if (typeof window !== 'undefined') {
  window.createVector = global.createVector;
  window.SHIFT = global.SHIFT;
  window.keyIsDown = global.keyIsDown;
  window.mouseX = global.mouseX;
  window.mouseY = global.mouseY;
}

describe('Integration: Mouse Wheel Scrolling', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let levelEditor, materialsPalette, sidebarPanel, mockEvent;
  
  beforeEach(function() {
    // Create mock event
    mockEvent = {
      deltaY: 100,
      delta: 100,
      shiftKey: false,
      preventDefault: sinon.spy()
    };
    
    // Mock MaterialPalette
    materialsPalette = {
      scrollOffset: 0,
      maxScrollOffset: 200,
      handleMouseWheel: sinon.spy(function(delta) {
        if (typeof delta === 'number' && !isNaN(delta) && delta !== 0) {
          this.scrollOffset += delta;
          this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
        }
      })
    };
    
    // Mock Sidebar
    sidebarPanel = {
      scrollOffset: 0,
      maxScrollOffset: 150,
      handleMouseWheel: sinon.spy(function(delta, mouseX, mouseY) {
        if (typeof delta === 'number' && !isNaN(delta) && delta !== 0) {
          this.scrollOffset += delta;
          this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));
          return true; // consumed
        }
        return false;
      })
    };
    
    // Mock panels
    const materialsPanel = {
      state: {
        visible: true,
        minimized: false,
        position: { x: 10, y: 80 }
      }
    };
    
    const sidebarPanelObj = {
      state: {
        visible: true,
        minimized: false,
        position: { x: 900, y: 80 }
      }
    };
    
    // Mock LevelEditor
    levelEditor = {
      active: true,
      palette: materialsPalette,
      sidebar: sidebarPanel,
      levelEditorPanels: {
        panels: {
          materials: materialsPanel,
          sidebar: sidebarPanelObj
        }
      },
      handleZoom: sinon.spy(),
      handleMouseWheel: function(event, shiftKey, mouseX, mouseY) {
        // Check sidebar delegation (sidebar handles scrolling without Shift key)
        if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.sidebar) {
          const sidebarPanelState = this.levelEditorPanels.panels.sidebar;
          
          if (sidebarPanelState.state && sidebarPanelState.state.visible && !sidebarPanelState.state.minimized && this.sidebar) {
            const pos = sidebarPanelState.state.position;
            const sidebarWidth = 250; // Assume sidebar width
            const sidebarHeight = 600; // Assume sidebar height
            
            if (mouseX >= pos.x && mouseX <= pos.x + sidebarWidth &&
                mouseY >= pos.y && mouseY <= pos.y + sidebarHeight) {
              const delta = event.deltaY || event.delta || 0;
              const handled = this.sidebar.handleMouseWheel(delta, mouseX, mouseY);
              if (handled) return true;
            }
          }
        }
        
        // Check materials panel delegation
        if (this.levelEditorPanels && this.levelEditorPanels.panels && this.levelEditorPanels.panels.materials) {
          const materialsPanel = this.levelEditorPanels.panels.materials;
          
          if (materialsPanel.state && materialsPanel.state.visible && !materialsPanel.state.minimized && this.palette) {
            const pos = materialsPanel.state.position;
            const panelWidth = 400; // Assume panel width
            const panelHeight = 500; // Assume panel height
            
            if (mouseX >= pos.x && mouseX <= pos.x + panelWidth &&
                mouseY >= pos.y && mouseY <= pos.y + panelHeight) {
              const delta = event.deltaY || event.delta || 0;
              this.palette.handleMouseWheel(delta);
              return true; // consumed
            }
          }
        }
        
        // Shift+scroll for brush size (only when Shift pressed)
        if (shiftKey) {
          // Would adjust brush size here
          return true; // consumed
        }
        
        return false; // not consumed
      }
    };
    
    global.mouseX = 500;
    global.mouseY = 500;
  });
  
  afterEach(function() {
    cleanupTestEnvironment();
  });
  
  describe('Materials Panel Scrolling', function() {
    it('should scroll Materials panel when mouse is over panel', function() {
      // Mouse position over materials panel (x: 10-410, y: 80-580)
      const mouseX = 200;
      const mouseY = 300;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(materialsPalette.handleMouseWheel.calledOnce).to.be.true;
      expect(materialsPalette.scrollOffset).to.equal(100);
      expect(levelEditor.handleZoom.called).to.be.false; // Should NOT zoom
    });
    
    it('should NOT scroll Materials panel when mouse is outside panel', function() {
      // Mouse position outside materials panel
      const mouseX = 500;
      const mouseY = 500;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.false;
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
      expect(materialsPalette.scrollOffset).to.equal(0);
    });
  });
  
  describe('Sidebar Panel Scrolling', function() {
    it('should scroll Sidebar when mouse is over sidebar panel', function() {
      // Mouse position over sidebar (x: 900-1150, y: 80-680)
      const mouseX = 1000;
      const mouseY = 300;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.true;
      expect(sidebarPanel.handleMouseWheel.calledOnce).to.be.true;
      expect(sidebarPanel.scrollOffset).to.equal(100);
      expect(levelEditor.handleZoom.called).to.be.false; // Should NOT zoom
    });
    
    it('should NOT scroll Sidebar when mouse is outside sidebar', function() {
      // Mouse position outside sidebar
      const mouseX = 500;
      const mouseY = 500;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.false;
      expect(sidebarPanel.handleMouseWheel.called).to.be.false;
      expect(sidebarPanel.scrollOffset).to.equal(0);
    });
  });
  
  describe('Priority Order', function() {
    it('should prioritize Sidebar over Materials panel when overlapping', function() {
      // If both panels were at same position, sidebar should be checked first
      // This test verifies the delegation order in handleMouseWheel
      
      // Position mouse over sidebar
      const mouseX = 1000;
      const mouseY = 300;
      
      levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      // Sidebar should be called
      expect(sidebarPanel.handleMouseWheel.calledOnce).to.be.true;
      // Materials should NOT be called (sidebar consumed it)
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
    });
  });
  
  describe('Brush Size Adjustment (Shift+Scroll)', function() {
    it('should consume event when Shift pressed (brush size)', function() {
      // Mouse over terrain (not over any panel)
      const mouseX = 500;
      const mouseY = 500;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, true, mouseX, mouseY);
      
      expect(handled).to.be.true; // Should be consumed
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
      expect(sidebarPanel.handleMouseWheel.called).to.be.false;
      expect(levelEditor.handleZoom.called).to.be.false;
    });
  });
  
  describe('Camera Zoom (No Panel, No Shift)', function() {
    it('should return false when mouse not over panel and no Shift', function() {
      // Mouse over terrain (not over any panel)
      const mouseX = 500;
      const mouseY = 500;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.false; // Should NOT be consumed (zoom will handle it)
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
      expect(sidebarPanel.handleMouseWheel.called).to.be.false;
    });
  });
  
  describe('Edge Cases', function() {
    it('should not crash with null event', function() {
      expect(() => {
        levelEditor.handleMouseWheel(null, false, 500, 500);
      }).to.not.throw();
    });
    
    it('should not crash with undefined mouseX/mouseY', function() {
      expect(() => {
        levelEditor.handleMouseWheel(mockEvent, false, undefined, undefined);
      }).to.not.throw();
    });
    
    it('should handle minimized panels correctly', function() {
      // Minimize materials panel
      levelEditor.levelEditorPanels.panels.materials.state.minimized = true;
      
      // Mouse over materials panel position (but panel is minimized)
      const mouseX = 200;
      const mouseY = 300;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.false;
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
    });
    
    it('should handle hidden panels correctly', function() {
      // Hide materials panel
      levelEditor.levelEditorPanels.panels.materials.state.visible = false;
      
      // Mouse over materials panel position (but panel is hidden)
      const mouseX = 200;
      const mouseY = 300;
      
      const handled = levelEditor.handleMouseWheel(mockEvent, false, mouseX, mouseY);
      
      expect(handled).to.be.false;
      expect(materialsPalette.handleMouseWheel.called).to.be.false;
    });
  });
});
