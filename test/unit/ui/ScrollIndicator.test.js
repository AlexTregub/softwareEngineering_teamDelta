/**
 * Unit Tests for ScrollIndicator Component
 * 
 * Tests the reusable scroll indicator component that displays
 * up/down arrows for scrollable content.
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('ScrollIndicator Component', function() {
  let ScrollIndicator;
  let indicator;
  let sandbox;
  
  // Mock p5.js functions
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js drawing functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      CENTER: 'CENTER'
    };
    
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.CENTER = mockP5.CENTER;
    
    // Load ScrollIndicator class
    delete require.cache[require.resolve('../../../Classes/ui/ScrollIndicator')];
    ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
  });
  
  afterEach(function() {
    sandbox.restore();
    delete global.window;
    delete global.document;
    delete global.push;
    delete global.pop;
    delete global.fill;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.CENTER;
  });
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      indicator = new ScrollIndicator();
      
      expect(indicator.height).to.equal(20);
      expect(indicator.backgroundColor).to.deep.equal([60, 60, 60]);
      expect(indicator.arrowColor).to.deep.equal([200, 200, 200]);
      expect(indicator.hoverColor).to.deep.equal([255, 255, 255]);
      expect(indicator.fontSize).to.equal(14);
      expect(indicator.fadeEnabled).to.be.true;
    });
    
    it('should accept custom options', function() {
      indicator = new ScrollIndicator({
        height: 25,
        backgroundColor: [100, 100, 100],
        arrowColor: [150, 150, 150],
        hoverColor: [200, 200, 200],
        fontSize: 16,
        fadeEnabled: false
      });
      
      expect(indicator.height).to.equal(25);
      expect(indicator.backgroundColor).to.deep.equal([100, 100, 100]);
      expect(indicator.arrowColor).to.deep.equal([150, 150, 150]);
      expect(indicator.hoverColor).to.deep.equal([200, 200, 200]);
      expect(indicator.fontSize).to.equal(16);
      expect(indicator.fadeEnabled).to.be.false;
    });
  });
  
  describe('canScrollUp()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator();
    });
    
    it('should return false when scrollOffset is 0', function() {
      expect(indicator.canScrollUp(0)).to.be.false;
    });
    
    it('should return true when scrollOffset is greater than 0', function() {
      expect(indicator.canScrollUp(1)).to.be.true;
      expect(indicator.canScrollUp(50)).to.be.true;
      expect(indicator.canScrollUp(100)).to.be.true;
    });
    
    it('should return false when scrollOffset is negative', function() {
      expect(indicator.canScrollUp(-1)).to.be.false;
      expect(indicator.canScrollUp(-10)).to.be.false;
    });
  });
  
  describe('canScrollDown()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator();
    });
    
    it('should return false when scrollOffset equals maxScrollOffset', function() {
      expect(indicator.canScrollDown(100, 100)).to.be.false;
    });
    
    it('should return false when scrollOffset exceeds maxScrollOffset', function() {
      expect(indicator.canScrollDown(150, 100)).to.be.false;
    });
    
    it('should return true when scrollOffset is less than maxScrollOffset', function() {
      expect(indicator.canScrollDown(0, 100)).to.be.true;
      expect(indicator.canScrollDown(50, 100)).to.be.true;
      expect(indicator.canScrollDown(99, 100)).to.be.true;
    });
    
    it('should return false when maxScrollOffset is 0', function() {
      expect(indicator.canScrollDown(0, 0)).to.be.false;
    });
    
    it('should return false when maxScrollOffset is negative', function() {
      expect(indicator.canScrollDown(0, -10)).to.be.false;
    });
  });
  
  describe('getTotalHeight()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator({ height: 20 });
    });
    
    it('should return 0 when no scrolling is possible', function() {
      const height = indicator.getTotalHeight(0, 0);
      expect(height).to.equal(0);
    });
    
    it('should return indicator height when can only scroll down', function() {
      const height = indicator.getTotalHeight(0, 100);
      expect(height).to.equal(20);
    });
    
    it('should return indicator height when can only scroll up', function() {
      const height = indicator.getTotalHeight(100, 100);
      expect(height).to.equal(20);
    });
    
    it('should return double indicator height when can scroll both directions', function() {
      const height = indicator.getTotalHeight(50, 100);
      expect(height).to.equal(40);
    });
  });
  
  describe('renderTop()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator();
    });
    
    it('should not render when cannot scroll up', function() {
      indicator.renderTop(10, 10, 200, 0, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
    });
    
    it('should render when can scroll up', function() {
      indicator.renderTop(10, 10, 200, 50, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
      expect(mockP5.fill.called).to.be.true;
      expect(mockP5.rect.calledWith(10, 10, 200, 20)).to.be.true;
      expect(mockP5.text.calledWith('↑')).to.be.true;
    });
    
    it('should use hover color when hovered', function() {
      indicator.renderTop(10, 10, 200, 50, true);
      
      // Check that hover color was used (255, 255, 255)
      const fillCalls = mockP5.fill.getCalls();
      const colorCalls = fillCalls.filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 255
      );
      expect(colorCalls.length).to.be.greaterThan(0);
    });
    
    it('should use normal arrow color when not hovered', function() {
      indicator.renderTop(10, 10, 200, 50, false);
      
      // Check that normal color was used (200, 200, 200)
      const fillCalls = mockP5.fill.getCalls();
      const colorCalls = fillCalls.filter(call => 
        call.args[0] === 200 && call.args[1] === 200 && call.args[2] === 200
      );
      expect(colorCalls.length).to.be.greaterThan(0);
    });
  });
  
  describe('renderBottom()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator();
    });
    
    it('should not render when cannot scroll down', function() {
      indicator.renderBottom(10, 10, 200, 100, 100, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
    });
    
    it('should render when can scroll down', function() {
      indicator.renderBottom(10, 10, 200, 50, 100, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
      expect(mockP5.fill.called).to.be.true;
      expect(mockP5.rect.calledWith(10, 10, 200, 20)).to.be.true;
      expect(mockP5.text.calledWith('↓')).to.be.true;
    });
    
    it('should use hover color when hovered', function() {
      indicator.renderBottom(10, 10, 200, 50, 100, true);
      
      // Check that hover color was used
      const fillCalls = mockP5.fill.getCalls();
      const colorCalls = fillCalls.filter(call => 
        call.args[0] === 255 && call.args[1] === 255 && call.args[2] === 255
      );
      expect(colorCalls.length).to.be.greaterThan(0);
    });
  });
  
  describe('containsPointTop()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator({ height: 20 });
    });
    
    it('should return true when point is inside top indicator', function() {
      expect(indicator.containsPointTop(50, 15, 10, 10, 100)).to.be.true;
      expect(indicator.containsPointTop(10, 10, 10, 10, 100)).to.be.true; // Top-left corner
      expect(indicator.containsPointTop(110, 30, 10, 10, 100)).to.be.true; // Bottom-right corner
    });
    
    it('should return false when point is outside top indicator', function() {
      expect(indicator.containsPointTop(5, 15, 10, 10, 100)).to.be.false; // Left of bounds
      expect(indicator.containsPointTop(115, 15, 10, 10, 100)).to.be.false; // Right of bounds
      expect(indicator.containsPointTop(50, 5, 10, 10, 100)).to.be.false; // Above bounds
      expect(indicator.containsPointTop(50, 35, 10, 10, 100)).to.be.false; // Below bounds
    });
  });
  
  describe('containsPointBottom()', function() {
    beforeEach(function() {
      indicator = new ScrollIndicator({ height: 20 });
    });
    
    it('should return true when point is inside bottom indicator', function() {
      expect(indicator.containsPointBottom(50, 15, 10, 10, 100)).to.be.true;
      expect(indicator.containsPointBottom(10, 10, 10, 10, 100)).to.be.true;
      expect(indicator.containsPointBottom(110, 30, 10, 10, 100)).to.be.true;
    });
    
    it('should return false when point is outside bottom indicator', function() {
      expect(indicator.containsPointBottom(5, 15, 10, 10, 100)).to.be.false;
      expect(indicator.containsPointBottom(115, 15, 10, 10, 100)).to.be.false;
      expect(indicator.containsPointBottom(50, 5, 10, 10, 100)).to.be.false;
      expect(indicator.containsPointBottom(50, 35, 10, 10, 100)).to.be.false;
    });
  });
  
  describe('Custom height', function() {
    it('should use custom height in calculations', function() {
      indicator = new ScrollIndicator({ height: 30 });
      
      const totalHeight = indicator.getTotalHeight(50, 100);
      expect(totalHeight).to.equal(60); // 30 * 2
    });
    
    it('should use custom height in hit testing', function() {
      indicator = new ScrollIndicator({ height: 25 });
      
      // Point at y=24 should be inside (height is 25, y from 0 to 25 inclusive)
      expect(indicator.containsPointTop(50, 24, 10, 0, 100)).to.be.true;
      
      // Point at y=25 should be inside (at the bottom edge, inclusive)
      expect(indicator.containsPointTop(50, 25, 10, 0, 100)).to.be.true;
      
      // Point at y=26 should be outside
      expect(indicator.containsPointTop(50, 26, 10, 0, 100)).to.be.false;
    });
  });
});
