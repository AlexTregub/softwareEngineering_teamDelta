/**
 * MaterialFavorites - Favorites management system with LocalStorage persistence
 * 
 * Manages a set of favorite materials with LocalStorage persistence.
 * Provides add/remove/toggle operations and query methods.
 * 
 * Usage:
 * const favorites = new MaterialFavorites();
 * favorites.add('moss');
 * favorites.toggle('stone');
 * favorites.save();
 * 
 * @class MaterialFavorites
 */
class MaterialFavorites {
  /**
   * Initialize favorites set
   */
  constructor() {
    this.favorites = new Set();
    this.storageKey = 'materialPalette.favorites';
  }
  
  /**
   * Add material to favorites
   * @param {string} material - Material name
   */
  add(material) {
    this.favorites.add(material);
  }
  
  /**
   * Remove material from favorites
   * @param {string} material - Material name
   */
  remove(material) {
    this.favorites.delete(material);
  }
  
  /**
   * Toggle material (add if not present, remove if present)
   * @param {string} material - Material name
   */
  toggle(material) {
    if (this.favorites.has(material)) {
      this.favorites.delete(material);
    } else {
      this.favorites.add(material);
    }
  }
  
  /**
   * Check if material is in favorites
   * @param {string} material - Material name
   * @returns {boolean}
   */
  has(material) {
    return this.favorites.has(material);
  }
  
  /**
   * Get all favorites as array
   * @returns {Array<string>}
   */
  getAll() {
    return Array.from(this.favorites);
  }
  
  /**
   * Save favorites to LocalStorage
   */
  save() {
    try {
      const favoritesArray = Array.from(this.favorites);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(favoritesArray));
      }
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
  }
  
  /**
   * Load favorites from LocalStorage
   */
  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const favoritesArray = JSON.parse(stored);
          this.favorites = new Set(favoritesArray);
        }
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e);
      this.favorites = new Set();
    }
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MaterialFavorites;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MaterialFavorites = MaterialFavorites;
}
