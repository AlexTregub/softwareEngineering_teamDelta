/**
 * AntCountDisplayComponent - Population Display
 * 
 * Displays total ant count and breakdown by job type (Worker, Builder, Farmer, Scout, Soldier, Spitter, Queen)
 * Features expandable section and real-time updates by querying the global ants array
 * 
 * Adapted from AntRedo fork's PopulationDisplayComponent for dw_eventBus branch
 * 
 * @class AntCountDisplayComponent
 */

class AntCountDisplayComponent {
  /**
   * Create an AntCountDisplayComponent
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.sprites] - Ant sprites for icons
   */
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    
    // Ant counts
    this.currentAnts = 0;
    this.maxAnts = 50; // Default cap (can be updated externally)
    this.isExpanded = false;
    
    // Ant type counts - all job types from JobComponent
    this.antTypes = [
      { type: 'Worker', count: 0, icon: null, color: [255, 215, 0] },    // Gold
      { type: 'Builder', count: 0, icon: null, color: [139, 90, 43] },   // Brown
      { type: 'Farmer', count: 0, icon: null, color: [76, 175, 80] },    // Green
      { type: 'Scout', count: 0, icon: null, color: [33, 150, 243] },    // Blue
      { type: 'Soldier', count: 0, icon: null, color: [255, 68, 68] },   // Red (Warrior)
      { type: 'Spitter', count: 0, icon: null, color: [156, 39, 176] },  // Purple
      { type: 'Queen', count: 0, icon: null, color: [255, 193, 7] }      // Amber
    ];
    
    // Layout properties
    this.panelWidth = 180;
    this.panelHeight = 60; // Collapsed height
    this.expandedHeight = 240; // Expanded height (7 types)
    this.padding = 12;
    this.lineSpacing = 25;
    this.fontSize = 14;
    this.iconSize = 20;
    
    // Visual settings
    this.backgroundColor = [44, 44, 44]; // #2C2C2C
    this.backgroundAlpha = 200;
    this.hoverAlpha = 230;
    this.isHovering = false;
    
    // Animation (framerate-independent)
    this.currentHeight = this.panelHeight;
    this.animationSpeed = 8.0; // Units per second (was 0.2 lerp at 60fps)
    
    // Sprites (will be loaded from JobImages global if available)
    this.sprites = options.sprites || {};
    this.antSprite = options.sprites?.ant || null;
    
