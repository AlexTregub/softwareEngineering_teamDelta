/**
 * AntView - Specialized rendering for ant models
 * Extends EntityView with ant-specific visuals
 * 
 * Features:
 * - **Job-specific sprites** - Different sprite for each job type
 * - **Faction colors** - Tint sprites based on faction
 * - **Health bars** - Visual health indicator when damaged
 * - **Selection highlighting** - Yellow ring when selected
 * - **Fallback rendering** - Colored rectangles when sprites unavailable
 * 
 * Usage:
 * ```javascript
 * const view = new AntView();
 * const antModel = new AntModel({ x: 100, y: 200, jobName: 'Scout' });
 * 
 * view.render(antModel, graphics);
 * ```
 */

// Conditional import for Node.js environment
if (typeof module !== 'undefined' && typeof EntityView === 'undefined') {
  var EntityView = require('./EntityView');
}

class AntView extends EntityView {
  /**
   * Sprite name mapping for job types
   * @private
   */
  _getSpriteName(jobName) {
    const spriteMap = {
      'Scout': 'ant_scout',
      'Warrior': 'ant_warrior',
      'Builder': 'ant_builder',
      'Farmer': 'ant_farmer',
      'Spitter': 'ant_spitter',
      'Queen': 'ant_queen'
    };
    
    return spriteMap[jobName] || 'ant_scout'; // Default to scout
  }
  
  /**
   * Fallback color for job types (when sprites unavailable)
   * @private
   */
  _getJobColor(jobName) {
    const colorMap = {
      'Scout': [100, 200, 255],   // Light blue
      'Warrior': [255, 100, 100],  // Red
      'Builder': [200, 150, 100],  // Brown
      'Farmer': [100, 200, 100],   // Green
      'Spitter': [200, 100, 255],  // Purple
      'Queen': [255, 215, 0]       // Gold
    };
    
    return colorMap[jobName] || [150, 150, 150]; // Default gray
  }
  
  /**
   * Render ant model to graphics context
   * @param {AntModel} model - Ant model to render
   * @param {Object} graphics - p5.js graphics context
   * @param {Object} [options] - Rendering options
   */
  render(model, graphics, options = {}) {
    // Validation
    if (!model) {
      throw new Error('AntView.render: model is required');
    }
    if (!graphics) {
      throw new Error('AntView.render: graphics context is required');
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
      
      // 1. Render selection ring (behind sprite)
      if (model.isSelected) {
        this._renderSelectionRing(model, graphics);
      }
      
      // 2. Render ant sprite or fallback
      this._renderAntSprite(model, graphics);
      
      // 3. Render health bar (if damaged)
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
   * Render ant sprite with job-specific sprite and faction tint
   * @private
   */
  _renderAntSprite(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const spriteName = this._getSpriteName(model.jobName);
    
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
    const color = this._getJobColor(model.jobName);
    
    graphics.fill(color[0], color[1], color[2]);
    graphics.stroke(0, 0, 0);
    graphics.strokeWeight(1);
    graphics.rect(position.x, position.y, size.width, size.height);
  }
  
  /**
   * Render selection ring around ant
   * @private
   */
  _renderSelectionRing(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    
    graphics.noFill();
    graphics.stroke(255, 255, 0); // Yellow
    graphics.strokeWeight(2);
    graphics.ellipse(
      position.x + size.width / 2,
      position.y + size.height / 2,
      size.width + 8,
      size.height + 8
    );
  }
  
  /**
   * Render health bar above ant
   * @private
   */
  _renderHealthBar(model, graphics) {
    const position = model.getPosition();
    const size = model.getSize();
    const healthPercent = model.health / model.maxHealth;
    
    const barWidth = size.width - 4; // Padding
    const barHeight = 4;
    const barX = position.x + 2;
    const barY = position.y - 8; // Above ant
    
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
  module.exports = AntView;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.AntView = AntView;
}
