/**
 * Unit Tests: ScrollableContentArea Component (TDD - Phase 1A)
 * 
 * Tests reusable scrollable content container with viewport culling.
 * High-performance scrollable content rendering with item management.
 * 
 * TDD: Write FIRST before implementation exists!
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('ScrollableContentArea', function() {
  let contentArea, mockP5, mockScrollIndicator;
  
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
      LEFT: 'LEFT',
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
    global.LEFT = mockP5.LEFT;
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
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
    }
    
    // Mock ScrollIndicator
    mockScrollIndicator = {
      height: 20,
      canScrollUp: sinon.stub(),
      canScrollDown: sinon.stub(),
      renderTop: sinon.stub(),
      renderBottom: sinon.stub(),
      getTotalHeight: sinon.stub()
    };
    
    // Mock ScrollIndicator constructor
    global.ScrollIndicator = sinon.stub().returns(mockScrollIndicator);
    if (typeof window !== 'undefined') {
      window.ScrollIndicator = global.ScrollIndicator;
    }
    
    // ScrollableContentArea doesn't exist yet - tests will fail (EXPECTED)
    const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
    contentArea = new ScrollableContentArea();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with default width', function() {
      expect(contentArea.width).to.equal(200);
    });
    
    it('should initialize with default height', function() {
      expect(contentArea.height).to.equal(400);
    });
    
    it('should initialize with default scrollOffset', function() {
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should initialize with default maxScrollOffset', function() {
      expect(contentArea.maxScrollOffset).to.equal(0);
    });
    
    it('should initialize with default scrollSpeed', function() {
      expect(contentArea.scrollSpeed).to.equal(20);
    });
    
    it('should initialize with empty contentItems array', function() {
      expect(contentArea.contentItems).to.be.an('array').with.lengthOf(0);
    });
    
    it('should initialize with default itemPadding', function() {
      expect(contentArea.itemPadding).to.equal(5);
    });
    
    it('should initialize with default backgroundColor', function() {
      expect(contentArea.backgroundColor).to.deep.equal([50, 50, 50]);
    });
    
    it('should initialize with default textColor', function() {
      expect(contentArea.textColor).to.deep.equal([220, 220, 220]);
    });
    
    it('should create ScrollIndicator instance', function() {
      expect(global.ScrollIndicator.calledOnce).to.be.true;
      expect(contentArea.scrollIndicator).to.equal(mockScrollIndicator);
    });
    
    it('should accept custom width option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ width: 300 });
      expect(custom.width).to.equal(300);
    });
    
    it('should accept custom height option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ height: 600 });
      expect(custom.height).to.equal(600);
    });
    
    it('should accept custom scrollSpeed option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ scrollSpeed: 30 });
      expect(custom.scrollSpeed).to.equal(30);
    });
    
    it('should accept custom backgroundColor option', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const custom = new ScrollableContentArea({ backgroundColor: [100, 100, 100] });
      expect(custom.backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should accept onItemClick callback', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const callback = sinon.stub();
      const custom = new ScrollableContentArea({ onItemClick: callback });
      expect(custom.onItemClick).to.equal(callback);
    });
    
    it('should accept onScroll callback', function() {
      const ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
      const callback = sinon.stub();
      const custom = new ScrollableContentArea({ onScroll: callback });
      expect(custom.onScroll).to.equal(callback);
    });
  });
  
  describe('addText()', function() {
    it('should add text item to contentItems', function() {
      contentArea.addText('text1', 'Hello World');
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('text1');
      expect(contentArea.contentItems[0].type).to.equal('text');
      expect(contentArea.contentItems[0].text).to.equal('Hello World');
    });
    
    it('should use default height for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].height).to.equal(25);
    });
    
    it('should use custom height if provided', function() {
      contentArea.addText('text1', 'Hello', { height: 40 });
      
      expect(contentArea.contentItems[0].height).to.equal(40);
    });
    
    it('should use default fontSize for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].fontSize).to.equal(12);
    });
    
    it('should use custom fontSize if provided', function() {
      contentArea.addText('text1', 'Hello', { fontSize: 16 });
      
      expect(contentArea.contentItems[0].fontSize).to.equal(16);
    });
    
    it('should use default color for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].color).to.deep.equal([220, 220, 220]);
    });
    
    it('should use custom color if provided', function() {
      contentArea.addText('text1', 'Hello', { color: [255, 0, 0] });
      
      expect(contentArea.contentItems[0].color).to.deep.equal([255, 0, 0]);
    });
    
    it('should create render function for text item', function() {
      contentArea.addText('text1', 'Hello');
      
      expect(contentArea.contentItems[0].render).to.be.a('function');
    });
    
    it('should return the created item', function() {
      const item = contentArea.addText('text1', 'Hello');
      
      expect(item.id).to.equal('text1');
      expect(item.type).to.equal('text');
    });
  });
  
  describe('addButton()', function() {
    it('should add button item to contentItems', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('btn1');
      expect(contentArea.contentItems[0].type).to.equal('button');
      expect(contentArea.contentItems[0].label).to.equal('Click Me');
    });
    
    it('should use default height for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].height).to.equal(30);
    });
    
    it('should use custom height if provided', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub(), { height: 40 });
      
      expect(contentArea.contentItems[0].height).to.equal(40);
    });
    
    it('should store click callback', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click', callback);
      
      expect(contentArea.contentItems[0].clickCallback).to.equal(callback);
    });
    
    it('should use default backgroundColor', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].backgroundColor).to.deep.equal([70, 130, 180]);
    });
    
    it('should use custom backgroundColor if provided', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub(), { backgroundColor: [100, 100, 100] });
      
      expect(contentArea.contentItems[0].backgroundColor).to.deep.equal([100, 100, 100]);
    });
    
    it('should initialize isHovered to false', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].isHovered).to.be.false;
    });
    
    it('should create render function for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].render).to.be.a('function');
    });
    
    it('should create containsPoint function for button item', function() {
      contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(contentArea.contentItems[0].containsPoint).to.be.a('function');
    });
    
    it('should return the created item', function() {
      const item = contentArea.addButton('btn1', 'Click', sinon.stub());
      
      expect(item.id).to.equal('btn1');
      expect(item.type).to.equal('button');
    });
  });
  
  describe('addCustom()', function() {
    it('should add custom item to contentItems', function() {
      const renderFn = sinon.stub();
      contentArea.addCustom('custom1', renderFn, null, 50);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('custom1');
      expect(contentArea.contentItems[0].type).to.equal('custom');
    });
    
    it('should use provided height', function() {
      contentArea.addCustom('custom1', sinon.stub(), null, 75);
      
      expect(contentArea.contentItems[0].height).to.equal(75);
    });
    
    it('should use default height if not provided', function() {
      contentArea.addCustom('custom1', sinon.stub(), null);
      
      expect(contentArea.contentItems[0].height).to.equal(30);
    });
    
    it('should store render function', function() {
      const renderFn = sinon.stub();
      contentArea.addCustom('custom1', renderFn, null, 50);
      
      expect(contentArea.contentItems[0].render).to.equal(renderFn);
    });
    
    it('should store click callback if provided', function() {
      const clickFn = sinon.stub();
      contentArea.addCustom('custom1', sinon.stub(), clickFn, 50);
      
      expect(contentArea.contentItems[0].clickCallback).to.equal(clickFn);
    });
    
    it('should create containsPoint function if clickFn provided', function() {
      contentArea.addCustom('custom1', sinon.stub(), sinon.stub(), 50);
      
      expect(contentArea.contentItems[0].containsPoint).to.be.a('function');
    });
    
    it('should not create containsPoint if clickFn is null', function() {
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(contentArea.contentItems[0].containsPoint).to.be.null;
    });
    
    it('should return the created item', function() {
      const item = contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(item.id).to.equal('custom1');
      expect(item.type).to.equal('custom');
    });
  });
  
  describe('removeItem()', function() {
    it('should remove item by id', function() {
      contentArea.addText('text1', 'Hello');
      contentArea.addText('text2', 'World');
      
      const result = contentArea.removeItem('text1');
      
      expect(result).to.be.true;
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(contentArea.contentItems[0].id).to.equal('text2');
    });
    
    it('should return false if item not found', function() {
      contentArea.addText('text1', 'Hello');
      
      const result = contentArea.removeItem('nonexistent');
      
      expect(result).to.be.false;
      expect(contentArea.contentItems).to.have.lengthOf(1);
    });
    
    it('should update scroll bounds after removal', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      contentArea.addText('text1', 'Hello');
      
      spy.resetHistory();
      contentArea.removeItem('text1');
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('clearAll()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should remove all items', function() {
      contentArea.addText('text1', 'Hello');
      contentArea.addButton('btn1', 'Click', sinon.stub());
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      contentArea.clearAll();
      
      expect(contentArea.contentItems).to.have.lengthOf(0);
    });
    
    it('should reset scrollOffset to 0', function() {
      contentArea.scrollOffset = 100;
      
      contentArea.clearAll();
      
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should update scroll bounds', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      
      contentArea.clearAll();
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('calculateTotalHeight()', function() {
    it('should return 0 for empty content', function() {
      expect(contentArea.calculateTotalHeight()).to.equal(0);
    });
    
    it('should sum heights of all items', function() {
      contentArea.addText('text1', 'Hello', { height: 25 });
      contentArea.addButton('btn1', 'Click', sinon.stub(), { height: 30 });
      contentArea.addCustom('custom1', sinon.stub(), null, 50);
      
      expect(contentArea.calculateTotalHeight()).to.equal(105); // 25 + 30 + 50
    });
  });
  
  describe('getVisibleHeight()', function() {
    it('should subtract indicator height from total height', function() {
      mockScrollIndicator.getTotalHeight.returns(40); // Both indicators
      
      const visibleHeight = contentArea.getVisibleHeight();
      
      expect(visibleHeight).to.equal(360); // 400 - 40
    });
    
    it('should return full height when no indicators', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      
      const visibleHeight = contentArea.getVisibleHeight();
      
      expect(visibleHeight).to.equal(400);
    });
  });
  
  describe('calculateMaxScrollOffset()', function() {
    it('should return 0 when content fits in viewport', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.addText('text1', 'Hello', { height: 25 });
      
      expect(contentArea.calculateMaxScrollOffset()).to.equal(0);
    });
    
    it('should calculate correct max offset when content overflows', function() {
      mockScrollIndicator.getTotalHeight.returns(40);
      contentArea.addText('text1', 'Item 1', { height: 100 });
      contentArea.addText('text2', 'Item 2', { height: 100 });
      contentArea.addText('text3', 'Item 3', { height: 100 });
      contentArea.addText('text4', 'Item 4', { height: 100 });
      
      // Total: 400px, Visible: 360px (400 - 40)
      // Max scroll: 400 - 360 = 40
      expect(contentArea.calculateMaxScrollOffset()).to.equal(40);
    });
  });
  
  describe('updateScrollBounds()', function() {
    it('should recalculate maxScrollOffset', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      
      contentArea.updateScrollBounds();
      
      expect(contentArea.maxScrollOffset).to.equal(0);
    });
    
    it('should clamp scrollOffset if needed', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.scrollOffset = 100;
      contentArea.addText('text1', 'Hello', { height: 25 });
      
      contentArea.updateScrollBounds();
      
      expect(contentArea.scrollOffset).to.equal(0); // Clamped
    });
  });
  
  describe('clampScrollOffset()', function() {
    it('should clamp to 0 if negative', function() {
      contentArea.scrollOffset = -50;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should clamp to maxScrollOffset if too large', function() {
      contentArea.maxScrollOffset = 100;
      contentArea.scrollOffset = 150;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(100);
    });
    
    it('should not change if within valid range', function() {
      contentArea.maxScrollOffset = 100;
      contentArea.scrollOffset = 50;
      
      contentArea.clampScrollOffset();
      
      expect(contentArea.scrollOffset).to.equal(50);
    });
  });
  
  describe('getVisibleItems()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should return all items when content fits viewport', function() {
      contentArea.addText('text1', 'Item 1', { height: 50 });
      contentArea.addText('text2', 'Item 2', { height: 50 });
      
      const visible = contentArea.getVisibleItems();
      
      expect(visible).to.have.lengthOf(2);
    });
    
    it('should return only visible items when scrolled', function() {
      // Add items that exceed viewport
      for (let i = 0; i < 20; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      
      contentArea.scrollOffset = 0;
      const visible = contentArea.getVisibleItems();
      
      // Viewport is 400px, items are 50px each = 8 items visible
      expect(visible.length).to.be.lte(9); // Allow some overlap
    });
    
    it('should calculate correct y positions relative to viewport', function() {
      contentArea.addText('text1', 'Item 1', { height: 50 });
      contentArea.addText('text2', 'Item 2', { height: 50 });
      contentArea.scrollOffset = 25;
      
      const visible = contentArea.getVisibleItems();
      
      expect(visible[0].y).to.equal(-25); // First item partially scrolled
      expect(visible[1].y).to.equal(25); // Second item visible
    });
    
    it('should early exit when past viewport bottom', function() {
      // Add many items
      for (let i = 0; i < 100; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 50 });
      }
      
      const visible = contentArea.getVisibleItems();
      
      // Should not return all 100 items
      expect(visible.length).to.be.lessThan(20);
    });
  });
  
  describe('handleMouseWheel()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(40);
      // Add content that requires scrolling
      for (let i = 0; i < 10; i++) {
        contentArea.addText(`text${i}`, `Item ${i}`, { height: 100 });
      }
      contentArea.updateScrollBounds();
      contentArea.scrollOffset = 50; // Start in middle
    });
    
    it('should return false when no scrolling needed', function() {
      contentArea.contentItems = [];
      contentArea.updateScrollBounds();
      
      const result = contentArea.handleMouseWheel(-10);
      
      expect(result).to.be.false;
    });
    
    it('should increase scrollOffset when delta negative (scroll down)', function() {
      const oldOffset = contentArea.scrollOffset;
      
      contentArea.handleMouseWheel(-10);
      
      expect(contentArea.scrollOffset).to.be.greaterThan(oldOffset);
    });
    
    it('should decrease scrollOffset when delta positive (scroll up)', function() {
      const oldOffset = contentArea.scrollOffset;
      
      contentArea.handleMouseWheel(10);
      
      expect(contentArea.scrollOffset).to.be.lessThan(oldOffset);
    });
    
    it('should apply scrollSpeed multiplier', function() {
      contentArea.scrollOffset = 50;
      contentArea.scrollSpeed = 20;
      
      contentArea.handleMouseWheel(-1);
      
      // -1 * (20/10) = -2, with subtraction: 50 - (-2) = 52
      expect(contentArea.scrollOffset).to.equal(52);
    });
    
    it('should clamp to valid range', function() {
      contentArea.scrollOffset = contentArea.maxScrollOffset - 1;
      
      contentArea.handleMouseWheel(-100); // Try to scroll way down
      
      expect(contentArea.scrollOffset).to.equal(contentArea.maxScrollOffset);
    });
    
    it('should trigger onScroll callback when scrolled', function() {
      const callback = sinon.stub();
      contentArea.onScroll = callback;
      
      contentArea.handleMouseWheel(-10);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.calledWith(contentArea.scrollOffset, contentArea.maxScrollOffset)).to.be.true;
    });
    
    it('should not trigger onScroll if scroll did not change', function() {
      const callback = sinon.stub();
      contentArea.onScroll = callback;
      contentArea.scrollOffset = 0;
      
      contentArea.handleMouseWheel(10); // Try to scroll up when at top
      
      expect(callback.called).to.be.false;
    });
    
    it('should return true if scrolled', function() {
      const result = contentArea.handleMouseWheel(-10);
      
      expect(result).to.be.true;
    });
  });
  
  describe('handleClick()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should return null when no items clicked', function() {
      contentArea.addText('text1', 'Hello', { height: 50 });
      
      const clicked = contentArea.handleClick(10, 500, 0, 0); // Click outside
      
      expect(clicked).to.be.null;
    });
    
    it('should detect click on button', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback, { height: 50 });
      
      const clicked = contentArea.handleClick(100, 25, 0, 0); // Click in middle
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn1');
    });
    
    it('should trigger item clickCallback', function() {
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', callback, { height: 50 });
      
      contentArea.handleClick(100, 25, 0, 0);
      
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should trigger global onItemClick callback', function() {
      const globalCallback = sinon.stub();
      contentArea.onItemClick = globalCallback;
      const itemCallback = sinon.stub();
      contentArea.addButton('btn1', 'Click Me', itemCallback, { height: 50 });
      
      contentArea.handleClick(100, 25, 0, 0);
      
      expect(globalCallback.calledOnce).to.be.true;
    });
    
    it('should account for scroll offset in click detection', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      const callback = sinon.stub();
      contentArea.addButton('btn1', 'Item 1', sinon.stub(), { height: 50 });
      contentArea.addButton('btn2', 'Item 2', callback, { height: 50 });
      contentArea.scrollOffset = 25; // Scroll down
      
      // Click at y=40 (viewport space) should hit second item
      // btn1: content y=0-50, viewport y=-25 to 25
      // btn2: content y=50-100, viewport y=25 to 75
      // Click at y=40 is clearly in btn2
      const clicked = contentArea.handleClick(100, 40, 0, 0);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn2');
    });
    
    it('should not click items not visible in viewport', function() {
      mockScrollIndicator.getTotalHeight.returns(0);
      contentArea.addButton('btn1', 'Item 1', sinon.stub(), { height: 50 });
      contentArea.scrollOffset = 100; // Scroll past first item
      
      const clicked = contentArea.handleClick(100, 25, 0, 0);
      
      expect(clicked).to.be.null; // First item not in viewport
    });
  });
  
  describe('updateHover()', function() {
    beforeEach(function() {
      mockScrollIndicator.getTotalHeight.returns(0);
    });
    
    it('should set isHovered true when mouse over button', function() {
      contentArea.addButton('btn1', 'Click Me', sinon.stub(), { height: 50 });
      
      contentArea.updateHover(100, 25, 0, 0);
      
      expect(contentArea.contentItems[0].isHovered).to.be.true;
    });
    
    it('should set isHovered false when mouse not over button', function() {
      contentArea.addButton('btn1', 'Click Me', sinon.stub(), { height: 50 });
      contentArea.contentItems[0].isHovered = true;
      
      contentArea.updateHover(10, 500, 0, 0); // Far away
      
      expect(contentArea.contentItems[0].isHovered).to.be.false;
    });
    
    it('should not affect text items (no isHovered property)', function() {
      contentArea.addText('text1', 'Hello', { height: 50 });
      
      // Should not throw error
      expect(() => contentArea.updateHover(100, 25, 0, 0)).to.not.throw();
    });
  });
  
  describe('setDimensions()', function() {
    it('should update width', function() {
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.width).to.equal(300);
    });
    
    it('should update height', function() {
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.height).to.equal(600);
    });
    
    it('should update scroll bounds', function() {
      const spy = sinon.spy(contentArea, 'updateScrollBounds');
      
      contentArea.setDimensions(300, 600);
      
      expect(spy.calledOnce).to.be.true;
    });
  });
  
  describe('getTotalHeight()', function() {
    it('should return height property', function() {
      expect(contentArea.getTotalHeight()).to.equal(400);
    });
  });
});
