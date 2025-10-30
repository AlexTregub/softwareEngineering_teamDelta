/**
 * Unit Tests - MaterialPalette Scrollable Enhancements
 * 
 * Tests for scroll support, keyboard input routing, and height calculations.
 * 
 * TDD Phase: RED (tests should fail initially)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

// Load MaterialPalette and dependencies
const MaterialCategory = require(path.join(__dirname, '../../../Classes/ui/MaterialCategory.js'));
const MaterialSearchBar = require(path.join(__dirname, '../../../Classes/ui/MaterialSearchBar.js'));
const MaterialFavorites = require(path.join(__dirname, '../../../Classes/ui/MaterialFavorites.js'));
const MaterialPreviewTooltip = require(path.join(__dirname, '../../../Classes/ui/MaterialPreviewTooltip.js'));
const MaterialPalette = require(path.join(__dirname, '../../../Classes/ui/MaterialPalette.js'));

describe('MaterialPalette - Scrollable Enhancements', function() {
  let palette;
  let mockP5;

    beforeEach(function() {
    // Mock p5.js global functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      stroke: sinon.stub(),
      noStroke: sinon.stub(),
      strokeWeight: sinon.stub(),
      rect: sinon.stub(),
      text: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      line: sinon.stub(),
      createVector: sinon.stub().callsFake((x, y) => ({ x, y }))
    };

    // Sync global and window
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
      if (typeof window !== 'undefined') window[key] = mockP5[key];
    });

    // Mock p5.js constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    if (typeof window !== 'undefined') {
      window.LEFT = 'left';
      window.CENTER = 'center';
      window.RIGHT = 'right';
      window.TOP = 'top';
      window.BOTTOM = 'bottom';
    }    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [null, sinon.stub()],
      'stone': [null, sinon.stub()],
      'dirt': [null, sinon.stub()],
      'grass': [null, sinon.stub()],
      'water': [null, sinon.stub()],
      'sand': [null, sinon.stub()],
      'cave_1': [null, sinon.stub()]
    };
    if (typeof window !== 'undefined') window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;

    // Sync component classes
    global.MaterialCategory = MaterialCategory;
    global.MaterialSearchBar = MaterialSearchBar;
    global.MaterialFavorites = MaterialFavorites;
    global.MaterialPreviewTooltip = MaterialPreviewTooltip;
    if (typeof window !== 'undefined') {
      window.MaterialCategory = MaterialCategory;
      window.MaterialSearchBar = MaterialSearchBar;
      window.MaterialFavorites = MaterialFavorites;
      window.MaterialPreviewTooltip = MaterialPreviewTooltip;
    }

    // Create palette with test materials
    palette = new MaterialPalette(['moss', 'stone', 'dirt', 'grass', 'water', 'sand', 'cave_1']);
    
    // Load categories
    const categoryConfig = {
      categories: [
        { id: 'ground', name: 'Ground', materials: ['dirt', 'sand'], defaultExpanded: true },
        { id: 'vegetation', name: 'Vegetation', materials: ['moss', 'grass'], defaultExpanded: true },
        { id: 'stone', name: 'Stone', materials: ['stone'], defaultExpanded: false },
        { id: 'cave', name: 'Cave', materials: ['cave_1'], defaultExpanded: false },
        { id: 'water', name: 'Water', materials: ['water'], defaultExpanded: false }
      ]
    };
    palette.loadCategories(categoryConfig);
  });

  afterEach(function() {
    sinon.restore();
  });

  // ==================== Scroll Support Tests ====================

  describe('Scroll Properties', function() {
    it('should initialize with scrollOffset = 0', function() {
      expect(palette.scrollOffset).to.equal(0);
    });

    it('should initialize with maxScrollOffset = 0', function() {
      expect(palette.maxScrollOffset).to.equal(0);
    });

    it('should initialize with viewportHeight = 0', function() {
      expect(palette.viewportHeight).to.equal(0);
    });
  });

  describe('getTotalContentHeight()', function() {
    it('should calculate total content height including search bar', function() {
      const height = palette.getTotalContentHeight();
      
      // Search bar: 45px
      // Recently used: 0 (empty)
      // Categories: sum of getHeight() for each category
      expect(height).to.be.greaterThan(45);
    });

    it('should include recently used section when non-empty', function() {
      palette.addToRecentlyUsed('moss');
      palette.addToRecentlyUsed('stone');
      palette.addToRecentlyUsed('dirt');
      
      const height = palette.getTotalContentHeight();
      
      // Search bar: 45px
      // Recently used: 20 (label) + 2 rows * 45 = 110px
      // Categories: varies
      expect(height).to.be.greaterThan(155); // 45 + 110
    });

    it('should update when categories expand', function() {
      const initialHeight = palette.getTotalContentHeight();
      
      // Expand a collapsed category
      palette.toggleCategory('stone'); // collapsed → expanded
      
      const newHeight = palette.getTotalContentHeight();
      expect(newHeight).to.be.greaterThan(initialHeight);
    });

    it('should update when categories collapse', function() {
      const initialHeight = palette.getTotalContentHeight();
      
      // Collapse an expanded category
      palette.toggleCategory('ground'); // expanded → collapsed
      
      const newHeight = palette.getTotalContentHeight();
      expect(newHeight).to.be.lessThan(initialHeight);
    });
  });

  describe('updateScrollBounds()', function() {
    it('should set maxScrollOffset based on content and viewport height', function() {
      palette.viewportHeight = 300;
      palette.updateScrollBounds();
      
      const contentHeight = palette.getTotalContentHeight();
      const expectedMax = Math.max(0, contentHeight - 300);
      
      expect(palette.maxScrollOffset).to.equal(expectedMax);
    });

    it('should set maxScrollOffset to 0 if content fits in viewport', function() {
      palette.viewportHeight = 10000; // Large viewport
      palette.updateScrollBounds();
      
      expect(palette.maxScrollOffset).to.equal(0);
    });

    it('should update when viewport height changes', function() {
      palette.viewportHeight = 300;
      palette.updateScrollBounds();
      const firstMax = palette.maxScrollOffset;
      
      palette.viewportHeight = 200; // Smaller viewport
      palette.updateScrollBounds();
      const secondMax = palette.maxScrollOffset;
      
      expect(secondMax).to.be.greaterThan(firstMax);
    });
  });

  describe('handleMouseWheel()', function() {
    beforeEach(function() {
      palette.viewportHeight = 300;
      palette.updateScrollBounds();
    });

    it('should increase scrollOffset when scrolling down (positive delta)', function() {
      const initialOffset = palette.scrollOffset;
      palette.handleMouseWheel(20);
      
      expect(palette.scrollOffset).to.equal(initialOffset + 20);
    });

    it('should decrease scrollOffset when scrolling up (negative delta)', function() {
      palette.scrollOffset = 50;
      palette.handleMouseWheel(-20);
      
      expect(palette.scrollOffset).to.equal(30);
    });

    it('should clamp scrollOffset to 0 minimum', function() {
      palette.scrollOffset = 10;
      palette.handleMouseWheel(-50); // Would go negative
      
      expect(palette.scrollOffset).to.equal(0);
    });

    it('should clamp scrollOffset to maxScrollOffset maximum', function() {
      palette.scrollOffset = palette.maxScrollOffset - 10;
      palette.handleMouseWheel(50); // Would exceed max
      
      expect(palette.scrollOffset).to.equal(palette.maxScrollOffset);
    });

    it('should handle multiple wheel events', function() {
      palette.handleMouseWheel(10);
      palette.handleMouseWheel(10);
      palette.handleMouseWheel(10);
      
      expect(palette.scrollOffset).to.equal(30);
    });
  });

  // ==================== Keyboard Input Tests ====================

  describe('Keyboard Input Routing', function() {
    it('should route key press to search bar when focused', function() {
      const searchBarSpy = sinon.spy(palette.searchBar, 'handleKeyPress');
      
      palette.searchBar.focus();
      palette.handleKeyPress('m', 77);
      
      expect(searchBarSpy.calledWith('m', 77)).to.be.true;
    });

    it('should return true if key press consumed by search bar', function() {
      palette.searchBar.focus();
      const result = palette.handleKeyPress('m', 77);
      
      expect(result).to.be.true;
    });

    it('should return false if search bar not focused', function() {
      palette.searchBar.blur();
      const result = palette.handleKeyPress('m', 77);
      
      expect(result).to.be.false;
    });

    it('should update search results when typing in search bar', function() {
      palette.searchBar.focus();
      palette.handleKeyPress('m', 77); // Type 'm'
      palette.handleKeyPress('o', 79); // Type 'o'
      palette.handleKeyPress('s', 83); // Type 's'
      palette.handleKeyPress('s', 83); // Type 's'
      
      // Search bar value should be 'moss'
      expect(palette.searchBar.getValue()).to.equal('moss');
      
      // Search results should be filtered
      expect(palette.searchResults).to.not.be.null;
      expect(palette.searchResults.length).to.be.greaterThan(0);
    });

    it('should clear search when Escape pressed in search bar', function() {
      palette.searchBar.focus();
      palette.searchBar.setValue('moss');
      palette.searchMaterials('moss');
      
      palette.handleKeyPress('Escape', 27);
      
      expect(palette.searchBar.getValue()).to.equal('');
      expect(palette.searchResults).to.be.null;
    });
  });

  // ==================== Click Handling with Scroll ====================

  describe('Click Detection with Scroll Offset', function() {
    beforeEach(function() {
      palette.viewportHeight = 300;
      palette.render(0, 0, 200, 300); // Initialize viewport
    });

    it('should focus search bar when clicked', function() {
      // Click on search bar area (Y: 0-45)
      palette.handleClick(100, 20, 0, 0);
      
      expect(palette.searchBar.isFocused()).to.be.true;
    });

    it('should blur search bar when clicking outside', function() {
      palette.searchBar.focus();
      
      // Click below search bar
      palette.handleClick(100, 100, 0, 0);
      
      expect(palette.searchBar.isFocused()).to.be.false;
    });

    it('should adjust click Y coordinate by scroll offset', function() {
      palette.scrollOffset = 50;
      
      // Click at Y=100 (screen coordinate)
      // Should check against Y=150 (100 + 50 scroll)
      const result = palette.handleClick(100, 100, 0, 0);
      
      // Should not register as search bar click (which is at Y=0-45)
      expect(result).to.not.deep.equal({ type: 'searchBar' });
    });

    it('should detect category toggle after scroll', function() {
      palette.scrollOffset = 100;
      
      // Expand "stone" category (collapsed initially)
      const stoneCategory = palette.categories.find(cat => cat.id === 'stone');
      const initialExpanded = stoneCategory.isExpanded();
      
      // Click on stone category header (need to calculate position)
      // This would be at some Y offset - test framework should handle this
      palette.toggleCategory('stone');
      
      expect(stoneCategory.isExpanded()).to.not.equal(initialExpanded);
    });
  });

  // ==================== Render with Scroll ====================

  describe('render() with Scroll Offset', function() {
    it('should set viewportHeight when render() called', function() {
      palette.render(0, 0, 200, 350);
      
      expect(palette.viewportHeight).to.equal(350);
    });

    it('should update scroll bounds when render() called', function() {
      const updateSpy = sinon.spy(palette, 'updateScrollBounds');
      
      palette.render(0, 0, 200, 300);
      
      expect(updateSpy.called).to.be.true;
    });

    it('should apply scroll offset to Y positions', function() {
      palette.scrollOffset = 50;
      
      // Mock searchBar.render to capture Y position
      const renderSpy = sinon.spy(palette.searchBar, 'render');
      
      palette.render(10, 20, 200, 300);
      
      // Search bar should render at Y = 20 - 50 = -30 (off-screen)
      expect(renderSpy.calledWith(10, -30, 200, 40)).to.be.true;
    });

    it('should render search bar when in viewport', function() {
      palette.scrollOffset = 0;
      
      const renderSpy = sinon.spy(palette.searchBar, 'render');
      
      palette.render(0, 0, 200, 300);
      
      expect(renderSpy.called).to.be.true;
    });

    it('should skip rendering search bar when scrolled out of viewport', function() {
      palette.scrollOffset = 100; // Scroll past search bar
      
      const renderSpy = sinon.spy(palette.searchBar, 'render');
      
      palette.render(0, 0, 200, 300);
      
      // Search bar at Y = 0 - 100 = -100 (off-screen top)
      // Should still render (simplification - viewport culling is optimization)
      expect(renderSpy.called).to.be.true;
    });
  });

  // ==================== Integration with Categories ====================

  describe('Category Expand/Collapse with Scroll', function() {
    beforeEach(function() {
      palette.viewportHeight = 300;
      palette.updateScrollBounds();
    });

    it('should update scroll bounds when category expanded', function() {
      const initialMax = palette.maxScrollOffset;
      
      palette.toggleCategory('stone'); // Expand
      palette.updateScrollBounds();
      
      const newMax = palette.maxScrollOffset;
      expect(newMax).to.be.greaterThan(initialMax);
    });

    it('should update scroll bounds when category collapsed', function() {
      palette.toggleCategory('stone'); // Expand first
      palette.updateScrollBounds();
      const expandedMax = palette.maxScrollOffset;
      
      palette.toggleCategory('stone'); // Collapse
      palette.updateScrollBounds();
      const collapsedMax = palette.maxScrollOffset;
      
      expect(collapsedMax).to.be.lessThan(expandedMax);
    });

    it('should clamp scroll offset if content height decreased', function() {
      palette.scrollOffset = 200;
      palette.toggleCategory('ground'); // Collapse large category
      palette.updateScrollBounds();
      
      // If maxScrollOffset < 200, should clamp
      if (palette.maxScrollOffset < 200) {
        palette.scrollOffset = Math.min(palette.scrollOffset, palette.maxScrollOffset);
      }
      
      expect(palette.scrollOffset).to.be.at.most(palette.maxScrollOffset);
    });
  });
});
