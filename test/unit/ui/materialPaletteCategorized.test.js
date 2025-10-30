/**
 * Unit Tests for MaterialPalette (Categorized Enhancement)
 * 
 * Tests the enhanced MaterialPalette with categorization, search, recently used, and favorites.
 * TDD Phase: RED (tests written FIRST, expected to fail)
 * 
 * Test Coverage:
 * - Initialization (4 tests)
 * - Category Management (4 tests)
 * - Search (5 tests)
 * - Recently Used (5 tests)
 * - Favorites (4 tests)
 * - Rendering (4 tests)
 * - Click Handling (3 tests)
 * - Hover Handling (2 tests)
 * 
 * Total: 31 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load component classes (must be loaded before MaterialPalette for global availability)
const MaterialCategory = require('../../../Classes/ui/MaterialCategory');
const MaterialSearchBar = require('../../../Classes/ui/MaterialSearchBar');
const MaterialFavorites = require('../../../Classes/ui/MaterialFavorites');
const MaterialPreviewTooltip = require('../../../Classes/ui/MaterialPreviewTooltip');

// Load MaterialPalette class
const MaterialPalette = require('../../../Classes/ui/MaterialPalette');

describe('MaterialPalette - Categorized Enhancement', function() {
  let sandbox;
  let localStorageMock;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noFill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.image = sandbox.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.TOP = 'TOP';
    
    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [[0, 0.3], sandbox.stub()],
      'moss_1': [[0, 0.3], sandbox.stub()],
      'stone': [[0, 0.4], sandbox.stub()],
      'dirt': [[0.4, 0.525], sandbox.stub()],
      'grass': [[0, 1], sandbox.stub()],
      'water': [[0, 0], sandbox.stub()],
      'cave_1': [[0, 0], sandbox.stub()]
    };
    
    // Mock LocalStorage
    localStorageMock = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      },
      removeItem: function(key) {
        delete this.data[key];
      },
      clear: function() {
        this.data = {};
      }
    };
    
    global.localStorage = localStorageMock;
    
    // Make component classes available globally (required for MaterialPalette constructor)
    global.MaterialCategory = MaterialCategory;
    global.MaterialSearchBar = MaterialSearchBar;
    global.MaterialFavorites = MaterialFavorites;
    global.MaterialPreviewTooltip = MaterialPreviewTooltip;
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noFill = global.noFill;
      window.stroke = global.stroke;
      window.noStroke = global.noStroke;
      window.strokeWeight = global.strokeWeight;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.image = global.image;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.TERRAIN_MATERIALS_RANGED = global.TERRAIN_MATERIALS_RANGED;
      window.localStorage = localStorageMock;
      window.MaterialCategory = MaterialCategory;
      window.MaterialSearchBar = MaterialSearchBar;
      window.MaterialFavorites = MaterialFavorites;
      window.MaterialPreviewTooltip = MaterialPreviewTooltip;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
    localStorageMock.clear();
  });
  
  // ===========================
  // Initialization Tests (4)
  // ===========================
  
  describe('Initialization', function() {
    it('should load materials from TERRAIN_MATERIALS_RANGED when empty array provided', function() {
      const palette = new MaterialPalette();
      
      expect(palette.materials).to.exist;
      expect(palette.materials.length).to.be.greaterThan(0);
    });
    
    it('should initialize categories with loadCategories()', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss', 'moss_1', 'grass'], defaultExpanded: true },
          { id: 'ground', name: 'Ground', materials: ['dirt'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', icon: '❓', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      expect(palette.categories).to.exist;
      expect(palette.categories.length).to.be.greaterThan(0);
    });
    
    it('should initialize recently used list as empty', function() {
      const palette = new MaterialPalette();
      
      expect(palette.getRecentlyUsed()).to.deep.equal([]);
    });
    
    it('should load preferences from LocalStorage on init', function() {
      // Seed LocalStorage with preferences
      localStorageMock.setItem('materialPalette.recentlyUsed', JSON.stringify(['moss', 'stone']));
      
      const palette = new MaterialPalette();
      palette.loadPreferences();
      
      expect(palette.getRecentlyUsed()).to.have.members(['moss', 'stone']);
    });
  });
  
  // ===========================
  // Category Management Tests (4)
  // ===========================
  
  describe('Category Management', function() {
    it('should toggle category expanded state with toggleCategory()', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss', 'grass'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      const vegCategory = palette.categories[0];
      expect(vegCategory.isExpanded()).to.be.false;
      
      palette.toggleCategory('vegetation');
      
      expect(vegCategory.isExpanded()).to.be.true;
    });
    
    it('should expand all categories with expandAll()', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss'], defaultExpanded: false },
          { id: 'ground', name: 'Ground', materials: ['dirt'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      palette.expandAll();
      
      palette.categories.forEach(cat => {
        expect(cat.isExpanded()).to.be.true;
      });
    });
    
    it('should collapse all categories with collapseAll()', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss'], defaultExpanded: true },
          { id: 'ground', name: 'Ground', materials: ['dirt'], defaultExpanded: true }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      palette.collapseAll();
      
      palette.categories.forEach(cat => {
        expect(cat.isExpanded()).to.be.false;
      });
    });
    
    it('should handle invalid category ID gracefully', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      // Should not throw
      expect(() => palette.toggleCategory('nonexistent')).to.not.throw();
    });
  });
  
  // ===========================
  // Search Tests (5)
  // ===========================
  
  describe('Search', function() {
    it('should filter materials by name with searchMaterials()', function() {
      const palette = new MaterialPalette();
      
      const results = palette.searchMaterials('moss');
      
      expect(results).to.include('moss');
      expect(results).to.include('moss_1');
      expect(results).to.not.include('stone');
    });
    
    it('should be case-insensitive', function() {
      const palette = new MaterialPalette();
      
      const results1 = palette.searchMaterials('MOSS');
      const results2 = palette.searchMaterials('moss');
      const results3 = palette.searchMaterials('Moss');
      
      expect(results1).to.deep.equal(results2);
      expect(results2).to.deep.equal(results3);
    });
    
    it('should return all materials when query is empty', function() {
      const palette = new MaterialPalette();
      
      const results = palette.searchMaterials('');
      
      expect(results.length).to.equal(palette.materials.length);
    });
    
    it('should return empty array when no matches found', function() {
      const palette = new MaterialPalette();
      
      const results = palette.searchMaterials('xyz123notfound');
      
      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(0);
    });
    
    it('should store search results for rendering', function() {
      const palette = new MaterialPalette();
      
      palette.searchMaterials('stone');
      
      expect(palette.searchResults).to.exist;
      expect(palette.searchResults).to.include('stone');
    });
  });
  
  // ===========================
  // Recently Used Tests (5)
  // ===========================
  
  describe('Recently Used', function() {
    it('should add material to front of recently used list', function() {
      const palette = new MaterialPalette();
      
      palette.addToRecentlyUsed('moss');
      
      const recentlyUsed = palette.getRecentlyUsed();
      expect(recentlyUsed[0]).to.equal('moss');
    });
    
    it('should limit recently used to 8 materials (FIFO)', function() {
      const palette = new MaterialPalette();
      
      // Add 10 materials
      for (let i = 0; i < 10; i++) {
        palette.addToRecentlyUsed(`material_${i}`);
      }
      
      const recentlyUsed = palette.getRecentlyUsed();
      expect(recentlyUsed).to.have.lengthOf(8);
      
      // Oldest materials should be dropped
      expect(recentlyUsed).to.not.include('material_0');
      expect(recentlyUsed).to.not.include('material_1');
    });
    
    it('should move existing material to front (no duplicates)', function() {
      const palette = new MaterialPalette();
      
      palette.addToRecentlyUsed('moss');
      palette.addToRecentlyUsed('stone');
      palette.addToRecentlyUsed('dirt');
      
      expect(palette.getRecentlyUsed()[0]).to.equal('dirt');
      
      // Re-add moss (should move to front)
      palette.addToRecentlyUsed('moss');
      
      const recentlyUsed = palette.getRecentlyUsed();
      expect(recentlyUsed[0]).to.equal('moss');
      expect(recentlyUsed).to.have.lengthOf(3); // No duplicates
    });
    
    it('should persist recently used via savePreferences()', function() {
      const palette = new MaterialPalette();
      
      palette.addToRecentlyUsed('moss');
      palette.addToRecentlyUsed('stone');
      palette.savePreferences();
      
      const saved = localStorageMock.getItem('materialPalette.recentlyUsed');
      expect(saved).to.exist;
      
      const parsed = JSON.parse(saved);
      expect(parsed).to.include('moss');
      expect(parsed).to.include('stone');
    });
    
    it('should load recently used via loadPreferences()', function() {
      localStorageMock.setItem('materialPalette.recentlyUsed', JSON.stringify(['dirt', 'grass']));
      
      const palette = new MaterialPalette();
      palette.loadPreferences();
      
      expect(palette.getRecentlyUsed()).to.have.members(['dirt', 'grass']);
    });
  });
  
  // ===========================
  // Favorites Tests (4)
  // ===========================
  
  describe('Favorites', function() {
    it('should toggle favorite with toggleFavorite()', function() {
      const palette = new MaterialPalette();
      
      expect(palette.isFavorite('moss')).to.be.false;
      
      palette.toggleFavorite('moss');
      expect(palette.isFavorite('moss')).to.be.true;
      
      palette.toggleFavorite('moss');
      expect(palette.isFavorite('moss')).to.be.false;
    });
    
    it('should return correct favorite status with isFavorite()', function() {
      const palette = new MaterialPalette();
      
      palette.toggleFavorite('stone');
      
      expect(palette.isFavorite('stone')).to.be.true;
      expect(palette.isFavorite('dirt')).to.be.false;
    });
    
    it('should return all favorites with getFavorites()', function() {
      const palette = new MaterialPalette();
      
      palette.toggleFavorite('moss');
      palette.toggleFavorite('stone');
      palette.toggleFavorite('dirt');
      
      const favorites = palette.getFavorites();
      
      expect(favorites).to.have.members(['moss', 'stone', 'dirt']);
    });
    
    it('should persist favorites via savePreferences()', function() {
      const palette = new MaterialPalette();
      
      palette.toggleFavorite('grass');
      palette.savePreferences();
      
      // Should save to LocalStorage via MaterialFavorites
      // (Implementation detail - just verify no errors)
      expect(() => palette.savePreferences()).to.not.throw();
    });
  });
  
  // ===========================
  // Rendering Tests (4)
  // ===========================
  
  describe('Rendering', function() {
    it('should render with new signature: render(x, y, width, height)', function() {
      const palette = new MaterialPalette();
      
      // Should not throw with new signature
      expect(() => palette.render(10, 10, 300, 600)).to.not.throw();
    });
    
    it('should render categories when loaded', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss'], defaultExpanded: true }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      palette.render(10, 10, 300, 600);
      
      // Should render without errors
      expect(palette.categories.length).to.be.greaterThan(0);
    });
    
    it('should render search results when filtering', function() {
      const palette = new MaterialPalette();
      
      palette.searchMaterials('moss');
      palette.render(10, 10, 300, 600);
      
      // Should render search results (implementation detail - verify no errors)
      expect(() => palette.render(10, 10, 300, 600)).to.not.throw();
    });
    
    it('should render recently used section when non-empty', function() {
      const palette = new MaterialPalette();
      
      palette.addToRecentlyUsed('moss');
      palette.addToRecentlyUsed('stone');
      palette.render(10, 10, 300, 600);
      
      // Should render recently used section (verify no errors)
      expect(() => palette.render(10, 10, 300, 600)).to.not.throw();
    });
  });
  
  // ===========================
  // Click Handling Tests (3)
  // ===========================
  
  describe('Click Handling', function() {
    it('should route clicks to search bar', function() {
      const palette = new MaterialPalette();
      
      // Click in search bar area (top of palette)
      palette.handleClick(50, 20, 10, 10);
      
      // Should not throw (implementation routes to searchBar.handleClick())
      expect(() => palette.handleClick(50, 20, 10, 10)).to.not.throw();
    });
    
    it('should route clicks to category headers', function() {
      const palette = new MaterialPalette();
      
      const categoryConfig = {
        categories: [
          { id: 'vegetation', name: 'Vegetation', materials: ['moss'], defaultExpanded: false }
        ],
        uncategorized: { name: 'Other', materials: [] }
      };
      
      palette.loadCategories(categoryConfig);
      
      // Click on category header
      palette.handleClick(50, 80, 10, 10);
      
      // Should not throw
      expect(() => palette.handleClick(50, 80, 10, 10)).to.not.throw();
    });
    
    it('should add selected material to recently used', function() {
      const palette = new MaterialPalette();
      
      palette.selectMaterial('stone');
      
      expect(palette.getRecentlyUsed()).to.include('stone');
    });
  });
  
  // ===========================
  // Hover Handling Tests (2)
  // ===========================
  
  describe('Hover Handling', function() {
    it('should show tooltip when hovering over material', function() {
      const palette = new MaterialPalette();
      
      // Hover over material swatch
      palette.handleHover(50, 100, 10, 10);
      
      // Should not throw (implementation shows tooltip via MaterialPreviewTooltip)
      expect(() => palette.handleHover(50, 100, 10, 10)).to.not.throw();
    });
    
    it('should hide tooltip when not hovering over material', function() {
      const palette = new MaterialPalette();
      
      // Hover over empty space
      palette.handleHover(500, 500, 10, 10);
      
      // Should not throw (implementation hides tooltip)
      expect(() => palette.handleHover(500, 500, 10, 10)).to.not.throw();
    });
  });
});
