/**
 * Unit Tests for MaterialFavorites
 * 
 * Tests the favorites management system with LocalStorage persistence.
 * TDD Phase: RED (tests written FIRST, expected to fail)
 * 
 * Test Coverage:
 * - Initialization (3 tests)
 * - Add/Remove (5 tests)
 * - Query (3 tests)
 * - Persistence (4 tests)
 * 
 * Total: 15 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const MaterialFavorites = require('../../../Classes/ui/MaterialFavorites');

describe('MaterialFavorites', function() {
  let sandbox;
  let localStorageMock;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
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
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.localStorage = localStorageMock;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
    localStorageMock.clear();
  });
  
  // ===========================
  // Initialization Tests (3)
  // ===========================
  
  describe('Initialization', function() {
    it('should initialize with empty favorites set', function() {
      const favorites = new MaterialFavorites();
      
      expect(favorites).to.exist;
      expect(favorites.getAll()).to.deep.equal([]);
    });
    
    it('should load favorites from LocalStorage if available', function() {
      // Seed LocalStorage with favorites
      localStorageMock.setItem('materialPalette.favorites', JSON.stringify(['moss', 'stone']));
      
      const favorites = new MaterialFavorites();
      favorites.load();
      
      expect(favorites.getAll()).to.have.members(['moss', 'stone']);
    });
    
    it('should handle missing LocalStorage key gracefully', function() {
      const favorites = new MaterialFavorites();
      
      // Should not throw
      expect(() => favorites.load()).to.not.throw();
      
      expect(favorites.getAll()).to.deep.equal([]);
    });
  });
  
  // ===========================
  // Add/Remove Tests (5)
  // ===========================
  
  describe('Add/Remove', function() {
    it('should add material to favorites set', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      
      expect(favorites.has('moss')).to.be.true;
      expect(favorites.getAll()).to.include('moss');
    });
    
    it('should remove material from favorites set', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      expect(favorites.has('moss')).to.be.true;
      
      favorites.remove('moss');
      
      expect(favorites.has('moss')).to.be.false;
    });
    
    it('should toggle material (add if not present, remove if present)', function() {
      const favorites = new MaterialFavorites();
      
      // Toggle to add
      favorites.toggle('moss');
      expect(favorites.has('moss')).to.be.true;
      
      // Toggle to remove
      favorites.toggle('moss');
      expect(favorites.has('moss')).to.be.false;
    });
    
    it('should ignore duplicate add (set behavior)', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      favorites.add('moss');
      favorites.add('moss');
      
      expect(favorites.getAll()).to.have.lengthOf(1);
      expect(favorites.getAll()).to.deep.equal(['moss']);
    });
    
    it('should handle remove of non-existent material gracefully', function() {
      const favorites = new MaterialFavorites();
      
      // Should not throw
      expect(() => favorites.remove('nonexistent')).to.not.throw();
    });
  });
  
  // ===========================
  // Query Tests (3)
  // ===========================
  
  describe('Query', function() {
    it('should return true if material is in favorites', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      
      expect(favorites.has('moss')).to.be.true;
    });
    
    it('should return false if material is not in favorites', function() {
      const favorites = new MaterialFavorites();
      
      expect(favorites.has('stone')).to.be.false;
    });
    
    it('should return array of all favorites with getAll()', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      favorites.add('stone');
      favorites.add('dirt');
      
      const allFavorites = favorites.getAll();
      
      expect(allFavorites).to.be.an('array');
      expect(allFavorites).to.have.lengthOf(3);
      expect(allFavorites).to.have.members(['moss', 'stone', 'dirt']);
    });
  });
  
  // ===========================
  // Persistence Tests (4)
  // ===========================
  
  describe('Persistence', function() {
    it('should save favorites to LocalStorage', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      favorites.add('stone');
      favorites.save();
      
      const saved = localStorageMock.getItem('materialPalette.favorites');
      expect(saved).to.exist;
      
      const parsed = JSON.parse(saved);
      expect(parsed).to.have.members(['moss', 'stone']);
    });
    
    it('should load favorites from LocalStorage', function() {
      localStorageMock.setItem('materialPalette.favorites', JSON.stringify(['dirt', 'grass']));
      
      const favorites = new MaterialFavorites();
      favorites.load();
      
      expect(favorites.getAll()).to.have.members(['dirt', 'grass']);
    });
    
    it('should preserve favorites after save then load', function() {
      const favorites1 = new MaterialFavorites();
      favorites1.add('moss');
      favorites1.add('stone');
      favorites1.add('dirt');
      favorites1.save();
      
      const favorites2 = new MaterialFavorites();
      favorites2.load();
      
      expect(favorites2.getAll()).to.have.members(['moss', 'stone', 'dirt']);
    });
    
    it('should use namespaced LocalStorage key', function() {
      const favorites = new MaterialFavorites();
      
      favorites.add('moss');
      favorites.save();
      
      // Should save under 'materialPalette.favorites' key
      const saved = localStorageMock.getItem('materialPalette.favorites');
      expect(saved).to.exist;
    });
  });
  
  // ===========================
  // Edge Cases (2)
  // ===========================
  
  describe('Edge Cases', function() {
    it('should handle corrupted LocalStorage data gracefully', function() {
      localStorageMock.setItem('materialPalette.favorites', 'invalid json [}');
      
      const favorites = new MaterialFavorites();
      
      // Should not throw
      expect(() => favorites.load()).to.not.throw();
      
      // Should fall back to empty set
      expect(favorites.getAll()).to.deep.equal([]);
    });
    
    it('should handle LocalStorage quota exceeded gracefully', function() {
      const favorites = new MaterialFavorites();
      
      // Mock quota exceeded error
      sandbox.stub(localStorageMock, 'setItem').throws(new Error('QuotaExceededError'));
      
      favorites.add('moss');
      
      // Should not throw
      expect(() => favorites.save()).to.not.throw();
    });
  });
});
