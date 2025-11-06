/**
 * BuildingView - Specialized rendering for building models
 * Extends EntityView with building-specific visuals
 * 
 * Features:
 * - **Building type sprites** - Different sprite for each building type
 * - **Faction colors** - Tint sprites based on faction
 * - **Level badges** - Visual indicators for upgrade tiers
 * - **Health bars** - Visual health indicator when damaged
 * - **Fallback rendering** - Colored rectangles when sprites unavailable
 * 
 * Usage:
 * ```javascript
 * const view = new BuildingView();
 * const buildingModel = new BuildingModel({ x: 100, y: 200, buildingType: 'AntHill', level: 3 });
 * 
 * view.render(buildingModel, graphics);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityView === 'undefined') {
  var EntityView = require('./EntityView');
}

class BuildingView extends EntityView {
  /**
   * Sprite name mapping for building types
   * @private
   */
  _getSpriteName(buildingType) {
    const spriteMap = {
      'AntHill': 'building_anthill',
      'Cone': 'building_cone',
      'Hive': 'building_hive',
      'Tower': 'building_tower'
    };
    
    return spriteMap[buildingType] || 'building_anthill'; // Default to AntHill
  }
  
  /**
   * Fallback color for building types (when sprites unavailable)
   * @private
   */
  _getBuildingColor(buildingType) {
    const colorMap = {
      'AntHill': [139, 90, 43],    // Brown
      'Cone': [200, 180, 140],     // Tan
      'Hive': [255, 215, 0],       // Gold
      'Tower': [100, 100, 150]     // Blue-gray
    };
    
    return colorMap[buildingType] || [150, 150, 150]; // Default gray
  }
  
  /**
   * Render building model to graphics context
   * @param {BuildingModel} model - Building model to render
   * @param {Object} graphics - p5.js graphics context
   * @param {Object} [options] - Rendering options
   */
  render(model, graphics, options = {}) {
    // Validation
    if (!model) {
      throw new Error('BuildingView.render: model is required');
    }
    if (!graphics) {
      throw new Error('BuildingView.render: graphics context is required');
    }
    
    // Skip rendering if model is disabled
    if (!model.enabled) {
      return;
    }
    
    // Isolate graphics state
    graphics.push();
    
    try {
      const position = model.getPosition();
      const size = model.getSize();
      
      // 1. Render building sprite or fallback
      this._renderBuildingSprite(model, graphics);
      
      // 2. Render level badge (if level > 1)
      if (model.level > 1) {
        this._renderLevelBadge(model, graphics);
      }
      
      // 3. Render health bar (if damaged and health is defined)
      if (model.health !== undefined && model.maxHealth !== undefined) {
        if (model.health < model.maxHealth) {
          this._renderHealthBar(model, graphics);
        }
      }
      
    } finally {
      graphics.pop();
    }
  }
  
  /**
   * Render building sprite with type-specific sprite and faction tint
   * @private
   */
  _renderBuildingSprite(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const spriteName = this._getSpriteName(model.buildingType);
    
    // Check if sprite manager is available (browser environment)
    if (typeof window !== 'undefined' && window.spriteManager) {
      const sprite = window.spriteManager.getSprite(spriteName);
      
      if (sprite && sprite.image) {
        // Apply faction tint
        this._applyFactionTint(model.faction, graphics);
        
        // Draw sprite centered at position
        graphics.imageMode(window.CENTER || 'center');
        graphics.image(sprite.image, position.x, position.y, size.width, size.height);
        
        // Reset tint
        graphics.noTint();
      } else {
        // Sprite not loaded yet, use fallback
        this._renderFallbackRect(model, graphics);
      }
    } else {
      // No sprite manager (testing environment), use fallback
      this._renderFallbackRect(model, graphics);
    }
  }
  
  /**
   * Apply faction-based tint to sprite
   * @private
   */
  _applyFactionTint(faction, graphics) {
    switch (faction) {
      case 'player':
        // No tint for player faction (default sprites)
        graphics.noTint();
        break;
      case 'enemy':
        // Red tint for enemy faction
        graphics.tint(255, 100, 100);
        break;
      case 'neutral':
        // Gray tint for neutral faction
        graphics.tint(150, 150, 150);
        break;
      default:
        graphics.noTint();
    }
  }
  
  /**
   * Render fallback colored rectangle (when sprites unavailable)
   * @private
   */
  _renderFallbackRect(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const color = this._getBuildingColor(model.buildingType);
    
    graphics.fill(color[0], color[1], color[2]);
    graphics.stroke(0, 0, 0);
    graphics.strokeWeight(2);
    graphics.rect(position.x, position.y, size.width, size.height);
  }
  
  /**
   * Render level badge in top-right corner
   * @private
   */
  _renderLevelBadge(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    
    const badgeRadius = 12;
    const badgeX = position.x + size.width - 8;
    const badgeY = position.y + 8;
    
    // Badge background circle
    graphics.fill(255, 215, 0); // Gold
    graphics.stroke(0, 0, 0);
    graphics.strokeWeight(2);
    graphics.ellipse(badgeX, badgeY, badgeRadius * 2, badgeRadius * 2);
    
    // Level text
    graphics.fill(0, 0, 0); // Black text
    graphics.noStroke();
    graphics.textSize(10);
    graphics.textAlign(window.CENTER || 'center', window.CENTER || 'center');
    graphics.text(model.level.toString(), badgeX, badgeY);
  }
  
  /**
   * Render health bar above building
   * @private
   */
  _renderHealthBar(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const healthPercent = model.health / model.maxHealth;
    
    const barWidth = size.width - 4; // Padding
    const barHeight = 6;
    const barX = position.x + 2;
    const barY = position.y - 12; // Above building
    
    // Background (red)
    graphics.fill(255, 0, 0);
    graphics.noStroke();
    graphics.rect(barX, barY, barWidth, barHeight);
    
    // Foreground (green, proportional to health)
    graphics.fill(0, 255, 0);
    graphics.rect(barX, barY, barWidth * healthPercent, barHeight);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BuildingView;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.BuildingView = BuildingView;
}
