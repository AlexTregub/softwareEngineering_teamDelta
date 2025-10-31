/**
 * Toast Notifications - Unit Tests (TDD Red Phase)
 * 
 * Testing toast notification system for user feedback:
 * - Show success messages ("Custom entity saved!")
 * - Show error messages ("Name cannot be empty")
 * - Show info messages ("Entity deleted")
 * - Auto-dismiss after timeout
 * - Stack multiple toasts
 * - Render with appropriate styling
 * - Support for different types (success, error, info, warning)
 * - Click to dismiss manually
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ToastNotification System', function() {
  let clock;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.width = 1920;
    global.height = 1080;
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    
    // Sync window object for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textSize = global.textSize;
      window.textAlign = global.textAlign;
      window.color = global.color;
      window.width = global.width;
      window.height = global.height;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.RIGHT = global.RIGHT;
    }
  });

  afterEach(function() {
    clock.restore();
    sinon.restore();
  });

  describe('ToastNotification Class', function() {
    it('should initialize with default empty queue', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      expect(toast).to.exist;
      expect(toast.toasts).to.be.an('array');
      expect(toast.toasts).to.have.lengthOf(0);
    });

    it('should add toast to queue', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test message', 'success');
      
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].message).to.equal('Test message');
      expect(toast.toasts[0].type).to.equal('success');
    });

    it('should generate unique ID for each toast', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Message 1', 'success');
      toast.show('Message 2', 'error');
      
      expect(toast.toasts[0].id).to.exist;
      expect(toast.toasts[1].id).to.exist;
      expect(toast.toasts[0].id).to.not.equal(toast.toasts[1].id);
    });

    it('should include timestamp in each toast', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'info');
      
      expect(toast.toasts[0].timestamp).to.be.a('number');
      expect(toast.toasts[0].timestamp).to.be.at.least(0);
    });
  });

  describe('Toast Types', function() {
    it('should support success type (green)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Success!', 'success');
      
      expect(toast.toasts[0].type).to.equal('success');
    });

    it('should support error type (red)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Error!', 'error');
      
      expect(toast.toasts[0].type).to.equal('error');
    });

    it('should support info type (blue)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Info', 'info');
      
      expect(toast.toasts[0].type).to.equal('info');
    });

    it('should support warning type (yellow)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Warning!', 'warning');
      
      expect(toast.toasts[0].type).to.equal('warning');
    });

    it('should default to info type if not specified', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Default message');
      
      expect(toast.toasts[0].type).to.equal('info');
    });
  });

  describe('Auto-Dismiss', function() {
    it('should auto-dismiss after default timeout (3000ms)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Auto dismiss', 'success');
      expect(toast.toasts).to.have.lengthOf(1);
      
      clock.tick(3000);
      toast.update();
      
      expect(toast.toasts).to.have.lengthOf(0);
    });

    it('should allow custom timeout duration', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Custom timeout', 'success', 5000);
      expect(toast.toasts).to.have.lengthOf(1);
      
      clock.tick(3000);
      toast.update();
      expect(toast.toasts).to.have.lengthOf(1); // Still visible
      
      clock.tick(2000);
      toast.update();
      expect(toast.toasts).to.have.lengthOf(0); // Now dismissed
    });

    it('should not dismiss before timeout expires', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'info');
      
      clock.tick(2999);
      toast.update();
      
      expect(toast.toasts).to.have.lengthOf(1);
    });

    it('should support persistent toasts (duration: 0)', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Persistent', 'info', 0);
      
      clock.tick(10000);
      toast.update();
      
      expect(toast.toasts).to.have.lengthOf(1); // Still there
    });
  });

  describe('Toast Stacking', function() {
    it('should stack multiple toasts', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'success');
      toast.show('Toast 2', 'error');
      toast.show('Toast 3', 'info');
      
      expect(toast.toasts).to.have.lengthOf(3);
    });

    it('should limit max visible toasts to 5', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      for (let i = 0; i < 10; i++) {
        toast.show(`Toast ${i}`, 'info');
      }
      
      expect(toast.toasts).to.have.lengthOf(5);
    });

    it('should remove oldest toast when exceeding limit', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'info');
      toast.show('Toast 2', 'info');
      toast.show('Toast 3', 'info');
      toast.show('Toast 4', 'info');
      toast.show('Toast 5', 'info');
      toast.show('Toast 6', 'info'); // Should remove Toast 1
      
      expect(toast.toasts).to.have.lengthOf(5);
      expect(toast.toasts[0].message).to.equal('Toast 2');
    });

    it('should dismiss toasts in FIFO order', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('First', 'success', 1000);
      clock.tick(500);
      toast.show('Second', 'success', 1000);
      
      clock.tick(500);
      toast.update();
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].message).to.equal('Second');
    });
  });

  describe('Manual Dismiss', function() {
    it('should dismiss toast by ID', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'info');
      const toastId = toast.toasts[0].id;
      
      toast.dismiss(toastId);
      
      expect(toast.toasts).to.have.lengthOf(0);
    });

    it('should dismiss specific toast from stack', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'info');
      toast.show('Toast 2', 'info');
      toast.show('Toast 3', 'info');
      
      const toastId = toast.toasts[1].id;
      toast.dismiss(toastId);
      
      expect(toast.toasts).to.have.lengthOf(2);
      expect(toast.toasts[0].message).to.equal('Toast 1');
      expect(toast.toasts[1].message).to.equal('Toast 3');
    });

    it('should clear all toasts', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'info');
      toast.show('Toast 2', 'info');
      toast.show('Toast 3', 'info');
      
      toast.clearAll();
      
      expect(toast.toasts).to.have.lengthOf(0);
    });
  });

  describe('Click Handling', function() {
    it('should detect click on toast', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Clickable', 'info');
      const toastData = toast.toasts[0];
      
      // Mock toast position (top-right corner)
      toastData.x = 1720;
      toastData.y = 20;
      toastData.width = 180;
      toastData.height = 60;
      
      const clicked = toast.handleClick(1800, 40);
      
      expect(clicked).to.be.true;
      expect(toast.toasts).to.have.lengthOf(0); // Dismissed
    });

    it('should not dismiss on click outside toast', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Clickable', 'info');
      const toastData = toast.toasts[0];
      
      toastData.x = 1720;
      toastData.y = 20;
      toastData.width = 180;
      toastData.height = 60;
      
      const clicked = toast.handleClick(100, 100);
      
      expect(clicked).to.be.false;
      expect(toast.toasts).to.have.lengthOf(1); // Still there
    });

    it('should detect click on correct toast in stack', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'info');
      toast.show('Toast 2', 'info');
      toast.show('Toast 3', 'info');
      
      // Mock positions
      toast.toasts[0].x = 1720;
      toast.toasts[0].y = 20;
      toast.toasts[0].width = 180;
      toast.toasts[0].height = 60;
      
      toast.toasts[1].x = 1720;
      toast.toasts[1].y = 90; // Below first toast
      toast.toasts[1].width = 180;
      toast.toasts[1].height = 60;
      
      toast.toasts[2].x = 1720;
      toast.toasts[2].y = 160;
      toast.toasts[2].width = 180;
      toast.toasts[2].height = 60;
      
      toast.handleClick(1800, 100); // Click second toast
      
      expect(toast.toasts).to.have.lengthOf(2);
      expect(toast.toasts[0].message).to.equal('Toast 1');
      expect(toast.toasts[1].message).to.equal('Toast 3');
    });
  });

  describe('Rendering', function() {
    it('should render toast with correct styling', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'success');
      toast.render();
      
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
      expect(global.fill.called).to.be.true;
      expect(global.rect.called).to.be.true;
      expect(global.text.called).to.be.true;
    });

    it('should not render when no toasts', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.render();
      
      expect(global.rect.called).to.be.false;
    });

    it('should render multiple toasts stacked vertically', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Toast 1', 'success');
      toast.show('Toast 2', 'error');
      
      toast.render();
      
      expect(global.rect.callCount).to.be.at.least(2);
    });

    it('should apply correct color for success type', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Success', 'success');
      toast.render();
      
      // Check that fill was called with green-ish color
      const fillCalls = global.fill.getCalls();
      const hasGreenFill = fillCalls.some(call => {
        const args = call.args;
        // Looking for RGB where G > R and G > B (greenish)
        return args.length >= 3 && args[1] > args[0] && args[1] > args[2];
      });
      
      expect(hasGreenFill).to.be.true;
    });

    it('should apply correct color for error type', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Error', 'error');
      toast.render();
      
      // Check that fill was called with red-ish color
      const fillCalls = global.fill.getCalls();
      const hasRedFill = fillCalls.some(call => {
        const args = call.args;
        // Looking for RGB where R > G and R > B (reddish)
        return args.length >= 3 && args[0] > args[1] && args[0] > args[2];
      });
      
      expect(hasRedFill).to.be.true;
    });
  });

  describe('Icon Support', function() {
    it('should support icon for success type', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Success', 'success');
      
      expect(toast.toasts[0].icon).to.exist;
      expect(toast.toasts[0].icon).to.be.a('string');
    });

    it('should use checkmark icon for success', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Success', 'success');
      
      expect(toast.toasts[0].icon).to.match(/✓|✔|✅/);
    });

    it('should use X icon for error', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Error', 'error');
      
      expect(toast.toasts[0].icon).to.match(/✗|✘|❌|⚠/);
    });

    it('should use info icon for info type', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Info', 'info');
      
      expect(toast.toasts[0].icon).to.match(/ℹ|ⓘ|💡/);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty message', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('', 'info');
      
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].message).to.equal('');
    });

    it('should handle very long message', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      const longMessage = 'A'.repeat(200);
      toast.show(longMessage, 'info');
      
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].message).to.have.lengthOf(200);
    });

    it('should handle invalid type gracefully', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'invalid-type');
      
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].type).to.equal('info'); // Default fallback
    });

    it('should handle negative duration', function() {
      const ToastNotification = require('../../../Classes/ui/ToastNotification');
      const toast = new ToastNotification();
      
      toast.show('Test', 'info', -1000);
      
      expect(toast.toasts).to.have.lengthOf(1);
      expect(toast.toasts[0].duration).to.equal(3000); // Default fallback
    });
  });
});