    // Try to auto-load sprites from JobImages global
    this.loadSpritesFromJobImages();
    }
  
  /**
   * Load sprites from global JobImages object
   * @private
   */
  loadSpritesFromJobImages() {
    if (typeof JobImages === 'undefined') {
      console.warn('⚠️ JobImages not defined, sprites will not load');
      return;
    }
    
    // Map job names to ant types
    const spriteMap = {
      'Worker': 'Scout',  // Use Scout sprite for Worker (fallback)
      'Builder': 'Builder',
      'Farmer': 'Farmer',
      'Scout': 'Scout',
      'Soldier': 'Warrior', // Map Soldier to Warrior sprite
      'Spitter': 'Spitter',
      'Queen': 'Queen'
    };
    
    this.antTypes.forEach((antType, index) => {
      const spriteName = spriteMap[antType.type];
      if (spriteName && JobImages[spriteName]) {
        this.antTypes[index].icon = JobImages[spriteName];
      }
    });
    
    // Set generic ant sprite for header
    if (!this.antSprite && JobImages.Scout) {
      this.antSprite = JobImages.Scout;
    }
  }
  
  /**
   * Query global ants array for real-time ant counts
   * @private
   */
  updateFromAntsArray() {
    // Access global ants array
    if (typeof ants === 'undefined' || !Array.isArray(ants)) {
      this.currentAnts = 0;
      this.antTypes.forEach(type => type.count = 0);
      return;
    }
    
    // Filter for player faction only
    const playerAnts = ants.filter(ant => {
      if (!ant) return false;
      
      // Check various faction properties
      if (ant._faction === 'player') return true;
      if (ant.faction === 'player') return true;
      if (typeof ant.getFaction === 'function' && ant.getFaction() === 'player') return true;
      
      // Default to player if no faction specified (for backward compatibility)
      if (!ant._faction && !ant.faction) return true;
      
      return false;
    });
    
    this.currentAnts = playerAnts.length;
    
    // Reset type counts
    this.antTypes.forEach(type => type.count = 0);
    
    // Count by job type (only player ants)
    playerAnts.forEach(ant => {
      // Get job name from various possible properties
      let jobName = null;
      
      if (ant.JobName) jobName = ant.JobName;
      else if (ant.jobName) jobName = ant.jobName;
      else if (ant._JobName) jobName = ant._JobName;
      else if (ant.job && ant.job.name) jobName = ant.job.name;
      else jobName = 'Scout'; // Default fallback
      
      // Map job names to display types
      // Handle aliases: Warrior -> Soldier, Gatherer -> Worker
      if (jobName === 'Warrior') jobName = 'Soldier';
      if (jobName === 'Gatherer') jobName = 'Worker';
      
      const antType = this.antTypes.find(t => t.type === jobName);
      if (antType) {
        antType.count++;
      } else {
        // Default to Scout for unknown job types
        const scoutType = this.antTypes.find(t => t.type === 'Scout');
        if (scoutType) scoutType.count++;
      }
    });
  }
  
  /**
   * Update total ant count manually (optional external control)
   * @param {number} current - Current ant count
   * @param {number} max - Maximum ant capacity
   */
  updateTotal(current, max) {
    this.currentAnts = current;
    this.maxAnts = max;
  }
  
  /**
   * Update count for specific ant type (optional external control)
   * @param {string} type - Type name (Worker, Builder, etc.)
   * @param {number} count - New count
   */
  updateTypeCount(type, count) {
    const antType = this.antTypes.find(t => t.type === type);
    if (antType) {
      antType.count = count;
    }
  }
  
  /**
   * Set expanded state
   * @param {boolean} expanded - Whether expanded
   */
  setExpanded(expanded) {
    this.isExpanded = expanded;
  }
  
  /**
   * Toggle expanded state
   */
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }
  
  /**
   * Check if mouse is over the panel
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if mouse over panel
   */
  isMouseOver(mouseX, mouseY) {
    return (
      mouseX >= this.x &&
      mouseX <= this.x + this.panelWidth &&
      mouseY >= this.y &&
      mouseY <= this.y + this.currentHeight
    );
  }
  
  /**
   * Handle mouse click
   * @param {number} mouseX - Mouse X position
   * @param {number} mouseY - Mouse Y position
   * @returns {boolean} True if click was on panel
   */
  handleClick(mouseX, mouseY) {
    if (this.isMouseOver(mouseX, mouseY)) {
      this.toggleExpanded();
      return true;
    }
    return false;
  }
  
  /**
   * Set hover state
   * @param {boolean} hovered - Whether panel is hovered
   */
  setHovered(hovered) {
    this.isHovering = hovered;
  }
  
  /**
   * Set position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Update animation state and query real-time ant counts
   */
  update() {
    // Query real-time counts from global ants array
    const antsArrayExists = typeof ants !== 'undefined';
    this.updateFromAntsArray();
    
    // Framerate-independent smooth height animation using p5.js deltaTime
    const targetHeight = this.isExpanded ? this.expandedHeight : this.panelHeight;
    const diff = targetHeight - this.currentHeight;
    
    if (Math.abs(diff) > 1) {
      // p5.js deltaTime is in milliseconds, convert to seconds
      const dt = deltaTime / 1000.0;
      const smoothingFactor = 1.0 - Math.pow(1.0 - 0.92, this.animationSpeed * dt);
      this.currentHeight += diff * smoothingFactor;
    } else {
      this.currentHeight = targetHeight;
    }
  }
  
  /**
   * Render population display
   * @param {string} [gameState='PLAYING'] - Current game state
   */
  render(gameState = 'PLAYING') {
    if (gameState !== 'PLAYING') {
      return;
    }
    
    push();
    
    // Draw background panel with border for better visibility
    const alpha = this.isHovering ? this.hoverAlpha : this.backgroundAlpha;
    this.drawPanel(this.x, this.y, this.panelWidth, this.currentHeight, this.backgroundColor, alpha);
    
    // Draw total ant count (always visible)
    let currentY = this.y + this.padding;
    
    fill(255, 255, 255);
    textAlign(LEFT, TOP);
    textSize(this.fontSize);
    
    // Ant icon - use sprite or fallback to emoji
    if (this.antSprite && this.antSprite.width > 0) {
      push();
      imageMode(CORNER);
      image(this.antSprite, this.x + this.padding, currentY, this.iconSize, this.iconSize);
      pop();
    } else {
      textSize(this.iconSize);
      text('🐜', this.x + this.padding, currentY);
    }
    
    // Total count text
    textSize(this.fontSize);
    const totalText = `Total Ants: ${this.currentAnts}/${this.maxAnts}`;
    text(totalText, this.x + this.padding + this.iconSize + 5, currentY + 3);
    
    currentY += this.lineSpacing;
    
    // Draw expand/collapse indicator
    const indicator = this.isExpanded ? '▼' : '▶';
    textSize(12);
    fill(200, 200, 200);
    text(indicator, this.x + this.padding, currentY);
    fill(255, 255, 255);
    textSize(12);
    text('Breakdown', this.x + this.padding + 15, currentY + 2);
    
    currentY += this.lineSpacing;
    
    // Draw breakdown (only if expanded)
    if (this.currentHeight > this.panelHeight + 10) {
      // Calculate fade-in alpha
      const fadeProgress = (this.currentHeight - this.panelHeight) / (this.expandedHeight - this.panelHeight);
      const textAlpha = Math.floor(255 * fadeProgress);
      
      // Draw separator line
      stroke(100, 100, 100, textAlpha);
      strokeWeight(1);
      line(
        this.x + this.padding,
        currentY - 5,
        this.x + this.panelWidth - this.padding,
        currentY - 5
      );
      noStroke();
      
      // Draw each ant type
      this.antTypes.forEach(antType => {
        // Icon - check if sprite is loaded (width > 0)
        if (antType.icon && antType.icon.width > 0) {
          push();
          tint(255, 255, 255, textAlpha);
          imageMode(CORNER);
          image(antType.icon, this.x + this.padding + 10, currentY, this.iconSize - 4, this.iconSize - 4);
          noTint();
          pop();
        } else if (antType.icon) {
          // Sprite is loading, show colored circle placeholder
          push();
          fill(antType.color[0], antType.color[1], antType.color[2], textAlpha);
          noStroke();
          circle(this.x + this.padding + 10 + (this.iconSize - 4) / 2, currentY + (this.iconSize - 4) / 2, (this.iconSize - 4) * 0.7);
          pop();
        } else {
          // No sprite provided, fallback emoji
          fill(255, 255, 255, textAlpha);
          textSize(this.iconSize - 4);
          const fallbackIcon = '🐜';
          text(fallbackIcon, this.x + this.padding + 10, currentY);
        }
        
        // Type name and count
        textSize(this.fontSize - 2);
        fill(antType.color[0], antType.color[1], antType.color[2], textAlpha);
        const typeText = `${antType.type}: ${antType.count}`;
        text(typeText, this.x + this.padding + 35, currentY + 2);
        
        currentY += this.lineSpacing;
      });
    }
    
    pop();
  }
  
  /**
   * Draw UI panel with rounded corners
   * @private
   */
  drawPanel(x, y, w, h, bgColor, alpha) {
    push();
    fill(bgColor[0], bgColor[1], bgColor[2], alpha);
    noStroke();
    rect(x, y, w, h, 8); // 8px corner radius
    pop();
  }
  
  /**
   * Cleanup
   */
  destroy() {
    // Cleanup references
    this.sprites = null;
    this.antSprite = null;
  }
}

// Export for Node.js (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AntCountDisplayComponent;
}

// Export for browser (global)
if (typeof window !== 'undefined') {
  window.AntCountDisplayComponent = AntCountDisplayComponent;
}
