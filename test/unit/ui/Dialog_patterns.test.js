/**
 * Unit tests for Dialog parent class patterns
 * 
 * Tests common patterns that all dialogs share:
 * - Coordinate conversion (screen → dialog-relative)
 * - Automatic centering on show()
 * - Modal overlay rendering
 * 
 * These tests are written FIRST (TDD) before refactoring Dialog.js.
 * 
 * Run: npx mocha "test/unit/ui/Dialog_patterns.test.js"
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock UIObject base class
class UIObject {
  constructor(config = {}) {
    this.width = config.width || 100;
    this.height = config.height || 100;
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.visible = config.visible !== undefined ? config.visible : true;
  }
  
  setVisible(visible) {
    this.visible = visible;
  }
  
  markDirty() {}
  
  getCacheBuffer() {
    return null;
  }
}

global.UIObject = UIObject;
if (typeof window === 'undefined') {
  global.window = global;
}
window.UIObject = UIObject;

// Load Dialog class
let Dialog;
try {
  Dialog = require('../../../Classes/ui/_baseObjects/modalWindow/Dialog.js');
} catch (e) {
  // Expected to fail initially (TDD)
}

describe('Dialog Parent Patterns', function() {
  let dialog;
  
  beforeEach(function() {
    // Skip if Dialog not loaded yet
    if (!Dialog) {
      this.skip();
      return;
    }
    
    // Create test dialog subclass
    class TestDialog extends Dialog {
      renderContent(buffer) {
        // Mock implementation
      }
    }
    
    dialog = new TestDialog({ width: 400, height: 300 });
  });
  
  describe('showWithCentering()', function() {
    it('should center dialog on canvas', function() {
      // Mock global canvas dimensions
      global.g_canvasX = 1920;
      global.g_canvasY = 1080;
      
      dialog.showWithCentering();
      
      // Calculate expected centered position
      const expectedX = (1920 - 400) / 2;
      const expectedY = (1080 - 300) / 2;
      
      expect(dialog.x).to.equal(expectedX);
      expect(dialog.y).to.equal(expectedY);
    });
    
    it('should use default canvas size if globals not defined', function() {
      delete global.g_canvasX;
      delete global.g_canvasY;
      
      dialog.showWithCentering();
      
      // Should use 1920x1080 as default
      const expectedX = (1920 - 400) / 2;
      const expectedY = (1080 - 300) / 2;
      
      expect(dialog.x).to.equal(expectedX);
      expect(dialog.y).to.equal(expectedY);
    });
    
    it('should set visible to true', function() {
      dialog.visible = false;
      dialog.showWithCentering();
      expect(dialog.visible).to.be.true;
    });
    
    it('should call markDirty', function() {
      const markDirtySpy = sinon.spy(dialog, 'markDirty');
      dialog.showWithCentering();
      expect(markDirtySpy.calledOnce).to.be.true;
    });
    
    it('should call onShow hook if overridden', function() {
      dialog.onShow = sinon.spy();
      dialog.showWithCentering('test', 123);
      expect(dialog.onShow.calledOnce).to.be.true;
      expect(dialog.onShow.calledWith('test', 123)).to.be.true;
    });
  });
  
  describe('convertToDialogCoords()', function() {
    it('should convert screen coordinates to dialog-relative', function() {
      dialog.x = 100;
      dialog.y = 50;
      
      const result = dialog.convertToDialogCoords(150, 80);
      
      expect(result.x).to.equal(50);
      expect(result.y).to.equal(30);
    });
    
    it('should handle zero position', function() {
      dialog.x = 0;
      dialog.y = 0;
      
      const result = dialog.convertToDialogCoords(25, 40);
      
      expect(result.x).to.equal(25);
      expect(result.y).to.equal(40);
    });
    
    it('should handle negative mouse coordinates', function() {
      dialog.x = 100;
      dialog.y = 100;
      
      const result = dialog.convertToDialogCoords(50, 75);
      
      expect(result.x).to.equal(-50);
      expect(result.y).to.equal(-25);
    });
  });
  
  describe('handleClickWithConversion()', function() {
    it('should return false if not visible', function() {
      dialog.visible = false;
      const result = dialog.handleClickWithConversion(100, 100);
      expect(result).to.be.false;
    });
    
    it('should convert coordinates and call handleDialogClick', function() {
      dialog.x = 100;
      dialog.y = 50;
      dialog.visible = true;
      dialog.handleDialogClick = sinon.stub().returns(true);
      
      const result = dialog.handleClickWithConversion(150, 80);
      
      expect(dialog.handleDialogClick.calledOnce).to.be.true;
      expect(dialog.handleDialogClick.calledWith(50, 30)).to.be.true;
      expect(result).to.be.true;
    });
    
    it('should consume clicks within dialog bounds', function() {
      dialog.x = 100;
      dialog.y = 100;
      dialog.width = 400;
      dialog.height = 300;
      dialog.visible = true;
      dialog.handleDialogClick = sinon.stub().returns(false);
      
      // Click inside dialog (relative coords: 50, 50)
      const result = dialog.handleClickWithConversion(150, 150);
      
      expect(result).to.be.true; // Consumed even though handleDialogClick returned false
    });
    
    it('should not consume clicks outside dialog bounds', function() {
      dialog.x = 100;
      dialog.y = 100;
      dialog.width = 400;
      dialog.height = 300;
      dialog.visible = true;
      dialog.handleDialogClick = sinon.stub().returns(false);
      
      // Click outside dialog (relative coords: -10, -10)
      const result = dialog.handleClickWithConversion(90, 90);
      
      expect(result).to.be.false;
    });
  });
  
  describe('handleDialogClick() default implementation', function() {
    it('should return false by default', function() {
      const result = dialog.handleDialogClick(50, 50);
      expect(result).to.be.false;
    });
  });
  
  describe('onShow() hook', function() {
    it('should be called by showWithCentering', function() {
      dialog.onShow = sinon.spy();
      dialog.showWithCentering();
      expect(dialog.onShow.calledOnce).to.be.true;
    });
    
    it('should do nothing by default', function() {
      // Should not throw
      expect(() => dialog.onShow()).to.not.throw();
    });
  });
  
  describe('updateChildHovers()', function() {
    beforeEach(function() {
      // Mock global mouseX/mouseY
      global.mouseX = 150;
      global.mouseY = 120;
      dialog.x = 100;
      dialog.y = 80;
    });
    
    afterEach(function() {
      delete global.mouseX;
      delete global.mouseY;
    });
    
    it('should call updateHover on all hoverable children', function() {
      const child1 = { updateHover: sinon.spy() };
      const child2 = { updateHover: sinon.spy() };
      
      dialog.getHoverableChildren = () => [child1, child2];
      dialog.updateChildHovers();
      
      // Should pass dialog-relative coords (150-100=50, 120-80=40)
      expect(child1.updateHover.calledOnce).to.be.true;
      expect(child1.updateHover.calledWith(50, 40)).to.be.true;
      expect(child2.updateHover.calledOnce).to.be.true;
      expect(child2.updateHover.calledWith(50, 40)).to.be.true;
    });
    
    it('should skip children without updateHover method', function() {
      const child1 = { updateHover: sinon.spy() };
      const child2 = {}; // No updateHover method
      
      dialog.getHoverableChildren = () => [child1, child2];
      
      // Should not throw
      expect(() => dialog.updateChildHovers()).to.not.throw();
      expect(child1.updateHover.calledOnce).to.be.true;
    });
    
    it('should do nothing if mouseX/mouseY undefined', function() {
      delete global.mouseX;
      delete global.mouseY;
      
      const child = { updateHover: sinon.spy() };
      dialog.getHoverableChildren = () => [child];
      dialog.updateChildHovers();
      
      expect(child.updateHover.called).to.be.false;
    });
    
    it('should return empty array by default from getHoverableChildren', function() {
      const children = dialog.getHoverableChildren();
      expect(children).to.be.an('array');
      expect(children).to.be.empty;
    });
  });
  
  describe('getAnimatableChildren()', function() {
    it('should return empty array by default', function() {
      const children = dialog.getAnimatableChildren();
      expect(children).to.be.an('array');
      expect(children).to.be.empty;
    });
  });
  
  describe('render() with animation support', function() {
    it('should call markDirty if any child is focused', function() {
      const child1 = { isFocused: true, isHovered: false };
      const child2 = { isFocused: false, isHovered: false };
      
      dialog.getAnimatableChildren = () => [child1, child2];
      const markDirtySpy = sinon.spy(dialog, 'markDirty');
      
      dialog.render();
      
      expect(markDirtySpy.calledOnce).to.be.true;
    });
    
    it('should call markDirty if any child is hovered', function() {
      const child1 = { isFocused: false, isHovered: true };
      const child2 = { isFocused: false, isHovered: false };
      
      dialog.getAnimatableChildren = () => [child1, child2];
      const markDirtySpy = sinon.spy(dialog, 'markDirty');
      
      dialog.render();
      
      expect(markDirtySpy.calledOnce).to.be.true;
    });
    
    it('should NOT call markDirty if no children focused or hovered', function() {
      const child1 = { isFocused: false, isHovered: false };
      const child2 = { isFocused: false, isHovered: false };
      
      dialog.getAnimatableChildren = () => [child1, child2];
      const markDirtySpy = sinon.spy(dialog, 'markDirty');
      
      dialog.render();
      
      expect(markDirtySpy.called).to.be.false;
    });
    
    it('should handle children without isFocused/isHovered gracefully', function() {
      const child1 = {}; // No properties
      
      dialog.getAnimatableChildren = () => [child1];
      
      // Should not throw
      expect(() => dialog.render()).to.not.throw();
    });
  });
  
  describe('Text Rendering Helpers', function() {
    let mockBuffer;
    
    beforeEach(function() {
      mockBuffer = {
        fill: sinon.stub(),
        textAlign: sinon.stub(),
        textSize: sinon.stub(),
        text: sinon.stub(),
        CENTER: 'center',
        TOP: 'top'
      };
    });
    
    describe('renderInstructionText()', function() {
      it('should render centered instruction text with default styling', function() {
        dialog.renderInstructionText(mockBuffer, 'Test instruction', 200, 50);
        
        expect(mockBuffer.fill.calledWith(200)).to.be.true;
        expect(mockBuffer.textAlign.calledWith('center', 'top')).to.be.true;
        expect(mockBuffer.textSize.calledWith(14)).to.be.true;
        expect(mockBuffer.text.calledWith('Test instruction', 200, 50)).to.be.true;
      });
      
      it('should support custom text size', function() {
        dialog.renderInstructionText(mockBuffer, 'Test', 100, 100, 18);
        
        expect(mockBuffer.textSize.calledWith(18)).to.be.true;
      });
      
      it('should support custom color', function() {
        dialog.renderInstructionText(mockBuffer, 'Test', 100, 100, 14, 255);
        
        expect(mockBuffer.fill.calledWith(255)).to.be.true;
      });
      
      it('should do nothing if buffer is null', function() {
        expect(() => dialog.renderInstructionText(null, 'Test', 100, 100)).to.not.throw();
      });
    });
    
    describe('renderHintText()', function() {
      it('should render centered hint text with default styling', function() {
        dialog.renderHintText(mockBuffer, 'Min: 10, Max: 100', 200, 150);
        
        expect(mockBuffer.fill.calledWith(150)).to.be.true;
        expect(mockBuffer.textAlign.calledWith('center', 'top')).to.be.true;
        expect(mockBuffer.textSize.calledWith(12)).to.be.true;
        expect(mockBuffer.text.calledWith('Min: 10, Max: 100', 200, 150)).to.be.true;
      });
      
      it('should support custom text size', function() {
        dialog.renderHintText(mockBuffer, 'Hint', 100, 100, 10);
        
        expect(mockBuffer.textSize.calledWith(10)).to.be.true;
      });
      
      it('should support custom color', function() {
        dialog.renderHintText(mockBuffer, 'Hint', 100, 100, 12, 100);
        
        expect(mockBuffer.fill.calledWith(100)).to.be.true;
      });
      
      it('should do nothing if buffer is null', function() {
        expect(() => dialog.renderHintText(null, 'Test', 100, 100)).to.not.throw();
      });
    });
  });
  
  describe('Canvas Dimension Helpers', function() {
    beforeEach(function() {
      global.g_canvasX = 1920;
      global.g_canvasY = 1080;
    });
    
    afterEach(function() {
      delete global.g_canvasX;
      delete global.g_canvasY;
    });
    
    describe('getCanvasWidth()', function() {
      it('should return canvas width from global', function() {
        expect(dialog.getCanvasWidth()).to.equal(1920);
      });
      
      it('should return default if global undefined', function() {
        delete global.g_canvasX;
        expect(dialog.getCanvasWidth()).to.equal(1920); // Default fallback
      });
    });
    
    describe('getCanvasHeight()', function() {
      it('should return canvas height from global', function() {
        expect(dialog.getCanvasHeight()).to.equal(1080);
      });
      
      it('should return default if global undefined', function() {
        delete global.g_canvasY;
        expect(dialog.getCanvasHeight()).to.equal(1080); // Default fallback
      });
    });
    
    describe('renderModalOverlay()', function() {
      beforeEach(function() {
        // Mock p5.js drawing functions
        global.push = sinon.stub();
        global.pop = sinon.stub();
        global.fill = sinon.stub();
        global.noStroke = sinon.stub();
        global.rect = sinon.stub();
      });
      
      afterEach(function() {
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.noStroke;
        delete global.rect;
      });
      
      it('should render semi-transparent overlay', function() {
        dialog.renderModalOverlay();
        
        expect(global.push.calledOnce).to.be.true;
        expect(global.fill.calledWith(0, 0, 0, 180)).to.be.true;
        expect(global.noStroke.calledOnce).to.be.true;
        expect(global.rect.calledWith(0, 0, 1920, 1080)).to.be.true;
        expect(global.pop.calledOnce).to.be.true;
      });
      
      it('should support custom opacity', function() {
        dialog.renderModalOverlay(200);
        
        expect(global.fill.calledWith(0, 0, 0, 200)).to.be.true;
      });
    });
  });
});
