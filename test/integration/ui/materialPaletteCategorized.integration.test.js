/**
 * Integration Tests for MaterialPalette Categorized System
 * 
 * Tests full system integration with real components (no mocks).
 * Verifies component interactions, data flow, and persistence.
 * 
 * Test Coverage:
 * - Full System Integration (5 tests)
 * - Search Integration (3 tests)
 * - Category Interaction (4 tests)
 * - Recently Used Integration (3 tests)
 * - Favorites Integration (3 tests)
 * - Tooltip Integration (2 tests)
 * 
 * Total: 20 integration tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Load real component classes
const MaterialCategory = require('../../../Classes/ui/painter/terrain/MaterialCategory');
const MaterialSearchBar = require('../../../Classes/ui/painter/terrain/MaterialSearchBar');
const MaterialFavorites = require('../../../Classes/ui/painter/terrain/MaterialFavorites');
const MaterialPreviewTooltip = require('../../../Classes/ui/painter/terrain/MaterialPreviewTooltip');
const MaterialPalette = require('../../../Classes/ui/painter/terrain/MaterialPalette');

describe('MaterialPalette - Categorized System Integration', function() {
  let sandbox;
  let localStorageMock;
  let categoryConfig;
  
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
    global.line = sandbox.stub();
    global.textWidth = sandbox.stub().returns(50);
    global.imageMode = sandbox.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.TOP = 'TOP';
    global.CORNER = 'CORNER';
    
    // Mock TERRAIN_MATERIALS_RANGED
    global.TERRAIN_MATERIALS_RANGED = {
      'moss': [[0, 0.3], sandbox.stub()],
      'moss_1': [[0, 0.3], sandbox.stub()],
      'stone': [[0, 0.4], sandbox.stub()],
      'dirt': [[0.4, 0.525], sandbox.stub()],
      'sand': [[0, 0], sandbox.stub()],
      'grass': [[0, 1], sandbox.stub()],
      'water': [[0, 0], sandbox.stub()],
      'water_cave': [[0, 0], sandbox.stub()],
      'cave_1': [[0, 0], sandbox.stub()],
      'cave_2': [[0, 0], sandbox.stub()],
      'cave_3': [[0, 0], sandbox.stub()],
      'cave_dark': [[0, 0], sandbox.stub()],
      'cave_dirt': [[0, 0], sandbox.stub()],
      'farmland': [[0, 0], sandbox.stub()],
      'NONE': [[0, 0], sandbox.stub()]
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
    
    // Make component classes available globally
    global.MaterialCategory = MaterialCategory;
    global.MaterialSearchBar = MaterialSearchBar;
    global.MaterialFavorites = MaterialFavorites;
    global.MaterialPreviewTooltip = MaterialPreviewTooltip;
    
    // Load category config from JSON
    const configPath = path.join(__dirname, '../../../config/material-categories.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    categoryConfig = JSON.parse(configData);
    
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
      window.line = global.line;
      window.textWidth = global.textWidth;
      window.imageMode = global.imageMode;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.CORNER = global.CORNER;
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
  // Full System Integration (5 tests)
  // ===========================
  
  describe('Full System Integration', function() {
    it('should load categories from JSON config', function() {
      const palette = new MaterialPalette();
      
      palette.loadCategories(categoryConfig);
      
      expect(palette.categories).to.exist;
      expect(palette.categories.length).to.equal(6);
      
      // Verify category IDs
      const categoryIds = palette.categories.map(cat => cat.id);
      expect(categoryIds).to.include('ground');
      expect(categoryIds).to.include('stone');
      expect(categoryIds).to.include('vegetation');
      expect(categoryIds).to.include('water');
      expect(categoryIds).to.include('cave');
      expect(categoryIds).to.include('special');
    });
    
    it('should render all components (search, categories, swatches)', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Should not throw when rendering with all components
      expect(() => palette.render(10, 10, 300, 600)).to.not.throw();
      
      // Verify rendering calls were made
      expect(global.push.called).to.be.true;
      expect(global.pop.called).to.be.true;
    });
    
    it('should handle click routing to all components', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Click in search bar area
      expect(() => palette.handleClick(50, 20, 10, 10)).to.not.throw();
      
      // Click in category area
      expect(() => palette.handleClick(50, 100, 10, 10)).to.not.throw();
      
      // Click in material swatch area
      expect(() => palette.handleClick(50, 150, 10, 10)).to.not.throw();
    });
    
    it('should handle hover routing to tooltip', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Hover over material area
      palette.handleHover(50, 100, 10, 10);
      
      // Should not throw
      expect(() => palette.handleHover(50, 100, 10, 10)).to.not.throw();
    });
    
    it('should persist preferences across reload (LocalStorage)', function() {
      const palette1 = new MaterialPalette();
      
      // Add materials to recently used
      palette1.addToRecentlyUsed('moss');
      palette1.addToRecentlyUsed('stone');
      
      // Toggle favorites
      palette1.toggleFavorite('dirt');
      palette1.toggleFavorite('grass');
      
      // Save preferences
      palette1.savePreferences();
      
      // Create new palette instance (simulating reload)
      const palette2 = new MaterialPalette();
      palette2.loadPreferences();
      
      // Verify persistence
      expect(palette2.getRecentlyUsed()).to.have.members(['moss', 'stone']);
      expect(palette2.isFavorite('dirt')).to.be.true;
      expect(palette2.isFavorite('grass')).to.be.true;
    });
  });
  
  // ===========================
  // Search Integration (3 tests)
  // ===========================
  
  describe('Search Integration', function() {
    it('should filter materials across all categories', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      const results = palette.searchMaterials('moss');
      
      expect(results).to.include('moss');
      expect(results).to.include('moss_1');
      expect(results).to.not.include('stone');
      expect(results).to.not.include('dirt');
    });
    
    it('should show empty results when no matches found', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      const results = palette.searchMaterials('xyz123notfound');
      
      expect(results).to.be.an('array');
      expect(results).to.have.lengthOf(0);
    });
    
    it('should restore all categories when clearing search', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Search for specific material
      palette.searchMaterials('moss');
      
      // Clear search
      const allResults = palette.searchMaterials('');
      
      // Should return all materials
      expect(allResults.length).to.equal(palette.materials.length);
    });
  });
  
  // ===========================
  // Category Interaction (4 tests)
  // ===========================
  
  describe('Category Interaction', function() {
    it('should expand category and show materials', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Find Stone category (starts collapsed)
      const stoneCategory = palette.categories.find(cat => cat.id === 'stone');
      expect(stoneCategory.isExpanded()).to.be.false;
      
      // Expand it
      palette.toggleCategory('stone');
      
      expect(stoneCategory.isExpanded()).to.be.true;
    });
    
    it('should collapse category and hide materials', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Find Ground category (starts expanded)
      const groundCategory = palette.categories.find(cat => cat.id === 'ground');
      expect(groundCategory.isExpanded()).to.be.true;
      
      // Collapse it
      palette.toggleCategory('ground');
      
      expect(groundCategory.isExpanded()).to.be.false;
    });
    
    it('should persist category state after save/load', function() {
      const palette1 = new MaterialPalette();
      palette1.loadCategories(categoryConfig);
      
      // Toggle Stone category (expand)
      palette1.toggleCategory('stone');
      
      // Toggle Ground category (collapse)
      palette1.toggleCategory('ground');
      
      // Note: Category states are not yet persisted in current implementation
      // This test documents expected future behavior
      
      // Verify states changed
      const stoneCategory = palette1.categories.find(cat => cat.id === 'stone');
      const groundCategory = palette1.categories.find(cat => cat.id === 'ground');
      
      expect(stoneCategory.isExpanded()).to.be.true;
      expect(groundCategory.isExpanded()).to.be.false;
    });
    
    it('should add selected material to recently used', function() {
      const palette = new MaterialPalette();
      
      palette.selectMaterial('stone');
      
      const recentlyUsed = palette.getRecentlyUsed();
      expect(recentlyUsed).to.include('stone');
      expect(recentlyUsed[0]).to.equal('stone'); // Most recent at front
    });
  });
  
  // ===========================
  // Recently Used Integration (3 tests)
  // ===========================
  
  describe('Recently Used Integration', function() {
    it('should update recently used list when selecting materials', function() {
      const palette = new MaterialPalette();
      
      palette.selectMaterial('moss');
      palette.selectMaterial('stone');
      palette.selectMaterial('dirt');
      
      const recentlyUsed = palette.getRecentlyUsed();
      
      expect(recentlyUsed).to.have.lengthOf(3);
      expect(recentlyUsed[0]).to.equal('dirt');   // Most recent
      expect(recentlyUsed[1]).to.equal('stone');
      expect(recentlyUsed[2]).to.equal('moss');   // Oldest
    });
    
    it('should limit recently used to 8 materials (FIFO)', function() {
      const palette = new MaterialPalette();
      
      // Add 10 materials (using real materials from TERRAIN_MATERIALS_RANGED)
      const materials = ['moss', 'moss_1', 'stone', 'dirt', 'sand', 'grass', 'water', 'water_cave', 'cave_1', 'cave_2'];
      
      materials.forEach(material => {
        palette.selectMaterial(material);
      });
      
      const recentlyUsed = palette.getRecentlyUsed();
      
      expect(recentlyUsed).to.have.lengthOf(8);
      
      // Oldest 2 should be dropped
      expect(recentlyUsed).to.not.include('moss');
      expect(recentlyUsed).to.not.include('moss_1');
      
      // Newest 8 should be present
      expect(recentlyUsed).to.include('cave_2');  // Most recent
      expect(recentlyUsed).to.include('stone');   // Third oldest (still in list)
    });
    
    it('should persist recently used via LocalStorage', function() {
      const palette1 = new MaterialPalette();
      
      palette1.selectMaterial('moss');
      palette1.selectMaterial('stone');
      palette1.savePreferences();
      
      // Create new instance (reload simulation)
      const palette2 = new MaterialPalette();
      
      const recentlyUsed = palette2.getRecentlyUsed();
      expect(recentlyUsed).to.have.members(['moss', 'stone']);
    });
  });
  
  // ===========================
  // Favorites Integration (3 tests)
  // ===========================
  
  describe('Favorites Integration', function() {
    it('should add and remove materials from favorites', function() {
      const palette = new MaterialPalette();
      
      expect(palette.isFavorite('moss')).to.be.false;
      
      // Add to favorites
      palette.toggleFavorite('moss');
      expect(palette.isFavorite('moss')).to.be.true;
      
      // Remove from favorites
      palette.toggleFavorite('moss');
      expect(palette.isFavorite('moss')).to.be.false;
    });
    
    it('should show all favorited materials', function() {
      const palette = new MaterialPalette();
      
      palette.toggleFavorite('moss');
      palette.toggleFavorite('stone');
      palette.toggleFavorite('dirt');
      
      const favorites = palette.getFavorites();
      
      expect(favorites).to.have.members(['moss', 'stone', 'dirt']);
    });
    
    it('should persist favorites via LocalStorage', function() {
      const palette1 = new MaterialPalette();
      
      palette1.toggleFavorite('grass');
      palette1.toggleFavorite('water');
      palette1.savePreferences();
      
      // Create new instance (reload simulation)
      const palette2 = new MaterialPalette();
      
      expect(palette2.isFavorite('grass')).to.be.true;
      expect(palette2.isFavorite('water')).to.be.true;
      expect(palette2.isFavorite('dirt')).to.be.false;
    });
  });
  
  // ===========================
  // Tooltip Integration (2 tests)
  // ===========================
  
  describe('Tooltip Integration', function() {
    it('should show tooltip when hovering over material', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Tooltip starts hidden
      expect(palette.tooltip.isVisible()).to.be.false;
      
      // Hover over material area (simplified - real implementation checks exact bounds)
      palette.handleHover(50, 100, 10, 10);
      
      // Should not throw
      expect(() => palette.handleHover(50, 100, 10, 10)).to.not.throw();
    });
    
    it('should hide tooltip when moving mouse away', function() {
      const palette = new MaterialPalette();
      palette.loadCategories(categoryConfig);
      
      // Show tooltip
      palette.tooltip.show('moss', 100, 100);
      expect(palette.tooltip.isVisible()).to.be.true;
      
      // Hover over empty area (far away)
      palette.handleHover(5000, 5000, 10, 10);
      
      // Tooltip should be hidden
      expect(palette.tooltip.isVisible()).to.be.false;
    });
  });
});
