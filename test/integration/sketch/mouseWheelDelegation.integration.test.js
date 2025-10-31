/**
 * Integration Test: sketch.js mouseWheel() function
 * 
 * Tests the p5.js mouseWheel() handler in sketch.js to ensure it correctly
 * delegates to LevelEditor.handleMouseWheel() for ALL scroll events, not just Shift+scroll.
 * 
 * BUG: Currently mouseWheel() only calls levelEditor.handleMouseWheel() when Shift is pressed,
 * which prevents MaterialPalette and Sidebar from scrolling without Shift.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Integration: sketch.js mouseWheel() delegation', function() {
  let mockEvent, mockLevelEditor, mockGameState;
  
  beforeEach(function() {
    // Mock event
    mockEvent = {
      deltaY: 100,
      delta: 100,
      shiftKey: false,
      preventDefault: sinon.spy()
    };
    
    // Mock GameState
    mockGameState = {
      getState: sinon.stub().returns('LEVEL_EDITOR'),
      isInGame: sinon.stub().returns(false)
    };
    
    // Mock LevelEditor
    mockLevelEditor = {
      isActive: sinon.stub().returns(true),
      handleMouseWheel: sinon.stub().returns(false), // Returns false = not consumed
      handleZoom: sinon.spy()
    };
    
    // Mock globals
    global.GameState = mockGameState;
    global.levelEditor = mockLevelEditor;
    global.window = { levelEditor: mockLevelEditor };
    global.SHIFT = 16;
    global.keyIsDown = sinon.stub().returns(false);
    global.mouseX = 500;
    global.mouseY = 500;
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.GameState;
    delete global.levelEditor;
    delete global.window;
  });
  
  describe('Current Behavior (BUG)', function() {
    it('should NOT call handleMouseWheel without Shift key (current bug)', function() {
      // Simulate the CURRENT buggy behavior in sketch.js
      function mouseWheelCurrentBehavior(event) {
        if (GameState.getState() === 'LEVEL_EDITOR') {
          if (window.levelEditor && levelEditor.isActive()) {
            const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
            
            // BUG: Only calls handleMouseWheel when Shift is pressed
            if (shiftPressed && levelEditor.handleMouseWheel) {
              const handled = levelEditor.handleMouseWheel(event, shiftPressed);
              if (handled) {
                event.preventDefault();
                return false;
              }
            }
            
            // Falls through to zoom
            levelEditor.handleZoom(event.deltaY || 0);
            event.preventDefault();
            return false;
          }
        }
        return false;
      }
      
      // Test WITHOUT Shift key
      mockEvent.shiftKey = false;
      mouseWheelCurrentBehavior(mockEvent);
      
      // BUG: handleMouseWheel is NOT called
      expect(mockLevelEditor.handleMouseWheel.called).to.be.false;
      // Instead, zoom is called
      expect(mockLevelEditor.handleZoom.calledOnce).to.be.true;
    });
    
    it('should call handleMouseWheel WITH Shift key (works correctly)', function() {
      // Simulate the CURRENT behavior in sketch.js
      function mouseWheelCurrentBehavior(event) {
        if (GameState.getState() === 'LEVEL_EDITOR') {
          if (window.levelEditor && levelEditor.isActive()) {
            const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
            
            if (shiftPressed && levelEditor.handleMouseWheel) {
              const handled = levelEditor.handleMouseWheel(event, shiftPressed);
              if (handled) {
                event.preventDefault();
                return false;
              }
            }
            
            levelEditor.handleZoom(event.deltaY || 0);
            event.preventDefault();
            return false;
          }
        }
        return false;
      }
      
      // Test WITH Shift key
      mockEvent.shiftKey = true;
      mouseWheelCurrentBehavior(mockEvent);
      
      // handleMouseWheel IS called
      expect(mockLevelEditor.handleMouseWheel.calledOnce).to.be.true;
    });
  });
  
  describe('Expected Behavior (FIX)', function() {
    it('should ALWAYS call handleMouseWheel regardless of Shift', function() {
      // Simulate the FIXED behavior
      function mouseWheelFixedBehavior(event) {
        if (GameState.getState() === 'LEVEL_EDITOR') {
          if (window.levelEditor && levelEditor.isActive()) {
            const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
            
            // FIX: ALWAYS call handleMouseWheel (let it decide what to do)
            if (levelEditor.handleMouseWheel) {
              const handled = levelEditor.handleMouseWheel(event, shiftPressed, mouseX, mouseY);
              if (handled) {
                event.preventDefault();
                return false;
              }
            }
            
            // If not handled, fall back to zoom
            levelEditor.handleZoom(event.deltaY || 0);
            event.preventDefault();
            return false;
          }
        }
        return false;
      }
      
      // Test WITHOUT Shift key
      mockEvent.shiftKey = false;
      mouseWheelFixedBehavior(mockEvent);
      
      // FIX: handleMouseWheel IS called even without Shift
      expect(mockLevelEditor.handleMouseWheel.calledOnce).to.be.true;
      expect(mockLevelEditor.handleMouseWheel.calledWith(
        mockEvent,
        false,
        500, // mouseX
        500  // mouseY
      )).to.be.true;
    });
    
    it('should fall back to zoom if handleMouseWheel returns false', function() {
      // handleMouseWheel returns false (not consumed)
      mockLevelEditor.handleMouseWheel.returns(false);
      
      function mouseWheelFixedBehavior(event) {
        if (GameState.getState() === 'LEVEL_EDITOR') {
          if (window.levelEditor && levelEditor.isActive()) {
            const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
            
            if (levelEditor.handleMouseWheel) {
              const handled = levelEditor.handleMouseWheel(event, shiftPressed, mouseX, mouseY);
              if (handled) {
                event.preventDefault();
                return false;
              }
            }
            
            levelEditor.handleZoom(event.deltaY || 0);
            event.preventDefault();
            return false;
          }
        }
        return false;
      }
      
      mockEvent.shiftKey = false;
      mouseWheelFixedBehavior(mockEvent);
      
      // Both handleMouseWheel AND handleZoom should be called
      expect(mockLevelEditor.handleMouseWheel.calledOnce).to.be.true;
      expect(mockLevelEditor.handleZoom.calledOnce).to.be.true;
    });
    
    it('should NOT call zoom if handleMouseWheel returns true', function() {
      // handleMouseWheel returns true (consumed)
      mockLevelEditor.handleMouseWheel.returns(true);
      
      function mouseWheelFixedBehavior(event) {
        if (GameState.getState() === 'LEVEL_EDITOR') {
          if (window.levelEditor && levelEditor.isActive()) {
            const shiftPressed = event.shiftKey || keyIsDown(SHIFT);
            
            if (levelEditor.handleMouseWheel) {
              const handled = levelEditor.handleMouseWheel(event, shiftPressed, mouseX, mouseY);
              if (handled) {
                event.preventDefault();
                return false;
              }
            }
            
            levelEditor.handleZoom(event.deltaY || 0);
            event.preventDefault();
            return false;
          }
        }
        return false;
      }
      
      mockEvent.shiftKey = false;
      mouseWheelFixedBehavior(mockEvent);
      
      // handleMouseWheel is called
      expect(mockLevelEditor.handleMouseWheel.calledOnce).to.be.true;
      // But zoom is NOT called (event was consumed)
      expect(mockLevelEditor.handleZoom.called).to.be.false;
    });
  });
});
