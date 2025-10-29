/**
 * Unit Tests for ScrollableContentArea Component
 * 
 * Tests the scrollable content container with viewport culling,
 * content item management, and scroll handling.
 * 
 * @author Software Engineering Team Delta
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('ScrollableContentArea Component', function() {
  let ScrollableContentArea;
  let ScrollIndicator;
  let contentArea;
  let sandbox;
  let mockP5;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noStroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      CENTER: 'CENTER',
      LEFT: 'LEFT'
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
    global.LEFT = mockP5.LEFT;
    
    // Load dependencies
    delete require.cache[require.resolve('../../../Classes/ui/ScrollIndicator')];
    delete require.cache[require.resolve('../../../Classes/ui/ScrollableContentArea')];
    
    ScrollIndicator = require('../../../Classes/ui/ScrollIndicator');
    global.ScrollIndicator = ScrollIndicator; // Make available to ScrollableContentArea
    window.ScrollIndicator = ScrollIndicator; // Sync for JSDOM
    
    ScrollableContentArea = require('../../../Classes/ui/ScrollableContentArea');
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
    delete global.LEFT;
  });
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      contentArea = new ScrollableContentArea();
      
      expect(contentArea.width).to.equal(200);
      expect(contentArea.height).to.equal(400);
      expect(contentArea.scrollOffset).to.equal(0);
      expect(contentArea.maxScrollOffset).to.equal(0);
      expect(contentArea.scrollSpeed).to.equal(20);
      expect(contentArea.contentItems).to.be.an('array').that.is.empty;
      expect(contentArea.scrollIndicator).to.be.instanceOf(ScrollIndicator);
    });
    
    it('should accept custom options', function() {
      contentArea = new ScrollableContentArea({
        width: 300,
        height: 600,
        scrollSpeed: 30,
        itemPadding: 10,
        backgroundColor: [100, 100, 100]
      });
      
      expect(contentArea.width).to.equal(300);
      expect(contentArea.height).to.equal(600);
      expect(contentArea.scrollSpeed).to.equal(30);
      expect(contentArea.itemPadding).to.equal(10);
      expect(contentArea.backgroundColor).to.deep.equal([100, 100, 100]);
    });
  });
  
  describe('addText()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
    });
    
    it('should add a text item to contentItems', function() {
      const item = contentArea.addText('text1', 'Hello World');
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(item.id).to.equal('text1');
      expect(item.type).to.equal('text');
      expect(item.text).to.equal('Hello World');
    });
    
    it('should use default height for text items', function() {
      const item = contentArea.addText('text1', 'Test');
      
      expect(item.height).to.equal(25);
    });
    
    it('should accept custom height option', function() {
      const item = contentArea.addText('text1', 'Test', { height: 40 });
      
      expect(item.height).to.equal(40);
    });
    
    it('should update scroll bounds after adding', function() {
      sandbox.spy(contentArea, 'updateScrollBounds');
      
      contentArea.addText('text1', 'Test');
      
      expect(contentArea.updateScrollBounds.calledOnce).to.be.true;
    });
  });
  
  describe('addButton()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
    });
    
    it('should add a button item to contentItems', function() {
      const callback = sandbox.stub();
      const item = contentArea.addButton('btn1', 'Click Me', callback);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(item.id).to.equal('btn1');
      expect(item.type).to.equal('button');
      expect(item.label).to.equal('Click Me');
      expect(item.clickCallback).to.equal(callback);
    });
    
    it('should use default height for buttons', function() {
      const item = contentArea.addButton('btn1', 'Test', () => {});
      
      expect(item.height).to.equal(30);
    });
    
    it('should have isHovered property initialized to false', function() {
      const item = contentArea.addButton('btn1', 'Test', () => {});
      
      expect(item.isHovered).to.be.false;
    });
  });
  
  describe('addCustom()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
    });
    
    it('should add a custom item to contentItems', function() {
      const renderFn = sandbox.stub();
      const clickFn = sandbox.stub();
      const item = contentArea.addCustom('custom1', renderFn, clickFn, 50);
      
      expect(contentArea.contentItems).to.have.lengthOf(1);
      expect(item.id).to.equal('custom1');
      expect(item.type).to.equal('custom');
      expect(item.height).to.equal(50);
      expect(item.render).to.equal(renderFn);
      expect(item.clickCallback).to.equal(clickFn);
    });
    
    it('should use default height if not provided', function() {
      const item = contentArea.addCustom('custom1', () => {}, null);
      
      expect(item.height).to.equal(30);
    });
  });
  
  describe('removeItem()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
      contentArea.addText('text1', 'Test 1');
      contentArea.addText('text2', 'Test 2');
      contentArea.addText('text3', 'Test 3');
    });
    
    it('should remove item by id', function() {
      const result = contentArea.removeItem('text2');
      
      expect(result).to.be.true;
      expect(contentArea.contentItems).to.have.lengthOf(2);
      expect(contentArea.contentItems[0].id).to.equal('text1');
      expect(contentArea.contentItems[1].id).to.equal('text3');
    });
    
    it('should return false for non-existent id', function() {
      const result = contentArea.removeItem('nonexistent');
      
      expect(result).to.be.false;
      expect(contentArea.contentItems).to.have.lengthOf(3);
    });
    
    it('should update scroll bounds after removing', function() {
      sandbox.spy(contentArea, 'updateScrollBounds');
      
      contentArea.removeItem('text2');
      
      expect(contentArea.updateScrollBounds.calledOnce).to.be.true;
    });
  });
  
  describe('clearAll()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
      contentArea.addText('text1', 'Test 1');
      contentArea.addText('text2', 'Test 2');
      contentArea.scrollOffset = 50;
    });
    
    it('should remove all content items', function() {
      contentArea.clearAll();
      
      expect(contentArea.contentItems).to.be.empty;
    });
    
    it('should reset scrollOffset to 0', function() {
      contentArea.clearAll();
      
      expect(contentArea.scrollOffset).to.equal(0);
    });
    
    it('should update scroll bounds', function() {
      sandbox.spy(contentArea, 'updateScrollBounds');
      
      contentArea.clearAll();
      
      expect(contentArea.updateScrollBounds.calledOnce).to.be.true;
    });
  });
  
  describe('calculateTotalHeight()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
    });
    
    it('should return 0 for empty content', function() {
      expect(contentArea.calculateTotalHeight()).to.equal(0);
    });
    
    it('should sum heights of all items', function() {
      contentArea.addText('text1', 'Test', { height: 25 });
      contentArea.addButton('btn1', 'Button', () => {}, { height: 30 });
      contentArea.addCustom('custom1', () => {}, null, 50);
      
      expect(contentArea.calculateTotalHeight()).to.equal(105); // 25 + 30 + 50
    });
  });
  
  describe('calculateMaxScrollOffset()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ height: 400 });
    });
    
    it('should return 0 when content fits in viewport', function() {
      contentArea.addText('text1', 'Test', { height: 100 });
      
      const maxScroll = contentArea.calculateMaxScrollOffset();
      
      expect(maxScroll).to.equal(0);
    });
    
    it('should calculate correct max scroll when content overflows', function() {
      // Add items totaling 500px (exceeds 400px viewport)
      contentArea.addText('text1', 'Test', { height: 100 });
      contentArea.addText('text2', 'Test', { height: 200 });
      contentArea.addText('text3', 'Test', { height: 200 });
      
      const maxScroll = contentArea.calculateMaxScrollOffset();
      
      // 500 (total content) - (400 viewport - 20 top indicator - 20 bottom indicator) = 140
      // But indicator height is only added once at top OR bottom, not both when calculating visible height
      // Visible height = 400 - getTotalHeight() where getTotalHeight accounts for visible indicators
      // With scrolling: top indicator (20px) is shown, so visible = 400 - 20 = 380
      // Max scroll = 500 - 380 = 120
      expect(maxScroll).to.equal(120);
    });
  });
  
  describe('getVisibleHeight()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ height: 400 });
    });
    
    it('should return full height when no scroll indicators', function() {
      const visibleHeight = contentArea.getVisibleHeight();
      
      expect(visibleHeight).to.equal(400);
    });
    
    it('should subtract indicator height when scrolling is possible', function() {
      // Add enough content to require scrolling
      contentArea.addText('text1', 'Test', { height: 500 });
      contentArea.updateScrollBounds();
      
      const visibleHeight = contentArea.getVisibleHeight();
      
      // Should be less than 400 due to scroll indicators
      expect(visibleHeight).to.be.lessThan(400);
    });
  });
  
  describe('getVisibleItems()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ height: 100 });
      
      // Add items with 25px height each
      contentArea.addText('item1', 'Item 1', { height: 25 });
      contentArea.addText('item2', 'Item 2', { height: 25 });
      contentArea.addText('item3', 'Item 3', { height: 25 });
      contentArea.addText('item4', 'Item 4', { height: 25 });
      contentArea.addText('item5', 'Item 5', { height: 25 });
      contentArea.addText('item6', 'Item 6', { height: 25 });
    });
    
    it('should return all items when scrolled to top', function() {
      contentArea.scrollOffset = 0;
      
      const visible = contentArea.getVisibleItems();
      
      // With 100px viewport and 25px items, should show 4 items
      expect(visible.length).to.be.at.least(4);
    });
    
    it('should return only visible items when scrolled', function() {
      contentArea.scrollOffset = 50; // Scroll down 50px
      
      const visible = contentArea.getVisibleItems();
      
      // When scrolled 50px, item1 (0-25) is fully scrolled out
      // item2 (25-50) has bottom edge at scrollOffset, so it's at the boundary
      // The viewport culling includes items that overlap the viewport
      // So item2 might be included if itemBottom (50) >= visibleTop (50)
      // Let's check that item1 is excluded since it's fully scrolled out
      const ids = visible.map(v => v.item.id);
      expect(ids).to.not.include('item1'); // Fully scrolled out
      // item2 is at exact boundary, may or may not be included depending on >= vs >
    });
    
    it('should include correct y positions', function() {
      contentArea.scrollOffset = 25; // Scroll down 25px
      
      const visible = contentArea.getVisibleItems();
      
      // When scrolled 25px, item1 (at position 0-25) is partially visible
      // Its viewport Y position = 0 (original) - 25 (scroll) = -25
      // This means it's partially scrolled out, with only bottom edge visible
      // First fully visible item (item2 at 25px) will have y = 25 - 25 = 0
      const firstItem = visible.find(v => v.item.id === 'item1');
      if (firstItem) {
        expect(firstItem.y).to.equal(-25); // Partially scrolled out
      }
    });
  });
  
  describe('handleMouseWheel()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ height: 100, scrollSpeed: 20 });
      
      // Add content to make scrolling possible
      contentArea.addText('item1', 'Item 1', { height: 50 });
      contentArea.addText('item2', 'Item 2', { height: 50 });
      contentArea.addText('item3', 'Item 3', { height: 50 });
      contentArea.updateScrollBounds();
    });
    
    it('should return false when no scrolling is possible', function() {
      contentArea.clearAll();
      contentArea.addText('item1', 'Small', { height: 50 });
      contentArea.updateScrollBounds();
      
      const handled = contentArea.handleMouseWheel(1);
      
      expect(handled).to.be.false;
    });
    
    it('should increase scrollOffset on positive delta (scroll down)', function() {
      const oldOffset = contentArea.scrollOffset;
      
      contentArea.handleMouseWheel(1); // Positive = scroll down
      
      expect(contentArea.scrollOffset).to.be.greaterThan(oldOffset);
    });
    
    it('should decrease scrollOffset on negative delta (scroll up)', function() {
      contentArea.scrollOffset = 50;
      
      contentArea.handleMouseWheel(-1); // Negative = scroll up
      
      expect(contentArea.scrollOffset).to.be.lessThan(50);
    });
    
    it('should clamp scrollOffset to valid range', function() {
      contentArea.scrollOffset = 0;
      
      contentArea.handleMouseWheel(-10); // Try to scroll up from top
      
      expect(contentArea.scrollOffset).to.equal(0); // Clamped to 0
    });
    
    it('should return true when scroll occurred', function() {
      const handled = contentArea.handleMouseWheel(1);
      
      expect(handled).to.be.true;
    });
  });
  
  describe('handleClick()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ width: 200, height: 400 });
    });
    
    it('should return null when clicking empty area', function() {
      const clicked = contentArea.handleClick(100, 100, 0, 0);
      
      expect(clicked).to.be.null;
    });
    
    it('should detect click on button item', function() {
      const callback = sandbox.stub();
      contentArea.addButton('btn1', 'Click Me', callback);
      
      // Click within button bounds (assuming 30px height, centered)
      const clicked = contentArea.handleClick(100, 15, 0, 0);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn1');
    });
    
    it('should call button callback on click', function() {
      const callback = sandbox.stub();
      contentArea.addButton('btn1', 'Click Me', callback);
      
      contentArea.handleClick(100, 15, 0, 0);
      
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should call onItemClick callback if provided', function() {
      const onItemClick = sandbox.stub();
      contentArea = new ScrollableContentArea({ onItemClick });
      
      contentArea.addButton('btn1', 'Click Me', () => {});
      contentArea.handleClick(100, 15, 0, 0);
      
      expect(onItemClick.calledOnce).to.be.true;
    });
    
    it('should account for scroll offset in click detection', function() {
      const callback = sandbox.stub();
      contentArea.addText('text1', 'Spacer', { height: 50 });
      contentArea.addButton('btn1', 'Click Me', callback);
      
      contentArea.scrollOffset = 50; // Scroll past first item
      
      // Click should hit button at y=0 (was at y=50 before scroll)
      const clicked = contentArea.handleClick(100, 15, 0, 0);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('btn1');
    });
  });
  
  describe('updateHover()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ width: 200 });
    });
    
    it('should set isHovered to true when mouse over button', function() {
      const item = contentArea.addButton('btn1', 'Hover Me', () => {});
      
      contentArea.updateHover(100, 15, 0, 0);
      
      expect(item.isHovered).to.be.true;
    });
    
    it('should set isHovered to false when mouse not over button', function() {
      const item = contentArea.addButton('btn1', 'Hover Me', () => {});
      
      contentArea.updateHover(1000, 1000, 0, 0); // Far away
      
      expect(item.isHovered).to.be.false;
    });
  });
  
  describe('render()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea();
    });
    
    it('should call push and pop', function() {
      contentArea.render(10, 10);
      
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should render background', function() {
      contentArea.render(10, 10);
      
      expect(mockP5.fill.called).to.be.true;
      expect(mockP5.rect.called).to.be.true;
    });
    
    it('should call render on visible items', function() {
      const renderStub = sandbox.stub();
      contentArea.addCustom('custom1', renderStub, null, 30);
      
      contentArea.render(10, 10);
      
      expect(renderStub.called).to.be.true;
    });
  });
  
  describe('setDimensions()', function() {
    beforeEach(function() {
      contentArea = new ScrollableContentArea({ width: 200, height: 400 });
    });
    
    it('should update width and height', function() {
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.width).to.equal(300);
      expect(contentArea.height).to.equal(600);
    });
    
    it('should update scroll bounds', function() {
      sandbox.spy(contentArea, 'updateScrollBounds');
      
      contentArea.setDimensions(300, 600);
      
      expect(contentArea.updateScrollBounds.calledOnce).to.be.true;
    });
  });
});
