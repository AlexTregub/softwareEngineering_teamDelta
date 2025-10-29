/**
 * Unit Tests: ScrollIndicator Component (TDD - Phase 1A)
 * 
 * Tests reusable scroll indicator for showing scroll state (top/bottom arrows).
 * Visual feedback for scrollable content overflow.
 * 
 * TDD: Write FIRST before implementation exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ScrollIndicator', function() {
  let indicator, mockP5;
  
  beforeEach(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      fill: sinon.stub(),
      noStroke: sinon.stub(),
      stroke: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      push: sinon.stub(),
      pop: sinon.stub(),
      CENTER: 'CENTER'
    };
    
    global.fill = mockP5.fill;
    global.noStroke = mockP5.noStroke;
    global.stroke = mockP5.stroke;
    global.rect = mockP5.rect;
    global.text = mockP5.text;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.CENTER = mockP5.CENTER;
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.push = global.push;
      window.pop = global.pop;
      window.CENTER = global.CENTER;
    }
    
    // ScrollIndicator doesn't exist yet - tests will fail (EXPECTED)
    const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    indicator = new ScrollIndicator();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default height', function() {
      expect(indicator.height).to.equal(20);
    });
    
    it('should initialize with default backgroundColor', function() {
      expect(indicator.backgroundColor).to.deep.equal([60, 60, 60]);
    });
    
    it('should initialize with default arrowColor', function() {
      expect(indicator.arrowColor).to.deep.equal([200, 200, 200]);
    });
    
    it('should initialize with default hoverColor', function() {
      expect(indicator.hoverColor).to.deep.equal([255, 255, 255]);
    });
    
    it('should initialize with default fontSize', function() {
      expect(indicator.fontSize).to.equal(14);
    });
    
    it('should initialize with default fadeEnabled', function() {
      expect(indicator.fadeEnabled).to.equal(true);
    });
    
    it('should accept custom height option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      expect(customIndicator.height).to.equal(30);
    });
    
    it('should accept custom backgroundColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ backgroundColor: [100, 100, 100] });
      expect(customIndicator.backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should accept custom arrowColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ arrowColor: [255, 0, 0] });
      expect(customIndicator.arrowColor).to.deep.equal([255, 0, 0]);
    });
    
    it('should accept custom hoverColor option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ hoverColor: [0, 255, 0] });
      expect(customIndicator.hoverColor).to.deep.equal([0, 255, 0]);
    });
    
    it('should accept custom fontSize option', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ fontSize: 18 });
      expect(customIndicator.fontSize).to.equal(18);
    });
    
    it('should accept custom fadeEnabled option (false)', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ fadeEnabled: false });
      expect(customIndicator.fadeEnabled).to.equal(false);
    });
  });
  
  describe('canScrollUp()', function() {
    it('should return false when scrollOffset is 0', function() {
      expect(indicator.canScrollUp(0)).to.be.false;
    });
    
    it('should return true when scrollOffset is greater than 0', function() {
      expect(indicator.canScrollUp(10)).to.be.true;
      expect(indicator.canScrollUp(100)).to.be.true;
      expect(indicator.canScrollUp(1)).to.be.true;
    });
    
    it('should return false when scrollOffset is negative (edge case)', function() {
      expect(indicator.canScrollUp(-5)).to.be.false;
    });
  });
  
  describe('canScrollDown()', function() {
    it('should return false when scrollOffset equals maxScrollOffset', function() {
      expect(indicator.canScrollDown(100, 100)).to.be.false;
    });
    
    it('should return false when maxScrollOffset is 0 (no scrolling)', function() {
      expect(indicator.canScrollDown(0, 0)).to.be.false;
    });
    
    it('should return true when scrollOffset is less than maxScrollOffset', function() {
      expect(indicator.canScrollDown(0, 100)).to.be.true;
      expect(indicator.canScrollDown(50, 100)).to.be.true;
      expect(indicator.canScrollDown(99, 100)).to.be.true;
    });
    
    it('should return false when scrollOffset is greater than maxScrollOffset (edge case)', function() {
      expect(indicator.canScrollDown(150, 100)).to.be.false;
    });
    
    it('should return false when maxScrollOffset is negative (edge case)', function() {
      expect(indicator.canScrollDown(0, -10)).to.be.false;
    });
  });
  
  describe('renderTop()', function() {
    it('should not render when cannot scroll up (scrollOffset = 0)', function() {
      indicator.renderTop(10, 20, 300, 0, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should render background rect when can scroll up', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.rect.calledOnce).to.be.true;
      expect(mockP5.rect.calledWith(10, 20, 300, 20)).to.be.true;
    });
    
    it('should render up arrow when can scroll up', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↑', 160, 30)).to.be.true; // x + width/2, y + height/2
    });
    
    it('should apply backgroundColor for background', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      // Should call fill with backgroundColor before rect
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(1);
      expect(fillCalls[0].calledWith([60, 60, 60])).to.be.true;
    });
    
    it('should apply arrowColor when not hovered', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([200, 200, 200])).to.be.true;
    });
    
    it('should apply hoverColor when hovered', function() {
      indicator.renderTop(10, 20, 300, 50, true);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([255, 255, 255])).to.be.true;
    });
    
    it('should call push and pop for state isolation', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
    });
    
    it('should set textAlign to CENTER', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.textAlign.calledWith('CENTER', 'CENTER')).to.be.true;
    });
    
    it('should set textSize to fontSize', function() {
      indicator.renderTop(10, 20, 300, 50, false);
      
      expect(mockP5.textSize.calledWith(14)).to.be.true;
    });
  });
  
  describe('renderBottom()', function() {
    it('should not render when cannot scroll down (scrollOffset = maxScrollOffset)', function() {
      indicator.renderBottom(10, 20, 300, 100, 100, false);
      
      expect(mockP5.push.called).to.be.false;
      expect(mockP5.rect.called).to.be.false;
      expect(mockP5.text.called).to.be.false;
    });
    
    it('should render background rect when can scroll down', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.rect.calledOnce).to.be.true;
      expect(mockP5.rect.calledWith(10, 20, 300, 20)).to.be.true;
    });
    
    it('should render down arrow when can scroll down', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.text.calledOnce).to.be.true;
      expect(mockP5.text.calledWith('↓', 160, 30)).to.be.true; // x + width/2, y + height/2
    });
    
    it('should apply backgroundColor for background', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(1);
      expect(fillCalls[0].calledWith([60, 60, 60])).to.be.true;
    });
    
    it('should apply arrowColor when not hovered', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([200, 200, 200])).to.be.true;
    });
    
    it('should apply hoverColor when hovered', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, true);
      
      const fillCalls = mockP5.fill.getCalls();
      expect(fillCalls.length).to.be.gte(2);
      expect(fillCalls[1].calledWith([255, 255, 255])).to.be.true;
    });
    
    it('should call push and pop for state isolation', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.push.calledOnce).to.be.true;
      expect(mockP5.pop.calledOnce).to.be.true;
    });
    
    it('should set textAlign to CENTER', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.textAlign.calledWith('CENTER', 'CENTER')).to.be.true;
    });
    
    it('should set textSize to fontSize', function() {
      indicator.renderBottom(10, 20, 300, 50, 100, false);
      
      expect(mockP5.textSize.calledWith(14)).to.be.true;
    });
  });
  
  describe('containsPointTop()', function() {
    it('should return true when point is inside top indicator', function() {
      const result = indicator.containsPointTop(100, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return false when point is to the left of indicator', function() {
      const result = indicator.containsPointTop(40, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is to the right of indicator', function() {
      const result = indicator.containsPointTop(260, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is above indicator', function() {
      const result = indicator.containsPointTop(100, 10, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is below indicator', function() {
      const result = indicator.containsPointTop(100, 50, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return true when point is on left edge (boundary)', function() {
      const result = indicator.containsPointTop(50, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on right edge (boundary)', function() {
      const result = indicator.containsPointTop(250, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on top edge (boundary)', function() {
      const result = indicator.containsPointTop(100, 20, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return true when point is on bottom edge (boundary)', function() {
      const result = indicator.containsPointTop(100, 40, 50, 20, 200);
      expect(result).to.be.true;
    });
  });
  
  describe('containsPointBottom()', function() {
    it('should return true when point is inside bottom indicator', function() {
      const result = indicator.containsPointBottom(100, 30, 50, 20, 200);
      expect(result).to.be.true;
    });
    
    it('should return false when point is to the left of indicator', function() {
      const result = indicator.containsPointBottom(40, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is to the right of indicator', function() {
      const result = indicator.containsPointBottom(260, 30, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is above indicator', function() {
      const result = indicator.containsPointBottom(100, 10, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return false when point is below indicator', function() {
      const result = indicator.containsPointBottom(100, 50, 50, 20, 200);
      expect(result).to.be.false;
    });
    
    it('should return true when point is on boundaries', function() {
      expect(indicator.containsPointBottom(50, 30, 50, 20, 200)).to.be.true; // left edge
      expect(indicator.containsPointBottom(250, 30, 50, 20, 200)).to.be.true; // right edge
      expect(indicator.containsPointBottom(100, 20, 50, 20, 200)).to.be.true; // top edge
      expect(indicator.containsPointBottom(100, 40, 50, 20, 200)).to.be.true; // bottom edge
    });
  });
  
  describe('getTotalHeight()', function() {
    it('should return 0 when cannot scroll (scrollOffset = 0, maxScrollOffset = 0)', function() {
      const height = indicator.getTotalHeight(0, 0);
      expect(height).to.equal(0);
    });
    
    it('should return height when can only scroll up (at bottom)', function() {
      const height = indicator.getTotalHeight(100, 100);
      expect(height).to.equal(20);
    });
    
    it('should return height when can only scroll down (at top)', function() {
      const height = indicator.getTotalHeight(0, 100);
      expect(height).to.equal(20);
    });
    
    it('should return double height when can scroll both directions', function() {
      const height = indicator.getTotalHeight(50, 100);
      expect(height).to.equal(40);
    });
    
    it('should return 0 when scrollOffset is negative and maxScrollOffset is 0 (edge case)', function() {
      const height = indicator.getTotalHeight(-10, 0);
      expect(height).to.equal(0);
    });
    
    it('should account for custom height setting', function() {
      const ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
      const customIndicator = new ScrollIndicator({ height: 30 });
      
      const height = customIndicator.getTotalHeight(50, 100);
      expect(height).to.equal(60); // 30 * 2 (both arrows)
    });
  });
});
