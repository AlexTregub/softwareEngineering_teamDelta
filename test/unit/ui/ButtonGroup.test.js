/**
 * Unit tests for ButtonGroup component
 * 
 * Tests button group management (positioning, styling, click handling).
 * These tests are written FIRST (TDD) before implementing the feature.
 * 
 * Run: npx mocha "test/unit/ui/ButtonGroup.test.js"
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js constants
global.CORNER = 'corner';
global.CENTER = 'center';
global.LEFT = 'left';

// Mock CollisionBox2D
class CollisionBox2D {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  contains(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
  
  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

global.CollisionBox2D = CollisionBox2D;

// Create window global for browser-style code
if (typeof window === 'undefined') {
  global.window = global;
}
window.CollisionBox2D = CollisionBox2D;

// Mock Button class (simplified for testing)
class Button {
  constructor(x, y, width, height, caption, styles = {}) {
    this.bounds = new CollisionBox2D(x, y, width, height);
    this.caption = caption; // Real Button uses 'caption', not 'label'
    this.styles = styles;
    this.enabled = true;
    this.callback = null;
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  
  renderToBuffer(buffer) {
    // Mock rendering
  }
}

global.Button = Button;
window.Button = Button;

// Mock ButtonStyles
global.ButtonStyles = {
  CANCEL: {
    backgroundColor: '#969696',
    hoverColor: '#787878',
    textColor: '#FFFFFF'
  },
  PRIMARY: {
    backgroundColor: '#228B22',
    hoverColor: '#1a6b1a',
    textColor: '#FFFFFF'
  },
  DANGER: {
    backgroundColor: '#DC143C',
    hoverColor: '#B22222',
    textColor: '#FFFFFF'
  }
};
window.ButtonStyles = global.ButtonStyles;

// Load ButtonGroup (will fail until we create it)
let ButtonGroup;
try {
  ButtonGroup = require('../../../Classes/ui/UIComponents/ButtonGroup.js');
} catch (e) {
  // Expected to fail initially (TDD)
}

describe('ButtonGroup Component', function() {
  let buttonGroup;
  let mockBuffer;
  
  beforeEach(function() {
    // Skip if ButtonGroup not loaded yet
    if (!ButtonGroup) {
      this.skip();
      return;
    }
    
    // Create mock buffer
    mockBuffer = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      stroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      noStroke: sinon.stub()
    };
  });
  
  describe('Constructor', function() {
    it('should create empty button group', function() {
      buttonGroup = new ButtonGroup();
      expect(buttonGroup).to.exist;
      expect(buttonGroup.buttons).to.be.an('array');
      expect(buttonGroup.buttons.length).to.equal(0);
    });
    
    it('should set horizontal orientation by default', function() {
      buttonGroup = new ButtonGroup();
      expect(buttonGroup.orientation).to.equal('horizontal');
    });
    
    it('should accept vertical orientation', function() {
      buttonGroup = new ButtonGroup({ orientation: 'vertical' });
      expect(buttonGroup.orientation).to.equal('vertical');
    });
    
    it('should set default spacing', function() {
      buttonGroup = new ButtonGroup();
      expect(buttonGroup.spacing).to.be.a('number');
      expect(buttonGroup.spacing).to.be.greaterThan(0);
    });
    
    it('should accept custom spacing', function() {
      buttonGroup = new ButtonGroup({ spacing: 20 });
      expect(buttonGroup.spacing).to.equal(20);
    });
    
    it('should set default alignment', function() {
      buttonGroup = new ButtonGroup();
      expect(buttonGroup.alignment).to.be.a('string');
    });
    
    it('should accept custom alignment', function() {
      buttonGroup = new ButtonGroup({ alignment: 'top-center' });
      expect(buttonGroup.alignment).to.equal('top-center');
    });
    
    it('should store parent dimensions', function() {
      buttonGroup = new ButtonGroup({ parentWidth: 400, parentHeight: 300 });
      expect(buttonGroup.parentWidth).to.equal(400);
      expect(buttonGroup.parentHeight).to.equal(300);
    });
  });
  
  describe('addButton()', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        parentWidth: 400,
        parentHeight: 300
      });
    });
    
    it('should add button to group', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(buttonGroup.buttons.length).to.equal(1);
    });
    
    it('should create Button instance', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(buttonGroup.buttons[0]).to.be.instanceOf(Button);
    });
    
    it('should set button label', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(buttonGroup.buttons[0].caption).to.equal('OK');
    });
    
    it('should apply primary style', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(buttonGroup.buttons[0].styles.backgroundColor).to.equal('#228B22');
    });
    
    it('should apply cancel style', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      expect(buttonGroup.buttons[0].styles.backgroundColor).to.equal('#969696');
    });
    
    it('should apply danger style', function() {
      buttonGroup.addButton('Delete', 'danger', () => {});
      expect(buttonGroup.buttons[0].styles.backgroundColor).to.equal('#DC143C');
    });
    
    it('should store callback', function() {
      const callback = sinon.spy();
      buttonGroup.addButton('OK', 'primary', callback);
      expect(buttonGroup.buttons[0].callback).to.equal(callback);
    });
    
    it('should add multiple buttons', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(buttonGroup.buttons.length).to.equal(2);
    });
  });
  
  describe('Button Positioning - Horizontal', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        orientation: 'horizontal',
        spacing: 10,
        parentWidth: 400,
        parentHeight: 300,
        alignment: 'bottom-center'
      });
    });
    
    it('should position buttons horizontally', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      // Second button should be to the right of first
      expect(btn2.bounds.x).to.be.greaterThan(btn1.bounds.x);
    });
    
    it('should space buttons correctly', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      const gap = btn2.bounds.x - (btn1.bounds.x + btn1.bounds.width);
      expect(gap).to.equal(buttonGroup.spacing);
    });
    
    it('should align buttons vertically at same Y', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      expect(btn1.bounds.y).to.equal(btn2.bounds.y);
    });
  });
  
  describe('Button Positioning - Vertical', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        orientation: 'vertical',
        spacing: 10,
        parentWidth: 400,
        parentHeight: 300
      });
    });
    
    it('should position buttons vertically', function() {
      buttonGroup.addButton('Option 1', 'primary', () => {});
      buttonGroup.addButton('Option 2', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      // Second button should be below first
      expect(btn2.bounds.y).to.be.greaterThan(btn1.bounds.y);
    });
    
    it('should space buttons correctly vertically', function() {
      buttonGroup.addButton('Option 1', 'primary', () => {});
      buttonGroup.addButton('Option 2', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      const gap = btn2.bounds.y - (btn1.bounds.y + btn1.bounds.height);
      expect(gap).to.equal(buttonGroup.spacing);
    });
  });
  
  describe('Alignment - Bottom Center', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        orientation: 'horizontal',
        spacing: 10,
        parentWidth: 400,
        parentHeight: 300,
        alignment: 'bottom-center'
      });
    });
    
    it('should center buttons horizontally', function() {
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn1 = buttonGroup.buttons[0];
      const btn2 = buttonGroup.buttons[1];
      
      const totalWidth = btn1.bounds.width + buttonGroup.spacing + btn2.bounds.width;
      const groupCenterX = btn1.bounds.x + totalWidth / 2;
      const parentCenterX = buttonGroup.parentWidth / 2;
      
      // Group should be centered (allow 1px tolerance)
      expect(Math.abs(groupCenterX - parentCenterX)).to.be.lessThan(2);
    });
    
    it('should position buttons near bottom', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn = buttonGroup.buttons[0];
      
      // Should be in bottom area (last 100px)
      expect(btn.bounds.y).to.be.greaterThan(buttonGroup.parentHeight - 100);
    });
  });
  
  describe('renderToBuffer()', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        parentWidth: 400,
        parentHeight: 300
      });
    });
    
    it('should render all buttons', function() {
      const renderSpy1 = sinon.spy();
      const renderSpy2 = sinon.spy();
      
      buttonGroup.addButton('Cancel', 'cancel', () => {});
      buttonGroup.addButton('OK', 'primary', () => {});
      
      // Replace renderToBuffer with spy
      buttonGroup.buttons[0].renderToBuffer = renderSpy1;
      buttonGroup.buttons[1].renderToBuffer = renderSpy2;
      
      buttonGroup.renderToBuffer(mockBuffer);
      
      expect(renderSpy1.calledOnce).to.be.true;
      expect(renderSpy2.calledOnce).to.be.true;
    });
    
    it('should pass buffer to button render', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const renderSpy = sinon.spy();
      buttonGroup.buttons[0].renderToBuffer = renderSpy;
      
      buttonGroup.renderToBuffer(mockBuffer);
      
      expect(renderSpy.calledWith(mockBuffer)).to.be.true;
    });
    
    it('should handle null buffer gracefully', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(() => buttonGroup.renderToBuffer(null)).to.not.throw();
    });
  });
  
  describe('handleClick()', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup({
        parentWidth: 400,
        parentHeight: 300
      });
    });
    
    it('should call callback when button clicked', function() {
      const callback = sinon.spy();
      buttonGroup.addButton('OK', 'primary', callback);
      
      const btn = buttonGroup.buttons[0];
      const clickX = btn.bounds.x + 5;
      const clickY = btn.bounds.y + 5;
      
      buttonGroup.handleClick(clickX, clickY);
      
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should return true when button clicked', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const btn = buttonGroup.buttons[0];
      const clickX = btn.bounds.x + 5;
      const clickY = btn.bounds.y + 5;
      
      const result = buttonGroup.handleClick(clickX, clickY);
      expect(result).to.be.true;
    });
    
    it('should return false when clicking outside buttons', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      
      const result = buttonGroup.handleClick(9999, 9999);
      expect(result).to.be.false;
    });
    
    it('should call correct callback for multiple buttons', function() {
      const callback1 = sinon.spy();
      const callback2 = sinon.spy();
      
      buttonGroup.addButton('Cancel', 'cancel', callback1);
      buttonGroup.addButton('OK', 'primary', callback2);
      
      const btn2 = buttonGroup.buttons[1];
      const clickX = btn2.bounds.x + 5;
      const clickY = btn2.bounds.y + 5;
      
      buttonGroup.handleClick(clickX, clickY);
      
      expect(callback1.called).to.be.false;
      expect(callback2.calledOnce).to.be.true;
    });
  });
  
  describe('setButtonEnabled()', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup();
    });
    
    it('should enable button by label', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      buttonGroup.setButtonEnabled('OK', true);
      expect(buttonGroup.buttons[0].enabled).to.be.true;
    });
    
    it('should disable button by label', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      buttonGroup.setButtonEnabled('OK', false);
      expect(buttonGroup.buttons[0].enabled).to.be.false;
    });
    
    it('should handle non-existent button gracefully', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      expect(() => buttonGroup.setButtonEnabled('Cancel', false)).to.not.throw();
    });
  });
  
  describe('getButton()', function() {
    beforeEach(function() {
      buttonGroup = new ButtonGroup();
    });
    
    it('should return button by label', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      const button = buttonGroup.getButton('OK');
      expect(button).to.exist;
      expect(button.caption).to.equal('OK');
    });
    
    it('should return undefined for non-existent button', function() {
      buttonGroup.addButton('OK', 'primary', () => {});
      const button = buttonGroup.getButton('Cancel');
      expect(button).to.be.undefined;
    });
  });
});
