/**
 * BuildingView
 * ------------
 * View class for rendering buildings.
 * 
 * Extends BaseView to provide:
 * - Building sprite rendering
 * - Health bar rendering
 * - Selection highlight rendering
 * - Reaction to model changes
 * 
 * Responsibilities:
 * - Render building sprite
 * - Render health bar when damaged
 * - React to model changes (health, death, upgrade)
 * - NO business logic
 * - NO input handling
 * 
 * Usage:
 * ```javascript
 * const view = new BuildingView(model, {
 *   imagePath: 'Images/Buildings/Cone/Cone1.png',
 *   showHealthBar: true
 * });
 * 
 * view.render(); // Render sprite and health bar
 * view.setImage(newImage); // Change building image on upgrade
 * ```
 */

// Load dependencies (Node.js require, or use global in browser)
const BaseView = (typeof require !== 'undefined') ? require('./BaseView') : window.BaseView;
// Use mock Sprite2d in tests if available, otherwise load real class
const Sprite2d = (typeof global !== 'undefined' && global.Sprite2d) ? global.Sprite2d :
                 (typeof require !== 'undefined') ? require('../rendering/Sprite2d') : window.Sprite2d;

class BuildingView extends BaseView {
  /**
   * Construct a building view.
   * @param {BuildingModel} model - The building model to render
   * @param {Object} [options={}] - View configuration options
   * @param {string} [options.imagePath] - Path to building image
   * @param {boolean} [options.showHealthBar=true] - Whether to show health bar
   */
  constructor(model, options = {}) {
    super(model, options);
    
    // Create sprite for building rendering
    if (options && options.imagePath && typeof Sprite2d !== 'undefined') {
      this._sprite = new Sprite2d(
        options.imagePath,
        model.position || { x: 0, y: 0 },
        model.size || { width: 32, height: 32 }
      );
    } else {
      this._sprite = null;
    }
    
    // Health bar visibility
    this._showHealthBar = (options && options.showHealthBar !== false);
  }
  
  /**
   * React to model changes.
   * @param {string} property - Changed property name
   * @param {*} data - New property value
   * @protected
   */
  _onModelChange(property, data) {
    if (property === 'health') {
      // Health bar updates automatically on next render
    } else if (property === 'died') {
      // Clear sprite when building dies
      this._sprite = null;
    } else if (property === 'upgraded') {
      // Image change handled by controller via setImage()
    }
  }
  
  /**
   * Render building sprite and health bar.
   * @protected
   */
  _renderContent() {
    // Render sprite
    if (this._sprite) {
      this._sprite.render();
    }
    
    // Render health bar if damaged and enabled
    if (this._showHealthBar && this._model.health < this._model.maxHealth) {
      this._renderHealthBar();
    }
  }
  
  /**
   * Render health bar above building.
   * @private
   */
  _renderHealthBar() {
    const pos = this._model.position;
    const size = this._model.size;
    const healthPercent = this._model.health / this._model.maxHealth;
    
    // Use p5.js drawing functions
    if (typeof push === 'function' && typeof fill === 'function' && typeof rect === 'function') {
      push();
      fill(255, 0, 0);
      rect(pos.x, pos.y - 10, size.width * healthPercent, 5);
      pop();
    }
  }
  
  /**
   * Set building image (for upgrades).
   * @param {Image} img - New building image
   */
  setImage(img) {
    if (this._sprite && typeof this._sprite.setImage === 'function') {
      this._sprite.setImage(img);
    }
  }
  
  /**
   * Destroy view and clean up resources.
   */
  destroy() {
    this._sprite = null;
    super.destroy();
  }
}

// Export for Node.js testing and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingView;
}

if (typeof window !== 'undefined') {
  window.BuildingView = BuildingView;
}
