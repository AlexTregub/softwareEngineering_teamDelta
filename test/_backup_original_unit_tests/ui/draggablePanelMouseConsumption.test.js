/**
 * Unit Tests: DraggablePanel Mouse Input Consumption
 * 
 * Tests to verify that panels correctly consume mouse input events,
 * preventing tile placement or other actions beneath panels when user
 * clicks on panel UI elements.
 * 
 * Requirements:
 * - Clicking on ANY part of a visible panel should consume the mouse event
 * - Clicking outside panels should NOT consume the event
 * - Invisible/hidden panels should NOT consume events
 * - Topmost panel should consume event when panels overlap
 * - Dragging panels should consume events
 * - Panel buttons should consume events
 * 
 * Bug Prevention:
 * - Prevents tile placement beneath panels (Level Editor)
 * - Prevents entity selection beneath panels
 * - Prevents unintended game actions when interacting with UI
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('DraggablePanel - Mouse Input Consumption', function() {
  let DraggablePanel, panel;
  
  beforeEach(function() {
    // Setup all UI test mocks (p5.js, window, Button, etc.)
    setupUITestEnvironment();
    
    // Load DraggablePanel
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel');
    
    // Create a test panel (visible by default)
    panel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      behavior: {
        draggable: true,
        persistent: false
      }
    });
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Basic Mouse Consumption', function() {
    it('should consume click on panel body (center of panel)', function() {
      // Click in the center of the panel
      const mouseX = 200; // panel.x (100) + width/2 (100)
      const mouseY = 175; // panel.y (100) + height/2 (75)
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on panel title bar', function() {
      // Click on title bar (top of panel)
      const mouseX = 200; // center X
      const mouseY = 110; // Just below top edge
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on panel edge (near border)', function() {
      // Click near the right edge
      const mouseX = 295; // Near right edge (300 - 5)
      const mouseY = 175; // Center Y
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should NOT consume click outside panel bounds', function() {
      // Click far outside panel
      const mouseX = 500;
      const mouseY = 500;
      
      const consumed = panel.update(mouseX, mouseY, false);
      
      expect(consumed).to.be.false;
    });
    
    it('should NOT consume click just outside panel edge', function() {
      // Click 1 pixel outside right edge
      const mouseX = 301; // panel.x (100) + width (200) + 1
      const mouseY = 175; // Center Y
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Visibility-Based Consumption', function() {
    it('should NOT consume click on hidden panel', function() {
      panel.hide();
      
      const mouseX = 200; // Center of panel
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.false;
    });
    
    it('should consume click on visible panel after showing', function() {
      panel.hide();
      panel.show();
      
      const mouseX = 200;
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should consume click on minimized panel title bar', function() {
      panel.toggleMinimized(); // Minimize the panel
      
      // Click on title bar of minimized panel
      const mouseX = 200;
      const mouseY = 110;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Should consume because title bar is still visible
      expect(consumed).to.be.true;
    });
  });
  
  describe('Dragging Consumption', function() {
    it('should consume events when starting drag from title bar', function() {
      const titleBarY = 110; // Within title bar
      
      // First update - start drag
      const consumed1 = panel.update(200, titleBarY, true);
      expect(consumed1).to.be.true;
      expect(panel.isDragging).to.be.true;
    });
    
    it('should consume events while dragging', function() {
      // Start drag
      panel.update(200, 110, true);
      expect(panel.isDragging).to.be.true;
      
      // Continue dragging (mouse moved)
      const consumed = panel.update(250, 150, true);
      
      expect(consumed).to.be.true;
      expect(panel.isDragging).to.be.true;
    });
    
    it('should stop consuming after drag ends', function() {
      // Start drag
      panel.update(200, 110, true);
      
      // Move while dragging
      panel.update(250, 150, true);
      
      // Release mouse
      panel.update(250, 150, false);
      expect(panel.isDragging).to.be.false;
      
      // Next click outside should not be consumed
      const consumed = panel.update(500, 500, true);
      expect(consumed).to.be.false;
    });
    
    it('should NOT start drag from panel body (only title bar)', function() {
      // Click on panel body (below title bar)
      const bodyY = 180;
      
      panel.update(200, bodyY, true);
      
      // Should NOT start dragging from body
      expect(panel.isDragging).to.be.false;
    });
  });
  
  describe('Button Interaction Consumption', function() {
    it('should consume click on panel button', function() {
      // Add a button to the panel
      const buttonClicked = sinon.spy();
      const testButton = new global.Button({
        x: 120,
        y: 140,
        width: 80,
        height: 30,
        label: 'Test',
        onClick: buttonClicked
      });
      
      panel.buttons.push(testButton);
      
      // Click on button
      const mouseX = 160; // Center of button
      const mouseY = 155;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
      expect(buttonClicked.called).to.be.true;
    });
    
    it('should consume minimize button click', function() {
      const initialMinimized = panel.isMinimized();
      
      // Click on minimize button (top-right corner)
      const titleBarHeight = panel.calculateTitleBarHeight();
      const buttonX = panel.state.position.x + panel.config.size.width - 16;
      const buttonY = panel.state.position.y + titleBarHeight / 2;
      
      const consumed = panel.update(buttonX, buttonY, true);
      
      expect(consumed).to.be.true;
      expect(panel.isMinimized()).to.not.equal(initialMinimized);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle rapid clicks correctly', function() {
      // Rapid clicks on panel
      const consumed1 = panel.update(200, 175, true);
      const consumed2 = panel.update(200, 175, false); // Hover - should still consume
      const consumed3 = panel.update(200, 175, true);
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true; // Mouse still over panel (hover)
      expect(consumed3).to.be.true;
    });
    
    it('should handle mouse press without release', function() {
      // Press and hold
      const consumed1 = panel.update(200, 175, true);
      const consumed2 = panel.update(200, 175, true); // Still pressed
      const consumed3 = panel.update(200, 175, true); // Still pressed
      
      expect(consumed1).to.be.true;
      expect(consumed2).to.be.true;
      expect(consumed3).to.be.true;
    });
    
    it('should handle hover without click', function() {
      // Mouse over panel but not pressed
      const consumed = panel.update(200, 175, false);
      
      // Should still consume (hovering over panel prevents terrain interactions)
      expect(consumed).to.be.true;
    });
    
    it('should handle click-hold-drag from panel to outside', function() {
      // Start on panel (not title bar, so no drag)
      panel.update(200, 175, true);
      
      // Move outside while holding
      const consumed = panel.update(500, 500, true);
      
      // Should NOT consume (mouse is outside)
      expect(consumed).to.be.false;
    });
    
    it('should handle panel position changes during interaction', function() {
      // Click on panel
      const consumed1 = panel.update(200, 175, true);
      expect(consumed1).to.be.true;
      
      // Move panel
      panel.state.position.x = 300;
      panel.state.position.y = 300;
      
      // Same mouse position, now outside new panel position
      const consumed2 = panel.update(200, 175, true);
      expect(consumed2).to.be.false;
      
      // Click at new panel position
      const consumed3 = panel.update(400, 375, true);
      expect(consumed3).to.be.true;
    });
  });
  
  describe('Integration with isMouseOver()', function() {
    it('should use isMouseOver() for bounds checking', function() {
      const isMouseOverSpy = sinon.spy(panel, 'isMouseOver');
      
      panel.update(200, 175, true);
      
      expect(isMouseOverSpy.called).to.be.true;
      
      isMouseOverSpy.restore();
    });
    
    it('should NOT consume if isMouseOver returns false', function() {
      // Stub isMouseOver to always return false
      sinon.stub(panel, 'isMouseOver').returns(false);
      
      const consumed = panel.update(200, 175, true);
      
      expect(consumed).to.be.false;
      
      panel.isMouseOver.restore();
    });
    
    it('should consume if isMouseOver returns true', function() {
      // Stub isMouseOver to always return true
      sinon.stub(panel, 'isMouseOver').returns(true);
      
      const consumed = panel.update(500, 500, true);
      
      // Even though coordinates are outside, isMouseOver says it's inside
      expect(consumed).to.be.true;
      
      panel.isMouseOver.restore();
    });
  });
  
  describe('Regression Tests', function() {
    it('should prevent tile placement beneath panel in Level Editor', function() {
      // This is the PRIMARY use case
      // User clicks on panel - should NOT place terrain tile
      
      const mouseX = 200; // Center of panel
      const mouseY = 175;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Panel MUST consume to prevent tile placement
      expect(consumed).to.be.true;
    });
    
    it('should allow tile placement when clicking outside panel', function() {
      // User clicks outside panel - SHOULD place terrain tile
      
      const mouseX = 500; // Outside panel
      const mouseY = 500;
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      // Panel MUST NOT consume to allow tile placement
      expect(consumed).to.be.false;
    });
    
    it('should consume clicks in panel padding areas', function() {
      // Click in the padding area (near edge but inside panel)
      const mouseX = 105; // Just inside left edge
      const mouseY = 105; // Just inside top edge
      
      const consumed = panel.update(mouseX, mouseY, true);
      
      expect(consumed).to.be.true;
    });
  });
});
