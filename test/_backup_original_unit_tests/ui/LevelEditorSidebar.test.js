/**
 * Unit Tests: LevelEditorSidebar Component (TDD - Phase 1A)
 * 
 * Tests for scrollable sidebar menu with composition pattern.
 * Uses ScrollableContentArea for content management.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelEditorSidebar', function() {
  let sidebar, mockScrollableContentArea;
  
  beforeEach(function() {
    // Mock ScrollableContentArea
    mockScrollableContentArea = {
      width: 300,
      height: 550,
      scrollOffset: 0,
      maxScrollOffset: 0,
      contentItems: [],
      addText: sinon.stub(),
      addButton: sinon.stub(),
      addCustom: sinon.stub(),
      removeItem: sinon.stub(),
      clearAll: sinon.stub(),
      handleMouseWheel: sinon.stub().returns(false),
      handleClick: sinon.stub().returns(null),
      updateHover: sinon.stub(),
      render: sinon.stub(),
      getVisibleHeight: sinon.stub().returns(550),
      calculateTotalHeight: sinon.stub().returns(0),
      updateScrollBounds: sinon.stub(),
      getTotalHeight: sinon.stub().returns(550),
      setDimensions: sinon.stub()
    };
    
    // Mock ScrollableContentArea constructor
    global.ScrollableContentArea = sinon.stub().returns(mockScrollableContentArea);
    
    // Mock p5.js functions
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    
    // Load class (will fail until implemented)
    try {
      const LevelEditorSidebar = require('../../../Classes/ui/LevelEditorSidebar');
      sidebar = new LevelEditorSidebar();
    } catch (e) {
      // Expected to fail in TDD Phase 1A
      sidebar = null;
    }
  });
  
  afterEach(function() {
    sinon.restore();
    delete global.ScrollableContentArea;
    delete global.fill;
    delete global.stroke;
    delete global.noStroke;
    delete global.rect;
    delete global.text;
    delete global.textAlign;
    delete global.textSize;
    delete global.push;
    delete global.pop;
    delete global.LEFT;
    delete global.CENTER;
  });
  
  describe('Constructor', function() {
    it('should initialize with default width', function() {
      expect(sidebar).to.exist;
      expect(sidebar.width).to.equal(300);
    });
    
    it('should initialize with default height', function() {
      expect(sidebar.height).to.equal(600);
    });
    
    it('should initialize with default menuBarHeight', function() {
      expect(sidebar.menuBarHeight).to.equal(50);
    });
    
    it('should initialize with default title', function() {
      expect(sidebar.title).to.equal('Sidebar');
    });
    
    it('should initialize with default backgroundColor', function() {
      expect(sidebar.backgroundColor).to.deep.equal([40, 40, 40]);
    });
    
    it('should initialize with default menuBarColor', function() {
      expect(sidebar.menuBarColor).to.deep.equal([50, 50, 50]);
    });
    
    it('should accept custom width option', function() {
      const custom = new (require('../../../Classes/ui/LevelEditorSidebar'))({ width: 400 });
      expect(custom.width).to.equal(400);
    });
    
    it('should accept custom height option', function() {
      const custom = new (require('../../../Classes/ui/LevelEditorSidebar'))({ height: 800 });
      expect(custom.height).to.equal(800);
    });
    
    it('should accept custom title option', function() {
      const custom = new (require('../../../Classes/ui/LevelEditorSidebar'))({ title: 'Tools' });
      expect(custom.title).to.equal('Tools');
    });
    
    it('should create ScrollableContentArea instance', function() {
      expect(sidebar.contentArea).to.exist;
      expect(sidebar.contentArea).to.equal(mockScrollableContentArea);
    });
    
    it('should pass correct height to ScrollableContentArea', function() {
      // Content area height should be total height - menu bar height
      expect(global.ScrollableContentArea.calledOnce).to.be.true;
      const options = global.ScrollableContentArea.getCall(0).args[0];
      expect(options.height).to.equal(550); // 600 - 50
    });
    
    it('should pass correct width to ScrollableContentArea', function() {
      const options = global.ScrollableContentArea.getCall(0).args[0];
      expect(options.width).to.equal(300);
    });
  });
  
  describe('Content Management', function() {
    it('should delegate addText to contentArea', function() {
      mockScrollableContentArea.addText.returns({ id: 'text1', type: 'text' });
      
      const item = sidebar.addText('text1', 'Hello', { fontSize: 14 });
      
      expect(mockScrollableContentArea.addText.calledOnce).to.be.true;
      expect(mockScrollableContentArea.addText.calledWith('text1', 'Hello', { fontSize: 14 })).to.be.true;
      expect(item.id).to.equal('text1');
    });
    
    it('should delegate addButton to contentArea', function() {
      const callback = sinon.stub();
      mockScrollableContentArea.addButton.returns({ id: 'btn1', type: 'button' });
      
      const item = sidebar.addButton('btn1', 'Click Me', callback, { height: 40 });
      
      expect(mockScrollableContentArea.addButton.calledOnce).to.be.true;
      expect(mockScrollableContentArea.addButton.calledWith('btn1', 'Click Me', callback, { height: 40 })).to.be.true;
      expect(item.id).to.equal('btn1');
    });
    
    it('should delegate addCustom to contentArea', function() {
      const renderFn = sinon.stub();
      const clickFn = sinon.stub();
      mockScrollableContentArea.addCustom.returns({ id: 'custom1', type: 'custom' });
      
      const item = sidebar.addCustom('custom1', renderFn, clickFn, 60);
      
      expect(mockScrollableContentArea.addCustom.calledOnce).to.be.true;
      expect(mockScrollableContentArea.addCustom.calledWith('custom1', renderFn, clickFn, 60)).to.be.true;
      expect(item.id).to.equal('custom1');
    });
    
    it('should delegate removeItem to contentArea', function() {
      mockScrollableContentArea.removeItem.returns(true);
      
      const removed = sidebar.removeItem('btn1');
      
      expect(mockScrollableContentArea.removeItem.calledOnce).to.be.true;
      expect(mockScrollableContentArea.removeItem.calledWith('btn1')).to.be.true;
      expect(removed).to.be.true;
    });
    
    it('should delegate clearAll to contentArea', function() {
      sidebar.clearAll();
      
      expect(mockScrollableContentArea.clearAll.calledOnce).to.be.true;
    });
    
    it('should get content items from contentArea', function() {
      mockScrollableContentArea.contentItems = [
        { id: 'item1', type: 'text' },
        { id: 'item2', type: 'button' }
      ];
      
      expect(sidebar.getContentItems()).to.deep.equal(mockScrollableContentArea.contentItems);
    });
  });
  
  describe('Scroll Management', function() {
    it('should delegate handleMouseWheel to contentArea', function() {
      mockScrollableContentArea.handleMouseWheel.returns(true);
      
      const scrolled = sidebar.handleMouseWheel(-10, 100, 50);
      
      expect(mockScrollableContentArea.handleMouseWheel.calledOnce).to.be.true;
      expect(mockScrollableContentArea.handleMouseWheel.calledWith(-10)).to.be.true;
      expect(scrolled).to.be.true;
    });
    
    it('should not scroll if mouse not over content area', function() {
      // Mouse over menu bar (y < menuBarHeight)
      const scrolled = sidebar.handleMouseWheel(-10, 100, 20);
      
      expect(mockScrollableContentArea.handleMouseWheel.called).to.be.false;
      expect(scrolled).to.be.false;
    });
    
    it('should get scroll offset from contentArea', function() {
      mockScrollableContentArea.scrollOffset = 150;
      
      expect(sidebar.getScrollOffset()).to.equal(150);
    });
    
    it('should get max scroll offset from contentArea', function() {
      mockScrollableContentArea.maxScrollOffset = 500;
      
      expect(sidebar.getMaxScrollOffset()).to.equal(500);
    });
  });
  
  describe('Click Handling', function() {
    it('should delegate content clicks to contentArea', function() {
      mockScrollableContentArea.handleClick.returns({ id: 'btn1', type: 'button' });
      
      // Click in content area (below menu bar)
      const clicked = sidebar.handleClick(150, 100, 10, 50);
      
      expect(mockScrollableContentArea.handleClick.calledOnce).to.be.true;
      // Should transform Y coordinate (subtract position and menu bar height)
      expect(mockScrollableContentArea.handleClick.calledWith(150, 100, 10, 100)).to.be.true;
      expect(clicked.id).to.equal('btn1');
    });
    
    it('should not click content area if mouse over menu bar', function() {
      // Click in menu bar (y < sidebarY + menuBarHeight)
      const clicked = sidebar.handleClick(150, 60, 10, 50);
      
      expect(mockScrollableContentArea.handleClick.called).to.be.false;
      expect(clicked).to.be.null;
    });
    
    it('should detect minimize button click', function() {
      // Mock minimize button bounds (right side of menu bar)
      const clicked = sidebar.handleClick(290, 70, 10, 50);
      
      // Should detect as minimize button click
      expect(clicked).to.deep.equal({ type: 'minimize' });
    });
    
    it('should not detect minimize if outside button bounds', function() {
      const clicked = sidebar.handleClick(50, 70, 10, 50);
      
      expect(clicked).to.not.deep.equal({ type: 'minimize' });
    });
  });
  
  describe('Hover State', function() {
    it('should delegate hover to contentArea for content items', function() {
      // Hover in content area
      sidebar.updateHover(150, 200, 10, 50);
      
      expect(mockScrollableContentArea.updateHover.calledOnce).to.be.true;
      // Should transform Y coordinate
      expect(mockScrollableContentArea.updateHover.calledWith(150, 200, 10, 100)).to.be.true;
    });
    
    it('should track minimize button hover state', function() {
      expect(sidebar.minimizeHovered).to.be.false;
      
      // Hover over minimize button
      sidebar.updateHover(290, 70, 10, 50);
      
      expect(sidebar.minimizeHovered).to.be.true;
    });
    
    it('should clear minimize hover when mouse moves away', function() {
      sidebar.minimizeHovered = true;
      
      // Move mouse away from minimize button
      sidebar.updateHover(50, 70, 10, 50);
      
      expect(sidebar.minimizeHovered).to.be.false;
    });
  });
  
  describe('Rendering', function() {
    it('should render menu bar', function() {
      global.rect.resetHistory();
      
      sidebar.render(10, 50);
      
      // Should draw menu bar background
      const menuBarRect = global.rect.getCalls().find(call =>
        call.args[0] === 10 && call.args[1] === 50 && call.args[2] === 300 && call.args[3] === 50
      );
      expect(menuBarRect).to.exist;
    });
    
    it('should render title in menu bar', function() {
      global.text.resetHistory();
      
      sidebar.render(10, 50);
      
      // Should draw title text
      const titleText = global.text.getCalls().find(call => call.args[0] === 'Sidebar');
      expect(titleText).to.exist;
    });
    
    it('should render minimize button', function() {
      global.text.resetHistory();
      
      sidebar.render(10, 50);
      
      // Should draw minimize icon
      const minimizeIcon = global.text.getCalls().find(call => call.args[0] === '_');
      expect(minimizeIcon).to.exist;
    });
    
    it('should delegate content rendering to contentArea', function() {
      sidebar.render(10, 50);
      
      expect(mockScrollableContentArea.render.calledOnce).to.be.true;
      // Content area should render below menu bar
      expect(mockScrollableContentArea.render.calledWith(10, 100)).to.be.true;
    });
    
    it('should use push/pop for transform isolation', function() {
      global.push.resetHistory();
      global.pop.resetHistory();
      
      sidebar.render(10, 50);
      
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
  });
  
  describe('Dimensions', function() {
    it('should return total width', function() {
      expect(sidebar.getWidth()).to.equal(300);
    });
    
    it('should return total height', function() {
      expect(sidebar.getHeight()).to.equal(600);
    });
    
    it('should return menu bar height', function() {
      expect(sidebar.getMenuBarHeight()).to.equal(50);
    });
    
    it('should return content area height', function() {
      expect(sidebar.getContentAreaHeight()).to.equal(550); // 600 - 50
    });
    
    it('should update dimensions', function() {
      sidebar.setDimensions(400, 800);
      
      expect(sidebar.width).to.equal(400);
      expect(sidebar.height).to.equal(800);
      // Content area height should be recalculated
      expect(sidebar.getContentAreaHeight()).to.equal(750); // 800 - 50
    });
  });
  
  describe('Visibility', function() {
    it('should initialize as visible by default', function() {
      expect(sidebar.isVisible()).to.be.true;
    });
    
    it('should toggle visibility', function() {
      sidebar.setVisible(false);
      expect(sidebar.isVisible()).to.be.false;
      
      sidebar.setVisible(true);
      expect(sidebar.isVisible()).to.be.true;
    });
    
    it('should not render when hidden', function() {
      sidebar.setVisible(false);
      
      global.push.resetHistory();
      sidebar.render(10, 50);
      
      // Should not render anything
      expect(global.push.called).to.be.false;
    });
  });
  
  describe('Content Overflow Detection', function() {
    it('should detect no overflow when content fits', function() {
      mockScrollableContentArea.calculateTotalHeight.returns(500);
      mockScrollableContentArea.getVisibleHeight.returns(550);
      
      expect(sidebar.hasOverflow()).to.be.false;
    });
    
    it('should detect overflow when content exceeds viewport', function() {
      mockScrollableContentArea.calculateTotalHeight.returns(800);
      mockScrollableContentArea.getVisibleHeight.returns(550);
      
      expect(sidebar.hasOverflow()).to.be.true;
    });
  });
});
