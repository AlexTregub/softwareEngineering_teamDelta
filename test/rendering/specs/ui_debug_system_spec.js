/**
 * BDD Test Spec: Universal UI Debug System
 * 
 * Following Testing Methodology Standards:
 * - Tests real system APIs, not test logic
 * - Uses actual business requirements and thresholds  
 * - Validates both positive and negative scenarios
 * - Tests with realistic, domain-appropriate data
 * - Zero RED FLAG patterns
 */

const { expect } = require('chai');

// Load real system classes
const UIDebugManager = require('../../../Classes/rendering/UIDebugManager.js');

describe('🎯 Feature: Universal UI Debug System', function() {
  
  let uiDebugManager;
  let mockCanvas;
  let mockP5;
  
  beforeEach(function() {
    // Reset real system state before each test
    uiDebugManager = new UIDebugManager();
    
    // Create realistic p5.js mock that matches actual API
    mockP5 = {
      width: 800,
      height: 600,
      mouseX: 0,
      mouseY: 0,
      keyIsPressed: false,
      key: '',
      stroke: function() {},
      fill: function() {},
      rect: function() {},
      text: function() {},
      textAlign: function() {},
      LEFT: 'left',
      CENTER: 'center',
      TOP: 'top'
    };
    
    // Set up realistic canvas context
    mockCanvas = mockP5;
    
    // Initialize system with real p5.js-like environment
    if (typeof global.p5Instance === 'undefined') {
      global.p5Instance = mockP5;
    }
    
    console.log(`Test setup: UIDebugManager initialized, registeredElements=${Object.keys(uiDebugManager.registeredElements).length}`);
  });

  describe('Scenario: System Prerequisites Validation', function() {
    
    it('Given the UI debug system, When I check for required APIs, Then all debug management functions should be available', function() {
      // Given: I need to validate the UI debug system exists
      
      // Then: Core debug management functions should be available
      expect(typeof uiDebugManager.registerElement, 'registerElement function should be available').to.equal('function');
      expect(typeof uiDebugManager.unregisterElement, 'unregisterElement function should be available').to.equal('function');
      expect(typeof uiDebugManager.updateElementBounds, 'updateElementBounds function should be available').to.equal('function');
      expect(typeof uiDebugManager.render, 'render function should be available').to.equal('function');
      
      // And: Required properties should exist and be properly initialized
      expect(uiDebugManager.registeredElements, 'registeredElements should be an object').to.be.an('object');
      expect(uiDebugManager.isActive, 'isActive should be a boolean').to.be.a('boolean');
      expect(uiDebugManager.dragState, 'dragState should be an object').to.be.an('object');
      
      // And: Drag state should have proper structure for interaction handling
      expect(uiDebugManager.dragState.isDragging, 'dragState.isDragging should be boolean').to.be.a('boolean');
      expect(uiDebugManager.dragState.elementId, 'dragState.elementId should be null initially').to.be.null;
    });
    
    it('Given the UI debug system, When I check for localStorage integration, Then position persistence should be available', function() {
      // Given: I need persistent UI positioning
      
      // Then: localStorage methods should be available
      expect(typeof uiDebugManager.saveElementPosition, 'saveElementPosition function should be available').to.equal('function');
      expect(typeof uiDebugManager.loadElementPosition, 'loadElementPosition function should be available').to.equal('function');
      
      // And: Position data should use realistic UI coordinates
      const testPosition = { x: 100, y: 50, width: 200, height: 30 };
      uiDebugManager.saveElementPosition('test-ui-element', testPosition);
      const loadedPosition = uiDebugManager.loadElementPosition('test-ui-element');
      
      // Exclude timestamp from comparison as it's added by the system
      const { timestamp, ...positionWithoutTimestamp } = loadedPosition;
      expect(positionWithoutTimestamp, 'Should load saved position data').to.deep.equal(testPosition);
    });
  });

  describe('Scenario: UI Element Registration and Management', function() {
    
    it('Given I have a UI element, When I register it with the debug system, Then it should be tracked and manageable', function() {
      // Given: A realistic UI element (toolbar button)
      const elementId = 'toolbar-build-button';
      const elementBounds = {
        x: 10,
        y: 10,
        width: 80,
        height: 25
      };
      const positionCallback = function(newX, newY) {
        this.x = newX;
        this.y = newY;
      };
      
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(0, 'Should start with no registered elements');
      
      // When: I register the element with real debug system API
      const registrationResult = uiDebugManager.registerElement(elementId, elementBounds, positionCallback);
      
      // Then: Element should be successfully registered
      expect(registrationResult, 'Registration should return true for valid element').to.be.true;
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(1, 'Should have exactly one registered element');
      
      // And: Registered element should have correct properties
      const registeredElement = uiDebugManager.registeredElements[elementId];
      expect(registeredElement.bounds, 'Element should preserve bounds').to.deep.equal(elementBounds);
      expect(registeredElement.positionCallback, 'Element should preserve callback').to.equal(positionCallback);
      expect(registeredElement.isDraggable, 'Element should be draggable by default').to.be.true;
    });
    
    it('Given multiple UI elements, When I register them with different types, Then all should be tracked independently', function() {
      // Given: Multiple realistic UI elements from different systems
      const elements = [
        { id: 'hud-resource-counter', bounds: { x: 10, y: 10, width: 120, height: 20 }, type: 'HUD' },
        { id: 'minimap-container', bounds: { x: 680, y: 20, width: 100, height: 100 }, type: 'Minimap' },
        { id: 'debug-panel', bounds: { x: 600, y: 500, width: 180, height: 80 }, type: 'Debug' },
        { id: 'menu-save-button', bounds: { x: 350, y: 250, width: 100, height: 30 }, type: 'Menu' }
      ];
      
      const positionCallback = function(newX, newY) { this.x = newX; this.y = newY; };
      
      // When: I register all elements using real API
      elements.forEach(element => {
        const result = uiDebugManager.registerElement(element.id, element.bounds, positionCallback);
        expect(result, `Should successfully register ${element.id}`).to.be.true;
      });
      
      // Then: All elements should be independently tracked
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(4, 'Should track all registered elements');
      
      // And: Each element should maintain its unique properties
      elements.forEach(element => {
        const registered = uiDebugManager.registeredElements[element.id];
        expect(registered.bounds, `${element.id} should preserve its bounds`).to.deep.equal(element.bounds);
        expect(registered.positionCallback, `${element.id} should have position callback`).to.equal(positionCallback);
      });
      
      // And: Each element should have unique positioning
      const positions = elements.map(el => uiDebugManager.registeredElements[el.id].bounds);
      const uniquePositions = new Set(positions.map(pos => `${pos.x},${pos.y}`));
      expect(uniquePositions.size, 'All elements should have unique positions').to.equal(4);
    });
  });

  describe('Scenario: Element Position Updates and Constraints', function() {
    
    it('Given a registered UI element, When I update its position within screen bounds, Then position should be updated correctly', function() {
      // Given: A registered UI element
      const elementId = 'test-dialog';
      const initialBounds = { x: 100, y: 100, width: 200, height: 150 };
      let callbackX, callbackY;
      const positionCallback = function(newX, newY) { 
        callbackX = newX; 
        callbackY = newY; 
      };
      
      uiDebugManager.registerElement(elementId, initialBounds, positionCallback);
      
      // When: I update position within valid screen bounds (800x600 canvas)
      const newPosition = { x: 250, y: 200 };
      uiDebugManager.updateElementBounds(elementId, newPosition);
      
      // Then: Element bounds should be updated correctly
      const updatedElement = uiDebugManager.registeredElements[elementId];
      expect(updatedElement.bounds.x, 'X position should be updated').to.equal(250);
      expect(updatedElement.bounds.y, 'Y position should be updated').to.equal(200);
      
      // And: Position callback should be invoked with new coordinates
      expect(callbackX, 'Callback should receive new X coordinate').to.equal(250);
      expect(callbackY, 'Callback should receive new Y coordinate').to.equal(200);
      
      // And: Other bounds properties should be preserved
      expect(updatedElement.bounds.width, 'Width should be preserved').to.equal(200);
      expect(updatedElement.bounds.height, 'Height should be preserved').to.equal(150);
    });
    
    it('Given a UI element near screen edges, When I attempt to move it outside bounds, Then position should be constrained to screen', function() {
      // Given: An element near the right edge of 800px screen
      const elementId = 'edge-element';
      const elementBounds = { x: 750, y: 300, width: 100, height: 50 };
      let constrainedX, constrainedY;
      const positionCallback = function(newX, newY) {
        constrainedX = newX;
        constrainedY = newY;
      };
      
      uiDebugManager.registerElement(elementId, elementBounds, positionCallback);
      
      // When: I attempt to move element beyond screen boundaries
      // Right edge: x=850 would put element at 850+100=950, exceeding 800px screen
      uiDebugManager.updateElementBounds(elementId, { x: 850, y: 300 });
      
      // Then: X position should be constrained to keep element on screen
      const constrainedElement = uiDebugManager.registeredElements[elementId];
      expect(constrainedElement.bounds.x, 'X should be constrained to fit on 800px screen').to.be.at.most(700); // 800 - 100 width
      
      // When: I attempt to move element beyond bottom edge (600px screen height)
      uiDebugManager.updateElementBounds(elementId, { x: 400, y: 600 });
      
      // Then: Y position should be constrained to keep element visible
      expect(constrainedElement.bounds.y, 'Y should be constrained to fit on 600px screen').to.be.at.most(550); // 600 - 50 height
      
      // And: Position callback should receive constrained coordinates, not requested ones
      expect(constrainedX, 'Callback should receive constrained X, not requested X').to.not.equal(850);
      expect(constrainedY, 'Callback should receive constrained Y, not requested Y').to.not.equal(600);
    });
  });

  describe('Scenario: Interactive Dragging System', function() {
    
    it('Given debug mode is active, When I click and drag a UI element handle, Then element should move with cursor', function() {
      // Given: Active debug mode with registered element
      uiDebugManager.isActive = true;
      const elementId = 'draggable-panel';
      const initialBounds = { x: 200, y: 100, width: 150, height: 80 };
      let draggedX, draggedY;
      const positionCallback = function(newX, newY) {
        draggedX = newX;
        draggedY = newY;
      };
      
      uiDebugManager.registerElement(elementId, initialBounds, positionCallback);
      
      // When: I start dragging by clicking on element's yellow handle area
      const handleX = initialBounds.x + initialBounds.width - 5; // Near right edge where handle appears
      const handleY = initialBounds.y + 5; // Near top where handle appears
      
      // Simulate pointer down on handle
      uiDebugManager.handlePointerDown({ x: handleX, y: handleY });
      expect(uiDebugManager.dragState.isDragging, 'Should enter drag state').to.be.true;
      expect(uiDebugManager.dragState.elementId, 'Should identify correct element').to.equal(elementId);
      
      // Simulate pointer move (drag 50 pixels right, 30 pixels down)
      const newMouseX = handleX + 50;
      const newMouseY = handleY + 30;
      uiDebugManager.handlePointerMove({ x: newMouseX, y: newMouseY });
      
      // Then: Element should move by the drag distance
      const movedElement = uiDebugManager.registeredElements[elementId];
      expect(movedElement.bounds.x, 'Element should move horizontally with drag').to.equal(250); // 200 + 50
      expect(movedElement.bounds.y, 'Element should move vertically with drag').to.equal(130);   // 100 + 30
      
      // And: Position callback should be invoked with new position
      expect(draggedX, 'Callback should receive dragged X position').to.equal(250);
      expect(draggedY, 'Callback should receive dragged Y position').to.equal(130);
    });
    
    it('Given multiple overlapping elements, When I click on a specific handle, Then only that element should be selected for dragging', function() {
      // Given: Two overlapping UI elements (realistic scenario: dialog over HUD)
      const hudElement = { id: 'hud-overlay', bounds: { x: 50, y: 50, width: 200, height: 100 } };
      const dialogElement = { id: 'settings-dialog', bounds: { x: 100, y: 75, width: 180, height: 120 } };
      
      let hudMoved = false, dialogMoved = false;
      const hudCallback = function() { hudMoved = true; };
      const dialogCallback = function() { dialogMoved = true; };
      
      uiDebugManager.isActive = true;
      uiDebugManager.registerElement(hudElement.id, hudElement.bounds, hudCallback);
      uiDebugManager.registerElement(dialogElement.id, dialogElement.bounds, dialogCallback);
      
      // When: I click specifically on the dialog's handle (which overlaps HUD area)
      const dialogHandleX = dialogElement.bounds.x + dialogElement.bounds.width - 5; // Dialog's right edge handle
      const dialogHandleY = dialogElement.bounds.y + 5; // Dialog's top handle area
      
      // Click should target the dialog, not the HUD underneath
      uiDebugManager.handlePointerDown({ x: dialogHandleX, y: dialogHandleY });
      uiDebugManager.handlePointerMove({ x: dialogHandleX + 25, y: dialogHandleY + 15 });
      
      // Then: Only the dialog should be selected and moved
      expect(uiDebugManager.dragState.elementId, 'Should select dialog element, not underlying HUD').to.equal('settings-dialog');
      expect(dialogMoved, 'Dialog should be moved by drag operation').to.be.true;
      expect(hudMoved, 'HUD should not be affected by dialog drag').to.be.false;
      
      // And: Dialog position should be updated while HUD remains unchanged
      const updatedDialog = uiDebugManager.registeredElements[dialogElement.id];
      const unchangedHUD = uiDebugManager.registeredElements[hudElement.id];
      
      expect(updatedDialog.bounds.x, 'Dialog should be moved horizontally').to.equal(125); // 100 + 25
      expect(unchangedHUD.bounds.x, 'HUD should remain at original position').to.equal(50);
    });
  });

  describe('Scenario: Visual Rendering and Debug Feedback', function() {
    
    it('Given registered UI elements with debug mode active, When render is called, Then visual debug overlays should be drawn', function() {
      // Given: Active debug mode with registered elements
      uiDebugManager.isActive = true;
      const elements = [
        { id: 'toolbar-button', bounds: { x: 20, y: 10, width: 80, height: 25 } },
        { id: 'status-panel', bounds: { x: 600, y: 550, width: 180, height: 40 } }
      ];
      
      const mockCallback = function() {};
      elements.forEach(el => {
        uiDebugManager.registerElement(el.id, el.bounds, mockCallback);
      });
      
      // Track drawing operations to verify visual feedback
      let rectDrawCalls = [];
      let textDrawCalls = [];
      mockP5.stroke = function() { /* track stroke calls */ };
      mockP5.fill = function() { /* track fill calls */ };
      mockP5.rect = function(x, y, w, h) { rectDrawCalls.push({ x, y, w, h }); };
      mockP5.text = function(text, x, y) { textDrawCalls.push({ text, x, y }); };
      
      // When: Render is called with p5.js canvas context
      uiDebugManager.render(mockP5);
      
      // Then: Bounding boxes should be drawn for all registered elements
      expect(rectDrawCalls.length, 'Should draw bounding box for each registered element').to.be.at.least(2);
      
      // And: Element labels should be rendered for identification
      expect(textDrawCalls.length, 'Should draw element ID labels').to.be.at.least(2);
      
      // And: Visual feedback should use element's actual bounds
      const toolbarRect = rectDrawCalls.find(rect => 
        rect.x === 20 && rect.y === 10 && rect.w === 80 && rect.h === 25
      );
      expect(toolbarRect, 'Should draw toolbar button bounding box at correct position').to.exist;
      
      const statusRect = rectDrawCalls.find(rect => 
        rect.x === 600 && rect.y === 550 && rect.w === 180 && rect.h === 40
      );
      expect(statusRect, 'Should draw status panel bounding box at correct position').to.exist;
    });
    
    it('Given debug mode is inactive, When render is called, Then no debug overlays should be drawn', function() {
      // Given: Inactive debug mode with registered elements
      uiDebugManager.isActive = false;
      uiDebugManager.registerElement('hidden-element', { x: 100, y: 100, width: 50, height: 30 }, function() {});
      
      // Track drawing operations
      let drawingOperations = 0;
      mockP5.rect = function() { drawingOperations++; };
      mockP5.text = function() { drawingOperations++; };
      
      // When: Render is called
      uiDebugManager.render(mockP5);
      
      // Then: No drawing operations should occur
      expect(drawingOperations, 'Should not draw any debug overlays when inactive').to.equal(0);
    });
  });

  describe('Scenario: Position Persistence and State Management', function() {
    
    it('Given UI elements with custom positions, When positions are saved and loaded, Then all position data should persist accurately', function() {
      // Given: UI elements with realistic custom positions (user has moved them)
      const customPositions = [
        { id: 'resource-hud', position: { x: 15, y: 15, width: 140, height: 25 } },
        { id: 'minimap-widget', position: { x: 650, y: 30, width: 120, height: 120 } },
        { id: 'build-toolbar', position: { x: 300, y: 560, width: 200, height: 35 } }
      ];
      
      // When: Positions are saved using real localStorage API
      customPositions.forEach(item => {
        uiDebugManager.saveElementPosition(item.id, item.position);
      });
      
      // Simulate application restart by creating new debug manager instance
      const newDebugManager = new UIDebugManager();
      
      // Then: All saved positions should be loadable
      customPositions.forEach(item => {
        const loadedPosition = newDebugManager.loadElementPosition(item.id);
        // Exclude timestamp from comparison as it's added by the system
        const { timestamp, ...positionWithoutTimestamp } = loadedPosition;
        expect(positionWithoutTimestamp, `Should load saved position for ${item.id}`).to.deep.equal(item.position);
      });
      
      // And: Non-existent elements should return null without errors
      const nonExistentPosition = newDebugManager.loadElementPosition('non-existent-element');
      expect(nonExistentPosition, 'Should return null for non-existent elements').to.be.null;
    });
    
    it('Given elements with saved positions, When they are registered, Then they should automatically use saved positions', function() {
      // Given: Previously saved custom positions
      const savedPositions = [
        { id: 'chat-window', original: { x: 10, y: 400, width: 300, height: 150 }, custom: { x: 450, y: 200, width: 300, height: 150 } },
        { id: 'debug-console', original: { x: 20, y: 20, width: 200, height: 100 }, custom: { x: 580, y: 450, width: 200, height: 100 } }
      ];
      
      // Save custom positions to localStorage
      savedPositions.forEach(item => {
        uiDebugManager.saveElementPosition(item.id, item.custom);
      });
      
      // When: Elements are registered with original bounds but should load custom positions
      const positionCallback = function() {};
      
      savedPositions.forEach(item => {
        uiDebugManager.registerElement(item.id, item.original, positionCallback);
      });
      
      // Then: Registered elements should use saved custom positions, not original ones
      savedPositions.forEach(item => {
        const registeredElement = uiDebugManager.registeredElements[item.id];
        expect(registeredElement.bounds.x, `${item.id} should use saved X position`).to.equal(item.custom.x);
        expect(registeredElement.bounds.y, `${item.id} should use saved Y position`).to.equal(item.custom.y);
        
        // Dimensions should remain as originally specified
        expect(registeredElement.bounds.width, `${item.id} should preserve original width`).to.equal(item.original.width);
        expect(registeredElement.bounds.height, `${item.id} should preserve original height`).to.equal(item.original.height);
      });
    });
  });

  describe('Scenario: Error Handling and Edge Cases', function() {
    
    it('Given invalid registration parameters, When attempting to register elements, Then system should handle gracefully', function() {
      // Given: Invalid registration attempts
      const initialElementCount = Object.keys(uiDebugManager.registeredElements).length;
      
      // When: Attempting registration with invalid parameters
      const invalidRegistrations = [
        { id: null, bounds: { x: 10, y: 10, width: 50, height: 25 }, callback: function() {} },
        { id: '', bounds: { x: 10, y: 10, width: 50, height: 25 }, callback: function() {} },
        { id: 'valid-id', bounds: null, callback: function() {} },
        { id: 'valid-id-2', bounds: { x: 10, y: 10, width: 50, height: 25 }, callback: null }
      ];
      
      const registrationResults = invalidRegistrations.map(invalid => {
        try {
          return uiDebugManager.registerElement(invalid.id, invalid.bounds, invalid.callback);
        } catch (error) {
          return false; // Registration should either return false or throw - both are valid
        }
      });
      
      // Then: Invalid registrations should be rejected
      registrationResults.forEach((result, index) => {
        expect(result, `Invalid registration ${index} should be rejected`).to.be.false;
      });
      
      // And: System should remain stable with no elements registered
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(initialElementCount, 'Should not register invalid elements');
      expect(uiDebugManager.isActive, 'System should remain stable').to.be.a('boolean');
      expect(uiDebugManager.dragState, 'Drag state should remain valid').to.be.an('object');
    });
    
    it('Given unregistered elements, When attempting operations on them, Then system should handle gracefully without errors', function() {
      // Given: Operations on non-existent elements
      const nonExistentId = 'does-not-exist';
      
      // When: Attempting operations on unregistered elements
      let updateResult, unregisterResult, positionResult;
      
      expect(() => {
        updateResult = uiDebugManager.updateElementBounds(nonExistentId, { x: 100, y: 100 });
      }, 'Update operation should not throw for non-existent element').to.not.throw();
      
      expect(() => {
        unregisterResult = uiDebugManager.unregisterElement(nonExistentId);
      }, 'Unregister operation should not throw for non-existent element').to.not.throw();
      
      expect(() => {
        positionResult = uiDebugManager.loadElementPosition(nonExistentId);
      }, 'Position loading should not throw for non-existent element').to.not.throw();
      
      // Then: Operations should return appropriate values indicating failure/null
      expect(updateResult, 'Update should return false for non-existent element').to.be.false;
      expect(unregisterResult, 'Unregister should return false for non-existent element').to.be.false;
      expect(positionResult, 'Position loading should return null for non-existent element').to.be.null;
      
      // And: System should remain stable
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(0, 'Should maintain empty registry');
    });
  });

  describe('Scenario: Integration with Real UI Systems', function() {
    
    it('Given existing UI classes from the game, When they integrate with debug system, Then positioning should work seamlessly', function() {
      // Given: Realistic UI class integration (simulating Button class integration)
      class MockUIButton {
        constructor(x, y, width, height, text) {
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
          this.text = text;
          this.debugRegistered = false;
        }
        
        // Integration method that real UI classes would implement
        registerWithDebugSystem(debugManager) {
          if (!this.debugRegistered) {
            const bounds = { x: this.x, y: this.y, width: this.width, height: this.height };
            const positionCallback = (newX, newY) => {
              this.x = newX;
              this.y = newY;
            };
            
            const success = debugManager.registerElement(`button-${this.text}`, bounds, positionCallback);
            this.debugRegistered = success;
            return success;
          }
          return false;
        }
        
        render() {
          // Normal button rendering would happen here
          return { x: this.x, y: this.y, width: this.width, height: this.height };
        }
      }
      
      // When: Real UI objects integrate with debug system
      const gameButtons = [
        new MockUIButton(50, 500, 80, 30, 'Save'),
        new MockUIButton(140, 500, 80, 30, 'Load'),
        new MockUIButton(230, 500, 80, 30, 'Options')
      ];
      
      const integrationResults = gameButtons.map(button => button.registerWithDebugSystem(uiDebugManager));
      
      // Then: All UI objects should integrate successfully
      integrationResults.forEach((result, index) => {
        expect(result, `Button ${index} should integrate successfully`).to.be.true;
      });
      
      expect(Object.keys(uiDebugManager.registeredElements)).to.have.lengthOf(3, 'Should register all UI buttons');
      
      // And: Position updates should affect the actual UI objects
      uiDebugManager.updateElementBounds('button-Save', { x: 60, y: 510 });
      
      const saveButton = gameButtons[0];
      expect(saveButton.x, 'Save button X should be updated by debug system').to.equal(60);
      expect(saveButton.y, 'Save button Y should be updated by debug system').to.equal(510);
      
      // And: UI objects should render at updated positions
      const renderResult = saveButton.render();
      expect(renderResult.x, 'Rendered position should match debug-updated position').to.equal(60);
      expect(renderResult.y, 'Rendered position should match debug-updated position').to.equal(510);
    });
  });
});